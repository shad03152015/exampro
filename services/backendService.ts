import { Question } from '../types';
import { CIVIL_LAW_QUESTIONS } from '../data/civil_law_questions';
import { CRIMINAL_LAW_QUESTIONS } from '../data/criminal_law_questions';
import { LABOR_LAW_QUESTIONS } from '../data/labor_law_questions';
import { TAXATION_LAW_QUESTIONS } from '../data/taxation_law_questions';
import { COMMERCIAL_LAW_QUESTIONS } from '../data/commercial_law_questions';
import { REMEDIAL_LAW_QUESTIONS } from '../data/remedial_law_questions';
import { LEGAL_ETHICS_QUESTIONS } from '../data/legal_ethics_questions';
import { POLITICAL_LAW_QUESTIONS } from '../data/political_law_questions';

const ALL_QUESTIONS: Question[] = [
    ...CIVIL_LAW_QUESTIONS,
    ...CRIMINAL_LAW_QUESTIONS,
    ...LABOR_LAW_QUESTIONS,
    ...TAXATION_LAW_QUESTIONS,
    ...COMMERCIAL_LAW_QUESTIONS,
    ...REMEDIAL_LAW_QUESTIONS,
    ...LEGAL_ETHICS_QUESTIONS,
    ...POLITICAL_LAW_QUESTIONS
];


// The ALL_QUESTIONS array will be mutated to simulate a database.
let questions: Question[] = [...ALL_QUESTIONS];

/**
 * Simulates fetching the list of available subjects from a backend.
 */
export const getAvailableSubjects = async (): Promise<string[]> => {
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
    const subjects = new Set(questions.map(q => q.subject));
    return ['All Subjects', ...Array.from(subjects).sort()];
};

/**
 * Simulates fetching all questions from the backend.
 */
export const getAllQuestions = async (): Promise<Question[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return [...questions];
}

/**
 * Simulates fetching the questions for a given subject from a backend.
 */
export const getQuestionsForSubject = async (subject: string): Promise<Question[]> => {
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
    
    if (subject === 'All Subjects') {
        return [...questions];
    }
    
    return questions.filter(q => q.subject === subject);
};

/**
 * Simulates adding a new question to the database.
 */
export const addQuestion = async (newQuestionData: Omit<Question, 'No'>): Promise<Question> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const maxId = questions.reduce((max, q) => Math.max(q.No, max), 0);
    const newQuestion: Question = {
        No: maxId + 1,
        ...newQuestionData
    };
    questions.push(newQuestion);
    return newQuestion;
}

/**
 * Simulates adding multiple questions to the database from an import.
 */
export const addMultipleQuestions = async (newQuestionsData: Omit<Question, 'No'>[]): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    let maxId = questions.reduce((max, q) => Math.max(q.No, max), 0);
    
    const newQuestions: Question[] = newQuestionsData.map((qData) => {
        maxId++;
        return {
            ...qData,
            No: maxId,
        };
    });

    questions.push(...newQuestions);
}


/**
 * Simulates updating an existing question in the database.
 */
export const updateQuestion = async (updatedQuestion: Question): Promise<Question> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = questions.findIndex(q => q.No === updatedQuestion.No);
    if (index === -1) {
        throw new Error("Question not found");
    }
    questions[index] = updatedQuestion;
    return updatedQuestion;
}

/**
 * Simulates deleting a question from the database.
 */
export const deleteQuestion = async (questionNo: number): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const initialLength = questions.length;
    questions = questions.filter(q => q.No !== questionNo);
    if (questions.length === initialLength) {
        throw new Error("Question not found");
    }
}