// Game canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const score1Element = document.getElementById('score1');
const score2Element = document.getElementById('score2');
const gameOverElement = document.getElementById('gameOver');
const winnerTextElement = document.getElementById('winnerText');
const finalScoresElement = document.getElementById('finalScores');
const restartButton = document.getElementById('restartButton');
const loadingElement = document.getElementById('loading');

// Game state variables
let gameStarted = false;
let modelTargetScale = 1;

// Babylon.js variables
let engine, scene, camera;
let mainModel, secondaryModel;

// Initialize Babylon.js with start screen
async function initBabylonBackground() {
    const renderCanvas = document.getElementById("renderCanvas");
    engine = new BABYLON.Engine(renderCanvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        alpha: true
    });
    
    // Create scene
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.2, 1);
    
    // Create camera
    camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 4, 50, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(renderCanvas, false);
    camera.lowerRadiusLimit = 5;
    camera.upperRadiusLimit = 100;
    
    // Add lights
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;

    // Create initial start screen
    const startScreen = document.createElement('div');
    startScreen.style.position = 'fixed';
    startScreen.style.top = '0';
    startScreen.style.left = '0';
    startScreen.style.width = '100%';
    startScreen.style.height = '100%';
    startScreen.style.display = 'flex';
    startScreen.style.flexDirection = 'column';
    startScreen.style.justifyContent = 'center';
    startScreen.style.alignItems = 'center';
    startScreen.style.backgroundColor = 'black';
    startScreen.style.zIndex = '1000';
    startScreen.style.color = 'white';
    startScreen.style.fontSize = '32px';
    startScreen.style.cursor = 'pointer';
    
    const title = document.createElement('h1');
    // title.textContent = '🌟 Gem Collector Game 🌟';
    title.style.color = 'gold';
    title.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.7)';
    title.style.marginBottom = '40px';
    
    const instruction = document.createElement('div');
    instruction.textContent = 'Welcome';
    instruction.style.fontSize = '24px';
    instruction.style.animation = 'pulse 1.5s infinite';
    
    // Add pulse animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);
    
    startScreen.appendChild(title);
    startScreen.appendChild(instruction);
    document.body.appendChild(startScreen);
    
    // Start game on click - this will trigger the animation sequence
    startScreen.addEventListener('click', () => {
        startScreen.style.opacity = '0';
        startScreen.style.transition = 'opacity 0.5s';
        setTimeout(() => {
            startScreen.remove();
            startGameAnimation();
        }, 500);
    });

    // Load 3D model
    try {
        loadingElement.style.display = 'block';
        loadingElement.textContent = "Loading 3D model...";
        
        const result = await BABYLON.SceneLoader.ImportMeshAsync(
            "", 
            "model/", 
            "little_voxel_island.glb",
            scene,
            (progress) => {
                const percent = (progress.loaded / progress.total * 100).toFixed(0);
                loadingElement.textContent = `Loading 3D model... ${percent}%`;
            }
        );
        
        mainModel = result.meshes[0];
        mainModel.renderingGroupId = 0;
        
        // Start very small
        mainModel.scaling = new BABYLON.Vector3(0.01, 0.01, 0.01);
        mainModel.position = new BABYLON.Vector3(0, 0, 0);
        
        // Calculate target scale
        const bounding = mainModel.getHierarchyBoundingVectors();
        const size = bounding.max.subtract(bounding.min);
        const maxDim = Math.max(size.x, size.y, size.z);
        modelTargetScale = 10 / maxDim;
        
        // Hide model until start
        mainModel.setEnabled(false);
        
    } catch (error) {
        console.error("Error loading 3D model:", error);
        createFallbackBackground();
    }
    
    // Animation loop
    engine.runRenderLoop(() => {
        scene.render();
    });
    
    window.addEventListener("resize", () => {
        engine.resize();
    });
}

