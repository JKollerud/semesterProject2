import {
  getListingById,
  updateListing,
  deleteListing,
} from "../api/listings.js";
import { requireAuth, getAuthUser } from "../utils/guards.js";

const params = new URLSearchParams(window.location.search);
const listingId = params.get("id");

const form = document.querySelector("#edit-listing-form");
const titleInput = document.querySelector("#listing-title");
const descriptionInput = document.querySelector("#listing-description");
const tagsInput = document.querySelector("#listing-tags");
const mediaInput = document.querySelector("#listing-media");
const endsAtInput = document.querySelector("#listing-endsAt");
const messageEl = document.querySelector("#edit-message");
const submitBtn = document.querySelector("#edit-submit");
const deleteBtn = document.querySelector("#edit-delete");
const cancelBtn = document.querySelector("#edit-cancel");
const toastEl = document.querySelector("#edit-toast");
const mediaPreviewEl = document.querySelector("#media-preview");

let toastTimeoutId = null;
let currentListing = null;

if (endsAtInput) {
  const now = new Date();
  endsAtInput.min = now.toISOString().slice(0, 16);
}

function showMessage(text, type = "error") {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.classList.remove("hidden");
  messageEl.classList.remove("text-[#4F6E60]", "text-[#893B2F]");
  if (type === "success") {
    messageEl.classList.add("text-[#4F6E60]");
  } else {
    messageEl.classList.add("text-[#893B2F]");
  }
}

function hideMessage() {
  if (!messageEl) return;
  messageEl.classList.add("hidden");
  messageEl.textContent = "";
}

function parseTags(str) {
  if (!str) return [];
  return str
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function parseMedia(str) {
  if (!str) return [];
  return str
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((url) => ({ url }));
}

// preview media when creating editing
function renderMediaPreviewFromString(str) {
  if (!mediaPreviewEl) return;

  const urls = parseMedia(str).map((m) => m.url);

  mediaPreviewEl.innerHTML = "";

  if (!urls.length) {
    mediaPreviewEl.classList.add("hidden");
    return;
  }

  mediaPreviewEl.classList.remove("hidden");

  urls.forEach((url) => {
    const wrapper = document.createElement("div");
    wrapper.className =
      "w-16 h-16 rounded-md overflow-hidden bg-[#D2C8BC]/40 flex items-center justify-center text-[10px] text-[#4B4B4C]";

    const img = document.createElement("img");
    img.src = url;
    img.alt = "Media preview";
    img.className = "w-full h-full object-cover";

    img.onerror = () => {
      wrapper.textContent = "Image error";
    };

    wrapper.appendChild(img);
    mediaPreviewEl.appendChild(wrapper);
  });
}

if (mediaInput) {
  mediaInput.addEventListener("input", () => {
    renderMediaPreviewFromString(mediaInput.value);
  });
}

function showToast(text = "Listing updated successfully.") {
  if (!toastEl) return;

  toastEl.textContent = text;

  toastEl.classList.remove("hidden");
  toastEl.offsetHeight;
  toastEl.classList.remove("opacity-0", "translate-y-2");

  if (toastTimeoutId) clearTimeout(toastTimeoutId);

  toastTimeoutId = setTimeout(() => {
    hideToast();
  }, 2000);
}

function hideToast() {
  if (!toastEl) return;

  toastEl.classList.add("opacity-0", "translate-y-2");

  if (toastTimeoutId) clearTimeout(toastTimeoutId);
  toastTimeoutId = setTimeout(() => {
    toastEl.classList.add("hidden");
  }, 220);
}

function dateToInputValue(isoString) {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 16);
}

