import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const TURNSTILE_SCRIPT_ID = 'turnstile-script';
const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript() {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Turnstile script')));
      return;
    }

    console.debug('[Turnstile] Loading script', { src: TURNSTILE_SRC });
    const script = document.createElement('script');
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Turnstile script'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

type TurnstileWidgetProps = {
  siteKey?: string;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: 'auto' | 'light' | 'dark';
  className?: string;
  debug?: boolean;
};

export default function TurnstileWidget({
  siteKey,
  onVerify,
  onExpire,
  onError,
  theme = 'auto',
  className,
  debug = false
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'missing_key' | 'loading' | 'ready' | 'error'>('idle');
  const [lastEvent, setLastEvent] = useState<'init' | 'rendered' | 'verified' | 'expired' | 'error' | 'missing_key' | 'bypass' | null>(null);
  const [tokenLength, setTokenLength] = useState(0);
  const isLocalhost =
    typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const bypass = import.meta.env.VITE_CAPTCHA_BYPASS === 'true';

  useEffect(() => {
    let mounted = true;

    if (bypass) {
      setStatus('ready');
      setLastEvent('bypass');
      setTokenLength(6);
      onVerify('bypass');
      if (debug) {
        console.warn('[Turnstile] Bypass enabled', { hostname: window.location.hostname });
      }
      return () => {
        mounted = false;
      };
    }

    if (!siteKey) {
      setStatus('missing_key');
      setLastEvent('missing_key');
      console.warn('[Turnstile] Missing site key');
      return () => {
        mounted = false;
      };
    }

    setStatus('loading');
    setLastEvent('init');
    if (debug) {
      console.debug('[Turnstile] Init', {
        hostname: window.location.hostname,
        hasSiteKey: Boolean(siteKey),
        appearance: isLocalhost ? 'interaction-only' : 'always',
        execution: isLocalhost ? 'render' : 'default'
      });
    }
    loadTurnstileScript()
      .then(() => {
        if (!mounted || !containerRef.current || !window.turnstile) return;

        if (widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }

        const renderOptions = {
          sitekey: siteKey,
          theme,
          appearance: 'always',
          execution: isLocalhost ? 'render' : 'default',
          action: isLocalhost ? 'local-dev' : undefined,
          cData: isLocalhost ? 'local-dev' : undefined,
          size: isLocalhost ? 'normal' : 'flexible',
          callback: (token: string) => {
            if (debug) {
              console.debug('[Turnstile] Verified', { tokenLength: token?.length ?? 0 });
            }
            setTokenLength(token?.length ?? 0);
            setLastEvent('verified');
            onVerify(token);
          },
          'expired-callback': () => {
            if (debug) {
              console.warn('[Turnstile] Token expired');
            }
            setLastEvent('expired');
            setTokenLength(0);
            onExpire?.();
          },
          'error-callback': () => {
            console.error('[Turnstile] Widget error');
            setLastEvent('error');
            onError?.();
          }
        } as const;

        if (debug) {
          console.debug('[Turnstile] Render options', {
            appearance: renderOptions.appearance,
            execution: renderOptions.execution,
            action: renderOptions.action,
            cData: renderOptions.cData
          });
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, renderOptions);
        setStatus('ready');
        setLastEvent((prev) => (prev === 'verified' ? prev : 'rendered'));
        if (debug) {
          console.debug('[Turnstile] Rendered', { widgetId: widgetIdRef.current });
        }
      })
      .catch(() => {
        if (mounted) {
          setStatus('error');
          setLastEvent('error');
          console.error('[Turnstile] Script load failed');
          onError?.();
        }
      });

    return () => {
      mounted = false;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, onVerify, onExpire, onError, theme]);

  if (bypass) {
    return (
      <div className={className}>
        <p className="text-xs text-emerald-300">Captcha bypass enabled for local development.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div ref={containerRef} className="flex min-h-[70px] min-w-[300px] items-center" />
      {debug && status !== 'ready' && (
        <p className="mt-2 text-xs text-rose-300">
          {status === 'missing_key' && 'Turnstile site key is missing. Set VITE_TURNSTILE_SITE_KEY in frontend/.env.'}
          {status === 'loading' && 'Loading Turnstile...'}
          {status === 'error' && 'Turnstile failed to load. Check domain allowlist, ad blockers, or network.'}
        </p>
      )}
    </div>
  );
}
