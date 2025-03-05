const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");
const levelDisplay = document.getElementById("level");
const healthFill = document.getElementById("health-fill");
const gameOverScreen = document.getElementById("gameOver");
const finalScoreDisplay = document.getElementById("finalScore");
const finalLevelDisplay = document.getElementById("finalLevel");
const initialsInput = document.getElementById("initials");
const highscoreList = document.getElementById("highscore-list");

const explosionSound = document.getElementById("explosionSound");
const starSound = document.getElementById("starSound");
const levelUpSound = document.getElementById("levelUpSound");
const shootSound = document.getElementById("shootSound");
const shieldSound = document.getElementById("shieldSound");

const rocketImg = new Image();
rocketImg.src = "rocket.png";
const asteroidImg = new Image();
asteroidImg.src = "asteroid.png";
const starImg = new Image();
starImg.src = "star.png";
const enemyImg = new Image();
enemyImg.src = "enemy.png";
const shieldImg = new Image();
shieldImg.src = "shield.png";

let score = 0;
let level = 1;
let gameRunning = true;

const rocket = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 50,
    width: 50,
    height: 50,
    speed: 5,
    shootCooldown: 750,
    bulletCount: 1,
    health: 3,
    maxHealth: 5
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

const levelThresholds = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900]; // 10 levels

let asteroidSpeedMultiplier = 1;
let asteroidSpawnRate = 0.01;
let enemySpawnRate = 0.001;

function updateHealthBar() {
    const healthFraction = rocket.health / rocket.maxHealth;
    healthFill.style.width = `${healthFraction * 100}%`;
}

