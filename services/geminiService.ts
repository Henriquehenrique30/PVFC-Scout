// ATENÇÃO: AQUI MUDOU A IMPORTAÇÃO PARA A BIBLIOTECA OFICIAL
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Player } from "../types";

export const getScoutReport = async (player: Player): Promise<string> => {
  if (!player.aiContextData) {
    return "RELATÓRIO PENDENTE: Vincule a planilha de scouting no cadastro do atleta para processar a análise tática.";
  }

  // 1. Recuperação da chave
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY;

  console.log("Status da Chave:", apiKey ? `Carregada (${apiKey.substring(0, 5)}...)` : "Não encontrada");

  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  try {
    // 2. Inicialização com a biblioteca OFICIAL (@google/generative-ai)
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Usando o modelo padrão que FUNCIONA
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash" 
    });

    const prompt = `Tarefa: Analise os dados técnicos brutos do atleta ${player.name} (${player.position1}) extraídos da planilha Excel.
          
          DADOS DA PLANILHA:
          ${player.aiContextData.slice(0, 15000)}
          
          INSTRUÇÕES:
          1. Identifique tendências de desempenho.
          2. Emita um parecer tático profissional em 3 parágrafos.
          3. Assuma a persona de Diretor de Inteligência do Porto Vitória FC.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text;

  } catch (error: any) {
    console.error("❌ Erro da API Google:", error);
    
    if (error.message?.includes("404")) {
        return "ERRO DE MODELO: O modelo não foi encontrado. Verifique se a biblioteca instalada é '@google/generative-ai'.";
    }
    
    return `FALHA NA ANÁLISE: ${error.message}`;
  }
};