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

    Instrução de Análise Técnica de Desempenho

Com base APENAS nos dados fornecidos e na posição do jogador, gere um relatório técnico seguindo esta estrutura:

PERFIL E ESTILO DE JOGO:

Descreva o arquétipo do jogador (ex: "meia box-to-box", "zagueiro de antecipação", "centroavante de referência").

Como ele se comporta com e sem a bola com base no volume das métricas apresentadas?

ANÁLISE DE KPIs POR SETOR:

Fase Ofensiva: (Finalização, drible, participação em gols).

Fase de Construção: (Passes curtos/longos, passes progressivos, precisão).

Fase Defensiva: (Desarmes, interceptações, duelos ganhos). Cite números específicos e porcentagens para validar a análise.

PONTOS FORTES (Destaques Estatísticos):

Liste as métricas onde o jogador está acima da média esperada para sua posição.

PONTOS DE ATENÇÃO / MELHORIA:

Identifique lacunas técnicas ou falta de volume em ações cruciais para a função dele.
Diretrizes Estritas:

Trate o caractere "-" como valor "0".

Se houver poucos dados, priorize a análise de eficiência (porcentagens) sobre o volume (números totais).

Se não houver dados, responda: "Dados insuficientes para análise. Favor atualizar o cadastro do atleta."

Linguagem: Técnica, imparcial, direta e sem adjetivos vazios (como "espetacular" ou "incrível"). Use termos como "eficiente", "consistente", "baixo volume".

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