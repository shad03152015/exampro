import { Question } from '../types';
import { CIVIL_LAW_QUESTIONS } from '../data/civil_law_questions';
import { CRIMINAL_LAW_QUESTIONS } from '../data/criminal_law_questions';
import { LABOR_LAW_QUESTIONS } from '../data/labor_law_questions';
import { TAXATION_LAW_QUESTIONS } from '../data/taxation_law_questions';
import { COMMERCIAL_LAW_QUESTIONS } from '../data/commercial_law_questions';
import { REMEDIAL_LAW_QUESTIONS } from '../data/remedial_law_questions';
import { LEGAL_ETHICS_QUESTIONS } from '../data/legal_ethics_questions';
import { POLITICAL_LAW_QUESTIONS } from '../data/political_law_questions';
import { getUsersCollection, AuthorizedUser, initializeDefaultUsers } from './mongodbService';

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

// Simulate the list of valid accounts from the Google Sheet
const VALID_ACCOUNTS = [
    'student@google.com',
    'shad03152015@gmail.com',
    'admin@barexam.com',
    'reviewer@lawschool.edu',
];

// Initialize default users when the service loads
const ensureDatabaseInitialized = async (): Promise<void> => {
  try {
    await initializeDefaultUsers();
  } catch (error) {
    console.warn('Failed to initialize database users, falling back to default validation:', error);
  }
};

/**
 * Validates a Google ID token and extracts user information.
 * In a real application, this would be a backend call to verify the token with Google's servers.
 * @param token The Google ID token to validate.
 * @returns A promise that resolves to user information if valid, null otherwise.
 */
export const validateGoogleToken = async (token: string): Promise<{email: string, name: string, googleId: string} | null> => {
    try {
        // Decode the JWT token (client-side validation - in production, this should be done server-side)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );

        const payload = JSON.parse(jsonPayload);

        // Basic token validation
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
            throw new Error('Token expired');
        }

        // Verify the token was issued for this client (in production, verify against your client_id)
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (payload.aud !== clientId) {
            throw new Error('Invalid token audience');
        }

        // Verify the token was issued by Google
        if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') {
            throw new Error('Invalid token issuer');
        }

        return {
            email: payload.email,
            name: payload.name || 'User',
            googleId: payload.sub
        };
    } catch (error) {
        console.error('Token validation error:', error);
        return null;
    }
};

/**
 * Validates an email against the MongoDB authorized users collection.
 * Enhanced to work with Google OAuth users.
 * @param email The email address to validate.
 * @returns A promise that resolves to true if the email is valid, false otherwise.
 */
export const validateEmail = async (email: string): Promise<boolean> => {
    try {
        // Ensure database is initialized
        await ensureDatabaseInitialized();

        // First check if email is in the original hardcoded list (fallback)
        if (VALID_ACCOUNTS.includes(email.toLowerCase())) {
            return true;
        }

        // Check if email exists in MongoDB authorized users collection
        const collection = await getUsersCollection();
        const user = await collection.findOne({
            email: email.toLowerCase(),
            is_active: true
        });

        return user !== null;
    } catch (error) {
        console.error('Email validation error:', error);
        // Fallback to hardcoded list if database is unavailable
        return VALID_ACCOUNTS.includes(email.toLowerCase());
    }
};

/**
 * Adds a new authorized user to the system.
 * @param email The user's email address.
 * @param name The user's name.
 * @returns A promise that resolves to true if successful, false otherwise.
 */
export const addAuthorizedUser = async (email: string, name?: string): Promise<boolean> => {
    try {
        // Ensure database is initialized
        await ensureDatabaseInitialized();

        const collection = await getUsersCollection();

        // Check if user already exists
        const existingUser = await collection.findOne({
            email: email.toLowerCase()
        });

        if (existingUser) {
            return false; // User already exists
        }

        // Insert new user
        const newUser: Omit<AuthorizedUser, '_id'> = {
            email: email.toLowerCase(),
            name: name || 'New User',
            google_id: undefined, // Will be populated when user logs in with Google
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
        };

        const result = await collection.insertOne(newUser);
        return result.acknowledged;
    } catch (error) {
        console.error('Error adding authorized user:', error);
        return false;
    }
};

/**
 * Removes an authorized user from the system.
 * @param email The user's email address.
 * @returns A promise that resolves to true if successful, false otherwise.
 */
export const removeAuthorizedUser = async (email: string): Promise<boolean> => {
    try {
        await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay

        const initialLength = authorizedUsers.length;
        authorizedUsers = authorizedUsers.filter(user =>
            user.email.toLowerCase() !== email.toLowerCase()
        );

        return authorizedUsers.length < initialLength;
    } catch (error) {
        console.error('Error removing authorized user:', error);
        return false;
    }
};

/**
 * Retrieves all authorized users.
 * @returns A promise that resolves to an array of authorized users.
 */
export const getAuthorizedUsers = async (): Promise<Array<{email: string, name: string}>> => {
    try {
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay

        return authorizedUsers.map(user => ({
            email: user.email,
            name: user.name
        }));
    } catch (error) {
        console.error('Error fetching authorized users:', error);
        return [];
    }
};

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