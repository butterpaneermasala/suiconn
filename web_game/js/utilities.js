function setupSettings() {
    const sensitivitySlider = document.getElementById("sensitivitySlider");
    const sensitivityValue = document.getElementById("sensitivityValue");
    const fovSlider = document.getElementById("fovSlider");
    const fovValue = document.getElementById("fovValue");
    const settingsPanel = document.getElementById("settingsPanel");
    const openSettings = document.getElementById("openSettings");
    const closeSettings = document.getElementById("closeSettings");

    // Load saved settings
    const savedSensitivity = localStorage.getItem('mouseSensitivity');
    if (savedSensitivity) {
        mouseSensitivity = parseFloat(savedSensitivity);
        sensitivitySlider.value = mouseSensitivity;
        sensitivityValue.textContent = mouseSensitivity.toFixed(1);
        camera.angularSensibility = 8000 / mouseSensitivity;
    }

    const savedFov = localStorage.getItem('fov');
    if (savedFov) {
        camera.fov = parseFloat(savedFov) * (Math.PI / 180);
        fovSlider.value = savedFov;
        fovValue.textContent = savedFov;
    }

    // Update sensitivity
    sensitivitySlider.addEventListener('input', function () {
        mouseSensitivity = parseFloat(this.value);
        sensitivityValue.textContent = mouseSensitivity.toFixed(1);
        camera.angularSensibility = 8000 / mouseSensitivity;
        localStorage.setItem('mouseSensitivity', mouseSensitivity);
    });

    // Update FOV
    fovSlider.addEventListener('input', function () {
        const fov = parseInt(this.value);
        fovValue.textContent = fov;
        camera.fov = fov * (Math.PI / 180);
        localStorage.setItem('fov', fov);
    });

    // Toggle settings panel
    openSettings.addEventListener('click', function () {
        settingsPanel.style.display = 'block';
    });

    closeSettings.addEventListener('click', function () {
        settingsPanel.style.display = 'none';
    });
}

function setupControls() {
    const canvas = document.getElementById("renderCanvas");

    // Movement keys
    camera.keysUp = [87];    // W
    camera.keysDown = [83];  // S
    camera.keysLeft = [65];  // A
    camera.keysRight = [68]; // D

    // Movement detection for weapon bobbing
    const keys = {};
    window.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
        checkMovement();
    });

    window.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
        checkMovement();
    });

    function checkMovement() {
        const now = Date.now();
        const wasMoving = isMoving;
        isMoving = keys['w'] || keys['a'] || keys['s'] || keys['d'];
        isSprinting = keys['shift'] && (keys['w'] || keys['a'] || keys['s'] || keys['d']);

        if (isMoving && !wasMoving) {
            lastMovementTime = now;
        }
    }

    // Jump with spacebar
    window.addEventListener("keydown", (evt) => {
        if (evt.code === "Space" && canJump && !isGameOver) {
            camera.cameraDirection.y = 0.5; // Apply jump impulse
            canJump = false;

            // Play jump sound if available

            setTimeout(() => { canJump = true; }, 1000); // Prevent double jump
        }

        // Weapon switching
        if (evt.key === "1") switchWeapon('pistol');
        if (evt.key === "2") switchWeapon('rifle');
        if (evt.key === "3") switchWeapon('launcher');

        // Grenade throw
        if (evt.key.toLowerCase() === "g") throwGrenade();

        // Settings panel
        if (evt.key === "Escape") {
            const settingsPanel = document.getElementById("settingsPanel");
            settingsPanel.style.display = settingsPanel.style.display === 'block' ? 'none' : 'block';
        }
    });

    // Pointer lock
    canvas.onclick = function () {
        if (!isGameOver) {
            canvas.requestPointerLock();
        }
    };

    // Shooting
    canvas.addEventListener("click", () => {
        if (!isGameOver && document.pointerLockElement === canvas) {
            shoot();
        }
    });
}

function showHitEffect(damage) {
    const hitEffect = document.getElementById("hitEffect");
    hitEffect.style.display = "block";

    // Show damage number if we hit someone else
    if (damage > 0) {
        const damageText = document.createElement("div");
        damageText.style.position = "absolute";
        damageText.style.top = "50%";
        damageText.style.left = "50%";
        damageText.style.transform = "translate(-50%, -50%)";
        damageText.style.color = "white";
        damageText.style.fontSize = "48px";
        damageText.style.textShadow = "2px 2px 4px black";
        damageText.textContent = `-${damage}`;
        document.body.appendChild(damageText);

        // Animate and remove
        setTimeout(() => {
            damageText.style.opacity = "0";
            damageText.style.transform = "translate(-50%, -100%)";
            setTimeout(() => {
                document.body.removeChild(damageText);
            }, 1000);
        }, 100);
    }

    // Play hit sound
    if (hitSound) {
        hitSound.play();
    }

    setTimeout(() => {
        hitEffect.style.display = "none";
    }, 200);
}


function updatePlayerHealthBar(id) {
    if (players[id] && players[id].healthBarMat) {
        const health = players[id].health;
        const healthColor = new BABYLON.Color3(
            (100 - health) / 100,
            health / 100,
            0
        );
        players[id].healthBarMat.emissiveColor = healthColor;
    }
}

function updateHealthBar() {
    const healthFill = document.getElementById("healthFill");
    const health = myPlayer.health;
    healthFill.style.width = `${health}%`;
    healthFill.style.backgroundColor = `rgb(${255 - health * 2.55}, ${health * 2.55}, 0)`;
}

