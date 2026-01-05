
import { GoogleGenAI } from "@google/genai";
import { Player } from "../types";

export const getScoutReport = async (player: Player): Promise<string> => {
  // Fallback imediato se não houver dados
  if (!player.aiContextData) {
    return "ANÁLISE PENDENTE: Vincule a planilha de scout para gerar o parecer técnico detalhado.";
  }

  try {
    // Inicialização segura
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    
    const prompt = `Atue como Head Scout do Porto Vitória FC. Analise: ${player.name} (${player.position1}). Métricas: ${player.aiContextData.slice(0, 3000)}. Gere um parecer de elite (2 frases curtas) sobre mercado e tática.`;

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        temperature: 0.6,
        topP: 0.9,
      }
    });

    const responseText = result.text;
    
    if (!responseText) throw new Error("Resposta vazia");
    
    return responseText;

  } catch (error) {
    console.error("Erro na IA:", error);
    
    // Fallback Inteligente: Se a IA falhar, gera um parecer baseado nos stats fixos do jogador
    const avg = (player.stats.pace + player.stats.shooting + player.stats.passing + player.stats.dribbling + player.stats.defending + player.stats.physical) / 6;
    return `PARECER TÉCNICO: Atleta com média de rendimento ${avg.toFixed(1)}/5.0. Apresenta valências compatíveis com o modelo de jogo do Porto Vitória, com destaque para sua capacidade de ${player.stats.pace > 4 ? 'aceleração' : 'equilíbrio tático'} no setor de ${player.position1}.`;
  }
};
