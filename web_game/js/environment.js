function createMuseum(scene) {
    // Create materials with more detail
    const floorMaterial = new BABYLON.StandardMaterial("floorMaterial", scene);
    floorMaterial.diffuseColor = new BABYLON.Color3(0.25, 0.24, 0.26);
    floorMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    floorMaterial.bumpTexture = new BABYLON.Texture("data:image/png;base64,...", scene); // Add bump texture

    const wallMaterial = new BABYLON.StandardMaterial("wallMaterial", scene);
    wallMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.9);
    wallMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    wallMaterial.bumpTexture = new BABYLON.Texture("data:image/png;base64,...", scene);

    // Create main floor (larger for more space)
    const floorSize = 100;
    const floor = BABYLON.MeshBuilder.CreateGround("floor", {
        width: floorSize,
        height: floorSize,
        subdivisions: 20
    }, scene);
    floor.material = floorMaterial;
    floor.checkCollisions = true;
    floor.receiveShadows = true;

    // Create outer walls
    const outerWallHeight = 10;
    const outerWallThickness = 0.5;
    const outerWalls = [
        // North wall
        BABYLON.MeshBuilder.CreateBox("northWall", {
            width: floorSize,
            height: outerWallHeight,
            depth: outerWallThickness
        }, scene),
        // South wall
        BABYLON.MeshBuilder.CreateBox("southWall", {
            width: floorSize,
            height: outerWallHeight,
            depth: outerWallThickness
        }, scene),
        // East wall
        BABYLON.MeshBuilder.CreateBox("eastWall", {
            width: outerWallThickness,
            height: outerWallHeight,
            depth: floorSize
        }, scene),
        // West wall
        BABYLON.MeshBuilder.CreateBox("westWall", {
            width: outerWallThickness,
            height: outerWallHeight,
            depth: floorSize
        }, scene)
    ];

    // Position the outer walls
    outerWalls[0].position = new BABYLON.Vector3(0, outerWallHeight / 2, floorSize / 2);
    outerWalls[1].position = new BABYLON.Vector3(0, outerWallHeight / 2, -floorSize / 2);
    outerWalls[2].position = new BABYLON.Vector3(floorSize / 2, outerWallHeight / 2, 0);
    outerWalls[3].position = new BABYLON.Vector3(-floorSize / 2, outerWallHeight / 2, 0);

    // Apply materials and collisions to outer walls
    outerWalls.forEach(wall => {
        wall.material = wallMaterial;
        wall.checkCollisions = true;
        wall.receiveShadows = true;
    });

    // Create interior walls with more detail
    createInteriorWalls(scene, wallMaterial);

    // Create ceiling
    const ceiling = BABYLON.MeshBuilder.CreateGround("ceiling", {
        width: floorSize,
        height: floorSize,
        subdivisions: 1
    }, scene);
    ceiling.position.y = outerWallHeight;
    ceiling.rotation = new BABYLON.Vector3(Math.PI, 0, 0);
    ceiling.material = wallMaterial;
    ceiling.checkCollisions = true;
    ceiling.receiveShadows = true;

    // Add decorative elements
    createMuseumDecorations(scene);

    // Add lighting
    createLighting(scene);
}

function createInteriorWalls(scene, wallMaterial) {
    const wallHeight = 5;
    const wallThickness = 0.3;

    // Create a maze-like layout
    const wallLayout = [
        // Main hallway
        { x: 0, z: 0, width: 60, rotation: 0 },
        { x: 0, z: 0, width: 60, rotation: Math.PI / 2 },

        // Rooms and dividers
        { x: -20, z: 20, width: 20, rotation: 0 },
        { x: -30, z: 10, width: 20, rotation: Math.PI / 2 },
        { x: 20, z: -15, width: 30, rotation: 0 },
        { x: 15, z: -25, width: 20, rotation: Math.PI / 2 }
    ];

    wallLayout.forEach((wall, index) => {
        const wallMesh = BABYLON.MeshBuilder.CreateBox(`wall_${index}`, {
            width: wall.width,
            height: wallHeight,
            depth: wallThickness
        }, scene);

        wallMesh.position = new BABYLON.Vector3(wall.x, wallHeight / 2, wall.z);
        wallMesh.rotation.y = wall.rotation;
        wallMesh.material = wallMaterial;
        wallMesh.checkCollisions = true;
        wallMesh.receiveShadows = true;

        // Add some variation
        if (index % 3 === 0) {
            createWallDamage(wallMesh, scene);
        }
    });
}


