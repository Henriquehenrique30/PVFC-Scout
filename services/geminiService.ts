
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Player } from "../types";

export const getScoutReport = async (player: Player): Promise<string> => {
  if (!player.aiContextData) {
    return "RELATÓRIO PENDENTE: Vincule a planilha de scouting no cadastro do atleta para processar a análise tática.";
  }

  try {
    // Fix: Always initialize GoogleGenAI inside the function with process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Utilizando o modelo Gemini 3 Pro para análise de dados estruturados
    const modelName = 'gemini-3-pro-preview';

    // Fix: Correct usage of generateContent with simplified contents and systemInstruction in config
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
        systemInstruction: "Você é o Diretor de Inteligência do Porto Vitória FC.",
        temperature: 0.3,
        topP: 0.8,
      },
    });

    // Fix: Access response text property directly
    const report = response.text;
    if (!report) throw new Error("A IA não retornou conteúdo válido.");

    return report;

  } catch (error: any) {
    console.error("Erro na comunicação com Gemini API:", error);
    
    // Fix: Normalize error message for API key or missing resource to trigger selection dialog in UI
    if (error.message?.includes("API key") || error.message?.includes("Requested entity was not found") || !process.env.API_KEY) {
      throw new Error("API_KEY_MISSING");
    }
    
    return `FALHA NA ANÁLISE: Ocorreu um erro ao processar os dados da planilha. (Erro: ${error.message})`;
  }
};
