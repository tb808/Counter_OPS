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
  const activeOutfitId = (outfitId && CS.AGENT_OUTFITS[outfitId]) ? outfitId : (team === 'CT' ? 'sas_navy' : 'phoenix_crimson');

  // Default team colors if no custom outfit specified
  let suitCol = team === 'CT' ? '#1e3a5f' : '#5c4028';
  let vestCol = team === 'CT' ? '#0f172a' : '#271c15';
  let helmCol = team === 'CT' ? '#1e293b' : '#3f2e21';
  let visorCol = team === 'CT' ? '#38bdf8' : '#ef4444';
  let accCol = team === 'CT' ? '#0284c7' : '#d97706';

  if (CS.AGENT_OUTFITS[activeOutfitId]) {
    const o = CS.AGENT_OUTFITS[activeOutfitId];
    suitCol = o.suitColor;
    vestCol = o.vestColor;
    helmCol = o.helmetColor;
    visorCol = o.visorColor;
    accCol = o.accentColor;
  }

  const isMetallicSuit = activeOutfitId === 'valkyrie_prime' || activeOutfitId === 'cyber_spectre';
  const isGoldTrim = activeOutfitId === 'gold_commander' || activeOutfitId === 'valkyrie_prime';

  const suitMat = new THREE.MeshStandardMaterial({
    color: suitCol,
    roughness: isMetallicSuit ? 0.32 : 0.72,
    metalness: isMetallicSuit ? 0.55 : 0.14
  });
  const vestMat = new THREE.MeshStandardMaterial({
    color: vestCol,
    roughness: 0.45,
    metalness: isGoldTrim ? 0.48 : 0.34
  });
  const helmMat = new THREE.MeshStandardMaterial({
    color: helmCol,
    roughness: 0.34,
    metalness: 0.52
  });
  const visorMat = new THREE.MeshStandardMaterial({
    color: visorCol,
    emissive: visorCol,
    emissiveIntensity: 0.58,
    roughness: 0.12,
    metalness: 0.9
  });
  const accMat = new THREE.MeshStandardMaterial({
    color: accCol,
    emissive: (activeOutfitId === 'cyber_spectre' || activeOutfitId === 'ghost_recon') ? accCol : 0x000000,
    emissiveIntensity: (activeOutfitId === 'cyber_spectre' || activeOutfitId === 'ghost_recon') ? 0.38 : 0,
    roughness: isGoldTrim ? 0.18 : 0.35,
    metalness: isGoldTrim ? 0.92 : 0.55
  });
  const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x181c24, roughness: 0.38, metalness: 0.78 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.18, metalness: 0.92 });
  const brassMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.22, metalness: 0.90 });
  const leatherMat = new THREE.MeshStandardMaterial({ color: 0x111318, roughness: 0.58, metalness: 0.22 });
  const crimsonMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.42, metalness: 0.3 });
  const boneMat = new THREE.MeshStandardMaterial({ color: 0xe5e7eb, roughness: 0.35, metalness: 0.25 });
  const tanFabricMat = new THREE.MeshStandardMaterial({ color: 0xc2a878, roughness: 0.82, metalness: 0.05 });

  const hitboxes = [];
  const tagHitbox = (mesh, part) => {
    mesh.userData.hitboxPart = part;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    hitboxes.push(mesh);
  };

  // --- 1. LEGS, KNEE ARMOR, THIGH HOLSTERS & COMBAT BOOTS (PIVOT AT HIP y = 0.86) ---
  const buildDetailedLeg = (isLeft) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(isLeft ? -0.145 : 0.145, 0.86, 0);
    const sideSign = isLeft ? -1 : 1;

    // Upper Thigh
    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.195, 0.42, 0.215), suitMat);
    thigh.position.y = -0.21;
    tagHitbox(thigh, 'legs');
    legPivot.add(thigh);

    // Thigh Strap + Side Holster / Cargo Pouch
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.205, 0.045, 0.225), leatherMat);
    strap.position.y = -0.20;
    legPivot.add(strap);

    const thighRig = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.16, 0.13),
      (activeOutfitId === 'gold_commander' || activeOutfitId === 'valkyrie_prime') ? accMat : vestMat
    );
    thighRig.position.set(sideSign * 0.11, -0.20, 0.0);
    legPivot.add(thighRig);

    // Sculpted Knee Pad + Side Hinges
    const kneeBase = new THREE.Mesh(new THREE.BoxGeometry(0.205, 0.12, 0.23), vestMat);
    kneeBase.position.set(0, -0.43, -0.015);
    legPivot.add(kneeBase);

    const kneeCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.09, 0.04),
      (activeOutfitId === 'cyber_spectre' || activeOutfitId === 'valkyrie_prime') ? visorMat : accMat
    );
    kneeCap.position.set(0, -0.43, -0.125);
    legPivot.add(kneeCap);

    // Lower Calf + Shin Greaves (for Heavy/Titan/Cyber/Commander armors)
    const calf = new THREE.Mesh(new THREE.BoxGeometry(0.175, 0.36, 0.195), suitMat);
    calf.position.y = -0.61;
    tagHitbox(calf, 'legs');
    legPivot.add(calf);

    if (activeOutfitId === 'gign_urban' || activeOutfitId === 'valkyrie_prime' || activeOutfitId === 'cyber_spectre' || activeOutfitId === 'gold_commander') {
      const shinGuard = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.27, 0.045), helmMat);
      shinGuard.position.set(0, -0.60, -0.105);
      legPivot.add(shinGuard);

      const shinTrim = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.23, 0.052), accMat);
      shinTrim.position.set(0, -0.60, -0.108);
      legPivot.add(shinTrim);
    }

    // Combat Boot (Ankle Cuff + Main Boot + Toe Cap + Heavy Sole)
    const bootAnkle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 0.20), leatherMat);
    bootAnkle.position.set(0, -0.75, 0);
    legPivot.add(bootAnkle);

    const bootMain = new THREE.Mesh(new THREE.BoxGeometry(0.185, 0.10, 0.27), leatherMat);
    bootMain.position.set(0, -0.81, -0.035);
    legPivot.add(bootMain);

    const bootSole = new THREE.Mesh(new THREE.BoxGeometry(0.195, 0.035, 0.285), darkSteelMat);
    bootSole.position.set(0, -0.848, -0.035);
    legPivot.add(bootSole);

    return legPivot;
  };

  const leftLegPivot = buildDetailedLeg(true);
  const rightLegPivot = buildDetailedLeg(false);
  root.add(leftLegPivot);
  root.add(rightLegPivot);

  // --- 2. UPPER BODY GROUP (Supports crouching) ---
  const upperBody = new THREE.Group();
  upperBody.position.set(0, 0.86, 0);
  root.add(upperBody);

  // Pelvis & Utility Duty Belt with Buckle & Grenade Canisters
  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.18, 0.26), vestMat);
  pelvis.position.y = 0.07;
  tagHitbox(pelvis, 'stomach');
  upperBody.add(pelvis);

  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.49, 0.065, 0.29), leatherMat);
  belt.position.y = 0.12;
  upperBody.add(belt);

  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.03), accMat);
  buckle.position.set(0, 0.12, -0.15);
  upperBody.add(buckle);

  // Core Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.52, 0.27), suitMat);
  torso.position.y = 0.41;
  tagHitbox(torso, 'chest');
  upperBody.add(torso);

  // Base Plate Carrier
  const plateCarrier = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.42, 0.31), vestMat);
  plateCarrier.position.y = 0.42;
  tagHitbox(plateCarrier, 'chest');
  upperBody.add(plateCarrier);

  // --- 3. HEAD GROUP (Base Head Hitbox) ---
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.82, 0);
  upperBody.add(headGroup);

  const headBox = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.29, 0.27), helmMat);
  tagHitbox(headBox, 'head');
  headGroup.add(headBox);

  // --- 4. ARMS & EQUIPPED 3D WEAPON ---
  const gloveCfg = CS.GLOVES[gloveId] || CS.GLOVES.gloves_default;
  const glovePalmMat = new THREE.MeshStandardMaterial({ color: gloveCfg.primary, roughness: 0.5 });
  const gloveKnuckleMat = new THREE.MeshStandardMaterial({ color: gloveCfg.accent, roughness: 0.3, metalness: 0.6 });

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.32, 0.60, 0);
  const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.40, 0.14), suitMat);
  rArm.position.set(0, -0.15, -0.16);
  rArm.rotation.x = Math.PI / 2.3;
  tagHitbox(rArm, 'chest');
  rightArmPivot.add(rArm);
  // Forearm Vambrace + Gloved Fist
  const rBracer = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.16, 0.15), vestMat);
  rBracer.position.set(0, -0.22, -0.25);
  rBracer.rotation.x = Math.PI / 2.3;
  rightArmPivot.add(rBracer);
  const rHand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.11, 0.12), glovePalmMat);
  rHand.position.set(0, -0.28, -0.34);
  rightArmPivot.add(rHand);
  upperBody.add(rightArmPivot);

  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.32, 0.60, 0);
  const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.40, 0.14), suitMat);
  lArm.position.set(0.08, -0.15, -0.18);
  lArm.rotation.x = Math.PI / 2.3;
  lArm.rotation.z = -0.35;
  tagHitbox(lArm, 'chest');
  leftArmPivot.add(lArm);
  const lBracer = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.16, 0.15), vestMat);
  lBracer.position.set(0.12, -0.22, -0.27);
  lBracer.rotation.x = Math.PI / 2.3;
  lBracer.rotation.z = -0.35;
  leftArmPivot.add(lBracer);
  const lHand = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.11, 0.12), gloveKnuckleMat);
  lHand.position.set(0.16, -0.28, -0.35);
  leftArmPivot.add(lHand);
  upperBody.add(leftArmPivot);

  // ==========================================================================
  // 5. BESPOKE 3D ARMOR ARCHITECTURE PER OUTFIT (DISTINCT SILHOUETTE & GEAR!)
  // ==========================================================================
  if (activeOutfitId === 'sas_navy') {
    // --- SAS MIDNIGHT TACTICAL: S10 CBRN Gas Mask (Dual Round Lenses + Snout + Side Filter), Radio & Flashbangs ---
    const fastHelm = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.15, 0.32), helmMat);
    fastHelm.position.set(0, 0.10, 0.01);
    tagHitbox(fastHelm, 'head');
    headGroup.add(fastHelm);

    // Side Comms Ear-Defenders
    [-0.155, 0.155].forEach(xPos => {
      const earCup = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.04, 12), darkSteelMat);
      earCup.rotation.z = Math.PI / 2;
      earCup.position.set(xPos, 0.01, 0.0);
      headGroup.add(earCup);
    });

    // Dual Circular S10 Gas Mask Eye Lenses
    [-0.068, 0.068].forEach(xPos => {
      const lensRim = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.035, 16), darkSteelMat);
      lensRim.rotation.x = Math.PI / 2;
      lensRim.position.set(xPos, 0.03, -0.14);
      headGroup.add(lensRim);

      const lensGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.04, 16), visorMat);
      lensGlass.rotation.x = Math.PI / 2;
      lensGlass.position.set(xPos, 0.03, -0.145);
      tagHitbox(lensGlass, 'head');
      headGroup.add(lensGlass);
    });

    // Respirator Snout + Angled CBRN Filter Canister on Left Cheek
    const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.062, 0.09, 14), darkSteelMat);
    snout.rotation.x = Math.PI / 2 + 0.25;
    snout.position.set(0, -0.065, -0.165);
    headGroup.add(snout);

    const filterCan = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.11, 14), accMat);
    filterCan.rotation.set(0.35, 0, 0.65);
    filterCan.position.set(-0.11, -0.075, -0.155);
    headGroup.add(filterCan);

    // Chest Walkie-Talkie with Antenna + 2 Flashbang Cylinders + 3 MP5 Mag Pouches
    const radioBox = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.13, 0.05), darkSteelMat);
    radioBox.position.set(-0.15, 0.53, -0.17);
    upperBody.add(radioBox);
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.22, 6), darkSteelMat);
    antenna.position.set(-0.17, 0.68, -0.17);
    upperBody.add(antenna);

    [0.05, 0.15].forEach(xPos => {
      const flashCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.11, 10), accMat);
      flashCyl.position.set(xPos, 0.53, -0.17);
      upperBody.add(flashCyl);
    });

    for (let i = -1; i <= 1; i++) {
      const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.15, 0.065), helmMat);
      pouch.position.set(i * 0.13, 0.31, -0.175);
      upperBody.add(pouch);
    }

    // Rounded SAS Pauldrons & Oxygen/Hydration Pack
    [rightArmPivot, leftArmPivot].forEach((piv, idx) => {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.17, 0.19), helmMat);
      piv.add(pad);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.175, 0.04, 0.195), accMat);
      stripe.position.y = 0.03;
      piv.add(stripe);
    });

    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.38, 0.15), vestMat);
    pack.position.set(0, 0.43, 0.19);
    upperBody.add(pack);
    const oxyTank = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.34, 12), accMat);
    oxyTank.position.set(0.11, 0.44, 0.25);
    upperBody.add(oxyTank);

  } else if (activeOutfitId === 'gign_urban') {
    // --- GIGN RIOT SPECIALIST: Heavy Altyn Titanium Helmet, Gold Riot Shield Visor, 360° Neck Gorget, Groin Apron & Shotgun Shells ---
    const altynDome = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.35), helmMat);
    altynDome.position.set(0, 0.08, 0.01);
    tagHitbox(altynDome, 'head');
    headGroup.add(altynDome);

    // Heavy Riot Shield Faceplate with Steel Brow Bar & Panoramic Gold Visor
    const faceShield = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.25, 0.05), darkSteelMat);
    faceShield.position.set(0, 0.02, -0.155);
    headGroup.add(faceShield);

    const goldGlass = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.11, 0.058), visorMat);
    goldGlass.position.set(0, 0.04, -0.158);
    tagHitbox(goldGlass, 'head');
    headGroup.add(goldGlass);

    // Massive 360° Ballistic Neck / Throat Collar (Gorget)
    const gorgetFront = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.36), vestMat);
    gorgetFront.position.set(0, 0.67, -0.02);
    upperBody.add(gorgetFront);
    const gorgetTrim = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.035, 0.37), accMat);
    gorgetTrim.position.set(0, 0.72, -0.02);
    upperBody.add(gorgetTrim);

    // Extra-Thick EOD Chest Plate + Hanging Armored Groin Protector Apron
    const heavyChest = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.35), vestMat);
    heavyChest.position.set(0, 0.42, -0.01);
    tagHitbox(heavyChest, 'chest');
    upperBody.add(heavyChest);

    const groinApron = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.24, 0.07), vestMat);
    groinApron.position.set(0, 0.02, -0.155);
    upperBody.add(groinApron);
    const apronStripe = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.04, 0.075), accMat);
    apronStripe.position.set(0, -0.04, -0.155);
    upperBody.add(apronStripe);

    // 6x 12-Gauge Red/Gold Shotgun Shells Bandolier across Chest
    for (let i = -2.5; i <= 2.5; i += 1) {
      const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.075, 8), crimsonMat);
      shell.position.set(i * 0.068, 0.50, -0.195);
      shell.rotation.z = 0.22;
      upperBody.add(shell);
      const brassBase = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.022, 8), brassMat);
      brassBase.position.set(i * 0.068 - 0.006, 0.53, -0.195);
      brassBase.rotation.z = 0.22;
      upperBody.add(brassBase);
    }

    // Double-Layered Juggernaut Riot Pauldrons
    [rightArmPivot, leftArmPivot].forEach((piv, idx) => {
      const sSign = idx === 0 ? 1 : -1;
      const upperPad = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.20, 0.24), vestMat);
      upperPad.position.set(sSign * 0.03, 0.02, 0);
      piv.add(upperPad);
      const lowerPad = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.14, 0.22), accMat);
      lowerPad.position.set(sSign * 0.04, -0.09, 0);
      piv.add(lowerPad);
    });

    // Heavy Breacher Shield / Ram Pack on Back
    const riotPack = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.48, 0.19), helmMat);
    riotPack.position.set(0, 0.42, 0.21);
    upperBody.add(riotPack);

  } else if (activeOutfitId === 'desert_seal') {
    // --- SEAL SANDSTORM OPS: Quad-Tube GPNVG-18 Night Vision Goggles, Shemagh Scarf & Dual-Antenna Comms Pack ---
    const opsCoreHelm = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.14, 0.31), helmMat);
    opsCoreHelm.position.set(0, 0.11, 0.01);
    tagHitbox(opsCoreHelm, 'head');
    headGroup.add(opsCoreHelm);

    // Wrapped Desert Shemagh Scarf around Neck & Lower Jaw
    const shemaghNeck = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.13, 0.33), tanFabricMat);
    shemaghNeck.position.set(0, 0.68, -0.01);
    upperBody.add(shemaghNeck);

    const faceWrap = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.13, 0.29), tanFabricMat);
    faceWrap.position.set(0, -0.07, -0.01);
    headGroup.add(faceWrap);

    // Dark Ballistic Eye Goggles + 4-Tube Panoramic Night Vision Goggles (GPNVG-18)
    const nvgMount = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.06), darkSteelMat);
    nvgMount.position.set(0, 0.06, -0.155);
    headGroup.add(nvgMount);

    [-0.105, -0.038, 0.038, 0.105].forEach(xOff => {
      const tubeHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.11, 12), darkSteelMat);
      tubeHousing.rotation.x = Math.PI / 2;
      tubeHousing.position.set(xOff, 0.035, -0.195);
      headGroup.add(tubeHousing);

      const glowingLens = new THREE.Mesh(new THREE.CylinderGeometry(0.023, 0.023, 0.02, 12), visorMat);
      glowingLens.rotation.x = Math.PI / 2;
      glowingLens.position.set(xOff, 0.035, -0.245);
      tagHitbox(glowingLens, 'head');
      headGroup.add(glowingLens);
    });

    // 4x Tan STANAG Magazine Pouches + Chemlight Glowsticks on Chest
    for (let i = -1.5; i <= 1.5; i += 1) {
      const magPouch = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.16, 0.07), helmMat);
      magPouch.position.set(i * 0.105, 0.32, -0.175);
      upperBody.add(magPouch);
    }
    const chemlight = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 8), visorMat);
    chemlight.rotation.z = Math.PI / 2;
    chemlight.position.set(0, 0.52, -0.175);
    upperBody.add(chemlight);

    // Desert Shoulder Pads
    [rightArmPivot, leftArmPivot].forEach(piv => {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.18), vestMat);
      piv.add(pad);
    });

    // Long-Range Field Radio Backpack with Dual Tall Whip Antennas
    const radioPack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 0.18), vestMat);
    radioPack.position.set(0, 0.43, 0.20);
    upperBody.add(radioPack);

    [-0.14, 0.14].forEach(xAnt => {
      const whipAnt = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.011, 0.56, 8), darkSteelMat);
      whipAnt.position.set(xAnt, 0.85, 0.22);
      upperBody.add(whipAnt);
    });

  } else if (activeOutfitId === 'phoenix_crimson') {
    // --- PHOENIX ENFORCER: Ballistic Skull Mask, Crimson Beret, Crossed Gold Bullet Bandolier & Spiked Pauldrons ---
    // Sculpted Bone-White/Silver Skull Faceplate
    const skullMask = new THREE.Mesh(new THREE.BoxGeometry(0.285, 0.25, 0.05), boneMat);
    skullMask.position.set(0, -0.01, -0.145);
    headGroup.add(skullMask);

    // Glowing Crimson Eye Slits
    [-0.065, 0.065].forEach(xEye => {
      const eyeSlit = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.045, 0.058), visorMat);
      eyeSlit.position.set(xEye, 0.035, -0.148);
      eyeSlit.rotation.z = xEye < 0 ? -0.18 : 0.18;
      tagHitbox(eyeSlit, 'head');
      headGroup.add(eyeSlit);
    });

    // Skull Nose Cavity & Vertical Jaw Teeth Vents
    const noseVent = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.045, 0.058), darkSteelMat);
    noseVent.position.set(0, -0.02, -0.148);
    headGroup.add(noseVent);
    for (let t = -2; t <= 2; t++) {
      const toothBar = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.075, 0.058), darkSteelMat);
      toothBar.position.set(t * 0.036, -0.09, -0.148);
      headGroup.add(toothBar);
    }

    // Slanted Crimson Military Beret with Gold Badge
    const beret = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.09, 16), crimsonMat);
    beret.position.set(0.02, 0.15, 0.0);
    beret.rotation.z = -0.18;
    tagHitbox(beret, 'head');
    headGroup.add(beret);

    const beretBadge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.02), brassMat);
    beretBadge.position.set(-0.06, 0.15, -0.155);
    headGroup.add(beretBadge);

    // Crossed Golden Machine-Gun Bullet Bandolier across Chest
    for (let b = -4; b <= 4; b++) {
      const bullet = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.065, 8), brassMat);
      bullet.rotation.z = Math.PI / 2 - 0.65;
      bullet.position.set(b * 0.045, 0.42 + b * 0.038, -0.175);
      upperBody.add(bullet);
    }

    // Spiked Gladiator Mercenary Pauldrons
    [rightArmPivot, leftArmPivot].forEach((piv, idx) => {
      const sSign = idx === 0 ? 1 : -1;
      const pauldron = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.18, 0.21), accMat);
      piv.add(pauldron);
      // 2 Metallic Shoulder Spikes
      [-0.04, 0.04].forEach(zOff => {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.028, 0.11, 8), chromeMat);
        spike.position.set(sSign * 0.05, 0.13, zOff);
        spike.rotation.z = -sSign * 0.35;
        piv.add(spike);
      });
    });

    // Heavy Ammo Drum Pack on Back
    const ammoPack = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.36, 16), vestMat);
    ammoPack.position.set(0, 0.42, 0.20);
    upperBody.add(ammoPack);

  } else if (activeOutfitId === 'cyber_spectre') {
    // --- CYBER SPECTRE NEON: Angular Cyberpunk Helmet, Twin Magenta Cyber-Ears/Fins, Glowing Chest Arc-Reactor & Thruster Jetpack ---
    const cyberHelm = new THREE.Mesh(new THREE.OctahedronGeometry(0.195, 1), helmMat);
    cyberHelm.scale.set(0.95, 1.05, 1.05);
    cyberHelm.position.set(0, 0.02, 0);
    tagHitbox(cyberHelm, 'head');
    headGroup.add(cyberHelm);

    // V-Shaped Neon Cyan Laser Visor
    [-0.065, 0.065].forEach(xSide => {
      const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.045, 0.05), visorMat);
      vBar.position.set(xSide, 0.03, -0.15);
      vBar.rotation.z = xSide < 0 ? -0.24 : 0.24;
      tagHitbox(vBar, 'head');
      headGroup.add(vBar);
    });

    // Twin Glowing Magenta Cyber-Fins / Data-Antennas on Helmet Top
    [-0.12, 0.12].forEach(xFin => {
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.19, 4), accMat);
      fin.position.set(xFin, 0.21, 0.02);
      fin.rotation.z = xFin < 0 ? 0.28 : -0.28;
      fin.rotation.x = -0.2;
      headGroup.add(fin);
    });

    // Glowing Circular Cyan/Magenta Arc-Reactor Core in Center of Chest
    const reactorOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 20), accMat);
    reactorOuter.rotation.x = Math.PI / 2;
    reactorOuter.position.set(0, 0.45, -0.165);
    upperBody.add(reactorOuter);

    const reactorCore = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.05, 20), visorMat);
    reactorCore.rotation.x = Math.PI / 2;
    reactorCore.position.set(0, 0.45, -0.17);
    upperBody.add(reactorCore);

    // Neon Rib Strips
    [-0.17, 0.17].forEach(xRib => {
      const neonStrip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.34, 0.33), visorMat);
      neonStrip.position.set(xRib, 0.41, 0);
      upperBody.add(neonStrip);
    });

    // Floating Angular Cyber Shoulder Wings
    [rightArmPivot, leftArmPivot].forEach((piv, idx) => {
      const sSign = idx === 0 ? 1 : -1;
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.22), helmMat);
      wing.rotation.z = -sSign * 0.32;
      wing.position.set(sSign * 0.03, 0.04, 0);
      piv.add(wing);
      const neonEdge = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.035, 0.23), accMat);
      neonEdge.rotation.z = -sSign * 0.32;
      neonEdge.position.set(sSign * 0.03, 0.09, 0);
      piv.add(neonEdge);
    });

    // Twin Sci-Fi Thruster Jetpack Modules on Back
    [-0.11, 0.11].forEach(xJet => {
      const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.08, 0.38, 12), helmMat);
      thruster.position.set(xJet, 0.43, 0.21);
      upperBody.add(thruster);
      const nozzleGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.04, 12), visorMat);
      nozzleGlow.position.set(xJet, 0.23, 0.21);
      upperBody.add(nozzleGlow);
    });

  } else if (activeOutfitId === 'gold_commander') {
    // --- ★ GLOBAL ELITE COMMANDER: 24k Gold Crown/Crest Helmet, Golden Eagle Cuirass, Imperial Epaulettes & Commander Cape ---
    const cmdHelm = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.32), helmMat);
    cmdHelm.position.set(0, 0.09, 0.01);
    tagHitbox(cmdHelm, 'head');
    headGroup.add(cmdHelm);

    // Golden Imperial Crest Ridge on Top of Helmet + Gold Chin Guard
    const goldCrest = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.11, 0.34), brassMat);
    goldCrest.position.set(0, 0.20, 0.01);
    headGroup.add(goldCrest);

    const goldCrownBand = new THREE.Mesh(new THREE.BoxGeometry(0.335, 0.045, 0.335), brassMat);
    goldCrownBand.position.set(0, 0.11, 0.01);
    headGroup.add(goldCrownBand);

    const goldVisor = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.10, 0.055), visorMat);
    goldVisor.position.set(0, 0.03, -0.145);
    tagHitbox(goldVisor, 'head');
    headGroup.add(goldVisor);

    // Sculpted 24k Gold Eagle Breastplate across Chest
    const eagleCenter = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.045), brassMat);
    eagleCenter.position.set(0, 0.44, -0.165);
    upperBody.add(eagleCenter);

    [-0.14, 0.14].forEach(xWing => {
      const eagleWing = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.11, 0.04), brassMat);
      eagleWing.position.set(xWing, 0.48, -0.165);
      eagleWing.rotation.z = xWing < 0 ? -0.25 : 0.25;
      upperBody.add(eagleWing);
    });

    // Ornate Gold Epaulettes on Shoulders
    [rightArmPivot, leftArmPivot].forEach((piv, idx) => {
      const sSign = idx === 0 ? 1 : -1;
      const epaulette = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.22), brassMat);
      epaulette.position.set(sSign * 0.02, 0.05, 0);
      piv.add(epaulette);
      const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.10, 0.20), vestMat);
      fringe.position.set(sSign * 0.03, -0.04, 0);
      piv.add(fringe);
    });

    // Flowing Royal Black & Gold Commander Cape on Back!
    const capeMain = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.88, 0.04), vestMat);
    capeMain.position.set(0, 0.22, 0.19);
    capeMain.rotation.x = 0.08;
    upperBody.add(capeMain);

    const capeGoldBorder = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.07, 0.045), brassMat);
    capeGoldBorder.position.set(0, -0.19, 0.225);
    upperBody.add(capeGoldBorder);

  } else if (activeOutfitId === 'ghost_recon') {
    // --- ★ GHOST PHANTOM (Lv.3 Exklusiv): Sniper Hood/Cowl, Skull Lower Mask, Tri-Lens Violet Sonar Goggles & Stealth Cloak ---
    // Deep Draped Sniper Hood / Cowl over Head
    const hoodOuter = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.34, 0.35), suitMat);
    hoodOuter.position.set(0, 0.03, 0.02);
    tagHitbox(hoodOuter, 'head');
    headGroup.add(hoodOuter);

    const hoodPeak = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.16, 4), suitMat);
    hoodPeak.rotation.y = Math.PI / 4;
    hoodPeak.position.set(0, 0.23, -0.02);
    headGroup.add(hoodPeak);

    // Phantom Skull Jaw Plate
    const jawMask = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.045), boneMat);
    jawMask.position.set(0, -0.06, -0.145);
    headGroup.add(jawMask);

    // Iconic Tri-Lens (3-Dot Triangle) Glowing Violet Sonar Goggles!
    const sonarRig = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.10, 0.05), darkSteelMat);
    sonarRig.position.set(0, 0.04, -0.145);
    headGroup.add(sonarRig);

    [
      [-0.065, 0.025],
      [0.065, 0.025],
      [0.0, 0.075]
    ].forEach(([lx, ly]) => {
      const sonarLens = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.045, 14), visorMat);
      sonarLens.rotation.x = Math.PI / 2;
      sonarLens.position.set(lx, ly, -0.16);
      tagHitbox(sonarLens, 'head');
      headGroup.add(sonarLens);
    });

    // Draped Stealth Mantle / Poncho across Chest & Shoulders
    const cloakChest = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.22, 0.35), suitMat);
    cloakChest.position.set(0, 0.56, 0.0);
    upperBody.add(cloakChest);

    // Glowing Violet Stealth-Field Nodes on Chest
    [-0.14, 0, 0.14].forEach(nx => {
      const node = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.04), visorMat);
      node.position.set(nx, 0.34, -0.17);
      upperBody.add(node);
    });

    [rightArmPivot, leftArmPivot].forEach(piv => {
      const shroud = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.22, 0.22), suitMat);
      piv.add(shroud);
      const vTrim = new THREE.Mesh(new THREE.BoxGeometry(0.205, 0.03, 0.225), visorMat);
      vTrim.position.y = -0.08;
      piv.add(vTrim);
    });

    // Draped Recon Cloak + Rangefinder Drone Unit on Back
    const stealthCape = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.68, 0.06), suitMat);
    stealthCape.position.set(0, 0.30, 0.19);
    upperBody.add(stealthCape);

  } else if (activeOutfitId === 'valkyrie_prime') {
    // --- ★ PRIME TITAN ENFORCER (Lv.8 Exklusiv): White-Gold Winged Valkyrie Helmet, Cyan Diamond Core & 4 Back Energy Wings ---
    const titanHelm = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.29, 0.31), helmMat);
    titanHelm.position.set(0, 0.02, 0.0);
    tagHitbox(titanHelm, 'head');
    headGroup.add(titanHelm);

    // T-Shaped Paladin Cyan Glowing Visor
    const visorHoriz = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.065, 0.05), visorMat);
    visorHoriz.position.set(0, 0.045, -0.145);
    tagHitbox(visorHoriz, 'head');
    headGroup.add(visorHoriz);

    const visorVert = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.16, 0.05), visorMat);
    visorVert.position.set(0, -0.02, -0.145);
    headGroup.add(visorVert);

    // Swept-Up Golden Valkyrie Helmet Side-Wings!
    [-0.17, 0.17].forEach(xWing => {
      const hWing = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.24, 0.16), brassMat);
      hWing.position.set(xWing, 0.14, 0.02);
      hWing.rotation.x = -0.35;
      hWing.rotation.z = xWing < 0 ? 0.22 : -0.22;
      headGroup.add(hWing);
    });

    // Sculpted White-Ceramic & Gold Paladin Chestplate + Glowing Cyan Diamond Core
    const titanBreastplate = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.44, 0.33), helmMat);
    titanBreastplate.position.set(0, 0.42, 0);
    tagHitbox(titanBreastplate, 'chest');
    upperBody.add(titanBreastplate);

    const goldRibs = new THREE.Mesh(new THREE.BoxGeometry(0.53, 0.08, 0.34), brassMat);
    goldRibs.position.set(0, 0.28, 0);
    upperBody.add(goldRibs);

    const diamondCore = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.05), visorMat);
    diamondCore.rotation.z = Math.PI / 4;
    diamondCore.position.set(0, 0.45, -0.165);
    upperBody.add(diamondCore);

    // Winged White & Gold Pauldrons
    [rightArmPivot, leftArmPivot].forEach((piv, idx) => {
      const sSign = idx === 0 ? 1 : -1;
      const pBase = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.22), helmMat);
      pBase.position.set(sSign * 0.02, 0.03, 0);
      piv.add(pBase);
      const goldTrim = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.05, 0.23), brassMat);
      goldTrim.position.set(sSign * 0.02, 0.09, 0);
      piv.add(goldTrim);
    });

    // 4 Swept-Out Golden & Cyan Valkyrie Energy Wings on the Back!
    const wingCore = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.34, 0.16), brassMat);
    wingCore.position.set(0, 0.45, 0.20);
    upperBody.add(wingCore);

    [
      [-0.32, 0.62, 0.55],
      [0.32, 0.62, -0.55],
      [-0.28, 0.34, 0.85],
      [0.28, 0.34, -0.85]
    ].forEach(([wx, wy, wzRot]) => {
      const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.07, 0.035), brassMat);
      wingBlade.position.set(wx, wy, 0.24);
      wingBlade.rotation.z = wzRot;
      upperBody.add(wingBlade);

      const wingFeatherGlow = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.035, 0.04), visorMat);
      wingFeatherGlow.position.set(wx, wy - 0.03, 0.24);
      wingFeatherGlow.rotation.z = wzRot;
      upperBody.add(wingFeatherGlow);
    });
  }

  // Attach 3D Weapon to Agent Hands
  const gunMount = new THREE.Group();
  gunMount.position.set(0.12, 0.46, -0.32);
  const gunModel = CS.weaponBuilder.buildWeaponModel(weaponId, skinId, knifeModelId, gloveId, activeOutfitId, false);
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
    this.money = 500;
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
    this.isCrouching = false;
    this.crouchTimer = 0;
    this.alertTimer = 0;
    this.alertTargetPos = null;
    this.grenadesLeft = 0;
    this.grenadeCooldown = 0;
    this.flashedTimer = 0;
    this.radarVisibleTimer = 0;
    this.plantProgress = 0;
    this.defuseProgress = 0;
    this.tacticalOrder = null;

    this.mesh = null;
    this.buildMesh();
  }

  getDifficultyConfig(game = null) {
    const g = game || CS.game;
    const diffId = (g && g.currentDifficulty) || (CS.ui && CS.ui.profile?.settings?.difficulty) || 'hard';
    // Enemy bots use the selected difficulty; allied bots stay balanced so they support without stealing all kills on Nightmare
    if (g && g.player && this.team === g.player.team) {
      if (diffId === 'easy') return CS.DIFFICULTIES.easy;
      return CS.DIFFICULTIES.medium;
    }
    return CS.DIFFICULTIES[diffId] || CS.DIFFICULTIES.hard;
  }

  buildMesh() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
    }
    const diffCfg = this.getDifficultyConfig();
    const botHash = (this.name || 'Bot').charCodeAt(0) % 3;
    let outfitId;
    if (this.team === 'CT') {
      const ctPool = ['sas_navy', 'gign_urban', 'desert_seal'];
      outfitId = ctPool[botHash];
    } else {
      const tPool = ['phoenix_crimson', 'desert_seal', 'ghost_recon'];
      outfitId = tPool[botHash];
    }
    if (diffCfg.id === 'nightmare' && (!CS.game || !CS.game.player || this.team !== CS.game.player.team)) {
      outfitId = this.team === 'CT' ? 'cyber_spectre' : 'gold_commander';
    }
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
      const diffCfg = this.getDifficultyConfig();
      const skinKeys = Object.keys(CS.SKINS);
      if (diffCfg.id === 'nightmare') {
        const eliteSkins = ['asiimov', 'fade', 'hyper_beast', 'neon_rider', 'dragon_lore', 'emerald_doppler', 'gold_arabesque', 'printstream'];
        this.skinId = eliteSkins[Math.floor(Math.random() * eliteSkins.length)];
      } else {
        this.skinId = skinKeys[Math.floor(Math.random() * Math.min(8, skinKeys.length))];
      }
    }
    this.ammo = CS.WEAPONS[wId].magSize || 30;
    this.buildMesh();
  }

  spawnAt(spawnPt) {
    const diffCfg = this.getDifficultyConfig();
    this.dead = false;
    this.health = 100;
    this.armor = diffCfg.startArmor ?? 100;
    this.hasHelmet = diffCfg.hasHelmet ?? true;
    this.hasDefuseKit = this.team === 'CT' && (diffCfg.hasDefuseKit ?? true);
    this.grenadesLeft = diffCfg.maxGrenades ?? 0;
    this.grenadeCooldown = 2.5 + Math.random() * 2.5;
    this.isCrouching = false;
    this.crouchTimer = 0;
    this.alertTimer = 0;
    this.alertTargetPos = null;
    this.flashedTimer = 0;
    this.plantProgress = 0;
    this.defuseProgress = 0;
    this.tacticalOrder = null;
    this.deathTimer = 0;
    this.deathVelocity.set(0, 0, 0);
    this.position.set(spawnPt.x + (Math.random() - 0.5) * 1.6, spawnPt.y || 0, spawnPt.z + (Math.random() - 0.5) * 1.6);
    this.yaw = spawnPt.rotY || 0;
    if (this.mesh) {
      this.mesh.visible = true;
      this.mesh.rotation.set(0, this.yaw, 0);
      this.mesh.position.copy(this.position);
      const ud = this.mesh.userData;
      if (ud.upperBody) {
        ud.upperBody.position.y = 0.86;
        ud.upperBody.rotation.set(0, 0, 0);
      }
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

    const diffCfg = this.getDifficultyConfig();
    const tier = diffCfg.weaponTier || 'hard';

    if (tier === 'easy') {
      // Easy bots mostly use pistols, SMGs or shotguns, rarely a light rifle
      if (modeId === 'tdm' || this.money >= 2400) {
        const lightPool = ['mp9', 'ump45', 'nova', 'p250', 'famas'];
        this.equipWeapon(lightPool[Math.floor(Math.random() * lightPool.length)]);
        if (modeId === 'bomb') this.money = Math.max(0, this.money - 1400);
      } else {
        const pistols = this.team === 'CT' ? ['usps', 'p250'] : ['glock', 'p250'];
        this.equipWeapon(pistols[Math.floor(Math.random() * pistols.length)]);
      }
      return;
    }

    if (tier === 'medium') {
      if (modeId === 'tdm' || this.money >= 3100) {
        const medPool = this.team === 'CT' ? ['famas', 'm4a1s', 'm4a4', 'mp9', 'ump45'] : ['famas', 'ak47', 'ump45', 'mp9'];
        this.equipWeapon(medPool[Math.floor(Math.random() * medPool.length)]);
        if (modeId === 'bomb') this.money = Math.max(0, this.money - 2700);
      } else if (this.money >= 1400) {
        const smgs = ['mp9', 'ump45', 'nova', 'p250'];
        this.equipWeapon(smgs[Math.floor(Math.random() * smgs.length)]);
        if (modeId === 'bomb') this.money = Math.max(0, this.money - 1250);
      } else {
        const pistols = this.team === 'CT' ? ['usps', 'p250'] : ['glock', 'p250'];
        this.equipWeapon(pistols[Math.floor(Math.random() * pistols.length)]);
      }
      return;
    }

    if (tier === 'nightmare') {
      // Nightmare bots prioritize deadly meta rifles, AWP & Deagle
      if (modeId === 'tdm' || this.money >= 2700) {
        const elitePool = this.team === 'CT' ? ['m4a1s', 'm4a4', 'aug', 'awp', 'ak47'] : ['ak47', 'ak47', 'aug', 'awp'];
        this.equipWeapon(elitePool[Math.floor(Math.random() * elitePool.length)]);
        if (modeId === 'bomb') this.money = Math.max(0, this.money - 2700);
      } else {
        const ecoElite = ['deagle', 'mp9', 'ump45', 'ssg08'];
        this.equipWeapon(ecoElite[Math.floor(Math.random() * ecoElite.length)]);
        if (modeId === 'bomb') this.money = Math.max(0, this.money - 900);
      }
      return;
    }

    // Default 'hard' behavior (exact original logic)
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

    // 1c. Follow Player Squad Radio Order ([Z] Rush Site, [X] Follow Player, [V] Hold Position)
    if (this.tacticalOrder && this.tacticalOrder.timer > 0) {
      if (this.tacticalOrder.type === 'rush') {
        const siteKey = this.tacticalOrder.siteKey || 'A';
        const site = CS.mapBuilder.bombsites[siteKey];
        if (site) {
          this.assignedLane = siteKey;
          const dToSite = Math.hypot(site.x - this.position.x, site.z - this.position.z);
          const siteNode = nodes.find(n => n.isSite === siteKey) || this.findNearestNavNode(site.x, site.z, nodes);
          if (dToSite < 7.0 || (curNode && siteNode && curNode.id === siteNode.id)) {
            this.targetWaypoint = { x: site.x + (Math.random() - 0.5) * 2.5, z: site.z + (Math.random() - 0.5) * 2.5 };
            return;
          }
          const hop = this.findNextHopBFS(curNode, siteNode, byId) || siteNode;
          this.prevNavNode = curNode ? curNode.id : null;
          this.currentNavNode = hop.id;
          this.targetWaypoint = { x: hop.x + (Math.random() - 0.5) * 1.4, z: hop.z + (Math.random() - 0.5) * 1.4 };
          return;
        }
      } else if (this.tacticalOrder.type === 'follow' && CS.game && CS.game.player && !CS.game.player.dead) {
        const pPos = CS.game.player.position;
        const offX = this.tacticalOrder.offsetX || 0;
        const offZ = this.tacticalOrder.offsetZ || 0;
        const dToPlayer = Math.hypot(pPos.x - this.position.x, pPos.z - this.position.z);
        const goal = this.findNearestNavNode(pPos.x, pPos.z, nodes);
        if (dToPlayer < 8.5 || (curNode && goal && curNode.id === goal.id)) {
          this.targetWaypoint = { x: pPos.x + offX, z: pPos.z + offZ };
          return;
        }
        const hop = this.findNextHopBFS(curNode, goal, byId) || goal;
        this.prevNavNode = curNode ? curNode.id : null;
        this.currentNavNode = hop.id;
        this.targetWaypoint = { x: hop.x + (Math.random() - 0.5) * 1.2, z: hop.z + (Math.random() - 0.5) * 1.2 };
        return;
      } else if (this.tacticalOrder.type === 'hold' && this.tacticalOrder.pos) {
        this.targetWaypoint = { x: this.tacticalOrder.pos.x, z: this.tacticalOrder.pos.z };
        return;
      }
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
      this.isCrouching = false;
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

    // Tactical Hit-Reflex & Team Callout when surviving a shot
    if (attacker && attacker.position) {
      const diffCfg = this.getDifficultyConfig();
      this.alertTimer = 5.5;
      this.alertTargetPos = attacker.position.clone();

      // Evasive reflex on Hard & Nightmare
      if (diffCfg.id === 'nightmare') {
        this.strafeDir *= -1;
        this.strafeTimer = 0.35;
        this.isCrouching = true;
        this.crouchTimer = 0.85;
      } else if (diffCfg.id === 'hard' && Math.random() < 0.45) {
        this.strafeDir *= -1;
      }

      // Alert nearby teammates (Callout)
      if (CS.game && CS.game.bots && (diffCfg.calloutRange || 0) > 0) {
        for (const ally of CS.game.bots) {
          if (!ally.dead && ally !== this && ally.team === this.team) {
            if (ally.position.distanceTo(this.position) <= diffCfg.calloutRange) {
              ally.alertTimer = Math.max(ally.alertTimer, 4.0);
              ally.alertTargetPos = attacker.position.clone();
            }
          }
        }
      }
    }
    return false;
  }

  tryThrowTacticalGrenade(target, dist, diffCfg, game) {
    if (this.grenadesLeft <= 0 || this.grenadeCooldown > 0) return;
    if (dist < 11 || dist > 32) return;
    const chance = (diffCfg.grenadeChance || 0) * 0.025;
    if (Math.random() > chance) return;

    this.grenadesLeft--;
    this.grenadeCooldown = 7.5 + Math.random() * 4.0;

    const gTypes = diffCfg.id === 'nightmare' ? ['flash', 'he', 'he', 'smoke'] : ['flash', 'he'];
    const gType = gTypes[Math.floor(Math.random() * gTypes.length)];
    const mesh = CS.weaponBuilder.buildGrenadeMesh(gType);
    mesh.scale.set(1.6, 1.6, 1.6);

    const startPos = new THREE.Vector3(this.position.x, this.position.y + 1.5, this.position.z);
    const toTarget = new THREE.Vector3(target.pos.x - startPos.x, 2.2, target.pos.z - startPos.z).normalize();
    mesh.position.copy(startPos).addScaledVector(toTarget, 0.6);
    this.scene.add(mesh);

    const throwSpeed = Math.min(23, Math.max(12, dist * 0.82));
    game.activeGrenades.push({
      type: gType,
      mesh,
      position: mesh.position,
      velocity: toTarget.multiplyScalar(throwSpeed),
      fuseTimer: 1.65,
      owner: this
    });
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
          ud.upperBody.position.y = 0.86;
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

    const diffCfg = this.getDifficultyConfig(game);

    if (this.radarVisibleTimer > 0) this.radarVisibleTimer -= dt;
    if (this.flashedTimer > 0) this.flashedTimer -= dt;
    if (this.fireCooldown > 0) this.fireCooldown -= dt;
    if (this.alertTimer > 0) this.alertTimer -= dt;
    if (this.grenadeCooldown > 0) this.grenadeCooldown -= dt;
    if (this.tacticalOrder) {
      this.tacticalOrder.timer -= dt;
      if (this.tacticalOrder.timer <= 0) this.tacticalOrder = null;
    }
    if (this.crouchTimer > 0) {
      this.crouchTimer -= dt;
      if (this.crouchTimer <= 0) this.isCrouching = false;
    }

    // Freeze during buy phase in Bomb Defusal
    if (game.roundPhase === 'buy') {
      this.mesh.position.copy(this.position);
      return;
    }

    // 1. Acquire nearest visible enemy (Player or Enemy Bot) with difficulty sight range & FOV cone
    let bestTarget = null;
    let bestDist = diffCfg.sightRange || 115;

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

    const eyePos = new THREE.Vector3(this.position.x, this.position.y + (this.isCrouching ? 1.25 : 1.55), this.position.z);
    const forwardX = -Math.sin(this.yaw);
    const forwardZ = -Math.cos(this.yaw);
    const minFovCos = this.alertTimer > 0 ? -1.0 : (diffCfg.fovCos ?? -1.0);

    if (this.flashedTimer <= 0.4) {
      for (const cand of candidates) {
        const targetEye = new THREE.Vector3(cand.pos.x, cand.pos.y + 1.35, cand.pos.z);
        const dist = eyePos.distanceTo(targetEye);
        if (dist < bestDist) {
          // Check Field of View cone on Easy/Medium unless very close or alerted
          if (minFovCos > -0.99 && dist > 9.0) {
            const toX = (cand.pos.x - this.position.x) / Math.max(0.001, dist);
            const toZ = (cand.pos.z - this.position.z) / Math.max(0.001, dist);
            const dot = forwardX * toX + forwardZ * toZ;
            if (dot < minFovCos) continue;
          }
          if (game.hasLineOfSight(eyePos, targetEye)) {
            bestDist = dist;
            bestTarget = cand;
          }
        }
      }
    }

    // 2. Combat Aiming, Tactical Movement & Firing
    if (bestTarget) {
      this.radarVisibleTimer = 2.5;
      this.alertTimer = 4.0;
      this.alertTargetPos = bestTarget.pos.clone();

      // Share target callout with nearby teammates on Medium/Hard/Nightmare
      if ((diffCfg.calloutRange || 0) > 0 && bestTarget.isPlayer) {
        for (const ally of game.bots) {
          if (!ally.dead && ally !== this && ally.team === this.team) {
            if (ally.position.distanceTo(this.position) <= diffCfg.calloutRange) {
              ally.alertTimer = Math.max(ally.alertTimer, 3.2);
              ally.alertTargetPos = bestTarget.pos.clone();
            }
          }
        }
      }

      const dx = bestTarget.pos.x - this.position.x;
      const dz = bestTarget.pos.z - this.position.z;
      const desiredYaw = Math.atan2(-dx, -dz);
      // Smooth turn toward enemy scaled by difficulty aimTurnSpeed
      let diff = desiredYaw - this.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.yaw += diff * Math.min(1, dt * (diffCfg.aimTurnSpeed || 9.5));

      // Tactical strafing & crouch-peeking while in combat
      this.strafeTimer -= dt;
      if (this.strafeTimer <= 0) {
        this.strafeDir = Math.random() > 0.5 ? 1 : -1;
        const sMin = diffCfg.strafeMin ?? 0.6;
        const sMax = diffCfg.strafeMax ?? 1.4;
        this.strafeTimer = sMin + Math.random() * (sMax - sMin);
        if (Math.random() < (diffCfg.crouchChance || 0)) {
          this.isCrouching = true;
          this.crouchTimer = 0.45 + Math.random() * 0.55;
        } else {
          this.isCrouching = false;
        }
      }

      const sSpeed = (diffCfg.strafeSpeed ?? 2.6) * (this.isCrouching ? 0.65 : 1.0);
      let moveX = Math.cos(this.yaw) * this.strafeDir * sSpeed;
      let moveZ = -Math.sin(this.yaw) * this.strafeDir * sSpeed;

      // Nightmare / Hard spacing tactics: push with SMGs/Shotguns or back off when low HP
      if (diffCfg.id === 'nightmare' || diffCfg.id === 'hard') {
        const w = CS.WEAPONS[this.weaponId];
        if (this.health < 35 && bestDist < 22) {
          // Tactical retreat while firing
          moveX += Math.sin(this.yaw) * 2.2;
          moveZ += Math.cos(this.yaw) * 2.2;
        } else if (w && w.category === 'smgs' && bestDist > 15) {
          // Aggressive close-quarters push
          moveX += -Math.sin(this.yaw) * 2.4;
          moveZ += -Math.cos(this.yaw) * 2.4;
        }
      }

      this.moveWithCollision(moveX * dt, moveZ * dt);

      // Tactical Grenade usage (Medium / Hard / Nightmare)
      if (bestTarget.isPlayer && (diffCfg.grenadeChance || 0) > 0) {
        this.tryThrowTacticalGrenade(bestTarget, bestDist, diffCfg, game);
      }

      // Fire weapon if aiming close enough and reaction time reached
      this.reactionTimer += dt;
      const reqReact = diffCfg.reactionTime ?? 0.24;
      const maxAngle = diffCfg.fireAngleMax ?? 0.32;
      if (Math.abs(diff) < maxAngle && this.reactionTimer > reqReact && this.fireCooldown <= 0) {
        this.fireAtTarget(bestTarget, bestDist, game, diffCfg);
      }
    } else {
      this.reactionTimer = Math.max(0, this.reactionTimer - dt * 1.5);
      this.isCrouching = false;

      // 3. Bomb Planting / Defusing Logic for Bots
      if (game.currentMode === 'bomb') {
        // Terrorist Bot planting C4 at Bombsite
        if (this.team === 'T' && this.hasC4 && !game.plantedBomb.active && game.roundPhase === 'live') {
          const site = game.getBombsiteAt(this.position);
          if (site) {
            this.plantProgress += dt;
            if (this.plantProgress >= (diffCfg.plantTime || 3.2)) {
              game.plantC4(this.position, site.name, this.name);
              this.hasC4 = false;
              this.plantProgress = 0;
            }
            this.updateAnimations(dt, 0, game);
            return;
          }
        }
        // CT Bot defusing Planted C4
        if (this.team === 'CT' && game.plantedBomb.active) {
          const dToBomb = Math.hypot(this.position.x - game.plantedBomb.position.x, this.position.z - game.plantedBomb.position.z);
          if (dToBomb < 3.4) {
            this.defuseProgress += dt;
            const reqTime = this.hasDefuseKit ? (diffCfg.defuseTime || 2.5) : 5.0;
            if (this.defuseProgress >= reqTime) {
              game.defuseC4(this.name);
              this.defuseProgress = 0;
            }
            this.updateAnimations(dt, 0, game);
            return;
          }
        }
      }

      // 3b. If alerted by gunshot or team callout on Hard/Nightmare, orient or hunt toward alertTargetPos
      if (this.alertTimer > 0 && this.alertTargetPos && (diffCfg.id === 'nightmare' || diffCfg.id === 'hard')) {
        if (diffCfg.id === 'nightmare' && !game.plantedBomb.active && !this.hasC4) {
          const dAlert = Math.hypot(this.alertTargetPos.x - this.position.x, this.alertTargetPos.z - this.position.z);
          if (dAlert > 4.0 && dAlert < 35.0) {
            const nodes = CS.mapBuilder.navNodes || CS.mapBuilder.waypoints || [];
            if (nodes.length > 0 && this.repathTimer > 1.2) {
              const byId = {};
              for (const n of nodes) byId[n.id] = n;
              const curNode = (this.currentNavNode && byId[this.currentNavNode])
                ? byId[this.currentNavNode]
                : this.findNearestNavNode(this.position.x, this.position.z, nodes);
              const goalNode = this.findNearestNavNode(this.alertTargetPos.x, this.alertTargetPos.z, nodes);
              const hop = this.findNextHopBFS(curNode, goalNode, byId) || goalNode;
              if (hop) {
                this.currentNavNode = hop.id;
                this.targetWaypoint = { x: hop.x, z: hop.z };
                this.repathTimer = 1.2;
              }
            }
          }
        }
      }

      // 3c. Execute Squad Tactical Order ([V] Hold Position or [X] Follow Player escort)
      if (this.tacticalOrder && this.tacticalOrder.timer > 0) {
        if (this.tacticalOrder.type === 'hold' && this.tacticalOrder.pos) {
          const dHold = Math.hypot(this.tacticalOrder.pos.x - this.position.x, this.tacticalOrder.pos.z - this.position.z);
          if (dHold < 2.8) {
            this.isCrouching = true;
            this.yaw += Math.sin(performance.now() * 0.0016 + this.walkPhase) * dt * 0.75;
            this.updateAnimations(dt, 0, game);
            return;
          }
        } else if (this.tacticalOrder.type === 'follow' && game.player && !game.player.dead) {
          this.repathTimer = Math.min(this.repathTimer, 0.85);
          const dPlayer = Math.hypot(game.player.position.x - this.position.x, game.player.position.z - this.position.z);
          if (dPlayer < 3.6) {
            this.isCrouching = !!game.player.crouching;
            this.yaw += (game.player.yaw - this.yaw) * Math.min(1, dt * 4.5);
            this.updateAnimations(dt, 0, game);
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
          this.yaw += diff * Math.min(1, dt * (diffCfg.navTurnSpeed || 6.5));

          const speed = diffCfg.moveSpeed || 5.4;
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

  fireAtTarget(target, dist, game, diffCfg = null) {
    const cfg = diffCfg || this.getDifficultyConfig(game);
    const w = CS.WEAPONS[this.weaponId] || CS.WEAPONS.m4a4;
    this.fireCooldown = Math.max(0.09, (60 / (w.fireRate || 400)) * (cfg.fireRateMult || 1.35));

    // Play 3D positional gunshot audio
    const listenerForward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), game.player.yaw);
    CS.audio.playGunshot(w.soundType, this.position, game.player.position, listenerForward);

    // Spawn bullet tracer (spread visual matches difficulty accuracy)
    const tSpread = cfg.tracerSpread ?? 0.6;
    const start = new THREE.Vector3(this.position.x, this.position.y + (this.isCrouching ? 1.15 : 1.42), this.position.z);
    const end = new THREE.Vector3(
      target.pos.x + (Math.random() - 0.5) * tSpread,
      target.pos.y + 1.15 + (Math.random() - 0.5) * (tSpread * 0.8),
      target.pos.z + (Math.random() - 0.5) * tSpread
    );
    game.spawnTracer(start, end);

    // Hit probability based on difficulty, distance, crouching & flash status
    const baseHit = cfg.hitChanceBase ?? 0.52;
    const minHit = cfg.hitChanceMin ?? 0.12;
    const falloff = cfg.hitDistFalloff ?? 0.0045;
    const crouchBonus = this.isCrouching ? 1.12 : 1.0;
    const hitChance = Math.max(minHit, baseHit - dist * falloff) * (this.flashedTimer > 0 ? 0.15 : 1.0) * crouchBonus;

    if (Math.random() < hitChance) {
      const isHead = Math.random() < (cfg.headshotChance ?? 0.14);
      const dmgMult = cfg.damageMult ?? 0.55;
      const rawDmg = w.damage * (isHead ? 1.85 : 0.72) * dmgMult;
      if (target.isPlayer) {
        game.damagePlayer(rawDmg, this, isHead);
      } else {
        const botVsBotDmg = w.damage * (isHead ? 1.85 : 0.72) * 0.55 * 1.45;
        const killed = target.entity.takeDamage(botVsBotDmg, this, isHead);
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

    // Animate tactical crouch (ducking upperBody down in combat)
    if (this.mesh.userData.upperBody) {
      const targetUpperY = this.isCrouching ? 0.62 : 0.86;
      this.mesh.userData.upperBody.position.y += (targetUpperY - this.mesh.userData.upperBody.position.y) * Math.min(1, dt * 12);
    }

    this.walkPhase += dt * 9.5 * moveFactor;
    const swing = Math.sin(this.walkPhase) * (this.isCrouching ? 0.28 : 0.48) * moveFactor;
    if (this.mesh.userData.leftLegPivot && this.mesh.userData.rightLegPivot) {
      const crouchKnee = this.isCrouching ? -0.35 : 0;
      this.mesh.userData.leftLegPivot.rotation.x = crouchKnee + swing;
      this.mesh.userData.rightLegPivot.rotation.x = crouchKnee - swing;
    }

    // 3D positional footstep audio for moving bots nearby
    if (moveFactor > 0.2 && !this.isCrouching && game && game.player && !game.player.dead) {
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

// ============================================================================
// ZOMBIE SURVIVAL: 3D ZOMBIE MODELS & WAVE AI ENTITY
// ============================================================================
CS.buildZombieModel = function(variant = 'walker') {
  const root = new THREE.Group();
  const isBrute = variant === 'brute';
  const isRunner = variant === 'runner';

  const skinColor = isBrute ? 0x3b2d4a : (isRunner ? 0x5c3632 : 0x5c7352);
  const clothColor = isBrute ? 0x1e1b2e : (isRunner ? 0x2b1717 : 0x242c24);
  const eyeColor = isBrute ? 0xc026d3 : (isRunner ? 0xff3300 : 0xa3e635);
  const woundColor = isBrute ? 0x9333ea : 0x991b1b;

  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.78, metalness: 0.08 });
  const clothMat = new THREE.MeshStandardMaterial({ color: clothColor, roughness: 0.85, metalness: 0.1 });
  const armorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.42, metalness: 0.65 });
  const woundMat = new THREE.MeshStandardMaterial({
    color: woundColor,
    emissive: isBrute ? 0x7e22ce : 0x450a0a,
    emissiveIntensity: isBrute ? 0.55 : 0.2,
    roughness: 0.55
  });
  const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });

  const hitboxes = [];
  const tagHitbox = (mesh, part) => {
    mesh.userData.hitboxPart = part;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    hitboxes.push(mesh);
  };

  // 1. Legs (pivot at hip y = 0.86)
  const buildZombieLeg = (isLeft) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(isLeft ? -0.15 : 0.15, 0.86, 0);
    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.43, 0.20), clothMat);
    thigh.position.y = -0.22;
    tagHitbox(thigh, 'legs');
    legPivot.add(thigh);

    const shin = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.42, 0.18), skinMat);
    shin.position.y = -0.63;
    tagHitbox(shin, 'legs');
    legPivot.add(shin);

    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.11, 0.26), clothMat);
    foot.position.set(0, -0.81, -0.04);
    legPivot.add(foot);
    return legPivot;
  };
  const leftLegPivot = buildZombieLeg(true);
  const rightLegPivot = buildZombieLeg(false);
  root.add(leftLegPivot);
  root.add(rightLegPivot);

  // 2. Upper Body (slouched forward)
  const upperBody = new THREE.Group();
  upperBody.position.set(0, 0.86, 0);
  root.add(upperBody);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.62, 0.27), clothMat);
  torso.position.y = 0.34;
  tagHitbox(torso, 'chest');
  upperBody.add(torso);

  // Exposed rib/blood wound patch on chest
  const chestPatch = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.22, 0.29),
    isBrute ? woundMat : woundMat
  );
  chestPatch.position.set(isBrute ? 0 : 0.05, 0.38, -0.01);
  tagHitbox(chestPatch, 'chest');
  upperBody.add(chestPatch);

  if (isBrute) {
    const brutePlate = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.44, 0.34), armorMat);
    brutePlate.position.set(0, 0.40, 0);
    tagHitbox(brutePlate, 'chest');
    upperBody.add(brutePlate);
  }

  // 3. Head + Glowing Undead Eyes
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.78, -0.03);
  upperBody.add(headGroup);

  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.30, 0.28), skinMat);
  tagHitbox(headMesh, 'head');
  headGroup.add(headMesh);

  if (isBrute) {
    const helm = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.32), armorMat);
    helm.position.y = 0.10;
    tagHitbox(helm, 'head');
    headGroup.add(helm);
  }

  [-0.065, 0.065].forEach(ex => {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.035, 0.03), eyeMat);
    eye.position.set(ex, 0.03, -0.145);
    tagHitbox(eye, 'head');
    headGroup.add(eye);
  });

  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.07, 0.04), woundMat);
  jaw.position.set(0, -0.08, -0.14);
  headGroup.add(jaw);

  // 4. Outstretched Zombie Arms (Reaching forward to claw!)
  const buildZombieArm = (isLeft) => {
    const piv = new THREE.Group();
    piv.position.set(isLeft ? -0.32 : 0.32, 0.56, 0);
    const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.30, 0.15), isBrute ? armorMat : clothMat);
    sleeve.position.set(0, -0.12, 0);
    piv.add(sleeve);

    const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.32, 0.13), skinMat);
    forearm.position.set(0, -0.40, 0);
    piv.add(forearm);

    const claw = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.14), woundMat);
    claw.position.set(0, -0.58, -0.02);
    piv.add(claw);

    piv.rotation.x = Math.PI / 2 - 0.15; // Arms stretched forward toward player
    return piv;
  };
  const leftArmPivot = buildZombieArm(true);
  const rightArmPivot = buildZombieArm(false);
  upperBody.add(leftArmPivot);
  upperBody.add(rightArmPivot);

  if (isBrute) {
    root.scale.set(1.28, 1.26, 1.28);
  } else if (isRunner) {
    root.scale.set(0.94, 0.96, 0.94);
    upperBody.rotation.x = -0.18;
  }

  root.userData = {
    leftLegPivot,
    rightLegPivot,
    upperBody,
    headGroup,
    leftArmPivot,
    rightArmPivot,
    hitboxes
  };

  return root;
};

