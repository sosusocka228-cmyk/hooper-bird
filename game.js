const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const W = canvas.width;
const H = canvas.height;
const GROUND = 456;
const PLAYER_X = 178;
const WALL_HITBOX_INSET_X = 14;
const WALL_HITBOX_GAP_BONUS = 16;
const TOP_PORTAL_Y = 20;
const BOTTOM_PORTAL_Y = GROUND - 20;
const PORTAL_TRIGGER_MARGIN = 2;
const BEST_KEY = "flipBirdDashBest";
const PLAYER_NAME_KEY = "hooperBirdPlayerName";
const SOUND_KEY = "flipBirdDashSoundSettings";
const MUSIC_KEY = "flipBirdDashMusicSettings";
const GRAPHICS_KEY = "flipBirdDashGraphicsSettings";
const COINS_KEY = "flipBirdDashCoins";
const OWNED_SKINS_KEY = "flipBirdDashOwnedSkins";
const SELECTED_SKIN_KEY = "flipBirdDashSelectedSkin";
const OWNED_CRASH_KEY = "flipBirdDashOwnedCrashEffects";
const SELECTED_CRASH_KEY = "flipBirdDashSelectedCrashEffect";
let audioContext = null;
let audioEnabled = false;
const shadeCache = new Map();
const musicState = { mode: "", step: 0, nextTime: 0 };
let spaceHeld = false;

const soundButtons = [
  { key: "jump", label: "JUMP", x: 330, y: 178, w: 148, h: 30 },
  { key: "portal", label: "PORTAL", x: 488, y: 178, w: 148, h: 30 },
  { key: "score", label: "SCORE", x: 330, y: 218, w: 148, h: 30 },
  { key: "crash", label: "CRASH", x: 488, y: 218, w: 148, h: 30 },
];

const graphicsButtons = [
  { group: "style", value: "8bit", label: "8 BIT", x: 330, y: 310, w: 132, h: 30 },
  { group: "style", value: "16bit", label: "16 BIT", x: 472, y: 310, w: 132, h: 30 },
  { group: "fpsCap", value: 30, label: "30 FPS", x: 290, y: 386, w: 112, h: 30 },
  { group: "fpsCap", value: 60, label: "60 FPS", x: 412, y: 386, w: 112, h: 30 },
  { group: "fpsCap", value: 120, label: "120", x: 534, y: 386, w: 86, h: 30 },
  { group: "fpsCap", value: 240, label: "MAX", x: 630, y: 386, w: 86, h: 30 },
  { group: "smoothing", value: "pixelated", label: "PIXEL", x: 268, y: 462, w: 122, h: 30 },
  { group: "smoothing", value: "crisp", label: "CRISP", x: 400, y: 462, w: 122, h: 30 },
  { group: "smoothing", value: "smooth", label: "SMOOTH", x: 532, y: 462, w: 132, h: 30 },
];

const musicButtons = [
  { group: "enabled", value: true, label: "MUSIC ON", x: 310, y: 290, w: 150, h: 30 },
  { group: "enabled", value: false, label: "MUSIC OFF", x: 470, y: 290, w: 160, h: 30 },
  { group: "menuTrack", value: "a", label: "MENU A", x: 310, y: 366, w: 132, h: 30 },
  { group: "menuTrack", value: "b", label: "MENU B", x: 452, y: 366, w: 132, h: 30 },
];

const skinDefinitions = [
  { id: "classic", name: "CLASSIC", price: 0, body: "#ffd166", outline: "#fff7c2", eye: "#101820", beak: "#ff3864" },
  { id: "lime", name: "LIME", price: 10, body: "#7cff6b", outline: "#d7ffc4", eye: "#101820", beak: "#6ee7ff" },
  { id: "berry", name: "BERRY", price: 25, body: "#ff7ab6", outline: "#ffd0e7", eye: "#231020", beak: "#ffe066" },
  { id: "mint", name: "MINT", price: 50, body: "#8affc1", outline: "#d7ffe9", eye: "#09261b", beak: "#9b5cff" },
  { id: "cyber", name: "CYBER", price: 100, body: "#6ee7ff", outline: "#f7fbff", eye: "#071018", beak: "#9b5cff", variant: "visor" },
  { id: "ninja", name: "NINJA", price: 150, body: "#171923", outline: "#5a6375", eye: "#f7fbff", beak: "#ff3864", variant: "mask" },
  { id: "ruby", name: "RUBY", price: 200, body: "#ff3864", outline: "#ffd0dc", eye: "#f7fbff", beak: "#ffd166", variant: "gem" },
  { id: "sunset", name: "SUNSET", price: 300, body: "#ff9f1c", outline: "#ffe0a3", eye: "#241200", beak: "#ff3864", variant: "stripes" },
  { id: "candy", name: "CANDY", price: 400, body: "#ff7ab6", outline: "#ffffff", eye: "#101820", beak: "#6ee7ff", variant: "candy" },
  { id: "void", name: "VOID", price: 500, body: "#9b5cff", outline: "#dbc9ff", eye: "#f7fbff", beak: "#7cff6b", aura: "void" },
  { id: "ghost", name: "GHOST", price: 650, body: "#e8f4ff", outline: "#ffffff", eye: "#26415f", beak: "#b8f3ff", aura: "ghost" },
  { id: "ice", name: "ICE", price: 750, body: "#b8f3ff", outline: "#ffffff", eye: "#0b2d3b", beak: "#6ee7ff", aura: "ice" },
  { id: "gold", name: "GOLD", price: 1000, body: "#ffe066", outline: "#fff7c2", eye: "#2a2100", beak: "#ff9f1c", aura: "gold" },
  { id: "pumpkin", name: "PUMPKIN", price: 1250, body: "#ff7a1a", outline: "#ffd0a3", eye: "#221000", beak: "#7cff6b", aura: "ember" },
  { id: "neon", name: "NEON", price: 1500, body: "#00ff9d", outline: "#b6ffe4", eye: "#001f15", beak: "#ff4dff", aura: "neon" },
  { id: "plasma", name: "PLASMA", price: 2000, body: "#ff4dff", outline: "#ffc8ff", eye: "#f7fbff", beak: "#6ee7ff", aura: "plasma" },
  { id: "royal", name: "ROYAL", price: 2500, body: "#4d7cff", outline: "#cbd8ff", eye: "#f7fbff", beak: "#ffd166", aura: "royal" },
  { id: "dragon", name: "DRAGON", price: 3500, body: "#7cff6b", outline: "#d7ffc4", eye: "#ff3864", beak: "#ffd166", aura: "dragon" },
  { id: "shadow", name: "SHADOW", price: 5000, body: "#101018", outline: "#8b8cff", eye: "#f7fbff", beak: "#9b5cff", aura: "shadow" },
  { id: "comet", name: "COMET", price: 7500, body: "#6ee7ff", outline: "#fff7c2", eye: "#071018", beak: "#ff9f1c", aura: "comet" },
];

const skinButtons = skinDefinitions.map((skin, index) => ({
  ...skin,
  x: 76 + (index % 5) * 146,
  y: 344 + Math.floor(index / 5) * 34,
  w: 132,
  h: 27,
}));

const crashEffectDefinitions = [
  { id: "classic", name: "CLASSIC", price: 0, colors: ["#ff3864", "#ffd166", "#ffffff"], shape: "burst" },
  { id: "bedrock", name: "BEDROCK", price: 50, colors: ["#555555", "#2c2c2c", "#8a8a8a"], shape: "blocks" },
  { id: "snow", name: "SNOW POP", price: 100, colors: ["#b8f3ff", "#ffffff", "#6ee7ff"], shape: "snow" },
  { id: "lava", name: "LAVA", price: 150, colors: ["#ff3864", "#ff9f1c", "#ffe066"], shape: "lava" },
  { id: "coins", name: "COIN BOOM", price: 225, colors: ["#ffd166", "#ffe066", "#ff9f1c"], shape: "coins" },
  { id: "void", name: "VOID POP", price: 300, colors: ["#2b124f", "#9b5cff", "#dbc9ff"], shape: "void" },
  { id: "stars", name: "STARS", price: 400, colors: ["#f7fbff", "#ffd166", "#6ee7ff"], shape: "stars" },
  { id: "totem", name: "TOTEM", price: 500, colors: ["#7cff6b", "#ffd166", "#f7fbff"], shape: "totem" },
  { id: "pixel", name: "PIXEL DUST", price: 750, colors: ["#6ee7ff", "#ff4dff", "#7cff6b"], shape: "pixel" },
  { id: "glitch", name: "GLITCH", price: 1000, colors: ["#00ff9d", "#6ee7ff", "#ff4dff"], shape: "glitch" },
  { id: "soul", name: "SOUL FIRE", price: 1500, colors: ["#00ff9d", "#2b124f", "#6ee7ff"], shape: "soul" },
  { id: "shock", name: "SHOCK", price: 2500, colors: ["#ffe066", "#f7fbff", "#4d7cff"], shape: "shock" },
];

const crashButtons = crashEffectDefinitions.map((effect, index) => ({
  ...effect,
  x: 96 + (index % 4) * 178,
  y: 344 + Math.floor(index / 4) * 42,
  w: 158,
  h: 33,
}));

const deathMenuButtons = [
  { action: "restart", label: "RESTART", x: W / 2 - 130, y: 292, w: 260, h: 40 },
  { action: "share", label: "SHARE", x: W / 2 - 130, y: 342, w: 260, h: 40 },
  { action: "menu", label: "MAIN MENU", x: W / 2 - 130, y: 392, w: 260, h: 40 },
];

