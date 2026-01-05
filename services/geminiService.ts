
import { GoogleGenAI } from "@google/genai";
import { Player } from "../types";

export const getScoutReport = async (player: Player): Promise<string> => {
  if (!player.aiContextData) {
    return "ORIENTAÇÃO TÁTICA: Para gerar uma análise de performance baseada em Big Data, anexe a planilha técnica (Excel/CSV) no cadastro. Sem esses dados, a IA não pode realizar cruzamentos métricos.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
      Você é o Head of Scouting do Porto Vitória FC.
      Analise o atleta ${player.name} (${player.position1}) de ${player.age} anos.
      Atributos: Ritmo ${player.stats.pace}, Finalização ${player.stats.shooting}, Passe ${player.stats.passing}, Dribble ${player.stats.dribbling}, Defesa ${player.stats.defending}, Físico ${player.stats.physical}.
      
      DADOS DE PLANILHA:
      ${player.aiContextData}
      
      MISSÃO:
      Gere um parecer tático de ELITE (curto e profissional) em no máximo 3 frases curtas. 
      Foque estritamente no potencial de mercado e encaixe técnico.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "Análise concluída com sucesso.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "SISTEMA EM MANUTENÇÃO: Tente novamente em alguns instantes.";
  }
};
