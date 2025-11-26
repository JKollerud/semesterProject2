// for listings.html, all listings
import { getListings } from "../api/listings.js";

const PAGE_SIZE = 18;

const grid = document.querySelector("#listings-grid");
const template = document.querySelector("#listing-card-template");

// pagination elements
const prevBtn = document.querySelector("#pagination-prev");
const nextBtn = document.querySelector("#pagination-next");
const pageInfo = document.querySelector("#pagination-info");

let currentPage = 1;
let pageCount = 1;

// card
function createListingCard(listing) {
  // clone card
  const card = template.content.firstElementChild.cloneNode(true);

  // elements inside card
  const titleEl = card.querySelector("[data-title]");
  const bidsEl = card.querySelector("[data-bids]");
  const timeEl = card.querySelector("[data-time-remaining]");
  const imgEl = card.querySelector("[data-image]");
  const sellerLinkEl = card.querySelector("[data-seller-link]");
  const endsAtEl = card.querySelector("[data-ends-at]");
  const currentBidEl = card.querySelector("[data-current-bid]");

  const { id, title, media, endsAt, seller, _count, bids } = listing;

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
  if (!pageInfo) return;

  const pageFromMeta = meta?.currentPage ?? meta?.page ?? currentPage ?? 1;
  const pageCountFromMeta = meta?.pageCount ?? meta?.lastPage ?? pageCount ?? 1;

  currentPage = pageFromMeta;
  pageCount = pageCountFromMeta;

  pageInfo.textContent = `Page ${currentPage} of ${pageCount}`;

  const isFirst = meta?.isFirstPage ?? currentPage <= 1;
  const isLast = meta?.isLastPage ?? currentPage >= pageCount;

  if (prevBtn) {
    prevBtn.disabled = isFirst;
  }

  if (nextBtn) {
    nextBtn.disabled = isLast;
  }
}

// get list
async function initListingsPage(page = 1) {
  if (!grid || !template) return;

  grid.innerHTML = "";

  try {
    const result = await getListings({
      limit: PAGE_SIZE,
      page,
    });

    const data = Array.isArray(result) ? result : result?.data;
    const meta =
      !Array.isArray(result) && result?.meta
        ? result.meta
        : {
            currentPage: page,
            pageCount: 1,
            isLastPage: true,
          };

    if (!data || !data.length) {
      grid.textContent = "No listings found.";
      updatePagination(meta);
      return;
    }

    data.forEach((listing) => {
      const card = createListingCard(listing);
      grid.appendChild(card);
    });

    updatePagination(meta);
  } catch (error) {
    console.error(error);
    grid.textContent = "Could not load listings.";
  }
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

initListingsPage();