function gameOver(won) {
    isGameOver = true;
    const gameOverDiv = document.getElementById("gameOver");
    gameOverDiv.innerHTML = won ?
        "<h1>VICTORY!</h1><p>You defeated all opponents!</p>" :
        "<h1>GAME OVER</h1><p>You were eliminated!</p>";
    gameOverDiv.style.display = "block";

    // Add restart button
    const restartBtn = document.createElement("button");
    restartBtn.id = "restartBtn";
    restartBtn.textContent = "Respawn";
    restartBtn.onclick = function () {
        socket.emit('respawn');
    };
    gameOverDiv.appendChild(restartBtn);
}

function createBullet(bulletData) {
    const bullet = BABYLON.MeshBuilder.CreateSphere(`bullet_${bulletData.id}`, {
        diameter: 0.1,
        segments: 8
    }, scene);

    bullet.position = new BABYLON.Vector3(
        bulletData.x,
        bulletData.y,
        bulletData.z
    );

    bullet.direction = new BABYLON.Vector3(
        bulletData.dx,
        bulletData.dy,
        bulletData.dz
    ).normalize();

    bullet.speed = bulletData.speed;
    bullet.playerId = bulletData.playerId;
    bullet.id = bulletData.id;

    // Color bullet based on player color
    const bulletMat = new BABYLON.StandardMaterial(`bulletMat_${bulletData.id}`, scene);
    if (players[bulletData.playerId]) {
        const color = new BABYLON.Color3(
            (players[bulletData.playerId].color >> 16 & 255) / 255,
            (players[bulletData.playerId].color >> 8 & 255) / 255,
            (players[bulletData.playerId].color & 255) / 255
        );
        bulletMat.emissiveColor = color;
    } else {
        bulletMat.emissiveColor = BABYLON.Color3.White();
    }
    bullet.material = bulletMat;

    // Bullet movement and collision
    const bulletCheck = function () {
        if (bullet && !isGameOver) {
            // Move bullet
            bullet.position.addInPlace(bullet.direction.scale(bullet.speed));

            // Check for collisions with players
            for (const id in players) {
                if (id !== bullet.playerId && players[id].mesh && players[id].health > 0) {
                    if (bullet.intersectsMesh(players[id].mesh, false)) {
                        // Hit detected!
                        socket.emit('hit', {
                            playerId: id,
                            bulletId: bullet.id,
                            damage: bulletData.damage
                        });
                        return;
                    }
                }
            }

            // Check for out of bounds
            if (Math.abs(bullet.position.x) > 50 || Math.abs(bullet.position.z) > 50) {
                socket.emit('bulletRemoved', bullet.id);
                return;
            }

            // Check for collision with walls
            const bulletRay = new BABYLON.Ray(
                bullet.position,
                bullet.direction,
                0.2
            );

            const hit = scene.pickWithRay(bulletRay, (mesh) => {
                return mesh.checkCollisions &&
                    !mesh.name.includes("player") &&
                    !mesh.name.includes("bullet");
            });

            if (hit && hit.pickedMesh) {
                // Create bullet impact effect
                createBulletImpact(bullet.position, bullet.direction);
                socket.emit('bulletRemoved', bullet.id);
                return;
            }

            // Continue checking
            requestAnimationFrame(bulletCheck);
        }
    };

    bulletCheck();

    // Store reference
    bullets[bulletData.id].mesh = bullet;
}

function createBulletImpact(position, direction) {
    // Create decal at impact point
    const decalSize = new BABYLON.Vector3(0.1, 0.1, 0.1);
    const decal = BABYLON.MeshBuilder.CreateDecal("bulletImpact", scene.meshes.find(m => m.name === "floor"), {
        position: position,
        normal: direction,
        size: decalSize
    });

    // Create impact particle effect
    const particles = new BABYLON.ParticleSystem("impactParticles", 100, scene);
    particles.particleTexture = new BABYLON.Texture("data:image/png;base64,...", scene);
    particles.emitter = position;
    particles.minEmitBox = new BABYLON.Vector3(0, 0, 0);
    particles.maxEmitBox = new BABYLON.Vector3(0, 0, 0);

    particles.color1 = new BABYLON.Color4(0.7, 0.7, 0.7, 1);
    particles.color2 = new BABYLON.Color4(0.3, 0.3, 0.3, 1);
    particles.colorDead = new BABYLON.Color4(0, 0, 0, 0);

    particles.minSize = 0.05;
    particles.maxSize = 0.1;
    particles.minLifeTime = 0.1;
    particles.maxLifeTime = 0.3;
    particles.emitRate = 100;
    particles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
    particles.direction1 = new BABYLON.Vector3(-1, -1, -1);
    particles.direction2 = new BABYLON.Vector3(1, 1, 1);
    particles.minEmitPower = 0.5;
    particles.maxEmitPower = 1;

    particles.start();
    particles.targetStopDuration = 0.2;

    // Remove decal after some time
    setTimeout(() => {
        decal.dispose();
    }, 5000);
}
function createSounds() {
    // Create audio context if not exists
    if (!BABYLON.Engine.audioEngine) {
        BABYLON.Engine.audioEngine = new BABYLON.AudioEngine();
    }

    // Gunshot sound
    gunshotSound = new BABYLON.Sound("gunshot", "assets/gunshot.wav", scene, null, {
        playbackRate: 1,
        volume: 0.5
    });

    // Explosion sound
    explosionSound = new BABYLON.Sound("explosion", "assets/explosion.wav", scene, null, {
        playbackRate: 1,
        volume: 0.7,
        spatialSound: true
    });

    // Hit sound
    hitSound = new BABYLON.Sound("hit", "assets/hit.wav", scene, null, {
        playbackRate: 1,
        volume: 0.3
    });

    // Reload sound
    reloadSound = new BABYLON.Sound("reload", "assets/reload.wav", scene, null, {
        playbackRate: 1,
        volume: 0.4
    });
}