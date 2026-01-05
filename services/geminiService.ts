
import { GoogleGenAI } from "@google/genai";
import { Player } from "../types";

export const getScoutReport = async (player: Player): Promise<string> => {
  if (!player.aiContextData) {
    return "RELATÓRIO PENDENTE: Vincule a planilha de scouting no cadastro do atleta para processar a análise tática.";
  }

  try {
    // Acesso seguro à chave conforme diretrizes da plataforma
    const key = typeof process !== 'undefined' ? process.env.API_KEY : undefined;
    
    if (!key) {
      throw new Error("Chave de API não configurada. Clique em 'Configurar IA' no card do atleta.");
    }

    const ai = new GoogleGenAI({ apiKey: key });
    
    // gemini-3-pro-preview é o modelo ideal para análise complexa de planilhas
    const modelName = 'gemini-3-pro-preview';

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{
        parts: [{
          text: `Você é o Diretor de Inteligência do Porto Vitória FC. 
          Tarefa: Analise os dados técnicos brutos do atleta ${player.name} (${player.position1}) extraídos da planilha Excel vinculada.
          
          DADOS DA PLANILHA (CONTEXTO REAL):
          ${player.aiContextData.slice(0, 15000)}
          
          INSTRUÇÕES DE ANÁLISE:
          1. Baseie-se ESTRITAMENTE nos dados acima.
          2. Identifique tendências de desempenho (ex: xG alto, baixa taxa de duelos ganhos, etc).
          3. Avalie se o perfil técnico condiz com a categoria "${player.recommendation}".
          4. Emita um parecer tático de scout profissional em 3 parágrafos curtos.
          5. Use linguagem de mercado (ex: 'valências', 'transição agressiva', 'mapa de calor', 'terço médio').`
        }]
      }],
      config: {
        temperature: 0.3, // Mais factual e menos criativo para análise de dados
        topP: 0.8,
      },
    });

    const report = response.text;
    if (!report) throw new Error("A IA não conseguiu gerar o relatório com os dados fornecidos.");

    return report;

  } catch (error: any) {
    console.error("Erro no Scout IA:", error);
    
    if (error.message.includes("API Key") || error.message.includes("403") || error.message.includes("401")) {
      return "SISTEMA BLOQUEADO: A chave de API do Gemini não foi detectada ou é inválida. Clique no botão 'CONFIGURAR IA' acima para vincular sua chave do Google AI Studio.";
    }
    
    return `FALHA NA ANÁLISE: Ocorreu um erro ao processar os dados da planilha. Certifique-se de que o arquivo Excel contém métricas legíveis. (Erro: ${error.message})`;
  }
};
