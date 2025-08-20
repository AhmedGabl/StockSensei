import { useEffect } from "react";

export default function BotpressFloatingBubble() {
  useEffect(() => {
    // Check if scripts are already loaded to prevent duplicates
    const existingInject = document.querySelector('script[src="https://cdn.botpress.cloud/webchat/v3.2/inject.js"]');
    const existingConfig = document.querySelector('script[src="https://files.bpcontent.cloud/2025/07/29/10/20250729105930-W64A6MNX.js"]');
    
    if (existingInject && existingConfig) {
      console.log('Botpress scripts already loaded');
      return;
    }

    // Remove any existing Botpress scripts first
    document.querySelectorAll('script[src*="botpress"]').forEach(script => script.remove());

    // Add the exact scripts you specified
    const injectScript = document.createElement('script');
    injectScript.src = 'https://cdn.botpress.cloud/webchat/v3.2/inject.js';
    injectScript.defer = true;
    document.head.appendChild(injectScript);

    const configScript = document.createElement('script');
    configScript.src = 'https://files.bpcontent.cloud/2025/07/29/10/20250729105930-W64A6MNX.js';
    configScript.defer = true;
    document.head.appendChild(configScript);

    console.log('Added Botpress floating bubble scripts to head');

    // Cleanup on unmount
    return () => {
      document.querySelectorAll('script[src*="botpress"]').forEach(script => script.remove());
    };
  }, []);

  return null;
}