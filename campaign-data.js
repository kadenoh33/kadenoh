(() => {
  const keys = Object.freeze({
    campaigns: "kadenoh-demo-campaigns-v1",
    progress: "perkly-demo-state-v1",
    profile: "kadenoh-profile-information-v1",
    profileImage: "perkly-profile-image-v1",
    theme: "kadenoh-theme",
    auth: "kadenoh-demo-session-v1",
  });
  const payoutMethods = [
    { id: "paypal", name: "PayPal", mark: "P" },
    { id: "wise", name: "Wise", mark: "W" },
    { id: "binance", name: "Binance", mark: "B" },
  ];
  const minimumWithdrawalAmount = 15;
  const demoCreditAmount = minimumWithdrawalAmount;
  const defaultCampaigns = [
    { id: "morning-brew", title: "A brighter morning brew", category: "Food", tag: "FOOD & DRINK", emoji: "☕", image: "assets/campaign-coffee.jpg", reward: 0.12, duration: 8, description: "Meet a smoother start to your morning with this quick introduction to Good Day Coffee.", colors: ["#e8ddd0", "#f2eadc"] },
    { id: "move-easy", title: "Move a little easier", category: "Lifestyle", tag: "WELLNESS", emoji: "👟", image: "assets/campaign-wellness.jpg", reward: 0.18, duration: 10, description: "Take a look at everyday essentials designed to make moving feel a little more comfortable.", colors: ["#dce9df", "#eaf0e8"] },
    { id: "sound-space", title: "Find your quiet place", category: "Tech", tag: "TECH", emoji: "🎧", image: "assets/campaign-audio.jpg", reward: 0.15, duration: 9, description: "Discover a new way to tune into the sounds, stories, and playlists you love.", colors: ["#e2deef", "#eeebf5"] },
    { id: "fresh-skin", title: "A fresh take on skincare", category: "Lifestyle", tag: "SELF CARE", emoji: "🧴", image: "assets/campaign-skincare.jpg", reward: 0.10, duration: 7, description: "Get to know a gentle daily routine made with simple ingredients and an easy-going feel.", colors: ["#f0dfe0", "#f4e9e5"] },
    { id: "little-escape", title: "Your next little escape", category: "Travel", tag: "TRAVEL", emoji: "✈️", image: "assets/campaign-travel.jpg", reward: 0.20, duration: 12, description: "Explore a few thoughtful ideas for making your next weekend away feel special.", colors: ["#dce9eb", "#e8f0ed"] },
    { id: "lunch-reset", title: "A fresh lunch reset", category: "Food", tag: "FOOD & DRINK", emoji: "🥗", image: "assets/campaign-lunch.jpg", reward: 0.11, duration: 7, description: "Discover a colorful, feel-good lunch idea made for a quick midday break.", colors: ["#dce9d9", "#f0e9ce"] },
    { id: "calm-corner", title: "Make room to unwind", category: "Lifestyle", tag: "AT HOME", emoji: "🏡", image: "assets/campaign-home.jpg", reward: 0.14, duration: 9, description: "See simple home details that can make a quiet corner feel more inviting.", colors: ["#e5e0d6", "#f2eee5"] },
    { id: "open-road", title: "Take the scenic route", category: "Travel", tag: "TRAVEL", emoji: "🗺️", image: "assets/campaign-road.jpg", reward: 0.19, duration: 11, description: "Find a little inspiration for your next weekend out of town.", colors: ["#dce9eb", "#e9e6d9"] },
    { id: "workday-focus", title: "A clearer workspace", category: "Tech", tag: "TECH", emoji: "💻", image: "assets/campaign-workspace.jpg", reward: 0.13, duration: 8, description: "Explore useful ideas for keeping your desk and your day a little more focused.", colors: ["#e1e9ee", "#eeece4"] },
    { id: "skin-routine", title: "A softer skin routine", category: "Lifestyle", tag: "SELF CARE", emoji: "🧴", image: "assets/campaign-beauty.jpg", reward: 0.09, duration: 6, description: "Take a look at a gentle daily-care routine built around a few easy steps.", colors: ["#f0dfe0", "#f7eee8"] },
    { id: "everyday-layers", title: "Everyday layers, reimagined", category: "Clothing", tag: "STYLE", emoji: "👕", image: "assets/campaign-clothing.jpg", reward: 0.16, duration: 8, description: "Explore versatile pieces designed to make getting dressed feel simple.", colors: ["#e9e1d7", "#f2eee7"] },
    { id: "drive-forward", title: "Find your next ride", category: "Cars", tag: "AUTOMOTIVE", emoji: "🚗", image: "assets/campaign-car.jpg", reward: 2, duration: 10, description: "Take a quick look at a thoughtfully designed car for everyday drives.", colors: ["#dce4e8", "#edf0ed"] },
    { id: "lamborghini-huracan", title: "A closer look at the Lamborghini Huracán", category: "Cars", tag: "AUTOMOTIVE", emoji: "🏎️", image: "assets/campaign-lamborghini.jpg", reward: 2, duration: 10, description: "Explore the design of the Lamborghini Huracán Performante in this fictional campaign preview.", photoCredit: "Matti Blume", photoCreditUrl: "https://commons.wikimedia.org/wiki/File:Lamborghini_Huracan_Performante,_IAA_2017,_Frankfurt_(1Y7A2827).jpg", photoLicense: "CC BY-SA 4.0", photoLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", colors: ["#dce4e8", "#edf0ed"] },
    { id: "table-setting", title: "Make every meal a little easier", category: "Cutlery", tag: "TABLEWARE", emoji: "🍴", image: "assets/campaign-cutlery.svg", reward: 0.12, duration: 7, description: "Explore practical utensils designed to make everyday meals feel special.", colors: ["#e8eee7", "#f2eee5"] },
    { id: "living-room-refresh", title: "A more comfortable living room", category: "Furniture", tag: "FURNITURE", emoji: "🛋️", image: "assets/campaign-furniture.jpg", reward: 0.15, duration: 9, description: "See how thoughtful furniture can make your favorite room feel more inviting.", colors: ["#e9e1d7", "#f2eee5"] },
    { id: "kitchen-tools", title: "Handy tools for everyday cooking", category: "Utensils", tag: "KITCHEN", emoji: "🥄", image: "assets/campaign-utensils.svg", reward: 0.13, duration: 8, description: "Discover the everyday kitchen tools that make prepping and serving feel effortless.", colors: ["#e8eee7", "#f2eee5"] },
    { id: "everyday-laptop", title: "A laptop for your next big idea", category: "Laptop", tag: "TECH", emoji: "💻", image: "assets/campaign-laptop.svg", reward: 0.22, duration: 10, description: "Explore a versatile laptop made for creative projects, focused work, and everyday browsing.", colors: ["#e1e9ee", "#eeece4"] },
    { id: "everyday-charge", title: "Power up and keep moving", category: "Charger", tag: "TECH ACCESSORIES", emoji: "🔌", image: "assets/campaign-charger.svg", reward: 0.14, duration: 7, description: "Take a look at a compact charger and cable made to keep your everyday devices ready to go.", colors: ["#e4e6f0", "#eef0eb"] },
    { id: "gather-round", title: "A table that brings everyone together", category: "Tables", tag: "DINING", emoji: "🪑", image: "assets/campaign-tables.jpg", reward: 0.16, duration: 8, description: "Discover a thoughtfully designed table that makes everyday meals and get-togethers feel special.", colors: ["#eee7dc", "#e7eee7"] },
    { id: "favorite-seat", title: "Find your favorite seat", category: "Chairs", tag: "SEATING", emoji: "🪑", image: "assets/campaign-chairs.jpg", reward: 0.15, duration: 8, description: "Take a look at a comfortable chair made to bring a little more ease to your everyday space.", colors: ["#e9e1d7", "#f0e9e3"] },
    { id: "soft-light", title: "Find the right light for your space", category: "Lights", tag: "LIGHTING", emoji: "💡", image: "assets/campaign-lights.jpg", reward: 0.13, duration: 7, description: "Explore a simple, adjustable lamp that adds focused light to your desk or reading corner.", colors: ["#e9e8e2", "#f2eee5"] },
    { id: "modern-home", title: "A place to call home", category: "House", tag: "PROPERTY", emoji: "🏠", image: "assets/campaign-house.jpg", reward: 0.18, duration: 9, description: "Explore a modern home designed to bring open spaces, natural light, and everyday comfort together.", colors: ["#e5e9e4", "#f2eee5"] },
    { id: "everyday-watch", title: "Time well spent", category: "Watch", tag: "ACCESSORIES", emoji: "⌚", image: "assets/campaign-watch.jpg", reward: 0.14, duration: 8, description: "Take a look at a clean, modern watch designed to complement your everyday style.", colors: ["#e8e7e3", "#f2eee5"] },
    { id: "home-freezer", title: "A little more room for fresh", category: "Freezer", tag: "HOME APPLIANCES", emoji: "🧊", image: "assets/campaign-freezer.jpg", reward: 0.17, duration: 8, description: "Explore a spacious fridge-freezer designed to keep everyday ingredients organized and close at hand.", colors: ["#e3eceb", "#f2eee5"] },
  ];
  let loadError = "";

  function cloneCampaigns(campaigns) {
    return JSON.parse(JSON.stringify(campaigns));
  }

  function isValidCampaign(campaign) {
    return Boolean(
      campaign &&
      typeof campaign === "object" &&
      /^[a-z0-9-]{1,60}$/.test(campaign.id) &&
      typeof campaign.title === "string" && campaign.title.trim().length > 0 && campaign.title.length <= 80 &&
      typeof campaign.category === "string" && campaign.category.trim().length > 0 && campaign.category.length <= 40 &&
      typeof campaign.tag === "string" && campaign.tag.trim().length > 0 && campaign.tag.length <= 30 &&
      typeof campaign.emoji === "string" && campaign.emoji.length > 0 && campaign.emoji.length <= 12 &&
      typeof campaign.image === "string" && /^assets\/[A-Za-z0-9._/-]+$/.test(campaign.image) && !campaign.image.includes("..") &&
      Number.isFinite(campaign.reward) && campaign.reward >= 0 && campaign.reward <= 1000 &&
      Number.isInteger(campaign.duration) && campaign.duration >= 1 && campaign.duration <= 60 &&
      typeof campaign.description === "string" && campaign.description.trim().length > 0 && campaign.description.length <= 240 &&
      Array.isArray(campaign.colors) && campaign.colors.length === 2 && campaign.colors.every((color) => /^#[0-9a-f]{6}$/i.test(color)) &&
      (campaign.active === undefined || typeof campaign.active === "boolean")
    );
  }

  function loadCampaigns() {
    loadError = "";
    try {
      const saved = localStorage.getItem(keys.campaigns);
      if (saved === null) return cloneCampaigns(defaultCampaigns);
      const parsed = JSON.parse(saved);
      const ids = Array.isArray(parsed) ? parsed.map((campaign) => campaign && campaign.id) : [];
      if (!Array.isArray(parsed) || !parsed.every(isValidCampaign) || new Set(ids).size !== ids.length) {
        throw new Error("Saved campaign list has an invalid shape.");
      }
      return cloneCampaigns(parsed);
    } catch (error) {
      loadError = "Saved campaign data could not be read. Showing the built-in campaigns.";
      console.warn("Could not load campaign data from local storage.", error);
      return cloneCampaigns(defaultCampaigns);
    }
  }

  function saveCampaigns(campaigns) {
    const ids = Array.isArray(campaigns) ? campaigns.map((campaign) => campaign && campaign.id) : [];
    if (!Array.isArray(campaigns) || !campaigns.every(isValidCampaign) || new Set(ids).size !== ids.length) {
      throw new Error("Campaign list is invalid or contains duplicate IDs.");
    }
    localStorage.setItem(keys.campaigns, JSON.stringify(campaigns));
  }

  function resetCampaigns() {
    localStorage.removeItem(keys.campaigns);
  }

  function isValidHistoryEvent(event, campaigns) {
    if (!event || typeof event !== "object" || typeof event.id !== "string" || !event.id || event.id.length > 160) return false;
    if (!(event.createdAt === null || (Number.isFinite(event.createdAt) && event.createdAt > 0 && event.createdAt <= Date.now()))) return false;

    if (event.type === "campaign_reward") {
      return campaigns.some((campaign) => campaign.id === event.campaignId) &&
        Number.isFinite(event.amount) && event.amount >= 0 && event.amount <= 1000 &&
        event.status === "Completed";
    }
    if (event.type === "referral_reward") {
      return Number.isFinite(event.amount) && event.amount >= 0 && event.amount <= 1000 &&
        event.status === "Completed";
    }
    if (event.type === "withdrawal") {
      return payoutMethods.some((method) => method.id === event.methodId) &&
        Number.isFinite(event.amount) && event.amount > 0 && event.amount <= 1000 &&
        event.status === "Requested (demo)";
    }
    if (event.type === "demo_credit") {
      return event.amount === demoCreditAmount && event.status === "Added (demo)";
    }
    if (event.type === "payout_method_added" || event.type === "payout_method_removed") {
      return payoutMethods.some((method) => method.id === event.methodId) &&
        event.status === (event.type === "payout_method_added" ? "Added" : "Removed");
    }
    return false;
  }

  function loadHistory(progress, campaigns) {
    const saved = progress && typeof progress === "object" && !Array.isArray(progress) ? progress : {};
    const history = Array.isArray(saved.history)
      ? saved.history.filter((event) => isValidHistoryEvent(event, campaigns)).map((event) => ({ ...event }))
      : [];
    const recordedCampaigns = new Set(
      history.filter((event) => event.type === "campaign_reward").map((event) => event.campaignId),
    );
    const activityTimes = new Map();
    if (Array.isArray(saved.activity)) {
      for (const activity of saved.activity) {
        if (activity && Number.isFinite(activity.createdAt) && activity.createdAt > 0 && activity.createdAt <= Date.now()) {
          activityTimes.set(activity.id, activity.createdAt);
        }
      }
    }

    const viewed = Array.isArray(saved.viewed) ? [...new Set(saved.viewed)] : [];
    for (const id of viewed) {
      const campaign = campaigns.find((item) => item.id === id);
      if (!campaign || recordedCampaigns.has(id)) continue;
      history.push({
        id: `legacy-campaign-${id}`,
        type: "campaign_reward",
        campaignId: id,
        amount: campaign.reward,
        createdAt: activityTimes.get(id) || null,
        status: "Completed",
      });
    }
    if (saved.referralRewarded === true && !history.some((event) => event.type === "referral_reward")) {
      history.push({
        id: "legacy-referral-reward",
        type: "referral_reward",
        amount: 1,
        createdAt: null,
        status: "Completed",
      });
    }

    return history.sort((left, right) => (right.createdAt || 0) - (left.createdAt || 0));
  }

  function calculateDemoBalance(progress, campaigns, referralReward = 1) {
    const saved = progress && typeof progress === "object" ? progress : {};
    const viewed = Array.isArray(saved.viewed) ? [...new Set(saved.viewed)] : [];
    const earnings = viewed.reduce((total, id) => {
      const campaign = campaigns.find((item) => item.id === id);
      return total + (campaign ? campaign.reward : 0);
    }, saved.referralRewarded === true ? referralReward : 0);
    const history = loadHistory(saved, campaigns);
    const credits = history
      .filter((event) => event.type === "demo_credit")
      .reduce((total, event) => total + event.amount, 0);
    const withdrawals = history
      .filter((event) => event.type === "withdrawal")
      .reduce((total, event) => total + event.amount, 0);
    return Math.max(0, Math.round((earnings + credits - withdrawals) * 100) / 100);
  }

  window.KadenohDemoStore = Object.freeze({
    keys,
    payoutMethods,
    minimumWithdrawalAmount,
    demoCreditAmount,
    defaultCampaigns: () => cloneCampaigns(defaultCampaigns),
    isValidCampaign,
    loadCampaigns,
    saveCampaigns,
    resetCampaigns,
    loadHistory,
    calculateDemoBalance,
    getLoadError: () => loadError,
  });
})();
