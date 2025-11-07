import React, { useState, useCallback, useEffect } from 'react';
import { Question, ExamStatus, UserAnswers } from 'exampro-shared';
import { questionsAPI } from './services/api';
import ExamView from './components/ExamView';
import ResultsView from './components/ResultsView';
import { BookOpenIcon, SparklesIcon, Cog6ToothIcon } from './components/IconComponents';
import Spinner from './components/Spinner';
import ThemePicker from './components/ThemePicker';
import BackgroundPicker from './components/BackgroundPicker';
import { hexToHsl, hexToRgb, isColorLight } from './utils/colorUtils';
import LoginView from './components/LoginView';
import UserMenu from './components/UserMenu';
import QuestionBankView from './components/QuestionBankView';

const SUBJECT_STORAGE_KEY = 'examPractice2026LastSelectedSubject';
const THEME_STORAGE_KEY = 'examPractice2026ThemeColor';
const BACKGROUND_STORAGE_KEY = 'examPractice2026BackgroundColor';
const AUTH_STORAGE_KEY = 'examPractice2026Authenticated';
const USER_INFO_STORAGE_KEY = 'examPractice2026UserInfo';

const DEFAULT_THEME_COLOR = '#4f46e5'; // Default Indigo
const DEFAULT_BACKGROUND = 'gradient';

