// Fix: Use GoogleGenAI from @google/genai instead of groq-sdk
import { GoogleGenAI } from "@google/genai";
import { Player } from "../types";

// --- FUNÇÃO EXISTENTE (REATORADA PARA GEMINI) ---
// Fix: Use Gemini model and process.env.API_KEY for scout report
export const getScoutReport = async (player: Player): Promise<string> => {
  // Fix: Initialize GoogleGenAI instance with the required process.env.API_KEY exclusively
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const prompt = `
    Atue como um Analista de Desempenho Sênior de um clube de futebol. 
    Sua tarefa é analisar os dados estatísticos brutos abaixo (extraídos de uma planilha de scout) e criar um perfil técnico detalhado do atleta.

    DADOS DO ATLETA:
    - Nome: ${player.name}
    - Posição: ${player.position1}
    - Idade: ${player.age}
    
    DADOS ESTATÍSTICOS DA PLANILHA (CSV):
    """
    ${player.aiContextData?.slice(0, 8000) || "Nenhum dado de planilha anexado."}
    """

    Com base APENAS nos dados acima e na posição do jogador, gere um relatório técnico seguindo estritamente esta estrutura:

    1. **CARACTERÍSTICAS DO JOGADOR**:
       Descreva o perfil geral do atleta, seu estilo de jogo e como ele se comporta em campo baseando-se nos números apresentados.

    2. **PONTOS FORTES**:
       Liste as qualidades que se destacam nos dados (ex: altas porcentagens de acerto, bons números defensivos ou ofensivos). Seja específico citando métricas se possível.

    3. **PONTOS FRACOS / ATENÇÃO** (Se houver):
       Aponte deficiências ou áreas onde os dados mostram desempenho abaixo da média ou que precisam de evolução.

    Diretrizes:
    - Seja direto, técnico e imparcial.
    - Se os dados da planilha forem insuficientes ou vazios, diga que não é possível realizar uma análise profunda e faça uma avaliação baseada apenas na posição e perfil físico básico.
    `;

    // Fix: Using gemini-3-pro-preview for complex reasoning tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        temperature: 0.4,
      },
    });

    // Fix: Accessing generated text using the .text property
    return response.text || "A IA não retornou uma resposta válida.";

  } catch (error: any) {
    console.error("❌ Erro Gemini:", error);
    return `Erro ao gerar relatório: ${error.message}`;
  }
};

// --- NOVA FEATURE: COMPARAÇÃO (DATA LAB) ---

export interface ComparisonCandidate {
  id: string;
  name: string;
  data: any; // Dados brutos do Excel/CSV
}

// Fix: Use Gemini model and process.env.API_KEY for player comparison
export const comparePlayersWithAI = async (candidates: ComparisonCandidate[]): Promise<string> => {
  // Fix: Initialize GoogleGenAI instance with the required process.env.API_KEY exclusively
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    // Prepara os dados para a IA ler
    const dataString = candidates.map(c => 
      `JOGADOR: ${c.name}\nDADOS ESTATÍSTICOS (JSON):\n${JSON.stringify(c.data, null, 2)}`
    ).join("\n\n--------------------------------\n\n");

    const prompt = `
    Atue como um Head de Data Science de Futebol.
    
    OBJETIVO: Realizar uma batalha de dados estatísticos entre os seguintes jogadores para determinar qual possui o melhor desempenho global.
    
    JOGADORES E SEUS DADOS:
    ${dataString}

    INSTRUÇÕES DE ANÁLISE:
    1. Ignore formatações de arquivo. Foque estritamente nos NÚMEROS e MÉTRICAS encontrados.
    2. Crie um comparativo técnico direto:
       - Compare eficiência ofensiva (Gols, xG, assistências, finalizações...).
       - Compare eficiência defensiva (Desarmes, interceptações, duelos ganhos...).
       - Compare eficiência de construção (Passes, progressão, visão...).
    3. Identifique o "Vencedor" em cada categoria principal relevante para os dados apresentados.
    4. VEREDICTO FINAL: Com base puramente matemática, qual jogador é a melhor escolha? Justifique.

    FORMATO DA RESPOSTA:
    Use Markdown. Utilize tabelas comparativas se possível. Seja extremamente técnico e baseie-se apenas na evidência dos dados.
    `;

    // Fix: Using gemini-3-pro-preview for complex data analysis tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        temperature: 0.2, // Temperatura baixa para máxima precisão matemática
      },
    });

    // Fix: Accessing generated text using the .text property
    return response.text || "Erro na comparação.";

  } catch (error: any) {
    console.error("❌ Erro Comparação Gemini:", error);
    return `Erro ao processar comparação: ${error.message}`;
  }
};