function createWallDamage(wall, scene) {
    // First ensure the wall has proper geometry
    wall.convertToFlatShadedMesh();

    // Create holes in the wall
    const holeCount = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < holeCount; i++) {
        const hole = BABYLON.MeshBuilder.CreateSphere(`hole_${wall.name}_${i}`, {
            diameter: 0.5 + Math.random(),
            segments: 8
        }, scene);

        hole.position = new BABYLON.Vector3(
            (Math.random() - 0.5) * wall.width,
            (Math.random() - 0.5) * wall.height,
            0
        );
        hole.parent = wall;
        hole.convertToFlatShadedMesh();

        try {
            // Use CSG to subtract the hole
            const wallCSG = BABYLON.CSG.FromMesh(wall);
            const holeCSG = BABYLON.CSG.FromMesh(hole);
            const damagedWall = wallCSG.subtract(holeCSG).toMesh(wall.name + "_damaged", wall.material, scene);

            // Replace the original wall with the damaged one
            wall.dispose();
            hole.dispose();
            wall = damagedWall;
        } catch (e) {
            console.error("Failed to create wall damage:", e);
            hole.dispose();
        }
    }
}

function createMuseumDecorations(scene) {
    // Create display cases
    for (let i = 0; i < 10; i++) {
        const displayCase = BABYLON.MeshBuilder.CreateBox(`displayCase_${i}`, {
            width: 3,
            height: 2,
            depth: 2
        }, scene);

        displayCase.position = new BABYLON.Vector3(
            Math.random() * 60 - 30,
            1,
            Math.random() * 60 - 30
        );

        const glassMaterial = new BABYLON.StandardMaterial("glassMaterial", scene);
        glassMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.9, 1);
        glassMaterial.alpha = 0.3;
        glassMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        displayCase.material = glassMaterial;
    }

    // Create statues
    for (let i = 0; i < 5; i++) {
        const statue = BABYLON.MeshBuilder.CreateCylinder(`statue_${i}`, {
            height: 3,
            diameterTop: 0.5,
            diameterBottom: 1,
            tessellation: 6
        }, scene);

        statue.position = new BABYLON.Vector3(
            Math.random() * 40 - 20,
            1.5,
            Math.random() * 40 - 20
        );

        const statueMaterial = new BABYLON.StandardMaterial("statueMaterial", scene);
        statueMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.7);
        statueMaterial.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
        statue.material = statueMaterial;
    }
}

function createLighting(scene) {
    // Ambient light for base illumination
    const ambientLight = new BABYLON.HemisphericLight(
        "ambientLight",
        new BABYLON.Vector3(0, 1, 0),
        scene
    );
    ambientLight.intensity = 0.3;
    ambientLight.diffuse = new BABYLON.Color3(0.5, 0.5, 0.55);

    // Directional light for main illumination
    const dirLight = new BABYLON.DirectionalLight(
        "dirLight",
        new BABYLON.Vector3(-1, -2, -1),
        scene
    );
    dirLight.intensity = 0.8;
    dirLight.diffuse = new BABYLON.Color3(0.9, 0.85, 0.8);
    dirLight.specular = new BABYLON.Color3(0.3, 0.3, 0.3);

    // Enable shadows
    dirLight.shadowEnabled = true;
    const shadowGenerator = new BABYLON.ShadowGenerator(1024, dirLight);
    shadowGenerator.usePoissonSampling = true;
    shadowGenerator.bias = 0.01;

    // Add point lights for atmospheric lighting
    for (let i = 0; i < 4; i++) {
        const pointLight = new BABYLON.PointLight(
            `pointLight_${i}`,
            new BABYLON.Vector3(
                Math.random() * 60 - 30,
                3,
                Math.random() * 60 - 30
            ),
            scene
        );
        pointLight.intensity = 0.5;
        pointLight.diffuse = new BABYLON.Color3(0.9, 0.8, 0.7);
        pointLight.specular = new BABYLON.Color3(0.2, 0.2, 0.2);
        pointLight.range = 15;

        // Add light glow
        const lightSphere = BABYLON.MeshBuilder.CreateSphere(`lightSphere_${i}`, {
            diameter: 0.5,
            segments: 8
        }, scene);
        lightSphere.position = pointLight.position;

        const lightMat = new BABYLON.StandardMaterial(`lightMat_${i}`, scene);
        lightMat.emissiveColor = new BABYLON.Color3(0.9, 0.8, 0.7);
        lightMat.disableLighting = true;
        lightSphere.material = lightMat;
    }
}