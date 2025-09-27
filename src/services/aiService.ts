import { Question, Answer } from '../context/QuizContext';

// OpenRouter configuration
const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Type guards for API response validation
function isAnswer(answer: any): answer is Answer {
  return (
    typeof answer === 'object' &&
    answer !== null &&
    typeof answer.id === 'string' &&
    typeof answer.text === 'string' &&
    typeof answer.isCorrect === 'boolean'
  );
}

function isQuestion(question: any): question is Omit<Question, 'selectedAnswerId'> {
  return (
    typeof question === 'object' &&
    question !== null &&
    typeof question.id === 'string' &&
    typeof question.text === 'string' &&
    Array.isArray(question.answers) &&
    question.answers.every(isAnswer)
  );
}


const formatQuizPrompt = (topic: string) => `
  Generate a quiz with 5 multiple-choice questions about ${topic}.
  Each question should have 4 possible answers, with exactly one correct answer.
  Format the response as a valid JSON array of objects with this exact structure:
  
  [
    {
      "id": "unique-id-1",
      "text": "The question text",
      "answers": [
        {"id": "a", "text": "Answer 1", "isCorrect": true},
        {"id": "b", "text": "Answer 2", "isCorrect": false},
        {"id": "c", "text": "Answer 3", "isCorrect": false},
        {"id": "d", "text": "Answer 4", "isCorrect": false}
      ]
    }
  ]
  
  Important:
  - Include exactly 5 questions
  - Only one answer per question should be marked as correct
  - Return ONLY the JSON array, no other text
  - Do not include any markdown formatting or code blocks`;

export const generateQuizQuestions = async (topic: string): Promise<Question[]> => {
  let lastError: Error | null = null;
  for (let currentRetry = 0; currentRetry < MAX_RETRIES; currentRetry++) {
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.href,
          'X-Title': 'AI Quiz App',
          'X-API-Key': OPENROUTER_API_KEY
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-preview-09-2025',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful quiz generator that outputs valid JSON.'
            },
            {
              role: 'user',
              content: formatQuizPrompt(topic)
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: { message: 'Failed to parse error response' } };
        }
        throw new Error(`API request failed: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const responseData = await response.json();
      const content = responseData.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content in response');
      }

      // Parse and validate the response
      let jsonContent = content;
      try {
        JSON.parse(content);
      } catch (e) {
        const jsonMatch = content.match(/```(?:json)?\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1];
        }
      }

      const parsedQuestions = JSON.parse(jsonContent);
      
      if (!Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
        throw new Error('No questions found in response');
      }

      // Validate and transform questions
      const validatedQuestions = parsedQuestions.map((q: any, index: number) => {
        if (!isQuestion(q)) {
          // Try to fix common issues
          const fixedQuestion = {
            id: q.id || `q-${index}`,
            text: q.text || q.question || `Question ${index + 1}`,
            answers: (Array.isArray(q.answers) ? q.answers : []).map((a: any, aIndex: number) => ({
              id: a.id || String.fromCharCode(97 + aIndex),
              text: a.text || `Option ${String.fromCharCode(97 + aIndex)}`,
              isCorrect: a.isCorrect === true || a.correct === true
            }))
          };
          
          if (!isQuestion(fixedQuestion)) {
            throw new Error(`Invalid question format at index ${index}`);
          }
          
          return {
            ...fixedQuestion,
            selectedAnswerId: null
          };
        }
        
        return {
          ...q,
          selectedAnswerId: null
        };
      });

      return validatedQuestions;
    } catch (error) {
      console.error(`Attempt ${currentRetry + 1} failed:`, error);
      lastError = error as Error;
      
      if (currentRetry < MAX_RETRIES - 1) {
        console.log(`Retrying... (${currentRetry + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (currentRetry + 2)));
        continue;
      }
      
      throw lastError;
    }
  }
  
  // This line should never be reached due to the throw in the catch block
  throw lastError || new Error('Failed to generate questions after maximum retries');
}

export const generateFeedback = async (score: number, total: number, topic: string): Promise<string> => {
  for (let currentRetry = 0; currentRetry < MAX_RETRIES; currentRetry++) {
    try {
      const prompt = `
      Generate a short, encouraging feedback message for a quiz about ${topic}.
      The user scored ${score} out of ${total}.
      Make it positive and constructive.
      Return only the feedback message with no additional formatting or markdown.
      Keep it under 100 words.
      `;

      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.href,
          'X-Title': 'AI Quiz App',
          'X-API-Key': OPENROUTER_API_KEY
        },
        body: JSON.stringify({
          model: 'google/gemini-pro',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that provides encouraging feedback.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 150
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content in response');
      }
      
      // Clean up the response
      return content.split('\n').map((line: string) => line.trim()).filter(Boolean).join(' ');
    } catch (error) {
      console.error(`Attempt ${currentRetry + 1} failed:`, error);
      if (currentRetry >= MAX_RETRIES - 1) {
        console.error('Max retries reached for feedback generation');
        return 'Thanks for taking the quiz! Keep learning and improving!';
      }
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (currentRetry + 2)));
    }
  }
  
  return 'Thanks for taking the quiz! Keep learning and improving!';
};
