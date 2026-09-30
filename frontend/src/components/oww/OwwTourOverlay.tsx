import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleHelp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface OwwTourSlide {
  id: string;
  title: string;
  body: string;
  tip?: string;
  highlight?: string;
}

export interface OwwTourConfig {
  id: string;
  label: string;
  slides: OwwTourSlide[];
  dismissedKey: string;
  stepKey: string;
  eventName: string;
  fabLabel?: string;
}

const HIGHLIGHT = 'oww-tour-highlight';

function readFlag(key: string) {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}
function writeFlag(key: string, v: boolean) {
  try {
    if (v) localStorage.setItem(key, '1');
    else localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
function readStep(key: string, max: number) {
  try {
    const n = parseInt(localStorage.getItem(key) ?? '0', 10);
    return Number.isFinite(n) && n >= 0 && n < max ? n : 0;
  } catch {
    return 0;
  }
}
function writeStep(key: string, i: number) {
  try {
    localStorage.setItem(key, String(i));
  } catch {
    /* ignore */
  }
}

export function requestOpenTour(eventName: string, slideIndex = 0) {
  window.dispatchEvent(new CustomEvent(eventName, { detail: { slideIndex } }));
}

export function OwwTourOverlay({ config }: { config: OwwTourConfig }) {
  const [open, setOpen] = useState(() => !readFlag(config.dismissedKey));
  const [step, setStep] = useState(() => readStep(config.stepKey, config.slides.length));
  const slide = config.slides[step] ?? config.slides[0];

  const clearHighlight = useCallback(() => {
    document.querySelectorAll(`.${HIGHLIGHT}`).forEach(el => el.classList.remove(HIGHLIGHT));
  }, []);

  const applyHighlight = useCallback(
    (sel?: string) => {
      clearHighlight();
      if (!sel) return;
      const el = document.querySelector(sel);
      if (el) {
        el.classList.add(HIGHLIGHT);
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    [clearHighlight]
  );

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { slideIndex?: number } | undefined;
      setStep(detail?.slideIndex ?? 0);
      setOpen(true);
      writeFlag(config.dismissedKey, false);
    };
    window.addEventListener(config.eventName, handler);
    return () => window.removeEventListener(config.eventName, handler);
  }, [config.eventName, config.dismissedKey]);

  useEffect(() => {
    if (!open) {
      clearHighlight();
      return;
    }
    applyHighlight(slide?.highlight);
    writeStep(config.stepKey, step);
  }, [open, step, slide, applyHighlight, clearHighlight, config.stepKey]);

  if (!open) {
    return createPortal(
      <button
        type="button"
        className="fixed bottom-4 right-4 z-50 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-oww-navy px-4 text-base text-white hover:bg-navy-700"
        onClick={() => setOpen(true)}
        aria-label={config.fabLabel ?? 'Open tour'}
      >
        <CircleHelp className="h-5 w-5" />
        {config.fabLabel ?? 'Tour'}
      </button>,
      document.body
    );
  }

  return createPortal(
    <div
      role="dialog"
      aria-label={`${config.label} tour`}
      className="fixed bottom-4 right-4 z-50 w-[min(100vw-2rem,24rem)] rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">{config.label}</p>
          <h2 className="mt-1 font-display text-lg font-semibold text-navy">{slide.title}</h2>
        </div>
        <button
          type="button"
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
          aria-label="Close tour"
          onClick={() => {
            setOpen(false);
            writeFlag(config.dismissedKey, true);
            clearHighlight();
          }}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <p className="mt-3 text-base leading-relaxed text-slate-700">{slide.body}</p>
      {slide.tip ? <p className="mt-2 text-sm text-slate-500">{slide.tip}</p> : null}
      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="text-sm text-slate-500">
          {step + 1} / {config.slides.length}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-[44px] text-base"
            disabled={step === 0}
            onClick={() => setStep(s => Math.max(0, s - 1))}
          >
            Back
          </Button>
          {step < config.slides.length - 1 ? (
            <Button type="button" className="min-h-[44px] text-base" onClick={() => setStep(s => s + 1)}>
              Next
            </Button>
          ) : (
            <Button
              type="button"
              className="min-h-[44px] text-base"
              onClick={() => {
                setOpen(false);
                writeFlag(config.dismissedKey, true);
                clearHighlight();
              }}
            >
              Done
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
