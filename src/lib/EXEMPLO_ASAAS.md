# Exemplo de Integração Asaas (Gerador de Boletos)

Este documento descreve como a API do Asaas está configurada e como utilizá-la para gerar boletos dentro do sistema.

## Configuração (.env)
As chaves de API devem ser configuradas no arquivo `.env`:

```env
VITE_ASAAS_API_KEY="seu_token_asaas_aqui"
VITE_ASAAS_PRODUCTION="false"
```

## Como a API vai funcionar (Exemplo)

```typescript
import { AsaasService } from "@/services/asaasService";

// Inicializa o serviço
const apiKey = import.meta.env.VITE_ASAAS_API_KEY;
const isProduction = import.meta.env.VITE_ASAAS_PRODUCTION === "true";
const asaas = new AsaasService(apiKey, isProduction);

async function gerarCobranca() {
  try {
    // 1. Encontrar ou criar o cliente no Asaas
    const customerId = await asaas.findOrCreateCustomer(
      "João da Silva",
      "joao@email.com",
      "11988887777"
    );

    // 2. Gerar o boleto
    const payment = await asaas.createBoleto(
      customerId,
      250.50,         // Valor
      "2024-12-30",   // Data de Vencimento
      "Serviços de Consultoria CRM" // Descrição
    );

    console.log("Boleto Gerado:", payment.bankSlipUrl);
    console.log("Linha Digitável:", payment.identificationField);
    
    return payment;
  } catch (error) {
    console.error("Erro ao gerar boleto:", error);
  }
}
```

## Resposta da API
A resposta `payment` conterá:
- `id`: Identificador único da cobrança
- `invoiceUrl`: Link da fatura completa
- `bankSlipUrl`: Link direto para o PDF do boleto
- `identificationField`: Linha digitável (código de barras)
- `status`: Status atual (ex: PENDING)
