import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));

  // Initialize Gemini lazily
  let genAI: any = null;
  const getGenAI = () => {
    if (!genAI) {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        throw new Error("GEMINI_API_KEY is required but not found in environment");
      }
      genAI = new GoogleGenAI({ apiKey: geminiKey });
    }
    return genAI;
  };

  // API Route: Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Route: Extract passengers from attachment
  app.post("/api/extract-passengers", async (req, res) => {
    const { base64Data, mimeType } = req.body;

    if (!base64Data || !mimeType) {
      return res.status(400).json({ error: "Missing file data or mime type" });
    }

    try {
      const model = getGenAI().getGenerativeModel({ model: "gemini-3-flash-preview" });
      const response = await model.generateContent([
        { text: "Extraia a lista de passageiros deste documento. Retorne um JSON com um array de objetos contendo 'name' (NOME COMPLETO EM MAIÚSCULAS) e 'document' (CPF ou RG). Se não houver documento, use 'S/D'. Ignore cabeçalhos ou informações não relacionadas a passageiros." },
        {
          inlineData: {
            data: base64Data,
            mimeType
          }
        }
      ]);

      const extractedData = JSON.parse(response.response.text() || "[]");
      res.json(extractedData);
    } catch (error) {
      console.error("Gemini Extraction Error:", error);
      res.status(500).json({ error: "Failed to extract data from document" });
    }
  });

  // API Route: General AI Chat / Generation
  app.post("/api/chat", async (req, res) => {
    const { message, systemInstruction, history } = req.body;

    try {
      const model = getGenAI().getGenerativeModel({ 
        model: "gemini-3-flash-preview",
        systemInstruction: systemInstruction || "Você é um assistente especializado na DM Turismo."
      });

      if (history && history.length > 0) {
        const chat = model.startChat({
          history: history.map((h: any) => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }]
          }))
        });
        const result = await chat.sendMessage(message);
        return res.json({ text: result.response.text() });
      } else {
        const result = await model.generateContent(message);
        return res.json({ text: result.response.text() });
      }
    } catch (error) {
      console.error("Gemini Chat Error:", error);
      res.status(500).json({ error: "Failed to generate AI response" });
    }
  });

  // API Route: Smart fill trip data from text
  app.post("/api/smart-fill", async (req, res) => {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Missing text to process" });
    }

    try {
      const model = getGenAI().getGenerativeModel({ model: "gemini-3-flash-preview" });
      const response = await model.generateContent(`Extraia as informações desta viagem do seguinte texto: "${text}"`);
      
      const extractedData = JSON.parse(response.response.text() || "{}");
      res.json(extractedData);
    } catch (error) {
      console.error("Gemini Smart Fill Error:", error);
      res.status(500).json({ error: "Failed to extract data from text" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Critical server startup error:", err);
  process.exit(1);
});
