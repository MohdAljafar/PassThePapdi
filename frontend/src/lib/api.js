const API = (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");

export async function api(path, options = {}) {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({ error: `Unexpected response (${response.status})` }));
  if (!response.ok) {
    const error = new Error(data.error || `Request failed (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const DEFAULT_IMAGE = "/soanpapdi.jpg";

export function getCurrentClaimToken() {
  const match = window.location.pathname.match(/^\/claim\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function getApproximatePosition() {
  if (!("geolocation" in navigator)) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

export function formatDate(value) {
  if (!value) return "Date unavailable";
  return new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
