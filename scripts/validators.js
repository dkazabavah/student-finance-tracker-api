
export const patterns = {
  description: /^\S(?:.*\S)?$/,
  amount: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
  date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
  category: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
  duplicateWord: /\b(\w+)\s+\1\b/i,
  centsSearch: /\.\d{2}\b/,
  beverageSearch: /(coffee|tea)/i,
  url: /^https?:\/\/[^\s/$.?#].[^\s]*$/i
};

export function isValidDescription(value) {
  return patterns.description.test(String(value).trim());
}

export function isValidAmount(value) {
  return patterns.amount.test(String(value).trim());
}

export function isValidDate(value) {
  return patterns.date.test(String(value).trim());
}

export function isValidCategory(value) {
  return patterns.category.test(String(value).trim());
}

export function hasDuplicateWord(value) {
  return patterns.duplicateWord.test(String(value).trim());
}

export function isValidUrl(value) {
  const trimmed = String(value || "").trim();
  return trimmed === "" || patterns.url.test(trimmed);
}

export function validateExpense(input) {
  const errors = [];

  if (!isValidDescription(input.description)) {
    errors.push("Description is required and cannot be blank spaces.");
  }

  if (!isValidAmount(input.amount)) {
    errors.push("Amount must be a valid number with up to 2 decimals.");
  }

  if (!isValidDate(input.date)) {
    errors.push("Date must follow YYYY-MM-DD format.");
  }

  if (!isValidCategory(input.category)) {
    errors.push("Category should contain letters only, with spaces or hyphens allowed.");
  }

  if (!isValidUrl(input.receipt)) {
    errors.push("Receipt link must be a valid URL.");
  }

  return errors;
}
