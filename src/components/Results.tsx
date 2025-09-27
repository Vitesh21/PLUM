import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../context/QuizContext';
import { generateFeedback } from '../services/aiService';
import './Results.css';

const Results: React.FC = () => {
  const navigate = useNavigate();
  const { questions, topic, resetQuiz } = useQuiz();
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const correctAnswers = questions.reduce((count, question) => {
    const selectedAnswer = question.answers.find(a => a.id === question.selectedAnswerId);
    return count + (selectedAnswer?.isCorrect ? 1 : 0);
  }, 0);

  const getScoreMessage = useCallback(() => {
    const percentage = Math.round((correctAnswers / questions.length) * 100);
    if (percentage >= 90) return "Excellent work!";
    if (percentage >= 80) return "Great job!";
    if (percentage >= 70) return "Well done!";
    if (percentage >= 60) return "Good effort!";
    return "Keep practicing!";
  }, [correctAnswers, questions.length]);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const feedback = await generateFeedback(correctAnswers, questions.length, topic);
        setAiFeedback(feedback);
      } catch (error) {
        console.error('Error generating feedback:', error);
        setAiFeedback(getScoreMessage());
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedback();
  }, [topic, questions.length, correctAnswers, getScoreMessage]);

  const percentage = Math.round((correctAnswers / questions.length) * 100);

  const handleRestart = () => {
    resetQuiz();
    navigate('/');
  };


  // Calculate the percentage for the score circle
  const circlePercentage = (correctAnswers / questions.length) * 360;

  return (
    <div className="results-container">
      <div className="results-content">
        <h1>Quiz Results</h1>
        <h2>{topic} Quiz</h2>

        <div className="score-section">
          <div 
            className="score-circle"
            style={{
              '--percentage': `${circlePercentage}deg`,
              '--percentage-display': `${percentage}%`
            } as React.CSSProperties}
          >
            <div className="score-number">{correctAnswers}/{questions.length}</div>
            <div className="score-percentage">{percentage}%</div>
          </div>
          <div className="score-message">
            {isLoading ? (
              <div className="loading-feedback">Generating feedback...</div>
            ) : (
              <div className="ai-feedback">
                <p className="score-summary">{getScoreMessage()}</p>
                <p className="ai-insight">{aiFeedback}</p>
              </div>
            )}
          </div>
      </div>

        <div className="detailed-results">
          <h3>Question Breakdown:</h3>
          {questions.map((question, index) => {
            const selectedAnswer = question.answers.find(a => a.id === question.selectedAnswerId);
            const isCorrect = selectedAnswer?.isCorrect || false;

            return (
              <div key={question.id} className={`question-result ${isCorrect ? 'correct' : 'incorrect'}`}>
                <div className="question-number">Question {index + 1}</div>
                <div className="question-text">{question.text}</div>
                <div className="answer-result">
                  <span className="your-answer">
                    Your answer: {selectedAnswer?.text || 'Not answered'}
                  </span>
                  {!isCorrect && (
                    <span className="correct-answer">
                      Correct answer: {question.answers.find(a => a.isCorrect)?.text}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="action-buttons">
          <button className="restart-button" onClick={handleRestart}>
            Take Another Quiz
          </button>
          <button className="home-button" onClick={() => navigate('/')}>
            Back to Topics
          </button>
        </div>
      </div>
    </div>
  );
};

export default Results;
