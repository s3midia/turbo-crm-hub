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
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const body = await req.json()
        console.log('Webhook received:', JSON.stringify(body, null, 2))

        const { event, instance, data } = body

        // Handle messages.upsert event
        if (event === 'messages.upsert') {
            const message = data?.messages?.[0] || data

            if (!message) {
                return new Response(JSON.stringify({ error: 'No message data' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 400
                })
            }

            const remoteJid = message.key?.remoteJid
            const fromMe = message.key?.fromMe === true

            if (!remoteJid) {
                return new Response(JSON.stringify({ error: 'No remoteJid' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 400
                })
            }

            // Extract message text
            let messageText = ''
            if (message.message?.conversation) {
                messageText = message.message.conversation
            } else if (message.message?.extendedTextMessage?.text) {
                messageText = message.message.extendedTextMessage.text
            } else {
                messageText = '[Mídia]'
            }

            // Get or create conversation
            const { data: existingConv, error: fetchError } = await supabaseClient
                .from('whatsapp_conversations')
                .select('*')
                .eq('remote_jid', remoteJid)
                .single()

            if (fetchError && fetchError.code !== 'PGRST116') {
                console.error('Error fetching conversation:', fetchError)
            }

            if (existingConv) {
                // Update existing conversation
                const updates: any = {
                    last_message: messageText,
                    last_message_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }

                // 🔥 REGRA DE OURO: Incrementar unread_count apenas se:
                // 1. Mensagem NÃO é do usuário (fromMe === false)
                // 2. Chat NÃO está aberto (is_open === false)
                if (!fromMe && !existingConv.is_open) {
                    updates.unread_count = (existingConv.unread_count || 0) + 1
                }

                const { error: updateError } = await supabaseClient
                    .from('whatsapp_conversations')
                    .update(updates)
                    .eq('id', existingConv.id)

                if (updateError) {
                    console.error('Error updating conversation:', updateError)
                } else {
                    console.log('Conversation updated:', remoteJid, { fromMe, is_open: existingConv.is_open, new_unread: updates.unread_count })
                }
            } else {
                // Create new conversation (assuming user_id from auth or default)
                // For now, we'll use a service account approach
                const { error: insertError } = await supabaseClient
                    .from('whatsapp_conversations')
                    .insert({
                        remote_jid: remoteJid,
                        contact_phone: remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', ''),
                        contact_name: message.pushName || null,
                        last_message: messageText,
                        last_message_at: new Date().toISOString(),
                        unread_count: fromMe ? 0 : 1, // Only increment if not from me
                        is_open: false,
                        instance_name: instance,
                        user_id: '00000000-0000-0000-0000-000000000000', // TODO: Map to actual user
                    })

                if (insertError) {
                    console.error('Error creating conversation:', insertError)
                } else {
                    console.log('Conversation created:', remoteJid)
                }
            }
        }

        return new Response(
            JSON.stringify({ success: true }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )
    } catch (error) {
        console.error('Webhook error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500
            }
        )
    }
})
