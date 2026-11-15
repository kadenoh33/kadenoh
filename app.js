let campaigns = window.KadenohDemoStore.loadCampaigns();

const payoutMethods = window.KadenohDemoStore.payoutMethods;
const calculatePreviewDuration = window.KadenohDemoStore.calculatePreviewDuration;

const STORAGE_KEY = window.KadenohDemoStore.keys.progress;
const PROFILE_IMAGE_KEY = window.KadenohDemoStore.keys.profileImage;
const DEFAULT_PROFILE_IMAGE = "assets/profile-photo.jpg";
const PROFILE_INFO_KEY = window.KadenohDemoStore.keys.profile;
const REFERRAL_REWARD = 1;
const REFERRAL_CODE = "KADENOH-DEMO";
const STUDY_LEVELS = [
  "high-school",
  "certificate-diploma",
  "undergraduate",
  "postgraduate",
  "other",
  "prefer-not-to-say",
];
const state = loadState();
let activeCampaign = null;
let watchTimer = null;
let toastTimer = null;
const campaignList = document.querySelector("#campaign-list");
const dialog = document.querySelector("#watch-dialog");
const watchButton = document.querySelector("#watch-button");
const profileDialog = document.querySelector("#profile-dialog");
const profilePhotoInput = document.querySelector("#profile-photo-input");
const profileInfoForm = document.querySelector("#profile-info-form");
const themeToggle = document.querySelector("#theme-toggle");

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const validViews = Array.isArray(saved.viewed) ? saved.viewed.filter((id) => campaigns.some((campaign) => campaign.id === id)) : [];
    const validMethods = Array.isArray(saved.methods) ? saved.methods.filter((id) => payoutMethods.some((method) => method.id === id)) : [];
    const validActivity = Array.isArray(saved.activity)
      ? saved.activity
        .filter((item) => item && typeof item === "object" &&
          campaigns.some((campaign) => campaign.id === item.id) &&
          ((Number.isFinite(item.createdAt) && item.createdAt > 0 && item.createdAt <= Date.now()) ||
            typeof item.time === "string"))
        .slice(0, 3)
        .map((item) => {
          if (Number.isFinite(item.createdAt) && item.createdAt > 0 && item.createdAt <= Date.now()) {
            return { id: item.id, createdAt: item.createdAt };
          }
          return { id: item.id, time: item.time === "Just now" ? "Previously" : item.time.slice(0, 80) };
        })
      : [];
    return {
      viewed: [...new Set(validViews)],
      activity: validActivity,
      methods: [...new Set(validMethods)],
      referralRewarded: saved.referralRewarded === true,
      history: window.KadenohDemoStore.loadHistory(saved, campaigns),
    };
  } catch (error) {
    console.warn("Could not load demo progress from local storage.", error);
    return { viewed: [], activity: [], methods: [], referralRewarded: false, history: [] };
  }
}

function saveState(nextState = state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    return true;
  } catch (error) {
    console.warn("Could not save demo progress to local storage.", error);
    return false;
  }
}

function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

function formatPreviewDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${seconds} sec`;
  return remainingSeconds ? `${minutes} min ${remainingSeconds} sec` : `${minutes} min`;
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]').content = isDark ? "#151c17" : "#f4efe6";
  themeToggle.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} theme`);
  themeToggle.title = `Switch to ${isDark ? "light" : "dark"} theme`;
  themeToggle.querySelector("span").textContent = isDark ? "☀" : "☾";
}

function applyProfileImage(imageData) {
  const headerImage = document.querySelector("#profile-image");
  const dialogImage = document.querySelector("#profile-dialog-image");
  const hasImage = Boolean(imageData);
  headerImage.hidden = !hasImage;
  dialogImage.hidden = !hasImage;
  document.querySelector("#profile-initial").hidden = hasImage;
  document.querySelector("#profile-dialog-initial").hidden = hasImage;
  document.querySelector("#remove-profile-photo").disabled = !hasImage;

  if (hasImage) {
    headerImage.src = imageData;
    dialogImage.src = imageData;
  } else {
    headerImage.removeAttribute("src");
    dialogImage.removeAttribute("src");
  }
}

