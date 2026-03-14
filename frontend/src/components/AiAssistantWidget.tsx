import { FormEvent, KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, MessageSquare, Send, Sparkles, X } from 'lucide-react';
import { useLocation, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useTheme } from '../hooks/useTheme';
import { getPageKind } from '../utils/pageKind';
import TurnstileWidget from './TurnstileWidget';

type ChatRole = 'assistant' | 'user';

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'assistant-welcome',
    role: 'assistant',
    text: 'I can help with room selection, pricing guidance, booking steps, visit scheduling, and shortlist suggestions.'
  }
];

const ASSIST_MODES = [
  { title: 'Find options near my office', prompt: 'Find options near my office.' },
  { title: 'Explain the booking process', prompt: 'Explain the booking process.' },
  { title: 'Can I schedule a visit today?', prompt: 'Can I schedule a visit today?' }
] as const;

const FALLBACK_RESPONSE =
  'I could not answer that right now. You can still request a visit or share your requirements and the team will help you.';
const QUOTA_RESPONSE =
  'The AI assistant is temporarily unavailable due to usage limits. Please try again later or talk to a human agent.';

function buildMessage(role: ChatRole, text: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text
  };
}

function AssistantHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="ai-assistant__header ai-assistant__header--hero flex-shrink-0 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="ai-assistant__badge rounded-2xl p-2 text-cyan-200">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Gharpayy AI Concierge</span>
              <span className="ai-assistant__status inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
                <span className="ai-assistant__status-dot h-2 w-2 rounded-full"></span>
                online
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Verified inventory, pricing guidance, and visit support.</p>
          </div>
        </div>
        <button type="button" className="ai-assistant__close rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white" onClick={onClose}>
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="ai-assistant__header-divider mt-3"></div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const bubbleClass = message.role === 'assistant' ? 'ai-assistant__bubble--assistant' : 'ai-assistant__bubble--user ml-auto';

  return (
    <div className={`ai-assistant__bubble max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${bubbleClass}`}>
      {message.text}
    </div>
  );
}

function LoadingBubble() {
  return (
    <div className="ai-assistant__bubble ai-assistant__bubble--assistant max-w-[85%] rounded-2xl px-3 py-2 text-sm text-slate-400">
      Thinking through the best next step...
    </div>
  );
}

