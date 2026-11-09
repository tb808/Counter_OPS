// ============================================================================
// COUNTER OPS: TACTICAL STRIKE - 3D AGENTS, SMART AI BOTS, GRENADES & FX
// ============================================================================
window.CS = window.CS || {};

CS.BOT_NAMES = [
  'Phoenix', 'Valkyrie', 'Maverick', 'Ghost', 'Viper',
  'Sentinel', 'Jaeger', 'Cobra', 'Titan', 'Raptor', 'Spectre', 'Reaper'
];

// Build an articulated 3D Agent Character (used for Bots AND 3D Lobby Preview)
CS.buildAgentModel = function(team = 'CT', outfitId = null, weaponId = 'm4a4', skinId = 'default', knifeModelId = 'knife_default', gloveId = 'gloves_default') {
  const root = new THREE.Group();

  // Default team colors if no custom outfit specified
  let suitCol = team === 'CT' ? '#1e3a5f' : '#5c4028';
  let vestCol = team === 'CT' ? '#0f172a' : '#271c15';
  let helmCol = team === 'CT' ? '#1e293b' : '#3f2e21';
  let visorCol = team === 'CT' ? '#38bdf8' : '#ef4444';
  let accCol = team === 'CT' ? '#0284c7' : '#d97706';

  if (outfitId && CS.AGENT_OUTFITS[outfitId]) {
    const o = CS.AGENT_OUTFITS[outfitId];
    suitCol = o.suitColor;
    vestCol = o.vestColor;
    helmCol = o.helmetColor;
    visorCol = o.visorColor;
    accCol = o.accentColor;
  }

  const suitMat = new THREE.MeshStandardMaterial({ color: suitCol, roughness: 0.72, metalness: 0.12 });
  const vestMat = new THREE.MeshStandardMaterial({ color: vestCol, roughness: 0.55, metalness: 0.3 });
  const helmMat = new THREE.MeshStandardMaterial({ color: helmCol, roughness: 0.4, metalness: 0.45 });
  const visorMat = new THREE.MeshStandardMaterial({
    color: visorCol, emissive: visorCol, emissiveIntensity: 0.35, roughness: 0.15, metalness: 0.85
  });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.65 });
  const bootMat = new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.6, metalness: 0.2 });
  const accMat = new THREE.MeshStandardMaterial({ color: accCol, roughness: 0.4, metalness: 0.5 });

  const hitboxes = [];
  const tagHitbox = (mesh, part) => {
    mesh.userData.hitboxPart = part;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    hitboxes.push(mesh);
  };

  // --- 1. LEGS (PIVOT AT HIP y = 0.86) ---
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.14, 0.86, 0);
  const lThigh = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.44, 0.21), suitMat);
  lThigh.position.y = -0.22;
  tagHitbox(lThigh, 'legs');
  leftLegPivot.add(lThigh);
  const lKnee = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.11, 0.23), vestMat);
  lKnee.position.set(0, -0.44, 0.02);
  leftLegPivot.add(lKnee);
  const lCalf = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.38, 0.19), suitMat);
  lCalf.position.y = -0.62;
  tagHitbox(lCalf, 'legs');
  leftLegPivot.add(lCalf);
  const lBoot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.13, 0.27), bootMat);
  lBoot.position.set(0, -0.80, -0.03);
  leftLegPivot.add(lBoot);
  root.add(leftLegPivot);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.14, 0.86, 0);
  const rThigh = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.44, 0.21), suitMat);
  rThigh.position.y = -0.22;
  tagHitbox(rThigh, 'legs');
  rightLegPivot.add(rThigh);
  const rKnee = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.11, 0.23), vestMat);
  rKnee.position.set(0, -0.44, 0.02);
  rightLegPivot.add(rKnee);
  const rCalf = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.38, 0.19), suitMat);
  rCalf.position.y = -0.62;
  tagHitbox(rCalf, 'legs');
  rightLegPivot.add(rCalf);
  const rBoot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.13, 0.27), bootMat);
  rBoot.position.set(0, -0.80, -0.03);
  rightLegPivot.add(rBoot);
  root.add(rightLegPivot);

  // --- 2. UPPER BODY GROUP (Supports crouching) ---
  const upperBody = new THREE.Group();
  upperBody.position.set(0, 0.86, 0);
  root.add(upperBody);

  // Pelvis / Belt
  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.18, 0.26), vestMat);
  pelvis.position.y = 0.07;
  tagHitbox(pelvis, 'stomach');
  upperBody.add(pelvis);

  // Torso + Tactical Plate Carrier Vest
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.52, 0.27), suitMat);
  torso.position.y = 0.41;
  tagHitbox(torso, 'chest');
  upperBody.add(torso);

  const plateCarrier = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.42, 0.31), vestMat);
  plateCarrier.position.y = 0.42;
  tagHitbox(plateCarrier, 'chest');
  upperBody.add(plateCarrier);

  // Chest Pouches & Team Patch
  const patch = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.33), accMat);
  patch.position.y = 0.52;
  upperBody.add(patch);

  for (let i = -1; i <= 1; i++) {
    const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.14, 0.06), helmMat);
    pouch.position.set(i * 0.13, 0.32, -0.17);
    upperBody.add(pouch);
  }

  // Backpack
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.38, 0.16), vestMat);
  pack.position.set(0, 0.43, 0.20);
  upperBody.add(pack);

  // --- 3. HEAD, HELMET & VISOR ---
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.82, 0);
  upperBody.add(headGroup);

  const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.30, 0.28), helmMat);
  tagHitbox(headBox, 'head');
  headGroup.add(headBox);

  // Tactical Helmet Dome
  const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.33), helmMat);
  helmet.position.set(0, 0.10, 0.01);
  tagHitbox(helmet, 'head');
  headGroup.add(helmet);

  // Glowing Goggles / Ballistic Visor
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.09, 0.05), visorMat);
  visor.position.set(0, 0.03, -0.14);
  tagHitbox(visor, 'head');
  headGroup.add(visor);

  // --- 4. ARMS & EQUIPPED 3D WEAPON ---
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.32, 0.60, 0);
  const rShoulder = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.18), accMat);
  rightArmPivot.add(rShoulder);
  const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 0.14), suitMat);
  rArm.position.set(0, -0.15, -0.16);
  rArm.rotation.x = Math.PI / 2.3;
  tagHitbox(rArm, 'chest');
  rightArmPivot.add(rArm);
  upperBody.add(rightArmPivot);

  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.32, 0.60, 0);
  const lShoulder = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.18), accMat);
  leftArmPivot.add(lShoulder);
  const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.42, 0.14), suitMat);
  lArm.position.set(0.08, -0.15, -0.18);
  lArm.rotation.x = Math.PI / 2.3;
  lArm.rotation.z = -0.35;
  tagHitbox(lArm, 'chest');
  leftArmPivot.add(lArm);
  upperBody.add(leftArmPivot);

  // Attach 3D Weapon to Agent Hands
  const gunMount = new THREE.Group();
  gunMount.position.set(0.12, 0.46, -0.32);
  const gunModel = CS.weaponBuilder.buildWeaponModel(weaponId, skinId, knifeModelId, gloveId, outfitId || 'sas_navy', false);
  gunModel.scale.set(1.15, 1.15, 1.15);
  gunMount.add(gunModel);
  upperBody.add(gunMount);

  root.userData = {
    leftLegPivot,
    rightLegPivot,
    upperBody,
    headGroup,
    gunMount,
    hitboxes
  };

  return root;
};

