const weapons = {
    pistol: { damage: 20, speed: 0.8, fireRate: 500, ammo: Infinity, model: null, recoil: 0.05 },
    rifle: { damage: 15, speed: 1.0, fireRate: 100, ammo: 30, model: null, recoil: 0.08 },
    launcher: { damage: 50, speed: 0.5, fireRate: 2000, ammo: 5, explosionRadius: 5, model: null, recoil: 0.15 }
};

async function createWeapons() {
    // Create materials
    const metalMaterial = new BABYLON.StandardMaterial("metalMaterial", scene);
    metalMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    metalMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    metalMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);

    const plasticMaterial = new BABYLON.StandardMaterial("plasticMaterial", scene);
    plasticMaterial.diffuseColor = new BABYLON.Color3(0.15, 0.15, 0.15);
    plasticMaterial.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);

    const woodMaterial = new BABYLON.StandardMaterial("woodMaterial", scene);
    woodMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.3, 0.2);
    woodMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

    // Create pistol
    const pistolBarrel = BABYLON.MeshBuilder.CreateCylinder("pistolBarrel", {
        diameter: 0.08,
        height: 0.4,
        tessellation: 6
    }, scene);
    pistolBarrel.rotation.x = Math.PI / 2;

    const pistolBody = BABYLON.MeshBuilder.CreateBox("pistolBody", {
        width: 0.15,
        height: 0.05,
        depth: 0.3
    }, scene);

    const pistolGrip = BABYLON.MeshBuilder.CreateBox("pistolGrip", {
        width: 0.12,
        height: 0.15,
        depth: 0.1
    }, scene);
    pistolGrip.rotation.z = -0.3;

    const pistolSlide = BABYLON.MeshBuilder.CreateBox("pistolSlide", {
        width: 0.13,
        height: 0.06,
        depth: 0.35
    }, scene);

    // Position parts
    pistolBarrel.position = new BABYLON.Vector3(0, 0, 0.2);
    pistolBody.position = new BABYLON.Vector3(0, 0, 0);
    pistolGrip.position = new BABYLON.Vector3(0, -0.1, -0.05);
    pistolSlide.position = new BABYLON.Vector3(0, 0.02, 0.1);

    // Apply materials
    pistolBarrel.material = metalMaterial;
    pistolBody.material = metalMaterial;
    pistolGrip.material = woodMaterial;
    pistolSlide.material = metalMaterial;

    // Combine into weapon
    weapons.pistol.model = BABYLON.Mesh.MergeMeshes(
        [pistolBarrel, pistolBody, pistolGrip, pistolSlide],
        true,
        false,
        null,
        false,
        true
    );

    weapons.pistol.model.parent = camera;
    weapons.pistol.model.position = new BABYLON.Vector3(0.4, -0.2, 1);
    weapons.pistol.model.rotation = new BABYLON.Vector3(0, 0, 0);

    // Create rifle
    const rifleBarrel = BABYLON.MeshBuilder.CreateCylinder("rifleBarrel", {
        diameter: 0.06,
        height: 0.8,
        tessellation: 6
    }, scene);
    rifleBarrel.rotation.x = Math.PI / 2;

    const rifleBody = BABYLON.MeshBuilder.CreateBox("rifleBody", {
        width: 0.2,
        height: 0.1,
        depth: 0.7
    }, scene);

    const rifleStock = BABYLON.MeshBuilder.CreateBox("rifleStock", {
        width: 0.15,
        height: 0.08,
        depth: 0.3
    }, scene);

    const rifleMagazine = BABYLON.MeshBuilder.CreateBox("rifleMagazine", {
        width: 0.15,
        height: 0.2,
        depth: 0.1
    }, scene);

    const rifleScope = BABYLON.MeshBuilder.CreateCylinder("rifleScope", {
        diameter: 0.05,
        height: 0.15,
        tessellation: 6
    }, scene);
    rifleScope.rotation.x = Math.PI / 2;

    // Position parts
    rifleBarrel.position = new BABYLON.Vector3(0, 0, 0.35);
    rifleBody.position = new BABYLON.Vector3(0, 0, 0);
    rifleStock.position = new BABYLON.Vector3(0, 0, -0.35);
    rifleMagazine.position = new BABYLON.Vector3(0, -0.15, 0.1);
    rifleScope.position = new BABYLON.Vector3(0, 0.1, 0.2);

    // Apply materials
    rifleBarrel.material = metalMaterial;
    rifleBody.material = metalMaterial;
    rifleStock.material = woodMaterial;
    rifleMagazine.material = plasticMaterial;
    rifleScope.material = metalMaterial;

    // Combine into weapon
    weapons.rifle.model = BABYLON.Mesh.MergeMeshes(
        [rifleBarrel, rifleBody, rifleStock, rifleMagazine, rifleScope],
        true,
        false,
        null,
        false,
        true
    );

    weapons.rifle.model.parent = camera;
    weapons.rifle.model.position = new BABYLON.Vector3(0.5, -0.25, 1.2);
    weapons.rifle.model.rotation = new BABYLON.Vector3(0, 0, 0);
    weapons.rifle.model.setEnabled(false);

    // Create launcher
    const launcherBarrel = BABYLON.MeshBuilder.CreateCylinder("launcherBarrel", {
        diameter: 0.12,
        height: 0.4,
        tessellation: 8
    }, scene);
    launcherBarrel.rotation.x = Math.PI / 2;

    const launcherBody = BABYLON.MeshBuilder.CreateBox("launcherBody", {
        width: 0.25,
        height: 0.15,
        depth: 0.6
    }, scene);

    const launcherGrip = BABYLON.MeshBuilder.CreateBox("launcherGrip", {
        width: 0.1,
        height: 0.2,
        depth: 0.08
    }, scene);
    launcherGrip.rotation.z = -0.2;

    const launcherTrigger = BABYLON.MeshBuilder.CreateBox("launcherTrigger", {
        width: 0.05,
        height: 0.08,
        depth: 0.05
    }, scene);

    // Position parts
    launcherBarrel.position = new BABYLON.Vector3(0, 0, 0.2);
    launcherBody.position = new BABYLON.Vector3(0, 0, 0);
    launcherGrip.position = new BABYLON.Vector3(0, -0.15, -0.1);
    launcherTrigger.position = new BABYLON.Vector3(0.1, -0.05, 0);

    // Apply materials
    launcherBarrel.material = metalMaterial;
    launcherBody.material = metalMaterial;
    launcherGrip.material = plasticMaterial;
    launcherTrigger.material = plasticMaterial;

    // Combine into weapon
    weapons.launcher.model = BABYLON.Mesh.MergeMeshes(
        [launcherBarrel, launcherBody, launcherGrip, launcherTrigger],
        true,
        false,
        null,
        false,
        true
    );

    weapons.launcher.model.parent = camera;
    weapons.launcher.model.position = new BABYLON.Vector3(0.6, -0.3, 1.5);
    weapons.launcher.model.rotation = new BABYLON.Vector3(0, 0, 0);
    weapons.launcher.model.setEnabled(false);
}

