/* Main JS extracted from index.html */
const fileInput = document.getElementById('fileInput');
const infoText = document.getElementById('infoText');
const downloadBtn = document.getElementById('downloadBtn');
const canvas = document.getElementById('chartCanvas');
const ctx = canvas.getContext('2d');
const themeToggle = document.getElementById('themeToggle');
let chart = null;

const palette = [
  '#1f77b4', '#2ca02c', '#ff7f0e', '#9467bd', '#e377c2', '#8c564b', '#17becf'
];

// Additional palettes for selection
const palettes = {
  Default: ['#1f77b4', '#2ca02c', '#ff7f0e', '#9467bd', '#e377c2', '#8c564b', '#17becf'],
  Pastel: ['#a3cef1', '#b8e6c4', '#ffd7a6', '#d6c4ff', '#ffd1ea', '#e9d7c9', '#bfeff2'],
  Neon: ['#00f5a0', '#7cfffb', '#ffd166', '#ff6b6b', '#c77dff', '#00b4d8', '#ffd700']
};

// Try to find the header row reliably
function findHeaderRow(rows) {
  for (let i = 0; i < Math.min(rows.length, 6); i++) {
    const row = rows[i] || [];
    const semCount = row.reduce((acc, cell) => acc + (cell && String(cell).toUpperCase().includes('SEM') ? 1 : 0), 0);
    if (semCount >= 1) return i;
    // fallback: if there are at least two numeric-like cells and first column is non-numeric -> header
    const numericCells = row.reduce((acc, c) => acc + (c !== null && c !== '' && !isNaN(Number(String(c).replace(/,/g, ''))) ? 1 : 0), 0);
    const firstNonEmpty = row.findIndex(c => c !== null && c !== '');
    if (numericCells >= 2 && firstNonEmpty > 0) return i;
  }
  return 0;
}

function normalizeLabel(l) {
  if (l === null || l === undefined) return '';
  return String(l).trim();
}

function parseWorkbook(workbook) {
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  if (!rows || rows.length === 0) return { semesters: [], datasets: [] };

  const headerRowIndex = findHeaderRow(rows);
  const header = (rows[headerRowIndex] || []).map(h => normalizeLabel(h));

  // Build semesterIndices from header (columns after first)
  const semesterIndices = [];
  const semesters = [];
  for (let col = 1; col < header.length; col++) {
    const cell = (header[col] || '').replace(/\s+/g, ' ').trim();
    if (cell !== '' && !/^unnamed/i.test(cell)) {
      semesterIndices.push(col);
      semesters.push(cell);
    }
  }

  // Data rows begin after headerRowIndex
  const dataStart = headerRowIndex + 1;
  const dataRows = rows.slice(dataStart).filter(r => r && r.some(c => c !== null && c !== ''));

  // If no semesters found in header, infer from data columns (supports variable number of semesters)
  if (semesterIndices.length === 0 && dataRows.length > 0) {
    const maxCols = Math.max(...dataRows.map(r => (r ? r.length : 0)));
    for (let col = 1; col < maxCols; col++) {
      semesterIndices.push(col);
      semesters.push(`SEM${col}`.replace('SEM1', 'SEM1').replace(/SEM(\d+)/, (m, g1) => `SEM${g1}`));
    }
  }

  const datasets = [];
  dataRows.forEach((r, idx) => {
    const idCell = r[0];
    const id = idCell ? String(idCell).trim() : `Row ${idx + 1}`;

    // For each detected semester column, pull numeric value (or null)
    const values = semesterIndices.map(colIndex => {
      const cell = (r && colIndex < r.length) ? r[colIndex] : null;
      if (cell === null || cell === undefined || cell === '') return null;
      const num = Number(String(cell).replace(/,/g, '').trim());
      return isNaN(num) ? null : num;
    });

    // skip entirely-empty rows
    if (values.every(v => v === null)) return;
    datasets.push({ id, values });
  });

  return { semesters, datasets };
}

function resizeCanvas() {
  const panel = canvas.parentElement;
  const w = Math.min(1200, panel.clientWidth - 8);
  canvas.width = w;
  canvas.height = 420;
}

function buildChart(parsed) {
  const labels = parsed.semesters;
  const datasets = parsed.datasets.map((d, i) => ({
    label: d.id,
    data: d.values,
    spanGaps: true,
    tension: 0.22,
    borderWidth: 2.6,
    pointRadius: 4,
    pointHoverRadius: 6,
    borderColor: palette[i % palette.length],
    backgroundColor: 'rgba(0,0,0,0)'
  }));

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right' },
        title: { display: true, text: 'Semester-wise Marks', font: { size: 16, weight: '600' } }
      },
      scales: {
        y: { beginAtZero: false, grid: { color: 'rgba(0,0,0,0.06)' } },
        x: { grid: { color: 'rgba(0,0,0,0.03)' } }
      }
    }
  });

  downloadBtn.disabled = false;
}

