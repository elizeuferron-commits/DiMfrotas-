import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));

  // Initialize Gemini
  let ai: any = null;
  const getAI = () => {
    if (!ai) {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        throw new Error("GEMINI_API_KEY is required but not found in environment");
      }
      ai = new GoogleGenAI({ 
        apiKey: geminiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return ai;
  };

  // API Route: Scan document and extract financial data
  app.post("/api/finance/scan-document", async (req, res) => {
    const { base64Data, mimeType } = req.body;

    if (!base64Data || !mimeType) {
      return res.status(400).json({ error: "Missing file data or mime type" });
    }

    try {
      const client = getAI();
      const response = await client.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: `Extraia informações financeiras deste documento (boleto, nota fiscal ou recibo). 
Retorne APENAS um objeto JSON com os seguintes campos:
- description: Uma breve descrição do que se trata (ex: "Energia Elétrica", "Peças Mecânica").
- supplier: Nome do fornecedor ou emissor.
- amount: Valor total como número (ex: 150.50).
- dueDate: Data de vencimento no formato YYYY-MM-DD.
- barcode: O código de barras numérico (linha digitável), se disponível. Remova espaços ou pontos.

Se não encontrar algum campo, retorne null para ele. Não inclua Markdown ou texto explicativo, apenas o JSON.` },
              {
                inlineData: {
                  data: base64Data,
                  mimeType
                }
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const extractedData = JSON.parse(response.text || "{}");
      res.json(extractedData);
    } catch (error) {
      console.error("Gemini Scan Error:", error);
      res.status(500).json({ error: "Internal server error during document scanning" });
    }
  });

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
      const client = getAI();
      const response = await client.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: "Extraia a lista de passageiros deste documento. Retorne um JSON com um array de objetos contendo 'name' (NOME COMPLETO EM MAIÚSCULAS) e 'document' (CPF ou RG). Se não houver documento, use 'S/D'. Ignore cabeçalhos ou informações não relacionadas a passageiros." },
              {
                inlineData: {
                  data: base64Data,
                  mimeType
                }
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const extractedData = JSON.parse(response.text || "[]");
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
      const client = getAI();
      
      const contents: any[] = [];
      if (history && history.length > 0) {
        history.forEach((h: any) => {
          contents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }]
          });
        });
      }
      contents.push({ role: 'user', parts: [{ text: message }] });

      const response = await client.models.generateContent({
        model: "gemini-3-flash-preview",
        contents,
        config: {
          systemInstruction: systemInstruction || "Você é um assistente especializado na DM Turismo."
        }
      });

      return res.json({ text: response.text });
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
      const client = getAI();
      const response = await client.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Extraia as informações desta viagem do seguinte texto: "${text}"`,
        config: {
          responseMimeType: "application/json"
        }
      });
      
      const extractedData = JSON.parse(response.text || "{}");
      res.json(extractedData);
    } catch (error) {
      console.error("Gemini Smart Fill Error:", error);
      res.status(500).json({ error: "Failed to extract data from text" });
    }
  });

  // Force development mode if not explicitly set to production
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = "development";
  }
  
  console.log(`Starting server in ${process.env.NODE_ENV} mode`);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      root: process.cwd(),
      server: { middlewareMode: true },
      appType: "spa",
      base: "/",
    });
    
    // Log requests in dev mode
    app.use((req, res, next) => {
      if (req.url.includes('logo_dm.svg')) {
        console.log(`Dev Log: Requesting logo_dm.svg - URL: ${req.url}`);
      }
      next();
    });

    app.use(vite.middlewares);
  } else {
    const fs = await import("fs");
    let distPath = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(distPath)) {
      distPath = path.join(process.cwd(), 'build');
    }
    console.log(`Serving static files from: ${distPath}`);
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
