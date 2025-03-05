const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");
const levelDisplay = document.getElementById("level");
const gameOverScreen = document.getElementById("gameOver");
const finalScoreDisplay = document.getElementById("finalScore");
const finalLevelDisplay = document.getElementById("finalLevel");

// Load sounds
const explosionSound = document.getElementById("explosionSound");
const starSound = document.getElementById("starSound");
const levelUpSound = document.getElementById("levelUpSound");

// Load sprites
const rocketImg = new Image();
rocketImg.src = "rocket.png";
const asteroidImg = new Image();
asteroidImg.src = "asteroid.png";
const starImg = new Image();
starImg.src = "star.png";

let score = 0;
let level = 1;
let gameRunning = true;

// Rocket properties
const rocket = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 50,
    width: 50,
    height: 50,
    speed: 5
};

// Arrays for asteroids and stars
let asteroids = [];
let stars = [];

// Level progression
const levelThresholds = [50, 100, 200, 300]; // Score needed for each level
let asteroidSpeedMultiplier = 1;
let asteroidSpawnRate = 0.02;

function gameLoop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Move and draw rocket
    drawRocket();
    handleInput();

    // Spawn asteroids and stars
    if (Math.random() < asteroidSpawnRate) spawnAsteroid();
    if (Math.random() < 0.01) spawnStar();

    // Update and draw asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
        asteroids[i].y += asteroids[i].speed * asteroidSpeedMultiplier;
        drawAsteroid(asteroids[i]);
        if (checkCollision(rocket, asteroids[i])) {
            explosionSound.play();
            endGame();
            return;
        }
        if (asteroids[i].y > canvas.height) asteroids.splice(i, 1);
    }

    // Update and draw stars
    for (let i = stars.length - 1; i >= 0; i--) {
        stars[i].y += stars[i].speed;
        drawStar(stars[i]);
        if (checkCollision(rocket, stars[i])) {
            score += 10;
            scoreDisplay.textContent = `Score: ${score}`;
            starSound.play();
            checkLevelUp();
            stars.splice(i, 1);
        }
        if (stars[i].y > canvas.height) stars.splice(i, 1);
    }

    requestAnimationFrame(gameLoop);
}

// Draw functions
function drawRocket() {
    ctx.drawImage(rocketImg, rocket.x, rocket.y, rocket.width, rocket.height);
}

function drawAsteroid(asteroid) {
    ctx.drawImage(asteroidImg, asteroid.x, asteroid.y, asteroid.size, asteroid.size);
}

function drawStar(star) {
    ctx.drawImage(starImg, star.x, star.y, star.size, star.size);
}

// Spawn functions
function spawnAsteroid() {
    asteroids.push({
        x: Math.random() * (canvas.width - 30),
        y: -30,
        size: 30,
        speed: Math.random() * 3 + 1
    });
}

function spawnStar() {
    stars.push({
        x: Math.random() * (canvas.width - 20),
        y: -20,
        size: 20,
        speed: 2
    });
}

// Collision detection
function checkCollision(obj1, obj2) {
    return (
        obj1.x < obj2.x + obj2.size &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.size &&
        obj1.y + obj1.height > obj2.y
    );
}

// Input handling
function handleInput() {
    document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft" && rocket.x > 0) rocket.x -= rocket.speed;
        if (e.key === "ArrowRight" && rocket.x < canvas.width - rocket.width) rocket.x += rocket.speed;
    });
}

// Level progression
function checkLevelUp() {
    for (let i = 0; i < levelThresholds.length; i++) {
        if (score >= levelThresholds[i] && level === i + 1) {
            level++;
            levelDisplay.textContent = `Level: ${level}`;
            asteroidSpeedMultiplier += 0.5; // Increase speed
            asteroidSpawnRate += 0.01; // More asteroids
            levelUpSound.play();
            break;
        }
    }
}

// Game over and restart
function endGame() {
    gameRunning = false;
    gameOverScreen.classList.remove("hidden");
    finalScoreDisplay.textContent = score;
    finalLevelDisplay.textContent = level;
}

function restartGame() {
    gameRunning = true;
    score = 0;
    level = 1;
    asteroids = [];
    stars = [];
    rocket.x = canvas.width / 2 - 25;
    asteroidSpeedMultiplier = 1;
    asteroidSpawnRate = 0.02;
    scoreDisplay.textContent = `Score: ${score}`;
    levelDisplay.textContent = `Level: ${level}`;
    gameOverScreen.classList.add("hidden");
    gameLoop();
}

// Start the game when images and sounds are loaded
window.onload = () => {
    rocketImg.onload = () => {
        asteroidImg.onload = () => {
            starImg.onload = () => {
                gameLoop();
            };
        };
    };
};
