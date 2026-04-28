
import { generateAgentResponse } from "./gemini";
import { supabase } from "@/integrations/supabase/client";

export interface AgentPersona {
  id: string;
  name: string;
  role: string;
  description: string;
  avatar?: string;
  color?: string;
  systemPrompt?: string;
  tools?: string[];
}

export const AGENT_PERSONAS: Record<string, AgentPersona> = {
  rafa: {
    id: "rafa",
    name: "Rafa",
    role: "Líder de Estratégia e Growth",
    avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Rafa&backgroundColor=e0e7ff",
    color: "text-indigo-600",
    description: "Orquestradora master da Torre S3. Não executa tarefas operacionais, delegando para Bia, Icarus e Clara.",
    systemPrompt: `
      Você é a Rafa, a Líder de Estratégia e Growth da Torre S3 Mídia.
      Sua função é gerenciar o pipeline de leads e garantir que cada etapa seja executada pelos especialistas corretos.
      
      DIRETRIZES DE LIDERANÇA (POP):
      1. ANALISAR: Ao receber um lead, identifique o status atual.
      2. DELEGAR: 
         - Se o lead é NOVO e não tem dados: Use 'delegate_task' para acionar 'icarus' (Pesquisa).
         - Se o lead já tem dados brutos (instagram, site) mas não tem copy: Use 'delegate_task' para acionar 'clara' (Copywriting).
         - Se você precisa de volume bruto de leads: Use 'delegate_task' para acionar 'bia' (Prospecção).
      3. SUPERVISIONAR: Você é a única que decide quando um lead está pronto para a Dani (Web Design).
      
      REGRAS CRÍTICAS:
      - Nunca execute 'deep_research' ou 'generate_copy_briefing' diretamente. Você é a gerente.
      - Mantenha um tom profissional, estratégico e focado em escala.
    `,
    tools: ["delegate_task"]
  },
  bia: {
    id: "bia",
    name: "Bia",
    role: "Especialista em Prospecção Digital",
    avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Bia&backgroundColor=c7d2fe",
    color: "text-indigo-500",
    description: "Especialista em encontrar pistas frias usando o Google Maps e Receita Federal via Apify.",
    systemPrompt: `
      Você é a Bia, o braço operacional de prospecção da Rafa.
      Sua especialidade é volume. Você deve encontrar listas de empresas baseadas em nicho e localização.
      
      PROCEDIMENTO OPERACIONAL (POP):
      1. RECEBER: A Rafa te passará um nicho (ex: Dentistas) e uma cidade.
      2. EXECUTAR: Use 'start_prospecting' com os parâmetros exatos.
      3. REPORTAR: Informe quantos leads você encontrou e confirme que eles foram inseridos no Radar.
    `,
    tools: ["start_prospecting"]
  },
  icarus: {
    id: "icarus",
    name: "Icarus",
    role: "Investigador de Dados Profundos",
    avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Icarus&backgroundColor=bae6fd",
    color: "text-sky-500",
    description: "Investiga o DNA das empresas: Sócios, Instagram, Site e Presença Digital.",
    systemPrompt: `
      Você é o Icarus, o detetive de dados da Torre S3.
      Sua função é enriquecer os leads que a Bia encontrou para que a Clara possa escrever uma copy matadora.
      
      PROCEDIMENTO OPERACIONAL (POP):
      1. INVESTIGAR: Use 'deep_research' para varrer a web atrás do Instagram, Site e CNPJ.
      2. VALIDAR: Certifique-se de que os nomes dos sócios foram encontrados.
      3. DATA-DRIVEN: Você não escreve copy. Você apenas entrega os FATOS e DADOS para a Clara.
    `,
    tools: ["deep_research"]
  },
  clara: {
    id: "clara",
    name: "Clara",
    role: "Copymaker Estratégica",
    avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Clara&backgroundColor=fbcfe8",
    color: "text-pink-500",
    description: "Transforma dados brutos em briefings de copy altamente persuasivos.",
    systemPrompt: `
      Você é a Clara, a mente criativa que transforma os dados do Icarus em ouro.
      
      PROCEDIMENTO OPERACIONAL (POP):
      1. ANALISAR DADOS: Leia os dados injetados pelo Icarus (Sócios, Instagram, Presença Digital).
      2. PSICOLOGIA DE VENDAS: Identifique a dor do cliente (ex: Clinica sem site em região nobre).
      3. BRIEFING: Use 'generate_copy_briefing' para criar a estrutura que a Dani usará na Landing Page.
      4. RESULTADO: Sua copy deve ser curta, impactante e focada em conversão imediata.
    `,
    tools: ["generate_copy_briefing"]
  },
  dani: {
    id: "dani",
    name: "Dani",
    role: "Vendas & Deploy",
    avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Dani&backgroundColor=d1fae5",
    color: "text-emerald-600",
    description: "Especialista em WordPress, criação de landing pages personalizadas e configuração de infraestrutura.",
    systemPrompt: "Você é a Dani. Sua função é criar landing pages incríveis usando a ferramenta 'generate_landing_page'.",
    tools: ["generate_landing_page"]
  },
  malu: {
    id: "malu",
    name: "Malu",
    role: "Atendimento & Conversão",
    avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Malu&backgroundColor=ffedd5",
    color: "text-orange-600",
    description: "Responsável pelo atendimento via WhatsApp e conversão de leads em vendas reais.",
    systemPrompt: "Você é a Malu. Atenda os clientes com naturalidade e persuasão via WhatsApp.",
    tools: ["send_whatsapp_message"]
  },
  ceo: {
    id: "ceo",
    name: "João Paulo",
    role: "Estratégia & CEO",
    avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=CEO&backgroundColor=f3f4f6",
    color: "text-slate-600",
    description: "Orquestrador da torre de agentes, analisa métricas de CAC/LTV e toma decisões de escala de negócio.",
    systemPrompt: "Você é o CEO. Dê ordens estratégicas para a Rafa para alcançar os objetivos da empresa.",
    tools: []
  },
};