class ZombieEntity {
  constructor(id, variant, wave, scene) {
    this.id = id;
    this.variant = variant || 'walker';
    this.wave = wave || 1;
    this.scene = scene;
    this.team = 'ZOMBIE';
    this.isZombie = true;
    this.weaponId = 'knife';
    this.skinId = 'default';

    const waveFactor = Math.max(0, this.wave - 1);
    if (this.variant === 'brute') {
      this.name = `Brute-Zombie (W${this.wave})`;
      this.maxHealth = Math.round(280 + waveFactor * 75);
      this.speed = Math.min(4.4, 2.5 + waveFactor * 0.16);
      this.attackDamage = Math.min(48, 26 + waveFactor * 2);
      this.attackCooldownMax = 1.25;
      this.armor = 35;
    } else if (this.variant === 'runner') {
      this.name = `Sprinter-Zombie`;
      this.maxHealth = Math.round(75 + waveFactor * 24);
      this.speed = Math.min(6.6, 4.1 + waveFactor * 0.24);
      this.attackDamage = Math.min(32, 14 + waveFactor * 1.5);
      this.attackCooldownMax = 0.78;
      this.armor = 0;
    } else {
      this.name = `Zombie`;
      this.maxHealth = Math.round(95 + waveFactor * 30);
      this.speed = Math.min(4.9, 2.6 + waveFactor * 0.20);
      this.attackDamage = Math.min(36, 16 + waveFactor * 1.6);
      this.attackCooldownMax = 1.05;
      this.armor = 0;
    }

    this.health = this.maxHealth;
    this.dead = false;
    this.flashedTimer = 0;
    this.attackCooldown = 0.4;
    this.swipeAnim = 0;
    this.groanTimer = 2 + Math.random() * 6;
    this.repathTimer = 0;
    this.targetNode = null;
    this.walkPhase = Math.random() * 10;

    this.position = new THREE.Vector3();
    this.yaw = 0;
    this.deathTimer = 0;
    this.deathFallDir = 1;
    this.deathYawSpin = 0;
    this.deathVelocity = new THREE.Vector3();
    this.meshRemoved = false;

    this.mesh = null;
    this.buildMesh();
  }

