import { campaignLevels } from "./levels.js";
import { TileType } from "./tileTypes.js";
import { SoundHandler, sounds } from "./soundHandler.js";
import * as menuBackground from "./menuBackground.js";
import * as reddisClient from "../webViewScript.js";
import {
  fetchedUsername,
  fetchedCustomLevelLeaderboard,
  fetchedLeaderboard,
  fetchedCustomLevelData,
} from "../webViewScript.js";

let levels = campaignLevels;
let customLevelExisits = true;
let isPlayingCustomLevel = false;
let buildeInfoMssg;

let isBreakingTile = false;
let isMuted = SoundHandler.isMuted;
let musicInitialized = false;

let infoBadge;
// Sound control functions

// Function to handle first user interaction
function handleFirstInteraction() {
  if (!musicInitialized) {
    musicInitialized = true;
    if (!isMuted) {
      SoundHandler.playBackgroundMusic();
    }
  }
}

function showInfoBadge(message) {
  infoBadge.innerHTML = message;
  infoBadge.style.opacity = 1;

  setTimeout(() => {
    infoBadge.style.opacity = 0;
  }, 3000);
}

// Game state management
let gameStarted = false;

// Initialize menu system DOMContentLoaded
document.addEventListener("DOMContentLoaded", async () => {
  infoBadge = document.getElementById("info_badge");
  buildeInfoMssg = document.getElementById("builder_info_mssg");

  menuBackground.createAnimatedBackground();

  const builderBtn = document.getElementById("build-btn");

  document.addEventListener("initialDataLoaded", () => {
    // SoundHandler.toggleSound();

    customLevelExisits = reddisClient.fetchedCustomLevelData.length !== 0;

    setTimeout(() => {
      showInfoBadge("Welcome " + fetchedUsername + "!");
    }, 3000);

    builderBtn.style.display = customLevelExisits ? "none" : "block";
    if(customLevelExisits)
       buildeInfoMssg.innerHTML = "<p>Try out thr custom level built by "+fetchedCustomLevelData.builtBy +"</p> <h4> Want to build your own level?</h4> <br/> Make a new Reddit post and use the [ BUILDER ] to create and share your own level !";
  });

  // Initialize sound state
  isTimerRunning = false;
  SoundHandler.initializeSounds();

  // Add first interaction handler to the document
  const handleInteraction = () => {
    handleFirstInteraction();
    // Remove the event listeners after first interaction
    document.removeEventListener("click", handleInteraction);
    document.removeEventListener("keydown", handleInteraction);
    document.removeEventListener("touchstart", handleInteraction);
  };

  // Add multiple event listeners for first interaction
  document.addEventListener("click", handleInteraction);
  document.addEventListener("keydown", handleInteraction);
  document.addEventListener("touchstart", handleInteraction);

  // Sound toggle functionality
  document.querySelectorAll(".sound-toggle").forEach((button) => {
    button.onclick = (e) => {
      e.stopPropagation();
      SoundHandler.toggleSound();
      handleFirstInteraction(); // Ensure music can play after toggle
    };
  });

  // Add click sound to all pushable buttons except sound toggles
  document.querySelectorAll(".pushable:not(.sound-toggle)").forEach((button) => {
    button.addEventListener("click", () => {
      SoundHandler.playButtonSound();
      handleFirstInteraction(); // Ensure music can play after any button click
    });
  });

  const mainMenu = document.getElementById("main-menu");
  const gameBoard = document.getElementById("game-board");
  const hud = document.getElementById("hud");

  // Play button
  document.getElementById("play-btn").onclick = () => {
    baseTime = 20;
    levels = campaignLevels;
    isPlayingCustomLevel = false;
    mainMenu.style.display = "none";
    gameBoard.style.display = "block";
    hud.style.display = "block";
    startGame();
  };

  // How to Play button
  const howToPlayBtn = document.getElementById("how-to-play-btn");
  const howToPlayModal = document.getElementById("how-to-play-modal");

  howToPlayBtn.onclick = () => {
    howToPlayModal.classList.add("show");
  };

  // Leaderboard button
  const leaderboardBtn = document.getElementById("leaderboard-btn");
  const leaderboardModal = document.getElementById("leaderboard-modal");
  leaderboardBtn.onclick = () => {
    updateLeaderboard();
    leaderboardModal.classList.add("show");
  };

  // Close buttons
  const closeInstructionsBtn = document.getElementById("close-instructions-btn");
  closeInstructionsBtn.onclick = () => {
    howToPlayModal.classList.remove("show");
  };

  const closeLeaderboardBtn = document.getElementById("close-leaderboard-btn");
  closeLeaderboardBtn.onclick = () => {
    leaderboardModal.classList.remove("show");
  };

  // Back to menu functionality
  document.getElementById("back-to-menu-btn").onclick = () => returnToMenu();

  // Add click sound to all buttons
  document.querySelectorAll(".pushable").forEach((button) => {
    button.addEventListener("click", SoundHandler.playButtonSound);
  });
});

