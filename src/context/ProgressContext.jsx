import React, { createContext, useContext, useState, useEffect } from 'react';

const ProgressContext = createContext();

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

export const ProgressProvider = ({ children }) => {
  const [progressData, setProgressData] = useState({
    totalSignsLearned: 0,
    totalSessions: 0,
    totalTimeSpent: 0,
    signCategories: {},
    milestones: [],
    achievements: []
  });

  // Load progress data from localStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem('learningProgress');
    if (savedProgress) {
      setProgressData(JSON.parse(savedProgress));
    }
  }, []);

  // Save progress data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('learningProgress', JSON.stringify(progressData));
  }, [progressData]);

  const updateProgress = (sessionData) => {
    setProgressData(prevData => {
      const newData = { ...prevData };

      // Update total sessions
      newData.totalSessions += 1;

      // Update total time spent
      newData.totalTimeSpent += sessionData.secondsSpent || 0;

      // Update sign categories and count
      sessionData.signsPerformed?.forEach(sign => {
        if (newData.signCategories[sign.SignDetected]) {
          newData.signCategories[sign.SignDetected] += sign.count;
        } else {
          newData.signCategories[sign.SignDetected] = sign.count;
        }
      });

      // Update total signs learned (unique signs)
      newData.totalSignsLearned = Object.keys(newData.signCategories).length;

      // Check for milestones
      checkMilestones(newData);

      return newData;
    });
  };

  const checkMilestones = (data) => {
    const milestones = [];

    // Milestone: First session
    if (data.totalSessions >= 1) {
      milestones.push({
        id: 'first_session',
        title: 'Bắt đầu hành trình',
        description: 'Hoàn thành phiên học đầu tiên',
        achieved: true
      });
    }

    // Milestone: 10 sessions
    if (data.totalSessions >= 10) {
      milestones.push({
        id: 'ten_sessions',
        title: 'Người học chăm chỉ',
        description: 'Hoàn thành 10 phiên học',
        achieved: true
      });
    }

    // Milestone: Learn 5 signs
    if (data.totalSignsLearned >= 5) {
      milestones.push({
        id: 'five_signs',
        title: 'Khởi đầu tốt',
        description: 'Học được 5 ký hiệu',
        achieved: true
      });
    }

    // Milestone: 1 hour total time
    if (data.totalTimeSpent >= 3600) {
      milestones.push({
        id: 'one_hour',
        title: 'Giờ đầu tiên',
        description: 'Dành 1 giờ để học',
        achieved: true
      });
    }

    data.milestones = milestones;
  };

  const getProgressPercentage = (signCategory) => {
    // This could be enhanced with predefined learning goals
    const learnedSigns = Object.keys(progressData.signCategories).length;
    const totalSigns = 26; // Assuming 26 letters A-Z
    return Math.round((learnedSigns / totalSigns) * 100);
  };

  const value = {
    progressData,
    updateProgress,
    getProgressPercentage
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
};
