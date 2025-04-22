// Game variables
let playerId;
let players = {};
let bullets = {};
let bombs = {};
let socket;
let scene;
let engine;
let camera;
let myPlayer;
let isGameOver = false;
let canJump = true;
let currentWeapon = 'pistol';
let lastShotTime = 0;
let physicsPlugin;
let explosionSound;
let gunshotSound;
let hitSound;
let reloadSound;
let mouseSensitivity = 1.0;
let kills = 0;
let deaths = 0;
let weaponBobOffset = 0;
let weaponBobTime = 0;
let isMoving = false;
let isSprinting = false;
let lastMovementTime = 0;

// Initialize game
// Initialize game
async function initGame() {
    const canvas = document.getElementById("renderCanvas");
    engine = new BABYLON.Engine(canvas, true);

    // Create scene
    scene = new BABYLON.Scene(engine);
    scene.gravity = new BABYLON.Vector3(0, -9.81, 0);
    scene.collisionsEnabled = true;

    // Initialize physics - using CannonJS (comment out if using Havok)
    const gravityVector = new BABYLON.Vector3(0, -9.81, 0);
    const physicsPlugin = new BABYLON.CannonJSPlugin();
    scene.enablePhysics(gravityVector, physicsPlugin);

    // Initialize physics - using Havok (uncomment if using Havok)
    try {
        const havokInstance = await HavokPhysics();
        const physicsPlugin = new BABYLON.HavokPlugin(true, havokInstance);
        scene.enablePhysics(gravityVector, physicsPlugin);
    } catch (e) {
        console.error("Failed to initialize Havok physics:", e);
        // Fallback to CannonJS
        const physicsPlugin = new BABYLON.CannonJSPlugin();
        scene.enablePhysics(gravityVector, physicsPlugin);
    }

    // Create environment
    createMuseum(scene);

    // Create camera with physics
    camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 1.8, 0), scene);
    camera.attachControl(canvas, true);
    camera.minZ = 0.1;
    camera.speed = 0.2;
    camera.angularSensibility = 8000 / mouseSensitivity;
    camera.applyGravity = true;
    camera.checkCollisions = true;
    camera.ellipsoid = new BABYLON.Vector3(0.5, 0.9, 0.5);
    camera.ellipsoidOffset = new BABYLON.Vector3(0, 0.9, 0);
    camera.fov = 80 * (Math.PI / 180);

    // Set up controls
    setupControls();

    // Create weapons
    await createWeapons();

    // Create sounds
    createSounds();

    // Setup settings panel
    setupSettings();

    // Hide loading screen
    document.getElementById("loadingScreen").style.display = "none";

    // Game loop
    engine.runRenderLoop(function () {
        if (myPlayer && !isGameOver) {
            updatePlayerPosition();
            updateWeaponBob();
        }
        scene.render();
    });

    window.addEventListener("resize", function () {
        engine.resize();
    });
}

// Connect to server and initialize game
connectToServer();