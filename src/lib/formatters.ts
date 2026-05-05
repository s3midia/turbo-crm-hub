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
 * Formats a raw numeric string or number into a BRL masked string (e.g., "1.000,00").
 * Used for inputs to follow Brazilian standards.
 */
export const maskBRL = (value: string | number): string => {
  const onlyDigits = String(value).replace(/\D/g, "");
  const amount = parseFloat(onlyDigits) / 100;
  
  if (isNaN(amount)) return "R$ 0,00";
  
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Parses a BRL masked string (e.g., "R$ 1.000,00") back to a float number.
 */
export const parseBRL = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  
  // Remove R$, spaces, and thousands dots, then replace decimal comma with dot
  const cleanValue = value
    .replace(/R\$/g, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
    
  return parseFloat(cleanValue) || 0;
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
