
import { loadCachedRates, saveCachedRates } from "./storage.js";

const OPEN_ENDPOINT = "https://open.er-api.com/v6/latest/USD";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function getRates(forceRefresh = false) {
  const cached = loadCachedRates();

  if (!forceRefresh && cached?.timestamp && Date.now() - cached.timestamp < ONE_DAY_MS) {
    return { ...cached, fromCache: true };
  }

  const response = await fetch(OPEN_ENDPOINT);

  if (!response.ok) {
    throw new Error(`Exchange API request failed with status ${response.status}`);
  }

  const data = await response.json();

  if (data.result !== "success" || !data.rates?.RWF || !data.rates?.EUR) {
    throw new Error("Exchange API returned an unexpected response.");
  }

  const payload = {
    timestamp: Date.now(),
    base: data.base_code,
    provider: data.provider,
    nextUpdate: data.time_next_update_utc,
    rates: {
      USD: 1,
      EUR: data.rates.EUR,
      RWF: data.rates.RWF
    }
  };

  saveCachedRates(payload);
  return { ...payload, fromCache: false };
}

export function convertFromRwf(amount, targetCode, rateData, manualRate = "") {
  const numericAmount = Number(amount);
  if (Number.isNaN(numericAmount) || numericAmount < 0) {
    throw new Error("Amount must be a valid positive number.");
  }

  if (manualRate !== "" && !Number.isNaN(Number(manualRate)) && Number(manualRate) > 0) {
    return numericAmount / Number(manualRate);
  }

  const rwfPerUsd = rateData.rates.RWF;
  if (targetCode === "USD") {
    return numericAmount / rwfPerUsd;
  }

  if (targetCode === "EUR") {
    const usdValue = numericAmount / rwfPerUsd;
    return usdValue * rateData.rates.EUR;
  }

  throw new Error("Unsupported target currency.");
}
