import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { parseAge } from "../utils/parseAge";

/** Pakistan mobile 03057388765 → wa.me international format */
const WHATSAPP_PHONE = "923057388765";

const HIRA_LOGO_SRC = "https://www.hiraschools.org.pk/images/logo.png";

const CLASS_OPTIONS = [
  "Play Group",
  "Nursery",
  "Prep",
  "Class 1",
  "Class 2",
  "Class 3",
];

const BOT = {
  name: "بچے کا نام کیا ہے؟ / What is your child's name?",
  age: "بچے کی عمر کیا ہے؟ / What is your child's age?",
  ageRetry:
    "براہ کرم درست عمر لکھیں (مثلاً 5، 4.5، 4 years، 4 سال 6 ماہ)۔ / Please enter a valid age (e.g. 5, 4.5, 4 years, or 4 years 6 months in Urdu).",
  klass:
    "آپ اپنے بچے کو کس کلاس میں داخل کروانا چاہتے ہیں؟ / Which class do you want to enroll your child in?",
  fee: "آپ کے بچے کے لیے ماہانہ فیس 2200 روپے ہوگی اور ایک بار ایڈمیشن فیس 3000 روپے ہوگی۔ / Monthly fee for your child will be 2200 PKR and one-time admission fee is 3000 PKR.",
};

function buildWhatsAppHref(name, ageYears, classLabel) {
  const lines = [
    "I am interested in admission at Hira Group of Schools — Tarnol Campus.",
    "",
    `Name: ${name}`,
    `Age: ${ageYears}`,
    `Class: ${classLabel}`,
    "",
    "Please contact me regarding the next steps.",
    "",
    "میں Hira Tarnol کیمپس میں داخلہ کے لیے رابطہ کرنا چاہتا/چاہتی ہوں۔",
  ];
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(lines.join("\n"))}`;
}

function randomDelay() {
  return 500 + Math.random() * 300;
}

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const fn = () => setReduced(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return reduced;
}

function TypingIndicator() {
  return (
    <div
      className="flex gap-1.5 rounded-2xl rounded-bl-md bg-[#f1f7f9] px-4 py-3 shadow-sm ring-1 ring-[#003679]/10"
      aria-hidden
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-[#003679]/45 animate-typing-dot"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function BotTypewriter({ text, rtl, onComplete, reducedMotion }) {
  const [shown, setShown] = useState(reducedMotion ? text : "");
  const doneRef = useRef(false);
  const timersRef = useRef([]);

  useEffect(() => {
    const clearTimers = () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };

    doneRef.current = false;
    if (reducedMotion) {
      setShown(text);
      onComplete?.();
      doneRef.current = true;
      return undefined;
    }
    setShown("");
    const chars = Array.from(text);
    let i = 0;
    const step = () => {
      i += 1;
      setShown(chars.slice(0, i).join(""));
      if (i >= chars.length) {
        if (!doneRef.current) {
          doneRef.current = true;
          onComplete?.();
        }
        return;
      }
      const id = window.setTimeout(step, 14 + Math.random() * 10);
      timersRef.current.push(id);
    };
    timersRef.current.push(window.setTimeout(step, 40));
    return () => {
      clearTimers();
    };
  }, [text, reducedMotion, onComplete]);

  return (
    <p
      className={`text-[0.95rem] leading-relaxed text-[#212121] ${rtl ? "font-urdu" : "font-sans"}`}
      dir={rtl ? "auto" : "ltr"}
      lang={rtl ? "ur" : "en"}
    >
      {shown}
    </p>
  );
}

