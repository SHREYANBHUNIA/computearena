/**
 * ComputeArena — Signal Room design reminder
 * A calibrated scientific-computing workspace: measured asymmetry, graphite rules,
 * four-lane execution motifs, and evidence-oriented controls over generic SaaS UI.
 */
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Cpu,
  Database,
  FileText,
  Gauge,
  GitBranch,
  HardDrive,
  LayoutDashboard,
  MoreHorizontal,
  Play,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Terminal,
  Trash2,
  Zap,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type BenchmarkPath = {
  name: string;
  implementation: string;
  time: number;
  speedup: number;
  efficiency: string;
  utilization: string;
  color: string;
  accent: string;
};

type BenchmarkSet = {
  name: string;
  shortName: string;
  workload: string;
  descriptor: string;
  peak: string;
  throughput: string;
  memory: string;
  cpu: string;
  gpu: string;
  scale: { label: string; speedup: number }[];
  routes: BenchmarkPath[];
};

type StoredAlgorithm = BenchmarkSet & {
  id: string;
  origin: "Seeded" | "Library";
};

type AlgorithmForm = {
  name: string;
  workload: string;
  descriptor: string;
  baseline: string;
  gpuTime: string;
};

const STORAGE_KEY = "computearena-algorithm-library-v1";

const initialAlgorithms: StoredAlgorithm[] = [
  {
    id: "matrix-multiplication",
    origin: "Seeded",
    name: "Matrix multiplication",
    shortName: "GEMM",
    workload: "4096 × 4096 · FP32",
    descriptor: "Dense matrix multiply · row-major blocked kernel",
    peak: "31.62×",
    throughput: "1.18 TFLOP/s",
    memory: "428 MB",
    cpu: "94%",
    gpu: "86%",
    scale: [
      { label: "512", speedup: 6.2 },
      { label: "1024", speedup: 14.8 },
      { label: "2048", speedup: 25.6 },
      { label: "4096", speedup: 31.62 },
      { label: "8192", speedup: 30.9 },
    ],
    routes: [
      { name: "Single thread", implementation: "C++ · -O3", time: 3637, speedup: 1, efficiency: "—", utilization: "1 core", color: "#1c2637", accent: "#dfe4dc" },
      { name: "OpenMP", implementation: "C++ · 12 threads", time: 636, speedup: 5.72, efficiency: "47.7%", utilization: "94% CPU", color: "#2854e8", accent: "#e7edff" },
      { name: "SIMD", implementation: "AVX-512 · 16 lanes", time: 447, speedup: 8.14, efficiency: "50.9%", utilization: "78% CPU", color: "#7056b6", accent: "#eeeaff" },
      { name: "GPU", implementation: "CUDA · RTX 4090", time: 115, speedup: 31.62, efficiency: "98.8%", utilization: "86% GPU", color: "#d77a43", accent: "#fff0e8" },
    ],
  },
  {
    id: "parallel-sorting",
    origin: "Seeded",
    name: "Parallel sorting",
    shortName: "SORT",
    workload: "20M uint32 values",
    descriptor: "Radix sort · uniform random distribution",
    peak: "19.84×",
    throughput: "1.04 Gkeys/s",
    memory: "312 MB",
    cpu: "91%",
    gpu: "81%",
    scale: [
      { label: "1M", speedup: 3.5 },
      { label: "5M", speedup: 9.2 },
      { label: "10M", speedup: 15.7 },
      { label: "20M", speedup: 19.84 },
      { label: "40M", speedup: 18.9 },
    ],
    routes: [
      { name: "Single thread", implementation: "C++ · std::sort", time: 1290, speedup: 1, efficiency: "—", utilization: "1 core", color: "#1c2637", accent: "#dfe4dc" },
      { name: "OpenMP", implementation: "C++ · 12 threads", time: 298, speedup: 4.33, efficiency: "36.1%", utilization: "91% CPU", color: "#2854e8", accent: "#e7edff" },
      { name: "SIMD", implementation: "AVX2 · vector scan", time: 236, speedup: 5.47, efficiency: "34.2%", utilization: "73% CPU", color: "#7056b6", accent: "#eeeaff" },
      { name: "GPU", implementation: "CUDA · CUB radix", time: 65, speedup: 19.84, efficiency: "91.6%", utilization: "81% GPU", color: "#d77a43", accent: "#fff0e8" },
    ],
  },
  {
    id: "convolution",
    origin: "Seeded",
    name: "2D convolution",
    shortName: "CONV",
    workload: "8192 × 8192 · 7 × 7 kernel",
    descriptor: "Image convolution · halo-aware tiled kernel",
    peak: "24.27×",
    throughput: "4.62 Gpx/s",
    memory: "514 MB",
    cpu: "88%",
    gpu: "89%",
    scale: [
      { label: "1K", speedup: 5.7 },
      { label: "2K", speedup: 12.9 },
      { label: "4K", speedup: 20.4 },
      { label: "8K", speedup: 24.27 },
      { label: "16K", speedup: 23.1 },
    ],
    routes: [
      { name: "Single thread", implementation: "C++ · scalar", time: 2078, speedup: 1, efficiency: "—", utilization: "1 core", color: "#1c2637", accent: "#dfe4dc" },
      { name: "OpenMP", implementation: "C++ · 12 threads", time: 384, speedup: 5.41, efficiency: "45.1%", utilization: "88% CPU", color: "#2854e8", accent: "#e7edff" },
      { name: "SIMD", implementation: "AVX-512 · 16 lanes", time: 281, speedup: 7.4, efficiency: "46.2%", utilization: "76% CPU", color: "#7056b6", accent: "#eeeaff" },
      { name: "GPU", implementation: "CUDA · shared tile", time: 86, speedup: 24.27, efficiency: "89.7%", utilization: "89% GPU", color: "#d77a43", accent: "#fff0e8" },
    ],
  },
];

const navItems = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Experiments", icon: Terminal },
  { label: "Compare", icon: GitBranch },
  { label: "Reports", icon: FileText },
];

