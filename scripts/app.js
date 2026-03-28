
import { DEFAULT_SETTINGS } from "./state.js";
import { loadExpenses, saveExpenses, loadSettings, saveSettings } from "./storage.js";
import { validateExpense, isValidCategory } from "./validators.js";
import { getRates, convertFromRwf } from "./api.js";
import {
  showMessage,
  clearMessage,
  applyTheme,
  populateCategorySelect,
  getAllCategories,
  renderCategoryList,
  renderStats,
  renderTrendChart,
  renderInsights,
  renderRecords,
  switchView,
  fillSettingsForm,
  setRatesStatus,
  showConversionResults,
  formatCurrency
} from "./ui.js";

const state = {
  expenses: loadExpenses(),
  settings: loadSettings(),
  rates: null
};

const expenseForm = document.getElementById("expense-form");
const settingsForm = document.getElementById("settings-form");
const editDialog = document.getElementById("edit-dialog");
const editForm = document.getElementById("edit-form");
const importInput = document.getElementById("import-input");

initialize();

async function initialize() {
  setDefaultDate();
  bindNavigation();
  bindPrimaryEvents();
  refreshCategoryUI();
  fillSettingsForm(state.settings);
  applyTheme(state.settings.darkMode);
  syncQuickThemeToggle();
  renderEverything();

  try {
    state.rates = await getRates(false);
    setRatesStatus(`Rates loaded successfully. Next update: ${state.rates.nextUpdate}`);
  } catch (error) {
    setRatesStatus("Live rates could not be loaded. Manual rates can still be used in Settings.");
  }
}

function bindNavigation() {
  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });
}

function bindPrimaryEvents() {
  expenseForm.addEventListener("submit", handleAddExpense);
  settingsForm.addEventListener("submit", handleSaveSettings);
  document.getElementById("search-input").addEventListener("input", renderEverything);
  document.getElementById("filter-category").addEventListener("change", renderEverything);
  document.getElementById("sort-select").addEventListener("change", renderEverything);
  document.getElementById("export-btn").addEventListener("click", handleExport);
  document.getElementById("seed-btn").addEventListener("click", handleLoadSeedData);
  document.getElementById("clear-btn").addEventListener("click", handleClearAll);
  document.getElementById("refresh-rates-btn").addEventListener("click", refreshRates);
  document.getElementById("convert-btn").addEventListener("click", handleConvert);
  document.getElementById("cancel-edit").addEventListener("click", () => editDialog.close());
  editForm.addEventListener("submit", handleEditExpense);
  importInput.addEventListener("change", handleImport);
  document.getElementById("quick-theme-toggle").addEventListener("click", handleQuickThemeToggle);
  document.getElementById("dark-mode-toggle").addEventListener("change", syncQuickThemeToggleFromSettings);
}

function handleQuickThemeToggle() {
  state.settings = {
    ...DEFAULT_SETTINGS,
    ...state.settings,
    darkMode: !Boolean(state.settings.darkMode)
  };

  saveSettings(state.settings);
  applyTheme(state.settings.darkMode);
  fillSettingsForm(state.settings);
  syncQuickThemeToggle();
  syncQuickThemeToggle();
  showMessage(`Dark mode ${state.settings.darkMode ? "enabled" : "disabled"}.`);
}

function syncQuickThemeToggle() {
  const button = document.getElementById("quick-theme-toggle");
  const isDark = Boolean(state.settings.darkMode);
  button.setAttribute("aria-pressed", String(isDark));
  button.textContent = isDark ? "☀️ Light mode" : "🌙 Dark mode";
}

function syncQuickThemeToggleFromSettings() {
  const isDark = document.getElementById("dark-mode-toggle").checked;
  document.getElementById("quick-theme-toggle").setAttribute("aria-pressed", String(isDark));
  document.getElementById("quick-theme-toggle").textContent = isDark ? "☀️ Light mode" : "🌙 Dark mode";
}

function setDefaultDate() {
  const today = new Date().toISOString().slice(0, 10);
  document.getElementById("date").value = today;
}

function refreshCategoryUI() {
  const categories = getAllCategories(state.settings);
  populateCategorySelect(document.getElementById("category"), categories);
  populateCategorySelect(document.getElementById("edit-category"), categories);
  populateCategorySelect(document.getElementById("filter-category"), categories, true);
  renderCategoryList(document.getElementById("category-list"), categories);
}

function renderEverything() {
  renderStats(state.expenses, state.settings);
  renderTrendChart(state.expenses);
  renderInsights(state.expenses, state.settings);
  renderRecords(state.expenses, state.settings, {
    onEdit: openEditDialog,
    onDelete: deleteExpense
  });
}

function handleAddExpense(event) {
  event.preventDefault();
  clearMessage();

  const formData = new FormData(expenseForm);
  const payload = {
    id: crypto.randomUUID(),
    description: formData.get("description").trim(),
    amount: formData.get("amount").trim(),
    date: formData.get("date").trim(),
    category: formData.get("category").trim(),
    receipt: formData.get("receipt").trim(),
    notes: formData.get("notes").trim(),
    createdAt: new Date().toISOString()
  };

  const errors = validateExpense(payload);

  if (errors.length) {
    showMessage(errors.join(" "), true);
    return;
  }

  state.expenses.unshift(payload);
  saveExpenses(state.expenses);
  expenseForm.reset();
  setDefaultDate();
  renderEverything();
  showMessage("Expense saved successfully.");
}

