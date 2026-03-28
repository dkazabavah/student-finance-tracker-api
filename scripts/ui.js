
import { DEFAULT_CATEGORIES } from "./state.js";
import { buildRegex, matchesRecord, highlight } from "./search.js";

export function showMessage(message, isError = false) {
  const feedback = document.getElementById("feedback");
  feedback.textContent = message;
  feedback.style.color = isError ? "var(--danger)" : "var(--accent-2)";
}

export function clearMessage() {
  showMessage("");
}

export function applyTheme(isDark) {
  document.body.classList.toggle("dark", Boolean(isDark));
}

export function populateCategorySelect(select, categories, includeBlank = false) {
  select.innerHTML = "";
  if (includeBlank) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "All categories";
    select.append(option);
  }

  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.append(option);
  });
}

export function getAllCategories(settings) {
  return [...new Set([...DEFAULT_CATEGORIES, ...(settings.customCategories || [])])];
}

export function renderCategoryList(container, categories) {
  container.innerHTML = categories.map((category) => `<li>${category}</li>`).join("");
}

export function renderStats(expenses, settings) {
  const totalRecords = expenses.length;
  const total = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

  const categoryTotals = expenses.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + Number(item.amount);
    return acc;
  }, {});

  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  const monthlyCap = Number(settings.monthlyCap || 0);
  const monthTotal = getCurrentMonthTotal(expenses);

  document.getElementById("stat-total-records").textContent = String(totalRecords);
  document.getElementById("stat-total-rwf").textContent = formatCurrency(total, "RWF");
  document.getElementById("stat-top-category").textContent = topCategory;

  const capElement = document.getElementById("stat-cap");
  if (!monthlyCap) {
    capElement.textContent = "No cap set";
  } else if (monthTotal > monthlyCap) {
    capElement.textContent = `Exceeded by ${formatCurrency(monthTotal - monthlyCap, "RWF")}`;
  } else {
    capElement.textContent = `${formatCurrency(monthlyCap - monthTotal, "RWF")} left`;
  }
}

export function formatCurrency(value, code) {
  if (code === "RWF") {
    return `RWF ${Number(value || 0).toLocaleString()}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code
  }).format(Number(value || 0));
}

export function renderTrendChart(expenses) {
  const chart = document.getElementById("trend-chart");
  const today = new Date();
  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    const label = date.toLocaleDateString("en-US", { weekday: "short" });
    const total = expenses
      .filter((item) => item.date === key)
      .reduce((sum, item) => sum + Number(item.amount), 0);
    return { key, label, total };
  });

  const maxValue = Math.max(...days.map((day) => day.total), 1);

  chart.innerHTML = days.map((day) => {
    const height = Math.max((day.total / maxValue) * 160, day.total > 0 ? 12 : 6);
    return `
      <div class="bar-wrap">
        <div class="bar-value">${day.total > 0 ? Number(day.total).toLocaleString() : "0"}</div>
        <div class="bar" style="height:${height}px"></div>
        <div class="bar-label">${day.label}</div>
      </div>
    `;
  }).join("");
}

export function renderInsights(expenses, settings) {
  const container = document.getElementById("insights-list");
  const insights = [];

  if (!expenses.length) {
    insights.push("No records yet. Add a few expenses to unlock spending insights.");
  } else {
    const total = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const avg = total / expenses.length;
    const highExpense = [...expenses].sort((a, b) => Number(b.amount) - Number(a.amount))[0];
    const monthlyCap = Number(settings.monthlyCap || 0);
    const monthTotal = getCurrentMonthTotal(expenses);

    insights.push(`Average expense size is ${formatCurrency(avg, "RWF")}.`);
    insights.push(`Highest single expense is "${highExpense.description}" at ${formatCurrency(highExpense.amount, "RWF")}.`);

    const categoryTotals = expenses.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + Number(item.amount);
      return acc;
    }, {});
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) {
      insights.push(`${topCategory[0]} is your heaviest spending category so far.`);
    }

    if (monthlyCap) {
      insights.push(
        monthTotal > monthlyCap
          ? `You are above your monthly cap by ${formatCurrency(monthTotal - monthlyCap, "RWF")}.`
          : `You are within your monthly cap with ${formatCurrency(monthlyCap - monthTotal, "RWF")} remaining.`
      );
    }
  }

  container.innerHTML = insights.map((item) => `<li>${item}</li>`).join("");
}

export function renderRecords(expenses, settings, handlers) {
  const searchValue = document.getElementById("search-input").value.trim();
  const selectedCategory = document.getElementById("filter-category").value;
  const sortValue = document.getElementById("sort-select").value;
  const regex = buildRegex(searchValue);

  let rows = expenses.filter((expense) => {
    const categoryMatch = !selectedCategory || expense.category === selectedCategory;
    const textMatch = matchesRecord(expense, regex);
    return categoryMatch && textMatch;
  });

  rows = sortRecords(rows, sortValue);

  const tbody = document.getElementById("records-body");
  document.getElementById("record-count").textContent = `${rows.length} record${rows.length === 1 ? "" : "s"}`;

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="6">No matching records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map((item) => `
    <tr>
      <td>${highlight(item.description, regex)}${item.notes ? `<div class="muted">${highlight(item.notes, regex)}</div>` : ""}</td>
      <td>${formatCurrency(item.amount, "RWF")}</td>
      <td>${item.date}</td>
      <td>${highlight(item.category, regex)}</td>
      <td>${item.receipt ? `<a href="${item.receipt}" target="_blank" rel="noreferrer">Open</a>` : "—"}</td>
      <td>
        <div class="small-actions">
          <button type="button" data-edit="${item.id}">Edit</button>
          <button type="button" data-delete="${item.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => handlers.onEdit(button.dataset.edit));
  });

  tbody.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => handlers.onDelete(button.dataset.delete));
  });
}

function sortRecords(records, sortValue) {
  const copy = [...records];

  switch (sortValue) {
    case "oldest":
      return copy.sort((a, b) => a.date.localeCompare(b.date));
    case "amount-desc":
      return copy.sort((a, b) => Number(b.amount) - Number(a.amount));
    case "amount-asc":
      return copy.sort((a, b) => Number(a.amount) - Number(b.amount));
    case "description-asc":
      return copy.sort((a, b) => a.description.localeCompare(b.description));
    case "newest":
    default:
      return copy.sort((a, b) => b.date.localeCompare(a.date));
  }
}

function getCurrentMonthTotal(expenses) {
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  return expenses
    .filter((item) => item.date.startsWith(currentMonth))
    .reduce((sum, item) => sum + Number(item.amount), 0);
}

export function switchView(viewName) {
  document.querySelectorAll(".view-section").forEach((section) => section.classList.add("hidden"));
  document.getElementById(`${viewName}-view`).classList.remove("hidden");

  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });
}

export function fillSettingsForm(settings) {
  document.getElementById("monthly-cap").value = settings.monthlyCap || "";
  document.getElementById("usd-rate").value = settings.manualRates?.USD || "";
  document.getElementById("eur-rate").value = settings.manualRates?.EUR || "";
  document.getElementById("dark-mode-toggle").checked = Boolean(settings.darkMode);
}

export function setRatesStatus(text) {
  document.getElementById("rates-status").textContent = text;
}

export function showConversionResults(usdValue, eurValue) {
  document.getElementById("usd-result").textContent = usdValue;
  document.getElementById("eur-result").textContent = eurValue;
}
