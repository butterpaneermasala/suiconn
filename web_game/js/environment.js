function createMuseum(scene) {
  // Create materials with more realistic detail and textures
  const floorMaterial = new BABYLON.StandardMaterial("floorMaterial", scene);
  floorMaterial.diffuseColor = new BABYLON.Color3(0.25, 0.24, 0.26);
  floorMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
  floorMaterial.specularPower = 64; // More polished museum floor
  
  // Create a procedural marble texture for floor
  const marbleTexture = new BABYLON.ProceduralTexture("marbleTexture", 512, "marbleProceduralTexture", scene);
  marbleTexture.updateShaderUniforms = function() {
    marbleTexture.setFloat("numberOfTilesHeight", 6);
    marbleTexture.setFloat("numberOfTilesWidth", 6);
    marbleTexture.setColor3("mainColor", BABYLON.Color3.FromHexString("#CCCCCC"));
    marbleTexture.setColor3("lineColor", BABYLON.Color3.FromHexString("#888888"));
  };
  floorMaterial.diffuseTexture = marbleTexture;
  
  const wallMaterial = new BABYLON.StandardMaterial("wallMaterial", scene);
  wallMaterial.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.9);
  wallMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
  
  // Create plaster-like texture for walls
  const plasterProceduralTexture = new BABYLON.NoiseProceduralTexture("plasterNoise", 512, scene);
  plasterProceduralTexture.octaves = 4;
  plasterProceduralTexture.persistence = 0.2;
  plasterProceduralTexture.animationSpeedFactor = 0;
  plasterProceduralTexture.level = 0.9;
  wallMaterial.bumpTexture = plasterProceduralTexture;
  wallMaterial.bumpTexture.level = 0.3;

  const damagedWallMaterial = new BABYLON.StandardMaterial("damagedWallMaterial", scene);
  damagedWallMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.75, 0.7);
  damagedWallMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
  
  // Add water stains and damage to damaged wall texture
  const damageProceduralTexture = new BABYLON.NoiseProceduralTexture("damageNoise", 512, scene);
  damageProceduralTexture.octaves = 3;
  damageProceduralTexture.persistence = 0.5;
  damageProceduralTexture.animationSpeedFactor = 0;
  damagedWallMaterial.diffuseTexture = damageProceduralTexture;
  damagedWallMaterial.bumpTexture = damageProceduralTexture;
  damagedWallMaterial.bumpTexture.level = 0.8;

  const glassMaterial = new BABYLON.PBRMaterial("glassMaterial", scene);
  glassMaterial.metallic = 0.0;
  glassMaterial.roughness = 0.05;
  glassMaterial.subSurface.isRefractionEnabled = true;
  glassMaterial.alpha = 0.5;
  glassMaterial.indexOfRefraction = 1.5;
  glassMaterial.albedoColor = new BABYLON.Color3(0.8, 0.9, 1.0);

  const statueMaterial = new BABYLON.PBRMaterial("statueMaterial", scene);
  statueMaterial.metallic = 0;
  statueMaterial.roughness = 0.3;
  statueMaterial.albedoColor = new BABYLON.Color3(0.9, 0.88, 0.82);
  
  const metalMaterial = new BABYLON.PBRMaterial("metalMaterial", scene);
  metalMaterial.metallic = 1.0;
  metalMaterial.roughness = 0.15;
  metalMaterial.albedoColor = new BABYLON.Color3(0.8, 0.8, 0.85);

  // Create main floor (larger for more space)
  const floorSize = 60;
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
  outerWalls[0].position = new BABYLON.Vector3(0, outerWallHeight/2, floorSize/2);
  outerWalls[1].position = new BABYLON.Vector3(0, outerWallHeight/2, -floorSize/2);
  outerWalls[2].position = new BABYLON.Vector3(floorSize/2, outerWallHeight/2, 0);
  outerWalls[3].position = new BABYLON.Vector3(-floorSize/2, outerWallHeight/2, 0);

  // Apply materials and collisions to outer walls
  outerWalls.forEach(wall => {
      wall.material = wallMaterial;
      wall.checkCollisions = true;
      wall.receiveShadows = true;
      
      // Add decorative trim along the wall base
      const baseTrim = BABYLON.MeshBuilder.CreateBox("baseTrim_" + wall.name, {
          width: wall.scaling.x * wall.getBoundingInfo().boundingBox.extendSize.x * 2,
          height: 0.5,
          depth: wall.scaling.z * wall.getBoundingInfo().boundingBox.extendSize.z * 2
      }, scene);
      
      baseTrim.position = new BABYLON.Vector3(
          wall.position.x,
          0.25, // Half the height of the trim
          wall.position.z
      );
      
      baseTrim.material = metalMaterial;
      baseTrim.checkCollisions = true;
  });

  // Create interior walls with more detail
  createInteriorWalls(scene, wallMaterial, damagedWallMaterial, metalMaterial);

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

  // Add ceiling tiles and texture
  createCeilingDetail(scene, ceiling, outerWallHeight);

  // Create broken ceiling sections
  createBrokenCeilings(scene, outerWallHeight, wallMaterial);

  // Add debris and fallen objects
  createDebris(scene, damagedWallMaterial);

  // Add detailed museum decorations
  createMuseumDecorations(scene, glassMaterial, statueMaterial, metalMaterial);

  // Add lighting - now only from ceiling bulbs
  createRealisticLighting(scene, outerWallHeight);
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
  return wall;
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

