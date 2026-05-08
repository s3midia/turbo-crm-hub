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
export const formatDisplayId = (id: any): string => {
  if (id === null || id === undefined) return "N/A";
  const strId = String(id);
  if (!strId) return "N/A";
  
  if (strId.length <= 6) {
    return strId.startsWith("#") ? strId : `#${strId}`;
  }

  return `#${strId.substring(0, 4).toUpperCase()}`;
};

/**
 * Formats a number as a sequential ID (e.g., 1 -> 0001).
 */
export const formatSequentialId = (id: any): string => {
  if (id === null || id === undefined) return "0000";
  const num = typeof id === 'number' ? id : parseInt(String(id), 10);
  if (isNaN(num)) return "0000";
  return String(num).padStart(4, '0');
};

/**
 * Masks a string as CPF or CNPJ.
 */
export const maskCPFCNPJ = (value: string): string => {
  const digits = value.replace(/\D/g, "");
  
  if (digits.length <= 11) {
    // CPF: 000.000.000-00
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  } else {
    // CNPJ: 00.000.000/0000-00
    return digits
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 18);
  }
};