function startGameAnimation() {
    if (gameStarted) return;
    
    // Show loading message
    loadingElement.style.display = 'block';
    loadingElement.textContent = "Preparing game...";
    
    // Initial model setup
    if (mainModel) {
        mainModel.setEnabled(true);
        mainModel.position = new BABYLON.Vector3(0, -15, -15);
        mainModel.rotation = BABYLON.Vector3.Zero();
        mainModel.scaling = new BABYLON.Vector3(0.01, 0.01, 0.01);
        
        // Create zoom-in animation
        const zoomAnim = new BABYLON.Animation(
            "zoomIn",
            "scaling",
            60,
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        
        const zoomKeys = [
            { frame: 0, value: new BABYLON.Vector3(0.01, 0.01, 0.01) },
            { frame: 180, value: new BABYLON.Vector3(modelTargetScale * 0.2, modelTargetScale * 0.2, modelTargetScale * 0.2) }
        ];
        zoomAnim.setKeys(zoomKeys);
        
        // Create rotation animation (separate from zoom animation)
        const rotateAnim = new BABYLON.Animation(
            "rotateAnim",
            "rotation.x",  // Rotating around X axis
            60,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        
        const rotateKeys = [
            { frame: 0, value: 0 },
            { frame: 60, value: Math.PI / 4 } // 45 degrees rotation
        ];
        rotateAnim.setKeys(rotateKeys);
        
        // Create animation groups
        const zoomGroup = new BABYLON.AnimationGroup("zoomGroup");
        zoomGroup.addTargetedAnimation(zoomAnim, mainModel);
        
        const rotateGroup = new BABYLON.AnimationGroup("rotateGroup");
        rotateGroup.addTargetedAnimation(rotateAnim, mainModel);
        
        // Play zoom animation first
        zoomGroup.play(false);
        
        // When zoom completes, play rotation then fade to black
        zoomGroup.onAnimationEndObservable.add(() => {
            rotateGroup.play(false);
            
            // When rotation completes, fade to black
            rotateGroup.onAnimationEndObservable.add(() => {
                const fadeOut = document.createElement('div');
                fadeOut.style.position = 'fixed';
                fadeOut.style.top = '0';
                fadeOut.style.left = '0';
                fadeOut.style.width = '100%';
                fadeOut.style.height = '100%';
                fadeOut.style.backgroundColor = 'black';
                fadeOut.style.opacity = '0';
                fadeOut.style.zIndex = '999';
                fadeOut.style.transition = 'opacity 1s';
                document.body.appendChild(fadeOut);
                
                setTimeout(() => {
                    fadeOut.style.opacity = '1';
                    setTimeout(() => {
                        loadingElement.style.display = 'none';
                        createPlayButton();
                        fadeOut.remove();
                    }, 1000);
                }, 500);
            });
        });
    } else {
        createPlayButton();
    }
}

function createPlayButton() {
    const playButton = document.createElement('div');
    playButton.textContent = 'PRESS START';
    playButton.style.position = 'fixed';
    playButton.style.top = '50%';
    playButton.style.left = '50%';
    playButton.style.transform = 'translate(-50%, -50%)';
    playButton.style.padding = '20px 40px';
    playButton.style.backgroundColor = '#FF5722';
    playButton.style.color = 'white';
    playButton.style.border = 'none';
    playButton.style.borderRadius = '10px';
    playButton.style.fontSize = '28px';
    playButton.style.fontWeight = 'bold';
    playButton.style.cursor = 'pointer';
    playButton.style.zIndex = '1001';
    playButton.style.boxShadow = '0 0 20px rgba(255,87,34,0.7)';
    playButton.style.transition = 'all 0.3s';
    playButton.style.animation = 'pulse 1.5s infinite';
    
    // Add pulse animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -50%) scale(1.1); }
            100% { transform: translate(-50%, -50%) scale(1); }
        }
    `;
    document.head.appendChild(style);
    
    // Hover effect
    playButton.addEventListener('mouseover', () => {
        playButton.style.backgroundColor = '#E64A19';
    });
    
    playButton.addEventListener('mouseout', () => {
        playButton.style.backgroundColor = '#FF5722';
    });
    
    // Click handler
    playButton.addEventListener('click', () => {
        playButton.style.display = 'none';
        gameStarted = true;
        initGame();
    });
    
    document.body.appendChild(playButton);
}

function createFallbackBackground() {
    loadingElement.textContent = "Using fallback background";
    
    // Create starfield
    const starfield = BABYLON.MeshBuilder.CreateSphere("starfield", {diameter: 1000}, scene);
    const starMaterial = new BABYLON.StandardMaterial("starMaterial", scene);
    starMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
    starMaterial.disableLighting = true;
    
    // Create dynamic star texture
    const starTexture = new BABYLON.DynamicTexture("dynamicTexture", 512, scene, true);
    const context = starTexture.getContext();
    context.fillStyle = "#000033";
    context.fillRect(0, 0, 512, 512);
    
    // Draw random stars
    context.fillStyle = "white";
    for (let i = 0; i < 500; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const size = Math.random() * 2;
        context.fillRect(x, y, size, size);
    }
    starTexture.update();
    starMaterial.emissiveTexture = starTexture;
    starfield.material = starMaterial;
    
    // Add rotating planet
    const planet = BABYLON.MeshBuilder.CreateSphere("planet", {diameter: 30}, scene);
    planet.position = new BABYLON.Vector3(50, 0, 100);
    const planetMaterial = new BABYLON.StandardMaterial("planetMat", scene);
    planetMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.3, 0.1);
    planet.material = planetMaterial;
    
    // Rotate background slowly
    scene.registerBeforeRender(() => {
        starfield.rotation.y += 0.0005;
        planet.rotation.y += 0.005;
    });
}

// Game variables
const gameDuration = 30000; // 30 seconds
let gameStartTime;
let isGameOver = false;
let assetsLoaded = false;
let loadedAssets = 0;
const totalAssets = 6; // Number of assets to load (excluding 3D model)

// Sprite sheet parameters (keep original sprite size but scale up rendering)
const SPRITE_WIDTH = 64;
const SPRITE_HEIGHT = 64;
const FRAMES_PER_ROW = 8;
const FRAME_DELAY = 10;

// Physics constants
const GRAVITY = 0.5;
const JUMP_FORCE = -12;

// New scaled-up sizes (3x original size)
const SCALE_FACTOR = 2;
const PLAYER_WIDTH = 64 * SCALE_FACTOR;  // 192
const PLAYER_HEIGHT = 64 * SCALE_FACTOR; // 192
const GEM_SIZE = 30 * SCALE_FACTOR;      // 90
const PLATFORM_HEIGHT = 40 * SCALE_FACTOR; // 120

// Sprite assets
const assets = {
    player1: {
        sheet: new Image(),
        frame: 0,
        frameCount: 0,
        direction: 2,
        isMoving: false
    },
    player2: {
        sheet: new Image(),
        frame: 0,
        frameCount: 0,
        direction: 2,
        isMoving: false
    },
    redGem: new Image(),
    blueGem: new Image(),
    greenGem: new Image(),
    yellowGem: new Image(),
    platform: new Image()
};

// Load assets
function loadAssets() {
    // Player 1 spritesheet
    assets.player1.sheet.src = document.getElementById('player1Sheet').src;
    assets.player1.sheet.onload = () => assetLoaded();
    assets.player1.sheet.onerror = () => assetLoaded();

    // Player 2 spritesheet
    assets.player2.sheet.src = document.getElementById('player2Sheet').src;
    assets.player2.sheet.onload = () => assetLoaded();
    assets.player2.sheet.onerror = () => assetLoaded();

    // Other assets
    assets.redGem.src = document.getElementById('redGem').src;
    assets.blueGem.src = document.getElementById('blueGem').src;
    assets.greenGem.src = document.getElementById('greenGem').src;
    assets.yellowGem.src = document.getElementById('yellowGem').src;
    assets.platform.src = document.getElementById('platform').src;

    // Track loading for other assets
    ['redGem', 'blueGem', 'greenGem', 'yellowGem', 'platform'].forEach(asset => {
        assets[asset].onload = () => assetLoaded();
        assets[asset].onerror = () => assetLoaded();
    });
}

function assetLoaded() {
    loadedAssets++;
    loadingElement.textContent = `Loading assets... ${Math.round((loadedAssets / totalAssets) * 100)}%`;
    if (loadedAssets === totalAssets) {
        assetsLoaded = true;
        loadingElement.style.display = 'none';
    }
}

// Update platforms array with scaled dimensions
const platforms = [
    { x: 0, y: canvas.height - PLATFORM_HEIGHT, width: 200 * SCALE_FACTOR, height: PLATFORM_HEIGHT },
    { x: 250 * SCALE_FACTOR, y: canvas.height - 100 * SCALE_FACTOR, width: 200 * SCALE_FACTOR, height: PLATFORM_HEIGHT },
    { x: 500 * SCALE_FACTOR, y: canvas.height - 160 * SCALE_FACTOR, width: 200 * SCALE_FACTOR, height: PLATFORM_HEIGHT },
    { x: 750 * SCALE_FACTOR, y: canvas.height - 100 * SCALE_FACTOR, width: 200 * SCALE_FACTOR, height: PLATFORM_HEIGHT },
    { x: 1000 * SCALE_FACTOR, y: canvas.height - PLATFORM_HEIGHT, width: 200 * SCALE_FACTOR, height: PLATFORM_HEIGHT },
    { x: 300 * SCALE_FACTOR, y: canvas.height - 220 * SCALE_FACTOR, width: 150 * SCALE_FACTOR, height: 30 * SCALE_FACTOR },
    { x: 600 * SCALE_FACTOR, y: canvas.height - 280 * SCALE_FACTOR, width: 150 * SCALE_FACTOR, height: 30 * SCALE_FACTOR },
    { x: 450 * SCALE_FACTOR, y: canvas.height - 340 * SCALE_FACTOR, width: 150 * SCALE_FACTOR, height: 30 * SCALE_FACTOR },
    { x: 750 * SCALE_FACTOR, y: canvas.height - 220 * SCALE_FACTOR, width: 150 * SCALE_FACTOR, height: 30 * SCALE_FACTOR }
];

// Players
const player1 = {
    x: 100 * SCALE_FACTOR,
    y: canvas.height - 100 * SCALE_FACTOR,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    speed: 3,
    score: 0,
    velocityY: 0,
    isJumping: false,
    keys: {
        up: 'w',
        down: 's',
        left: 'a',
        right: 'd',
        jump: ' '
    },
    keyState: {
        up: false,
        down: false,
        left: false,
        right: false,
        jump: false
    }
};

const player2 = {
    x: 700 * SCALE_FACTOR,
    y: canvas.height - 100 * SCALE_FACTOR,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    speed: 5,
    score: 0,
    velocityY: 0,
    isJumping: false,
    keys: {
        up: 'ArrowUp',
        down: 'ArrowDown',
        left: 'ArrowLeft',
        right: 'ArrowRight',
        jump: 'Enter'
    },
    keyState: {
        up: false,
        down: false,
        left: false,
        right: false,
        jump: false
    }
};

// Gems
const gems = [];
const gemTypes = [
    { color: 'red', points: 1 },
    { color: 'blue', points: 2 },
    { color: 'green', points: 3 },
    { color: 'yellow', points: 5 }
];
const gemSize = 30;
const gemSpawnRate = 800; // milliseconds
let lastGemSpawnTime = 0;

// Particle effects for gem collection
const particles = [];

// Key event listeners
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);
restartButton.addEventListener('click', restartGame);

// Start loading assets and initialize 3D background
initBabylonBackground();
loadAssets();

function initGame() {
    if (!assetsLoaded) return;
    
    // Create score display container
    const scoreContainer = document.createElement('div');
    scoreContainer.className = 'score-container';
    
    const title = document.createElement('h1');
    title.className = 'game-title';
    title.textContent = '🌟 Gem Collector Game 🌟';
    
    const scoresDisplay = document.createElement('div');
    scoresDisplay.className = 'score-display';
    scoresDisplay.id = 'titleScores';
    scoresDisplay.innerHTML = `Player 1: <span id="titleScore1">0</span> | Player 2: <span id="titleScore2">0</span>`;
    
    scoreContainer.appendChild(title);
    scoreContainer.appendChild(scoresDisplay);
    
    // Add it to the body or a specific container
    const gameHeader = document.getElementById('gameHeader') || document.body;
    gameHeader.insertBefore(scoreContainer, gameHeader.firstChild);
    
    // Reset game state
    player1.score = 0;
    player2.score = 0;
    player1.y = canvas.height - 100;
    player2.y = canvas.height - 100;
    player1.velocityY = 0;
    player2.velocityY = 0;
    player1.isJumping = false;
    player2.isJumping = false;
    gems.length = 0;
    particles.length = 0;
    isGameOver = false;
    gameOverElement.style.display = 'none';
    gameStartTime = Date.now();
    updateScore();
    requestAnimationFrame(gameLoop);
}

function restartGame() {
    const scoreContainer = document.querySelector('.score-container');
    if (scoreContainer) {
        scoreContainer.remove();
    }
    initGame();
}

function gameLoop() {
    if (isGameOver || !assetsLoaded) return;
    
    const currentTime = Date.now();
    const elapsedTime = currentTime - gameStartTime;
    
    if (elapsedTime >= gameDuration) {
        endGame();
        return;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw platforms
    drawPlatforms();
    
    // Update players
    updatePlayer(player1, assets.player1);
    updatePlayer(player2, assets.player2);
    
    // Spawn gems
    if (currentTime - lastGemSpawnTime > gemSpawnRate) {
        spawnGem();
        lastGemSpawnTime = currentTime;
    }
    
    // Draw players
    drawPlayer(player1, assets.player1);
    drawPlayer(player2, assets.player2);
    
    // Draw gems
    drawGems();
    
    // Draw particles
    drawParticles();
    
    // Check collisions
    checkCollisions();
    
    // Draw timer
    drawTimer(elapsedTime);
    
    requestAnimationFrame(gameLoop);
}

function drawPlatforms() {
    platforms.forEach(platform => {
        if (assets.platform.complete) {
            for (let x = platform.x; x < platform.x + platform.width; x += assets.platform.width) {
                const width = Math.min(assets.platform.width, platform.x + platform.width - x);
                ctx.drawImage(
                    assets.platform,
                    0, 0, width, assets.platform.height,
                    x, platform.y, width, platform.height
                );
            }
        } else {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        }
    });
}

function updatePlayer(player, spriteData) {
    // Apply gravity
    player.velocityY += GRAVITY;
    player.y += player.velocityY;
    
    // Check platform collisions
    let onPlatform = false;
    for (const platform of platforms) {
        if (
            player.y + player.height >= platform.y &&
            player.y + player.height <= platform.y + platform.height &&
            player.x + player.width > platform.x &&
            player.x < platform.x + platform.width
        ) {
            player.y = platform.y - player.height;
            player.velocityY = 0;
            onPlatform = true;
            player.isJumping = false;
            break;
        }
    }
    
    // Check if player fell off the screen
    if (player.y > canvas.height) {
        player.y = 50;
        player.x = player === player1 ? 100 : 700;
        player.velocityY = 0;
    }
    
    // Handle horizontal movement
    spriteData.isMoving = false;
    
    if (player.keyState.left) {
        player.x = Math.max(0, player.x - player.speed);
        spriteData.direction = 1; // left
        spriteData.isMoving = true;
    }
    if (player.keyState.right) {
        player.x = Math.min(canvas.width - player.width, player.x + player.speed);
        spriteData.direction = 3; // right
        spriteData.isMoving = true;
    }
    
    // Handle jumping
    if (player.keyState.jump && !player.isJumping && onPlatform) {
        player.velocityY = JUMP_FORCE;
        player.isJumping = true;
    }
    
    // Update animation frame
    if (spriteData.isMoving) {
        spriteData.frameCount++;
        if (spriteData.frameCount >= FRAME_DELAY) {
            spriteData.frameCount = 0;
            spriteData.frame = (spriteData.frame + 1) % FRAMES_PER_ROW;
        }
    } else {
        spriteData.frame = 0;
    }
}

function drawPlayer(player, spriteData) {
    const row = spriteData.direction;
    const col = spriteData.frame;
    
    ctx.drawImage(
        spriteData.sheet,
        col * SPRITE_WIDTH,
        row * SPRITE_HEIGHT,
        SPRITE_WIDTH,
        SPRITE_HEIGHT,
        player.x,
        player.y,
        player.width,
        player.height
    );
}

function spawnGem() {
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const gemType = gemTypes[Math.floor(Math.random() * gemTypes.length)];
    
    const gem = {
        x: platform.x + Math.random() * (platform.width - GEM_SIZE),
        y: platform.y - GEM_SIZE,
        type: gemType.color,
        points: gemType.points,
        size: GEM_SIZE,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.1
    };
    gems.push(gem);
}

function drawGems() {
    gems.forEach(gem => {
        ctx.save();
        ctx.translate(gem.x + gem.size/2, gem.y + gem.size/2);
        ctx.rotate(gem.rotation);
        gem.rotation += gem.rotationSpeed;
        
        let gemSprite;
        switch(gem.type) {
            case 'red': gemSprite = assets.redGem; break;
            case 'blue': gemSprite = assets.blueGem; break;
            case 'green': gemSprite = assets.greenGem; break;
            case 'yellow': gemSprite = assets.yellowGem; break;
        }
        
        ctx.drawImage(gemSprite, -gem.size/2, -gem.size/2, gem.size, gem.size);
        ctx.restore();
        
        // Draw points indicator
        ctx.fillStyle = 'white';
        ctx.font = `bold ${14 * SCALE_FACTOR}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(gem.points.toString(), gem.x + gem.size/2, gem.y + gem.size + 15 * SCALE_FACTOR);
    });
}

