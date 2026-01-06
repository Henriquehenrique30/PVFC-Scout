import { GoogleGenerativeAI } from "@google/generative-ai";
import { Player } from "../types";

export const getScoutReport = async (player: Player): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
  
  if (!apiKey) throw new Error("API Key não encontrada");

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Usando o modelo "arroz com feijão" que funciona 100%
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(`Analise o jogador ${player.name}.`);
    return result.response.text();

  } catch (error: any) {
    console.error("❌ Erro:", error);
    return `Erro: ${error.message}`;
  }
};