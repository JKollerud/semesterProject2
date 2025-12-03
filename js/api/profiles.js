// profile API
import { API_BASE, API_KEY } from "./config.js";
import { getAuth } from "../utils/storage.js";

export async function getProfile(name) {
  const url = new URL(
    `${API_BASE}/auction/profiles/${encodeURIComponent(name)}`
  );

  url.searchParams.set("_listings", "false");

  const auth = getAuth();

  const headers = {
    "Content-Type": "application/json",
    "X-Noroff-API-Key": API_KEY,
  };

  if (auth?.accessToken) {
    headers.Authorization = `Bearer ${auth.accessToken}`;
  }

  const res = await fetch(url.href, { headers });
  const body = await res.json();

  if (!res.ok) {
    const msg = body?.errors?.[0]?.message || "Failed to load profile";
    throw new Error(msg);
  }

  return body?.data ?? body;
}
