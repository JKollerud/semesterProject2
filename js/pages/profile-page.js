import { requireAuth, getAuthUser, getAuthToken } from "../utils/guards.js";
import { getProfile } from "../api/profiles.js";
import { getListings } from "../api/listings.js";
import { API_BASE, API_KEY } from "../api/config.js";

// auth
requireAuth();

const authUser = getAuthUser();
const accessToken = getAuthToken();

if (!authUser?.name || !accessToken) {
  window.location.href = "login.html";
}

const username = authUser.name;

// dom ele
const loadingEl = document.querySelector("#profile-loading");
const emptyEl = document.querySelector("#profile-empty");
const listingsGrid = document.querySelector("#profile-listings-grid");
const bidsGrid = document.querySelector("#profile-bids-grid");
const winsGrid = document.querySelector("#profile-wins-grid");
const tabButtons = document.querySelectorAll("[data-profile-tab]");
const profileName = document.querySelector("#profile-name");
const profileEmail = document.querySelector("#profile-email");
const profileBio = document.querySelector("#profile-bio");
const profileAvatar = document.querySelector("#profile-avatar");
const profileBanner = document.querySelector("#profile-banner");
const profileCredits = document.querySelector("#profile-credits");
const editBtn = document.querySelector("#profile-edit-btn");
const editModal = document.querySelector("#profile-edit-modal");
const editForm = document.querySelector("#profile-edit-form");
const editAvatarField = document.querySelector("#edit-avatar");
const editBannerField = document.querySelector("#edit-banner");
const editBioField = document.querySelector("#edit-bio");
const editCancel = document.querySelector("#profile-edit-cancel");
const editMsg = document.querySelector("#profile-edit-message");
const toast = document.querySelector("#profile-toast");
const cardTemplate = document.querySelector("#profile-listing-card-template");

const DEFAULT_BANNER = "./assets/images/bannerStockBg.svg";
const DEFAULT_AVATAR = "./assets/images/profile-avatar-placeholder.svg";

let currentTab = "listings";

// init load profile
async function initProfilePage() {
  if (!loadingEl) return;

  loadingEl.classList.remove("hidden");
  emptyEl?.classList.add("hidden");

  try {
    await loadProfileInfo();
    await Promise.all([loadMyListings(), loadMyBids(), loadMyWins()]);
  } catch (error) {
    console.error(error);
    loadingEl.textContent = "Failed to load profile.";
  } finally {
    loadingEl.classList.add("hidden");
  }
}

// fetch base info
async function loadProfileInfo() {
  const profile = await getProfile(username);

  if (profileName) profileName.textContent = profile.name ?? username;

  if (profileEmail) {
    profileEmail.textContent = profile.email || authUser?.email || "";
  }
  if (profileBio) {
    profileBio.textContent = profile.bio || "No bio provided yet.";
  }
  if (profileCredits) {
    profileCredits.textContent = profile.credits ?? 0;
  }

  const avatarUrl =
    typeof profile.avatar === "string"
      ? profile.avatar
      : profile.avatar?.url || DEFAULT_AVATAR;

  if (profileAvatar) {
    profileAvatar.src = avatarUrl;
    profileAvatar.onerror = () => {
      profileAvatar.src = DEFAULT_AVATAR;
    };
  }

  const navAvatar = document.querySelector("#nav-avatar");
  if (navAvatar) {
    navAvatar.src = avatarUrl;
    navAvatar.onerror = () => {
      navAvatar.src = DEFAULT_AVATAR;
    };
  }

  const bannerUrl =
    typeof profile.banner === "string"
      ? profile.banner
      : profile.banner?.url || DEFAULT_BANNER;

  if (profileBanner) {
    profileBanner.src = bannerUrl;
    profileBanner.onerror = () => {
      profileBanner.src = DEFAULT_BANNER;
    };
  }
  if (editAvatarField) {
    editAvatarField.value =
      typeof profile.avatar === "string"
        ? profile.avatar
        : profile.avatar?.url || "";
  }

  if (editBannerField) {
    editBannerField.value =
      typeof profile.banner === "string"
        ? profile.banner
        : profile.banner?.url || "";
  }

  if (editBioField) {
    editBioField.value = profile.bio || "";
  }
}

// helpers render card and format time
function formatRemaining(ms) {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days >= 1) return `In about ${days} day${days > 1 ? "s" : ""}`;

  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours >= 1) return `In about ${hours} hour${hours > 1 ? "s" : ""}`;

  const minutes = Math.floor(ms / (1000 * 60));
  if (minutes >= 1)
    return `In about ${minutes} minute${minutes > 1 ? "s" : ""}`;

  return "Ending soon";
}

