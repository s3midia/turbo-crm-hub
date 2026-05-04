import { toast } from "sonner";

/**
 * EXEMPLO DE USO DA API ASAAS (GERAÇÃO DE BOLETO)
 * 
 * Como vai ficar a chamada da API:
 * 
 * const asaas = new AsaasService(API_KEY, false); // false para Sandbox
 * 
 * 1. Criar/Buscar Cliente:
 * const customerId = await asaas.findOrCreateCustomer("Nome do Cliente", "email@cliente.com", "4799999999");
 * 
 * 2. Gerar Boleto:
 * const payment = await asaas.createBoleto(
 *   customerId, 
 *   150.00,        // Valor
 *   "2024-12-30",  // Vencimento
 *   "Serviço de Mentoria" // Descrição
 * );
 * 
 * Resposta esperada (payment):
 * {
 *   id: "pay_123456789",
 *   invoiceUrl: "https://www.asaas.com/i/123456789",
 *   bankSlipUrl: "https://www.asaas.com/b/123456789",
 *   identificationField: "00190.00009 02661.123000 00000.000010 1 95810000015000",
 *   status: "PENDING"
 * }
 */

interface AsaasPaymentResponse {
  id: string;
  invoiceUrl: string;
  bankSlipUrl: string;
  identificationField: string; // Barcode
  status: string;
}

interface AsaasCustomerResponse {
  id: string;
  name: string;
  email: string;
}

export class AsaasService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, isProduction: boolean = false) {
    this.apiKey = apiKey;
    // ✅ URLs corretas conforme documentação oficial Asaas v3:
    // Produção:  https://api.asaas.com/v3
    // Sandbox:   https://api-sandbox.asaas.com/v3  (NÃO é sandbox.asaas.com)
    this.baseUrl = isProduction ? "https://api.asaas.com/v3" : "https://api-sandbox.asaas.com/v3";
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        "access_token": this.apiKey,
        "Content-Type": "application/json",
        // ✅ User-Agent obrigatório para contas criadas após 13/06/2024
        "User-Agent": "TurboCRM-S3Midia",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.description || "Erro na comunicação com Asaas");
    }

    return response.json();
  }

  async findOrCreateCustomer(name: string, email: string, phone?: string): Promise<string> {
    try {
      // First, try to find by email
      const search = await this.request<{ data: AsaasCustomerResponse[] }>(`/customers?email=${encodeURIComponent(email)}`);
      
      if (search.data && search.data.length > 0) {
        return search.data[0].id;
      }

      // Create if not found
      const customer = await this.request<AsaasCustomerResponse>("/customers", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          phone,
          notificationDisabled: false
        }),
      });

      return customer.id;
    } catch (error: any) {
      console.error("Asaas Customer Error:", error);
      throw error;
    }
  }

  async createBoleto(customerId: string, value: number, dueDate: string, description: string): Promise<AsaasPaymentResponse> {
    try {
      // Format date from DD/MM/YYYY to YYYY-MM-DD if needed
      let formattedDate = dueDate;
      if (dueDate.includes("/")) {
        const [day, month, year] = dueDate.split("/");
        formattedDate = `${year}-${month}-${day}`;
      }

      const payment = await this.request<AsaasPaymentResponse>("/payments", {
        method: "POST",
        body: JSON.stringify({
          customer: customerId,
          billingType: "BOLETO",
          value,
          dueDate: formattedDate,
          description,
        }),
      });

      return payment;
    } catch (error: any) {
      console.error("Asaas Payment Error:", error);
      throw error;
    }
  }
}
