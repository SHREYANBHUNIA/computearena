# ComputeArena Design Directions

## Three stylistic approaches

| Theme Name | Very Brief Intro | Probability |
| --- | --- | --- |
| Signal Room | A quiet, light-mode technical workspace with warm paper-like surfaces and cobalt data signals. It favors editorial clarity over a typical dark operations console. | 0.071 |
| Thermal Grid | A dense observability instrument inspired by lab readouts, terminal traces, and high-contrast scientific notation. It uses dark graphite, hot orange, and technical scan lines. | 0.048 |
| Field Notebook | A research-journal interface with restrained ivory panels, ink-black typography, and bright annotation colors. Results feel like a polished experimental record rather than a generic admin dashboard. | 0.083 |

## Chosen approach: Signal Room

### Design Movement

**Editorial scientific computing** — a refined synthesis of modern research software, Swiss information design, and equipment-room instrumentation.

### Core Principles

1. **Evidence before decoration:** metrics, comparisons, and active experiment state receive the strongest visual emphasis.
2. **Intentional asymmetry:** the persistent control rail anchors the interface while the canvas can breathe and vary by task.
3. **Calm technical materiality:** off-white surfaces, graphite rules, and only a few intense signal colors prevent visual noise.
4. **Legible density:** labels are compact and monospace-adjacent; primary values are large, spacious, and immediately scannable.

### Color Philosophy

The foundation is near-black navy ink on a cool pearl background, making the dashboard feel like a calibrated instrument rather than entertainment software. A proprietary **Arena Cobalt** gives actions and CPU states a confident, precise identity; spectral violet identifies SIMD acceleration; copper is reserved for GPU results; soft chart greens indicate sustainable or favorable efficiency. Color always conveys a benchmark modality or state, never incidental decoration.

### Layout Paradigm

The product uses an **instrument panel rail**: a compact vertical navigation spine on the left, a main analytical canvas, and a variable right-side field for experiment configuration or contextual notes. The page is assembled from differently proportioned analytical plates rather than repetitive card grids.

### Signature Elements

1. A small **four-lane execution glyph** — bars branching from one input to CPU, threads, vector lanes, and GPU.
2. Thin **calibration rulers** with numeric ticks at the edges of primary data regions.
3. A subtle **dot-matrix field** in empty canvas space, echoing compute units without becoming a decorative background.

### Interaction Philosophy

Interactions feel like operating test equipment: selection changes are immediate, clear, and confirmed by a small status pulse. Controls are direct, labeled, and calm; disabled or future workflow controls explicitly explain their status rather than pretending to work.

### Animation

Motion is short and data-led. Panels enter through a 160–220 ms opacity-and-translate cascade, selected benchmark bars grow along their x-axis, and metric values use a restrained count-up transition only when the selected experiment changes. Hover states lift by 1–2 px with a crisp 160 ms custom ease. All nonessential motion is removed under reduced-motion preferences.

### Typography System

**Space Grotesk** is used for analytical headings and prominent values because its geometric structure feels engineered, while **DM Mono** provides run metadata, units, implementation labels, and code-adjacent details. Headlines use compact tracking and deliberate line breaks; tables retain a dense, highly readable numeric rhythm.

### Brand Essence

**ComputeArena is the experiment control room for engineers measuring how parallel hardware changes algorithmic performance.**

Personality: **precise, disciplined, exploratory**.

### Brand Voice

Headlines state the observed result; CTAs use an experimental verb. Microcopy is concise, concrete, and avoids empty platform language.

> “Make the hardware argument with evidence.”

> “Compare execution paths.”

### Wordmark & Logo

The mark is a **four-lane execution glyph**: one square input splits into four rising bars, creating a compact, nonverbal symbol of accelerating compute paths. The wordmark uses a custom-looking wide Space Grotesk treatment with the “A” counter cut as a narrow terminal arrow.

### Signature Brand Color

**Arena Cobalt — #2854E8**. A focused, unmistakable blue that signals an active computation or selected experimental condition.

## Implementation Notes

- The initial prototype contains illustrative, clearly labeled benchmark data for interaction and visualization design; it does not claim to execute local C++, CUDA, or profiler workloads.
- The main dashboard should surface matrix multiplication on a controlled 4096 × 4096 workload, with implementation routes: Baseline CPU, OpenMP, AVX-512 SIMD, and CUDA GPU.
- Core product pathways are Overview, Experiments, Compare, Reports, and Settings. The first delivery builds the Overview workspace with usable filters and report preview behavior.

## Style Decisions

- The four-lane execution glyph is a system motif, echoed in all major analytical-region labels as a compact execution-path calibration mark.
- Analytical plates use graphite rules, shallow corners, calibration ticks, and deliberately varied proportions in preference to soft, generic product-card styling.
- Every large canvas must foreground a data trace, calibration structure, or explicitly labeled experimental observation so evidence remains more prominent than decoration.
