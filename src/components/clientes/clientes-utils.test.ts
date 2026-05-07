import { describe, it, expect } from "vitest";
import { calculateClientesKPIs, filterClientes, mapLeadsToClientes } from "./clientes-utils";
import { ClientePerfilData } from "@/components/financeiro/ClientePerfilDrawer";

describe("clientes-utils", () => {
  const mockClientes: ClientePerfilData[] = [
    { id: "1", cliente: "Client A", status: "ativo", valor: 1000 },
    { id: "2", cliente: "Client B", status: "inativo", valor: 500 },
  ];

  it("should calculate KPIs correctly", () => {
    const { totalAtivos, totalInativos, mrr } = calculateClientesKPIs(mockClientes);
    expect(totalAtivos).toBe(1);
    expect(totalInativos).toBe(1);
    expect(mrr).toBe(1000);
  });

  it("should filter by search term", () => {
    const filtered = filterClientes(mockClientes, "Client A", "todos");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].cliente).toBe("Client A");
  });

  it("should filter by status", () => {
    const filtered = filterClientes(mockClientes, "", "ativos");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].status).toBe("ativo");
  });
});
