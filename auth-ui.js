(() => {
  const store = window.KadenohDemoStore;
  const keys = store.keys;
  const topbar = document.querySelector(".topbar");
  const themeToggle = document.querySelector("#theme-toggle");
  const profileButton = document.querySelector("#profile-button");
  const profileDialog = document.querySelector("#profile-dialog");
  const profileSessionState = document.querySelector("#profile-session-state");
  const profileSignOut = document.querySelector("#profile-sign-out");

  const dialog = document.createElement("dialog");
  dialog.className = "session-dialog";
  dialog.setAttribute("aria-labelledby", "session-dialog-title");
  dialog.innerHTML = `
    <button class="dialog-close" id="close-session-dialog" type="button" aria-label="Close sign-in dialog">×</button>
    <p class="eyebrow">LOCAL DEMO ACCESS</p>
    <h2 id="session-dialog-title">Sign in to Kadenoh</h2>
    <p class="session-disclaimer">
      This is a demo-only switch. Names and emails are not verified; no password is requested.
      Signing in does not secure this static site. Do not enter sensitive information.
    </p>
    <form class="session-form" id="session-sign-in-form">
      <label for="session-display-name">Display name</label>
      <input id="session-display-name" name="displayName" type="text" maxlength="80" autocomplete="name" required />
      <label for="session-email">Email address</label>
      <input id="session-email" name="email" type="email" maxlength="254" autocomplete="email" placeholder="you@example.com" required />
      <div class="session-dialog-actions">
        <button class="session-cancel-button" id="cancel-session-dialog" type="button">Cancel</button>
        <button class="primary-button" type="submit">Continue in demo</button>
      </div>
    </form>
    <p class="session-status" id="session-status" role="status" aria-live="polite"></p>
  `;
  document.body.appendChild(dialog);

  const sessionButton = profileButton ? null : document.createElement("button");
  if (sessionButton) {
    sessionButton.id = "session-button";
    sessionButton.className = "session-button";
    sessionButton.type = "button";
    sessionButton.addEventListener("click", handleSessionButton);
    if (themeToggle) {
      themeToggle.insertAdjacentElement("afterend", sessionButton);
    } else {
      topbar.appendChild(sessionButton);
    }
  }

  const announcement = document.createElement("span");
  announcement.className = "visually-hidden";
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", "polite");
  topbar.appendChild(announcement);

  function setStatus(message) {
    dialog.querySelector("#session-status").textContent = message;
  }

  function readProfile() {
    const saved = localStorage.getItem(keys.profile);
    if (saved === null) return {};
    const profile = JSON.parse(saved);
    if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
      throw new Error("Saved profile data is invalid.");
    }
    return profile;
  }

  function readSignedInState() {
    const saved = localStorage.getItem(keys.auth);
    if (saved === null) return false;
    const session = JSON.parse(saved);
    return Boolean(session && typeof session === "object" && session.signedIn === true);
  }

  let signedIn = false;
  try {
    signedIn = readSignedInState();
  } catch (error) {
    console.warn("Could not read the local demo session.", error);
    setStatus("The saved demo session could not be read. You can sign in again.");
  }

  function renderSession() {
    let profile = {};
    try {
      profile = readProfile();
    } catch (error) {
      console.warn("Could not read the local profile for the session control.", error);
      setStatus("The saved local profile could not be read.");
    }

    if (profileButton) {
      const avatar = profileButton.querySelector(".profile-avatar");
      const chevron = profileButton.querySelector(".chevron");
      profileButton.querySelector("#profile-name").textContent = signedIn
        ? (typeof profile.displayName === "string" && profile.displayName.trim() ? profile.displayName : "Dennis")
        : "Sign in";
      profileButton.classList.toggle("is-signed-out", !signedIn);
      avatar.hidden = !signedIn;
      chevron.hidden = !signedIn;
      profileButton.setAttribute(
        "aria-label",
        signedIn ? `Your profile, ${profile.displayName || "Dennis"}` : "Sign in to the local demo",
      );
      if (profileSessionState) profileSessionState.hidden = !signedIn;
    } else if (sessionButton) {
      sessionButton.textContent = signedIn ? "Sign out" : "Sign in";
      sessionButton.setAttribute("aria-label", signedIn ? "Sign out of the local demo" : "Sign in to the local demo");
      sessionButton.title = signedIn ? "Sign out of the local demo" : "Sign in to the local demo";
    }
  }

  function handleSessionButton() {
    if (signedIn) {
      signOut();
      return;
    }
    setStatus("");
    dialog.showModal();
  }

  function signOut() {
    try {
      localStorage.removeItem(keys.auth);
      signedIn = false;
      renderSession();
      announcement.textContent = "Signed out. Your local profile and demo progress remain saved in this browser.";
      window.dispatchEvent(new Event("kadenoh:auth-updated"));
    } catch (error) {
      console.warn("Could not sign out of the local demo.", error);
      setStatus("Could not sign out. Check browser storage and try again.");
      if (!dialog.open) dialog.showModal();
    }
  }

  document.querySelector("#close-session-dialog").addEventListener("click", () => dialog.close());
  document.querySelector("#cancel-session-dialog").addEventListener("click", () => dialog.close());

  dialog.querySelector("#session-sign-in-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const nameInput = dialog.querySelector("#session-display-name");
    const emailInput = dialog.querySelector("#session-email");
    const displayName = nameInput.value.trim();
    const email = emailInput.value.trim();
    nameInput.setCustomValidity(displayName ? "" : "Enter a display name.");
    if (!event.currentTarget.reportValidity()) return;

    try {
      const profile = readProfile();
      localStorage.setItem(keys.profile, JSON.stringify({ ...profile, displayName, email }));
      localStorage.setItem(keys.auth, JSON.stringify({ signedIn: true }));
      signedIn = true;
      renderSession();
      dialog.close();
      announcement.textContent = "Signed in to the local demo.";
      window.dispatchEvent(new Event("kadenoh:profile-updated"));
      window.dispatchEvent(new Event("kadenoh:auth-updated"));
    } catch (error) {
      console.warn("Could not sign in to the local demo.", error);
      setStatus("Could not save your demo session. Check browser storage and try again.");
    }
  });

  if (profileButton) {
    profileButton.addEventListener("click", (event) => {
      if (signedIn) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setStatus("");
      dialog.showModal();
    }, true);
  }

  if (profileSignOut) {
    profileSignOut.addEventListener("click", () => {
      if (profileDialog && profileDialog.open) profileDialog.close();
      signOut();
    });
  }

  window.addEventListener("storage", (event) => {
    if (event.key === keys.auth) {
      try {
        signedIn = readSignedInState();
        renderSession();
        if (signedIn && dialog.open) dialog.close();
      } catch (error) {
        console.warn("Could not sync the local demo session.", error);
        signedIn = false;
        renderSession();
        setStatus("The saved demo session could not be read. Please sign in again.");
      }
    }
    if (event.key === keys.profile) renderSession();
  });

  window.addEventListener("kadenoh:profile-updated", renderSession);
  renderSession();
})();
