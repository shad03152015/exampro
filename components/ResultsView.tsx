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

// A list of common English stop words.
const STOP_WORDS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours',
  'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself',
  'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom',
  'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an',
  'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at',
  'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
  'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there',
  'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
  'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now'
]);

// A simple synonym map for domain-specific terms to improve matching.
// The key is the synonym, and the value is the canonical word we'll use for comparison.
const SYNONYM_MAP: { [key: string]: string } = {
  'authority': 'power',
  'right': 'power',
  'command': 'power',
  'take': 'domain',
  'seize': 'domain',
  'levy': 'taxation',
  'impose': 'taxation',
  'collect': 'taxation',
  'fifteen': '15',
  'dismissed': 'dismissal',
  'fired': 'dismissal',
  'terminated': 'dismissal',
  'duty': 'obligation',
  'responsibility': 'obligation',
  'presumed': 'assumed',
  'court': 'tribunal',
  'judge': 'tribunal',
};

// Define core keywords for each answer to prioritize key concepts.
const ANSWER_KEYWORDS: { [key: number]: string[] } = {
  // Civil Law
  1: ['true', 'foreign', 'law', 'pleaded', 'proved', 'presumption', 'same', 'domestic'],
  2: ['true', 'legitimation', 'died', 'before', 'marriage', 'benefit', 'descendants'],
  3: ['died', 'same', 'time', 'no', 'transmission', 'rights', 'representation', 'survivorship', 'presumed', 'died', 'ahead', 'vested'],
  4: ['void', 'marriage', 'ceremony', 'formal', 'requisite', 'absence', 'presence', 'officer'],
  5: ['foreign', 'element'],
  // Criminal Law
  6: ['attempted', 'frustrated', 'consummated', 'stages', 'felony', 'overt', 'acts'],
  7: ['conspiracy', 'agreement', 'felony', 'punishable', 'law', 'provides', 'penalty'],
  8: ['dubio', 'pro', 'reo', 'doubt', 'accused', 'innocent', 'presumed'],
  // Labor Law
  9: ['labor-only', 'contracting', 'recruits', 'supplies', 'substantial', 'capital', 'principal'],
  10: ['last-in', 'first-out', 'lifo', 'retrenchment', 'dismissed', 'hired', 'last'],
  11: ['just', 'cause', 'dismissal', 'misconduct', 'disobedience', 'neglect', 'fraud'],
  // Taxation Law
  12: ['lifeblood', 'doctrine', 'taxes', 'government', 'paralyzed', 'imperious'],
  13: ['tax', 'avoidance', 'evasion', 'legal', 'illegal', 'reduce', 'escape', 'fraud'],
  14: ['police', 'power', 'eminent', 'domain', 'taxation', 'inherent'],
  // Commercial Law
  15: ['negotiable', 'instrument', 'written', 'contract', 'money', 'substitute', 'holder'],
  16: ['piercing', 'corporate', 'veil', 'shareholders', 'liable', 'fraud', 'crime', 'disregards', 'personality'],
  17: ['negotiable', 'writing', 'signed', 'unconditional', 'promise', 'money', 'demand', 'bearer'],
  // Remedial Law
  18: ['jurisdiction', 'authority', 'court', 'hear', 'decide', 'summons', 'voluntary', 'appearance'],
  19: ['cause', 'action', 'act', 'omission', 'violates', 'right', 'plaintiff'],
  20: ['precautionary', 'principle', 'environment', 'damage', 'uncertain', 'threat'],
  // Legal Ethics
  21: ['practicing', 'law', 'suspension', 'prohibited', 'attorney-in-fact', 'knowledge'],
  22: ['represent', 'klyde', 'boni', 'disqualification', 'state', 'witness', 'prosecutor'],
  23: ['allegiance', 'constitution', 'obey', 'laws', 'falsehood', 'groundless', 'delay'],
  // Political Law
  24: ['separation', 'powers', 'legislative', 'executive', 'judicial', 'branches', 'checks', 'balances'],
  25: ['judicial', 'review', 'power', 'courts', 'constitution', 'unconstitutional', 'void'],
  26: ['sovereignty', 'supreme', 'power', 'state', 'governed', 'internal', 'external']
};


/**
 * Processes a text string into a set of significant, canonical words.
 * It normalizes text, expands contractions, preserves hyphenated words, 
 * removes stop words, and replaces synonyms.
 */
