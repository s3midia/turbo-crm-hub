import { describe, it, expect } from "vitest";
import { calculateDashboardData } from "./dashboard-utils";
import { FinancialTransaction } from "@/hooks/useFinance";

describe("calculateDashboardData", () => {
  const mockTransactions: FinancialTransaction[] = [
    { id: "1", tipo: "entrada", valor: "1000", status: "pago", data_lancamento: "2024-01-01", categoria: "Vendas" },
    { id: "2", tipo: "saida", valor: "400", status: "pago", data_lancamento: "2024-01-02", categoria: "Marketing" },
    { id: "3", tipo: "entrada", valor: "500", status: "pendente", vencimento: "2024-01-05", categoria: "Vendas" },
    { id: "4", tipo: "saida", valor: "200", status: "pendente", vencimento: "2024-01-10", categoria: "Operacional" },
  ];

  const mockExtraData = {
    employees: [],
    valConfig: null
  };

  it("should calculate KPIs correctly", () => {
    const data = calculateDashboardData(mockTransactions, mockExtraData);
    
    expect(data.receita_realizada).toBe(1000);
    expect(data.despesa_realizada).toBe(400);
    expect(data.saldo_atual).toBe(600);
    expect(data.a_receber).toBe(500);
    expect(data.a_pagar).toBe(200);
    expect(data.margem_liquida).toBe(60); // (1000-400)/1000 * 100
  });

  it("should identify expense categories", () => {
    const data = calculateDashboardData(mockTransactions, mockExtraData);
    const marketing = data.expenseCategories.find(c => c.label === "Marketing");
    expect(marketing).toBeDefined();
    expect(marketing?.value).toBe(400);
  });
});
