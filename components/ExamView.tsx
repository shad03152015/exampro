import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Question, UserAnswers } from '../types';
import { HourglassIcon, FlagIcon, ChevronDownIcon, EyeIcon, EyeSlashIcon, MicrophoneIcon } from './IconComponents';

interface ExamViewProps {
  questions: Question[];
  onFinish: (answers: UserAnswers) => void;
}

// FIX: Add detailed type definitions for SpeechRecognition API to resolve TypeScript errors.
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  stop: () => void;
  start: () => void;
}

const AUTOSAVE_KEY = 'examPractice2026InProgressAnswers';
const EXAM_DURATION_SECONDS = 4800; // 1 hour and 20 minutes

const formatTime = (seconds: number): string => {
    if (seconds < 0) seconds = 0;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const ExamView: React.FC<ExamViewProps> = ({ questions, onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [timeRemaining, setTimeRemaining] = useState(EXAM_DURATION_SECONDS);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [confirmingSubmit, setConfirmingSubmit] = useState<boolean>(false);
  const [isFlaggedDropdownOpen, setIsFlaggedDropdownOpen] = useState<boolean>(false);
  const [isAnswerVisible, setIsAnswerVisible] = useState<boolean>(false);

  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  const flaggedDropdownRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answersRef = useRef(userAnswers); // Ref for auto-save

  const handleSubmit = useCallback(() => {
    localStorage.removeItem(AUTOSAVE_KEY); // Clean up on final submission
    onFinish(userAnswers);
  }, [onFinish, userAnswers]);

  // Keep answers ref updated for the interval closure
  useEffect(() => {
    answersRef.current = userAnswers;
  }, [userAnswers]);

  // Load answers on mount and set up auto-save interval
  useEffect(() => {
    // Load any previously auto-saved answers
    try {
      const savedAnswersRaw = localStorage.getItem(AUTOSAVE_KEY);
      if (savedAnswersRaw) {
        const savedAnswers = JSON.parse(savedAnswersRaw);
        // Basic validation: ensure it's an object and not null
        if (typeof savedAnswers === 'object' && savedAnswers !== null) {
          setUserAnswers(savedAnswers);
        }
      }
    } catch (error) {
      console.error("Failed to load auto-saved answers:", error);
      // If parsing fails, the data is likely corrupt, so remove it.
      localStorage.removeItem(AUTOSAVE_KEY);
    }

    // Set up auto-save timer
    const autoSaveTimer = setInterval(() => {
      // Use the ref to access the latest state without creating a dependency
      if (Object.keys(answersRef.current).length > 0) {
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(answersRef.current));
      }
    }, 60000); // Auto-save every 1 minute

    // Clean up interval on component unmount
    return () => {
      clearInterval(autoSaveTimer);
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Timer countdown effect
   useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeRemaining(prevTime => {
        if (prevTime <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [handleSubmit]);
  
  const totalDuration = EXAM_DURATION_SECONDS;
  const timeProgress = (timeRemaining / totalDuration) * 100;
  
  const progressBarColor = useMemo(() => {
      if (timeProgress < 10) return 'bg-red-600 animate-pulse';
      if (timeProgress < 25) return 'bg-amber-500';
      return 'bg-brand-primary';
  }, [timeProgress]);


  // Handle Freeform (No Questions) Exam Mode
  if (questions.length === 0) {
    const handleFreeformAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setUserAnswers({ 0: e.target.value }); // Use a single key for the answer
    };
    const isTimeLow = timeRemaining <= 60;

    return (
      <div className="glass-panel w-full flex-grow p-4 sm:p-6 md:p-8 flex flex-col animate-slide-in-up">
        <header className="mb-4 md:mb-6">
          <div className="flex justify-between items-start">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-200 mt-2">Freeform Exam</h2>
            <div className="flex flex-col items-end">
              <div className={`flex items-center gap-3 rounded-xl px-4 py-2 transition-all duration-300 border shadow-lg shadow-black/30 ring-1 ring-inset ring-white/10 backdrop-blur-sm ${
                isTimeLow
                ? 'bg-red-900/30 text-red-200 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse-warning'
                : 'bg-slate-800/50 text-slate-200 border-slate-700 shadow-[0_0_10px_rgba(var(--brand-primary-rgb),0.4)]'
              }`}>
                <HourglassIcon className="w-6 h-6 animate-spin-slow" />
                <span className="text-xl font-bold tabular-nums tracking-wider">{formatTime(timeRemaining)}</span>
              </div>
              <div className="w-48 h-2 bg-slate-700/50 rounded-full mt-2 overflow-hidden border border-slate-600/50">
                  <div
                      className={`h-full rounded-full transition-[width] duration-500 ${progressBarColor}`}
                      style={{ width: `${timeProgress}%` }}
                      role="progressbar"
                      aria-valuenow={timeRemaining}
                      aria-valuemin={0}
                      aria-valuemax={totalDuration}
                      aria-label="Time remaining"
                  ></div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-grow flex flex-col min-h-0 mt-4">
          <h2 className="text-lg font-bold mb-2 text-slate-100 flex-shrink-0">General Essay</h2>
          <p className="text-slate-400 mb-4">There are no specific questions for this session. Please write your response in the text area below.</p>
          <div className="relative w-full h-[279px]">
            <textarea
              value={userAnswers[0] || ''}
              onChange={handleFreeformAnswerChange}
              placeholder="Compose your answer..."
              className="w-full h-full p-4 border border-slate-600/80 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition bg-slate-800/50 text-lg text-slate-200 placeholder-slate-500"
            />
          </div>
        </main>
        <footer className="mt-6 md:mt-8 flex justify-end items-center">
          <button
            onClick={handleSubmit}
            className="px-8 py-3 bg-emerald-500 hover:opacity-80 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-[0_0_15px_rgba(16,185,129,0.5)] hover:shadow-[0_0_25px_rgba(16,185,129,0.7)]"
          >
            Submit Exam
          </button>
        </footer>
      </div>
    );
  }

  const currentQuestion = useMemo(() => questions[currentIndex], [questions, currentIndex]);
  const isLastQuestion = currentIndex === questions.length - 1;

  // Speech Recognition Effect
  useEffect(() => {
    // FIX: Cast window to any to access SpeechRecognition API which may not be in default types.
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      const recognition: SpeechRecognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setUserAnswers(prev => {
            const existingAnswer = prev[currentQuestion.No] || '';
            const separator = existingAnswer.length > 0 && !/\s$/.test(existingAnswer) ? ' ' : '';
            return {
              ...prev,
              [currentQuestion.No]: existingAnswer + separator + finalTranscript.trim()
            };
          });
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
    return () => {
      recognitionRef.current?.stop();
    };
  }, [currentQuestion.No]);


  useEffect(() => {
    if (!isLastQuestion && confirmingSubmit) setConfirmingSubmit(false);
    setIsAnswerVisible(false);
  }, [currentIndex, isLastQuestion, confirmingSubmit]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (flaggedDropdownRef.current && !flaggedDropdownRef.current.contains(event.target as Node)) {
        setIsFlaggedDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };
  
  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserAnswers(prev => ({ ...prev, [currentQuestion.No]: e.target.value }));
  };

  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserAnswers(prev => ({ ...prev, [currentQuestion.No]: e.target.value }));
  };

  const goToNext = useCallback(() => {
    if (currentIndex < questions.length - 1) setCurrentIndex(prev => prev + 1);
  }, [currentIndex, questions.length]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  }, [currentIndex]);
  
  const goToQuestion = (questionNo: number) => {
    const questionIndex = questions.findIndex(q => q.No === questionNo);
    if (questionIndex !== -1) {
      setCurrentIndex(questionIndex);
      setIsFlaggedDropdownOpen(false);
    }
  };

  const toggleFlag = useCallback(() => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion.No)) newSet.delete(currentQuestion.No);
      else newSet.add(currentQuestion.No);
      return newSet;
    });
  }, [currentQuestion.No]);

  const handleSubmitClick = useCallback(() => {
    if (flaggedQuestions.size > 0 && !confirmingSubmit) {
      setConfirmingSubmit(true);
      return;
    }
    handleSubmit();
  }, [flaggedQuestions.size, confirmingSubmit, handleSubmit]);

  // Keyboard shortcuts effect
  useEffect(() => {
    // Do not enable shortcuts for freeform exam mode
    if (questions.length === 0) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      // Ignore shortcuts if user is typing in a text area or input field.
      const isTyping = target.tagName === 'TEXTAREA' || target.tagName === 'INPUT';

      // Allow Ctrl+Enter for submission even when typing.
      if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault(); // Prevent default action (e.g., new line).
        if (isLastQuestion) {
          handleSubmitClick();
        }
        return;
      }

      // If typing, ignore other single-key or arrow key shortcuts.
      if (isTyping) {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNext();
          break;
        case 'f':
        case 'F':
          event.preventDefault();
          toggleFlag();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [questions.length, isLastQuestion, goToPrevious, goToNext, toggleFlag, handleSubmitClick]);

  const isTimeLow = timeRemaining <= 60;
  const isCurrentQuestionFlagged = flaggedQuestions.has(currentQuestion.No);

  return (
    <div className="glass-panel w-full flex-grow p-4 sm:p-6 md:p-8 flex flex-col animate-slide-in-up">
      <header className="mb-4 md:mb-6">
        <div className="flex flex-col md:flex-row justify-between md:items-start mb-4 gap-4">
          <div className='text-sm text-slate-400 flex flex-col sm:flex-row sm:items-center sm:gap-4 mt-2'>
            <span className="whitespace-nowrap">Question {currentIndex + 1} of {questions.length}</span>
            <span className="font-semibold hidden sm:block text-slate-600">•</span>
            <span className="font-semibold text-slate-300">{currentQuestion.subject}</span>
          </div>
          <div className="flex items-start gap-2 sm:gap-4 self-end md:self-center">
            <div className="relative pt-2" ref={flaggedDropdownRef}>
              <button
                  onClick={() => setIsFlaggedDropdownOpen(prev => !prev)}
                  disabled={flaggedQuestions.size === 0}
                  className="select-embossed flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-800/50 disabled:border-slate-700 disabled:text-slate-500 disabled:shadow-none"
                  aria-haspopup="true" aria-expanded={isFlaggedDropdownOpen}
              >
                  <FlagIcon className="w-5 h-5" />
                  <span className="font-bold hidden sm:inline">{flaggedQuestions.size} Flagged</span>
                   <span className="font-bold sm:hidden">{flaggedQuestions.size}</span>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform ${isFlaggedDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isFlaggedDropdownOpen && flaggedQuestions.size > 0 && (
                  <div className="glass-panel glass-panel-popover absolute right-0 mt-2 w-72 rounded-md shadow-lg z-20 animate-fade-in origin-top-right">
                      <ul className="py-1 max-h-60 overflow-y-auto">
                          {Array.from(flaggedQuestions).sort((a, b) => a - b).map(qNo => {
                              const question = questions.find(q => q.No === qNo);
                              return (
                                  <li key={qNo}>
                                      <button onClick={() => goToQuestion(qNo)} className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700/50">
                                          <span className="font-bold text-brand-primary">Q{question?.No}:</span> {question?.Question.substring(0, 40)}...
                                      </button>
                                  </li>
                              );
                          })}
                      </ul>
                  </div>
              )}
            </div>
            <div className="flex flex-col items-end">
                <div className={`flex items-center gap-3 rounded-xl px-4 py-2 transition-all duration-300 border shadow-lg shadow-black/30 ring-1 ring-inset ring-white/10 backdrop-blur-sm ${
                isTimeLow
                ? 'bg-red-900/30 text-red-200 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse-warning'
                : 'bg-slate-800/50 text-slate-200 border-slate-700 shadow-[0_0_10px_rgba(var(--brand-primary-rgb),0.4)]'
                }`}>
                <HourglassIcon className="w-6 h-6 animate-spin-slow" />
                <span className="text-xl font-bold tabular-nums tracking-wider">{formatTime(timeRemaining)}</span>
                </div>
                <div className="w-48 h-2 bg-slate-700/50 rounded-full mt-2 overflow-hidden border border-slate-600/50">
                    <div
                        className={`h-full rounded-full transition-[width] duration-500 ${progressBarColor}`}
                        style={{ width: `${timeProgress}%` }}
                        role="progressbar"
                        aria-valuenow={timeRemaining}
                        aria-valuemin={0}
                        aria-valuemax={totalDuration}
                        aria-label="Time remaining"
                    ></div>
                </div>
            </div>
          </div>
        </div>
        
        <div className="flex w-full gap-1.5 h-2.5" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={questions.length}>
            {questions.map((question, index) => {
                const isCurrent = index === currentIndex;
                const hasAnswer = userAnswers[question.No] && userAnswers[question.No].trim() !== '';
                const isFlagged = flaggedQuestions.has(question.No);
                
                let segmentClass = 'bg-slate-700';
                if (isCurrent) segmentClass = 'bg-brand-primary scale-110 shadow-glow-primary';
                else if (isFlagged) segmentClass = 'bg-amber-500';
                else if (hasAnswer) segmentClass = 'bg-brand-primary/60';

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
      
      <main className="flex-grow flex flex-col min-h-0">
        <h2 className="text-lg font-bold mb-4 text-slate-100 flex-shrink-0">{currentQuestion.Question}</h2>
        
        {currentQuestion.Options && currentQuestion.Options.length > 0 ? (
          <div className="space-y-3 h-[279px] overflow-y-auto pr-2">
            {currentQuestion.Options.map((option, index) => (
              <label
                key={index}
                className={`flex items-start p-4 border rounded-lg transition cursor-pointer ${
                  userAnswers[currentQuestion.No] === option
                    ? 'bg-brand-primary/20 border-brand-primary'
                    : 'border-slate-600/80 bg-slate-800/50 hover:bg-slate-700/50'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion.No}`}
                  value={option}
                  checked={userAnswers[currentQuestion.No] === option}
                  onChange={handleOptionChange}
                  className="w-5 h-5 mt-1 text-brand-primary bg-slate-700 border-slate-500 focus:ring-brand-primary focus:ring-2 flex-shrink-0"
                />
                <span className="ml-4 text-slate-200 text-lg">
                  {String.fromCharCode(97 + index)}. {option}
                </span>
              </label>
            ))}
          </div>
        ) : (
          <div className="relative w-full h-[279px]">
            <textarea
              value={userAnswers[currentQuestion.No] || ''}
              onChange={handleAnswerChange}
              placeholder="Compose your answer or use the microphone..."
              className="w-full h-full p-4 pr-16 border border-slate-600/80 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition bg-slate-800/50 text-lg text-slate-200 placeholder-slate-500"
            />
            {isSpeechSupported && (
              <button
                onClick={handleToggleListening}
                className={`absolute top-4 right-4 p-3 rounded-full transition-all duration-300 backdrop-blur-sm
                  ${isListening
                    ? 'bg-red-500/50 text-red-200 ring-2 ring-red-400 shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
              >
                <MicrophoneIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

         <div className="mt-4 border-t border-slate-700/80 pt-4 flex-shrink-0">
            <div className="flex items-center">
              <button
                onClick={() => setIsAnswerVisible(prev => !prev)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition bg-slate-700/50 border border-slate-600 hover:bg-slate-700 text-slate-300"
              >
                {isAnswerVisible ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                <span>{isAnswerVisible ? 'Hide Suggested Answer' : 'Show Suggested Answer'}</span>
              </button>
            </div>

            {isAnswerVisible && (
              <div className="mt-4 animate-fade-in">
                <label htmlFor="suggested-answer" className="font-semibold text-sm text-slate-400">
                  Suggested Answer:
                </label>
                <textarea
                  id="suggested-answer" readOnly value={currentQuestion.Answer}
                  className="w-full h-32 mt-1 p-3 border border-slate-700 rounded-lg bg-slate-900/50 text-slate-300 cursor-default"
                />
              </div>
            )}
        </div>
      </main>

      <footer className="mt-6 md:mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0">
        <button
          onClick={goToPrevious} disabled={currentIndex === 0}
          className="w-full sm:w-auto px-6 py-3 bg-slate-700/50 border border-slate-600 hover:bg-slate-700 font-semibold rounded-lg transition text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed order-1"
        >
          Previous
        </button>

        <button
          onClick={toggleFlag}
          className={`w-full sm:w-auto px-6 py-3 font-semibold rounded-lg transition flex items-center justify-center gap-2 border order-2 sm:order-none ${
            isCurrentQuestionFlagged
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50'
              : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700 text-slate-300'
          }`}
        >
          <FlagIcon className="w-5 h-5" />
          <span>{isCurrentQuestionFlagged ? 'Flagged' : 'Flag'}</span>
        </button>

        <div className="w-full sm:w-auto order-3">
          {isLastQuestion ? (
            <div className="flex flex-col items-stretch sm:items-end">
              {confirmingSubmit && (
                  <p className="text-amber-400 text-sm mb-2 text-center sm:text-right animate-fade-in">
                      You have {flaggedQuestions.size} flagged question(s). Submit anyway?
                  </p>
              )}
              <button
                onClick={handleSubmitClick}
                className="px-8 py-3 bg-emerald-500 hover:opacity-80 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-[0_0_15px_rgba(16,185,129,0.5)] hover:shadow-[0_0_25px_rgba(16,185,129,0.7)]"
              >
                {confirmingSubmit ? 'Confirm & Submit' : 'Submit Exam'}
              </button>
            </div>
          ) : (
            <button
              onClick={goToNext}
              className="w-full sm:w-auto px-8 py-3 bg-brand-primary hover:opacity-80 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-glow-primary hover:shadow-glow-primary-lg"
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