function Composer({
  value,
  loading,
  onChange,
  onSubmit
}: {
  value: string;
  loading: boolean;
  onChange: (nextValue: string) => void;
  onSubmit: (event?: FormEvent) => void;
}) {
  const handleKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <form onSubmit={onSubmit} className="border-t border-white/10 p-3">
      <div className="flex items-end gap-2">
        <textarea
          className="input-modern min-h-[54px] flex-1 resize-none"
          placeholder="Ask about price, location, booking, or visits"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button type="submit" className="btn-primary h-[54px] px-4" disabled={loading || !value.trim()}>
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

export default function AiAssistantWidget() {
  const location = useLocation();
  const params = useParams();
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [showModes, setShowModes] = useState(true);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [handoffName, setHandoffName] = useState('');
  const [handoffPhone, setHandoffPhone] = useState('');
  const [handoffMessage, setHandoffMessage] = useState('');
  const [handoffStatus, setHandoffStatus] = useState('');
  const [handoffLoading, setHandoffLoading] = useState(false);
  const [handoffCaptchaToken, setHandoffCaptchaToken] = useState('');
  const [handoffCaptchaKey, setHandoffCaptchaKey] = useState(0);
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const captchaBypass = import.meta.env.VITE_CAPTCHA_BYPASS === 'true';
  const messageViewportRef = useRef<HTMLDivElement | null>(null);

  const propertyId = useMemo(() => (location.pathname.startsWith('/property/') ? params.id : undefined), [location.pathname, params.id]);
  const pageKind = useMemo(() => getPageKind(location.pathname), [location.pathname]);

  useEffect(() => {
    if (!messageViewportRef.current) return;
    messageViewportRef.current.scrollTop = messageViewportRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    if (open) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [open]);

  const submitMessage = async (event?: FormEvent, overrideMessage?: string) => {
    event?.preventDefault();
    const nextText = (overrideMessage ?? draft).trim();

    if (!nextText || loading) return;

    setMessages((current) => [...current, buildMessage('user', nextText)]);
    setDraft('');
    setLoading(true);

    try {
      const response = await api.public.assistant({
        message: nextText,
        property_id: propertyId,
        page: location.pathname
      });

      const nextAnswer = response?.error_type === 'quota' ? QUOTA_RESPONSE : response.answer;
      setMessages((current) => [...current, buildMessage('assistant', nextAnswer)]);
    } catch {
      setMessages((current) => [...current, buildMessage('assistant', FALLBACK_RESPONSE)]);
    } finally {
      setLoading(false);
    }
  };

  const submitHandoff = async (event?: FormEvent) => {
    event?.preventDefault();
    const name = handoffName.trim();
    const phone = handoffPhone.trim();
    const message = handoffMessage.trim();
    if (!name || !phone || !message || handoffLoading) return;
    if (!captchaBypass && !handoffCaptchaToken) {
      setHandoffStatus('Please complete the captcha to continue.');
      return;
    }

    setHandoffLoading(true);
    setHandoffStatus('Sending your message...');
    try {
      await api.public.chat({
        name,
        phone,
        message,
        property_id: propertyId,
        captchaToken: captchaBypass ? undefined : handoffCaptchaToken
      });
      setHandoffStatus('Message sent. Our team will respond shortly.');
      setHandoffMessage('');
      setHandoffCaptchaToken('');
      setHandoffCaptchaKey((value) => value + 1);
    } catch {
      setHandoffStatus('Could not send message. Please try again.');
    } finally {
      setHandoffLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className={`ai-assistant ai-assistant__panel ai-assistant--${pageKind} ai-assistant--${theme} flex max-h-[80vh] w-[min(92vw,390px)] flex-col overflow-hidden rounded-[1.75rem]`}>
          <AssistantHeader onClose={() => setOpen(false)} />
          <div
            ref={messageViewportRef}
            className="min-h-0 flex-1 overflow-y-auto"
          >
            <div className="border-t border-white/10 px-4 py-2">
              <button
                type="button"
                onClick={() => {
                  setShowModes((current) => !current);
                  setHandoffOpen(false);
                setHandoffStatus('');
                setHandoffMessage('');
                setHandoffCaptchaToken('');
                setHandoffCaptchaKey((value) => value + 1);
                if (messageViewportRef.current) {
                  messageViewportRef.current.scrollTop = 0;
                }
                }}
                className="w-full rounded-full border border-white/15 px-3 py-2 text-[11px] font-semibold text-slate-300 transition hover:border-cyan-300/60 hover:text-cyan-200"
              >
                {showModes ? 'Hide assistant modes' : 'Show assistant modes'}
              </button>
              {showModes && (
                <div className="mt-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Assistant Modes</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ASSIST_MODES.map((mode) => (
                      <button
                        key={mode.title}
                        type="button"
                        onClick={() => void submitMessage(undefined, mode.prompt)}
                        className="rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-semibold text-slate-200 transition hover:border-cyan-300/60 hover:text-cyan-200"
                      >
                        {mode.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setHandoffOpen((current) => {
                    const next = !current;
                    if (next) {
                      setShowModes(false);
                    } else {
                      setHandoffStatus('');
                      setHandoffMessage('');
                      setHandoffCaptchaToken('');
                      setHandoffCaptchaKey((value) => value + 1);
                    }
                    return next;
                  });
                }}
                className="w-full rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-cyan-200 transition hover:border-cyan-300/60 hover:text-cyan-100"
              >
                Talk to a human agent
              </button>
              {handoffOpen && (
                <form onSubmit={submitHandoff} className="mt-3 max-h-[38vh] space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-3">
                  <input
                    className="input-modern w-full"
                    placeholder="Your name"
                    value={handoffName}
                    onChange={(event) => setHandoffName(event.target.value)}
                  />
                  <input
                    className="input-modern w-full"
                    placeholder="Phone number"
                    value={handoffPhone}
                    onChange={(event) => setHandoffPhone(event.target.value)}
                  />
                  <textarea
                    className="input-modern w-full min-h-[72px] resize-none"
                    placeholder="What do you need help with?"
                    value={handoffMessage}
                    onChange={(event) => setHandoffMessage(event.target.value)}
                  />
                  <TurnstileWidget
                    key={handoffCaptchaKey}
                    siteKey={turnstileSiteKey}
                    onVerify={setHandoffCaptchaToken}
                    onExpire={() => setHandoffCaptchaToken('')}
                    onError={() => setHandoffCaptchaToken('')}
                    className="rounded-xl"
                  />
                  <button
                    type="submit"
                    className="btn-primary w-full"
                    disabled={handoffLoading || !handoffName.trim() || !handoffPhone.trim() || !handoffMessage.trim()}
                  >
                    Send to agent
                  </button>
                  {handoffStatus && <p className="text-xs text-cyan-200">{handoffStatus}</p>}
                </form>
              )}
            </div>

            <div className="space-y-3 px-4 py-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {loading && <LoadingBubble />}
            </div>
          </div>

          <Composer value={draft} loading={loading} onChange={setDraft} onSubmit={(event) => void submitMessage(event)} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`ai-assistant-trigger ai-assistant-trigger--${pageKind} ai-assistant-trigger--${theme} group inline-flex items-center gap-3 rounded-full px-3 py-3 text-sm font-semibold transition hover:-translate-y-0.5`}
          aria-label="Open AI concierge"
        >
          <span className="ai-assistant-trigger__icon flex h-10 w-10 items-center justify-center rounded-full text-cyan-100">
            <Sparkles className="h-4 w-4 transition group-hover:rotate-12" />
          </span>
          <span className="text-left">
            <span className="block text-[10px] uppercase tracking-[0.2em] text-cyan-300/80">AI Concierge</span>
            <span className="block text-sm text-white">Ask Gharpayy</span>
          </span>
          <MessageSquare className="h-4 w-4 text-cyan-200/80" />
        </button>
      )}
    </div>
  );
}
