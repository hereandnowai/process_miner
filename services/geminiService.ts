
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ProcessEvent, ProcessAnalysis } from '../types';
import { GEMINI_TEXT_MODEL } from '../constants';

// Ensure API_KEY is handled by the environment, not hardcoded.
// The application will fail to initialize geminiService if API_KEY is not set.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY for Gemini is not set in environment variables. Gemini service will not function.");
  // alert("Gemini API Key is missing. Please configure it in your environment."); // Avoid alert in service file
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const geminiService = {
  generateProcessInsights: async (eventLog: ProcessEvent[]): Promise<string> => {
    if (!ai) throw new Error("Gemini AI client not initialized. API_KEY might be missing.");
    if (!eventLog || eventLog.length === 0) {
      return JSON.stringify({
        summary: "No process data provided to analyze.",
        bottlenecks: [],
        complianceIssues: [],
        improvementSuggestions: []
      } as ProcessAnalysis);
    }

    // Create a summarized representation of the event log to fit token limits if necessary
    const sampleData = eventLog.slice(0, 50).map(e => ({ activity: e.activity, case: e.caseId, ts: e.timestamp.substring(0,10) })); // Simplified sample
    const prompt = `
      Analyze the following sample process event log data.
      The data represents sequences of activities within different cases.
      Each event has an 'activity', 'case' (caseId), and 'ts' (timestamp).

      Data Sample:
      \`\`\`json
      ${JSON.stringify(sampleData, null, 2)}
      \`\`\`

      Based on this data (and general process mining principles if the sample is too small for deep analysis):
      1. Provide a brief overall summary of potential process characteristics.
      2. Identify 2-3 potential bottlenecks or areas where delays might occur.
      3. List 1-2 potential compliance issues that could arise in such processes.
      4. Suggest 1-2 generic improvement opportunities for processes like this.

      Return your response as a JSON object with the following structure:
      {
        "summary": "string",
        "bottlenecks": ["string", ...],
        "complianceIssues": ["string", ...],
        "improvementSuggestions": ["string", ...]
      }
      Be concise and focus on high-level insights based on the provided sample. If the sample is too sparse, provide generic process mining insights.
    `;

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: prompt,
        config: {
          responseMimeType: "application/json", // Request JSON output
          temperature: 0.3, // Lower temperature for more factual analysis
        }
      });
      // The text property directly contains the model's response.
      // If responseMimeType: "application/json" is honored, it should be a JSON string.
      return response.text;
    } catch (error) {
      console.error("Error calling Gemini API for process insights:", error);
      throw new Error(`Gemini API error: ${(error as Error).message}`);
    }
  },

  processQuery: async (query: string, context?: ProcessEvent[] | null): Promise<string> => {
    if (!ai) throw new Error("Gemini AI client not initialized. API_KEY might be missing.");
    
    let prompt = `You are a helpful AI assistant specializing in process mining.
    User query: "${query}"`;

    if (context && context.length > 0) {
      // Provide a small, relevant sample of process data as context
      const contextSample = context.slice(0, 10).map(e => ({ activity: e.activity, case: e.caseId, ts: e.timestamp.substring(0,10) }));
      prompt += `

      Consider the following sample process data as context if relevant to the query:
      \`\`\`json
      ${JSON.stringify(contextSample, null, 2)}
      \`\`\`
      `;
    }
    prompt += "\nProvide a concise and helpful answer."

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_TEXT_MODEL,
        contents: prompt,
        config: {
          temperature: 0.7, // Slightly more creative for chat
        }
      });
      return response.text;
    } catch (error) {
      console.error("Error calling Gemini API for chat query:", error);
      throw new Error(`Gemini API error: ${(error as Error).message}`);
    }
  },
};

export { geminiService };
    