function startGame() {
  menuBackground.removeMenuBackground();
  const gameLayoutContainer = document.querySelector(".game-layout");
  const menuContainer = document.querySelector(".menu-container");
  const gameboardWrapper = document.querySelector(".gameboard-wrapper");
  const hud = document.getElementById("hud");
  // const time_move_left = document.getElementById("time_move_left");

  // Add slide-up class to menu
  menuContainer.classList.add("slide-up");

  gameLayoutContainer.style.display = "block";
  // After menu starts sliding up, show game elements
  setTimeout(() => {
    menuContainer.style.display = "none";
    gameboardWrapper.style.display = "block";
    hud.style.display = "flex";

    // Trigger animations
    requestAnimationFrame(() => {
      gameboardWrapper.classList.add("slide-in");
      hud.classList.add("slide-in");
    });

    // Initialize game
    gameStarted = true;
    currentLevelIndex = 0;
    totalScore = 0;
    loadLevel(currentLevelIndex);
  }, 500); // Match this with the menu transition duration
}

function returnToMenu() {
  menuBackground.createAnimatedBackground();
  isTimerRunning = false;
  gameStarted = false;

  const gameLayoutContainer = document.querySelector(".game-layout");
  const menuContainer = document.querySelector(".menu-container");
  const gameboardWrapper = document.querySelector(".gameboard-wrapper");
  const hud = document.getElementById("hud");
  const builderBtn = document.getElementById("build-btn");

  builderBtn.style.display = customLevelExisits ? "none" : "block";
  // First, trigger slide-out animations
  gameboardWrapper.classList.remove("slide-in");
  gameboardWrapper.classList.add("slide-out");
  hud.classList.remove("slide-in");
  hud.classList.add("slide-out");

  // Wait for animations to complete before showing menu
  setTimeout(() => {
    // Hide game elements
    gameLayoutContainer.style.display = "none";
    gameboardWrapper.style.display = "none";
    hud.style.display = "none";

    // Show and animate menu
    menuContainer.style.display = "flex";
    menuContainer.classList.remove("slide-up");
    menuContainer.classList.add("menu-slide-in");

    // Reset game state
    gameStarted = false;
    stopTimer();
    currentLevelIndex = 0;
    totalScore = 0;

    // Remove animation classes after transition
    setTimeout(() => {
      gameboardWrapper.classList.remove("slide-out");
      hud.classList.remove("slide-out");
      menuContainer.classList.remove("menu-slide-in");
    }, 500);
  }, 500); // Match this with animation duration
}

// Update leaderboard display
async function updateLeaderboard() {
  const leaderboardList = document.getElementById("leaderboard-list");
  const customLeaderboardList = document.getElementById("custom-leaderboard-list");

  buildLeaderboard(leaderboardList, fetchedLeaderboard);
  buildLeaderboard(customLeaderboardList, fetchedCustomLevelLeaderboard);
}

// Build the leaderboard HTML
function buildLeaderboard(leaderboardElement, leaderboardData) {
  leaderboardData.sort((a, b) => Number(b.playerScore) - Number(a.playerScore));

  if (leaderboardData.length === 0) {
    leaderboardElement.innerHTML = '<p style="text-align: center">No scores yet!</p>';
    return;
  }

  leaderboardElement.innerHTML = leaderboardData
    .map(
      (score, index) => `
    <div class="score-entry ${index < 3 ? "top-" + (index + 1) : ""}">
        <span class="rank">#${index + 1}</span>
        <span class="player">${score.playerName}</span>
        <span class="score">${score.playerScore}</span>
        <span class="level">Level ${score.levelReached}</span>
    </div>
`
    )
    .join("");
}

