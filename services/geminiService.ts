
import Groq from "groq-sdk";
import { Player } from "../types";

export const getScoutReport = async (player: Player): Promise<string> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) throw new Error("API_KEY_MISSING");

  try {
    // Inicializa o Groq conforme o padrão original do projeto
    const groq = new Groq({ 
      apiKey, 
      dangerouslyAllowBrowser: true 
    });
    
    const prompt = `
    Atue como Diretor de Inteligência de Futebol do Porto Vitória FC. Analise este atleta para o nosso banco de dados:
    Nome: ${player.name}
    Posição: ${player.position1}
    Idade: ${player.age} anos
    Dados Técnicos Extraídos (Contexto): ${player.aiContextData?.slice(0, 8000) || "Sem dados detalhados."}

    Gere um relatório técnico direto e altamente profissional em 3 seções:
    1. **Análise de Perfil**: Características físicas e técnicas dominantes.
    2. **Leitura de Potencial**: Como ele se encaixa no futebol moderno.
    3. **Veredito de Mercado**: Recomendações para contratação ou monitoramento.

    Use um tom sério e técnico. Formate títulos em negrito (**Título**).
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Você é um analista de desempenho sênior especializado em scouting de futebol brasileiro."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
    });

    return chatCompletion.choices[0]?.message?.content || "Relatório vazio retornado pela IA.";

  } catch (error: any) {
    console.error("❌ Erro Groq:", error);
    throw new Error(`Erro na análise técnica: ${error.message}`);
  }
};
