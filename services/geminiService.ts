
import { GoogleGenAI } from "@google/genai";
import { Player } from "../types";

export const getScoutReport = async (player: Player): Promise<string> => {
  if (!player.aiContextData) {
    return "ORIENTAÇÃO TÁTICA: Para gerar uma análise de performance baseada em Big Data, anexe a planilha técnica (Excel/CSV) no cadastro.";
  }

  try {
    // Inicialização conforme diretrizes: usa process.env.API_KEY diretamente.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
      Atue como Head of Scouting do Porto Vitória FC.
      Analise o atleta ${player.name} (${player.position1}), ${player.age} anos.
      Dados métricos: ${player.aiContextData}
      Missão: Gere um parecer técnico de elite em no máximo 2 frases curtas sobre potencial e encaixe tático.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
    });

    return response.text || "Análise concluída.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "SISTEMA INSTÁVEL: Erro ao processar inteligência artificial.";
  }
};
