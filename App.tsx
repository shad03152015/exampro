import React, { useState, useCallback, useEffect } from 'react';
import { Question, ExamStatus, UserAnswers } from './types';
import { getAvailableSubjects, getQuestionsForSubject } from './services/backendService';
import ExamView from './components/ExamView';
import ResultsView from './components/ResultsView';
import { BookOpenIcon, SparklesIcon } from './components/IconComponents';
import Spinner from './components/Spinner';
import ThemePicker from './components/ThemePicker';
import BackgroundPicker from './components/BackgroundPicker';
import { hexToHsl, hexToRgb, isColorLight } from './utils/colorUtils';

const SUBJECT_STORAGE_KEY = 'examBar2026LastSelectedSubject';
const NUM_QUESTIONS_STORAGE_KEY = 'examBar2026NumQuestions';
const THEME_STORAGE_KEY = 'examBar2026ThemeColor';
const BACKGROUND_STORAGE_KEY = 'examBar2026BackgroundColor';

const DEFAULT_THEME_COLOR = '#4f46e5'; // Default Indigo
const DEFAULT_BACKGROUND = 'gradient';
const DEFAULT_NUM_QUESTIONS = '10';

/**
 * Shuffles an array using the Fisher-Yates algorithm for a more robust and uniform shuffle.
 * @param array The array to shuffle.
 * @returns A new shuffled array.
 */
const shuffleArray = (array: Question[]): Question[] => {
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
  const [numQuestions, setNumQuestions] = useState<string>(
    () => localStorage.getItem(NUM_QUESTIONS_STORAGE_KEY) || DEFAULT_NUM_QUESTIONS
  );
  
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [themeColor, setThemeColor] = useState<string>(() => localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME_COLOR);
  const [background, setBackground] = useState<string>(() => localStorage.getItem(BACKGROUND_STORAGE_KEY) || DEFAULT_BACKGROUND);

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

  useEffect(() => {
    const fetchSubjects = async () => {
      setIsLoading(true);
      try {
        const subjects = await getAvailableSubjects();
        setAvailableSubjects(subjects);
        if (!localStorage.getItem(SUBJECT_STORAGE_KEY) && subjects.length > 0) {
          setSelectedSubject(subjects[0]);
        } else if (!selectedSubject && subjects.length > 0) {
           setSelectedSubject(subjects[0]);
        }
      } catch (err) {
        setError("Could not load exam subjects. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  useEffect(() => {
    localStorage.setItem(SUBJECT_STORAGE_KEY, selectedSubject);
  }, [selectedSubject]);

  useEffect(() => {
    localStorage.setItem(NUM_QUESTIONS_STORAGE_KEY, numQuestions);
  }, [numQuestions]);


  const startExam = useCallback(async () => {
    if (!selectedSubject) {
      setError("Please select a subject to begin.");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const questions = await getQuestionsForSubject(selectedSubject);
      
      if (questions.length === 0) {
        throw new Error("No questions could be found for the selected subject.");
      }
      
      // Use Fisher-Yates algorithm for a truly random shuffle
      const shuffled = shuffleArray(questions);
      
      const desiredCount = numQuestions === 'All' ? shuffled.length : parseInt(numQuestions, 10);
      const finalQuestions = shuffled.slice(0, Math.min(desiredCount, shuffled.length));

      if (finalQuestions.length === 0) {
        throw new Error("Not enough questions available for the selected number.");
      }

      setActiveQuestions(finalQuestions);
      setUserAnswers({});
      setExamStatus(ExamStatus.Active);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred while starting the exam.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSubject, numQuestions]);

  const finishExam = useCallback((finalAnswers: UserAnswers) => {
    setUserAnswers(finalAnswers);
    setExamStatus(ExamStatus.Finished);
  }, []);
  
  const restartExam = useCallback(() => {
      setError(null);
      setExamStatus(ExamStatus.Idle);
  }, []);

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
        <h1 className="text-4xl md:text-5xl font-black mt-4 mb-2 text-glow tracking-tight">Exam Bar 2026</h1>
        <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
          Select your subject and number of questions to begin.
        </p>
        
        {error && (
            <div className="my-4 p-3 bg-red-900/40 border border-red-500/50 text-red-300 rounded-lg text-center">
                <p>{error}</p>
            </div>
        )}

        <div className="mb-8 w-full max-w-md mx-auto flex flex-col sm:flex-row gap-4">
            <div className='flex-grow'>
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
            <div className='sm:w-48'>
               <label htmlFor="num-questions-select" className="sr-only">
                  Number of Questions
              </label>
              <select
                  id="num-questions-select"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  className="select-embossed w-full text-center text-lg p-3 border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition appearance-none"
                  aria-label="Select number of questions"
              >
                <option value="5">5 Questions</option>
                <option value="10">10 Questions</option>
                <option value="20">20 Questions</option>
                <option value="All">All Questions</option>
              </select>
            </div>
        </div>
        <button
          onClick={startExam}
          disabled={isLoading || availableSubjects.length === 0}
          className="bg-brand-primary hover:opacity-80 text-white font-bold py-4 px-10 rounded-lg text-lg transition-all transform hover:scale-105 shadow-glow-primary hover:shadow-glow-primary-lg disabled:opacity-50 disabled:cursor-wait disabled:shadow-none"
        >
          {isLoading ? 'Loading...' : 'Start Exam'}
        </button>
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
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Exam Bar 2026</h1>
        </div>
        <div className="flex items-center gap-2">
          <BackgroundPicker currentBackground={background} onChangeBackground={setBackground} />
          <ThemePicker currentTheme={themeColor} onChangeTheme={setThemeColor} />
        </div>
      </header>
      
      <main className="flex-grow flex flex-col">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;