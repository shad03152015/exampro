import React, { useMemo, useState, useCallback } from 'react';
import { Question, UserAnswers } from '../types';
import { CheckCircleIcon, XCircleIcon, LightBulbIcon } from './IconComponents';
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
  1: ['15', 'days', 'publication', 'gazette', 'newspaper'],
  2: ['presumed', 'know', 'law', 'excuses', 'compliance'],
  3: ['police', 'power', 'eminent', 'domain', 'taxation'],
  4: ['writ', 'habeas', 'corpus', 'produce', 'body', 'detaining'],
  5: ['felony', 'penal', 'code', 'offense', 'special', 'law'],
  6: ['justifying', 'accordance', 'law', 'self-defense', 'liability'],
  7: ['jurisdiction', 'power', 'authority', 'tribunal', 'hear', 'decide'],
  8: ['precautionary', 'principle', 'environment', 'damage', 'uncertain'],
  9: ['security', 'tenure', 'dismissal', 'just', 'cause', 'due', 'process'],
  10: ['lifeblood', 'doctrine', 'taxes', 'government', 'paralyzed'],
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
    <div className="w-full lg:w-[90%] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 md:p-10 animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">Exam Results</h1>
        <p className="text-6xl font-extrabold text-brand-primary mt-4">
          {score} / {questions.length}
        </p>
        <p className="text-2xl text-slate-600 dark:text-slate-400">({scorePercentage.toFixed(0)}%)</p>
      </div>

      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4">
        {questions.map((question) => {
           const userAnswer = userAnswers[question.No] || 'No answer provided';
           const isCorrect = checkAnswerCorrectness(question, userAnswer);
           
           return (
            <div key={question.No} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 transition-all duration-300 hover:shadow-lg hover:border-brand-primary/50">
              <div className="flex justify-between items-start gap-4">
                  <h3 className="text-lg font-semibold mb-2 flex-1">{question.No}. {question.Question}</h3>
                  {isCorrect ? 
                    <span className="flex-shrink-0 flex items-center gap-1 text-green-500 font-bold ml-4"><CheckCircleIcon className="w-6 h-6" />Correct</span> : 
                    <span className="flex-shrink-0 flex items-center gap-1 text-red-500 font-bold ml-4"><XCircleIcon className="w-6 h-6" />Incorrect</span>
                  }
              </div>
              
              <div className="mt-2 space-y-3">
                <div className={`p-3 rounded-md border-l-4 ${isCorrect ? 'bg-green-50 dark:bg-green-900/40 border-green-500' : 'bg-red-50 dark:bg-red-900/40 border-red-500'}`}>
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">Your Answer:</p>
                    <p className="text-slate-700 dark:text-slate-300 break-words">{userAnswer}</p>
                </div>
                <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-md border-l-4 border-slate-400">
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">Suggested Answer:</p>
                    <p className="text-slate-700 dark:text-slate-300 break-words">{question.Answer}</p>
                </div>
                {!isCorrect && (
                  <div className="mt-3">
                    {explanations[question.No] ? (
                       <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg border-l-4 border-amber-500 flex gap-3 shadow-md animate-fade-in">
                          <LightBulbIcon className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
                          <div>
                            <p className="font-semibold text-sm text-amber-800 dark:text-amber-200">Clarification:</p>
                            <p className="text-amber-700 dark:text-amber-300 break-words">{explanations[question.No]}</p>
                          </div>
                       </div>
                    ) : loadingExplanations[question.No] ? (
                       <button disabled className="w-full sm:w-auto text-sm flex items-center justify-center gap-2 py-2 px-4 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-wait">
                         <Spinner size="sm" /> Generating...
                       </button>
                    ) : (
                       <button onClick={() => handleShowExplanation(question, userAnswer)} className="text-sm py-2 px-4 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold transition">
                          Why was this wrong?
                       </button>
                    )}
                    {explanationErrors[question.No] && <p className="text-red-500 text-sm mt-1">{explanationErrors[question.No]}</p>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="text-center mt-8">
          <button
              onClick={onRestart}
              className="bg-brand-primary hover:opacity-80 text-white font-bold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105 shadow-lg"
          >
              Try Again
          </button>
      </div>
    </div>
  );
};

export default ResultsView;