function createMuseumDecorations(scene, glassMaterial, statueMaterial, metalMaterial) {
// Create more detailed and varied museum content
createDisplayCases(scene, glassMaterial, metalMaterial);
createStatues(scene, statueMaterial);
createPaintings(scene);
createInformationPanels(scene);
createBenches(scene);
createPotPlants(scene);
}

function createDisplayCases(scene, glassMaterial, metalMaterial) {
  const casePositions = [
      { x: -20, z: 5, style: "rectangular" },
      { x: -15, z: -18, style: "tall" },
      { x: 12, z: 8, style: "rectangular" },
      { x: 22, z: -5, style: "pedestal" },
      { x: -8, z: 22, style: "tall" },
      { x: 5, z: -22, style: "pedestal" },
      { x: 18, z: 18, style: "rectangular" },
      { x: -22, z: -15, style: "tall" },
      { x: 0, z: 15, style: "pedestal" },
      { x: -12, z: -5, style: "rectangular" }
  ];

  casePositions.forEach((pos, index) => {
      let displayCase;
      let pedestal;
      
      // Create frame material for display case
      const frameMaterial = metalMaterial.clone(`frame_mat_${index}`);
      frameMaterial.metallic = 0.9;
      frameMaterial.roughness = 0.1;
      
      switch(pos.style) {
          case "rectangular":
              // Create glass display case
              displayCase = BABYLON.MeshBuilder.CreateBox(`displayCase_${index}`, {
                  width: 3,
                  height: 1.5,
                  depth: 2
              }, scene);
              
              // Create metal frame
              createDisplayCaseFrame(displayCase, frameMaterial, scene);
              
              // Create base
              pedestal = BABYLON.MeshBuilder.CreateBox(`pedestal_${index}`, {
                  width: 3.5,
                  height: 0.8,
                  depth: 2.5
              }, scene);
              break;
              
          case "tall":
              // Tall display case
              displayCase = BABYLON.MeshBuilder.CreateBox(`displayCase_${index}`, {
                  width: 1.8,
                  height: 4,
                  depth: 1.8
              }, scene);
              
              // Create metal frame
              createDisplayCaseFrame(displayCase, frameMaterial, scene);
              
              // Create base
              pedestal = BABYLON.MeshBuilder.CreateBox(`pedestal_${index}`, {
                  width: 2.2,
                  height: 0.3,
                  depth: 2.2
              }, scene);
              break;
              
          case "pedestal":
              // Just a pedestal with a glass dome
              pedestal = BABYLON.MeshBuilder.CreateCylinder(`pedestal_${index}`, {
                  height: 1.2,
                  diameterTop: 1.2,
                  diameterBottom: 1.5,
                  tessellation: 20
              }, scene);
              
              // Create glass dome using hemispheric ground
              displayCase = BABYLON.CreateHemisphere(`glassDome_${index}`, {
                  radius: 0.7,  // Half of diameter
                  segments: 16
              }, scene);
              
              // Flip the hemisphere to make it a dome
              displayCase.rotation.x = Math.PI;
              break;
      }
      
      // Position elements
      displayCase.position = new BABYLON.Vector3(
          pos.x,
          pos.style === "pedestal" ? 1.9 : 1.5,
          pos.z
      );
      displayCase.material = glassMaterial;
      displayCase.checkCollisions = true;
      
      pedestal.position = new BABYLON.Vector3(
          pos.x,
          pos.style === "pedestal" ? 0.6 : 0.4,
          pos.z
      );
      pedestal.material = frameMaterial;
      pedestal.checkCollisions = true;
      
      // Add museum artifact inside the case
      createMuseumArtifact(displayCase.position.x, displayCase.position.y - 0.5, displayCase.position.z, scene);
  });
}