function switchWeapon(weaponType) {
    if (weapons[weaponType] && weapons[weaponType].model) {
        // Hide all weapons first
        for (const weapon in weapons) {
            if (weapons[weapon].model) {
                weapons[weapon].model.setEnabled(false);
            }
        }

        // Show current weapon
        weapons[weaponType].model.setEnabled(true);
        currentWeapon = weaponType;

        // Update UI
        document.getElementById("currentWeapon").textContent =
            weaponType.charAt(0).toUpperCase() + weaponType.slice(1);
        document.getElementById("ammoCount").textContent =
            weapons[weaponType].ammo === Infinity ? "∞" : weapons[weaponType].ammo;

        // Animate weapon switch
        const weapon = weapons[weaponType].model;
        const originalZ = weapon.position.z;

        BABYLON.Animation.CreateAndStartAnimation(
            'weaponSwitch',
            weapon,
            'position.z',
            30,
            10,
            originalZ,
            originalZ + 0.5,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
            null,
            () => {
                BABYLON.Animation.CreateAndStartAnimation(
                    'weaponSwitchBack',
                    weapon,
                    'position.z',
                    30,
                    10,
                    originalZ + 0.5,
                    originalZ,
                    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
                );
            }
        );
    }
}

function shoot() {
    const now = Date.now();
    if (now - lastShotTime < weapons[currentWeapon].fireRate) return;

    if (weapons[currentWeapon].ammo <= 0) {
        // Play empty click sound
        return;
    }

    if (weapons[currentWeapon].ammo !== Infinity) {
        weapons[currentWeapon].ammo--;
        document.getElementById("ammoCount").textContent = weapons[currentWeapon].ammo;
    }

    lastShotTime = now;

    // Muzzle flash
    createMuzzleFlash();

    // Recoil animation
    const weapon = weapons[currentWeapon].model;
    const recoilAmount = weapons[currentWeapon].recoil;

    // Weapon kickback
    weapon.position.z += 0.1;
    setTimeout(() => {
        weapon.position.z -= 0.1;
    }, 100);

    // Weapon tilt
    weapon.rotation.x += recoilAmount;
    setTimeout(() => {
        weapon.rotation.x -= recoilAmount;
    }, 100);

    // Camera recoil
    camera.rotation.x += recoilAmount * 0.5;
    setTimeout(() => {
        camera.rotation.x -= recoilAmount * 0.5;
    }, 100);

    // Play gunshot sound
    if (gunshotSound) {
        gunshotSound.play();
    }

    const forward = camera.getForwardRay().direction.normalize();

    const bulletData = {
        x: camera.position.x + forward.x * 0.5,
        y: camera.position.y + forward.y * 0.5,
        z: camera.position.z + forward.z * 0.5,
        dx: forward.x,
        dy: forward.y,
        dz: forward.z,
        speed: weapons[currentWeapon].speed,
        damage: weapons[currentWeapon].damage,
        weaponType: currentWeapon
    };

    socket.emit('shoot', bulletData);
}

