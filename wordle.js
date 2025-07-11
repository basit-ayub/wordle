import { gsap } from "gsap";


let wordLength;
let rows;
let columns;
let buffer = "";
let currentCol = 0;
let currentRow = 0;
let tilesArray = null;
let correctWord = "";
let gameOver = false;
let processing=false;

const board = document.getElementById("board");
const themeToggle = document.getElementById("theme-toggle");
const body = document.body;
const keyboard = document.getElementById("keyboard");
const messageBox = document.getElementById("message-box");

body.classList.add("light-theme");

themeToggle.addEventListener("click", () => {
  body.classList.toggle("dark-theme");
  body.classList.toggle("light-theme");
  themeToggle.textContent = body.classList.contains("dark-theme") ? "☀️" : "🌙";
});

const handleWordLengthSelection = () => {
  document.addEventListener("click", async (event) => {
    if (event.target.classList.contains("wordle-button")) {
      wordLength = parseInt(event.target.innerText);
      columns = wordLength;
      rows = wordLength + 1;
      resetGame();
      event.target.blur();
    }
  });
};

const resetGame = async() => {
  //showMessage("Game Reset !")
  currentCol = 0;
  currentRow = 0;
  buffer = "";
  gameOver = false;
  correctWord=await getWord(wordLength)
  console.log(correctWord)

  const tiles = document.querySelectorAll(".tile");
 await gsap.to(tiles, {
    opacity: 0,
    scale: 0.6,
    duration: 0.3,
    stagger: 0.01,
    onComplete: () => {
      board.innerHTML = "";
    }
  });
  board.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;

  for (let i = 0; i < rows; i++) {
      for (let j = 0; j < columns; j++) {
        const tile = document.createElement("div");
        tile.classList.add("tile");
        tile.dataset.row = i;
        tile.dataset.col = j;
        board.appendChild(tile);
    
        gsap.fromTo(tile, 
          {
            opacity: 0,
            scale: 0.2,
            y: -30
          }, 
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.2,
            delay: (i * columns + j) * 0.01,
            ease: "back.out(1.7)"
          }
        );
      }
    }
  
    
  

  tilesArray = document.querySelectorAll(".tile");
  keyboard.classList.remove("hidden");

  document.querySelectorAll(".key").forEach((key) => {
    key.classList.remove("correct", "present", "absent");
    key.dataset.state = "";
  });

  messageBox.classList.add("hidden");
  messageBox.innerText = "";
};

const handleAlphabet = (key) => {
  buffer += key;
  tilesArray[currentRow * columns + currentCol].innerText = key;
  currentCol++;
};

const applyBackSpace = () => {
  if (currentCol > 0) {
    currentCol--;
    buffer = buffer.substring(0, currentCol);
    tilesArray[currentRow * columns + currentCol].innerText = "";
  }
};

const showMessage = async (text) => {
  const messageBox = document.getElementById("message-box");

  messageBox.textContent = text;
  messageBox.classList.remove("hidden", "dark-theme", "neon-red-box", "neon-yellow-box", "neon-green-box");

  if (text === "Invalid Word") {
    messageBox.classList.add("neon-red-box");
  } else if (text === "🎉 You Win!") {
    messageBox.classList.add("neon-green-box");
  } else {
    messageBox.classList.add("neon-yellow-box");
  }

  if (body.classList.contains("dark-theme")) {
    messageBox.classList.add("dark-theme");
  }

  await gsap.set(messageBox, {
    opacity: 0,
    y: -30,
    display: "block"
  });

  await gsap.to(messageBox, {
    opacity: 1,
    y: 0,
    duration: 0.6,
    ease: "power2.out"
  });
  await gsap.to(messageBox, {
    opacity: 0,
    y: 30,
    duration: 0.6,
    delay: 2,
    ease: "power2.in",
    onComplete: () => {
      messageBox.classList.add("hidden");
    }
  });
};

const shakeRow = (rowIndex) => {
  const tiles = [];
  for (let col = 0; col < columns; col++) {
    const tile = tilesArray[rowIndex * columns + col];
    tiles.push(tile);
  }

  gsap.fromTo(tiles, { x: 50 }, {
    x: -50,
    duration: 0.2,
    repeat: 2,
    yoyo: false,
    ease: "none",
    onComplete:()=>{
      gsap.to(tiles,{x:0,duration:0.2})
    }
  });
}  

