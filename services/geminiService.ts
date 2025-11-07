import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a detailed, educational explanation for why a user's answer is incorrect.
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
    const model = 'gemini-2.5-pro'; // Upgraded to a more advanced model for nuanced understanding.

    // A more sophisticated system instruction to guide the AI's persona and task.
    const systemInstruction = `You are an expert law professor and a patient tutor. Your goal is to provide detailed, encouraging, and educational feedback to a law student. Your tone should be supportive, aiming to build understanding, not just to correct. Analyze the student's answer in the context of the question and the correct legal principle.`;

    // A structured prompt to elicit a more detailed and helpful explanation.
    const prompt = `Please analyze the following exam response and provide a structured explanation.

**Exam Question:**
"${question}"

**Correct Answer:**
"${correctAnswer}"

**Student's Incorrect Answer:**
"${userAnswer}"

**Your Explanation should follow this structure:**
1.  **Positive Opener:** Start with an encouraging phrase (e.g., "That's a good attempt," or "I see where you're coming from.").
2.  **Analysis of Misconception:** Briefly explain what the student's answer gets wrong or where the misunderstanding lies.
3.  **Detailed Elaboration:** Clearly explain the correct legal principle in detail. Go beyond just restating the correct answer. Explain the 'why' behind the concept, perhaps with a simple analogy if applicable.
4.  **Key Takeaway:** Conclude with a simple, memorable takeaway or a tip to help the student remember this concept for the future.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
      },
    });

    return response.text;
  } catch (error) {
    console.error("Error generating explanation from Gemini API:", error);
    throw new Error("Failed to get explanation from AI service. Please try again later.");
  }
};