// cogwheel edit
function addOwnerCogwheel(card, listing) {
  const loggedInName = username?.toLowerCase();
  const sellerNameLower = listing.seller?.name?.toLowerCase();
  const isEnded =
    listing.endsAt && new Date(listing.endsAt).getTime() <= Date.now();

  if (
    !loggedInName ||
    !sellerNameLower ||
    loggedInName !== sellerNameLower ||
    isEnded
  ) {
    return;
  }

  const cogBtn = document.createElement("button");
  cogBtn.type = "button";
  cogBtn.setAttribute("aria-label", "Edit listing");
  cogBtn.title = "Edit listing";

  cogBtn.className =
    "absolute top-2 right-2 z-10 inline-flex items-center justify-center w-9 h-9 rounded-full bg-[#F7F3EB]/95 shadow-sm hover:bg-[#FAF9F6] focus:outline-none focus:ring-2 focus:ring-[#1B1B1C]/20";

  cogBtn.innerHTML = `
  <img
    src="./assets/icons/cogwheel.svg"
    alt=""
    class="w-5 h-5 pointer-events-none opacity-70 transition-opacity duration-150 group-hover:opacity-100"
  />
`;
  const imageWrapper = card.querySelector("div.relative, .relative") || card;

  imageWrapper.classList.add("relative");
  imageWrapper.appendChild(cogBtn);

  cogBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    event.preventDefault();
    window.location.href = `edit-listing.html?id=${encodeURIComponent(
      listing.id
    )}`;
  });
}

// render card
function renderListings(gridEl, listings) {
  if (!gridEl) return;

  gridEl.innerHTML = "";

  if (!Array.isArray(listings) || listings.length === 0) {
    return;
  }

  listings.forEach((listing) => {
    const fragment = cardTemplate.content.cloneNode(true);
    const article = fragment.querySelector("article");
    const imgEl = fragment.querySelector("[data-image]");
    const titleEl = fragment.querySelector("[data-title]");
    const sellerNameEl = fragment.querySelector("[data-seller-name]");
    const sellerLinkEl = fragment.querySelector("[data-seller-link]");
    const bidsEl = fragment.querySelector("[data-bids]");
    const endsAtEl = fragment.querySelector("[data-ends-at]");
    const currentBidEl = fragment.querySelector("[data-current-bid]");
    const timeRemainingEl = fragment.querySelector("[data-time-remaining]");

    if (imgEl) {
      const firstMedia = Array.isArray(listing.media) ? listing.media[0] : null;

      const imageUrl =
        typeof firstMedia === "string"
          ? firstMedia
          : firstMedia?.url || "./assets/icons/placeholder-listing.svg";

      imgEl.src = imageUrl;
      imgEl.alt =
        (typeof firstMedia === "object" && firstMedia?.alt) ||
        listing.title ||
        "Listing image";
    }

    if (titleEl) titleEl.textContent = listing.title ?? "Untitled listing";

    const sellerName = listing.seller?.name || "Unknown";
    if (sellerNameEl) sellerNameEl.textContent = sellerName;
    if (sellerLinkEl) sellerLinkEl.href = `profile.html?name=${sellerName}`;

    if (bidsEl) bidsEl.textContent = `${listing._count?.bids ?? 0} bids`;

    const endDate = new Date(listing.endsAt);
    if (endsAtEl) endsAtEl.textContent = endDate.toLocaleDateString();

    const highestBid = listing.bids?.at(-1)?.amount ?? 0;
    if (currentBidEl) currentBidEl.textContent = highestBid;

    const msLeft = endDate.getTime() - Date.now();
    if (timeRemainingEl) {
      timeRemainingEl.textContent =
        msLeft > 0 ? formatRemaining(msLeft) : "Ended";
    }

    if (article) {
      addOwnerCogwheel(article, listing);
      article.addEventListener("click", () => {
        window.location.href = `listing-page.html?id=${listing.id}`;
      });
    }

    gridEl.appendChild(fragment);
  });
}

function updateEmptyState() {
  if (!emptyEl) return;

  const map = {
    listings: listingsGrid,
    bids: bidsGrid,
    wins: winsGrid,
  };

  const grid = map[currentTab];
  const hasItems = grid && grid.children.length > 0;

  emptyEl.classList.toggle("hidden", hasItems);

  if (!hasItems) {
    let msg = "No listings found.";
    if (currentTab === "bids") msg = "No bids found.";
    if (currentTab === "wins") msg = "No wins yet.";
    emptyEl.textContent = msg;
  }
}

