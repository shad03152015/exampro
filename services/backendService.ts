import { Question } from '../types';
import { ALL_QUESTIONS } from '../data/questions';

/**
 * Simulates fetching the list of available subjects from a backend.
 */
export const getAvailableSubjects = async (): Promise<string[]> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    const subjects = new Set(ALL_QUESTIONS.map(q => q.subject));
    return ['All Subjects', ...Array.from(subjects).sort()];
};

/**
 * Simulates fetching the questions for a given subject from a backend.
 */
export const getQuestionsForSubject = async (subject: string): Promise<Question[]> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    
    if (subject === 'All Subjects') {
        return [...ALL_QUESTIONS];
    }
    
    return ALL_QUESTIONS.filter(q => q.subject === subject);
};