
import { GoogleGenAI } from "@google/genai";
import { Player } from "../types";

const getAIInstance = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") return null;
  return new GoogleGenAI({ apiKey });
};

export const getScoutReport = async (player: Player): Promise<string> => {
  if (!player.aiContextData) {
    return "ORIENTAÇÃO TÁTICA: Para gerar uma análise de performance baseada em Big Data, anexe a planilha técnica (Excel/CSV) no cadastro. Sem esses dados, a IA não pode realizar cruzamentos métricos.";
  }

  try {
    const ai = getAIInstance();
    if (!ai) return "AVISO: Configure a API_KEY na Vercel para ativar a análise inteligente.";

    const prompt = `
      Você é o Head of Scouting do Porto Vitória FC.
      Analise o atleta ${player.name} (${player.position1}) de ${player.age} anos.
      Atributos: Ritmo ${player.stats.pace}, Finalização ${player.stats.shooting}, Passe ${player.stats.passing}, Dribble ${player.stats.dribbling}, Defesa ${player.stats.defending}, Físico ${player.stats.physical}.
      
      DADOS DE PLANILHA:
      ${player.aiContextData}
      
      MISSÃO:
      Gere um parecer tático de ELITE (curto e profissional) em 3 frases. 
      Foque no potencial de mercado.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "Análise concluída.";
  } catch (error) {
    return "SISTEMA INSTÁVEL: Erro ao processar IA.";
  }
};
