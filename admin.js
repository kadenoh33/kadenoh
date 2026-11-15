"use strict";

const demoStore = window.KadenohDemoStore;
const storageKeys = demoStore.keys;
const progressKey = storageKeys.progress;
let campaigns = demoStore.loadCampaigns();

const campaignRows = document.querySelector("#campaign-rows");
const activityRows = document.querySelector("#activity-rows");
const campaignDialog = document.querySelector("#campaign-dialog");
const campaignForm = document.querySelector("#campaign-form");

function setStatus(elementId, message) {
  document.querySelector(elementId).textContent = message;
}

function readStoredJson(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    console.warn(`Could not read ${key} from local storage.`, error);
    setStatus("#admin-status", "Some saved demo data could not be read. Check browser storage.");
    return fallback;
  }
}

function readProgress() {
  const saved = readStoredJson(progressKey, {});
  return {
    viewed: Array.isArray(saved.viewed)
      ? [...new Set(saved.viewed.filter((id) => typeof id === "string" && campaigns.some((campaign) => campaign.id === id)))]
      : [],
    activity: Array.isArray(saved.activity) ? saved.activity : [],
    referralRewarded: saved.referralRewarded === true,
  };
}

function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

function renderOverview(progress) {
  const activeCampaignCount = campaigns.filter((campaign) => campaign.active !== false).length;
  const campaignEarnings = progress.viewed.reduce((sum, id) => {
    const campaign = campaigns.find((item) => item.id === id);
    return sum + (campaign ? campaign.reward : 0);
  }, 0);
  const balance = campaignEarnings + (progress.referralRewarded ? 1 : 0);

  document.querySelector("#active-campaign-count").textContent = String(activeCampaignCount);
  document.querySelector("#preview-count").textContent = String(progress.viewed.length);
  document.querySelector("#demo-balance").textContent = formatCurrency(balance);
}

function createActionButton(label, action, campaignId, className) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.dataset.action = action;
  button.dataset.id = campaignId;
  return button;
}

function renderCampaignRows(progress) {
  campaignRows.replaceChildren();

  if (!campaigns.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.className = "admin-empty-cell";
    cell.textContent = "No campaigns yet. Add one to get started.";
    row.appendChild(cell);
    campaignRows.appendChild(row);
    return;
  }

  for (const campaign of campaigns) {
    const row = document.createElement("tr");
    const campaignCell = document.createElement("td");
    const identity = document.createElement("div");
    identity.className = "admin-campaign-identity";
    const image = document.createElement("img");
    image.src = campaign.image;
    image.alt = "";
    image.loading = "lazy";
    const title = document.createElement("span");
    title.textContent = campaign.title;
    identity.append(image, title);
    campaignCell.appendChild(identity);

    const categoryCell = document.createElement("td");
    categoryCell.textContent = campaign.category;

    const rewardCell = document.createElement("td");
    rewardCell.textContent = formatCurrency(campaign.reward);

    const statusCell = document.createElement("td");
    const status = document.createElement("span");
    const isActive = campaign.active !== false;
    status.className = `admin-campaign-status ${isActive ? "is-active" : "is-paused"}`;
    status.textContent = isActive ? "Active" : "Paused";
    statusCell.appendChild(status);

    const actionsCell = document.createElement("td");
    actionsCell.className = "admin-actions-cell";
    actionsCell.append(
      createActionButton("Edit", "edit", campaign.id, "admin-action-button"),
      createActionButton(isActive ? "Pause" : "Activate", "toggle", campaign.id, "admin-action-button"),
    );
    const hasActivity = progress.viewed.includes(campaign.id);
    const deleteButton = createActionButton("Delete", "delete", campaign.id, "admin-action-button is-danger");
    deleteButton.disabled = hasActivity;
    if (hasActivity) deleteButton.title = "Reset demo progress before deleting a campaign with activity.";
    actionsCell.appendChild(deleteButton);

    row.append(campaignCell, categoryCell, rewardCell, statusCell, actionsCell);
    campaignRows.appendChild(row);
  }
}

function formatActivityDate(item) {
  if (Number.isFinite(item.createdAt) && item.createdAt > 0 && item.createdAt <= Date.now()) {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(item.createdAt));
  }
  return typeof item.time === "string" ? item.time : "Previously";
}

function renderActivity(progress) {
  activityRows.replaceChildren();
  const items = progress.activity
    .filter((item) => item && typeof item === "object" && campaigns.some((campaign) => campaign.id === item.id))
    .slice(0, 20);

  if (!items.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.className = "admin-empty-cell";
    cell.textContent = "No campaign activity saved in this browser yet.";
    row.appendChild(cell);
    activityRows.appendChild(row);
    return;
  }

  for (const item of items) {
    const campaign = campaigns.find((entry) => entry.id === item.id);
    const row = document.createElement("tr");
    for (const value of [
      campaign.title,
      campaign.category,
      formatCurrency(campaign.reward),
      formatActivityDate(item),
    ]) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    }
    activityRows.appendChild(row);
  }
}

