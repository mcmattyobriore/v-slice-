const jsonInput = document.getElementById("jsonInput");
const canvas = document.getElementById("chart");
const ctx = canvas.getContext("2d");
const timeLabel = document.getElementById("timeLabel");
const audio = document.getElementById("audio");

let chartData;
let currentTime = 0;
let playing = false;

// 1. MANUAL FILE PATHS FOR PLAYER (Lanes 0-3)
const playerPaths = [
  "system/arrows/arrow_purple.png", // Lane 0: Left
  "system/arrows/arrow_blue.png",   // Lane 1: Down
  "system/arrows/arrow_green.png",  // Lane 2: Up
  "system/arrows/arrow_red.png"     // Lane 3: Right
];

// 2. MANUAL FILE PATHS FOR OPPONENT (Lanes 4-7)
const opponentPaths = [
  "system/arrows/arrow_miss_purple.png", // Lane 4: Left
  "system/arrows/arrow_miss_blue.png",   // Lane 5: Down
  "system/arrows/arrow_miss_green.png",  // Lane 6: Up
  "system/arrows/arrow_miss_red.png"     // Lane 7: Right
];

// Preload Player Images
const playerImages = playerPaths.map(path => {
  const img = new Image();
  img.src = path;
  img.onload = () => drawChart();
  return img;
});

// Preload Opponent Images
const opponentImages = opponentPaths.map(path => {
  const img = new Image();
  img.src = path;
  img.onload = () => drawChart();
  return img;
});

// Rotation mapping (Assuming default image is pointing UP)
// 0: Left (-90deg), 1: Down (180deg), 2: Up (0deg), 3: Right (90deg)
const rotations = [-Math.PI / 2, Math.PI, 0, Math.PI / 2];

window.addEventListener("keydown", e => {
  if (document.activeElement === jsonInput) return;
  switch(e.key.toLowerCase()) {
    case "arrowleft": addNote(0); break;
    case "arrowdown": addNote(1); break;
    case "arrowup": addNote(2); break;
    case "arrowright": addNote(3); break;
    case "a": addNote(4); break;
    case "s": addNote(5); break;
    case "w": addNote(6); break;
    case "d": addNote(7); break;
    case " ": e.preventDefault(); playing ? pauseAudio() : playAudio(); break;
  }
});

chartData = {
  "version": "2.0.0",
  "scrollSpeed": { "easy": 1.8, "normal": 2, "hard": 2.2 },
  "events": [],
  "notes": { "easy": [], "normal": [], "hard": [] },
  generatedBy: "VslicR5 - FNF v0.8.0"
};

if (localStorage.getItem("vslicr5_chart")) {
  try {
    chartData = JSON.parse(localStorage.getItem("vslicr5_chart"));
  } catch(e) { console.error("Error loading saved chart", e); }
}
jsonInput.value = JSON.stringify(chartData, null, 2);

function saveToLocalStorage() {
  try {
    chartData = JSON.parse(jsonInput.value);
    localStorage.setItem("vslicr5_chart", jsonInput.value);
    alert("Chart saved to local storage!");
  } catch (e) {
    alert("Error: Invalid JSON in text area. Could not save.");
  }
}

function updateTimeLabel() {
  const current = Math.floor(currentTime);
  const total = audio.duration ? Math.floor(audio.duration * 1000) : 0;
  timeLabel.textContent = `Time: ${current} ms - ${total} ms`;
}

function syncTextarea() {
  jsonInput.value = JSON.stringify(chartData, null, 2);
}

function importJSON(input) {
  const file = input.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = e => {
    chartData = JSON.parse(e.target.result);
    syncTextarea();
    drawChart();
  };
  r.readAsText(file);
}

function importAudio(input) {
  const file = input.files[0];
  if (!file) return;
  audio.src = URL.createObjectURL(file);
  audio.load();
  currentTime = 0;
  playing = false;
  audio.onloadedmetadata = () => updateTimeLabel();
  updateTimeLabel();
  drawChart();
}

function playAudio(){ audio.play(); playing = true; }
function pauseAudio(){ audio.pause(); playing = false; }
function stopAudio(){
  audio.pause();
  audio.currentTime = 0;
  currentTime = 0;
  playing = false;
  updateTimeLabel();
  drawChart();
}

function seekTime(ms){
  currentTime = Math.max(0, currentTime + ms);
  audio.currentTime = currentTime / 1000;
  updateTimeLabel();
  drawChart();
}

audio.addEventListener("timeupdate", () => {
  if (!playing) return;
  currentTime = audio.currentTime * 1000;
  updateTimeLabel();
  drawChart();
});

function addNote(lane) {
  const newNote = { t: Math.floor(currentTime), d: lane, l: 0, p: [] };
  chartData.notes.easy.push({...newNote});
  chartData.notes.normal.push({...newNote});
  chartData.notes.hard.push({...newNote});
  chartData.notes.easy.sort((a,b)=>a.t-b.t);
  chartData.notes.normal.sort((a,b)=>a.t-b.t);
  chartData.notes.hard.sort((a,b)=>a.t-b.t);
  syncTextarea();
  drawChart();
}

function drawChart() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  
  // RENDER PIXELATED: This is critical for the 2026 pixel-art look
  ctx.imageSmoothingEnabled = false; 
  
  const centerY = canvas.height / 2;

  // Draw Lane Dividers
  for (let i=0;i<8;i++) {
    ctx.strokeStyle="#333";
    ctx.beginPath();
    ctx.moveTo(i*110+50,0);
    ctx.lineTo(i*110+50,canvas.height);
    ctx.stroke();
  }

  for (const n of chartData.notes.normal) {
    const x = n.d * 110 + 50;
    const y = centerY - (n.t - currentTime) * 0.5;
    
    if (y < -50 || y > canvas.height + 50) continue;

    const laneIndex = n.d % 4;
    const img = n.d <= 3 ? playerImages[laneIndex] : opponentImages[laneIndex];

    if (img.complete && img.naturalWidth !== 0) {
      ctx.save();
      // Move to note center
      ctx.translate(x, y);
      // Rotate based on direction index
      ctx.rotate(rotations[laneIndex]);
      // Draw centered at (0,0) - half of 40x40 size is 20
      ctx.drawImage(img, -20, -20, 40, 40);
      ctx.restore();
    }
  }
}

updateTimeLabel();
drawChart();
