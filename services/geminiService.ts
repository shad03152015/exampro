import { GoogleGenAI, Type } from "@google/genai";
import { Question } from '../types';

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

/**
 * Uses a Gemini model to reorder questions for a better learning experience,
 * prioritizing topic diversity.
 * @param questions The array of questions to reorder.
 * @returns A promise that resolves to an array of question numbers in the new order.
 */
export const getSmartlyOrderedQuestions = async (
  questions: Question[]
): Promise<number[]> => {
  try {
    const model = 'gemini-2.5-pro';

    const questionsForPrompt = questions.map(q => ({
      id: q.No,
      question: q.Question
    }));

    const systemInstruction = `You are an expert curriculum designer and exam creator. Your task is to reorder a list of questions to create the most effective and logical study session. The goal is to maximize topic diversity by avoiding placing questions with very similar semantic content or keywords next to each other. Analyze the provided questions and return the optimized order.`;

    const prompt = `Here is the list of questions to reorder:
${JSON.stringify(questionsForPrompt, null, 2)}

Please return a JSON object with a single key "orderedIds" which is an array of the question IDs in the new, optimized order. For example: { "orderedIds": [3, 1, 4, 2] }`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            orderedIds: {
              type: Type.ARRAY,
              items: { type: Type.INTEGER },
            },
          },
          required: ['orderedIds'],
        },
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);

    if (result.orderedIds && Array.isArray(result.orderedIds) && result.orderedIds.length === questions.length) {
      const originalIds = new Set(questions.map(q => q.No));
      const returnedIds = new Set(result.orderedIds);
      if (originalIds.size === returnedIds.size && [...originalIds].every(id => returnedIds.has(id))) {
        return result.orderedIds;
      }
    }
    
    throw new Error("AI-generated order was invalid or incomplete.");

  } catch (error) {
    console.error("Error getting smart order from Gemini API:", error);
    throw new Error("Failed to get optimized order from AI service.");
  }
};