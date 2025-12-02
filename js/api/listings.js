// listings API
import { API_BASE, API_KEY } from "./config.js";
import { getAuthToken } from "../utils/guards.js";

export async function getListings({
  limit = 20,
  page = 1,
  sort = "created",
  sortOrder = "desc",
} = {}) {
  const url = new URL(`${API_BASE}/auction/listings`);

  url.searchParams.set(`_seller`, "true");
  url.searchParams.set(`_bids`, "true");
  url.searchParams.set(`sort`, sort);
  url.searchParams.set(`sortOrder`, sortOrder);
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
  return body ?? { data: [], meta: {} };
}

// place bid on post/listing
export async function placeBid(listingId, amount) {
  if (!listingId) {
    throw new Error("Listing id is required");
  }

  const url = new URL(
    `${API_BASE}/auction/listings/${encodeURIComponent(listingId)}/bids`
  );

  const headers = {
    "Content-type": "application/json",
    "X-Noroff-API-Key": API_KEY,
  };

  const token = getAuthToken?.();

  if (!token) {
    throw new Error("You must be logged in to place a bid.");
  }

  headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url.href, {
    method: "POST",
    headers,
    body: JSON.stringify({ amount: Number(amount) }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.errors?.[0]?.message || "Failed to place bid");
  }

  const body = await response.json();
  return body ?? {};
}

// create post/listing
export async function createListing(payload) {
  const token = getAuthToken?.();
  if (!token) {
    throw new Error("You must be logged in to create a listing.");
  }

  const url = new URL(`${API_BASE}/auction/listings`);

  const headers = {
    "Content-Type": "application/json",
    "X-Noroff-API-Key": API_KEY,
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(url.href, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(
      errorBody?.errors?.[0]?.message || "Failed to create listing"
    );
  }

  const body = await response.json();
  return body ?? {};
}

// fetch post/listing by id
export async function getListingById(id) {
  if (!id) throw new Error("Listing id is required");

  const url = new URL(`${API_BASE}/auction/listings/${encodeURIComponent(id)}`);
  url.searchParams.set("_seller", "true");
  url.searchParams.set("_bids", "true");

  const headers = {
    "Content-Type": "application/json",
    "X-Noroff-API-Key": API_KEY,
  };

  const token = getAuthToken?.();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url.href, { headers });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(
      errorBody?.errors?.[0]?.message || "Failed to fetch listing"
    );
  }

  const body = await response.json();
  return body?.data ?? body;
}

// update post/listing
export async function updateListing(id, payload) {
  if (!id) throw new Error("Listing id is required");

  const token = getAuthToken?.();
  if (!token) {
    throw new Error("You must be logged in to update a listing.");
  }

  const url = new URL(`${API_BASE}/auction/listings/${encodeURIComponent(id)}`);

  const headers = {
    "Content-Type": "application/json",
    "X-Noroff-API-Key": API_KEY,
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(url.href, {
    method: "PUT",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(
      errorBody?.errors?.[0]?.message || "Failed to update listing"
    );
  }

  const body = await response.json();
  return body ?? {};
}

// delete post/listing
export async function deleteListing(id) {
  if (!id) throw new Error("Listing id is required");

  const token = getAuthToken?.();
  if (!token) {
    throw new Error("You must be logged in to delete a listing.");
  }

  const url = new URL(`${API_BASE}/auction/listings/${encodeURIComponent(id)}`);

  const headers = {
    "Content-Type": "application/json",
    "X-Noroff-API-Key": API_KEY,
    Authorization: `Bearer ${token}`,
  };

  const response = await fetch(url.href, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(
      errorBody?.errors?.[0]?.message || "Failed to delete listing"
    );
  }
  return true;
}
