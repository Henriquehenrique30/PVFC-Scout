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

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      // AQUI ESTÁ A MUDANÇA: Usando o modelo mais novo e potente (Llama 3.3)
      model: "llama-3.3-70b-versatile", 
      temperature: 0.5,
    });

    return chatCompletion.choices[0]?.message?.content || "Sem resposta da IA.";

  } catch (error: any) {
    console.error("❌ Erro Groq:", error);
    return `Erro ao gerar relatório: ${error.message}`;
  }
};