// Local-friendly Base44 client
import { createClient } from "@base44/sdk";

const isBrowser = typeof window !== "undefined";
const host = isBrowser ? window.location.hostname : "";
const isLocal = host === "localhost" || host === "127.0.0.1";
const disableAuth = import.meta?.env?.VITE_DISABLE_BASE44_AUTH === "true";

// In local dev (with the flag), do NOT require auth -> no redirect to base44.app
export const base44 = createClient({
  appId: "68ad1952f1b23354a5688040",
  requiresAuth: !(isLocal && disableAuth),
});

// No manual window.location redirect here.
// Leave any old redirect code commented out.

if (isBrowser) {
  // Help verify local bypass is active in the browser console
  // eslint-disable-next-line no-console
  console.log(
    "[base44Client] requiresAuth:",
    !(isLocal && disableAuth),
    "isLocal:",
    isLocal,
    "disableAuth:",
    disableAuth
  );
}
