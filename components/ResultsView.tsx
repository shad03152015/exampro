import React, { useMemo, useState, useCallback } from 'react';
import { Question, UserAnswers } from '../types';
import { CheckCircleIcon, XCircleIcon, LightBulbIcon, InformationCircleIcon } from './IconComponents';
import { getAnswerExplanation } from '../services/geminiService';
import Spinner from './Spinner';

interface ResultsViewProps {
  questions: Question[];
  userAnswers: UserAnswers;
  onRestart: () => void;
}

const ANSWER_KEYWORDS: { [key: number]: string[] } = {
  1: ['true', 'foreign law', 'not pleaded', 'not proved', 'presumption', 'same', 'domestic law'],
  2: ['true', 'legitimation', 'died before', 'marriage', 'benefit their descendants'],
  3: ['marilyn', 'merit', 'presumed', 'died', 'same time', 'no transmission', 'representation', 'insurance', 'survivorship', 'vested'],
  4: ['void', 'ceremony', 'formal requisite', 'solemnizing officer'],
  5: ['illegitimate', 'outside', 'valid wedlock', 'article 165'],
  6: ['yes', 'recognized', 'valid', 'naturalized citizen', 'foreign country', 'nationality principle'],
  7: ['petition', 'recognition', 'foreign divorce', 'declaratory relief'],
  8: ['no', 'claims', 'not sustained', 'impugn', 'legitimacy', 'not the legal husband'],
  9: ['yes', 'admitted to probate', 'holographic will', 'philippine law', 'article 816'],
  10: ['no', 'legitime', 'national law', 'testator', 'new york law', 'compulsory heirs'],
  11: ['wife', 'one-half', 'p5,000,000', 'full-blood brothers', 'p1,000,000', 'nephew', 'representation', 'half-brothers', 'p500,000'],
  12: ['yes', 'bound', 'respect', 'lease', 'assignee', 'steps into the shoes', 'actual knowledge'],
  13: ['good faith', 'buyer luis', 'no action', 'rely', 'certificate of title'],
  14: ['yes', 'solidarily liable', 'inside the vehicle', 'prevented', 'due diligence', 'article 2184'],
  15: ['true', 'clause', 'choose more arbitrators', 'void', 'article 2045'],
  16: ['true', 'renunciation', 'co-owner', 'dacion en pago', 'satisfaction of a debt'],
  17: ['false', 'dispose', 'corpse', 'inter vivos', 'lifetime', 'no corpse'],
  18: ['no', 'suit will not prosper', 'forum non conveniens', 'not citizens', 'national law'],
  19: ['no', 'cannot be annulled', 'sterility', 'not a ground', 'article 45'],
  20: ['no', 'not be dismissed', 'no opposition', 'submitted for resolution'],
  21: ['no', 'different', 'adoptee who dies', 'petition should be dismissed', 'best interest of the adoptee'],
  22: ['no', 'cannot compel', 'use his surname', 'may use', 'choice belongs to the child'],
  23: ['no', 'not grant', 'sole parental authority', 'mother', 'article 176'],
  24: ['no', 'not correct', 'due, demandable, and liquidated', 'p300,000.00', 'acceleration clause'],
  25: ['yes', 'correct', 'accretion', 'adjoining banks', 'article 457', 'not in concept of an owner'],
  26: ['reimbursement', 'taxes', 'quasi-contract', 'necessary expenses', 'preservation', 'article 546'],
  27: ['yes', 'valid', 'pactum commissorium', 'not automatic appropriation', 'execute a document'],
  28: ['no', 'different', 'automatic appropriation', 'prohibited', 'violative', 'pactum commissorium', 'void'],
  29: ['yes', 'partition by sale', 'one-half or more', 'untenantable', 'thirty percent interest'],
  30: ['dismissed', 'sale to alien', 'prohibited', 'flaw', 'cured', 'subsequently transferred to a citizen'],
  31: ['new york law', 'change of name', 'not affect status', 'legal capacity'],
  32: ['philippine law', 'not legal capacity', 'not status', 'philippine records'],
  33: ['false', 'proves', 'capacitates the alien spouse to remarry', 'recognized by philippine courts'],
  34: ['false', 'prohibit partition', 'not exceeding twenty years'],
  35: ['both', 'a and b', 'breach of contract', 'lessor', 'necessary repairs', 'tort liability', 'engineer', 'architect', 'defect'],
  36: ['none of the above', 'by chance', 'article 438', 'trespasser'],
  37: ['invalid', 'public instrument', 'special power of attorney', 'during the lifetime'],
  38: ['legacy given to b\'s child is invalid', 'legacy is void', 'article 823'],
  39: ['guaranty', 'subsidiary', 'suretyship', 'solidary', 'primary obligor'],
  40: ['comity theory', 'statute theory', 'legal reciprocity', 'domestic law'],
  41: ['impugn', 'legitimacy', 'prescriptive period', 'proper party'],
  42: ['conclusively presumed', 'legitimate daughter', 'right to support', 'succeed'],
  43: ['yes', 'pendente lite', 'subsistence of their marriage', 'not yet been dissolved'],
  44: ['yes', 'entitled to support', 'beyond age of majority', 'finished their education'],
  45: ['habeas corpus', 'sole parental authority', 'mother', 'article 176'],
  46: ['no', 'cannot demand', 'pari delicto', 'child trafficking'],
  47: ['majorette', 'mother', 'sole parental authority', 'custody'],
  48: ['co-owned', 'b and g', 'special co-ownership', 'article 147', 'ordinary rules on co-ownership'],
  49: ['co-owned', 'article 147', 'retroactively', 'apartment', 'exclusively'],
  50: ['yes', 'adopt', 'without consent', 'decree of legal separation'],
  51: ['yes', 'adopt', 'lawful spouse gives her consent'],
  52: ['no', 'cannot file', 'husband and wife', 'shall adopt jointly'],
  53: ['both b and g', 'equal shares', 'special co-ownership', 'article 147'],
  54: ['illegitimate', 'conceived and born outside', 'valid marriage', 'subsequent valid marriage'],
  55: ['five children', 'surviving spouse', 'equally', 'one-half', 'one-fourth', 'one-twelfth'],
  56: ['collated', 'one-half portion', 'advance on their respective inheritance'],
  57: ['school', 'administrators', 'teachers', 'special parental authority', 'article 218'],
  58: ['school', 'administrators', 'teachers', 'liable', 'supervision and custody'],
  59: ['21 years old', 'quasi-delict', 'personally liable', 'no longer under parental authority'],
  60: ['yes', 'right of way', 'shortest distance', 'least prejudice', 'indemnity'],
  61: ['no one', 'liable', 'force majeure', 'fault of the person', 'article 2183'],
  62: ['collection suit', 'a, b, and estate of c', 'pro rata', 'article 1816'],
  148: ['no', 'birth determines personality', 'did not result in the death of a person'],
};


