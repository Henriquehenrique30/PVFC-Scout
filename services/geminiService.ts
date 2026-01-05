import { GoogleGenAI } from "@google/genai";
import { Player } from "../types";

// Fix: Initializing GoogleGenAI with named parameters as per the latest SDK guidelines.
// Assuming process.env.API_KEY is pre-configured and valid in the environment.
const getAIInstance = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
};

export const getScoutReport = async (player: Player): Promise<string> => {
  if (!player.aiContextData) {
    return "ORIENTAÇÃO TÁTICA: Para gerar uma análise de performance baseada em Big Data, anexe a planilha técnica (Excel/CSV) no cadastro. Sem esses dados, a IA não pode realizar cruzamentos métricos.";
  }

  try {
    const ai = getAIInstance();

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

    // Fix: Selecting 'gemini-3-pro-preview' for advanced reasoning and tactical analysis tasks.
    // Fix: Using the simplified generateContent call without pre-defining the model.
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
    });

    // Fix: Accessing .text as a property, not a method, as per the correct GenerateContentResponse interface.
    return response.text || "Análise concluída.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "SISTEMA INSTÁVEL: Erro ao processar IA.";
  }
};