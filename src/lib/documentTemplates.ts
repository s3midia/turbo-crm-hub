
export const S3_PROPOSAL_TEMPLATE = `# PROPOSTA COMERCIAL - [NOME DA EMPRESA]

1. **Capa / Introdução**
[Breve introdução focada no problema do cliente e como a S3 Mídia pode ajudar]

2. **Apresentação S3 Mídia**
"A S3 Mídia é uma Agência com vasta experiência no mercado digital, comprometida em alcançar as metas de comunicação estabelecidas pelo cliente, visando maximizar o potencial comunicacional da empresa/marca."

3. **A Solução Estratégica**
[Descreva como os serviços escolhidos resolvem o problema do cliente de forma estratégica]

4. **Diferencial Competitivo**
A S3 Mídia desenvolve campanhas publicitárias completas, criação de identidade visual, produção de vídeos, fotografia e tráfego direcionado, garantindo uma presença digital robusta.

5. **Cronograma/Etapas**
Prazo de Produção sugerido: 30 Dias úteis após a aprovação do briefing.

6. **Investimento**
Valor Sugerido: R$ 1.584,00 (Este valor é apenas uma base e deve ser ajustado conforme o escopo do projeto).

7. **Call to Action**
Próximos passos para fechamento com Jeferson Santos (Sócio S3 Mídia). Estamos ansiosos para iniciar esta parceria de sucesso!
`;

export const ASAAS_BOLETO_API_TEMPLATE = `
# EXEMPLO DE INTEGRAÇÃO ASAAS (GERAÇÃO DE BOLETO)

Este é um exemplo de como os dados são enviados para a API do Asaas para gerar um boleto bancário.

### 1. Endpoint
POST https://sandbox.asaas.com/v3/payments

### 2. Payload (O que enviamos)
{
  "customer": "cus_000005118237",
  "billingType": "BOLETO",
  "value": 150.00,
  "dueDate": "2024-12-30",
  "description": "Serviços de Mentoria CRM - S3 Mídia",
  "externalReference": "CONTRATO_123",
  "postalService": false
}

### 3. Resposta (O que recebemos)
{
  "id": "pay_923817263544",
  "invoiceUrl": "https://sandbox.asaas.com/i/923817263544",
  "bankSlipUrl": "https://sandbox.asaas.com/b/923817263544",
  "identificationField": "00190.00009 02661.123000 00000.000010 1 95810000015000",
  "status": "PENDING"
}
`;
