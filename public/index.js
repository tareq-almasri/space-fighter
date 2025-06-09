//form
// Toggle password visibility
const passwordInput = document.getElementById("password");
const eyeOpen = document.getElementById("eye1");
const eyeClosed = document.getElementById("eye2");

eyeOpen.addEventListener("click", () => {
  passwordInput.type = "text"; // Show password
  eyeOpen.style.display = "none"; // Hide open eye icon
  eyeClosed.style.display = "inline"; // Show closed eye icon
});

eyeClosed.addEventListener("click", () => {
  passwordInput.type = "password"; // Hide password
  eyeClosed.style.display = "none"; // Hide closed eye icon
  eyeOpen.style.display = "inline"; // Show open eye icon
});

const signupBtn = document.querySelector(".signup");
const loginBtn = document.querySelector(".login");
const form = document.querySelector("form");
const startBox = document.querySelector(".start-screen");
const username = document.querySelector("#username");
const checkName = document.querySelector("#check");
const msg = document.querySelector("#msg");
const start = document.querySelector(".start");
const navScore = document.querySelector(".nav-score");
const navUser = document.querySelector(".nav-user");
const navBoard = document.querySelector(".nav-board");
const startPrompt = document.querySelector("#start-prompt");
const yesBtn = document.querySelector(".yes-btn");
const noBtn = document.querySelector(".no-btn");
const endPrompt = document.getElementById("end-prompt");
const logout = document.querySelector(".logout");
const leaderboard = document.querySelector("#leaderboard");
const gameOverBox = document.querySelector(".game-over");
let loggedIn = false;

let user = JSON.parse(localStorage.getItem("user")) || {
  username: "",
  score: 0,
};

user.username.length > 0 ? (loggedIn = true) : (loggedIn = false);

navBoard.style.display = "block";

if (loggedIn) {
  startPrompt.style.display = "none";
  logout.style.display = "block";
  navUser.textContent += " " + user.username;
  navUser.style.display = "block";
}

logout.addEventListener("click", () => {
  loggedIn = false;
  localStorage.removeItem("user");
  restartGame();
});

navScore.textContent += user.score || 0;

signupBtn.addEventListener("click", () => {
  form.classList.add("show");
  form.btn.innerText = "Sign Up";
  startBox.style.display = "none";
});

loginBtn.addEventListener("click", () => {
  form.classList.add("show");
  form.btn.innerText = "Login";
  startBox.style.display = "none";
  checkName.style.display = "none";
});

yesBtn.addEventListener("click", () => {
  form.classList.add("show");
  form.btn.innerText = "Sign Up";
  startBox.style.display = "none";
  endPrompt.style.display = "none";
});

noBtn.addEventListener("click", () => {
  restartGame();
});

navBoard.addEventListener("click", () => {
  startBox.style.display = "none";
  gameOverBox.style.display = "none";
  fetch("/api/leaderboard")
    .then((res) => res.json())
    .then((data) => {
      const list = document.createElement("div");
      list.classList.add("list");
      data
        .sort((a, b) => b.score - a.score)
        .forEach(
          (x) =>
            (list.innerHTML += `<div id="player"><div>${x.username}</div><div>${x.score}</div></div>`)
        );
      leaderboard.insertBefore(list, leaderboard.firstChild);
      const back = document.querySelector(".back");
      back.addEventListener("click", () => {
        restartGame();
      });
    });
  leaderboard.style.display = "block";
});

checkName.addEventListener("click", () => {
  if (!username.value.trim()) return;
  fetch(`/api/signup/${username.value}`)
    .then((res) => res.json())
    .then((data) => (msg.textContent = data));
});

