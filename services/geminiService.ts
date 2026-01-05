
import { GoogleGenAI } from "@google/genai";
import { Player } from "../types";

export const getScoutReport = async (player: Player): Promise<string> => {
  if (!player.aiContextData) {
    return "DADOS AUSENTES: Para uma análise tática detalhada, anexe a planilha de scouting no cadastro do atleta.";
  }

  try {
    // Inicialização rigorosa conforme diretrizes de senioridade
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // O modelo Pro é ideal para análise de dados tabulares (CSV/Excel)
    const modelName = 'gemini-3-pro-preview';

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{
        parts: [{
          text: `Você é o Diretor Técnico do Porto Vitória FC. Analise os dados de scout (formato CSV) do atleta ${player.name} (${player.position1}) extraídos da planilha de performance.
          
          DADOS DA PLANILHA:
          ${player.aiContextData.slice(0, 12000)}
          
          INSTRUÇÕES:
          1. Identifique padrões de comportamento tático baseados nos números.
          2. Destaque 3 pontos fortes e 1 ponto de atenção (correção necessária).
          3. Emita um veredito técnico sobre a viabilidade de contratação ou promoção para o time principal.
          4. Use terminologia profissional (ex: 'bloco baixo', 'entrelinhas', 'progressão', 'duelos aéreos').
          5. Responda em 3 parágrafos curtos e diretos.`
        }]
      }],
      config: {
        temperature: 0.4,
        topP: 0.9,
      },
    });

    const result = response.text;
    if (!result) throw new Error("A IA não gerou uma resposta válida.");

    return result;

  } catch (error: any) {
    console.error("Falha Crítica Gemini:", error);
    
    // Fallback amigável mas informativo
    if (error.message?.includes("API Key")) {
      return "SISTEMA DE SEGURANÇA: A chave de API não foi detectada no ambiente. Verifique as configurações de variáveis de sistema.";
    }
    
    return `ERRO TÉCNICO: Não foi possível processar a análise da planilha neste momento. (Detalhes: ${error.message})`;
  }
};