// Hex to rgba helper
function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const bigint = parseInt(h.length === 3 ? h.split('').map(ch => ch + ch).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function updateChartAppearance() {
  if (!chart) return;
  const smooth = document.getElementById('smoothToggle').checked;
  const showPoints = document.getElementById('pointsToggle').checked;
  chart.data.datasets.forEach((ds, i) => {
    ds.tension = smooth ? 0.28 : 0.0;
    ds.pointRadius = showPoints ? 4 : 0;
    ds.pointHoverRadius = showPoints ? 6 : 0;
  });
  chart.update();
}

function highlightStudent(query) {
  if (!chart) return;
  const q = (query || '').trim().toLowerCase();
  chart.data.datasets.forEach((ds, i) => {
    const base = palette[i % palette.length];
    if (q !== '' && ds.label.toLowerCase().includes(q)) {
      ds.borderWidth = 4.5;
      ds.borderColor = base;
    } else if (q !== '') {
      ds.borderWidth = 1.2;
      ds.borderColor = hexToRgba(base, 0.18);
    } else {
      ds.borderWidth = 2.6;
      ds.borderColor = base;
    }
  });
  chart.update();
}

// Populate palette select
const paletteSelect = document.getElementById('paletteSelect');
Object.keys(palettes).forEach(name => {
  const opt = document.createElement('option'); opt.value = name; opt.textContent = name; paletteSelect.appendChild(opt);
});
paletteSelect.addEventListener('change', () => {
  const chosen = palettes[paletteSelect.value] || palettes.Default;
  // copy values into palette (mutate) and refresh colors
  for (let i = 0; i < chosen.length; i++) palette[i] = chosen[i];
  if (chart) {
    chart.data.datasets.forEach((ds, i) => ds.borderColor = palette[i % palette.length]);
    chart.update();
  }
});

// Wire up control inputs
document.getElementById('smoothToggle').addEventListener('change', updateChartAppearance);
document.getElementById('pointsToggle').addEventListener('change', updateChartAppearance);
document.getElementById('searchInput').addEventListener('input', (e) => highlightStudent(e.target.value));

// Theme toggle
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light-theme');
  themeToggle.textContent = document.body.classList.contains('light-theme') ? '☀️' : '🌙';
});

fileInput.addEventListener('change', (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = function (ev) {
    try {
      const isCSV = f.name.toLowerCase().endsWith('.csv');
      if (isCSV) {
        // FileReader.readAsText returns a string; if it's an ArrayBuffer, decode it.
        const text = (typeof ev.target.result === 'string')
          ? ev.target.result
          : new TextDecoder('utf-8').decode(ev.target.result);
        const wb = XLSX.read(text, { type: 'string' });
        const parsed = parseWorkbook(wb);
        if (!parsed || parsed.semesters.length === 0 || parsed.datasets.length === 0) {
          infoText.textContent = 'Could not parse CSV. Ensure first column is IDs and first row headers contain SEM labels.';
          downloadBtn.disabled = true;
          return;
        }
        resizeCanvas();
        buildChart(parsed);
        infoText.textContent = `Loaded ${f.name} — ${parsed.datasets.length} rows, ${parsed.semesters.length} semesters`;
        return;
      }

      const data = new Uint8Array(ev.target.result);
      const wb = XLSX.read(data, { type: 'array' });
      const parsed = parseWorkbook(wb);
      if (!parsed || parsed.semesters.length === 0 || parsed.datasets.length === 0) {
        infoText.textContent = 'Could not parse a valid format. Make sure header row contains SEM labels and first column contains student ids.';
        downloadBtn.disabled = true;
        return;
      }
      resizeCanvas();
      buildChart(parsed);
      infoText.textContent = `Loaded ${f.name} — ${parsed.datasets.length} rows, ${parsed.semesters.length} semesters`;
    } catch (err) {
      console.error(err);
      infoText.textContent = 'Error parsing file: ' + (err && err.message ? err.message : String(err));
      downloadBtn.disabled = true;
    }
  };

  // read as array buffer for xlsx, as text for csv
  const isCSV = f.name.toLowerCase().endsWith('.csv');
  if (isCSV) reader.readAsText(f);
  else reader.readAsArrayBuffer(f);
});

// drag & drop support
const fileDropEl = document.getElementById('fileDrop');
['dragenter', 'dragover'].forEach(ev => {
  document.addEventListener(ev, (e) => {
    e.preventDefault();
    document.body.classList.add('dragover');
  });
});
['dragleave', 'drop'].forEach(ev => {
  document.addEventListener(ev, (e) => {
    e.preventDefault();
    document.body.classList.remove('dragover');
  });
});
document.addEventListener('drop', (e) => {
  e.preventDefault();
  if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
    fileInput.files = e.dataTransfer.files;
    fileInput.dispatchEvent(new Event('change'));
  }
});

// clicking the drop area should open file picker
fileDropEl.addEventListener('click', () => fileInput.click());

downloadBtn.addEventListener('click', () => {
  if (!chart) return;
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = 'semester_chart.png';
  a.click();
});

// adjust canvas size when window resizes
window.addEventListener('resize', () => {
  if (chart) {
    resizeCanvas();
    chart.resize();
  }
});