function createMuzzleFlash() {
    const flash = BABYLON.MeshBuilder.CreateSphere("muzzleFlash", {
        diameter: 0.1,
        segments: 8
    }, scene);

    const weapon = weapons[currentWeapon].model;
    flash.position = new BABYLON.Vector3(
        weapon.absolutePosition.x + weapon.getDirection(BABYLON.Vector3.Forward()).x * 0.5,
        weapon.absolutePosition.y + weapon.getDirection(BABYLON.Vector3.Forward()).y * 0.5,
        weapon.absolutePosition.z + weapon.getDirection(BABYLON.Vector3.Forward()).z * 0.5
    );

    const flashMat = new BABYLON.StandardMaterial("flashMat", scene);
    flashMat.emissiveColor = new BABYLON.Color3(1, 0.8, 0);
    flashMat.disableLighting = true;
    flash.material = flashMat;

    // Create particle system for muzzle flash
    const particleSystem = new BABYLON.ParticleSystem("muzzleParticles", 200, scene);
    particleSystem.particleTexture = new BABYLON.Texture("data:image/png;base64,...", scene); // Use a white dot texture
    particleSystem.emitter = flash.position;
    particleSystem.minEmitBox = new BABYLON.Vector3(0, 0, 0);
    particleSystem.maxEmitBox = new BABYLON.Vector3(0, 0, 0);

    particleSystem.color1 = new BABYLON.Color4(1, 0.9, 0.1, 1);
    particleSystem.color2 = new BABYLON.Color4(1, 0.5, 0, 1);
    particleSystem.colorDead = new BABYLON.Color4(1, 0, 0, 0);

    particleSystem.minSize = 0.05;
    particleSystem.maxSize = 0.1;

    particleSystem.minLifeTime = 0.05;
    particleSystem.maxLifeTime = 0.1;

    particleSystem.emitRate = 5000;
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;

    const direction = weapon.getDirection(BABYLON.Vector3.Forward());
    particleSystem.direction1 = new BABYLON.Vector3(
        direction.x * 2 - 0.5,
        direction.y * 2 - 0.5,
        direction.z * 2 - 0.5
    );
    particleSystem.direction2 = new BABYLON.Vector3(
        direction.x * 2 + 0.5,
        direction.y * 2 + 0.5,
        direction.z * 2 + 0.5
    );

    particleSystem.minEmitPower = 1;
    particleSystem.maxEmitPower = 3;
    particleSystem.updateSpeed = 0.01;

    particleSystem.start();
    particleSystem.targetStopDuration = 0.1;

    // Animate and dispose flash
    BABYLON.Animation.CreateAndStartAnimation(
        'muzzleFlash',
        flash,
        'scaling',
        60,
        5,
        new BABYLON.Vector3(1, 1, 1),
        new BABYLON.Vector3(0, 0, 0),
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
        null,
        () => {
            flash.dispose();
            particleSystem.dispose();
        }
    );
}

function throwGrenade() {
    if (isGameOver) return;

    const forward = camera.getForwardRay().direction.normalize();
    const grenadeData = {
        x: camera.position.x,
        y: camera.position.y - 0.5,
        z: camera.position.z,
        dx: forward.x * 0.8,
        dy: forward.y * 0.8 + 0.2,
        dz: forward.z * 0.8
    };

    socket.emit('throwGrenade', grenadeData);

}