// ============================================================================
// COUNTER OPS: TACTICAL STRIKE - REALISTIC & LIVING 3D MAP BUILDER
// ============================================================================
window.CS = window.CS || {};

class MapBuilder {
  constructor() {
    this.colliders = [];
    this.raycastMeshes = [];
    this.waypoints = [];
    this.navNodes = [];
    this.bombsites = {};
    this.mysteryBoxes = [];
    this.spawns = { CT: [], T: [], DM: [] };
    this.mapBounds = { minX: -82, maxX: 82, minZ: -84, maxZ: 84 };
    this.currentMapId = 'de_sandstorm';

    // Dynamic animated world elements (wind sway, clouds, fans, fountain, dust)
    this.animatedWindMeshes = [];
    this.spinningMeshes = [];
    this.cloudGroups = [];
    this.fountainDrops = [];
    this.envParticles = null;
    this.reactorRings = [];
  }

  build(scene, mapId = 'de_sandstorm') {
    this.currentMapId = mapId;
    this.colliders = [];
    this.raycastMeshes = [];
    this.waypoints = [];
    this.navNodes = [];
    this.mysteryBoxes = [];
    this.animatedWindMeshes = [];
    this.spinningMeshes = [];
    this.cloudGroups = [];
    this.fountainDrops = [];
    this.reactorRings = [];
    this.envParticles = null;

    const mapCfg = CS.MAPS[mapId] || CS.MAPS.de_sandstorm;
    const theme = mapCfg.theme;

    const mapGroup = new THREE.Group();
    mapGroup.name = 'mapRoot';

    // ========================================================================
    // 1. ATMOSPHERIC SKY DOME, MOVING 3D CLOUDS, DISTANT MOUNTAINS & LIGHTING
    // ========================================================================
    scene.background = new THREE.Color(mapCfg.skyBottom);
    scene.fog = new THREE.FogExp2(mapCfg.fogColor, 0.0024);

    const skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(290, 32, 20),
      CS.textures.getSkyDomeMaterial(theme)
    );
    mapGroup.add(skyDome);

    // Drifting 3D Volumetric Cloud Clusters in the Sky
    const cloudMat = new THREE.MeshLambertMaterial({
      color: theme === 'facility' ? 0x64748b : 0xffffff,
      transparent: true,
      opacity: 0.78,
      fog: false
    });
    for (let c = 0; c < 18; c++) {
      const cGroup = new THREE.Group();
      const puffs = 4 + (c % 3);
      for (let p = 0; p < puffs; p++) {
        const puff = new THREE.Mesh(
          new THREE.SphereGeometry(5 + (p % 3) * 2.5, 10, 8),
          cloudMat
        );
        puff.scale.set(1.8, 0.55, 1.2);
        puff.position.set((p - 1.5) * 5.5, (p % 2) * 1.2, (p % 3 - 1) * 3.0);
        cGroup.add(puff);
      }
      cGroup.position.set(
        -180 + (c * 29) % 360,
        46 + (c % 4) * 7,
        -165 + ((c * 53) % 330)
      );
      cGroup.userData.speed = 1.2 + (c % 4) * 0.45;
      mapGroup.add(cGroup);
      this.cloudGroups.push(cGroup);
    }