const checkAnswerCorrectness = (userAnswer: string, question: Question): boolean => {
  // For multiple-choice questions, perform a simple string comparison.
  if (question.Options && question.Options.length > 0) {
    return userAnswer.trim().toLowerCase() === question.Answer.trim().toLowerCase();
  }

  // For essay questions, use the NLP keyword matching logic.
  const keywords = ANSWER_KEYWORDS[question.No];
  if (!keywords || keywords.length === 0) {
    // If no keywords are defined for an essay, we cannot grade it locally.
    // Defaulting to incorrect. A more complex implementation could use a different strategy.
    return userAnswer.trim().toLowerCase() === question.Answer.trim().toLowerCase();
  }

  // Normalize the user's answer by converting to lowercase and removing punctuation.
  const normalizedUserAnswer = userAnswer.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

  let matches = 0;
  keywords.forEach(keyword => {
    // Check if the normalized answer includes the keyword.
    if (normalizedUserAnswer.includes(keyword.toLowerCase())) {
      matches++;
    }
  });

  // To be marked correct, the user's answer must contain at least 60% of the essential keywords.
  const requiredMatches = Math.ceil(keywords.length * 0.60);

  return matches >= requiredMatches;
};


const ResultsView: React.FC<ResultsViewProps> = ({ questions, userAnswers, onRestart }) => {
  const [explanations, setExplanations] = useState<{ [key: number]: string }>({});
  const [loadingExplanations, setLoadingExplanations] = useState<{ [key: number]: boolean }>({});
  const [explanationErrors, setExplanationErrors] = useState<{ [key: number]: string }>({});
  
  const resultsData = useMemo(() => {
    return questions.map(q => {
      const userAnswer = userAnswers[q.No] || '';
      const isCorrect = checkAnswerCorrectness(userAnswer, q);
      return { questionNo: q.No, isCorrect };
    });
  }, [questions, userAnswers]);

  const { score, total } = useMemo(() => {
    const correctCount = resultsData.filter(r => r.isCorrect).length;
    return { score: correctCount, total: questions.length };
  }, [resultsData, questions.length]);
  
  const scorePercentage = total > 0 ? (score / total) * 100 : 0;
  
   const handleShowExplanation = useCallback(async (question: Question, userAnswer: string) => {
    if (!userAnswer || userAnswer === 'No answer provided') return;

    setLoadingExplanations(prev => ({ ...prev, [question.No]: true }));
    setExplanationErrors(prev => ({ ...prev, [question.No]: '' }));
    
    try {
      const explanation = await getAnswerExplanation(question.Question, question.Answer, userAnswer);
      setExplanations(prev => ({ ...prev, [question.No]: explanation }));
    } catch (error) {
      setExplanationErrors(prev => ({ ...prev, [question.No]: 'Could not load explanation at this time.' }));
    } finally {
      setLoadingExplanations(prev => ({ ...prev, [question.No]: false }));
    }
  }, []);

  return (
    <div className="w-full flex-grow flex flex-col p-4 sm:p-6 md:p-8 animate-fade-in">
      <div className="text-center mb-6 flex-shrink-0">
        <h1 className="text-3xl sm:text-4xl font-bold">Exam Results</h1>
        <div className="h-20 flex items-center justify-center">
            <p className="text-6xl sm:text-7xl font-black text-brand-primary mt-4 text-glow animate-fade-in">
                {score} / {total}
            </p>
        </div>
        <p className="text-xl sm:text-2xl text-slate-400">
          {`(${scorePercentage.toFixed(0)}%)`}
        </p>
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
           const result = resultsData.find(r => r.questionNo === question.No);
           const isCorrect = result ? result.isCorrect : false;
           
           const isMultipleChoice = question.Options && question.Options.length > 0;
           
           return (
            <div key={question.No} className="glass-panel p-4 md:p-6 rounded-2xl border border-slate-700/80">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3 mb-4">
                  <div className="flex items-start gap-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-brand-primary text-white font-bold">{index + 1}</span>
                    <h3 className="text-lg font-bold text-slate-100">{question.Question}</h3>
                  </div>
                  
                  <span className={`flex-shrink-0 flex items-center gap-2 font-bold px-3 py-1 rounded-full text-sm ${isCorrect ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                    {isCorrect ? <CheckCircleIcon className="w-5 h-5" /> : <XCircleIcon className="w-5 h-5" />}
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
              </div>
              
                {isMultipleChoice ? (
                   <div className="space-y-3">
                    {question.Options.map((option, optIndex) => {
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
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className={`p-4 rounded-lg shadow-inner ${isCorrect ? 'bg-emerald-900/20' : 'bg-red-900/30'}`}>
                          <p className="font-semibold text-sm text-slate-300 mb-2">Your Answer:</p>
                          <p className="text-slate-200 break-words">{userAnswer}</p>
                      </div>
                      <div className="p-4 bg-slate-800/60 rounded-lg shadow-inner">
                          <p className="font-semibold text-sm text-slate-300 mb-2">Suggested Answer:</p>
                          <p className="text-slate-200 break-words">{question.Answer}</p>
                      </div>
                       {!isCorrect && (
                        <div className="mt-2 lg:col-span-2">
                          {explanations[question.No] ? (
                            <div className="p-4 bg-amber-900/20 shadow-inner rounded-lg flex gap-3 animate-fade-in">
                                <LightBulbIcon className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
                                <div>
                                  <p className="font-semibold text-sm text-amber-200">AI Clarification:</p>
                                  <p className="text-amber-300 break-words whitespace-pre-wrap">{explanations[question.No]}</p>
                                </div>
                            </div>
                          ) : loadingExplanations[question.No] ? (
                            <button disabled className="w-full sm:w-auto text-sm flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-slate-700/50 border border-slate-600 text-slate-400 cursor-wait">
                              <Spinner size="sm" /> Generating...
                            </button>
                          ) : (
                            <button 
                                onClick={() => handleShowExplanation(question, userAnswer)} 
                                className="text-sm py-2 px-4 rounded-lg border font-semibold transition-all duration-300 border-brand-primary/50 text-brand-primary hover:bg-brand-primary/20 hover:shadow-glow-primary"
                            >
                                Why was this wrong?
                            </button>
                          )}
                          {explanationErrors[question.No] && <p className="text-red-400 text-sm mt-1">{explanationErrors[question.No]}</p>}
                        </div>
                      )}
                  </div>
                )}
            </div>
          );
        })}
      </div>
      
      <div className="text-center mt-8 flex-shrink-0">
          <button
              onClick={onRestart}
              className="bg-brand-primary text-white font-bold py-3 px-8 rounded-lg text-lg transition-all transform hover:scale-105 shadow-glow-primary hover:shadow-glow-primary-lg"
          >
              Try Again
          </button>
      </div>
    </div>
  );
};

export default ResultsView;