// Leaderboard tab functionality
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    // Toggle active tab button
    document.querySelector(".tab.active").classList.remove("active");
    tab.classList.add("active");

    // Toggle visible leaderboard
    document.querySelector(".leaderboard.active").classList.remove("active");
    document.getElementById(tab.dataset.target).classList.add("active");
  });
});

// Timer Variables
let timeLeft = 10; // Starting time for first level
let baseTime = 20; // Base time that increases each level
let timeIncrement = 5; // Time increase per level
let timer; // Timer interval
let totalScore = 0;
let isTimerRunning = false;

function startTimer() {
  if (!gameStarted || isTimerRunning) return;

  isTimerRunning = true;
  timeLeft = baseTime + currentLevelIndex * timeIncrement;
  updateTimerDisplay();

  timer = setInterval(() => {
    if (!gameStarted) {
      stopTimer();
      return;
    }

    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      stopTimer();
      showFinalModal("Time's Up! ⏰", totalScore, true);
    }
  }, 1000);
}
function stopTimer() {
  clearInterval(timer);
  isTimerRunning = false;
}

function updateTimerDisplay() {
  const timerElement = document.getElementById("timer");
  timerElement.textContent = `Time: ${timeLeft} Secs`;

  // Add warning class when time is low
  if (timeLeft <= 10) {
    timerElement.classList.add("warning");
  } else {
    timerElement.classList.remove("warning");
  }
}

function updateScoreDisplay() {
  const scoreElement = document.getElementById("score");
  scoreElement.textContent = `Score: ${totalScore}`;
}

function handleGameComplete() {
  SoundHandler.stopBackgroundMusic();
  SoundHandler.playLevelCompleteSound();

  // Calculate final score before stopping timer
  const finalScore = calculateScore();
  totalScore += finalScore; // Add final level score to total
  stopTimer();

  if (!isMuted) {
    SoundHandler.playBackgroundMusic();
  }
  showFinalModal("Congratulations! 🏆 You've Completed All Levels! ", totalScore, false);
}

function calculateScore() {
  return timeLeft; // Score is the remaining time
}

//  * 3. Game State: Board, Current Level, Moves Left
let currentLevelIndex = 0;
let board = []; // 6x6 array of tile types
let maxMoves = 0; // moves allowed for the current level
let movesLeft = 0; // how many moves remain

//  * 4. DOM Elements
const boardElement = document.getElementById("game-board");
const levelTitle = document.getElementById("level-title");
const levelInfo = document.getElementById("level-info");
const movesInfo = document.getElementById("moves-info");
const resetBtn = document.getElementById("reset-btn");

//  * 5. Event Listeners

resetBtn.addEventListener("click", () => {
  const tiles = document.querySelectorAll(".tile");

  // Animate all tiles simultaneously
  tiles.forEach((tile) => {
    tile.animate(
      [
        { transform: tile.style.transform }, // Start from current position
        { transform: `${tile.style.transform.split("translate")[0]} scale(0)` }, // Scale to 0 while maintaining position
      ],
      {
        duration: 300,
        easing: "ease-out",
        fill: "forwards", // Keeps the final state
      }
    );
  });

  // Wait for animation to complete before resetting
  setTimeout(() => {
    loadLevel(currentLevelIndex);

    // Animate new tiles appearing
    const newTiles = document.querySelectorAll(".tile");
    newTiles.forEach((tile) => {
      const [x, y] = [tile.dataset.col * 80, tile.dataset.row * 80];

      tile.animate(
        [{ transform: `translate(${x}px, ${y}px) scale(0)` }, { transform: `translate(${x}px, ${y}px) scale(1)` }],
        {
          duration: 300,
          easing: "ease-out",
          fill: "forwards",
        }
      );
    });
  }, 300);
});

//  * 6. Helper Functions

function isWithinBounds(r, c) {
  return r >= 0 && r < 6 && c >= 0 && c < 6;
}

function isArrowTile(tile) {
  return (
    tile === TileType.ARROW_UP ||
    tile === TileType.ARROW_DOWN ||
    tile === TileType.ARROW_LEFT ||
    tile === TileType.ARROW_RIGHT
  );
}

function isPushable(tile) {
  // Arrows, blocks and cracked tiles are "pushable"
  return isArrowTile(tile) || tile === TileType.BLOCK || tile === TileType.CRACKED;
}

