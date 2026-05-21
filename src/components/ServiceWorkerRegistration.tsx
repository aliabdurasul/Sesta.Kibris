"use client";

import Script from "next/script";

/** Register PWA service worker without inline <script> hydration issues. */
export function ServiceWorkerRegistration() {
  return (
    <Script id="sw-register" strategy="afterInteractive">
      {`if('serviceWorker' in navigator){navigator.serviceWorker.register('/sw.js')}`}
    </Script>
  );
}
