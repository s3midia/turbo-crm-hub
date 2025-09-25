import ComingSoon from "./ComingSoon";

export default function TasksPage() {
  const features = [
    "Criação e atribuição de tarefas",
    "Calendário integrado de atividades",
    "Lembretes automáticos",
    "Vinculação com contatos e oportunidades",
    "Relatórios de produtividade",
    "Sincronização com Google Calendar"
  ];

  return (
    <ComingSoon
      title="Tarefas & Atividades"
      description="Organize suas atividades e nunca perca um follow-up importante"
      features={features}
    />
  );
}