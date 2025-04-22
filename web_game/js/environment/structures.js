function createFloor(scene, material) {
    const floorSize = 60;
    const floor = BABYLON.MeshBuilder.CreateGround("floor", {
      width: floorSize,
      height: floorSize,
      subdivisions: 20
    }, scene);
    floor.material = material;
    floor.checkCollisions = true;
    floor.receiveShadows = true;
    return floor;
  }
  
  function createOuterWalls(scene, material, metalMaterial, floorSize = 60) {
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
    outerWalls[0].position = new BABYLON.Vector3(0, outerWallHeight/2, floorSize/2);
    outerWalls[1].position = new BABYLON.Vector3(0, outerWallHeight/2, -floorSize/2);
    outerWalls[2].position = new BABYLON.Vector3(floorSize/2, outerWallHeight/2, 0);
    outerWalls[3].position = new BABYLON.Vector3(-floorSize/2, outerWallHeight/2, 0);
  
    // Apply materials and collisions to outer walls
    outerWalls.forEach(wall => {
      wall.material = material;
      wall.checkCollisions = true;
      wall.receiveShadows = true;
      
      // Add decorative trim along the wall base
      const baseTrim = BABYLON.MeshBuilder.CreateBox("baseTrim_" + wall.name, {
        width: wall.scaling.x * wall.getBoundingInfo().boundingBox.extendSize.x * 2,
        height: 0.5,
        depth: wall.scaling.z * wall.getBoundingInfo().boundingBox.extendSize.z * 2.2
      }, scene);
      
      baseTrim.position = new BABYLON.Vector3(
        wall.position.x,
        0.25,
        wall.position.z
      );
      
      baseTrim.material = metalMaterial;
      baseTrim.checkCollisions = true;
    });
  
    return outerWalls;
  }
  
  function createCeiling(scene, material, floorSize = 60, outerWallHeight = 10) {
    const ceiling = BABYLON.MeshBuilder.CreateGround("ceiling", {
      width: floorSize,
      height: floorSize,
      subdivisions: 1
    }, scene);
    ceiling.position.y = outerWallHeight;
    ceiling.rotation = new BABYLON.Vector3(Math.PI, 0, 0);
    ceiling.material = material;
    ceiling.checkCollisions = true;
    ceiling.receiveShadows = true;
    return ceiling;
  }
  
  function createInteriorWalls(scene, wallMaterial, damagedMaterial, metalMaterial) {
    const wallHeight = 8; // Taller walls for more grandiose feel
    const wallThickness = 0.3;

    // Create a more realistic museum layout with gallery spaces
    const wallLayout = [
        // Main gallery hallway
        { x: 0, z: 0, width: 30, rotation: 0, damaged: false },
        
        // Side galleries
        { x: -15, z: 10, width: 20, rotation: 0, damaged: false },
        { x: -15, z: -10, width: 20, rotation: 0, damaged: true },
        { x: 15, z: 10, width: 20, rotation: 0, damaged: false },
        { x: 15, z: -10, width: 20, rotation: 0, damaged: true },
        
        // Gallery dividers
        { x: -25, z: 0, width: 20, rotation: Math.PI/2, damaged: false },
        { x: -5, z: 0, width: 20, rotation: Math.PI/2, damaged: false },
        { x: 5, z: 0, width: 20, rotation: Math.PI/2, damaged: false },
        { x: 25, z: 0, width: 20, rotation: Math.PI/2, damaged: true },
        
        // Small exhibition rooms
        { x: -15, z: 20, width: 10, rotation: Math.PI/2, damaged: false },
        { x: -25, z: 15, width: 10, rotation: 0, damaged: true },
        { x: -5, z: 15, width: 10, rotation: 0, damaged: false },
        { x: 15, z: 20, width: 10, rotation: Math.PI/2, damaged: false },
        { x: 5, z: 15, width: 10, rotation: 0, damaged: false },
        { x: 25, z: 15, width: 10, rotation: 0, damaged: true }
    ];

    wallLayout.forEach((wall, index) => {
        const wallMesh = BABYLON.MeshBuilder.CreateBox(`wall_${index}`, {
            width: wall.width,
            height: wallHeight,
            depth: wallThickness
        }, scene);

        wallMesh.position = new BABYLON.Vector3(wall.x, wallHeight/2, wall.z);
        wallMesh.rotation.y = wall.rotation;
        wallMesh.material = wall.damaged ? damagedMaterial : wallMaterial;
        wallMesh.checkCollisions = true;
        wallMesh.receiveShadows = true;

        // Add decorative elements to walls that aren't damaged
        if (!wall.damaged) {
            // Add chair rail molding
            const chairRail = BABYLON.MeshBuilder.CreateBox(`chairRail_${index}`, {
                width: wallMesh.scaling.x * wallMesh.getBoundingInfo().boundingBox.extendSize.x * 2,
                height: 0.2,
                depth: wallMesh.scaling.z * wallMesh.getBoundingInfo().boundingBox.extendSize.z * 2.2
            }, scene);
            
            chairRail.position = new BABYLON.Vector3(
                wallMesh.position.x,
                2.5, // Height of chair rail
                wallMesh.position.z
            );
            chairRail.rotation.y = wall.rotation;
            chairRail.material = metalMaterial;
            
            // Add crown molding
            const crownMolding = BABYLON.MeshBuilder.CreateBox(`crownMolding_${index}`, {
                width: wallMesh.scaling.x * wallMesh.getBoundingInfo().boundingBox.extendSize.x * 2,
                height: 0.3,
                depth: wallMesh.scaling.z * wallMesh.getBoundingInfo().boundingBox.extendSize.z * 2.2
            }, scene);
            
            crownMolding.position = new BABYLON.Vector3(
                wallMesh.position.x,
                wallHeight - 0.15, // Near top of wall
                wallMesh.position.z
            );
            crownMolding.rotation.y = wall.rotation;
            crownMolding.material = metalMaterial;
        }

        // Add some variation to damaged walls (with CSG error handling)
        if (wall.damaged) {
            try {
                createWallDamage(wallMesh, scene);
            } catch (e) {
                console.warn("Couldn't create wall damage:", e);
                // Fallback to just applying damaged material
                wallMesh.material = damagedMaterial;
            }
        }

        // Add doorways to certain walls
        if (index % 3 === 0 || index % 5 === 0) {
            try {
                createDoorway(wallMesh, scene, wallMaterial);
            } catch (e) {
                console.warn("Couldn't create doorway:", e);
            }
        }
    });
  }
  
  function createCeilingDetail(scene, ceiling, height) {
    // Create ceiling tile pattern
    const ceilingGridMaterial = new BABYLON.StandardMaterial("ceilingGridMaterial", scene);
    ceilingGridMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.9);
    ceilingGridMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    
    // Create ceiling grid
    const gridSize = 2;
    const ceilingSize = ceiling.getBoundingInfo().boundingBox.extendSize.x * 2;
    const numTiles = Math.floor(ceilingSize / gridSize);
    
    // Create grid lines
    for (let i = 0; i <= numTiles; i++) {
        // X direction grid lines
        const xGridLine = BABYLON.MeshBuilder.CreateBox(`xGridLine_${i}`, {
        width: 0.1,
        height: 0.1,
        depth: ceilingSize
        }, scene);
        
        xGridLine.position = new BABYLON.Vector3(
        -ceilingSize/2 + i * gridSize,
        height - 0.05,
        0
        );
        xGridLine.material = ceilingGridMaterial;
        
        // Z direction grid lines
        const zGridLine = BABYLON.MeshBuilder.CreateBox(`zGridLine_${i}`, {
        width: ceilingSize,
        height: 0.1,
        depth: 0.1
        }, scene);
        
        zGridLine.position = new BABYLON.Vector3(
        0,
        height - 0.05,
        -ceilingSize/2 + i * gridSize
        );
        zGridLine.material = ceilingGridMaterial;
    }
  }
  
  function createDoorway(wall, scene, material) {
    const doorwayWidth = 2.2;
    const doorwayHeight = 4; // Taller, more elegant museum doorways
    
    // Create doorway shape with archway
    const doorwayBase = BABYLON.MeshBuilder.CreateBox(`doorwayBase_${wall.name}`, {
        width: doorwayWidth,
        height: doorwayHeight - 0.5, // Subtract arch height
        depth: wall.getBoundingInfo().boundingBox.extendSize.z * 2.2
    }, scene);
    
    // Add arch top
    const doorwayArch = BABYLON.MeshBuilder.CreateCylinder(`doorwayArch_${wall.name}`, {
        height: wall.getBoundingInfo().boundingBox.extendSize.z * 2.2,
        diameter: doorwayWidth,
        arc: 0.5, // Half cylinder
        tessellation: 16
    }, scene);
    
    // Position base
    doorwayBase.position = new BABYLON.Vector3(
        (Math.random() - 0.5) * wall.getBoundingInfo().boundingBox.extendSize.x,
        (doorwayHeight - 0.5) / 2, // Centered on the base height
        0
    );
    doorwayBase.parent = wall;
    
    // Position arch
    doorwayArch.position = new BABYLON.Vector3(
        doorwayBase.position.x,
        doorwayHeight - 0.25, // Top of doorway
        doorwayBase.position.z
    );
    doorwayArch.rotation = new BABYLON.Vector3(
        Math.PI/2, // Rotate to horizontal position
        0,
        Math.PI // Orient arch downward
    );
    doorwayArch.parent = wall;
    
    // Ensure all meshes have geometry
    if (!wall.geometry) wall.convertToFlatShadedMesh();
    doorwayBase.convertToFlatShadedMesh();
    doorwayArch.convertToFlatShadedMesh();
    
    try {
        // Use CSG to create the doorway
        const wallCSG = BABYLON.CSG.FromMesh(wall);
        const doorwayBaseCSG = BABYLON.CSG.FromMesh(doorwayBase);
        const doorwayArchCSG = BABYLON.CSG.FromMesh(doorwayArch);
        
        // Combine base and arch, then subtract from wall
        const doorwayCSG = doorwayBaseCSG.union(doorwayArchCSG);
        const result = wallCSG.subtract(doorwayCSG);
        
        // Replace the original wall
        wall.dispose();
        doorwayBase.dispose();
        doorwayArch.dispose();
        
        const newWall = result.toMesh(
            wall.name + "_with_doorway", 
            material, 
            scene,
            true // updatable
        );
        newWall.checkCollisions = true;
        newWall.receiveShadows = true;
        
        return newWall;
    } catch (e) {
        console.error("Failed to create doorway:", e);
        doorwayBase.dispose();
        doorwayArch.dispose();
        throw e; // Re-throw to handle in calling function
    }
  }