const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");
const levelDisplay = document.getElementById("level");
const gameOverScreen = document.getElementById("gameOver");
const finalScoreDisplay = document.getElementById("finalScore");
const finalLevelDisplay = document.getElementById("finalLevel");

const explosionSound = document.getElementById("explosionSound");
const starSound = document.getElementById("starSound");
const levelUpSound = document.getElementById("levelUpSound");

const rocketImg = new Image();
rocketImg.src = "rocket.png";
const asteroidImg = new Image();
asteroidImg.src = "asteroid.png";
const starImg = new Image();
starImg.src = "star.png";

let score = 0;
let level = 1;
let gameRunning = true;

const rocket = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 50,
    width: 50,
    height: 50,
    speed: 5
};

let asteroids = [];
let stars = [];

const levelThresholds = [50, 100, 200, 300];
let asteroidSpeedMultiplier = 1;
let asteroidSpawnRate = 0.02;

function gameLoop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawRocket();
    handleInput();

    if (Math.random() < asteroidSpawnRate) spawnAsteroid();
    if (Math.random() < 0.01) spawnStar();

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

    for (let i = stars.length - 1; i >= 0; i--) {
        stars[i].y += stars[i].speed;
        drawStar(stars[i]);
        if (checkCollision(rocket, stars[i])) {
            score += 10;
            scoreDisplay.textContent = `Score: ${score}`;
            starSound.play();
            checkLevelUp();
            stars.splice(i, 1);
            continue; // Skip to next iteration after removal
        }
        if (stars[i].y > canvas.height) {
            stars.splice(i, 1);
        }
    }

    requestAnimationFrame(gameLoop);
}

function drawRocket() {
    if (rocketImg.complete) {
        ctx.drawImage(rocketImg, rocket.x, rocket.y, rocket.width, rocket.height);
    } else {
        console.error("Rocket image not loaded");
        ctx.fillStyle = "red";
        ctx.fillRect(rocket.x, rocket.y, rocket.width, rocket.height);
    }
}

function drawAsteroid(asteroid) {
    if (asteroidImg.complete) {
        ctx.drawImage(asteroidImg, asteroid.x, asteroid.y, asteroid.size, asteroid.size);
    } else {
        console.error("Asteroid image not loaded");
        ctx.fillStyle = "gray";
        ctx.fillRect(asteroid.x, asteroid.y, asteroid.size, asteroid.size);
    }
}

function drawStar(star) {
    if (starImg.complete) {
        ctx.drawImage(starImg, star.x, star.y, star.size, star.size);
    } else {
        console.error("Star image not loaded");
        ctx.fillStyle = "yellow";
        ctx.fillRect(star.x, star.y, star.size, star.size);
    }
}

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

function checkCollision(obj1, obj2) {
    return (
        obj1.x < obj2.x + obj2.size &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.size &&
        obj1.y + obj1.height > obj2.y
    );
}

function handleInput() {
    document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft" && rocket.x > 0) rocket.x -= rocket.speed;
        if (e.key === "ArrowRight" && rocket.x < canvas.width - rocket.width) rocket.x += rocket.speed;
    });
}

function checkLevelUp() {
    for (let i = 0; i < levelThresholds.length; i++) {
        if (score >= levelThresholds[i] && level === i + 1) {
            level++;
            levelDisplay.textContent = `Level: ${level}`;
            asteroidSpeedMultiplier += 0.5;
            asteroidSpawnRate += 0.01;
            levelUpSound.play();
            break;
        }
    }
}

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

window.onload = () => {
    if (!rocketImg.complete) console.error("Rocket image failed to load");
    if (!asteroidImg.complete) console.error("Asteroid image failed to load");
    if (!starImg.complete) console.error("Star image failed to load");
    gameLoop();
};
