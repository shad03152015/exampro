import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Question, UserAnswers } from '../types';
import { ClockIcon, FlagIcon } from './IconComponents';

interface ExamViewProps {
  questions: Question[];
  onFinish: (answers: UserAnswers) => void;
}

const TIME_PER_QUESTION_SECONDS = 120; // 2 minutes per question

const formatTime = (seconds: number): string => {
    if (seconds < 0) seconds = 0;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const ExamView: React.FC<ExamViewProps> = ({ questions, onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [timeRemaining, setTimeRemaining] = useState(questions.length * TIME_PER_QUESTION_SECONDS);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [confirmingSubmit, setConfirmingSubmit] = useState<boolean>(false);

  const currentQuestion = useMemo(() => questions[currentIndex], [questions, currentIndex]);
  const isLastQuestion = currentIndex === questions.length - 1;
  
  const handleSubmit = useCallback(() => {
    onFinish(userAnswers);
  }, [onFinish, userAnswers]);

  // Timer countdown effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-submit effect when timer runs out
  useEffect(() => {
    if (timeRemaining === 0) {
      handleSubmit();
    }
  }, [timeRemaining, handleSubmit]);

  // Reset submit confirmation if user navigates away from the last question
  useEffect(() => {
    if (!isLastQuestion && confirmingSubmit) {
      setConfirmingSubmit(false);
    }
  }, [isLastQuestion, confirmingSubmit]);


  const handleAnswerChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.No]: e.target.value,
    }));
  }, [currentQuestion]);

  const goToNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, questions.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);
  
  const toggleFlag = useCallback(() => {
    setFlaggedQuestions(prev => {
        const newSet = new Set(prev);
        if (newSet.has(currentQuestion.No)) {
            newSet.delete(currentQuestion.No);
        } else {
            newSet.add(currentQuestion.No);
        }
        return newSet;
    });
  }, [currentQuestion.No]);

  const handleSubmitClick = () => {
    if (flaggedQuestions.size > 0 && !confirmingSubmit) {
        setConfirmingSubmit(true);
        return;
    }
    handleSubmit();
  };

  const isTimeLow = timeRemaining <= 60;
  const isCurrentQuestionFlagged = flaggedQuestions.has(currentQuestion.No);

  return (
    <div className="w-full lg:w-[90%] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 md:p-10 flex flex-col animate-slide-in-up">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className='text-sm text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center sm:gap-4'>
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span className="font-semibold hidden sm:block">•</span>
            <span className="font-semibold">{currentQuestion.subject}</span>
          </div>
          <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors ${
              isTimeLow 
              ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-300 animate-pulse-warning' 
              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}>
            <ClockIcon className="w-6 h-6" />
            <span className="text-lg font-bold tabular-nums tracking-wider">{formatTime(timeRemaining)}</span>
          </div>
        </div>
        
        <div className="flex w-full gap-1.5 h-3" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={questions.length}>
            {questions.map((question, index) => {
                const isCurrent = index === currentIndex;
                const hasAnswer = userAnswers[question.No] && userAnswers[question.No].trim() !== '';
                const isFlagged = flaggedQuestions.has(question.No);
                
                let segmentClass = '';
                if (isCurrent) {
                    segmentClass = 'bg-indigo-400 dark:bg-indigo-500 scale-110';
                } else if (isFlagged) {
                    segmentClass = 'bg-amber-400 dark:bg-amber-500';
                } else if (hasAnswer) {
                    segmentClass = 'bg-brand-primary';
                } else {
                    segmentClass = 'bg-slate-200 dark:bg-slate-700';
                }

                return (
                <div 
                    key={question.No} 
                    className={`flex-1 rounded-full transition-all duration-300 ease-in-out ${segmentClass}`}
                    title={`Question ${index + 1}${hasAnswer ? ' (Answered)' : ''}${isFlagged ? ' (Flagged)' : ''}`}
                ></div>
                );
            })}
        </div>
      </div>
      
      <div className="flex-grow">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">{currentQuestion.Question}</h2>
        <textarea
          value={userAnswers[currentQuestion.No] || ''}
          onChange={handleAnswerChange}
          placeholder="Type your answer here..."
          className="w-full h-48 md:h-64 p-4 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition bg-slate-50 dark:bg-slate-700 text-lg"
        />
      </div>

      <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="w-full sm:w-auto px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed order-1"
        >
          Previous
        </button>

        <button
          onClick={toggleFlag}
          className={`w-full sm:w-auto px-6 py-3 font-semibold rounded-lg transition flex items-center justify-center gap-2 order-2 sm:order-none ${
            isCurrentQuestionFlagged
              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-900'
              : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
          }`}
        >
          <FlagIcon className="w-5 h-5" />
          <span>{isCurrentQuestionFlagged ? 'Flagged' : 'Flag'}</span>
        </button>

        <div className="w-full sm:w-auto order-3">
          {isLastQuestion ? (
            <div className="flex flex-col items-stretch sm:items-end">
              {confirmingSubmit && (
                  <p className="text-amber-600 dark:text-amber-400 text-sm mb-2 text-center sm:text-right animate-fade-in">
                      You have {flaggedQuestions.size} flagged question(s). Submit anyway?
                  </p>
              )}
              <button
                onClick={handleSubmitClick}
                className="px-8 py-3 bg-brand-secondary hover:bg-emerald-600 text-white font-bold rounded-lg transition-transform transform hover:scale-105 shadow-lg"
              >
                {confirmingSubmit ? 'Confirm & Submit' : 'Submit Exam'}
              </button>
            </div>
          ) : (
            <button
              onClick={goToNext}
              className="w-full sm:w-auto px-8 py-3 bg-brand-primary hover:bg-indigo-700 text-white font-bold rounded-lg transition-transform transform hover:scale-105"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamView;