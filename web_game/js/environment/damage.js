function createWallDamage(wall, scene) {
    // First ensure the wall has proper geometry
    if (!wall.geometry) {
        wall = wall.convertToFlatShadedMesh();
    }

    // Create holes in the wall
    const holeCount = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < holeCount; i++) {
        const hole = BABYLON.MeshBuilder.CreateSphere(`hole_${wall.name}_${i}`, {
            diameter: 0.8 + Math.random() * 1.5, // Larger holes for more dramatic damage
            segments: 16 // Higher quality
        }, scene);

        hole.position = new BABYLON.Vector3(
            (Math.random() - 0.5) * wall.scaling.x * wall.getBoundingInfo().boundingBox.extendSize.x,
            (Math.random() - 0.5) * wall.scaling.y * wall.getBoundingInfo().boundingBox.extendSize.y,
            0
        );
        hole.parent = wall;
        hole.convertToFlatShadedMesh();

        try {
            // Use CSG to subtract the hole
            const wallCSG = BABYLON.CSG.FromMesh(wall);
            const holeCSG = BABYLON.CSG.FromMesh(hole);
            const damagedWall = wallCSG.subtract(holeCSG).toMesh(
                wall.name + "_damaged", 
                wall.material, 
                scene,
                true // updatable
            );
            
            // Add cracks extending from the hole
            addCracks(damagedWall, hole.position.clone(), scene);
            
            // Replace the original wall with the damaged one
            wall.dispose();
            hole.dispose();
            wall = damagedWall;
        } catch (e) {
            console.error("Failed to create wall damage:", e);
            hole.dispose();
            throw e; // Re-throw to handle in calling function
        }
    }
  }
  
  function createBrokenCeilings(scene, height, material) {
    // First ensure physics is available
    const physicsEnabled = scene.getPhysicsEngine && scene.isPhysicsEnabled();
    
    const brokenPositions = [
        { x: -18, z: 12, size: 5 },
        { x: 14, z: -10, size: 6 },
        { x: -8, z: -15, size: 4 },
        { x: 20, z: 15, size: 5 }
    ];
    
    brokenPositions.forEach((pos, index) => {
        // Create irregular hole
        const irregularHole = createIrregularHole(pos.x, height, pos.z, pos.size, scene, material);
        
        // Add hanging elements
        createHangingElements(pos.x, height, pos.z, pos.size, scene);
        
        // Create debris pile
        createDebrisPile(pos.x, pos.z, pos.size * 0.7, scene, material);
        
        // Add falling debris
        for (let i = 0; i < 5 + Math.random() * 8; i++) {
            const debrisSize = 0.3 + Math.random() * 0.5;
            const debrisHeight = Math.random() * 4;
            
            let debris;
            const debrisType = Math.floor(Math.random() * 4);
            
            switch(debrisType) {
                case 0:
                    debris = BABYLON.MeshBuilder.CreateBox(`ceiling_debris_${index}_${i}`, {
                        width: debrisSize,
                        height: debrisSize * 0.5,
                        depth: debrisSize * 0.8
                    }, scene);
                    break;
                case 1:
                    debris = BABYLON.MeshBuilder.CreateSphere(`ceiling_debris_${index}_${i}`, {
                        diameter: debrisSize,
                        segments: 8
                    }, scene);
                    break;
                case 2:
                    debris = BABYLON.MeshBuilder.CreateCylinder(`ceiling_debris_${index}_${i}`, {
                        height: debrisSize,
                        diameter: debrisSize * 0.7,
                        tessellation: 8
                    }, scene);
                    break;
                case 3:
                    debris = BABYLON.MeshBuilder.CreatePolyhedron(`ceiling_debris_${index}_${i}`, {
                        type: Math.floor(Math.random() * 5),
                        size: debrisSize * 0.6
                    }, scene);
                    break;
            }
            
            // Position debris
            const offsetX = (Math.random() - 0.5) * pos.size * 0.8;
            const offsetZ = (Math.random() - 0.5) * pos.size * 0.8;
            
            debris.position = new BABYLON.Vector3(
                pos.x + offsetX,
                height - debrisHeight,
                pos.z + offsetZ
            );
            
            debris.rotation = new BABYLON.Vector3(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            // Create unique material
            const debrisMaterial = new BABYLON.StandardMaterial(`debris_mat_${index}_${i}`, scene);
            debrisMaterial.diffuseColor = new BABYLON.Color3(
                0.7 + Math.random() * 0.2,
                0.65 + Math.random() * 0.2,
                0.6 + Math.random() * 0.2
            );
            debris.material = debrisMaterial;
            debris.checkCollisions = true;
            
            // Add physics if available and enabled
            if (physicsEnabled) {
                try {
                    debris.physicsImpostor = new BABYLON.PhysicsImpostor(
                        debris,
                        debrisType === 0 ? BABYLON.PhysicsImpostor.BoxImpostor : 
                        debrisType === 1 ? BABYLON.PhysicsImpostor.SphereImpostor :
                        BABYLON.PhysicsImpostor.MeshImpostor,
                        { 
                            mass: debrisSize * 5, 
                            friction: 0.5, 
                            restitution: 0.3 
                        },
                        scene
                    );
                } catch (e) {
                    console.warn("Failed to create physics impostor:", e);
                }
            }
        }
    });
  }
  
  function createIrregularHole(x, y, z, size, scene, material) {
    // Create an irregular hole using multiple overlapping spheres
    const holeFragments = [];
    const mainHole = BABYLON.MeshBuilder.CreateSphere("main_hole", {
        diameter: size,
        segments: 16
    }, scene);
    
    mainHole.position = new BABYLON.Vector3(x, y, z);
    holeFragments.push(mainHole);
    
    // Add 3-5 smaller overlapping holes
    const numFragments = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numFragments; i++) {
        const fragmentSize = size * (0.4 + Math.random() * 0.5);
        const fragment = BABYLON.MeshBuilder.CreateSphere(`hole_fragment_${i}`, {
            diameter: fragmentSize,
            segments: 12
        }, scene);
        
        // Position around the main hole
        const angle = Math.random() * Math.PI * 2;
        const distance = size * 0.4 * Math.random();
        fragment.position = new BABYLON.Vector3(
            x + Math.cos(angle) * distance,
            y,
            z + Math.sin(angle) * distance
        );
        
        holeFragments.push(fragment);
    }
    
    // Holes are just for visual effect, not rendered in final scene
    holeFragments.forEach(hole => {
        hole.isVisible = false;
    });
    
    return holeFragments;
  }
  
  function createHangingElements(x, y, z, size, scene) {
    // Create electrical wires hanging from ceiling
    const wireCount = 3 + Math.floor(Math.random() * 4);
    
    // Create materials
    const wireMaterial = new BABYLON.StandardMaterial("wireMaterial", scene);
    wireMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    
    const copperMaterial = new BABYLON.StandardMaterial("copperMaterial", scene);
    copperMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.4, 0.2);
    
    const pipeMaterial = new BABYLON.StandardMaterial("pipeMaterial", scene);
    pipeMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.6);
    
    for (let i = 0; i < wireCount; i++) {
        // Create a hanging wire using a thin cylinder
        const wireLength = 1 + Math.random() * 4;
        const wire = BABYLON.MeshBuilder.CreateCylinder(`hanging_wire_${x}_${z}_${i}`, {
            height: wireLength,
            diameter: 0.05,
            tessellation: 8
        }, scene);
        
        // Position within hole radius
        const offsetX = (Math.random() - 0.5) * size * 0.7;
        const offsetZ = (Math.random() - 0.5) * size * 0.7;
        
        wire.position = new BABYLON.Vector3(
            x + offsetX,
            y - wireLength/2,
            z + offsetZ
        );
        
        wire.material = wireMaterial;
        
        // Add exposed wire end
        if (Math.random() > 0.5) {
            const wireEnd = BABYLON.MeshBuilder.CreateCylinder(`wire_end_${i}`, {
                height: 0.15,
                diameter: 0.1,
                tessellation: 8
            }, scene);
            
            wireEnd.position = new BABYLON.Vector3(
                wire.position.x,
                wire.position.y - wireLength/2 + 0.075,
                wire.position.z
            );
            
            wireEnd.material = copperMaterial;
            
            // Add sparking effect on some wires
            if (Math.random() > 0.7) {
                const sparkLight = new BABYLON.PointLight(
                    `spark_light_${i}`,
                    wireEnd.position.clone(),
                    scene
                );
                sparkLight.diffuse = new BABYLON.Color3(1, 0.8, 0.4);
                sparkLight.specular = new BABYLON.Color3(1, 0.8, 0.4);
                sparkLight.intensity = 0.5 + Math.random() * 0.5;
                
                // Add flicker animation
                scene.registerBeforeRender(() => {
                    if (Math.random() > 0.95) {
                        sparkLight.intensity = 0.1 + Math.random();
                    }
                });
            }
        }
    }
    
    // Add a broken pipe
    if (Math.random() > 0.5) {
        const pipe = BABYLON.MeshBuilder.CreateCylinder("broken_pipe", {
            height: 3,
            diameter: 0.25,
            tessellation: 12
        }, scene);
        
        pipe.position = new BABYLON.Vector3(
          x + (Math.random() - 0.5) * size * 0.5,
          y - 1.5,
          z + (Math.random() - 0.5) * size * 0.5
      );
      
      // Rotate the pipe to look broken
      pipe.rotation = new BABYLON.Vector3(
          Math.random() * 0.5,
          0,
          Math.random() * 0.5
      );
      
      pipe.material = pipeMaterial;
      
      // Add dripping water effect
      createWaterDrip(pipe.position.x, pipe.position.y - 1.5, pipe.position.z, scene);
    }
  }
  
  function createWaterDrip(x, y, z, scene) {
    // Create water drip particles
    const waterDropSystem = new BABYLON.ParticleSystem("waterDrip", 30, scene);
    waterDropSystem.particleTexture = new BABYLON.Texture("textures/flare.png", scene);
    waterDropSystem.emitter = new BABYLON.Vector3(x, y, z);
    waterDropSystem.minEmitBox = new BABYLON.Vector3(-0.05, 0, -0.05);
    waterDropSystem.maxEmitBox = new BABYLON.Vector3(0.05, 0, 0.05);
    
    // Water drop properties
    waterDropSystem.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 0.6);
    waterDropSystem.color2 = new BABYLON.Color4(0.7, 0.8, 1.0, 0.6);
    waterDropSystem.colorDead = new BABYLON.Color4(0.7, 0.8, 1.0, 0);
    
    waterDropSystem.minSize = 0.05;
    waterDropSystem.maxSize = 0.1;
    
    waterDropSystem.minLifeTime = 1.0;
    waterDropSystem.maxLifeTime = 1.5;
    
    waterDropSystem.emitRate = 10;
    
    // Gravity
    waterDropSystem.gravity = new BABYLON.Vector3(0, -9.81, 0);
    
    // Blend mode
    waterDropSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
    
    // Start the particle system
    waterDropSystem.start();
    
    // Create small puddle on floor
    const puddle = BABYLON.MeshBuilder.CreateGround("puddle", {
        width: 1 + Math.random(),
        height: 1 + Math.random(),
        subdivisions: 1
    }, scene);
    
    puddle.position = new BABYLON.Vector3(x, 0.01, z); // Slightly above floor
    
    const puddleMaterial = new BABYLON.StandardMaterial("puddleMaterial", scene);
    puddleMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.6, 0.7);
    puddleMaterial.alpha = 0.3;
    puddleMaterial.specularColor = new BABYLON.Color3(1, 1, 1);
    puddleMaterial.specularPower = 128; // Shiny water surface
    puddle.material = puddleMaterial;
    
    }
  
    function createDebrisPile(x, z, size, scene, material) {
        // Create a pile of debris on the floor
        const debrisCount = 10 + Math.floor(Math.random() * 15);
        const debrisPieces = [];
        
        // Create debris pile base
        const pileBase = BABYLON.MeshBuilder.CreateGround("pile_base", {
            width: size * 1.5,
            height: size * 1.5,
            subdivisions: 1
        }, scene);
        
        pileBase.position = new BABYLON.Vector3(x, 0.01, z);
        
        const pileMaterial = new BABYLON.StandardMaterial("pileMaterial", scene);
        pileMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.45, 0.4);
        pileMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        pileBase.material = pileMaterial;
        
        // Add dust particle effect
        const dustParticles = new BABYLON.ParticleSystem("dust", 50, scene);
        dustParticles.particleTexture = new BABYLON.Texture("textures/flare.png", scene);
        dustParticles.emitter = new BABYLON.Vector3(x, size/4, z);
        dustParticles.minEmitBox = new BABYLON.Vector3(-size/2, 0, -size/2);
        dustParticles.maxEmitBox = new BABYLON.Vector3(size/2, size/2, size/2);
        
        // Dust properties
        dustParticles.color1 = new BABYLON.Color4(0.6, 0.6, 0.6, 0.2);
        dustParticles.color2 = new BABYLON.Color4(0.6, 0.6, 0.5, 0.2);
        dustParticles.colorDead = new BABYLON.Color4(0.6, 0.6, 0.6, 0);
        
        dustParticles.minSize = 0.1;
        dustParticles.maxSize = 0.5;
        
        dustParticles.minLifeTime = 3.0;
        dustParticles.maxLifeTime = 8.0;
        
        dustParticles.emitRate = 5;
        
        // Slow upward drift
        dustParticles.direction1 = new BABYLON.Vector3(-0.2, 1, -0.2);
        dustParticles.direction2 = new BABYLON.Vector3(0.2, 1, 0.2);
        
        dustParticles.minEmitPower = 0.1;
        dustParticles.maxEmitPower = 0.3;
        
        dustParticles.start();
        
        // Create various debris pieces
        for (let i = 0; i < debrisCount; i++) {
            let debris;
            const debrisType = Math.floor(Math.random() * 5);
            const debrisSize = 0.2 + Math.random() * 0.8;
            
            switch(debrisType) {
                case 0: // Concrete chunk
                    debris = BABYLON.MeshBuilder.CreateBox(`pile_debris_${i}`, {
                        width: debrisSize,
                        height: debrisSize * 0.5,
                        depth: debrisSize * 0.7
                    }, scene);
                    break;
                case 1: // Ceiling tile
                    debris = BABYLON.MeshBuilder.CreateBox(`pile_debris_${i}`, {
                        width: debrisSize * 1.5,
                        height: debrisSize * 0.2,
                        depth: debrisSize * 1.5
                    }, scene);
                    break;
                case 2: // Wire/pipe
                    debris = BABYLON.MeshBuilder.CreateCylinder(`pile_debris_${i}`, {
                        height: debrisSize * 2,
                        diameter: debrisSize * 0.3,
                        tessellation: 8
                    }, scene);
                    break;
                case 3: // Irregular chunk
                    debris = BABYLON.MeshBuilder.CreatePolyhedron(`pile_debris_${i}`, {
                        type: Math.floor(Math.random() * 3),
                        size: debrisSize * 0.7
                    }, scene);
                    break;
                case 4: // Light fixture
                    debris = BABYLON.MeshBuilder.CreateCylinder(`pile_debris_${i}`, {
                        height: debrisSize * 0.5,
                        diameterTop: debrisSize * 1.2,
                        diameterBottom: debrisSize * 0.8,
                        tessellation: 12
                    }, scene);
                    break;
            }
            
            // Position within the pile radius
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * size * 0.7;
            const height = Math.random() * (size * 0.4);
            
            debris.position = new BABYLON.Vector3(
                x + Math.cos(angle) * distance,
                height,
                z + Math.sin(angle) * distance
            );
            
            // Random rotation
            debris.rotation = new BABYLON.Vector3(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            // Create unique material with varying colors
            const debrisMaterial = new BABYLON.StandardMaterial(`debris_mat_pile_${i}`, scene);
            debrisMaterial.diffuseColor = new BABYLON.Color3(
                0.4 + Math.random() * 0.4,
                0.4 + Math.random() * 0.3,
                0.4 + Math.random() * 0.3
            );
            debrisMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
            debris.material = debrisMaterial;
            debris.checkCollisions = true;
            
            debrisPieces.push(debris);
        }
        
        return debrisPieces;
    }
  
    function createDebris(scene, material) {
        const debrisPositions = [];
        // Generate random debris positions
        for (let i = 0; i < 70; i++) { // More debris for a more realistic destroyed environment
            debrisPositions.push({
                x: Math.random() * 90 - 45,
                z: Math.random() * 90 - 45,
                size: 0.2 + Math.random() * 0.8,
                type: Math.floor(Math.random() * 7) // Different types of debris
            });
        }
        
        debrisPositions.forEach((pos, index) => {
            let debris;
            
            switch(pos.type) {
                case 0: // Standard debris chunk
                    debris = BABYLON.MeshBuilder.CreateBox(`debris_${index}`, {
                        width: pos.size,
                        height: pos.size * 0.5,
                        depth: pos.size
                    }, scene);
                    break;
                case 1: // Ceiling tile fragment
                    debris = BABYLON.MeshBuilder.CreateBox(`debris_${index}`, {
                        width: pos.size * 1.5,
                        height: pos.size * 0.2,
                        depth: pos.size * 1.5
                    }, scene);
                    break;
                case 2: // Broken pipe
                    debris = BABYLON.MeshBuilder.CreateCylinder(`debris_${index}`, {
                        height: pos.size * 2,
                        diameter: pos.size * 0.3,
                        tessellation: 8
                    }, scene);
                    break;
                case 3: // Wall fragment
                    debris = BABYLON.MeshBuilder.CreateBox(`debris_${index}`, {
                        width: pos.size * 0.5,
                        height: pos.size * 1.5,
                        depth: pos.size * 0.2
                    }, scene);
                    break;
                case 4: // Museum exhibit fragment
                    debris = BABYLON.MeshBuilder.CreateSphere(`debris_${index}`, {
                        diameter: pos.size,
                        segments: 8
                    }, scene);
                    break;
                case 5: // Light fixture
                    debris = BABYLON.MeshBuilder.CreateCylinder(`debris_${index}`, {
                        height: pos.size * 0.5,
                        diameterTop: pos.size * 1.2,
                        diameterBottom: pos.size * 0.8,
                        tessellation: 12
                    }, scene);
                    break;
                case 6: // Paper/documents
                    debris = BABYLON.MeshBuilder.CreateGround(`debris_${index}`, {
                        width: pos.size * 0.7,
                        height: pos.size * 1,
                        subdivisions: 1
                    }, scene);
                    
                    // Create a unique material for paper
                    const paperMaterial = new BABYLON.StandardMaterial(`paper_mat_${index}`, scene);
                    paperMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.88, 0.8);
                    paperMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                    debris.material = paperMaterial;
                    break;
            }
            
            debris.position = new BABYLON.Vector3(pos.x, pos.size * 0.25, pos.z);
            
            // Rotate for more natural look
            debris.rotation = new BABYLON.Vector3(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            // Only apply the default material if we didn't already set a custom one
            if (pos.type !== 6) {
                // Slightly vary the material color for each piece
                const debrisMaterial = material.clone(`debris_mat_${index}`);
                debrisMaterial.diffuseColor = new BABYLON.Color3(
                    material.diffuseColor.r + (Math.random() * 0.2 - 0.1),
                    material.diffuseColor.g + (Math.random() * 0.2 - 0.1),
                    material.diffuseColor.b + (Math.random() * 0.2 - 0.1)
                );
                debris.material = debrisMaterial;
            }
            
            debris.checkCollisions = true;
        });
    }
  
    function addCracks(wall, holePosition, scene) {
        // Generate 3-5 cracks extending from the hole
        const crackCount = 3 + Math.floor(Math.random() * 3);
        const wallMaterial = wall.material;
        
        for (let i = 0; i < crackCount; i++) {
            // Create a crack as a thin cylinder
            const length = 1 + Math.random() * 2;
            const angle = Math.random() * Math.PI * 2;
            
            const crackMesh = BABYLON.MeshBuilder.CreateCylinder(`crack_${wall.name}_${i}`, {
                height: length,
                diameter: 0.1,
                tessellation: 8
            }, scene);
            
            // Position and orient the crack to extend from the hole
            crackMesh.position = holePosition.clone();
            crackMesh.rotation.z = Math.PI/2; // Lay it flat
            crackMesh.rotation.y = angle; // Random direction
            
            // Move it so one end is at the hole position
            const direction = new BABYLON.Vector3(
                Math.cos(angle),
                0,
                Math.sin(angle)
            );
            crackMesh.position.addInPlace(direction.scale(length/2));
            
            crackMesh.material = wallMaterial;
        }
    }