import { describe, it, expect } from "vitest";
import { calcularValuation, MetodoValuation, ValuationInput, Bem, validarIntegridade } from "./valuation-utils";

describe("calcularValuation", () => {
  const defaultInputs: ValuationInput = {
    faturamento12m: 1000000,
    lucroLiquido: 200000,
    ativosCirculantes: 50000,
    passivos: 30000,
    taxaCrescimento: 10,
    setor: "Agência Digital",
    wacc: 10,
  };

  const defaultBens: Bem[] = [
    { id: "1", nome: "Computador", valor: 5000 },
  ];

  it("should calculate valuation using 'multiplos' method correctly", () => {
    const result = calcularValuation(defaultInputs, defaultBens, "multiplos");
    // Multiplo for Agência Digital is 3.0
    // 1,000,000 * 3.0 = 3,000,000
    expect(result.valor).toBe(3000000);
    expect(result.min).toBe(3000000 * 0.85);
    expect(result.max).toBe(3000000 * 1.2);
  });

  it("should calculate valuation using 'patrimonial' method correctly", () => {
    const result = calcularValuation(defaultInputs, defaultBens, "patrimonial");
    // Ativos = ativosCirculantes (50,000) + totalBens (5,000) = 55,000
    // Passivos = 30,000
    // PL = 55,000 - 30,000 = 25,000
    expect(result.valor).toBe(25000);
  });

  it("should calculate valuation using 'fcd' method correctly", () => {
    const result = calcularValuation(defaultInputs, defaultBens, "fcd");
    expect(result.valor).toBeGreaterThan(0);
  });

  describe("validarIntegridade", () => {
    it("should return errors if required fields are missing", () => {
      const emptyInputs: ValuationInput = { ...defaultInputs, faturamento12m: 0, observacoes: "" };
      const errors = validarIntegridade(emptyInputs, []);
      
      expect(errors).toContain("Faturamento deve ser maior que zero");
      expect(errors).toContain("É recomendado adicionar uma justificativa contextual");
      expect(errors).toContain("Nenhum bem/ativo imobilizado cadastrado");
    });

    it("should return no errors if all data is present", () => {
      const fullInputs: ValuationInput = { ...defaultInputs, observacoes: "Justificativa válida" };
      const errors = validarIntegridade(fullInputs, defaultBens);
      expect(errors.length).toBe(0);
    });

    it("should require profit for FCD method", () => {
      const inputsNoProfit = { ...defaultInputs, lucroLiquido: 0 };
      const errors = validarIntegridade(inputsNoProfit, defaultBens, "fcd");
      expect(errors).toContain("Lucro líquido é necessário para o cálculo de FCD");
    });
  });
});