function createDisplayCaseFrame(displayCase, material, scene) {
const width = displayCase.scaling.x * displayCase.getBoundingInfo().boundingBox.extendSize.x * 2;
const height = displayCase.scaling.y * displayCase.getBoundingInfo().boundingBox.extendSize.y * 2;
const depth = displayCase.scaling.z * displayCase.getBoundingInfo().boundingBox.extendSize.z * 2;
const frameWidth = 0.05;

// Create 12 frame edges
// Vertical edges (4)
for (let i = 0; i < 4; i++) {
    const edge = BABYLON.MeshBuilder.CreateBox(`case_edge_v_${i}`, {
        width: frameWidth,
        height: height,
        depth: frameWidth
    }, scene);
    
    const x = ((i % 2) * 2 - 1) * (width/2 - frameWidth/2);
    const z = (Math.floor(i/2) * 2 - 1) * (depth/2 - frameWidth/2);
    
    edge.position = new BABYLON.Vector3(
        displayCase.position.x + x,
        displayCase.position.y,
        displayCase.position.z + z
    );
    
    edge.material = material;
}

// Horizontal edges (top and bottom) (8)
for (let i = 0; i < 8; i++) {
    const isTop = i >= 4;
    const localIndex = i % 4;
    
    let edge;
    if (localIndex < 2) {
        // Width edges
        edge = BABYLON.MeshBuilder.CreateBox(`case_edge_h_${i}`, {
            width: width - 2 * frameWidth,
            height: frameWidth,
            depth: frameWidth
        }, scene);
    } else {
        // Depth edges
        edge = BABYLON.MeshBuilder.CreateBox(`case_edge_h_${i}`, {
            width: frameWidth,
            height: frameWidth,
            depth: depth - 2 * frameWidth
        }, scene);
    }
    
    const y = (isTop ? 1 : -1) * (height/2 - frameWidth/2);
    let x = 0, z = 0;
    
    if (localIndex === 0) {
        z = -depth/2 + frameWidth/2;
    } else if (localIndex === 1) {
        z = depth/2 - frameWidth/2;
    } else if (localIndex === 2) {
        x = -width/2 + frameWidth/2;
    } else {
        x = width/2 - frameWidth/2;
    }
    
    edge.position = new BABYLON.Vector3(
        displayCase.position.x + x,
        displayCase.position.y + y,
        displayCase.position.z + z
    );
    
    edge.material = material;
}
}

function createMuseumArtifact(x, y, z, scene) {
// Create different types of museum artifacts
const artifactType = Math.floor(Math.random() * 5);
let artifact;

// Artifact materials
const goldMaterial = new BABYLON.PBRMaterial("goldMaterial", scene);
goldMaterial.metallic = 1.0;
goldMaterial.roughness = 0.15;
goldMaterial.albedoColor = new BABYLON.Color3(1.0, 0.8, 0.3);
goldMaterial.reflectivityColor = new BABYLON.Color3(1.0, 0.8, 0.3);

const stoneMaterial = new BABYLON.PBRMaterial("stoneMaterial", scene);
stoneMaterial.metallic = 0;
stoneMaterial.roughness = 0.8;
stoneMaterial.albedoColor = new BABYLON.Color3(0.8, 0.75, 0.7);

const ceramicMaterial = new BABYLON.PBRMaterial("ceramicMaterial", scene);
ceramicMaterial.metallic = 0;
ceramicMaterial.roughness = 0.1;
ceramicMaterial.albedoColor = new BABYLON.Color3(0.9, 0.9, 0.95);

const gemMaterial = new BABYLON.PBRMaterial("gemMaterial", scene);
gemMaterial.metallic = 0.1;
gemMaterial.roughness = 0;
gemMaterial.albedoColor = new BABYLON.Color3(0.3, 0.5, 1.0);
gemMaterial.alpha = 0.8;

switch(artifactType) {
    case 0: // Ancient vase
        artifact = BABYLON.MeshBuilder.CreateCylinder("artifact_vase", {
            height: 0.8,
            diameterTop: 0.3,
            diameterBottom: 0.25,
            tessellation: 20
        }, scene);
        artifact.material = ceramicMaterial;
        break;
        
    case 1: // Sculpture bust
        artifact = BABYLON.MeshBuilder.CreateSphere("artifact_bust", {
            diameter: 0.4,
            segments: 16
        }, scene);
        
        // Create base for bust
        const bustBase = BABYLON.MeshBuilder.CreateCylinder("bust_base", {
            height: 0.2,
            diameter: 0.25,
            tessellation: 12
        }, scene);
        
        bustBase.position = new BABYLON.Vector3(x, y - 0.3, z);
        bustBase.material = stoneMaterial;
        
        artifact.scaling.y = 1.3; // Make the head taller
        artifact.material = stoneMaterial;
        break;
        
    case 2: // Golden artifact
        artifact = BABYLON.MeshBuilder.CreatePolyhedron("artifact_gold", {
            type: 2, // Dodecahedron
            size: 0.25
        }, scene);
        artifact.material = goldMaterial;
        break;
        
    case 3: // Ancient tablet with inscriptions
        artifact = BABYLON.MeshBuilder.CreateBox("artifact_tablet", {
            width: 0.5,
            height: 0.7,
            depth: 0.1
        }, scene);
        
        // Create tablet material with inscriptions
        const tabletMaterial = stoneMaterial.clone("tabletMaterial");
        
        // Add inscription texture if available
        // tabletMaterial.bumpTexture = new BABYLON.Texture("textures/inscription_bump.png", scene);
        // tabletMaterial.bumpTexture.level = 0.6;
        
        artifact.material = tabletMaterial;
        break;
        
    case 4: // Gemstone
        artifact = BABYLON.MeshBuilder.CreatePolyhedron("artifact_gem", {
            type: 4, // Icosahedron
            size: 0.2
        }, scene);
        artifact.material = gemMaterial;
        break;
}

// Position the artifact
artifact.position = new BABYLON.Vector3(x, y, z);

// For busts, we need to adjust the position
if (artifactType === 1) {
    artifact.position.y += 0.1;
}

// Add subtle rotation animation
scene.registerBeforeRender(() => {
    artifact.rotation.y += 0.001;
});

return artifact;
}

function createStatues(scene, statueMaterial) {
const statuePositions = [
    { x: -10, z: 5, style: "human" },
    { x: 15, z: -15, style: "abstract" },
    { x: -5, z: -25, style: "animal" },
    { x: 20, z: 25, style: "human" },
    { x: -25, z: -10, style: "abstract" }
];

statuePositions.forEach((pos, index) => {
    let statue;
    let base;
    
    // Create custom statue material
    const customStatueMaterial = statueMaterial.clone(`statue_mat_${index}`);
    customStatueMaterial.roughness = 0.2 + Math.random() * 0.6;
    
    // Vary the statue material color slightly
    const colorVariation = -0.1 + Math.random() * 0.2;
    customStatueMaterial.albedoColor = new BABYLON.Color3(
        statueMaterial.albedoColor.r + colorVariation,
        statueMaterial.albedoColor.g + colorVariation,
        statueMaterial.albedoColor.b + colorVariation
    );
    
    switch(pos.style) {
        case "human":
            // Create abstract human form
            statue = createHumanStatue(scene);
            break;
            
        case "abstract":
            // Create abstract sculpture
            statue = createAbstractStatue(scene);
            break;
            
        case "animal":
            // Create animal form
            statue = createAnimalStatue(scene);
            break;
    }
    
    // Create base
    base = BABYLON.MeshBuilder.CreateCylinder(`statue_base_${index}`, {
        height: 0.6,
        diameterTop: 1.2,
        diameterBottom: 1.5,
        tessellation: 20
    }, scene);
    
    // Position elements
    statue.position = new BABYLON.Vector3(
        pos.x,
        pos.style === "human" ? 3 : 2,
        pos.z
    );
    statue.material = customStatueMaterial;
    
    base.position = new BABYLON.Vector3(
        pos.x,
        0.3,
        pos.z
    );
    base.material = customStatueMaterial;
    base.checkCollisions = true;
    
    // For animal statues, add secondary base
    if (pos.style === "animal") {
        const secondaryBase = BABYLON.MeshBuilder.CreateBox(`statue_secondary_base_${index}`, {
            width: 1.8,
            height: 0.4,
            depth: 1.8
        }, scene);
        
        secondaryBase.position = new BABYLON.Vector3(
            pos.x,
            0.8,
            pos.z
        );
        secondaryBase.material = customStatueMaterial;
    }
});
}