function handleSaveSettings(event) {
  event.preventDefault();

  const monthlyCap = document.getElementById("monthly-cap").value.trim();
  const usdRate = document.getElementById("usd-rate").value.trim();
  const eurRate = document.getElementById("eur-rate").value.trim();
  const newCategory = document.getElementById("new-category").value.trim();
  const darkMode = document.getElementById("dark-mode-toggle").checked;

  if (newCategory && !isValidCategory(newCategory)) {
    showMessage("New category must contain letters only, with spaces or hyphens allowed.", true);
    return;
  }

  const nextCategories = newCategory
    ? [...new Set([...(state.settings.customCategories || []), newCategory])]
    : [...(state.settings.customCategories || [])];

  state.settings = {
    ...DEFAULT_SETTINGS,
    ...state.settings,
    monthlyCap,
    darkMode,
    customCategories: nextCategories,
    manualRates: {
      USD: usdRate,
      EUR: eurRate
    }
  };

  saveSettings(state.settings);
  applyTheme(state.settings.darkMode);
  fillSettingsForm(state.settings);
  syncQuickThemeToggle();
  document.getElementById("new-category").value = "";
  refreshCategoryUI();
  renderEverything();
  showMessage("Settings saved.");
}

function openEditDialog(id) {
  const expense = state.expenses.find((item) => item.id === id);
  if (!expense) return;

  document.getElementById("edit-id").value = expense.id;
  document.getElementById("edit-description").value = expense.description;
  document.getElementById("edit-amount").value = expense.amount;
  document.getElementById("edit-date").value = expense.date;
  document.getElementById("edit-category").value = expense.category;
  document.getElementById("edit-receipt").value = expense.receipt || "";
  document.getElementById("edit-notes").value = expense.notes || "";
  editDialog.showModal();
}

function handleEditExpense(event) {
  event.preventDefault();

  const payload = {
    id: document.getElementById("edit-id").value,
    description: document.getElementById("edit-description").value.trim(),
    amount: document.getElementById("edit-amount").value.trim(),
    date: document.getElementById("edit-date").value.trim(),
    category: document.getElementById("edit-category").value.trim(),
    receipt: document.getElementById("edit-receipt").value.trim(),
    notes: document.getElementById("edit-notes").value.trim()
  };

  const errors = validateExpense(payload);
  if (errors.length) {
    showMessage(errors.join(" "), true);
    return;
  }

  state.expenses = state.expenses.map((item) => item.id === payload.id ? { ...item, ...payload } : item);
  saveExpenses(state.expenses);
  editDialog.close();
  renderEverything();
  showMessage("Expense updated.");
}

function deleteExpense(id) {
  const confirmed = confirm("Delete this record?");
  if (!confirmed) return;

  state.expenses = state.expenses.filter((item) => item.id !== id);
  saveExpenses(state.expenses);
  renderEverything();
  showMessage("Record deleted.");
}

function handleExport() {
  const payload = {
    exportedAt: new Date().toISOString(),
    expenses: state.expenses,
    settings: state.settings
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "student-finance-tracker-export.json";
  anchor.click();
  URL.revokeObjectURL(url);
  showMessage("Data exported.");
}

async function handleImport(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const payload = JSON.parse(text);

    if (!Array.isArray(payload.expenses)) {
      throw new Error("Imported file must contain an expenses array.");
    }

    payload.expenses.forEach((expense) => {
      const errors = validateExpense(expense);
      if (errors.length) {
        throw new Error(`Invalid record found: ${errors.join(" ")}`);
      }
    });

    state.expenses = payload.expenses;
    saveExpenses(state.expenses);

    if (payload.settings) {
      state.settings = {
        ...DEFAULT_SETTINGS,
        ...state.settings,
        ...payload.settings
      };
      saveSettings(state.settings);
      refreshCategoryUI();
      fillSettingsForm(state.settings);
      applyTheme(state.settings.darkMode);
      syncQuickThemeToggle();
    }

    renderEverything();
    showMessage("Import completed successfully.");
  } catch (error) {
    showMessage(error.message || "Import failed.", true);
  } finally {
    importInput.value = "";
  }
}

async function handleLoadSeedData() {
  try {
    const response = await fetch("./data/seed.json");
    const payload = await response.json();
    state.expenses = payload.expenses;
    saveExpenses(state.expenses);
    renderEverything();
    showMessage("Sample data loaded.");
  } catch {
    showMessage("Could not load sample data.", true);
  }
}

function handleClearAll() {
  const confirmed = confirm("This will remove all saved expenses. Continue?");
  if (!confirmed) return;

  state.expenses = [];
  saveExpenses(state.expenses);
  renderEverything();
  showMessage("All records cleared.");
}

async function refreshRates() {
  try {
    state.rates = await getRates(true);
    setRatesStatus(`Rates refreshed successfully. Next update: ${state.rates.nextUpdate}`);
    showMessage("Live exchange rates refreshed.");
  } catch (error) {
    setRatesStatus("Rate refresh failed. Try again later.");
    showMessage("Could not refresh live exchange rates.", true);
  }
}

function handleConvert() {
  const amount = document.getElementById("convert-amount").value.trim();

  if (!amount) {
    showMessage("Enter an amount in RWF first.", true);
    return;
  }

  try {
    const usdValue = convertFromRwf(amount, "USD", state.rates || fallbackRates(), state.settings.manualRates?.USD);
    const eurValue = convertFromRwf(amount, "EUR", state.rates || fallbackRates(), state.settings.manualRates?.EUR);

    showConversionResults(formatCurrency(usdValue, "USD"), formatCurrency(eurValue, "EUR"));
    showMessage("Conversion completed.");
  } catch (error) {
    showMessage(error.message || "Conversion failed.", true);
  }
}

function fallbackRates() {
  return {
    rates: {
      USD: Number(state.settings.manualRates?.USD || 0) || 0.00071,
      EUR: Number(state.settings.manualRates?.EUR || 0) || 0.00066
    }
  };
}
