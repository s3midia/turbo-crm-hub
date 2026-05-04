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

/**
 * Shortens long UUIDs or IDs for display purposes.
 * Example: "f78c9d..." -> "#F78C"
 */
export const formatDisplayId = (id: string | null | undefined): string => {
  if (!id) return "N/A";
  
  // If it's already a short ID or doesn't look like a UUID, just return it with #
  if (id.length <= 6) {
    return id.startsWith("#") ? id : `#${id}`;
  }

  // For long IDs (UUIDs), take the first 4 characters
  return `#${id.substring(0, 4).toUpperCase()}`;
};