form.addEventListener("submit", (e) => {
  loggedIn = e.target.btn.textContent === "Login";
  e.preventDefault();
  fetch(loggedIn ? "/api/login" : `/api/signup/${e.target.username.value}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: e.target.username.value,
      password: e.target.password.value,
      score: user.score || score,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (typeof data === "string") {
        msg.textContent = data;
      } else if (data.username) {
        user = data;
        localStorage.setItem("user", JSON.stringify(user));
        restartGame();
      }
    });
});

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 500; // Fixed width
canvas.height = window.innerHeight;

const jet = {
  x: canvas.width / 2,
  y: canvas.height - 100,
  size: 30,
  speed: 8,
  dx: 0,
  immune: false,
};

const bullets = [];
const bulletSpeed = 15;
let bulletInterval = 250;

const alienJets = [];
const toughAliens = [];
const alienBullets = [];
const items = [];
const alienJetSpeed = 2;
const alienBulletSpeed = 5;
const alienFrequency = 150; // Higher value = fewer alien jets
const itemFrequency = 200; // Frequency of items
let frameCount = 0;
let score = 0;
let gameOver = false;
let shootInterval;

const stars = Array.from({ length: 100 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  size: Math.random() * 2,
}));

function drawStars() {
  ctx.fillStyle = "white";
  stars.forEach((star) => {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI);
    ctx.fill();
  });
}

function updateStars() {
  stars.forEach((star) => {
    star.y += 1; // Move stars downward
    if (star.y > canvas.height) {
      star.y = 0; // Reset star to the top
      star.x = Math.random() * canvas.width; // Randomize x position
    }
  });
}

function drawJet() {
  ctx.save(); // Save the current canvas state

  // Draw the shield if the jet is immune
  if (jet.immune) {
    // Create a gradient for the shield
    const gradient = ctx.createLinearGradient(
      jet.x - jet.size, // Start gradient at the left edge of the shield
      jet.y - jet.size, // Top of the shield
      jet.x + jet.size, // End gradient at the right edge of the shield
      jet.y + jet.size / 2 // Bottom of the shield
    );
    gradient.addColorStop(0, "rgba(173, 216, 230, 0.8)"); // Light blue at the top
    gradient.addColorStop(1, "rgba(0, 0, 139, 0.5)"); // Dark blue at the bottom

    // Draw the half-circle shield
    ctx.beginPath();
    ctx.arc(jet.x, jet.y + jet.size / 2, jet.size + 10, Math.PI, 0, false); // Half-circle in front of the ship
    ctx.fillStyle = gradient; // Apply the gradient
    ctx.fill();
  }

  // Draw the spaceship
  ctx.translate(jet.x, jet.y + jet.size / 2); // Move the origin to the spaceship's center
  ctx.rotate((-45 * Math.PI) / 180); // Rotate 45 degrees counterclockwise

  ctx.font = `${jet.size}px Arial`; // Set font size relative to jet size
  ctx.textAlign = "center"; // Center the emoji horizontally
  ctx.textBaseline = "middle"; // Center the emoji vertically
  ctx.fillText("🚀", 0, 0); // Draw the rocket emoji at the new origin

  ctx.restore(); // Restore the canvas state to avoid affecting other drawings
}

function drawBullets() {
  ctx.fillStyle = "yellow";
  bullets.forEach((bullet) => {
    // Only draw bullets if they are above the spaceship
    if (bullet.y < jet.y) {
      ctx.fillRect(bullet.x, bullet.y, 5, 10);
    }
  });
}

function updateBullets() {
  bullets.forEach((bullet) => {
    bullet.y -= bulletSpeed;
  });

  // Remove bullets that are off-screen
  while (bullets.length > 0 && bullets[0].y < 0) {
    bullets.shift();
  }
}

function drawAlienJets() {
  ctx.font = `30px Arial`; // Set font size for the alien emoji
  ctx.textAlign = "center"; // Center the emoji horizontally
  ctx.textBaseline = "middle"; // Center the emoji vertically

  // Draw regular alien jets
  alienJets.forEach((alien) => {
    ctx.fillText("👾", alien.x, alien.y + alien.size / 2);
  });

  // Draw tougher alien jets
  ctx.font = `40px Arial`; // Slightly larger font for tougher aliens
  toughAliens.forEach((alien) => {
    ctx.fillText("👾", alien.x, alien.y + alien.size / 2);
  });
}

function updateAlienJets() {
  alienJets.forEach((alien) => {
    alien.y += alienJetSpeed;
  });

  toughAliens.forEach((alien) => {
    alien.y += alienJetSpeed;
  });

  // Remove alien jets that are off-screen
  while (alienJets.length > 0 && alienJets[0].y > canvas.height) {
    alienJets.shift();
  }

  while (toughAliens.length > 0 && toughAliens[0].y > canvas.height) {
    toughAliens.shift();
  }

  // Add new alien jets
  if (frameCount % alienFrequency === 0) {
    const x = Math.random() * (canvas.width - 30) + 15;
    alienJets.push({ x, y: -30, size: 30 });
    if (Math.random() < 0.3) {
      toughAliens.push({ x, y: -30, size: 50, hits: 2 });
    }
  }
}

function drawAlienBullets() {
  ctx.fillStyle = "red";
  alienBullets.forEach((bullet) => {
    ctx.fillRect(bullet.x, bullet.y, 5, 10);
  });
}

function updateAlienBullets() {
  alienBullets.forEach((bullet) => {
    bullet.y += alienBulletSpeed;
  });

  // Remove alien bullets that are off-screen
  while (alienBullets.length > 0 && alienBullets[0].y > canvas.height) {
    alienBullets.shift();
  }
}

let coinRotationAngle = 0; // Initialize the rotation angle for the coin

function drawItems() {
  items.forEach((item) => {
    ctx.save(); // Save the current canvas state
    ctx.font = "20px Arial"; // Set font size for the emojis
    ctx.textAlign = "center"; // Center the emoji horizontally
    ctx.textBaseline = "middle"; // Center the emoji vertically

    // Determine the emoji based on the item's effect
    let emoji;
    if (item.effect === "score") {
      emoji = "🪙"; // Coin emoji
    } else if (item.effect === "immunity") {
      emoji = "🛡️"; // Shield emoji
    } else if (item.effect === "faster") {
      emoji = "🔋"; // Battery emoji
    } else if (item.effect === "bomb") {
      emoji = "🧨"; // Firecracker emoji
    }

    // Apply flipping effect for the coin emoji
    if (item.effect === "score") {
      ctx.translate(item.x, item.y); // Move the origin to the item's position
      const scaleX = Math.abs(Math.cos(coinRotationAngle)); // Scale the width based on the rotation angle
      ctx.scale(scaleX, 1); // Apply horizontal scaling
      ctx.fillText(emoji, 0, 0); // Draw the emoji at the scaled position
      ctx.restore(); // Restore the canvas state
    } else {
      // Draw other items without rotation
      ctx.fillText(emoji, item.x, item.y);
      ctx.restore();
    }
  });

  // Increment the rotation angle for the coin
  coinRotationAngle += 0.1; // Adjust the speed of rotation (smaller values = slower rotation)
}

function updateItems() {
  items.forEach((item) => {
    item.y += 2;
  });

  // Remove items that are off-screen
  while (items.length > 0 && items[0].y > canvas.height) {
    items.shift();
  }

  // Add new items
  if (frameCount % itemFrequency === 0) {
    const x = Math.random() * (canvas.width - 20) + 10;
    const type = Math.random();
    if (type < 0.5) {
      items.push({ x, y: -20, color: "yellow", effect: "score" });
    } else if (type < 0.7) {
      items.push({ x, y: -20, color: "blue", effect: "immunity" });
    } else if (type < 0.9) {
      items.push({ x, y: -20, color: "orange", effect: "faster" });
    } else {
      items.push({ x, y: -20, color: "red", effect: "bomb" });
    }
  }
}

function detectCollision() {
  if (!jet.immune) {
    for (const alien of alienJets) {
      if (
        jet.x + jet.size / 2 > alien.x - alien.size / 2 &&
        jet.x - jet.size / 2 < alien.x + alien.size / 2 &&
        jet.y + jet.size > alien.y &&
        jet.y < alien.y + alien.size
      ) {
        showExplosion(); // Show explosion before game over
        return true;
      }
    }

    for (const bullet of alienBullets) {
      if (
        bullet.x > jet.x - jet.size / 2 &&
        bullet.x < jet.x + jet.size / 2 &&
        bullet.y > jet.y &&
        bullet.y < jet.y + jet.size
      ) {
        showExplosion(); // Show explosion before game over
        return true;
      }
    }
  }

  for (const item of items) {
    if (
      item.x > jet.x - jet.size / 2 &&
      item.x < jet.x + jet.size / 2 &&
      item.y > jet.y &&
      item.y < jet.y + jet.size
    ) {
      if (item.effect === "score") {
        score += 10;
      } else if (item.effect === "immunity") {
        jet.immune = true;
        setTimeout(() => (jet.immune = false), 5000);
      } else if (item.effect === "faster") {
        bulletInterval = Math.max(50, bulletInterval - 50);
        shootInterval = setInterval(shootBullet, bulletInterval);
        setTimeout(() => {
          clearInterval(shootInterval);
          bulletInterval = 250;
        }, 5000);
      } else if (item.effect === "bomb" && !jet.immune) {
        showExplosion(); // Show explosion before game over
        return true;
      }
      items.splice(items.indexOf(item), 1);
    }
  }
  user.score = Math.max(user.score, score);
  localStorage.setItem("user", JSON.stringify(user));

  return false;
}

function showExplosion() {
  ctx.font = "50px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("💥", jet.x, jet.y);
}
function detectBulletHits() {
  bullets.forEach((bullet, bulletIndex) => {
    alienJets.forEach((alien, alienIndex) => {
      if (
        bullet.x > alien.x - alien.size / 2 &&
        bullet.x < alien.x + alien.size / 2 &&
        bullet.y > alien.y &&
        bullet.y < alien.y + alien.size
      ) {
        bullets.splice(bulletIndex, 1);
        alienJets.splice(alienIndex, 1);
        score += 5;
      }
    });

    toughAliens.forEach((alien, alienIndex) => {
      if (
        bullet.x > alien.x - alien.size / 2 &&
        bullet.x < alien.x + alien.size / 2 &&
        bullet.y > alien.y &&
        bullet.y < alien.y + alien.size
      ) {
        bullets.splice(bulletIndex, 1);
        alien.hits -= 1;
        if (alien.hits <= 0) {
          toughAliens.splice(alienIndex, 1);
          score += 15;
        }
      }
    });
  });
}

function updateJet() {
  jet.x += jet.dx;

  // Prevent jet from going out of bounds
  if (jet.x - jet.size / 2 < 0) {
    jet.x = jet.size / 2;
  }
  if (jet.x + jet.size / 2 > canvas.width) {
    jet.x = canvas.width - jet.size / 2;
  }
}

function shootBullet() {
  bullets.push({ x: jet.x - 4, y: jet.y });
}

function alienShootBullet() {
  alienJets.forEach((alien) => {
    alienBullets.push({ x: alien.x, y: alien.y + alien.size });
  });

  toughAliens.forEach((alien) => {
    alienBullets.push({ x: alien.x, y: alien.y + alien.size });
  });
}

function restartGame() {
  location.reload(); // Reload the page to restart the game
}

function gameLoop() {
  if (gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawStars(); // Draw stars in the background
  updateStars(); // Update star positions

  drawJet();
  drawBullets();
  drawAlienJets();
  drawAlienBullets();
  drawItems();
  updateJet();
  updateBullets();
  updateAlienJets();
  updateAlienBullets();
  updateItems();
  detectBulletHits();

  if (detectCollision()) {
    gameOver = true;
    if (loggedIn) {
      fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      })
        .then((res) => res.json())
        .then((data) => {
          document.getElementById("gameOver").style.display = "flex";
          document.addEventListener("keydown", () => restartGame());
        });
    } else {
      endPrompt.style.display = "block";
    }
    return;
  }

  document.getElementById("score").innerText = `Score: ${score}`;

  frameCount++;
  if (frameCount % 100 === 0) alienShootBullet();
  requestAnimationFrame(gameLoop);
}

function keyDown(e) {
  if (e.key === "ArrowLeft") {
    jet.dx = -jet.speed;
  } else if (e.key === "ArrowRight") {
    jet.dx = jet.speed;
  }
}

function keyUp(e) {
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    jet.dx = 0;
  }
}

// Automatically shoot bullets at regular intervals
shootInterval = setInterval(shootBullet, bulletInterval);

document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);
ctx.clearRect(0, 0, canvas.width, canvas.height);

drawStars();

start.addEventListener("click", () => {
  gameLoop();
  startBox.style.display = "none";
  navBoard.style.display = "none";
});
