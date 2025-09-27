import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../context/QuizContext';
import QuestionCard from './QuestionCard';
import './Quiz.css';

const Quiz: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    questions,
    currentQuestionIndex,
    goToNextQuestion,
    goToPreviousQuestion,
    selectAnswer,
    submitQuiz,
    getScore,
    setNavigate
  } = useQuiz();

  // Set up navigation in the context
  useEffect(() => {
    setNavigate(navigate);
  }, [navigate, setNavigate]);

  // Check for empty questions and redirect if needed
  useEffect(() => {
    if (questions.length === 0) {
      navigate('/');
    }
  }, [questions, navigate]);

  // Memoize derived values
  const { currentQuestion, isLastQuestion, progressPercentage, totalQuestions } = useMemo(() => {
    if (questions.length === 0) {
      return {
        currentQuestion: null,
        isLastQuestion: false,
        progressPercentage: 0,
        totalQuestions: 0
      };
    }
    return {
      currentQuestion: questions[currentQuestionIndex],
      isLastQuestion: currentQuestionIndex === questions.length - 1,
      progressPercentage: ((currentQuestionIndex + 1) / questions.length) * 100,
      totalQuestions: questions.length
    };
  }, [questions, currentQuestionIndex]);

  // Memoize handlers
  const handleAnswerSelect = useCallback((answerId: string) => {
    if (currentQuestion) {
      selectAnswer(currentQuestion.id, answerId);
    }
  }, [currentQuestion, selectAnswer]);

  const handlePrevious = useCallback(() => {
    goToPreviousQuestion();
  }, [goToPreviousQuestion]);

  const handleSubmit = useCallback(async () => {
    try {
      setIsSubmitting(true);
      await submitQuiz(navigate);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit the quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [submitQuiz, navigate]);

  // Show loading state if no questions are available yet
  if (questions.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your quiz questions...</p>
        <button 
          onClick={() => navigate('/')} 
          className="nav-button"
          style={{ marginTop: '2rem' }}
        >
          Back to Topics
        </button>
      </div>
    );
  }


  if (!currentQuestion) {
    return null; // This should not happen due to the earlier check, but TypeScript needs it
  }

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <h1>Quiz</h1>
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercentage}%` }}
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
            ></div>
          </div>
          <div className="progress-text">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </div>
        </div>
      </div>

      <div className="question-container">
        <QuestionCard
          question={currentQuestion}
          onSelectAnswer={handleAnswerSelect}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={totalQuestions}
        />
      </div>

      <div className="navigation-buttons">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0 || isSubmitting}
          className="nav-button prev-button"
        >
          ← Previous
        </button>
        {isLastQuestion ? (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`nav-button next-button submit-button ${isSubmitting ? 'submitting' : ''}`}
          >
            {isSubmitting ? (
              <>
                <span className="button-spinner"></span>
                Submitting...
              </>
            ) : (
              'Submit Quiz ✅'
            )}
          </button>
        ) : (
          <button
            onClick={goToNextQuestion}
            disabled={isSubmitting}
            className="nav-button next-button"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
};

export default Quiz;