function createHumanStatue(scene) {
// Create a simple human form
const body = BABYLON.MeshBuilder.CreateCylinder("statue_body", {
    height: 3,
    diameterTop: 0.8,
    diameterBottom: 1.2,
    tessellation: 16
}, scene);

// Create head
const head = BABYLON.MeshBuilder.CreateSphere("statue_head", {
    diameter: 0.8,
    segments: 16
}, scene);

head.position = new BABYLON.Vector3(0, 2, 0);
head.parent = body;

// Create arms
const leftArm = BABYLON.MeshBuilder.CreateCylinder("statue_left_arm", {
    height: 2,
    diameter: 0.3,
    tessellation: 12
}, scene);

leftArm.position = new BABYLON.Vector3(-0.8, 1, 0);
leftArm.rotation.z = Math.PI/4; // Angle the arm
leftArm.parent = body;

const rightArm = BABYLON.MeshBuilder.CreateCylinder("statue_right_arm", {
    height: 2,
    diameter: 0.3,
    tessellation: 12
}, scene);

rightArm.position = new BABYLON.Vector3(0.8, 1, 0);
rightArm.rotation.z = -Math.PI/4; // Angle the arm
rightArm.parent = body;

return body;
}

function createAbstractStatue(scene) {
// Create abstract form
const base = BABYLON.MeshBuilder.CreateSphere("statue_abstract_base", {
    diameter: 1.2,
    segments: 16
}, scene);

// Add abstract elements
for (let i = 0; i < 5; i++) {
    const element = BABYLON.MeshBuilder.CreateBox(`statue_abstract_element_${i}`, {
        width: 0.5 + Math.random() * 0.5,
        height: 0.5 + Math.random() * 2,
        depth: 0.5 + Math.random() * 0.5
    }, scene);
    
    // Position radiating from center
    const angle = (Math.PI * 2 / 5) * i;
    const distance = 0.3 + Math.random() * 0.4;
    
    element.position = new BABYLON.Vector3(
        Math.cos(angle) * distance,
        0.5 + Math.random() * 1.5,
        Math.sin(angle) * distance
    );
    
    // Random rotation
    element.rotation = new BABYLON.Vector3(
        Math.random() * Math.PI/4,
        Math.random() * Math.PI,
        Math.random() * Math.PI/4
    );
    
    element.parent = base;
}

return base;
}

function createAnimalStatue(scene) {
    // Create a stylized animal form (lion-like)
    const body = BABYLON.MeshBuilder.CreateSphere("statue_body", {
        diameter: 1.2,
        segments: 16
    }, scene);
    
    // Create head
    const head = BABYLON.MeshBuilder.CreateSphere("statue_head", {
        diameter: 0.8,
        segments: 16
    }, scene);
    head.position = new BABYLON.Vector3(0, 0, -0.8);
    head.parent = body;
    
    // Create legs
    for (let i = 0; i < 4; i++) {
        const leg = BABYLON.MeshBuilder.CreateCylinder(`statue_leg_${i}`, {
            height: 0.8,
            diameter: 0.3,
            tessellation: 12
        }, scene);
        
        const xPos = (i % 2 === 0) ? -0.4 : 0.4;
        const zPos = (i < 2) ? -0.4 : 0.4;
        
        leg.position = new BABYLON.Vector3(xPos, -0.6, zPos);
        leg.parent = body;
    }
    
    // Create tail
    const tail = BABYLON.MeshBuilder.CreateCylinder("statue_tail", {
        height: 1,
        diameter: 0.15,
        tessellation: 8
    }, scene);
    tail.position = new BABYLON.Vector3(0, -0.2, 0.8);
    tail.rotation.x = Math.PI/4;
    tail.parent = body;
    
    // Create mane
    const mane = BABYLON.MeshBuilder.CreateTorus("statue_mane", {
        diameter: 1,
        thickness: 0.3,
        tessellation: 16
    }, scene);
    mane.position = new BABYLON.Vector3(0, 0, -0.5);
    mane.rotation.x = Math.PI/2;
    mane.parent = body;
    
    return body;
}