function renderCategoryOptions(selectedCategory) {
  const categorySelect = document.querySelector("#campaign-category");
  const categories = [...new Set([
    ...demoStore.defaultCampaigns().map((campaign) => campaign.category),
    ...campaigns.map((campaign) => campaign.category),
  ])].sort((a, b) => a.localeCompare(b));
  categorySelect.replaceChildren();

  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    option.selected = category === selectedCategory;
    categorySelect.appendChild(option);
  }
}

function renderAll() {
  const progress = readProgress();
  renderOverview(progress);
  renderCampaignRows(progress);
  renderActivity(progress);
}

function openCampaignEditor(campaign) {
  campaignForm.reset();
  setStatus("#campaign-form-status", "");
  const editing = Boolean(campaign);
  document.querySelector("#campaign-dialog-title").textContent = editing ? "Edit campaign" : "Add campaign";
  document.querySelector("#campaign-id").value = campaign ? campaign.id : "";
  document.querySelector("#campaign-title").value = campaign ? campaign.title : "";
  document.querySelector("#campaign-tag").value = campaign ? campaign.tag : "";
  document.querySelector("#campaign-reward").value = campaign ? String(campaign.reward) : "0.10";
  document.querySelector("#campaign-duration").value = campaign ? String(campaign.duration) : "8";
  document.querySelector("#campaign-emoji").value = campaign ? campaign.emoji : "✨";
  document.querySelector("#campaign-image").value = campaign ? campaign.image : "";
  document.querySelector("#campaign-description").value = campaign ? campaign.description : "";
  renderCategoryOptions(campaign ? campaign.category : "Food");
  campaignDialog.showModal();
}

function createCampaignId(title) {
  const baseId = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 54) || "campaign";
  let id = baseId;
  let suffix = 2;
  while (campaigns.some((campaign) => campaign.id === id)) {
    id = `${baseId.slice(0, 57)}-${suffix}`;
    suffix += 1;
  }
  return id;
}

function saveCampaignList(nextCampaigns, successMessage) {
  try {
    demoStore.saveCampaigns(nextCampaigns);
    campaigns = demoStore.loadCampaigns();
    renderAll();
    setStatus("#admin-status", successMessage);
    return true;
  } catch (error) {
    console.warn("Could not save campaign changes.", error);
    setStatus("#campaign-form-status", "Could not save campaign changes. Check browser storage and try again.");
    setStatus("#admin-status", "Could not save campaign changes. Check browser storage and try again.");
    return false;
  }
}

document.querySelector("#create-campaign").addEventListener("click", () => {
  openCampaignEditor(null);
});

document.querySelector("#close-campaign-dialog").addEventListener("click", () => campaignDialog.close());
document.querySelector("#cancel-campaign").addEventListener("click", () => campaignDialog.close());

campaignForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!campaignForm.reportValidity()) return;

  const existingId = document.querySelector("#campaign-id").value;
  const original = campaigns.find((campaign) => campaign.id === existingId);
  const title = document.querySelector("#campaign-title").value.trim();
  const campaign = {
    ...(original || {}),
    id: original ? original.id : createCampaignId(title),
    title,
    category: document.querySelector("#campaign-category").value,
    tag: document.querySelector("#campaign-tag").value.trim().toUpperCase(),
    reward: Number(document.querySelector("#campaign-reward").value),
    duration: Number(document.querySelector("#campaign-duration").value),
    emoji: document.querySelector("#campaign-emoji").value.trim(),
    image: document.querySelector("#campaign-image").value.trim(),
    description: document.querySelector("#campaign-description").value.trim(),
    colors: original ? original.colors : ["#e8eee7", "#f2eee5"],
    active: original ? original.active !== false : true,
  };

  if (original && campaign.image !== original.image) {
    delete campaign.photoCredit;
    delete campaign.photoCreditUrl;
    delete campaign.photoLicense;
    delete campaign.photoLicenseUrl;
  }

  const nextCampaigns = original
    ? campaigns.map((item) => item.id === original.id ? campaign : item)
    : [...campaigns, campaign];
  if (!demoStore.isValidCampaign(campaign)) {
    setStatus("#campaign-form-status", "Check the campaign details. Use a valid local image path and supported reward/length values.");
    return;
  }
  if (saveCampaignList(nextCampaigns, original ? "Campaign updated." : "Campaign added.")) {
    campaignDialog.close();
  }
});