const nameButton = { x: W / 2 - 120, y: 158, w: 240, h: 32 };

const pauseButton = { x: W - 76, y: 24, w: 52, h: 52 };
const pauseMenuButtons = [
  { action: "resume", label: "CONTINUE", x: W / 2 - 116, y: 214, w: 232, h: 42 },
  { action: "restart", label: "RESTART", x: W / 2 - 116, y: 270, w: 232, h: 42 },
  { action: "menu", label: "BACK MENU", x: W / 2 - 116, y: 326, w: 232, h: 42 },
];

function loadSoundSettings() {
  const defaults = { jump: true, portal: true, score: true, crash: true, start: true };
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(SOUND_KEY) || "{}") };
  } catch {
    return defaults;
  }
}

const soundSettings = loadSoundSettings();

function loadMusicSettings() {
  const defaults = { enabled: true, menuTrack: "a" };
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(MUSIC_KEY) || "{}") };
  } catch {
    return defaults;
  }
}

const musicSettings = loadMusicSettings();

function saveMusicSettings() {
  try {
    localStorage.setItem(MUSIC_KEY, JSON.stringify(musicSettings));
  } catch {
    // Music settings still work for this session.
  }
}

function setMusicSetting(group, value) {
  musicSettings[group] = value;
  saveMusicSettings();
  musicState.mode = "";
  musicState.step = 0;
  musicState.nextTime = 0;
  if (value !== false) {
    initAudio();
    beep(520, 0.05, "square", 0.03);
  }
}

function loadGraphicsSettings() {
  const defaults = { style: "16bit", fpsCap: 60, smoothing: "pixelated" };
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(GRAPHICS_KEY) || "{}") };
  } catch {
    return defaults;
  }
}

const graphicsSettings = loadGraphicsSettings();

function saveGraphicsSettings() {
  try {
    localStorage.setItem(GRAPHICS_KEY, JSON.stringify(graphicsSettings));
  } catch {
    // Graphics settings still work for this session.
  }
}

function applyGraphicsSettings() {
  const rendering = graphicsSettings.smoothing === "smooth"
    ? "auto"
    : graphicsSettings.smoothing === "crisp"
      ? "crisp-edges"
      : "pixelated";
  canvas.style.imageRendering = rendering;
  ctx.imageSmoothingEnabled = graphicsSettings.smoothing === "smooth";
}

function setGraphicsSetting(group, value) {
  graphicsSettings[group] = value;
  saveGraphicsSettings();
  applyGraphicsSettings();
  beep(620, 0.05, "square", 0.03);
}

applyGraphicsSettings();

function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  audioEnabled = true;
}

function beep(frequency, duration = 0.08, type = "square", volume = 0.05, when = 0) {
  if (!audioEnabled || !audioContext) return;

  const start = audioContext.currentTime + when;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function playSound(name) {
  if (!audioEnabled) return;
  if (soundSettings[name] === false) return;

  if (name === "jump") {
    beep(520, 0.07, "square", 0.045);
    beep(760, 0.05, "square", 0.03, 0.045);
  } else if (name === "score") {
    beep(660, 0.06, "square", 0.045);
    beep(880, 0.07, "square", 0.04, 0.06);
    beep(1175, 0.08, "square", 0.035, 0.12);
  } else if (name === "portal") {
    beep(320, 0.08, "sawtooth", 0.035);
    beep(640, 0.1, "square", 0.04, 0.04);
  } else if (name === "crash") {
    beep(180, 0.12, "sawtooth", 0.055);
    beep(95, 0.18, "square", 0.05, 0.08);
  } else if (name === "start") {
    beep(440, 0.06, "square", 0.04);
    beep(660, 0.08, "square", 0.04, 0.07);
  }
}

const musicPatterns = {
  menuA: {
    tempo: 0.28,
    lead: [392, 0, 494, 0, 587, 494, 440, 0, 392, 0, 330, 0, 392, 440, 494, 0],
    bass: [196, 0, 0, 0, 247, 0, 0, 0, 165, 0, 0, 0, 196, 0, 0, 0],
  },
  menuB: {
    tempo: 0.3,
    lead: [330, 392, 440, 0, 392, 330, 294, 0, 330, 392, 494, 0, 440, 392, 330, 0],
    bass: [165, 0, 196, 0, 147, 0, 196, 0, 165, 0, 247, 0, 220, 0, 196, 0],
  },
  gameA: {
    tempo: 0.16,
    lead: [660, 0, 660, 784, 880, 0, 784, 660, 587, 0, 660, 784, 988, 880, 784, 0],
    bass: [165, 165, 0, 196, 196, 0, 247, 0, 220, 220, 0, 196, 247, 0, 220, 0],
  },
  gameB: {
    tempo: 0.15,
    lead: [523, 659, 784, 0, 784, 880, 988, 0, 659, 784, 1047, 988, 880, 784, 659, 0],
    bass: [131, 0, 196, 0, 165, 0, 247, 0, 147, 0, 220, 0, 165, 0, 247, 0],
  },
};

function playMusicNote(frequency, duration, type, volume, when = 0) {
  if (!audioEnabled || !audioContext || !musicSettings.enabled) return;
  beep(frequency, duration, type, volume, when);
}

function updateMusic(now) {
  if (!audioEnabled || !audioContext || !musicSettings.enabled) return;

  if (state.mode !== "menu") {
    musicState.mode = "";
    return;
  }

  const mode = "menu";
  const track = musicSettings.menuTrack;
  const key = `${mode}${track.toUpperCase()}`;
  const pattern = musicPatterns[key];
  if (!pattern) return;

  if (musicState.mode !== key) {
    musicState.mode = key;
    musicState.step = 0;
    musicState.nextTime = now;
  }

  if (now < musicState.nextTime) return;

  const index = musicState.step % pattern.lead.length;
  const lead = pattern.lead[index];
  const bass = pattern.bass[index];
  if (lead) playMusicNote(lead, pattern.tempo * 0.72, "square", mode === "menu" ? 0.014 : 0.018);
  if (bass) playMusicNote(bass, pattern.tempo * 0.85, "triangle", mode === "menu" ? 0.012 : 0.015);

  musicState.step += 1;
  musicState.nextTime = now + pattern.tempo * 1000;
}

function saveSoundSettings() {
  try {
    localStorage.setItem(SOUND_KEY, JSON.stringify(soundSettings));
  } catch {
    // Settings still work for this session if storage is blocked.
  }
}

function toggleSound(key) {
  soundSettings[key] = !soundSettings[key];
  saveSoundSettings();
  if (soundSettings[key]) {
    initAudio();
    beep(720, 0.05, "square", 0.035);
  }
}

function readCookie(name) {
  const prefix = `${name}=`;
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length);
}

function loadBest() {
  let localValue = 0;
  try {
    localValue = Number(localStorage.getItem(BEST_KEY) || 0);
  } catch {
    localValue = 0;
  }
  const cookieValue = Number(readCookie(BEST_KEY) || 0);
  const best = Math.max(Number.isFinite(localValue) ? localValue : 0, Number.isFinite(cookieValue) ? cookieValue : 0);
  if (best > 0) {
    saveBest(best);
  }
  return best;
}

function saveBest(value) {
  const best = Math.max(0, Number(value) || 0);
  try {
    localStorage.setItem(BEST_KEY, String(best));
  } catch {
    // Cookie below is the fallback when localStorage is unavailable.
  }
  document.cookie = `${BEST_KEY}=${best}; Max-Age=31536000; Path=/; SameSite=Lax`;
}

function normalizePlayerName(value) {
  const clean = String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 14);
  return clean || "PLAYER";
}

function loadPlayerName() {
  try {
    const saved = localStorage.getItem(PLAYER_NAME_KEY) || "";
    return saved ? normalizePlayerName(saved) : "";
  } catch {
    return "";
  }
}

function savePlayerName(name) {
  state.playerName = normalizePlayerName(name);
  try {
    localStorage.setItem(PLAYER_NAME_KEY, state.playerName);
  } catch {
    // The name still works until refresh.
  }
}

function askPlayerName() {
  const entered = window.prompt("Твiй нiк у Hooper Bird:", state.playerName || "PLAYER");
  if (entered === null) return false;
  savePlayerName(entered);
  return true;
}