function getDirection(arrowType) {
  switch (arrowType) {
    case TileType.ARROW_UP:
      return [-1, 0];
    case TileType.ARROW_DOWN:
      return [1, 0];
    case TileType.ARROW_LEFT:
      return [0, -1];
    case TileType.ARROW_RIGHT:
      return [0, 1];
    default:
      return [0, 0];
  }
}

/*************************************************************
 * 7. Rendering with Absolute Positioning & Animation
 *************************************************************
 * We'll create a <div> for each cell that is not 'blank'.
 * The top/left is computed from (row, col).
 *************************************************************/
function renderBoard() {
  boardElement.innerHTML = "";

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      const tile = board[row][col];
      if (tile === TileType.BLANK) continue;

      const tileDiv = document.createElement("div");
      tileDiv.classList.add("tile", tile);

      // Add data attributes to track position
      tileDiv.dataset.row = row;
      tileDiv.dataset.col = col;

      // Set initial position
      tileDiv.style.transform = `translate(${col * 80}px, ${row * 80}px)`;

      // Add click listeners for arrow tiles
      if (isArrowTile(tile)) {
        tileDiv.addEventListener("click", () => onArrowClick(row, col));
      }

      // Special handling for cracked tiles
      // In your renderBoard function where you handle cracked tiles
      if (tile === TileType.CRACKED) {
        tileDiv.classList.add("tile", "cracked");

        tileDiv.addEventListener("click", () => {
          if (isBreakingTile) return; // Prevent multiple breaks at once

          isBreakingTile = true; // Set the flag
          sounds.crackingTile.play();

          breakCrackedTile(tileDiv);

          movesLeft--;
          movesInfo.textContent = `Moves Left: ${movesLeft}`;

          // Update board state after animation
          setTimeout(() => {
            board[row][col] = TileType.BLANK;
            isBreakingTile = false; // Reset the flag
            checkWinOrLose();
          }, 600);
        });
      }

      boardElement.appendChild(tileDiv);
    }
  }

  if (levels[currentLevelIndex].level_title !== levelTitle.textContent.trim()) {
    updateLevelTitle(` ${levels[currentLevelIndex].level_title}`, currentLevelIndex + 1);
  }
  movesInfo.textContent = `Moves Left: ${movesLeft}`;
}

function updateLevelTitle(newTitle, levelIndex) {
  levelTitle.style.opacity = "0";
  levelTitle.style.transform = "translateY(-100px)";
  levelInfo.style.opacity = "0";
  setTimeout(() => {
    levelInfo.textContent = `Level: ${levelIndex}`;
    levelInfo.style.opacity = "1";

    levelTitle.textContent = newTitle;
    levelTitle.style.opacity = "1";
    levelTitle.style.transform = "translateY(0)";
  }, 300);
}

function breakCrackedTile(tileElement) {
  // Add breaking class to start main animation
  tileElement.classList.add("breaking");

  // Create particles
  const particles = [];
  const particleCount = 8;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";

    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;

    const size = 5 + Math.random() * 10;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;

    // Use the same background as cracked tile
    particle.style.backgroundImage = 'url("./resources/images/cracked.png")';
    particle.style.backgroundSize = "cover";

    tileElement.appendChild(particle);
    particles.push(particle);
  }

  // Animate particles
  particles.forEach((particle) => {
    particle.animate(
      [
        {
          transform: "translate(0, 0) rotate(0)",
          opacity: 1,
        },
        {
          transform: `translate(${-50 + Math.random() * 100}px, 
                                     ${-50 + Math.random() * 100}px) 
                             rotate(${-180 + Math.random() * 360}deg)`,
          opacity: 0,
        },
      ],
      {
        duration: 300 + Math.random() * 300,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        fill: "forwards",
      }
    );
  });

  // Remove the tile after animation
  setTimeout(() => {
    tileElement.remove();
  }, 300);
}

/*************************************************************
 * 8. Arrow Click Handler
 *    Decrement moves if the push is valid.
 *************************************************************/