campaignRows.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const campaign = campaigns.find((item) => item.id === button.dataset.id);
  if (!campaign) return;

  if (button.dataset.action === "edit") {
    openCampaignEditor(campaign);
    return;
  }

  if (button.dataset.action === "toggle") {
    const nextCampaigns = campaigns.map((item) => item.id === campaign.id
      ? { ...item, active: item.active === false }
      : item);
    saveCampaignList(nextCampaigns, campaign.active === false ? "Campaign activated." : "Campaign paused.");
    return;
  }

  if (button.dataset.action === "delete") {
    if (readProgress().viewed.includes(campaign.id)) {
      setStatus("#admin-status", "This campaign has activity. Reset demo progress before deleting it.");
      return;
    }
    if (!window.confirm(`Delete "${campaign.title}" from this browser?`)) return;
    saveCampaignList(campaigns.filter((item) => item.id !== campaign.id), "Campaign deleted.");
  }
});

document.querySelector("#profile-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const nameInput = document.querySelector("#admin-profile-name");
  const emailInput = document.querySelector("#admin-profile-email");
  const displayName = nameInput.value.trim();
  const email = emailInput.value.trim();
  nameInput.setCustomValidity(displayName ? "" : "Enter a display name.");
  if (!event.currentTarget.reportValidity()) return;

  try {
    const currentProfile = readStoredJson(storageKeys.profile, {});
    localStorage.setItem(storageKeys.profile, JSON.stringify({
      ...currentProfile,
      displayName,
      email,
    }));
    window.dispatchEvent(new Event("kadenoh:profile-updated"));
    setStatus("#profile-status", "Local profile saved in this browser.");
  } catch (error) {
    console.warn("Could not save the local profile.", error);
    setStatus("#profile-status", "Could not save the profile. Check browser storage and try again.");
  }
});

function applyTheme(theme) {
  const isDark = theme === "dark";
  const nextTheme = isDark ? "dark" : "light";
  document.documentElement.dataset.theme = nextTheme;
  document.querySelector('meta[name="theme-color"]').content = isDark ? "#151c17" : "#f4efe6";
  const toggle = document.querySelector("#theme-toggle");
  toggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} theme`);
  toggle.title = `Switch to ${isDark ? "light" : "dark"} theme`;
  toggle.querySelector("span").textContent = isDark ? "☀" : "☾";
  document.querySelector("#admin-theme").value = nextTheme;
}

document.querySelector("#theme-toggle").addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.querySelector("#admin-theme").value = nextTheme;
  document.querySelector("#theme-form").requestSubmit();
});

document.querySelector("#theme-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const theme = document.querySelector("#admin-theme").value === "dark" ? "dark" : "light";
  try {
    localStorage.setItem(storageKeys.theme, theme);
    applyTheme(theme);
    setStatus("#settings-status", "Theme preference saved for this browser.");
  } catch (error) {
    console.warn("Could not save the theme preference.", error);
    setStatus("#settings-status", "Could not save the theme. Check browser storage and try again.");
  }
});

document.querySelector("#reset-progress").addEventListener("click", () => {
  if (!window.confirm("Clear viewed campaigns and demo rewards saved in this browser?")) return;
  try {
    localStorage.removeItem(progressKey);
    renderAll();
    setStatus("#admin-status", "Demo activity and rewards were reset.");
  } catch (error) {
    console.warn("Could not reset demo progress.", error);
    setStatus("#admin-status", "Could not reset demo progress. Check browser storage and try again.");
  }
});

document.querySelector("#restore-campaigns").addEventListener("click", () => {
  const defaultIds = new Set(demoStore.defaultCampaigns().map((campaign) => campaign.id));
  const customViewed = readProgress().viewed.some((id) => !defaultIds.has(id));
  if (customViewed) {
    setStatus("#admin-status", "Reset demo progress before restoring defaults; this preserves activity for custom campaigns.");
    return;
  }
  if (!window.confirm("Restore the original built-in campaigns? Local campaign edits will be removed.")) return;
  try {
    demoStore.resetCampaigns();
    campaigns = demoStore.loadCampaigns();
    renderAll();
    setStatus("#admin-status", "Built-in campaigns restored.");
  } catch (error) {
    console.warn("Could not restore the built-in campaigns.", error);
    setStatus("#admin-status", "Could not restore campaigns. Check browser storage and try again.");
  }
});

function loadProfileForm() {
  const profile = readStoredJson(storageKeys.profile, {});
  document.querySelector("#admin-profile-name").value =
    typeof profile.displayName === "string" && profile.displayName.trim() ? profile.displayName : "Dennis";
  document.querySelector("#admin-profile-email").value =
    typeof profile.email === "string" ? profile.email : "";
}

loadProfileForm();
window.addEventListener("kadenoh:profile-updated", loadProfileForm);
applyTheme(document.documentElement.dataset.theme);
renderAll();

if (demoStore.getLoadError()) {
  setStatus("#admin-status", demoStore.getLoadError());
}

window.addEventListener("storage", (event) => {
  if (event.key === storageKeys.campaigns) {
    campaigns = demoStore.loadCampaigns();
    renderAll();
  }
  if (event.key === progressKey) renderAll();
  if (event.key === storageKeys.profile) loadProfileForm();
  if (event.key === storageKeys.theme) applyTheme(event.newValue === "dark" ? "dark" : "light");
});
