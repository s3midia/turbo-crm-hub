import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        const { remoteJid, isOpen } = await req.json()

        if (!remoteJid) {
            return new Response(JSON.stringify({ error: 'remoteJid is required' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        const updates: any = {
            is_open: isOpen ?? true,
            updated_at: new Date().toISOString(),
        }

        // Se estiver abrindo o chat, zerar o unread_count
        if (isOpen === true) {
            updates.unread_count = 0
        }

        const { data, error } = await supabaseClient
            .from('whatsapp_conversations')
            .update(updates)
            .eq('remote_jid', remoteJid)
            .select()

        if (error) {
            console.error('Error updating chat state:', error)
            return new Response(JSON.stringify({ error: error.message }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            })
        }

        console.log('Chat state updated:', remoteJid, updates)

        return new Response(JSON.stringify({ success: true, data }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        console.error('Error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
