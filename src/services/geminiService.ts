import { getApiUrl } from '../lib/utils';

export const geminiService = {
  async generateText(prompt: string, systemInstruction?: string) {
    try {
      const response = await fetch(getApiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, systemInstruction }),
      });
      
      if (!response.ok) throw new Error('Failed to fetch AI response');
      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  },

  async extractPassengers(base64Data: string, mimeType: string) {
    try {
      const response = await fetch(getApiUrl('/api/extract-passengers'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Data, mimeType }),
      });
      
      if (!response.ok) throw new Error('Failed to extract passengers');
      return await response.json();
    } catch (error) {
      console.error("Extraction Error:", error);
      throw error;
    }
  }
};
