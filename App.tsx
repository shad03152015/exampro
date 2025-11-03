import React, { useState, useCallback, useEffect } from 'react';
import { Question, ExamStatus, UserAnswers } from './types';
import { getAvailableSubjects, getQuestionsForSubject } from './services/backendService';
import ExamView from './components/ExamView';
import ResultsView from './components/ResultsView';
import { BookOpenIcon, SparklesIcon } from './components/IconComponents';
import Spinner from './components/Spinner';

const LOCAL_STORAGE_KEY = 'examProLastSelectedSubject';

const App: React.FC = () => {
  const [examStatus, setExamStatus] = useState<ExamStatus>(ExamStatus.Idle);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [selectedSubject, setSelectedSubject] = useState<string>(
    () => localStorage.getItem(LOCAL_STORAGE_KEY) || ''
  );
  
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      setIsLoading(true);
      try {
        const subjects = await getAvailableSubjects();
        setAvailableSubjects(subjects);
        // Set a default selection if none is in localStorage
        if (!localStorage.getItem(LOCAL_STORAGE_KEY) && subjects.length > 0) {
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
    localStorage.setItem(LOCAL_STORAGE_KEY, selectedSubject);
  }, [selectedSubject]);


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

      setActiveQuestions(questions);
      setUserAnswers({});
      setExamStatus(ExamStatus.Active);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred while starting the exam.');
    } finally {
      setIsLoading(false);
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

  const renderIdleContent = () => {
    if (isLoading && availableSubjects.length === 0) {
      return (
        <div className="text-center p-8">
          <Spinner size="lg" />
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">Loading available exams...</p>
        </div>
      );
    }

    return (
      <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-xl shadow-2xl animate-fade-in w-full max-w-2xl">
        <BookOpenIcon className="w-16 h-16 mx-auto text-brand-primary" />
        <h1 className="text-4xl font-bold mt-4 mb-2">Welcome to ExamPro AI</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-2xl mx-auto">
          Select a subject to begin your practice exam.
        </p>
        
        {error && (
            <div className="my-4 p-3 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-lg text-center">
                <p>{error}</p>
            </div>
        )}

        <div className="mb-6 w-full max-w-sm mx-auto">
            <label htmlFor="subject-select" className="sr-only">
                Select Subject
            </label>
            <select
                id="subject-select"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full text-center text-lg p-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition bg-slate-50 dark:bg-slate-700"
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
          className="bg-brand-primary hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-wait"
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
        return renderIdleContent();
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="w-full bg-white dark:bg-slate-800/50 backdrop-blur-sm shadow-md p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <SparklesIcon className="w-8 h-8 text-brand-primary" />
          <h1 className="text-2xl font-bold tracking-tight">ExamPro AI</h1>
        </div>
      </header>
      
      <main className="flex-grow flex items-center justify-center p-4 md:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;