function loadNumber(key, fallback = 0) {
  try {
    const value = Number(localStorage.getItem(key) || fallback);
    return Number.isFinite(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function saveNumber(key, value) {
  try {
    localStorage.setItem(key, String(Math.max(0, Number(value) || 0)));
  } catch {
    // Current session still keeps the value in memory.
  }
}

function loadOwnedSkins() {
  try {
    const owned = JSON.parse(localStorage.getItem(OWNED_SKINS_KEY) || "[]");
    return new Set(["classic", ...owned]);
  } catch {
    return new Set(["classic"]);
  }
}

function loadOwnedCrashEffects() {
  try {
    const owned = JSON.parse(localStorage.getItem(OWNED_CRASH_KEY) || "[]");
    return new Set(["classic", ...owned]);
  } catch {
    return new Set(["classic"]);
  }
}

function saveOwnedCrashEffects(owned) {
  try {
    localStorage.setItem(OWNED_CRASH_KEY, JSON.stringify([...owned]));
  } catch {
    // Current session still keeps purchases in memory.
  }
}

function loadSelectedCrashEffect(owned) {
  try {
    const selected = localStorage.getItem(SELECTED_CRASH_KEY) || "classic";
    return owned.has(selected) ? selected : "classic";
  } catch {
    return "classic";
  }
}

function saveSelectedCrashEffect(id) {
  try {
    localStorage.setItem(SELECTED_CRASH_KEY, id);
  } catch {
    // Selection still works until refresh.
  }
}

function saveOwnedSkins(owned) {
  try {
    localStorage.setItem(OWNED_SKINS_KEY, JSON.stringify([...owned]));
  } catch {
    // Current session still keeps purchases in memory.
  }
}

function loadSelectedSkin(owned) {
  try {
    const selected = localStorage.getItem(SELECTED_SKIN_KEY) || "classic";
    return owned.has(selected) ? selected : "classic";
  } catch {
    return "classic";
  }
}

function saveSelectedSkin(id) {
  try {
    localStorage.setItem(SELECTED_SKIN_KEY, id);
  } catch {
    // Selection still works until refresh.
  }
}

const state = {
  mode: "menu",
  frame: 0,
  world: 0,
  y: 260,
  velocity: 0,
  gravity: 0.76,
  jump: -10.6,
  score: 0,
  best: loadBest(),
  playerName: loadPlayerName(),
  coins: loadNumber(COINS_KEY, 0),
  ownedSkins: loadOwnedSkins(),
  selectedSkin: "classic",
  ownedCrashEffects: loadOwnedCrashEffects(),
  selectedCrashEffect: "classic",
  shopTab: "skins",
  previewCrashEffect: "classic",
  nextWall: 72,
  crashCooldown: 0,
  walls: [],
  particles: [],
  bgEffects: [],
  bgFlash: null,
  menuScreen: "main",
  settingsTab: "sound",
  previewSkin: "classic",
};

state.selectedSkin = loadSelectedSkin(state.ownedSkins);
state.previewSkin = state.selectedSkin;
state.selectedCrashEffect = loadSelectedCrashEffect(state.ownedCrashEffects);
state.previewCrashEffect = state.selectedCrashEffect;

const colors = ["#ff3864", "#ffd166", "#7cff6b", "#9b5cff"];

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function resetRound(started = true) {
  state.y = 260;
  state.velocity = 0;
  state.score = 0;
  state.nextWall = 72;
  state.crashCooldown = 0;
  state.walls = [];
  state.particles = [];
  state.bgEffects = [];
  state.bgFlash = null;
  state.world = 0;
  state.mode = started ? "playing" : "menu";
}

function startGame() {
  if (!state.playerName && !askPlayerName()) {
    savePlayerName("PLAYER");
  }
  playSound("start");
  resetRound(true);
}

function pauseGame() {
  if (state.mode !== "playing") return;
  state.mode = "paused";
  beep(420, 0.05, "square", 0.03);
}

function resumeGame() {
  if (state.mode !== "paused") return;
  state.mode = "playing";
  beep(620, 0.05, "square", 0.03);
}

function backToMenu() {
  resetRound(false);
}

async function shareScore() {
  const player = state.playerName || "PLAYER";
  const text = `${player} набрав ${state.score} у Hooper Bird! Спробуй побити мiй рекорд: ${window.location.href}`;
  try {
    if (navigator.share) {
      await navigator.share({ title: "Hooper Bird", text, url: window.location.href });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      window.alert("Результат скопiйовано.");
    } else {
      window.prompt("Скопiюй результат:", text);
    }
  } catch {
    // Sharing can be cancelled by the player.
  }
}

function getSelectedSkin() {
  return skinDefinitions.find((skin) => skin.id === state.selectedSkin) || skinDefinitions[0];
}

function getPreviewSkin() {
  return skinDefinitions.find((skin) => skin.id === state.previewSkin) || getSelectedSkin();
}

function getAnimatedSkinColor(skin) {
  if (!skin.aura) return skin.body;
  const palettes = {
    void: ["#6b35d8", "#9b5cff", "#2b124f"],
    ice: ["#b8f3ff", "#6ee7ff", "#ffffff"],
    gold: ["#ffe066", "#ff9f1c", "#fff7c2"],
    neon: ["#00ff9d", "#6ee7ff", "#ff4dff"],
    royal: ["#4d7cff", "#9b5cff", "#ffd166"],
    ghost: ["#ffffff", "#b8f3ff", "#e8f4ff"],
    ember: ["#ff3864", "#ff7a1a", "#ffe066"],
    plasma: ["#ff4dff", "#9b5cff", "#6ee7ff"],
    dragon: ["#7cff6b", "#ffd166", "#ff3864"],
    shadow: ["#101018", "#4d4d7c", "#8b8cff"],
    comet: ["#6ee7ff", "#fff7c2", "#ff9f1c"],
  };
  const colors = palettes[skin.aura] || [skin.body];
  const index = Math.floor(state.frame / 10) % colors.length;
  return colors[index];
}

function addCoin() {
  state.coins += 1;
  saveNumber(COINS_KEY, state.coins);
}

function buyOrSelectSkin(skin) {
  state.previewSkin = skin.id;
  if (state.ownedSkins.has(skin.id)) {
    state.selectedSkin = skin.id;
    saveSelectedSkin(skin.id);
    beep(780, 0.05, "square", 0.03);
    return;
  }

  if (state.coins >= skin.price) {
    state.coins -= skin.price;
    state.ownedSkins.add(skin.id);
    state.selectedSkin = skin.id;
    saveNumber(COINS_KEY, state.coins);
    saveOwnedSkins(state.ownedSkins);
    saveSelectedSkin(skin.id);
    beep(620, 0.06, "square", 0.035);
    beep(920, 0.08, "square", 0.035, 0.06);
  } else {
    beep(140, 0.08, "sawtooth", 0.035);
  }
}

function getSelectedCrashEffect() {
  return crashEffectDefinitions.find((effect) => effect.id === state.selectedCrashEffect) || crashEffectDefinitions[0];
}

function getPreviewCrashEffect() {
  return crashEffectDefinitions.find((effect) => effect.id === state.previewCrashEffect) || getSelectedCrashEffect();
}

function buyOrSelectCrashEffect(effect) {
  state.previewCrashEffect = effect.id;
  if (state.ownedCrashEffects.has(effect.id)) {
    state.selectedCrashEffect = effect.id;
    saveSelectedCrashEffect(effect.id);
    beep(780, 0.05, "square", 0.03);
    return;
  }

  if (state.coins >= effect.price) {
    state.coins -= effect.price;
    state.ownedCrashEffects.add(effect.id);
    state.selectedCrashEffect = effect.id;
    saveNumber(COINS_KEY, state.coins);
    saveOwnedCrashEffects(state.ownedCrashEffects);
    saveSelectedCrashEffect(effect.id);
    beep(620, 0.06, "square", 0.035);
    beep(920, 0.08, "square", 0.035, 0.06);
  } else {
    beep(140, 0.08, "sawtooth", 0.035);
  }
}

function addParticle(x, y, vx, vy, life, color, size = 4) {
  state.particles.push({ x, y, vx, vy, life, maxLife: life, color, size });
}

function addWallBurst(wall) {
  for (let i = 0; i < 14; i += 1) {
    const top = Math.random() < 0.5;
    const y = top ? rand(24, Math.max(26, wall.top)) : rand(Math.min(GROUND - 28, wall.bottom), GROUND - 10);
    addParticle(wall.x + wall.w / 2, y, rand(-5.2, -1.2), rand(-2.6, 2.6), rand(14, 26), pick([wall.color, "#6ee7ff", "#f7fbff"]), rand(3, 6));
  }
}

function addScoreEffect(x, y, color) {
  state.bgFlash = { color, life: 12, maxLife: 12 };
  for (let i = 0; i < 8; i += 1) {
    state.bgEffects.push({
      kind: "block",
      x: x + rand(-28, 28),
      y: y + rand(-42, 42),
      vx: rand(-2.8, 2.8),
      vy: rand(-2.4, 2.4),
      size: rand(8, 18),
      life: rand(18, 30),
      maxLife: 30,
      color: pick([color, "#ffd166", "#6ee7ff"]),
    });
  }
}

function addPortalWarpEffect(fromY, toY) {
  for (let i = 0; i < 7; i += 1) {
    addParticle(PLAYER_X + rand(-20, 20), fromY, rand(-3.5, 3.5), rand(-2, 2), rand(14, 24), pick(["#6ee7ff", "#9b5cff", "#f7fbff"]), rand(3, 5));
    addParticle(PLAYER_X + rand(-20, 20), toY, rand(-3.5, 3.5), rand(-2, 2), rand(14, 24), pick(["#6ee7ff", "#9b5cff", "#f7fbff"]), rand(3, 5));
  }
}

function warpThroughPortals() {
  if (state.y + PORTAL_TRIGGER_MARGIN > BOTTOM_PORTAL_Y) {
    playSound("portal");
    addPortalWarpEffect(BOTTOM_PORTAL_Y, TOP_PORTAL_Y + 30);
    state.y = TOP_PORTAL_Y + 34;
    state.velocity = Math.min(state.velocity, 2.4);
  } else if (state.y - PORTAL_TRIGGER_MARGIN < TOP_PORTAL_Y) {
    playSound("portal");
    addPortalWarpEffect(TOP_PORTAL_Y, BOTTOM_PORTAL_Y - 30);
    state.y = BOTTOM_PORTAL_Y - 34;
    state.velocity = Math.max(state.velocity, -2.4);
  }
}

function spawnWall() {
  const gap = rand(130, 164);
  const center = rand(158, 342);
  state.walls.push({
    x: W + 40,
    w: 68,
    top: center - gap / 2,
    bottom: center + gap / 2,
    color: pick(colors),
    scored: false,
    fading: false,
    fade: 1,
  });
}

function jump() {
  initAudio();
  if (state.mode === "menu") {
    if (state.menuScreen !== "main") return;
    startGame();
    return;
  }
  if (state.mode === "paused") {
    resumeGame();
    return;
  }
  if (state.mode === "crashed") {
    return;
  }
  state.velocity = state.jump;
  playSound("jump");
  for (let i = 0; i < 4; i += 1) {
    addParticle(PLAYER_X - 14, state.y + rand(-12, 12), rand(-3.5, -1), rand(-1.4, 1.4), 16, "#6ee7ff", rand(2, 4));
  }
}

function crash() {
  if (state.mode === "crashed") return;
  playSound("crash");
  state.mode = "crashed";
  state.crashCooldown = 0;
  state.best = Math.max(state.best, state.score);
  saveBest(state.best);
  addCrashParticles();
}

function addCrashParticles() {
  const effect = getSelectedCrashEffect();
  const count = effect.id === "classic" ? 22 : 34;
  for (let i = 0; i < count; i += 1) {
    const spread = effect.shape === "glitch" ? 8 : effect.shape === "bedrock" ? 3.6 : 5.4;
    const vx = effect.shape === "totem" ? rand(-3, 3) : rand(-spread, spread);
    const vy = effect.shape === "totem" ? rand(-7, -2) : rand(-spread, spread);
    const size = effect.shape === "bedrock" ? rand(6, 11) : effect.shape === "glitch" ? rand(3, 13) : rand(3, 8);
    addParticle(
      PLAYER_X + rand(-8, 8),
      state.y + rand(-8, 8),
      vx,
      vy,
      rand(22, 44),
      pick(effect.colors),
      size
    );
  }
}

function collides(wall) {
  const px1 = PLAYER_X - 22;
  const px2 = PLAYER_X + 22;
  const py1 = state.y - 22;
  const py2 = state.y + 22;
  const wx1 = wall.x + WALL_HITBOX_INSET_X;
  const wx2 = wall.x + wall.w - WALL_HITBOX_INSET_X;
  const topHit = py1 < wall.top - WALL_HITBOX_GAP_BONUS;
  const bottomHit = py2 > wall.bottom + WALL_HITBOX_GAP_BONUS;
  return px2 > wx1 && px1 < wx2 && (topHit || bottomHit);
}

function update(dt = 1) {
  state.frame += dt;

  if (state.mode === "paused") {
    return;
  }

  if (state.mode === "menu") {
    state.world += 0.35 * dt;
  }

  if (state.mode === "playing") {
    state.world += dt;
    state.velocity += state.gravity * dt;
    state.y += state.velocity * dt;
    state.nextWall -= dt;

    const speed = Math.min(9.2, 5.7 + state.score * 0.07);
    if (state.nextWall <= 0) {
      spawnWall();
      state.nextWall = rand(70, 92);
    }

    for (let i = state.walls.length - 1; i >= 0; i -= 1) {
      const wall = state.walls[i];
      wall.x -= speed * dt;
      if (!wall.scored && wall.x + wall.w < PLAYER_X) {
        wall.scored = true;
        wall.fading = true;
        state.score += 1;
        addCoin();
        state.best = Math.max(state.best, state.score);
        saveBest(state.best);
        playSound("score");
        addWallBurst(wall);
        addScoreEffect(PLAYER_X + 110, (wall.top + wall.bottom) / 2, wall.color);
      }
      if (wall.fading) wall.fade -= 0.08 * dt;
      if (wall.x < -110 || wall.fade <= 0) state.walls.splice(i, 1);
    }

    warpThroughPortals();
    for (const wall of state.walls) {
      if (!wall.scored && !wall.fading && collides(wall)) {
        crash();
        break;
      }
    }
  }

  for (let i = state.particles.length - 1; i >= 0; i -= 1) {
    const p = state.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) state.particles.splice(i, 1);
  }

  for (let i = state.bgEffects.length - 1; i >= 0; i -= 1) {
    const effect = state.bgEffects[i];
    if (effect.kind === "block") {
      effect.x += effect.vx * dt;
      effect.y += effect.vy * dt;
      effect.vy += 0.08 * dt;
    }
    effect.life -= dt;
    if (effect.life <= 0) state.bgEffects.splice(i, 1);
  }

  if (state.bgFlash) {
    state.bgFlash.life -= dt;
    if (state.bgFlash.life <= 0) {
      state.bgFlash = null;
    }
  }
}

function drawText(text, x, y, size, color, align = "center", shadow = true) {
  ctx.save();
  ctx.imageSmoothingEnabled = graphicsSettings.smoothing === "smooth";
  ctx.font = `900 ${size}px "Courier New", Consolas, monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  if (shadow) {
    ctx.fillStyle = "#05070d";
    ctx.fillText(text, Math.round(x + 4), Math.round(y + 4));
  }
  ctx.fillStyle = color;
  ctx.fillText(text, Math.round(x), Math.round(y));
  ctx.restore();
}

function shadeColor(hex, amount) {
  const cacheKey = `${hex}:${amount}`;
  if (shadeCache.has(cacheKey)) return shadeCache.get(cacheKey);

  const value = hex.replace("#", "");
  const number = parseInt(value, 16);
  const r = Math.max(0, Math.min(255, (number >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((number >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (number & 255) + amount));
  const shaded = `rgb(${r}, ${g}, ${b})`;
  shadeCache.set(cacheKey, shaded);
  return shaded;
}

function drawBeveledRect(x, y, w, h, color, light = 34, dark = -48) {
  x = Math.round(x);
  y = Math.round(y);
  w = Math.round(w);
  h = Math.round(h);
  if (graphicsSettings.style === "8bit") {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = shadeColor(color, dark);
    ctx.fillRect(x, y + h - 4, w, 4);
    return;
  }
  ctx.fillStyle = shadeColor(color, dark);
  ctx.fillRect(x + 4, y + 4, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = shadeColor(color, light);
  ctx.fillRect(x, y, w, 5);
  ctx.fillRect(x, y, 5, h);
  ctx.fillStyle = shadeColor(color, Math.round(light * 1.65));
  const highlightSize = h < 20 ? 2 : 4;
  ctx.fillRect(x + 7, y + 7, Math.max(8, Math.floor(w * 0.42)), highlightSize);
  if (h >= 24) ctx.fillRect(x + 7, y + 13, 4, Math.max(6, Math.floor(h * 0.34)));
  ctx.fillStyle = shadeColor(color, Math.round(light * 0.55));
  if (h >= 22) ctx.fillRect(x + 8, y + h - 13, Math.max(8, Math.floor(w * 0.32)), 3);
  ctx.fillStyle = shadeColor(color, dark);
  ctx.fillRect(x, y + h - 5, w, 5);
  ctx.fillRect(x + w - 5, y, 5, h);
  ctx.fillStyle = shadeColor(color, Math.round(dark * 1.35));
  if (h >= 22) {
    ctx.fillRect(x + Math.floor(w * 0.58), y + h - 12, Math.max(10, Math.floor(w * 0.32)), 4);
    ctx.fillRect(x + w - 12, y + Math.floor(h * 0.48), 4, Math.max(8, Math.floor(h * 0.34)));
  }
}

function drawDither(x, y, w, h, color) {
  ctx.fillStyle = color;
  for (let py = Math.round(y); py < y + h; py += 16) {
    for (let px = Math.round(x + ((py / 16) % 2) * 8); px < x + w; px += 16) {
      ctx.fillRect(px, py, 4, 4);
    }
  }
}

function drawBackground() {
  ctx.imageSmoothingEnabled = graphicsSettings.smoothing === "smooth";
  ctx.fillStyle = state.bgFlash ? shadeColor(state.bgFlash.color, -105) : "#091426";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = state.bgFlash ? shadeColor(state.bgFlash.color, -78) : "#18345a";
  ctx.fillRect(0, 0, W, 120);
  ctx.fillStyle = state.bgFlash ? shadeColor(state.bgFlash.color, -92) : "#13284a";
  ctx.fillRect(0, 120, W, 160);
  ctx.fillStyle = state.bgFlash ? shadeColor(state.bgFlash.color, -110) : "#0b1b33";
  ctx.fillRect(0, 280, W, GROUND - 280);

  drawShadeBands();

  ctx.fillStyle = "rgba(110, 231, 255, 0.08)";
  const lineOffset = (state.world * 1.2) % 64;
  for (let y = 72 - lineOffset; y < GROUND; y += 64) {
    ctx.fillRect(0, Math.round(y), W, 3);
  }

  drawPixelTexture();

  const tileOffset = (state.world * 1.6) % 72;
  for (let x = -tileOffset; x < W + 72; x += 72) {
    drawBackgroundBird(Math.round(x + 20), GROUND + 22, 0.32, "#244761");
  }

  drawBackgroundEffects();

  ctx.fillStyle = "#0b1117";
  ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.fillStyle = "#2d5a73";
  ctx.fillRect(0, GROUND, W, 8);
  ctx.fillStyle = "#8eeaff";
  ctx.fillRect(0, GROUND, W, 3);

  drawEdgePortals();

  if (state.bgFlash) {
    const t = state.bgFlash.life / state.bgFlash.maxLife;
    ctx.save();
    ctx.globalAlpha = 0.16 * t;
    ctx.fillStyle = state.bgFlash.color;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}

function drawBackgroundEffects() {
  for (const effect of state.bgEffects) {
    const t = Math.max(0, effect.life / effect.maxLife);
    ctx.save();
    ctx.globalAlpha = 0.78 * t;
    ctx.strokeStyle = effect.color;
    ctx.fillStyle = effect.color;
    if (effect.kind === "block") {
      const size = Math.round(effect.size * (0.75 + t * 0.25));
      drawBeveledRect(effect.x, effect.y, size, size, effect.color, 24, -38);
    }
    ctx.restore();
  }
}

function drawShadeBands() {
  const offset = (state.world * 0.38) % 180;
  const bands = [
    { y: 46, h: 30, color: "rgba(110, 231, 255, 0.10)", speed: 1 },
    { y: 136, h: 46, color: "rgba(155, 92, 255, 0.10)", speed: 0.7 },
    { y: 248, h: 36, color: "rgba(124, 255, 107, 0.055)", speed: 1.25 },
    { y: 330, h: 58, color: "rgba(255, 209, 102, 0.045)", speed: 0.55 },
  ];
  for (const band of bands) {
    const x = -((offset * band.speed) % 180);
    ctx.fillStyle = band.color;
    for (let px = x; px < W + 180; px += 180) {
      ctx.fillRect(Math.round(px), band.y, 92, band.h);
      ctx.fillRect(Math.round(px + 102), band.y + Math.floor(band.h / 2), 48, Math.max(8, Math.floor(band.h / 3)));
    }
  }
}

function drawPixelTexture() {
  const drift = Math.floor(state.world * 0.22) % 24;
  const colors = [
    "rgba(142, 234, 255, 0.13)",
    "rgba(155, 92, 255, 0.11)",
    "rgba(124, 255, 107, 0.08)",
    "rgba(255, 209, 102, 0.07)",
    "rgba(6, 13, 25, 0.20)",
  ];
  for (let y = 34; y < GROUND - 18; y += 24) {
    for (let x = -drift; x < W; x += 24) {
      const index = Math.abs(Math.floor((x + drift) / 24) * 3 + Math.floor(y / 24) * 2) % colors.length;
      const sparkle = index !== colors.length - 1;
      ctx.fillStyle = colors[index];
      ctx.fillRect(Math.round(x), y, 5, 5);
      if (sparkle) {
        ctx.fillStyle = "rgba(247, 251, 255, 0.08)";
        ctx.fillRect(Math.round(x + 10), y + 10, 4, 4);
      }
    }
  }
}

function drawBackgroundBird(x, y, scale, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = 0.72;
  drawBeveledRect(-26, -22, 46, 38, color, 24, -38);
  ctx.fillStyle = shadeColor(color, 58);
  ctx.fillRect(-18, -14, 10, 10);
  ctx.fillRect(-8, -10, 10, 10);
  ctx.fillStyle = shadeColor(color, 24);
  ctx.fillRect(-18, 1, 15, 5);
  ctx.fillStyle = "#0b1117";
  ctx.fillRect(5, -10, 9, 9);
  ctx.fillRect(-18, 4, 16, 7);
  ctx.fillStyle = shadeColor(color, 70);
  ctx.fillRect(20, -2, 18, 12);
  ctx.fillStyle = shadeColor(color, -48);
  ctx.fillRect(21, 8, 12, 4);
  ctx.restore();
}

function drawEdgePortals() {
  const pulse = Math.round(Math.sin(state.frame * 0.1) * 2);
  const portals = [
    { y: TOP_PORTAL_Y, color: "#397c91", dark: "#0d3342" },
    { y: BOTTOM_PORTAL_Y, color: "#6f4aa8", dark: "#251a45" },
  ];

  for (const portal of portals) {
    ctx.save();
    drawBeveledRect(12, portal.y - 10 - pulse, W - 24, 20 + pulse * 2, portal.dark, 22, -34);
    ctx.fillStyle = portal.color;
    ctx.fillRect(34, portal.y - 6 - pulse, W - 68, 4);
    ctx.fillRect(34, portal.y + 2 + pulse, W - 68, 4);
    ctx.fillRect(34, portal.y - 2, 14, 4);
    ctx.fillRect(W - 48, portal.y - 2, 14, 4);
    ctx.restore();
  }
}

function drawWalls() {
  for (const wall of state.walls) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, wall.fade);
    const x = Math.round(wall.x);
    const top = Math.round(wall.top);
    const bottom = Math.round(wall.bottom);
    const w = Math.round(wall.w);
    drawBeveledRect(x, 0, w, top, wall.color, 38, -62);
    drawBeveledRect(x, bottom, w, GROUND - bottom, wall.color, 38, -62);
    ctx.fillStyle = "#15151f";
    ctx.fillRect(x + 12, 0, w - 24, top);
    ctx.fillRect(x + 12, bottom, w - 24, GROUND - bottom);
    ctx.strokeStyle = "#f7fbff";
    ctx.lineWidth = 4;
    ctx.globalAlpha = Math.max(0, wall.fade) * 0.7;
    ctx.strokeRect(x + 4, top - 8, w - 8, 8);
    ctx.strokeRect(x + 4, bottom, w - 8, 8);
    ctx.fillStyle = wall.color;
    for (let y = 14; y < top - 18; y += 30) ctx.fillRect(x + 18, y, w - 36, 12);
    for (let y = bottom + 18; y < GROUND - 20; y += 30) ctx.fillRect(x + 18, y, w - 36, 12);

    ctx.restore();
  }
}

function drawParticles() {
  for (const p of state.particles) {
    const t = p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = Math.max(0, t);
    const size = Math.max(3, Math.round(p.size * (0.7 + t)));
    const x = Math.round(p.x - size / 2);
    const y = Math.round(p.y - size / 2);
    ctx.fillStyle = p.color;
    ctx.fillRect(x, y, size, size);
    if (size > 4) {
      ctx.fillStyle = "#f7fbff";
      ctx.fillRect(x, y, Math.max(2, Math.floor(size / 2)), 2);
    }
    ctx.restore();
  }
}

function drawPlayer() {
  if (state.mode === "menu" || state.mode === "crashed") return;
  const skin = getSelectedSkin();
  const rotationSteps = Math.round((Math.sin(state.world * 0.18) * 0.14 + state.velocity * 0.035) / (Math.PI / 12));
  const rotation = rotationSteps * (Math.PI / 12);
  ctx.save();
  ctx.translate(Math.round(PLAYER_X), Math.round(state.y));
  ctx.rotate(rotation);
  drawSkinAura(skin, 0, 0, 1);
  const body = getAnimatedSkinColor(skin);
  drawSkinBody(skin, body);
  ctx.restore();
}

function drawSkinAvatar(skin, x, y, scale = 1, rotation = 0) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  drawSkinAura(skin, 0, 0, 1);
  const body = getAnimatedSkinColor(skin);
  drawSkinBody(skin, body);
  ctx.restore();
}

function drawSkinBody(skin, body) {
  if (skin.id === "void") {
    drawBeveledRect(-28, -28, 56, 56, body, 36, -70);
    ctx.fillStyle = "#08040f";
    ctx.fillRect(-17, -18, 13, 13);
    ctx.fillRect(6, 8, 16, 14);
    ctx.fillRect(-26, 16, 9, 10);
    ctx.fillStyle = "#dbc9ff";
    ctx.fillRect(4, -15, 13, 8);
    ctx.fillStyle = "#7cff6b";
    ctx.fillRect(24, 2, 16, 14);
    return;
  }

  if (skin.id === "ice") {
    drawBeveledRect(-25, -25, 50, 50, body, 52, -46);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-15, -36, 12, 15);
    ctx.fillRect(2, -39, 12, 18);
    ctx.fillRect(17, -33, 10, 12);
    ctx.fillStyle = "#0b2d3b";
    ctx.fillRect(6, -13, 12, 12);
    ctx.fillStyle = "#6ee7ff";
    ctx.fillRect(24, 2, 18, 12);
    return;
  }

  if (skin.id === "gold") {
    drawBeveledRect(-27, -24, 54, 50, body, 58, -50);
    ctx.fillStyle = "#ff9f1c";
    ctx.fillRect(-22, -40, 9, 18);
    ctx.fillRect(-5, -46, 10, 24);
    ctx.fillRect(14, -40, 9, 18);
    ctx.fillStyle = "#fff7c2";
    ctx.fillRect(-24, -24, 48, 6);
    ctx.fillStyle = "#2a2100";
    ctx.fillRect(6, -12, 12, 12);
    ctx.fillStyle = "#ff9f1c";
    ctx.fillRect(24, 0, 18, 16);
    return;
  }

  if (skin.id === "neon") {
    ctx.fillStyle = "#001f15";
    ctx.fillRect(-28, -28, 56, 56);
    ctx.strokeStyle = getAnimatedSkinColor(skin);
    ctx.lineWidth = 5;
    ctx.strokeRect(-25, -25, 50, 50);
    ctx.fillStyle = "#00ff9d";
    ctx.fillRect(-18, -18, 34, 5);
    ctx.fillRect(-18, 12, 34, 5);
    ctx.fillStyle = "#ff4dff";
    ctx.fillRect(7, -8, 11, 11);
    ctx.fillRect(24, 1, 18, 12);
    return;
  }

  if (skin.id === "ghost") {
    drawBeveledRect(-25, -28, 50, 46, body, 34, -42);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-18, 12, 10, 14);
    ctx.fillRect(-2, 12, 10, 14);
    ctx.fillRect(14, 12, 10, 14);
    ctx.fillStyle = "#26415f";
    ctx.fillRect(-10, -10, 10, 10);
    ctx.fillRect(9, -10, 10, 10);
    ctx.fillStyle = "#b8f3ff";
    ctx.fillRect(23, 0, 16, 12);
    return;
  }

  if (skin.id === "pumpkin") {
    drawBeveledRect(-28, -24, 56, 48, body, 36, -50);
    ctx.fillStyle = "#2e1600";
    ctx.fillRect(-14, -8, 10, 10);
    ctx.fillRect(8, -8, 10, 10);
    ctx.fillRect(-10, 10, 28, 6);
    ctx.fillStyle = "#7cff6b";
    ctx.fillRect(-4, -38, 10, 15);
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(24, 0, 18, 14);
    return;
  }

  if (skin.id === "royal") {
    drawBeveledRect(-28, -24, 56, 52, body, 42, -58);
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(-23, -42, 8, 18);
    ctx.fillRect(-4, -48, 8, 24);
    ctx.fillRect(15, -42, 8, 18);
    ctx.fillRect(-25, -26, 50, 8);
    ctx.fillStyle = "#f7fbff";
    ctx.fillRect(-14, -8, 12, 12);
    ctx.fillRect(8, -8, 12, 12);
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(24, 1, 18, 15);
    return;
  }

  if (skin.id === "dragon") {
    drawBeveledRect(-30, -24, 60, 50, body, 42, -58);
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(-23, -40, 10, 18);
    ctx.fillRect(10, -40, 10, 18);
    ctx.fillStyle = "#ff3864";
    ctx.fillRect(5, -12, 12, 12);
    ctx.fillStyle = "#d7ffc4";
    ctx.fillRect(-24, 6, 40, 8);
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(24, -2, 22, 18);
    return;
  }

  if (skin.id === "shadow") {
    ctx.fillStyle = "#05070d";
    ctx.fillRect(-30, -30, 60, 60);
    ctx.strokeStyle = getAnimatedSkinColor(skin);
    ctx.lineWidth = 4;
    ctx.strokeRect(-26, -26, 52, 52);
    ctx.fillStyle = "#f7fbff";
    ctx.fillRect(4, -13, 14, 8);
    ctx.fillStyle = "#9b5cff";
    ctx.fillRect(24, 2, 18, 12);
    return;
  }

  drawBeveledRect(-26, -26, 52, 52, body, 42, -54);
  ctx.strokeStyle = skin.outline;
  ctx.lineWidth = 3;
  ctx.strokeRect(-26, -26, 52, 52);
  ctx.fillStyle = shadeColor(body, 58);
  ctx.fillRect(-18, -18, 18, 7);
  ctx.fillRect(-18, -8, 8, 12);
  ctx.fillStyle = shadeColor(body, 28);
  ctx.fillRect(-5, -15, 15, 5);
  ctx.fillRect(-18, 8, 16, 5);
  ctx.fillStyle = shadeColor(body, -26);
  ctx.fillRect(5, 7, 18, 6);
  ctx.fillStyle = shadeColor(body, -52);
  ctx.fillRect(6, 14, 16, 8);
  ctx.fillRect(15, -24, 8, 16);

  if (skin.variant === "visor") {
    ctx.fillStyle = "#071018";
    ctx.fillRect(-10, -14, 28, 12);
    ctx.fillStyle = "#9b5cff";
    ctx.fillRect(-6, -10, 20, 4);
  } else if (skin.variant === "gem") {
    ctx.fillStyle = "#ffd0dc";
    ctx.fillRect(-4, -20, 12, 12);
    ctx.fillStyle = "#f7fbff";
    ctx.fillRect(6, -10, 12, 12);
  } else if (skin.variant === "stripes") {
    ctx.fillStyle = "#ffe0a3";
    ctx.fillRect(-22, -10, 44, 6);
    ctx.fillRect(-22, 8, 44, 6);
    ctx.fillStyle = skin.eye;
    ctx.fillRect(5, -20, 12, 12);
  } else if (skin.variant === "mask") {
    ctx.fillStyle = "#05070d";
    ctx.fillRect(-22, -17, 44, 18);
    ctx.fillStyle = "#f7fbff";
    ctx.fillRect(5, -13, 12, 6);
  } else if (skin.variant === "candy") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-20, -17, 42, 7);
    ctx.fillRect(-20, 4, 42, 7);
    ctx.fillStyle = "#ff3864";
    ctx.fillRect(-4, -26, 10, 52);
    ctx.fillStyle = skin.eye;
    ctx.fillRect(9, -14, 10, 10);
  } else {
    ctx.fillStyle = skin.eye;
    ctx.fillRect(5, -14, 12, 12);
  }

  ctx.fillStyle = skin.beak;
  ctx.beginPath();
  ctx.moveTo(24, 0);
  ctx.lineTo(44, 9);
  ctx.lineTo(24, 18);
  ctx.fill();
  ctx.fillStyle = shadeColor(skin.beak, 42);
  ctx.fillRect(26, 3, 10, 4);
  ctx.fillStyle = shadeColor(skin.beak, -42);
  ctx.fillRect(26, 12, 13, 4);
}

function drawSkinAura(skin, x, y, scale = 1) {
  if (!skin.aura) return;

  const palette = {
    void: ["#2b124f", "#9b5cff", "#dbc9ff"],
    ice: ["#6ee7ff", "#b8f3ff", "#ffffff"],
    gold: ["#ff9f1c", "#ffe066", "#fff7c2"],
    neon: ["#00ff9d", "#6ee7ff", "#ff4dff"],
    royal: ["#4d7cff", "#9b5cff", "#ffd166"],
    ghost: ["#ffffff", "#b8f3ff", "#e8f4ff"],
    ember: ["#ff3864", "#ff7a1a", "#ffe066"],
    plasma: ["#ff4dff", "#9b5cff", "#6ee7ff"],
    dragon: ["#7cff6b", "#ffd166", "#ff3864"],
    shadow: ["#101018", "#4d4d7c", "#8b8cff"],
    comet: ["#6ee7ff", "#fff7c2", "#ff9f1c"],
  }[skin.aura] || [skin.outline, skin.body, "#f7fbff"];

  const pulse = Math.sin(state.frame * 0.12) * 3;
  ctx.save();
  ctx.globalAlpha = 0.26;
  ctx.fillStyle = palette[0];
  ctx.fillRect(x - 38 * scale - pulse, y - 38 * scale - pulse, 76 * scale + pulse * 2, 76 * scale + pulse * 2);
  ctx.restore();

  const count = skin.price >= 1000 ? 8 : 5;
  for (let i = 0; i < count; i += 1) {
    const angle = state.frame * 0.045 + i * ((Math.PI * 2) / count);
    const radius = (38 + (i % 3) * 8 + Math.sin(state.frame * 0.05 + i) * 4) * scale;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    const size = (skin.aura === "void" ? 5 + (i % 2) * 3 : 4 + (i % 3)) * scale;
    const color = palette[i % palette.length];
    ctx.save();
    ctx.globalAlpha = 0.7;
    drawBeveledRect(px - size / 2, py - size / 2, size, size, color, 24, -34);
    ctx.restore();
  }
}

function drawMenu() {
  if (state.menuScreen === "settings") {
    drawSettingsMenu();
    return;
  }
  if (state.menuScreen === "skins") {
    drawSkinsMenu();
    return;
  }

  drawText("HOOPER BIRD", W / 2 + 4, 132 + 4, 54, "#05070d", "center", false);
  drawText("HOOPER BIRD", W / 2, 132, 54, "#f7fbff", "center", false);
  drawText("HOOPER BIRD", W / 2, 126, 54, "#6ee7ff", "center", false);
  drawBeveledRect(nameButton.x, nameButton.y, nameButton.w, nameButton.h, "#26415f", 28, -44);
  drawText(`PLAYER: ${state.playerName || "PLAYER"}`, W / 2, nameButton.y + 20, 16, "#f7fbff", "center", false);

  ctx.save();
  ctx.translate(250, 276);
  ctx.rotate(Math.round(Math.sin(state.frame * 0.025) * 2) * (Math.PI / 18));
  drawSkinAvatar(getSelectedSkin(), 0, 0, 1.35, 0);
  ctx.restore();

  const pulse = Math.round(Math.sin(state.frame * 0.12) * 4);
  const x = W / 2 - 72 - pulse / 2;
  const y = 270 - pulse / 2;
  const w = 144 + pulse;
  const h = 98 + pulse;
  drawBeveledRect(x, y, w, h, "#4fcf5e", 54, -64);
  ctx.strokeStyle = "#d7ffc4";
  ctx.lineWidth = 5;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = "#b8ffbf";
  ctx.fillRect(Math.round(x + 14), Math.round(y + 12), Math.round(w - 28), 7);
  ctx.fillStyle = "#226b42";
  ctx.fillRect(Math.round(x + 18), Math.round(y + h - 18), Math.round(w - 36), 7);
  ctx.fillStyle = "#f7fbff";
  ctx.fillRect(Math.round(x + 54), Math.round(y + 28), 18, 42);
  ctx.fillRect(Math.round(x + 72), Math.round(y + 36), 18, 26);
  ctx.fillRect(Math.round(x + 90), Math.round(y + 44), 18, 10);

  const settingsX = x + w + 24;
  const settingsY = y + 14;
  drawBeveledRect(settingsX, settingsY, 70, 70, "#3fafd0", 46, -58);
  ctx.fillStyle = "#071018";
  ctx.fillRect(settingsX + 14, settingsY + 30, 42, 10);
  ctx.fillRect(settingsX + 30, settingsY + 14, 10, 42);
  ctx.fillStyle = "#ffd166";
  ctx.fillRect(settingsX + 26, settingsY + 26, 18, 18);

  const skinsX = x - 94;
  const skinsY = y + 14;
  drawBeveledRect(skinsX, skinsY, 70, 70, "#4fcf5e", 46, -58);
  ctx.fillStyle = "#071018";
  ctx.fillRect(skinsX + 16, skinsY + 16, 38, 38);
  ctx.fillStyle = getSelectedSkin().body;
  ctx.fillRect(skinsX + 23, skinsY + 23, 24, 24);

  drawText(`BEST ${state.best}`, W / 2, 408, 27, "#f7fbff");
  drawText(`COINS ${state.coins}`, W / 2, 430, 18, "#ffd166", "center", false);
  drawText("SPACE або PLAY - старт", W / 2, 444, 17, "#8fb3c8");

  ctx.strokeStyle = "#6ee7ff";
  ctx.lineWidth = 4;
  for (let i = 0; i < 6; i += 1) {
    const sx = Math.round(95 + i * 146 + Math.sin((state.frame + i * 18) * 0.04) * 16);
    const sy = Math.round(506 + Math.sin((state.frame + i * 28) * 0.05) * 6);
    ctx.strokeRect(sx, sy, 32, 32);
  }
}

function drawBackButton() {
  drawBeveledRect(42, 34, 118, 38, "#68253a", 28, -44);
  drawText("BACK", 101, 57, 18, "#f7fbff", "center", false);
}

function drawTabButton(label, x, y, active) {
  drawBeveledRect(x, y, 148, 36, active ? "#d8a846" : "#26415f", 30, -44);
  drawText(label, x + 74, y + 22, 17, "#f7fbff", "center", false);
}

function drawSettingsMenu() {
  drawText("SETTINGS", W / 2, 70, 42, "#f7fbff");
  drawBackButton();
  drawTabButton("SOUND", 310, 104, state.settingsTab === "sound");
  drawTabButton("GRAPHICS", 468, 104, state.settingsTab === "graphics");
  drawBeveledRect(198, 154, 564, 360, "#142236", 32, -50);

  if (state.settingsTab === "sound") {
    drawText("SOUND MIX", W / 2, 174, 22, "#6ee7ff", "center", false);

    for (const button of soundButtons) {
      const enabled = soundSettings[button.key] !== false;
      drawBeveledRect(button.x, button.y, button.w, button.h, enabled ? "#226b42" : "#68253a", 28, -44);
      ctx.fillStyle = enabled ? "#7cff6b" : "#ff3864";
      ctx.fillRect(button.x + 4, button.y + 4, button.w - 8, 5);
      ctx.fillStyle = enabled ? "#d7ffc4" : "#ffd0dc";
      ctx.font = '900 14px "Courier New", Consolas, monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`${button.label}:${enabled ? "ON" : "OFF"}`, button.x + button.w / 2, button.y + 19);
    }
    drawText("MUSIC", 238, 310, 17, "#8fb3c8", "left", false);
    drawText("MENU TRACK", 238, 386, 17, "#8fb3c8", "left", false);
    for (const button of musicButtons) {
      const active = musicSettings[button.group] === button.value;
      drawBeveledRect(button.x, button.y, button.w, button.h, active ? "#226b42" : "#26415f", 28, -44);
      ctx.fillStyle = active ? "#7cff6b" : "#6ee7ff";
      ctx.fillRect(button.x + 4, button.y + 4, button.w - 8, 5);
      drawText(button.label, button.x + button.w / 2, button.y + 19, 14, "#f7fbff", "center", false);
    }
    return;
  }

  drawText("STYLE", 236, 326, 17, "#8fb3c8", "left", false);
  drawText("MAX FPS", 236, 402, 17, "#8fb3c8", "left", false);
  drawText("SMOOTHING", 236, 478, 17, "#8fb3c8", "left", false);
  for (const button of graphicsButtons) {
    const active = graphicsSettings[button.group] === button.value;
    drawBeveledRect(button.x, button.y, button.w, button.h, active ? "#226b42" : "#26415f", 28, -44);
    ctx.fillStyle = active ? "#7cff6b" : "#6ee7ff";
    ctx.fillRect(button.x + 4, button.y + 4, button.w - 8, 5);
    drawText(button.label, button.x + button.w / 2, button.y + 19, 14, "#f7fbff", "center", false);
  }
}

function drawSkinsMenu() {
  drawText("SHOP", W / 2, 70, 42, "#f7fbff");
  drawBackButton();
  drawText(`COINS ${state.coins}`, W / 2, 108, 19, "#ffd166", "center", false);
  drawTabButton("SKINS", 318, 88, state.shopTab === "skins");
  drawTabButton("CRASH", 476, 88, state.shopTab === "crash");

  if (state.shopTab === "crash") {
    drawBeveledRect(52, 126, 760, 368, "#142236", 32, -50);
    drawCrashShop();
    return;
  }

  drawBeveledRect(52, 126, 760, 368, "#142236", 32, -50);
  drawText("PREVIEW", 238, 164, 18, "#8fb3c8", "center", false);
  drawText("CHOOSE SKIN", W / 2, 326, 18, "#6ee7ff", "center", false);

  const preview = getPreviewSkin();
  const owned = state.ownedSkins.has(preview.id);
  drawText(preview.name, 238, 196, 27, "#f7fbff", "center", false);
  drawText(owned ? "OWNED" : `${preview.price} COINS`, 238, 234, 20, owned ? "#7cff6b" : "#ffd166", "center", false);
  drawText(owned ? "CLICK BELOW TO USE" : "CLICK BELOW TO BUY", 238, 266, 14, "#8fb3c8", "center", false);
  drawSkinAvatar(preview, 604, 218, 1.7, Math.sin(state.frame * 0.03) * 0.08);

  for (const button of skinButtons) {
    const owned = state.ownedSkins.has(button.id);
    const selected = state.selectedSkin === button.id;
    const affordable = state.coins >= button.price;
    drawBeveledRect(button.x, button.y, button.w, button.h, selected ? "#6b5a23" : owned ? "#226b42" : affordable ? "#6f5c22" : "#68253a", 24, -42);
    ctx.fillStyle = selected ? "#ffd166" : owned ? "#7cff6b" : affordable ? "#ffd166" : "#ff3864";
    ctx.fillRect(button.x + 5, button.y + 5, 18, button.h - 10);
    ctx.fillStyle = button.body;
    ctx.fillRect(button.x + 9, button.y + 9, 10, 9);
    ctx.fillStyle = "#f7fbff";
    ctx.font = '900 10px "Courier New", Consolas, monospace';
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const status = selected ? "USE" : owned ? "OWN" : `${button.price}M`;
    ctx.fillText(`${button.name}`, button.x + 29, button.y + 10);
    ctx.textAlign = "right";
    ctx.fillText(status, button.x + button.w - 8, button.y + 21);
  }
}

function drawCrashShop() {
  const preview = getPreviewCrashEffect();
  const owned = state.ownedCrashEffects.has(preview.id);
  drawText("PREVIEW", 238, 164, 18, "#8fb3c8", "center", false);
  drawText("CHOOSE CRASH", W / 2, 326, 18, "#6ee7ff", "center", false);
  drawText(preview.name, 238, 196, 27, "#f7fbff", "center", false);
  drawText(owned ? "OWNED" : `${preview.price} COINS`, 238, 234, 20, owned ? "#7cff6b" : "#ffd166", "center", false);
  drawText(owned ? "CLICK BELOW TO USE" : "CLICK BELOW TO BUY", 238, 266, 14, "#8fb3c8", "center", false);
  drawCrashPreview(preview, 604, 218, 0.82);

  for (const button of crashButtons) {
    const owned = state.ownedCrashEffects.has(button.id);
    const selected = state.selectedCrashEffect === button.id;
    const affordable = state.coins >= button.price;
    drawBeveledRect(button.x, button.y, button.w, button.h, selected ? "#6b5a23" : owned ? "#226b42" : affordable ? "#6f5c22" : "#68253a", 24, -42);
    ctx.fillStyle = selected ? "#ffd166" : owned ? "#7cff6b" : affordable ? "#ffd166" : "#ff3864";
    ctx.fillRect(button.x + 4, button.y + 4, 22, button.h - 8);
    ctx.fillStyle = button.colors[0];
    ctx.fillRect(button.x + 10, button.y + 9, 10, 10);
    ctx.fillStyle = "#f7fbff";
    ctx.font = '900 10px "Courier New", Consolas, monospace';
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const status = selected ? "USE" : owned ? "OWN" : `${button.price}M`;
    ctx.fillText(button.name, button.x + 33, button.y + 12);
    ctx.textAlign = "right";
    ctx.fillText(status, button.x + button.w - 8, button.y + 24);
  }
}

function drawCrashPreview(effect, x, y, scale = 1) {
  for (let i = 0; i < 18; i += 1) {
    const angle = state.frame * 0.05 + i * 0.7;
    const radius = (24 + (i % 4) * 15) * scale;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    const size = 12 * scale;
    drawBeveledRect(px - size / 2, py - size / 2, size, size, effect.colors[i % effect.colors.length], 24, -38);
  }
  drawText(effect.shape.toUpperCase(), x, y + 68 * scale, 15, "#8fb3c8", "center", false);
}

function drawHud() {
  if (state.mode === "menu") return;
  drawText(`Score ${state.score}`, 28, 34, 24, "#f7fbff", "left");
  drawText(`Best ${state.best}`, 28, 66, 15, "#8fb3c8", "left", false);
  drawText(`Coins ${state.coins}`, 28, 88, 15, "#ffd166", "left", false);
  if (state.mode === "playing") {
    drawPauseButton();
  }
  if (state.mode === "crashed") {
    drawDeathMenu();
  }
}

function drawDeathMenu() {
  ctx.fillStyle = "rgba(5, 7, 13, 0.72)";
  ctx.fillRect(0, 0, W, H);
  drawBeveledRect(W / 2 - 184, 132, 368, 314, "#142236", 32, -50);
  drawText("YOU DIED!", W / 2, 178, 42, "#ff3864");
  drawText(state.playerName || "PLAYER", W / 2, 218, 17, "#6ee7ff", "center", false);
  drawText(`SCORE ${state.score}`, W / 2, 244, 22, "#f7fbff", "center", false);
  drawText(`COINS ${state.coins}`, W / 2, 268, 18, "#ffd166", "center", false);
  drawText("ALT - RESTART   ESC - MAIN MENU", W / 2, 286, 14, "#8fb3c8", "center", false);
  for (const button of deathMenuButtons) {
    const color = button.action === "restart" ? "#226b42" : button.action === "share" ? "#26415f" : "#68253a";
    const stripe = button.action === "restart" ? "#7cff6b" : button.action === "share" ? "#6ee7ff" : "#ff3864";
    drawBeveledRect(button.x, button.y, button.w, button.h, color, 28, -44);
    ctx.fillStyle = stripe;
    ctx.fillRect(button.x + 5, button.y + 5, button.w - 10, 6);
    drawText(button.label, button.x + button.w / 2, button.y + 25, 18, "#f7fbff", "center", false);
  }
}

function drawPauseButton() {
  drawBeveledRect(pauseButton.x, pauseButton.y, pauseButton.w, pauseButton.h, "#3fafd0", 42, -54);
  ctx.fillStyle = "#0b1320";
  ctx.fillRect(pauseButton.x + 14, pauseButton.y + 12, 8, 28);
  ctx.fillRect(pauseButton.x + 30, pauseButton.y + 12, 8, 28);
}

function drawPauseMenu() {
  ctx.fillStyle = "rgba(5, 7, 13, 0.72)";
  ctx.fillRect(0, 0, W, H);
  drawBeveledRect(W / 2 - 154, 154, 308, 248, "#142236", 32, -50);
  ctx.fillStyle = "#6ee7ff";
  ctx.fillRect(W / 2 - 146, 162, 292, 8);
  ctx.fillRect(W / 2 - 146, 386, 292, 8);
  ctx.fillRect(W / 2 - 146, 162, 8, 232);
  ctx.fillRect(W / 2 + 138, 162, 8, 232);
  drawText("PAUSE", W / 2, 190, 28, "#f7fbff", "center", false);

  for (const button of pauseMenuButtons) {
    drawBeveledRect(button.x, button.y, button.w, button.h, button.action === "resume" ? "#226b42" : button.action === "restart" ? "#6f5c22" : "#68253a", 28, -44);
    ctx.fillStyle = button.action === "resume" ? "#7cff6b" : button.action === "restart" ? "#ffd166" : "#ff3864";
    ctx.fillRect(button.x + 5, button.y + 5, button.w - 10, 6);
    drawText(button.label, button.x + button.w / 2, button.y + 26, 18, "#f7fbff", "center", false);
  }
}

function render() {
  drawBackground();
  if (state.mode === "menu") {
    drawMenu();
  } else {
    drawWalls();
    drawParticles();
    drawPlayer();
    drawHud();
    if (state.mode === "paused") {
      drawPauseMenu();
    }
  }
}

let lastFrameTime = 0;
function frame(now = 0) {
  const fpsCap = Number(graphicsSettings.fpsCap) || 60;
  const minDelta = 1000 / fpsCap;
  if (!lastFrameTime) {
    lastFrameTime = now;
  }
  const elapsed = now - lastFrameTime;
  if (elapsed >= minDelta) {
    lastFrameTime = now;
    const dt = Math.min(3, elapsed / (1000 / 60));
    updateMusic(now);
    update(dt);
    render();
  }
  requestAnimationFrame(frame);
}

window.addEventListener("keydown", (event) => {
  if (state.mode === "crashed") {
    if (event.code === "AltLeft" || event.code === "AltRight") {
      event.preventDefault();
      startGame();
      return;
    }
    if (event.code === "Escape") {
      event.preventDefault();
      backToMenu();
      return;
    }
    if (event.code === "KeyS") {
      event.preventDefault();
      shareScore();
      return;
    }
    if (event.code === "Space" || event.code === "Enter" || event.code === "KeyR") {
      event.preventDefault();
      return;
    }
  }

  if (event.code === "Space") {
    event.preventDefault();
    if (spaceHeld || event.repeat) return;
    spaceHeld = true;
    jump();
  } else if (event.code === "KeyR") {
    startGame();
  } else if (event.code === "KeyP" || event.code === "Escape") {
    if (state.mode === "menu" && state.menuScreen !== "main") state.menuScreen = "main";
    else if (state.mode === "playing") pauseGame();
    else if (state.mode === "paused") resumeGame();
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code === "Space") {
    spaceHeld = false;
  }
});

canvas.addEventListener("pointerdown", (event) => {
  initAudio();
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * (W / rect.width);
  const y = (event.clientY - rect.top) * (H / rect.height);
  if (state.mode === "menu") {
    if (state.menuScreen !== "main") {
      if (x >= 42 && x <= 160 && y >= 34 && y <= 72) {
        state.menuScreen = "main";
        beep(380, 0.05, "square", 0.03);
        return;
      }

      if (state.menuScreen === "settings") {
        if (x >= 310 && x <= 458 && y >= 104 && y <= 140) {
          state.settingsTab = "sound";
          beep(520, 0.05, "square", 0.03);
          return;
        }
        if (x >= 468 && x <= 616 && y >= 104 && y <= 140) {
          state.settingsTab = "graphics";
          beep(620, 0.05, "square", 0.03);
          return;
        }
        if (state.settingsTab === "sound") {
          for (const button of soundButtons) {
            if (x >= button.x && x <= button.x + button.w && y >= button.y && y <= button.y + button.h) {
              toggleSound(button.key);
              return;
            }
          }
          for (const button of musicButtons) {
            if (x >= button.x && x <= button.x + button.w && y >= button.y && y <= button.y + button.h) {
              setMusicSetting(button.group, button.value);
              return;
            }
          }
        } else {
          for (const button of graphicsButtons) {
            if (x >= button.x && x <= button.x + button.w && y >= button.y && y <= button.y + button.h) {
              setGraphicsSetting(button.group, button.value);
              return;
            }
          }
        }
        return;
      }

      if (state.menuScreen === "skins") {
        if (x >= 318 && x <= 466 && y >= 88 && y <= 124) {
          state.shopTab = "skins";
          beep(520, 0.05, "square", 0.03);
          return;
        }
        if (x >= 476 && x <= 624 && y >= 88 && y <= 124) {
          state.shopTab = "crash";
          beep(520, 0.05, "square", 0.03);
          return;
        }
        if (state.shopTab === "skins") {
          for (const button of skinButtons) {
            if (x >= button.x && x <= button.x + button.w && y >= button.y && y <= button.y + button.h) {
              buyOrSelectSkin(button);
              return;
            }
          }
        } else {
          for (const button of crashButtons) {
            if (x >= button.x && x <= button.x + button.w && y >= button.y && y <= button.y + button.h) {
              buyOrSelectCrashEffect(button);
              return;
            }
          }
        }
        return;
      }
    }

    if (x >= 576 && x <= 646 && y >= 284 && y <= 354) {
      state.menuScreen = "settings";
      initAudio();
      beep(620, 0.05, "square", 0.03);
      return;
    }
    if (x >= 314 && x <= 384 && y >= 284 && y <= 354) {
      state.menuScreen = "skins";
      initAudio();
      beep(740, 0.05, "square", 0.03);
      return;
    }
    if (x >= nameButton.x && x <= nameButton.x + nameButton.w && y >= nameButton.y && y <= nameButton.y + nameButton.h) {
      askPlayerName();
      return;
    }
    if (x >= W / 2 - 82 && x <= W / 2 + 82 && y >= 260 && y <= 382) startGame();
    return;
  }

  if (state.mode === "playing") {
    if (x >= pauseButton.x && x <= pauseButton.x + pauseButton.w && y >= pauseButton.y && y <= pauseButton.y + pauseButton.h) {
      pauseGame();
      return;
    }
  }

  if (state.mode === "paused") {
    for (const button of pauseMenuButtons) {
      if (x >= button.x && x <= button.x + button.w && y >= button.y && y <= button.y + button.h) {
        if (button.action === "resume") resumeGame();
        if (button.action === "restart") startGame();
        if (button.action === "menu") backToMenu();
        return;
      }
    }
    return;
  }

  if (state.mode === "crashed") {
    for (const button of deathMenuButtons) {
      if (x >= button.x && x <= button.x + button.w && y >= button.y && y <= button.y + button.h) {
        if (button.action === "restart") startGame();
        if (button.action === "share") shareScore();
        if (button.action === "menu") backToMenu();
        return;
      }
    }
    return;
  }

  jump();
});

requestAnimationFrame(frame);
