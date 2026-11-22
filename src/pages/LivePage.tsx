import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, Bot, ChevronLeft, ChevronRight, Gauge, Pause, Play, Radio, RotateCcw, TrendingDown, TrendingUp, X, Zap } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import "./live.css";

type TickEntry = { time: string; price: number; change: number };
type Firm = {
  ticker: string;
  name: string;
  open: number;
  price: number;
  history: number[];
  dir: 1 | -1 | 0;
  sector: string;
  volume: number;
  ticks: TickEntry[];
};
type SimState = { spx: number; spxHistory: number[]; firms: Firm[]; tick: number };
type LogLine = { id: number; time: string; text: string; kind: "SCAN" | "SIGNAL" | "BOT" | "FILTER" | "WARNING" };
type WatchItem = { id: string; ticker: string; name: string };
type Sector = { name: string; base: number; live: number };

import { areaPath, fiftyTwo, fmt, fmtVol, freshSim, initialLogs, makeLog, pct, pointsFor, SEED, SECTORS_BASE, SPX_SEED, timeNow } from "../lib/simulator.js";

const CHART_SYMBOLS = ["SPX", "AAPL", "NVDA", "MSFT", "AMZN", "MU", "LLY"];

export default function LivePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTicker = searchParams.get("ticker");
  const initialTicker = SEED.some(([ticker]) => ticker === requestedTicker) ? requestedTicker : null;
  const [sim, setSim] = useState<SimState>(() => freshSim());
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 4>(1);
  const [sort, setSort] = useState<"change" | "price" | "name">("change");
  const [symbol, setSymbol] = useState(initialTicker || "SPX");
  const [latency, setLatency] = useState(24);
  const [now, setNow] = useState(new Date());
  const [logs, setLogs] = useState<LogLine[]>(() => initialLogs());
  const [sectors, setSectors] = useState< Sector[]>(SECTORS_BASE);
  const [detail, setDetail] = useState<string | null>(initialTicker);
  const [watchlist, setWatchlist] = useState<WatchItem[]>([]);
  const [watchTicker, setWatchTicker] = useState("AAPL");
  const [watchlistLoading, setWatchlistLoading] = useState(true);
  const [watchlistBusy, setWatchlistBusy] = useState(false);
  const [watchlistError, setWatchlistError] = useState<string | null>(null);
  const [watchlistNotice, setWatchlistNotice] = useState<string | null>(null);
  const logId = useRef(4);
  const logRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setWatchlistLoading(true);
      try {
        const res = await fetch("actions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "records.list", args: { collection: "watchlist" } }) });
        const json = await res.json();
        if (!res.ok || json.error) throw new Error(typeof json.error === "string" ? json.error : "Could not load the watchlist.");
        const recs = Array.isArray(json.data?.records) ? json.data.records : [];
        if (!cancelled) setWatchlist(recs.map((r: { id: string; value: { ticker?: unknown; name?: unknown } }) => ({ id: r.id, ticker: String(r.value?.ticker ?? ""), name: String(r.value?.name ?? "") })).filter((w: WatchItem) => w.ticker));
      } catch {
        if (!cancelled) setWatchlistError("Could not load the saved watchlist — the backend is unavailable.");
      } finally {
        if (!cancelled) setWatchlistLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const addWatchlist = async (tickerArg?: string) => {
    const ticker = tickerArg ?? watchTicker;
    const firm = sim.firms.find((f) => f.ticker === ticker);
    if (!firm) return;
    if (watchlist.some((w) => w.ticker === ticker)) { setWatchlistNotice(`${ticker} is already on your watchlist.`); return; }
    setWatchlistBusy(true); setWatchlistError(null); setWatchlistNotice(null);
    try {
      const value = { ticker: firm.ticker, name: firm.name };
      const res = await fetch("actions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "records.create", args: { collection: "watchlist", value, idempotency_key: `watchlist-${firm.ticker}-${Date.now()}` } }) });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(typeof json.error === "string" ? json.error : "Could not save the item.");
      if (json.data?.id) setWatchlist((prev) => [...prev, { id: json.data.id, ticker: value.ticker, name: value.name }]);
      setWatchlistNotice(`${firm.ticker} added to your watchlist.`);
    } catch (e) {
      setWatchlistError(e instanceof Error ? e.message : "Could not save the item.");
    } finally { setWatchlistBusy(false); }
  };

  const removeWatchlist = async (id: string, ticker: string) => {
    setWatchlistBusy(true); setWatchlistError(null);
    try {
      const res = await fetch("actions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "records.delete", args: { collection: "watchlist", id } }) });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(typeof json.error === "string" ? json.error : "Could not remove the item.");
      setWatchlist((prev) => prev.filter((w) => w.id !== id));
      setWatchlistNotice(`${ticker} removed from your watchlist.`);
    } catch (e) {
      setWatchlistError(e instanceof Error ? e.message : "Could not remove the item.");
    } finally { setWatchlistBusy(false); }
  };

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      const nowStr = timeNow();
      setSim((prev) => {
        const spxChange = (Math.random() - 0.495) * 7.2;
        const spx = Math.max(7000, prev.spx + spxChange);
        return {
          tick: prev.tick + 1,
          spx,
          spxHistory: [...prev.spxHistory.slice(-79), spx],
          firms: prev.firms.map((f) => {
            const drift = (Math.random() - 0.499) * f.price * 0.0022;
            const price = Math.max(1, f.price + drift);
            const volume = f.volume + Math.floor(6000 + Math.random() * 42000);
            const ticks = [...f.ticks.slice(-9), { time: nowStr, price, change: price - f.price }];
            return { ...f, price, volume, ticks, dir: drift >= 0 ? 1 : -1, history: [...f.history.slice(-39), price] };
          }),
        };
      });
      setLatency(14 + Math.floor(Math.random() * 48));
      setSectors((prev) => prev.map((s) => ({ ...s, live: Math.max(0.4, s.base + (Math.random() - 0.5) * 0.32) })));
    }, 1500 / speed);
    return () => window.clearInterval(id);
  }, [paused, speed]);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setLogs((prev) => [...prev.slice(-29), makeLog(logId.current++, sim.firms)]);
    }, 2900 / speed);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, speed, sim.tick]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  useEffect(() => {
    if (detail && detailRef.current) detailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [detail]);

  const openDetail = (ticker: string) => {
    setDetail(ticker);
    setSymbol(ticker);
    const next = new URLSearchParams(searchParams);
    next.set("ticker", ticker);
    setSearchParams(next, { replace: true });
  };

  const closeDetail = () => {
    setDetail(null);
    const next = new URLSearchParams(searchParams);
    next.delete("ticker");
    setSearchParams(next, { replace: true });
  };

  const selectedFirm = useMemo(() => sim.firms.find((f) => f.ticker === symbol), [sim.firms, symbol]);
  const chartHistory = symbol === "SPX" ? sim.spxHistory : selectedFirm?.history || [];
  const chartPrice = symbol === "SPX" ? sim.spx : selectedFirm?.price || 0;
  const chartOpen = symbol === "SPX" ? SPX_SEED : selectedFirm?.open || 0;
  const chartChange = chartPrice - chartOpen;
  const chartPct = pct(chartPrice, chartOpen);
  const chartUp = chartChange >= 0;
  const chartHigh = chartHistory.length ? Math.max(...chartHistory) : chartPrice;
  const chartLow = chartHistory.length ? Math.min(...chartHistory) : chartPrice;
  const chartColor = chartUp ? "#00ff88" : "#ff3b5c";

  const sorted = useMemo(() => {
    const copy = [...sim.firms];
    if (sort === "price") copy.sort((a, b) => b.price - a.price);
    if (sort === "change") copy.sort((a, b) => pct(b.price, b.open) - pct(a.price, a.open));
    if (sort === "name") copy.sort((a, b) => a.name.localeCompare(b.name, "en"));
    return copy;
  }, [sim.firms, sort]);

  const movers = useMemo(() => {
    const s = [...sim.firms].sort((a, b) => Math.abs(pct(b.price, b.open)) - Math.abs(pct(a.price, a.open)));
    return s.slice(0, 3);
  }, [sim.firms]);

  const reset = () => {
    setSim(freshSim());
    setLogs(initialLogs());
    setSectors(SECTORS_BASE);
    setLatency(24);
    logId.current = 4;
    setSymbol("SPX");
    closeDetail();
  };

  const spxPct = pct(sim.spx, SPX_SEED);
  const winners = sim.firms.filter((f) => f.price >= f.open).length;

  // Detail derived values
  const detailFirm = detail ? sim.firms.find((f) => f.ticker === detail) : undefined;
  const detailIdx = detailFirm ? sim.firms.findIndex((f) => f.ticker === detailFirm.ticker) : -1;
  const prevFirm = detailIdx >= 0 ? sim.firms[(detailIdx - 1 + sim.firms.length) % sim.firms.length] : undefined;
  const nextFirm = detailIdx >= 0 ? sim.firms[(detailIdx + 1) % sim.firms.length] : undefined;
  const totalOpen = sim.firms.reduce((a, f) => a + f.open, 0);
  const dPct = detailFirm ? pct(detailFirm.price, detailFirm.open) : 0;
  const dUp = dPct >= 0;
  const dColor = dUp ? "#00ff88" : "#ff3b5c";
  const dHigh = detailFirm ? Math.max(...detailFirm.history) : 0;
  const dLow = detailFirm ? Math.min(...detailFirm.history) : 0;
  const d52 = detailFirm ? fiftyTwo(detailFirm.open, detailFirm.ticker) : { low: 0, high: 1 };
  const d52Pos = detailFirm ? Math.max(0, Math.min(100, ((detailFirm.price - d52.low) / (d52.high - d52.low)) * 100)) : 0;
  const dWeight = detailFirm ? (detailFirm.open / totalOpen) * 100 : 0;
  const dLastTicks = detailFirm ? [...detailFirm.ticks].slice(-10).reverse() : [];

  return (
    <div data-safe-area-inset-root style={{ boxSizing: "border-box", paddingTop: "var(--safe-area-inset-top)" }} className="live-root min-h-[100dvh] bg-[var(--bg)] text-[var(--text)] overflow-x-clip">
      <p className="simulation-disclaimer">SIMULATION — seed: 17 Nov 2026 close. Not real prices. This is not financial advice.</p>
      {/* HEADER */}
      <header data-safe-area-sticky-top style={{ top: "var(--safe-area-inset-top)" }} className="sticky z-30 border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto max-w-[1500px] px-3 sm:px-5 py-3">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--border-2)] bg-[var(--surface)] text-[var(--green)]">
                <Bot className="h-6 w-6" aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-2xl font-black tracking-[0.08em] leading-none whitespace-nowrap">SPX LIVE BOT</h1>
                  <span className="live-dot mt-0.5 h-2.5 w-2.5 rounded-full bg-[var(--green)]" aria-label="Live" />
                </div>
                <p className="mt-1 text-[10px] sm:text-[11px] tracking-[0.18em] text-[var(--muted)]">S&amp;P 500 • REAL-TIME SIMULATION TERMINAL</p>
              </div>
            </div>

            <div className="flex items-center gap-2 border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5">
              <span className="text-[10px] font-bold tracking-widest text-[var(--green)]">BOT ACTIVE</span>
              <span className="hidden sm:inline text-[var(--dim)]">|</span>
              <span className="text-[11px] text-[var(--muted)]">{paused ? "PAUSED" : "RUNNING"}</span>
            </div>
            {paused && (
              <span className="border border-[var(--amber)] px-2 py-1 text-[11px] font-black tracking-widest text-[var(--amber)]">PAUSED</span>
            )}

            <div className="ml-auto flex items-center gap-3 sm:gap-6">
              <div className="text-right">
                <div className="text-[10px] tracking-widest text-[var(--muted)]">BAKU TIME</div>
                <div className="text-base sm:text-xl font-black tabular-nums leading-none mt-0.5">{timeNow(now)}</div>
                <div className="text-[10px] text-[var(--dim)] mt-0.5">{now.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}</div>
              </div>
              <div className="hidden md:block text-right">
                <div className="text-[10px] tracking-widest text-[var(--muted)]">LATENCY</div>
                <div className="text-lg font-black text-[var(--cyan)] tabular-nums">{latency} <span className="text-[11px]">ms</span></div>
                <div className="text-[10px] text-[var(--dim)]">TICK #{String(sim.tick).padStart(4, "0")}</div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-[var(--border)] pt-3">
            <div>
              <div className="text-[10px] tracking-[0.2em] text-[var(--muted)]">S&amp;P 500 • SPX</div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-3xl sm:text-4xl font-black tabular-nums leading-none">{fmt(sim.spx)}</span>
                <span className={`flex items-center gap-1 text-sm sm:text-base font-bold ${spxPct >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                  {spxPct >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                  {spxPct >= 0 ? "+" : ""}{fmt(sim.spx - SPX_SEED)} ({spxPct >= 0 ? "+" : ""}{spxPct.toFixed(2)}%)
                </span>
              </div>
            </div>
            <div className="flex gap-4 sm:gap-6 text-right">
              <div><div className="text-[10px] text-[var(--muted)]">GAINERS</div><div className="font-bold text-[var(--green)] tabular-nums">{winners}</div></div>
              <div><div className="text-[10px] text-[var(--muted)]">LOSERS</div><div className="font-bold text-[var(--red)] tabular-nums">{20 - winners}</div></div>
              <div className="hidden sm:block"><div className="text-[10px] text-[var(--muted)]">SPEED</div><div className="font-bold tabular-nums">{speed}x</div></div>
              <div className="hidden sm:block"><div className="text-[10px] text-[var(--muted)]">LATENCY</div><div className="font-bold text-[var(--cyan)] tabular-nums">{latency} ms</div></div>
            </div>
          </div>
        </div>
      </header>

      {/* BIG HERO TICKER TAPE */}
      <section aria-label="Live price ticker — select a company to open its detailed chart" className="border-b-2 border-[var(--green)] bg-[#070c0a]">
        <div className="mx-auto max-w-[1500px] px-3 sm:px-5 pt-3 pb-1 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] sm:text-xs font-black tracking-[0.22em] text-[var(--green)]">● LIVE TICKER • SELECT A COMPANY TO OPEN ITS CHART</p>
          <p className="text-[11px] sm:text-xs text-[var(--muted)]">20 companies • Hover to pause the ticker • {paused ? "PAUSED" : "LIVE"}</p>
        </div>
        <div className="overflow-x-clip py-4 sm:py-6" aria-label="Live price ticker">
          <div className="marquee-track flex w-max items-stretch gap-3 pr-3" style={{ animationDuration: "125s" }}>
            {[...sim.firms, ...sim.firms].map((f, i) => {
              const p = pct(f.price, f.open);
              const up = p >= 0;
              const isActive = detail === f.ticker;
              return (
                <button
                  key={`${f.ticker}-${i}`}
                  onClick={() => openDetail(f.ticker)}
                  aria-label={`${f.name} ${f.ticker}, price $${fmt(f.price)}, change ${p.toFixed(2)} percent — open detailed chart`}
                  tabIndex={i >= sim.firms.length ? -1 : 0}
                  aria-hidden={i >= sim.firms.length}
                  className={`group flex shrink-0 items-center gap-3 sm:gap-4 whitespace-nowrap border px-4 sm:px-6 py-4 sm:py-5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)] ${isActive ? "border-[var(--green)] bg-[#0e1f16]" : "border-[var(--border-2)] bg-[var(--surface)] hover:border-[var(--green)] hover:bg-[#0e1f16]"}`}
                >
                  <span className="min-w-0">
                    <span className="block text-[28px] sm:text-[34px] font-black leading-none tracking-wide">{f.ticker}</span>
                    <span className="mt-1 block max-w-[150px] truncate text-[11px] sm:text-xs font-normal text-[var(--muted)]">{f.name}</span>
                  </span>
                  <span className="text-[28px] sm:text-[34px] font-black leading-none tabular-nums">${fmt(f.price)}</span>
                  <span className={`flex items-center gap-1.5 border px-2.5 py-1.5 text-[18px] sm:text-[22px] font-black leading-none tabular-nums ${up ? "border-[var(--green)]/50 bg-[var(--green)]/10 text-[var(--green)]" : "border-[var(--red)]/50 bg-[var(--red)]/10 text-[var(--red)]"}`}>
                    {up ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}
                    {up ? "+" : ""}{p.toFixed(2)}%
                  </span>
                  <span className="hidden lg:block text-[11px] font-bold tracking-widest text-[var(--dim)] group-hover:text-[var(--green)]">OPEN ↗</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="mx-auto max-w-[1500px] px-3 sm:px-5 pb-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--dim)]">
          <span>◀ The ticker scrolls slowly for readability</span>
          <span>Select any company to open its detailed panel below</span>
        </div>
      </section>

      {/* DETAILED PANEL — BELOW TICKER */}
      {detailFirm && (
        <section ref={detailRef} id="detail-panel" aria-label={`${detailFirm.name} detailed chart`} className="border-b-2 border-[var(--green)] bg-[var(--surface)]">
          <div className="mx-auto max-w-[1500px] px-3 sm:px-5 py-4 sm:py-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-black tracking-[0.22em] text-[var(--green)]">● DETAILED CHART • LIVE • TICK #{sim.tick}</p>
                <h2 className="mt-2 text-3xl sm:text-5xl font-black leading-[0.95] break-words">{detailFirm.name} <span className="text-xl sm:text-3xl text-[var(--muted)]">{detailFirm.ticker}</span></h2>
                <p className="mt-2 text-xs sm:text-sm text-[var(--muted)]">{detailFirm.sector} • {detailFirm.ticker} • Baku time {timeNow(now)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => prevFirm && openDetail(prevFirm.ticker)} className="flex items-center gap-1 border border-[var(--border-2)] px-3 py-2.5 text-sm font-bold text-[var(--muted)] hover:text-white hover:border-[var(--muted)]"><ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">PREVIOUS</span> <span className="sm:hidden">‹</span></button>
                <button onClick={() => nextFirm && openDetail(nextFirm.ticker)} className="flex items-center gap-1 border border-[var(--border-2)] px-3 py-2.5 text-sm font-bold text-[var(--muted)] hover:text-white hover:border-[var(--muted)]"><span className="hidden sm:inline">NEXT</span> <span className="sm:hidden">›</span> <ChevronRight className="h-4 w-4" /></button>
                <button onClick={closeDetail} className="flex items-center gap-2 border border-[var(--red)] bg-[var(--red)] px-4 py-2.5 text-sm font-black text-white"><X className="h-4 w-4" /> CLOSE</button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-y border-[var(--border)] py-4">
              <span className="text-4xl sm:text-6xl font-black tabular-nums leading-none">${fmt(detailFirm.price)}</span>
              <span className={`flex items-center gap-1 text-xl sm:text-2xl font-black tabular-nums ${dUp ? "text-[var(--green)]" : "text-[var(--red)]"}`}>{dUp ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />}{dUp ? "+" : ""}{fmt(detailFirm.price - detailFirm.open)} ({dUp ? "+" : ""}{dPct.toFixed(2)}%)</span>
              <span className="text-xs sm:text-sm text-[var(--muted)]">Daily change • Since open</span>
              <span className="ml-auto hidden md:inline text-[11px] text-[var(--dim)]">{prevFirm ? `‹ ${prevFirm.ticker}` : ""} &nbsp; {detailIdx + 1} / 20 &nbsp; {nextFirm ? `${nextFirm.ticker} ›` : ""}</span>
            </div>

            {/* LARGE DETAIL CHART */}
            <div className="mt-4 border border-[var(--border)] bg-[#060a08] p-2 sm:p-4">
              <div className="flex flex-wrap justify-between gap-2 text-[11px] text-[var(--dim)]"><span>DETAILED CHART — {detailFirm.ticker}</span><span className="pulse-soft text-[var(--green)]">● {paused ? "PAUSED" : `${speed}x`} • {detailFirm.history.length} ticks</span></div>
              <svg viewBox="0 0 900 440" className="mt-2 block h-[420px] w-full sm:h-[460px]" role="img" aria-label={`${detailFirm.ticker} detailed price chart`}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <line key={i} x1="0" x2="900" y1={20 + i * 80} y2={20 + i * 80} stroke="#16241d" strokeWidth="1" strokeDasharray="3 5" />
                ))}
                {detailFirm.history.length > 1 && (
                  <>
                    <path d={areaPath(detailFirm.history, 900, 440)} fill={dColor} opacity="0.14" />
                    <polyline points={pointsFor(detailFirm.history, 900, 440)} fill="none" stroke={dColor} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                    {(() => {
                      const pts = pointsFor(detailFirm.history, 900, 440).split(" ");
                      const last = pts[pts.length - 1].split(",");
                      return <g><circle cx={last[0]} cy={last[1]} r="7" fill={dColor} /><circle cx={last[0]} cy={last[1]} r="14" fill={dColor} opacity="0.25" /></g>;
                    })()}
                  </>
                )}
              </svg>
              <div className="mt-2 flex justify-between text-[10px] text-[var(--dim)] tabular-nums"><span>SESSION OPEN</span><span>HIGH ${fmt(dHigh)} • LOW ${fmt(dLow)}</span><span>NOW</span></div>
            </div>

            {/* STATS */}
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {[
                ["OPEN", `$${fmt(detailFirm.open)}`],
                ["SESSION HIGH", `$${fmt(dHigh)}`],
                ["SESSION LOW", `$${fmt(dLow)}`],
                ["VOLUME (SIMULATED)", fmtVol(detailFirm.volume)],
                ["SECTOR", detailFirm.sector],
                ["INDEX WEIGHT", `${dWeight.toFixed(2)}%`],
                ["TICK", `#${String(sim.tick).padStart(4, "0")}`],
              ].map(([label, value]) => (
                <div key={label} className="border border-[var(--border)] bg-[var(--surface-2)] p-3">
                  <div className="text-[10px] tracking-widest text-[var(--muted)]">{label}</div>
                  <div className="mt-1 text-base sm:text-lg font-black leading-tight break-words">{value}</div>
                </div>
              ))}
            </div>

            {/* 52W RANGE */}
            <div className="mt-4 border border-[var(--border)] bg-[var(--surface-2)] p-3 sm:p-4">
            <div className="flex flex-wrap justify-between gap-2 text-xs"><span className="font-black tracking-widest">52-WEEK RANGE <span className="font-normal text-[var(--muted)]">(simulated)</span></span><span className="tabular-nums text-[var(--muted)]">${fmt(d52.low)} — ${fmt(d52.high)}</span></div>
              <div className="relative mt-4 h-3 w-full border border-[var(--border)] bg-[#0d1310]">
                <div className="absolute inset-y-0 left-0 bg-[var(--cyan)]/40" style={{ width: `${d52Pos}%` }} />
                <div className="absolute top-1/2 h-5 w-1 -translate-y-1/2 -translate-x-1/2 bg-[var(--green)] shadow-[0_0_0_3px_rgba(0,255,136,0.25)]" style={{ left: `${d52Pos}%` }} />
              </div>
              <div className="mt-2 flex justify-between text-[11px] tabular-nums text-[var(--muted)]"><span>52W LOW ${fmt(d52.low)}</span><span className="font-bold text-[var(--text)]">NOW ${fmt(detailFirm.price)} • {d52Pos.toFixed(0)}%</span><span>52W HIGH ${fmt(d52.high)}</span></div>
            </div>

            {/* LAST 10 TICKS */}
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
              <div className="border border-[var(--border)] bg-[var(--surface-2)] lg:col-span-3">
                <div className="border-b border-[var(--border)] px-3 py-2.5 text-xs font-black tracking-widest">LAST 10 TICKS</div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-sm">
                    <thead><tr className="text-[10px] tracking-widest text-[var(--muted)]"><th className="px-3 py-2 font-bold">TIME</th><th className="px-3 py-2 font-bold">PRICE</th><th className="px-3 py-2 text-right font-bold">CHANGE (TICK)</th></tr></thead>
                    <tbody>
                      {dLastTicks.map((t, i) => (
                        <tr key={`${t.time}-${i}`} className="border-t border-[var(--border)]">
                          <td className="px-3 py-2 tabular-nums text-[var(--muted)]">{t.time}</td>
                          <td className="px-3 py-2 font-bold tabular-nums">${fmt(t.price)}</td>
                          <td className={`px-3 py-2 text-right font-bold tabular-nums ${t.change >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>{t.change === 0 ? "—" : `${t.change >= 0 ? "+" : ""}${fmt(t.change)}`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="border border-[var(--border)] bg-[var(--surface-2)] p-4 lg:col-span-2">
                <div className="text-xs font-black tracking-widest text-[var(--amber)]">WHAT TO WATCH</div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">The {detailFirm.ticker} chart updates with simulated ticks. A large move alone is not a signal — consider volume, sector, and the 52-week range together. Use Previous and Next to browse companies, or Close to return to the overview.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link to={`/quiz?asset=Stocks&prefill=${encodeURIComponent(detailFirm.ticker)}`} className="border border-[var(--cyan)] px-3 py-2 text-xs font-bold text-[var(--cyan)] hover:bg-[var(--cyan)] hover:text-black">COMPARE BROKERS FOR THIS ASSET</Link>
                  <button onClick={closeDetail} className="border border-[var(--border-2)] px-3 py-2 text-xs font-bold text-[var(--muted)] hover:text-white">RETURN TO OVERVIEW</button>
                  <button onClick={() => prevFirm && openDetail(prevFirm.ticker)} className="border border-[var(--border-2)] px-3 py-2 text-xs font-bold text-[var(--muted)] hover:text-white">‹ {prevFirm?.ticker}</button>
                  <button onClick={() => nextFirm && openDetail(nextFirm.ticker)} className="border border-[var(--border-2)] px-3 py-2 text-xs font-bold text-[var(--muted)] hover:text-white">{nextFirm?.ticker} ›</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="mx-auto max-w-[1500px] px-3 sm:px-5 py-4 sm:py-5">
        <section aria-label="Saved watchlist" className="mb-4 border border-[var(--border)] bg-[var(--surface)] p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-black tracking-widest">SAVED WATCHLIST</h3><span className="text-[11px] text-[var(--muted)]">{watchlistLoading ? "Loading…" : `${watchlist.length} saved`}</span></div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="text-xs text-[var(--muted)]" htmlFor="watch-select">Select a company</label>
            <select id="watch-select" value={watchTicker} onChange={(e) => setWatchTicker(e.target.value)} className="border border-[var(--border-2)] bg-[var(--surface-2)] px-2 py-2.5 text-sm font-bold text-[var(--text)]">{sim.firms.map((f) => (<option key={f.ticker} value={f.ticker}>{f.ticker} — {f.name}</option>))}</select>
            <button onClick={() => addWatchlist()} disabled={watchlistBusy} className="border border-[var(--green)] bg-[var(--green)] px-4 py-2.5 text-sm font-black text-black disabled:opacity-60">{watchlistBusy ? "SAVING…" : "ADD TO WATCHLIST"}</button>
            {watchlistNotice && <span role="status" className="text-xs text-[var(--green)]">{watchlistNotice}</span>}
            {watchlistError && <span role="alert" className="text-xs text-[var(--red)]">{watchlistError}</span>}
          </div>
          {watchlist.length === 0 && !watchlistLoading ? <p className="mt-3 text-xs text-[var(--muted)]">Your watchlist is empty. Select a company above to add it.</p> : (
            <div className="mt-3 flex flex-wrap gap-2">{watchlist.map((w) => (<span key={w.id} className="flex items-center gap-2 border border-[var(--border-2)] bg-[var(--surface-2)] px-2 py-1.5 text-sm"><button onClick={() => openDetail(w.ticker)} className="font-black hover:text-[var(--green)]">{w.ticker}</button><span className="text-xs text-[var(--muted)]">{w.name}</span><button onClick={() => removeWatchlist(w.id, w.ticker)} disabled={watchlistBusy} aria-label={`Remove ${w.ticker}`} className="px-1 font-black text-[var(--red)]">×</button></span>))}</div>
          )}
        </section>
        <p className="mb-4 flex flex-wrap items-center gap-2 text-[11px] sm:text-xs text-[var(--muted)]">
          <span className="border border-[var(--border-2)] bg-[var(--surface)] px-2 py-1 text-[var(--amber)] font-bold">SEED DATA</span>
          <span>Seed data: November 17, 2026 closing prices, followed by simulated live ticks for this demo.</span>
        </p>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* LEFT */}
          <section className="lg:col-span-8 min-w-0 space-y-4">
            {/* CHART */}
            <div className="border border-[var(--border)] bg-[var(--surface)]">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] p-3 sm:p-4">
                <div>
                  <div className="flex items-center gap-2 text-[11px] tracking-widest text-[var(--muted)]"><Activity className="h-4 w-4 text-[var(--green)]" /> LIVE CHART <span className="text-[var(--dim)]">• {sim.tick} ticks</span></div>
                  <div className="mt-2 flex flex-wrap items-baseline gap-x-3">
                    <h2 className="text-2xl sm:text-3xl font-black tabular-nums">{symbol} <span className="text-base sm:text-xl font-bold text-[var(--muted)]">{symbol === "SPX" ? "S&P 500" : selectedFirm?.name}</span></h2>
                    <span className="text-xl sm:text-2xl font-black tabular-nums">${fmt(chartPrice)}</span>
                    <span className={`font-bold tabular-nums ${chartUp ? "text-[var(--green)]" : "text-[var(--red)]"}`}>{chartUp ? "+" : ""}{fmt(chartChange)} ({chartUp ? "+" : ""}{chartPct.toFixed(2)}%)</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:gap-5 text-right">
                  <div><div className="text-[10px] text-[var(--muted)]">MAX</div><div className="font-bold text-[var(--green)] tabular-nums text-sm">{fmt(chartHigh)}</div></div>
                  <div><div className="text-[10px] text-[var(--muted)]">MIN</div><div className="font-bold text-[var(--red)] tabular-nums text-sm">{fmt(chartLow)}</div></div>
                  <div><div className="text-[10px] text-[var(--muted)]">OPEN</div><div className="font-bold tabular-nums text-sm">{fmt(chartOpen)}</div></div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 p-3 sm:p-4 pb-0" role="group" aria-label="Chart symbol selection">
                {CHART_SYMBOLS.map((s) => (
                  <button key={s} onClick={() => setSymbol(s)} aria-pressed={symbol === s} className={`border px-3 py-1.5 text-xs font-bold tracking-wider transition-colors ${symbol === s ? "border-[var(--green)] bg-[var(--green)] text-black" : "border-[var(--border-2)] bg-[var(--surface-2)] text-[var(--muted)] hover:text-white hover:border-[var(--muted)]"}`}>{s}</button>
                ))}
              </div>

              <div className="p-3 sm:p-4 pt-2">
                <div className="border border-[var(--border)] bg-[#060a08] p-2 sm:p-3">
                  <svg viewBox="0 0 800 260" className="block h-[220px] w-full sm:h-[260px]" role="img" aria-label={`${symbol} price chart`}>
                    {[0, 1, 2, 3].map((i) => (
                      <line key={i} x1="0" x2="800" y1={20 + i * 70} y2={20 + i * 70} stroke="#16241d" strokeWidth="1" strokeDasharray="3 5" />
                    ))}
                    <path d={areaPath(chartHistory, 800, 260)} fill={chartColor} opacity="0.12" />
                    <polyline points={pointsFor(chartHistory, 800, 260)} fill="none" stroke={chartColor} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                    {chartHistory.length > 1 && (() => {
                      const pts = pointsFor(chartHistory, 800, 260).split(" ");
                      const last = pts[pts.length - 1].split(",");
                      return <g><circle cx={last[0]} cy={last[1]} r="5" fill={chartColor} /><circle cx={last[0]} cy={last[1]} r="10" fill={chartColor} opacity="0.25" /></g>;
                    })()}
                  </svg>
                  <div className="mt-2 flex justify-between text-[10px] text-[var(--dim)] tabular-nums"><span>SESSION OPEN</span><span className="pulse-soft text-[var(--green)]">● {paused ? "PAUSED" : `${speed}x SPEED`}</span><span>NOW</span></div>
                </div>
              </div>

              {/* CONTROLS */}
              <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] p-3 sm:p-4">
                <button onClick={() => setPaused(!paused)} className={`flex items-center gap-2 border px-4 py-2.5 text-sm font-black tracking-wide ${paused ? "border-[var(--green)] bg-[var(--green)] text-black" : "border-[var(--red)] bg-[var(--red)] text-white"}`}>
                  {paused ? <><Play className="h-4 w-4" /> RESUME</> : <><Pause className="h-4 w-4" /> PAUSE</>}
                </button>
                <div className="flex items-center gap-1" role="group" aria-label="Playback speed">
                  <span className="mr-1 flex items-center gap-1 text-[11px] text-[var(--muted)]"><Gauge className="h-4 w-4" /> SPEED</span>
                  {([1, 2, 4] as const).map((v) => (
                    <button key={v} onClick={() => setSpeed(v)} aria-pressed={speed === v} className={`border px-3 py-2.5 text-sm font-bold tabular-nums ${speed === v ? "border-[var(--cyan)] bg-[var(--cyan)] text-black" : "border-[var(--border-2)] text-[var(--muted)] hover:text-white"}`}>{v}x</button>
                  ))}
                </div>
                <button onClick={reset} className="flex items-center gap-2 border border-[var(--border-2)] px-4 py-2.5 text-sm font-bold text-[var(--muted)] hover:text-white hover:border-[var(--muted)]"><RotateCcw className="h-4 w-4" /> RESET</button>
                <span className="ml-auto hidden md:inline text-[11px] text-[var(--dim)]">Chart: {symbol} • {chartHistory.length} ticks</span>
              </div>
            </div>

            {/* TOP MOVERS */}
            <div className="border border-[var(--border)] bg-[var(--surface)] p-3 sm:p-4">
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-[var(--muted)]"><Zap className="h-4 w-4 text-[var(--amber)]" /> TOP MOVERS</div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {movers.map((f, i) => {
                  const p = pct(f.price, f.open);
                  return (
                    <button key={f.ticker} onClick={() => openDetail(f.ticker)} className="border border-[var(--border-2)] bg-[var(--surface-2)] p-3 text-left hover:border-[var(--green)]">
                      <div className="flex justify-between"><span className="text-[11px] text-[var(--dim)]">#{i + 1} MOVER</span><span className={p >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}>{p >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}</span></div>
                      <div className="mt-1 font-black">{f.ticker} <span className="text-xs font-normal text-[var(--muted)]">{f.name}</span></div>
                      <div className="mt-1 flex justify-between tabular-nums"><span>${fmt(f.price)}</span><span className={p >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}>{p >= 0 ? "+" : ""}{p.toFixed(2)}%</span></div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FIRMS */}
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-black tracking-widest">COMPANIES <span className="text-[var(--muted)]">• 20</span></h3>
                <div className="flex gap-1" role="group" aria-label="Sort companies">
                  {(["change", "price", "name"] as const).map((v) => (
                    <button key={v} onClick={() => setSort(v)} aria-pressed={sort === v} className={`border px-2.5 py-1.5 text-[11px] font-bold ${sort === v ? "border-[var(--green)] text-[var(--green)]" : "border-[var(--border-2)] text-[var(--muted)]"}`}>{v === "change" ? "Change" : v === "price" ? "Price" : "Name"}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {sorted.map((f) => {
                  const p = pct(f.price, f.open);
                  const up = p >= 0;
                  return (
                    <article key={f.ticker} onClick={() => openDetail(f.ticker)} className={`cursor-pointer border border-[var(--border)] bg-[var(--surface)] p-3 hover:border-[var(--green)] ${f.dir === 1 ? "flash-up" : f.dir === -1 ? "flash-down" : ""}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2"><span className="font-black tracking-wide">{f.ticker}</span><span className={`h-1.5 w-1.5 rounded-full ${up ? "bg-[var(--green)]" : "bg-[var(--red)]"}`} /></div>
                          <div className="truncate text-xs text-[var(--muted)]">{f.name}</div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); openDetail(f.ticker); }} className="shrink-0 border border-[var(--border-2)] px-2 py-1 text-[10px] font-bold text-[var(--cyan)] hover:border-[var(--cyan)]">CHART ↗</button>
                      </div>
                      <div className="mt-3 flex items-end justify-between gap-2">
                        <span className="text-xl font-black tabular-nums leading-none">${fmt(f.price)}</span>
                        <span className={`text-right text-sm font-bold tabular-nums ${up ? "text-[var(--green)]" : "text-[var(--red)]"}`}>{up ? "+" : ""}{fmt(f.price - f.open)}<br /><span className="text-xs">{up ? "+" : ""}{p.toFixed(2)}%</span></span>
                      </div>
                      <div className="mt-3 flex items-end justify-between gap-2">
                        <svg viewBox="0 0 100 28" className="h-7 w-[68%] shrink-0" aria-hidden><polyline points={pointsFor(f.history, 100, 28)} fill="none" stroke={up ? "#00ff88" : "#ff3b5c"} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" /></svg>
                        <span className="text-[10px] text-[var(--dim)] leading-tight text-right">SECTOR<br /><span className="text-[var(--muted)]">{f.sector.split(" ")[0]}</span></span>
                      </div>
                      <Link
                        className="mt-3 inline-flex w-full items-center justify-center border border-[var(--cyan)] px-2 py-2 text-[10px] font-bold text-[var(--cyan)] hover:bg-[var(--cyan)] hover:text-black"
                        onClick={(event) => event.stopPropagation()}
                        to={`/quiz?asset=Stocks&prefill=${encodeURIComponent(f.ticker)}`}
                      >
                        FIND BROKER FOR THIS STOCK
                      </Link>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          {/* RIGHT */}
          <aside className="lg:col-span-4 min-w-0 space-y-4">
            {/* BOT LOG */}
            <div className="border border-[var(--border)] bg-[var(--surface)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] p-3 sm:p-4">
                <div className="flex items-center gap-2"><Radio className="h-4 w-4 text-[var(--green)]" /><h3 className="text-sm font-black tracking-widest">BOT ACTIVITY LOG</h3></div>
                <span className="text-[10px] text-[var(--dim)]">LATEST 30 ENTRIES</span>
              </div>
              <div ref={logRef} className="terminal-scroll h-[340px] overflow-y-auto p-3 space-y-2">
                {logs.map((l) => (
                  <div key={l.id} className="border-l-2 border-[var(--border-2)] pl-2.5 py-1">
                    <div className="flex items-center gap-2 text-[10px]"><span className="tabular-nums text-[var(--dim)]">{l.time}</span><span className={`font-black tracking-wider ${l.kind === "SIGNAL" ? "text-[var(--amber)]" : l.kind === "WARNING" ? "text-[var(--red)]" : "text-[var(--green)]"}`}>{l.kind}</span></div>
                    <p className="mt-0.5 text-xs leading-relaxed text-[var(--muted)]">{l.text}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-[var(--border)] p-3 flex items-center justify-between text-[11px] text-[var(--dim)]"><span>Auto-scroll enabled</span><span className="pulse-soft text-[var(--green)]">● {paused ? "PAUSED" : "LISTENING"}</span></div>
            </div>

            {/* SECTORS */}
            <div className="border border-[var(--border)] bg-[var(--surface)] p-3 sm:p-4">
              <div className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-sm font-black tracking-widest"><BarChart3 className="h-4 w-4 text-[var(--cyan)]" /> SECTOR PERFORMANCE</h3><span className="text-[10px] text-[var(--dim)]">WEIGHT %</span></div>
              <div className="mt-4 space-y-3">
                {sectors.map((s) => (
                  <div key={s.name}>
                    <div className="mb-1 flex justify-between gap-2 text-xs"><span className="truncate text-[var(--muted)]">{s.name}</span><span className="shrink-0 font-bold tabular-nums">{s.live.toFixed(2)}%</span></div>
                    <div className="h-2.5 w-full bg-[#0d1310] border border-[var(--border)]"><div className="h-full bg-[var(--green)] transition-all duration-700" style={{ width: `${Math.min(100, s.live * 2.6)}%`, backgroundColor: s.live > 10 ? "#00ff88" : s.live > 5 ? "#35e0d6" : "#5f7a6e" }} /></div>
                  </div>
                ))}
              </div>
              <p className="mt-4 border-t border-[var(--border)] pt-3 text-[11px] leading-relaxed text-[var(--dim)]">Bars update live, with weights fluctuating slightly based on simulated market activity. Technology remains the leading sector.</p>
            </div>

            <div className="border border-[var(--amber)]/40 bg-[#14100a] p-4">
              <div className="text-xs font-black tracking-widest text-[var(--amber)]">BOT RULE</div>
              <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">The bot logs only signals that pass momentum, volume, and sector filters. A rapid move alone is not a buy signal — wait for confirmation.</p>
            </div>
          </aside>
        </div>
      </div>

      <div className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-[1500px] px-3 sm:px-5 py-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-[var(--muted)]">This is a simulation demo, not real market pricing. Seed data uses closing prices from November 17, 2026.</p>
          <p className="text-[11px] tracking-widest text-[var(--dim)]">SPX LIVE BOT • DEMO • {speed}x • TICK #{sim.tick}</p>
        </div>
      </div>
    </div>
  );
}