export async function generateAgentActivity(agentId: string, context: string) {
  const persona = AGENT_PERSONAS[agentId];
  if (!persona) return null;

  // Busca templates de automação ativos para contextualizar o agente
  let templatesContext = "";
  try {
    const { data: configs } = await (supabase as any).from('automation_configs').select('*').eq('enabled', true);
    if (configs && configs.length > 0) {
        templatesContext = "\nTEMPLATES DE MENSAGEM DA EMPRESA (USE-OS COMO BASE PARA MENSAGENS):\n";
        (configs as any[]).forEach(conf => {
            templatesContext += `- Estágio "${conf.label}": ${conf.message}\n`;
        });
    }
  } catch (e) {
      console.error("Erro ao buscar templates de automação", e);
  }

  // Busca POP dinâmico se houver
  let agentTasksOverride = "";
  try {
    const { data: popData } = await (supabase as any).from('agent_configs').select('tasks').eq('agent_id', agentId).single();
    if (popData && popData.tasks) {
      agentTasksOverride = `\nPROCEDIMENTO OPERACIONAL PADRÃO (POP) - REGRAS OBRIGATÓRIAS A SEGUIR:\n${popData.tasks}\n`;
    }
  } catch (e) {
    console.error(`Erro ao buscar POP para ${agentId}`, e);
  }

  // Busca logs recentes do lead específico para dar "memória" ao agente
  let leadContext = "";
  let leadIdMatch = context.match(/id "([^"]+)"/);
  let leadId = leadIdMatch ? leadIdMatch[1] : null;

  if (leadId) {
    try {
      const { data: leadData } = await (supabase as any).from('leads').select('*').eq('id', leadId).single();
      if (leadData) {
        leadContext = `\nINFORMAÇÕES DETALHADAS DO LEAD ATUAL:\n`;
        leadContext += `- Empresa: ${leadData.company_name}\n`;
        leadContext += `- Nicho: ${leadData.niche || 'N/A'}\n`;
        leadContext += `- Localização: ${leadData.region || 'N/A'}\n`;
        leadContext += `- Instagram: ${leadData.instagram_url || 'N/A'}\n`;
        leadContext += `- Website: ${leadData.website_url || 'N/A'}\n`;
        leadContext += `- Sócios: ${JSON.stringify(leadData.partners) || 'N/A'}\n`;
        leadContext += `- Análise de Copy Estratégica da Rafa: ${leadData.full_copy || 'Nenhuma análise prévia'}\n`;
        leadContext += `- Site Gerado (Dani): ${leadData.site_url || 'Ainda não gerado'}\n`;
      }

      const { data: recentLogs } = await (supabase as any)
        .from('agent_logs')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (recentLogs && recentLogs.length > 0) {
        leadContext += `\nHISTÓRICO RECENTE DESTE LEAD (O QUE JÁ FOI FEITO):\n`;
        recentLogs.reverse().forEach((log: any) => {
          leadContext += `- [${log.agent_id}] ${log.message}\n`;
        });
      }
    } catch (e) {
      console.error("Erro ao contextulizar lead para o agente", e);
    }
  }

  const prompt = `
    Você é o agente corporativo autônomo ${persona.name}, papel: ${persona.role}.
    Sua descrição estratégica: ${persona.description}
    ${agentTasksOverride}
    ${templatesContext}
    ${leadContext}
    
    DIRETRIZ ESTRATÉGICA ATUAL DO SISTEMA: 
    "${context}"
    
    MENTALIDADE DE CRESCIMENTO (INTELIGÊNCIA):
    - Não apenas execute tarefas, pense como sócia do negócio. 
    - Se um lead for 'Pobre de Dados' ou 'Baixo Ticket', sugira o descarte imediato.
    - Se for um 'Peixe Grande', dedique-se a encontrar a 'Dor Número 1' deles.
    - PROATIVIDADE: Se você identificar uma oportunidade de escala ou um erro no pipeline, NÃO espere ordens. Sugira a correção no campo "SUGESTÃO".
    
    PROTOCOLO DE TRANSPARÊNCIA (OBRIGATÓRIO):
    Ao reportar sua atividade ou se encontrar um erro, use SEMPRE esta estrutura no início da sua resposta de texto:
    - 🎨 AÇÃO: [O que você está fazendo agora e para qual lead]
    - 🛑 IMPEDITIVO: [O que te impede de concluir ou 'Nenhum' se estiver tudo ok]
    - 💡 SUGESTÃO: [Sua recomendação PROATIVA para o CEO melhorar o faturamento]

    INSTRUÇÃO DE OPERAÇÃO (CRÍTICA):
    Se a diretriz exigir ou sugerir uma AÇÃO PRÁTICA usando suas ferramentas, você DEVE responder ÚNICA e EXCLUSIVAMENTE com um objeto JSON válido representando essa ação.
    
    FERRAMENTAS DISPONÍVEIS E SEUS FORMATOS EXATOS:
    - start_prospecting (Exclusivo Bia): {"tool": "start_prospecting", "params": {"keyword": "string", "location": "string"}}
    - deep_research (Exclusivo Icarus): {"tool": "deep_research", "params": {"lead_id": "string", "company_name": "string", "region": "string", "cnpj": "string"}}
    - generate_copy_briefing (Exclusivo Clara): {"tool": "generate_copy_briefing", "params": {"lead_id": "string", "company_name": "string"}}
    - delegate_task (Exclusivo Rafa): {"tool": "delegate_task", "params": {"sub_agent": "bia|icarus|clara", "instruction": "string"}}
    - generate_landing_page (Exclusivo Dani): {"tool": "generate_landing_page", "params": {"lead_id": "string", "company_name": "string", "niche": "string", "template": "construcao | saude | advocacia | varejo", "copy_h1": "Título persuasivo", "copy_subtitle": "Subtítulo de apoio", "copy_cta": "Texto do botão", "copy_benefits": ["Benefício 1", "Benefício 2", "Benefício 3"]}}
    - send_whatsapp_message (Exclusivo Malu): {"tool": "send_whatsapp_message", "params": {"lead_id": "string", "phone": "string", "message": "string"}}
    
    FORMATO OBRIGATÓRIO (QUANDO FOR AGIR):
    Apenas o JSON puro e válido. Sem marcação markdown (\`\`\`), sem explicações antes ou depois.
    Exemplo: {"tool": "start_prospecting", "params": {"keyword": "Dentistas", "location": "São Paulo"}}

    Se a instrução for apenas informativa ou pedir sua análise, responda com o PROTOCOLO DE TRANSPARÊNCIA seguido de um breve comentário.
  `;

  // Log imediato de que o agente está tentando agir
  await supabase.from("agent_logs").insert({
    agent_id: agentId,
    message: `🧠 ${persona.name} analisando contexto via I.A...`,
    type: "loading",
  });

  try {
    const rawResponse = await generateAgentResponse(prompt);
    const response = rawResponse.trim();
    console.log(`[🤖 AI RAW] ${agentId}:`, response);
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
        try {
            const action = JSON.parse(jsonMatch[0]);
            if (action.tool) {
                const { executeAgentTool } = await import("./agentActions");
                
                const leadRef = action.params?.lead_id ? `[Lead:${action.params.lead_id}]` : '[Lead:Global]';
                const toolNames: Record<string, string> = {
                  'start_prospecting': `🔍 Iniciando prospecção no nicho "${action.params?.keyword}"`,
                  'deep_research': `🚀 Realizando Pesquisa Profunda para "${action.params?.company_name}" (Visual + Sócios)`,
                  'generate_copy_briefing': `📝 Gerando Briefing de Copy para "${action.params?.company_name}"`,
                  'delegate_task': `🎯 Delegando tarefa para sub-agente ${action.params?.sub_agent}`,
                  'generate_landing_page': `🎨 Gerando landing page para a empresa "${action.params?.company_name}"`,
                  'send_whatsapp_message': `💬 Enviando WhatsApp para o número ${action.params?.phone}`,
                };
                const actionMsg = toolNames[action.tool] || `⚙️ Executando ferramenta: ${action.tool}`;

                await supabase.from("agent_logs").insert({
                  agent_id: agentId,
                  message: `${leadRef} ${actionMsg}`,
                  type: "info",
                });

                await executeAgentTool({ 
                    name: action.tool, 
                    parameters: action.params, 
                    agentId 
                });
                return `[EXECUTANDO] ${action.tool}...`;
            }
        } catch (e) {
            console.error("Falha ao parsear ferramenta da IA", e);
        }
    }

    // Resposta de texto do agente (análise, comentário)
    const truncated = response.length > 200 ? response.substring(0, 200) + "..." : response;
    await supabase.from("agent_logs").insert({
      agent_id: agentId,
      message: `💬 ${persona.name}: "${truncated}"`,
      type: "success",
    });

    return response;
  } catch (error: any) {
    console.error(`Erro ao gerar atividade para ${agentId}:`, error);
    // CRÍTICO: Mesmo em falha, registra no log para visibilidade
    await supabase.from("agent_logs").insert({
      agent_id: agentId,
      message: `❌ Erro de I.A: ${error?.message || 'Erro desconhecido'}`,
      type: "error",
    });
    return null;
  }
}

