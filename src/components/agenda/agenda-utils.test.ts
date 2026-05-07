import { describe, it, expect } from "vitest";
import { filterAgendaEvents, calculateAgendaTotals, AgendaEvent } from "./agenda-utils";

describe("agenda-utils", () => {
  const mockEvents: AgendaEvent[] = [
    { id: "1", day: 5, title: "Meeting", type: "meeting", value: 0 },
    { id: "2", day: 5, title: "Income", type: "finance_in", value: 1000 },
    { id: "3", day: 10, title: "Overdue", type: "finance_overdue", value: 500 },
  ];

  it("should filter meetings correctly", () => {
    const filtered = filterAgendaEvents(mockEvents, "meetings");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].title).toBe("Meeting");
  });

  it("should filter finance correctly", () => {
    const filtered = filterAgendaEvents(mockEvents, "finance");
    expect(filtered).toHaveLength(2);
  });

  it("should calculate totals correctly", () => {
    const { totalReceitas, totalAtrasado } = calculateAgendaTotals(mockEvents);
    expect(totalReceitas).toBe(1000);
    expect(totalAtrasado).toBe(500);
  });
});
