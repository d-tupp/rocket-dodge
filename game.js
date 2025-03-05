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
const shootSound = document.getElementById("shootSound");

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
    speed: 5,
    shootCooldown: 500,
    maxBullets: 1
};

let asteroids = [];
let stars = [];
let bullets = [];
let enemyBullets = [];
let enemies = [];
let powerUps = [];
let lastShotTime = 0;

let movingLeft = false;
let movingRight = false;
let movingUp = false;
let movingDown = false;
let shooting = false;

const levelThresholds = [50, 100, 200, 300];
let asteroidSpeedMultiplier = 1;
let asteroidSpawnRate = 0.02;
let enemySpawnRate = 0.002; // Reduced for Level 1

function gameLoop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawRocket();
    updateRocketPosition();
    handleShooting();

    if (Math.random() < asteroidSpawnRate) spawnAsteroid();
    if (Math.random() < 0.01) spawnStar();
    if (Math.random() < enemySpawnRate) spawnEnemy();
    if (Math.random() < 0.005) spawnPowerUp();

    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bullets[i].speed;
        drawBullet(bullets[i]);
        for (let j = asteroids.length - 1; j >= 0; j--) {
            if (checkCollision(bullets[i], asteroids[j])) {
                score += 5;
                scoreDisplay.textContent = `Score: ${score}`;
                asteroids.splice(j, 1);
                bullets.splice(i, 1);
                checkLevelUp();
                break;
            }
        }
        if (bullets[i] && bullets[i].y < 0) bullets.splice(i, 1);
    }

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        enemyBullets[i].y += enemyBullets[i].speed;
        drawEnemyBullet(enemyBullets[i]);
        if (checkCollision(rocket, enemyBullets[i])) {
            explosionSound.play();
            endGame();
            return;
        }
        if (enemyBullets[i].y > canvas.height) enemyBullets.splice(i, 1);
    }

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
            continue;
        }
        if (stars[i].y > canvas.height) stars.splice(i, 1);
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        enemies[i].y += enemies[i].speed;
        drawEnemy(enemies[i]);
        if (Math.random() < 0.02) spawnEnemyBullet(enemies[i]);
        if (checkCollision(rocket, enemies[i])) {
            score += 15; // Points for destroying enemy by collision
            scoreDisplay.textContent = `Score: ${score}`;
            enemies.splice(i, 1);
            explosionSound.play();
            checkLevelUp();
            continue; // Continue to next enemy after collision
        }
        for (let j = bullets.length - 1; j >= 0; j--) {
            if (checkCollision(bullets[j], enemies[i])) {
                score += 15;
                scoreDisplay.textContent = `Score: ${score}`;
                enemie
