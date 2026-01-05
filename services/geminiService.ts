
import { GoogleGenAI } from "@google/genai";
import { Player } from "../types";

export const getScoutReport = async (player: Player): Promise<string> => {
  if (!player.aiContextData) {
    return "DADOS INSUFICIENTES: Para uma análise tática baseada em IA, anexe a planilha técnica no cadastro do atleta.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Limita o contexto para evitar erros de limite de tokens e instabilidade
    const technicalData = player.aiContextData.slice(0, 5000);

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Análise solicitada para o atleta: ${player.name} (${player.position1}). Dados técnicos disponíveis: ${technicalData}`,
      config: {
        systemInstruction: "Você é o Diretor de Scouting do Porto Vitória FC. Sua função é analisar dados de planilhas e gerar pareceres técnicos de elite. Responda com no máximo 2 frases curtas, focando exclusivamente no potencial de mercado e encaixe tático.",
        temperature: 0.7,
      },
    });

    return response.text || "Análise concluída com sucesso.";
  } catch (error) {
    console.error("Gemini API Critical Error:", error);
    // Retorno amigável em caso de erro de rede ou API
    return "SISTEMA EM MANUTENÇÃO: O processamento de IA está temporariamente instável. Tente novamente em alguns segundos.";
  }
};