function onArrowClick(row, col) {
  // If a tile is being broken, don't allow pushing
  if (isBreakingTile) return;

  const arrowType = board[row][col];
  if (!isArrowTile(arrowType)) return;

  const [dRow, dCol] = getDirection(arrowType);
  const didMove = pushTiles(row, col, dRow, dCol);

  if (didMove) {
    movesLeft--;
    // Update moves display immediately
    movesInfo.textContent = `Moves Left: ${movesLeft}`;
  }

  // renderBoard() //is now called after animation in pushTiles
  checkWinOrLose();
}

/*************************************************************
 * 9. pushTiles
 *    Returns true if at least one tile was moved/removed.
 *************************************************************/

function pushTiles(startRow, startCol, dRow, dCol) {
  // Gather contiguous pushable tiles from (startRow, startCol) forward
  const chain = [];
  let r = startRow;
  let c = startCol;

  while (isWithinBounds(r, c) && isPushable(board[r][c])) {
    chain.push({ row: r, col: c });
    r += dRow;
    c += dCol;
  }

  if (chain.length === 0) return false;
  let somethingMoved = false;

  // Push from farthest to nearest
  for (let i = chain.length - 1; i >= 0; i--) {
    const { row, col } = chain[i];
    const tileType = board[row][col];
    const newRow = row + dRow;
    const newCol = col + dCol;

    if (isWithinBounds(newRow, newCol)) {
      const tileElement = document.querySelector(`.tile[data-row="${row}"][data-col="${col}"]`);

      if (board[newRow][newCol] === TileType.HOLE) {
        if (tileElement) {
          // First animate to hole position
          const slideAnimation = tileElement.animate(
            [
              { transform: `translate(${col * 80}px, ${row * 80}px)` },
              { transform: `translate(${newCol * 80}px, ${newRow * 80}px)` },
            ],
            {
              duration: 300,
              easing: "ease-out",
              fill: "forwards",
            }
          );

          sounds.tileVanish.play();
          // After reaching the hole, animate light up and disappear
          slideAnimation.onfinish = () => {
            tileElement.animate(
              [
                {
                  transform: `translate(${newCol * 80}px, ${newRow * 80}px) scale(1)`,
                  filter: "brightness(1)",
                  opacity: 1,
                },
                {
                  transform: `translate(${newCol * 80}px, ${newRow * 80}px) scale(1.2)`,
                  filter: "brightness(2)",
                  opacity: 0.8,
                },
                {
                  transform: `translate(${newCol * 80}px, ${newRow * 80}px) scale(0.8)`,
                  filter: "brightness(3)",
                  opacity: 0,
                },
              ],
              {
                duration: 400,
                easing: "ease-in",
                fill: "forwards",
              }
            ).onfinish = () => {
              tileElement.remove();
            };
          };
        }
        board[row][col] = TileType.BLANK;
        somethingMoved = true;
      } else if (board[newRow][newCol] === TileType.BLANK) {
        // Regular slide animation for normal moves
        if (tileElement) {
          sounds.tileSlide.play();
          tileElement.animate(
            [
              { transform: `translate(${col * 80}px, ${row * 80}px)` },
              { transform: `translate(${newCol * 80}px, ${newRow * 80}px)` },
            ],
            {
              duration: 200,
              easing: "ease-out",
              fill: "forwards",
            }
          );

          // Update data attributes
          tileElement.dataset.row = newRow;
          tileElement.dataset.col = newCol;
        }
        board[newRow][newCol] = tileType;
        board[row][col] = TileType.BLANK;
        somethingMoved = true;
      }
    }
  }

  // Wait for all animations to complete
  setTimeout(() => {
    renderBoard();
  }, 700); // Increased to account for both slide and disappear animations

  return somethingMoved;
}

//  * 10. Check Win/Lose Condition

function checkWinOrLose() {
  // Check if all pushable tiles are gone => WIN
  let anyPushableRemaining = false;
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      if (isPushable(board[row][col])) {
        anyPushableRemaining = true;
        break;
      }
    }
    if (anyPushableRemaining) break;
  }

  if (!anyPushableRemaining) {
    // WIN => Next level or finish
    stopTimer();

    setTimeout(() => {
      if (currentLevelIndex < levels.length - 1) {
        // Calculate and add score
        const levelScore = calculateScore();
        totalScore += levelScore;
        sounds.levelComplete.play();
        // Update score display
        updateScoreDisplay();
        const modal = document.getElementById("level-complete-modal");
        // Show modal
        setTimeout(() => {
          showLevelComplete();
        }, 1000);
        modal.classList.add("show");
      } else {
        //all levels cleared
        handleGameComplete();
      }
    }, 300);
    return;
  }

  // Check if movesLeft <= 0 => LOSE
  if (movesLeft <= 0) {
    // The user might still have just used their last move. If they didn’t win, it’s a fail.
    showFinalModal("You ran out of moves! 😢 ", totalScore, true);
  }
}