function applyProfileInformation(profile) {
  const name = profile.displayName || "Dennis";
  const initial = name.trim().charAt(0).toUpperCase() || "D";
  document.querySelector("#profile-name").textContent = name;
  document.querySelector("#profile-initial").textContent = initial;
  document.querySelector("#profile-dialog-initial").textContent = initial;
  document.querySelector(".profile-button").setAttribute("aria-label", `Your profile, ${name}`);
  document.querySelector("#profile-display-name").value = name;
  document.querySelector("#profile-email").value = profile.email || "";
  document.querySelector("#profile-date-of-birth").value = profile.dateOfBirth || "";
  document.querySelector("#profile-study-level").value = profile.studyLevel || "";
  document.querySelector("#profile-location").value = profile.location || "";
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidDateOfBirth(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
}

function loadProfileInformation() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROFILE_INFO_KEY) || "{}");
    const dateOfBirth = typeof saved.dateOfBirth === "string" &&
      isValidDateOfBirth(saved.dateOfBirth) &&
      saved.dateOfBirth <= getLocalDateString()
      ? saved.dateOfBirth
      : "";
    const profile = {
      displayName: typeof saved.displayName === "string" ? saved.displayName.trim().slice(0, 80) : "",
      email: typeof saved.email === "string" ? saved.email.trim().slice(0, 254) : "",
      dateOfBirth,
      studyLevel: STUDY_LEVELS.includes(saved.studyLevel) ? saved.studyLevel : "",
      location: typeof saved.location === "string" ? saved.location.trim().slice(0, 100) : "",
    };
    applyProfileInformation(profile);
  } catch (error) {
    console.warn("Could not load profile information from local storage.", error);
    applyProfileInformation({});
    document.querySelector("#profile-info-status").textContent = "Could not load saved profile details.";
  }
}

function loadProfileImage() {
  const status = document.querySelector("#profile-photo-status");
  try {
    const imageData = localStorage.getItem(PROFILE_IMAGE_KEY);
    if (imageData === null) {
      applyProfileImage(DEFAULT_PROFILE_IMAGE);
      return;
    }
    if (!imageData) return;
    if (imageData.length > 1024 * 1024 ||
      !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(imageData)) {
      status.textContent = "Saved photo data is invalid. Choose another image.";
      return;
    }
    applyProfileImage(imageData);
    status.textContent = "Profile photo saved in this browser.";
  } catch (error) {
    console.warn("Could not load the profile photo from local storage.", error);
    status.textContent = "Could not load the saved photo.";
  }
}

function handleProfilePhoto(file) {
  const status = document.querySelector("#profile-photo-status");
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    status.textContent = "Choose a JPG, PNG, or WebP image.";
    profilePhotoInput.value = "";
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    status.textContent = "The image must be 8 MB or smaller.";
    profilePhotoInput.value = "";
    return;
  }

  status.textContent = "Preparing your photo…";
  const imageUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onerror = () => {
    URL.revokeObjectURL(imageUrl);
    profilePhotoInput.value = "";
    status.textContent = "This image could not be opened.";
  };
  image.onload = () => {
    try {
      if (image.naturalWidth > 12000 || image.naturalHeight > 12000 ||
        image.naturalWidth * image.naturalHeight > 50000000) {
        status.textContent = "This image is too large to process.";
        return;
      }

      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Image processing is unavailable.");

      const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
      const cropWidth = size / scale;
      const cropHeight = size / scale;
      context.drawImage(
        image,
        (image.naturalWidth - cropWidth) / 2,
        (image.naturalHeight - cropHeight) / 2,
        cropWidth,
        cropHeight,
        0,
        0,
        size,
        size,
      );

      const imageData = canvas.toDataURL("image/jpeg", 0.82);
      localStorage.setItem(PROFILE_IMAGE_KEY, imageData);
      applyProfileImage(imageData);
      status.textContent = "Profile photo saved in this browser only.";
    } catch (error) {
      console.warn("Could not process or save the profile photo.", error);
      status.textContent = "Could not save this photo. Try a smaller image.";
    } finally {
      URL.revokeObjectURL(imageUrl);
      profilePhotoInput.value = "";
    }
  };
  image.src = imageUrl;
}

