import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, payload } = body;

    // A API Key fica segura aqui no servidor — nunca exposta ao browser
    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
    const IS_PRODUCTION = Deno.env.get("ASAAS_PRODUCTION") === "true";

    if (!ASAAS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ASAAS_API_KEY não configurada no servidor." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const BASE_URL = IS_PRODUCTION
      ? "https://api.asaas.com/v3"
      : "https://api-sandbox.asaas.com/v3";

    const asaasHeaders = {
      "access_token": ASAAS_API_KEY,
      "Content-Type": "application/json",
      "User-Agent": "TurboCRM-S3Midia",
    };

    let result;

    // -------------------------------------------------------
    // ACTION: find_or_create_customer
    // -------------------------------------------------------
    if (action === "find_or_create_customer") {
      const { name, email, phone } = payload;

      // 1. Buscar cliente pelo e-mail
      const searchRes = await fetch(
        `${BASE_URL}/customers?email=${encodeURIComponent(email)}`,
        { headers: asaasHeaders }
      );

      if (!searchRes.ok) {
        const err = await searchRes.json();
        throw new Error(err.errors?.[0]?.description || "Erro ao buscar cliente");
      }

      const searchData = await searchRes.json();

      if (searchData.data && searchData.data.length > 0) {
        result = { customerId: searchData.data[0].id };
      } else {
        // 2. Criar cliente se não existir
        const createRes = await fetch(`${BASE_URL}/customers`, {
          method: "POST",
          headers: asaasHeaders,
          body: JSON.stringify({ name, email, phone, notificationDisabled: false }),
        });

        if (!createRes.ok) {
          const err = await createRes.json();
          throw new Error(err.errors?.[0]?.description || "Erro ao criar cliente");
        }

        const customer = await createRes.json();
        result = { customerId: customer.id };
      }
    }

    // -------------------------------------------------------
    // ACTION: create_boleto
    // -------------------------------------------------------
    else if (action === "create_boleto") {
      const { customerId, value, dueDate, description } = payload;

      // Formatar data DD/MM/YYYY → YYYY-MM-DD
      let formattedDate = dueDate;
      if (dueDate.includes("/")) {
        const [day, month, year] = dueDate.split("/");
        formattedDate = `${year}-${month}-${day}`;
      }

      const paymentRes = await fetch(`${BASE_URL}/payments`, {
        method: "POST",
        headers: asaasHeaders,
        body: JSON.stringify({
          customer: customerId,
          billingType: "BOLETO",
          value,
          dueDate: formattedDate,
          description,
        }),
      });

      if (!paymentRes.ok) {
        const err = await paymentRes.json();
        throw new Error(err.errors?.[0]?.description || "Erro ao criar boleto");
      }

      result = await paymentRes.json();
    } else {
      return new Response(
        JSON.stringify({ error: `Ação inválida: ${action}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[asaas-proxy] Erro:", err.message);
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
