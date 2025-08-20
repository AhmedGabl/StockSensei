import { useState, useEffect } from "react";

declare global {
  interface Window {
    botpress: {
      init: (config: any) => void;
      open: () => void;
      close: () => void;
      on: (event: string, callback: () => void) => void;
    };
  }
}

export default function EmbeddedBotpressChat() {
  const [isScriptsLoaded, setIsScriptsLoaded] = useState(false);

  // Load new Botpress floating bubble scripts
  useEffect(() => {
    const loadBotpressScripts = () => {
      // Remove existing scripts first
      const existingInject = document.getElementById('botpress-inject');
      const existingCustom = document.getElementById('botpress-custom');
      if (existingInject) existingInject.remove();
      if (existingCustom) existingCustom.remove();
      
      console.log('Loading new Botpress floating bubble scripts...');
      
      // Load main inject script
      const injectScript = document.createElement('script');
      injectScript.id = 'botpress-inject';
      injectScript.src = 'https://cdn.botpress.cloud/webchat/v3.2/inject.js';
      injectScript.defer = true;
      
      // Load custom configuration script
      const customScript = document.createElement('script');
      customScript.id = 'botpress-custom';
      customScript.src = 'https://files.bpcontent.cloud/2025/07/29/10/20250729105930-W64A6MNX.js';
      customScript.defer = true;
      
      // Set loaded state when scripts are loaded
      const onScriptLoad = () => {
        setTimeout(() => {
          setIsScriptsLoaded(true);
          console.log('Botpress floating bubble scripts loaded successfully');
        }, 1000); // Small delay to allow scripts to initialize
      };
      
      customScript.onload = onScriptLoad;
      
      document.head.appendChild(injectScript);
      document.head.appendChild(customScript);
    };

    loadBotpressScripts();
  }, []);

  return (
    <div className="w-full h-full">
      {!isScriptsLoaded && (
        <div className="flex items-center justify-center p-4">
          <div className="text-gray-500">Loading Botpress floating bubble...</div>
        </div>
      )}
      {isScriptsLoaded && (
        <div className="text-center p-4 text-sm text-gray-600">
          <div className="mb-2">✅ Botpress floating bubble is ready</div>
          <div>Look for the chat widget in the bottom-right corner of your screen</div>
        </div>
      )}
    </div>
  );
}