function gameLoop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawRocket();
    updateRocketPosition();
    handleShooting();

    if (Math.random() < asteroidSpawnRate) spawnAsteroid();
    if (Math.random() < 0.01) spawnStar();
    if (Math.random() < enemySpawnRate) spawnEnemy();
    if (Math.random() < 0.001) spawnPowerUp();

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
            rocket.health--;
            explosionSound.play();
            updateHealthBar();
            enemyBullets.splice(i, 1);
            if (rocket.health <= 0) endGame();
            continue;
        }
        if (enemyBullets[i].y > canvas.height) enemyBullets.splice(i, 1);
    }

    for (let i = asteroids.length - 1; i >= 0; i--) {
        asteroids[i].y += asteroids[i].speed * asteroidSpeedMultiplier;
        drawAsteroid(asteroids[i]);
        if (checkCollision(rocket, asteroids[i])) {
            rocket.health--;
            explosionSound.play();
            updateHealthBar();
            asteroids.splice(i, 1);
            if (rocket.health <= 0) endGame();
            continue;
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
            score += 15;
            scoreDisplay.textContent = `Score: ${score}`;
            rocket.health--;
            explosionSound.play();
            updateHealthBar();
            enemies.splice(i, 1);
            if (rocket.health <= 0) endGame();
            checkLevelUp();
            continue;
        }
        for (let j = bullets.length - 1; j >= 0; j--) {
            if (checkCollision(bullets[j], enemies[i])) {
                enemies[i].health--;
                bullets.splice(j, 1);
                if (enemies[i].health <= 0) {
                    score += 15;
                    scoreDisplay.textContent = `Score: ${score}`;
                    enemies.splice(i, 1);
                    checkLevelUp();
                }
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
        ctx.drawImage(asteroidImg, asteroid.x, asteroid.y, asteroid.width, asteroid.height);
    } else {
        console.error("Asteroid image not loaded");
        ctx.fillStyle = "gray";
        ctx.fillRect(asteroid.x, asteroid.y, asteroid.width, asteroid.height);
    }
}

function drawStar(star) {
    if (starImg.complete) {
        ctx.drawImage(starImg, star.x, star.y, star.width, star.height);
    } else {
        console.error("Star image not loaded");
        ctx.fillStyle = "yellow";
        ctx.fillRect(star.x, star.y, star.width, star.height);
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
    if (enemyImg.complete) {
        ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
    } else {
        console.error("Enemy image not loaded");
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    }
}

function drawPowerUp(powerUp) {
    if (shieldImg.complete) {
        ctx.drawImage(shieldImg, powerUp.x, powerUp.y, powerUp.width, powerUp.height);
    } else {
        console.error("Shield image not loaded");
        ctx.fillStyle = "cyan";
        ctx.beginPath();
        ctx.arc(powerUp.x, powerUp.y, powerUp.width / 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

function spawnAsteroid() {
    asteroids.push({
        x: Math.random() * (canvas.width - 30),
        y: -30, // Fixed syntax error
        width: 30,
        height: 30,
        speed: Math.random() * 1.5 + 0.3
    });
}

function spawnStar() {
    stars.push({
        x: Math.random() * (canvas.width - 20),
        y: -20,
        width: 20,
        height: 20,
        speed: 1.5
    });
}

function spawnBullet() {
    shootSound.play();
    const spreadAngle = 10;
    const baseX = rocket.x + rocket.width / 2 - 2.5;
    const baseY = rocket.y;

    for (let i = 0; i < rocket.bulletCount; i++) {
        const angle = (i - (rocket.bulletCount - 1) / 2) * spreadAngle * Math.PI / 180;
        bullets.push({
            x: baseX,
            y: baseY,
            width: 5,
            height: 10,
            speed: 4,
            dx: Math.sin(angle) * 4,
            dy: -Math.cos(angle) * 4
        });
    }
}

function spawnEnemy() {
    const types = [
        { width: 20, height: 20, health: 1, speed: 1 + level * 0.2, color: "red" },
        { width: 40, height: 40, health: 2, speed: 0.6 + level * 0.2, color: "purple" },
        { width: 60, height: 60, health: 3, speed: 0.2 + level * 0.2, color: "blue" }
    ];
    const enemy = types[Math.floor(Math.random() * types.length)];
    enemies.push({
        x: Math.random() * (canvas.width - enemy.width),
        y: -enemy.height,
        width: enemy.width,
        height: enemy.height,
        speed: enemy.speed,
        health: enemy.health,
        color: enemy.color
    });
}

function spawnEnemyBullet(enemy) {
    enemyBullets.push({
        x: enemy.x + enemy.width / 2 - 2.5,
        y: enemy.y + enemy.height,
        width: 5,
        height: 10,
        speed: 1 + level * 0.1
    });
}

function spawnPowerUp() {
    const types = [
        { type: "speed", chance: 0.3 },
        { type: "rapid", chance: 0.3 },
        { type: "multi", chance: 0.3 },
        { type: "shield", chance: 0.1 }
    ];
    const rand = Math.random();
    let cumulativeChance = 0;
    const powerUp = types.find(t => {
        cumulativeChance += t.chance;
        return rand < cumulativeChance;
    }) || types[0];
    powerUps.push({
        x: Math.random() * (canvas.width - 20),
        y: -20,
        width: 20,
        height: 20,
        speed: 1.5,
        type: powerUp.type
    });
}

function applyPowerUp(type) {
    if (type === "speed") {
        rocket.speed = 8;
        setTimeout(() => rocket.speed = 5, 5000);
    } else if (type === "rapid") {
        rocket.shootCooldown = 300;
        setTimeout(() => rocket.shootCooldown = 750, 5000);
    } else if (type === "multi") {
        rocket.bulletCount += 2;
        setTimeout(() => rocket.bulletCount = Math.min(level, 5) * 2 - 1, 5000);
    } else if (type === "shield") {
        rocket.health = Math.min(rocket.health + 2, rocket.maxHealth);
        shieldSound.play();
        updateHealthBar();
    }
}

function updatePowerUps() {
    // No additional logic needed; timeouts handle resets
}

function checkCollision(obj1, obj2) {
    return (
        obj1.x < obj2.x + (obj2.width || obj2.size) &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + (obj2.height || obj2.size) &&
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
    if (shooting && now - lastShotTime >= rocket.shootCooldown) {
        spawnBullet();
        lastShotTime = now;
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].x += bullets[i].dx || 0;
        bullets[i].y += bullets[i].dy || -bullets[i].speed;
    }
}

function setupKeyboardControls() {
    document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") movingLeft = true;
        if (e.key === "ArrowRight") movingRight = true;
        if (e.key === "ArrowUp") movingUp = true;
        if (e.key === "ArrowDown") movingDown = true;
        if (e.key === " ") shooting = true;
    });
    document.addEventListener("keyup", (e) => {
        if (e.key === "ArrowLeft") movingLeft = false;
        if (e.key === "ArrowRight") movingRight = false;
        if (e.key === "ArrowUp") movingUp = false;
        if (e.key === "ArrowDown") movingDown = false;
        if (e.key === " ") shooting = false;
    });
}

function setupButtonControls() {
    const leftBtn = document.getElementById("leftBtn");
    const rightBtn = document.getElementById("rightBtn");
    const upBtn = document.getElementById("upBtn");
    const downBtn = document.getElementById("downBtn");
    const fireBtn = document.getElementById("fireBtn");

    function addButtonFeedback(btn, stateVar) {
        btn.addEventListener("touchstart", () => {
            stateVar(true);
            btn.classList.add("pressed");
            setTimeout(() => btn.classList.remove("pressed"), 100);
        });
        btn.addEventListener("touchend", () => stateVar(false));
        btn.addEventListener("mousedown", () => {
            stateVar(true);
            btn.classList.add("pressed");
            setTimeout(() => btn.classList.remove("pressed"), 100);
        });
        btn.addEventListener("mouseup", () => stateVar(false));
    }

    addButtonFeedback(leftBtn, (state) => movingLeft = state);
    addButtonFeedback(rightBtn, (state) => movingRight = state);
    addButtonFeedback(upBtn, (state) => movingUp = state);
    addButtonFeedback(downBtn, (state) => movingDown = state);
    addButtonFeedback(fireBtn, (state) => shooting = state);
}

function checkLevelUp() {
    if (level < 10 && score >= levelThresholds[level]) {
        level++;
        rocket.bulletCount = Math.min(level, 5) * 2 - 1;
        levelDisplay.textContent = `Level: ${level}`;
        asteroidSpeedMultiplier += 0.05;
        asteroidSpawnRate += 0.002;
        enemySpawnRate += 0.001;
        levelUpSound.play();
    }
}

function loadHighscores() {
    const highscores = JSON.parse(localStorage.getItem("rocketDodgeHighscores")) || [];
    return highscores;
}

function saveHighscores(highscores) {
    localStorage.setItem("rocketDodgeHighscores", JSON.stringify(highscores));
}

function updateLeaderboard() {
    const highscores = loadHighscores();
    highscoreList.innerHTML = "";
    highscores.slice(0, 5).forEach((entry, index) => {
        const li = document.createElement("li");
        li.textContent = `${index + 1}. ${entry.initials} - ${entry.score}`;
        highscoreList.appendChild(li);
    });
}

function submitHighscore() {
    const initials = initialsInput.value.trim().toUpperCase();
    if (initials.length === 3) {
        const highscores = loadHighscores();
        highscores.push({ initials, score });
        highscores.sort((a, b) => b.score - a.score);
        saveHighscores(highscores);
        updateLeaderboard();
        initialsInput.disabled = true;
        document.querySelector("#highscore-input button").disabled = true;
    }
}

function endGame() {
    gameRunning = false;
    gameOverScreen.classList.remove("hidden");
    finalScoreDisplay.textContent = score;
    finalLevelDisplay.textContent = level;
    initialsInput.value = "";
    initialsInput.disabled = false;
    document.querySelector("#highscore-input button").disabled = false;
    updateLeaderboard();
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
    rocket.shootCooldown = 750;
    rocket.bulletCount = 1;
    rocket.health = 3;
    asteroidSpeedMultiplier = 1;
    asteroidSpawnRate = 0.01;
    enemySpawnRate = 0.001;
    movingLeft = false;
    movingRight = false;
    movingUp = false;
    movingDown = false;
    shooting = false;
    scoreDisplay.textContent = `Score: ${score}`;
    levelDisplay.textContent = `Level: ${level}`;
    updateHealthBar();
    gameOverScreen.classList.add("hidden");
    gameLoop();
}

window.onload = () => {
    if (!rocketImg.complete) console.error("Rocket image not loaded");
    if (!asteroidImg.complete) console.error("Asteroid image not loaded");
    if (!starImg.complete) console.error("Star image not loaded");
    if (!enemyImg.complete) console.error("Enemy image not loaded");
    if (!shieldImg.complete) console.error("Shield image not loaded");
    setupKeyboardControls();
    setupButtonControls();
    updateLeaderboard();
    updateHealthBar();
    gameLoop();
};
