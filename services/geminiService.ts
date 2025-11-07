import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Question } from '../types';

const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

const gradeEssayAnswerWithAI = async (userAnswer: string, correctAnswer: string, questionText: string): Promise<{ isCorrect: boolean; feedback: string; }> => {
  try {
    const prompt = `You are an expert legal examiner grading a bar exam question.
    The question is: "${questionText}"
    The suggested correct answer is: "${correctAnswer}"
    The user's answer is: "${userAnswer}"

    Compare the user's answer with the suggested correct answer. Determine if the user's answer is substantively correct, even if it's not a perfect match. Focus on whether the user grasped the core legal principles and reasoning.

    Respond in JSON format.`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: {
              type: Type.BOOLEAN,
              description: 'Whether the user\'s answer is substantively correct.'
            },
            feedback: {
              type: Type.STRING,
              description: 'A brief explanation for your grading, highlighting correct points or areas for improvement.'
            }
          },
          required: ["isCorrect", "feedback"]
        },
      }
    });

    const jsonText = response.text.trim();
    // It's possible for the response to be wrapped in markdown backticks
    const cleanedJsonText = jsonText.replace(/^```json\s*|```$/g, '');
    const result = JSON.parse(cleanedJsonText);
    
    return {
      isCorrect: result.isCorrect,
      feedback: result.feedback
    };
  } catch (error) {
    console.error("Error grading with AI:", error);
    return {
      isCorrect: false,
      feedback: "There was an error grading this answer. Please try again."
    };
  }
};

/**
 * Checks if a user's answer to a question is correct.
 * For multiple-choice, it's a direct comparison.
 * For essays, it uses the Gemini AI for evaluation.
 * @param userAnswer The user's answer.
 * @param question The question object.
 * @returns An object containing a boolean `isCorrect` and a `feedback` string.
 */
export const checkAnswerCorrectness = async (userAnswer: string, question: Question): Promise<{ isCorrect: boolean; feedback: string; }> => {
  // For multiple-choice questions, perform a simple case-insensitive string comparison.
  if (question.Options && question.Options.length > 0) {
    const isCorrect = userAnswer.trim().toLowerCase() === question.Answer.trim().toLowerCase();
    return { isCorrect, feedback: isCorrect ? "Your answer is correct." : "Your answer is incorrect." };
  }

  // For essay questions, use the new AI grading logic.
  if (!userAnswer || userAnswer.trim() === '') {
      return { isCorrect: false, feedback: "No answer was provided." };
  }
  
  return await gradeEssayAnswerWithAI(userAnswer, question.Answer, question.Question);
};
