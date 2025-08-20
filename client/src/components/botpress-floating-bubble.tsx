import { useEffect } from "react";

export default function BotpressFloatingBubble() {
  useEffect(() => {
    // Remove any existing Botpress scripts first
    const existingScripts = document.querySelectorAll('script[src*="botpress"]');
    existingScripts.forEach(script => script.remove());

    // Add the inject script
    const injectScript = document.createElement('script');
    injectScript.src = 'https://cdn.botpress.cloud/webchat/v3.2/inject.js';
    injectScript.defer = true;
    document.head.appendChild(injectScript);

    // Add the configuration script
    const configScript = document.createElement('script');
    configScript.src = 'https://files.bpcontent.cloud/2025/07/29/10/20250729105930-W64A6MNX.js';
    configScript.defer = true;
    document.head.appendChild(configScript);

    console.log('Botpress floating bubble scripts added');

    // Cleanup function
    return () => {
      const scripts = document.querySelectorAll('script[src*="botpress"]');
      scripts.forEach(script => script.remove());
    };
  }, []);

  // This component doesn't render anything - the scripts create the floating bubble
  return null;
}