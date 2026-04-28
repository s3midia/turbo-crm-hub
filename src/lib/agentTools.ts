export const AGENT_TOOLS = [
  {
    name: "start_prospecting",
    description: "Inicia uma busca real de leads usando o Apify.",
    parameters: {
      keyword: "O nicho a ser buscado (ex: Odontologia)",
      location: "Cidade ou região"
    },
    agent: "rafa"
  },
  {
    name: "send_whatsapp_message",
    description: "Envia uma mensagem real via WhatsApp para um lead qualificado.",
    parameters: {
      phone: "Número do telefone formatado",
      message: "Conteúdo da mensagem"
    },
    agent: "malu"
  },
  {
    name: "generate_landing_page",
    description: "Gera um site real para um cliente no servidor local.",
    parameters: {
      company_name: "Nome da empresa",
      niche: "Nicho do negócio",
      template: "construcao | saude | advocacia | varejo"
    },
    agent: "dani"
  }
];