function renderCampaigns(filter = "All") {
  campaignList.replaceChildren();
  const remainingCampaigns = campaigns.filter((campaign) => campaign.active !== false && !state.viewed.includes(campaign.id));
  document.querySelector(".chip-count").textContent = String(remainingCampaigns.length);
  const visibleCampaigns = remainingCampaigns.filter((campaign) =>
    filter === "All" || campaign.category === filter
  );
  if (!visibleCampaigns.length) {
    const empty = document.createElement("p");
    empty.className = "campaign-empty";
    empty.textContent = filter === "All"
      ? "You’ve viewed all available campaigns. Check back later for more."
      : `No more ${filter.toLowerCase()} campaigns to view.`;
    campaignList.appendChild(empty);
    return;
  }

  for (const [index, campaign] of visibleCampaigns.entries()) {
    const card = document.createElement("article");
    card.className = "campaign-card";
    const art = document.createElement("div");
    art.className = "campaign-art";
    art.style.background = `linear-gradient(135deg, ${campaign.colors[0]}, ${campaign.colors[1]})`;
    const photo = document.createElement("img");
    photo.className = "campaign-photo";
    photo.src = campaign.image;
    photo.alt = "";
    photo.loading = index < 3 ? "eager" : "lazy";
    photo.decoding = "async";
    const badge = document.createElement("span");
    badge.className = "campaign-badge";
    badge.textContent = campaign.tag;
    art.append(photo, badge);
    if (campaign.photoCredit && campaign.photoCreditUrl && campaign.photoLicense && campaign.photoLicenseUrl) {
      const credit = document.createElement("span");
      credit.className = "campaign-photo-credit";
      const authorLink = document.createElement("a");
      authorLink.href = campaign.photoCreditUrl;
      authorLink.target = "_blank";
      authorLink.rel = "noopener noreferrer";
      authorLink.textContent = campaign.photoCredit;
      const licenseLink = document.createElement("a");
      licenseLink.href = campaign.photoLicenseUrl;
      licenseLink.target = "_blank";
      licenseLink.rel = "noopener noreferrer";
      licenseLink.textContent = campaign.photoLicense;
      credit.append(authorLink, document.createTextNode(" · "), licenseLink);
      art.appendChild(credit);
    }

    const body = document.createElement("div");
    body.className = "campaign-body";
    const meta = document.createElement("div");
    meta.className = "campaign-meta";
    const category = document.createElement("span");
    category.className = "campaign-category";
    category.textContent = campaign.category;
    const length = document.createElement("span");
    length.textContent = formatPreviewDuration(calculatePreviewDuration(campaign.reward));
    meta.append(category, length);
    const title = document.createElement("h3");
    title.textContent = campaign.title;
    const description = document.createElement("p");
    description.textContent = campaign.description;
    const action = document.createElement("div");
    action.className = "campaign-action-row";
    const reward = document.createElement("span");
    reward.className = "reward-label";
    reward.textContent = `+${formatCurrency(campaign.reward)}`;
    const rewardNote = document.createElement("small");
    rewardNote.textContent = "demo reward";
    reward.appendChild(rewardNote);
    const button = document.createElement("button");
    button.className = "primary-button";
    button.type = "button";
    button.textContent = "View campaign";
    button.addEventListener("click", () => openCampaign(campaign));
    action.append(reward, button);
    body.append(meta, title, description, action);
    card.append(art, body);
    campaignList.appendChild(card);
  }
}

function renderStats() {
  const completed = window.KadenohDemoStore.calculateDemoBalance(state, campaigns, REFERRAL_REWARD);
  document.querySelector("#balance-value").textContent = formatCurrency(completed);
  document.querySelector("#views-value").textContent = String(state.viewed.length);
  document.querySelector("#goal-count").textContent = String(Math.min(state.viewed.length, 5));
  document.querySelector("#goal-progress").style.width = `${Math.min(state.viewed.length / 5, 1) * 100}%`;
  document.querySelector(".stat-foot .positive").textContent = `+ ${formatCurrency(completed)}`;
}

