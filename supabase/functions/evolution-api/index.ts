import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL');
    const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY');

    if (!EVOLUTION_API_URL) {
      throw new Error('EVOLUTION_API_URL não configurada');
    }
    if (!EVOLUTION_API_KEY) {
      throw new Error('EVOLUTION_API_KEY não configurada');
    }

    // Remove trailing slash if present
    const baseUrl = EVOLUTION_API_URL.replace(/\/$/, '');

    const { action, instanceName, data } = await req.json();
    const instance = instanceName || 'crm-turbo';
    console.log(`Evolution API - Action: ${action}, Instance: ${instance}`);

    let endpoint = '';
    let method = 'GET';
    let body: string | null = null;

    switch (action) {
      case 'createInstance':
        endpoint = '/instance/create';
        method = 'POST';
        body = JSON.stringify({
          instanceName: instance,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
          reject_call: false,
          groupsIgnore: false,
          alwaysOnline: false,
          readMessages: false,
          readStatus: false,
          syncFullHistory: false,
        });
        break;

      case 'getQrCode':
        endpoint = `/instance/connect/${instance}`;
        method = 'GET';
        break;

      case 'getInstanceStatus':
        endpoint = `/instance/connectionState/${instance}`;
        method = 'GET';
        break;

      case 'fetchInstances':
        endpoint = '/instance/fetchInstances';
        method = 'GET';
        break;

      case 'deleteInstance':
        endpoint = `/instance/delete/${instance}`;
        method = 'DELETE';
        break;

      case 'getChats':
        endpoint = `/chat/findChats/${instance}`;
        method = 'POST';
        body = JSON.stringify({});
        break;

      case 'getMessages':
        endpoint = `/chat/findMessages/${instance}`;
        method = 'POST';
        body = JSON.stringify({
          where: {
            key: {
              remoteJid: data?.remoteJid,
            },
          },
          limit: 50,
        });
        break;

      // Decrypt WhatsApp media (.enc) into Base64
      // Docs reference: /chat/getBase64FromMediaMessage/{instance}
      case 'getBase64FromMediaMessage':
        endpoint = `/chat/getBase64FromMediaMessage/${instance}`;
        method = 'POST';
        body = JSON.stringify({
          message: data?.message,
          convertToMp4: data?.convertToMp4 ?? true,
        });
        break;

      case 'sendMessage':
        endpoint = `/message/sendText/${instance}`;
        method = 'POST';
        body = JSON.stringify({
          number: data?.number,
          text: data?.text,
        });
        break;

      case 'getProfilePic':
        endpoint = `/chat/fetchProfilePictureUrl/${instance}`;
        method = 'POST';
        body = JSON.stringify({
          number: data?.number,
        });
        break;

      case 'fetchPresence':
        endpoint = `/chat/fetchPresence/${instance}`;
        method = 'POST';
        body = JSON.stringify({
          number: data?.number,
        });
        break;

      case 'logout':
        endpoint = `/instance/logout/${instance}`;
        method = 'DELETE';
        break;

      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }

    const url = `${baseUrl}${endpoint}`;
    console.log(`Calling Evolution API: ${method} ${url}`);

    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
    };

    if (body && method !== 'GET') {
      fetchOptions.body = body;
      console.log(`Request body: ${body}`);
    }

    const response = await fetch(url, fetchOptions);
    const responseText = await response.text();

    console.log(`Evolution API Response Status: ${response.status}`);
    console.log(`Evolution API Response: ${responseText.substring(0, 1000)}`);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    // Handle 404 specially - instance doesn't exist
    if (response.status === 404) {
      return new Response(JSON.stringify({
        error: 'INSTANCE_NOT_FOUND',
        message: 'Instância não encontrada',
        data: responseData,
        success: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 so frontend can handle gracefully
      });
    }

    // Handle 409 - instance already exists
    if (response.status === 409) {
      return new Response(JSON.stringify({
        error: 'INSTANCE_EXISTS',
        message: 'Instância já existe',
        data: responseData,
        success: true
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (!response.ok) {
      console.error(`API Error: ${response.status} - ${responseText}`);
      return new Response(JSON.stringify({
        error: `API_ERROR_${response.status}`,
        message: responseData?.message || responseData?.response?.message || `Erro na API: ${response.status}`,
        data: responseData,
        success: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 so frontend handles it
      });
    }

    return new Response(JSON.stringify({
      ...responseData,
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Evolution API Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
