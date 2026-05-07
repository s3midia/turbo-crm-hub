export type MetodoValuation = "multiplos" | "fcd" | "patrimonial";

export interface Bem {
  id: string;
  nome: string;
  valor: number;
}

export interface ValuationInput {
  faturamento12m: number;
  lucroLiquido: number;
  ativosCirculantes: number;
  passivos: number;
  taxaCrescimento: number;
  setor: string;
  wacc: number;
  observacoes?: string;
}

export const SETORES = [
  { nome: "Tecnologia / SaaS", multiplo: 4.5 },
  { nome: "Agência Digital", multiplo: 3.0 },
  { nome: "Consultoria", multiplo: 2.5 },
  { nome: "Varejo / E-commerce", multiplo: 1.8 },
  { nome: "Indústria", multiplo: 2.0 },
];

export const parseVal = (v: any) => {
  if (typeof v === 'number') return v;
  return parseFloat(String(v).replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.')) || 0;
};

export function calcularValuation(inputs: ValuationInput, bens: Bem[], metodo: MetodoValuation): { valor: number; min: number; max: number } {
  const setor = SETORES.find(s => s.nome === inputs.setor) || SETORES[0];
  const totalBens = bens.reduce((acc, b) => acc + b.valor, 0);
  const totalAtivos = inputs.ativosCirculantes + totalBens;

  if (metodo === "multiplos") {
    const base = inputs.faturamento12m * setor.multiplo;
    return { valor: base, min: base * 0.85, max: base * 1.2 };
  }

  if (metodo === "fcd") {
    // Simplified DCF: sum of 5 years projected free cash flow, discounted
    const fcf = inputs.lucroLiquido;
    let total = 0;
    for (let i = 1; i <= 5; i++) {
      const projetado = fcf * Math.pow(1 + inputs.taxaCrescimento / 100, i);
      total += projetado / Math.pow(1 + inputs.wacc / 100, i);
    }
    // Terminal value (Gordon Growth Model, simplified)
    const taxaCustoCapital = inputs.wacc / 100;
    const taxaPerpetuidade = 0.02; // 2% perpetuidade padrão
    const denominador = taxaCustoCapital - taxaPerpetuidade;
    
    // Evita divisão por zero ou valores negativos que distorcem o cálculo
    const valorTerminal = (fcf * Math.pow(1 + inputs.taxaCrescimento / 100, 5) * 1.02) / (denominador <= 0 ? 0.05 : denominador);
    const valorTerminalDescontado = valorTerminal / Math.pow(1 + inputs.wacc / 100, 5);
    const valor = total + valorTerminalDescontado;
    return { valor, min: valor * 0.8, max: valor * 1.25 };
  }

  // Patrimonial
  const pl = totalAtivos - inputs.passivos;
  return { valor: pl, min: pl * 0.9, max: pl * 1.1 };
}

export function validarIntegridade(inputs: ValuationInput, bens: Bem[], metodo?: MetodoValuation): string[] {
  const errors: string[] = [];

  if (inputs.faturamento12m <= 0) {
    errors.push("Faturamento deve ser maior que zero");
  }

  if (!inputs.observacoes || inputs.observacoes.trim().length < 5) {
    errors.push("É recomendado adicionar uma justificativa contextual");
  }

  if (bens.length === 0) {
    errors.push("Nenhum bem/ativo imobilizado cadastrado");
  }

  if (metodo === "fcd" && inputs.lucroLiquido <= 0) {
    errors.push("Lucro líquido é necessário para o cálculo de FCD");
  }

  return errors;
}