/**
 * Shuffles an array in place using the Fisher-Yates (aka Knuth) Shuffle algorithm.
 * @param array The array to shuffle.
 * @returns The shuffled array.
 */
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const App: React.FC = () => {
  const [examStatus, setExamStatus] = useState<ExamStatus>(ExamStatus.Idle);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [selectedSubject, setSelectedSubject] = useState<string>(
    () => localStorage.getItem(SUBJECT_STORAGE_KEY) || ''
  );
  
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [themeColor, setThemeColor] = useState<string>(() => localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME_COLOR);
  const [background, setBackground] = useState<string>(() => localStorage.getItem(BACKGROUND_STORAGE_KEY) || DEFAULT_BACKGROUND);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!sessionStorage.getItem(AUTH_STORAGE_KEY));
  const [user, setUser] = useState<{ email: string; name: string } | null>(() => {
    const storedUser = sessionStorage.getItem(USER_INFO_STORAGE_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // Effect to apply the theme color globally via CSS variables
  useEffect(() => {
    const hsl = hexToHsl(themeColor);
    const rgb = hexToRgb(themeColor);
    if (hsl && rgb) {
      const root = document.documentElement;
      root.style.setProperty('--brand-primary-h', `${hsl.h}`);
      root.style.setProperty('--brand-primary-s', `${hsl.s}%`);
      root.style.setProperty('--brand-primary-l', `${hsl.l}%`);
      root.style.setProperty('--brand-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
      localStorage.setItem(THEME_STORAGE_KEY, themeColor);
    }
  }, [themeColor]);

  // Effect to apply the background and handle light/dark mode
  useEffect(() => {
    document.body.classList.remove('bg-animated-gradient', 'theme-light');
    
    if (background === 'gradient') {
      document.body.classList.add('bg-animated-gradient');
      document.body.style.backgroundColor = '';
    } else {
      document.body.style.backgroundColor = background;
      if (isColorLight(background)) {
        document.body.classList.add('theme-light');
      }
    }
    localStorage.setItem(BACKGROUND_STORAGE_KEY, background);
  }, [background]);

  const refreshData = useCallback(async () => {
      try {
        const [subjects, questions] = await Promise.all([
          questionsAPI.getSubjects(),
          questionsAPI.getQuestions(),
        ]);

        setAvailableSubjects(subjects);
        setAllQuestions(questions);

        if (!localStorage.getItem(SUBJECT_STORAGE_KEY) && subjects.length > 0) {
          setSelectedSubject(subjects[0]);
        } else if (!selectedSubject && subjects.length > 0) {
           setSelectedSubject(subjects[0]);
        }
      } catch (err) {
        setError("Could not load exam data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
  }, [selectedSubject]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    refreshData();
  }, [isAuthenticated, refreshData]);

  useEffect(() => {
    localStorage.setItem(SUBJECT_STORAGE_KEY, selectedSubject);
  }, [selectedSubject]);


  const startExam = useCallback(async () => {
    if (!selectedSubject) {
      setError("Please select a subject to begin.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingMessage('Fetching exam questions...');

    try {
      const allSubjectQuestions = await questionsAPI.getQuestions(selectedSubject);

      const shuffledQuestions = shuffleArray(allSubjectQuestions);

      const desiredCount = 20;
      const questionSubset = shuffledQuestions.slice(0, Math.min(desiredCount, shuffledQuestions.length));

      setActiveQuestions(questionSubset);
      setUserAnswers({});
      setExamStatus(ExamStatus.Active);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred while starting the exam.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [selectedSubject]);

  const finishExam = useCallback((finalAnswers: UserAnswers) => {
    setUserAnswers(finalAnswers);
    setExamStatus(ExamStatus.Finished);
  }, []);
  
  const restartExam = useCallback(() => {
      setError(null);
      setExamStatus(ExamStatus.Idle);
  }, []);

  const handleLoginSuccess = useCallback((loggedInUser: { email: string; name: string }) => {
    sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
    sessionStorage.setItem(USER_INFO_STORAGE_KEY, JSON.stringify(loggedInUser));
    sessionStorage.setItem(`examPractice2026_active_session_${loggedInUser.email}`, 'true');
    setIsAuthenticated(true);
    setUser(loggedInUser);
  }, []);

  const handleLogout = useCallback(() => {
    if (user) {
      sessionStorage.removeItem(`examPractice2026_active_session_${user.email}`);
    }
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(USER_INFO_STORAGE_KEY);
    setIsAuthenticated(false);
    setUser(null);
    setExamStatus(ExamStatus.Idle);
    setUserAnswers({});
    setActiveQuestions([]);
  }, [user]);
  
  // --- Question Bank Handlers ---
  const handleAddQuestion = async (questionData: Omit<Question, 'No'>) => {
    await questionsAPI.addQuestion(questionData);
    await refreshData();
  };
  const handleUpdateQuestion = async (question: Question) => {
    await questionsAPI.updateQuestion(question);
    await refreshData();
  };
  const handleDeleteQuestion = async (questionNo: number) => {
    await questionsAPI.deleteQuestion(questionNo);
    await refreshData();
  };
  const handleImportQuestions = async (importedQuestions: Omit<Question, 'No'>[]) => {
    await questionsAPI.importQuestions(importedQuestions);
    await refreshData();
  };

  const renderIdleContent = () => {
    if (isLoading && availableSubjects.length === 0) {
      return (
        <div className="text-center p-8">
          <Spinner size="lg" />
          <p className="mt-4 text-lg text-slate-400">Loading available exams...</p>
        </div>
      );
    }

    return (
      <div className="glass-panel text-center p-6 md:p-12 rounded-3xl shadow-2xl shadow-black/30 animate-fade-in w-full max-w-2xl">
        <BookOpenIcon className="w-16 h-16 mx-auto text-brand-primary text-glow" />
        <h1 className="text-4xl md:text-5xl font-black mt-4 mb-2 text-glow tracking-tight">Exam Practice for 2026 Bar Examination</h1>
        <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
          Select your subject to begin.
        </p>
        
        {error && (
            <div className="my-4 p-3 bg-red-900/40 border border-red-500/50 text-red-300 rounded-lg text-center">
                <p>{error}</p>
            </div>
        )}

        <div className="mb-8 w-full max-w-md mx-auto">
            <label htmlFor="subject-select" className="sr-only">
                Select Subject
            </label>
            <select
                id="subject-select"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="select-embossed w-full text-center text-lg p-3 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition appearance-none"
                aria-label="Select a subject for the exam"
            >
              {availableSubjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
        </div>
        <button
          onClick={startExam}
          disabled={isLoading || availableSubjects.length === 0}
          className="bg-brand-primary hover:opacity-80 text-white font-bold py-4 px-10 rounded-lg text-lg transition-all transform hover:scale-105 shadow-glow-primary hover:shadow-glow-primary-lg disabled:opacity-50 disabled:cursor-wait disabled:shadow-none"
        >
          {isLoading ? (loadingMessage || 'Loading...') : 'Start Exam'}
        </button>
        <div className="mt-8">
          <button
            onClick={() => setIsQuestionBankOpen(true)}
            className="flex items-center gap-2 mx-auto text-sm font-semibold text-slate-400 hover:text-brand-primary transition-colors"
          >
            <Cog6ToothIcon className="w-5 h-5" />
            Manage Question Bank
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (examStatus) {
      case ExamStatus.Active:
        return <ExamView questions={activeQuestions} onFinish={finishExam} />;
      case ExamStatus.Finished:
        return <ResultsView questions={activeQuestions} userAnswers={userAnswers} onRestart={restartExam} />;
      case ExamStatus.Idle:
      default:
        return (
          <div className="flex-grow flex items-center justify-center p-5">
            {renderIdleContent()}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="glass-panel glass-panel-header w-full border-b p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <SparklesIcon className="w-8 h-8 text-brand-primary text-glow animate-subtle-glow" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Exam Practice for 2026 Bar Examination</h1>
        </div>
        <div className="flex items-center gap-2">
          <BackgroundPicker currentBackground={background} onChangeBackground={setBackground} />
          <ThemePicker currentTheme={themeColor} onChangeTheme={setThemeColor} />
          {isAuthenticated && user && <UserMenu user={user} onLogout={handleLogout} />}
        </div>
      </header>
      
      <main className="flex-grow flex flex-col">
        {!isAuthenticated ? (
          <div className="flex-grow flex items-center justify-center p-5">
             <LoginView onLoginSuccess={handleLoginSuccess} />
          </div>
        ) : (
          renderContent()
        )}
      </main>
      
      <QuestionBankView
        isOpen={isQuestionBankOpen}
        onClose={() => setIsQuestionBankOpen(false)}
        questions={allQuestions}
        subjects={availableSubjects.filter(s => s !== 'All Subjects')}
        onAdd={handleAddQuestion}
        onUpdate={handleUpdateQuestion}
        onDelete={handleDeleteQuestion}
        onImport={handleImportQuestions}
      />
    </div>
  );
};

export default App;
