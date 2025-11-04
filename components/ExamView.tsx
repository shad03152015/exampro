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

  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  const flaggedDropdownRef = useRef<HTMLDivElement>(null);
  // FIX: Changed NodeJS.Timeout to a browser-compatible type to resolve namespace error.
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentQuestion = useMemo(() => questions[currentIndex], [questions, currentIndex]);
  const isLastQuestion = currentIndex === questions.length - 1;
  
  const handleSubmit = useCallback(() => {
    onFinish(userAnswers);
  }, [onFinish, userAnswers]);

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

  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserAnswers(prev => ({ ...prev, [currentQuestion.No]: e.target.value }));
  };

  const goToNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(prev => prev + 1);
  };

  const goToPrevious = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };
  
  const goToQuestion = (questionNo: number) => {
    const questionIndex = questions.findIndex(q => q.No === questionNo);
    if (questionIndex !== -1) {
      setCurrentIndex(questionIndex);
      setIsFlaggedDropdownOpen(false);
    }
  };

  const toggleFlag = () => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion.No)) newSet.delete(currentQuestion.No);
      else newSet.add(currentQuestion.No);
      return newSet;
    });
  };

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
    <div className="glass-panel w-full flex-grow p-4 sm:p-6 md:p-8 flex flex-col animate-slide-in-up">
      <header className="mb-4 md:mb-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
          <div className='text-sm text-slate-400 flex flex-col sm:flex-row sm:items-center sm:gap-4'>
            <span className="whitespace-nowrap">Question {currentIndex + 1} of {questions.length}</span>
            <span className="font-semibold hidden sm:block text-slate-600">•</span>
            <span className="font-semibold text-slate-300">{currentQuestion.subject}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 self-end md:self-center">
            <div className="relative" ref={flaggedDropdownRef}>
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
            <div className={`flex items-center gap-3 rounded-xl px-4 py-2 transition-all duration-300 border shadow-lg shadow-black/30 ring-1 ring-inset ring-white/10 backdrop-blur-sm ${
              isTimeLow
              ? 'bg-red-900/30 text-red-200 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse-warning'
              : 'bg-slate-800/50 text-slate-200 border-slate-700 shadow-[0_0_10px_rgba(var(--brand-primary-rgb),0.4)]'
            }`}>
              <HourglassIcon className="w-5 h-5 animate-spin-slow" />
              <span className="text-lg font-bold tabular-nums tracking-wider">{formatTime(timeRemaining)}</span>
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
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-slate-100 flex-shrink-0">{currentQuestion.Question}</h2>
        <div className="relative w-full flex-grow">
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