function createGraffitiEffect(tile) {
  const rect = tile.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2 + window.scrollX;
  const centerY = rect.top + rect.height / 2 + window.scrollY;

  for (let i = 0; i < 8; i++) {
    const burst = document.createElement("div");
    burst.classList.add("graffiti");

    burst.style.left = `${centerX}px`;
    burst.style.top = `${centerY}px`;
    burst.style.background = `hsl(${Math.random() * 360}, 100%, 50%)`;

    document.body.appendChild(burst);

    const angle = Math.random() * Math.PI * 2;
    const radius = 40 + Math.random() * 40;

    gsap.to(burst, {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      opacity: 0,
      scale: 0.5,
      duration: 1,
      ease: "power1.out",
      onComplete: () => burst.remove()
    });
  }
}
const commitGuess = async () => {
  if (!(await isValidWord(buffer))) {
    showMessage("Invalid Word");
    shakeRow(currentRow)
    return;
  }

  const guessLetters = buffer.split("");
  const correctLetters = correctWord.split("");
  const status = Array(wordLength).fill("absent");

  // First pass: mark correct
  for (let i = 0; i < wordLength; i++) {
    if (guessLetters[i] === correctLetters[i]) {
      status[i] = "correct";
      correctLetters[i] = null;
    }
  }

  // Second pass: mark present
  for (let i = 0; i < wordLength; i++) {
    if (status[i] === "correct") continue;

    const index = correctLetters.indexOf(guessLetters[i]);
    if (index !== -1) {
      status[i] = "present";
      correctLetters[index] = null;
    }
  }
  for (let i = 0; i < wordLength; i++) {
    const tile = tilesArray[currentRow * columns + i];
    const letter = guessLetters[i];
    tile.innerText = letter;
    tile.classList.add(status[i]);
  
    gsap.fromTo(tile, 
      { y: -25, opacity: 0 }, 
      { 
        y: 0, opacity: 1, 
        duration: 0.3, 
        delay: i * 0.1,
        ease: "bounce.out" 
      }
    );
    const key = document.querySelector(`.key[data-key="${letter}"]`);
    if (key) {
      const newStatus = status[i];
      const oldStatus = key.dataset.state;
      const precedence = { correct: 3, present: 2, absent: 1, undefined: 0 };

      if (!oldStatus || precedence[newStatus] > precedence[oldStatus]) {
        key.classList.remove("correct", "present", "absent");
        key.classList.add(newStatus);
        key.dataset.state = newStatus;
      }
    }
  }

  if (buffer === correctWord) {
    showMessage("🎉 You Win!");
    gameOver = true;
  
    const rowTiles = [];
    for (let i = 0; i < wordLength; i++) {
      rowTiles.push(tilesArray[currentRow * columns + i]);
    }
  
    // Wave bounce using timeline (ensures it lands back)
    const bounceTimeline = gsap.timeline();
    for (let i = 0; i < rowTiles.length; i++) {
      bounceTimeline.to(rowTiles[i], {
        y: -20,
        duration: 0.2,
        ease: "power2.out"
      }, i * 0.1);
      bounceTimeline.to(rowTiles[i], {
        y: 0,
        duration: 0.2,
        ease: "power2.in"
      }, i * 0.1 + 0.2);
    }

    rowTiles.forEach(tile => createGraffitiEffect(tile));
  
    setTimeout(() => {
      resetGame();
    }, 5000);
  }

  if (currentRow === rows - 1) {
    showMessage(`The word was: ${correctWord}`);
    gameOver = true;
    setTimeout(resetGame, 5000);
  }

  currentRow++;
  currentCol = 0;
  buffer = "";
};

const isValidWord = async (word) => {
  const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
  return res.ok;
};

const getWord = async (length) => {
  const res = await fetch(`https://random-word-api.vercel.app/api?words=1&length=${length}`);
  const data = await res.json();
  return data[0].toUpperCase();
};

// Keyboard input
document.addEventListener("keydown", async (event) => {
  if (gameOver || !wordLength || processing) return;
  processing=true;
  const key = event.key.toUpperCase();

  if (/^[A-Z]$/.test(key)) {
    if (buffer.length < wordLength) handleAlphabet(key);
  } else if (key === "ENTER" && buffer.length === wordLength) {
    await commitGuess();
  } else if (key === "BACKSPACE") {
    applyBackSpace();
  }
  processing=false;
});

// On-screen keyboard
document.addEventListener("click", async (event) => {
  if (gameOver || !event.target.classList.contains("key")|| processing) return;
  processing=true;
  const key = event.target.innerText.trim().toUpperCase();

  if (/^[A-Z]$/.test(key)) {
    if (buffer.length < wordLength) handleAlphabet(key);
  } else if (key === "ENTER" && buffer.length === wordLength) {
    await commitGuess();
  } else if (key === "←") {
    applyBackSpace();
  }
  processing=false;
});

handleWordLengthSelection();