// my listings / bids / wins
async function loadMyListings() {
  if (!listingsGrid) return;

  const { data = [] } = await getListings({ limit: 100 });
  const mine = data.filter((item) => item.seller?.name === username);

  renderListings(listingsGrid, mine);
  if (currentTab === "listings") {
    updateEmptyState();
  }
}

async function loadMyBids() {
  if (!bidsGrid) return;

  const { data = [] } = await getListings({ limit: 100 });

  const myNameLower = username.toLowerCase();

  const withMyBids = data.filter((listing) =>
    (listing.bids || []).some((bid) => {
      const bidderName =
        (typeof bid.bidderName === "string" && bid.bidderName) ||
        (bid.bidder &&
          typeof bid.bidder.name === "string" &&
          bid.bidder.name) ||
        "";

      return bidderName.toLowerCase() === myNameLower;
    })
  );

  renderListings(bidsGrid, withMyBids);

  if (currentTab === "bids") {
    updateEmptyState();
  }
}

async function loadMyWins() {
  if (!winsGrid) return;

  const { data = [] } = await getListings({ limit: 100 });
  const now = Date.now();

  const wins = data.filter((listing) => {
    const endTime = new Date(listing.endsAt).getTime();
    if (endTime > now) return false;

    const highestBid = listing.bids?.at(-1);
    if (!highestBid) return false;

    const bidderName = highestBid.bidderName || highestBid.bidder?.name || "";

    return bidderName.toLowerCase() === username.toLowerCase();
  });

  renderListings(winsGrid, wins);

  if (currentTab === "wins") {
    updateEmptyState();
  }
}

// tabs
function setActiveTab(tabName) {
  currentTab = tabName;

  const tabMap = {
    listings: listingsGrid,
    bids: bidsGrid,
    wins: winsGrid,
  };

  Object.entries(tabMap).forEach(([name, grid]) => {
    if (!grid) return;
    grid.classList.toggle("hidden", name !== tabName);
  });

  tabButtons.forEach((btn) => {
    const isActive = btn.dataset.profileTab === tabName;
    btn.classList.toggle("text-[#1B1B1C]", isActive);
    btn.classList.toggle("text-[#4B4B4C]", !isActive);
    btn.classList.toggle("after:absolute", isActive);
    btn.classList.toggle("after:left-1", isActive);
    btn.classList.toggle("after:right-1", isActive);
    btn.classList.toggle("after:-bottom-0", isActive);
    btn.classList.toggle("after:h-[3px]", isActive);
    btn.classList.toggle("after:bg-[#1B1B1C]", isActive);
  });

  updateEmptyState();
}

// default tab
setActiveTab("listings");

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tabName = btn.dataset.profileTab;
    if (!tabName) return;
    setActiveTab(tabName);
  });
});

// edit profile
if (editBtn && editModal) {
  editBtn.addEventListener("click", () => {
    editMsg?.classList.add("hidden");
    editMsg && (editMsg.textContent = "");
    editModal.classList.remove("hidden");
  });
}

if (editCancel && editModal) {
  editCancel.addEventListener("click", () => {
    editModal.classList.add("hidden");
  });
}

if (editModal) {
  editModal.addEventListener("click", (event) => {
    if (event.target === editModal) {
      editModal.classList.add("hidden");
    }
  });
}

if (editForm) {
  editForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!editAvatarField || !editBannerField || !editBioField) return;

    const avatarValue = editAvatarField.value.trim();
    const bannerValue = editBannerField.value.trim();
    const bioValue = editBioField.value.trim();

    const payload = {};

    if (avatarValue) {
      payload.avatar = { url: avatarValue };
    }
    if (bannerValue) {
      payload.banner = { url: bannerValue };
    }

    payload.bio = bioValue || null;

    if (editMsg) {
      editMsg.classList.add("hidden");
      editMsg.textContent = "";
    }

    try {
      const res = await fetch(
        `${API_BASE}/auction/profiles/${encodeURIComponent(username)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            "X-Noroff-API-Key": API_KEY,
          },
          body: JSON.stringify(payload),
        }
      );

      const body = await res.json();

      if (!res.ok) {
        const message =
          body?.errors?.[0]?.message || "Failed to update profile";
        throw new Error(message);
      }

      await loadProfileInfo();
      editModal?.classList.add("hidden");
      showToast("Profile updated successfully.");
    } catch (error) {
      console.error(error);
      if (editMsg) {
        editMsg.textContent = error.message;
        editMsg.classList.remove("hidden");
      }
    }
  });
}

// toast helper
function showToast(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.classList.remove("hidden");
  toast.style.opacity = "1";

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => {
      toast.classList.add("hidden");
    }, 300);
  }, 2000);
}

initProfilePage();
