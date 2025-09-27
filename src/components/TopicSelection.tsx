import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateQuizQuestions } from '../services/aiService';
import { useQuiz } from '../context/QuizContext';
// Using emojis instead of react-icons for better compatibility
import './TopicSelection.css';

const TOPICS = [
  { id: 'wellness', name: 'Wellness', icon: '🌿' },
  { id: 'technology', name: 'Technology', icon: '💻' },
  { id: 'science', name: 'Science', icon: '🔬' },
  { id: 'history', name: 'History', icon: '📜' },
  { id: 'geography', name: 'Geography', icon: '🌎' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
  { id: 'literature', name: 'Literature', icon: '📚' },
  { id: 'art', name: 'Art', icon: '🎨' },
  { id: 'music', name: 'Music', icon: '🎵' }
];

const TopicSelection: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const { setTopic, setQuestions, setCurrentQuestionIndex } = useQuiz();

  const handleTopicSelect = async (topicId: string) => {
    if (loading) return;
    
    try {
      setLoading(true);
      setSelectedTopic(topicId);
      setError('');
      
      const topicName = TOPICS.find(t => t.id === topicId)?.name || topicId;
      setTopic(topicName);

      // Generate quiz questions using AI
      const generatedQuestions = await generateQuizQuestions(topicName);
      setQuestions(generatedQuestions);
      setCurrentQuestionIndex(0);

      // Add a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Navigate to the quiz screen
      navigate('/quiz');
    } catch (error) {
      console.error('Error generating quiz:', error);
      setError('Failed to generate quiz questions. Please try again.');
      setSelectedTopic(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="topic-selection">
      <div className="container">
        <header className="topic-header">
          <h1>Choose Your Quiz Topic</h1>
          <p className="subtitle">Select a topic that interests you and test your knowledge</p>
        </header>
        <p>Choose a topic to generate your personalized quiz:</p>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}
        
        <div className="topics-grid">
          {TOPICS.map((topic) => {
            const isSelected = selectedTopic === topic.id;
            const isLoading = loading && isSelected;
            
            return (
              <div 
                key={topic.id}
                className={`topic-card ${isSelected ? 'selected' : ''} ${loading ? 'loading' : ''}`}
                onClick={() => !loading && handleTopicSelect(topic.id)}
              >
                <div className="topic-icon">{topic.icon}</div>
                <h3 className="topic-name">{topic.name}</h3>
                {isLoading && (
                  <div className="topic-loading">
                    <span className="spin">⏳</span>
                    <span>Generating...</span>
                  </div>
                )}
                {!isLoading && isSelected && (
                  <div className="topic-selected">
                    <span>✅</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="loading-overlay" style={{ display: loading ? 'flex' : 'none' }}>
          <div className="loading-spinner">
            <span className="spin">⏳</span>
            <p>Preparing your quiz...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicSelection;
