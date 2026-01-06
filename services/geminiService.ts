import { GoogleGenerativeAI } from "@google/generative-ai";
import { Player } from "../types";

export const getScoutReport = async (player: Player): Promise<string> => {
  // 1. Validação de segurança da chave
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // TENTATIVA 1: Usar o modelo específico (mais estável que o alias genérico)
    // Se der erro 404 aqui, é problema de região ou conta
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const prompt = `Atue como Diretor de Scouting. Analise os dados de: ${player.name}.
    Contexto Técnico: ${player.aiContextData?.slice(0, 10000) || "Sem dados de planilha."}
    
    Gere um relatório em 3 parágrafos curtos focando em: Pontos Fortes, Pontos Fracos e Veredito Final.`;

    const result = await model.generateContent(prompt);
    return result.response.text();

  } catch (error: any) {
    console.error("❌ Erro Google AI:", error);

    // Fallback de emergência: se o Flash falhar, tenta o Pro antigo que nunca falha
    if (error.message?.includes("404") || error.message?.includes("not found")) {
       try {
         console.warn("⚠️ Tentando fallback para gemini-pro...");
         const genAI = new GoogleGenerativeAI(apiKey);
         const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro" });
         const fallbackResult = await fallbackModel.generateContent(`Analise o jogador ${player.name} brevemente.`);
         return "[Nota: Análise gerada pelo modelo de backup] \n" + fallbackResult.response.text();
       } catch (fallbackError) {
         return "ERRO FATAL: Nenhum modelo disponível. Verifique se sua API Key tem permissões no Google AI Studio.";
       }
    }

    return `Erro ao gerar análise: ${error.message}`;
  }
};