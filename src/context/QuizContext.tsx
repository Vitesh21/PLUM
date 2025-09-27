import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { NavigateFunction } from 'react-router-dom';

export interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  text: string;
  answers: Answer[];
  selectedAnswerId: string | null;
}

interface QuizContextType {
  // State
  topic: string;
  questions: Question[];
  currentQuestionIndex: number;
  
  // Actions
  setTopic: (topic: string) => void;
  setQuestions: (questions: Question[]) => void;
  setCurrentQuestionIndex: (index: number) => void;
  selectAnswer: (questionId: string, answerId: string) => void;
  resetQuiz: () => void;
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
  submitQuiz: (navigateFn?: NavigateFunction) => Promise<void>;
  getScore: () => number;
  setNavigate: (navigate: NavigateFunction) => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export const QuizProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [topic, setTopic] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [navigate, setNavigate] = useState<NavigateFunction | null>(null);

  const selectAnswer = (questionId: string, answerId: string) => {
    setQuestions(prevQuestions =>
      prevQuestions.map(question =>
        question.id === questionId
          ? { ...question, selectedAnswerId: answerId }
          : question
      )
    );
  };

  const goToNextQuestion = () => {
    setCurrentQuestionIndex(prev => Math.min(prev + 1, questions.length - 1));
  };

  const goToPreviousQuestion = () => {
    setCurrentQuestionIndex(prev => Math.max(prev - 1, 0));
  };

  const submitQuiz = useCallback(async (navigateFn?: NavigateFunction): Promise<void> => {
    try {
      // This is where you would typically submit results to a server
      console.log('Quiz submitted!');
      // Navigate to results page after a short delay to allow for any processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use the provided navigate function or the one from state
      const nav = navigateFn || navigate;
      if (nav) {
        nav('/results');
      } else {
        console.warn('No navigation function available, using window.location');
        // Fallback to window.location if navigation is not available
        window.location.href = '/results';
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      throw error;
    }
  }, [navigate]);
  
  // Set up the navigation function in the context
  const setNavigateFn = useCallback((navFn: NavigateFunction) => {
    setNavigate(navFn);
  }, []);

  const getScore = (): number => {
    return questions.reduce((score, question) => {
      const selectedAnswer = question.answers.find(a => a.id === question.selectedAnswerId);
      return score + (selectedAnswer?.isCorrect ? 1 : 0);
    }, 0);
  };

  const resetQuiz = () => {
    setTopic('');
    setQuestions([]);
    setCurrentQuestionIndex(0);
  };

  const contextValue = useMemo(() => ({
    topic,
    questions,
    currentQuestionIndex,
    setTopic,
    setQuestions,
    setCurrentQuestionIndex,
    selectAnswer,
    resetQuiz,
    goToNextQuestion,
    goToPreviousQuestion,
    submitQuiz,
    getScore,
    setNavigate: setNavigateFn,
  }), [
    topic,
    questions,
    currentQuestionIndex,
    submitQuiz,
    getScore,
    setNavigateFn
  ]);

  return (
    <QuizContext.Provider value={contextValue}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};
