import { Question } from '../types';
import {
    CIVIL_LAW_QUESTIONS,
    CRIMINAL_LAW_QUESTIONS,
    LABOR_LAW_QUESTIONS,
    TAXATION_LAW_QUESTIONS,
    COMMERCIAL_LAW_QUESTIONS,
    REMEDIAL_LAW_QUESTIONS,
    LEGAL_ETHICS_QUESTIONS,
    POLITICAL_LAW_QUESTIONS
} from '../data/questions';

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