const processTextToWordSet = (text: string): Set<string> => {
  if (!text) return new Set();
  
  let processedText = text.toLowerCase();

  // Expand common contractions to their full form for better stop-word filtering
  processedText = processedText
    .replace(/\b(it|he|she|that|what|who|where)'s\b/g, '$1 is')
    .replace(/\b(i)'m\b/g, '$1 am')
    .replace(/\b(we|you|they)'re\b/g, '$1 are')
    .replace(/n't\b/g, ' not')
    .replace(/'ll\b/g, ' will')
    .replace(/'ve\b/g, ' have')
    .replace(/'d\b/g, ' would');

  // Remove punctuation but keep intra-word hyphens. Replace underscores and other non-word chars with spaces.
  processedText = processedText.replace(/[^\w\s-]|_/g, ' ').replace(/\s+/g, ' ').trim();

  const words = processedText.split(/\s+/);
  
  const significantWords = words
    .filter(word => word && !STOP_WORDS.has(word))
    .map(word => SYNONYM_MAP[word] || word); // Replace synonyms with canonical form
  
  return new Set(significantWords);
};


/**
 * Compares answers using a hybrid model of Jaccard Similarity and keyword matching.
 * This provides a more semantically aware evaluation.
 */
const checkAnswerCorrectness = (question: Question, userAnswerText: string): boolean => {
    // For multiple choice, we need an exact match of the selected option text.
    if (question.Options && question.Options.length > 0) {
      return userAnswerText.trim() === question.Answer.trim();
    }
  
    // Initial guard for empty or very short raw answers.
    if (!userAnswerText || userAnswerText.trim().length < 10) return false;

    const userAnswerWords = processTextToWordSet(userAnswerText);

    // If the answer contains fewer than 2 meaningful words after processing,
    // it's too insubstantial to be considered correct.
    if (userAnswerWords.size < 2) {
        return false;
    }

    const correctAnswerWords = processTextToWordSet(question.Answer);

    if (correctAnswerWords.size === 0) return false;

    // 1. Calculate Jaccard Similarity for overall semantic overlap.
    const intersection = new Set([...userAnswerWords].filter(word => correctAnswerWords.has(word)));
    const union = new Set([...userAnswerWords, ...correctAnswerWords]);
    
    if (union.size === 0) return false;
    const jaccardSimilarity = intersection.size / union.size;

    // 2. Calculate Keyword Match Score for core concept accuracy.
    const keywords = (ANSWER_KEYWORDS[question.No] || []).map(k => SYNONYM_MAP[k] || k);
    if (keywords.length === 0) {
      // Fallback for questions without defined keywords.
      return jaccardSimilarity > 0.25;
    }
    
    const matchedKeywords = keywords.filter(keyword => userAnswerWords.has(keyword));
    const keywordScore = matchedKeywords.length / keywords.length;

    // 3. Combine scores using a weighted heuristic.
    // An answer is correct if it has a strong keyword match and some similarity,
    // or a moderate keyword match and higher similarity, or very high similarity alone.
    const isCorrect = 
      (keywordScore >= 0.6 && jaccardSimilarity > 0.15) || 
      (keywordScore >= 0.4 && jaccardSimilarity > 0.25) || 
      jaccardSimilarity > 0.4;
    
    return isCorrect;
};


const ResultsView: React.FC<ResultsViewProps> = ({ questions, userAnswers, onRestart }) => {
  const [explanations, setExplanations] = useState<{ [key: number]: string }>({});
  const [loadingExplanations, setLoadingExplanations] = useState<{ [key: number]: boolean }>({});
  const [explanationErrors, setExplanationErrors] = useState<{ [key: number]: string }>({});

  const score = useMemo(() => {
    return questions.reduce((acc, question) => {
      const userAnswer = userAnswers[question.No] || '';
      if (checkAnswerCorrectness(question, userAnswer)) {
        return acc + 1;
      }
      return acc;
    }, 0);
  }, [questions, userAnswers]);

  const scorePercentage = (score / questions.length) * 100;

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
        <p className="text-6xl sm:text-7xl font-black text-brand-primary mt-4 text-glow">
          {score} / {questions.length}
        </p>
        <p className="text-xl sm:text-2xl text-slate-400">({scorePercentage.toFixed(0)}%)</p>
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
           const isCorrect = checkAnswerCorrectness(question, userAnswer);
           
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
