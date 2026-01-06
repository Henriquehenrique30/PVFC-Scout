import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Player } from "../types";

export const getScoutReport = async (player: Player): Promise<string> => {
  if (!player.aiContextData) {
    return "RELATÓRIO PENDENTE: Vincule a planilha de scouting no cadastro do atleta para processar a análise tática.";
  }

  // AQUI FOI A MUDANÇA PRINCIPAL: Usamos a chave injetada pelo Vite
  const apiKey = process.env.API_KEY;

  console.log("Status da Chave:", apiKey ? `Carregada (${apiKey.substring(0, 5)}...)` : "Não encontrada");

  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // AQUI ESTAVA O ERRO: Mudamos de "gemini-3" (que não existe) para "gemini-1.5-flash"
    const modelName = 'gemini-1.5-flash';

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: `Tarefa: Analise os dados técnicos brutos do atleta ${player.name} (${player.position1}) extraídos da planilha Excel vinculada.
          
          DADOS DA PLANILHA (CONTEXTO):
          ${player.aiContextData.slice(0, 15000)}
          
          INSTRUÇÕES DE ANÁLISE:
          1. Baseie-se estritamente nos dados fornecidos acima.
          2. Identifique tendências de desempenho e valências técnicas.
          3. Emita um parecer tático profissional em 3 parágrafos curtos para o departamento de scout.`,
      config: {
        systemInstruction: "Você é o Diretor de Inteligência do Porto Vitória FC, especialista em análise de dados e prospecção de talentos.",
        temperature: 0.3,
        topP: 0.8,
      },
    });

    const report = response.text;
    if (!report) throw new Error("A IA retornou uma resposta vazia.");

    return report;

  } catch (error: any) {
    console.error("Erro detalhado da API Google:", error);
    
    if (error.message?.includes("API key") || error.message?.includes("403")) {
      throw new Error("API_KEY_MISSING");
    }
    // Tratamento para erro de modelo não encontrado
    if (error.message?.includes("404") || error.message?.includes("not found")) {
      return "FALHA TÉCNICA: Modelo não encontrado (verifique se está usando gemini-1.5-flash).";
    }
    
    return `FALHA NA ANÁLISE: Erro ao processar dados. (${error.message})`;
  }
};