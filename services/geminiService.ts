import { GoogleGenAI } from "@google/genai";

// FIX: Initialize the GoogleGenAI client.
// Per coding guidelines, the API key must be read from process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates an explanation for why a user's answer is incorrect using the Gemini API.
 * @param question The exam question.
 * @param correctAnswer The correct answer.
 * @param userAnswer The user's incorrect answer.
 * @returns A promise that resolves to a string with the explanation.
 */
export const getAnswerExplanation = async (
  question: string,
  correctAnswer: string,
  userAnswer: string
): Promise<string> => {
  try {
    // FIX: Select model for the task.
    // Per coding guidelines, use 'gemini-2.5-flash' for basic text tasks.
    const model = 'gemini-2.5-flash';

    const prompt = `You are an expert law professor. Your role is to provide a concise and helpful explanation for a student who has answered an exam question incorrectly.

Exam Question: "${question}"

Correct Answer: "${correctAnswer}"

Student's Incorrect Answer: "${userAnswer}"

Please provide a brief explanation (2-3 sentences) clarifying why the student's answer is incorrect and highlighting the key concepts they missed. Focus on the core legal principle. Do not be condescending.`;

    // FIX: Call the Gemini API to generate content.
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    // FIX: Extract text output from the response.
    // Per coding guidelines, the .text property should be used to get the string output.
    return response.text;
  } catch (error) {
    console.error("Error generating explanation from Gemini API:", error);
    // Propagate a user-friendly error message
    throw new Error("Failed to get explanation from AI service. Please try again later.");
  }
};
