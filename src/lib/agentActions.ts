import { supabase } from "@/integrations/supabase/client";

export interface ToolAction {
  name: string;
  parameters: any;
  agentId: string;
}

export async function executeAgentTool(action: ToolAction) {
  console.log(`[🤖 ACTION] Agente ${action.agentId} executando: ${action.name}`, action.parameters);

  try {
    switch (action.name) {
      case "start_prospecting":
        return await handleStartProspecting(action.parameters);
      case "deep_research":
        return await handleDeepResearch(action.parameters);
      case "generate_copy_briefing":
        return await handleGenerateCopyBriefing(action.parameters);
      case "delegate_task":
        return await handleDelegateTask(action.parameters);
      case "send_whatsapp_message":
        return await handleSendWhatsapp(action.parameters);
      case "generate_landing_page":
        return await handleGenerateLandingPage(action.parameters);
      default:
        throw new Error(`Ferramenta desconhecida: ${action.name}`);
    }
} catch (error) {
    console.error(`[❌ ERROR] Falha na execução da ferramenta ${action.name}:`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    const leadId = action.parameters?.lead_id;
    
    // Registra o erro na timeline do agente
    await supabase.from("agent_logs").insert({
        agent_id: action.agentId,
        message: `[AÇÃO][Lead:${leadId || 'Global'}] ERRO na execução de ${action.name}: ${errorMessage}`,
        type: "error"
    });

    // Se houver um lead vinculado, muda o status para alertar o usuário
    if (leadId) {
        await supabase.from("leads").update({ status: 'erro' }).eq("id", leadId);
    }

    return { success: false, error: errorMessage };
  }
}

async function handleStartProspecting(params: { keyword: string; location: string; lead_id?: string }) {
  const { keyword, location, lead_id } = params;
  
  // Chamada ao generator-server (Proxy do Apify)
  const response = await fetch("http://127.0.0.1:3500/apify-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      keyword,
      location,
      maxPlacesPerKeyword: 10
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao comunicar com o scraper do Apify: ${response.status} ${errorText}`);
  }
  
  const data = await response.json();
  
  // Log de sucesso no banco
  await supabase.from("agent_logs").insert({
    agent_id: "bia",
    lead_id: lead_id || null,
    message: `[AÇÃO] Iniciei busca real para "${keyword}" em "${location}". Encontrei ${data.results?.length || 0} potenciais leads.`,
    type: "success"
  });

  return { success: true, count: data.results?.length };
}

async function handleSendWhatsapp(params: { lead_id?: string; phone: string; message: string }) {
  const { lead_id, phone, message } = params;
  
  // Chamada ao Edge Function da Evolution API via Supabase
  const { data, error } = await supabase.functions.invoke("evolution-api", {
    body: {
      action: "sendMessage",
      instanceName: "crm-turbo",
      data: { number: phone, text: message }
    }
  });

  if (error) throw error;

  // Se houver lead_id, marcar como em atendimento
  if (lead_id) {
    await supabase.from("leads").update({ status: 'atendimento' }).eq("id", lead_id);
  }

  await supabase.from("agent_logs").insert({
    agent_id: "malu",
    lead_id: lead_id || null,
    message: `[AÇÃO] Mensagem enviada com sucesso para ${phone}. Lead movido para Atendimento.`,
    type: "success"
  });

  return { success: true, data };
}

async function handleGenerateLandingPage(params: { lead_id?: string; company_name: string; niche: string; template: string }) {
  const { lead_id, company_name } = params;

  if (lead_id) {
    await supabase.from("leads").update({ status: 'gerando_site' }).eq("id", lead_id);
  }

  const response = await fetch("http://127.0.0.1:3500/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao gerar site no servidor local: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  if (lead_id) {
    await supabase.from("leads").update({ 
        status: 'site_pronto',
        site_url: data.site_url 
    }).eq("id", lead_id);
  }

  await supabase.from("agent_logs").insert({
    agent_id: "dani",
    lead_id: lead_id || null,
    message: `[AÇÃO] Site gerado para ${company_name}. URL vinculada ao lead.`,
    type: "success"
  });

  return { success: true, url: data.site_url };
}

async function handleDeepResearch(params: { lead_id: string; company_name: string; region?: string; cnpj?: string }) {
  const { lead_id, company_name, region, cnpj } = params;
  
  console.log(`[🚀] Iniciando Pesquisa Profunda para ${company_name}...`);

  // Marcar lead como em pesquisa e atribuir à Icarus
  await supabase.from("leads").update({ 
    status: 'pesquisa_profunda',
    assigned_agent: 'icarus'
  } as any).eq("id", lead_id);

  const response = await fetch("http://127.0.0.1:3500/deep-research", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      company_name,
      location: region || "",
      cnpj
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao realizar pesquisa profunda no servidor local: ${response.status} ${errorText}`);
  }
  
  const data = await response.json();

  // Persistir os dados reais no Lead
  await supabase.from("leads").update({
      instagram_url: data.instagram_url,
      website_url: data.website_url,
      logo_url: data.visual?.logo_url,
      feed_images: data.visual?.feed_images || [],
      partners: data.partners || [],
      status: 'dados_enriquecidos' // Move para dados enriquecidos após pesquisa, aguardando Clara
  } as any).eq("id", lead_id);

  // Salvar a inteligência consolidada nos logs para a timeline
  await supabase.from("agent_logs").insert({
    agent_id: "icarus",
    lead_id: lead_id, 
    message: `[PESQUISA PROFUNDA] Finalizada. Encontrei Instagram (${data.instagram_url || 'N/A'}), Site (${data.website_url || 'N/A'}). Extraí ${data.partners?.length || 0} sócios do CNPJ.`,
    type: "success"
  });

  return { success: true, data };
}

