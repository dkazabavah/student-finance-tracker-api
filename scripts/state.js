
export const DEFAULT_CATEGORIES = [
  "Food",
  "Books",
  "Transport",
  "Entertainment",
  "Fees",
  "Other"
];

export const STORAGE_KEYS = {
  expenses: "sft_expenses",
  settings: "sft_settings",
  rates: "sft_rates_cache"
};

export const DEFAULT_SETTINGS = {
  monthlyCap: "",
  darkMode: false,
  customCategories: [],
  manualRates: {
    USD: "",
    EUR: ""
  }
};

export function createEmptyState() {
  return {
    expenses: [],
    settings: structuredClone(DEFAULT_SETTINGS)
  };
}