// ============================================================================
// SMART TACTICAL AI BOT CLASS
// ============================================================================
class TacticalBot {
  constructor(id, name, team, scene) {
    this.id = id;
    this.name = name;
    this.team = team; // 'CT' or 'T'
    this.scene = scene;

    this.health = 100;
    this.armor = 100;
    this.hasHelmet = true;
    this.hasDefuseKit = team === 'CT';
    this.hasC4 = false;
    this.money = 800;
    this.kills = 0;
    this.deaths = 0;
    this.assists = 0;
    this.armsRaceIndex = 0;

    this.weaponId = team === 'CT' ? 'usps' : 'glock';
    this.skinId = 'default';
    this.ammo = 20;
    this.dead = false;
    this.respawnTimer = 0;

    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.yaw = 0;
    this.walkPhase = Math.random() * 10;
    this.stepAccum = 0;

    // Ragdoll / Death Animation State
    this.deathTimer = 0;
    this.deathFallDir = 1;
    this.deathYawSpin = 0;
    this.deathVelocity = new THREE.Vector3();

    // AI Tactical State
    this.targetWaypoint = null;
    this.currentNavNode = null;
    this.prevNavNode = null;
    this.assignedLane = 'mid';
    this.repathTimer = 0;
    this.fireCooldown = 0;
    this.burstTimer = 0;
    this.reactionTimer = 0;
    this.strafeDir = 1;
    this.strafeTimer = 0;
    this.flashedTimer = 0;
    this.radarVisibleTimer = 0;
    this.plantProgress = 0;
    this.defuseProgress = 0;

    this.mesh = null;
    this.buildMesh();
  }

