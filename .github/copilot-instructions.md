<!-- .github/copilot-instructions.md -->
# Repository tips for AI coding agents

This repository is a very small static web demo. The guidance below is tailored to the exact patterns and files present so an AI agent can be immediately productive.

**Big picture**
- **Single-page static app**: All logic lives in `index.html`. There is no backend, build system, or package manager here.
- **Purpose**: Reads a user-supplied Excel/CSV file client-side and renders a semester-wise line chart (uses SheetJS and Chart.js via CDNs).

**Key files / locations**
- `index.html`: app shell and mounts the UI; includes CDN references and links to the local `style.css` and `index.js` files.
- `index.js`: application logic — parsing, chart building, UI wiring. See `parseWorkbook`, `buildChart`, and drag/drop handlers here.
- `style.css`: visual styling and responsive layout.

**Important functions & patterns to inspect**
- `findHeaderRow(rows)` — heuristic for locating header row with SEM labels (in `index.js`).
- `parseWorkbook(workbook)` — canonical parser that returns `{semesters: string[], datasets: {id, values[]}[]}`.
- `buildChart(parsed)` — constructs the Chart.js `line` chart from parsed data and is responsible for dataset options.
- `resizeCanvas()` and the `window.resize` handler — keep canvas pixel sizing in sync with layout.
- Drag & drop: `fileDrop` element is wired to accept files and visually indicates `dragover` state.
- Interactive controls: `#searchInput`, `#smoothToggle`, `#pointsToggle`, `#paletteSelect` are wired to update chart appearance and highlighting.

**External integrations & versions**
- SheetJS: `https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js` (used for Excel/CSV parsing).
- Chart.js: `https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js` (Chart rendering).

When updating these, ensure the Chart.js major version compatibility and test in a browser; changing versions may break chart options or API calls.

**Developer workflows (how to run & test locally)**
- No build step — open `index.html` in a browser, or run a simple local server to avoid file:// CORS issues.
- Quick test commands (macOS/zsh):

```bash
# From repository root
# Option A: serve file via Python 3 HTTP server
python3 -m http.server 8000
# then open: http://localhost:8000/index.html

# Option B: use a small Node static server (if available)
# npx http-server -p 8000
```

**Project-specific conventions & expectations**
- Data format: the parser expects the first non-empty header row to contain semester labels in columns after the first (e.g. `SEM1`, `SEM2`). The first column should contain student ids (e.g. `M1`). See the sample `pre` block in `index.html`.
- Robust parsing: missing or invalid numeric cells are normalized to `null`; rows with all-null semester values are ignored.
- Header inference: if explicit semester labels are not present, `parseWorkbook` infers semester columns from the widest data row and generates `SEM1..SEMn` labels.
- UI conventions: interactive controls live in the right panel and update the chart without reloading the file. Keep interactions local-only.

**When modifying parsing or charting logic**
- Modify `parseWorkbook` inside `index.js`. Ensure it returns the `{semesters,datasets}` shape — many UI pieces and tests rely on it.
- Add small, local test fixtures (e.g. `samples/`) and a commented test harness (a minimal `test.html`) to exercise parsing for different semester counts and missing values.
- Preserve privacy: do not introduce telemetry or remote uploads. All parsing/rendering must remain client-side.
- If you change Chart.js options, test in a browser and check the console — Chart.js v4 option names differ from v3.

**Quick examples to reference in changes**
- To change semester naming fallback: see where `semesterIndices` is built and the `SEM${i+1}` fallback in `parseWorkbook`.
- To add more chart options: modify the `new Chart(ctx, { ... })` call inside `buildChart(parsed)`; be mindful of Chart.js v4 API.

**Safety checks an agent should perform before committing**
- Manual browser test: run a static server and open `index.html`, upload multiple CSV/XLSX samples (varying semester counts and missing values). Verify chart renders, highlighting works, toggles update the chart, and `Save PNG` downloads correctly.
- If changing CDN URLs or versions (SheetJS, Chart.js), test in multiple browsers and verify Chart API compatibility.

If anything here is unclear or you want sample CSVs / a test harness added, tell me and I will create `samples/` and a minimal `test.html` for parsing checks.

If anything in this document is unclear or you want additional examples (small test CSVs, suggested unit harness, or a minimal `package.json` and dev server), tell me which area to expand and I will iterate.
