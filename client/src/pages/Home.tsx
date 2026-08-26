/**
 * ComputeArena — Signal Room design reminder
 * This workspace uses an instrument-panel rail and analytical plates rather than
 * a repetitive card grid. Keep all colors semantically tied to a compute path.
 */
import { useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock3,
  Cpu,
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
  Zap,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

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

const benchmarks: BenchmarkSet[] = [
  {
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

function MetricPlate({ label, value, note, icon: Icon, tone = "blue" }: { label: string; value: string; note: string; icon: typeof Zap; tone?: "blue" | "violet" | "copper" | "graphite" }) {
  const toneMap = {
    blue: "bg-[#e7edff] text-[#2854e8]",
    violet: "bg-[#eeeaff] text-[#7056b6]",
    copper: "bg-[#fff0e8] text-[#c76832]",
    graphite: "bg-[#edf0ec] text-[#1c2637]",
  };
  return (
    <div className="metric-surface signal-card plate-edge relative overflow-hidden rounded-xl border border-[#d5dad2] p-4 sm:p-5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[#657082]">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-xl ${toneMap[tone]}`}><Icon size={16} strokeWidth={2} /></span>
      </div>
      <div className="font-sans text-2xl font-semibold tracking-[-0.05em] text-[#101827] sm:text-[27px]">{value}</div>
      <p className="mt-1 font-mono text-[10px] leading-4 text-[#7a8494]">{note}</p>
      <div className="calibration-rule absolute bottom-2 left-4 right-4 h-px opacity-35" />
    </div>
  );
}

function LaneMotif({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`inline-flex h-3.5 items-end gap-[2px] ${className}`}><i className="block h-[4px] w-[2px] bg-[#1c2637]" /><i className="block h-[7px] w-[2px] bg-[#2854e8]" /><i className="block h-[10px] w-[2px] bg-[#7056b6]" /><i className="block h-[13px] w-[2px] bg-[#d77a43]" /></span>;
}

function SectionEyebrow({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <LaneMotif />
      <span className="font-mono text-[10px] text-[#2854e8]">{number}</span>
      <span className="h-px w-5 bg-[#aab5c6]" />
      <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[#657082]">{label}</span>
    </div>
  );
}

export default function Home() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeNav, setActiveNav] = useState("Overview");
  const [isReportGenerated, setIsReportGenerated] = useState(false);
  const selected = benchmarks[selectedIndex];
  const gpuRoute = selected.routes[selected.routes.length - 1];
  const fastestRoute = useMemo(() => selected.routes.reduce((fastest, route) => route.time < fastest.time ? route : fastest), [selected]);

  const generateReport = () => {
    setIsReportGenerated(true);
    toast.success("Report draft generated", { description: `${selected.name} evidence packet is ready to review.` });
  };

  const startRun = () => {
    toast("Benchmark run queued", { description: `${selected.shortName} has been staged with the selected compute paths.` });
  };

  return (
    <div className="min-h-screen bg-[#f5f6f2] text-[#101827]">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-[244px] shrink-0 flex-col border-r border-[#d9ded6] bg-[#fbfcf9] px-4 py-5 lg:flex">
          <div className="flex items-center gap-2.5 px-2">
            <img src="/manus-storage/computearena-execution-glyph_7ed0a066.png" alt="ComputeArena execution glyph" className="h-9 w-9 object-contain" />
            <div>
              <div className="flex items-baseline gap-1 text-[#101827]"><span className="font-mono text-[9px] font-medium uppercase tracking-[0.18em]">Compute</span><span className="text-[16px] font-bold tracking-[-0.1em]">ARENA</span></div>
              <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.17em] text-[#788395]"><LaneMotif className="scale-[0.75] origin-left" /> Benchmark lab</div>
            </div>
          </div>

          <button onClick={startRun} className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2854e8] px-4 py-3 text-sm font-semibold text-white shadow-[0_7px_18px_rgba(40,84,232,0.22)] transition duration-150 hover:-translate-y-0.5 hover:bg-[#234bd0] active:scale-[0.97]">
            <Plus size={16} /> New experiment
          </button>

          <nav className="mt-8 space-y-1.5" aria-label="Primary navigation">
            <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8b94a2]">Workspace</p>
            {navItems.map(({ label, icon: Icon }) => (
              <button key={label} onClick={() => { setActiveNav(label); if (label !== "Overview") toast.info(`${label} workspace is staged for the next iteration.`); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${activeNav === label ? "bg-[#e7edff] text-[#2147cb]" : "text-[#5e6a7b] hover:bg-[#f0f2ed] hover:text-[#101827]"}`}>
                <Icon size={17} strokeWidth={activeNav === label ? 2.3 : 1.8} /> {label}
                {label === "Reports" && <span className="ml-auto rounded bg-[#f1f2ef] px-1.5 py-0.5 font-mono text-[9px] text-[#7a8494]">04</span>}
              </button>
            ))}
          </nav>

          <div className="mt-8 border-t border-[#e1e4dd] pt-6">
            <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8b94a2]">Toolkit</p>
            <button onClick={() => toast.info("Hardware pool inspector is coming next.")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#5e6a7b] transition hover:bg-[#f0f2ed] hover:text-[#101827]"><Cpu size={17} /> Hardware pool</button>
            <button onClick={() => toast.info("Configuration inspector is coming next.")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#5e6a7b] transition hover:bg-[#f0f2ed] hover:text-[#101827]"><Settings2 size={17} /> Run settings</button>
          </div>

          <div className="mt-auto overflow-hidden rounded-2xl border border-[#dce1d9] bg-[#f4f6f1] p-3.5">
            <div className="flex items-center gap-2"><span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#45a479] opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[#45a479]" /></span><span className="font-mono text-[10px] font-medium text-[#405565]">Cluster reachable</span></div>
            <p className="mt-2.5 font-mono text-[10px] leading-4 text-[#778393]">x86_64 · 12 cores<br />RTX 4090 · CUDA 12.4</p>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="flex h-[73px] items-center justify-between border-b border-[#d9ded6] bg-[#fbfcf9]/95 px-4 backdrop-blur sm:px-7 xl:px-10">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl border border-[#dce1d9] bg-white lg:hidden"><img src="/manus-storage/computearena-execution-glyph_7ed0a066.png" alt="ComputeArena" className="h-6 w-6 object-contain" /></div>
              <div className="hidden items-center gap-2 sm:flex"><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#7a8494]">Workspace</span><ChevronRight size={13} className="text-[#a3adba]" /><span className="text-sm font-medium text-[#273243]">Overview</span></div>
              <div className="relative ml-0 hidden w-[230px] lg:block"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8993a1]" /><input aria-label="Search experiments" placeholder="Find an experiment" className="h-9 w-full rounded-lg border border-[#dde1da] bg-[#f6f7f4] pl-9 pr-3 text-xs outline-none transition placeholder:text-[#949eab] focus:border-[#7e9cf2] focus:bg-white" /></div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={() => toast.info("No new cluster notifications.")} aria-label="Notifications" className="relative grid h-9 w-9 place-items-center rounded-lg border border-[#dde1da] bg-white text-[#566173] transition hover:-translate-y-0.5 hover:border-[#bdc5d3]"><Bell size={16} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#2854e8]" /></button>
              <button onClick={generateReport} className="hidden items-center gap-2 rounded-lg border border-[#d6dcd3] bg-white px-3 py-2 text-xs font-semibold text-[#273243] transition hover:-translate-y-0.5 hover:border-[#aeb8c7] sm:flex"><FileText size={15} /> Generate report</button>
              <button onClick={startRun} className="flex items-center gap-2 rounded-lg bg-[#101827] px-3 py-2 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#202c3d] active:scale-[0.97]"><Play size={14} fill="currentColor" /> Run selected</button>
            </div>
          </header>

          <div className="mx-auto max-w-[1560px] px-4 py-7 sm:px-7 lg:px-8 xl:px-10 xl:py-9">
            <section className="stage-enter plate-edge relative overflow-hidden rounded-2xl border border-[#d5dad2] bg-[#fbfcf9] p-5 sm:p-7 lg:p-8">
              <img src="/manus-storage/computearena-research-surface_9f93e679.png" alt="Abstract ComputeArena research surface" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-multiply" />
              <div className="pointer-events-none absolute bottom-0 right-10 top-0 w-px bg-gradient-to-b from-transparent via-[#cfd6cd] to-transparent" />
              <div className="relative flex flex-col justify-between gap-7 xl:flex-row xl:items-end">
                <div className="max-w-2xl">
                  <SectionEyebrow number="01" label="Active experiment" />
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold tracking-[-0.065em] text-[#101827] sm:text-4xl xl:text-[46px]">{selected.name}</h1>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cce4d5] bg-[#eff9f2] px-2.5 py-1 font-mono text-[10px] font-medium text-[#237a4e]"><CheckCircle2 size={12} /> completed</span>
                  </div>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-[#657082]">Measure one workload across an equivalent baseline, threaded, vectorized, and CUDA implementation. Inspect the strongest execution path before you commit the next run.</p>
                  <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[10px] text-[#697688]"><span>RUN <b className="font-medium text-[#202b3a]">CA-2026-084</b></span><span>COMPILED <b className="font-medium text-[#202b3a]">GCC 14.1</b></span><span>REPETITIONS <b className="font-medium text-[#202b3a]">30</b></span></div>
                </div>
                <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                  <div className="rounded-xl border border-[#d8ddd5] bg-white/80 px-3.5 py-2.5 backdrop-blur"><span className="block font-mono text-[9px] uppercase tracking-[0.12em] text-[#8791a0]">Workload</span><span className="mt-1 block text-xs font-semibold text-[#293547]">{selected.workload}</span></div>
                  <button onClick={() => toast.info("Hardware and compiler evidence added to the report draft.")} className="inline-flex items-center gap-2 rounded-xl border border-[#d8ddd5] bg-white/80 px-3.5 py-3 text-xs font-semibold text-[#394456] backdrop-blur transition hover:-translate-y-0.5"><MoreHorizontal size={15} /> Evidence</button>
                </div>
              </div>
            </section>

            <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricPlate label="Best execution time" value={`${fastestRoute.time} ms`} note={`${fastestRoute.name} · median of 30 runs`} icon={Clock3} tone="copper" />
              <MetricPlate label="Peak speedup" value={selected.peak} note="relative to scalar reference" icon={Zap} tone="blue" />
              <MetricPlate label="Sustained throughput" value={selected.throughput} note="best observed measurement" icon={Gauge} tone="violet" />
              <MetricPlate label="Working set" value={selected.memory} note="peak resident memory" icon={HardDrive} tone="graphite" />
            </section>

            <section className="mt-8 grid gap-6 2xl:grid-cols-[minmax(0,1.6fr)_minmax(310px,0.7fr)]">
              <div className="signal-card plate-edge rounded-2xl border border-[#d5dad2] bg-[#fcfcf9] p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <SectionEyebrow number="02" label="Execution paths" />
                    <h2 className="mt-3 text-xl font-semibold tracking-[-0.045em]">One algorithm, four hardware arguments.</h2>
                    <p className="mt-1.5 text-xs leading-5 text-[#6a7686]">Median elapsed time · lower is better · normalized performance shown at right.</p>
                  </div>
                  <div className="flex items-center gap-2 self-start rounded-lg border border-[#dde1da] bg-[#f5f6f2] p-1">
                    {benchmarks.map((benchmark, index) => <button key={benchmark.shortName} onClick={() => setSelectedIndex(index)} className={`rounded-md px-2.5 py-1.5 font-mono text-[10px] transition ${selectedIndex === index ? "bg-white text-[#2147cb] shadow-sm" : "text-[#7a8494] hover:text-[#273243]"}`}>{benchmark.shortName}</button>)}
                  </div>
                </div>

                <div className="mt-6 divide-y divide-[#e2e5df]">
                  {selected.routes.map((route, index) => (
                    <div key={route.name} className="grid gap-3 py-4 first:pt-0 sm:grid-cols-[172px_minmax(150px,1fr)_80px_70px] sm:items-center sm:gap-5">
                      <div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg" style={{ backgroundColor: route.accent, color: route.color }}>{index === 0 ? <Circle size={14} fill="currentColor" /> : index === 1 ? <GitBranch size={15} /> : index === 2 ? <Activity size={15} /> : <Cpu size={15} />}</span><div><p className="text-sm font-semibold text-[#253143]">{route.name}</p><p className="mt-0.5 font-mono text-[9px] text-[#7c8796]">{route.implementation}</p></div></div>
                      <div className="flex items-center gap-3"><div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#edf0ec]"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(6, route.speedup / gpuRoute.speedup * 100)}%`, backgroundColor: route.color }} /></div><span className="w-12 text-right font-mono text-[11px] font-medium text-[#394456]">{route.time.toLocaleString()} ms</span></div>
                      <div className="text-right"><p className="font-mono text-[15px] font-medium tracking-[-0.04em]" style={{ color: route.color }}>{route.speedup.toFixed(route.speedup === 1 ? 2 : 2)}×</p><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#8a94a2]">speedup</p></div>
                      <div className="hidden text-right sm:block"><p className="font-mono text-[11px] text-[#4e5b6c]">{route.utilization}</p><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#8a94a2]">util.</p></div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#e2e5df] pt-4">
                  <span className="font-mono text-[10px] text-[#7a8494]">METHODOLOGY: warm cache · pinned affinity · 95% CI &lt; 2.1%</span>
                  <button onClick={() => toast.info("Comparison view will include cross-algorithm normalization.")} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2147cb] transition hover:gap-2.5">Open compare mode <ArrowUpRight size={14} /></button>
                </div>
              </div>

              <aside className="signal-card relative overflow-hidden rounded-2xl border border-[#253348] bg-[#172130] p-5 text-white sm:p-6">
                <img src="/manus-storage/computearena-cuda-accelerator_d2582af3.png" alt="Abstract CUDA acceleration module" className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-screen" />
                <div className="relative">
                  <div className="flex items-center justify-between"><SectionEyebrow number="GPU" label="Fastest route" /><span className="rounded-full bg-[#d77a43]/20 px-2 py-1 font-mono text-[9px] text-[#ffc4a1]">CUDA</span></div>
                  <div className="mt-7"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#9facbb]">Winning configuration</p><h3 className="mt-2 text-2xl font-semibold tracking-[-0.055em]">{gpuRoute.implementation}</h3><p className="mt-2 max-w-xs text-xs leading-5 text-[#c3cbd5]">{selected.descriptor}. The accelerator route establishes the comparison envelope.</p></div>
                  <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10"><div className="bg-[#172130]/70 p-3"><p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#92a0af]">GPU util.</p><p className="mt-1.5 text-xl font-semibold tracking-[-0.05em]">{selected.gpu}</p></div><div className="bg-[#172130]/70 p-3"><p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#92a0af]">Efficiency</p><p className="mt-1.5 text-xl font-semibold tracking-[-0.05em]">{gpuRoute.efficiency}</p></div></div>
                  <button onClick={() => toast.info("CUDA source inspector is prepared for the next build stage.")} className="mt-7 flex w-full items-center justify-between rounded-xl bg-white px-3.5 py-3 text-left text-xs font-semibold text-[#172130] transition hover:-translate-y-0.5"><span className="flex items-center gap-2"><Terminal size={15} /> Inspect kernel evidence</span><ChevronRight size={15} /></button>
                </div>
              </aside>
            </section>

            <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(350px,0.65fr)]">
              <div className="signal-card plate-edge overflow-hidden rounded-2xl border border-[#d5dad2] bg-[#fcfcf9] p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><SectionEyebrow number="03" label="Scaling behavior" /><h2 className="mt-3 text-xl font-semibold tracking-[-0.045em]">Acceleration holds through the workload.</h2></div><div className="flex items-center gap-2 font-mono text-[10px] text-[#6e7a8a]"><span className="h-2 w-2 rounded-sm bg-[#2854e8]" /> peak speedup</div></div>
                <ChartContainer config={chartConfig} className="mt-4 h-[220px] w-full">
                  <AreaChart data={selected.scale} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
                    <defs><linearGradient id="speedup-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#2854e8" stopOpacity={0.24} /><stop offset="100%" stopColor="#2854e8" stopOpacity={0.01} /></linearGradient></defs>
                    <CartesianGrid vertical={false} stroke="#e1e5df" strokeDasharray="2 4" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} fontSize={10} fontFamily="DM Mono" />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={10} fontFamily="DM Mono" tickFormatter={(value) => `${value}×`} />
                    <Tooltip cursor={{ stroke: "#a4b6f8", strokeWidth: 1 }} content={<ChartTooltipContent indicator="line" formatter={(value) => <div className="flex w-full justify-between gap-8"><span className="text-muted-foreground">Speedup</span><span className="font-mono font-medium text-[#2147cb]">{Number(value).toFixed(2)}×</span></div>} />} />
                    <Area dataKey="speedup" type="monotone" stroke="#2147cb" strokeWidth={3} fill="url(#speedup-fill)" isAnimationActive={false} dot={{ r: 3.4, fill: "#fcfcf9", stroke: "#2147cb", strokeWidth: 2 }} activeDot={{ r: 4.5, fill: "#2147cb" }} />
                  </AreaChart>
                </ChartContainer>
                <div className="mt-1 grid gap-3 border-t border-[#e3e6e1] pt-3 sm:grid-cols-[1fr_auto] sm:items-end"><div className="flex items-center justify-between font-mono text-[10px] text-[#7a8494]"><span>PROBLEM SCALE</span><span>GPU / SCALAR RATIO</span></div><div className="rounded-md border border-[#cfd9fa] bg-[#f0f3ff] px-2.5 py-1.5 font-mono text-[10px] text-[#2147cb]"><b className="font-medium">OBSERVED:</b> peak at {selected.workload.split(" · ")[0]} · {selected.peak}</div></div>
              </div>

              <div className="signal-card plate-edge relative overflow-hidden rounded-2xl border border-[#d5dad2] bg-[#fcfcf9] p-5 sm:p-6">
                <img src="/manus-storage/computearena-vector-lanes_f214874b.png" alt="Abstract vector execution lanes" className="pointer-events-none absolute bottom-0 right-0 h-[58%] w-[75%] object-cover opacity-[0.08]" />
                <div className="relative"><div className="flex items-start justify-between gap-4"><div><SectionEyebrow number="04" label="Report packet" /><h2 className="mt-3 text-xl font-semibold tracking-[-0.045em]">{isReportGenerated ? "Draft is ready for review." : "Turn the run into evidence."}</h2></div><span className={`grid h-9 w-9 place-items-center rounded-xl ${isReportGenerated ? "bg-[#edf8f0] text-[#2f8c5d]" : "bg-[#e7edff] text-[#2854e8]"}`}>{isReportGenerated ? <CheckCircle2 size={17} /> : <Sparkles size={17} />}</span></div>
                  <p className="mt-3 max-w-sm text-xs leading-5 text-[#6c7787]">{isReportGenerated ? "The report has captured the winning route, methodology, and performance gap for this selected experiment." : "Bundle methodology, system information, raw timing, and the clearest comparative claim in one exportable lab record."}</p>
                  <div className="mt-5 space-y-2.5 rounded-xl border border-[#e0e4dd] bg-white/80 p-3.5"><div className="flex items-center justify-between font-mono text-[10px]"><span className="text-[#788393]">SYSTEM PROFILE</span><span className="text-[#2f8c5d]">included</span></div><div className="flex items-center justify-between font-mono text-[10px]"><span className="text-[#788393]">RAW SAMPLES</span><span className="text-[#2f8c5d]">30 / route</span></div><div className="flex items-center justify-between font-mono text-[10px]"><span className="text-[#788393]">FINDING</span><span className="text-[#2147cb]">{selected.peak} GPU peak</span></div></div>
                  <button onClick={generateReport} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2854e8] px-4 py-3 text-xs font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#234bd0] active:scale-[0.97]"><FileText size={15} /> {isReportGenerated ? "Refresh report draft" : "Generate report"}</button>
                </div>
              </div>
            </section>

            <section className="mt-8 border-t border-[#d9ded6] py-5"><div className="flex flex-col justify-between gap-3 font-mono text-[10px] text-[#778393] sm:flex-row sm:items-center"><span><b className="font-medium text-[#4d596a]">NOTE:</b> Prototype data is illustrative for dashboard interaction design; no local C++, CUDA, or profiler job has been executed.</span><button onClick={() => toast.info("Sharing is prepared once experiment storage and API routes are connected.")} className="inline-flex items-center gap-1.5 self-start font-medium text-[#2854e8] hover:text-[#1737ae]">Share workspace <ArrowUpRight size={12} /></button></div></section>
          </div>
        </main>
      </div>
    </div>
  );
}
