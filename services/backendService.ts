import { Question } from '../types';

const ALL_QUESTIONS: Question[] = [
    { "subject": "Civil Law", "No": 1, "Question": "When do laws take effect?", "Answer": "Laws take effect after 15 days following their publication in the Official Gazette or in a newspaper of general circulation in the Philippines, unless it is otherwise provided." },
    { "subject": "Civil Law", "No": 2, "Question": "What is the doctrine of 'Ignorance of the law excuses no one from compliance therewith'?", "Answer": "This means that everyone is conclusively presumed to know the law. It is a rule of necessity and expediency, as otherwise, the administration of justice would be frustrated." },
    { "subject": "Civil Law", "No": 3, "Question": "What are the three inherent powers of the State?", "Answer": "The three inherent powers of the state are Police Power, Power of Eminent Domain, and Power of Taxation." },
    { "subject": "Civil Law", "No": 4, "Question": "What is a Writ of Habeas Corpus?", "Answer": "It is a writ directed to the person detaining another, commanding him to produce the body of the prisoner at a designated time and place, with the day and cause of his capture and detention, to do, submit to, and receive whatsoever the court or judge awarding the writ shall consider in that behalf." },
    { "subject": "Criminal Law", "No": 5, "Question": "What is a felony?", "Answer": "A felony is an act or omission punishable by the Revised Penal Code. Acts and omissions punishable by law are felonies (delitos)." },
    { "subject": "Criminal Law", "No": 6, "Question": "What is a justifying circumstance?", "Answer": "Justifying circumstances are those where the act of a person is said to be in accordance with law, so that such person is deemed not to have transgressed the law and is free from both criminal and civil liability. An example is self-defense." },
    { "subject": "Criminal Law", "No": 7, "Question": "What is jurisdiction in a criminal case?", "Answer": "It is the power or authority of a court to hear, try, and decide a particular offense charged. It is the power to take cognizance of and to decide a criminal action." },
    { "subject": "Criminal Law", "No": 8, "Question": "What is the 'precautionary principle' in environmental law?", "Answer": "When human activities may lead to threats of serious and irreversible damage to the environment that is scientifically plausible but uncertain, actions shall be taken to avoid or diminish that threat." },
    { "subject": "Labor Law", "No": 9, "Question": "What is security of tenure?", "Answer": "Security of tenure is the constitutional right of an employee to not be removed or dismissed from employment without a just or authorized cause and without observance of procedural due process." },
    { "subject": "Labor Law", "No": 10, "Question": "What is the 'lifeblood doctrine' in taxation?", "Answer": "The lifeblood doctrine states that taxes are the lifeblood of the government, and their prompt and certain availability is an imperious need. Without taxes, the government would be paralyzed for lack of motive power to activate and operate it." },
];

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