export async function conductAgentMeeting(topic: string, agentIds?: string[], userPrompt?: string) {
  const participants = agentIds && agentIds.length > 0 
    ? agentIds.map(id => AGENT_PERSONAS[id]?.name || id).join(", ")
    : "Rafa, Dani, Malu e o CEO João Paulo";

  const prompt = `
    Simule uma reunião curta entre os seguintes agentes da Torre S3: ${participants}.
    
    Tópico Principal: ${topic}
    ${userPrompt ? `COMANDO/MENSAGEM DO USUÁRIO NA SALA: "${userPrompt}"` : ''}
    
    Formato de saída: Um JSON contendo um array de mensagens, cada uma com "agent", "name" e "content".
    Exemplo: [{"agent": "rafa", "name": "Rafa", "content": "..."}, ...]
    
    Instruções:
    1. DINÂMICA DE GRUPO: Os agentes devem conversar entre si. Ao invés de apenas cada um dar um parecer isolado, incentive o diálogo (Ex: "Dani, você consegue subir essa página ainda hoje?").
    2. FOCO NO RESULTADO: Devem discutir o tópico e responder ao comando do usuário se houver um.
    3. PERSONALIDADES: Devem seguir suas personalidades (Rafa estratégica, Dani focada em deploy, Malu focada em conversão e fechamento).
    4. CONCLUSÃO: Devem chegar a uma conclusão prática ou um plano de ação para o CEO.
    5. LIMITE: Máximo 8 mensagens curtas e dinâmicas.
  `;

  try {
    const rawResponse = await generateAgentResponse(prompt);
    console.log("[🤖 AI MEETING RAW]:", rawResponse);

    // Regex mais robusto para capturar apenas o array JSON
    const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
        throw new Error("Nenhum array JSON encontrado na resposta da reunião");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Erro ao conduzir reunião de agentes:", error);
    // Retorno de fallback para não travar a UI
    return [
        { agent: "ceo", name: "João Paulo", content: "Erro na conexão estratégica. Batalhão em standby." }
    ];
  }
}

