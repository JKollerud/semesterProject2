import { getListings } from "../api/listings.js";
import { createListingCard } from "./listings.js";

const CARDS_PER_SLIDE = 3;

const track = document.getElementById("trending-track");
const dotsWrap = document.getElementById("trending-dots");
const loaderEl = document.getElementById("home-loading");
const contentEl = document.getElementById("home-listings-content");

let currentSlide = 0;
let totalSlides = 0;

function showContent() {
  if (!loaderEl || !contentEl) return;
  loaderEl.classList.add("hidden");
  contentEl.classList.remove("opacity-0");
}

function updateSlide() {
  track.style.transform = `translateX(-${currentSlide * 100}%)`;
  const dots = dotsWrap.querySelectorAll("button");
  dots.forEach((dot, index) => {
    dot.classList.toggle("bg-[#4F6E60]", index === currentSlide);
    dot.classList.toggle("bg-[#D2C8BC]", index !== currentSlide);
  });
}
function buildCarousel(listings) {
  track.innerHTML = "";
  dotsWrap.innerHTML = "";
  const slides = [];
  for (let i = 0; i < listings.length; i += CARDS_PER_SLIDE) {
    slides.push(listings.slice(i, i + CARDS_PER_SLIDE));
  }
  totalSlides = slides.length;

  slides.forEach((items) => {
    const slide = document.createElement("div");
    slide.className =
      "w-full shrink-0 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

    items.forEach((item) => {
      const card = createListingCard(item);
      slide.appendChild(card);
    });

    track.appendChild(slide);
  });
  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement("button");
    dot.className =
      "w-3 h-3 rounded-full bg-[#D2C8BC] transition-colors duration-200";
    dot.addEventListener("click", () => {
      currentSlide = i;
      updateSlide();
    });
    dotsWrap.appendChild(dot);
  }

  currentSlide = 0;
  updateSlide();
}
async function loadTrending() {
  const MIN_DURATION = 700;
  const startTime = performance.now();
  try {
    const { data = [] } = await getListings({
      limit: 9,
      page: 1,
      sort: "created",
      sortOrder: "desc",
    });

    if (!data.length) {
      track.innerHTML =
        '<p class="text-center text-sm opacity-70 py-10">No auctions found.</p>';
      dotsWrap.innerHTML = "";
    } else {
      buildCarousel(data);
    }
  } catch (err) {
    console.error(err);
    track.innerHTML =
      '<p class="text-center text-sm opacity-70 py-10">Failed to load auctions.</p>';
    dotsWrap.innerHTML = "";
  } finally {
    const elapsed = performance.now() - startTime;
    const remaining = MIN_DURATION - elapsed;

    if (remaining > 0) {
      setTimeout(showContent, remaining);
    } else {
      showContent();
    }
  }
}

loadTrending();
