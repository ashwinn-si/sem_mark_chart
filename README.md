# Semester Line Chart (static)

Lightweight single-page app that reads a user-provided Excel/CSV file in the browser and renders semester-wise student lines using Chart.js. All processing is done locally — no data leaves the browser.

Features
- Drag & drop or click to upload `.xlsx`, `.xls` or `.csv` files.
- Automatically detects header rows with semester labels or infers semester columns when headers are missing.
- Interactive controls: search by student ID to highlight a line, toggle smoothing and points, and switch color palettes.
- Download chart as PNG.

Files
- `index.html` — app shell and references to CSS/JS/CDNs.
- `style.css` — UI styles (dark, modern theme).
- `index.js` — application logic: parsing, chart building, UI wiring.
- `.github/copilot-instructions.md` — developer guidance for AI coding agents.

Quick local test
1. From the project root run a static server (preferred to avoid file:// CORS issues):

```bash
python3 -m http.server 8000
# open http://localhost:8000/index.html in your browser
```

2. Drag or click to upload a sample CSV/XLSX. The page will parse and render the chart.

Notes for contributors
- Parsing lives in `index.js` — `parseWorkbook(workbook)` returns an object `{semesters: string[], datasets: {id, values[]}[]}`. Keep that shape when changing parsing logic.
- Chart rendering uses Chart.js v4 API — if you upgrade Chart.js, verify legend and scale options for config changes.
- Keep everything local-only: do not introduce network calls that send user data off-device.

Want sample files or automated tests added? Open an issue or request them here and I can add `samples/` and a tiny test harness.
