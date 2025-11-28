// this is for listing-page.html
import { API_BASE } from "../api/config.js";
import { getAuthToken } from "../utils/guards.js";

const params = new URLSearchParams(window.location.search);
const listingId = params.get("id");

// dom ele
const backBtn = document.querySelector("#listing-back");
const titleEl = document.querySelector("#listing-title");
const statusEl = document.querySelector("#listing-status");
const imgEl = document.querySelector("#listing-image");
const sellerEl = document.querySelector("#listing-seller");
const totalBidsEl = document.querySelector("#listing-total-bids");
const highestBidEl = document.querySelector("#listing-highest-bid");
const endsAtEl = document.querySelector("#listing-ends-at");
const descEl = document.querySelector("#listing-description");
const imageDotsEl = document.querySelector("#listing-image-dots");
const bidHistoryEmptyEl = document.querySelector("#bid-history-empty");
const bidHistoryTableEl = document.querySelector("#bid-history-table");
const bidHistoryBodyEl = document.querySelector("#bid-history-body");

// bid form
const bidForm = document.querySelector("#bid-form");
const bidAmountInput = document.querySelector("#bid-amount");
const bidSubmitBtn = document.querySelector("#bid-submit");
const bidMessageEl = document.querySelector("#bid-message");

// helpers
function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTimeRemainingLabel(endsAt) {
  const end = new Date(endsAt).getTime();
  const now = Date.now();
  const diff = end - now;

  if (Number.isNaN(end)) return "";
  if (diff <= 0) return "Ended";

  const hours = Math.round(diff / (1000 * 60 * 60));
  if (hours < 24) {
    return `In about ${hours} hour${hours === 1 ? "" : "s"}`;
  }

  const days = Math.round(hours / 24);
  return `In about ${days} day${days === 1 ? "" : "s"}`;
}

function getHighestBid(listing) {
  if (!listing.bids || !listing.bids.length) return 0;
  return Math.max(...listing.bids.map((b) => b.amount));
}

// api
async function fetchListing(id) {
  const url = new URL(`${API_BASE}/auction/listings/${encodeURIComponent(id)}`);
  url.searchParams.set("_seller", "true");
  url.searchParams.set("_bids", "true");

  const headers = { "Content-Type": "application/json" };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url.href, { headers });

  if (!response.ok) {
    let errorBody = null;
    try {
      errorBody = await response.json();
    } catch {}
    throw new Error(
      errorBody?.errors?.[0]?.message || "Failed to fetch listing"
    );
  }

  const body = await response.json();
  return body?.data ?? body;
}

// rendering
function renderListing(listing) {
  const { title, description, media, seller, endsAt, bids = [] } = listing;

  // title
  titleEl.textContent = title || "Listing";

  // image
  const placeholder = "./assets/icons/placeholder-listing.svg";

  // valid images
  const images = Array.isArray(media) ? media.filter((m) => m && m.url) : [];

  // fallback placeholder img
  if (!images.length) {
    images.push({ url: placeholder, alt: title || "Listing image" });
  }

  let currentIndex = 0;

  function showImage(index) {
    const image = images[index];
    if (!image || !imgEl) return;

    imgEl.src = image.url;
    imgEl.alt = image.alt || title || "Listing image";
    imgEl.onerror = () => {
      imgEl.src = placeholder;
    };

    // update dots
    if (imageDotsEl) {
      [...imageDotsEl.children].forEach((dot, i) => {
        dot.classList.toggle("bg-[#1B1B1C]/40", i === index);
        dot.classList.toggle("bg-[#1B1B1C]/10", i !== index);
      });
    }
  }

  // make dots if images > 1
  if (imageDotsEl) {
    imageDotsEl.innerHTML = "";

    if (images.length > 1) {
      images.forEach((_, index) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "h-1.5 w-1.5 rounded-full bg-[#1B1B1C]/10 transition";
        dot.setAttribute("aria-label", `Show image ${index + 1}`);

        dot.addEventListener("click", () => {
          currentIndex = index;
          showImage(index);
        });

        imageDotsEl.appendChild(dot);
      });
    }
  }

  showImage(0);

  // seller
  const sellerName = seller?.name || "Unknown seller";
  sellerEl.textContent = sellerName;
  sellerEl.href = `profile.html?name=${encodeURIComponent(sellerName)}`;

  // stats
  const totalBids = bids.length;
  const highest = getHighestBid(listing);

  totalBidsEl.textContent = `${totalBids} bid${totalBids === 1 ? "" : "s"}`;
  highestBidEl.textContent = `${highest} Credits`;

  const endsLabel = formatDate(endsAt);
  const timeLeftLabel = getTimeRemainingLabel(endsAt);

  endsAtEl.textContent = endsLabel;
  statusEl.textContent = timeLeftLabel;

  // description
  descEl.textContent = description || "No description provided.";

  // bid history
  if (!bids.length) {
    bidHistoryEmptyEl.textContent = "No bids yet.";
    bidHistoryTableEl.classList.add("hidden");
    bidHistoryEmptyEl.classList.remove("hidden");
  } else {
    // newest first
    const sorted = [...bids].sort(
      (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
    );
    bidHistoryBodyEl.innerHTML = "";

    sorted.forEach((bid) => {
      const tr = document.createElement("tr");
      tr.className = "border-t border-[#F0E7DA]";

      const nameTd = document.createElement("td");
      nameTd.className = "py-2 pr-4";
      const bidderName =
        bid.bidderName || bid.bidder?.name || bid.bidder || "Unknown";

      nameTd.textContent = bidderName;

      const dateTd = document.createElement("td");
      dateTd.className = "py-2 pr-4 text-right";
      dateTd.textContent = formatDate(bid.created);

      const amountTd = document.createElement("td");
      amountTd.className = "py-2 text-right";
      amountTd.textContent = `${bid.amount} Credits`;

      tr.appendChild(nameTd);
      tr.appendChild(dateTd);
      tr.appendChild(amountTd);
      bidHistoryBodyEl.appendChild(tr);
    });

    bidHistoryEmptyEl.classList.add("hidden");
    bidHistoryTableEl.classList.remove("hidden");
  }
  bidAmountInput.disabled = true;
  bidSubmitBtn.disabled = true;
  bidMessageEl.classList.remove("hidden");
  bidMessageEl.textContent = "Bidding will be enabled in a later step.";
}

// init
async function init() {
  if (!listingId) {
    titleEl.textContent = "Listing not found";
    descEl.textContent = "Missing listing id in the URL.";
    bidHistoryEmptyEl.textContent = "No data.";
    return;
  }

  try {
    const listing = await fetchListing(listingId);
    renderListing(listing);
  } catch (error) {
    console.error(error);
    titleEl.textContent = "Could not load listing";
    descEl.textContent =
      "Something went wrong while loading this listing. Please try again later.";
    bidHistoryEmptyEl.textContent = "No data.";
  }
}

// back button
if (backBtn) {
  backBtn.addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "listings.html";
    }
  });
}

init();
