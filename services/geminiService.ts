import { GoogleGenerativeAI } from "@google/generative-ai";
import { Player } from "../types";

export const getScoutReport = async (player: Player): Promise<string> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) throw new Error("Chave não encontrada");

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    // --- DIAGNÓSTICO DE MODELOS ---
    // Vamos tentar listar o que está disponível para sua conta
    console.log("🔍 Verificando modelos disponíveis...");
    
    // Tenta uma chamada direta para testar a conexão
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    try {
      const result = await model.generateContent(`Teste rápido de conexão.`);
      return result.response.text();
    } catch (innerError: any) {
      console.error("❌ Falha no flash. Tentando listar modelos oficiais...");
      // Se falhar, vamos tentar descobrir o motivo real, se é bloqueio ou nome
      return `ERRO GOOGLE: ${innerError.message}. \n(Verifique se a API 'Generative Language' está ativada no Google Cloud Console do projeto 'novo projeto v2').`;
    }

  } catch (error: any) {
    return `ERRO CRÍTICO: ${error.message}`;
  }
};