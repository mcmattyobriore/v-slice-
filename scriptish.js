const jsonInput = document.getElementById("jsonInput");
const canvas = document.getElementById("chart");
const ctx = canvas.getContext("2d");
const timeLabel = document.getElementById("timeLabel");
const audio = document.getElementById("audio");

let chartData;
let currentTime = 0;
let playing = false;

// ================== CONSTANTS ==================
const ARROW_SIZE = 40;
const ARROW_HALF = ARROW_SIZE / 2;
const HOLD_WIDTH = 20;
const SCROLL_MULT = 0.5;

// ================== IMAGE PATHS ==================
const playerPaths = [
  "system/arrows/arrow_purple.png",
  "system/arrows/arrow_blue.png",
  "system/arrows/arrow_green.png",
  "system/arrows/arrow_red.png"
];

const opponentPaths = [
  "system/arrows/arrow_miss_purple.png",
  "system/arrows/arrow_miss_blue.png",
  "system/arrows/arrow_miss_green.png",
  "system/arrows/arrow_miss_red.png"
];

// ================== IMAGE LOADING ==================
const playerImages = playerPaths.map(path => {
  const img = new Image();
  img.src = path;
  img.onload = () => drawChart();
  return img;
});

const opponentImages = opponentPaths.map(path => {
  const img = new Image();
  img.src = path;
  img.onload = () => drawChart();
  return img;
});

// ================== ROTATIONS ==================
const rotations = [
  -Math.PI / 2,
  Math.PI,
  0,
  Math.PI / 2
];

// ================== HOLD COLORS ==================
const laneColors = ["#C24B99", "#00FFFF", "#12FA05", "#F9393F"];

// ================== INPUT ==================
window.addEventListener("keydown", e => {
  if (document.activeElement === jsonInput) return;

  switch (e.key.toLowerCase()) {
    case "arrowleft": addNote(0); break;
    case "arrowdown": addNote(1); break;
    case "arrowup": addNote(2); break;
    case "arrowright": addNote(3); break;
    case "a": addNote(4); break;
    case "s": addNote(5); break;
    case "w": addNote(6); break;
    case "d": addNote(7); break;
    case " ":
      e.preventDefault();
      playing ? pauseAudio() : playAudio();
      break;
  }
});

// ================== CHART DATA ==================
chartData = {
  version: "2.0.0",
  scrollSpeed: { easy: 1.8, normal: 2, hard: 2.2 },
  events: [],
  notes: { easy: [], normal: [], hard: [] },
  generatedBy: "VslicR5 - FNF v0.8.0"
};

if (localStorage.getItem("vslicr5_chart")) {
  try {
    chartData = JSON.parse(localStorage.getItem("vslicr5_chart"));
  } catch (e) {
    console.error("Error loading saved chart", e);
  }
}

jsonInput.value = JSON.stringify(chartData, null, 2);

// ================== UTIL ==================
function updateTimeLabel() {
  const current = Math.floor(currentTime);
  const total = audio.duration ? Math.floor(audio.duration * 1000) : 0;
  timeLabel.textContent = `Time: ${current} ms - ${total} ms`;
}

function syncTextarea() {
  jsonInput.value = JSON.stringify(chartData, null, 2);
}

// ================== AUDIO ==================
function playAudio() { audio.play(); playing = true; }
function pauseAudio() { audio.pause(); playing = false; }

audio.addEventListener("timeupdate", () => {
  if (!playing) return;
  currentTime = audio.currentTime * 1000;
  updateTimeLabel();
  drawChart();
});

// ================== NOTES ==================
function addNote(lane) {
  const note = { t: Math.floor(currentTime), d: lane, l: 0, p: [] };

  chartData.notes.easy.push({ ...note });
  chartData.notes.normal.push({ ...note });
  chartData.notes.hard.push({ ...note });

  chartData.notes.normal.sort((a, b) => a.t - b.t);

  syncTextarea();
  drawChart();
}

// ================== DRAW ==================
function drawChart() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;

  const centerY = canvas.height / 2;

  // Lane dividers
  for (let i = 0; i < 8; i++) {
    ctx.strokeStyle = "#333";
    ctx.beginPath();
    ctx.moveTo(i * 110 + 50, 0);
    ctx.lineTo(i * 110 + 50, canvas.height);
    ctx.stroke();
  }

  for (const n of chartData.notes.normal) {
    const x = n.d * 110 + 50;
    const y = centerY - (n.t - currentTime) * SCROLL_MULT;
    const holdHeight = n.l * SCROLL_MULT;

    if (y + holdHeight < -ARROW_SIZE) continue;
    if (y - ARROW_SIZE > canvas.height) continue;

    const lane = n.d % 4;
    const img = n.d < 4 ? playerImages[lane] : opponentImages[lane];

    // Arrow
    if (img.complete && img.naturalWidth) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotations[lane]);
      ctx.drawImage(img, -ARROW_HALF, -ARROW_HALF, ARROW_SIZE, ARROW_SIZE);
      ctx.restore();
    }

    // Hold (ON TOP & BELOW arrow)
    if (n.l > 0) {
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = laneColors[lane];
      ctx.fillRect(
        x - HOLD_WIDTH / 2,
        y + ARROW_HALF,
        HOLD_WIDTH,
        holdHeight
      );
      ctx.globalAlpha = 1;
    }
  }
}

updateTimeLabel();
drawChart();
