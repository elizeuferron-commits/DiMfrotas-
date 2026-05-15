import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Lazy initialization to avoid crashes if API key is missing during build/startup
let aiInstance: GoogleGenAI | null = null;

export const getGeminiAI = () => {
  if (!aiInstance) {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables.");
    }
    aiInstance = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }
  return aiInstance;
};

export const geminiService = {
  async generateText(prompt: string, systemInstruction?: string) {
    try {
      const ai = getGeminiAI();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || `Você é o "DM Pro Assistente", um especialista em tecnologia e logística para a DM Turismo. 
          Além de dominar a operação da frota e rotas, você tem conhecimento avançado em integração de sistemas:
          - Sabe como conectar o DM Pro a ferramentas Low-Code (AppSheet para formulários de campo, FlutterFlow para apps mobile auxiliares).
          - Orienta sobre a migração para escala empresarial usando Google Cloud Vertex AI para segurança rigorosa e endpoints de produção.
          - Ajuda Elizeu Ferron a planejar a arquitetura técnica da empresa como um ecossistema integrado.`,
        },
      });
      return response.text;
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  },

  async streamText(prompt: string, onChunk: (text: string) => void, systemInstruction?: string) {
    try {
      const ai = getGeminiAI();
      const response = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction || "Você é um assistente especializado na DM Turismo.",
        },
      });

      for await (const chunk of response) {
        if (chunk.text) {
          onChunk(chunk.text);
        }
      }
    } catch (error) {
      console.error("Gemini Streaming Error:", error);
      throw error;
    }
  },

  createChat(systemInstruction?: string) {
    const ai = getGeminiAI();
    return ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: systemInstruction || "Você é um assistente especializado na DM Turismo.",
      },
    });
  }
};
