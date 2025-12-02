import { createListing } from "../api/listings.js";
import { requireAuth } from "../utils/guards.js";

const form = document.querySelector("#create-listing-form");
const titleInput = document.querySelector("#listing-title");
const descriptionInput = document.querySelector("#listing-description");
const tagsInput = document.querySelector("#listing-tags");
const mediaInput = document.querySelector("#listing-media");
const endsAtInput = document.querySelector("#listing-endsAt");
const messageEl = document.querySelector("#create-message");
const submitBtn = document.querySelector("#create-submit");
const toastEl = document.querySelector("#create-toast");
const mediaPreviewEl = document.querySelector("#media-preview");

// force date to future
if (endsAtInput) {
  const now = new Date();
  endsAtInput.min = now.toISOString().slice(0, 16);
}

// message
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

// comma seperated tags
function parseTags(str) {
  if (!str) return [];
  return str
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

// media URLS
function parseMedia(str) {
  if (!str) return [];
  return str
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((url) => ({ url }));
}

// preview images
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
      "w-16 h-16 rounded-md overflow-hidden bg-[#D2C8BC]/40 flex items-center justify-center";

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

// form validation
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

// toast
function showToast() {
  if (!toastEl) return;
  toastEl.classList.remove("hidden");
}

function hideToast() {
  if (!toastEl) return;
  toastEl.classList.add("hidden");
}

// submit handler
async function handleSubmit(event) {
  event.preventDefault();
  if (!form || !submitBtn) return;

  const payload = validateForm();
  if (!payload) return;

  submitBtn.disabled = true;
  showMessage("Creating listing…", "success");

  try {
    const result = await createListing(payload);
    const listing = result.data ?? result;

    showMessage("Listing created successfully.", "success");
    showToast();

    const id = listing.id;
    if (id) {
      setTimeout(() => {
        window.location.href = `listing-page.html?id=${encodeURIComponent(id)}`;
      }, 1200);
    }
  } catch (error) {
    console.error(error);
    showMessage(error.message || "Could not create listing. Please try again.");
    submitBtn.disabled = false;
    hideToast();
  }
}

function init() {
  requireAuth();
  if (form) {
    form.addEventListener("submit", handleSubmit);
  }
}

if (mediaInput) {
  mediaInput.addEventListener("input", () => {
    renderMediaPreviewFromString(mediaInput.value);
  });
}

init();
