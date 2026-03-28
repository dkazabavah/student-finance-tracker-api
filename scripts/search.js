
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function buildRegex(input) {
  if (!input.trim()) return null;

  try {
    return new RegExp(input, "i");
  } catch {
    const escaped = input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(escaped, "i");
  }
}

export function matchesRecord(record, regex) {
  if (!regex) return true;
  const text = [record.description, record.category, record.notes, record.amount, record.date].join(" ");
  return regex.test(text);
}

export function highlight(value, regex) {
  const text = String(value ?? "");
  if (!regex) return escapeHtml(text);

  const source = regex.source;
  const flags = regex.flags.includes("g") ? regex.flags : regex.flags + "g";
  const safeRegex = new RegExp(source, flags);

  return escapeHtml(text).replace(safeRegex, (match) => `<mark class="mark">${escapeHtml(match)}</mark>`);
}
