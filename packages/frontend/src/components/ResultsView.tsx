import React, { useState, useEffect } from 'react';
import { Question, UserAnswers } from '../shared/src/index';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon } from './IconComponents';
import { checkAnswerCorrectness } from '../services/geminiService';
import Spinner from './Spinner';

interface ResultsViewProps {
  questions: Question[];
  userAnswers: UserAnswers;
  onRestart: () => void;
}

type GradingStatus = 'pending' | 'grading' | 'graded' | 'error';
interface GradingResult {
    isCorrect?: boolean;
    feedback?: string;
    status: GradingStatus;
}

const ResultsView: React.FC<ResultsViewProps> = ({ questions, userAnswers, onRestart }) => {
  
  const [gradingResults, setGradingResults] = useState<Record<number, GradingResult>>({});
  const [overallScore, setOverallScore] = useState<{ score: number; total: number } | null>(null);

  useEffect(() => {
    const gradeAnswers = async () => {
        // Initialize all as pending
        const initialStatus: Record<number, GradingResult> = {};
        questions.forEach(q => {
            initialStatus[q.No] = { status: 'pending' };
        });
        setGradingResults(initialStatus);

        let correctCount = 0;
        
        for (const question of questions) {
            const userAnswer = userAnswers[question.No] || '';
            const isEssay = !question.Options || question.Options.length === 0;

            if (isEssay) {
                setGradingResults(prev => ({ ...prev, [question.No]: { status: 'grading' } }));
            }

            try {
                const result = await checkAnswerCorrectness(userAnswer, question);
                if (result.isCorrect) {
                    correctCount++;
                }
                setGradingResults(prev => ({ ...prev, [question.No]: { ...result, status: 'graded' } }));
            } catch (error) {
                console.error(`Error grading question ${question.No}:`, error);
                setGradingResults(prev => ({ ...prev, [question.No]: { status: 'error', feedback: 'Failed to grade.' } }));
            }
        }

        setOverallScore({ score: correctCount, total: questions.length });
    };

    gradeAnswers();
  }, [questions, userAnswers]);

  const { score, total } = overallScore || { score: 0, total: questions.length };
  const scorePercentage = total > 0 ? (score / total) * 100 : 0;
  const gradingInProgress = Object.values(gradingResults).some(r => r.status === 'grading' || r.status === 'pending');

  return (
    <div className="w-full flex-grow flex flex-col p-4 sm:p-6 md:p-8 animate-fade-in">
      <div className="text-center mb-6 flex-shrink-0">
        <h1 className="text-3xl sm:text-4xl font-bold">Exam Results</h1>
        <div className="h-20 flex items-center justify-center">
            {gradingInProgress ? (
                <div className="flex flex-col items-center gap-2">
                    <Spinner size="md" />
                    <p className="text-lg text-slate-400">Grading in progress...</p>
                </div>
            ) : (
                <p className="text-6xl sm:text-7xl font-black text-brand-primary mt-4 text-glow animate-fade-in">
                    {score} / {total}
                </p>
            )}
        </div>
        {!gradingInProgress && (
            <p className="text-xl sm:text-2xl text-slate-400">
                {`(${scorePercentage.toFixed(0)}%)`}
            </p>
        )}
      </div>

      <div className="glass-panel p-4 rounded-xl mb-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            <InformationCircleIcon className="w-6 h-6 text-brand-primary" />
            <h3 className="font-semibold text-slate-200">Legend</h3>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-emerald-400"/>
              <span>Your Correct Answer</span>
            </div>
             <div className="flex items-center gap-2">
              <XCircleIcon className="w-5 h-5 text-red-400"/>
              <span>Your Incorrect Answer</span>
            </div>
             <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-emerald-400"></div>
              <span>Correct Answer</span>
            </div>
          </div>
        </div>

      <div className="flex-grow space-y-6 overflow-y-auto p-1">
        {questions.map((question, index) => {
           const userAnswer = userAnswers[question.No] || 'No answer provided';
           const result = gradingResults[question.No] || { status: 'pending' };
           const isMultipleChoice = question.Options && question.Options.length > 0;
           
           return (
            <div key={question.No} className="glass-panel p-4 md:p-6 rounded-2xl border border-slate-700/80">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3 mb-4">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-brand-primary text-white font-bold">{index + 1}</span>
                    <h3 className="text-lg font-bold text-slate-100">{question.Question}</h3>
                  </div>
                  
                  {result.status === 'graded' && (
                    <span className={`flex-shrink-0 flex items-center gap-2 font-bold px-3 py-1 rounded-full text-sm animate-fade-in ${result.isCorrect ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                        {result.isCorrect ? <CheckCircleIcon className="w-5 h-5" /> : <XCircleIcon className="w-5 h-5" />}
                        {result.isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  )}
                  {result.status === 'grading' && (
                     <span className="flex-shrink-0 flex items-center gap-2 font-bold px-3 py-1 rounded-full text-sm bg-sky-500/20 text-sky-300">
                        <Spinner size="sm" />
                        Grading...
                    </span>
                  )}
                   {result.status === 'error' && (
                     <span className="flex-shrink-0 flex items-center gap-2 font-bold px-3 py-1 rounded-full text-sm bg-red-500/20 text-red-300">
                        <XCircleIcon className="w-5 h-5" />
                        Grading Error
                    </span>
                  )}
              </div>
              
                {isMultipleChoice ? (
                   <div className="space-y-3">
                    {question.Options!.map((option, optIndex) => {
                      const isUserChoice = option === userAnswer;
                      const isCorrectAnswer = option === question.Answer;
                      
                      let optionClass = 'border-slate-600/80 bg-slate-800/50';
                      let icon = null;

                      if(isUserChoice && isCorrectAnswer) {
                        optionClass = 'bg-emerald-500/20 border-emerald-500 text-emerald-200';
                        icon = <CheckCircleIcon className="w-6 h-6 text-emerald-400" />;
                      } else if (isUserChoice && !isCorrectAnswer) {
                        optionClass = 'bg-red-500/20 border-red-500 text-red-200';
                        icon = <XCircleIcon className="w-6 h-6 text-red-400" />;
                      } else if (isCorrectAnswer) {
                        optionClass = 'border-emerald-500/80';
                      }

                      return (
                        <div key={optIndex} className={`flex items-start p-3 border rounded-lg transition ${optionClass}`}>
                           {icon && <div className="flex-shrink-0 mr-3 mt-1">{icon}</div>}
                           <p className="text-slate-200 text-md flex-grow">
                            <span className="font-mono mr-2">{String.fromCharCode(97 + optIndex)}.</span>
                            {option}
                          </p>
                        </div>
                      );
                    })}
                   </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={`p-4 rounded-lg shadow-inner ${result.status === 'graded' ? (result.isCorrect ? 'bg-emerald-900/20' : 'bg-red-900/30') : 'bg-slate-900/30'}`}>
                            <p className="font-semibold text-sm text-slate-300 mb-2">Your Answer:</p>
                            <p className="text-slate-200 break-words">{userAnswer}</p>
                        </div>
                        <div className="p-4 bg-slate-800/60 rounded-lg shadow-inner">
                            <p className="font-semibold text-sm text-slate-300 mb-2">Suggested Answer:</p>
                            <p className="text-slate-200 break-words">{question.Answer}</p>
                        </div>
                    </div>
                    {result.status === 'graded' && result.feedback && (
                        <div className="mt-4 p-4 bg-slate-900/40 border border-slate-700 rounded-lg">
                            <p className="font-semibold text-sm text-brand-primary mb-2">ExamPractice-Powered Feedback:</p>
                            <p className="text-slate-300 text-sm break-words">{result.feedback}</p>
                        </div>
                    )}
                  </>
                )}
            </div>
          );
        })}
      </div>
      
      <div className="text-center mt-8 flex-shrink-0">
          <button
              onClick={onRestart}
              disabled={gradingInProgress}
              className="bg-brand-primary text-white font-bold py-3 px-8 rounded-lg text-lg transition-all transform hover:scale-105 shadow-glow-primary hover:shadow-glow-primary-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
              Try Again
          </button>
      </div>
    </div>
  );
};

export default ResultsView;