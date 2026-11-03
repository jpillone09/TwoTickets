import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string; remove: (id: string) => void };
  }
}

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
/** True once you've set VITE_TURNSTILE_SITE_KEY. Until then the CAPTCHA is skipped. */
export const turnstileEnabled = !!SITE_KEY;

export default function Turnstile({ onToken }: { onToken: (token: string | null) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!SITE_KEY) return;
    let widget: string | undefined;
    let cancelled = false;
    const mount = () => {
      if (cancelled || !ref.current || !window.turnstile) return;
      widget = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        callback: (t: string) => onToken(t),
        "expired-callback": () => onToken(null),
        "error-callback": () => onToken(null),
      });
    };
    if (window.turnstile) mount();
    else {
      let s = document.querySelector<HTMLScriptElement>("script[data-turnstile]");
      if (!s) {
        s = document.createElement("script");
        s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        s.async = true;
        s.dataset.turnstile = "1";
        document.head.appendChild(s);
      }
      s.addEventListener("load", mount);
    }
    return () => { cancelled = true; if (widget && window.turnstile) window.turnstile.remove(widget); };
  }, [onToken]);

  return SITE_KEY ? <div ref={ref} className="flex justify-center" /> : null;
}