  buildMesh() {
    if (this.mesh) this.scene.remove(this.mesh);
    this.mesh = CS.buildZombieModel(this.variant);
    for (const hb of this.mesh.userData.hitboxes) {
      hb.userData.bot = this;
    }
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);
  }

  spawnAt(spawnPt) {
    this.dead = false;
    this.deathTimer = 0;
    this.position.set(
      spawnPt.x + (Math.random() - 0.5) * 1.4,
      spawnPt.y || 0,
      spawnPt.z + (Math.random() - 0.5) * 1.4
    );
    this.yaw = spawnPt.rotY || 0;
    if (this.mesh) {
      this.mesh.visible = true;
      this.mesh.position.copy(this.position);
      this.mesh.rotation.set(0, this.yaw, 0);
    }
  }

  takeDamage(amount, attacker, isHeadshot = false) {
    if (this.dead) return false;
    const instaKill = CS.game?.zombieState?.instaKillTimer > 0;
    let dmg = instaKill ? 99999 : amount;
    if (!instaKill && this.armor > 0) {
      dmg *= 0.8;
    }
    this.health = Math.max(0, this.health - dmg);

    if (this.health <= 0) {
      this.dead = true;
      this.deathTimer = 0;
      this.deathFallDir = Math.random() > 0.5 ? 1 : -1;
      this.deathYawSpin = (Math.random() - 0.5) * 1.6;
      if (attacker && attacker.position) {
        const push = this.position.clone().sub(attacker.position);
        push.y = 0;
        if (push.lengthSq() > 0.001) push.normalize();
        this.deathVelocity.copy(push.multiplyScalar(isHeadshot ? 4.2 : 2.6));
      }
      return true;
    }
    return false;
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

  moveWithCollision(dx, dz) {
    const r = this.variant === 'brute' ? 0.52 : 0.42;
    let moved = false;
    const nx = this.position.x + dx;
    if (!this.checkAABB(nx, this.position.y, this.position.z, r)) {
      this.position.x = nx;
      moved = true;
    }
    const nz = this.position.z + dz;
    if (!this.checkAABB(this.position.x, this.position.y, nz, r)) {
      this.position.z = nz;
      moved = true;
    }
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
      if (c.maxY <= y + 0.62) continue;
      if (y + 1.75 < c.minY) continue;
      if (x + r > c.minX && x - r < c.maxX && z + r > c.minZ && z - r < c.maxZ) {
        return true;
      }
    }
    return false;
  }

  update(dt, game) {
    if (this.dead) {
      if (this.meshRemoved) return;
      this.deathTimer += dt;
      if (this.mesh) {
        const fallDur = 0.42;
        const p = Math.min(1, this.deathTimer / fallDur);
        const ease = 1 - Math.pow(1 - p, 3);
        if (p < 1) {
          this.position.x += this.deathVelocity.x * dt * (1 - p);
          this.position.z += this.deathVelocity.z * dt * (1 - p);
        }
        this.mesh.position.set(this.position.x, this.position.y + ease * 0.16, this.position.z);
        this.mesh.rotation.x = ease * (Math.PI / 2) * this.deathFallDir;
        this.mesh.rotation.z = ease * 0.3 * this.deathFallDir;
        this.mesh.rotation.y = this.yaw + ease * this.deathYawSpin;
        if (this.deathTimer > 2.4) {
          this.scene.remove(this.mesh);
          this.meshRemoved = true;
        }
      }
      return;
    }

    if (!game.player || game.player.dead) return;

    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.flashedTimer > 0) this.flashedTimer -= dt;
    if (this.swipeAnim > 0) this.swipeAnim -= dt * 4;

    // Spatial zombie groan audio
    this.groanTimer -= dt;
    if (this.groanTimer <= 0) {
      this.groanTimer = 4.5 + Math.random() * 6.5;
      if (this.position.distanceTo(game.player.position) < 32) {
        const fwd = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), game.player.yaw);
        CS.audio.playZombieGrowl(this.variant === 'brute', this.position, game.player.position, fwd);
      }
    }

    const pPos = game.player.position;
    const distToPlayer = Math.hypot(pPos.x - this.position.x, pPos.z - this.position.z);

    // Check if we have direct sightline to player, otherwise steer via BFS navNodes
    let steerX = pPos.x;
    let steerZ = pPos.z;
    const myEye = new THREE.Vector3(this.position.x, this.position.y + 1.4, this.position.z);
    const pEye = new THREE.Vector3(pPos.x, pPos.y + 1.4, pPos.z);
    const directLOS = distToPlayer < 26 && game.hasLineOfSight(myEye, pEye);

    if (!directLOS && distToPlayer > 2.5) {
      this.repathTimer -= dt;
      if (!this.targetNode || this.repathTimer <= 0 || Math.hypot(this.targetNode.x - this.position.x, this.targetNode.z - this.position.z) < 2.2) {
        const nodes = CS.mapBuilder.navNodes || [];
        if (nodes.length > 0) {
          const byId = {};
          for (const n of nodes) byId[n.id] = n;
          const startNode = this.findNearestNavNode(this.position.x, this.position.z, nodes);
          const goalNode = this.findNearestNavNode(pPos.x, pPos.z, nodes);
          this.targetNode = this.findNextHopBFS(startNode, goalNode, byId) || goalNode;
        }
        this.repathTimer = 0.75;
      }
      if (this.targetNode) {
        steerX = this.targetNode.x;
        steerZ = this.targetNode.z;
      }
    }

    const dx = steerX - this.position.x;
    const dz = steerZ - this.position.z;
    const sDist = Math.hypot(dx, dz) || 1;
    const desiredYaw = Math.atan2(-dx, -dz);
    let diff = desiredYaw - this.yaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.yaw += diff * Math.min(1, dt * 8.5);

    const activeSpeed = this.flashedTimer > 0 ? this.speed * 0.25 : this.speed;
    if (distToPlayer > 1.35) {
      const moved = this.moveWithCollision((dx / sDist) * activeSpeed * dt, (dz / sDist) * activeSpeed * dt);
      if (!moved) {
        // Nudge sideways slightly to slide past narrow obstacles
        const perpX = -(dz / sDist) * activeSpeed * 0.65 * dt;
        const perpZ = (dx / sDist) * activeSpeed * 0.65 * dt;
        this.moveWithCollision(perpX, perpZ);
      }
    }

    // Melee claw attack on player
    if (distToPlayer <= 1.95 && Math.abs(pPos.y - this.position.y) < 1.8 && this.attackCooldown <= 0 && this.flashedTimer <= 0) {
      this.attackCooldown = this.attackCooldownMax;
      this.swipeAnim = 1.0;
      CS.audio.playZombieHit();
      game.damagePlayer(this.attackDamage, this, false);
    }

    // Animate zombie shambling/running & arm reaching
    if (this.mesh) {
      this.mesh.position.copy(this.position);
      this.mesh.rotation.set(0, this.yaw, 0);
      this.walkPhase += dt * activeSpeed * 2.3;
      const swing = Math.sin(this.walkPhase) * 0.55;
      const ud = this.mesh.userData;
      if (ud.leftLegPivot && ud.rightLegPivot) {
        ud.leftLegPivot.rotation.x = swing;
        ud.rightLegPivot.rotation.x = -swing;
      }
      if (ud.leftArmPivot && ud.rightArmPivot) {
        const swipe = Math.sin(this.swipeAnim * Math.PI) * 0.85;
        ud.leftArmPivot.rotation.x = (Math.PI / 2 - 0.15) + Math.sin(this.walkPhase * 0.7) * 0.18 - swipe;
        ud.rightArmPivot.rotation.x = (Math.PI / 2 - 0.15) - Math.sin(this.walkPhase * 0.7) * 0.18 - swipe;
      }
      if (ud.upperBody) {
        ud.upperBody.rotation.z = Math.sin(this.walkPhase * 0.5) * 0.08;
      }
    }
  }
}

CS.ZombieEntity = ZombieEntity;
