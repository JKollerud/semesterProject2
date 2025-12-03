import { getAuth, clearAuth } from "./storage.js";
import { getProfile } from "../api/profiles.js";

const userButton = document.querySelector("#nav-user-button");
const userMenu = document.querySelector("#nav-user-menu");
const usernameEl = document.querySelector("#nav-username");
const menuButton = document.querySelector("#nav-menu-button");
const mainMenu = document.querySelector("#nav-main-menu");
const backdrop = document.querySelector("#nav-backdrop");
const creditEl = document.querySelector("#nav-user-credits");
const avatarEl = document.querySelector("#nav-avatar");

// check login state
function isLoggedIn() {
  const auth = getAuth();
  return !!auth?.accessToken;
}

// show credits under avatar & stock photo
async function loadUserCredits(auth) {
  if (!creditEl && !avatarEl) return;

  if (creditEl) {
    creditEl.classList.add("hidden");
    creditEl.textContent = "";
  }

  if (!auth?.user?.name || !auth?.accessToken) {
    return;
  }

  try {
    const profile = await getProfile(auth.user.name);
    const credits = profile?.credits ?? 0;

    // update credits
    if (creditEl) {
      creditEl.textContent = `${credits} Credits`;
      creditEl.classList.remove("hidden");
    }

    // update avatar
    if (avatarEl) {
      const avatarUrl =
        typeof profile.avatar === "string"
          ? profile.avatar
          : profile.avatar?.url ||
            "./assets/images/profile-avatar-placeholder.svg";

      avatarEl.src = avatarUrl;
      avatarEl.onerror = () => {
        avatarEl.src = "./assets/images/profile-avatar-placeholder.svg";
      };
    }
  } catch (error) {
    console.error("Failed to load user credits", error);
  }
}

// show username under avatar if logged in
function updateNavUser() {
  const auth = getAuth();
  const loggedIn = !!auth?.accessToken;

  if (usernameEl) {
    if (loggedIn && auth?.user?.name) {
      usernameEl.textContent = auth.user.name;
      usernameEl.classList.remove("hidden");
    } else {
      usernameEl.textContent = "";
      usernameEl.classList.add("hidden");
    }
  }

  loadUserCredits(auth);

  // hamburger menu items
  document.querySelectorAll('[data-auth-visible="logged-in"]').forEach((el) => {
    el.classList.toggle("hidden", !loggedIn);
  });

  document
    .querySelectorAll('[data-auth-visible="logged-out"]')
    .forEach((el) => {
      el.classList.toggle("hidden", loggedIn);
    });

  if (!loggedIn && userMenu) {
    userMenu.classList.add("hidden");
  }
}

// toggle dropdown
function toggleUserMenu() {
  if (!userMenu) return;

  if (!isLoggedIn()) {
    window.location.href = "login.html";
    return;
  }

  userMenu.classList.toggle("hidden");
}

// toggle hamburger menu
function toggleMainMenu() {
  if (!mainMenu) return;

  const isOpen = !mainMenu.classList.contains("hidden");
  if (isOpen) {
    mainMenu.classList.add("hidden");
    if (backdrop) backdrop.classList.add("hidden");
  } else {
    mainMenu.classList.remove("hidden");
    if (backdrop) backdrop.classList.remove("hidden");
  }
}

// close both menus
function closeAllMenus() {
  if (userMenu) userMenu.classList.add("hidden");
  if (mainMenu) mainMenu.classList.add("hidden");
  if (backdrop) backdrop.classList.add("hidden");
}

//avatar click
if (userButton) {
  userButton.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleUserMenu();
  });
}

// hamburger click
if (menuButton) {
  menuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMainMenu();
  });
}

// click anywhere to close both menus
document.addEventListener("click", () => {
  closeAllMenus();
});

if (backdrop) {
  backdrop.addEventListener("click", () => {
    closeAllMenus();
  });
}

// logout
document.querySelectorAll("[data-logout]").forEach((btn) => {
  btn.addEventListener("click", () => {
    clearAuth();
    window.location.href = "login.html";
  });
});

updateNavUser();
