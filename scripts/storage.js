
import { STORAGE_KEYS, DEFAULT_SETTINGS } from "./state.js";

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function loadExpenses() {
  return safeParse(localStorage.getItem(STORAGE_KEYS.expenses), []);
}

export function saveExpenses(expenses) {
  localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenses));
}

export function loadSettings() {
  return { ...DEFAULT_SETTINGS, ...safeParse(localStorage.getItem(STORAGE_KEYS.settings), DEFAULT_SETTINGS) };
}

export function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

export function loadCachedRates() {
  return safeParse(localStorage.getItem(STORAGE_KEYS.rates), null);
}

export function saveCachedRates(payload) {
  localStorage.setItem(STORAGE_KEYS.rates, JSON.stringify(payload));
}
