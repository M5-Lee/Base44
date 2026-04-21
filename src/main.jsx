import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
) 
// wherever you currently redirect to base44.app/login
const isLocal =
  location.hostname === "localhost" || location.hostname === "127.0.0.1";
const disableAuth =
  import.meta?.env?.VITE_DISABLE_BASE44_AUTH === "true";

if (!(isLocal && disableAuth)) {
  // original behavior (only runs in hosted mode)
  // window.location.href = `https://base44.app/login?from_url=${encodeURIComponent(location.href)}&app_id=...`
} else {
  console.warn("[dev] Skipping Base44 login in local mode.");
}
