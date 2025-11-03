import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Question, UserAnswers } from '../types';
import { ClockIcon, FlagIcon, ChevronDownIcon, EyeIcon, EyeSlashIcon } from './IconComponents';

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
  const [isFlaggedDropdownOpen, setIsFlaggedDropdownOpen] = useState<boolean>(false);
  const [isAnswerVisible, setIsAnswerVisible] = useState<boolean>(false);
  
  const flaggedDropdownRef = useRef<HTMLDivElement>(null);
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

  // Reset state when the question changes
  useEffect(() => {
    if (!isLastQuestion && confirmingSubmit) {
      setConfirmingSubmit(false);
    }
    // Hide the suggested answer when navigating to a new question
    setIsAnswerVisible(false);
  }, [currentIndex, isLastQuestion, confirmingSubmit]);
  
  // Effect to close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (flaggedDropdownRef.current && !flaggedDropdownRef.current.contains(event.target as Node)) {
            setIsFlaggedDropdownOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
  
  const goToQuestion = useCallback((questionNo: number) => {
    const questionIndex = questions.findIndex(q => q.No === questionNo);
    if (questionIndex !== -1) {
        setCurrentIndex(questionIndex);
        setIsFlaggedDropdownOpen(false); // Close dropdown on selection
    }
  }, [questions]);

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
      <header className="mb-6">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-y-3">
          <div className='text-sm text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center sm:gap-4'>
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span className="font-semibold hidden sm:block">•</span>
            <span className="font-semibold">{currentQuestion.subject}</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Flagged Questions Dropdown */}
            <div className="relative" ref={flaggedDropdownRef}>
              <button
                  onClick={() => setIsFlaggedDropdownOpen(prev => !prev)}
                  disabled={flaggedQuestions.size === 0}
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:dark:bg-slate-700 disabled:text-slate-400"
                  aria-haspopup="true"
                  aria-expanded={isFlaggedDropdownOpen}
              >
                  <FlagIcon className="w-5 h-5" />
                  <span className="font-bold">{flaggedQuestions.size} Flagged</span>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform ${isFlaggedDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isFlaggedDropdownOpen && flaggedQuestions.size > 0 && (
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md shadow-lg z-20 animate-fade-in origin-top-right">
                      <ul className="py-1 max-h-60 overflow-y-auto">
                          {Array.from(flaggedQuestions).sort((a, b) => a - b).map(qNo => {
                              const question = questions.find(q => q.No === qNo);
                              return (
                                  <li key={qNo}>
                                      <button
                                          onClick={() => goToQuestion(qNo)}
                                          className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"
                                      >
                                          <span className="font-bold">Q{qNo}:</span> {question?.Question.substring(0, 40)}...
                                      </button>
                                  </li>
                              );
                          })}
                      </ul>
                  </div>
              )}
            </div>
            {/* Timer */}
            <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors ${
              isTimeLow 
              ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-300 animate-pulse-warning' 
              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              <ClockIcon className="w-6 h-6" />
              <span className="text-lg font-bold tabular-nums tracking-wider">{formatTime(timeRemaining)}</span>
            </div>
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
      </header>
      
      <main className="flex-grow flex flex-col">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">{currentQuestion.Question}</h2>
        <textarea
          value={userAnswers[currentQuestion.No] || ''}
          onChange={handleAnswerChange}
          placeholder="Type your answer here..."
          className="w-full h-48 md:h-64 p-4 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition bg-slate-50 dark:bg-slate-700 text-lg"
        />
         {/* Bottom panel for showing the answer */}
         <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
            <div className="flex items-center">
              <button
                onClick={() => setIsAnswerVisible(prev => !prev)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600"
              >
                {isAnswerVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                <span>{isAnswerVisible ? 'Hide Suggested Answer' : 'Show Suggested Answer'}</span>
              </button>
            </div>

            {isAnswerVisible && (
              <div className="mt-4 animate-fade-in">
                <label htmlFor="suggested-answer" className="font-semibold text-sm text-slate-600 dark:text-slate-400">
                  Suggested Answer:
                </label>
                <textarea
                  id="suggested-answer"
                  readOnly
                  value={currentQuestion.Answer}
                  className="w-full h-32 mt-1 p-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-slate-100 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 cursor-default"
                />
              </div>
            )}
        </div>
      </main>

      <footer className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
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
              className="w-full sm:w-auto px-8 py-3 bg-brand-primary hover:opacity-80 text-white font-bold rounded-lg transition-transform transform hover:scale-105"
            >
              Next
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default ExamView;