async function handleGenerateCopyBriefing(params: { lead_id: string; company_name: string }) {
    const { lead_id, company_name } = params;
    
    // Obter dados do lead
    const { data: leadData } = await supabase.from('leads').select('*').eq('id', lead_id).single();
    if (!leadData) throw new Error("Lead não encontrado para gerar briefing");
    
    await supabase.from("leads").update({ assigned_agent: 'clara' } as any).eq("id", lead_id);

    let copyData = "";
    try {
        const { generateAgentResponse } = await import("./gemini");
        const analysisPrompt = `
          Aja como a agente Clara, analista de copy e posicionamento.
          Você analisará os dados da empresa "${company_name}".
          Aqui estão os dados brutos encontrados pelo Icarus:
          ${JSON.stringify({ 
              instagram: (leadData as any).instagram_url, 
              site: (leadData as any).website_url, 
              partners: (leadData as any).partners 
          })}
          
          Sua tarefa é escrever um "Briefing de Copy Estratégica" para a web designer (Dani) usar depois.
          Tópicos obrigatórios:
          1. Proposta de Valor Provável
          2. Principais Serviços (inferidos)
          3. Possíveis pontos fracos/Dores do cliente atual (ex: site ruim, sem insta)
          4. O que a Dani deve enfatizar na Landing Page.
          
          Seja super direta e em formato de tópicos markdown.
        `;
        copyData = await generateAgentResponse(analysisPrompt);
        console.log(`[🚀] Análise de Copy Estratégica gerada com sucesso para ${company_name} por Clara`);
    } catch (e) {
        console.error("[⚠️] Erro ao gerar análise de copy da Clara:", e);
        copyData = "Não foi possível gerar a análise automática de copy para este lead.";
    }

    await supabase.from("leads").update({
        full_copy: copyData,
        status: 'qualificado'
    } as any).eq("id", lead_id);

    await supabase.from("agent_logs").insert({
        agent_id: "clara",
        lead_id: lead_id,
        message: `[COPYRIGHT] Briefing estratégico gerado com foco nas dores do cliente.`,
        type: "success"
    });

    return { success: true, copyData };
}

async function handleDelegateTask(params: { sub_agent: string; instruction: string }) {
    const { sub_agent, instruction } = params;
    
    // In here, Rafa acts as the orchestrator and sends an instruction that triggers the sub-agent.
    // We import generateAgentActivity to invoke the chosen sub-agent.
    const { generateAgentActivity } = await import("./agentIntelligence");
    
    await supabase.from("agent_logs").insert({
        agent_id: "rafa",
        message: `[LIDERANÇA] Delegando tarefa para ${sub_agent.toUpperCase()}: "${instruction}"`,
        type: "info"
    });
    
    // Triggers the sub-agent asynchronously
    generateAgentActivity(sub_agent, instruction).catch(e => {
        console.error(`Falha ao engajar sub-agente ${sub_agent}:`, e);
    });

    return { success: true, delegated_to: sub_agent };
}

