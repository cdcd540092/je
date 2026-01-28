import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini AI client
// Using the specified flash preview model which is good for multimodal tasks
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface AnalysisResult {
  text: string;
}

/**
 * Analyzes an image using the Gemini Flash model.
 * 
 * @param base64Image The base64 encoded image string (without the data:image/png;base64, prefix if possible, strictly handled inside)
 * @param prompt The prompt to send to the model
 * @returns The analysis text
 */
export const analyzeImage = async (base64Image: string, prompt: string): Promise<AnalysisResult> => {
  try {
    // Ensure clean base64 string
    const cleanBase64 = base64Image.includes('base64,') 
      ? base64Image.split('base64,')[1] 
      : base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster visual lookup
      }
    });

    return {
      text: response.text || "No analysis returned from system."
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze visual input.");
  }
};