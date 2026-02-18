/**
 * Detect if a user appears logged in by checking for a JWT cookie named "__user".
 * Notes:
 * - If the cookie is HttpOnly, JS cannot read it. In that case you must call an auth endpoint instead.
 * - This only checks presence + basic JWT shape/expiry, it does not verify the signature.
 */

function getCookie(name) {
  const parts = document.cookie.split("; ");
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = decodeURIComponent(part.slice(0, idx));
    if (k !== name) continue;
    return decodeURIComponent(part.slice(idx + 1));
  }
  return null;
}

function base64UrlToJson(b64url) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((b64url.length + 3) % 4);
  const json = atob(b64);
  return JSON.parse(json);
}

function parseJwt(token) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    return {
      header: base64UrlToJson(parts[0]),
      payload: base64UrlToJson(parts[1]),
    };
  } catch {
    return null;
  }
}

function isJwtExpired(payload, skewSeconds = 30) {
  // If no exp, treat as "unknown", you can choose to treat as logged in or not.
  if (!payload || typeof payload.exp !== "number") return false;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= (now + skewSeconds);
}

function getAuthStateFromUserCookie() {
  const token = getCookie("__user");

  if (!token) {
    return { isLoggedIn: false, reason: "missing_cookie" };
  }

  const parsed = parseJwt(token);
  if (!parsed) {
    return { isLoggedIn: false, reason: "invalid_jwt_format" };
  }

  if (isJwtExpired(parsed.payload)) {
    return { isLoggedIn: false, reason: "jwt_expired", payload: parsed.payload };
  }

  // Optional: check you have expected claims (sub, email, etc.)
  return { isLoggedIn: true, reason: "ok", payload: parsed.payload };
}

// Example usage
const auth = getAuthStateFromUserCookie();
if (auth.isLoggedIn) {
  console.log("Logged in", auth.payload);
} else {
  console.log("Not logged in:", auth.reason);
}
  
  
  (function () {
    const auth = getAuthStateFromUserCookie();
    
    const showSelector = auth.isLoggedIn ? '[data-auth="in"]' : '[data-auth="out"]';
    const hideSelector = auth.isLoggedIn ? '[data-auth="out"]' : '[data-auth="in"]';

    document.querySelectorAll(showSelector).forEach((el) => {
      el.style.removeProperty("display");
      el.removeAttribute("hidden");
      el.setAttribute("aria-hidden", "false");
    });

    document.querySelectorAll(hideSelector).forEach((el) => {
      el.style.display = "none";
      el.setAttribute("hidden", "");
      el.setAttribute("aria-hidden", "true");
    });
  })();