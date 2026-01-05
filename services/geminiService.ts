
import { GoogleGenAI } from "@google/genai";
import { Player } from "../types";

export const getScoutReport = async (player: Player): Promise<string> => {
  if (!player.aiContextData) {
    return "AVISO: Nenhum dado de planilha detectado. Para uma análise profunda, anexe o arquivo Excel/CSV no cadastro do atleta.";
  }

  try {
    // Inicialização rigorosa conforme documentação
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Preparação do contexto técnico
    const technicalContext = player.aiContextData.slice(0, 8000); // Limite de segurança para tokens

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ 
        parts: [{ 
          text: `Você é o Analista de Desempenho Sênior do Porto Vitória FC. 
          Tarefa: Analise os dados técnicos brutos (CSV) abaixo do atleta ${player.name} (${player.position1}).
          
          DADOS DA PLANILHA:
          ${technicalContext}
          
          REQUISITOS DA RESPOSTA:
          1. Identifique os 3 principais indicadores de performance (KPIs) positivos nos dados.
          2. Aponte uma fragilidade tática ou métrica abaixo da média.
          3. Conclua se o atleta atende ao nível "Elite" do Porto Vitória.
          4. Use linguagem técnica de scout (ex: 'terço final', 'transição', 'xG', 'interceptações').
          5. Máximo de 3 parágrafos curtos.` 
        }] 
      }],
      config: {
        temperature: 0.4, // Menos criativo, mais analítico/factual
        topP: 0.8,
      },
    });

    const report = response.text;
    if (!report) throw new Error("IA retornou resposta vazia");

    return report;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return `ERRO DE PROCESSAMENTO: Não foi possível ler os dados da planilha via IA. Verifique se o arquivo Excel contém dados legíveis ou se a chave de API está ativa. Detalhes: ${error.message}`;
  }
};
