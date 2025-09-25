import ComingSoon from "./ComingSoon";

export default function WhatsAppPage() {
  const features = [
    "Integração via QR Code com WhatsApp Web",
    "Histórico completo de conversas",
    "Vinculação automática de contatos",
    "Templates de mensagens personalizáveis",
    "Envio de propostas e links de pagamento",
    "Análise de sentimento com IA",
    "Respostas automáticas inteligentes"
  ];

  return (
    <ComingSoon
      title="WhatsApp Integrado"
      description="Centralize suas conversas e transforme chats em oportunidades de negócio"
      features={features}
    />
  );
}