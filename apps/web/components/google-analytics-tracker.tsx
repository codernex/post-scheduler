"use client";

import { useEffect } from "react";

export default function GoogleAnalyticsTracker() {
  useEffect(() => {
    const gaId = process.env.NEXT_PUBLIC_GA_ID;
    if (!gaId) return;

    const loadGoogleAnalytics = () => {
      const consent = localStorage.getItem("cookie-consent");
      if (consent === "accepted") {
        // Inject Gtag External Script if not present
        if (!document.getElementById("gtag-external")) {
          const extScript = document.createElement("script");
          extScript.id = "gtag-external";
          extScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
          extScript.async = true;
          document.head.appendChild(extScript);
        }

        // Inject Gtag Config Script if not present
        if (!document.getElementById("gtag-config")) {
          const configScript = document.createElement("script");
          configScript.id = "gtag-config";
          configScript.innerHTML = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', { 'anonymize_ip': true });
          `;
          document.head.appendChild(configScript);
        }
      }
    };

    // Run on initial load
    loadGoogleAnalytics();

    // Setup listener for consent changes
    window.addEventListener("cookie-consent-updated", loadGoogleAnalytics);
    return () => {
      window.removeEventListener("cookie-consent-updated", loadGoogleAnalytics);
    };
  }, []);

  return null;
}