function createPaintings(scene) {
    const paintingPositions = [
        { x: -15, z: 29.5, rotation: 0, size: 3 },
        { x: 15, z: 29.5, rotation: 0, size: 3 },
        { x: -29.5, z: 15, rotation: Math.PI/2, size: 2.5 },
        { x: -29.5, z: -15, rotation: Math.PI/2, size: 2.5 },
        { x: 29.5, z: 15, rotation: -Math.PI/2, size: 2.5 },
        { x: 29.5, z: -15, rotation: -Math.PI/2, size: 2.5 },
        { x: -10, z: -29.5, rotation: Math.PI, size: 3 },
        { x: 10, z: -29.5, rotation: Math.PI, size: 3 }
    ];
    
    const frameMaterial = new BABYLON.PBRMaterial("frameMaterial", scene);
    frameMaterial.metallic = 0.8;
    frameMaterial.roughness = 0.3;
    frameMaterial.albedoColor = new BABYLON.Color3(0.4, 0.3, 0.2);
    
    paintingPositions.forEach((pos, index) => {
        // Create painting frame
        const frame = BABYLON.MeshBuilder.CreateBox(`painting_frame_${index}`, {
            width: pos.size * 1.1,
            height: pos.size * 1.5,
            depth: 0.15
        }, scene);
        
        frame.position = new BABYLON.Vector3(pos.x, 2.5, pos.z);
        frame.rotation.y = pos.rotation;
        frame.material = frameMaterial;
        
        // Create canvas
        const canvas = BABYLON.MeshBuilder.CreatePlane(`painting_canvas_${index}`, {
            width: pos.size,
            height: pos.size * 1.4
        }, scene);
        
        canvas.position = new BABYLON.Vector3(
            pos.x,
            2.5,
            pos.rotation === 0 ? pos.z - 0.08 : 
            pos.rotation === Math.PI ? pos.z + 0.08 :
            pos.rotation === Math.PI/2 ? pos.z - 0.08 :
            pos.z + 0.08
        );
        
        canvas.rotation.y = pos.rotation;
        
        // Create painting material with random "art"
        const paintingMaterial = new BABYLON.StandardMaterial(`painting_mat_${index}`, scene);
        
        // Generate procedural art (could be replaced with actual textures)
        const artType = Math.floor(Math.random() * 3);
        switch(artType) {
            case 0: // Portrait
                paintingMaterial.diffuseColor = new BABYLON.Color3(
                    0.7 + Math.random() * 0.3,
                    0.6 + Math.random() * 0.3,
                    0.5 + Math.random() * 0.3
                );
                break;
            case 1: // Landscape
                paintingMaterial.diffuseColor = new BABYLON.Color3(
                    0.4 + Math.random() * 0.3,
                    0.5 + Math.random() * 0.4,
                    0.6 + Math.random() * 0.4
                );
                break;
            case 2: // Abstract
                paintingMaterial.diffuseColor = new BABYLON.Color3(
                    Math.random(),
                    Math.random(),
                    Math.random()
                );
                break;
        }
        
        canvas.material = paintingMaterial;
    });
}

function createInformationPanels(scene) {
    const panelPositions = [
        { x: -5, z: 5, rotation: Math.PI/4 },
        { x: 5, z: -5, rotation: -Math.PI/4 },
        { x: -10, z: -10, rotation: Math.PI/2 },
        { x: 10, z: 10, rotation: 0 }
    ];
    
    const panelMaterial = new BABYLON.StandardMaterial("panelMaterial", scene);
    panelMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.9);
    panelMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    
    panelPositions.forEach((pos, index) => {
        // Create panel stand
        const stand = BABYLON.MeshBuilder.CreateCylinder(`panel_stand_${index}`, {
            height: 1.5,
            diameterTop: 0.1,
            diameterBottom: 0.3,
            tessellation: 8
        }, scene);
        
        stand.position = new BABYLON.Vector3(pos.x, 0.75, pos.z);
        
        // Create panel
        const panel = BABYLON.MeshBuilder.CreateBox(`panel_${index}`, {
            width: 1.5,
            height: 1,
            depth: 0.05
        }, scene);
        
        panel.position = new BABYLON.Vector3(
            pos.x,
            1.5,
            pos.z
        );
        panel.rotation.y = pos.rotation;
        panel.material = panelMaterial;
        
        // Create text plane (would display museum information)
        const textPlane = BABYLON.MeshBuilder.CreatePlane(`panel_text_${index}`, {
            width: 1.4,
            height: 0.9
        }, scene);
        
        textPlane.position = new BABYLON.Vector3(
            panel.position.x + Math.sin(pos.rotation) * 0.03,
            panel.position.y,
            panel.position.z + Math.cos(pos.rotation) * 0.03
        );
        textPlane.rotation.y = pos.rotation;
        
        const textMaterial = new BABYLON.StandardMaterial(`panel_text_mat_${index}`, scene);
        textMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        textMaterial.emissiveColor = new BABYLON.Color3(0.8, 0.8, 0.8);
        textPlane.material = textMaterial;
    });
}

