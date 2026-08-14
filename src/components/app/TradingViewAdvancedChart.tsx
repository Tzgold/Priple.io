"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    TradingView?: {
      widget: new (options: Record<string, unknown>) => unknown;
    };
  }
}

let tvScriptPromise: Promise<void> | null = null;

function loadTradingViewScript() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.TradingView) return Promise.resolve();
  if (tvScriptPromise) return tvScriptPromise;

  tvScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://s3.tradingview.com/tv.js"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("TradingView failed to load")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("TradingView failed to load"));
    document.head.appendChild(script);
  });

  return tvScriptPromise;
}

export function TradingViewAdvancedChart({
  symbol,
  interval = "60",
}: {
  symbol: string;
  /** TradingView interval: 1, 15, 60, 240, D */
  interval?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const idRef = useRef(`tv_${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    let cancelled = false;

    async function mount() {
      await loadTradingViewScript();
      if (cancelled || !containerRef.current || !window.TradingView) return;
      containerRef.current.innerHTML = "";
      const host = document.createElement("div");
      host.id = idRef.current;
      host.style.height = "100%";
      host.style.width = "100%";
      containerRef.current.appendChild(host);

      // eslint-disable-next-line no-new
      new window.TradingView.widget({
        autosize: true,
        symbol,
        interval,
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#050506",
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        container_id: idRef.current,
        backgroundColor: "#050506",
        gridColor: "rgba(255,255,255,0.04)",
      });
    }

    void mount();
    return () => {
      cancelled = true;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [symbol, interval]);

  return <div ref={containerRef} className="h-[380px] w-full sm:h-[460px]" />;
}
