/**
 * ReportPreviewPage.tsx
 *
 * Report viewer — mirrors the real portal UI.
 * Filters driven by report config flags; selecting values actually
 * narrows the mock rows so the interaction feels real.
 *
 * Filter rows:
 *  1. Main bar  — dist type / div / geo (hierarchy dropdown) / sales hierarchy / distributor
 *  2. Custom    — product status / batch status / dist status / product hierarchy (cfg.shouldShowCustomFilters)
 *  3. Additional— 3 hardcoded: order type / payment mode / delivery status (cfg.showAdditionalFilters)
 *
 * Voice: registers reportPreviewDispatch for RP_* actions.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Settings2, Download, RotateCcw,
  ChevronDown, ChevronLeft, ChevronRight, Eye, X, Filter, FileBarChart2, Check, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { loadReportConfig, saveReportConfigLocal } from "../config/reportConfigService";
import { BEHAVIOR_FLAG_ALIASES } from "../config/reportConfigRegistry";
import { useActivityStore } from "../../hooks/useActivityStore";
import type { ReportCard } from "../config/types";
import { makeNewCard } from "../config/types";
import { useVoiceAgentContext } from "../../voice/VoiceAgentContext";

// ─── Mock pools ───────────────────────────────────────────────────────────────

const REGIONS     = ["West","East","North","South"] as const;
const HIERARCHIES = ["NSM","ZSM","RSM","ASM","TSE"] as const;
const DIST_TYPES  = ["GT","MT","DC"] as const;
const DIST_DIVS   = ["PC","FD","HC"] as const;
const DIST_CODES  = ["GT010002011992","GT010002011993","GT010002011994","GT010002011995","GT010002011996"];

// Seed arrays for metadata columns
const PRODUCT_STATUS_SEED  = ["Active","Inactive","Discontinued"];
const BATCH_STATUS_SEED    = ["Valid","Expired","Near Expiry"];
const DIST_STATUS_SEED     = ["Active","Inactive","Suspended"];
const PROD_HIERARCHY_SEED  = ["Category A","Category B","Category C"];
const ORDER_TYPE_SEED      = ["Manual Order","Auto Order","Emergency Order"];
const PAYMENT_MODE_SEED    = ["Credit","Cash","Cheque"];
const DELIVERY_STATUS_SEED = ["Pending","Delivered","Partial"];

// Geography hierarchy levels + data
const GEO_LEVELS = ["Country","Region","State","District","City"] as const;
type GeoLevel = typeof GEO_LEVELS[number];
const GEO_LEVEL_DATA: Record<GeoLevel, string[]> = {
  Country:  ["India"],
  Region:   ["East","North","South","West"],
  State:    ["Delhi NCT","Karnataka","Maharashtra","Tamil Nadu","Telangana"],
  District: ["Bengaluru Urban","Chennai","Hyderabad","Mumbai","Pune"],
  City:     ["Bengaluru","Chennai City","Hyderabad City","Mumbai City","Pune City"],
};

// Sales hierarchy levels + data
const SALES_LEVELS = ["NSM","ZSM","RSM","ASM","TSE"] as const;
type SalesLevel = typeof SALES_LEVELS[number];
const SALES_LEVEL_DATA: Record<SalesLevel, string[]> = {
  NSM: ["NSM"],
  ZSM: ["ZSM"],
  RSM: ["RSM"],
  ASM: ["ASM"],
  TSE: ["TSE"],
};

const POOL_NAMES  = ["Rajesh Kumar","Priya Sharma","Amit Singh","Neha Patel","Vikram Joshi","Sunita Rao","Manoj Verma","Anita Gupta","Sanjay Mehta","Deepika Nair","Rohit Das","Kavitha Reddy","Arun Iyer","Meena Joseph","Kiran Bhat","Suresh Nair","Deepa Pillai","Ravi Shankar","Ananya Das","Pooja Gupta"];
const POOL_PHONES = ["+91 98765 43210","+91 87654 32109","+91 76543 21098","+91 65432 10987","+91 54321 09876"];
const POOL_DATES  = ["24-03-2026","23-03-2026","22-03-2026","21-03-2026","20-03-2026","19-03-2026","18-03-2026","17-03-2026"];
const POOL_COORDS = ["19.0760, 72.8777","28.6139, 77.2090","12.9716, 77.5946","13.0827, 80.2707","17.3850, 78.4867"];
const POOL_NUMS   = [1,5,10,15,20,25,50,100,145,30,70,120,17,16,110,8,3,45,88,200];
const POOL_DROP   = ["PC","FD","General Trade","Modern Trade","Direct Chain"];
const POOL_OPT    = ["Option A","Option B","Option C"];

function mockValue(fieldType: string, idx: number): string {
  const i = idx % 20;
  switch (fieldType) {
    case "text":        return POOL_NAMES[i];
    case "number":      return String(POOL_NUMS[i]);
    case "date":        return POOL_DATES[i % POOL_DATES.length];
    case "date-range":  return `${POOL_DATES[(i+1)%8]} to ${POOL_DATES[i%8]}`;
    case "tel":         return POOL_PHONES[i % POOL_PHONES.length];
    case "camera":      return "📷 Photo";
    case "location":    return POOL_COORDS[i % POOL_COORDS.length];
    case "checkbox":    return i % 3 === 0 ? "No" : "Yes";
    case "dropdown":    return POOL_DROP[i % POOL_DROP.length];
    case "radio":       return POOL_OPT[i % POOL_OPT.length];
    case "multiselect": return POOL_OPT.slice(0,(i%2)+1).join(", ");
    case "textarea":    return "Sample remarks";
    case "slider":      return String(Math.round((i/19)*10));
    case "signature":   return "✍ Signed";
    default:            return "—";
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toIso(d: Date)      { return d.toISOString().slice(0,10); }
function daysAgo(n: number)  { const d=new Date(); d.setDate(d.getDate()-n); return toIso(d); }
function fmtDisplay(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ColDef { label: string; type: string; }

interface RowMeta {
  _region: string; _hierarchy: string; _distType: string; _distDiv: string; _distCode: string;
  _productStatus: string; _batchStatus: string; _distStatus: string; _prodHierarchy: string;
  _orderType: string; _paymentMode: string; _deliveryStatus: string;
  [col: string]: string;
}

// ─── Non-previewable ──────────────────────────────────────────────────────────

function NonPreviewable({ kind }: { kind: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 h-full py-20 text-muted-foreground">
      <FileBarChart2 className="h-16 w-16 opacity-20" />
      <div className="text-center space-y-1">
        <p className="text-base font-semibold text-foreground">Preview not available</p>
        <p className="text-sm max-w-xs">
          {kind==="live"   && "Live reports update in real-time. Use Download to export data."}
          {kind==="pdf"    && "PDF reports are generated on download. Click Download to get your report."}
          {kind==="gstr"   && "GSTR reports require a download. Select the period and click Download."}
          {kind==="custom" && "This report uses a custom download format. Click Download to export."}
        </p>
      </div>
      <Button variant="outline" size="sm" className="gap-2 mt-1">
        <Download className="h-4 w-4" /> Download Report
      </Button>
    </div>
  );
}

// ─── Activity dot ─────────────────────────────────────────────────────────────

function ActivityDot({ active }: { active: boolean }) {
  return (
    <span className={cn(
      "inline-block h-3 w-3 rounded-full border-2 transition-colors shrink-0",
      active ? "bg-emerald-500 border-emerald-500" : "bg-white border-gray-400",
    )} />
  );
}

// ─── Multi-select distributor ─────────────────────────────────────────────────

function DistributorSelect({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const toggle = (code: string) => onChange(value.includes(code) ? value.filter(v=>v!==code) : [...value,code]);
  const selectAll = () => onChange([...DIST_CODES]);
  const label = value.length === 0 ? "Select Distributor"
              : value.length === 1 ? value[0].slice(0,12)+"…"
              : `${value.length} selected`;

  return (
    <div ref={ref} className="relative">
      <button onClick={()=>setOpen(v=>!v)} className={cn(
        "flex items-center justify-between gap-2 h-8 px-3 text-xs border rounded-md bg-background min-w-[160px]",
        "hover:border-primary/50 transition-colors",open&&"border-primary ring-1 ring-primary/20"
      )}>
        <span className={cn(value.length?"text-foreground font-medium":"text-muted-foreground")}>{label}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0"/>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-56 rounded-lg border bg-popover shadow-lg py-1 max-h-52 overflow-y-auto">
          <div className="px-3 py-1.5 border-b flex items-center justify-between">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Select Distributor</p>
            <button onClick={selectAll} className="text-[10px] text-emerald-600 hover:underline font-medium">Select all</button>
          </div>
          {DIST_CODES.map(code=>(
            <button key={code} onClick={()=>toggle(code)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors">
              <span className={cn("h-4 w-4 rounded border flex items-center justify-center shrink-0",
                value.includes(code)?"bg-emerald-500 border-emerald-500 text-white":"border-gray-300")}>
                {value.includes(code) && <Check className="h-2.5 w-2.5"/>}
              </span>
              {code}
            </button>
          ))}
          {value.length > 0 && (
            <div className="border-t px-3 py-2 flex justify-end">
              <button onClick={()=>onChange([])} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Hierarchy two-panel dropdown (Geography / Sales) ─────────────────────────

interface HierarchySelectProps<L extends string> {
  levels: readonly L[];
  levelData: Record<L, string[]>;
  value: string[];        // applied (shown as dot state)
  staged: string[];       // staged (checkboxes reflect this)
  onStagedChange: (v: string[]) => void;
  onApply: () => void;
  onReset: () => void;
  placeholder: string;
}

function HierarchySelect<L extends string>({
  levels, levelData, value, staged, onStagedChange, onApply, onReset, placeholder,
}: HierarchySelectProps<L>) {
  const [open, setOpen]   = useState(false);
  const [activeLevel, setActiveLevel] = useState<L>(levels[0]);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const options = useMemo(() => {
    const all = levelData[activeLevel] ?? [];
    return search ? all.filter(o => o.toLowerCase().includes(search.toLowerCase())) : all;
  }, [activeLevel, levelData, search]);

  const allSelected = options.length > 0 && options.every(o => staged.includes(o));
  const toggleSelectAll = () => {
    if (allSelected) onStagedChange(staged.filter(v => !options.includes(v)));
    else onStagedChange([...new Set([...staged, ...options])]);
  };
  const toggle = (opt: string) => onStagedChange(staged.includes(opt) ? staged.filter(v=>v!==opt) : [...staged,opt]);

  const label = value.length === 0 ? placeholder
              : value.length === 1 ? value[0]
              : `${value.length} selected`;

  return (
    <div ref={ref} className="relative flex items-center gap-1.5">
      <ActivityDot active={value.length > 0}/>
      <button onClick={()=>setOpen(v=>!v)} className={cn(
        "flex items-center justify-between gap-1.5 h-8 px-2.5 text-xs border rounded-md bg-background min-w-[130px]",
        "hover:border-primary/50 transition-colors",open&&"border-primary ring-1 ring-primary/20"
      )}>
        <span className={cn(value.length?"text-foreground font-medium":"text-muted-foreground")}>{label}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0"/>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-80 rounded-lg border bg-popover shadow-xl flex flex-col"
          style={{minHeight:"260px"}}>

          {/* Search */}
          <div className="px-3 pt-3 pb-2 border-b">
            <div className="flex items-center gap-2 h-8 px-2 border rounded-md bg-muted/30">
              <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0"/>
              <input
                autoFocus
                value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search…"
                className="flex-1 text-xs bg-transparent outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Two panels */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left: level nav */}
            <div className="w-24 border-r shrink-0 overflow-y-auto">
              {levels.map(level => (
                <button key={level} onClick={()=>{setActiveLevel(level);setSearch("");}}
                  className={cn(
                    "w-full text-left px-3 py-2 text-xs transition-colors",
                    level === activeLevel
                      ? "font-bold text-foreground bg-muted/40"
                      : "text-muted-foreground hover:bg-muted/20"
                  )}>
                  {level}
                </button>
              ))}
            </div>

            {/* Right: checkboxes */}
            <div className="flex-1 overflow-y-auto py-1">
              <button onClick={toggleSelectAll}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors font-medium">
                <span className={cn("h-4 w-4 rounded border flex items-center justify-center shrink-0",
                  allSelected?"bg-emerald-500 border-emerald-500 text-white":"border-gray-300")}>
                  {allSelected && <Check className="h-2.5 w-2.5"/>}
                </span>
                Select all
              </button>
              {options.map(opt => (
                <button key={opt} onClick={()=>toggle(opt)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors">
                  <span className={cn("h-4 w-4 rounded border flex items-center justify-center shrink-0",
                    staged.includes(opt)?"bg-emerald-500 border-emerald-500 text-white":"border-gray-300")}>
                    {staged.includes(opt) && <Check className="h-2.5 w-2.5"/>}
                  </span>
                  {opt}
                </button>
              ))}
              {options.length === 0 && (
                <p className="px-3 py-4 text-xs text-muted-foreground text-center">No results</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-3 py-2 border-t bg-muted/5">
            <button onClick={()=>{onReset();setOpen(false);}}
              className="h-7 px-3 text-xs border rounded-md hover:bg-muted transition-colors">
              Reset
            </button>
            <button onClick={()=>{onApply();setOpen(false);}}
              className="h-7 px-3 text-xs rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Generic single-select with activity dot + Select All ─────────────────────

function FilterSelect({ placeholder, options, value, onChange, showDot = true }:
  { placeholder: string; options: string[]; value: string; onChange: (v:string)=>void; showDot?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative flex items-center gap-1.5">
      {showDot && <ActivityDot active={!!value}/>}
      <button onClick={()=>setOpen(v=>!v)} className={cn(
        "flex items-center justify-between gap-1.5 h-8 px-2.5 text-xs border rounded-md bg-background min-w-[130px]",
        "hover:border-primary/50 transition-colors",open&&"border-primary ring-1 ring-primary/20"
      )}>
        <span className={cn(value?"text-foreground font-medium":"text-muted-foreground")}>{value||placeholder}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0"/>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-44 rounded-lg border bg-popover shadow-lg py-1">
          <button onClick={()=>{onChange(options[0] ?? "");setOpen(false);}}
            className="w-full text-left px-3 py-2 text-xs font-medium text-emerald-600 hover:bg-muted border-b">
            Select all
          </button>
          {value && (
            <button onClick={()=>{onChange("");setOpen(false);}}
              className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:bg-muted">— Clear —</button>
          )}
          {options.map(opt=>(
            <button key={opt} onClick={()=>{onChange(opt);setOpen(false);}}
              className={cn("w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors flex items-center justify-between",
                value===opt&&"font-semibold text-primary")}>
              {opt}{value===opt&&<Check className="h-3 w-3"/>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


// ─── Date Range Picker ────────────────────────────────────────────────────────

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function CalendarMonth({
  year, month, rangeStart, rangeEnd, pendingStart,
  onDayClick, onDayHover, onPrev, onNext, showPrev, showNext,
}: {
  year: number; month: number;
  rangeStart: string; rangeEnd: string; pendingStart: string | null;
  onDayClick: (iso: string) => void;
  onDayHover: (iso: string | null) => void;
  onPrev: () => void; onNext: () => void;
  showPrev: boolean; showNext: boolean;
}) {
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const firstWeekDay = new Date(year, month, 1).getDay();
  const todayIso     = toIso(new Date());

  return (
    <div className="flex-1 min-w-[190px]">
      <div className="flex items-center justify-between mb-2 px-1">
        <button onClick={onPrev}
          className={cn("h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground", !showPrev && "invisible")}>
          <ChevronLeft className="h-4 w-4"/>
        </button>
        <span className="text-sm font-semibold">{MONTH_NAMES[month]} {year}</span>
        <button onClick={onNext}
          className={cn("h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground", !showNext && "invisible")}>
          <ChevronRight className="h-4 w-4"/>
        </button>
      </div>
      <div className="grid grid-cols-7">
        {["S","M","T","W","T","F","S"].map((d,i) => (
          <div key={i} className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({length: firstWeekDay}, (_,i) => <div key={`p${i}`}/>)}
        {Array.from({length: daysInMonth}, (_,i) => {
          const d   = i + 1;
          const iso = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
          const isStart  = iso === rangeStart;
          const isEnd    = iso === rangeEnd && rangeEnd !== rangeStart;
          const inRange  = !!(rangeEnd && iso > rangeStart && iso < rangeEnd);
          const isToday  = iso === todayIso;
          const isFuture = iso > todayIso;
          const isPending = pendingStart === iso;
          return (
            <div key={d} className={cn("h-8 flex items-center justify-center",
              inRange && "bg-primary/10",
              isStart && rangeEnd !== rangeStart && "rounded-l-full bg-primary/10",
              isEnd && "rounded-r-full bg-primary/10",
            )}>
              <button
                disabled={isFuture}
                onClick={() => !isFuture && onDayClick(iso)}
                onMouseEnter={() => onDayHover(iso)}
                onMouseLeave={() => onDayHover(null)}
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center text-sm transition-colors",
                  (isStart || isEnd || isPending) && "bg-primary text-primary-foreground font-semibold",
                  !(isStart||isEnd||isPending) && isToday && "border-2 border-primary text-primary",
                  !(isStart||isEnd||isPending) && !inRange && !isFuture && "hover:bg-muted/60",
                  isFuture && "text-muted-foreground/30 cursor-default",
                )}>
                {d}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DateRangePicker({ dateFrom, dateTo, datePreset, onPresetChange, onRangeChange, cfg }: {
  dateFrom: string; dateTo: string;
  datePreset: "7d"|"3m"|"custom";
  onPresetChange: (p: "7d"|"3m"|"custom") => void;
  onRangeChange: (from: string, to: string) => void;
  cfg: { showLast7DaysFilter?: boolean; showLast3MonthsFilter?: boolean; shouldShowCustomDateFilter?: boolean };
}) {
  const [open, setOpen]         = useState(false);
  const [calYear, setCalYear]   = useState(() => new Date(dateFrom).getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date(dateFrom).getMonth());
  const [selStart, setSelStart] = useState<string|null>(null);
  const [hover, setHover]       = useState<string|null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => { if (datePreset !== "custom") setSelStart(null); }, [datePreset]);

  const rightMonth = calMonth === 11 ? 0  : calMonth + 1;
  const rightYear  = calMonth === 11 ? calYear + 1 : calYear;
  const prevMonth  = () => { if (calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1); };
  const nextMonth  = () => { if (calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1); };

  const displayStart = selStart
    ? (hover && hover < selStart ? hover : selStart)
    : dateFrom;
  const displayEnd = selStart
    ? (hover && hover < selStart ? selStart : (hover ?? selStart))
    : dateTo;

  const handleDayClick = (iso: string) => {
    if (datePreset !== "custom") return;
    if (!selStart) {
      setSelStart(iso);
    } else {
      const [from, to] = iso < selStart ? [iso, selStart] : [selStart, iso];
      setSelStart(null); setHover(null);
      onRangeChange(from, to);
      setOpen(false);
    }
  };

  const handlePreset = (p: "7d"|"3m"|"custom") => {
    onPresetChange(p);
    if (p !== "custom") setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v=>!v)} className={cn(
        "flex items-center gap-2 h-9 px-4 border rounded-lg text-sm transition-colors hover:border-primary/50",
        open && "border-primary ring-1 ring-primary/20 bg-background"
      )}>
        <span className="text-muted-foreground text-xs font-medium">Date Range</span>
        <span className="text-destructive text-xs">*</span>
        <span className="font-semibold tabular-nums">{fmtDisplay(dateFrom)} – {fmtDisplay(dateTo)}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 flex border bg-popover rounded-xl shadow-xl overflow-hidden" style={{minWidth:"560px"}}>
          {/* Left: presets */}
          <div className="w-44 border-r flex flex-col py-2 shrink-0">
            {cfg.showLast7DaysFilter && (
              <button onClick={() => handlePreset("7d")}
                className={cn("text-left px-5 py-3 text-sm transition-colors hover:bg-muted/50 border-l-2",
                  datePreset==="7d" ? "font-bold text-foreground border-primary bg-muted/20" : "border-transparent text-muted-foreground")}>
                Last 7 days
              </button>
            )}
            {cfg.showLast3MonthsFilter && (
              <button onClick={() => handlePreset("3m")}
                className={cn("text-left px-5 py-3 text-sm transition-colors hover:bg-muted/50 border-l-2",
                  datePreset==="3m" ? "font-bold text-foreground border-primary bg-muted/20" : "border-transparent text-muted-foreground")}>
                Last 3 months
              </button>
            )}
            {cfg.shouldShowCustomDateFilter && (
              <button onClick={() => handlePreset("custom")}
                className={cn("text-left px-5 py-3 text-sm transition-colors hover:bg-muted/50 border-l-2",
                  datePreset==="custom" ? "font-bold text-foreground border-primary bg-muted/20" : "border-transparent text-muted-foreground")}>
                Custom Date Filter
              </button>
            )}
          </div>

          {/* Right: dual calendar */}
          <div className="flex-1 p-5">
            <div className="flex gap-4">
              <CalendarMonth
                year={calYear} month={calMonth}
                rangeStart={displayStart} rangeEnd={displayEnd}
                pendingStart={selStart}
                onDayClick={handleDayClick} onDayHover={setHover}
                onPrev={prevMonth} onNext={nextMonth}
                showPrev showNext={false}
              />
              <div className="w-px bg-border shrink-0"/>
              <CalendarMonth
                year={rightYear} month={rightMonth}
                rangeStart={displayStart} rangeEnd={displayEnd}
                pendingStart={selStart}
                onDayClick={handleDayClick} onDayHover={setHover}
                onPrev={prevMonth} onNext={nextMonth}
                showPrev={false} showNext
              />
            </div>
            {datePreset !== "custom" && (
              <p className="text-xs text-muted-foreground text-center mt-3 pt-3 border-t">
                {fmtDisplay(dateFrom)} – {fmtDisplay(dateTo)}
              </p>
            )}
            {datePreset === "custom" && selStart && (
              <p className="text-xs text-primary text-center mt-3 pt-3 border-t">
                Click a second date to complete the range
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const BLANK = { distType:"", distDiv:"", productStatus:"", batchStatus:"", distStatus:"", prodHierarchy:"", orderType:"", paymentMode:"", deliveryStatus:"" };
type Filters = typeof BLANK;

export default function ReportPreviewPage() {
  const navigate   = useNavigate();
  const { activities, loadFromLocalStorage } = useActivityStore();
  const { registerUICallbacks, actions: { setStage } } = useVoiceAgentContext();

  const [reports, setReports]       = useState<ReportCard[]>([]);
  const [selectedId, setSelectedId] = useState<string|null>(null);
  const [loading, setLoading]       = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [datePreset, setDatePreset]   = useState<"7d"|"3m"|"custom">("7d");
  const [dateFrom, setDateFrom]     = useState(daysAgo(7));
  const [dateTo, setDateTo]         = useState(toIso(new Date()));

  // Staged filters (single-select)
  const [f, setF] = useState<Filters>({ ...BLANK });
  const sf = (k: keyof Filters) => (v: string) => setF(p=>({...p,[k]:v}));
  // Applied filters
  const [a, setA] = useState<Filters>({ ...BLANK });

  // Distributor multi-select
  const [fDistCodes, setFDistCodes] = useState<string[]>([]);
  const [aDistCodes, setADistCodes] = useState<string[]>([]);

  // Geography hierarchy multi-select (staged + applied)
  const [fGeo, setFGeo]             = useState<string[]>([]);
  const [aGeo, setAGeo]             = useState<string[]>([]);

  // Sales hierarchy multi-select (staged + applied)
  const [fHierarchy, setFHierarchy] = useState<string[]>([]);
  const [aHierarchy, setAHierarchy] = useState<string[]>([]);

  useEffect(() => {
    loadFromLocalStorage();
    setStage("report-preview");
    loadReportConfig("").then(loaded => {
      setReports(loaded);
      if (loaded.length) setSelectedId(loaded[0].id);
      setLoading(false);
    });
  }, []);

  const report = useMemo(()=>reports.find(r=>r.id===selectedId)??null,[reports,selectedId]);
  const cfg    = report?.newReportConfig;

  // Column defs from matching activity
  const columns = useMemo((): ColDef[] => {
    const rn = (report?.name??"").toLowerCase();
    const act = activities.find(a=>a.name.toLowerCase().includes(rn)||rn.includes(a.name.toLowerCase()));
    if (act) return act.schema.sections.flatMap(s=>s.fields.map(f=>({label:f.label,type:f.type})));
    return [{label:"Date",type:"date"},{label:"Submitted By",type:"text"},{label:"Status",type:"dropdown"},{label:"Location",type:"location"},{label:"Remarks",type:"textarea"}];
  },[report,activities]);

  // 20 mock rows with filterable metadata
  const allRows = useMemo(():RowMeta[] =>
    Array.from({length:20},(_,i)=>({
      ...Object.fromEntries(columns.map(c=>[c.label,mockValue(c.type,i)])),
      _region:         REGIONS[i%4],
      _hierarchy:      HIERARCHIES[i%5],
      _distType:       DIST_TYPES[i%3],
      _distDiv:        DIST_DIVS[i%3],
      _distCode:       DIST_CODES[i%5],
      _productStatus:  PRODUCT_STATUS_SEED[i%3],
      _batchStatus:    BATCH_STATUS_SEED[i%3],
      _distStatus:     DIST_STATUS_SEED[i%3],
      _prodHierarchy:  PROD_HIERARCHY_SEED[i%3],
      _orderType:      ORDER_TYPE_SEED[i%3],
      _paymentMode:    PAYMENT_MODE_SEED[i%3],
      _deliveryStatus: DELIVERY_STATUS_SEED[i%3],
    })),
  [columns]);

  // Distinct options from actual mock data
  const opts = useMemo(() => {
    const d = (key: keyof RowMeta) => [...new Set(allRows.map(r => r[key]))].sort();
    return {
      distType:       d("_distType"),
      distDiv:        d("_distDiv"),
      productStatus:  d("_productStatus"),
      batchStatus:    d("_batchStatus"),
      distStatus:     d("_distStatus"),
      prodHierarchy:  d("_prodHierarchy"),
      orderType:      d("_orderType"),
      paymentMode:    d("_paymentMode"),
      deliveryStatus: d("_deliveryStatus"),
    };
  }, [allRows]);

  // Filter rows against applied state
  const visibleRows = useMemo(()=>{
    if (!showPreview) return [];
    return allRows.filter(row=>{
      if (aGeo.length      && !aGeo.includes(row._region))          return false;
      if (aHierarchy.length&& !aHierarchy.includes(row._hierarchy)) return false;
      if (a.distType       && row._distType      !== a.distType)     return false;
      if (a.distDiv        && row._distDiv       !== a.distDiv)      return false;
      if (aDistCodes.length&& !aDistCodes.includes(row._distCode))  return false;
      if (a.productStatus  && row._productStatus !== a.productStatus)return false;
      if (a.batchStatus    && row._batchStatus   !== a.batchStatus)  return false;
      if (a.distStatus     && row._distStatus    !== a.distStatus)   return false;
      if (a.prodHierarchy  && row._prodHierarchy !== a.prodHierarchy)return false;
      if (a.orderType      && row._orderType     !== a.orderType)    return false;
      if (a.paymentMode    && row._paymentMode   !== a.paymentMode)  return false;
      if (a.deliveryStatus && row._deliveryStatus!== a.deliveryStatus)return false;
      return true;
    });
  },[allRows,showPreview,a,aGeo,aHierarchy,aDistCodes]);

  const showDistFilter  = !!(cfg?.distributorFilter?.enabled);
  const showGeoFilter   = !!(cfg?.geographicalHierarchyFilter?.enabled);
  const showSalesFilter = !!(cfg?.salesHierarchyFilter?.enabled);
  const hasFilterBar    = showDistFilter || showGeoFilter || showSalesFilter;
  const showCustomRow   = !!(cfg?.shouldShowCustomFilters);
  const showAddlRow     = !!(cfg?.showAdditionalFilters);
  const nonPreviewKind  = cfg?.isLiveReport?"live":cfg?.isPDFReport?"pdf":cfg?.isGSTRReport?"gstr":cfg?.customDownload?"custom":null;
  const anyFilterRow    = hasFilterBar || showCustomRow || showAddlRow;

  // ── Config mutators (so voice RC_* actions work without navigating away) ──────

  const updateNestedConfig = useCallback((id: string, fieldPath: string, value: boolean) => {
    const [top, sub] = fieldPath.split(".");
    setReports(prev => prev.map(c => {
      if (c.id !== id) return c;
      if (!sub) return { ...c, newReportConfig: { ...c.newReportConfig, [top]: value } };
      const topObj = (c.newReportConfig as any)[top] ?? {};
      return { ...c, newReportConfig: { ...c.newReportConfig, [top]: { ...topObj, [sub]: value } } };
    }));
  }, []);

  // Persist config changes back to localStorage whenever reports change
  useEffect(() => {
    if (!loading) saveReportConfigLocal(reports, "");
  }, [reports, loading]);

  // ── Date preset helpers ───────────────────────────────────────────────────────

  const applyPreset = useCallback((preset: "7d"|"3m"|"custom") => {
    setDatePreset(preset);
    if (preset === "7d")  { setDateFrom(daysAgo(7));  setDateTo(toIso(new Date())); }
    if (preset === "3m")  { setDateFrom(daysAgo(90)); setDateTo(toIso(new Date())); }
    // "custom" keeps whatever dates are already set
  }, []);

  const resetAll = useCallback(() => {
    setF({...BLANK}); setA({...BLANK});
    setFDistCodes([]); setADistCodes([]);
    setFGeo([]); setAGeo([]);
    setFHierarchy([]); setAHierarchy([]);
    setDatePreset("7d"); setDateFrom(daysAgo(7)); setDateTo(toIso(new Date()));
  }, []);

  // Auto-preview whenever a report is selected (unless it's a non-previewable type)
  useEffect(()=>{
    setShowPreview(cfg != null && nonPreviewKind == null);
    resetAll();
  },[selectedId, cfg, nonPreviewKind]);

  const handlePreview = useCallback(() => {
    setA({...f}); setADistCodes([...fDistCodes]);
    setAGeo([...fGeo]); setAHierarchy([...fHierarchy]);
    setShowPreview(true);
  }, [f, fDistCodes, fGeo, fHierarchy]);

  const handleReset = useCallback(() => {
    resetAll();
    setShowPreview(!anyFilterRow && !nonPreviewKind);
  }, [anyFilterRow, nonPreviewKind, resetAll]);

  // ── Voice: report preview dispatch ──────────────────────────────────────────

  // Keep refs for stable closure
  const reportsRef   = useRef(reports);
  const selectedIdRef = useRef(selectedId);
  reportsRef.current  = reports;
  selectedIdRef.current = selectedId;

  useEffect(() => {
    const reportPreviewDispatch = (action: any): string => {
      switch (action.type) {
        case "RP_PREVIEW":
          handlePreview();
          return "Showing report data now.";
        case "RP_RESET_FILTERS":
          handleReset();
          return "All filters cleared.";
        case "RP_DOWNLOAD":
          return "Download initiated.";
        case "RP_SELECT_REPORT": {
          const match = reportsRef.current.find(r =>
            r.name.toLowerCase().includes((action.name ?? "").toLowerCase())
          );
          if (match) { setSelectedId(match.id); return `Switched to "${match.name}".`; }
          const names = reportsRef.current.map(r=>r.name).join(", ");
          return `Couldn't find "${action.name}". Available: ${names || "none"}.`;
        }
        case "RP_FILTER": {
          const dim: string  = (action.dimension ?? "").toLowerCase();
          const val: string  = action.value ?? "";
          const ALIASES: Record<string,string> = {
            geo:"geo", geography:"geo", region:"geo",
            hierarchy:"hierarchy", "sales hierarchy":"hierarchy", rep:"hierarchy", area:"hierarchy",
            disttype:"distType", type:"distType", "distributor type":"distType",
            distdiv:"distDiv", division:"distDiv",
            productstatus:"productStatus", "product status":"productStatus",
            batchstatus:"batchStatus", "batch status":"batchStatus",
            diststatus:"distStatus", "distributor status":"distStatus", "dist status":"distStatus",
            prodhierarchy:"prodHierarchy", "product hierarchy":"prodHierarchy",
            ordertype:"orderType", "order type":"orderType",
            paymentmode:"paymentMode", payment:"paymentMode",
            deliverystatus:"deliveryStatus", delivery:"deliveryStatus",
          };
          const key = ALIASES[dim] ?? dim;
          if (key === "geo") {
            setFGeo(p => p.includes(val) ? p : [...p, val]);
            setAGeo(p => p.includes(val) ? p : [...p, val]);
            setShowPreview(true);
            return `Filtering by geography: ${val}.`;
          }
          if (key === "hierarchy") {
            setFHierarchy(p => p.includes(val) ? p : [...p, val]);
            setAHierarchy(p => p.includes(val) ? p : [...p, val]);
            setShowPreview(true);
            return `Filtering by hierarchy: ${val}.`;
          }
          if (key in BLANK) {
            setF(p => ({...p,[key]:val}));
            setA(p => ({...p,[key]:val}));
            setShowPreview(true);
            return `Filter applied: ${action.dimension} = ${val}.`;
          }
          return `Unknown filter dimension: ${action.dimension}.`;
        }
        default:
          return "Unknown report preview action.";
      }
    };
    registerUICallbacks({ reportPreviewDispatch });
  }, [handlePreview, handleReset, registerUICallbacks]);

  // Register getReportNames so the agent context always has the current list
  const reportsForCallback = reports;
  useEffect(() => {
    registerUICallbacks({ getReportNames: () => reportsForCallback.map(r => r.name) });
  }, [reportsForCallback, registerUICallbacks]);

  // ── Voice: RC_* config actions handled here so we stay on preview ────────────
  // This registers reportConfigDispatch so the voice agent never needs to
  // navigate to /report-config for simple flag toggles.
  useEffect(() => {
    const reportConfigDispatch = (action: any): string => {
      const all = reportsRef.current;
      const selId = selectedIdRef.current;
      switch (action.type) {
        case "RC_CREATE_REPORT": {
          const card = makeNewCard();
          setReports(prev => [...prev, card]);
          setSelectedId(card.id);
          selectedIdRef.current = card.id; // sync immediately for next RC action in same flush
          return "New report created.";
        }
        case "RC_SET_DISPLAY_NAME": {
          const targetId = selectedIdRef.current;
          if (!targetId) return "No report selected.";
          const val = String(action.value);
          const autoKey = val.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
          setReports(prev => prev.map(c => c.id === targetId
            ? { ...c, name: val, newReportConfig: { ...c.newReportConfig, reportName: autoKey } }
            : c
          ));
          return `Report named "${val}".`;
        }
        case "RC_SELECT_REPORT": {
          const card = all.find(c => c.name.toLowerCase().includes((action.name ?? "").toLowerCase()));
          if (card) { setSelectedId(card.id); selectedIdRef.current = card.id; return `Selected "${card.name}".`; }
          return `Report "${action.name}" not found.`;
        }
        case "RC_TOGGLE_FLAG": {
          if (!selId) return "No report selected.";
          const rawFlag: string = action.flag ?? "";
          const fieldPath = BEHAVIOR_FLAG_ALIASES[rawFlag.toLowerCase()] ?? rawFlag;
          const value = Boolean(action.value);
          updateNestedConfig(selId, fieldPath, value);
          return `${rawFlag} ${value ? "enabled" : "disabled"}.`;
        }
        case "RC_SAVE_CONFIG":
          return "Configuration saved.";
        default:
          return "Unknown action.";
      }
    };
    if (loading) return;
    registerUICallbacks({ reportConfigDispatch });
  }, [loading, updateNestedConfig, registerUICallbacks]);

  // Active chips
  const chips = [
    ...aGeo.map(v=>({key:`geo_${v}`,      label:"Geography", value:v})),
    ...aHierarchy.map(v=>({key:`hier_${v}`,label:"Hierarchy", value:v})),
    a.distType       && {key:"distType",       label:"Type",            value:a.distType},
    a.distDiv        && {key:"distDiv",         label:"Division",        value:a.distDiv},
    a.productStatus  && {key:"productStatus",   label:"Product Status",  value:a.productStatus},
    a.batchStatus    && {key:"batchStatus",     label:"Batch Status",    value:a.batchStatus},
    a.distStatus     && {key:"distStatus",      label:"Dist Status",     value:a.distStatus},
    a.prodHierarchy  && {key:"prodHierarchy",   label:"Prod Hierarchy",  value:a.prodHierarchy},
    a.orderType      && {key:"orderType",       label:"Order Type",      value:a.orderType},
    a.paymentMode    && {key:"paymentMode",     label:"Payment",         value:a.paymentMode},
    a.deliveryStatus && {key:"deliveryStatus",  label:"Delivery",        value:a.deliveryStatus},
    ...aDistCodes.map(c=>({key:`dist_${c}`, label:"Distributor", value:c})),
  ].filter(Boolean) as {key:string;label:string;value:string}[];

  const removeChip = (key: string) => {
    if (key.startsWith("geo_")) {
      const v=key.slice(4); setFGeo(p=>p.filter(x=>x!==v)); setAGeo(p=>p.filter(x=>x!==v));
    } else if (key.startsWith("hier_")) {
      const v=key.slice(5); setFHierarchy(p=>p.filter(x=>x!==v)); setAHierarchy(p=>p.filter(x=>x!==v));
    } else if (key.startsWith("dist_")) {
      const code=key.slice(5); setFDistCodes(p=>p.filter(v=>v!==code)); setADistCodes(p=>p.filter(v=>v!==code));
    } else {
      setF(p=>({...p,[key]:""})); setA(p=>({...p,[key]:""}));
    }
  };

  // ── Loading / empty ────────────────────────────────────────────────────────

  if (loading) return (
    <div className="h-screen flex items-center justify-center text-muted-foreground text-sm">Loading reports…</div>
  );
  if (!reports.length) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 text-muted-foreground">
      <FileBarChart2 className="h-14 w-14 opacity-20"/>
      <p className="text-sm">No reports configured yet.</p>
      <Button variant="outline" size="sm" onClick={()=>navigate("/report-config")}>Configure Reports</Button>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* ── Left sidebar — report list ────────────────────────────────────── */}
      <div className="w-56 border-r flex flex-col bg-muted/20 shrink-0">
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-3 border-b">
          <button onClick={()=>navigate(-1)} title="Back"
            className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0">
            <ArrowLeft className="h-4 w-4"/>
          </button>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex-1">Reports</span>
        </div>

        {/* Report list */}
        <div className="flex-1 overflow-y-auto py-1">
          {reports.map(r=>(
            <div key={r.id}
              className={cn(
                "group flex items-center gap-1.5 px-3 py-2.5 cursor-pointer transition-colors",
                r.id===selectedId
                  ? "bg-primary/8 border-r-2 border-primary text-foreground"
                  : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
              )}>
              <FileBarChart2 className="h-3.5 w-3.5 shrink-0 opacity-60"/>
              <span className="flex-1 text-sm truncate font-medium"
                onClick={()=>{setSelectedId(r.id);handleReset();}}>
                {r.name}
              </span>
              <button
                onClick={()=>navigate("/report-config")}
                title="Configure this report"
                className="opacity-0 group-hover:opacity-100 h-6 w-6 flex items-center justify-center rounded hover:bg-muted/60 transition-all shrink-0">
                <Settings2 className="h-3.5 w-3.5"/>
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-2.5 border-t">
          <button onClick={()=>navigate("/report-config")}
            className="w-full flex items-center justify-center gap-1.5 h-8 text-xs text-muted-foreground hover:text-foreground border border-dashed rounded-md hover:bg-muted transition-colors">
            <Settings2 className="h-3.5 w-3.5"/> Update Configurations
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Header row ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-background gap-4">
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold">{report?.name ?? "Select a Report"}</span>
            {nonPreviewKind && (
              <Badge variant="outline" className={cn("text-[10px] font-medium",
                nonPreviewKind==="live"   && "border-emerald-300 text-emerald-700 bg-emerald-50",
                nonPreviewKind==="pdf"    && "border-red-300    text-red-700    bg-red-50",
                nonPreviewKind==="gstr"   && "border-blue-300   text-blue-700   bg-blue-50",
                nonPreviewKind==="custom" && "border-orange-300 text-orange-700 bg-orange-50",
              )}>
                {nonPreviewKind==="live"&&"Live"}{nonPreviewKind==="pdf"&&"PDF"}
                {nonPreviewKind==="gstr"&&"GSTR"}{nonPreviewKind==="custom"&&"Custom"}
              </Badge>
            )}
          </div>

          {cfg?.dateRangeFilter && !nonPreviewKind && (
            <DateRangePicker
              dateFrom={dateFrom}
              dateTo={dateTo}
              datePreset={datePreset}
              onPresetChange={applyPreset}
              onRangeChange={(from, to) => { setDateFrom(from); setDateTo(to); setDatePreset("custom"); }}
              cfg={cfg}
            />
          )}
        </div>

        {/* ── Main filter bar ─────────────────────────────────────────────── */}
        {hasFilterBar && !nonPreviewKind && (
          <div className="flex items-center gap-2 px-5 py-2 border-b bg-background flex-wrap">
            {showDistFilter && (
              <>
                <FilterSelect placeholder="Distributor Type"     options={opts.distType} value={f.distType} onChange={sf("distType")}/>
                <FilterSelect placeholder="Distributor Division" options={opts.distDiv}  value={f.distDiv}  onChange={sf("distDiv")}/>
              </>
            )}
            {showGeoFilter && (
              <HierarchySelect
                levels={GEO_LEVELS}
                levelData={GEO_LEVEL_DATA}
                value={aGeo}
                staged={fGeo}
                onStagedChange={setFGeo}
                onApply={()=>setAGeo([...fGeo])}
                onReset={()=>{ setFGeo([]); setAGeo([]); }}
                placeholder="Geography"
              />
            )}
            {showSalesFilter && (
              <HierarchySelect
                levels={SALES_LEVELS}
                levelData={SALES_LEVEL_DATA}
                value={aHierarchy}
                staged={fHierarchy}
                onStagedChange={setFHierarchy}
                onApply={()=>setAHierarchy([...fHierarchy])}
                onReset={()=>{ setFHierarchy([]); setAHierarchy([]); }}
                placeholder="Sales Hierarchy"
              />
            )}
            {showDistFilter && <DistributorSelect value={fDistCodes} onChange={setFDistCodes}/>}

            <span className="h-6 w-px bg-border mx-1"/>
            <button onClick={handleReset}
              className="flex items-center gap-1 h-8 px-3 text-xs border rounded-md hover:bg-muted transition-colors">
              <RotateCcw className="h-3 w-3"/> Reset
            </button>
            <Button size="sm" variant="outline"
              className="h-8 text-xs gap-1.5 border-emerald-500 text-emerald-600 hover:bg-emerald-50 ml-auto"
              onClick={handlePreview}>
              <Eye className="h-3.5 w-3.5"/> Preview
            </Button>
            <Button size="sm" className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
              <Download className="h-3.5 w-3.5"/> Download
            </Button>
          </div>
        )}

        {/* ── Custom filters row ──────────────────────────────────────────── */}
        {showCustomRow && !nonPreviewKind && (
          <div className="flex items-center gap-2 px-5 py-2 border-b bg-muted/5 flex-wrap">
            <FilterSelect showDot={false} placeholder="Product Status"     options={opts.productStatus} value={f.productStatus}  onChange={sf("productStatus")}/>
            <FilterSelect showDot={false} placeholder="Batch Status"       options={opts.batchStatus}   value={f.batchStatus}    onChange={sf("batchStatus")}/>
            <FilterSelect showDot={false} placeholder="Distributor Status" options={opts.distStatus}    value={f.distStatus}     onChange={sf("distStatus")}/>
            <FilterSelect showDot={false} placeholder="Product Hierarchy"  options={opts.prodHierarchy} value={f.prodHierarchy}  onChange={sf("prodHierarchy")}/>
          </div>
        )}

        {/* ── Additional filters row (3 hardcoded) ───────────────────────── */}
        {showAddlRow && !nonPreviewKind && (
          <div className="flex items-center gap-2 px-5 py-2 border-b bg-muted/5 flex-wrap">
            <FilterSelect showDot={false} placeholder="Order Type"      options={opts.orderType}      value={f.orderType}      onChange={sf("orderType")}/>
            <FilterSelect showDot={false} placeholder="Payment Mode"    options={opts.paymentMode}    value={f.paymentMode}    onChange={sf("paymentMode")}/>
            <FilterSelect showDot={false} placeholder="Delivery Status" options={opts.deliveryStatus} value={f.deliveryStatus} onChange={sf("deliveryStatus")}/>
          </div>
        )}

        {/* Action bar — when only custom/additional rows exist (no main filter bar) */}
        {!hasFilterBar && (showCustomRow || showAddlRow) && !nonPreviewKind && (
          <div className="flex items-center gap-2 px-5 py-2 border-b bg-background">
            <button onClick={handleReset}
              className="flex items-center gap-1 h-8 px-3 text-xs border rounded-md hover:bg-muted transition-colors">
              <RotateCcw className="h-3 w-3"/> Reset
            </button>
            <Button size="sm" variant="outline"
              className="h-8 text-xs gap-1.5 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
              onClick={handlePreview}>
              <Eye className="h-3.5 w-3.5"/> Preview
            </Button>
            <Button size="sm" className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white ml-auto">
              <Download className="h-3.5 w-3.5"/> Download
            </Button>
          </div>
        )}

        {/* No filters at all → minimal action bar */}
        {!anyFilterRow && !nonPreviewKind && (
          <div className="flex items-center gap-2 px-5 py-2 border-b bg-background">
            <Button size="sm" variant="outline"
              className="h-8 text-xs gap-1.5 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
              onClick={handlePreview}>
              <Eye className="h-3.5 w-3.5"/> Preview
            </Button>
            <Button size="sm" className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
              <Download className="h-3.5 w-3.5"/> Download
            </Button>
          </div>
        )}

        {/* ── Active chips ────────────────────────────────────────────────── */}
        {chips.length > 0 && (
          <div className="flex items-center gap-2 px-5 py-2 border-b flex-wrap bg-background">
            {chips.map(chip=>(
              <span key={chip.key}
                className="inline-flex items-center gap-1 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-2.5 py-0.5">
                <span className="text-foreground/60">{chip.label}:</span>
                <span className="font-semibold">{chip.value}</span>
                <button onClick={()=>removeChip(chip.key)} className="ml-0.5 hover:text-red-500 transition-colors">
                  <X className="h-2.5 w-2.5"/>
                </button>
              </span>
            ))}
          </div>
        )}

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto">
          {nonPreviewKind ? (
            <NonPreviewable kind={nonPreviewKind}/>
          ) : !showPreview ? (
            <div className="flex flex-col items-center justify-center gap-3 h-full py-20 text-muted-foreground">
              <Filter className="h-10 w-10 opacity-20"/>
              <p className="text-sm">Select filters and click Preview to load data</p>
              <Button size="sm" variant="outline"
                className="gap-1.5 mt-1 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                onClick={handlePreview}>
                <Eye className="h-3.5 w-3.5"/> Preview Data
              </Button>
            </div>
          ) : visibleRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 h-full py-20 text-muted-foreground">
              <FileBarChart2 className="h-10 w-10 opacity-20"/>
              <p className="text-sm">No records match the selected filters</p>
              <button onClick={handleReset} className="text-xs text-primary hover:underline">Clear filters</button>
            </div>
          ) : (
            <div className="overflow-auto h-full flex flex-col">
              <table className="w-full text-sm border-collapse min-w-max">
                <thead className="sticky top-0 bg-background border-b z-10">
                  <tr>
                    {columns.map(col=>(
                      <th key={col.label}
                        className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap border-b">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row,i)=>(
                    <tr key={i} className={cn("border-b hover:bg-muted/30 transition-colors cursor-default",i%2===1&&"bg-muted/10")}>
                      {columns.map(col=>(
                        <td key={col.label}
                          className="px-4 py-2.5 whitespace-nowrap text-sm text-foreground/80 max-w-[200px] overflow-hidden text-ellipsis">
                          {row[col.label]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-muted-foreground mt-auto">
                <span>
                  Showing <span className="font-medium text-foreground">{visibleRows.length}</span> of {allRows.length} rows
                  {chips.length>0&&" (filtered)"}
                  {cfg?.dateRangeFilter&&` · ${fmtDisplay(dateFrom)} – ${fmtDisplay(dateTo)}`}
                </span>
                <div className="flex items-center gap-1.5">
                  <button className="h-7 px-2.5 border rounded text-xs hover:bg-muted disabled:opacity-40" disabled>← Prev</button>
                  <span className="px-2 font-medium">Page 1</span>
                  <button className="h-7 px-2.5 border rounded text-xs hover:bg-muted disabled:opacity-40" disabled>Next →</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
