// ============================================================================
// COUNTER OPS: TACTICAL STRIKE - 3D WEAPON, KNIFE & HAND VIEWMODEL BUILDER
// ============================================================================
window.CS = window.CS || {};

class WeaponModelBuilder {
  // Build any weapon 3D Group (used for First-Person Viewmodel, 3rd-Person Bots, and Lobby Showcase)
  buildWeaponModel(weaponId, skinId = 'default', knifeModelId = 'knife_default', gloveId = 'gloves_default', outfitId = 'sas_navy', includeHands = true) {
    const group = new THREE.Group();
    const skinMat = CS.textures.getWeaponSkinMaterial(skinId, 'body');
    const darkMat = CS.textures.getWeaponSkinMaterial(skinId, 'dark_metal');
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd0d7e2, metalness: 0.92, roughness: 0.16 });
    const woodOrAccentMat = skinId === 'default'
      ? new THREE.MeshStandardMaterial({ color: 0x7a441e, roughness: 0.65, metalness: 0.1 })
      : skinMat;

    let magMesh = null;
    let slideOrBoltMesh = null;
    let muzzlePoint = new THREE.Vector3(0, 0.04, -0.55);
    let leftHandTarget = new THREE.Vector3(-0.03, -0.04, -0.26);
    let rightHandTarget = new THREE.Vector3(0.0, -0.08, 0.06);

    // --- MELEE KNIVES ---
    if (weaponId === 'knife') {
      const kGroup = new THREE.Group();
      const bladeMat = skinId === 'default' ? chromeMat : skinMat;

      if (knifeModelId === 'knife_karambit') {
        // Finger ring
        const ringGeo = new THREE.TorusGeometry(0.022, 0.0055, 10, 24);
        const ring = new THREE.Mesh(ringGeo, darkMat);
        ring.position.set(0, -0.08, 0.05);
        ring.rotation.y = Math.PI / 2;
        kGroup.add(ring);

        // Curved ergonomic grip
        const gripGeo = new THREE.BoxGeometry(0.018, 0.085, 0.028);
        const grip = new THREE.Mesh(gripGeo, darkMat);
        grip.position.set(0, -0.025, 0.02);
        grip.rotation.x = 0.25;
        kGroup.add(grip);

        // Curved Karambit claw blade (multi-segment curve)
        const clawGroup = new THREE.Group();
        for (let i = 0; i < 6; i++) {
          const segW = 0.028 * (1 - i * 0.13);
          const segGeo = new THREE.BoxGeometry(0.005, 0.026, segW);
          const seg = new THREE.Mesh(segGeo, bladeMat);
          const angle = i * 0.22;
          seg.position.set(0, 0.025 + Math.cos(angle) * i * 0.019, -Math.sin(angle) * i * 0.022);
          seg.rotation.x = angle + 0.35;
          clawGroup.add(seg);
        }
        kGroup.add(clawGroup);
      } else if (knifeModelId === 'knife_butterfly') {
        // Balisong split handles + spear blade
        const bladeGeo = new THREE.ConeGeometry(0.014, 0.15, 4);
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.scale.set(0.32, 1, 1);
        blade.position.set(0, 0.06, -0.04);
        blade.rotation.x = -0.35;
        kGroup.add(blade);

        const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.11, 0.014), skinMat);
        h1.position.set(0, -0.035, 0.008);
        h1.rotation.x = -0.35;
        h1.name = 'baliHandle1';
        kGroup.add(h1);

        const h2 = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.11, 0.014), darkMat);
        h2.position.set(0, -0.035, -0.012);
        h2.rotation.x = -0.35;
        h2.name = 'baliHandle2';
        kGroup.add(h2);
      } else {
        // M9 Bayonet or Standard Tactical Knife
        const isM9 = knifeModelId === 'knife_m9';
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.015, 0.10, 12), darkMat);
        handle.position.set(0, -0.04, 0.02);
        handle.rotation.x = -0.45;
        kGroup.add(handle);

        const guard = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.01, 0.052), darkMat);
        guard.position.set(0, 0.0, -0.01);
        guard.rotation.x = -0.45;
        kGroup.add(guard);

        const bladeLen = isM9 ? 0.17 : 0.14;
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.005, bladeLen, 0.028), bladeMat);
        blade.position.set(0, 0.065, -0.055);
        blade.rotation.x = -0.45;
        kGroup.add(blade);

        // Tip bevel
        const tip = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.045, 4), bladeMat);
        tip.scale.set(0.22, 1, 1);
        tip.position.set(0, 0.135, -0.105);
        tip.rotation.x = -0.45;
        kGroup.add(tip);
      }

      group.add(kGroup);
      leftHandTarget.set(-0.11, -0.09, -0.08);
      rightHandTarget.set(0.01, -0.05, 0.02);
    }
    // --- GRENADES ---
    else if (CS.WEAPONS[weaponId]?.isGrenade) {
      const gType = CS.WEAPONS[weaponId].grenadeType;
      const gMesh = this.buildGrenadeMesh(gType);
      gMesh.position.set(0, 0.0, -0.06);
      group.add(gMesh);
      leftHandTarget.set(-0.08, -0.06, -0.04);
      rightHandTarget.set(0.01, -0.04, -0.04);
    }
    // --- C4 EXPLOSIVE ---
    else if (weaponId === 'c4') {
      const c4Mesh = this.buildC4Mesh();
      c4Mesh.position.set(0, -0.01, -0.10);
      c4Mesh.rotation.x = -0.35;
      group.add(c4Mesh);
      leftHandTarget.set(-0.08, -0.03, -0.10);
      rightHandTarget.set(0.08, -0.03, -0.10);
    }
    // --- PISTOLS (Glock-18, USP-S, P250, Desert Eagle) ---
    else if (CS.WEAPONS[weaponId]?.category === 'pistols') {
      const isDeagle = weaponId === 'deagle';
      const isUSPS = weaponId === 'usps';
      const isGlock = weaponId === 'glock';
      const isP250 = weaponId === 'p250';

      const frameLen = isDeagle ? 0.255 : (isUSPS ? 0.195 : (isP250 ? 0.175 : 0.19));
      const slideH = isDeagle ? 0.046 : (isGlock ? 0.030 : 0.034);
      const slideW = isDeagle ? 0.038 : (isGlock ? 0.032 : 0.033);

      // Lower Polymer/Alloy Frame
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(slideW - 0.002, 0.025, frameLen),
        isP250 ? skinMat : darkMat
      );
      frame.position.set(0, 0.01, -0.05);
      group.add(frame);

      // Top Reciprocating Slide (Distinct per pistol!)
      slideOrBoltMesh = new THREE.Group();
      slideOrBoltMesh.position.set(0, 0.038, -0.05);

      const mainSlide = new THREE.Mesh(
        new THREE.BoxGeometry(slideW, slideH, frameLen + 0.01),
        isP250 ? darkMat : skinMat
      );
      slideOrBoltMesh.add(mainSlide);

      if (isDeagle) {
        // Desert Eagle iconic stepped triangular barrel rib & side flutes
        const topRib = new THREE.Mesh(new THREE.BoxGeometry(slideW * 0.68, 0.012, frameLen + 0.012), skinMat);
        topRib.position.set(0, slideH * 0.5 + 0.004, 0);
        slideOrBoltMesh.add(topRib);
        const muzzleWeight = new THREE.Mesh(new THREE.BoxGeometry(slideW + 0.003, slideH + 0.006, 0.065), skinMat);
        muzzleWeight.position.set(0, 0.002, -frameLen * 0.35);
        slideOrBoltMesh.add(muzzleWeight);
      } else if (isGlock) {
        // Glock blocky flat-top rail & dark ejection port
        const port = new THREE.Mesh(new THREE.BoxGeometry(slideW + 0.002, 0.012, 0.038), darkMat);
        port.position.set(0.001, 0.006, -0.01);
        slideOrBoltMesh.add(port);
      }

      // Iron sights on slide (with glowing green tritium dots)
      const sightDotMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
      const rearSight = new THREE.Mesh(new THREE.BoxGeometry(slideW * 0.82, 0.01, 0.014), darkMat);
      rearSight.position.set(0, slideH * 0.5 + 0.005, frameLen * 0.42);
      slideOrBoltMesh.add(rearSight);
      const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.011, 0.012), sightDotMat);
      frontSight.position.set(0, slideH * 0.5 + 0.005, -frameLen * 0.45);
      slideOrBoltMesh.add(frontSight);

      group.add(slideOrBoltMesh);

      // Inner Barrel
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(isDeagle ? 0.012 : 0.0085, isDeagle ? 0.012 : 0.0085, frameLen + 0.035, 12),
        chromeMat
      );
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.036, -0.06);
      group.add(barrel);

      // USP-S Tactical Underbarrel Laser/Light Module + Long Knurled Suppressor
      if (isUSPS) {
        const tacLight = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.022, 0.065), darkMat);
        tacLight.position.set(0, -0.008, -0.105);
        group.add(tacLight);
        const laserLens = new THREE.Mesh(
          new THREE.CircleGeometry(0.007, 10),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        laserLens.rotation.y = Math.PI;
        laserLens.position.set(0, -0.008, -0.138);
        group.add(laserLens);

        const supGroup = new THREE.Group();
        supGroup.name = 'silencerMesh';
        const supBody = new THREE.Mesh(new THREE.CylinderGeometry(0.0175, 0.0175, 0.175, 16), skinMat);
        supBody.rotation.x = Math.PI / 2;
        supGroup.add(supBody);
        const supCap = new THREE.Mesh(new THREE.CylinderGeometry(0.0185, 0.0185, 0.03, 16), darkMat);
        supCap.rotation.x = Math.PI / 2;
        supCap.position.z = 0.075;
        supGroup.add(supCap);
        supGroup.position.set(0, 0.036, -0.235);
        group.add(supGroup);
        muzzlePoint.set(0, 0.036, -0.33);
      } else {
        muzzlePoint.set(0, 0.036, isDeagle ? -0.21 : -0.18);
      }

      // Exposed Hammer for Deagle & USP-S
      if (isDeagle || isUSPS) {
        const hammer = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.022, 0.018), chromeMat);
        hammer.position.set(0, 0.032, 0.052);
        hammer.rotation.x = -0.55;
        group.add(hammer);
      }

      // Pistol Grip with Skinned Side Inlays
      const gripAngle = isGlock ? 0.32 : 0.22;
      const grip = new THREE.Mesh(new THREE.BoxGeometry(slideW - 0.003, 0.108, 0.045), darkMat);
      grip.position.set(0, -0.046, 0.025);
      grip.rotation.x = gripAngle;
      group.add(grip);

      const inlay = new THREE.Mesh(new THREE.BoxGeometry(slideW + 0.001, 0.078, 0.030), skinMat);
      inlay.position.set(0, -0.046, 0.025);
      inlay.rotation.x = gripAngle;
      group.add(inlay);

      // Detachable Magazine inside grip (Glock has extended baseplate)
      const magLen = isGlock ? 0.125 : 0.102;
      magMesh = new THREE.Mesh(new THREE.BoxGeometry(0.024, magLen, 0.035), darkMat);
      magMesh.position.set(0, isGlock ? -0.062 : -0.052, 0.028);
      magMesh.rotation.x = gripAngle;
      group.add(magMesh);

      // Trigger guard
      const tg = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.026, 0.048), darkMat);
      tg.position.set(0, -0.012, -0.016);
      group.add(tg);

      leftHandTarget.set(-0.02, -0.055, 0.01);
      rightHandTarget.set(0.01, -0.05, 0.03);
    }

    // --- 1. MP9 (SWISS MACHINE PISTOL WITH FORWARD FOREGRIP & FOLDING WIRE STOCK) ---
    else if (weaponId === 'mp9') {
      // Compact Boxy Upper Receiver (Skinned)
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.062, 0.24), skinMat);
      receiver.position.set(0, 0.026, -0.08);
      group.add(receiver);

      // Top Picatinny Rail
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.01, 0.21), darkMat);
      rail.position.set(0, 0.062, -0.08);
      group.add(rail);

      // Short Barrel & Tri-Lug Flash Hider
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.11, 14), darkMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.024, -0.23);
      group.add(barrel);
      muzzlePoint.set(0, 0.024, -0.29);

      // Integrated Forward Vertical Foregrip
      const foregrip = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.085, 0.032), darkMat);
      foregrip.position.set(0, -0.038, -0.175);
      foregrip.rotation.x = -0.12;
      group.add(foregrip);

      // Pistol Grip + Long Translucent/Gold-Loaded Stick Magazine protruding out of the grip!
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.095, 0.042), darkMat);
      grip.position.set(0, -0.04, -0.02);
      grip.rotation.x = 0.15;
      group.add(grip);

      magMesh = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.175, 0.032), skinMat);
      magMesh.position.set(0, -0.095, -0.015);
      magMesh.rotation.x = 0.15;
      group.add(magMesh);

      // Side-Folding Skeleton Wire Stock
      const wire1 = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.18, 8), darkMat);
      wire1.rotation.x = Math.PI / 2;
      wire1.position.set(0, 0.032, 0.12);
      group.add(wire1);
      const wire2 = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.18, 8), darkMat);
      wire2.rotation.x = Math.PI / 2 - 0.15;
      wire2.position.set(0, 0.008, 0.12);
      group.add(wire2);
      const buttpad = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.075, 0.016), darkMat);
      buttpad.position.set(0, 0.016, 0.21);
      group.add(buttpad);

      slideOrBoltMesh = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.014, 0.045), chromeMat);
      slideOrBoltMesh.position.set(0, 0.035, 0.02);
      group.add(slideOrBoltMesh);

      leftHandTarget.set(-0.018, -0.055, -0.175);
      rightHandTarget.set(0.012, -0.045, -0.01);
    }

    // --- 2. UMP-45 (HEAVY .45 ACP SUBMACHINE GUN) ---
    else if (weaponId === 'ump45') {
      // Tall Blocky Polymer Upper Receiver (Skinned)
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.076, 0.32), skinMat);
      receiver.position.set(0, 0.024, -0.09);
      group.add(receiver);

      // Vented Forend with Side Rails
      const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.058, 0.16), darkMat);
      handguard.position.set(0, 0.016, -0.26);
      group.add(handguard);

      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 12), chromeMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.022, -0.36);
      group.add(barrel);
      muzzlePoint.set(0, 0.022, -0.44);

      // Thick Straight .45 ACP Magazine in front of trigger
      magMesh = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.165, 0.042), skinMat);
      magMesh.position.set(0, -0.082, -0.16);
      magMesh.rotation.x = 0.08;
      group.add(magMesh);

      // Angled Pistol Grip
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.105, 0.044), darkMat);
      grip.position.set(0, -0.052, 0.01);
      grip.rotation.x = 0.28;
      group.add(grip);

      // Skeletonized Triangular Folding Stock
      const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.018, 0.21), darkMat);
      topBar.position.set(0, 0.036, 0.16);
      group.add(topBar);
      const botBar = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.018, 0.22), darkMat);
      botBar.position.set(0, -0.005, 0.16);
      botBar.rotation.x = -0.22;
      group.add(botBar);
      const pad = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.095, 0.022), darkMat);
      pad.position.set(0, 0.008, 0.265);
      group.add(pad);

      slideOrBoltMesh = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.014, 0.055), chromeMat);
      slideOrBoltMesh.position.set(0.022, 0.038, -0.22);
      group.add(slideOrBoltMesh);

      leftHandTarget.set(-0.025, -0.022, -0.25);
      rightHandTarget.set(0.012, -0.055, 0.015);
    }

    // --- 3. NOVA & XM1014 (PUMP-ACTION & TACTICAL AUTO SHOTGUNS) ---
    else if (weaponId === 'nova' || weaponId === 'xm1014') {
      const isXM = weaponId === 'xm1014';

      // Receiver (Skinned)
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.068, 0.28), skinMat);
      receiver.position.set(0, 0.022, -0.06);
      group.add(receiver);

      // 4 Red 12-Gauge Shotgun Shells Mounted on Receiver Side-Saddle!
      const shellRedMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
      const shellBrassMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.85, roughness: 0.2 });
      for (let s = 0; s < 4; s++) {
        const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.038, 10), shellRedMat);
        sh.position.set(-0.026, 0.024, -0.01 - s * 0.026);
        group.add(sh);
        const brass = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0085, 0.012, 10), shellBrassMat);
        brass.position.set(-0.026, 0.002, -0.01 - s * 0.026);
        group.add(brass);
      }

      // Long 12-Gauge Barrel + Full-Length Underbarrel Tube Magazine
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.015, 0.52, 14), darkMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.038, -0.44);
      group.add(barrel);

      const magTube = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.48, 14), chromeMat);
      magTube.rotation.x = Math.PI / 2;
      magTube.position.set(0, 0.010, -0.42);
      group.add(magTube);
      muzzlePoint.set(0, 0.038, -0.71);

      // Ribbed Sliding Pump Forend (linked to slideOrBoltMesh so it pumps back on shot!)
      slideOrBoltMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.024, 0.024, 0.22, 12),
        isXM ? darkMat : woodOrAccentMat
      );
      slideOrBoltMesh.rotation.x = Math.PI / 2;
      slideOrBoltMesh.position.set(0, 0.006, -0.34);
      group.add(slideOrBoltMesh);

      if (isXM) {
        // XM1014 Perforated Barrel Heat Shield + Pistol Grip + Collapsible Dual-Rod Stock
        const heatShield = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.018, 0.34), darkMat);
        heatShield.position.set(0, 0.048, -0.37);
        group.add(heatShield);

        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.10, 0.042), darkMat);
        grip.position.set(0, -0.048, 0.04);
        grip.rotation.x = 0.28;
        group.add(grip);

        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.22, 10), chromeMat);
        rod.rotation.x = Math.PI / 2 - 0.12;
        rod.position.set(0, 0.01, 0.17);
        group.add(rod);
        const pad = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.10, 0.032), skinMat);
        pad.position.set(0, -0.005, 0.27);
        group.add(pad);
      } else {
        // Nova Swept Hunting-Style Shotgun Buttstock
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.085, 0.26), woodOrAccentMat);
        stock.position.set(0, -0.015, 0.18);
        stock.rotation.x = -0.18;
        group.add(stock);
      }

      leftHandTarget.set(-0.022, -0.018, -0.34);
      rightHandTarget.set(0.012, -0.048, 0.04);
    }

    // --- 4. FAMAS & AUG (BULLPUP ASSAULT RIFLES — MAGAZINE BEHIND GRIP!) ---
    else if (weaponId === 'famas' || weaponId === 'aug') {
      const isAUG = weaponId === 'aug';

      // Full-Length Bullpup Stock & Receiver Body (Skinned)
      const bullpupBody = new THREE.Mesh(new THREE.BoxGeometry(0.050, 0.082, 0.48), skinMat);
      bullpupBody.position.set(0, 0.018, -0.02);
      group.add(bullpupBody);

      // Barrel protruding from front of bullpup receiver
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.013, 0.28, 14), darkMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.028, -0.38);
      group.add(barrel);
      muzzlePoint.set(0, 0.028, -0.53);

      // Forward Pistol Grip (Positioned ahead of the magazine!)
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.105, 0.042), darkMat);
      grip.position.set(0, -0.055, -0.08);
      grip.rotation.x = 0.24;
      group.add(grip);

      // Bullpup Detachable Magazine (Positioned in the REAR stock at z = +0.11!)
      magMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.028, 0.145, 0.056),
        isAUG ? darkMat : skinMat
      );
      magMesh.position.set(0, -0.072, 0.11);
      magMesh.rotation.x = -0.12;
      group.add(magMesh);

      if (isAUG) {
        // AUG: Forward Vertical Foregrip + Angled Integrated Swarovski Scope
        const foregrip = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.09, 0.030), darkMat);
        foregrip.position.set(0, -0.048, -0.25);
        foregrip.rotation.x = -0.15;
        group.add(foregrip);

        const scopeMount = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.028, 0.16), darkMat);
        scopeMount.position.set(0, 0.072, -0.06);
        group.add(scopeMount);
        const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.017, 0.22, 16), skinMat);
        scopeTube.rotation.x = Math.PI / 2;
        scopeTube.position.set(0, 0.092, -0.06);
        group.add(scopeTube);
        const lens = new THREE.Mesh(
          new THREE.CircleGeometry(0.017, 14),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        lens.position.set(0, 0.092, 0.051);
        group.add(lens);
      } else {
        // FAMAS: Iconic Full-Length Raised Carry Handle Tunnel Arch + Folded Bipod
        const archLeft = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.048, 0.028), skinMat);
        archLeft.position.set(0, 0.078, 0.06);
        group.add(archLeft);
        const archRight = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.048, 0.028), skinMat);
        archRight.position.set(0, 0.078, -0.21);
        group.add(archRight);
        const archTop = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.024, 0.31), skinMat);
        archTop.position.set(0, 0.104, -0.075);
        group.add(archTop);

        // Folded side bipod legs
        const bipod = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.014, 0.22), darkMat);
        bipod.position.set(0, 0.035, -0.16);
        group.add(bipod);
      }

      slideOrBoltMesh = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.012, 0.055), chromeMat);
      slideOrBoltMesh.position.set(0, 0.055, -0.12);
      group.add(slideOrBoltMesh);

      leftHandTarget.set(-0.022, -0.045, -0.25);
      rightHandTarget.set(0.012, -0.055, -0.07);
    }

    // --- 5. AK-47 (KALASHNIKOV WITH CURVED BANANA MAG, GAS TUBE & WOOD/SKIN FURNITURE) ---
    else if (weaponId === 'ak47') {
      // Stamped Steel Receiver + Ribbed Dust Cover
      const receiver = new THREE.Mesh(
        new THREE.BoxGeometry(0.046, 0.068, 0.28),
        skinId === 'default' ? darkMat : skinMat
      );
      receiver.position.set(0, 0.018, -0.06);
      group.add(receiver);

      // Angled AK Hardwood / Skinned Buttstock
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.084, 0.24), woodOrAccentMat);
      stock.position.set(0, -0.012, 0.18);
      stock.rotation.x = -0.18;
      group.add(stock);

      // Two-Piece AK Handguard (Lower & Upper Gas Tube Cover)
      const lowerHG = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.038, 0.18), woodOrAccentMat);
      lowerHG.position.set(0, 0.012, -0.29);
      group.add(lowerHG);
      const upperHG = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.024, 0.15), woodOrAccentMat);
      upperHG.position.set(0, 0.044, -0.28);
      group.add(upperHG);

      // Barrel, Gas Tube, Angled Gas Block & Triangular Front Sight Post
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.012, 0.36, 14), darkMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.022, -0.38);
      group.add(barrel);

      const gasTube = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.20, 12), darkMat);
      gasTube.rotation.x = Math.PI / 2;
      gasTube.position.set(0, 0.045, -0.32);
      group.add(gasTube);

      const frontSight = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.052, 4), darkMat);
      frontSight.scale.set(0.45, 1, 1);
      frontSight.position.set(0, 0.048, -0.52);
      group.add(frontSight);
      muzzlePoint.set(0, 0.022, -0.58);

      // Pistol Grip
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.105, 0.042), woodOrAccentMat);
      grip.position.set(0, -0.052, 0.03);
      grip.rotation.x = 0.30;
      group.add(grip);

      // Iconic Curved 30-Round AK Banana Magazine (2 angled segments!)
      magMesh = new THREE.Group();
      magMesh.position.set(0, -0.062, -0.11);
      const magTop = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.085, 0.054), skinMat);
      magTop.rotation.x = -0.22;
      magMesh.add(magTop);
      const magBot = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.095, 0.052), skinMat);
      magBot.position.set(0, -0.072, -0.026);
      magBot.rotation.x = -0.48;
      magMesh.add(magBot);
      group.add(magMesh);

      slideOrBoltMesh = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.012, 0.065), chromeMat);
      slideOrBoltMesh.position.set(0.026, 0.034, -0.06);
      group.add(slideOrBoltMesh);

      leftHandTarget.set(-0.025, -0.026, -0.27);
      rightHandTarget.set(0.012, -0.055, 0.03);
    }

    // --- 6. M4A4 & M4A1-S (CT TACTICAL CARBINES — HOLO SIGHT vs CARRY HANDLE & SUPPRESSOR) ---
    else if (weaponId === 'm4a4' || weaponId === 'm4a1s') {
      const isSilenced = weaponId === 'm4a1s';

      // Upper/Lower Receiver (Skinned)
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.068, 0.28), skinMat);
      receiver.position.set(0, 0.020, -0.06);
      group.add(receiver);

      // Handguard (Quad-Rail on M4A4 vs Cylindrical Ribbed on M4A1-S)
      const handguard = isSilenced
        ? new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.028, 0.22, 14), darkMat)
        : new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.054, 0.23), skinMat);
      if (isSilenced) handguard.rotation.x = Math.PI / 2;
      handguard.position.set(0, 0.022, -0.31);
      group.add(handguard);

      // Barrel + A2 Front Sight Triangle
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.012, 0.34, 14), darkMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.024, -0.38);
      group.add(barrel);

      const fs = new THREE.Mesh(new THREE.ConeGeometry(0.016, 0.048, 4), darkMat);
      fs.scale.set(0.45, 1, 1);
      fs.position.set(0, 0.048, -0.45);
      group.add(fs);

      if (isSilenced) {
        // M4A1-S: Classic A2 Carry Handle Arch + Long Heavy Suppressor
        const ch = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.032, 0.16), darkMat);
        ch.position.set(0, 0.068, -0.05);
        group.add(ch);

        const sup = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.22, 16), skinMat);
        sup.rotation.x = Math.PI / 2;
        sup.position.set(0, 0.024, -0.60);
        sup.name = 'silencerMesh';
        group.add(sup);
        muzzlePoint.set(0, 0.024, -0.72);
      } else {
        // M4A4: Tactical EOTech Holographic Red-Dot Sight + Stubby Vertical Foregrip + Birdcage Flash Hider
        const holoHood = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.034, 0.068), darkMat);
        holoHood.position.set(0, 0.070, -0.07);
        group.add(holoHood);
        const holoGlass = new THREE.Mesh(
          new THREE.PlaneGeometry(0.026, 0.022),
          new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
        );
        holoGlass.position.set(0, 0.072, -0.04);
        group.add(holoGlass);

        const vGrip = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.072, 0.028), darkMat);
        vGrip.position.set(0, -0.038, -0.31);
        group.add(vGrip);

        const flashHider = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.045, 12), darkMat);
        flashHider.rotation.x = Math.PI / 2;
        flashHider.position.set(0, 0.024, -0.56);
        group.add(flashHider);
        muzzlePoint.set(0, 0.024, -0.59);
      }

      // Buttstock (Wide Crane Stock on M4A4 vs Compact Carbine Stock on M4A1-S)
      const stock = new THREE.Mesh(
        new THREE.BoxGeometry(isSilenced ? 0.032 : 0.044, 0.088, 0.21),
        isSilenced ? darkMat : skinMat
      );
      stock.position.set(0, 0.004, 0.17);
      group.add(stock);

      // Pistol Grip & STANAG Magazine
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.105, 0.042), darkMat);
      grip.position.set(0, -0.052, 0.03);
      grip.rotation.x = 0.26;
      group.add(grip);

      magMesh = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.145, 0.052), skinMat);
      magMesh.position.set(0, -0.068, -0.10);
      magMesh.rotation.x = -0.12;
      group.add(magMesh);

      slideOrBoltMesh = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.012, 0.055), chromeMat);
      slideOrBoltMesh.position.set(0.024, 0.032, -0.05);
      group.add(slideOrBoltMesh);

      leftHandTarget.set(-0.024, -0.032, -0.29);
      rightHandTarget.set(0.012, -0.055, 0.03);
    }

    // --- 7. AWP & SSG 08 (SNIPER RIFLES — HEAVY MAGNUM CHASSIS vs SKELETON SCOUT) ---
    else {
      const isScout = weaponId === 'ssg08';

      // Sniper Chassis Receiver & Forend (Skinned)
      const bodyLen = isScout ? 0.38 : 0.48;
      const bodyH = isScout ? 0.054 : 0.072;
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.048, bodyH, bodyLen), skinMat);
      receiver.position.set(0, 0.018, -0.12);
      group.add(receiver);

      // Long Free-Floating Fluted Barrel
      const barrelLen = isScout ? 0.50 : 0.58;
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(isScout ? 0.010 : 0.014, isScout ? 0.012 : 0.016, barrelLen, 16),
        isScout ? chromeMat : darkMat
      );
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.030, -0.22 - barrelLen * 0.5);
      group.add(barrel);

      if (!isScout) {
        // AWP: Heavy Dual-Chamber Muzzle Brake + Folded Steel Bipod
        const brake = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.030, 0.065), darkMat);
        brake.position.set(0, 0.030, -0.24 - barrelLen);
        group.add(brake);

        const bipod = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.016, 0.22), darkMat);
        bipod.position.set(0, -0.024, -0.30);
        group.add(bipod);
        muzzlePoint.set(0, 0.030, -0.28 - barrelLen);
      } else {
        muzzlePoint.set(0, 0.030, -0.23 - barrelLen);
      }

      // Buttstock (Heavy Thumbhole Stock on AWP vs Open Skeleton Stock on SSG 08)
      const stock = new THREE.Mesh(
        new THREE.BoxGeometry(0.042, isScout ? 0.068 : 0.095, 0.26),
        skinMat
      );
      stock.position.set(0, 0.0, 0.18);
      group.add(stock);
      const cheekPad = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.022, 0.12), darkMat);
      cheekPad.position.set(0, 0.048, 0.18);
      group.add(cheekPad);

      // Grip & Box Magazine
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.105, 0.042), darkMat);
      grip.position.set(0, -0.052, 0.03);
      grip.rotation.x = 0.22;
      group.add(grip);

      magMesh = new THREE.Mesh(new THREE.BoxGeometry(0.030, isScout ? 0.065 : 0.088, 0.068), darkMat);
      magMesh.position.set(0, -0.048, -0.09);
      group.add(magMesh);

      // Bolt-Action Handle
      slideOrBoltMesh = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.012, 0.065), chromeMat);
      slideOrBoltMesh.position.set(0.026, 0.035, -0.04);
      group.add(slideOrBoltMesh);

      // Telescopic Sniper Scope (Giant 50mm Bell on AWP vs Compact Tube on Scout)
      const scopeGroup = new THREE.Group();
      const scopeLen = isScout ? 0.20 : 0.30;
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.016, scopeLen, 16), darkMat);
      tube.rotation.x = Math.PI / 2;
      scopeGroup.add(tube);

      const bellFront = new THREE.Mesh(
        new THREE.CylinderGeometry(isScout ? 0.022 : 0.029, 0.018, 0.065, 16),
        skinMat
      );
      bellFront.rotation.x = Math.PI / 2;
      bellFront.position.z = -scopeLen * 0.5;
      scopeGroup.add(bellFront);

      const lensMat = new THREE.MeshStandardMaterial({
        color: 0x0ea5e9, emissive: 0x0284c7, emissiveIntensity: 0.5, metalness: 0.9, roughness: 0.1
      });
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.021, 16), lensMat);
      lens.position.z = 0.028 + scopeLen * 0.5;
      scopeGroup.add(lens);

      scopeGroup.position.set(0, 0.088, -0.08);
      group.add(scopeGroup);

      leftHandTarget.set(-0.025, -0.024, -0.26);
      rightHandTarget.set(0.012, -0.055, 0.03);
    }

    // --- FIRST-PERSON HANDS & GLOVES ---
    let leftArmGroup = null;
    let rightArmGroup = null;
    if (includeHands) {
      const gloveData = CS.GLOVES[gloveId] || CS.GLOVES.gloves_default;
      const outfitData = CS.AGENT_OUTFITS[outfitId] || CS.AGENT_OUTFITS.sas_navy;

      const sleeveMat = new THREE.MeshStandardMaterial({ color: outfitData.suitColor, roughness: 0.72, metalness: 0.15 });
      const gloveBaseMat = new THREE.MeshStandardMaterial({ color: gloveData.primary, roughness: 0.55, metalness: 0.25 });
      const gloveAccentMat = new THREE.MeshStandardMaterial({ color: gloveData.secondary, roughness: 0.4, metalness: 0.45 });
      const knuckleMat = new THREE.MeshStandardMaterial({ color: gloveData.accent, roughness: 0.3, metalness: 0.65 });

      const makeHandAndForearm = (isLeft) => {
        const hGroup = new THREE.Group();
        // Palm
        const palm = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.034, 0.068), gloveBaseMat);
        hGroup.add(palm);
        // Armored dorsal plate + knuckles
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.012, 0.052), gloveAccentMat);
        plate.position.set(0, 0.018, 0.004);
        hGroup.add(plate);
        const knuckles = new THREE.Mesh(new THREE.BoxGeometry(0.050, 0.014, 0.016), knuckleMat);
        knuckles.position.set(0, 0.018, -0.024);
        hGroup.add(knuckles);
        // Fingers
        const fingers = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.028, 0.038), gloveBaseMat);
        fingers.position.set(0, -0.004, -0.045);
        hGroup.add(fingers);
        // Forearm tactical sleeve
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.042, 0.28, 10), sleeveMat);
        arm.rotation.x = Math.PI / 2 - 0.22;
        arm.rotation.z = isLeft ? -0.26 : 0.18;
        arm.position.set(isLeft ? -0.04 : 0.03, -0.03, 0.16);
        hGroup.add(arm);
        return hGroup;
      };

      leftArmGroup = makeHandAndForearm(true);
      leftArmGroup.position.copy(leftHandTarget);
      group.add(leftArmGroup);

      rightArmGroup = makeHandAndForearm(false);
      rightArmGroup.position.copy(rightHandTarget);
      group.add(rightArmGroup);
    }

    group.userData = {
      weaponId,
      skinId,
      knifeModelId,
      magMesh,
      magDefaultPos: magMesh ? magMesh.position.clone() : null,
      slideOrBoltMesh,
      slideDefaultPos: slideOrBoltMesh ? slideOrBoltMesh.position.clone() : null,
      leftArmGroup,
      leftHandDefaultPos: leftHandTarget.clone(),
      rightArmGroup,
      rightHandDefaultPos: rightHandTarget.clone(),
      muzzlePoint
    };

    return group;
  }

  buildGrenadeMesh(gType = 'he') {
    const g = new THREE.Group();
    if (gType === 'he') {
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2d4a2b, roughness: 0.45, metalness: 0.5 });
      const ringMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3, metalness: 0.6 });
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.042, 14, 12), bodyMat);
      g.add(sphere);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.043, 0.043, 0.014, 14), ringMat);
      g.add(band);
      const fuse = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.032, 10), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 }));
      fuse.position.y = 0.046;
      g.add(fuse);
    } else if (gType === 'flash') {
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.3, metalness: 0.75 });
      const stripeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.3 });
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.10, 14), bodyMat);
      g.add(cyl);
      const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.029, 0.029, 0.022, 14), stripeMat);
      stripe.position.y = 0.015;
      g.add(stripe);
    } else if (gType === 'smoke') {
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5, metalness: 0.5 });
      const bandMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.4 });
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.11, 14), bodyMat);
      g.add(cyl);
      const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.024, 14), bandMat);
      g.add(stripe);
    } else {
      // Molotov
      const glassMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.15, metalness: 0.2, transparent: true, opacity: 0.88 });
      const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.034, 0.11, 12), glassMat);
      g.add(bottle);
      const flameMat = new THREE.MeshBasicMaterial({ color: 0xff9900 });
      const wick = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 8), flameMat);
      wick.position.y = 0.068;
      g.add(wick);
    }
    return g;
  }

  buildC4Mesh() {
    const g = new THREE.Group();
    const packMat = new THREE.MeshStandardMaterial({ color: 0x85754e, roughness: 0.75, metalness: 0.1 });
    const tapeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const ledMat = new THREE.MeshBasicMaterial({ color: 0xff1e27 });

    // Dual explosive bricks
    const brick1 = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.045, 0.16), packMat);
    brick1.position.x = -0.046;
    g.add(brick1);
    const brick2 = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.045, 0.16), packMat);
    brick2.position.x = 0.046;
    g.add(brick2);

    // Straps
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.185, 0.048, 0.03), tapeMat);
    strap.position.z = 0.04;
    g.add(strap);

    // Keypad unit on top
    const keypad = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.022, 0.10), tapeMat);
    keypad.position.set(0, 0.028, -0.01);
    g.add(keypad);

    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.006, 0.028), screenMat);
    screen.position.set(0, 0.038, -0.035);
    g.add(screen);

    const led = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 8), ledMat);
    led.position.set(0.032, 0.042, 0.025);
    led.name = 'c4Led';
    g.add(led);

    return g;
  }
}

CS.weaponBuilder = new WeaponModelBuilder();