function createBenches(scene) {
    const benchPositions = [
        { x: -10, z: 0, rotation: 0 },
        { x: 10, z: 0, rotation: Math.PI },
        { x: 0, z: -15, rotation: Math.PI/2 },
        { x: 0, z: 15, rotation: -Math.PI/2 }
    ];
    
    const woodMaterial = new BABYLON.PBRMaterial("woodMaterial", scene);
    woodMaterial.metallic = 0;
    woodMaterial.roughness = 0.7;
    woodMaterial.albedoColor = new BABYLON.Color3(0.4, 0.3, 0.2);
    
    benchPositions.forEach((pos, index) => {
        // Create bench seat
        const seat = BABYLON.MeshBuilder.CreateBox(`bench_seat_${index}`, {
            width: 2,
            height: 0.2,
            depth: 0.8
        }, scene);
        
        seat.position = new BABYLON.Vector3(pos.x, 0.5, pos.z);
        seat.rotation.y = pos.rotation;
        seat.material = woodMaterial;
        
        // Create bench legs
        for (let i = 0; i < 4; i++) {
            const legX = pos.x + ((i % 2 === 0) ? -0.8 : 0.8) * Math.cos(pos.rotation);
            const legZ = pos.z + ((i % 2 === 0) ? -0.8 : 0.8) * Math.sin(pos.rotation);
            
            const leg = BABYLON.MeshBuilder.CreateCylinder(`bench_leg_${index}_${i}`, {
                height: 0.5,
                diameter: 0.1,
                tessellation: 8
            }, scene);
            
            leg.position = new BABYLON.Vector3(legX, 0.25, legZ);
            leg.material = woodMaterial;
        }
        
        // Create bench back
        const back = BABYLON.MeshBuilder.CreateBox(`bench_back_${index}`, {
            width: 2,
            height: 0.8,
            depth: 0.1
        }, scene);
        
        back.position = new BABYLON.Vector3(
            pos.x + 0.4 * Math.sin(pos.rotation),
            0.9,
            pos.z - 0.4 * Math.cos(pos.rotation)
        );
        back.rotation.y = pos.rotation;
        back.material = woodMaterial;
    });
}

function createPotPlants(scene) {
    const plantPositions = [
        { x: -25, z: 25 },
        { x: 25, z: 25 },
        { x: -25, z: -25 },
        { x: 25, z: -25 },
        { x: -5, z: 20 },
        { x: 5, z: -20 }
    ];
    
    const potMaterial = new BABYLON.PBRMaterial("potMaterial", scene);
    potMaterial.metallic = 0;
    potMaterial.roughness = 0.5;
    potMaterial.albedoColor = new BABYLON.Color3(0.6, 0.5, 0.4);
    
    const plantMaterial = new BABYLON.StandardMaterial("plantMaterial", scene);
    plantMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.3);
    plantMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    
    plantPositions.forEach((pos, index) => {
        // Create plant pot
        const pot = BABYLON.MeshBuilder.CreateCylinder(`plant_pot_${index}`, {
            height: 0.5,
            diameterTop: 0.6,
            diameterBottom: 0.4,
            tessellation: 16
        }, scene);
        
        pot.position = new BABYLON.Vector3(pos.x, 0.25, pos.z);
        pot.material = potMaterial;
        
        // Create plant
        const plant = BABYLON.MeshBuilder.CreateSphere(`plant_${index}`, {
            diameter: 0.8,
            segments: 8
        }, scene);
        
        plant.position = new BABYLON.Vector3(pos.x, 0.7, pos.z);
        plant.scaling.y = 1.5; // Make it taller
        plant.material = plantMaterial;
        
        // Create leaves
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const leaf = BABYLON.MeshBuilder.CreateSphere(`plant_leaf_${index}_${i}`, {
                diameter: 0.3,
                segments: 4
            }, scene);
            
            leaf.position = new BABYLON.Vector3(
                pos.x + Math.cos(angle) * 0.4,
                0.9 + Math.random() * 0.3,
                pos.z + Math.sin(angle) * 0.4
            );
            leaf.scaling.y = 2 + Math.random();
            leaf.material = plantMaterial;
        }
    });
}