const chartConfig = { speedup: { label: "Peak speedup", color: "#2854e8" } } satisfies ChartConfig;
const emptyForm: AlgorithmForm = { name: "", workload: "", descriptor: "", baseline: "1000", gpuTime: "80" };

function loadAlgorithms(): StoredAlgorithm[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialAlgorithms;
    const parsed = JSON.parse(raw) as StoredAlgorithm[];
    return Array.isArray(parsed) && parsed.length > 0 && parsed.every(item => item.id && item.routes) ? parsed : initialAlgorithms;
  } catch {
    return initialAlgorithms;
  }
}

function MetricPlate({ label, value, note, icon: Icon, tone = "blue" }: { label: string; value: string; note: string; icon: typeof Zap; tone?: "blue" | "violet" | "copper" | "graphite" }) {
  const toneMap = { blue: "bg-[#e7edff] text-[#2854e8]", violet: "bg-[#eeeaff] text-[#7056b6]", copper: "bg-[#fff0e8] text-[#c76832]", graphite: "bg-[#edf0ec] text-[#1c2637]" };
  return <div className="metric-surface signal-card plate-edge relative overflow-hidden rounded-xl border border-[#d5dad2] p-4 sm:p-5"><div className="mb-5 flex items-start justify-between gap-3"><span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[#657082]">{label}</span><span className={`grid h-8 w-8 place-items-center rounded-xl ${toneMap[tone]}`}><Icon size={16} strokeWidth={2} /></span></div><div className="font-sans text-2xl font-semibold tracking-[-0.05em] text-[#101827] sm:text-[27px]">{value}</div><p className="mt-1 font-mono text-[10px] leading-4 text-[#7a8494]">{note}</p><div className="calibration-rule absolute bottom-2 left-4 right-4 h-px opacity-35" /></div>;
}

function LaneMotif({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`inline-flex h-3.5 items-end gap-[2px] ${className}`}><i className="block h-[4px] w-[2px] bg-[#1c2637]" /><i className="block h-[7px] w-[2px] bg-[#2854e8]" /><i className="block h-[10px] w-[2px] bg-[#7056b6]" /><i className="block h-[13px] w-[2px] bg-[#d77a43]" /></span>;
}

function SectionEyebrow({ number, label }: { number: string; label: string }) {
  return <div className="flex items-center gap-2.5"><LaneMotif /><span className="font-mono text-[10px] text-[#2854e8]">{number}</span><span className="h-px w-5 bg-[#aab5c6]" /><span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[#657082]">{label}</span></div>;
}

function OverviewWorkspace({ selected, algorithms, onSelect, onCompare, onLibrary, reportGenerated, onGenerateReport, onStartRun }: { selected: StoredAlgorithm; algorithms: StoredAlgorithm[]; onSelect: (id: string) => void; onCompare: () => void; onLibrary: () => void; reportGenerated: boolean; onGenerateReport: () => void; onStartRun: () => void }) {
  const gpuRoute = selected.routes[selected.routes.length - 1];
  const fastestRoute = selected.routes.reduce((fastest, route) => route.time < fastest.time ? route : fastest);
  return <>
    <section className="stage-enter plate-edge relative overflow-hidden rounded-2xl border border-[#d5dad2] bg-[#fbfcf9] p-5 sm:p-7 lg:p-8"><img src="/manus-storage/computearena-research-surface_9f93e679.png" alt="Abstract ComputeArena research surface" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-multiply" /><div className="pointer-events-none absolute bottom-0 right-10 top-0 w-px bg-gradient-to-b from-transparent via-[#cfd6cd] to-transparent" /><div className="relative flex flex-col justify-between gap-7 xl:flex-row xl:items-end"><div className="max-w-2xl"><SectionEyebrow number="01" label="Active experiment" /><div className="mt-5 flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-[-0.065em] text-[#101827] sm:text-4xl xl:text-[46px]">{selected.name}</h1><span className="inline-flex items-center gap-1.5 rounded-full border border-[#cce4d5] bg-[#eff9f2] px-2.5 py-1 font-mono text-[10px] font-medium text-[#237a4e]"><CheckCircle2 size={12} /> {selected.origin === "Library" ? "library ready" : "completed"}</span></div><p className="mt-3 max-w-xl text-sm leading-6 text-[#657082]">Measure one workload across an equivalent baseline, threaded, vectorized, and CUDA implementation. Inspect the strongest execution path before you commit the next run.</p><div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[10px] text-[#697688]"><span>RUN <b className="font-medium text-[#202b3a]">CA-2026-084</b></span><span>COMPILED <b className="font-medium text-[#202b3a]">GCC 14.1</b></span><span>REPETITIONS <b className="font-medium text-[#202b3a]">30</b></span></div></div><div className="flex flex-wrap items-center gap-3 xl:justify-end"><div className="rounded-xl border border-[#d8ddd5] bg-white/80 px-3.5 py-2.5 backdrop-blur"><span className="block font-mono text-[9px] uppercase tracking-[0.12em] text-[#8791a0]">Workload</span><span className="mt-1 block text-xs font-semibold text-[#293547]">{selected.workload}</span></div><button onClick={onLibrary} className="inline-flex items-center gap-2 rounded-xl border border-[#d8ddd5] bg-white/80 px-3.5 py-3 text-xs font-semibold text-[#394456] backdrop-blur transition hover:-translate-y-0.5"><Database size={15} /> Algorithm library</button></div></div></section>
    <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricPlate label="Best execution time" value={`${fastestRoute.time} ms`} note={`${fastestRoute.name} · median of 30 runs`} icon={Clock3} tone="copper" /><MetricPlate label="Peak speedup" value={selected.peak} note="relative to scalar reference" icon={Zap} tone="blue" /><MetricPlate label="Sustained throughput" value={selected.throughput} note="best observed measurement" icon={Gauge} tone="violet" /><MetricPlate label="Working set" value={selected.memory} note="peak resident memory" icon={HardDrive} tone="graphite" /></section>
    <section className="mt-8 grid gap-6 2xl:grid-cols-[minmax(0,1.6fr)_minmax(310px,0.7fr)]"><div className="signal-card plate-edge rounded-2xl border border-[#d5dad2] bg-[#fcfcf9] p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><SectionEyebrow number="02" label="Execution paths" /><h2 className="mt-3 text-xl font-semibold tracking-[-0.045em]">One algorithm, four hardware arguments.</h2><p className="mt-1.5 text-xs leading-5 text-[#6a7686]">Median elapsed time · lower is better · normalized performance shown at right.</p></div><div className="flex max-w-full items-center gap-2 self-start overflow-x-auto rounded-lg border border-[#dde1da] bg-[#f5f6f2] p-1">{algorithms.map(algorithm => <button key={algorithm.id} onClick={() => onSelect(algorithm.id)} className={`shrink-0 rounded-md px-2.5 py-1.5 font-mono text-[10px] transition ${selected.id === algorithm.id ? "bg-white text-[#2147cb] shadow-sm" : "text-[#7a8494] hover:text-[#273243]"}`}>{algorithm.shortName}</button>)}</div></div><div className="mt-6 divide-y divide-[#e2e5df]">{selected.routes.map((route, index) => <div key={route.name} className="grid gap-3 py-4 first:pt-0 sm:grid-cols-[172px_minmax(150px,1fr)_80px_70px] sm:items-center sm:gap-5"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg" style={{ backgroundColor: route.accent, color: route.color }}>{index === 0 ? <Circle size={14} fill="currentColor" /> : index === 1 ? <GitBranch size={15} /> : index === 2 ? <Activity size={15} /> : <Cpu size={15} />}</span><div><p className="text-sm font-semibold text-[#253143]">{route.name}</p><p className="mt-0.5 font-mono text-[9px] text-[#7c8796]">{route.implementation}</p></div></div><div className="flex items-center gap-3"><div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#edf0ec]"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(6, route.speedup / gpuRoute.speedup * 100)}%`, backgroundColor: route.color }} /></div><span className="w-12 text-right font-mono text-[11px] font-medium text-[#394456]">{route.time.toLocaleString()} ms</span></div><div className="text-right"><p className="font-mono text-[15px] font-medium tracking-[-0.04em]" style={{ color: route.color }}>{route.speedup.toFixed(2)}×</p><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#8a94a2]">speedup</p></div><div className="hidden text-right sm:block"><p className="font-mono text-[11px] text-[#4e5b6c]">{route.utilization}</p><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#8a94a2]">util.</p></div></div>)}</div><div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#e2e5df] pt-4"><span className="font-mono text-[10px] text-[#7a8494]">METHODOLOGY: warm cache · pinned affinity · 95% CI &lt; 2.1%</span><button onClick={onCompare} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2147cb] transition hover:gap-2.5">Open compare mode <ArrowUpRight size={14} /></button></div></div><aside className="signal-card relative overflow-hidden rounded-2xl border border-[#253348] bg-[#172130] p-5 text-white sm:p-6"><img src="/manus-storage/computearena-cuda-accelerator_d2582af3.png" alt="Abstract CUDA acceleration module" className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-screen" /><div className="relative"><div className="flex items-center justify-between"><SectionEyebrow number="GPU" label="Fastest route" /><span className="rounded-full bg-[#d77a43]/20 px-2 py-1 font-mono text-[9px] text-[#ffc4a1]">CUDA</span></div><div className="mt-7"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#9facbb]">Winning configuration</p><h3 className="mt-2 text-2xl font-semibold tracking-[-0.055em]">{gpuRoute.implementation}</h3><p className="mt-2 max-w-xs text-xs leading-5 text-[#c3cbd5]">{selected.descriptor}. The accelerator route establishes the comparison envelope.</p></div><div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10"><div className="bg-[#172130]/70 p-3"><p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#92a0af]">GPU util.</p><p className="mt-1.5 text-xl font-semibold tracking-[-0.05em]">{selected.gpu}</p></div><div className="bg-[#172130]/70 p-3"><p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#92a0af]">Efficiency</p><p className="mt-1.5 text-xl font-semibold tracking-[-0.05em]">{gpuRoute.efficiency}</p></div></div><button onClick={onStartRun} className="mt-7 flex w-full items-center justify-between rounded-xl bg-white px-3.5 py-3 text-left text-xs font-semibold text-[#172130] transition hover:-translate-y-0.5"><span className="flex items-center gap-2"><Terminal size={15} /> Queue selected route</span><ChevronRight size={15} /></button></div></aside></section>
    <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(350px,0.65fr)]"><div className="signal-card plate-edge overflow-hidden rounded-2xl border border-[#d5dad2] bg-[#fcfcf9] p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><SectionEyebrow number="03" label="Scaling behavior" /><h2 className="mt-3 text-xl font-semibold tracking-[-0.045em]">Acceleration holds through the workload.</h2></div><div className="flex items-center gap-2 font-mono text-[10px] text-[#6e7a8a]"><span className="h-2 w-2 rounded-sm bg-[#2854e8]" /> peak speedup</div></div><ChartContainer config={chartConfig} className="mt-4 h-[220px] w-full"><AreaChart data={selected.scale} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}><defs><linearGradient id="speedup-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#2854e8" stopOpacity={0.24} /><stop offset="100%" stopColor="#2854e8" stopOpacity={0.01} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#e1e5df" strokeDasharray="2 4" /><XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} fontSize={10} fontFamily="DM Mono" /><YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={10} fontFamily="DM Mono" tickFormatter={(value) => `${value}×`} /><Tooltip cursor={{ stroke: "#a4b6f8", strokeWidth: 1 }} content={<ChartTooltipContent indicator="line" formatter={(value) => <div className="flex w-full justify-between gap-8"><span className="text-muted-foreground">Speedup</span><span className="font-mono font-medium text-[#2147cb]">{Number(value).toFixed(2)}×</span></div>} />} /><Area dataKey="speedup" type="monotone" stroke="#2147cb" strokeWidth={3} fill="url(#speedup-fill)" isAnimationActive={false} dot={{ r: 3.4, fill: "#fcfcf9", stroke: "#2147cb", strokeWidth: 2 }} activeDot={{ r: 4.5, fill: "#2147cb" }} /></AreaChart></ChartContainer><div className="mt-1 grid gap-3 border-t border-[#e3e6e1] pt-3 sm:grid-cols-[1fr_auto] sm:items-end"><div className="flex items-center justify-between font-mono text-[10px] text-[#7a8494]"><span>PROBLEM SCALE</span><span>GPU / SCALAR RATIO</span></div><div className="rounded-md border border-[#cfd9fa] bg-[#f0f3ff] px-2.5 py-1.5 font-mono text-[10px] text-[#2147cb]"><b className="font-medium">OBSERVED:</b> peak at {selected.workload.split(" · ")[0]} · {selected.peak}</div></div></div><div className="signal-card plate-edge relative overflow-hidden rounded-2xl border border-[#d5dad2] bg-[#fcfcf9] p-5 sm:p-6"><img src="/manus-storage/computearena-vector-lanes_f214874b.png" alt="Abstract vector execution lanes" className="pointer-events-none absolute bottom-0 right-0 h-[58%] w-[75%] object-cover opacity-[0.08]" /><div className="relative"><div className="flex items-start justify-between gap-4"><div><SectionEyebrow number="04" label="Report packet" /><h2 className="mt-3 text-xl font-semibold tracking-[-0.045em]">{reportGenerated ? "Draft is ready for review." : "Turn the run into evidence."}</h2></div><span className={`grid h-9 w-9 place-items-center rounded-xl ${reportGenerated ? "bg-[#edf8f0] text-[#2f8c5d]" : "bg-[#e7edff] text-[#2854e8]"}`}>{reportGenerated ? <CheckCircle2 size={17} /> : <Sparkles size={17} />}</span></div><p className="mt-3 max-w-sm text-xs leading-5 text-[#6c7787]">{reportGenerated ? "The report has captured the winning route, methodology, and performance gap for this selected experiment." : "Bundle methodology, system information, raw timing, and the clearest comparative claim in one exportable lab record."}</p><div className="mt-5 space-y-2.5 rounded-xl border border-[#e0e4dd] bg-white/80 p-3.5"><div className="flex items-center justify-between font-mono text-[10px]"><span className="text-[#788393]">SYSTEM PROFILE</span><span className="text-[#2f8c5d]">included</span></div><div className="flex items-center justify-between font-mono text-[10px]"><span className="text-[#788393]">RAW SAMPLES</span><span className="text-[#2f8c5d]">30 / route</span></div><div className="flex items-center justify-between font-mono text-[10px]"><span className="text-[#788393]">FINDING</span><span className="text-[#2147cb]">{selected.peak} GPU peak</span></div></div><button onClick={onGenerateReport} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2854e8] px-4 py-3 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#234bd0] active:scale-[0.97]"><FileText size={15} /> {reportGenerated ? "Refresh report draft" : "Generate report"}</button></div></div></section>
  </>;
}

function AlgorithmLibraryWorkspace({ algorithms, activeId, compareIds, onSetActive, onToggleCompare, onRemove, onCreate }: { algorithms: StoredAlgorithm[]; activeId: string; compareIds: string[]; onSetActive: (id: string) => void; onToggleCompare: (id: string) => void; onRemove: (algorithm: StoredAlgorithm) => void; onCreate: () => void }) {
  return <><section className="stage-enter plate-edge relative overflow-hidden rounded-2xl border border-[#d5dad2] bg-[#fbfcf9] p-5 sm:p-7"><div className="dot-field absolute inset-y-0 right-0 w-[42%] opacity-[0.18]" /><div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><SectionEyebrow number="LIB" label="Algorithm library" /><h1 className="mt-4 text-3xl font-semibold tracking-[-0.065em] sm:text-4xl">Store the workloads you need later.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#657082]">Library definitions stay in this browser. Select one as the active workspace or include several in the performance comparison.</p></div><button onClick={onCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2854e8] px-4 py-3 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(40,84,232,0.22)] transition hover:-translate-y-0.5 hover:bg-[#234bd0] active:scale-[0.97]"><Plus size={16} /> Add algorithm</button></div></section><section className="mt-7 grid gap-4 xl:grid-cols-2">{algorithms.map((algorithm, index) => <article key={algorithm.id} className="signal-card plate-edge relative overflow-hidden rounded-2xl border border-[#d5dad2] bg-[#fcfcf9] p-5"><div className="flex items-start justify-between gap-4"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e7edff] font-mono text-[11px] font-medium text-[#2854e8]">{String(index + 1).padStart(2, "0")}</span><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold tracking-[-0.045em]">{algorithm.name}</h2><span className={`rounded-full px-2 py-0.5 font-mono text-[9px] ${algorithm.origin === "Library" ? "bg-[#edf8f0] text-[#2f8c5d]" : "bg-[#eef0ec] text-[#667385]"}`}>{algorithm.origin === "Library" ? "saved" : "seeded"}</span></div><p className="mt-1 font-mono text-[10px] text-[#778393]">{algorithm.workload} · {algorithm.shortName}</p></div></div>{activeId === algorithm.id && <span className="inline-flex items-center gap-1 rounded-full bg-[#e7edff] px-2 py-1 font-mono text-[9px] font-medium text-[#2147cb]"><CheckCircle2 size={11} /> active</span>}</div><p className="mt-5 max-w-xl text-xs leading-5 text-[#687486]">{algorithm.descriptor}</p><div className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-[#e0e4dd] bg-[#e0e4dd]"><div className="bg-white p-3"><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#8993a0]">Peak</p><p className="mt-1 font-semibold tracking-[-0.04em] text-[#2854e8]">{algorithm.peak}</p></div><div className="bg-white p-3"><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#8993a0]">GPU util.</p><p className="mt-1 font-semibold tracking-[-0.04em]">{algorithm.gpu}</p></div><div className="bg-white p-3"><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#8993a0]">Working set</p><p className="mt-1 font-semibold tracking-[-0.04em]">{algorithm.memory}</p></div></div><div className="mt-5 flex flex-wrap items-center gap-2"><button onClick={() => onSetActive(algorithm.id)} className="rounded-lg bg-[#101827] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#202c3d]">Use in workspace</button><button onClick={() => onToggleCompare(algorithm.id)} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${compareIds.includes(algorithm.id) ? "border-[#b6c6fb] bg-[#e7edff] text-[#2147cb]" : "border-[#d7ddd5] bg-white text-[#485568] hover:border-[#aeb8c7]"}`}>{compareIds.includes(algorithm.id) ? "In comparison" : "Add to compare"}</button>{algorithm.origin === "Library" && <button onClick={() => onRemove(algorithm)} className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-[#b4473e] transition hover:bg-[#fff0ed]"><Trash2 size={14} /> Remove</button>}</div></article>)}</section></>;
}

function CompareWorkspace({ algorithms, compareIds, activeId, onToggle, onSetActive, onLibrary }: { algorithms: StoredAlgorithm[]; compareIds: string[]; activeId: string; onToggle: (id: string) => void; onSetActive: (id: string) => void; onLibrary: () => void }) {
  const selected = algorithms.filter(algorithm => compareIds.includes(algorithm.id));
  const maxPeak = Math.max(1, ...selected.map(algorithm => Number(algorithm.peak.replace("×", ""))));
  const routeNames = ["Single thread", "OpenMP", "SIMD", "GPU"];
  return <><section className="stage-enter plate-edge relative overflow-hidden rounded-2xl border border-[#d5dad2] bg-[#172130] p-5 text-white sm:p-7"><img src="/manus-storage/computearena-cuda-accelerator_d2582af3.png" alt="Abstract compute accelerator" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-screen" /><div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><SectionEyebrow number="CMP" label="Operational compare mode" /><h1 className="mt-4 text-3xl font-semibold tracking-[-0.065em] sm:text-4xl">Test the performance claim.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#c3cbd5]">Select saved algorithms below, then compare their execution routes, peak acceleration, and system use side by side.</p></div><div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"><p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#9facbb]">Selected for comparison</p><p className="mt-1 text-2xl font-semibold tracking-[-0.05em]">{selected.length.toString().padStart(2, "0")}</p></div></div></section><section className="mt-7 grid gap-6 2xl:grid-cols-[330px_minmax(0,1fr)]"><aside className="signal-card plate-edge rounded-2xl border border-[#d5dad2] bg-[#fcfcf9] p-5"><div className="flex items-center justify-between"><div><SectionEyebrow number="A" label="Algorithm set" /><h2 className="mt-3 text-lg font-semibold tracking-[-0.045em]">Choose evidence</h2></div><button onClick={onLibrary} className="text-xs font-semibold text-[#2147cb]">Manage</button></div><div className="mt-5 space-y-2">{algorithms.map(algorithm => <button key={algorithm.id} onClick={() => onToggle(algorithm.id)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${compareIds.includes(algorithm.id) ? "border-[#b9c9fb] bg-[#eef2ff]" : "border-[#e0e4dd] bg-white hover:border-[#bfc8d5]"}`}><span className={`grid h-5 w-5 place-items-center rounded-md border ${compareIds.includes(algorithm.id) ? "border-[#2854e8] bg-[#2854e8] text-white" : "border-[#bfc7d1] bg-white text-transparent"}`}><CheckCircle2 size={13} /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-[#263244]">{algorithm.name}</span><span className="mt-0.5 block truncate font-mono text-[9px] text-[#7a8494]">{algorithm.workload}</span></span><span className="font-mono text-[10px] text-[#2854e8]">{algorithm.peak}</span></button>)}</div><p className="mt-5 border-t border-[#e2e5df] pt-4 font-mono text-[10px] leading-4 text-[#778393]">Comparison choices are retained in the current browser session. Create or remove saved definitions from the Algorithm library.</p></aside><div className="space-y-6">{selected.length === 0 ? <div className="signal-card rounded-2xl border border-dashed border-[#cbd3c9] bg-[#fcfcf9] p-10 text-center"><Database className="mx-auto text-[#8f9aa7]" size={28} /><h2 className="mt-4 text-lg font-semibold">Choose at least one algorithm.</h2><p className="mt-2 text-sm text-[#758092]">Use the selection rail to begin a hardware comparison.</p></div> : <><div className="signal-card plate-edge overflow-x-auto rounded-2xl border border-[#d5dad2] bg-[#fcfcf9]"><div className="min-w-[680px]"><div className="grid border-b border-[#e1e5df] bg-[#f5f6f2]" style={{ gridTemplateColumns: `180px repeat(${selected.length}, minmax(170px, 1fr))` }}><div className="p-4 font-mono text-[10px] uppercase tracking-[0.12em] text-[#778393]">Route / metric</div>{selected.map(algorithm => <div key={algorithm.id} className="border-l border-[#e1e5df] p-4"><div className="flex items-center justify-between gap-2"><span className="truncate text-xs font-semibold text-[#263244]">{algorithm.name}</span>{activeId === algorithm.id && <span className="font-mono text-[8px] text-[#2854e8]">ACTIVE</span>}</div><p className="mt-1 font-mono text-[9px] text-[#7b8696]">{algorithm.workload}</p></div>)}</div>{routeNames.map((name, routeIndex) => <div key={name} className="grid border-b border-[#e8ebe6] last:border-0" style={{ gridTemplateColumns: `180px repeat(${selected.length}, minmax(170px, 1fr))` }}><div className="flex items-center gap-2 p-4"><span className="h-2 w-2 rounded-sm" style={{ backgroundColor: ["#1c2637", "#2854e8", "#7056b6", "#d77a43"][routeIndex] }} /><span className="text-xs font-semibold text-[#364253]">{name}</span></div>{selected.map(algorithm => { const route = algorithm.routes.find(item => item.name === name) || algorithm.routes[routeIndex]; return <div key={algorithm.id} className="border-l border-[#e8ebe6] p-4"><div className="flex items-end justify-between gap-3"><span className="font-mono text-sm font-medium text-[#273243]">{route.time.toLocaleString()} ms</span><span className="font-mono text-[10px]" style={{ color: route.color }}>{route.speedup.toFixed(2)}×</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#edf0ec]"><div className="h-full rounded-full" style={{ width: `${Math.max(5, route.speedup / Number(algorithm.peak.replace("×", "")) * 100)}%`, backgroundColor: route.color }} /></div></div>})}</div>)}</div></div><div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(310px,0.85fr)]"><div className="signal-card plate-edge rounded-2xl border border-[#d5dad2] bg-[#fcfcf9] p-5"><div className="flex items-end justify-between gap-4"><div><SectionEyebrow number="B" label="Peak acceleration" /><h2 className="mt-3 text-lg font-semibold tracking-[-0.045em]">Normalize the winning route.</h2></div><span className="font-mono text-[10px] text-[#778393]">GPU / scalar</span></div><div className="mt-6 space-y-5">{selected.map(algorithm => { const peak = Number(algorithm.peak.replace("×", "")); return <div key={algorithm.id}><div className="mb-2 flex items-center justify-between gap-4"><span className="truncate text-xs font-semibold text-[#3b4758]">{algorithm.name}</span><span className="font-mono text-sm font-medium text-[#d77a43]">{algorithm.peak}</span></div><div className="h-3 overflow-hidden rounded-full bg-[#f0f1ee]"><div className="h-full rounded-full bg-[#d77a43] transition-all duration-500" style={{ width: `${peak / maxPeak * 100}%` }} /></div></div>})}</div></div><div className="signal-card plate-edge rounded-2xl border border-[#d5dad2] bg-[#fcfcf9] p-5"><SectionEyebrow number="C" label="Selection actions" /><h2 className="mt-3 text-lg font-semibold tracking-[-0.045em]">Carry a result forward.</h2><p className="mt-2 text-xs leading-5 text-[#6f7b8a]">Promote an algorithm to the active workspace to inspect its detailed evidence.</p><div className="mt-5 space-y-2">{selected.map(algorithm => <button key={algorithm.id} onClick={() => onSetActive(algorithm.id)} className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-xs font-semibold transition ${activeId === algorithm.id ? "border-[#b6c6fb] bg-[#e7edff] text-[#2147cb]" : "border-[#e0e4dd] bg-white text-[#465367] hover:border-[#aeb8c7]"}`}><span>{algorithm.name}</span><ChevronRight size={15} /></button>)}</div></div></div></>}</div></section></>;
}

export default function Home() {
  const [algorithms, setAlgorithms] = useState<StoredAlgorithm[]>(loadAlgorithms);
  const [selectedId, setSelectedId] = useState("matrix-multiplication");
  const [compareIds, setCompareIds] = useState<string[]>(["matrix-multiplication", "parallel-sorting"]);
  const [activeNav, setActiveNav] = useState("Overview");
  const [isReportGenerated, setIsReportGenerated] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [form, setForm] = useState<AlgorithmForm>(emptyForm);
  const selected = algorithms.find(algorithm => algorithm.id === selectedId) || algorithms[0];

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(algorithms)); }, [algorithms]);

  const comparisonCount = useMemo(() => algorithms.filter(algorithm => compareIds.includes(algorithm.id)).length, [algorithms, compareIds]);

  const navigate = (label: string) => {
    if (label === "Reports") { toast.info("The report packet remains available from Overview."); return; }
    setActiveNav(label);
  };

  const setActiveAlgorithm = (id: string) => {
    setSelectedId(id);
    setActiveNav("Overview");
    const algorithm = algorithms.find(item => item.id === id);
    if (algorithm) toast.success(`${algorithm.name} is now active in the workspace.`);
  };

  const toggleComparison = (id: string) => setCompareIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);

  const generateReport = () => {
    setIsReportGenerated(true);
    toast.success("Report draft generated", { description: `${selected.name} evidence packet is ready to review.` });
  };

  const startRun = () => toast("Benchmark run queued", { description: `${selected.shortName} has been staged with the selected compute paths.` });

  const createAlgorithm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || !form.workload.trim() || !form.descriptor.trim()) {
      toast.error("Add a name, workload, and brief algorithm description first.");
      return;
    }
    const baseline = Math.max(1, Number(form.baseline) || 1000);
    const gpuTime = Math.max(1, Number(form.gpuTime) || Math.round(baseline / 16));
    const gpuSpeedup = Number((baseline / gpuTime).toFixed(2));
    const id = `library-${Date.now()}`;
    const abbreviation = form.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 5).toUpperCase() || "ALGO";
    const customAlgorithm: StoredAlgorithm = {
      id,
      origin: "Library",
      name: form.name.trim(),
      shortName: abbreviation,
      workload: form.workload.trim(),
      descriptor: form.descriptor.trim(),
      peak: `${gpuSpeedup.toFixed(2)}×`,
      throughput: "Custom profile",
      memory: "Profile on run",
      cpu: "Pending run",
      gpu: "Pending run",
      scale: [
        { label: "1×", speedup: Number((gpuSpeedup * 0.24).toFixed(2)) },
        { label: "2×", speedup: Number((gpuSpeedup * 0.51).toFixed(2)) },
        { label: "4×", speedup: Number((gpuSpeedup * 0.79).toFixed(2)) },
        { label: "8×", speedup: gpuSpeedup },
        { label: "16×", speedup: Number((gpuSpeedup * 0.93).toFixed(2)) },
      ],
      routes: [
        { name: "Single thread", implementation: "C++ · reference", time: baseline, speedup: 1, efficiency: "—", utilization: "1 core", color: "#1c2637", accent: "#dfe4dc" },
        { name: "OpenMP", implementation: "C++ · thread pool", time: Math.round(baseline / 4.8), speedup: 4.8, efficiency: "40.0%", utilization: "Profile on run", color: "#2854e8", accent: "#e7edff" },
        { name: "SIMD", implementation: "AVX · vector lanes", time: Math.round(baseline / 7.1), speedup: 7.1, efficiency: "44.4%", utilization: "Profile on run", color: "#7056b6", accent: "#eeeaff" },
        { name: "GPU", implementation: "CUDA · custom kernel", time: gpuTime, speedup: gpuSpeedup, efficiency: "Pending run", utilization: "Profile on run", color: "#d77a43", accent: "#fff0e8" },
      ],
    };
    setAlgorithms(current => [customAlgorithm, ...current]);
    setSelectedId(id);
    setCompareIds(current => [id, ...current.filter(item => item !== id)].slice(0, 4));
    setLibraryOpen(false);
    setForm(emptyForm);
    setActiveNav("Experiments");
    toast.success("Algorithm saved to the library", { description: `${customAlgorithm.name} is ready to select or compare.` });
  };

  const removeAlgorithm = (algorithm: StoredAlgorithm) => {
    if (algorithm.origin === "Seeded") { toast.info("Seeded reference algorithms are retained in this prototype."); return; }
    setAlgorithms(current => current.filter(item => item.id !== algorithm.id));
    setCompareIds(current => current.filter(item => item !== algorithm.id));
    if (selectedId === algorithm.id) setSelectedId("matrix-multiplication");
    toast.success(`${algorithm.name} was removed from the library.`);
  };

  return <div className="min-h-screen bg-[#f5f6f2] text-[#101827]"><div className="flex min-h-screen"><aside className="sticky top-0 hidden h-screen w-[244px] shrink-0 flex-col border-r border-[#d9ded6] bg-[#fbfcf9] px-4 py-5 lg:flex"><div className="flex items-center gap-2.5 px-2"><img src="/manus-storage/computearena-execution-glyph_7ed0a066.png" alt="ComputeArena execution glyph" className="h-9 w-9 object-contain" /><div><div className="flex items-baseline gap-1 text-[#101827]"><span className="font-mono text-[9px] font-medium uppercase tracking-[0.18em]">Compute</span><span className="text-[16px] font-bold tracking-[-0.1em]">ARENA</span></div><div className="mt-0.5 flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.17em] text-[#788395]"><LaneMotif className="scale-[0.75] origin-left" /> Benchmark lab</div></div></div><button onClick={() => { setActiveNav("Experiments"); setLibraryOpen(true); }} className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2854e8] px-4 py-3 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(40,84,232,0.22)] transition duration-150 hover:-translate-y-0.5 hover:bg-[#234bd0] active:scale-[0.97]"><Plus size={16} /> Add algorithm</button><nav className="mt-8 space-y-1.5" aria-label="Primary navigation"><p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8b94a2]">Workspace</p>{navItems.map(({ label, icon: Icon }) => <button key={label} onClick={() => navigate(label)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${activeNav === label ? "bg-[#e7edff] text-[#2147cb]" : "text-[#5e6a7b] hover:bg-[#f0f2ed] hover:text-[#101827]"}`}><Icon size={17} strokeWidth={activeNav === label ? 2.3 : 1.8} /> {label}{label === "Compare" && <span className="ml-auto rounded bg-[#f1f2ef] px-1.5 py-0.5 font-mono text-[9px] text-[#7a8494]">{comparisonCount.toString().padStart(2, "0")}</span>}</button>)}</nav><div className="mt-8 border-t border-[#e1e4dd] pt-6"><p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8b94a2]">Toolkit</p><button onClick={() => toast.info("Hardware pool inspector is coming next.")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#5e6a7b] transition hover:bg-[#f0f2ed] hover:text-[#101827]"><Cpu size={17} /> Hardware pool</button><button onClick={() => toast.info("Configuration inspector is coming next.")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#5e6a7b] transition hover:bg-[#f0f2ed] hover:text-[#101827]"><Settings2 size={17} /> Run settings</button></div><div className="mt-auto overflow-hidden rounded-2xl border border-[#dce1d9] bg-[#f4f6f1] p-3.5"><div className="flex items-center gap-2"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#45a479] opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[#45a479]" /></span><span className="font-mono text-[10px] font-medium text-[#405565]">Library stored locally</span></div><p className="mt-2.5 font-mono text-[10px] leading-4 text-[#778393]">{algorithms.length} definitions · browser storage<br />x86_64 · 12 cores</p></div></aside><main className="min-w-0 flex-1"><header className="flex h-[73px] items-center justify-between border-b border-[#d9ded6] bg-[#fbfcf9]/95 px-4 backdrop-blur sm:px-7 xl:px-10"><div className="flex min-w-0 items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl border border-[#dce1d9] bg-white lg:hidden"><img src="/manus-storage/computearena-execution-glyph_7ed0a066.png" alt="ComputeArena" className="h-6 w-6 object-contain" /></div><div className="hidden items-center gap-2 sm:flex"><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#7a8494]">Workspace</span><ChevronRight size={13} className="text-[#a3adba]" /><span className="text-sm font-medium text-[#273243]">{activeNav === "Experiments" ? "Algorithm library" : activeNav}</span></div><div className="relative ml-0 hidden w-[230px] lg:block"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8993a1]" /><input aria-label="Search experiments" placeholder="Find an algorithm" className="h-9 w-full rounded-lg border border-[#dde1da] bg-[#f6f7f4] pl-9 pr-3 text-xs outline-none transition placeholder:text-[#949eab] focus:border-[#7e9cf2] focus:bg-white" /></div></div><div className="flex items-center gap-2 sm:gap-3"><button onClick={() => toast.info("No new cluster notifications.")} aria-label="Notifications" className="relative grid h-9 w-9 place-items-center rounded-lg border border-[#dde1da] bg-white text-[#566173] transition hover:-translate-y-0.5 hover:border-[#bdc5d3]"><Bell size={16} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#2854e8]" /></button><button onClick={generateReport} className="hidden items-center gap-2 rounded-lg border border-[#d6dcd3] bg-white px-3 py-2 text-xs font-semibold text-[#273243] transition hover:-translate-y-0.5 hover:border-[#aeb8c7] sm:flex"><FileText size={15} /> Generate report</button><button onClick={startRun} className="flex items-center gap-2 rounded-lg bg-[#101827] px-3 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#202c3d] active:scale-[0.97]"><Play size={14} fill="currentColor" /> Run selected</button></div></header><div className="mx-auto max-w-[1560px] px-4 py-7 sm:px-7 lg:px-8 xl:px-10 xl:py-9">{activeNav === "Overview" && <OverviewWorkspace selected={selected} algorithms={algorithms} onSelect={setSelectedId} onCompare={() => setActiveNav("Compare")} onLibrary={() => setActiveNav("Experiments")} reportGenerated={isReportGenerated} onGenerateReport={generateReport} onStartRun={startRun} />}{activeNav === "Experiments" && <AlgorithmLibraryWorkspace algorithms={algorithms} activeId={selected.id} compareIds={compareIds} onSetActive={setActiveAlgorithm} onToggleCompare={toggleComparison} onRemove={removeAlgorithm} onCreate={() => setLibraryOpen(true)} />}{activeNav === "Compare" && <CompareWorkspace algorithms={algorithms} compareIds={compareIds} activeId={selected.id} onToggle={toggleComparison} onSetActive={setActiveAlgorithm} onLibrary={() => setActiveNav("Experiments")} />}<section className="mt-8 border-t border-[#d9ded6] py-5"><div className="flex flex-col justify-between gap-3 font-mono text-[10px] text-[#778393] sm:flex-row sm:items-center"><span><b className="font-medium text-[#4d596a]">NOTE:</b> Custom library definitions persist in this browser. Their metrics are prototype estimates until a benchmark runner is connected.</span><button onClick={() => toast.info("Sharing is prepared once experiment storage and API routes are connected.")} className="inline-flex items-center gap-1.5 self-start font-medium text-[#2854e8] hover:text-[#1737ae]">Share workspace <ArrowUpRight size={12} /></button></div></section></div></main></div><Dialog open={libraryOpen} onOpenChange={setLibraryOpen}><DialogContent className="max-h-[92vh] overflow-y-auto border-[#d5dad2] bg-[#fcfcf9] p-5 sm:max-w-[610px] sm:p-7"><DialogHeader><SectionEyebrow number="NEW" label="Library definition" /><DialogTitle className="mt-3 text-2xl tracking-[-0.055em]">Add an algorithm to the lab.</DialogTitle><DialogDescription className="max-w-lg leading-5 text-[#6d7888]">Set a workload and reference timings. The app derives comparative placeholder routes and keeps this definition in browser storage for later selection.</DialogDescription></DialogHeader><form onSubmit={createAlgorithm} className="mt-2 space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="block sm:col-span-2"><span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[#697587]">Algorithm name</span><input value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} placeholder="e.g. Breadth-first search" className="mt-1.5 h-10 w-full rounded-lg border border-[#d7ddd5] bg-white px-3 text-sm outline-none transition placeholder:text-[#9aa3ad] focus:border-[#7d9cf2]" /></label><label className="block sm:col-span-2"><span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[#697587]">Workload</span><input value={form.workload} onChange={event => setForm(current => ({ ...current, workload: event.target.value }))} placeholder="e.g. 10M edges · CSR graph" className="mt-1.5 h-10 w-full rounded-lg border border-[#d7ddd5] bg-white px-3 text-sm outline-none transition placeholder:text-[#9aa3ad] focus:border-[#7d9cf2]" /></label><label className="block sm:col-span-2"><span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[#697587]">Benchmark description</span><textarea value={form.descriptor} onChange={event => setForm(current => ({ ...current, descriptor: event.target.value }))} placeholder="Describe the implementation or input distribution." className="mt-1.5 min-h-20 w-full resize-y rounded-lg border border-[#d7ddd5] bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-[#9aa3ad] focus:border-[#7d9cf2]" /></label><label className="block"><span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[#697587]">Scalar reference (ms)</span><input type="number" min="1" value={form.baseline} onChange={event => setForm(current => ({ ...current, baseline: event.target.value }))} className="mt-1.5 h-10 w-full rounded-lg border border-[#d7ddd5] bg-white px-3 text-sm outline-none transition focus:border-[#7d9cf2]" /></label><label className="block"><span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[#697587]">CUDA estimate (ms)</span><input type="number" min="1" value={form.gpuTime} onChange={event => setForm(current => ({ ...current, gpuTime: event.target.value }))} className="mt-1.5 h-10 w-full rounded-lg border border-[#d7ddd5] bg-white px-3 text-sm outline-none transition focus:border-[#7d9cf2]" /></label></div><div className="rounded-lg border border-[#dce3f8] bg-[#f1f4ff] p-3 font-mono text-[10px] leading-4 text-[#4660ad]">Derived OpenMP and SIMD values are estimates for comparison layout. Replace them with benchmark-runner results when a backend is connected.</div><DialogFooter className="pt-1"><button type="button" onClick={() => setLibraryOpen(false)} className="rounded-lg border border-[#d7ddd5] bg-white px-4 py-2.5 text-xs font-semibold text-[#4d596b]">Cancel</button><button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2854e8] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#234bd0]"><Database size={15} /> Save algorithm</button></DialogFooter></form></DialogContent></Dialog></div>;
}
