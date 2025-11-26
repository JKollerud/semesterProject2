// listings API
import { API_BASE } from "./config.js";
import { getAuthToken } from "../utils/guards.js";

export async function getListings({ limit = 20, page = 1 } = {}) {
  const url = new URL(`${API_BASE}/auction/listings`);

  url.searchParams.set(`_seller`, "true");
  url.searchParams.set(`_bids`, "true");
  url.searchParams.set(`sort`, "endsAt");
  url.searchParams.set(`sortOrder`, "asc");
  url.searchParams.set(`limit`, String(limit));
  url.searchParams.set("page", String(page));

  const headers = { "Content-type": "application/json" };
  const token = getAuthToken?.();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url.href, { headers });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(
      errorBody?.errors?.[0]?.message || "Failed to fetch listings"
    );
  }

  const body = await response.json();
  return body;
}
