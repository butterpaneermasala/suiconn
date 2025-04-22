function createMaterials(scene) {
    // Floor material
    const floorMaterial = new BABYLON.StandardMaterial("floorMaterial", scene);
    floorMaterial.diffuseColor = new BABYLON.Color3(0.25, 0.24, 0.26);
    floorMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    floorMaterial.specularPower = 64;
    
    // Wall materials
    const wallMaterial = new BABYLON.StandardMaterial("wallMaterial", scene);
    wallMaterial.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.9);
    wallMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    
    const damagedWallMaterial = new BABYLON.StandardMaterial("damagedWallMaterial", scene);
    damagedWallMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.75, 0.7);
    damagedWallMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    
    // Glass material
    const glassMaterial = new BABYLON.PBRMaterial("glassMaterial", scene);
    glassMaterial.metallic = 0.0;
    glassMaterial.roughness = 0.05;
    glassMaterial.subSurface.isRefractionEnabled = true;
    glassMaterial.alpha = 0.5;
    glassMaterial.indexOfRefraction = 1.5;
    glassMaterial.albedoColor = new BABYLON.Color3(0.8, 0.9, 1.0);
  
    // Statue material
    const statueMaterial = new BABYLON.PBRMaterial("statueMaterial", scene);
    statueMaterial.metallic = 0;
    statueMaterial.roughness = 0.3;
    statueMaterial.albedoColor = new BABYLON.Color3(0.9, 0.88, 0.82);
    
    // Metal material
    const metalMaterial = new BABYLON.PBRMaterial("metalMaterial", scene);
    metalMaterial.metallic = 1.0;
    metalMaterial.roughness = 0.15;
    metalMaterial.albedoColor = new BABYLON.Color3(0.8, 0.8, 0.85);
  
    return {
      floorMaterial,
      wallMaterial,
      damagedWallMaterial,
      glassMaterial,
      statueMaterial,
      metalMaterial
    };
  }
  
  function createProceduralTextures(scene, materials) {
    // Marble texture for floor
    const marbleTexture = new BABYLON.ProceduralTexture("marbleTexture", 512, "marbleProceduralTexture", scene);
    marbleTexture.updateShaderUniforms = function() {
      marbleTexture.setFloat("numberOfTilesHeight", 6);
      marbleTexture.setFloat("numberOfTilesWidth", 6);
      marbleTexture.setColor3("mainColor", BABYLON.Color3.FromHexString("#CCCCCC"));
      marbleTexture.setColor3("lineColor", BABYLON.Color3.FromHexString("#888888"));
    };
    materials.floorMaterial.diffuseTexture = marbleTexture;
    
    // Plaster texture for walls
    const plasterProceduralTexture = new BABYLON.NoiseProceduralTexture("plasterNoise", 512, scene);
    plasterProceduralTexture.octaves = 4;
    plasterProceduralTexture.persistence = 0.2;
    plasterProceduralTexture.animationSpeedFactor = 0;
    plasterProceduralTexture.level = 0.9;
    materials.wallMaterial.bumpTexture = plasterProceduralTexture;
    materials.wallMaterial.bumpTexture.level = 0.3;
  
    // Damage texture for damaged walls
    const damageProceduralTexture = new BABYLON.NoiseProceduralTexture("damageNoise", 512, scene);
    damageProceduralTexture.octaves = 3;
    damageProceduralTexture.persistence = 0.5;
    damageProceduralTexture.animationSpeedFactor = 0;
    materials.damagedWallMaterial.diffuseTexture = damageProceduralTexture;
    materials.damagedWallMaterial.bumpTexture = damageProceduralTexture;
    materials.damagedWallMaterial.bumpTexture.level = 0.8;
  }