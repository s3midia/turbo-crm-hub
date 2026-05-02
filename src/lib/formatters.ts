/**
 * Centralized, null-safe utility for currency formatting.
 * Prevents "TypeError: Cannot read properties of undefined (reading 'toLocaleString')"
 */
export const formatBRL = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return "R$ 0,00";
  }
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

/**
 * Null-safe date formatting.
 */
export const formatDate = (date: string | null | undefined): string => {
  if (!date) return "N/A";
  try {
    return new Date(date).toLocaleDateString("pt-BR");
  } catch (e) {
    return "Data Inválida";
  }
};

/**
 * Null-safe date-time formatting.
 */
export const formatDateTime = (date: string | null | undefined): string => {
  if (!date) return "N/A";
  try {
    return new Date(date).toLocaleString("pt-BR");
  } catch (e) {
    return "Data Inválida";
  }
};
