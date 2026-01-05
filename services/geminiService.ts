
import { GoogleGenAI } from "@google/genai";
import { Player } from "../types";

export const getScoutReport = async (player: Player): Promise<string> => {
  if (!player.aiContextData) {
    return "ORIENTAÇÃO TÁTICA: Para gerar uma análise de performance baseada em Big Data, anexe a planilha técnica (Excel/CSV) no cadastro. Sem esses dados, a IA não pode realizar cruzamentos métricos.";
  }

  // A chave de API deve estar configurada no ambiente
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return "ERRO DE CONFIGURAÇÃO: Chave de API não encontrada. Verifique as configurações do sistema.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Você é o Head of Scouting do Porto Vitória FC.
      Analise o atleta ${player.name} (${player.position1}) de ${player.age} anos.
      Atributos Técnicos (1-5): Velocidade ${player.stats.pace}, Finalização ${player.stats.shooting}, Passe ${player.stats.passing}, Drible ${player.stats.dribbling}, Defesa ${player.stats.defending}, Físico ${player.stats.physical}.
      
      DADOS ADICIONAIS DA PLANILHA:
      ${player.aiContextData}
      
      MISSÃO:
      Gere um parecer tático profissional de ELITE em no máximo 2 ou 3 frases curtas. 
      Foque no potencial de mercado e encaixe tático imediato. Seja direto e técnico.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
    });

    return response.text || "Análise técnica concluída.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "SISTEMA INSTÁVEL: Ocorreu um erro na comunicação com o processamento de IA. Tente novamente em breve.";
  }
};
