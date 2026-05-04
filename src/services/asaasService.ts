import { supabase } from "@/integrations/supabase/client";

/**
 * AsaasService — Geração de Boletos via Asaas
 *
 * ⚠️ ARQUITETURA DE SEGURANÇA:
 * O frontend NÃO chama a API do Asaas diretamente (causaria erro de CORS).
 * Todas as chamadas passam pela Supabase Edge Function "asaas-proxy",
 * que roda no servidor e mantém a API Key protegida.
 *
 * Fluxo:
 *   Browser → supabase.functions.invoke("asaas-proxy") → Asaas API
 */

export interface AsaasPaymentResponse {
  id: string;
  invoiceUrl: string;
  bankSlipUrl: string;
  identificationField: string; // Linha digitável (código de barras)
  status: string;
}

export class AsaasService {
  /**
   * Encontra um cliente existente pelo e-mail ou cria um novo.
   * Retorna o customerId do Asaas.
   */
  async findOrCreateCustomer(
    name: string,
    email: string,
    phone?: string
  ): Promise<string> {
    const { data, error } = await supabase.functions.invoke("asaas-proxy", {
      body: {
        action: "find_or_create_customer",
        payload: { name, email, phone },
      },
    });

    if (error) throw new Error(error.message || "Erro ao processar cliente no Asaas");
    if (data?.error) throw new Error(data.error);

    return data.customerId;
  }

  /**
   * Gera um boleto bancário para o cliente.
   * dueDate pode ser "DD/MM/YYYY" ou "YYYY-MM-DD" — a Edge Function converte.
   */
  async createBoleto(
    customerId: string,
    value: number,
    dueDate: string,
    description: string
  ): Promise<AsaasPaymentResponse> {
    const { data, error } = await supabase.functions.invoke("asaas-proxy", {
      body: {
        action: "create_boleto",
        payload: { customerId, value, dueDate, description },
      },
    });

    if (error) throw new Error(error.message || "Erro ao gerar boleto no Asaas");
    if (data?.error) throw new Error(data.error);

    return data as AsaasPaymentResponse;
  }
}
