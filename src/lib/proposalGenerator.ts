
import { generateAgentResponse } from "./gemini";

export interface CompanyInfo {
  name: string;
  niche: string;
  services: string[];
  tone?: "formal" | "criativo" | "persuasivo";
}

export async function generateMarketingProposal(info: CompanyInfo): Promise<string> {
  const prompt = `
    Aja como um especialista em Copywriting e Vendas de alto nível da agência S3 Mídia.
    Sua tarefa é criar uma PROPOSTA COMERCIAL de altíssima conversão para a empresa "${info.name}".
    
    DETALHES DA EMPRESA:
    - Nicho: ${info.niche}
    - Serviços Oferecidos: ${info.services.join(", ")}
    - Tom de Voz: ${info.tone || "persuasivo"}
    
    A S3 Mídia é uma agência que constrói projetos de design premium, branding, desenvolvimento web e marketing de performance. 

    Você DEVE retornar a resposta EXCLUSIVAMENTE em formato JSON VÁLIDO. NÃO adicione \`\`\`json no início nem nada do tipo, apenas o JSON puro, com a seguinte estrutura exata:

    {
      "cliente": "${info.name}",
      "nicho": "${info.niche}",
      "introducao": "Um parágrafo de introdução impactante, focando nos resultados premium que entregaremos.",
      "servicos": [
         { "nome": "Nome criativo do Serviço", "descricao": "Descrição curta de alto impacto comercial do serviço" }
      ],
      "investimentos": [
         { 
           "item": "Nome do Pacote ou Serviço",
           "valorOriginal": 4000, 
           "valorFinal": 2500,
           "recorrente": false
         }
      ],
      "investimentoTotal": "Texto de resumo como 'A partir de R$ 2.500'",
      "parcelamento": "Ex: Pix com 5% OFF ou 12x no cartão",
      "prazo": "Ex: 15 Dias Úteis"
    }

    Regras:
    1. Crie pelo menos 2 a 3 serviços no array "servicos".
    2. Crie a tabela "investimentos" alinhada aos serviços criados. No mínimo um item. Dê um valor ancorado (valorOriginal maior) e um valorFinal (menor) para gerar percepção de desconto/combo.
    3. RETORNE SOMENTE O TEXTO JSON VÁLIDO. Sem formatação markdown, sem comentários.
  `;

  try {
    const rawResponse = await generateAgentResponse(prompt);
    
    // Limpa possíveis blocos de formatação gerados pela IA (```json ... ```)
    let cleanedResponse = rawResponse.trim();
    if (cleanedResponse.startsWith('\`\`\`json')) {
      cleanedResponse = cleanedResponse.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    } else if (cleanedResponse.startsWith('\`\`\`')) {
       cleanedResponse = cleanedResponse.replace(/\`\`\`/g, '').trim();
    }

    // Valida se conseguiu gerar o JSON
    JSON.parse(cleanedResponse); 
    
    return cleanedResponse;
  } catch (error: any) {
    console.error("Erro na geração da proposta (JSON Parse):", error);
    throw new Error(`Falha ao gerar proposta estruturada com IA: ${error.message || "Erro desconhecido na montagem do JSON"}`);
  }
}
