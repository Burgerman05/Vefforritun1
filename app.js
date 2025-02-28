
import axios from "https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js";
import * as Tone from "https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.min.js";

let gameState = { level: 1, sequence: [], highScore: 0 };
let userSequence = [];
let isPlaying = false;

const startBtn = document.getElementById("start-btn");
const replayBtn = document.getElementById("replay-btn");
const levelIndicator = document.getElementById("level-indicator");
const highScoreDisplay = document.getElementById("high-score");
const pads = {
  red: document.getElementById("pad-red"),
  yellow: document.getElementById("pad-yellow"),
  green: document.getElementById("pad-green"),
  blue: document.getElementById("pad-blue"),
};

const soundMap = {
  red: "C4",
  yellow: "D4",
  green: "E4",
  blue: "F4",
};
const synth = new Tone.Synth().toDestination();

const initializeGame = async () => {
  try {
    const response = await axios.put("https://main--magenta-sorbet-bcbbc8.netlify.app/api/v1/game-state");
    gameState = response.data.gameState;
    updateUI();
  } catch (error) {
    console.error("Error initializing game:", error);
  }
};

const updateUI = () => {
  levelIndicator.textContent = gameState.level;
  highScoreDisplay.textContent = gameState.highScore;
  startBtn.disabled = false;
  replayBtn.disabled = true;
};

const playTone = (color) => {
  synth.triggerAttackRelease(soundMap[color], "8n");
  pads[color].classList.add("active");
  setTimeout(() => pads[color].classList.remove("active"), 300);
};

const playSequence = async () => {
  isPlaying = true;
  for (const color of gameState.sequence) {
    await new Promise((resolve) => {
      setTimeout(() => {
        playTone(color);
        resolve();
      }, 800);
    });
  }
  isPlaying = false;
};

const handleUserInput = async (color) => {
  if (isPlaying) return;
  userSequence.push(color);
  playTone(color);

  if (userSequence.length === gameState.sequence.length) {
    try {
      const response = await axios.post("https://main--magenta-sorbet-bcbbc8.netlify.app/api/v1/game-state/sequence", { sequence: userSequence });
      gameState = response.data.gameState;
      userSequence = [];
      await playSequence();
    } catch (error) {
      document.getElementById("failure-modal").style.display = "flex";
      setTimeout(() => {
        document.getElementById("failure-modal").style.display = "none";
        initializeGame();
      }, 2000);
    }
  }
};

startBtn.addEventListener("click", async () => {
  startBtn.disabled = true;
  replayBtn.disabled = false;
  await playSequence();
});

replayBtn.addEventListener("click", async () => {
  if (!isPlaying) await playSequence();
});

Object.keys(pads).forEach((color) => {
  pads[color].addEventListener("click", () => handleUserInput(color));
});


const keyMap = { Q: "red", W: "yellow", A: "green", S: "blue" };
document.addEventListener("keydown", (event) => {
  const color = keyMap[event.key.toUpperCase()];
  if (color) handleUserInput(color);
});

initializeGame();