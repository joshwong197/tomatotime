
import { GoogleGenAI, Type } from "@google/genai";
import { SessionType, PomodoroSchedule } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSchedule = async (input: string): Promise<PomodoroSchedule> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `The user wants to plan their focus time for: "${input}". 
    Analyze if this is a time duration (e.g. "3 hours") or a task (e.g. "write an essay").
    If it's a task, estimate how long it should take reasonably.
    Break the total duration into a classic Pomodoro schedule:
    - Focus: 25 minutes
    - Short Break: 5 minutes
    - Long Break: 15 minutes (after every 4 focus sessions)
    Ensure the sequence fills the estimated total time.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          totalEstimatedMinutes: { type: Type.NUMBER },
          sessions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: { 
                  type: Type.STRING, 
                  enum: [SessionType.FOCUS, SessionType.SHORT_BREAK, SessionType.LONG_BREAK] 
                },
                durationMinutes: { type: Type.NUMBER },
                label: { type: Type.STRING }
              },
              required: ["id", "type", "durationMinutes", "label"]
            }
          }
        },
        required: ["totalEstimatedMinutes", "sessions"]
      }
    }
  });

  return JSON.parse(response.text);
};
