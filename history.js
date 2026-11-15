"use strict";

const demoStore = window.KadenohDemoStore;
const storageKeys = demoStore.keys;
const payoutMethods = demoStore.payoutMethods;
const minimumWithdrawalAmount = demoStore.minimumWithdrawalAmount;
const demoCreditAmount = demoStore.demoCreditAmount;
const historyRows = document.querySelector("#history-rows");
const withdrawalForm = document.querySelector("#withdrawal-form");
const withdrawalAmount = document.querySelector("#withdrawal-amount");
const withdrawalMethod = document.querySelector("#withdrawal-method");
const demoCreditPanel = document.querySelector("#demo-credit-panel");
const addDemoCreditButton = document.querySelector("#add-demo-credit");
const withdrawalConfirmation = document.querySelector("#withdrawal-confirmation");
const confirmationStatus = document.querySelector("#withdrawal-confirmation-status");
const themeToggle = document.querySelector("#theme-toggle");
let campaigns = demoStore.loadCampaigns();
let progress = {};
let history = [];
let activeFilter = "all";
let loadFailed = false;
let pendingWithdrawal = null;

function setStatus(message) {
  document.querySelector("#withdrawal-status").textContent = message;
}

function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]').content = isDark ? "#151c17" : "#f4efe6";
  themeToggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} theme`);
  themeToggle.title = `Switch to ${isDark ? "light" : "dark"} theme`;
  themeToggle.querySelector("span").textContent = isDark ? "☀" : "☾";
}

function loadData() {
  loadFailed = false;
  campaigns = demoStore.loadCampaigns();
  try {
    const saved = localStorage.getItem(storageKeys.progress);
    const parsed = saved ? JSON.parse(saved) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Saved demo history has an invalid shape.");
    }
    const viewed = Array.isArray(parsed.viewed)
      ? [...new Set(parsed.viewed.filter((id) => campaigns.some((campaign) => campaign.id === id)))]
      : [];
    const methods = Array.isArray(parsed.methods)
      ? [...new Set(parsed.methods.filter((id) => payoutMethods.some((method) => method.id === id)))]
      : [];
    history = demoStore.loadHistory(parsed, campaigns);
    progress = {
      ...parsed,
      viewed,
      methods,
      referralRewarded: parsed.referralRewarded === true,
      history,
    };
  } catch (error) {
    console.warn("Could not load history from local storage.", error);
    loadFailed = true;
    progress = { viewed: [], methods: [], referralRewarded: false, history: [] };
    history = [];
    setStatus("Could not load the saved history. Check browser storage and reload this page.");
  }

  renderPage();
}

function getAvailableBalance() {
  return demoStore.calculateDemoBalance(progress, campaigns);
}

function renderSummary() {
  const earned = history
    .filter((event) => event.type === "campaign_reward" || event.type === "referral_reward")
    .reduce((total, event) => total + event.amount, 0);
  const withdrawn = history
    .filter((event) => event.type === "withdrawal")
    .reduce((total, event) => total + event.amount, 0);
  const balance = getAvailableBalance();

  document.querySelector("#history-balance").textContent = formatCurrency(balance);
  document.querySelector("#history-earned").textContent = formatCurrency(earned);
  document.querySelector("#history-withdrawn").textContent = formatCurrency(withdrawn);
  document.querySelector("#history-count").textContent = String(history.length);
  document.querySelector("#withdrawal-available").textContent = `Available: ${formatCurrency(balance)}`;
  withdrawalAmount.min = minimumWithdrawalAmount.toFixed(2);
  withdrawalAmount.max = balance.toFixed(2);
}

function renderMethodOptions() {
  const selectedMethod = withdrawalMethod.value;
  withdrawalMethod.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select a payout method";
  withdrawalMethod.appendChild(placeholder);

  for (const method of payoutMethods.filter((item) => progress.methods.includes(item.id))) {
    const option = document.createElement("option");
    option.value = method.id;
    option.textContent = method.name;
    option.selected = method.id === selectedMethod;
    withdrawalMethod.appendChild(option);
  }

  const hasMethod = progress.methods.length > 0;
  const enoughBalance = getAvailableBalance() >= minimumWithdrawalAmount;
  withdrawalMethod.disabled = !hasMethod || loadFailed;
  withdrawalAmount.disabled = !hasMethod || !enoughBalance || loadFailed;
  document.querySelector("#request-withdrawal").disabled = !hasMethod || !enoughBalance || loadFailed;
  document.querySelector("#withdrawal-method-help").hidden = hasMethod;
  if (!hasMethod) {
    document.querySelector("#withdrawal-method-help").textContent =
      `Add a demo payout provider on the dashboard. At least ${formatCurrency(minimumWithdrawalAmount)} must be available to request a withdrawal.`;
  } else if (!enoughBalance) {
    document.querySelector("#withdrawal-method-help").textContent =
      `Earn at least ${formatCurrency(minimumWithdrawalAmount)} in demo rewards before requesting a withdrawal.`;
    document.querySelector("#withdrawal-method-help").hidden = false;
  } else {
    document.querySelector("#withdrawal-method-help").hidden = true;
  }
}

function describeEvent(event) {
  if (event.type === "campaign_reward") {
    const campaign = campaigns.find((item) => item.id === event.campaignId);
    return {
      title: campaign ? campaign.title : "Campaign reward",
      type: "Campaign reward",
      amount: `+${formatCurrency(event.amount)}`,
      amountClass: "is-credit",
    };
  }
  if (event.type === "referral_reward") {
    return {
      title: "Referral reward",
      type: "Referral",
      amount: `+${formatCurrency(event.amount)}`,
      amountClass: "is-credit",
    };
  }
  if (event.type === "demo_credit") {
    return {
      title: "One-time demo credit",
      type: "Demo credit",
      amount: `+${formatCurrency(event.amount)}`,
      amountClass: "is-credit",
    };
  }
  if (event.type === "withdrawal") {
    const method = payoutMethods.find((item) => item.id === event.methodId);
    return {
      title: `Withdrawal to ${method ? method.name : "payout method"}`,
      type: "Withdrawal",
      amount: `-${formatCurrency(event.amount)}`,
      amountClass: "is-debit",
    };
  }
  const method = payoutMethods.find((item) => item.id === event.methodId);
  return {
    title: `${event.type === "payout_method_added" ? "Added" : "Removed"} ${method ? method.name : "payout method"}`,
    type: "Payout method",
    amount: "—",
    amountClass: "",
  };
}

function formatEventDate(createdAt) {
  if (!Number.isFinite(createdAt)) return "Date not recorded";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(createdAt));
}

function matchesFilter(event) {
  if (activeFilter === "rewards") return event.type === "campaign_reward" || event.type === "referral_reward";
  if (activeFilter === "withdrawals") return event.type === "withdrawal";
  if (activeFilter === "credits") return event.type === "demo_credit";
  if (activeFilter === "account") return event.type === "payout_method_added" || event.type === "payout_method_removed";
  return true;
}

function renderHistoryRows() {
  historyRows.replaceChildren();
  const visibleEvents = history.filter(matchesFilter);
  if (!visibleEvents.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "history-empty";
    cell.textContent = history.length
      ? "No entries in this category yet."
      : "No history yet. Complete a campaign, add a demo payout provider, or simulate a referral to see activity here.";
    row.appendChild(cell);
    historyRows.appendChild(row);
    return;
  }

  for (const event of visibleEvents) {
    const details = describeEvent(event);
    const row = document.createElement("tr");
    const values = [
      details.title,
      details.type,
      event.status,
      formatEventDate(event.createdAt),
      details.amount,
    ];
    for (const [index, value] of values.entries()) {
      const cell = document.createElement("td");
      cell.textContent = value;
      if (index === 0) cell.className = "history-description";
      if (index === 4 && details.amountClass) cell.className = details.amountClass;
      row.appendChild(cell);
    }
    historyRows.appendChild(row);
  }
}

function renderPage() {
  renderSummary();
  renderMethodOptions();
  renderDemoCredit();
  renderHistoryRows();
}

function renderDemoCredit() {
  const alreadyUsed = history.some((event) => event.type === "demo_credit");
  demoCreditPanel.hidden =
    loadFailed || alreadyUsed || getAvailableBalance() >= minimumWithdrawalAmount;
}

withdrawalAmount.addEventListener("input", () => withdrawalAmount.setCustomValidity(""));
withdrawalMethod.addEventListener("change", () => withdrawalMethod.setCustomValidity(""));

addDemoCreditButton.addEventListener("click", () => {
  if (loadFailed || history.some((event) => event.type === "demo_credit")) return;

  const createdAt = Date.now();
  const credit = {
    id: `demo-credit-${createdAt}`,
    type: "demo_credit",
    amount: demoCreditAmount,
    createdAt,
    status: "Added (demo)",
  };
  const nextProgress = {
    ...progress,
    history: [credit, ...history],
  };
  try {
    localStorage.setItem(storageKeys.progress, JSON.stringify(nextProgress));
    progress = nextProgress;
    history = nextProgress.history;
    renderPage();
    setStatus(`One-time ${formatCurrency(demoCreditAmount)} demo credit added. It is not real money.`);
  } catch (error) {
    console.warn("Could not save the demo credit.", error);
    setStatus("Could not add the demo credit. Check browser storage and try again.");
  }
});

withdrawalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!withdrawalForm.reportValidity()) return;

  const amount = Math.round(Number(withdrawalAmount.value) * 100) / 100;
  const methodId = withdrawalMethod.value;
  const available = getAvailableBalance();
  if (!Number.isFinite(amount) || amount < minimumWithdrawalAmount || amount > available) {
    withdrawalAmount.setCustomValidity(
      `Enter an amount between ${formatCurrency(minimumWithdrawalAmount)} and ${formatCurrency(available)}.`,
    );
    withdrawalAmount.reportValidity();
    return;
  }
  if (!progress.methods.includes(methodId)) {
    withdrawalMethod.setCustomValidity("Choose a payout method saved on the dashboard.");
    withdrawalMethod.reportValidity();
    return;
  }

  pendingWithdrawal = { amount, methodId };
  confirmationStatus.textContent = "";
  document.querySelector("#withdrawal-review-amount").textContent = formatCurrency(amount);
  document.querySelector("#withdrawal-review-method").textContent =
    payoutMethods.find((method) => method.id === methodId).name;
  document.querySelector("#withdrawal-review-remaining").textContent =
    formatCurrency(Math.round((available - amount) * 100) / 100);
  withdrawalConfirmation.showModal();
});

document.querySelector("#cancel-withdrawal").addEventListener("click", () => {
  withdrawalConfirmation.close();
});

withdrawalConfirmation.addEventListener("close", () => {
  pendingWithdrawal = null;
});

document.querySelector("#confirm-withdrawal").addEventListener("click", () => {
  if (!pendingWithdrawal) {
    withdrawalConfirmation.close();
    return;
  }

  const { amount, methodId } = pendingWithdrawal;
  const available = getAvailableBalance();
  if (
    amount < minimumWithdrawalAmount ||
    amount > available ||
    !progress.methods.includes(methodId) ||
    loadFailed
  ) {
    withdrawalConfirmation.close();
    setStatus(
      amount < minimumWithdrawalAmount
        ? `The minimum demo withdrawal is ${formatCurrency(minimumWithdrawalAmount)}.`
        : amount > available
          ? "Your demo balance changed. Review the amount and try again."
          : "That payout provider is no longer available. Choose another provider and try again.",
    );
    renderPage();
    return;
  }

  const createdAt = Date.now();
  const withdrawal = {
    id: `withdrawal-${createdAt}-${history.length}`,
    type: "withdrawal",
    amount,
    methodId,
    createdAt,
    status: "Requested (demo)",
  };
  const nextProgress = {
    ...progress,
    history: [withdrawal, ...history],
  };
  try {
    localStorage.setItem(storageKeys.progress, JSON.stringify(nextProgress));
    progress = nextProgress;
    history = nextProgress.history;
    pendingWithdrawal = null;
    withdrawalConfirmation.close();
    withdrawalForm.reset();
    renderPage();
    setStatus("Demo request recorded and balance reserved. No money was transferred.");
  } catch (error) {
    console.warn("Could not save the demo withdrawal request.", error);
    confirmationStatus.textContent = "Could not save the request. Check browser storage and try again.";
  }
});

document.querySelectorAll(".history-filter").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(".history-filter.is-selected").classList.remove("is-selected");
    button.classList.add("is-selected");
    activeFilter = button.dataset.filter;
    renderHistoryRows();
  });
});

themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  try {
    localStorage.setItem(storageKeys.theme, nextTheme);
  } catch (error) {
    console.warn("Could not save the selected color theme.", error);
  }
});

window.addEventListener("storage", (event) => {
  if (event.key === storageKeys.progress || event.key === storageKeys.campaigns) {
    loadData();
    if (event.key === storageKeys.progress && !loadFailed) setStatus("");
  }
  if (event.key === storageKeys.theme) {
    applyTheme(event.newValue === "dark" ? "dark" : "light");
  }
});

applyTheme(document.documentElement.dataset.theme);
loadData();
if (demoStore.getLoadError()) {
  setStatus(demoStore.getLoadError());
}