function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            size: Math.random() * 5 + 2,
            color: color,
            speedX: (Math.random() - 0.5) * 5,
            speedY: (Math.random() - 0.5) * 5,
            life: 30 + Math.random() * 20
        });
    }
}

function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        
        p.x += p.speedX;
        p.y += p.speedY;
        p.life--;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function checkCollisions() {
    for (let i = gems.length - 1; i >= 0; i--) {
        const gem = gems[i];
        
        // Check collision with player 1
        if (player1.x < gem.x + gem.size &&
            player1.x + player1.width > gem.x &&
            player1.y < gem.y + gem.size &&
            player1.y + player1.height > gem.y) {
            player1.score += gem.points;
            createParticles(gem.x + gem.size/2, gem.y + gem.size/2, getGemColor(gem.type), 15);
            gems.splice(i, 1);
            updateScore();
            continue;
        }
        
        // Check collision with player 2
        if (player2.x < gem.x + gem.size &&
            player2.x + player2.width > gem.x &&
            player2.y < gem.y + gem.size &&
            player2.y + player2.height > gem.y) {
            player2.score += gem.points;
            createParticles(gem.x + gem.size/2, gem.y + gem.size/2, getGemColor(gem.type), 15);
            gems.splice(i, 1);
            updateScore();
        }
    }
}

