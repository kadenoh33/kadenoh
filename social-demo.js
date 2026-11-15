const totals = { likes: 0, comments: 0, saves: 0 };
const themeToggle = document.querySelector("#theme-toggle");
const status = document.querySelector("#social-status");

function updateSummary() {
  document.querySelector("#likes-count").textContent = String(totals.likes);
  document.querySelector("#comments-count").textContent = String(totals.comments);
  document.querySelector("#saves-count").textContent = String(totals.saves);
  document.querySelector("#interaction-count").textContent = String(
    totals.likes + totals.comments + totals.saves,
  );
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]').content = isDark
    ? "#151c17"
    : "#f4efe6";
  themeToggle.setAttribute(
    "aria-label",
    `Switch to ${isDark ? "light" : "dark"} theme`,
  );
  themeToggle.title = `Switch to ${isDark ? "light" : "dark"} theme`;
  themeToggle.querySelector("span").textContent = isDark ? "☀" : "☾";
}

function getCount(element) {
  const match = element.textContent.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

document.querySelectorAll(".social-post").forEach((post) => {
  const likeCount = post.querySelector("[data-like-count]");
  const commentCount = post.querySelector("[data-comment-count]");
  const brandName = post.querySelector(".social-account strong").textContent;

  post.querySelector('[data-action="like"]').addEventListener("click", (event) => {
    const button = event.currentTarget;
    const liked = button.getAttribute("aria-pressed") === "true";
    const nextLiked = !liked;
    button.setAttribute("aria-pressed", String(nextLiked));
    button.setAttribute(
      "aria-label",
      `${nextLiked ? "Unlike" : "Like"} ${brandName} demo post`,
    );
    button.classList.toggle("is-active", nextLiked);
    button.querySelector("span").textContent = nextLiked ? "♥" : "♡";
    likeCount.textContent = String(getCount(likeCount) + (nextLiked ? 1 : -1));
    totals.likes += nextLiked ? 1 : -1;
    updateSummary();
    status.textContent = nextLiked
      ? `Demo like added to ${brandName}.`
      : `Demo like removed from ${brandName}.`;
  });

  post.querySelector('[data-action="save"]').addEventListener("click", (event) => {
    const button = event.currentTarget;
    const saved = button.getAttribute("aria-pressed") === "true";
    const nextSaved = !saved;
    button.setAttribute("aria-pressed", String(nextSaved));
    button.setAttribute(
      "aria-label",
      `${nextSaved ? "Unsave" : "Save"} ${brandName} demo post`,
    );
    button.classList.toggle("is-active", nextSaved);
    button.querySelector("span").textContent = nextSaved ? "✓" : "♧";
    totals.saves += nextSaved ? 1 : -1;
    updateSummary();
    status.textContent = nextSaved
      ? `${brandName} saved for this demo session.`
      : `${brandName} removed from saved demo posts.`;
  });

  post.querySelector('[data-action="focus-comment"]').addEventListener("click", () => {
    post.querySelector(".social-comment-form input").focus();
  });

  post.querySelector(".social-comment-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.comment;
    const message = input.value.trim();
    if (!message) {
      input.focus();
      return;
    }

    const comment = document.createElement("p");
    comment.className = "social-user-comment";
    const author = document.createElement("strong");
    author.textContent = "You";
    comment.append(author, document.createTextNode(` ${message}`));
    form.parentElement.insertBefore(comment, form);

    const nextCount = getCount(commentCount) + 1;
    commentCount.textContent = `${nextCount} demo comment${nextCount === 1 ? "" : "s"}`;
    totals.comments += 1;
    updateSummary();
    status.textContent = "Demo comment added. It is only visible in this page.";
    form.reset();
  });
});

themeToggle.addEventListener("click", () => {
  const nextTheme =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  try {
    localStorage.setItem(window.KadenohDemoStore.keys.theme, nextTheme);
  } catch (error) {
    console.warn("Could not save the selected color theme.", error);
  }
});

window.addEventListener("storage", (event) => {
  if (event.key === window.KadenohDemoStore.keys.theme) {
    applyTheme(event.newValue === "dark" ? "dark" : "light");
  }
});

applyTheme(document.documentElement.dataset.theme);
