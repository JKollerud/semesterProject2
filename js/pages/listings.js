// for listings.html, all listings
import { getListings } from "../api/listings.js";
import { getAuthUser } from "../utils/guards.js";

const PAGE_SIZE = 20;
const ENDING_WINDOW_HOURS = 24;

const grid = document.querySelector("#listings-grid");
const template = document.querySelector("#listing-card-template");

// pagination elements
const prevBtn = document.querySelector("#pagination-prev");
const nextBtn = document.querySelector("#pagination-next");
const pageInfo = document.querySelector("#pagination-info");

// filter and sort
const searchInput = document.querySelector("#filter-search");
const tagsInput = document.querySelector("#filter-tags");
const activeToggle = document.querySelector("#filter-active");
const sortSelect = document.querySelector("#sort-select");
const clearBtn = document.querySelector("#filter-clear");

let currentPage = 1;
let pageCount = 1;

// filter states
let searchQuery = "";
let tagFilter = "";
let activeOnly = false;
let sortOption = "newest";
let allListingsCache = null;
const MAX_FILTER_ITEMS = 600;

// card
export function createListingCard(listing) {
  const card = template.content.firstElementChild.cloneNode(true);

  // elements inside card
  const titleEl = card.querySelector("[data-title]");
  const bidsEl = card.querySelector("[data-bids]");
  const timeEl = card.querySelector("[data-time-remaining]");
  const imgEl = card.querySelector("[data-image]");
  const sellerNameEl = card.querySelector("[data-seller-name]");
  const sellerLinkEl = card.querySelector("[data-seller-link]");
  const endsAtEl = card.querySelector("[data-ends-at]");
  const currentBidEl = card.querySelector("[data-current-bid]");

  const { id, title, media, endsAt, seller, _count, bids } = listing;

  const authUser = getAuthUser?.();
  const loggedInName = authUser?.name?.toLowerCase();
  const sellerNameLower = seller?.name?.toLowerCase();
  const bidsCount = _count?.bids ?? bids?.length ?? 0;
  const sellerName = seller?.name || "Unknown seller";
  const imageUrl =
    Array.isArray(media) && media[0]?.url
      ? media[0].url
      : "./assets/icons/placeholder-listing.svg";

  // title
  if (titleEl) titleEl.textContent = title || "Untitled listing";

  // bids
  if (bidsEl) {
    bidsEl.textContent = `${bidsCount} bid${bidsCount === 1 ? "" : "s"}`;
  }

  // time remaining
  if (timeEl) {
    timeEl.textContent = getTimeRemaining(endsAt);
  }

  // image
  if (imgEl) {
    imgEl.src = imageUrl;
    imgEl.alt = title || "Auction item image";
    imgEl.onerror = () => {
      imgEl.src = "./assets/icons/placeholder-listing.svg";
    };
  }

  // seller
  if (sellerNameEl) sellerNameEl.textContent = sellerName;

  if (sellerLinkEl) {
    sellerLinkEl.href = `profile.html?name=${encodeURIComponent(sellerName)}`;
    sellerLinkEl.textContent = sellerName;
  }

  // ends at
  if (endsAtEl) endsAtEl.textContent = formatDate(endsAt);

  // current bid
  if (currentBidEl) {
    currentBidEl.textContent = String(getHighestBid(listing));
  }

  // whole card clickable
  card.addEventListener("click", () => {
    window.location.href = `listing-page.html?id=${encodeURIComponent(id)}`;
  });

  // edit cogwheel button for own listings
  const isEnded =
    listing.endsAt && new Date(listing.endsAt).getTime() <= Date.now();

  if (
    loggedInName &&
    sellerNameLower &&
    loggedInName === sellerNameLower &&
    !isEnded
  ) {
    const cogBtn = document.createElement("button");
    cogBtn.type = "button";
    cogBtn.setAttribute("aria-label", "Edit listing");
    cogBtn.title = "Edit listing";
    cogBtn.className =
      "absolute top-2 right-2 z-10 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/20 shadow transition hover:bg-[#FAF9F6]";

    cogBtn.innerHTML = `
    <img 
      src="./assets/icons/cogwheel.svg" 
      alt="" 
      class="w-5 h-5 pointer-events-none opacity-70"
    />
  `;

    // position for cogwheel inside the card
    const imageWrapper = card.querySelector("div.relative, .relative");
    const target = imageWrapper || card;

    target.classList.add("relative");
    target.appendChild(cogBtn);

    cogBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      event.preventDefault();
      window.location.href = `edit-listing.html?id=${encodeURIComponent(id)}`;
    });
  }

  return card;
}

// helpers
// date
function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// remaining time
function getTimeRemaining(endsAt) {
  const end = new Date(endsAt).getTime();
  const now = Date.now();
  const diff = end - now;

  if (Number.isNaN(end)) return "Unknown end time";
  if (diff <= 0) return "Ended";

  const hours = Math.round(diff / (1000 * 60 * 60));
  if (hours < 24) return `In about ${hours} hour${hours === 1 ? "" : "s"}`;

  const days = Math.round(hours / 24);
  return `In about ${days} day${days === 1 ? "" : "s"}`;
}

// highest bid
function getHighestBid(listing) {
  if (!listing.bids || !listing.bids.length) return 0;
  return Math.max(...listing.bids.map((b) => b.amount));
}

// update pagination bar
function updatePagination(meta) {
  if (!meta || !pageInfo) return;

  currentPage = meta.currentPage || 1;
  pageCount = meta.pageCount || 1;

  pageInfo.textContent = `Page ${currentPage} of ${pageCount}`;

  if (prevBtn) {
    prevBtn.disabled = currentPage <= 1;
  }

  if (nextBtn) {
    nextBtn.disabled = meta.isLastPage || currentPage >= pageCount;
  }
}

