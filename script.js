const SYMBOLS = [
  { name: "Star", path: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" },
  { name: "Heart", path: "M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" },
  { name: "Bolt", path: "M13 3L5 13h6l-1 8 8-10h-6z" },
  { name: "Moon", path: "M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" },
  { name: "Sun", path: "M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" },
  { name: "Diamond", path: "M12 3l8 9-8 9-8-9z" },
  { name: "Triangle", path: "M12 4l9 16H3z" },
  { name: "Hexagon", path: "M12 3l8 4.5v9L12 21l-8-4.5v-9z" }
];

const MISMATCH_DELAY = 800;
const STORAGE_KEY = "animex-memory-best";
const MUSIC_KEY = "animex-memory-music";
const MUSIC_SRC = "subway.mp3";
const MUSIC_VOLUME = 0.35;

const boardEl = document.getElementById("board");
const movesEl = document.getElementById("moves");
const timeEl = document.getElementById("time");
const bestEl = document.getElementById("best");
const resultEl = document.getElementById("result");
const resultTextEl = document.getElementById("result-text");
const restartEl = document.getElementById("restart");
const musicToggleEl = document.getElementById("music-toggle");

const music = new Audio(MUSIC_SRC);
music.loop = true;
music.volume = MUSIC_VOLUME;
music.preload = "auto";

let firstCard = null;
let secondCard = null;
let locked = false;
let moves = 0;
let matchedPairs = 0;
let seconds = 0;
let timerId = null;
let musicEnabled = readMusicPreference();

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function formatTime(total) {
  const minutes = Math.floor(total / 60);
  const rest = String(total % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

function readBest() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? Number(value) : null;
  } catch (error) {
    return null;
  }
}

function saveBest(value) {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch (error) {
    return;
  }
}

function readMusicPreference() {
  try {
    return localStorage.getItem(MUSIC_KEY) !== "off";
  } catch (error) {
    return true;
  }
}

function saveMusicPreference(enabled) {
  try {
    localStorage.setItem(MUSIC_KEY, enabled ? "on" : "off");
  } catch (error) {
    return;
  }
}

function renderMusicToggle() {
  musicToggleEl.setAttribute("aria-pressed", String(musicEnabled));
  musicToggleEl.textContent = musicEnabled ? "Music on" : "Music off";
}

function playMusic() {
  if (!musicEnabled || !music.paused) return;
  music.play().catch(() => {});
}

function toggleMusic() {
  musicEnabled = !musicEnabled;
  saveMusicPreference(musicEnabled);
  renderMusicToggle();

  if (musicEnabled) {
    playMusic();
  } else {
    music.pause();
  }
}

function renderBest() {
  const best = readBest();
  bestEl.textContent = best === null ? "--" : best;
}

function startTimer() {
  if (timerId !== null) return;
  timerId = setInterval(() => {
    seconds += 1;
    timeEl.textContent = formatTime(seconds);
  }, 1000);
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}

function createCard(symbol) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "card";
  card.dataset.name = symbol.name;
  card.setAttribute("aria-label", "Hidden card");
  card.innerHTML = `
    <span class="card-inner">
      <span class="face face-front"></span>
      <span class="face face-back" aria-hidden="true">
        <svg class="symbol" viewBox="0 0 24 24"><path d="${symbol.path}"/></svg>
      </span>
    </span>
  `;
  card.addEventListener("click", () => handleFlip(card));
  return card;
}

function reveal(card) {
  card.classList.add("is-flipped");
  card.setAttribute("aria-label", card.dataset.name);
}

function conceal(card) {
  card.classList.remove("is-flipped");
  card.setAttribute("aria-label", "Hidden card");
}

function handleFlip(card) {
  if (locked) return;
  if (card === firstCard) return;
  if (card.classList.contains("is-matched")) return;

  startTimer();
  playMusic();
  reveal(card);

  if (!firstCard) {
    firstCard = card;
    return;
  }

  secondCard = card;
  moves += 1;
  movesEl.textContent = moves;
  checkMatch();
}

function checkMatch() {
  if (firstCard.dataset.name === secondCard.dataset.name) {
    lockMatch();
    return;
  }

  locked = true;
  setTimeout(() => {
    conceal(firstCard);
    conceal(secondCard);
    resetTurn();
  }, MISMATCH_DELAY);
}

function lockMatch() {
  [firstCard, secondCard].forEach((card) => {
    card.classList.remove("is-flipped");
    card.classList.add("is-matched");
    card.disabled = true;
  });
  matchedPairs += 1;
  resetTurn();

  if (matchedPairs === SYMBOLS.length) {
    finishGame();
  }
}

function resetTurn() {
  firstCard = null;
  secondCard = null;
  locked = false;
}

function finishGame() {
  stopTimer();
  const best = readBest();
  const isRecord = best === null || moves < best;

  if (isRecord) {
    saveBest(moves);
    renderBest();
  }

  const recordNote = isRecord ? " New best score." : "";
  resultTextEl.textContent = `${moves} moves in ${formatTime(seconds)}.${recordNote}`;
  resultEl.classList.add("is-visible");
}

function startGame() {
  stopTimer();
  resetTurn();
  moves = 0;
  matchedPairs = 0;
  seconds = 0;
  movesEl.textContent = "0";
  timeEl.textContent = "0:00";
  resultEl.classList.remove("is-visible");
  renderBest();

  boardEl.innerHTML = "";
  const deck = shuffle([...SYMBOLS, ...SYMBOLS]);
  deck.forEach((symbol) => boardEl.appendChild(createCard(symbol)));
}

restartEl.addEventListener("click", startGame);
musicToggleEl.addEventListener("click", toggleMusic);

renderMusicToggle();
startGame();