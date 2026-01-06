
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Player } from "../types";

export const getScoutReport = async (player: Player): Promise<string> => {
  if (!player.aiContextData) {
    return "RELATÓRIO PENDENTE: Vincule a planilha de scouting no cadastro do atleta para processar a análise tática.";
  }

  // 1. Recuperação da chave via process.env.API_KEY (injetada pelo Vite define)
  const apiKey = process.env.API_KEY;

  // 2. Log de Diagnóstico solicitado pelo usuário
  console.log("Status da Chave:", apiKey ? `Carregada (${apiKey.substring(0, 5)}...)` : "Não encontrada");

  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  try {
    // Inicialização conforme diretrizes oficiais
    const ai = new GoogleGenAI({ apiKey });
    
    /**
     * MODELO: gemini-3-flash-preview
     * Este é o modelo de alto desempenho e compatibilidade universal.
     * Substitui o 1.5-flash com maior inteligência e suporte a system instructions.
     */
    const modelName = 'gemini-3-flash-preview';

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
        systemInstruction: "Você é o Diretor de Inteligência do Porto Vitória FC, especialista em análise de dados e prospecção de talentos.",
        temperature: 0.3,
        topP: 0.8,
      },
    });

    // Acesso direto à propriedade .text conforme as diretrizes do SDK
    const report = response.text;
    if (!report) throw new Error("A IA retornou uma resposta vazia.");

    return report;

  } catch (error: any) {
    // 3. Log de Erro Real/Detalhado da API Google solicitado para diagnóstico
    console.error("Erro detalhado da API Google:", error);
    
    // Tratamento de erros de autenticação ou quota
    if (
      error.message?.includes("API key") || 
      error.message?.includes("403") ||
      error.message?.includes("401")
    ) {
      throw new Error("API_KEY_MISSING");
    }

    if (error.message?.includes("404") || error.message?.includes("model")) {
      return "FALHA TÉCNICA: O modelo solicitado não foi encontrado ou não está disponível para esta chave.";
    }
    
    return `FALHA NA ANÁLISE: Erro ao processar dados. (Status: ${error.message || 'Erro Desconhecido'})`;
  }
};
