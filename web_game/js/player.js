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
            camera.cameraDirection.y = 0.5;
            canJump = false;
            setTimeout(() => { canJump = true; }, 1000);
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

function updatePlayerPosition() {
    myPlayer.x = camera.position.x;
    myPlayer.y = camera.position.y;
    myPlayer.z = camera.position.z;
    myPlayer.rotation = camera.rotation.y;

    socket.emit('move', {
        x: myPlayer.x,
        y: myPlayer.y,
        z: myPlayer.z,
        rotation: myPlayer.rotation
    });
}

function updateWeaponBob() {
    if (!weapons[currentWeapon] || !weapons[currentWeapon].model) return;

    const weapon = weapons[currentWeapon].model;
    const now = Date.now();
    const timeSinceLastMove = now - lastMovementTime;

    // Reset position when not moving
    if (!isMoving || timeSinceLastMove > 100) {
        weaponBobTime = 0;
        const targetPos = new BABYLON.Vector3(
            weapon.position.x,
            weapon.position.y,
            weapon.position.z
        );

        // Smoothly return to original position
        weapon.position.x += (targetPos.x - weapon.position.x) * 0.1;
        weapon.position.y += (targetPos.y - weapon.position.y) * 0.1;
        return;
    }

    // Calculate bobbing effect
    weaponBobTime += 0.02 * (isSprinting ? 1.5 : 1);
    const bobAmount = isSprinting ? 0.03 : 0.02;

    // Apply bobbing effect
    weaponBobOffset = Math.sin(weaponBobTime * 2) * bobAmount;
    const sideBob = Math.sin(weaponBobTime) * bobAmount * 0.5;

    // Apply to weapon position
    weapon.position.y = weapon.position.y + weaponBobOffset;
    weapon.position.x = weapon.position.x + sideBob;

    // Slight rotation for more realism
    weapon.rotation.z = sideBob * 2;
    weapon.rotation.x = -weaponBobOffset * 2;
}

function createPlayerModel(id, playerData) {
    // Create more detailed player model
    const body = BABYLON.MeshBuilder.CreateCylinder(`body_${id}`, {
        diameterTop: 0.4,
        diameterBottom: 0.6,
        height: 1.8,
        tessellation: 8
    }, scene);
    body.position = new BABYLON.Vector3(playerData.x, playerData.y, playerData.z);
    body.rotation.y = playerData.rotation;

    // Head
    const head = BABYLON.MeshBuilder.CreateSphere(`head_${id}`, {
        diameter: 0.5,
        segments: 16
    }, scene);
    head.position = new BABYLON.Vector3(0, 0.9, 0);
    head.parent = body;

    // Color the player
    const color = new BABYLON.Color3(
        (playerData.color >> 16 & 255) / 255,
        (playerData.color >> 8 & 255) / 255,
        (playerData.color & 255) / 255
    );

    const bodyMat = new BABYLON.StandardMaterial(`bodyMat_${id}`, scene);
    bodyMat.diffuseColor = color;
    bodyMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    body.material = bodyMat;

    const headMat = new BABYLON.StandardMaterial(`headMat_${id}`, scene);
    headMat.diffuseColor = new BABYLON.Color3(0.9, 0.8, 0.7);
    headMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    head.material = headMat;

    // Store reference
    players[id].mesh = body;

    // Health bar above player
    const healthBar = BABYLON.MeshBuilder.CreatePlane(`healthBar_${id}`, {
        width: 1,
        height: 0.2
    }, scene);
    healthBar.position = new BABYLON.Vector3(0, 2.2, 0);
    healthBar.parent = body;
    healthBar.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

    const healthBarMat = new BABYLON.StandardMaterial(`healthBarMat_${id}`, scene);
    healthBarMat.emissiveColor = new BABYLON.Color3(0, 1, 0);
    healthBarMat.disableLighting = true;
    healthBar.material = healthBarMat;

    // Store health bar reference
    players[id].healthBar = healthBar;
    players[id].healthBarMat = healthBarMat;

    // Update health bar appearance
    updatePlayerHealthBar(id);
}