  buildMesh() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
    }
    const outfitId = this.team === 'CT' ? 'sas_navy' : 'phoenix_crimson';
    this.mesh = CS.buildAgentModel(this.team, outfitId, this.weaponId, this.skinId);
    // Tag all hitboxes with a reference to this bot
    for (const hb of this.mesh.userData.hitboxes) {
      hb.userData.bot = this;
    }
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);
  }

  equipWeapon(wId, skinId = null) {
    if (!CS.WEAPONS[wId]) return;
    this.weaponId = wId;
    if (skinId) this.skinId = skinId;
    else {
      const skinKeys = Object.keys(CS.SKINS);
      this.skinId = skinKeys[Math.floor(Math.random() * Math.min(8, skinKeys.length))];
    }
    this.ammo = CS.WEAPONS[wId].magSize || 30;
    this.buildMesh();
  }

  spawnAt(spawnPt) {
    this.dead = false;
    this.health = 100;
    this.armor = 100;
    this.hasHelmet = true;
    this.flashedTimer = 0;
    this.plantProgress = 0;
    this.defuseProgress = 0;
    this.deathTimer = 0;
    this.deathVelocity.set(0, 0, 0);
    this.position.set(spawnPt.x + (Math.random() - 0.5) * 1.6, spawnPt.y || 0, spawnPt.z + (Math.random() - 0.5) * 1.6);
    this.yaw = spawnPt.rotY || 0;
    if (this.mesh) {
      this.mesh.visible = true;
      this.mesh.rotation.set(0, this.yaw, 0);
      this.mesh.position.copy(this.position);
      const ud = this.mesh.userData;
      if (ud.upperBody) ud.upperBody.rotation.set(0, 0, 0);
      if (ud.headGroup) ud.headGroup.rotation.set(0, 0, 0);
      if (ud.leftLegPivot) ud.leftLegPivot.rotation.set(0, 0, 0);
      if (ud.rightLegPivot) ud.rightLegPivot.rotation.set(0, 0, 0);
    }
    const lanes = ['A', 'mid', 'B'];
    this.assignedLane = lanes[Math.floor(Math.random() * lanes.length)];
    this.currentNavNode = null;
    this.prevNavNode = null;
    this.pickNextWaypoint();
  }

  buyEquipmentForRound(modeId) {
    if (modeId === 'armsrace') {
      const prog = CS.MODES.armsrace.progression;
      const wId = prog[Math.min(this.armsRaceIndex, prog.length - 1)];
      this.equipWeapon(wId);
      return;
    }
    if (modeId === 'tdm' || this.money >= 3100) {
      const rifles = this.team === 'CT' ? ['m4a4', 'm4a1s', 'aug', 'awp'] : ['ak47', 'famas', 'ssg08', 'awp'];
      const pick = rifles[Math.floor(Math.random() * rifles.length)];
      this.equipWeapon(pick);
      if (modeId === 'bomb') this.money = Math.max(0, this.money - 3100);
    } else if (this.money >= 1500) {
      const smgs = ['mp9', 'ump45', 'nova', 'famas'];
      this.equipWeapon(smgs[Math.floor(Math.random() * smgs.length)]);
      if (modeId === 'bomb') this.money = Math.max(0, this.money - 1400);
    } else {
      const pistols = this.team === 'CT' ? ['usps', 'p250', 'deagle'] : ['glock', 'p250', 'deagle'];
      this.equipWeapon(pistols[Math.floor(Math.random() * pistols.length)]);
    }
  }

  findNearestNavNode(x, z, nodes) {
    let best = null;
    let bestD = Infinity;
    for (const n of nodes) {
      const d = Math.hypot(n.x - x, n.z - z);
      if (d < bestD) {
        bestD = d;
        best = n;
      }
    }
    return best;
  }

  findNextHopBFS(startNode, goalNode, byId) {
    if (!startNode || !goalNode) return null;
    if (startNode.id === goalNode.id) return goalNode;
    const visited = new Set([startNode.id]);
    const queue = [];
    for (const nbId of (startNode.links || [])) {
      const nb = byId[nbId];
      if (nb) {
        visited.add(nbId);
        queue.push({ node: nb, firstHop: nb });
      }
    }
    while (queue.length > 0) {
      const { node, firstHop } = queue.shift();
      if (node.id === goalNode.id) return firstHop;
      for (const nbId of (node.links || [])) {
        if (!visited.has(nbId) && byId[nbId]) {
          visited.add(nbId);
          queue.push({ node: byId[nbId], firstHop });
        }
      }
    }
    return goalNode;
  }

  pickNextWaypoint(plantedBomb = null) {
    const nodes = (CS.mapBuilder.navNodes && CS.mapBuilder.navNodes.length)
      ? CS.mapBuilder.navNodes
      : CS.mapBuilder.waypoints;
    if (!nodes || !nodes.length) return;

    const byId = {};
    for (const n of nodes) byId[n.id] = n;

    const curNode = (this.currentNavNode && byId[this.currentNavNode])
      ? byId[this.currentNavNode]
      : this.findNearestNavNode(this.position.x, this.position.z, nodes);

    // 1. If bomb is planted, navigate along connected graph toward the planted bomb!
    if (plantedBomb && plantedBomb.active) {
      const dToBomb = Math.hypot(plantedBomb.position.x - this.position.x, plantedBomb.position.z - this.position.z);
      const goal = this.findNearestNavNode(plantedBomb.position.x, plantedBomb.position.z, nodes);
      if (dToBomb < 6.5 || (curNode && goal && curNode.id === goal.id)) {
        this.targetWaypoint = { x: plantedBomb.position.x, z: plantedBomb.position.z };
        return;
      }
      const hop = this.findNextHopBFS(curNode, goal, byId) || goal;
      this.prevNavNode = curNode ? curNode.id : null;
      this.currentNavNode = hop.id;
      this.targetWaypoint = { x: hop.x + (Math.random() - 0.5) * 1.2, z: hop.z + (Math.random() - 0.5) * 1.2 };
      return;
    }

    // 1b. If C4 was dropped on the ground, Terrorist bots navigate to retrieve it!
    const droppedBomb = CS.game && CS.game.droppedBomb;
    if (this.team === 'T' && droppedBomb && droppedBomb.active) {
      const dToDrop = Math.hypot(droppedBomb.position.x - this.position.x, droppedBomb.position.z - this.position.z);
      const goal = this.findNearestNavNode(droppedBomb.position.x, droppedBomb.position.z, nodes);
      if (dToDrop < 6.5 || (curNode && goal && curNode.id === goal.id)) {
        this.targetWaypoint = { x: droppedBomb.position.x, z: droppedBomb.position.z };
        return;
      }
      const hop = this.findNextHopBFS(curNode, goal, byId) || goal;
      this.prevNavNode = curNode ? curNode.id : null;
      this.currentNavNode = hop.id;
      this.targetWaypoint = { x: hop.x + (Math.random() - 0.5) * 1.2, z: hop.z + (Math.random() - 0.5) * 1.2 };
      return;
    }

    // 2. If T with C4, navigate along connected graph to Bombsite A or B!
    if (this.team === 'T' && this.hasC4) {
      const siteKey = this.assignedLane === 'B' ? 'B' : 'A';
      const site = CS.mapBuilder.bombsites[siteKey];
      if (site) {
        const dToSite = Math.hypot(site.x - this.position.x, site.z - this.position.z);
        const siteNode = nodes.find(n => n.isSite === siteKey) || this.findNearestNavNode(site.x, site.z, nodes);
        if (dToSite < 7.0 || (curNode && siteNode && curNode.id === siteNode.id)) {
          this.targetWaypoint = { x: site.x + (Math.random() - 0.5) * 1.8, z: site.z + (Math.random() - 0.5) * 1.8 };
          return;
        }
        const hop = this.findNextHopBFS(curNode, siteNode, byId) || siteNode;
        this.prevNavNode = curNode ? curNode.id : null;
        this.currentNavNode = hop.id;
        this.targetWaypoint = { x: hop.x + (Math.random() - 0.5) * 1.4, z: hop.z + (Math.random() - 0.5) * 1.4 };
        return;
      }
    }

    // 3. Connected tactical patrol along nav-graph edges (never tries to walk through buildings!)
    if (curNode && curNode.links && curNode.links.length > 0) {
      const neighbors = curNode.links.map(id => byId[id]).filter(Boolean);
      const forward = neighbors.filter(n => n.id !== this.prevNavNode);
      const pool = forward.length > 0 ? forward : neighbors;
      const lanePref = pool.filter(n => n.lane === this.assignedLane);
      const pickPool = (lanePref.length > 0 && Math.random() < 0.72) ? lanePref : pool;
      const chosen = pickPool[Math.floor(Math.random() * pickPool.length)] || pool[0];
      this.prevNavNode = curNode.id;
      this.currentNavNode = chosen.id;
      this.targetWaypoint = {
        x: chosen.x + (Math.random() - 0.5) * 1.6,
        z: chosen.z + (Math.random() - 0.5) * 1.6
      };
      return;
    }

    const laneWps = nodes.filter(w => w.lane === this.assignedLane || Math.random() < 0.25);
    const chosen = laneWps[Math.floor(Math.random() * laneWps.length)] || nodes[0];
    this.targetWaypoint = {
      x: chosen.x + (Math.random() - 0.5) * 2.0,
      z: chosen.z + (Math.random() - 0.5) * 2.0
    };
  }

  takeDamage(amount, attacker, isHeadshot = false) {
    if (this.dead) return false;
    this.health -= Math.round(amount);
    this.radarVisibleTimer = 3.0;

    if (this.health <= 0) {
      this.health = 0;
      this.dead = true;
      this.deaths++;
      this.plantProgress = 0;
      this.defuseProgress = 0;
      this.deathTimer = 0;
      this.deathFallDir = isHeadshot ? 1 : (Math.random() < 0.7 ? -1 : 1);
      this.deathYawSpin = (Math.random() - 0.5) * 1.6;

      // Knockback velocity away from the bullet impact
      if (attacker && attacker.position) {
        const kb = this.position.clone().sub(attacker.position);
        kb.y = 0;
        if (kb.lengthSq() > 0.001) kb.normalize();
        const force = isHeadshot ? 4.8 : 2.8;
        this.deathVelocity.set(kb.x * force, 0, kb.z * force);
      } else {
        this.deathVelocity.set(0, 0, 0);
      }
      return true; // Killed!
    }
    return false;
  }

  update(dt, game) {
    if (this.dead) {
      this.deathTimer += dt;
      // Multi-joint ragdoll-style collapse animation with knockback slide
      if (this.mesh && this.deathTimer < 1.2) {
        const p = Math.min(1, this.deathTimer / 0.52);
        const ease = 1 - Math.pow(1 - p, 3);

        // Slide slightly from bullet momentum
        if (this.deathVelocity.lengthSq() > 0.05) {
          this.moveWithCollision(this.deathVelocity.x * dt, this.deathVelocity.z * dt);
          this.deathVelocity.multiplyScalar(Math.max(0, 1 - dt * 6.5));
        }

        const ud = this.mesh.userData;
        // Knees buckle first, then torso & body hit the ground
        if (ud.leftLegPivot && ud.rightLegPivot) {
          ud.leftLegPivot.rotation.x = ease * 0.65 * this.deathFallDir;
          ud.rightLegPivot.rotation.x = ease * 0.42 * this.deathFallDir;
        }
        if (ud.upperBody) {
          ud.upperBody.rotation.x = ease * 0.35 * -this.deathFallDir;
          ud.upperBody.rotation.z = ease * (this.deathYawSpin * 0.25);
        }
        if (ud.headGroup) {
          ud.headGroup.rotation.x = ease * 0.55 * this.deathFallDir;
          ud.headGroup.rotation.z = ease * 0.35;
        }

        this.mesh.rotation.y = this.yaw + ease * this.deathYawSpin * 0.45;
        this.mesh.rotation.x = ease * (Math.PI / 2 - 0.08) * -this.deathFallDir;
        this.mesh.rotation.z = ease * (this.deathYawSpin * 0.18);
        this.mesh.position.set(
          this.position.x,
          this.position.y + 0.14 * ease,
          this.position.z
        );
      }
      if (game.modeConfig.respawn) {
        this.respawnTimer -= dt;
        if (this.respawnTimer <= 0) {
          const teamSpawns = CS.mapBuilder.spawns[this.team] || [];
          const dmSpawns = CS.mapBuilder.spawns.DM || [];
          const pool = (Math.random() < 0.5 && dmSpawns.length > 0) ? dmSpawns : teamSpawns;
          const sp = pool[Math.floor(Math.random() * pool.length)];
          this.spawnAt(sp);
          this.buyEquipmentForRound(game.currentMode);
        }
      }
      return;
    }

    if (this.radarVisibleTimer > 0) this.radarVisibleTimer -= dt;
    if (this.flashedTimer > 0) this.flashedTimer -= dt;
    if (this.fireCooldown > 0) this.fireCooldown -= dt;

    // Freeze during buy phase in Bomb Defusal
    if (game.roundPhase === 'buy') {
      this.mesh.position.copy(this.position);
      return;
    }

    // 1. Acquire nearest visible enemy (Player or Enemy Bot)
    let bestTarget = null;
    let bestDist = 115;

    const candidates = [];
    // Never target or shoot the player while their Spawn Shield is active!
    if (!game.player.dead && game.player.team !== this.team && (game.player.spawnShieldTimer || 0) <= 0) {
      candidates.push({ isPlayer: true, entity: game.player, pos: game.player.position });
    }
    for (const other of game.bots) {
      if (!other.dead && other.team !== this.team) {
        candidates.push({ isPlayer: false, entity: other, pos: other.position });
      }
    }

    const eyePos = new THREE.Vector3(this.position.x, this.position.y + 1.55, this.position.z);

    if (this.flashedTimer <= 0.4) {
      for (const cand of candidates) {
        const targetEye = new THREE.Vector3(cand.pos.x, cand.pos.y + 1.35, cand.pos.z);
        const dist = eyePos.distanceTo(targetEye);
        if (dist < bestDist && game.hasLineOfSight(eyePos, targetEye)) {
          bestDist = dist;
          bestTarget = cand;
        }
      }
    }

    // 2. Combat Aiming & Firing
    if (bestTarget) {
      this.radarVisibleTimer = 2.5;
      const dx = bestTarget.pos.x - this.position.x;
      const dz = bestTarget.pos.z - this.position.z;
      const desiredYaw = Math.atan2(-dx, -dz);
      // Smooth turn toward enemy
      let diff = desiredYaw - this.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.yaw += diff * Math.min(1, dt * 9.5);

      // Tactical strafing while in combat
      this.strafeTimer -= dt;
      if (this.strafeTimer <= 0) {
        this.strafeDir = Math.random() > 0.5 ? 1 : -1;
        this.strafeTimer = 0.6 + Math.random() * 0.8;
      }

      const rightX = Math.cos(this.yaw) * this.strafeDir;
      const rightZ = -Math.sin(this.yaw) * this.strafeDir;
      this.moveWithCollision(rightX * 2.6 * dt, rightZ * 2.6 * dt);

      // Fire weapon if aiming close enough
      this.reactionTimer += dt;
      if (Math.abs(diff) < 0.32 && this.reactionTimer > 0.24 && this.fireCooldown <= 0) {
        this.fireAtTarget(bestTarget, bestDist, game);
      }
    } else {
      this.reactionTimer = Math.max(0, this.reactionTimer - dt * 1.5);

      // 3. Bomb Planting / Defusing Logic for Bots
      if (game.currentMode === 'bomb') {
        // Terrorist Bot planting C4 at Bombsite
        if (this.team === 'T' && this.hasC4 && !game.plantedBomb.active && game.roundPhase === 'live') {
          const site = game.getBombsiteAt(this.position);
          if (site) {
            this.plantProgress += dt;
            if (this.plantProgress >= 3.2) {
              game.plantC4(this.position, site.name, this.name);
              this.hasC4 = false;
              this.plantProgress = 0;
            }
            this.updateAnimations(dt, 0);
            return;
          }
        }
        // CT Bot defusing Planted C4
        if (this.team === 'CT' && game.plantedBomb.active) {
          const dToBomb = Math.hypot(this.position.x - game.plantedBomb.position.x, this.position.z - game.plantedBomb.position.z);
          if (dToBomb < 3.4) {
            this.defuseProgress += dt;
            const reqTime = this.hasDefuseKit ? 2.5 : 5.0;
            if (this.defuseProgress >= reqTime) {
              game.defuseC4(this.name);
              this.defuseProgress = 0;
            }
            this.updateAnimations(dt, 0);
            return;
          }
        }
      }

      // 4. Waypoint Navigation
      this.repathTimer -= dt;
      if (!this.targetWaypoint || this.repathTimer <= 0) {
        this.pickNextWaypoint(game.plantedBomb);
        this.repathTimer = 4.5 + Math.random() * 3.0;
      }

      if (this.targetWaypoint) {
        const dx = this.targetWaypoint.x - this.position.x;
        const dz = this.targetWaypoint.z - this.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 2.2) {
          this.pickNextWaypoint(game.plantedBomb);
        } else {
          const desiredYaw = Math.atan2(-dx, -dz);
          let diff = desiredYaw - this.yaw;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          this.yaw += diff * Math.min(1, dt * 6.5);

          const speed = 5.4;
          const stepX = (dx / dist) * speed * dt;
          const stepZ = (dz / dist) * speed * dt;
          const moved = this.moveWithCollision(stepX, stepZ);
          if (!moved) {
            // Unstick by resetting to nearest nav node and picking another hop
            this.currentNavNode = null;
            this.prevNavNode = null;
            this.pickNextWaypoint(game.plantedBomb);
          }
        }
      }
    }

    this.updateAnimations(dt, 1.0, game);
  }

  moveWithCollision(dx, dz) {
    const r = 0.45;
    let moved = false;
    // Try X
    const nx = this.position.x + dx;
    if (!this.checkAABB(nx, this.position.y, this.position.z, r)) {
      this.position.x = nx;
      moved = true;
    }
    // Try Z
    const nz = this.position.z + dz;
    if (!this.checkAABB(this.position.x, this.position.y, nz, r)) {
      this.position.z = nz;
      moved = true;
    }

    // Ground height check (stairs/platforms)
    let groundY = 0;
    for (const c of CS.mapBuilder.colliders) {
      if (this.position.x + r > c.minX && this.position.x - r < c.maxX &&
          this.position.z + r > c.minZ && this.position.z - r < c.maxZ) {
        if (c.maxY <= this.position.y + 0.65 && c.maxY > groundY) {
          groundY = c.maxY;
        }
      }
    }
    this.position.y = groundY;
    return moved;
  }

  checkAABB(x, y, z, r) {
    const mb = CS.mapBuilder.mapBounds || { minX: -82, maxX: 82, minZ: -84, maxZ: 84 };
    if (x < mb.minX + 1.0 || x > mb.maxX - 1.0 || z < mb.minZ + 1.0 || z > mb.maxZ - 1.0) return true;
    for (const c of CS.mapBuilder.colliders) {
      if (c.maxY <= y + 0.62) continue; // Climbable step/platform
      if (y + 1.75 < c.minY) continue;
      if (x + r > c.minX && x - r < c.maxX && z + r > c.minZ && z - r < c.maxZ) {
        return true;
      }
    }
    return false;
  }

  fireAtTarget(target, dist, game) {
    const w = CS.WEAPONS[this.weaponId] || CS.WEAPONS.m4a4;
    this.fireCooldown = Math.max(0.14, (60 / (w.fireRate || 400)) * 1.35);

    // Play 3D positional gunshot audio
    const listenerForward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), game.player.yaw);
    CS.audio.playGunshot(w.soundType, this.position, game.player.position, listenerForward);

    // Spawn bullet tracer
    const start = new THREE.Vector3(this.position.x, this.position.y + 1.42, this.position.z);
    const end = new THREE.Vector3(
      target.pos.x + (Math.random() - 0.5) * 0.6,
      target.pos.y + 1.15 + (Math.random() - 0.5) * 0.5,
      target.pos.z + (Math.random() - 0.5) * 0.6
    );
    game.spawnTracer(start, end);

    // Hit probability based on distance & flash status
    const hitChance = Math.max(0.12, 0.52 - dist * 0.0045) * (this.flashedTimer > 0 ? 0.15 : 1.0);
    if (Math.random() < hitChance) {
      const isHead = Math.random() < 0.14;
      const rawDmg = w.damage * (isHead ? 1.85 : 0.72) * 0.55; // Balanced for fun player survivability
      if (target.isPlayer) {
        game.damagePlayer(rawDmg, this, isHead);
      } else {
        const killed = target.entity.takeDamage(rawDmg * 1.45, this, isHead);
        if (killed) {
          game.onEntityKilled(this, target.entity, this.weaponId, isHead);
        }
      }
    }
  }

  updateAnimations(dt, moveFactor, game = null) {
    if (!this.mesh) return;
    this.mesh.position.copy(this.position);
    this.mesh.rotation.set(0, this.yaw, 0);

    this.walkPhase += dt * 9.5 * moveFactor;
    const swing = Math.sin(this.walkPhase) * 0.48 * moveFactor;
    if (this.mesh.userData.leftLegPivot && this.mesh.userData.rightLegPivot) {
      this.mesh.userData.leftLegPivot.rotation.x = swing;
      this.mesh.userData.rightLegPivot.rotation.x = -swing;
    }

    // 3D positional footstep audio for moving bots nearby
    if (moveFactor > 0.2 && game && game.player && !game.player.dead) {
      this.stepAccum += dt * 5.2 * moveFactor;
      if (this.stepAccum >= 2.35) {
        this.stepAccum = 0;
        const dist = this.position.distanceTo(game.player.position);
        if (dist < 26) {
          const listenerForward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), game.player.yaw);
          CS.audio.playFootstep('stone', this.position, game.player.position, listenerForward);
        }
      }
    }
  }
}

CS.TacticalBot = TacticalBot;
