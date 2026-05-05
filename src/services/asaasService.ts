/**
 * AsaasService — Geração de Boletos via Asaas
 *
 * ⚠️ ARQUITETURA DE SEGURANÇA:
 * O frontend NÃO chama a API do Asaas diretamente (causaria erro de CORS).
 * Todas as chamadas passam pela API Route da Vercel "/api/asaas",
 * que roda no servidor e mantém a API Key protegida.
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
    const response = await fetch("/api/asaas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "find_or_create_customer",
        payload: { name, email, phone },
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error || "Erro ao processar cliente no Asaas");
    }

    return data.customerId;
  }

  /**
   * Gera um boleto bancário para o cliente.
   * Retorna os dados do pagamento.
   */
  async createBoleto(
    customerId: string,
    value: number,
    dueDate: string,
    description: string
  ): Promise<AsaasPaymentResponse> {
    const response = await fetch("/api/asaas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create_boleto",
        payload: { customerId, value, dueDate, description },
      }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error || "Erro ao gerar boleto no Asaas");
    }

    return data as AsaasPaymentResponse;
  }
}
