var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "20mb" }));
  let ai = null;
  const getAI = () => {
    if (!ai) {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        throw new Error("GEMINI_API_KEY is required but not found in environment");
      }
      ai = new import_genai.GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
    }
    return ai;
  };
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
              { text: `Extraia informa\xE7\xF5es financeiras deste documento (boleto, nota fiscal ou recibo). 
Retorne APENAS um objeto JSON com os seguintes campos:
- description: Uma breve descri\xE7\xE3o do que se trata (ex: "Energia El\xE9trica", "Pe\xE7as Mec\xE2nica").
- supplier: Nome do fornecedor ou emissor.
- amount: Valor total como n\xFAmero (ex: 150.50).
- dueDate: Data de vencimento no formato YYYY-MM-DD.
- barcode: O c\xF3digo de barras num\xE9rico (linha digit\xE1vel), se dispon\xEDvel. Remova espa\xE7os ou pontos.

Se n\xE3o encontrar algum campo, retorne null para ele. N\xE3o inclua Markdown ou texto explicativo, apenas o JSON.` },
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
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
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
              { text: "Extraia a lista de passageiros deste documento. Retorne um JSON com um array de objetos contendo 'name' (NOME COMPLETO EM MAI\xDASCULAS) e 'document' (CPF ou RG). Se n\xE3o houver documento, use 'S/D'. Ignore cabe\xE7alhos ou informa\xE7\xF5es n\xE3o relacionadas a passageiros." },
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
  app.post("/api/chat", async (req, res) => {
    const { message, systemInstruction, history } = req.body;
    try {
      const client = getAI();
      const contents = [];
      if (history && history.length > 0) {
        history.forEach((h) => {
          contents.push({
            role: h.role === "user" ? "user" : "model",
            parts: [{ text: h.content }]
          });
        });
      }
      contents.push({ role: "user", parts: [{ text: message }] });
      const response = await client.models.generateContent({
        model: "gemini-3-flash-preview",
        contents,
        config: {
          systemInstruction: systemInstruction || "Voc\xEA \xE9 um assistente especializado na DM Turismo."
        }
      });
      return res.json({ text: response.text });
    } catch (error) {
      console.error("Gemini Chat Error:", error);
      res.status(500).json({ error: "Failed to generate AI response" });
    }
  });
  app.post("/api/smart-fill", async (req, res) => {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Missing text to process" });
    }
    try {
      const client = getAI();
      const response = await client.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Extraia as informa\xE7\xF5es desta viagem do seguinte texto: "${text}"`,
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
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = "development";
  }
  console.log(`Starting server in ${process.env.NODE_ENV} mode`);
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      root: process.cwd(),
      server: { middlewareMode: true },
      appType: "spa",
      base: "/"
    });
    app.use((req, res, next) => {
      if (req.url.includes("logo_dm.svg")) {
        console.log(`Dev Log: Requesting logo_dm.svg - URL: ${req.url}`);
      }
      next();
    });
    app.use(vite.middlewares);
  } else {
    const fs = await import("fs");
    let distPath = import_path.default.join(process.cwd(), "dist");
    if (!fs.existsSync(distPath)) {
      distPath = import_path.default.join(process.cwd(), "build");
    }
    console.log(`Serving static files from: ${distPath}`);
    app.use(import_express.default.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer().catch((err) => {
  console.error("Critical server startup error:", err);
  process.exit(1);
});
//# sourceMappingURL=server.cjs.map