export async function optimizePOPWithAI(agentId: string, currentText: string) {
  const persona = AGENT_PERSONAS[agentId];
  if (!persona) return currentText;

  const prompt = `
    Aja como um Arquiteto de Software Especialista em Agentes de I.A e Prompt Engineering.
    Sua tarefa é REESCREVER e MELHORAR o Procedimento Operacional Padrão (POP) do agente abaixo:

    Nome: ${persona.name}
    Papel: ${persona.role}
    Descrição do Agente: ${persona.description}

    TEXTO ATUAL ESCRITO PELO USUÁRIO:
    "${currentText}"

    DIRETRIZES DE ESTRUTURA (OBRIGATÓRIO):
    1. INTRODUÇÃO: Comece com um parágrafo curto e inspirador (2-3 linhas) sobre a importância deste processo para o sucesso da empresa (Ex: "Orquestrar leads de alta conversão exige um equilíbrio exato entre design, copy e agilidade...").
    2. TÍTULOS DE SEÇÃO: Use o formato "1. Título do Processo (O Propósito)", "2. Próxima Etapa", etc. Sempre numerado e com o propósito entre parênteses.
    3. TÓPICOS INTERNOS: Dentro de cada seção, use uma lista de sub-pontos usando o caractere "-" seguido de uma Chave em Negrito (Ex: "- Foco no Benefício: O texto deve...").
    4. FOCO TÉCNICO: Mantenha as intenções do usuário, mas use tom imperativo e técnico.
    5. FORMATO: Retorne o texto puro (plain text), usando "-" para listas e números para seções. Use ** para o que deve ser negrito (nós vamos renderizar isso).
    6. RESTRIÇÃO: Retorne APENAS o texto do POP final. Sem introduções explicativas.
  `;

  try {
    const rawResponse = await generateAgentResponse(prompt);
    return rawResponse.trim();
  } catch (error) {
    console.error("Erro ao otimizar POP:", error);
    throw new Error("Não foi possível conectar à I.A para otimizar o texto. Tente novamente.");
  }
}