function getGemColor(type) {
    switch(type) {
        case 'red': return '#ff5555';
        case 'blue': return '#5555ff';
        case 'green': return '#55ff55';
        case 'yellow': return '#ffff55';
        default: return '#ffffff';
    }
}

function updateScore() {
    score1Element.textContent = player1.score;
    score2Element.textContent = player2.score;
    
    // Also update the title scores if they exist
    const titleScore1 = document.getElementById('titleScore1');
    const titleScore2 = document.getElementById('titleScore2');
    if (titleScore1 && titleScore2) {
        titleScore1.textContent = player1.score;
        titleScore2.textContent = player2.score;
    }
}
function drawTimer(elapsedTime) {
    const remainingTime = Math.max(0, (gameDuration - elapsedTime) / 1000);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Time: ${remainingTime.toFixed(1)}s`, canvas.width / 2, 30);
}

function endGame() {
    isGameOver = true;
    
    let winnerText;
    if (player1.score > player2.score) {
        winnerText = "🎮 Player 1 (WASD) wins! 🏆";
    } else if (player2.score > player1.score) {
        winnerText = "🎮 Player 2 (Arrows) wins! 🏆";
    } else {
        winnerText = "🤝 It's a tie! 🤝";
    }
    
    winnerTextElement.innerHTML = winnerText;
    finalScoresElement.innerHTML = `Player 1: ${player1.score} 💎 | Player 2: ${player2.score} 💎`;
    gameOverElement.style.display = 'block';
}

function handleKeyDown(e) {
    if (isGameOver) return;
    
    checkKey(e.key, player1, true);
    checkKey(e.key, player2, true);
    
    if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
    }
}

function handleKeyUp(e) {
    checkKey(e.key, player1, false);
    checkKey(e.key, player2, false);
}

function checkKey(key, player, isPressed) {
    for (const direction in player.keys) {
        if (key.toLowerCase() === player.keys[direction].toLowerCase()) {
            player.keyState[direction] = isPressed;
        }
    }
}