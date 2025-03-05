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
let asteroidSpawnRate = 0.02; // Re-declared here
let enemySpawnRate = 0.005;   // Re-declared here

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
            explosionSound.play();
            endGame();
            return;
        }
        for (let j = bullets.length - 1; j >= 0; j--) {
            if (checkCollision(bullets[j], enemies[i])) {
                score += 15;
                scoreDisplay.textContent = `Score: ${score}`;
                enemies.splice(i, 1);
                bullets.splice(j, 1);
                checkLevelUp();
                break;
            }
        }
        if (enemies[i] && enemies[i].y > canvas.height) enemies.splice(i, 1);
    }

    for (let i = powerUps.length - 1; i >= 0; i--) {
        powerUps[i].y += powerUps[i].speed;
        drawPowerUp(powerUps[i]);
        if (checkCollision(rocket, powerUps[i])) {
            applyPowerUp(powerUps[i].type);
            powerUps.splice(i, 1);
            continue;
        }
        if (powerUps[i].y > canvas.height) powerUps.splice(i, 1);
    }

    updatePowerUps();

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

function drawBullet(bullet) {
    ctx.fillStyle = "white";
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
}

function drawEnemyBullet(bullet) {
    ctx.fillStyle = "red";
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
}

function drawEnemy(enemy) {
    ctx.fillStyle = "purple";
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
}

function drawPowerUp(powerUp) {
    ctx.fillStyle = powerUp.color;
    ctx.beginPath();
    ctx.arc(powerUp.x, powerUp.y, powerUp.size, 0, Math.PI * 2);
    ctx.fill();
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

function spawnBullet() {
    shootSound.play();
    bullets.push({
        x: rocket.x + rocket.width / 2 - 2.5,
        y: rocket.y,
        width: 5,
        height: 10,
        speed: 7
    });
}

function spawnEnemy() {
    enemies.push({
        x: Math.random() * (canvas.width - 40),
        y: -40,
        width: 40,
        height: 40,
        speed: 1 + level * 0.5
    });
}

function spawnEnemyBullet(enemy) {
    enemyBullets.push({
        x: enemy.x + enemy.width / 2 - 2.5,
        y: enemy.y + enemy.height,
        width: 5,
        height: 10,
        speed: 3 + level * 0.5
    });
}

function spawnPowerUp() {
    const types = [
        { type: "speed", color: "green" },
        { type: "rapid", color: "blue" },
        { type: "multi", color: "orange" }
    ];
    const powerUp = types[Math.floor(Math.random() * types.length)];
    powerUps.push({
        x: Math.random() * (canvas.width - 20),
        y: -20,
        size: 20,
        speed: 2,
        type: powerUp.type,
        color: powerUp.color
    });
}

function applyPowerUp(type) {
    if (type === "speed") {
        rocket.speed = 8;
        setTimeout(() => rocket.speed = 5, 5000);
    } else if (type === "rapid") {
        rocket.shootCooldown = 200;
        setTimeout(() => rocket.shootCooldown = 500, 5000);
    } else if (type === "multi") {
        rocket.maxBullets = 3;
        setTimeout(() => rocket.maxBullets = 1, 5000);
    }
}

function updatePowerUps() {
    // No additional logic needed; timeouts handle resets
}

function checkCollision(obj1, obj2) {
    return (
        obj1.x < obj2.x + obj2.size &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.size &&
        obj1.y + obj1.height > obj2.y
    );
}

function updateRocketPosition() {
    if (movingLeft && rocket.x > 0) rocket.x -= rocket.speed;
    if (movingRight && rocket.x < canvas.width - rocket.width) rocket.x += rocket.speed;
    if (movingUp && rocket.y > 0) rocket.y -= rocket.speed;
    if (movingDown && rocket.y < canvas.height - rocket.height) rocket.y += rocket.speed;
}

function handleShooting() {
    const now = Date.now();
    if (shooting && now - lastShotTime >= rocket.shootCooldown && bullets.length < rocket.maxBullets) {
        spawnBullet();
        lastShotTime = now;
    }
}

function handleInput() {
    document.onkeydown = (e) => {
        if (e.key === "ArrowLeft") movingLeft = true;
        if (e.key === "ArrowRight") movingRight = true;
        if (e.key === "ArrowUp") movingUp = true;
        if (e.key === "ArrowDown") movingDown = true;
        if (e.key === " ") shooting = true;
    };
    document.onkeyup = (e) => {
        if (e.key === "ArrowLeft") movingLeft = false;
        if (e.key === "ArrowRight") movingRight = false;
        if (e.key === "ArrowUp") movingUp = false;
        if (e.key === "ArrowDown") movingDown = false;
        if (e.key === " ") shooting = false;
    };

    const leftBtn = document.getElementById("leftBtn");
    const rightBtn = document.getElementById("rightBtn");
    const upBtn = document.getElementById("upBtn");
    const downBtn = document.getElementById("downBtn");
    const shootBtn = document.getElementById("shootBtn");

    leftBtn.addEventListener("touchstart", () => movingLeft = true);
    leftBtn.addEventListener("touchend", () => movingLeft = false);
    rightBtn.addEventListener("touchstart", () => movingRight = true);
    rightBtn.addEventListener("touchend", () => movingRight = false);
    upBtn.addEventListener("touchstart", () => movingUp = true);
    upBtn.addEventListener("touchend", () => movingUp = false);
    downBtn.addEventListener("touchstart", () => movingDown = true);
    downBtn.addEventListener("touchend", () => movingDown = false);
    shootBtn.addEventListener("touchstart", () => shooting = true);
    shootBtn.addEventListener("touchend", () => shooting = false);

    leftBtn.addEventListener("mousedown", () => movingLeft = true);
    leftBtn.addEventListener("mouseup", () => movingLeft = false);
    rightBtn.addEventListener("mousedown", () => movingRight = true);
    rightBtn.addEventListener("mouseup", () => movingRight = false);
    upBtn.addEventListener("mousedown", () => movingUp = true);
    upBtn.addEventListener("mouseup", () => movingUp = false);
    downBtn.addEventListener("mousedown", () => movingDown = true);
    downBtn.addEventListener("mouseup", () => movingDown = false);
    shootBtn.addEventListener("mousedown", () => shooting = true);
    shootBtn.addEventListener("mouseup", () => shooting = false);
}

function checkLevelUp() {
    for (let i = 0; i < levelThresholds.length; i++) {
        if (score >= levelThresholds[i] && level === i + 1) {
            level++;
            levelDisplay.textContent = `Level: ${level}`;
            asteroidSpeedMultiplier += 0.5;
            asteroidSpawnRate += 0.01;
            enemySpawnRate += 0.005;
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
    bullets = [];
    enemyBullets = [];
    enemies = [];
    powerUps = [];
    rocket.x = canvas.width / 2 - 25;
    rocket.y = canvas.height - 50;
    rocket.speed = 5;
    rocket.shootCooldown = 500;
    rocket.maxBullets = 1;
    asteroidSpeedMultiplier = 1;
    asteroidSpawnRate = 0.02;
    enemySpawnRate = 0.005;
    movingLeft = false;
    movingRight = false;
    movingUp = false;
    movingDown = false;
    shooting = false;
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