function createRealisticLighting(scene, ceilingHeight) {
    // Remove all existing lights
    scene.lights.forEach(light => {
        light.dispose();
    });
    
    // Create subtle ambient light
    const ambientLight = new BABYLON.HemisphericLight("ambientLight", 
        new BABYLON.Vector3(0, 1, 0), scene);
    ambientLight.intensity = 0.1;
    ambientLight.groundColor = new BABYLON.Color3(0.1, 0.1, 0.15);
    ambientLight.diffuse = new BABYLON.Color3(0.3, 0.3, 0.35);
    
    // Create ceiling grid lights
    const gridSize = 5;
    const floorSize = 60;
    const numLightsX = Math.floor(floorSize / gridSize);
    const numLightsZ = Math.floor(floorSize / gridSize);
    
    // Create light material
    const lightMaterial = new BABYLON.StandardMaterial("lightMaterial", scene);
    lightMaterial.emissiveColor = new BABYLON.Color3(1, 1, 0.9);
    lightMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    lightMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    
    for (let x = 0; x < numLightsX; x++) {
        for (let z = 0; z < numLightsZ; z++) {
            const posX = -floorSize/2 + gridSize/2 + x * gridSize;
            const posZ = -floorSize/2 + gridSize/2 + z * gridSize;
            
            // Skip lights in broken ceiling areas
            const isBrokenArea = (
                (x === 2 && z === 5) || 
                (x === 5 && z === 3) || 
                (x === 3 && z === 7) || 
                (x === 6 && z === 6)
            );
            
            if (!isBrokenArea) {
                // Create point light
                const light = new BABYLON.PointLight(
                    `ceilingLight_${x}_${z}`,
                    new BABYLON.Vector3(posX, ceilingHeight - 0.5, posZ),
                    scene
                );
                
                light.intensity = 20;
                light.diffuse = new BABYLON.Color3(1, 1, 0.95);
                light.specular = new BABYLON.Color3(1, 1, 0.95);
                light.range = 10;
                
                // Create light fixture
                const fixture = BABYLON.MeshBuilder.CreateCylinder(`lightFixture_${x}_${z}`, {
                    height: 0.2,
                    diameterTop: 0.8,
                    diameterBottom: 0.8,
                    tessellation: 16
                }, scene);
                
                fixture.position = new BABYLON.Vector3(posX, ceilingHeight - 0.1, posZ);
                fixture.material = lightMaterial;
                
                // Add subtle flicker to some lights
                if (Math.random() > 0.8) {
                    scene.registerBeforeRender(() => {
                        if (Math.random() > 0.98) {
                            light.intensity = 15 + Math.random() * 10;
                        }
                    });
                }
            }
        }
    }
    
    // Create emergency lights in corners
    const emergencyLightPositions = [
        { x: -28, z: 28 },
        { x: 28, z: 28 },
        { x: -28, z: -28 },
        { x: 28, z: -28 }
    ];
    
    emergencyLightPositions.forEach((pos, index) => {
        const light = new BABYLON.SpotLight(
            `emergencyLight_${index}`,
            new BABYLON.Vector3(pos.x, ceilingHeight - 1, pos.z),
            new BABYLON.Vector3(0, -1, 0),
            Math.PI/3,
            2,
            scene
        );
        
        light.intensity = 15;
        light.diffuse = new BABYLON.Color3(1, 0, 0);
        light.specular = new BABYLON.Color3(1, 0.2, 0.2);
        light.range = 30;
        
        // Create light housing
        const housing = BABYLON.MeshBuilder.CreateBox(`emergencyHousing_${index}`, {
            width: 0.5,
            height: 0.3,
            depth: 0.5
        }, scene);
        
        housing.position = new BABYLON.Vector3(pos.x, ceilingHeight - 0.85, pos.z);
        
        const housingMaterial = new BABYLON.StandardMaterial(`emergencyMat_${index}`, scene);
        housingMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        housingMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        housing.material = housingMaterial;
        
        // Add flashing animation
        let flashState = true;
        setInterval(() => {
            light.intensity = flashState ? 15 : 5;
            flashState = !flashState;
        }, 1000);
    });
    
    // Add directional light from windows (moonlight)
    const moonlight = new BABYLON.DirectionalLight("moonlight", 
        new BABYLON.Vector3(-0.5, -1, -0.5), scene);
    moonlight.intensity = 0.3;
    moonlight.diffuse = new BABYLON.Color3(0.3, 0.3, 0.5);
    moonlight.specular = new BABYLON.Color3(0.1, 0.1, 0.2);
    
    // Enable shadows from the moonlight
    moonlight.shadowEnabled = true;
    const shadowGenerator = new BABYLON.ShadowGenerator(1024, moonlight);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 32;
    shadowGenerator.setDarkness(0.4);
}