export function AdmissionChatWidget() {
  const titleId = useId();
  const reducedMotion = useReducedMotion();
  const listEndRef = useRef(null);
  const inputRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [studentName, setStudentName] = useState("");
  const [age, setAge] = useState("");
  const [preferredClass, setPreferredClass] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [showClassButtons, setShowClassButtons] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  const scrollToBottom = useCallback(() => {
    listEndRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  }, [reducedMotion]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, thinking, showClassButtons, showWhatsApp, scrollToBottom]);

  const pushBot = useCallback((text, opts = {}) => {
    const id = newId();
    setMessages((m) => [...m, { id, role: "bot", text, ...opts }]);
    return id;
  }, []);

  const pushUser = useCallback((text) => {
    const id = newId();
    setMessages((m) => [...m, { id, role: "user", text }]);
    return id;
  }, []);

  const runThinkingThen = useCallback(async (fn) => {
    setThinking(true);
    await new Promise((r) => setTimeout(r, randomDelay()));
    setThinking(false);
    await fn();
  }, []);

  useEffect(() => {
    const triggers = document.querySelectorAll("[data-admission-chat-open]");
    const onOpen = () => setOpen(true);
    triggers.forEach((el) => el.addEventListener("click", onOpen));
    return () => triggers.forEach((el) => el.removeEventListener("click", onOpen));
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    let alive = true;
    (async () => {
      setStep(1);
      setStudentName("");
      setAge("");
      setPreferredClass("");
      setMessages([]);
      setDraft("");
    setShowClassButtons(false);
    setShowWhatsApp(false);
    setThinking(true);
      await new Promise((r) => setTimeout(r, randomDelay()));
      if (!alive) return;
      setThinking(false);
      if (!alive) return;
      pushBot(BOT.name);
    })();
    return () => {
      alive = false;
    };
  }, [open, pushBot]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open && step <= 2 && !showClassButtons && !thinking) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [open, step, showClassButtons, thinking, messages.length]);

  const afterNameStep = useCallback(async () => {
    await runThinkingThen(() => {
      pushBot(BOT.age);
      setStep(2);
    });
  }, [pushBot, runThinkingThen]);

  const afterAgeStep = useCallback(async () => {
    await runThinkingThen(() => {
      pushBot(BOT.klass);
      setShowClassButtons(true);
      setStep(3);
    });
  }, [pushBot, runThinkingThen]);

  const handleFeeTyped = useCallback(() => {
    setStep(5);
    setShowWhatsApp(true);
  }, []);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || thinking) return;

    if (step === 1) {
      pushUser(text);
      setDraft("");
      setStudentName(text);
      await afterNameStep();
      return;
    }

    if (step === 2) {
      const parsed = parseAge(text);
      if (!parsed) {
        pushUser(text);
        setDraft("");
        await runThinkingThen(() => pushBot(BOT.ageRetry));
        return;
      }
      pushUser(text);
      setDraft("");
      setAge(parsed);
      await afterAgeStep();
    }
  };

  const handleClassClick = async (label) => {
    if (step !== 3 || thinking || !showClassButtons) return;
    pushUser(label);
    setPreferredClass(label);
    setShowClassButtons(false);
    setStep(4);
    await runThinkingThen(() => {
      pushBot(BOT.fee, { kind: "fee" });
    });
  };

  const inputEnabled =
    open && (step === 1 || step === 2) && !showClassButtons && !thinking && !showWhatsApp;

  const whatsappHref = useMemo(
    () => buildWhatsAppHref(studentName, age, preferredClass),
    [studentName, age, preferredClass]
  );

  const modal = !open ? null : (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#001a33]/55 backdrop-blur-[2px] transition-opacity animate-fade-in-up"
        aria-label="Close chat"
        onClick={() => setOpen(false)}
      />
      <div
        className="relative flex h-[min(100dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl shadow-[#003679]/20 ring-1 ring-[#003679]/15 animate-fade-in-up sm:max-h-[85vh] sm:rounded-3xl"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#003679] to-[#0056b3] px-4 py-3.5 text-white shadow-md shadow-[#001a33]/20">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-white/60">
              <img
                src={HIRA_LOGO_SRC}
                alt="Hira Group of Schools"
                className="h-full w-full object-contain"
                width={40}
                height={40}
                decoding="async"
              />
            </div>
            <div className="min-w-0">
              <h2 id={titleId} className="truncate text-base font-semibold tracking-tight">
                Hira Tarnol — Admission
              </h2>
              <p className="text-[0.7rem] leading-snug text-white/85 sm:text-xs">
                We reply within a few hours / چند گھنٹوں میں جواب
              </p>
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-full p-2 text-white/90 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
            onClick={() => setOpen(false)}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#f1f7f9] px-3 py-4 sm:px-4">
          <div className="mx-auto flex max-w-md flex-col gap-3">
            {messages.map((msg) =>
              msg.role === "user" ? (
                <div
                  key={msg.id}
                  className="animate-fade-in-up ml-8 flex justify-end"
                >
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#003679] px-4 py-2.5 text-white shadow-md shadow-[#001a33]/25">
                    <p className="text-[0.95rem] leading-relaxed" dir="auto">
                      {msg.text}
                    </p>
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="animate-fade-in-up mr-8 flex justify-start">
                  <div className="max-w-[90%] rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-md shadow-[#003679]/8 ring-1 ring-[#e4eaef]">
                    <BotTypewriter
                      text={msg.text}
                      rtl
                      reducedMotion={reducedMotion}
                      onComplete={msg.kind === "fee" ? handleFeeTyped : undefined}
                    />
                  </div>
                </div>
              )
            )}
            {thinking ? (
              <div className="mr-8 flex justify-start">
                <TypingIndicator />
              </div>
            ) : null}
            {showClassButtons ? (
              <div className="animate-fade-in-up ml-8 flex flex-wrap justify-end gap-2">
                {CLASS_OPTIONS.map((label) => (
                  <button
                    key={label}
                    type="button"
                    className="rounded-full border border-[#003679]/20 bg-white px-3.5 py-2 text-sm font-medium text-[#003679] shadow-sm transition hover:border-[#ffbb38] hover:bg-[#fff9ed]"
                    onClick={() => handleClassClick(label)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
            {showWhatsApp ? (
              <div className="animate-fade-in-up mx-auto mt-2 w-full max-w-sm px-1">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-green-900/20 transition hover:bg-[#20bd5a]"
                >
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Connect on WhatsApp
                </a>
              </div>
            ) : null}
            <div ref={listEndRef} />
          </div>
        </div>

        <footer className="shrink-0 border-t border-[#e4eaef] bg-white p-3 sm:p-4">
          <div className="mx-auto flex max-w-md gap-2">
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={!inputEnabled}
              placeholder={
                step === 1
                  ? "Name / نام…"
                  : step === 2
                    ? "Age / عمر…"
                    : "…"
              }
              className="min-w-0 flex-1 rounded-2xl border border-[#e4eaef] bg-[#f1f7f9] px-4 py-3 text-sm text-[#212121] outline-none transition placeholder:text-[#6e6e6e] focus:border-[#003679] focus:bg-white focus:ring-4 focus:ring-[#003679]/15 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Message"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!inputEnabled || !draft.trim()}
              className="shrink-0 rounded-2xl bg-[#003679] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-[#001a33]/20 transition hover:bg-[#0056b3] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </footer>
      </div>
    </div>
  );

  const root =
    typeof document !== "undefined" ? document.getElementById("admission-chat-root") : null;
  if (!root) return null;
  return createPortal(modal, root);
}
