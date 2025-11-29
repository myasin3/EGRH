
import { GoogleGenAI } from "@google/genai";
import { InventoryItem, Machine, WorkLog } from "../types";

// Initialize Gemini API
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * Generates strategic insights based on current inventory and machine status.
 * Used in the Dashboard module.
 */
export const generateInventoryInsights = async (inventory: InventoryItem[], machines: Machine[]) => {
  if (!apiKey) return "API Key not configured. Unable to generate insights.";

  const prompt = `
    Analyze the following E-Waste facility data and provide 3 key strategic insights or alerts for the Facility Manager.
    Focus on capacity, bottlenecks, or maintenance risks.
    
    Inventory: ${JSON.stringify(inventory)}
    Machines: ${JSON.stringify(machines)}
    
    Return a concise, bulleted list in plain text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI Service temporarily unavailable.";
  }
};

export interface AIAnalysisResult {
    summary: string;
    efficiencyScore: number;
    highlights: string[];
    concerns: string[];
}

/**
 * Analyzes work logs to determine efficiency and trends.
 * Expects a JSON response from the AI model.
 */
export const analyzeDailyEfficiency = async (logs: WorkLog[]): Promise<AIAnalysisResult | string> => {
  if (!apiKey) return "API Key not configured.";

  // Filter for last 7 days to keep context relevant and avoid token limits
  const recentLogs = logs.slice(0, 60);

  const prompt = `
    Analyze these daily work logs for an E-Waste plant.
    Provide a structured JSON response with this exact schema:
    {
      "summary": "Short professional summary of team performance (max 2 sentences)",
      "efficiencyScore": number, // 0-100 integer based on output volume vs hours
      "highlights": ["string", "string"], // Top 2-3 positive achievements
      "concerns": ["string", "string"] // Top 2-3 potential issues or anomalies
    }
    Return ONLY raw JSON. Do not include markdown code blocks like \`\`\`json.
    
    Logs: ${JSON.stringify(recentLogs)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    const text = response.text || '';
    // Strip markdown formatting if the model includes it despite instructions
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
        return JSON.parse(jsonString) as AIAnalysisResult;
    } catch (e) {
        console.warn("Failed to parse AI JSON", e);
        return text; // Fallback to raw text if parsing fails
    }
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI Analysis failed. Please try again later.";
  }
};
