import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const getAnswerExplanation = async (question: string, correctAnswer: string, userAnswer: string): Promise<string> => {
    const prompt = `
      You are an expert law professor's assistant providing nuanced feedback on an exam. Your task is to generate a context-aware clarification for a student's incorrect answer.

      Analyze the student's answer in relation to the correct one and the question.
      1.  Identify the primary misunderstanding or missing key concept in the student's answer.
      2.  Briefly explain why the suggested answer is correct, referencing the core legal principle.
      3.  Keep your tone encouraging and educational. The goal is to help the student learn, not just to point out their mistake.

      Question: "${question}"
      Suggested Correct Answer: "${correctAnswer}"
      Student's Incorrect Answer: "${userAnswer}"

      Provide your clarification:
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
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