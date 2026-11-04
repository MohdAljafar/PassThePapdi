import { useEffect, useRef } from "react";

export default function GoogleSignIn({ onCredential, onError }) {
  const buttonRef = useRef(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const mount = () => {
      if (cancelled) return;
      const google = window.google?.accounts?.id;
      if (!google) {
        attempts += 1;
        if (attempts < 40) window.setTimeout(mount, 200);
        else onError?.("Google sign-in could not load. Check your internet connection and refresh.");
        return;
      }
      if (!clientId) {
        onError?.("Add VITE_GOOGLE_CLIENT_ID to frontend/.env and restart Vite.");
        return;
      }
      google.initialize({
        client_id: clientId,
        callback: (response) => onCredential(response.credential),
        auto_select: false,
      });
      if (buttonRef.current) {
        buttonRef.current.innerHTML = "";
        google.renderButton(buttonRef.current, {
          theme: "outline", size: "large", shape: "pill", text: "continue_with", width: 300,
        });
      }
    };
    mount();
    return () => { cancelled = true; };
  }, [clientId, onCredential, onError]);

  return <div className="flex min-h-11 justify-center" ref={buttonRef} />;
}