import Groq from "groq-sdk";
import { Player } from "../types";

// --- FUNÇÃO EXISTENTE (NÃO MODIFICADA) ---
export const getScoutReport = async (player: Player): Promise<string> => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
  
  if (!apiKey) throw new Error("Chave da Groq não encontrada (VITE_GROQ_API_KEY).");

  try {
    const groq = new Groq({ 
      apiKey: apiKey,
      dangerouslyAllowBrowser: true 
    });

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
    - Seja direto, técnico e imparcial, mesmo que tenha pouca amostra de dados.
    - Se não houver dados, diga que não foi possível avaliar e pedir para atualziar o cadastro do jogador quando os dados estiver disponíveis, se amostragem de dados for pequena tentar da mesma forma analisar os dados, não precisa dizer que a amostragem de dados é pequena, apenas análise, caso não tenha nenhum dados informa para inserir mais dados. 
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile", 
      temperature: 0.4,
      max_tokens: 1024,
    });

    return chatCompletion.choices[0]?.message?.content || "A IA não retornou uma resposta válida.";

  } catch (error: any) {
    console.error("❌ Erro Groq:", error);
    return `Erro ao gerar relatório: ${error.message}`;
  }
};

// --- NOVA FEATURE: COMPARAÇÃO (DATA LAB) ---

export interface ComparisonCandidate {
  id: string;
  name: string;
  data: any; // Dados brutos do Excel/CSV
}

export const comparePlayersWithAI = async (candidates: ComparisonCandidate[]): Promise<string> => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
  
  if (!apiKey) throw new Error("Chave da Groq não encontrada.");

  try {
    const groq = new Groq({ 
      apiKey: apiKey,
      dangerouslyAllowBrowser: true 
    });

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

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile", // Modelo potente para análise de dados complexos
      temperature: 0.2, // Temperatura baixa para máxima precisão matemática
      max_tokens: 2048,
    });

    return chatCompletion.choices[0]?.message?.content || "Erro na comparação.";

  } catch (error: any) {
    console.error("❌ Erro Comparação Groq:", error);
    return `Erro ao processar comparação: ${error.message}`;
  }
};