import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const getAnswerExplanation = async (question: string, correctAnswer: string, userAnswer: string): Promise<string> => {
    const prompt = `
      You are an expert law professor's assistant. Your task is to provide a brief, helpful clarification for a student's incorrect exam answer.
      Focus on the core reason the user's answer is wrong and gently guide them toward the correct concept. Keep the explanation to 2-3 sentences.

      Question: "${question}"
      Suggested Correct Answer: "${correctAnswer}"
      Student's Incorrect Answer: "${userAnswer}"

      Provide your clarification:
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error generating explanation:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate explanation: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the explanation.");
    }
};