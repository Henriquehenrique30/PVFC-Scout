import Groq from "groq-sdk";
import { Player } from "../types";

export const getScoutReport = async (player: Player): Promise<string> => {
  // 1. Pega a chave da Groq
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
  
  if (!apiKey) throw new Error("Chave da Groq não encontrada (VITE_GROQ_API_KEY).");

  try {
    // 2. Inicializa a Groq
    // 'dangerouslyAllowBrowser: true' é necessário porque estamos no front-end (Vite)
    const groq = new Groq({ 
      apiKey: apiKey,
      dangerouslyAllowBrowser: true 
    });

    // 3. Monta o Prompt
    const prompt = `
    Atue como Diretor de Inteligência de Futebol. Analise este atleta:
    Nome: ${player.name}
    Posição: ${player.position1}
    Dados Técnicos (Contexto): ${player.aiContextData?.slice(0, 6000) || "Sem dados detalhados."}

    Gere um relatório técnico direto em 3 parágrafos:
    1. Análise Física e Técnica.
    2. Leitura Tática.
    3. Veredito Final (Contratar, Monitorar ou Dispensar).
    `;

    // 4. Chama o modelo Llama 3 (Muito rápido e inteligente)
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama3-8b-8192", // Modelo gratuito, rápido e excelente
      temperature: 0.5,
    });

    return chatCompletion.choices[0]?.message?.content || "Sem resposta da IA.";

  } catch (error: any) {
    console.error("❌ Erro Groq:", error);
    return `Erro ao gerar relatório: ${error.message}`;
  }
};