function validateForm() {
  hideMessage();

  const title = titleInput.value.trim();
  const endsAtRaw = endsAtInput.value.trim();

  if (!title) {
    showMessage("Title is required.");
    return null;
  }

  if (!endsAtRaw) {
    showMessage("End date and time is required.");
    return null;
  }

  const endDate = new Date(endsAtRaw);
  if (Number.isNaN(endDate.getTime())) {
    showMessage("Please provide a valid end date and time.");
    return null;
  }

  const now = new Date();
  if (endDate.getTime() <= now.getTime()) {
    showMessage("End date must be in the future.");
    return null;
  }

  const description = descriptionInput.value.trim();
  const tags = parseTags(tagsInput.value);
  const media = parseMedia(mediaInput.value);

  return {
    title,
    description: description || undefined,
    tags,
    media,
    endsAt: endDate.toISOString(),
  };
}

async function handleSubmit(event) {
  event.preventDefault();
  if (!form || !submitBtn || !listingId) return;

  const payload = validateForm();
  if (!payload) return;

  submitBtn.disabled = true;
  showMessage("Updating listing…", "success");

  try {
    const result = await updateListing(listingId, payload);
    const updated = result.data ?? result;

    currentListing = updated;
    showMessage("Listing updated successfully.", "success");
    showToast("Listing updated successfully.");

    // redirect back to listing page
    setTimeout(() => {
      window.location.href = `listing-page.html?id=${encodeURIComponent(
        listingId
      )}`;
    }, 1200);
  } catch (error) {
    console.error(error);
    showMessage(error.message || "Could not update listing.");
    submitBtn.disabled = false;
    hideToast();
  }
}

async function handleDelete() {
  if (!listingId) return;

  const confirmed = window.confirm(
    "Are you sure you want to delete this listing? This cannot be undone."
  );
  if (!confirmed) return;

  deleteBtn.disabled = true;
  showMessage("Deleting listing…", "success");

  try {
    await deleteListing(listingId);
    showMessage("Listing deleted.", "success");
    showToast("Listing deleted.");
    setTimeout(() => {
      window.location.href = "listings.html";
    }, 1000);
  } catch (error) {
    console.error(error);
    showMessage(error.message || "Could not delete listing.");
    deleteBtn.disabled = false;
    hideToast();
  }
}

function handleCancel() {
  if (window.history.length > 1) {
    window.history.back();
  } else if (listingId) {
    window.location.href = `listing-page.html?id=${encodeURIComponent(
      listingId
    )}`;
  } else {
    window.location.href = "listings.html";
  }
}

async function loadListing() {
  if (!listingId) {
    showMessage("Missing listing id.", "error");
    return;
  }

  try {
    const listing = await getListingById(listingId);
    currentListing = listing;

    const authUser = getAuthUser?.();
    const authName = authUser?.name?.toLowerCase();
    const sellerName = listing.seller?.name?.toLowerCase();

    if (!authName || !sellerName || authName !== sellerName) {
      showMessage("You are not allowed to edit this listing.");
      if (listingId) {
        setTimeout(() => {
          window.location.href = `listing-page.html?id=${encodeURIComponent(
            listingId
          )}`;
        }, 1500);
      }
      return;
    }

    titleInput.value = listing.title || "";
    descriptionInput.value = listing.description || "";
    tagsInput.value = Array.isArray(listing.tags)
      ? listing.tags.join(", ")
      : "";
    mediaInput.value = Array.isArray(listing.media)
      ? listing.media
          .map((m) => m.url)
          .filter(Boolean)
          .join("\n")
      : "";
    endsAtInput.value = dateToInputValue(listing.endsAt);
  } catch (error) {
    console.error(error);
    showMessage(
      error.message || "Could not load listing for editing.",
      "error"
    );
  }
  renderMediaPreviewFromString(mediaInput.value);
}

function init() {
  requireAuth();

  if (form) {
    form.addEventListener("submit", handleSubmit);
  }
  if (deleteBtn) {
    deleteBtn.addEventListener("click", handleDelete);
  }
  if (cancelBtn) {
    cancelBtn.addEventListener("click", handleCancel);
  }

  loadListing();
}

init();
