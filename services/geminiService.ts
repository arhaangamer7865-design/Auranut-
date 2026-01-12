
import { GoogleGenAI, Type } from "@google/genai";
import type { FoodItem, UserGoals, ChatMessage } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const NUTRITION_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'Name of the food item' },
      calories: { type: Type.NUMBER, description: 'Calories per serving' },
      protein: { type: Type.NUMBER, description: 'Grams of protein per serving' },
      carbs: { type: Type.NUMBER, description: 'Grams of carbohydrates per serving' },
      fat: { type: Type.NUMBER, description: 'Grams of fat per serving' },
      servingSize: { type: Type.NUMBER, description: 'The size of a single serving' },
      servingUnit: { type: Type.STRING, description: 'The unit of the serving size (e.g., g, ml, oz)' },
      emoji: { type: Type.STRING, description: 'A single emoji that best represents the food item' },
    },
    required: ['name', 'calories', 'protein', 'carbs', 'fat', 'servingSize', 'servingUnit', 'emoji'],
  }
};

export const searchFoodWithGrounding = async (query: string): Promise<FoodItem[] | null> => {
  try {
    const prompt = `Search for the nutritional information of "${query}". Use real-world data from official brand websites or verified nutrition databases. Return the result as a JSON array of up to 3 possible matches. Each object should strictly follow this structure: { "name": string, "calories": number, "protein": number, "carbs": number, "fat": number, "servingSize": number, "servingUnit": string, "emoji": string }. If query is generic, provide standard entries.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: NUTRITION_SCHEMA,
      },
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const urls = groundingChunks?.map((chunk: any) => chunk.web?.uri).filter(Boolean) || [];

    const data = JSON.parse(response.text);
    if (Array.isArray(data)) {
      return data.map(item => ({ 
        ...item, 
        id: Math.random().toString(36).substr(2, 9), 
        source: 'search',
        groundingUrls: urls 
      }));
    }
    return null;
  } catch (error) {
    console.error("Error with search grounding food search:", error);
    return getNutritionalInfo(query);
  }
};

export const getNutritionalInfo = async (query: string): Promise<FoodItem[] | null> => {
  try {
    const prompt = `Provide nutritional info for "${query}". Return as JSON array. Include name, calories, protein, carbs, fat, servingSize, servingUnit, emoji.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: NUTRITION_SCHEMA,
      },
    });
    const data = JSON.parse(response.text);
    return Array.isArray(data) ? data.map(item => ({ ...item, id: Math.random().toString(36).substr(2, 9), source: 'database' })) : null;
  } catch (e) {
    return null;
  }
};

export const getNutritionalInfoByImage = async (imageData: string, mimeType: string): Promise<FoodItem | null> => {
  try {
    const imagePart = { inlineData: { data: imageData, mimeType } };
    const textPart = { text: "Identify food and return nutritional info in JSON: name, calories, protein, carbs, fat, servingSize, servingUnit, emoji." };
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              calories: { type: Type.NUMBER },
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fat: { type: Type.NUMBER },
              servingSize: { type: Type.NUMBER },
              servingUnit: { type: Type.STRING },
              emoji: { type: Type.STRING },
            },
            required: ['name', 'calories', 'protein', 'carbs', 'fat', 'servingSize', 'servingUnit', 'emoji'],
        },
      },
    });

    const data = JSON.parse(response.text);
    return { ...data, id: Date.now().toString() };
  } catch (error) {
    return null;
  }
};

export const getCaloriesBurned = async (exercise: string, duration: number, unit: 'minutes' | 'hours', weight: number): Promise<number | null> => {
  try {
    const prompt = `Estimate calories burned for a ${weight}kg person doing "${exercise}" for ${duration} ${unit}. Return JSON: { "calories": number }`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: { calories: { type: Type.NUMBER } },
          required: ['calories']
        },
      },
    });
    return JSON.parse(response.text).calories;
  } catch (e) {
    return null;
  }
};

export const getDeepHealthAnalysis = async (logs: any, goals: UserGoals): Promise<string> => {
  try {
    const prompt = `
      Analyze the user's health trends based on their profile and logs.
      Profile: ${JSON.stringify(goals)}
      History: ${JSON.stringify(logs.slice(-7))}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a health data scientist. Identify patterns in calorie intake vs. goals, analyze macronutrient balance, and provide a detailed, science-based recommendation for the next week. Highlight potential deficiencies. Be thorough and analytical.",
        thinkingConfig: { thinkingBudget: 32768 }
      },
    });

    return response.text;
  } catch (error) {
    console.error("Thinking analysis failed:", error);
    return "I'm having trouble thinking deeply right now. Let's try again in a moment.";
  }
};

export const calculateInitialGoals = async (userInfo: any): Promise<Partial<UserGoals> | null> => {
  try {
    const prompt = `Calculate health goals for: ${JSON.stringify(userInfo)}. Return JSON with dailyCalorieGoal, dailyProteinGoal, dailyCarbsGoal, dailyFatGoal, dailyWaterGoal.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dailyCalorieGoal: { type: Type.NUMBER },
            dailyProteinGoal: { type: Type.NUMBER },
            dailyCarbsGoal: { type: Type.NUMBER },
            dailyFatGoal: { type: Type.NUMBER },
            dailyWaterGoal: { type: Type.NUMBER },
          },
          required: ['dailyCalorieGoal', 'dailyProteinGoal', 'dailyCarbsGoal', 'dailyFatGoal', 'dailyWaterGoal'],
        },
      },
    });
    return JSON.parse(response.text);
  } catch (e) {
    return null;
  }
};

export const getCoachResponse = async (history: ChatMessage[], userMessage: string, context: { goals: UserGoals, todayLog: any }): Promise<string> => {
  try {
    const systemInstruction = `You are Auranut AI Coach. You have access to the user's goals: ${JSON.stringify(context.goals)} and today's activity: ${JSON.stringify(context.todayLog)}. Be helpful, encouraging, and accurate.`;
    
    const contents = [
      ...history.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
      { role: 'user', parts: [{ text: userMessage }] }
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents as any,
      config: {
        systemInstruction
      }
    });

    return response.text;
  } catch (e) {
    return "I'm sorry, I'm offline at the moment. Please try again soon!";
  }
};
