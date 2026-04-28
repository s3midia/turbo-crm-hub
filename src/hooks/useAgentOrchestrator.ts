import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateAgentActivity } from '@/lib/agentIntelligence';
import { toast } from 'sonner';

export function useAgentOrchestrator() {
    const processingRef = useRef<Set<string>>(new Set());
    const cooldownsRef = useRef<Map<string, number>>(new Map()); // agentId -> timestamp of next allowed run

    useEffect(() => {
        console.log("[Orquestrador] Inicializando serviço de orquestração autônoma (v2)...");
        
        // Função para processar um lead específico baseado em seu estado
        const processLeadAction = async (lead: any) => {
            if (!lead || !lead.id) return;

            // 🛑 CHECK PAUSA GLOBAL
            if (localStorage.getItem('s3_agents_paused') === 'true') {
                console.log("[Orquestrador] Operação pausada pelo usuário. Ignorando lead.");
                return;
            }
            
            // Chave única para evitar processar o mesmo lead no mesmo status repetidamente (debounce/guard)
            const processKey = `${lead.id}-${lead.status}`;
            if (processingRef.current.has(processKey)) return;
            
            processingRef.current.add(processKey);
            // Limpa a chave após 60 segundos para permitir re-processamento se necessário (retry manual)
            setTimeout(() => processingRef.current.delete(processKey), 60000);

            console.log(`[Orquestrador] Analisando Lead: ${lead.company_name} | Status: ${lead.status}`);

            const checkCooldown = (agentId: string) => {
                const retryAt = cooldownsRef.current.get(agentId) || 0;
                if (Date.now() < retryAt) {
                    console.log(`[Orquestrador] Agente ${agentId} em COOLDOWN. Aguardando liberação de API.`);
                    return true;
                }
                return false;
            };

            const setCooldown = (agentId: string, minutes: number = 5) => {
                cooldownsRef.current.set(agentId, Date.now() + (minutes * 60 * 1000));
            };

            try {
                // MÁQUINA DE ESTADOS DOS AGENTES (Otimizada)
                switch (lead.status) {
                    case 'novo':
                    case 'kanban_ready':
                        if (checkCooldown('rafa')) return;
                        if (!(lead as any).instagram_url && !(lead as any).website_url) {
                            const res = await generateAgentActivity('rafa', `O lead id "${lead.id}" (empresa "${lead.company_name}") é novo. Instrua o sub-agente 'icarus' usando a ferramenta 'delegate_task' passando no instruction para coletar Instagram, Site e Sócios usando 'deep_research'.`);
                            if (!res) setCooldown('rafa');
                        } else {
                            await supabase.from('leads').update({ status: 'dados_enriquecidos' }).eq('id', lead.id);
                        }
                        break;

                    case 'dados_enriquecidos':
                        if (checkCooldown('rafa')) return;
                        if (!(lead as any).full_copy) {
                            const res = await generateAgentActivity('rafa', `O lead id "${lead.id}" (empresa "${lead.company_name}") teve seus dados obtidos. Instrua a sub-agente 'clara' usando 'delegate_task' passando no instruction para gerar o briefing de copy com 'generate_copy_briefing'.`);
                            if (!res) setCooldown('rafa');
                        } else {
                            await supabase.from('leads').update({ status: 'qualificado' }).eq('id', lead.id);
                        }
                        break;

                    case 'qualificado':
                        if (checkCooldown('dani')) return;
                        if (!lead.site_url) {
                            const res = await generateAgentActivity('dani', `O lead id "${lead.id}" (${lead.company_name}) foi qualificado e tem briefing pronto. Crie uma Copy de alta conversão. Preencha os campos na ferramenta 'generate_landing_page'. Nicho: '${lead.niche || 'varejo'}'.`);
                            if (!res) setCooldown('dani');
                        } else {
                            await supabase.from('leads').update({ status: 'site_pronto' }).eq('id', lead.id);
                        }
                        break;

                    case 'site_pronto':
                        if (checkCooldown('malu')) return;
                        if (lead.phone && lead.site_url) {
                            const res = await generateAgentActivity('malu', `O site do lead id "${lead.id}" está pronto (${lead.site_url}). Inicie o contato via WhatsApp no número ${lead.phone} usando a ferramenta 'send_whatsapp_message'.`);
                            if (!res) setCooldown('malu');
                        }
                        break;
                    
                    case 'erro':
                        break;

                    default:
                        break;
                }
            } catch (err) {
                console.error(`[Orquestrador] Erro ao processar lead ${lead.id}:`, err);
            }
        };

        // Varredura periódica para leads que "escaparam" do Realtime
        const runSweep = async () => {
            if (localStorage.getItem('s3_agents_paused') === 'true') return;
            
            console.log("[Orquestrador] Varrendo leads pendentes...");
            const { data: pendingLeads } = await supabase
                .from('leads')
                .select('*')
                .in('status', ['novo', 'kanban_ready', 'dados_enriquecidos', 'qualificado', 'site_pronto'])
                .order('created_at', { ascending: false })
                .limit(5);
            
            if (pendingLeads) {
                for (const lead of pendingLeads) {
                    await processLeadAction(lead);
                }
            }
        };

        // Escuta mudanças na tabela de leads
        const channel = supabase
            .channel('agent_orchestrator_v2')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
                if (payload.new) processLeadAction(payload.new);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log("[Orquestrador] Realtime conectado.");
                    toast.success("🛡️ Torre S3: Orquestrador Online", {
                        description: "Monitorando fluxo de leads em tempo real."
                    });
                    runSweep();
                }
            });

        // Varredura a cada 30 segundos como fallback
        const sweepInterval = setInterval(runSweep, 30000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(sweepInterval);
        };
    }, []);
}
