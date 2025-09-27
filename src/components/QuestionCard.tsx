import React from 'react';
import { Question, Answer } from '../context/QuizContext';
import './QuestionCard.css';

interface QuestionCardProps {
  question: Question;
  onSelectAnswer?: (answerId: string) => void;
  showResults?: boolean;
  questionNumber?: number;
  totalQuestions?: number;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onSelectAnswer,
  showResults = false,
  questionNumber,
  totalQuestions
}) => {
  const handleAnswerSelect = (answerId: string) => {
    if (!showResults && onSelectAnswer) {
      onSelectAnswer(answerId);
    }
  };

  const getAnswerClass = (answer: Answer) => {
    if (!showResults) {
      return question.selectedAnswerId === answer.id ? 'selected' : '';
    }
    
    if (answer.isCorrect) {
      return 'correct-answer';
    }
    if (question.selectedAnswerId === answer.id && !answer.isCorrect) {
      return 'incorrect-answer';
    }
    return '';
  };

  return (
    <div className="question-card">
      {questionNumber && totalQuestions && (
        <div className="question-progress">
          Question {questionNumber} of {totalQuestions}
        </div>
      )}
      <h3 className="question-text">{question.text}</h3>
      <div className="answers-container">
        {question.answers.map((answer) => (
          <button
            key={answer.id}
            className={`answer-button ${getAnswerClass(answer)}`}
            onClick={() => handleAnswerSelect(answer.id)}
            disabled={showResults}
            aria-pressed={question.selectedAnswerId === answer.id}
          >
            <span className="answer-letter">{answer.id.toUpperCase()}</span>
            <span className="answer-text">{answer.text}</span>
            {showResults && answer.isCorrect && (
              <span className="answer-feedback">✓ Correct</span>
            )}
            {showResults && 
             question.selectedAnswerId === answer.id && 
             !answer.isCorrect && (
              <span className="answer-feedback">✗ Incorrect</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuestionCard;
