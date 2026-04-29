import { toast } from "sonner";

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
  private baseUrl: string = "https://sandbox.asaas.com/v3"; // Default to sandbox

  constructor(apiKey: string, isProduction: boolean = false) {
    this.apiKey = apiKey;
    this.baseUrl = isProduction ? "https://api.asaas.com/v3" : "https://sandbox.asaas.com/v3";
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        "access_token": this.apiKey,
        "Content-Type": "application/json",
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
