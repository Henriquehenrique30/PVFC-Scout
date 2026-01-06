import Groq from "groq-sdk";
import { Player } from "../types";

export const getScoutReport = async (player: Player): Promise<string> => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
  
  if (!apiKey) throw new Error("Chave da Groq não encontrada (VITE_GROQ_API_KEY).");

  try {
    const groq = new Groq({ 
      apiKey: apiKey,
      dangerouslyAllowBrowser: true 
    });

    // Prompt ajustado para focar na análise dos dados da planilha
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

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile", 
      temperature: 0.4, // Temperatura um pouco mais baixa para ser mais analítico e menos criativo
      max_tokens: 1024,
    });

    return chatCompletion.choices[0]?.message?.content || "A IA não retornou uma resposta válida.";

  } catch (error: any) {
    console.error("❌ Erro Groq:", error);
    return `Erro ao gerar relatório: ${error.message}`;
  }
};