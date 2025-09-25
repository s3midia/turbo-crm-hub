import ComingSoon from "./ComingSoon";

export default function ProductsPage() {
  const features = [
    "Cadastro completo de produtos e serviços",
    "Controle de preços e variações",
    "Integração com oportunidades do pipeline",
    "Cálculo automático de propostas",
    "Biblioteca de templates de produtos",
    "Gestão de margens e comissões"
  ];

  return (
    <ComingSoon
      title="Produtos & Serviços"
      description="Gerencie seu catálogo de produtos e serviços de forma inteligente"
      features={features}
    />
  );
}