function showLevelComplete() {
  // Show regular level complete modal
  const modal = document.getElementById("level-complete-modal");
  const playNameInput = document.getElementById("playerNameInput");
  playNameInput.value = fetchedUsername;
  document.getElementById("total-score").textContent = totalScore;
  modal.classList.add("show");
}
// Add score saving functionality
async function saveScore(playerName, playerScore, levelReached) {
  await reddisClient.addScore(playerName, playerScore, levelReached, isPlayingCustomLevel);
}

// Update showFinalModal function
function showFinalModal(title, score, isGameOver) {
  gameStarted = false;
  stopTimer();
  const modal = document.getElementById("time-up-modal");
  const modalTitle = modal.querySelector("h2");
  const finalScoreSpan = document.getElementById("final-score");
  const tryAgainBtn = document.getElementById("try-again-btn");
  const finalMenuBtn = document.getElementById("final-menu-btn");

  const playNameInput = document.getElementById("playerNameInput");
  playNameInput.value = fetchedUsername;

  modalTitle.textContent = title;
  finalScoreSpan.textContent = score;

  // Play level complete sound but don't stop background music
  isGameOver ? SoundHandler.playGameOverSound() : sounds.gameComplete.play();

  tryAgainBtn.onclick = () => {
    modal.classList.remove("show");
    SoundHandler.playBackgroundMusic();

    // Reload the current level while keeping the total score
    loadLevel(currentLevelIndex);
  };

  finalMenuBtn.onclick = () => {
    const playNameInput = document.getElementById("playerNameInput");
    const playerName = playNameInput.value.trim();

    if (playerName) {
      // Save the score with player name

      saveScore(playerName, score, currentLevelIndex + 1);
      returnToMenu();

      modal.style.display = "none";
      modal.classList.remove("show");
      SoundHandler.playBackgroundMusic();
    } else {
      playNameInput.style.border = "1px solid red";
      playNameInput.placeholder = "Please enter your name!";
    }
  };

  // modal.style.display = "block";
  modal.classList.add("show");
}

document.getElementById("next-level-btn").addEventListener("click", () => {
  const modal = document.getElementById("level-complete-modal");

  // Hide modal with animation
  modal.style.opacity = "0";
  setTimeout(() => {
    modal.classList.remove("show");
    modal.style.opacity = "";

    // Load next level
    currentLevelIndex++;
    if (currentLevelIndex < levels.length) {
      loadLevel(currentLevelIndex);
    } else {
      // Handle game completion
      showFinalModal("Congratulations!", totalScore, false);
    }
  }, 300);
});

//  * 11. Level Loading / Reset

function loadLevel(levelIndex) {
  menuBackground.removeMenuBackground();
  stopTimer(); // Stop any existing timer

  const levelData = levels[levelIndex];
  board = levelData.board.map((row) => row.slice());
  maxMoves = levelData.maxMoves;
  movesLeft = maxMoves;

  // Calculate the correct time for this level
  timeLeft = baseTime + levelIndex * timeIncrement;
  gameStarted = true;
  renderBoard();
  startTimer();
}

// Credits Btn

const creditsBtn = document.getElementById("credits-btn");
const creditsModal = document.getElementById("credits-modal");
const closeCreditsBtn = document.getElementById("close-credits-btn");

// Open credits modal
creditsBtn.addEventListener("click", () => {
  creditsModal.classList.add("show");
});

// Close credits modal
closeCreditsBtn.addEventListener("click", () => {
  creditsModal.classList.remove("show");
});

// Close modal if clicking outside
creditsModal.addEventListener("click", (e) => {
  creditsModal.classList.remove("show");
});

//////