function renderActivity() {
  const activityList = document.querySelector("#activity-list");
  activityList.replaceChildren();
  if (!state.activity.length) {
    const empty = document.createElement("p");
    empty.className = "activity-empty";
    empty.textContent = "Your completed campaigns will show up here.";
    activityList.appendChild(empty);
    return;
  }
  for (const item of state.activity) {
    const campaign = campaigns.find((entry) => entry.id === item.id);
    if (!campaign) continue;
    const row = document.createElement("div");
    row.className = "activity-row";
    const icon = document.createElement("span");
    icon.className = "activity-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = campaign.emoji;
    const details = document.createElement("span");
    details.className = "activity-details";
    const title = document.createElement("strong");
    title.textContent = campaign.title;
    const time = document.createElement("span");
    time.textContent = formatActivityTime(item);
    details.append(title, time);
    const amount = document.createElement("span");
    amount.className = "activity-amount";
    amount.textContent = `+${formatCurrency(campaign.reward)}`;
    row.append(icon, details, amount);
    activityList.appendChild(row);
  }
}

function formatActivityTime(item) {
  if (!Number.isFinite(item.createdAt)) return item.time;
  const elapsedMinutes = Math.floor(Math.max(0, Date.now() - item.createdAt) / 60000);
  if (elapsedMinutes < 1) return "Just now";
  if (elapsedMinutes < 60) return `${elapsedMinutes} min ago`;
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours} hr ago`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(item.createdAt));
}

function renderPayoutMethods() {
  const methodsList = document.querySelector("#payout-methods");
  methodsList.replaceChildren();

  for (const method of payoutMethods) {
    const isAdded = state.methods.includes(method.id);
    const card = document.createElement("article");
    card.className = "payout-method";
    const mark = document.createElement("span");
    mark.className = `payout-mark ${method.id}`;
    mark.setAttribute("aria-hidden", "true");
    mark.textContent = method.mark;
    const details = document.createElement("div");
    details.className = "payout-details";
    const name = document.createElement("strong");
    name.textContent = method.name;
    const status = document.createElement("span");
    status.textContent = isAdded ? "Ready for demo requests" : "Choose for demo requests";
    details.append(name, status);
    const button = document.createElement("button");
    button.className = isAdded ? "method-button remove-method" : "method-button";
    button.type = "button";
    button.textContent = isAdded ? "Remove" : "Add for demo";
    button.setAttribute("aria-label", `${isAdded ? "Remove" : "Add"} ${method.name} ${isAdded ? "from" : "for"} demo requests`);
    button.addEventListener("click", () => {
      const methodAdded = !isAdded;
      const methods = isAdded
        ? state.methods.filter((id) => id !== method.id)
        : [...state.methods, method.id];
      const createdAt = Date.now();
      const event = {
        id: `payout-method-${method.id}-${createdAt}`,
        type: methodAdded ? "payout_method_added" : "payout_method_removed",
        methodId: method.id,
        createdAt,
        status: methodAdded ? "Added" : "Removed",
      };
      const history = [event, ...state.history];
      if (!saveState({ ...state, methods, history })) {
        showToast("Could not save this payout preference. Check browser storage and try again.");
        return;
      }
      state.methods = methods;
      state.history = history;
      renderPayoutMethods();
      showToast(`${method.name} ${isAdded ? "removed from" : "added for"} demo requests`);
    });
    card.append(mark, details, button);
    methodsList.appendChild(card);
  }
}

function renderReferralOptions() {
  const link = new URL(window.location.href);
  link.searchParams.set("ref", REFERRAL_CODE);
  link.hash = "";
  const referralLink = link.toString();
  document.querySelector("#referral-link").value = referralLink;
  document.querySelector("#referral-email").href =
    `mailto:?subject=${encodeURIComponent("Join me on Kadenoh")}&body=${encodeURIComponent(`Join me on Kadenoh: ${referralLink}`)}`;
  document.querySelector("#referral-whatsapp").href =
    `https://wa.me/?text=${encodeURIComponent(`Join me on Kadenoh: ${referralLink}`)}`;

  const rewardButton = document.querySelector("#simulate-referral");
  rewardButton.disabled = state.referralRewarded;
  rewardButton.textContent = state.referralRewarded
    ? "Demo reward claimed ✓"
    : `Simulate referral (+${formatCurrency(REFERRAL_REWARD)})`;
  document.querySelector("#referral-status").textContent = state.referralRewarded
    ? `Your ${formatCurrency(REFERRAL_REWARD)} demo credit has been added.`
    : "Simulate one successful invite to preview the demo credit.";
}