// sort params for API
function getSortParams() {
  const value = (sortOption || "newest").toLowerCase();

  if (value === "oldest") {
    return { sort: "created", sortOrder: "asc" };
  }

  if (value === "endingSoon") {
    return { sort: "endsAt", sortOrder: "asc" };
  }

  return { sort: "created", sortOrder: "desc" };
}

// helper load all listings
async function loadAllListings(sort, sortOrder) {
  if (
    allListingsCache &&
    allListingsCache.sort === sort &&
    allListingsCache.sortOrder === sortOrder
  ) {
    return allListingsCache.items;
  }

  let items = [];
  let page = 1;
  let pageCountLocal = 1;

  while (page <= pageCountLocal && items.length < MAX_FILTER_ITEMS) {
    const { data, meta } = await getListings({
      limit: 100,
      page,
      sort,
      sortOrder,
    });

    items = items.concat(data || []);

    pageCountLocal = meta?.pageCount || pageCountLocal;
    page += 1;
  }

  allListingsCache = { sort, sortOrder, items };
  return items;
}

// get list
async function initListingsPage(page = 1) {
  if (!grid || !template) return;
  grid.innerHTML = "";

  try {
    const { sort, sortOrder } = getSortParams();

    const sortValue = (sortOption || "").toLowerCase();
    const isEndingSoon =
      sortValue === "ending" ||
      sortValue === "endingsoon" ||
      sortValue === "ending-soon";

    const filtersActive = Boolean(
      searchQuery || tagFilter || activeOnly || isEndingSoon
    );

    let data = [];
    let meta = {};

    if (filtersActive) {
      const allItems = await loadAllListings(sort, sortOrder);
      data = allItems;
      meta = { currentPage: 1, pageCount: 1, isLastPage: true };
    } else {
      const result = await getListings({
        limit: PAGE_SIZE,
        page,
        sort,
        sortOrder,
      });
      data = result.data || [];
      meta = result.meta || {};
    }

    let filtered = data;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        const title = item.title?.toLowerCase() || "";
        const sellerName = item.seller?.name?.toLowerCase() || "";
        return title.includes(q) || sellerName.includes(q);
      });
    }

    if (tagFilter) {
      const tagQ = tagFilter.toLowerCase();
      filtered = filtered.filter((item) =>
        Array.isArray(item.tags)
          ? item.tags.some((t) => String(t).toLowerCase().includes(tagQ))
          : false
      );
    }

    if (activeOnly) {
      const now = Date.now();
      filtered = filtered.filter((item) => {
        const end = new Date(item.endsAt).getTime();
        return !Number.isNaN(end) && end > now;
      });
    }

    if (isEndingSoon) {
      const now = Date.now();
      const windowMs = ENDING_WINDOW_HOURS * 60 * 60 * 1000;

      filtered = filtered
        .map((item) => {
          const end = new Date(item.endsAt).getTime();
          return {
            item,
            end,
            diff: end - now,
          };
        })
        .filter((x) => !Number.isNaN(x.end) && x.diff > 0 && x.diff <= windowMs)
        .sort((a, b) => a.end - b.end)
        .map((x) => x.item);
    }

    if (!filtered.length) {
      grid.textContent = "No listings found.";
      updatePagination(meta);
      return;
    }

    filtered.forEach((listing) => {
      const card = createListingCard(listing);
      grid.appendChild(card);
    });

    updatePagination(meta);
  } catch (error) {
    console.error(error);
    grid.textContent = "Could not load listings.";
  }
}

// filter
if (searchInput) {
  searchInput.addEventListener("input", (event) => {
    searchQuery = event.target.value.trim();
    allListingsCache = null;
    initListingsPage(1);
  });
}

if (tagsInput) {
  tagsInput.addEventListener("input", (event) => {
    tagFilter = event.target.value.trim();
    allListingsCache = null;
    initListingsPage(1);
  });
}

if (activeToggle) {
  const track = activeToggle.querySelector("[data-track]");
  const knob = activeToggle.querySelector("[data-knob]");

  activeToggle.addEventListener("click", () => {
    activeOnly = !activeOnly;
    activeToggle.setAttribute("aria-pressed", String(activeOnly));

    if (track && knob) {
      track.classList.toggle("bg-[#F7F3EB]", !activeOnly);
      track.classList.toggle("bg-[#1B1B1C]/20", activeOnly);

      knob.classList.toggle("translate-x-0", !activeOnly);
      knob.classList.toggle("translate-x-4", activeOnly);
    }

    allListingsCache = null;
    initListingsPage(1);
  });
}

if (sortSelect) {
  sortSelect.addEventListener("change", () => {
    sortOption = sortSelect.value || "newest";
    allListingsCache = null;
    initListingsPage(1);
  });
}

// pagination button handler
if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      initListingsPage(currentPage - 1);
    }
  });
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    if (currentPage < pageCount) {
      initListingsPage(currentPage + 1);
    }
  });
}

if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    searchQuery = "";
    tagFilter = "";
    activeOnly = false;
    sortOption = "newest";
    allListingsCache = null;

    if (searchInput) searchInput.value = "";
    if (tagsInput) tagsInput.value = "";
    if (sortSelect) sortSelect.value = "newest";
    if (activeToggle) {
      activeToggle.setAttribute("aria-pressed", "false");
      const track = activeToggle.querySelector("[data-track]");
      const knob = activeToggle.querySelector("[data-knob]");
      if (track && knob) {
        track.classList.add("bg-[#F7F3EB]");
        track.classList.remove("bg-[#1B1B1C]/20");
        knob.classList.add("translate-x-0");
        knob.classList.remove("translate-x-4");
      }
    }
    initListingsPage(1);
  });
}

initListingsPage();