// LEVEL BUILDER DOM Elements
const levelBuilder = document.getElementById("level-builder");
const gridContainer = document.getElementById("grid-container");
const paletteButtons = document.querySelectorAll(".tile-btn");
const customLevelTitle = document.getElementById("level_title");
const custom_level_timer = document.getElementById("custom_level_timer");
const movesInput = document.getElementById("moves");
const saveButton = document.getElementById("save-level");
const buildBtn = document.getElementById("build-btn");
const builderToMenuBtn = document.getElementById("builder-to-menu-btn");
const playCustomButton = document.getElementById("play-custom-level-btn");

const mainMenu = document.getElementById("main-menu");
const gameBoard = document.getElementById("game-board");
const hud = document.getElementById("hud");

let customLevelTimer = 10;
let selectedTile = TileType.BLANK; // Default tile selection for the builder
let builderBoard = []; // This will hold the custom level matrix

builderToMenuBtn.addEventListener("click", () => {
  levelBuilder.style.display = "none";
  returnToMenu();
});

//display builder section
buildBtn.addEventListener("click", () => {
  mainMenu.style.display = "none";
  gameBoard.style.display = "none";
  hud.style.display = "none";

  levelBuilder.style.display = "flex";
  levelBuilder.classList.add("show");
});
// Assume paletteButtons is a NodeList of all your tile buttons
paletteButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // Remove 'selected' class from all buttons
    paletteButtons.forEach((btn) => btn.classList.remove("selected"));
    // Add 'selected' class to the clicked button
    button.classList.add("selected");
    // Set the selectedTile variable based on the button's data-tile attribute
    selectedTile = TileType[button.dataset.tile];
  });
});

// Initialize the custom level board (6x6) with all BLANK tiles
function initBuilderBoard() {
  builderBoard = Array.from({ length: 6 }, () => Array(6).fill(TileType.BLANK));
  renderBuilderBoard();
}

// Render the builder board UI
function renderBuilderBoard() {
  gridContainer.innerHTML = ""; // Clear previous cells

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      const cell = document.createElement("div");
      cell.classList.add("grid-cell");
      cell.dataset.row = row;
      cell.dataset.col = col;

      // Reset the cell class and add the tile's class (in lowercase to match your SCSS)
      cell.className = "grid-cell";
      cell.classList.add(builderBoard[row][col].toLowerCase());

      // Optionally add a tooltip for debugging (shows the tile type)
      cell.title = builderBoard[row][col];

      // When the cell is clicked, update its tile type and re-render
      cell.addEventListener("click", () => {
        builderBoard[row][col] = selectedTile;
        renderBuilderBoard();
      });

      gridContainer.appendChild(cell);
    }
  }
}

// Handle tile selection from the palette
paletteButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // The data-tile attribute matches keys in TileType
    selectedTile = TileType[button.dataset.tile];
    paletteButtons.forEach((btn) => btn.classList.remove("selected"));
    button.classList.add("selected");
  });
});

// Save the custom level configuration in localStorage
saveButton.addEventListener("click", async () => {
  customLevelTimer = parseInt(custom_level_timer.value);
  const customLevelDataReddit = {
    levelData: {
      level_title: customLevelTitle.value || "User Created Level",
      board: builderBoard,
      maxMoves: parseInt(movesInput.value) || 10,
    },
    timer: customLevelTimer,
    builtBy: fetchedUsername,
  };

  await reddisClient.addCustomLevel(customLevelDataReddit);
  showInfoBadge("Level saved! Click on Custom Level play it.");
  
  customLevelExisits = true;
  buildeInfoMssg.innerHTML = "<p>Try out thr custom level built by "+fetchedCustomLevelData.builtBy +"</p> <h4> Want to build your own level?</h4> <br/> Make a new Reddit post and use the [ BUILDER ] to create and share your own level !";
  builderToMenuBtn.click();
});

// Load and play the custom level (integration with your game logic)
playCustomButton.addEventListener("click", async () => {
  if (fetchedCustomLevelData.length === 0) {
    showInfoBadge("No custom levels saved yet! Build one using the Level Builder :D");
    return;
  }

  levels = [];
  showInfoBadge("Level Created by || " + fetchedCustomLevelData.builtBy + " ||");
  baseTime = fetchedCustomLevelData.timer;
  levels.push(fetchedCustomLevelData.levelData);
  isPlayingCustomLevel = true;

  mainMenu.style.display = "none";
  gameBoard.style.display = "block";
  hud.style.display = "block";

  startGame();
});

// Initialize the builder board when the page loads
initBuilderBoard();

/////////////////
