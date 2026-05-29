/**
 * input-formatters.ts
 * Premium real-time autoformatting and masking helpers.
 */

/**
 * Formats standard Azerbaijani phone numbers on-the-fly: +994 (XX) XXX-XX-XX
 */
export function formatPhoneInput(value: string): string {
  if (!value) return "";
  
  // Allow the user to delete down to just the prefix
  if (value === "+" || value === "+9" || value === "+99" || value === "+994") {
    return value;
  }
  
  // Strip all non-digits
  let digits = value.replace(/\D/g, "");
  if (digits.length === 0) return "";

  // Handle various typing patterns:
  // E.g. starting with "994" or "0"
  if (digits.startsWith("994")) {
    digits = digits.slice(3);
  } else if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  // Cap to max 9 digits (excluding +994)
  digits = digits.slice(0, 9);

  let formatted = "+994";
  if (digits.length > 0) {
    const operator = digits.slice(0, 2);
    formatted += ` (${operator}`;
    if (digits.length > 2) {
      formatted += `) ${digits.slice(2, 5)}`;
      if (digits.length > 5) {
        formatted += `-${digits.slice(5, 7)}`;
        if (digits.length > 7) {
          formatted += `-${digits.slice(7, 9)}`;
        }
      }
    }
  }
  return formatted;
}

/**
 * Formats IMEI to a readable spaced format with hyphens: XXXX-XXXX-XXXX-XXX (15 digits)
 */
export function formatImeiInput(value: string): string {
  if (!value) return "";
  
  // If the value contains any non-digit, non-dash characters (e.g. serial numbers), return as-is
  if (/[^\d-]/.test(value)) {
    return value;
  }
  
  const digits = value.replace(/\D/g, "").slice(0, 15);
  if (!digits) return "";
  
  const chunks: string[] = [];
  for (let i = 0; i < digits.length; i += 4) {
    chunks.push(digits.slice(i, i + 4));
  }
  return chunks.join("-");
}

/**
 * Formats number inputs with standard spaces for thousand separators.
 * Preserves dots/commas when typing decimals.
 */
export function formatNumberInput(value: string): string {
  if (value === undefined || value === null) return "";
  
  // Normalize string
  const str = String(value);
  if (!str) return "";

  // Allow only digits and one dot
  const clean = str.replace(/[^0-9.]/g, "");
  
  const parts = clean.split(".");
  let integerPart = parts[0];
  
  // Regex to add spaces every 3 digits
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  
  if (parts.length > 1) {
    // Limit decimal part to 2 decimal places
    const decimalPart = parts[1].slice(0, 2);
    return `${integerPart}.${decimalPart}`;
  }
  
  return integerPart;
}

/**
 * Cleans formatted number string back to standard number string for API submission
 */
export function cleanFormattedNumber(value: string): string {
  return value.replace(/\s/g, "");
}
