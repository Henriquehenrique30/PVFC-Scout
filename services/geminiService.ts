
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Player } from "../types";

export const getScoutReport = async (player: Player): Promise<string> => {
  if (!player.aiContextData) {
    return "RELATÓRIO PENDENTE: Vincule a planilha de scouting no cadastro do atleta para processar a análise tática.";
  }

  // 1. Recuperação da chave injetada pelo Vite/Vercel
  const apiKey = process.env.API_KEY;

  // 2. Debug da Chave (Mascarado)
  if (apiKey) {
    console.log(`[DEBUG IA] Chave detectada (início): ${apiKey.substring(0, 5)}...`);
  } else {
    console.warn("[DEBUG IA] Nenhuma chave detectada em process.env.API_KEY");
  }

  try {
    // Inicialização obrigatória conforme as diretrizes
    const ai = new GoogleGenAI({ apiKey: apiKey || '' });
    
    /**
     * MODELO: gemini-3-flash-preview 
     * Escolhido por ser o modelo de última geração com maior estabilidade para chaves free/tier 1.
     * Substitui o pro-preview para evitar erros de permissão de faturamento.
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

    const report = response.text;
    if (!report) throw new Error("A IA retornou uma resposta vazia.");

    return report;

  } catch (error: any) {
    // 3. Log de Erro Real para Diagnóstico no Vercel/Navegador
    console.error("Erro detalhado da API Google:", error);
    
    // Identificação de erro de autenticação ou modelo inexistente
    if (
      error.message?.includes("API key") || 
      error.message?.includes("Requested entity was not found") || 
      error.message?.includes("403") ||
      !apiKey
    ) {
      throw new Error("API_KEY_MISSING");
    }
    
    return `FALHA NA ANÁLISE: Erro ao processar dados. (Status: ${error.message || 'Erro Desconhecido'})`;
  }
};