function openCampaign(campaign) {
  if (state.viewed.includes(campaign.id)) return;
  activeCampaign = campaign;
  document.querySelector("#dialog-title").textContent = campaign.title;
  document.querySelector("#dialog-description").textContent = campaign.description;
  document.querySelector("#dialog-emoji").textContent = campaign.emoji;
  document.querySelector("#dialog-art").style.background = `linear-gradient(135deg, ${campaign.colors[0]}, ${campaign.colors[1]})`;
  document.querySelector("#watch-status").textContent =
    `Preview · ${formatPreviewDuration(calculatePreviewDuration(campaign.reward))}`;
  document.querySelector("#watch-progress-fill").style.width = "0";
  watchButton.textContent = "Start preview";
  watchButton.disabled = false;
  dialog.showModal();
}

function startPreview() {
  if (!activeCampaign || watchButton.disabled) return;
  watchButton.disabled = true;
  let seconds = 0;
  const duration = calculatePreviewDuration(activeCampaign.reward);
  watchButton.textContent = "Previewing…";
  document.querySelector("#watch-status").textContent = `Previewing · ${formatPreviewDuration(duration)}`;
  watchTimer = window.setInterval(() => {
    seconds += 1;
    document.querySelector("#watch-progress-fill").style.width = `${Math.min(seconds / duration, 1) * 100}%`;
    document.querySelector("#watch-status").textContent =
      seconds < duration ? `Previewing · ${formatPreviewDuration(duration - seconds)} left` : "Preview complete";
    if (seconds >= duration) {
      completePreview();
      dialog.close();
    }
  }, 1000);
}

function completePreview() {
  window.clearInterval(watchTimer);
  watchTimer = null;
  if (!activeCampaign || state.viewed.includes(activeCampaign.id)) return;
  state.viewed.push(activeCampaign.id);
  const createdAt = Date.now();
  state.activity.unshift({ id: activeCampaign.id, createdAt });
  state.activity = state.activity.slice(0, 3);
  state.history.unshift({
    id: `campaign-reward-${activeCampaign.id}-${createdAt}`,
    type: "campaign_reward",
    campaignId: activeCampaign.id,
    amount: activeCampaign.reward,
    createdAt,
    status: "Completed",
  });
  saveState();
  renderCampaigns(document.querySelector(".filter-chip.selected").dataset.filter);
  renderStats();
  renderActivity();
  watchButton.textContent = "Completed ✓";
  showToast(`Demo reward added: ${formatCurrency(activeCampaign.reward)}`);
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2800);
}

document.querySelectorAll(".filter-chip").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector(".filter-chip.selected").classList.remove("selected");
    button.classList.add("selected");
    renderCampaigns(button.dataset.filter);
  });
});