    // Distant Mountain Range / Horizon Silhouette around the Map
    const mountainMat = new THREE.MeshLambertMaterial({
      color: theme === 'desert' ? 0x8c6d46 : (theme === 'industrial' ? 0x334155 : 0x0f172a)
    });
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const dist = 195 + (i % 3) * 22;
      const h = 34 + (i % 4) * 16;
      const mtn = new THREE.Mesh(new THREE.ConeGeometry(34 + (i % 3) * 12, h, 7), mountainMat);
      mtn.position.set(Math.cos(angle) * dist, h / 2 - 2, Math.sin(angle) * dist);
      mtn.rotation.y = i * 0.7;
      mapGroup.add(mtn);
    }

    // Lighting
    const hemiLight = new THREE.HemisphereLight(mapCfg.ambientColor, 0x3b4252, 0.78);
    hemiLight.position.set(0, 65, 0);
    mapGroup.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(mapCfg.sunColor, 1.15);
    sunLight.position.set(58, 88, 46);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 240;
    const d = 94;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    mapGroup.add(sunLight);

    // ========================================================================
    // 2. REALISTIC ENLARGED GROUND (168m x 172m)
    // ========================================================================
    const wallType = theme === 'desert' ? 'stucco_wall' : (theme === 'industrial' ? 'brick_wall' : 'metal_wall');
    const baseFloorType = theme === 'desert' ? 'desert_earth' : (theme === 'industrial' ? 'cobble_floor' : 'tread_floor');
    const roadType = theme === 'desert' ? 'stone_road' : (theme === 'industrial' ? 'stone_road' : 'tread_floor');
    const floorSurface = theme === 'facility' ? 'metal' : 'stone';

    // Base Terrain Ground
    const groundMat = CS.textures.getMaterial(baseFloorType, 26, 26);
    const ground = new THREE.Mesh(new THREE.BoxGeometry(168, 1, 172), groundMat);
    ground.position.set(0, -0.5, 0);
    ground.receiveShadow = true;
    mapGroup.add(ground);
    this.raycastMeshes.push(ground);

    const roadMat = CS.textures.getMaterial(roadType, 4, 24);
    const addRoadStrip = (rx, rz, rw, rd, mat = roadMat) => {
      const rMesh = new THREE.Mesh(new THREE.PlaneGeometry(rw, rd), mat);
      rMesh.rotation.x = -Math.PI / 2;
      rMesh.position.set(rx, 0.015, rz);
      rMesh.receiveShadow = true;
      mapGroup.add(rMesh);
    };

    // Helper: compute oriented bounding box (AABB) for rotated objects
    const getRotatedBounds = (w, d, rotY = 0) => {
      const cos = Math.abs(Math.cos(rotY));
      const sin = Math.abs(Math.sin(rotY));
      return {
        cw: w * cos + d * sin,
        cd: w * sin + d * cos
      };
    };

    // ========================================================================
    // 3. TACTICAL PREFABS: BOXES, STAIRS, ARCHWAYS, HOUSES, VEHICLES & COVER
    // ========================================================================
    const addBox = (x, y, z, w, h, d, matType = wallType, isSolid = true, surface = floorSurface) => {
      const repX = Math.max(1, Math.round(Math.max(w, d) / 4.5));
      const repY = Math.max(1, Math.round(h / 4.5));
      const mat = typeof matType === 'string' ? CS.textures.getMaterial(matType, repX, repY) : matType;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      mesh.position.set(x, y + h / 2, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mapGroup.add(mesh);
      if (isSolid) this.raycastMeshes.push(mesh);

      if (isSolid) {
        this.colliders.push({
          minX: x - w / 2, maxX: x + w / 2,
          minY: y,         maxY: y + h,
          minZ: z - d / 2, maxZ: z + d / 2,
          surface
        });
      }
      return mesh;
    };

    const addStairs = (x, z, w, d, totalH, steps = 6, dir = 'north', matType = roadType) => {
      const stepH = totalH / steps;
      const isZ = dir === 'north' || dir === 'south';
      const stepLen = (isZ ? d : w) / steps;
      for (let i = 0; i < steps; i++) {
        const curH = stepH * (i + 1);
        let sx = x, sz = z;
        if (dir === 'north') sz = (z + d / 2) - stepLen * (i + 0.5);
        else if (dir === 'south') sz = (z - d / 2) + stepLen * (i + 0.5);
        else if (dir === 'east') sx = (x - w / 2) + stepLen * (i + 0.5);
        else if (dir === 'west') sx = (x + w / 2) - stepLen * (i + 0.5);
        addBox(sx, 0, sz, isZ ? w : stepLen, curH, isZ ? stepLen : d, matType, true, floorSurface);
      }
    };

    // Detailed Archway with Stone Pillars, Trim, and Overhead Beams
    const addArchway = (x, z, totalW, doorW, h, thickness, rotateY = false) => {
      const sideW = (totalW - doorW) / 2;
      const doorH = 3.8;
      const lintelH = h - doorH;
      const trimMat = new THREE.MeshStandardMaterial({ color: 0x5c4732, roughness: 0.75 });

      if (!rotateY) {
        addBox(x - (doorW / 2 + sideW / 2), 0, z, sideW, h, thickness, wallType);
        addBox(x + (doorW / 2 + sideW / 2), 0, z, sideW, h, thickness, wallType);
        if (lintelH > 0.2) {
          addBox(x, doorH, z, doorW, lintelH, thickness, wallType);
          addBox(x, doorH - 0.15, z, doorW + 0.4, 0.25, thickness + 0.25, trimMat, false);
        }
      } else {
        addBox(x, 0, z - (doorW / 2 + sideW / 2), thickness, h, sideW, wallType);
        addBox(x, 0, z + (doorW / 2 + sideW / 2), thickness, h, sideW, wallType);
        if (lintelH > 0.2) {
          addBox(x, doorH, z, thickness, lintelH, doorW, wallType);
          addBox(x, doorH - 0.15, z, thickness + 0.25, 0.25, doorW + 0.4, trimMat, false);
        }
      }
    };

    // --- REALISTIC MULTI-STORY HOUSE BUILDER ---
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a5f, emissive: 0x0f172a, emissiveIntensity: 0.25, metalness: 0.9, roughness: 0.12
    });
    const litWindowMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 0.65, roughness: 0.2
    });
    const woodFrameMat = new THREE.MeshStandardMaterial({ color: 0x4a3219, roughness: 0.8 });
    const shutterMat = new THREE.MeshStandardMaterial({ color: theme === 'desert' ? 0x1d4ed8 : 0x15803d, roughness: 0.7 });
    const roofMat = CS.textures.getMaterial('roof_tiles', 3, 2);

    const addDetailedHouse = (x, z, w, h, d, wallMatName = wallType, hasPitchedRoof = true, awningType = 'awning_red') => {
      addBox(x, 0, z, w, h, d, wallMatName, true, 'stone');

      const trimMat = new THREE.MeshStandardMaterial({ color: 0x786856, roughness: 0.85 });
      addBox(x, 0, z, w + 0.25, 0.65, d + 0.25, trimMat, false);
      addBox(x, h - 0.25, z, w + 0.35, 0.3, d + 0.35, trimMat, false);

      if (hasPitchedRoof && theme !== 'facility') {
        const eave = new THREE.Mesh(new THREE.BoxGeometry(w + 0.85, 0.38, d + 0.85), roofMat);
        eave.position.set(x, h + 0.19, z);
        eave.castShadow = true;
        mapGroup.add(eave);

        const tier1 = new THREE.Mesh(new THREE.BoxGeometry(w * 0.78, 0.65, d * 0.88), roofMat);
        tier1.position.set(x, h + 0.68, z);
        tier1.castShadow = true;
        mapGroup.add(tier1);

        const tier2 = new THREE.Mesh(new THREE.BoxGeometry(w * 0.48, 0.55, d * 0.74), roofMat);
        tier2.position.set(x, h + 1.25, z);
        tier2.castShadow = true;
        mapGroup.add(tier2);
      } else {
        addBox(x, h, z - d / 2 + 0.2, w, 0.65, 0.3, wallMatName, false);
        addBox(x, h, z + d / 2 - 0.2, w, 0.65, 0.3, wallMatName, false);
      }

      // Rooftop AC Unit with Spinning Turbine Fan
      const acBox = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.85, 0.85),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, roughness: 0.4 })
      );
      acBox.position.set(x, h + 1.65, z - d * 0.2);
      mapGroup.add(acBox);

      const fanBlade = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 0.08, 0.16),
        new THREE.MeshStandardMaterial({ color: 0x1e293b })
      );
      fanBlade.position.set(x, h + 2.12, z - d * 0.2);
      mapGroup.add(fanBlade);
      this.spinningMeshes.push({ mesh: fanBlade, axis: 'y', speed: 8.5 });

      // Facades along X-walls
      const numZCols = Math.max(1, Math.floor(d / 4.8));
      const zSpacing = d / (numZCols + 1);

      [-1, 1].forEach(sideX => {
        const faceX = x + sideX * (w / 2 + 0.04);
        for (let c = 1; c <= numZCols; c++) {
          const wz = (z - d / 2) + c * zSpacing;

          if (h >= 5.8) {
            const isLit = (c + Math.round(z)) % 3 === 0;
            const winFrame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.55, 1.25), woodFrameMat);
            winFrame.position.set(faceX, 4.7, wz);
            mapGroup.add(winFrame);

            const pane = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.35, 1.05), isLit ? litWindowMat : glassMat);
            pane.position.set(faceX, 4.7, wz);
            mapGroup.add(pane);

            const shL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.48, 0.32), shutterMat);
            shL.position.set(faceX, 4.7, wz - 0.78);
            mapGroup.add(shL);
            const shR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.48, 0.32), shutterMat);
            shR.position.set(faceX, 4.7, wz + 0.78);
            mapGroup.add(shR);

            const fBox = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.24, 1.32), woodFrameMat);
            fBox.position.set(faceX + sideX * 0.14, 3.82, wz);
            mapGroup.add(fBox);
            const plant = new THREE.Mesh(
              new THREE.SphereGeometry(0.24, 8, 6),
              new THREE.MeshLambertMaterial({ color: 0x2e7d32 })
            );
            plant.scale.set(1.0, 0.9, 2.3);
            plant.position.set(faceX + sideX * 0.16, 4.02, wz);
            mapGroup.add(plant);
          }

          if (c % 2 === 1) {
            const door = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.35, 1.35), woodFrameMat);
            door.position.set(faceX, 1.18, wz);
            mapGroup.add(door);
          } else if (awningType) {
            const awnMat = CS.textures.getMaterial(awningType, 2, 1);
            const awning = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.12, 2.8), awnMat);
            awning.position.set(faceX + sideX * 0.68, 2.95, wz);
            awning.rotation.z = -sideX * 0.28;
            awning.castShadow = true;
            mapGroup.add(awning);
            this.animatedWindMeshes.push({
              mesh: awning,
              baseRotX: 0,
              baseRotZ: awning.rotation.z,
              phase: wz * 0.3 + x * 0.2,
              amp: 0.045
            });
          }
        }
      });
    };

    // --- REALISTIC TREES, PALMS, CYPRESSES & BUSHES ---
    const addTree = (tx, tz, type = 'palm') => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(tx, 0, tz);

      const planterMat = new THREE.MeshStandardMaterial({ color: 0x786856, roughness: 0.85 });
      const planter = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.25, 0.38, 12), planterMat);
      planter.position.y = 0.19;
      planter.receiveShadow = true;
      treeGroup.add(planter);

      const soil = new THREE.Mesh(
        new THREE.CylinderGeometry(1.02, 1.02, 0.41, 12),
        CS.textures.getMaterial('grass_ground', 1, 1)
      );
      soil.position.y = 0.19;
      treeGroup.add(soil);

      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4028, roughness: 0.92 });
      const leafMat1 = new THREE.MeshStandardMaterial({ color: 0x2e6f3e, roughness: 0.68, side: THREE.DoubleSide });
      const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x3f8f4e, roughness: 0.65, side: THREE.DoubleSide });

      if (type === 'palm') {
        for (let s = 0; s < 7; s++) {
          const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.28 - s * 0.018, 0.32 - s * 0.018, 1.15, 10), trunkMat);
          seg.position.set(Math.sin(s * 0.25) * 0.25, 0.55 + s * 1.02, 0);
          seg.rotation.z = -Math.cos(s * 0.25) * 0.06;
          seg.castShadow = true;
          treeGroup.add(seg);
        }
        const crown = new THREE.Group();
        crown.position.set(Math.sin(1.5) * 0.25, 7.6, 0);
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * Math.PI * 2;
          const frondGroup = new THREE.Group();
          frondGroup.rotation.y = a;
          for (let seg = 0; seg < 3; seg++) {
            const leaf = new THREE.Mesh(
              new THREE.BoxGeometry(0.82 - seg * 0.18, 0.06, 1.35),
              i % 2 === 0 ? leafMat1 : leafMat2
            );
            leaf.position.set(0, -seg * 0.28, -0.75 - seg * 1.15);
            leaf.rotation.x = -0.22 - seg * 0.24;
            leaf.castShadow = true;
            frondGroup.add(leaf);
          }
          crown.add(frondGroup);
        }
        treeGroup.add(crown);
        this.animatedWindMeshes.push({ mesh: crown, baseRotX: 0, baseRotZ: 0, phase: tx + tz, amp: 0.06 });
      } else if (type === 'cypress') {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.34, 2.5, 10), trunkMat);
        trunk.position.y = 1.25;
        treeGroup.add(trunk);

        const foliageGroup = new THREE.Group();
        foliageGroup.position.y = 2.2;
        for (let l = 0; l < 5; l++) {
          const cone = new THREE.Mesh(
            new THREE.ConeGeometry(1.35 - l * 0.2, 2.6, 10),
            l % 2 === 0 ? leafMat1 : leafMat2
          );
          cone.position.y = l * 1.35 + 1.0;
          cone.castShadow = true;
          foliageGroup.add(cone);
        }
        treeGroup.add(foliageGroup);
        this.animatedWindMeshes.push({ mesh: foliageGroup, baseRotX: 0, baseRotZ: 0, phase: tx * 0.5, amp: 0.04 });
      } else {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.45, 3.4, 10), trunkMat);
        trunk.position.y = 1.7;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        const canopy = new THREE.Group();
        canopy.position.y = 4.2;
        const offsets = [
          [0, 0.8, 0, 2.2], [-1.3, 0.2, 0.8, 1.7], [1.3, 0.3, -0.7, 1.8],
          [0.8, 0.1, 1.2, 1.6], [-1.0, 0.4, -1.1, 1.7], [0, 1.6, 0.2, 1.6]
        ];
        offsets.forEach(([ox, oy, oz, rad], idx) => {
          const blob = new THREE.Mesh(
            new THREE.DodecahedronGeometry(rad, 1),
            idx % 2 === 0 ? leafMat1 : leafMat2
          );
          blob.scale.y = 0.78;
          blob.position.set(ox, oy, oz);
          blob.castShadow = true;
          canopy.add(blob);
        });
        treeGroup.add(canopy);
        this.animatedWindMeshes.push({ mesh: canopy, baseRotX: 0, baseRotZ: 0, phase: tx + tz, amp: 0.045 });
      }

      mapGroup.add(treeGroup);
      this.colliders.push({
        minX: tx - 0.55, maxX: tx + 0.55,
        minY: 0, maxY: 6.5,
        minZ: tz - 0.55, maxZ: tz + 0.55,
        surface: 'wood'
      });
    };

    const addBushCluster = (bx, bz, scale = 1.0) => {
      const bushGroup = new THREE.Group();
      bushGroup.position.set(bx, 0, bz);
      const bMat1 = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });
      const bMat2 = new THREE.MeshLambertMaterial({ color: 0x43a047 });
      const flowerMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

      for (let i = 0; i < 4; i++) {
        const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55 * scale, 1), i % 2 === 0 ? bMat1 : bMat2);
        puff.position.set((i - 1.5) * 0.35 * scale, 0.42 * scale, (i % 2) * 0.25 * scale);
        puff.castShadow = true;
        bushGroup.add(puff);
      }
      for (let f = 0; f < 5; f++) {
        const fl = new THREE.Mesh(new THREE.SphereGeometry(0.08 * scale, 6, 6), flowerMat);
        fl.position.set((f - 2) * 0.28 * scale, 0.75 * scale, ((f * 3) % 2 - 0.5) * 0.35 * scale);
        bushGroup.add(fl);
      }
      mapGroup.add(bushGroup);
      this.animatedWindMeshes.push({ mesh: bushGroup, baseRotX: 0, baseRotZ: 0, phase: bx * 0.8 + bz, amp: 0.05 });
    };

    // --- PARKED TACTICAL TRUCK / VAN (HEAVY COVER OBJECT) ---
    const addParkedVehicle = (vx, vz, rotY = 0, bodyColor = 0x3b4d3b) => {
      const vGroup = new THREE.Group();
      vGroup.position.set(vx, 0, vz);
      vGroup.rotation.y = rotY;

      const paintMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.35, metalness: 0.6 });
      const darkSteel = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.5 });
      const tireMat = new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.9 });
      const hlMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

      const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.25, 1.05, 4.8), paintMat);
      chassis.position.set(0, 0.85, 0);
      chassis.castShadow = true;
      chassis.receiveShadow = true;
      vGroup.add(chassis);
      this.raycastMeshes.push(chassis);

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.95, 2.2), paintMat);
      cabin.position.set(0, 1.82, -0.5);
      cabin.castShadow = true;
      vGroup.add(cabin);
      this.raycastMeshes.push(cabin);

      const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.72, 2.26), glassMat);
      windshield.position.set(0, 1.85, -0.5);
      vGroup.add(windshield);

      const bumperF = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.28, 0.3), darkSteel);
      bumperF.position.set(0, 0.5, -2.42);
      vGroup.add(bumperF);

      [-0.75, 0.75].forEach(hx => {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.08), hlMat);
        hl.position.set(hx, 0.95, -2.41);
        vGroup.add(hl);
      });

      [[-1.12, -1.55], [1.12, -1.55], [-1.12, 1.55], [1.12, 1.55]].forEach(([wx, wz]) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.32, 14), tireMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.42, wz);
        vGroup.add(wheel);
      });

      mapGroup.add(vGroup);
      const { cw, cd } = getRotatedBounds(2.35, 4.85, rotY);
      this.colliders.push({
        minX: vx - cw / 2, maxX: vx + cw / 2,
        minY: 0, maxY: 2.3,
        minZ: vz - cd / 2, maxZ: vz + cd / 2,
        surface: 'metal'
      });
    };

    // --- CIVILIAN SEDAN / HATCHBACK CAR ---
    const addCivCar = (cx, cz, rotY = 0, bodyColor = 0x1e3a8a) => {
      const cGroup = new THREE.Group();
      cGroup.position.set(cx, 0, cz);
      cGroup.rotation.y = rotY;

      const paintMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.35, metalness: 0.65 });
      const darkSteel = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
      const tireMat = new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.92 });
      const hlMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const tlMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.65, 4.4), paintMat);
      body.position.y = 0.65;
      body.castShadow = true;
      body.receiveShadow = true;
      cGroup.add(body);
      this.raycastMeshes.push(body);

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.68, 2.35), paintMat);
      cabin.position.set(0, 1.25, -0.15);
      cabin.castShadow = true;
      cGroup.add(cabin);
      this.raycastMeshes.push(cabin);

      const glass = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.55, 2.42), glassMat);
      glass.position.set(0, 1.25, -0.15);
      cGroup.add(glass);

      const fBump = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.26, 0.25), darkSteel);
      fBump.position.set(0, 0.45, -2.25);
      cGroup.add(fBump);

      [-0.72, 0.72].forEach(hx => {
        const hl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.08), hlMat);
        hl.position.set(hx, 0.72, -2.22);
        cGroup.add(hl);
        const tl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.08), tlMat);
        tl.position.set(hx, 0.74, 2.22);
        cGroup.add(tl);
      });

      [[-1.08, -1.35], [1.08, -1.35], [-1.08, 1.35], [1.08, 1.35]].forEach(([wx, wz]) => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.28, 14), tireMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx, 0.36, wz);
        cGroup.add(wheel);
      });

      mapGroup.add(cGroup);
      const { cw, cd } = getRotatedBounds(2.2, 4.5, rotY);
      this.colliders.push({
        minX: cx - cw / 2, maxX: cx + cw / 2,
        minY: 0, maxY: 1.65,
        minZ: cz - cd / 2, maxZ: cz + cd / 2,
        surface: 'metal'
      });
    };

    // --- CONCRETE JERSEY SAFETY BARRIER ---
    const addJerseyBarrier = (sx, sy, sz, rotY = 0) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(sx, sy, sz);
      bGroup.rotation.y = rotY;

      const barMat = CS.textures.getMaterial('concrete_barrier', 1, 1);
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.15, 0.65), barMat);
      body.position.y = 0.575;
      body.castShadow = true;
      body.receiveShadow = true;
      bGroup.add(body);
      this.raycastMeshes.push(body);

      const topBevel = new THREE.Mesh(
        new THREE.BoxGeometry(2.58, 0.12, 0.35),
        new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 })
      );
      topBevel.position.y = 1.18;
      bGroup.add(topBevel);

      mapGroup.add(bGroup);

      const { cw, cd } = getRotatedBounds(2.6, 0.7, rotY);
      this.colliders.push({
        minX: sx - cw / 2, maxX: sx + cw / 2,
        minY: sy, maxY: sy + 1.18,
        minZ: sz - cd / 2, maxZ: sz + cd / 2,
        surface: 'stone'
      });
    };

    // --- SHIPPING CONTAINER (20FT OR 40FT) ---
    const addShippingContainer = (cx, cy, cz, rotY = 0, colorType = 'container_blue', isLong = false) => {
      const cGroup = new THREE.Group();
      cGroup.position.set(cx, cy, cz);
      cGroup.rotation.y = rotY;

      const len = isLong ? 11.5 : 6.4;
      const cMat = CS.textures.getMaterial(colorType, Math.round(len / 3.2), 1);
      const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.6 });

      const box = new THREE.Mesh(new THREE.BoxGeometry(2.7, 2.75, len), cMat);
      box.position.y = 1.375;
      box.castShadow = true;
      box.receiveShadow = true;
      cGroup.add(box);
      this.raycastMeshes.push(box);

      [[-1.36, -len / 2], [1.36, -len / 2], [-1.36, len / 2], [1.36, len / 2]].forEach(([px, pz]) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.8, 0.18), steelMat);
        post.position.set(px, 1.4, pz);
        cGroup.add(post);
      });

      [-0.45, 0.45].forEach(dx => {
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.5, 6), steelMat);
        rod.position.set(dx, 1.4, len / 2 + 0.06);
        cGroup.add(rod);
      });

      mapGroup.add(cGroup);

      const { cw, cd } = getRotatedBounds(2.8, len, rotY);
      this.colliders.push({
        minX: cx - cw / 2, maxX: cx + cw / 2,
        minY: cy, maxY: cy + 2.8,
        minZ: cz - cd / 2, maxZ: cz + cd / 2,
        surface: 'metal'
      });
    };

    // --- MARKET STALL WITH FABRIC AWNING ---
    const addMarketStall = (mx, mz, rotY = 0, awningType = 'awning_red') => {
      const sGroup = new THREE.Group();
      sGroup.position.set(mx, 0, mz);
      sGroup.rotation.y = rotY;

      const woodMat = new THREE.MeshStandardMaterial({ color: 0x614126, roughness: 0.85 });
      const tableMat = CS.textures.getMaterial('wood_crate', 1, 1);
      const awnMat = CS.textures.getMaterial(awningType, 2, 1);

      const table = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.95, 1.6), tableMat);
      table.position.y = 0.475;
      table.castShadow = true;
      table.receiveShadow = true;
      sGroup.add(table);
      this.raycastMeshes.push(table);

      [[-1.3, -0.75], [1.3, -0.75], [-1.3, 0.75], [1.3, 0.75]].forEach(([px, pz]) => {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.7, 6), woodMat);
        pole.position.set(px, 1.35, pz);
        sGroup.add(pole);
      });

      const awning = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.08, 2.0), awnMat);
      awning.position.set(0, 2.65, 0);
      awning.rotation.x = -0.15;
      awning.castShadow = true;
      sGroup.add(awning);
      this.animatedWindMeshes.push({
        mesh: awning,
        baseRotX: awning.rotation.x,
        baseRotZ: 0,
        phase: mx * 0.4 + mz,
        amp: 0.05
      });

      const potMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6 });
      [-0.7, 0.1, 0.7].forEach(gx => {
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.12, 0.38, 8), potMat);
        pot.position.set(gx, 1.14, 0);
        sGroup.add(pot);
      });

      mapGroup.add(sGroup);

      const { cw, cd } = getRotatedBounds(2.9, 1.8, rotY);
      this.colliders.push({
        minX: mx - cw / 2, maxX: mx + cw / 2,
        minY: 0, maxY: 1.05,
        minZ: mz - cd / 2, maxZ: mz + cd / 2,
        surface: 'wood'
      });
    };

    // --- INDUSTRIAL DUMPSTER ---
    const addDumpster = (dx, dy, dz, rotY = 0, color = 0x1e3a29) => {
      const dGroup = new THREE.Group();
      dGroup.position.set(dx, dy, dz);
      dGroup.rotation.y = rotY;

      const dMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.5 });
      const lidMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 });
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });

      const bin = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.25, 1.45), dMat);
      bin.position.y = 0.74;
      bin.castShadow = true;
      bin.receiveShadow = true;
      dGroup.add(bin);
      this.raycastMeshes.push(bin);

      const lidL = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.1, 1.48), lidMat);
      lidL.position.set(-0.56, 1.41, 0);
      lidL.rotation.z = 0.08;
      dGroup.add(lidL);

      const lidR = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.1, 1.48), lidMat);
      lidR.position.set(0.56, 1.41, 0);
      lidR.rotation.z = -0.08;
      dGroup.add(lidR);

      [[-0.95, -0.6], [0.95, -0.6], [-0.95, 0.6], [0.95, 0.6]].forEach(([wx, wz]) => {
        const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 8), wheelMat);
        wh.rotation.z = Math.PI / 2;
        wh.position.set(wx, 0.12, wz);
        dGroup.add(wh);
      });

      mapGroup.add(dGroup);

      const { cw, cd } = getRotatedBounds(2.35, 1.5, rotY);
      this.colliders.push({
        minX: dx - cw / 2, maxX: dx + cw / 2,
        minY: dy, maxY: dy + 1.48,
        minZ: dz - cd / 2, maxZ: dz + cd / 2,
        surface: 'metal'
      });
    };

    // --- WOODEN PALLET STACK & TARP ---
    const addPalletStack = (px, py, pz, rotY = 0) => {
      const pGroup = new THREE.Group();
      pGroup.position.set(px, py, pz);
      pGroup.rotation.y = rotY;

      const pMat = CS.textures.getMaterial('wood_crate', 1, 1);
      const tarpMat = CS.textures.getMaterial('camo_tarp', 1, 1);

      for (let i = 0; i < 3; i++) {
        const pal = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.18, 1.8), pMat);
        pal.position.y = 0.09 + i * 0.18;
        pal.castShadow = true;
        pGroup.add(pal);
      }

      const topBundle = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.95, 1.65), tarpMat);
      topBundle.position.y = 0.54 + 0.475;
      topBundle.castShadow = true;
      topBundle.receiveShadow = true;
      pGroup.add(topBundle);
      this.raycastMeshes.push(topBundle);

      mapGroup.add(pGroup);

      const { cw, cd } = getRotatedBounds(1.85, 1.85, rotY);
      this.colliders.push({
        minX: px - cw / 2, maxX: px + cw / 2,
        minY: py, maxY: py + 1.55,
        minZ: pz - cd / 2, maxZ: pz + cd / 2,
        surface: 'wood'
      });
    };

    // --- MOBILE TACTICAL DIESEL GENERATOR ---
    const addGeneratorUnit = (gx, gy, gz, rotY = 0) => {
      const gGroup = new THREE.Group();
      gGroup.position.set(gx, gy, gz);
      gGroup.rotation.y = rotY;

      const genMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.45, metalness: 0.55 });
      const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.6 });

      const skid = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.22, 2.45), steelMat);
      skid.position.y = 0.11;
      gGroup.add(skid);

      const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.35, 2.3), genMat);
      body.position.y = 0.895;
      body.castShadow = true;
      body.receiveShadow = true;
      gGroup.add(body);
      this.raycastMeshes.push(body);

      const exh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.85, 8), steelMat);
      exh.position.set(0.45, 1.85, -0.6);
      gGroup.add(exh);

      mapGroup.add(gGroup);

      const { cw, cd } = getRotatedBounds(1.85, 2.45, rotY);
      this.colliders.push({
        minX: gx - cw / 2, maxX: gx + cw / 2,
        minY: gy, maxY: gy + 1.65,
        minZ: gz - cd / 2, maxZ: gz + cd / 2,
        surface: 'metal'
      });
    };

    // --- LOW COMPOUND WALL (TACTICAL HALF-WALL COVER) ---
    const addLowWall = (wx, wy, wz, w, h = 1.25, d = 0.8, matType = wallType) => {
      addBox(wx, wy, wz, w, h, d, matType, true, 'stone');
      const capMat = new THREE.MeshStandardMaterial({ color: 0x786856, roughness: 0.8 });
      addBox(wx, wy + h, wz, w + 0.15, 0.16, d + 0.15, capMat, false);
    };

    // --- STREET LAMP POST ---
    const addStreetLamp = (lx, lz, h = 5.2) => {
      const lGroup = new THREE.Group();
      lGroup.position.set(lx, 0, lz);

      const poleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.4 });
      const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 0.5, 8), poleMat);
      base.position.y = 0.25;
      lGroup.add(base);

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, h, 8), poleMat);
      pole.position.y = h / 2;
      lGroup.add(pole);

      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.08), poleMat);
      arm.position.set(0.35, h - 0.1, 0);
      lGroup.add(arm);

      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), bulbMat);
      bulb.position.set(0.72, h - 0.32, 0);
      lGroup.add(bulb);

      mapGroup.add(lGroup);

      this.colliders.push({
        minX: lx - 0.35, maxX: lx + 0.35,
        minY: 0, maxY: h,
        minZ: lz - 0.35, maxZ: lz + 0.35,
        surface: 'metal'
      });
    };

    // --- SANDBAG BARRICADE & BARREL CLUSTERS ---
    const addSandbags = (sx, sy, sz, rotY = 0) => {
      const sbGroup = new THREE.Group();
      sbGroup.position.set(sx, sy, sz);
      sbGroup.rotation.y = rotY;
      const bagMat = new THREE.MeshStandardMaterial({ color: 0xb59e72, roughness: 0.95 });
      for (let row = 0; row < 3; row++) {
        for (let col = -1; col <= 1; col++) {
          const bag = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.34, 0.48), bagMat);
          bag.position.set(col * 0.82 + (row % 2) * 0.15, 0.17 + row * 0.32, 0);
          bag.castShadow = true;
          sbGroup.add(bag);
        }
      }
      mapGroup.add(sbGroup);
      const { cw, cd } = getRotatedBounds(2.6, 1.0, rotY);
      this.colliders.push({
        minX: sx - cw / 2, maxX: sx + cw / 2,
        minY: sy, maxY: sy + 1.05,
        minZ: sz - cd / 2, maxZ: sz + cd / 2,
        surface: 'stone'
      });
    };

    const addBarrelCluster = (bx, by, bz) => {
      const bMat1 = new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.4, metalness: 0.65 });
      const bMat2 = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.4, metalness: 0.65 });
      [[0, 0, bMat1], [0.85, 0.2, bMat2], [0.35, 0.82, bMat1]].forEach(([ox, oz, mat]) => {
        const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 1.25, 14), mat);
        cyl.position.set(bx + ox, by + 0.625, bz + oz);
        cyl.castShadow = true;
        cyl.receiveShadow = true;
        mapGroup.add(cyl);
        this.raycastMeshes.push(cyl);
      });
      this.colliders.push({
        minX: bx - 0.45, maxX: bx + 1.25,
        minY: by, maxY: by + 1.28,
        minZ: bz - 0.45, maxZ: bz + 1.25,
        surface: 'metal'
      });
    };

    const addOverheadCable = (x1, y1, z1, x2, y2, z2, withLanterns = true) => {
      const pts = [];
      const segs = 10;
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const sag = Math.sin(t * Math.PI) * 1.1;
        pts.push(new THREE.Vector3(
          x1 + (x2 - x1) * t,
          y1 + (y2 - y1) * t - sag,
          z1 + (z2 - z1) * t
        ));
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x1e293b }));
      mapGroup.add(line);

      if (withLanterns) {
        const midPt = pts[5];
        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xfef08a })
        );
        bulb.position.copy(midPt);
        mapGroup.add(bulb);
      }
    };

    // --- ENTERABLE BUILDING / BUNKER ROOM WITH DOORWAYS & SHOOT-THROUGH WINDOWS ---
    // wallsSpec: { N: 'solid'|'door'|'wideDoor'|'window'|'open', S: ..., E: ..., W: ... }
    const addEnterableBuilding = (cx, cy, cz, w, h, d, wallsSpec = {}, wallMatName = wallType, roofMatName = wallType, hasRoof = true) => {
      const t = 1.0; // Wall thickness
      const doorW = Math.min(4.2, Math.max(3.2, Math.min(w, d) * 0.42));
      const wideDoorW = Math.min(7.2, Math.max(4.8, Math.min(w, d) * 0.58));
      const doorH = Math.min(3.6, h - 0.6);
      const winW = Math.min(4.2, Math.max(2.6, Math.min(w, d) * 0.42));
      const sillH = 1.15; // Waist-high cover sill you can shoot over!
      const winTop = Math.min(2.65, h - 0.6);
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7, metalness: 0.3 });

      const buildWallSpan = (wx, wz, spanLen, alongZ, mode = 'solid') => {
        if (mode === 'open') return;
        if (mode === 'solid') {
          addBox(wx, cy, wz, alongZ ? t : spanLen, h, alongZ ? spanLen : t, wallMatName, true, floorSurface);
          return;
        }
        const openW = mode === 'wideDoor' ? Math.min(wideDoorW, spanLen - 1.6) : (mode === 'door' ? Math.min(doorW, spanLen - 1.6) : Math.min(winW, spanLen - 1.6));
        const sideLen = Math.max(0.6, (spanLen - openW) / 2);
        const offset = openW / 2 + sideLen / 2;

        if (!alongZ) {
          addBox(wx - offset, cy, wz, sideLen, h, t, wallMatName, true, floorSurface);
          addBox(wx + offset, cy, wz, sideLen, h, t, wallMatName, true, floorSurface);
          if (mode === 'door' || mode === 'wideDoor') {
            if (h > doorH + 0.15) addBox(wx, cy + doorH, wz, openW, h - doorH, t, wallMatName, true, floorSurface);
            addBox(wx, cy + doorH - 0.1, wz, openW + 0.2, 0.18, t + 0.16, frameMat, false);
          } else if (mode === 'window') {
            addBox(wx, cy, wz, openW, sillH, t, wallMatName, true, floorSurface);
            if (h > winTop + 0.15) addBox(wx, cy + winTop, wz, openW, h - winTop, t, wallMatName, true, floorSurface);
            addBox(wx, cy + sillH, wz, openW + 0.16, 0.12, t + 0.18, frameMat, false);
          }
        } else {
          addBox(wx, cy, wz - offset, t, h, sideLen, wallMatName, true, floorSurface);
          addBox(wx, cy, wz + offset, t, h, sideLen, wallMatName, true, floorSurface);
          if (mode === 'door' || mode === 'wideDoor') {
            if (h > doorH + 0.15) addBox(wx, cy + doorH, wz, t, h - doorH, openW, wallMatName, true, floorSurface);
            addBox(wx, cy + doorH - 0.1, wz, t + 0.16, 0.18, openW + 0.2, frameMat, false);
          } else if (mode === 'window') {
            addBox(wx, cy, wz, t, sillH, openW, wallMatName, true, floorSurface);
            if (h > winTop + 0.15) addBox(wx, cy + winTop, wz, t, h - winTop, openW, wallMatName, true, floorSurface);
            addBox(wx, cy + sillH, wz, t + 0.18, 0.12, openW + 0.16, frameMat, false);
          }
        }
      };

      buildWallSpan(cx, cz - d / 2 + t / 2, w, false, wallsSpec.N || 'solid');
      buildWallSpan(cx, cz + d / 2 - t / 2, w, false, wallsSpec.S || 'solid');
      buildWallSpan(cx - w / 2 + t / 2, cz, d - t * 2, true, wallsSpec.W || 'solid');
      buildWallSpan(cx + w / 2 - t / 2, cz, d - t * 2, true, wallsSpec.E || 'solid');

      if (hasRoof) {
        addBox(cx, cy + h, cz, w + 0.4, 0.55, d + 0.4, roofMatName, true, floorSurface);
        // Warm interior ceiling lamp
        const bulb = new THREE.Mesh(
          new THREE.BoxGeometry(0.9, 0.12, 0.35),
          new THREE.MeshBasicMaterial({ color: 0xfef08a })
        );
        bulb.position.set(cx, cy + h - 0.08, cz);
        mapGroup.add(bulb);
      }
    };

    // --- COLONNADE / PILLAR ARCADE ROW ---
    const addPillarArcade = (x1, z1, x2, z2, count = 4, y = 0, h = 4.6, matType = wallType) => {
      const dx = x2 - x1;
      const dz = z2 - z1;
      const len = Math.hypot(dx, dz);
      const rotY = Math.atan2(dx, dz);
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0.5 : i / (count - 1);
        addBox(x1 + dx * t, y, z1 + dz * t, 1.15, h, 1.15, matType, true, floorSurface);
      }
      // Overhead lintel beam connecting the pillars (high enough to walk under)
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(1.35, 0.75, len + 1.35),
        CS.textures.getMaterial(matType, Math.max(1, Math.round(len / 4)), 1)
      );
      beam.position.set((x1 + x2) / 2, y + h + 0.375, (z1 + z2) / 2);
      beam.rotation.y = rotY;
      beam.castShadow = true;
      mapGroup.add(beam);
    };

    // --- CALLOUT SIGNBOARD ON WALLS ---
    const addTacticalSign = (sx, sy, sz, rotY = 0, label = 'SECTOR A', accent = '#f59e0b') => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 64;
      const ctx = c.getContext('2d');
      if (ctx && ctx.fillRect) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 256, 64);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 5;
        ctx.strokeRect(4, 4, 248, 56);
        ctx.fillStyle = accent;
        ctx.font = 'bold 26px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 128, 33);
      }
      const tex = new THREE.CanvasTexture(c);
      const mat = new THREE.MeshBasicMaterial({ map: tex });
      const sign = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.62, 0.08), mat);
      sign.position.set(sx, sy, sz);
      sign.rotation.y = rotY;
      mapGroup.add(sign);
    };

    // ========================================================================
    // 4. OUTER PERIMETER BOUNDARY WALLS
    // ========================================================================
    const wallH = 9.5;
    addBox(0, 0, -84, 168, wallH, 2.5, wallType);
    addBox(0, 0, 84, 168, wallH, 2.5, wallType);
    addBox(-83, 0, 0, 2.5, wallH, 170, wallType);
    addBox(83, 0, 0, 2.5, wallH, 170, wallType);

    const houseMat1 = theme === 'desert' ? 'stucco_wall' : (theme === 'industrial' ? 'brick_wall' : 'metal_wall');
    const houseMat2 = theme === 'desert' ? 'stucco_ochre' : (theme === 'industrial' ? 'stucco_white' : 'metal_wall');

    // ========================================================================
    // 5. DISTINCT ARCHITECTURAL LAYOUT PER MAP!
    // ========================================================================
    if (mapId === 'de_sandstorm') {
      // ======================================================================
      // MAP 1: DE_SANDSTORM (TACTICAL DESERT CASBAH, PALACE, WINDOW & BAZAAR)
      // ======================================================================
      addBox(76, 0, 0, 12, wallH, 168, houseMat1);  // East outer seal
      addBox(-76, 0, 0, 12, wallH, 168, houseMat2); // West outer seal
      addBox(0, 0, -79, 168, wallH, 8, houseMat1);  // North outer seal
      addBox(0, 0, 79, 168, wallH, 8, houseMat2);   // South outer seal

      // Paved Roads & Cobble Plazas
      addRoadStrip(0, 0, 10.5, 136);
      addRoadStrip(48, 4, 11.5, 118);
      addRoadStrip(-48, 4, 11.0, 118);
      addRoadStrip(0, -60, 114, 10.0, CS.textures.getMaterial(roadType, 18, 2));
      addRoadStrip(0, 60, 114, 10.0, CS.textures.getMaterial(roadType, 18, 2));
      addRoadStrip(0, -8, 108, 8.0, CS.textures.getMaterial(roadType, 16, 2));

      // --- 1. CT SPAWN MILITARY COMPOUND & SIGHTLINE BLOCKERS ---
      addBox(0, 0, -74, 106, 6.0, 2.2, houseMat1);
      addBox(0, 0, -70, 13, 4.4, 5.5, houseMat2); // CT Command Post
      // Compound Partition Wings (choke CT exits into 3 structured gates)
      addArchway(-24, -56, 24, 7.5, 6.2, 2.2, false); // CT West Gate to B
      addArchway(24, -56, 24, 7.5, 6.2, 2.2, false);  // CT East Gate to A
      addBox(0, 0, -55, 8.5, 3.6, 2.0, houseMat1);    // Center Blast Shield blocking spawn-to-mid sniping!
      addLowWall(-8, 0, -54, 4.5, 1.25, 0.8, houseMat2);
      addLowWall(8, 0, -54, 4.5, 1.25, 0.8, houseMat2);

      // Enterable CT Security Ticket Booth (between CT Spawn & A Site)
      addEnterableBuilding(28, 0, -45, 10, 4.2, 9, { N: 'door', S: 'door', W: 'window', E: 'door' }, houseMat2, houseMat1, true);
      addTacticalSign(28, 3.6, -40.3, 0, 'CT CHECKPOINT', '#38bdf8');

      // Enterable CT B-Gate Armory Room (between CT Spawn & B Courtyard)
      addEnterableBuilding(-28, 0, -45, 10, 4.2, 9, { N: 'door', S: 'door', E: 'window', W: 'door' }, houseMat1, houseMat2, true);
      addTacticalSign(-28, 3.6, -40.3, 0, 'B GATEHOUSE', '#38bdf8');

      // CT West Guard Depot (fills NW corner at x=-54, z=-56)
      addEnterableBuilding(-54, 0, -56, 12, 4.2, 10, { S: 'door', E: 'door', N: 'solid', W: 'solid' }, houseMat2, houseMat1, true);
      // CT East Supply Depot (fills NE corner at x=54, z=-56)
      addEnterableBuilding(54, 0, -56, 12, 4.2, 10, { S: 'door', W: 'door', N: 'solid', E: 'solid' }, houseMat1, houseMat2, true);

      addParkedVehicle(-18, -64, 0.15, 0x3b4d3b);
      addParkedVehicle(18, -64, -0.15, 0x334155);
      addGeneratorUnit(-9, 0, -68, 0);
      addDumpster(9, 0, -68, 0, 0x1e293b);
      addStreetLamp(-14, -60, 5.5);
      addStreetLamp(14, -60, 5.5);

      // --- 2. T SPAWN COVERED BAZAAR & ARCADE ---
      addBox(0, 0, 74, 106, 6.0, 2.2, houseMat2);
      addBox(0, 0, 56, 9.0, 3.8, 2.2, houseMat2); // T-Spawn Blast Shield (prevents instant Suicide sniping)
      addArchway(-24, 56, 24, 7.8, 6.2, 2.2, false); // T West Bazaar Gate to B
      addArchway(24, 56, 24, 7.8, 6.2, 2.2, false);  // T East Bazaar Gate to A-Long

      // Enterable T-Side Carpet Shop (East Bazaar -> Long A)
      addEnterableBuilding(30, 0, 45, 11, 4.2, 10, { N: 'door', S: 'door', W: 'window', E: 'door' }, houseMat1, houseMat2, true);
      addTacticalSign(30, 3.6, 39.8, Math.PI, 'EAST BAZAAR', '#f59e0b');

      // Enterable T-Side Spice Warehouse (West Bazaar -> B Tunnels)
      addEnterableBuilding(-30, 0, 45, 11, 4.2, 10, { N: 'door', S: 'door', E: 'window', W: 'door' }, houseMat2, houseMat1, true);
      addTacticalSign(-30, 3.6, 39.8, Math.PI, 'WEST BAZAAR', '#f59e0b');

      // SW Oasis Courtyard Pavilion (fills open SW corner at x=-50, z=48)
      addEnterableBuilding(-50, 0, 48, 12, 4.2, 11, { N: 'door', E: 'door', S: 'window', W: 'solid' }, houseMat1, houseMat2, true);
      addTacticalSign(-50, 3.6, 42.3, Math.PI, 'OASIS PAVILION', '#f59e0b');
      // SE Bazaar Arcade Hall (fills open SE corner at x=50, z=48)
      addEnterableBuilding(50, 0, 48, 12, 4.2, 11, { N: 'door', W: 'door', S: 'window', E: 'solid' }, houseMat2, houseMat1, true);

      addParkedVehicle(0, 69, Math.PI, 0x7c2d12);
      addMarketStall(-16, 65, 0, 'awning_red');
      addMarketStall(16, 65, 0, 'awning_blue');
      addPalletStack(-36, 0, 62, 0.3);
      addPalletStack(36, 0, 62, -0.3);
      addLowWall(-9, 0, 53, 4.5, 1.25, 0.8, houseMat1);
      addLowWall(9, 0, 53, 4.5, 1.25, 0.8, houseMat1);
      addStreetLamp(-14, 60, 5.5);
      addStreetLamp(14, 60, 5.5);

      // --- 3. MID CANYON, ENTERABLE SNIPER WINDOW ROOM & UNDERPASS CONNECTOR ---
      addArchway(0, -34, 30, 7.2, 8.0, 2.6, false); // Mid Double Doors
      addArchway(0, 45, 30, 7.8, 8.0, 2.6, false);  // T-Spawn to Suicide Arch

      // West Mid Divider Houses + Walk-Through Connector Hallway (Mid <-> B)
      addDetailedHouse(-19, -31, 8.5, 8.5, 26, houseMat1, true, 'awning_red');
      addEnterableBuilding(-19, 0, -9, 9.5, 4.6, 12, { E: 'wideDoor', W: 'wideDoor', N: 'window', S: 'solid' }, houseMat2, houseMat1, true);
      addTacticalSign(-14.1, 3.8, -9, Math.PI / 2, 'B CONNECTOR', '#facc15');
      addDetailedHouse(-19, 21, 8.5, 8.8, 34, houseMat2, true, 'awning_blue');

      // East Mid Divider Houses + Enterable MID WINDOW SNIPER ROOM (Mirage-style!)
      addDetailedHouse(19, 24, 8.5, 8.6, 34, houseMat1, true, 'awning_red');
      addDetailedHouse(19, -43, 7.5, 8.5, 10, houseMat2, true, 'awning_green');
      // Sniper Nest / Window Room at (19, -28) overlooking Mid!
      addEnterableBuilding(19, 0, -28, 9.0, 4.4, 9.0, { N: 'door', E: 'door', W: 'window', S: 'solid' }, houseMat1, houseMat2, true);
      addTacticalSign(14.3, 3.8, -28, -Math.PI / 2, 'SNIPER WINDOW', '#ef4444');

      // Staggered Mid Chicanes & Cover (breaks long direct sightline!)
      addBox(-4.5, 0, -22, 5.2, 2.6, 1.4, houseMat1, true, 'stone'); // Mid Left Pillar Wall
      addLowWall(4.8, 0, -18, 4.8, 1.25, 0.8, houseMat2);            // Mid Right Half-Wall
      addTree(-6, -15, 'palm');
      addShippingContainer(8.5, 0, 4, 0.18, 'container_teal');       // Angled Mid Container
      addBox(-6.5, 0, 12, 4.8, 2.5, 1.5, houseMat2, true, 'stone');  // Lower Mid Chicane Wall
      addPalletStack(-7.5, 0, 1, 0.25);
      addCivCar(-4.5, 28, 0.25, 0x854d0e);
      addJerseyBarrier(4.5, 0, 34, 0.25);
      addSandbags(-4.5, 0, 39, 0);

      // Xbox crate stack in Mid (climbable onto Short-A Catwalk)
      addBox(7.5, 0, -5, 3.2, 0.6, 3.2, 'wood_crate', true, 'wood');
      addBox(11.0, 0, -8.5, 3.6, 1.15, 3.6, 'wood_crate', true, 'wood');

      // Elevated Short-A Catwalk Walkway (y = 1.2m) with North & West Stairs
      addBox(24, 0, -18, 22, 1.2, 7.5, roadType, true, 'stone');
      addStairs(11.2, -18, 3.6, 6.0, 1.2, 4, 'east', roadType);  // West stairs from Mid
      addStairs(28.0, -23.5, 6.0, 3.4, 1.2, 4, 'south', roadType); // North stairs toward A-Ramp
      addBox(24, 1.2, -14.4, 18, 1.05, 0.5, houseMat2, true, 'stone');
      addSandbags(20, 1.2, -16, 0.4);
      addPillarArcade(18, -14.4, 30, -14.4, 3, 1.2, 3.6, houseMat1);

      // --- 4. BOMBSITE A: CITADEL PLATFORM + ENTERABLE A-PALACE INTERIOR ---
      this.bombsites.A = { name: 'A', x: 48, y: 1.2, z: -38, radius: 9.0 };
      addBox(48, 0, -38, 22, 1.2, 20, roadType, true, 'stone');
      addStairs(48, -26.0, 8.5, 4.0, 1.2, 5, 'north', roadType); // A-Long Ramp
      addStairs(35.0, -38, 4.0, 8.0, 1.2, 5, 'east', roadType);  // CT/Short Ramp

      const decalA = new THREE.Mesh(new THREE.PlaneGeometry(11, 11), CS.textures.getBombsiteDecalMaterial('A'));
      decalA.rotation.x = -Math.PI / 2;
      decalA.position.set(48, 1.22, -38);
      mapGroup.add(decalA);
      addTacticalSign(48, 4.2, -48.2, 0, 'BOMBSITE A - CITADEL', '#ef4444');

      // Multi-angle A-Site Cover + Roofed Ninja Pergola (offset cleanly so ramp & center are unobstructed)
      addBox(43.5, 1.2, -42.5, 2.6, 2.2, 2.6, 'wood_crate', true, 'wood');
      addBox(46.5, 1.2, -42.5, 2.4, 1.5, 2.4, 'wood_crate', true, 'wood');
      addBox(53.5, 1.2, -43.5, 5.5, 2.4, 0.9, houseMat1, true, 'stone'); // Goose Blast Wall
      addBox(53.5, 3.6, -42.0, 6.5, 0.45, 5.0, 'wood_crate', true, 'wood'); // Overhead Sun Canopy on A
      addBarrelCluster(54, 1.2, -32);
      addSandbags(51, 1.2, -31, 0.4);
      addJerseyBarrier(38, 1.2, -32, 0.3);

      // Enterable A-Palace / Pillared Hall (North-East of A-Site, x=62, z=-38)
      addBox(62, 0, -38, 8, 1.2, 16, roadType, true, 'stone');
      addEnterableBuilding(62, 1.2, -38, 8, 4.2, 16, { W: 'wideDoor', S: 'open', N: 'window', E: 'solid' }, houseMat2, houseMat1, true);

      // --- 5. A-LONG BOULEVARD, SIDE SHOP & PIT BUNKER ---
      addArchway(48, 18, 30, 7.6, 8.0, 2.6, false);  // A-Long Double Doors House
      addArchway(48, -6, 28, 8.2, 7.5, 2.2, false);  // Mid-Long Archway (breaks 90m sniper line!)
      addDetailedHouse(69, -4, 9.0, 9.2, 52, houseMat1, true, 'awning_blue');

      // Enterable A-Long Side Shop (x=34, z=4, flanking route around Long Corner)
      addEnterableBuilding(34, 0, 4, 9.5, 4.2, 14, { E: 'door', N: 'door', S: 'window', W: 'solid' }, houseMat2, houseMat1, true);
      addTacticalSign(38.9, 3.5, 4, Math.PI / 2, 'MERCHANT HALL', '#f59e0b');

      // Long A Corner & Pit Cover
      addShippingContainer(56, 0, 7, -0.15, 'container_blue');
      addDumpster(58, 0, -2, 0, 0x1e3a29);
      addPalletStack(42, 0, 11, 0);
      // Recessed Pit Pillbox / Bunker at South-East Long (x=57, z=33)
      addEnterableBuilding(57, 0, 33, 9, 3.8, 10, { N: 'window', W: 'door', S: 'door', E: 'solid' }, houseMat1, houseMat2, true);
      addCivCar(41, 33, 0.2, 0x9a7b4f);
      addParkedVehicle(53, -16, 0.35, 0x3b4d3b);
      addLowWall(41, 0, -13, 4.5, 1.25, 0.8, houseMat1);
      addMarketStall(61, -22, -Math.PI / 2, 'awning_red');
      addMarketStall(61, 20, -Math.PI / 2, 'awning_green');

      // --- 6. BOMBSITE B: FORTRESS COURTYARD, HOOKAH LOUNGE & CATACOMBS ---
      this.bombsites.B = { name: 'B', x: -48, y: 0.6, z: -32, radius: 9.0 };
      addBox(-48, 0, -32, 22, 0.6, 22, roadType, true, 'stone');
      addStairs(-48, -19.5, 8.0, 3.2, 0.6, 3, 'north', roadType);
      addStairs(-35.5, -32, 3.2, 8.0, 0.6, 3, 'west', roadType);
      addStairs(-48, -44.5, 8.0, 3.2, 0.6, 3, 'south', roadType); // North-side steps onto B platform

      const decalB = new THREE.Mesh(new THREE.PlaneGeometry(11, 11), CS.textures.getBombsiteDecalMaterial('B'));
      decalB.rotation.x = -Math.PI / 2;
      decalB.position.set(-48, 0.62, -32);
      mapGroup.add(decalB);
      addTacticalSign(-48, 4.0, -43.2, 0, 'BOMBSITE B - OASIS', '#ef4444');

      // B-Site Multi-Layered Cover + Back-Plat Pillbox
      addBox(-54, 0.6, -34, 2.6, 2.2, 2.6, 'wood_crate', true, 'wood');
      addBox(-54, 0.6, -37.2, 2.4, 1.5, 2.4, 'wood_crate', true, 'wood');
      addBox(-43, 0.6, -26, 4.2, 2.2, 1.0, houseMat1, true, 'stone'); // B Center Pillar Wall
      addLowWall(-39, 0.6, -23, 4.2, 1.25, 0.8, houseMat2);
      addSandbags(-42, 0.6, -38, -0.35);
      addBarrelCluster(-55, 0.6, -25);
      addParkedVehicle(-39, -46, 0.25, 0x7c2d12);
      addPillarArcade(-57, -41, -51, -41, 2, 0.6, 3.8, houseMat2);

      // Enterable Hookah Lounge / B-Window Building between B-Tunnels & B-Site
      addEnterableBuilding(-36, 0, -8, 11, 4.4, 12, { N: 'door', W: 'door', S: 'door', E: 'door' }, houseMat2, houseMat1, true);
      addTacticalSign(-36, 3.8, -14.2, Math.PI, 'HOOKAH LOUNGE', '#f59e0b');
      addBox(-56, 0, -8, 7.5, 3.8, 2.0, houseMat1, true, 'stone'); // West B-Tunnels Choke Wall
      addGeneratorUnit(-55, 0, -14, 0.2);

      // Roofed Sandstone Upper B-Tunnels Complex (x = -48, z = +6 to +36) with Interior Partition Walls
      addBox(-61, 0, 21, 4.0, 6.2, 30, houseMat1, true, 'stone');
      addBox(-35, 0, 21, 4.0, 6.2, 30, houseMat1, true, 'stone');
      addBox(-48, 5.4, 21, 30, 1.0, 30, houseMat2, true, 'stone');
      [11, 21, 31].forEach(tz => {
        addBox(-42, 0, tz, 1.8, 5.4, 1.8, houseMat2, true, 'stone');
        addBox(-54, 0, tz, 1.8, 5.4, 1.8, houseMat2, true, 'stone');
      });
      // Interior B-Tunnels Side Chicanes (staggered on left/right so center aisle stays navigable)
      addBox(-55, 0, 16, 4.2, 2.6, 1.4, houseMat1, true, 'stone');
      addBox(-41, 0, 26, 4.2, 2.6, 1.4, houseMat2, true, 'stone');
      addBarrelCluster(-55, 0, 28);
      addDetailedHouse(-69, -22, 9.0, 9.0, 42, houseMat2, true, 'awning_red');

      // Trees, Palms & Overhead Lantern Cables
      for (let z = -44; z <= 44; z += 16) {
        addOverheadCable(-14, 7.2, z, 14, 7.2, z + 2, true);
      }
      [
        [-10, -45], [10, -45], [-10, 42], [10, 42],
        [60, 14], [60, -48], [-62, 46], [-62, -52],
        [-11, 14], [11, -24], [-48, -50]
      ].forEach(([px, pz], idx) => addTree(px, pz, idx % 3 === 0 ? 'olive' : 'palm'));

      [[-11, -18], [11, -18], [-11, 18], [11, 18], [28, -12], [-28, -18], [-8, -68], [8, -68], [-8, 68], [8, 68]].forEach(([bx, bz]) => {
        addBushCluster(bx, bz, 1.25);
      });

      // Spawns
      this.spawns.CT = [
        { x: 0,   y: 0, z: -64, rotY: Math.PI },
        { x: -7,  y: 0, z: -66, rotY: Math.PI },
        { x: 7,   y: 0, z: -66, rotY: Math.PI },
        { x: -15, y: 0, z: -62, rotY: Math.PI },
        { x: 15,  y: 0, z: -62, rotY: Math.PI },
        { x: -24, y: 0, z: -62, rotY: Math.PI },
        { x: 24,  y: 0, z: -62, rotY: Math.PI },
        { x: -36, y: 0, z: -60, rotY: Math.PI },
        { x: 36,  y: 0, z: -60, rotY: Math.PI },
        { x: 0,   y: 0, z: -59, rotY: Math.PI }
      ];
      this.spawns.T = [
        { x: 0,   y: 0, z: 63, rotY: 0 },
        { x: -7,  y: 0, z: 65, rotY: 0 },
        { x: 7,   y: 0, z: 65, rotY: 0 },
        { x: -15, y: 0, z: 62, rotY: 0 },
        { x: 15,  y: 0, z: 62, rotY: 0 },
        { x: -24, y: 0, z: 62, rotY: 0 },
        { x: 24,  y: 0, z: 62, rotY: 0 },
        { x: -42, y: 0, z: 58, rotY: 0 },
        { x: 42,  y: 0, z: 58, rotY: 0 },
        { x: 0,   y: 0, z: 60, rotY: 0 }
      ];
      this.spawns.DM = [
        { x: 0,   y: 0,   z: -28, rotY: 0 },
        { x: 2,   y: 0,   z: 20,  rotY: Math.PI },
        { x: 48,  y: 1.2, z: -35, rotY: 0 },
        { x: 48,  y: 0,   z: 2,   rotY: Math.PI },
        { x: 48,  y: 0,   z: 22,  rotY: Math.PI },
        { x: 24,  y: 1.2, z: -18, rotY: -Math.PI / 2 },
        { x: -48, y: 0.6, z: -30, rotY: 0 },
        { x: -48, y: 0,   z: -3,  rotY: Math.PI },
        { x: -48, y: 0,   z: 21,  rotY: Math.PI },
        { x: -19, y: 0,   z: -9,  rotY: Math.PI / 2 },
        { x: 34,  y: 0,   z: 4,   rotY: -Math.PI / 2 },
        { x: -24, y: 0,   z: -52, rotY: Math.PI },
        { x: 24,  y: 0,   z: -52, rotY: Math.PI },
        { x: -24, y: 0,   z: 52,  rotY: 0 },
        { x: 24,  y: 0,   z: 52,  rotY: 0 },
        { x: 62,  y: 1.2, z: -38, rotY: -Math.PI / 2 },
        { x: -36, y: 0,   z: -8,  rotY: 0 },
        { x: -2,  y: 0,   z: -5,  rotY: 0 }
      ];

      this.mysteryBoxes = [
        { x: 0,   y: 0,   z: -26, label: 'Mid Courtyard' },
        { x: 48,  y: 1.2, z: -38, label: 'Bombsite A' },
        { x: -48, y: 0.6, z: -32, label: 'Bombsite B' }
      ];

      // Connected Tactical Nav-Graph for Smart Bot Pathfinding
      this.navNodes = [
        { id: 'ct_spawn',   x: 0,   z: -62, lane: 'mid', links: ['ct_b_gate', 'ct_a_gate'] },
        { id: 'ct_b_gate',  x: -24, z: -52, lane: 'B',   links: ['ct_spawn', 'ct_mid', 'ct_b_room', 'b_back'] },
        { id: 'ct_b_room',  x: -28, z: -45, lane: 'B',   links: ['ct_b_gate', 'b_ramp_e'] },
        { id: 'b_back',     x: -48, z: -48, lane: 'B',   links: ['ct_b_gate', 'b_site'] },
        { id: 'b_ramp_e',   x: -32, z: -32, lane: 'B',   links: ['ct_b_room', 'b_site', 'b_hookah'] },
        { id: 'b_site',     x: -48, z: -31, lane: 'B',   isSite: 'B', links: ['b_back', 'b_ramp_e', 'b_front'] },
        { id: 'b_front',    x: -48, z: -15, lane: 'B',   links: ['b_site', 'b_tun_n', 'b_hookah'] },
        { id: 'b_hookah',   x: -36, z: -8,  lane: 'B',   links: ['b_ramp_e', 'b_front', 'b_conn', 'b_tun_n'] },
        { id: 'b_conn',     x: -19, z: -9,  lane: 'mid', links: ['b_hookah', 'mid_center'] },
        { id: 'b_tun_n',    x: -48, z: 6,   lane: 'B',   links: ['b_front', 'b_hookah', 'b_tun_mid'] },
        { id: 'b_tun_mid',  x: -48, z: 21,  lane: 'B',   links: ['b_tun_n', 'b_tun_s'] },
        { id: 'b_tun_s',    x: -48, z: 36,  lane: 'B',   links: ['b_tun_mid', 't_b_shop', 't_b_pav'] },
        { id: 't_b_pav',    x: -50, z: 48,  lane: 'B',   links: ['b_tun_s', 't_b_gate'] },
        { id: 't_b_shop',   x: -30, z: 45,  lane: 'B',   links: ['b_tun_s', 't_b_gate'] },
        { id: 't_b_gate',   x: -24, z: 58,  lane: 'B',   links: ['t_b_shop', 't_b_pav', 'mid_arch', 't_spawn'] },
        { id: 'ct_mid',     x: 0,   z: -42, lane: 'mid', links: ['ct_b_gate', 'ct_a_gate', 'mid_doors'] },
        { id: 'mid_win_n',  x: 19,  z: -35, lane: 'mid', links: ['mid_window', 'a_ramp_w'] },
        { id: 'mid_window', x: 19,  z: -28, lane: 'mid', links: ['mid_win_n', 'a_cat_n'] },
        { id: 'mid_doors',  x: 0,   z: -28, lane: 'mid', links: ['ct_mid', 'mid_center'] },
        { id: 'mid_center', x: -1,  z: -9,  lane: 'mid', links: ['mid_doors', 'b_conn', 'a_xbox', 'mid_south'] },
        { id: 'mid_south',  x: 1,   z: 20,  lane: 'mid', links: ['mid_center', 'mid_arch'] },
        { id: 'mid_arch',   x: 0,   z: 48,  lane: 'mid', links: ['mid_south', 't_b_gate', 't_a_gate'] },
        { id: 't_spawn',    x: 0,   z: 62,  lane: 'mid', links: ['t_b_gate', 't_a_gate'] },
        { id: 'a_xbox',     x: 8,   z: -18, lane: 'A',   links: ['mid_center', 'a_short'] },
        { id: 'a_short',    x: 24,  z: -18, lane: 'A',   links: ['a_xbox', 'a_cat_n'] },
        { id: 'a_cat_n',    x: 28,  z: -28, lane: 'A',   links: ['a_short', 'mid_window', 'a_ramp_w'] },
        { id: 'ct_a_gate',  x: 24,  z: -52, lane: 'A',   links: ['ct_spawn', 'ct_mid', 'ct_a_booth'] },
        { id: 'ct_a_booth', x: 28,  z: -45, lane: 'A',   links: ['ct_a_gate', 'a_ramp_w'] },
        { id: 'a_ramp_w',   x: 31,  z: -38, lane: 'A',   links: ['ct_a_booth', 'mid_win_n', 'a_cat_n', 'a_site'] },
        { id: 'a_site',     x: 48,  z: -38, lane: 'A',   isSite: 'A', links: ['a_ramp_w', 'a_palace', 'a_cross'] },
        { id: 'a_palace',   x: 62,  z: -38, lane: 'A',   links: ['a_site'] },
        { id: 'a_cross',    x: 48,  z: -21, lane: 'A',   links: ['a_site', 'a_long_n'] },
        { id: 'a_long_n',   x: 48,  z: -1,  lane: 'A',   links: ['a_cross', 'a_shop', 'a_long_doors'] },
        { id: 'a_shop',     x: 34,  z: 4,   lane: 'A',   links: ['a_long_n', 'a_long_doors'] },
        { id: 'a_long_doors', x: 48, z: 14, lane: 'A',   links: ['a_long_n', 'a_shop', 'a_long_s'] },
        { id: 'a_long_s',   x: 48,  z: 24,  lane: 'A',   links: ['a_long_doors', 'a_long_pit'] },
        { id: 'a_long_pit', x: 48,  z: 38,  lane: 'A',   links: ['a_long_s', 't_a_shop'] },
        { id: 't_a_shop',   x: 30,  z: 45,  lane: 'A',   links: ['a_long_pit', 't_a_gate'] },
        { id: 't_a_gate',   x: 24,  z: 58,  lane: 'A',   links: ['t_a_shop', 'mid_arch', 't_spawn'] }
      ];
      this.waypoints = this.navNodes;
    } else if (mapId === 'de_inferno_plaza' || mapId === 'de_foundry') {
      // ======================================================================
      // MAP 2: DE_INFERNO_PLAZA (ITALIAN OLD TOWN, CHURCH, APTS & BANANA)
      // ======================================================================
      addBox(76, 0, 0, 12, wallH, 168, 'brick_wall');
      addBox(-76, 0, 0, 12, wallH, 168, 'stucco_white');
      addBox(0, 0, -79, 168, wallH, 8, 'brick_wall');
      addBox(0, 0, 79, 168, wallH, 8, 'stucco_white');

      // Cobblestone Streets
      addRoadStrip(-6, 0, 10.0, 142);
      addRoadStrip(22, 16, 9.0, 96);
      addRoadStrip(-44, 0, 11.5, 130);
      addRoadStrip(48, -6, 12.0, 116);
      addRoadStrip(0, -62, 124, 10.5, CS.textures.getMaterial(roadType, 18, 2));
      addRoadStrip(0, 62, 124, 10.5, CS.textures.getMaterial(roadType, 18, 2));

      // Lush Italian Gardens
      const grassMat = CS.textures.getMaterial('grass_ground', 5, 5);
      [[-26, -46, 16, 18], [28, -44, 18, 16], [-26, 44, 16, 16], [64, -14, 14, 28]].forEach(([gx, gz, gw, gd]) => {
        const gPatch = new THREE.Mesh(new THREE.PlaneGeometry(gw, gd), grassMat);
        gPatch.rotation.x = -Math.PI / 2;
        gPatch.position.set(gx, 0.012, gz);
        gPatch.receiveShadow = true;
        mapGroup.add(gPatch);
      });

      // --- 1. CT SPAWN PIAZZA, ARCHES & ENTERABLE LIBRARY ---
      addBox(0, 0, -74, 106, 5.8, 2.2, 'brick_wall');
      addBox(-3, 0, -56, 8.5, 3.8, 2.0, 'brick_wall'); // CT Spawn Blast Shield blocking Mid sightline
      addArchway(-24, -56, 24, 7.6, 6.2, 2.2, false);  // CT West Arch to B
      addArchway(24, -56, 24, 7.6, 6.2, 2.2, false);   // CT East Arch to Library / A

      // Enterable CT Library Hall (between CT Spawn & Bombsite A, x=32, z=-44)
      addEnterableBuilding(32, 0, -44, 12, 4.4, 10, { N: 'door', S: 'door', W: 'window', E: 'door' }, 'stucco_white', 'brick_wall', true);
      addTacticalSign(32, 3.8, -38.8, 0, 'OLD LIBRARY', '#38bdf8');
      // Enterable CT East Arch Guardhouse (fills NE corner at x=54, z=-52)
      addEnterableBuilding(54, 0, -52, 11, 4.4, 10, { S: 'door', W: 'door', N: 'solid', E: 'solid' }, 'brick_wall', 'stucco_white', true);

      // Enterable CT Construction / Church Ruins (between CT Spawn & Bombsite B, x=-24, z=-45)
      addEnterableBuilding(-24, 0, -45, 11, 4.4, 11, { N: 'door', W: 'wideDoor', S: 'window', E: 'door' }, 'brick_wall', 'stucco_white', true);
      addTacticalSign(-24, 3.8, -39.3, 0, 'CHURCH HALL', '#38bdf8');

      addParkedVehicle(-18, -65, 0.1, 0x1e3a8a);
      addParkedVehicle(18, -65, -0.1, 0x0f766e);
      addLowWall(8, 0, -54, 4.5, 1.25, 0.8, 'brick_wall');
      addStreetLamp(-12, -62, 5.2);
      addStreetLamp(12, -62, 5.2);

      // --- 2. T SPAWN COURTYARD, WINE CELLAR & VILLA GATEHOUSE ---
      addBox(0, 0, 74, 106, 5.8, 2.2, 'stucco_white');
      addBox(-3, 0, 56, 8.5, 3.8, 2.0, 'stucco_white'); // T Spawn Center Shield
      addArchway(-24, 56, 24, 7.8, 6.2, 2.2, false);    // T West Gate to Banana
      addArchway(24, 56, 24, 7.8, 6.2, 2.2, false);     // T East Gate to Alt-Mid / A

      // Enterable T-Side Wine Cellar / Tavern (fills the huge SW open field at x=-26, z=43!)
      addEnterableBuilding(-26, 0, 43, 13, 4.4, 12, { S: 'door', W: 'wideDoor', E: 'door', N: 'door' }, 'brick_wall', 'stucco_white', true);
      addTacticalSign(-26, 3.8, 36.8, Math.PI, 'WINE TAVERN', '#f59e0b');
      addPillarArcade(-44, 46, -34, 46, 3, 0, 4.0, 'brick_wall'); // Loggia arches into Banana
      // Enterable SW Bell Gatehouse (fills SW corner at x=-52, z=50)
      addEnterableBuilding(-52, 0, 50, 11, 4.2, 10, { E: 'door', N: 'door', S: 'window', W: 'solid' }, 'stucco_white', 'brick_wall', true);

      // Enterable T-Side Villa Gatehouse (fills SE open area at x=34, z=44!)
      addEnterableBuilding(34, 0, 44, 12, 4.4, 11, { S: 'door', N: 'door', W: 'window', E: 'door' }, 'stucco_white', 'brick_wall', true);
      addTacticalSign(34, 3.8, 38.3, Math.PI, 'VILLA LOGGIA', '#f59e0b');
      // Enterable SE Carriage Barn (fills open SE corner at x=54, z=36!)
      addEnterableBuilding(54, 0, 36, 11, 4.2, 11, { W: 'door', N: 'door', S: 'window', E: 'solid' }, 'brick_wall', 'stucco_white', true);
      addTacticalSign(54, 3.6, 30.3, 0, 'CARRIAGE BARN', '#f59e0b');

      addCivCar(0, 69, Math.PI, 0x991b1b);
      addMarketStall(-16, 67, 0, 'awning_blue');
      addMarketStall(16, 67, 0, 'awning_red');
      addPalletStack(-36, 0, 62, 0.2);
      addPalletStack(36, 0, 62, -0.2);

      // 24m Bell Tower near B
      addBox(-62, 0, -54, 9.5, 22.0, 9.5, 'brick_wall', true, 'stone');
      const spire = new THREE.Mesh(new THREE.ConeGeometry(7.2, 6.5, 4), roofMat);
      spire.position.set(-62, 25.2, -54);
      spire.rotation.y = Math.PI / 4;
      mapGroup.add(spire);

      // --- 3. BOMBSITE B: FOUNTAIN PIAZZA, COFFINS & DARK ALCOVE (x = -44, z = -40) ---
      this.bombsites.B = { name: 'B', x: -44, y: 0.0, z: -40, radius: 9.5 };
      const decalB = new THREE.Mesh(new THREE.PlaneGeometry(11, 11), CS.textures.getBombsiteDecalMaterial('B'));
      decalB.rotation.x = -Math.PI / 2;
      decalB.position.set(-44, 0.03, -40);
      mapGroup.add(decalB);
      addTacticalSign(-44, 4.2, -55.0, 0, 'BOMBSITE B - PIAZZA', '#ef4444');

      // Stone Water Fountain offset to back-north of B
      const fMat = CS.textures.getMaterial('cobble_floor', 2, 2);
      const waterMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.1, metalness: 0.85 });
      const basin = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.2, 1.0, 18), fMat);
      basin.position.set(-44, 0.5, -48);
      mapGroup.add(basin);
      const water = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.7, 0.9, 18), waterMat);
      water.position.set(-44, 0.55, -48);
      mapGroup.add(water);
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.65, 3.0, 12), fMat);
      pillar.position.set(-44, 1.5, -48);
      mapGroup.add(pillar);

      const dropMat = new THREE.MeshBasicMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.85 });
      for (let d = 0; d < 28; d++) {
        const drop = new THREE.Mesh(new THREE.SphereGeometry(0.11, 6, 6), dropMat);
        const angle = (d / 28) * Math.PI * 2;
        drop.position.set(-44, 3.1, -48);
        mapGroup.add(drop);
        this.fountainDrops.push({ mesh: drop, cx: -44, cz: -48, angle, phase: (d / 28) });
      }
      this.colliders.push({ minX: -47.2, maxX: -40.8, minY: 0, maxY: 1.2, minZ: -51.2, maxZ: -44.8, surface: 'stone' });

      // B-Site Multi-Layered Cover + Roofed Dark Alcove on West side
      addEnterableBuilding(-56, 0, -39, 7.0, 4.0, 10.0, { E: 'open', S: 'window', N: 'door', W: 'solid' }, 'brick_wall', 'stucco_white', true);
      addBox(-36, 0, -48, 3.0, 2.0, 2.4, 'wood_crate', true, 'wood'); // Coffins stack
      addBox(-48, 0, -33, 4.5, 2.2, 1.2, 'brick_wall', true, 'stone'); // First Oranges Pillar Wall
      addLowWall(-39, 0, -33, 4.5, 1.25, 0.8, 'brick_wall');
      addSandbags(-36, 0, -37, 0);
      addPillarArcade(-52, -55, -36, -55, 4, 0, 4.2, 'brick_wall'); // North Coffins Colonnade

      // --- 4. BANANA ALLEY WITH STAGGERED HALF-WALL CHICANES & PILLARS ---
      addDetailedHouse(-25, -10, 8.5, 8.5, 44, houseMat1, true, 'awning_red');
      addDetailedHouse(-64, 4, 8.5, 8.8, 56, houseMat2, true, 'awning_green');
      addArchway(-44, -22, 26, 8.0, 7.5, 2.4, false);
      addArchway(-44, 14, 26, 8.2, 7.5, 2.4, false);

      // Staggered Banana Chicanes (classic Inferno half-wall + car + wood logs)
      addCivCar(-39.5, -10, 0.32, 0x991b1b);
      addBox(-48.5, 0, -3, 5.2, 2.4, 1.3, 'brick_wall', true, 'stone'); // Banana Half-Wall Chicane W
      addLowWall(-39.5, 0, 5, 4.8, 1.25, 0.8, 'stucco_white');          // Banana Half-Wall Chicane E
      addDumpster(-49, 0, 8, 0.2, 0x1e3a29);
      addBox(-39, 0, 24, 4.2, 1.6, 2.2, 'wood_crate', true, 'wood');   // Banana Wood Logs
      addLowWall(-48.5, 0, 31, 5.0, 1.25, 0.8, 'brick_wall');

      // --- 5. DUAL MID, CANAL BRIDGE, BOILER ROOM & APARTMENTS ---
      addBox(-6, 0, 2, 9.5, 0.75, 10.0, roadType, true, 'stone');
      addStairs(-6, 8.5, 9.5, 3.2, 0.75, 4, 'north', roadType);
      addStairs(-6, -4.5, 9.5, 3.2, 0.75, 4, 'south', roadType);
      addStairs(0.2, 2, 3.0, 5.0, 0.75, 4, 'west', roadType); // East steps connecting Bridge to Boiler Room!
      addBox(-10.4, 0.75, 2, 0.6, 0.85, 9.5, 'cobble_floor', true, 'stone');

      // Divider Houses with Enterable BOILER ROOM Connector between Mid (x=-6) and Apartments (x=22)!
      addDetailedHouse(8, 23, 7.5, 8.4, 26, houseMat2, true, 'awning_blue');
      addEnterableBuilding(8, 0, 2, 9.0, 4.4, 10.0, { W: 'door', E: 'door', N: 'window', S: 'solid' }, 'brick_wall', 'stucco_white', true);
      addTacticalSign(3.3, 3.8, 2, -Math.PI / 2, 'BOILER ROOM', '#facc15');
      addDetailedHouse(8, -22, 7.5, 8.2, 28, houseMat1, true, 'awning_red');

      // Top-Mid Archway & Chicanes (breaks long Mid sniper line)
      addArchway(-6, -34, 22, 7.5, 7.5, 2.4, false);
      addArchway(-6, 36, 22, 7.8, 7.5, 2.4, false);
      addBox(-9.5, 0, -16, 4.4, 2.4, 1.3, 'brick_wall', true, 'stone');
      addLowWall(-2.5, 0, -24, 4.4, 1.25, 0.8, 'stucco_white');
      addLowWall(-9.0, 0, 22, 4.5, 1.25, 0.8, 'brick_wall');
      addPalletStack(-2.5, 0, 16, 0.2);

      // Walkable Apartments Terrace (x = 25, z = -4, y = 1.4m) with Enterable Upper Balcony Room!
      addBox(25, 0, -4, 13, 1.4, 24, houseMat2, true, 'stone');
      addStairs(25, 10.0, 6.0, 4.2, 1.4, 6, 'north', roadType);  // South Stairs up from Alt-Mid
      addStairs(33.5, -4, 4.2, 6.0, 1.4, 6, 'west', roadType);   // East Stairs up onto Apts from A-Short
      addStairs(25, -18.0, 6.0, 4.2, 1.4, 6, 'south', roadType); // North Stairs down toward Arch/CT
      addEnterableBuilding(25, 1.4, -4, 11, 3.8, 14, { S: 'door', N: 'door', E: 'wideDoor', W: 'window' }, 'stucco_white', 'brick_wall', true);
      addTacticalSign(30.7, 4.6, -4, Math.PI / 2, 'APARTMENTS', '#facc15');

      // --- 6. BOMBSITE A: VILLA COLONNADE, GRAVEYARD & BALCONY PIT ---
      this.bombsites.A = { name: 'A', x: 48, y: 0.6, z: -16, radius: 9.5 };
      addBox(48, 0, -18, 22, 0.6, 22, roadType, true, 'stone');
      addStairs(48, -5.5, 8.0, 3.2, 0.6, 3, 'north', roadType);
      addStairs(35.5, -18, 3.2, 8.0, 0.6, 3, 'east', roadType);
      addStairs(48, -30.5, 8.0, 3.2, 0.6, 3, 'south', roadType);

      const decalA = new THREE.Mesh(new THREE.PlaneGeometry(11, 11), CS.textures.getBombsiteDecalMaterial('A'));
      decalA.rotation.x = -Math.PI / 2;
      decalA.position.set(48, 0.62, -16);
      mapGroup.add(decalA);
      addTacticalSign(48, 4.2, -29.2, 0, 'BOMBSITE A - VILLA', '#ef4444');

      // Villa Roofed Gazebo / Colonnade on A-Site
      [[-25, 41], [-25, 55], [-11, 41], [-11, 55]].forEach(([pz, px]) => {
        addBox(px, 0.6, pz, 1.5, 4.8, 1.5, 'stucco_white', true, 'stone');
      });
      addBox(48, 5.4, -22, 16, 0.5, 8, 'brick_wall', true, 'stone'); // Overhead Pergola Roof over back of A
      addBox(44, 0.6, -21, 2.6, 2.2, 2.6, 'wood_crate', true, 'wood');
      addBox(52, 0.6, -13, 4.2, 2.0, 1.2, 'stucco_white', true, 'stone');
      addBarrelCluster(54, 0.6, -24);

      // Enterable Graveyard Crypt / Pit Room (East of A-Site, x=56, z=12)
      addEnterableBuilding(56, 0, 12, 11, 4.2, 12, { N: 'door', W: 'door', S: 'door', E: 'solid' }, 'brick_wall', 'stucco_white', true);
      addTacticalSign(56, 3.6, 5.8, 0, 'PIT CRYPT', '#ef4444');

      addArchway(48, -38, 28, 8.0, 7.8, 2.6, false);
      addDetailedHouse(69, -18, 8.5, 9.0, 48, houseMat1, true, 'awning_green');
      addCivCar(44, 24, -0.2, 0x1e3a8a);
      addLowWall(44, 0, 2, 5.0, 1.25, 0.8, 'stucco_white');
      addMarketStall(20, 28, 0, 'awning_green');

      // Trees & Flora
      [
        [-14, -48, 'cypress'], [14, -48, 'cypress'], [-14, 46, 'olive'], [14, 46, 'olive'],
        [60, -48, 'olive'], [-56, 48, 'cypress'], [60, 28, 'cypress'], [-56, -24, 'cypress']
      ].forEach(([tx, tz, tType]) => addTree(tx, tz, tType));

      [[-15, -18], [15, -18], [-15, 18], [15, 18], [-34, -28], [60, -4], [-56, 18]].forEach(([bx, bz]) => {
        addBushCluster(bx, bz, 1.3);
      });

      this.spawns.CT = [
        { x: 4,   y: 0, z: -64, rotY: Math.PI },
        { x: -4,  y: 0, z: -66, rotY: Math.PI },
        { x: 14,  y: 0, z: -64, rotY: Math.PI },
        { x: -16, y: 0, z: -64, rotY: Math.PI },
        { x: 24,  y: 0, z: -62, rotY: Math.PI },
        { x: -24, y: 0, z: -62, rotY: Math.PI },
        { x: 38,  y: 0, z: -60, rotY: Math.PI },
        { x: -38, y: 0, z: -62, rotY: Math.PI },
        { x: 0,   y: 0, z: -60, rotY: Math.PI },
        { x: 18,  y: 0, z: -60, rotY: Math.PI }
      ];
      this.spawns.T = [
        { x: -4,  y: 0, z: 64, rotY: 0 },
        { x: 6,   y: 0, z: 66, rotY: 0 },
        { x: -11, y: 0, z: 63, rotY: 0 },
        { x: 11,  y: 0, z: 63, rotY: 0 },
        { x: -24, y: 0, z: 62, rotY: 0 },
        { x: 24,  y: 0, z: 62, rotY: 0 },
        { x: -40, y: 0, z: 60, rotY: 0 },
        { x: 42,  y: 0, z: 60, rotY: 0 },
        { x: -6,  y: 0, z: 60, rotY: 0 },
        { x: 22,  y: 0, z: 60, rotY: 0 }
      ];
      this.spawns.DM = [
        { x: -44, y: 0,    z: -38, rotY: 0 },
        { x: -44, y: 0,    z: 0,   rotY: Math.PI },
        { x: -44, y: 0,    z: 36,  rotY: Math.PI },
        { x: -6,  y: 0.75, z: 2,   rotY: 0 },
        { x: -6,  y: 0,    z: -30, rotY: 0 },
        { x: -6,  y: 0,    z: 30,  rotY: Math.PI },
        { x: 25,  y: 1.4,  z: -4,  rotY: Math.PI },
        { x: 20,  y: 0,    z: 20,  rotY: Math.PI },
        { x: 48,  y: 0.6,  z: -15, rotY: 0 },
        { x: 48,  y: 0,    z: -44, rotY: 0 },
        { x: 44,  y: 0,    z: 12,  rotY: Math.PI },
        { x: 48,  y: 0,    z: 36,  rotY: Math.PI },
        { x: -24, y: 0,    z: -45, rotY: -Math.PI / 2 },
        { x: 32,  y: 0,    z: -44, rotY: Math.PI / 2 },
        { x: -26, y: 0,    z: 43,  rotY: 0 },
        { x: 34,  y: 0,    z: 44,  rotY: 0 },
        { x: 8,   y: 0,    z: 1,   rotY: Math.PI / 2 },
        { x: 56,  y: 0,    z: 12,  rotY: 0 }
      ];

      this.mysteryBoxes = [
        { x: -6,  y: 0.75, z: 2,   label: 'Mid Brücke' },
        { x: 48,  y: 0.6,  z: -16, label: 'Villa A' },
        { x: -44, y: 0.0,  z: -40, label: 'Fountain B' }
      ];

      this.navNodes = [
        { id: 'ct_spawn',   x: 0,   z: -62, lane: 'mid', links: ['ct_b_arch', 'ct_a_arch'] },
        { id: 'ct_b_arch',  x: -24, z: -52, lane: 'B',   links: ['ct_spawn', 'ct_mid', 'b_church'] },
        { id: 'b_church',   x: -24, z: -45, lane: 'B',   links: ['ct_b_arch', 'b_site'] },
        { id: 'b_site',     x: -44, z: -40, lane: 'B',   isSite: 'B', links: ['b_church', 'b_dark', 'b_front'] },
        { id: 'b_dark',     x: -55, z: -39, lane: 'B',   links: ['b_site'] },
        { id: 'b_front',    x: -44, z: -26, lane: 'B',   links: ['b_site', 'ban_north'] },
        { id: 'ban_north',  x: -44, z: -15, lane: 'B',   links: ['b_front', 'ban_mid'] },
        { id: 'ban_mid',    x: -44, z: 1,   lane: 'B',   links: ['ban_north', 'ban_logs'] },
        { id: 'ban_logs',   x: -44, z: 18,  lane: 'B',   links: ['ban_mid', 'ban_south'] },
        { id: 'ban_south',  x: -44, z: 38,  lane: 'B',   links: ['ban_logs', 't_tavern'] },
        { id: 't_tavern',   x: -26, z: 43,  lane: 'B',   links: ['ban_south', 't_b_arch'] },
        { id: 't_b_arch',   x: -24, z: 58,  lane: 'B',   links: ['t_tavern', 't_mid_arch', 't_spawn'] },
        { id: 'ct_mid',     x: -6,  z: -42, lane: 'mid', links: ['ct_b_arch', 'ct_a_arch', 'mid_north'] },
        { id: 'mid_north',  x: -6,  z: -29, lane: 'mid', links: ['ct_mid', 'mid_bridge'] },
        { id: 'mid_bridge', x: -6,  z: 2,   lane: 'mid', links: ['mid_north', 'boiler', 'mid_south'] },
        { id: 'boiler',     x: 8,   z: 2,   lane: 'mid', links: ['mid_bridge', 'boiler_e'] },
        { id: 'boiler_e',   x: 16,  z: 2,   lane: 'A',   links: ['boiler', 'alt_mid'] },
        { id: 'mid_south',  x: -6,  z: 30,  lane: 'mid', links: ['mid_bridge', 't_mid_arch'] },
        { id: 't_mid_arch', x: -6,  z: 46,  lane: 'mid', links: ['mid_south', 't_b_arch', 't_a_arch'] },
        { id: 't_spawn',    x: 0,   z: 62,  lane: 'mid', links: ['t_b_arch', 't_a_arch'] },
        { id: 'ct_a_arch',  x: 24,  z: -52, lane: 'A',   links: ['ct_spawn', 'ct_mid', 'a_library'] },
        { id: 'a_library',  x: 32,  z: -44, lane: 'A',   links: ['ct_a_arch', 'a_arch_n', 'apts_n'] },
        { id: 'a_arch_n',   x: 48,  z: -34, lane: 'A',   links: ['a_library', 'apts_n', 'a_site'] },
        { id: 'apts_n',     x: 25,  z: -23, lane: 'A',   links: ['a_library', 'a_arch_n', 'apts_top'] },
        { id: 'apts_top',   x: 25,  z: -4,  lane: 'A',   links: ['apts_n', 'apts_e', 'apts_s'] },
        { id: 'apts_e',     x: 38,  z: -4,  lane: 'A',   links: ['apts_top', 'a_short_w'] },
        { id: 'apts_s',     x: 25,  z: 14,  lane: 'A',   links: ['apts_top', 'alt_mid'] },
        { id: 'a_short_w',  x: 34,  z: -16, lane: 'A',   links: ['apts_e', 'a_site'] },
        { id: 'a_site',     x: 48,  z: -16, lane: 'A',   isSite: 'A', links: ['a_arch_n', 'a_short_w', 'a_long_n'] },
        { id: 'a_long_n',   x: 48,  z: -2,  lane: 'A',   links: ['a_site', 'a_long_m'] },
        { id: 'a_long_m',   x: 48,  z: 12,  lane: 'A',   links: ['a_long_n', 'a_crypt', 'a_long_s'] },
        { id: 'a_crypt',    x: 56,  z: 12,  lane: 'A',   links: ['a_long_m'] },
        { id: 'a_long_s',   x: 48,  z: 34,  lane: 'A',   links: ['a_long_m', 't_villa'] },
        { id: 'alt_mid',    x: 20,  z: 16,  lane: 'A',   links: ['boiler_e', 'apts_s', 't_villa'] },
        { id: 't_villa',    x: 34,  z: 44,  lane: 'A',   links: ['a_long_s', 'alt_mid', 't_a_arch'] },
        { id: 't_a_arch',   x: 24,  z: 58,  lane: 'A',   links: ['t_villa', 't_mid_arch', 't_spawn'] }
      ];
      this.waypoints = this.navNodes;
    } else {
      // ======================================================================
      // MAP 3: DE_REACTOR (NUCLEAR FACILITY, LOBBY, CONTROL ROOM & CONTAINER YARD)
      // ======================================================================
      addRoadStrip(6, 0, 18.0, 140);
      addRoadStrip(-50, 0, 14.0, 136);
      addRoadStrip(52, 0, 18.0, 140);
      addRoadStrip(0, -64, 130, 12.0, CS.textures.getMaterial(roadType, 18, 2));
      addRoadStrip(0, 64, 130, 12.0, CS.textures.getMaterial(roadType, 18, 2));

      addBox(76, 0, 0, 12, wallH, 168, 'metal_wall');
      addBox(-76, 0, 0, 12, wallH, 168, 'metal_wall');
      addBox(0, 0, -79, 168, wallH, 8, 'metal_wall');
      addBox(0, 0, 79, 168, wallH, 8, 'metal_wall');

      // --- 1. CT SPAWN HELIPAD, ARMORY GATEHOUSE & DECONTAMINATION LOCK ---
      addBox(0, 0, -74, 108, 5.8, 2.2, 'metal_wall');
      addBox(6, 0, -56, 9.5, 4.0, 2.2, 'metal_wall'); // CT Blast Shield blocking direct Heaven/Mid sightline
      addArchway(-24, -56, 24, 7.8, 6.2, 2.2, false); // CT West Security Gate to B
      addArchway(28, -56, 24, 7.8, 6.2, 2.2, false);  // CT East Security Gate to Yard/Heaven

      // Enterable CT Security Checkpoint Room (x=-26, z=-45)
      addEnterableBuilding(-26, 0, -45, 11, 4.4, 10, { N: 'door', S: 'door', W: 'door', E: 'window' }, 'metal_wall', 'tread_floor', true);
      addTacticalSign(-26, 3.8, -39.8, 0, 'SECURITY LOCK', '#38bdf8');

      // Enterable CT East Garage / Hell Locker Room (x=34, z=-45)
      addEnterableBuilding(34, 0, -45, 11, 4.4, 10, { N: 'door', S: 'door', W: 'window', E: 'door' }, 'metal_wall', 'tread_floor', true);
      addTacticalSign(34, 3.8, -39.8, 0, 'HELL GARAGE', '#38bdf8');

      // NW Aux Generator Room (fills NW corner at x=-54, z=-52)
      addEnterableBuilding(-54, 0, -52, 11, 4.4, 10, { S: 'door', E: 'door', N: 'solid', W: 'solid' }, 'metal_wall', 'tread_floor', true);

      addParkedVehicle(-20, -68, 0.2, 0x1e293b);
      addGeneratorUnit(20, 0, -68, 0);
      addStreetLamp(-14, -62, 5.5);
      addStreetLamp(14, -62, 5.5);

      // --- 2. T SPAWN TRUCK YARD & ENTERABLE RADIO / TROPHY LOBBY ---
      addBox(0, 0, 74, 108, 5.8, 2.2, 'metal_wall');
      addBox(6, 0, 56, 9.5, 4.0, 2.2, 'metal_wall');  // T Spawn Center Shield
      addArchway(-24, 56, 24, 7.8, 6.2, 2.2, false);  // T West Gate to Ramp
      addArchway(28, 56, 24, 7.8, 6.2, 2.2, false);   // T East Gate to Outside Yard

      // Enterable Nuke LOBBY / RADIO ROOM Complex (fills the huge 30m southern void at x=6, z=32!)
      addEnterableBuilding(6, 0, 32, 18, 4.6, 14, { S: 'wideDoor', N: 'wideDoor', W: 'door', E: 'door' }, 'metal_wall', 'tread_floor', true);
      addTacticalSign(6, 4.0, 39.2, Math.PI, 'MAIN LOBBY', '#f59e0b');
      addTacticalSign(6, 4.0, 24.8, 0, 'REACTOR ACCESS', '#ef4444');
      // Interior Lobby side reception desks (leaves center aisle clear for movement & sightline break)
      addBox(0.5, 0, 32, 3.6, 1.25, 1.4, 'metal_wall', true, 'metal');
      addBox(11.5, 0, 32, 3.6, 1.25, 1.4, 'metal_wall', true, 'metal');

      // Enterable T-West Hazmat Room (between Lobby & Ramp, x=-26, z=43)
      addEnterableBuilding(-26, 0, 43, 12, 4.4, 11, { S: 'door', N: 'door', W: 'door', E: 'window' }, 'metal_wall', 'tread_floor', true);
      addTacticalSign(-26, 3.8, 37.3, Math.PI, 'RADIO & TROPHY', '#f59e0b');
      // SW Coolant Pump Shed (fills SW corner at x=-54, z=50)
      addEnterableBuilding(-54, 0, 50, 11, 4.2, 10, { E: 'door', N: 'door', S: 'window', W: 'solid' }, 'metal_wall', 'tread_floor', true);

      // Enterable T-East Substation (between Lobby & Outside Yard, x=32, z=43)
      addEnterableBuilding(32, 0, 43, 12, 4.4, 11, { S: 'door', N: 'door', E: 'door', W: 'window' }, 'metal_wall', 'tread_floor', true);
      addTacticalSign(32, 3.8, 37.3, Math.PI, 'SUBSTATION', '#f59e0b');

      addParkedVehicle(0, 69, Math.PI, 0x0f172a);
      addShippingContainer(-18, 0, 65, 0, 'container_teal');
      addShippingContainer(18, 0, 65, 0, 'container_blue');
      addPalletStack(-36, 0, 62, 0.3);
      addPalletStack(36, 0, 62, -0.3);

      // --- 3. BOMBSITE A: CENTRAL MAIN REACTOR HALL (x = 6, z = -16, y = 0.6m) ---
      this.bombsites.A = { name: 'A', x: 6, y: 0.6, z: -16, radius: 10.5 };
      addBox(6, 0, -16, 28, 0.6, 26, 'tread_floor', true, 'metal');
      addStairs(6, -1.5, 10, 3.2, 0.6, 3, 'north', 'tread_floor');
      addStairs(6, -30.5, 10, 3.2, 0.6, 3, 'south', 'tread_floor');
      addStairs(21.5, -16, 3.2, 8.0, 0.6, 3, 'west', 'tread_floor');

      const decalA = new THREE.Mesh(new THREE.PlaneGeometry(11.5, 11.5), CS.textures.getBombsiteDecalMaterial('A'));
      decalA.rotation.x = -Math.PI / 2;
      decalA.position.set(6, 0.63, -16);
      mapGroup.add(decalA);
      addTacticalSign(6, 4.4, -29.5, 0, 'BOMBSITE A - CORE', '#00f0ff');

      // Twin Glowing Reactor Silos on A and B
      const siloMat = CS.textures.getMaterial('metal_wall', 3, 2);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff, emissive: 0x00d4ff, emissiveIntensity: 0.95, roughness: 0.15, metalness: 0.8
      });

      [[0, -16], [12, -16], [-50, -14], [-50, -2]].forEach(([sx, sz]) => {
        const base = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.9, 6.4, 18), siloMat);
        base.position.set(sx, 3.5, sz);
        base.castShadow = true;
        mapGroup.add(base);

        const glowRing = new THREE.Mesh(new THREE.TorusGeometry(2.9, 0.24, 12, 28), coreMat);
        glowRing.rotation.x = Math.PI / 2;
        glowRing.position.set(sx, 3.2, sz);
        mapGroup.add(glowRing);
        this.reactorRings.push(glowRing);

        this.raycastMeshes.push(base);
        this.colliders.push({
          minX: sx - 2.6, maxX: sx + 2.6,
          minY: 0.0, maxY: 6.8,
          minZ: sz - 2.6, maxZ: sz + 2.6,
          surface: 'metal'
        });

        const pLight = new THREE.PointLight(0x00f0ff, 1.35, 28);
        pLight.position.set(sx, 4.8, sz);
        mapGroup.add(pLight);
      });

      // A-Site Control Consoles & Overhead Gantry Bridge
      addBox(6, 0.6, -24, 5.2, 1.35, 1.0, 'metal_wall', true, 'metal');
      addBox(-1, 0.6, -8, 3.8, 1.35, 1.0, 'metal_wall', true, 'metal');
      addBox(13, 0.6, -8, 3.8, 1.35, 1.0, 'metal_wall', true, 'metal');
      addBox(6, 5.8, -16, 28, 0.6, 5.0, 'tread_floor', true, 'metal'); // High Overhead Crane Gantry

      // Elevated "HEAVEN" Catwalk (z = -38, leaves clear path to North A-Ramp at z=-30.5)
      addBox(6, 0, -38, 30, 1.6, 6.0, 'tread_floor', true, 'metal');
      addStairs(-11.5, -38, 5.0, 5.5, 1.6, 6, 'east', 'tread_floor');
      addStairs(23.5, -38, 5.0, 5.5, 1.6, 6, 'west', 'tread_floor');
      addBox(6, 1.6, -35.2, 12, 1.1, 0.45, 'metal_wall', true, 'metal'); // Heaven Railing Cover

      // Enterable Yellow "HUT" with Doors & Sniper Window onto A-Site!
      const hutMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5, metalness: 0.4 });
      addEnterableBuilding(-1, 0, 10, 9.0, 3.8, 9.0, { S: 'door', N: 'door', E: 'window', W: 'door' }, hutMat, 'tread_floor', true);
      addTacticalSign(-1, 3.4, 14.7, Math.PI, 'YELLOW HUT', '#facc15');
      addLowWall(13, 0, 10, 5.0, 1.3, 0.9, 'metal_wall'); // Mini / Squeaky side cover

      // Reactor Hall Divider Walls with Walk-Through VENT CONNECTOR between A Hall and B Coolant!
      addDetailedHouse(-22, -25, 6.5, 9.2, 30, 'metal_wall', false, null);
      addEnterableBuilding(-22, 0, -4, 8.5, 4.2, 10.0, { E: 'door', W: 'door', N: 'window', S: 'solid' }, 'metal_wall', 'tread_floor', true);
      addTacticalSign(-17.6, 3.6, -4, Math.PI / 2, 'VENT TUNNEL', '#00f0ff');
      addDetailedHouse(-22, 19, 6.5, 9.2, 32, 'metal_wall', false, null);
      addDetailedHouse(28, 19, 6.5, 9.2, 32, 'metal_wall', false, null);

      // --- 4. BOMBSITE B: WEST SUB-COOLANT CHAMBER, CONTROL ROOM & RAMP (x = -50, z = -8) ---
      this.bombsites.B = { name: 'B', x: -50, y: 0.0, z: -8, radius: 10.0 };
      const decalB = new THREE.Mesh(new THREE.PlaneGeometry(11.5, 11.5), CS.textures.getBombsiteDecalMaterial('B'));
      decalB.rotation.x = -Math.PI / 2;
      decalB.position.set(-50, 0.03, -8);
      mapGroup.add(decalB);
      addTacticalSign(-50, 4.2, -32.2, 0, 'BOMBSITE B - COOLANT', '#00f0ff');

      // Enterable B Observation Control Room (West of B-Site, x=-60, z=-8)
      addEnterableBuilding(-60, 0, -8, 7.5, 4.0, 12.0, { E: 'window', N: 'door', S: 'door', W: 'solid' }, 'metal_wall', 'tread_floor', true);
      // Enterable Decon / Toxic Storage Room (East of B-Site, x=-36, z=-20)
      addEnterableBuilding(-36, 0, -20, 9.0, 4.0, 10.0, { W: 'door', N: 'door', S: 'door', E: 'solid' }, 'metal_wall', 'tread_floor', true);
      addTacticalSign(-40.7, 3.5, -20, -Math.PI / 2, 'TOXIC LAB', '#22c55e');

      // Elevated Ramp Room Deck (x=-50, z=24, y=1.2m) with Roofed Ramp Bunker
      addBox(-50, 0, 24, 16, 1.2, 16, 'tread_floor', true, 'metal');
      addStairs(-50, 14.0, 10, 4.0, 1.2, 5, 'south', 'tread_floor');
      addStairs(-50, 34.0, 10, 4.0, 1.2, 5, 'north', 'tread_floor');
      addEnterableBuilding(-50, 1.2, 24, 12, 3.8, 10, { N: 'wideDoor', S: 'wideDoor', E: 'window', W: 'window' }, 'metal_wall', 'tread_floor', true);
      addTacticalSign(-50, 4.4, 29.2, Math.PI, 'RAMP HEADHOUSE', '#f59e0b');

      addBarrelCluster(-42, 0, -10);
      addJerseyBarrier(-44, 0, -2, 0);
      addArchway(-50, -34, 28, 8.5, 8.2, 2.8, false);
      addDetailedHouse(-70, 0, 8.0, 9.5, 58, 'metal_wall', false, null);

      // --- 5. EAST OUTSIDE YARD: SILO, SECRET BUNKER & SHIPPING CONTAINER MAZE ---
      const yellowSiloMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4, metalness: 0.55 });
      const bigSilo = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 4.6, 20), yellowSiloMat);
      bigSilo.position.set(36, 2.3, -4);
      bigSilo.castShadow = true;
      mapGroup.add(bigSilo);
      this.raycastMeshes.push(bigSilo);
      this.colliders.push({ minX: 31.8, maxX: 40.2, minY: 0, maxY: 4.6, minZ: -8.2, maxZ: 0.2, surface: 'metal' });

      // Enterable Yard "SECRET" Stairwell / Transformer House (x=58, z=-8)
      addEnterableBuilding(58, 0, -8, 10, 4.2, 12, { W: 'door', N: 'door', S: 'door', E: 'window' }, 'metal_wall', 'tread_floor', true);
      addTacticalSign(52.8, 3.6, -8, -Math.PI / 2, 'SECRET / YARD', '#38bdf8');

      // Enterable Red Garage at South-East Yard (x=56, z=28)
      addEnterableBuilding(56, 0, 28, 11, 4.2, 12, { N: 'wideDoor', W: 'door', S: 'door', E: 'solid' }, 'metal_wall', 'tread_floor', true);
      addTacticalSign(56, 3.6, 21.8, 0, 'RED GARAGE', '#ef4444');

      // Shipping Container Maze along Yard
      addShippingContainer(46, 0, 12, 0, 'container_red', true);
      addShippingContainer(46, 0, -24, 0, 'container_blue', true);
      addShippingContainer(56, 0, -38, 0, 'container_red', true);

      addParkedVehicle(48, 46, -0.25, 0x1e293b);
      addPalletStack(38, 0, 22, 0.2);
      addDumpster(42, 0, -32, 0, 0x1e3a8a);
      addJerseyBarrier(46, 0, 2, 0);
      addDetailedHouse(71, 0, 8.0, 9.5, 58, 'metal_wall', false, null);

      [[-10, -48], [18, -48], [-10, 48], [18, 48], [62, 44], [62, -48]].forEach(([tx, tz]) => addTree(tx, tz, 'olive'));

      this.spawns.CT = [
        { x: 4,   y: 0, z: -66, rotY: Math.PI },
        { x: -6,  y: 0, z: -66, rotY: Math.PI },
        { x: 14,  y: 0, z: -64, rotY: Math.PI },
        { x: -16, y: 0, z: -64, rotY: Math.PI },
        { x: 28,  y: 0, z: -62, rotY: Math.PI },
        { x: -24, y: 0, z: -62, rotY: Math.PI },
        { x: 42,  y: 0, z: -60, rotY: Math.PI },
        { x: -40, y: 0, z: -60, rotY: Math.PI },
        { x: 6,   y: 0, z: -60, rotY: Math.PI },
        { x: 22,  y: 0, z: -60, rotY: Math.PI }
      ];
      this.spawns.T = [
        { x: 4,   y: 0, z: 66, rotY: 0 },
        { x: -6,  y: 0, z: 66, rotY: 0 },
        { x: 12,  y: 0, z: 63, rotY: 0 },
        { x: -12, y: 0, z: 63, rotY: 0 },
        { x: 28,  y: 0, z: 62, rotY: 0 },
        { x: -26, y: 0, z: 62, rotY: 0 },
        { x: 42,  y: 0, z: 60, rotY: 0 },
        { x: -42, y: 0, z: 60, rotY: 0 },
        { x: 6,   y: 0, z: 60, rotY: 0 },
        { x: -24, y: 0, z: 58, rotY: 0 }
      ];
      this.spawns.DM = [
        { x: 6,   y: 0.6, z: -21, rotY: 0 },
        { x: 6,   y: 1.6, z: -38, rotY: 0 },
        { x: 6,   y: 0,   z: 22,  rotY: Math.PI },
        { x: -50, y: 0,   z: -8,  rotY: 0 },
        { x: -50, y: 1.2, z: 24,  rotY: Math.PI },
        { x: -50, y: 0,   z: -42, rotY: 0 },
        { x: 58,  y: 0,   z: -8,  rotY: Math.PI },
        { x: 38,  y: 0,   z: -24, rotY: 0 },
        { x: 56,  y: 0,   z: 28,  rotY: Math.PI },
        { x: -36, y: 0,   z: -20, rotY: Math.PI / 2 },
        { x: -26, y: 0,   z: 43,  rotY: 0 },
        { x: 32,  y: 0,   z: 43,  rotY: Math.PI },
        { x: 34,  y: 0,   z: -45, rotY: 0 },
        { x: -26, y: 0,   z: -45, rotY: 0 },
        { x: -1,  y: 0,   z: 10,  rotY: 0 },
        { x: -22, y: 0,   z: -4,  rotY: Math.PI / 2 },
        { x: 25,  y: 0,   z: -16, rotY: -Math.PI / 2 },
        { x: -60, y: 0,   z: -8,  rotY: Math.PI / 2 }
      ];

      this.mysteryBoxes = [
        { x: 6,   y: 0.0, z: 22,  label: 'Reaktor Hof' },
        { x: 6,   y: 0.6, z: -20, label: 'Reaktor A' },
        { x: -50, y: 0.0, z: -8,  label: 'Coolant B' }
      ];

      this.navNodes = [
        { id: 'ct_spawn',   x: 6,   z: -62, lane: 'mid', links: ['ct_b_gate', 'ct_a_gate'] },
        { id: 'ct_b_gate',  x: -24, z: -52, lane: 'B',   links: ['ct_spawn', 'ct_sec', 'heaven_w'] },
        { id: 'ct_sec',     x: -26, z: -45, lane: 'B',   links: ['ct_b_gate', 'b_arch_n'] },
        { id: 'b_arch_n',   x: -50, z: -40, lane: 'B',   links: ['ct_sec', 'b_north'] },
        { id: 'b_north',    x: -50, z: -24, lane: 'B',   links: ['b_arch_n', 'b_decon', 'b_ctrl', 'b_east'] },
        { id: 'b_decon',    x: -36, z: -20, lane: 'B',   links: ['b_north', 'b_vent_w'] },
        { id: 'b_ctrl',     x: -60, z: -8,  lane: 'B',   links: ['b_north', 'b_south'] },
        { id: 'b_east',     x: -44, z: -8,  lane: 'B',   links: ['b_north', 'b_site', 'b_vent_w', 'b_south'] },
        { id: 'b_site',     x: -50, z: -8,  lane: 'B',   isSite: 'B', links: ['b_east'] },
        { id: 'b_vent_w',   x: -36, z: -4,  lane: 'B',   links: ['b_east', 'b_decon', 'vent_room', 'b_south'] },
        { id: 'vent_room',  x: -22, z: -4,  lane: 'mid', links: ['b_vent_w', 'a_west'] },
        { id: 'b_south',    x: -50, z: 8,   lane: 'B',   links: ['b_ctrl', 'b_east', 'b_vent_w', 'b_ramp'] },
        { id: 'b_ramp',     x: -50, z: 24,  lane: 'B',   links: ['b_south', 'b_ramp_s'] },
        { id: 'b_ramp_s',   x: -50, z: 42,  lane: 'B',   links: ['b_ramp', 't_radio'] },
        { id: 't_radio',    x: -26, z: 43,  lane: 'B',   links: ['b_ramp_s', 't_b_gate'] },
        { id: 't_b_gate',   x: -24, z: 58,  lane: 'B',   links: ['t_radio', 't_lobby_s', 't_spawn'] },
        { id: 'heaven_w',   x: -16, z: -38, lane: 'mid', links: ['ct_b_gate', 'heaven_top', 'a_north_w'] },
        { id: 'heaven_top', x: 6,   z: -38, lane: 'mid', links: ['heaven_w', 'heaven_e'] },
        { id: 'heaven_e',   x: 28,  z: -38, lane: 'A',   links: ['heaven_top', 'ct_garage', 'yard_n'] },
        { id: 'a_north_w',  x: -6,  z: -24, lane: 'mid', links: ['heaven_w', 'a_north', 'a_west'] },
        { id: 'a_north',    x: 6,   z: -21, lane: 'mid', links: ['a_north_w', 'a_site', 'a_east'] },
        { id: 'a_west',     x: -6,  z: -16, lane: 'mid', links: ['a_north_w', 'vent_room', 'a_south'] },
        { id: 'a_site',     x: 6,   z: -16, lane: 'A',   isSite: 'A', links: ['a_north', 'a_south'] },
        { id: 'a_east',     x: 17,  z: -16, lane: 'A',   links: ['a_north', 'a_south', 'a_mini'] },
        { id: 'a_south',    x: 6,   z: -11, lane: 'mid', links: ['a_west', 'a_site', 'a_east', 'a_ramp_s'] },
        { id: 'a_ramp_s',   x: 6,   z: 2,   lane: 'mid', links: ['a_south', 'hut_in', 'squeaky'] },
        { id: 'hut_in',     x: -1,  z: 10,  lane: 'mid', links: ['a_ramp_s', 'lobby_n'] },
        { id: 'squeaky',    x: 8,   z: 10,  lane: 'mid', links: ['a_ramp_s', 'lobby_n'] },
        { id: 'lobby_n',    x: 6,   z: 21,  lane: 'mid', links: ['hut_in', 'squeaky', 't_lobby_s'] },
        { id: 't_lobby_s',  x: 6,   z: 44,  lane: 'mid', links: ['lobby_n', 't_b_gate', 't_a_gate'] },
        { id: 't_spawn',    x: 6,   z: 62,  lane: 'mid', links: ['t_b_gate', 't_a_gate'] },
        { id: 'ct_a_gate',  x: 28,  z: -52, lane: 'A',   links: ['ct_spawn', 'ct_garage'] },
        { id: 'ct_garage',  x: 34,  z: -45, lane: 'A',   links: ['ct_a_gate', 'heaven_e', 'yard_n'] },
        { id: 'yard_n',     x: 36,  z: -24, lane: 'A',   links: ['ct_garage', 'heaven_e', 'a_mini', 'yard_secret'] },
        { id: 'a_mini',     x: 25,  z: -16, lane: 'A',   links: ['yard_n', 'a_east'] },
        { id: 'yard_secret', x: 58, z: -8,  lane: 'A',   links: ['yard_n', 'yard_s'] },
        { id: 'yard_s',     x: 56,  z: 28,  lane: 'A',   links: ['yard_secret', 't_sub'] },
        { id: 't_sub',      x: 32,  z: 43,  lane: 'A',   links: ['yard_s', 't_a_gate'] },
        { id: 't_a_gate',   x: 28,  z: 58,  lane: 'A',   links: ['t_sub', 't_lobby_s', 't_spawn'] }
      ];
      this.waypoints = this.navNodes;
    }

    // ========================================================================
    // 10. FLOATING ATMOSPHERIC PARTICLES
    // ========================================================================
    const pCount = 280;
    const pGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 148;
      positions[i * 3 + 1] = 0.5 + Math.random() * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 148;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pColor = theme === 'desert' ? 0xfde68a : (theme === 'industrial' ? 0xfdba74 : 0x38bdf8);
    const pMat = new THREE.PointsMaterial({ color: pColor, size: 0.16, transparent: true, opacity: 0.65 });
    this.envParticles = new THREE.Points(pGeo, pMat);
    mapGroup.add(this.envParticles);

    scene.add(mapGroup);
    return mapGroup;
  }

  // Dynamic per-frame animation of Wind, Clouds, Rooftop Fans, Fountain & Particles!
  updateEnvironment(dt, timeSec) {
    for (const item of this.animatedWindMeshes) {
      const w = Math.sin(timeSec * 2.1 + item.phase) * item.amp;
      const w2 = Math.cos(timeSec * 1.6 + item.phase) * (item.amp * 0.6);
      item.mesh.rotation.x = item.baseRotX + w;
      item.mesh.rotation.z = item.baseRotZ + w2;
    }

    for (const sp of this.spinningMeshes) {
      sp.mesh.rotation[sp.axis] += dt * sp.speed;
    }

    for (const cg of this.cloudGroups) {
      cg.position.x += dt * cg.userData.speed;
      if (cg.position.x > 140) cg.position.x = -140;
    }

    for (const fd of this.fountainDrops) {
      fd.phase = (fd.phase + dt * 0.85) % 1.0;
      const p = fd.phase;
      const r = p * 2.4;
      const y = 3.1 + Math.sin(p * Math.PI) * 1.4 - p * 2.2;
      fd.mesh.position.set(
        fd.cx + Math.cos(fd.angle) * r,
        Math.max(0.65, y),
        fd.cz + Math.sin(fd.angle) * r
      );
    }

    for (let i = 0; i < this.reactorRings.length; i++) {
      const ring = this.reactorRings[i];
      ring.position.y = 3.2 + Math.sin(timeSec * 2.5 + i) * 1.1;
    }

    if (this.envParticles) {
      this.envParticles.rotation.y += dt * 0.025;
      this.envParticles.position.y = Math.sin(timeSec * 0.7) * 0.35;
    }
  }

  // Render Live 2D Tactical Radar on HUD Canvas
  renderRadar(ctx, width, height, player, bots, plantedBomb, droppedBomb, zombieCtx = null) {
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, width / 2 - 3, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = zombieCtx ? 'rgba(18, 10, 14, 0.90)' : 'rgba(11, 17, 28, 0.88)';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = zombieCtx ? 'rgba(239, 68, 68, 0.12)' : 'rgba(56, 189, 248, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 28) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
    }

    const scale = (width - 18) / 168;
    const toRadar = (wx, wz) => ({
      rx: width / 2 + wx * scale,
      ry: height / 2 + wz * scale
    });

    for (const c of this.colliders) {
      const h = c.maxY - c.minY;
      if (h < 0.7 || c.minY > 2.2) continue;
      const p1 = toRadar(c.minX, c.minZ);
      const w = (c.maxX - c.minX) * scale;
      const d = (c.maxZ - c.minZ) * scale;
      ctx.fillStyle = c.surface === 'wood' ? 'rgba(217, 119, 6, 0.55)' : 'rgba(148, 163, 184, 0.45)';
      ctx.fillRect(p1.rx, p1.ry, Math.max(1.5, w), Math.max(1.5, d));
    }

    if (!zombieCtx) {
      ['A', 'B'].forEach(siteKey => {
        const s = this.bombsites[siteKey];
        if (!s) return;
        const p = toRadar(s.x, s.z);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.beginPath();
        ctx.arc(p.rx, p.ry, s.radius * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#fca5a5';
        ctx.font = '900 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(siteKey, p.rx, p.ry);
      });
    } else {
      // Zombie Mode: Active Mystery Box & Power-ups on Radar!
      if (zombieCtx.activeBoxPos) {
        const bx = toRadar(zombieCtx.activeBoxPos.x, zombieCtx.activeBoxPos.z);
        const pulse = 5.5 + Math.sin(performance.now() * 0.01) * 2.2;
        ctx.fillStyle = 'rgba(0, 240, 255, 0.35)';
        ctx.beginPath(); ctx.arc(bx.rx, bx.ry, pulse + 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.fillRect(bx.rx - 4.5, bx.ry - 4.5, 9, 9);
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx.rx - 4.5, bx.ry - 4.5, 9, 9);
      }
      for (const pu of (zombieCtx.powerups || [])) {
        const ppu = toRadar(pu.position.x, pu.position.z);
        ctx.fillStyle = pu.hex || '#4ade80';
        ctx.beginPath(); ctx.arc(ppu.rx, ppu.ry, 3.2, 0, Math.PI * 2); ctx.fill();
      }
    }

    if (plantedBomb && plantedBomb.active) {
      const bp = toRadar(plantedBomb.position.x, plantedBomb.position.z);
      const pulse = 5 + Math.sin(performance.now() * 0.015) * 3;
      ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
      ctx.beginPath(); ctx.arc(bp.rx, bp.ry, pulse + 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff1e27';
      ctx.beginPath(); ctx.arc(bp.rx, bp.ry, 4.5, 0, Math.PI * 2); ctx.fill();
    } else if (droppedBomb && droppedBomb.active) {
      const dp = toRadar(droppedBomb.position.x, droppedBomb.position.z);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(dp.rx - 3, dp.ry - 3, 6, 6);
    }

    for (const b of (bots || [])) {
      if (b.dead) continue;
      if (b.isZombie) {
        const zb = toRadar(b.position.x, b.position.z);
        ctx.fillStyle = b.variant === 'brute' ? '#c084fc' : (b.variant === 'runner' ? '#fb923c' : '#ef4444');
        ctx.beginPath();
        ctx.arc(zb.rx, zb.ry, b.variant === 'brute' ? 4.8 : 3.4, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      const isAlly = b.team === player.team;
      const isSpotted = b.radarVisibleTimer > 0;
      if (!isAlly && !isSpotted) continue;

      const bp = toRadar(b.position.x, b.position.z);
      ctx.fillStyle = isAlly ? (b.team === 'CT' ? '#38bdf8' : '#facc15') : '#ef4444';
      ctx.beginPath();
      ctx.arc(bp.rx, bp.ry, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    const pp = toRadar(player.position.x, player.position.z);
    const yaw = player.yaw;
    const dirAngle = -yaw - Math.PI / 2;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.beginPath();
    ctx.moveTo(pp.rx, pp.ry);
    ctx.arc(pp.rx, pp.ry, 28, dirAngle - 0.45, dirAngle + 0.45);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(pp.rx, pp.ry, 4.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, width / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();
  }
}

CS.mapBuilder = new MapBuilder();