document.querySelector("#copy-referral-link").addEventListener("click", async () => {
  const referralLink = document.querySelector("#referral-link");
  const status = document.querySelector("#referral-status");
  try {
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
      throw new Error("Clipboard access is unavailable.");
    }
    await navigator.clipboard.writeText(referralLink.value);
    status.textContent = "Referral link copied.";
  } catch (error) {
    console.warn("Could not copy the referral link.", error);
    referralLink.focus();
    referralLink.select();
    status.textContent = "Could not copy automatically. The link is selected so you can copy it manually.";
  }
});
document.querySelector("#simulate-referral").addEventListener("click", () => {
  if (state.referralRewarded) return;
  state.referralRewarded = true;
  const createdAt = Date.now();
  state.history.unshift({
    id: `referral-reward-${createdAt}`,
    type: "referral_reward",
    amount: REFERRAL_REWARD,
    createdAt,
    status: "Completed",
  });
  saveState();
  renderStats();
  renderReferralOptions();
  showToast(`Demo referral reward added: ${formatCurrency(REFERRAL_REWARD)}`);
});
watchButton.addEventListener("click", startPreview);
document.querySelector("#watch-dialog .dialog-close").addEventListener("click", () => {
  if (activeCampaign && !state.viewed.includes(activeCampaign.id)) completePreview();
  dialog.close();
});
dialog.addEventListener("close", () => {
  if (watchTimer) window.clearInterval(watchTimer);
  watchTimer = null;
  activeCampaign = null;
});
document.querySelector(".notice-close").addEventListener("click", () => {
  document.querySelector("#demo-notice").hidden = true;
});
document.querySelector(".profile-button").addEventListener("click", () => profileDialog.showModal());
document.querySelector("#close-profile-dialog").addEventListener("click", () => profileDialog.close());
document.querySelector("#profile-date-of-birth").max = getLocalDateString();
profileInfoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const nameInput = document.querySelector("#profile-display-name");
  const emailInput = document.querySelector("#profile-email");
  const dateOfBirthInput = document.querySelector("#profile-date-of-birth");
  const profile = {
    displayName: nameInput.value.trim(),
    email: emailInput.value.trim(),
    dateOfBirth: dateOfBirthInput.value,
    studyLevel: document.querySelector("#profile-study-level").value,
    location: document.querySelector("#profile-location").value.trim(),
  };
  nameInput.setCustomValidity(profile.displayName ? "" : "Enter a display name.");
  dateOfBirthInput.setCustomValidity(
    !profile.dateOfBirth || profile.dateOfBirth <= getLocalDateString()
      ? ""
      : "Date of birth cannot be in the future.",
  );
  if (!profileInfoForm.reportValidity()) return;

  try {
    localStorage.setItem(PROFILE_INFO_KEY, JSON.stringify(profile));
    applyProfileInformation(profile);
    document.querySelector("#profile-info-status").textContent = "Profile details saved in this browser.";
  } catch (error) {
    console.warn("Could not save profile information to local storage.", error);
    document.querySelector("#profile-info-status").textContent = "Could not save profile details. Check browser storage and try again.";
  }
});
profilePhotoInput.addEventListener("change", () => {
  const file = profilePhotoInput.files && profilePhotoInput.files[0];
  if (file) handleProfilePhoto(file);
});
document.querySelector("#remove-profile-photo").addEventListener("click", () => {
  try {
    localStorage.setItem(PROFILE_IMAGE_KEY, "");
    applyProfileImage(null);
    document.querySelector("#profile-photo-status").textContent = "Profile photo removed.";
  } catch (error) {
    console.warn("Could not remove the profile photo.", error);
    document.querySelector("#profile-photo-status").textContent = "Could not remove the photo.";
  }
});
themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  try {
    localStorage.setItem(window.KadenohDemoStore.keys.theme, nextTheme);
  } catch (error) {
    console.warn("Could not save the selected color theme.", error);
  }
});
window.addEventListener("storage", (event) => {
  const selectedFilter = document.querySelector(".filter-chip.selected");
  let filter = selectedFilter ? selectedFilter.dataset.filter : "All";

  if (event.key === window.KadenohDemoStore.keys.campaigns) {
    campaigns = window.KadenohDemoStore.loadCampaigns();
    if (filter !== "All" && !campaigns.some((campaign) => campaign.active !== false && campaign.category === filter)) {
      document.querySelector(".filter-chip.selected").classList.remove("selected");
      document.querySelector('[data-filter="All"]').classList.add("selected");
      filter = "All";
    }
    renderCampaigns(filter);
    renderStats();
    renderActivity();
  }
  if (event.key === STORAGE_KEY) {
    Object.assign(state, loadState());
    renderCampaigns(filter);
    renderStats();
    renderActivity();
    renderPayoutMethods();
    renderReferralOptions();
  }
  if (event.key === PROFILE_INFO_KEY) loadProfileInformation();
  if (event.key === window.KadenohDemoStore.keys.theme) {
    applyTheme(event.newValue === "dark" ? "dark" : "light");
  }
});
window.addEventListener("kadenoh:profile-updated", loadProfileInformation);
applyTheme(document.documentElement.dataset.theme);
document.querySelector("#today-label").textContent = new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(new Date());

renderCampaigns();
renderStats();
renderActivity();
renderPayoutMethods();
renderReferralOptions();
loadProfileInformation();
loadProfileImage();
