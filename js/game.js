// ============================================================================
// COUNTER OPS: TACTICAL STRIKE - CORE 3D FIRST-PERSON SHOOTER ENGINE
// ============================================================================
window.CS = window.CS || {};

class TacticalGame {
  constructor() {
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.vmScene = null;
    this.vmCamera = null;

    this.running = false;
    this.paused = false;
    this.buyMenuOpen = false;
    this.currentMode = 'bomb';
    this.modeConfig = CS.MODES.bomb;
    this.currentMap = 'de_sandstorm';
    this.currentDifficulty = 'hard';

    // Match & Round State
    this.roundNumber = 1;
    this.scores = { CT: 0, T: 0 };
    this.roundPhase = 'buy'; // 'buy', 'live', 'planted', 'ended'
    this.phaseTimer = 20;
    this.buyZoneTimer = 20;

    // Player State
    this.player = {
      team: 'CT',
      health: 100,
      armor: 100,
      hasHelmet: true,
      hasDefuseKit: false,
      money: 800,
      kills: 0,
      deaths: 0,
      assists: 0,
      armsRaceIndex: 0,
      dead: false,
      respawnTimer: 0,
      spawnShieldTimer: 0,
      spawnShieldMax: 5.0,

      position: new THREE.Vector3(0, 0, -48),
      velocity: new THREE.Vector3(),
      yaw: Math.PI,
      pitch: 0,
      onGround: true,
      crouching: false,
      walking: false,
      eyeHeight: 1.65,
      stepDistance: 0,

      // Inventory Slots: 1=Primary, 2=Secondary, 3=Knife, 4=Grenades[], 5=C4
      slots: {
        1: null,
        2: { id: 'usps', mag: 12, reserve: 24, burstMode: false, silenced: true },
        3: { id: 'knife' },
        4: [], // e.g. ['he', 'flash', 'smoke', 'molotov']
        5: null
      },
      activeSlot: 2,
      lastSlot: 3,
      activeGrenadeIdx: 0,

      // Weapon Action State
      fireCooldown: 0,
      reloading: false,
      reloadTimer: 0,
       reloadDuration: 2.0,
      inspectTimer: 0,
      drawTimer: 0,
      recoilKick: 0,
      recoilPitchAccum: 0,
      recoilYawAccum: 0,
      shotsFired: 0,
      scopeIndex: -1, // -1 = unscoped, 0 = zoom1, 1 = zoom2

      // Bomb interaction & Death animation state
      plantingProgress: 0,
      defusingProgress: 0,
      flashedAlpha: 0,
      deathAnimTimer: 0,
      deathRollDir: 1,
      killerPos: null,
      roundKills: 0,
      multiKillCount: 0,
      lastKillTime: 0,
      clutchSituation: 0,
      pickupCooldown: 0
    };

    // World Entities
    this.bots = [];
    this.activeGrenades = [];
    this.smokeClouds = [];
    this.fireZones = [];
    this.tracers = [];
    this.particles = [];
    this.droppedItems = [];
    this.bulletDecals = [];
    this.shellCasings = [];
    this.damageIndicators = [];
    this.activeSquadOrder = null;
    this.roundFirstBloodAwarded = false;
    this._bulletDecalMat = null;

    this.plantedBomb = {
      active: false,
      site: 'A',
      position: new THREE.Vector3(),
      timer: 40,
      beepCooldown: 1.0,
      mesh: null
    };

    this.droppedBomb = {
      active: false,
      position: new THREE.Vector3(),
      mesh: null
    };

    // Input State
    this.keys = {};
    this.mouseDownLeft = false;
    this.mouseDownRight = false;
    this.viewmodelGroup = null;
    this.muzzleFlashLight = null;
    this.muzzleFlashMesh = null;
    this.muzzleFlashTimer = 0;

    this.raycaster = new THREE.Raycaster();
    this.lastFrameTime = performance.now();
  }

  init() {
    const canvas = document.getElementById('game-canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.autoClear = false;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 450);

    // Separate Viewmodel Scene so 3D gun/hands never clip into walls
    this.vmScene = new THREE.Scene();
    this.vmCamera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.02, 10);
    const vmHemi = new THREE.HemisphereLight(0xffffff, 0x334155, 0.95);
    this.vmScene.add(vmHemi);
    const vmDir = new THREE.DirectionalLight(0xfffbeb, 1.15);
    vmDir.position.set(1.5, 3, 2);
    this.vmScene.add(vmDir);

    this.viewmodelGroup = new THREE.Group();
    this.vmScene.add(this.viewmodelGroup);

    // Muzzle Flash Light & Star
    this.muzzleFlashLight = new THREE.PointLight(0xffaa33, 0, 6);
    this.vmScene.add(this.muzzleFlashLight);
    const mfGeo = new THREE.ConeGeometry(0.055, 0.18, 6);
    const mfMat = new THREE.MeshBasicMaterial({ color: 0xffdd66, transparent: true, opacity: 0.9 });
    this.muzzleFlashMesh = new THREE.Mesh(mfGeo, mfMat);
    this.muzzleFlashMesh.rotation.x = -Math.PI / 2;
    this.muzzleFlashMesh.visible = false;
    this.vmScene.add(this.muzzleFlashMesh);

    this.bindInputs();

    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.renderer.setSize(w, h);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.vmCamera.aspect = w / h;
      this.vmCamera.updateProjectionMatrix();
    });

    requestAnimationFrame((t) => this.loop(t));
  }

  bindInputs() {
    window.addEventListener('keydown', (e) => {
      if (!this.running) return;
      const code = e.code;
      this.keys[code] = true;

      if (code === 'Tab') {
        e.preventDefault();
        CS.ui.renderScoreboard(this);
        document.getElementById('scoreboard-overlay')?.classList.remove('hidden');
      } else if (code === 'KeyB') {
        if (!this.player.dead) this.toggleBuyMenu();
      } else if (code === 'Escape') {
        if (this.buyMenuOpen) {
          this.toggleBuyMenu(false);
        } else {
          this.togglePauseMenu();
        }
      } else if (!this.paused && !this.buyMenuOpen && this.player.dead && !this.modeConfig.respawn) {
        if (code === 'Space') {
          this.cycleSpectatorTarget(1);
        }
      } else if (!this.paused && !this.buyMenuOpen && !this.player.dead) {
        if (code === 'Digit1') this.switchSlot(1);
        else if (code === 'Digit2') this.switchSlot(2);
        else if (code === 'Digit3') this.switchSlot(3);
        else if (code === 'Digit4') this.switchSlot(4);
        else if (code === 'Digit5') this.switchSlot(5);
        else if (code === 'KeyQ') this.switchSlot(this.player.lastSlot || 3);
        else if (code === 'KeyR') this.startReload();
        else if (code === 'KeyF') this.triggerInspect();
        else if (code === 'KeyG') this.dropCurrentWeapon();
        else if (code === 'KeyZ') this.sendRadioCommand('rush');
        else if (code === 'KeyX') this.sendRadioCommand('follow');
        else if (code === 'KeyV') this.sendRadioCommand('hold');
        else if (code === 'Space' && this.player.onGround) {
          this.player.velocity.y = 6.9;
          this.player.onGround = false;
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      if (e.code === 'Tab') {
        document.getElementById('scoreboard-overlay')?.classList.add('hidden');
      }
    });

    const canvas = document.getElementById('game-canvas');
    canvas.addEventListener('mousedown', (e) => {
      if (!this.running || this.paused || this.buyMenuOpen) return;
      if (document.pointerLockElement !== canvas) {
        this.safeRequestPointerLock();
        return;
      }
      if (this.player.dead) {
        if (!this.modeConfig.respawn && (e.button === 0 || e.button === 2)) {
          this.cycleSpectatorTarget(e.button === 0 ? 1 : -1);
        }
        return;
      }

      if (e.button === 0) {
        this.mouseDownLeft = true;
        this.tryFireWeapon(false);
      } else if (e.button === 2) {
        this.mouseDownRight = true;
        this.handleRightClick();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouseDownLeft = false;
      if (e.button === 2) this.mouseDownRight = false;
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('mousemove', (e) => {
      if (!this.running || this.paused || this.buyMenuOpen || this.player.dead) return;
      if (document.pointerLockElement !== canvas) return;

      const sens = (CS.ui.profile.settings.sensitivity || 2.2) * 0.00095;
      const scopeFactor = this.player.scopeIndex >= 0 ? 0.42 : 1.0;
      const dy = e.movementY * sens * scopeFactor;
      this.player.yaw -= e.movementX * sens * scopeFactor;
      this.player.pitch -= dy;
      // When the player pulls the mouse down to control spray, reduce accumulated recoil recovery
      if (dy > 0 && this.player.recoilPitchAccum > 0) {
        this.player.recoilPitchAccum = Math.max(0, this.player.recoilPitchAccum - dy);
      }
      const maxPitch = Math.PI / 2 - 0.04;
      this.player.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.player.pitch));
    });

    window.addEventListener('wheel', (e) => {
      if (!this.running || this.paused || this.buyMenuOpen || this.player.dead) return;
      const order = [1, 2, 3, 4, 5].filter(s => this.hasSlotItem(s));
      const idx = order.indexOf(this.player.activeSlot);
      if (idx === -1) return;
      const nextIdx = (idx + (e.deltaY > 0 ? 1 : -1) + order.length) % order.length;
      this.switchSlot(order[nextIdx]);
    });

    // Pause & Round-End menu buttons
    document.getElementById('btn-resume-game')?.addEventListener('click', () => this.togglePauseMenu(false));
    document.getElementById('btn-restart-round')?.addEventListener('click', () => {
      this.togglePauseMenu(false);
      this.roundNumber++;
      this.startNewRound();
      this.safeRequestPointerLock();
    });
    document.getElementById('btn-return-lobby')?.addEventListener('click', () => this.exitToLobby());
    document.getElementById('btn-close-buy')?.addEventListener('click', () => this.toggleBuyMenu(false));

    // Round End Modal Choice Buttons ("Noch eine Runde spielen" vs "Zurück ins Hauptmenü")
    document.getElementById('btn-play-next-round')?.addEventListener('click', () => {
      CS.audio.playUISound('buy');
      document.getElementById('round-end-overlay')?.classList.add('hidden');
      this.roundNumber++;
      this.startNewRound();
      this.safeRequestPointerLock();
    });
    document.getElementById('btn-round-end-lobby')?.addEventListener('click', () => {
      CS.audio.playUISound('click');
      document.getElementById('round-end-overlay')?.classList.add('hidden');
      this.exitToLobby();
    });
  }

  // ==========================================================================
  // MATCH & ROUND LIFECYCLE
  // ==========================================================================
  getDifficultyData() {
    return CS.DIFFICULTIES[this.currentDifficulty] || CS.DIFFICULTIES.hard;
  }

  getCreditMultiplier() {
    const diffMult = this.getDifficultyData().creditMult || 1.0;
    const modeMult = (this.modeConfig && this.modeConfig.creditMult) || 1.0;
    return diffMult * modeMult;
  }

  getXPMultiplier() {
    return this.getDifficultyData().xpMult || 1.0;
  }

  setDifficulty(diffId) {
    if (!CS.DIFFICULTIES[diffId]) return;
    this.currentDifficulty = diffId;
    if (CS.ui && CS.ui.profile && CS.ui.profile.settings) {
      CS.ui.profile.settings.difficulty = diffId;
      CS.ui.saveProfile();
      CS.ui.syncDifficultyControls(diffId);
    }
    const diff = this.getDifficultyData();
    if (this.running) {
      for (const b of this.bots) {
        if (!b.dead) {
          const cfg = b.getDifficultyConfig(this);
          b.armor = Math.min(b.armor, cfg.startArmor ?? 100);
          b.hasHelmet = cfg.hasHelmet ?? true;
          b.hasDefuseKit = b.team === 'CT' && (cfg.hasDefuseKit ?? true);
          b.grenadesLeft = Math.min(b.grenadesLeft, cfg.maxGrenades ?? 0);
        }
        b.buildMesh();
      }
      this.updateHUD();
      CS.ui.showToast(`${diff.icon} KI-Schwierigkeit geändert auf: ${diff.name.toUpperCase()} (${diff.badge})`, 'gold');
    }
  }

  startMatch(modeId = 'bomb', mapId = 'de_sandstorm', playerTeam = 'CT', difficultyId = null) {
    CS.audio.init();
    this.currentMode = modeId;
    this.modeConfig = CS.MODES[modeId] || CS.MODES.bomb;
    this.currentMap = mapId;
    this.player.team = playerTeam;
    this.currentDifficulty = difficultyId || CS.ui?.profile?.settings?.difficulty || 'hard';
    if (CS.ui?.profile?.settings) {
      CS.ui.profile.settings.difficulty = this.currentDifficulty;
      CS.ui.saveProfile();
      CS.ui.syncDifficultyControls(this.currentDifficulty);
    }

    // Clear previous scene
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }
    this.bots = [];
    this.activeGrenades = [];
    this.smokeClouds = [];
    this.fireZones = [];
    this.tracers = [];
    this.particles = [];
    this.droppedItems = [];
    this.bulletDecals = [];
    this.shellCasings = [];
    this.clearDamageIndicators();

    // Build 3D Map
    CS.mapBuilder.build(this.scene, mapId);

    // Reset Match Scores & Stats
    this.roundNumber = 1;
    this.scores = { CT: 0, T: 0 };
    this.player.kills = 0;
    this.player.deaths = 0;
    this.player.assists = 0;
    this.player.armsRaceIndex = 0;
    this.player.money = this.modeConfig.startMoney;

    // Reset Default Inventory
    const startPistol = playerTeam === 'CT' ? 'usps' : 'glock';
    const pData = CS.WEAPONS[startPistol];
    this.player.slots = {
      1: modeId === 'tdm' ? { id: playerTeam === 'CT' ? 'm4a4' : 'ak47', mag: 30, reserve: 90, burstMode: false, silenced: false } : null,
      2: { id: startPistol, mag: pData.magSize, reserve: pData.reserveAmmo, burstMode: false, silenced: !!pData.silenced },
      3: { id: 'knife' },
      4: modeId === 'practice' ? ['he', 'flash', 'smoke', 'molotov'] : [],
      5: null
    };

    if (modeId === 'armsrace') {
      this.equipArmsRaceWeapon();
    }

    // Spawn AI Bots (Teammates & Enemies)
    const botCountPerTeam = CS.ui.profile.settings.botCount ?? 4;
    let nameIdx = 0;
    // Allies
    for (let i = 0; i < botCountPerTeam; i++) {
      const bName = CS.BOT_NAMES[nameIdx++ % CS.BOT_NAMES.length];
      this.bots.push(new CS.TacticalBot(`ally_${i}`, bName, playerTeam, this.scene));
    }
    // Enemies
    const enemyTeam = playerTeam === 'CT' ? 'T' : 'CT';
    for (let i = 0; i <= botCountPerTeam; i++) {
      const bName = CS.BOT_NAMES[nameIdx++ % CS.BOT_NAMES.length];
      this.bots.push(new CS.TacticalBot(`enemy_${i}`, bName, enemyTeam, this.scene));
    }

    // Switch UI & Canvases from Lobby to In-Game 3D Match
    document.getElementById('lobby-screen')?.classList.add('hidden');
    document.getElementById('lobby-canvas')?.classList.add('hidden');
    document.getElementById('game-canvas')?.classList.remove('hidden');
    document.getElementById('hud-screen')?.classList.remove('hidden');
    document.getElementById('pause-overlay')?.classList.add('hidden');
    document.getElementById('buy-menu-overlay')?.classList.add('hidden');

    this.running = true;
    this.paused = false;
    this.buyMenuOpen = false;

    this.startNewRound();
    this.safeRequestPointerLock();
  }

  safeRequestPointerLock() {
    const canvas = document.getElementById('game-canvas');
    if (!canvas || !canvas.requestPointerLock) return;
    try {
      const p = canvas.requestPointerLock();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (e) {}
  }

  exitToLobby() {
    this.running = false;
    this.paused = false;
    this.buyMenuOpen = false;
    if (document.pointerLockElement) {
      try { document.exitPointerLock(); } catch (e) {}
    }

    document.getElementById('hud-screen')?.classList.add('hidden');
    document.getElementById('death-screen-overlay')?.classList.add('hidden');
    document.getElementById('pause-overlay')?.classList.add('hidden');
    document.getElementById('round-end-overlay')?.classList.add('hidden');
    document.getElementById('buy-menu-overlay')?.classList.add('hidden');
    document.getElementById('lobby-canvas')?.classList.remove('hidden');
    document.getElementById('lobby-screen')?.classList.remove('hidden');

    CS.ui.updateHeaderStats();
    CS.ui.renderStatsTab();
    CS.ui.rebuildLobbyShowcase();
  }

  startNewRound() {
    // Cleanup round entities
    this.clearRoundEntities();

    const isBombMode = this.currentMode === 'bomb';
    this.roundPhase = 'live';
    this.phaseTimer = this.modeConfig.roundTime || 300; // 5:00 minutes per round
    this.buyZoneTimer = this.modeConfig.buyTime || 300;
    document.getElementById('round-end-overlay')?.classList.add('hidden');
    document.getElementById('death-screen-overlay')?.classList.add('hidden');

    // Spawn Player at a varied spawn point with 5.0s Spawn Shield
    const pSpawns = CS.mapBuilder.spawns[this.player.team] || [];
    const playerSpawnIdx = Math.floor(Math.random() * pSpawns.length);
    const sp = pSpawns[playerSpawnIdx] || { x: 0, y: 0, z: -62, rotY: Math.PI };
    this._allTsDeadPlantedNotified = false;
    this._suppressWinCheck = false;
    this.roundFirstBloodAwarded = false;
    this.activeSquadOrder = null;
    this.clearDamageIndicators();
    document.getElementById('multikill-banner')?.classList.add('hidden');
    document.getElementById('squad-order-badge')?.classList.add('hidden');
    this.player.dead = false;
    this.player.deathAnimTimer = 0;
    this.player.killerPos = null;
    this.player.spectateBotId = null;
    this.player.roundKills = 0;
    this.player.multiKillCount = 0;
    this.player.lastKillTime = 0;
    this.player.clutchSituation = 0;
    this.player.pickupCooldown = 0;
    this.player.health = 100;
    this.player.armor = 100;
    this.player.hasHelmet = true;
    this.player.spawnShieldMax = 5.0;
    this.player.spawnShieldTimer = 5.0;
    this.player.flashedAlpha = 0;
    this.player.plantingProgress = 0;
    this.player.defusingProgress = 0;
    this.player.recoilKick = 0;
    this.player.recoilPitchAccum = 0;
    this.player.recoilYawAccum = 0;
    this.player.reloading = false;
    this.player.fireCooldown = 0;
    this.player.eyeHeight = 1.65;
    this.player.position.set(sp.x, sp.y || 0, sp.z);
    this.player.velocity.set(0, 0, 0);
    this.player.yaw = sp.rotY;
    this.player.pitch = 0;
    if (this.camera) this.camera.rotation.z = 0;
    this.setScope(-1);

    // Refill ammo on all owned weapons
    [1, 2].forEach(slotNum => {
      const item = this.player.slots[slotNum];
      if (item && CS.WEAPONS[item.id]) {
        item.mag = CS.WEAPONS[item.id].magSize;
        item.reserve = CS.WEAPONS[item.id].reserveAmmo;
      }
    });

    // Assign C4 in Bomb mode
    this.player.slots[5] = null;
    this.bots.forEach(b => { b.hasC4 = false; });
    if (isBombMode || this.currentMode === 'practice') {
      if (this.player.team === 'T') {
        this.player.slots[5] = { id: 'c4' };
        CS.ui.showToast('💣 Du trägst das C4! Platziere es bei Bombenplatz A oder B [E].', 'gold');
      } else {
        const tBots = this.bots.filter(b => b.team === 'T');
        if (tBots.length > 0) {
          tBots[0].hasC4 = true;
        }
      }
    }

    // Spawn Bots across varied spawn points (including DM points in respawn modes!)
    let ctOffset = Math.floor(Math.random() * 10);
    let tOffset = Math.floor(Math.random() * 10);
    for (const bot of this.bots) {
      const baseList = CS.mapBuilder.spawns[bot.team] || [];
      const dmList = (this.modeConfig.respawn && CS.mapBuilder.spawns.DM) ? CS.mapBuilder.spawns.DM : [];
      const list = (this.modeConfig.respawn && Math.random() < 0.45 && dmList.length > 0) ? dmList : baseList;
      const idx = bot.team === 'CT' ? (++ctOffset % list.length) : (++tOffset % list.length);
      bot.spawnAt(list[idx]);
      bot.buyEquipmentForRound(this.currentMode);
    }

    const bestSlot = this.player.slots[1] ? 1 : 2;
    this.switchSlot(bestSlot);
    this.showBanner(`RUNDE ${this.roundNumber}`, isBombMode ? 'KAUFPHASE AKTIV — DRÜCKE [B] FÜR WAFFEN & GRANATEN' : this.modeConfig.name);
  }

  clearRoundEntities() {
    [...this.activeGrenades, ...this.smokeClouds, ...this.fireZones, ...this.droppedItems, ...this.bulletDecals, ...this.shellCasings].forEach(ent => {
      if (ent.mesh) this.scene.remove(ent.mesh);
      if (ent.light) this.scene.remove(ent.light);
    });
    this.activeGrenades = [];
    this.smokeClouds = [];
    this.fireZones = [];
    this.droppedItems = [];
    this.bulletDecals = [];
    this.shellCasings = [];

    if (this.plantedBomb.mesh) this.scene.remove(this.plantedBomb.mesh);
    this.plantedBomb.active = false;
    this.plantedBomb.mesh = null;

    if (this.droppedBomb.mesh) this.scene.remove(this.droppedBomb.mesh);
    this.droppedBomb.active = false;
    this.droppedBomb.mesh = null;
  }

  endRound(winningTeam, reasonText) {
    if (this.roundPhase === 'ended') return;
    this.roundPhase = 'ended';
    this.buyMenuOpen = false;
    document.getElementById('buy-menu-overlay')?.classList.add('hidden');
    document.getElementById('death-screen-overlay')?.classList.add('hidden');
    document.getElementById('interaction-prompt')?.classList.add('hidden');
    document.getElementById('action-progress-wrap')?.classList.add('hidden');

    if (document.pointerLockElement) {
      try { document.exitPointerLock(); } catch (e) {}
    }

    if (this.currentMode === 'bomb') {
      this.scores[winningTeam] = (this.scores[winningTeam] || 0) + 1;
    }

    const playerWon = winningTeam === this.player.team;
    CS.ui.recordRoundEnd(playerWon, this.currentMap);

    // Economy & Lobby Credits / XP Rewards!
    const roundMoneyBonus = playerWon ? 3250 : 1900;
    this.player.money = Math.min(16000, this.player.money + roundMoneyBonus);
    this.bots.forEach(b => {
      b.money = Math.min(16000, b.money + (b.team === winningTeam ? 3250 : 1900));
    });

    const isPractice = this.currentMode === 'practice';
    const baseRoundCR = isPractice ? (playerWon ? 15 : 8) : (playerWon ? 35 : 15);
    let creditReward = Math.max(1, Math.round(baseRoundCR * this.getCreditMultiplier()));
    const xpReward = Math.max(10, Math.round((playerWon ? 150 : 80) * this.getXPMultiplier()));
    const diffData = this.getDifficultyData();

    // Award Clutch Bonus if player won a 1v2+ situation in Bomb mode!
    if (playerWon && !this.player.dead && this.currentMode === 'bomb' && (this.player.clutchSituation || 0) >= 2) {
      const clutchCR = Math.round(60 * this.player.clutchSituation * this.getCreditMultiplier());
      creditReward += clutchCR;
      CS.ui.recordMedal('clutchesWon');
      this.showMultiKillBanner(
        '🏆🔥🏆',
        `1v${this.player.clutchSituation} CLUTCH GEWONNEN!`,
        `+${clutchCR} CLUTCH BONUS CR`,
        true
      );
    }

    CS.ui.addCredits(creditReward, `${playerWon ? 'Runde gewonnen!' : 'Runde abgeschlossen'} (${diffData.name} • ${diffData.badge})`);
    CS.ui.addXP(xpReward);

    CS.audio.announce(winningTeam === 'CT' ? 'Counter-Terrorists Win' : 'Terrorists Win');

    // Populate & Open Round-End Choice Modal ("Noch eine Runde spielen" vs "Zurück ins Menü")
    const titleEl = document.getElementById('round-end-title');
    const reasonEl = document.getElementById('round-end-reason');
    const scoreEl = document.getElementById('round-end-score');
    const kdEl = document.getElementById('round-end-kd');
    const crEl = document.getElementById('round-end-credits');

    if (titleEl) {
      titleEl.textContent = winningTeam === 'CT' ? '🛡️ COUNTER-TERRORISTS GEWINNEN!' : '⚔️ TERRORISTEN GEWINNEN!';
      titleEl.style.color = winningTeam === 'CT' ? '#38bdf8' : '#fbbf24';
    }
    if (reasonEl) reasonEl.textContent = `${reasonText} (+$${roundMoneyBonus} Match-Geld • KI: ${diffData.name})`;
    if (scoreEl) scoreEl.textContent = `CT ${this.scores.CT} : ${this.scores.T} T`;
    if (kdEl) kdEl.textContent = `${this.player.kills} / ${this.player.deaths}`;
    if (crEl) crEl.textContent = `+${creditReward} CR (${diffData.creditMult}x)`;

    this.updateHUD();
    document.getElementById('round-end-overlay')?.classList.remove('hidden');
  }

  // ==========================================================================
  // WEAPON SWITCHING, BUYING, RELOADING, INSPECTING & FIRING
  // ==========================================================================
  hasSlotItem(slotNum) {
    if (slotNum === 4) return this.player.slots[4] && this.player.slots[4].length > 0;
    return !!this.player.slots[slotNum];
  }

  getActiveWeaponData() {
    const s = this.player.activeSlot;
    if (s === 4) {
      const gList = this.player.slots[4];
      if (!gList || !gList.length) return CS.WEAPONS.knife;
      const gId = gList[this.player.activeGrenadeIdx % gList.length];
      return CS.WEAPONS[gId];
    }
    const slotObj = this.player.slots[s];
    if (!slotObj) return CS.WEAPONS.knife;
    return CS.WEAPONS[slotObj.id] || CS.WEAPONS.knife;
  }

  switchSlot(slotNum) {
    if (slotNum === 4) {
      const gList = this.player.slots[4];
      if (!gList || gList.length === 0) return;
      if (this.player.activeSlot === 4) {
        this.player.activeGrenadeIdx = (this.player.activeGrenadeIdx + 1) % gList.length;
      } else {
        this.player.lastSlot = this.player.activeSlot;
        this.player.activeSlot = 4;
        this.player.activeGrenadeIdx = 0;
      }
    } else {
      if (!this.player.slots[slotNum]) return;
      if (this.player.activeSlot !== slotNum) {
        this.player.lastSlot = this.player.activeSlot;
        this.player.activeSlot = slotNum;
      }
    }

    this.player.reloading = false;
    this.player.inspectTimer = 0;
    this.player.drawTimer = 0.36;
    this.setScope(-1);
    CS.audio.playUISound('click');
    this.rebuildViewmodel();
    this.updateHUD();
  }

  rebuildViewmodel() {
    while (this.viewmodelGroup.children.length > 0) {
      this.viewmodelGroup.remove(this.viewmodelGroup.children[0]);
    }
    const wData = this.getActiveWeaponData();
    const slotObj = this.player.slots[this.player.activeSlot];
    const skinId = (slotObj && slotObj.skinId) ? slotObj.skinId : (CS.ui.profile.weaponSkins[wData.id] || 'default');
    const knifeModelId = CS.ui.profile.equippedKnife || 'knife_default';
    const gloveId = CS.ui.profile.equippedGlove || 'gloves_default';
    const outfitId = CS.ui.profile.equippedOutfit || 'sas_navy';

    const model = CS.weaponBuilder.buildWeaponModel(wData.id, skinId, knifeModelId, gloveId, outfitId, true);

    // Check if silencer is detached on USP-S / M4A1-S
    if (slotObj && wData.canToggleSilencer && slotObj.silenced === false) {
      const sup = model.getObjectByName('silencerMesh');
      if (sup) sup.visible = false;
    }

    model.position.set(0.24, -0.23, -0.44);
    this.viewmodelGroup.add(model);
  }

  triggerInspect() {
    if (this.player.reloading) return;
    this.player.inspectTimer = 2.6;
    CS.audio.playUISound('click');
  }

  startReload() {
    const s = this.player.activeSlot;
    if (s !== 1 && s !== 2) return;
    const slotObj = this.player.slots[s];
    if (!slotObj) return;
    const wData = CS.WEAPONS[slotObj.id];
    if (!wData || slotObj.mag >= wData.magSize || slotObj.reserve <= 0 || this.player.reloading) return;

    this.setScope(-1);
    this.player.reloading = true;
    this.player.reloadDuration = wData.reloadTime || 2.3;
    this.player.reloadTimer = this.player.reloadDuration;
    this.player.inspectTimer = 0;

    CS.audio.playReloadStep('mag_out');
    setTimeout(() => {
      if (this.player.reloading) CS.audio.playReloadStep('mag_in');
    }, this.player.reloadDuration * 520);
    setTimeout(() => {
      if (this.player.reloading) CS.audio.playReloadStep('bolt');
    }, this.player.reloadDuration * 820);
  }

  completeReload() {
    const s = this.player.activeSlot;
    const slotObj = this.player.slots[s];
    if (!slotObj) return;
    const wData = CS.WEAPONS[slotObj.id];
    const needed = wData.magSize - slotObj.mag;
    const take = Math.min(needed, slotObj.reserve);
    slotObj.mag += take;
    slotObj.reserve -= take;
    this.player.reloading = false;
    this.updateHUD();
  }

  handleRightClick() {
    const wData = this.getActiveWeaponData();
    const slotObj = this.player.slots[this.player.activeSlot];

    // 1. Scoped Rifles / Snipers (AWP, SSG 08, AUG)
    if (wData.scopeLevels && wData.scopeLevels.length > 0) {
      const nextIdx = this.player.scopeIndex + 1;
      if (nextIdx >= wData.scopeLevels.length) {
        this.setScope(-1);
      } else {
        this.setScope(nextIdx);
      }
      CS.audio.playUISound('click');
      return;
    }

    // 2. Knife Heavy Backstab
    if (wData.id === 'knife') {
      this.tryFireWeapon(true);
      return;
    }

    // 3. Grenade Short Underhand Lob
    if (wData.isGrenade) {
      this.throwGrenade(wData.grenadeType, 11.5);
      return;
    }

    // 4. Burst Fire Toggle (Glock-18 / FAMAS)
    if (wData.burstCapable && slotObj) {
      slotObj.burstMode = !slotObj.burstMode;
      CS.audio.playUISound('click');
      CS.ui.showToast(`${wData.name}: ${slotObj.burstMode ? '3-Schuss Feuerstoß' : 'Einzelfeuer / Automatik'}`, 'info');
      this.updateHUD();
      return;
    }

    // 5. Detachable Silencer Toggle (USP-S / M4A1-S)
    if (wData.canToggleSilencer && slotObj) {
      slotObj.silenced = !slotObj.silenced;
      CS.audio.playReloadStep('bolt');
      CS.ui.showToast(`${wData.name}: Schalldämpfer ${slotObj.silenced ? 'montiert' : 'abgenommen'}`, 'info');
      this.rebuildViewmodel();
    }
  }

  setScope(levelIdx) {
    this.player.scopeIndex = levelIdx;
    const wData = this.getActiveWeaponData();
    const scopeOverlay = document.getElementById('scope-overlay');
    if (levelIdx >= 0 && wData.scopeLevels && wData.scopeLevels[levelIdx]) {
      const zoom = wData.scopeLevels[levelIdx];
      this.camera.fov = 75 / zoom;
      this.camera.updateProjectionMatrix();
      if (scopeOverlay) scopeOverlay.classList.remove('hidden');
      this.viewmodelGroup.visible = false;
    } else {
      this.player.scopeIndex = -1;
      this.camera.fov = 75;
      this.camera.updateProjectionMatrix();
      if (scopeOverlay) scopeOverlay.classList.add('hidden');
      this.viewmodelGroup.visible = true;
    }
  }

  tryFireWeapon(isHeavySecondary = false) {
    if (this.roundPhase === 'buy' || this.player.fireCooldown > 0 || this.player.reloading || this.player.drawTimer > 0.05) return;

    const wData = this.getActiveWeaponData();

    // C4 Bomb Planting handled in update loop
    if (wData.isC4) return;

    // Grenade Throw
    if (wData.isGrenade) {
      this.throwGrenade(wData.grenadeType, 22.5);
      return;
    }

    // Knife Attack
    if (wData.id === 'knife') {
      this.player.fireCooldown = isHeavySecondary ? 0.75 : 0.42;
      this.player.recoilKick = isHeavySecondary ? 0.16 : 0.09;
      CS.audio.playGunshot('knife');
      this.performKnifeHit(wData, isHeavySecondary);
      return;
    }

    // Firearm
    const slotObj = this.player.slots[this.player.activeSlot];
    if (!slotObj) return;
    if (slotObj.mag <= 0) {
      CS.audio.playUISound('click');
      this.startReload();
      return;
    }

    if (slotObj.burstMode) {
      this.fireSingleRound(wData, slotObj);
      setTimeout(() => { if (!this.player.dead && slotObj.mag > 0) this.fireSingleRound(wData, slotObj); }, 75);
      setTimeout(() => { if (!this.player.dead && slotObj.mag > 0) this.fireSingleRound(wData, slotObj); }, 150);
      this.player.fireCooldown = 0.48;
    } else {
      this.fireSingleRound(wData, slotObj);
      this.player.fireCooldown = 60 / (wData.fireRate || 600);
    }
  }

  fireSingleRound(wData, slotObj) {
    slotObj.mag--;
    this.player.shotsFired++;
    CS.ui.recordShotFired(wData.id);
    this._currentShotHitRecorded = false;

    const soundType = (wData.canToggleSilencer && !slotObj.silenced) ? 'rifle_m4' : wData.soundType;
    CS.audio.playGunshot(soundType);

    // Muzzle flash (unless silenced)
    const isSilenced = wData.silenced && slotObj.silenced !== false;
    if (!isSilenced) {
      this.muzzleFlashTimer = 0.045;
      this.muzzleFlashLight.intensity = 2.6;
      this.muzzleFlashMesh.visible = true;
      this.muzzleFlashMesh.rotation.z = Math.random() * Math.PI;

      // Alert enemy bots within their difficulty hearing range when firing unsilenced weapons
      for (const b of this.bots) {
        if (!b.dead && b.team !== this.player.team) {
          const hRange = b.getDifficultyConfig(this).hearingRange || 0;
          if (hRange > 0 && b.position.distanceTo(this.player.position) <= hRange) {
            b.alertTimer = Math.max(b.alertTimer, 4.2);
            b.alertTargetPos = this.player.position.clone();
          }
        }
      }
    }

    // Calculate Dynamic Spread (Movement + Crouch + Scope + Recoil)
    const horizSpeed = Math.hypot(this.player.velocity.x, this.player.velocity.z);
    let spread = wData.spreadBase + (horizSpeed / 6.5) * wData.spreadMove;
    if (this.player.crouching) spread *= 0.58;
    if (!this.player.onGround) spread += 0.085;
    if (wData.scopeLevels && this.player.scopeIndex < 0 && wData.spreadUnscoped) {
      spread = wData.spreadUnscoped + (horizSpeed / 6.5) * wData.spreadMove;
    } else if (this.player.scopeIndex >= 0) {
      spread *= 0.25;
    }

    const pellets = wData.pellets || 1;
    for (let p = 0; p < pellets; p++) {
      this.castBulletRay(wData, spread, !isSilenced);
    }

    // Eject 3D Brass Shell Casing
    this.spawnShellCasing(wData);

    // Apply Controlled CS Recoil Kick (low & smooth so spraying feels responsive)
    this.player.recoilKick = Math.min(0.068, this.player.recoilKick + 0.022);
    const upKick = wData.recoilUp * (this.player.crouching ? 0.65 : 1.0);
    const sideKick = (Math.random() - 0.5) * 2 * wData.recoilSide;
    const maxRecoilPitch = 0.055; // Cap total upward climb so bullets stay near crosshair
    const appliedUp = Math.max(0, Math.min(upKick, maxRecoilPitch - this.player.recoilPitchAccum));
    this.player.pitch = Math.min(Math.PI / 2 - 0.04, this.player.pitch + appliedUp);
    this.player.yaw += sideKick;
    this.player.recoilPitchAccum += appliedUp;

    // Bolt-action unscope & re-scope cycle for AWP / Scout
    if (wData.boltAction && this.player.scopeIndex >= 0) {
      const prevScope = this.player.scopeIndex;
      this.setScope(-1);
      setTimeout(() => {
        if (!this.player.dead && !this.player.reloading && this.getActiveWeaponData().id === wData.id) {
          this.setScope(prevScope);
        }
      }, 950);
    }

    this.updateHUD();
    if (slotObj.mag === 0 && slotObj.reserve > 0) {
      setTimeout(() => this.startReload(), 220);
    }
  }

  castBulletRay(wData, spread, showTracer = true) {
    const dir = new THREE.Vector3(
      (Math.random() - 0.5) * spread * 2,
      (Math.random() - 0.5) * spread * 2,
      -1
    ).normalize();

    const euler = new THREE.Euler(this.player.pitch, this.player.yaw, 0, 'YXZ');
    dir.applyEuler(euler);

    const origin = this.camera.position.clone();
    this.raycaster.set(origin, dir);
    this.raycaster.far = wData.range || 200;

    // Collect ONLY enemy bot hitboxes + map meshes (so allied bots never block player shots!)
    const targets = [...CS.mapBuilder.raycastMeshes];
    for (const b of this.bots) {
      if (!b.dead && b.team !== this.player.team && b.mesh && b.mesh.userData.hitboxes) {
        targets.push(...b.mesh.userData.hitboxes);
      }
    }

    const hits = this.raycaster.intersectObjects(targets, false);
    let endPt = origin.clone().addScaledVector(dir, wData.range || 150);

    if (hits.length > 0) {
      let hit = hits[0];
      // If first hit is a bot's arm/chest, check if the same ray also pierced that bot's head right behind the raised arm
      const firstBot = hit.object.userData.bot;
      if (firstBot && hit.object.userData.hitboxPart !== 'head') {
        for (let i = 1; i < hits.length; i++) {
          const h2 = hits[i];
          if (h2.distance - hit.distance > 0.45) break;
          if (h2.object.userData.bot === firstBot && h2.object.userData.hitboxPart === 'head') {
            hit = h2;
            break;
          }
        }
      }

      endPt = hit.point.clone();

      const bot = hit.object.userData.bot;
      if (bot && !bot.dead) {
        if (bot.team !== this.player.team) {
          const part = hit.object.userData.hitboxPart || 'chest';
          const isHead = part === 'head';
          const mult = isHead ? (wData.headMult || 3.5) : (part === 'legs' ? 0.75 : 1.0);
          const dmg = wData.damage * mult * (bot.armor > 0 ? wData.armorPen : 1.0);

          CS.ui.recordShotHit(wData.id, dmg, isHead, !this._currentShotHitRecorded);
          this._currentShotHitRecorded = true;

          CS.audio.playHitmarker(isHead);
          this.flashHitmarkerUI(isHead);
          this.spawnImpactParticles(hit.point, isHead ? 0xffdd00 : 0xef4444, isHead ? 12 : 7);

          const killed = bot.takeDamage(dmg, this.player, isHead);
          if (killed) {
            this.onEntityKilled(this.player, bot, wData.id, isHead);
          }
        }
      } else {
        // Bullet impact on map wall/crate + persistent 3D bullet hole decal
        this.spawnImpactParticles(hit.point, 0xfacc15, 5);
        this.spawnBulletDecal(hit);
      }
    }

    if (showTracer) {
      const startPt = origin.clone().add(new THREE.Vector3(0.14, -0.1, -0.35).applyEuler(euler));
      this.spawnTracer(startPt, endPt);
    }
  }

  performKnifeHit(wData, isHeavy) {
    CS.ui.recordShotFired('knife');
    const euler = new THREE.Euler(this.player.pitch, this.player.yaw, 0, 'YXZ');
    const dir = new THREE.Vector3(0, 0, -1).applyEuler(euler);
    this.raycaster.set(this.camera.position, dir);
    this.raycaster.far = 3.2;

    const botHitboxes = [];
    for (const b of this.bots) {
      if (!b.dead && b.team !== this.player.team && b.mesh?.userData?.hitboxes) {
        botHitboxes.push(...b.mesh.userData.hitboxes);
      }
    }

    const hits = this.raycaster.intersectObjects(botHitboxes, false);
    if (hits.length > 0) {
      const bot = hits[0].object.userData.bot;
      if (bot) {
        // Check backstab angle
        const botForward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), bot.yaw);
        const isBackstab = dir.dot(botForward) > 0.35;
        const dmg = isBackstab ? wData.backstabDamage : (isHeavy ? wData.heavyDamage : wData.damage);

        CS.ui.recordShotHit('knife', dmg, isBackstab, true);

        CS.audio.playHitmarker(isBackstab);
        this.flashHitmarkerUI(isBackstab);
        this.spawnImpactParticles(hits[0].point, 0xef4444, 10);

        const killed = bot.takeDamage(dmg, this.player, isBackstab);
        if (killed) {
          this.onEntityKilled(this.player, bot, 'knife', isBackstab);
        }
      }
    }
  }

  // ==========================================================================
  // GRENADE THROWING & VOLUMETRIC EFFECTS (HE, FLASH, SMOKE, MOLOTOV)
  // ==========================================================================
  throwGrenade(gType, throwSpeed = 22) {
    const gList = this.player.slots[4];
    const idx = gList.indexOf(gType);
    if (idx === -1) return;
    gList.splice(idx, 1);

    const euler = new THREE.Euler(this.player.pitch, this.player.yaw, 0, 'YXZ');
    const dir = new THREE.Vector3(0, 0.08, -1).normalize().applyEuler(euler);
    const mesh = CS.weaponBuilder.buildGrenadeMesh(gType);
    mesh.scale.set(1.6, 1.6, 1.6);
    mesh.position.copy(this.camera.position).addScaledVector(dir, 0.65);
    this.scene.add(mesh);

    this.activeGrenades.push({
      type: gType,
      mesh,
      position: mesh.position,
      velocity: dir.multiplyScalar(throwSpeed).addScaledVector(this.player.velocity, 0.35),
      fuseTimer: gType === 'molotov' ? 2.5 : 1.75,
      owner: this.player
    });

    CS.audio.announce('Fire in the hole!');
    this.player.fireCooldown = 0.55;

    if (gList.length === 0) {
      this.switchSlot(this.player.slots[1] ? 1 : 2);
    } else {
      this.player.activeGrenadeIdx = 0;
      this.rebuildViewmodel();
      this.updateHUD();
    }
  }

  detonateGrenade(g) {
    this.scene.remove(g.mesh);
    const listenerForward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.yaw);
    CS.audio.playExplosion(g.type, g.position, this.player.position, listenerForward);

    if (g.type === 'he') {
      // High-Explosive Shrapnel & Shockwave
      this.spawnImpactParticles(g.position, 0xff7700, 32, 8.5);
      const radius = 10.5;
      const attacker = g.owner || this.player;
      const isPlayerOwner = attacker === this.player;
      // Damage bots
      for (const b of this.bots) {
        if (b.dead) continue;
        if (!isPlayerOwner && b.team === attacker.team) continue; // Avoid bot friendly-fire
        const d = b.position.distanceTo(g.position);
        if (d < radius) {
          const dmg = (1 - d / radius) * 98;
          if (isPlayerOwner && b.team !== this.player.team) {
            CS.ui.recordDamageOnly(dmg);
            CS.audio.playHitmarker(false);
            this.flashHitmarkerUI(false);
          }
          const killed = b.takeDamage(dmg, attacker, false);
          if (killed) this.onEntityKilled(attacker, b, 'he', false);
        }
      }
      // Damage player if too close
      const pDist = this.player.position.distanceTo(g.position);
      if (pDist < radius) {
        this.damagePlayer((1 - pDist / radius) * 65, isPlayerOwner ? null : attacker, false);
      }
    } else if (g.type === 'flash') {
      this.spawnImpactParticles(g.position, 0xffffff, 20, 6);
      // Blind bots within radius
      for (const b of this.bots) {
        if (b.dead) continue;
        const d = b.position.distanceTo(g.position);
        if (d < 26 && this.hasLineOfSight(g.position, new THREE.Vector3(b.position.x, b.position.y + 1.5, b.position.z))) {
          b.flashedTimer = Math.max(b.flashedTimer, (1 - d / 26) * 4.5);
        }
      }
      // Check if Player is looking toward the Flashbang!
      const pEye = this.camera.position.clone();
      const dPlayer = pEye.distanceTo(g.position);
      if (dPlayer < 28 && this.hasLineOfSight(g.position, pEye)) {
        const toFlash = g.position.clone().sub(pEye).normalize();
        const camForward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(this.player.pitch, this.player.yaw, 0, 'YXZ'));
        const dot = camForward.dot(toFlash); // > 0 means in front of camera
        const angleFactor = dot > 0.15 ? 1.0 : 0.22; // Turning away reduces flash just like CS!
        const flashStrength = Math.min(1.0, (1 - dPlayer / 28) * 1.25 * angleFactor);
        this.player.flashedAlpha = Math.max(this.player.flashedAlpha, flashStrength);
        CS.audio.playFlashRing(flashStrength);
      }
    } else if (g.type === 'smoke') {
      // Spawn 15-second Volumetric Multi-Puff Smoke Cloud
      const cloudGroup = new THREE.Group();
      cloudGroup.position.copy(g.position);
      const smokeMat = new THREE.MeshLambertMaterial({
        color: 0xcbd5e1, transparent: true, opacity: 0.88
      });
      for (let i = 0; i < 14; i++) {
        const r = 1.6 + Math.random() * 1.4;
        const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), smokeMat);
        puff.position.set(
          (Math.random() - 0.5) * 4.8,
          1.1 + Math.random() * 2.2,
          (Math.random() - 0.5) * 4.8
        );
        cloudGroup.add(puff);
      }
      this.scene.add(cloudGroup);
      this.smokeClouds.push({
        mesh: cloudGroup,
        position: g.position.clone(),
        radius: 5.2,
        timer: 15.0
      });
    } else if (g.type === 'molotov') {
      // Spawn 7-second Area-Denial Fire Zone
      const fireGroup = new THREE.Group();
      fireGroup.position.set(g.position.x, g.position.y + 0.05, g.position.z);

      const baseMat = new THREE.MeshBasicMaterial({ color: 0xff4500, transparent: true, opacity: 0.65, side: THREE.DoubleSide });
      const disc = new THREE.Mesh(new THREE.CircleGeometry(4.2, 24), baseMat);
      disc.rotation.x = -Math.PI / 2;
      fireGroup.add(disc);

      const flameMat = new THREE.MeshBasicMaterial({ color: 0xffae00, transparent: true, opacity: 0.85 });
      for (let i = 0; i < 18; i++) {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.35, 6), flameMat);
        const angle = Math.random() * Math.PI * 2;
        const rad = Math.random() * 3.6;
        cone.position.set(Math.cos(angle) * rad, 0.65, Math.sin(angle) * rad);
        fireGroup.add(cone);
      }
      const fireLight = new THREE.PointLight(0xff6600, 1.8, 14);
      fireLight.position.set(g.position.x, g.position.y + 1.5, g.position.z);
      this.scene.add(fireGroup);
      this.scene.add(fireLight);

      this.fireZones.push({
        mesh: fireGroup,
        light: fireLight,
        position: g.position.clone(),
        radius: 4.2,
        timer: 7.0,
        tickTimer: 0.25
      });
    }
  }

  // ==========================================================================
  // C4 BOMB PLANTING & DEFUSING
  // ==========================================================================
  getBombsiteAt(pos) {
    for (const key of ['A', 'B']) {
      const s = CS.mapBuilder.bombsites[key];
      if (!s) continue;
      if (Math.hypot(pos.x - s.x, pos.z - s.z) <= s.radius) {
        return s;
      }
    }
    return null;
  }

  dropC4(pos) {
    if (this.plantedBomb.active || this.roundPhase === 'ended') return;
    if (this.droppedBomb.mesh) {
      this.scene.remove(this.droppedBomb.mesh);
      this.droppedBomb.mesh = null;
    }
    this.droppedBomb.active = true;
    this.droppedBomb.position.set(pos.x, (pos.y || 0) + 0.08, pos.z);

    const c4Mesh = CS.weaponBuilder.buildC4Mesh();
    c4Mesh.scale.set(2.2, 2.2, 2.2);
    c4Mesh.position.copy(this.droppedBomb.position);
    this.scene.add(c4Mesh);
    this.droppedBomb.mesh = c4Mesh;

    if (this.player.team === 'T' && !this.player.dead) {
      CS.ui.showToast('💣 Das C4 wurde fallengelassen! Hebe es auf (auf dem Radar gelb markiert).', 'gold');
    }
    this.bots.forEach(b => {
      if (!b.dead && b.team === 'T') b.pickNextWaypoint(this.plantedBomb);
    });
  }

  plantC4(pos, siteName, planterName) {
    if (this.plantedBomb.active || this.roundPhase === 'ended') return;
    if (this.droppedBomb.mesh) {
      this.scene.remove(this.droppedBomb.mesh);
      this.droppedBomb.mesh = null;
    }
    this.droppedBomb.active = false;

    this.plantedBomb.active = true;
    this.plantedBomb.site = siteName;
    this.plantedBomb.position.set(pos.x, pos.y + 0.08, pos.z);
    this.plantedBomb.timer = this.modeConfig.bombTime || 40;
    this.plantedBomb.beepCooldown = 1.0;

    const c4Mesh = CS.weaponBuilder.buildC4Mesh();
    c4Mesh.scale.set(2.2, 2.2, 2.2);
    c4Mesh.position.copy(this.plantedBomb.position);
    this.scene.add(c4Mesh);
    this.plantedBomb.mesh = c4Mesh;

    this.roundPhase = 'planted';
    if (planterName === CS.ui.profile.playerName) {
      CS.ui.recordMedal('bombsPlanted');
    }
    CS.audio.announce('The bomb has been planted');
    this.showBanner(`⚠️ BOMBE PLATZIERT AUF ${siteName}!`, `${planterName} hat das C4 scharf gemacht (40s Countdown)`);

    // Make all bots re-evaluate path toward the planted bomb!
    this.bots.forEach(b => b.pickNextWaypoint(this.plantedBomb));
  }

  defuseC4(defuserName) {
    if (!this.plantedBomb.active || this.roundPhase === 'ended') return;
    this.plantedBomb.active = false;
    if (this.plantedBomb.mesh) {
      this.scene.remove(this.plantedBomb.mesh);
      this.plantedBomb.mesh = null;
    }
    if (defuserName === CS.ui.profile.playerName) {
      CS.ui.recordMedal('bombsDefused');
    }
    if (this.player.team === 'CT') {
      const defuseCR = Math.round(150 * this.getCreditMultiplier());
      this.player.money = Math.min(16000, this.player.money + 2500);
      CS.ui.addCredits(defuseCR, 'Bombe entschärft Bonus!');
    }
    CS.audio.announce('The bomb has been defused');

    if (this.currentMode === 'bomb') {
      this.endRound('CT', `✂️ Bombe wurde von ${defuserName} entschärft!`);
    } else {
      const defuseCR = Math.round(150 * this.getCreditMultiplier());
      this.roundPhase = 'live';
      this.scores.CT += 5;
      this.showBanner(`✂️ BOMBE ENTSCHÄRFT VON ${defuserName}!`, `+5 Punkte für CT • +$2.500 Match-Geld • +${defuseCR} CR!`);
      this.reassignC4AfterExplosion();
    }
  }

  detonateC4() {
    if (!this.plantedBomb.active || this.roundPhase === 'ended') return;
    const siteName = this.plantedBomb.site;
    const bPos = this.plantedBomb.position.clone();
    this.plantedBomb.active = false;
    if (this.plantedBomb.mesh) {
      this.scene.remove(this.plantedBomb.mesh);
      this.plantedBomb.mesh = null;
    }
    CS.audio.playExplosion('c4');
    this.spawnImpactParticles(bPos, 0xff5500, 65, 18);

    const detonateCR = Math.round(150 * this.getCreditMultiplier());
    if (this.currentMode === 'bomb') {
      // Massive blast radius at the bombsite; suppress intermediate team-wipe check because the bomb explosion itself wins the round for T!
      this._suppressWinCheck = true;
      if (!this.player.dead && this.player.position.distanceTo(bPos) < 26) {
        this.damagePlayer(250, null, false);
      }
      for (const b of this.bots) {
        if (!b.dead && b.position.distanceTo(bPos) < 26) {
          b.takeDamage(250, null, false);
        }
      }
      this._suppressWinCheck = false;

      if (this.player.team === 'T') {
        this.player.money = Math.min(16000, this.player.money + 2500);
        CS.ui.addCredits(detonateCR, 'C4 Detonation Bonus!');
      }
      this.endRound('T', `💥 Bombenplatz ${siteName} wurde durch das C4 gesprengt!`);
    } else {
      this.roundPhase = 'live';
      if (this.player.position.distanceTo(bPos) < 26) {
        this.damagePlayer(250, null, false);
      }
      for (const b of this.bots) {
        if (!b.dead && b.position.distanceTo(bPos) < 26) {
          b.takeDamage(250, null, false);
        }
      }
      this.scores.T += 5;
      this.player.money = Math.min(16000, this.player.money + 2500);
      CS.ui.addCredits(detonateCR, 'C4 Detonation Bonus!');
      this.showBanner(`💥 BOMBENPLATZ ${siteName} GESPRENGT!`, `+5 Punkte für Terroristen • +$2.500 Match-Geld • +${detonateCR} CR!`);
      this.reassignC4AfterExplosion();
    }
  }

  reassignC4AfterExplosion() {
    if (this.player.team === 'T') {
      this.player.slots[5] = { id: 'c4' };
    } else {
      const tBot = this.bots.find(b => b.team === 'T');
      if (tBot) tBot.hasC4 = true;
    }
  }

  getTeamAliveCounts() {
    let ctAlive = (this.player.team === 'CT' && !this.player.dead) ? 1 : 0;
    let tAlive = (this.player.team === 'T' && !this.player.dead) ? 1 : 0;
    for (const b of this.bots) {
      if (!b.dead) {
        if (b.team === 'CT') ctAlive++;
        else if (b.team === 'T') tAlive++;
      }
    }
    return { ctAlive, tAlive };
  }

  checkRoundWinConditions() {
    if (this.currentMode !== 'bomb' || this.roundPhase === 'ended' || this._suppressWinCheck) return;

    const { ctAlive, tAlive } = this.getTeamAliveCounts();

    // 1. If all Counter-Terrorists are dead -> Terrorists win immediately!
    // (Even if the bomb is planted or not planted, no CT is alive to defend or defuse)
    if (ctAlive <= 0) {
      this.endRound('T', 'Alle Counter-Terrorists wurden eliminiert!');
      return;
    }

    // 2. If all Terrorists are dead:
    if (tAlive <= 0) {
      // IMPORTANT: If the C4 bomb is ALREADY planted, the round does NOT end yet!
      // Surviving CTs must still defuse the planted bomb before it explodes!
      if (!this.plantedBomb.active) {
        this.endRound('CT', 'Alle Terroristen wurden eliminiert!');
        return;
      } else if (!this._allTsDeadPlantedNotified) {
        this._allTsDeadPlantedNotified = true;
        this.showBanner('⚠️ ALLE TERRORISTEN ELIMINIERT!', `Die Bombe auf ${this.plantedBomb.site} tickt weiter — entschärfe sie rechtzeitig!`);
      }
    }
  }

  // ==========================================================================
  // KILL REWARDS, ECONOMY & BUY SYSTEM
  // ==========================================================================
  onEntityKilled(killer, victim, weaponId, isHeadshot) {
    const isPlayerKiller = killer === this.player;
    const isPlayerVictim = victim === this.player;

    const killerName = isPlayerKiller ? CS.ui.profile.playerName : (killer ? `BOT ${killer.name}` : 'Explosion');
    const victimName = isPlayerVictim ? CS.ui.profile.playerName : `BOT ${victim.name}`;

    CS.ui.addKillfeedEntry(killerName, killer ? killer.team : victim.team, victimName, victim.team, weaponId, isHeadshot);

    if (isPlayerVictim) {
      CS.ui.recordDeath();
    }

    if (killer) {
      killer.kills++;
      if (this.currentMode !== 'bomb') {
        this.scores[killer.team] = (this.scores[killer.team] || 0) + 1;
      }
      const wReward = CS.WEAPONS[weaponId]?.killReward || 300;
      killer.money = Math.min(16000, (killer.money || 0) + wReward);

      if (isPlayerKiller && !isPlayerVictim) {
        const baseKillCR = isHeadshot ? 75 : 50;
        const crBonus = Math.max(5, Math.round(baseKillCR * this.getCreditMultiplier()));
        const xpBonus = Math.max(10, Math.round(40 * this.getXPMultiplier()));
        const diffData = this.getDifficultyData();
        CS.ui.addCredits(crBonus, `${isHeadshot ? '🎯 Kopfschuss-Kill!' : 'Gegner eliminiert'} (${diffData.name})`);
        CS.ui.addXP(xpBonus);

        // Track Round Kills & Multi-Kill Streaks (First Blood, Double Kill -> ACE!)
        this.handlePlayerKillStreak(isHeadshot);
        CS.ui.recordKill(weaponId, isHeadshot, this.player.roundKills || 1);
      }

      // Arms Race Weapon Upgrade
      if (this.currentMode === 'armsrace') {
        killer.armsRaceIndex = (killer.armsRaceIndex || 0) + 1;
        const prog = CS.MODES.armsrace.progression;
        if (killer.armsRaceIndex >= prog.length) {
          this.endRound(killer.team, `${killerName} hat das Waffenspiel mit dem Goldenen Messer gewonnen!`);
          return;
        }
        if (isPlayerKiller) {
          this.equipArmsRaceWeapon();
        } else {
          killer.buyEquipmentForRound('armsrace');
        }
      }
    }

    if (!isPlayerVictim && victim) {
      victim.respawnTimer = this.modeConfig.respawnDelay || 2.5;
      if (victim.hasC4) {
        victim.hasC4 = false;
        this.dropC4(victim.position);
      }
      // Killed bots drop their equipped firearm (including rare skins!) so players can loot it with [E]
      if (this.currentMode !== 'armsrace' && victim.weaponId && victim.weaponId !== 'knife') {
        this.spawnDroppedWeapon(victim.weaponId, victim.skinId || 'default', victim.position);
      }
    }

    // Track 1vX Clutch situation in Bomb mode when player is the last living teammate
    if (this.currentMode === 'bomb' && !this.player.dead) {
      const alliesAlive = this.bots.filter(b => !b.dead && b.team === this.player.team).length;
      const enemiesAlive = this.bots.filter(b => !b.dead && b.team !== this.player.team).length;
      if (alliesAlive === 0 && enemiesAlive >= 2) {
        if ((this.player.clutchSituation || 0) < enemiesAlive) {
          this.player.clutchSituation = enemiesAlive;
          CS.ui.showToast(`🔥 1v${enemiesAlive} CLUTCH-SITUATION! Du bist der letzte Überlebende deines Teams!`, 'gold');
        }
      }
    }

    this.updateHUD();
    this.checkRoundWinConditions();
  }

  equipArmsRaceWeapon() {
    const prog = CS.MODES.armsrace.progression;
    const wId = prog[Math.min(this.player.armsRaceIndex, prog.length - 1)];
    const wData = CS.WEAPONS[wId];
    if (wId === 'knife') {
      this.player.slots[1] = null;
      this.player.slots[2] = null;
      this.switchSlot(3);
      CS.ui.showToast('🏆 GOLDENES MESSER ERREICHT! Mache den letzten Kill für den Sieg!', 'gold');
    } else if (wData.slot === 2) {
      this.player.slots[1] = null;
      this.player.slots[2] = { id: wId, mag: wData.magSize, reserve: wData.reserveAmmo, burstMode: false, silenced: !!wData.silenced };
      this.switchSlot(2);
    } else {
      this.player.slots[1] = { id: wId, mag: wData.magSize, reserve: wData.reserveAmmo, burstMode: false, silenced: !!wData.silenced };
      this.switchSlot(1);
    }
  }

  damagePlayer(amount, attacker, isHeadshot) {
    if (this.player.dead || this.roundPhase === 'ended') return;
    // Block all damage while Spawn Shield is active!
    if (this.player.spawnShieldTimer > 0) {
      const shieldVig = document.getElementById('spawn-shield-vignette');
      if (shieldVig) {
        shieldVig.style.opacity = '0.95';
        setTimeout(() => {
          if (this.player.spawnShieldTimer > 0) shieldVig.style.opacity = '0.55';
          else shieldVig.style.opacity = '0';
        }, 180);
      }
      return;
    }
    let dmg = Math.round(amount);
    if (this.player.armor > 0) {
      const absorbed = Math.min(this.player.armor, Math.round(dmg * 0.35));
      this.player.armor -= absorbed;
      dmg -= Math.round(absorbed * 0.5);
    }
    this.player.health = Math.max(0, this.player.health - Math.max(1, dmg));

    // Flash red damage vignette & Directional Damage Indicator Arc
    const vig = document.getElementById('damage-vignette');
    if (vig) {
      vig.style.opacity = '0.75';
      setTimeout(() => { vig.style.opacity = '0'; }, 240);
    }
    if (attacker && attacker.position) {
      this.spawnDamageIndicator(attacker.position);
    }

    if (this.player.health <= 0) {
      this.player.dead = true;
      this.player.deaths++;
      this.player.deathAnimTimer = 0;
      this.player.deathRollDir = Math.random() > 0.5 ? 1 : -1;
      this.player.killerPos = (attacker && attacker.position) ? attacker.position.clone() : null;
      this.player.reloading = false;
      this.player.plantingProgress = 0;
      this.player.defusingProgress = 0;
      this.mouseDownLeft = false;
      this.setScope(-1);
      document.getElementById('interaction-prompt')?.classList.add('hidden');
      document.getElementById('action-progress-wrap')?.classList.add('hidden');

      // If the player was carrying the C4, drop it on the ground so surviving Terrorists can still plant it!
      if (this.player.slots[5]) {
        this.player.slots[5] = null;
        this.dropC4(this.player.position);
      }

      this.player.respawnTimer = this.modeConfig.respawnDelay || 2.8;
      CS.audio.playDeathSound(isHeadshot);

      const killerWepId = attacker?.weaponId || 'ak47';
      const killerSkinId = attacker?.skinId || 'default';
      this.showDeathOverlay(attacker, killerWepId, killerSkinId, isHeadshot);
      this.onEntityKilled(attacker, this.player, killerWepId, isHeadshot);
    }
    this.updateHUD();
  }

  showDeathOverlay(attacker, weaponId, skinId = 'default', isHeadshot = false) {
    const overlay = document.getElementById('death-screen-overlay');
    if (!overlay) return;
    const killerNameEl = document.getElementById('death-killer-name');
    const wepLabelEl = document.getElementById('death-weapon-label');
    const wepImgEl = document.getElementById('death-weapon-img');

    const killerName = attacker ? (attacker.name || 'Feindlicher Agent') : 'Umgebung / Explosion';
    const wData = CS.WEAPONS[weaponId] || CS.WEAPONS.ak47;
    const sData = CS.SKINS[skinId] || CS.SKINS.default;

    if (killerNameEl) killerNameEl.textContent = killerName;
    if (wepLabelEl) {
      const hsBadge = isHeadshot ? ' • 🎯 KOPFSCHUSS' : '';
      wepLabelEl.textContent = `${wData.name} | ${sData.name}${hsBadge}`;
    }
    if (wepImgEl && CS.textures) {
      wepImgEl.src = CS.textures.getCosmeticPreviewDataURL('skin', skinId, wData.id === 'knife' ? 'ak47' : wData.id);
    }
    overlay.classList.remove('hidden');
  }

  toggleBuyMenu(forceState = null) {
    if (this.currentMode === 'armsrace') {
      CS.ui.showToast('Im Waffenspiel werden Waffen automatisch pro Kill gewechselt!', 'info');
      return;
    }
    const next = forceState !== null ? forceState : !this.buyMenuOpen;
    this.buyMenuOpen = next;
    const overlay = document.getElementById('buy-menu-overlay');
    if (next) {
      if (document.pointerLockElement) {
        try { document.exitPointerLock(); } catch (e) {}
      }
      CS.ui.renderBuyMenu(this);
      overlay?.classList.remove('hidden');
    } else {
      overlay?.classList.add('hidden');
      this.safeRequestPointerLock();
    }
  }

  togglePauseMenu(forceState = null) {
    const next = forceState !== null ? forceState : !this.paused;
    this.paused = next;
    const overlay = document.getElementById('pause-overlay');
    if (next) {
      if (document.pointerLockElement) {
        try { document.exitPointerLock(); } catch (e) {}
      }
      overlay?.classList.remove('hidden');
    } else {
      overlay?.classList.add('hidden');
      this.safeRequestPointerLock();
    }
  }

  buyWeapon(weaponId) {
    const w = CS.WEAPONS[weaponId];
    if (!w) return;
    if (this.player.money < w.price) {
      CS.ui.showToast(`Nicht genug Match-Geld ($${w.price} benötigt)!`, 'error');
      return;
    }

    if (w.isGrenade) {
      if (this.player.slots[4].length >= 4) {
        CS.ui.showToast('Maximal 4 Granaten gleichzeitig tragbar!', 'error');
        return;
      }
      this.player.money -= w.price;
      this.player.slots[4].push(w.id);
      CS.audio.playUISound('buy');
      this.updateHUD();
      return;
    }

    const existing = this.player.slots[w.slot];
    if (existing && existing.id === w.id && existing.mag === w.magSize && existing.reserve === w.reserveAmmo) {
      CS.ui.showToast(`${w.name} ist bereits ausgerüstet und voll geladen!`, 'info');
      return;
    }

    this.player.money -= w.price;
    this.player.slots[w.slot] = {
      id: w.id,
      mag: w.magSize,
      reserve: w.reserveAmmo,
      burstMode: false,
      silenced: !!w.silenced
    };
    CS.audio.playUISound('buy');
    this.switchSlot(w.slot);
  }

  buySpecialGear(gearType) {
    if (gearType === 'kevlar') {
      if (this.player.armor >= 100) return CS.ui.showToast('Kevlar-Weste ist bereits bei 100%!', 'info');
      if (this.player.money < 650) return CS.ui.showToast('Nicht genug Geld ($650)!', 'error');
      this.player.money -= 650;
      this.player.armor = 100;
    } else if (gearType === 'helmet') {
      if (this.player.armor >= 100 && this.player.hasHelmet) return CS.ui.showToast('Kevlar + Helm bereits vollständig ausgerüstet!', 'info');
      if (this.player.money < 1000) return CS.ui.showToast('Nicht genug Geld ($1000)!', 'error');
      this.player.money -= 1000;
      this.player.armor = 100;
      this.player.hasHelmet = true;
    } else if (gearType === 'defuse') {
      if (this.player.hasDefuseKit) return CS.ui.showToast('Entschärfungskit bereits im Inventar!', 'info');
      if (this.player.money < 400) return CS.ui.showToast('Nicht genug Geld ($400)!', 'error');
      this.player.money -= 400;
      this.player.hasDefuseKit = true;
    }
    CS.audio.playUISound('buy');
    this.updateHUD();
  }

  spawnDroppedWeapon(weaponId, skinId = 'default', basePos, customItemData = null, throwForwardVec = null) {
    const wData = CS.WEAPONS[weaponId];
    if (!wData || (wData.slot !== 1 && wData.slot !== 2)) return null;

    // Limit total dropped weapons on the ground to keep scene clean
    if (this.droppedItems.length >= 16) {
      const oldest = this.droppedItems.shift();
      if (oldest && oldest.mesh) this.scene.remove(oldest.mesh);
    }

    const wrap = new THREE.Group();
    const gunMesh = CS.weaponBuilder.buildWeaponModel(weaponId, skinId, 'knife_default', 'gloves_default', 'sas_navy', false);
    gunMesh.scale.set(1.42, 1.42, 1.42);
    gunMesh.rotation.z = Math.PI / 2;
    gunMesh.position.y = 0.16;
    wrap.add(gunMesh);

    // Subtle rarity highlight ring underneath the dropped weapon
    const sObj = CS.SKINS[skinId] || CS.SKINS.default;
    const rarColor = CS.RARITIES[sObj.rarity]?.color || '#38bdf8';
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.32, 0.42, 20),
      new THREE.MeshBasicMaterial({ color: rarColor, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.03;
    wrap.add(ring);

    const dropPos = basePos.clone();
    if (throwForwardVec) {
      dropPos.addScaledVector(throwForwardVec, 1.55);
    } else {
      dropPos.x += (Math.random() - 0.5) * 0.7;
      dropPos.z += (Math.random() - 0.5) * 0.7;
    }
    wrap.position.set(dropPos.x, dropPos.y || 0, dropPos.z);
    wrap.rotation.y = Math.random() * Math.PI * 2;
    this.scene.add(wrap);

    const itemData = customItemData
      ? { ...customItemData, skinId }
      : {
          id: weaponId,
          mag: wData.magSize,
          reserve: wData.reserveAmmo,
          burstMode: false,
          silenced: !!wData.silenced,
          skinId
        };

    const entry = {
      slot: wData.slot,
      weaponId,
      skinId,
      itemData,
      mesh: wrap,
      position: wrap.position
    };
    this.droppedItems.push(entry);
    return entry;
  }

  dropCurrentWeapon() {
    const s = this.player.activeSlot;
    if (s === 5 && this.player.slots[5]) {
      this.player.slots[5] = null;
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.yaw);
      const dropPos = this.player.position.clone().addScaledVector(forward, 1.4);
      this.dropC4(dropPos);
      this.switchSlot(this.player.slots[1] ? 1 : (this.player.slots[2] ? 2 : 3));
      return;
    }
    if (s !== 1 && s !== 2) return;
    const item = this.player.slots[s];
    if (!item) return;

    const skinId = item.skinId || CS.ui.profile.weaponSkins[item.id] || 'default';
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.yaw);
    this.spawnDroppedWeapon(item.id, skinId, this.player.position, item, forward);

    this.player.slots[s] = null;
    this.switchSlot(this.player.slots[1] ? 1 : (this.player.slots[2] ? 2 : 3));
  }

  sendRadioCommand(cmdType) {
    const livingAllies = this.bots.filter(b => !b.dead && b.team === this.player.team);
    const responder = livingAllies.length > 0 ? livingAllies[Math.floor(Math.random() * livingAllies.length)] : null;

    if (cmdType === 'rush') {
      // Determine target bombsite: planted bomb site, or whichever site (A/B) the player is looking toward
      let targetSite = 'A';
      if (this.plantedBomb && this.plantedBomb.active) {
        targetSite = this.plantedBomb.site.includes('B') ? 'B' : 'A';
      } else {
        const siteA = CS.mapBuilder.bombsites?.A;
        const siteB = CS.mapBuilder.bombsites?.B;
        if (siteA && siteB) {
          const forward = new THREE.Vector3(-Math.sin(this.player.yaw), 0, -Math.cos(this.player.yaw));
          const toA = new THREE.Vector3(siteA.x - this.player.position.x, 0, siteA.z - this.player.position.z).normalize();
          const toB = new THREE.Vector3(siteB.x - this.player.position.x, 0, siteB.z - this.player.position.z).normalize();
          targetSite = forward.dot(toB) > forward.dot(toA) ? 'B' : 'A';
        }
      }

      CS.audio.announce(`Rush Bombsite ${targetSite}!`);
      this.activeSquadOrder = { label: `⚡ RUSH BOMBSITE ${targetSite}`, timer: 25 };
      livingAllies.forEach(b => {
        b.tacticalOrder = { type: 'rush', siteKey: targetSite, timer: 25 };
        b.currentNavNode = null;
        b.pickNextWaypoint(this.plantedBomb);
      });

      const reply = responder ? ` • 🤖 BOT ${responder.name}: "Verstanden! Stürme Spot ${targetSite}!"` : '';
      CS.ui.showToast(`📻 [Z] FUNK: "Alle Mann auf Bombenplatz ${targetSite}!"${reply}`, 'gold');
    } else if (cmdType === 'follow') {
      CS.audio.announce('Need backup! Follow me!');
      this.activeSquadOrder = { label: '🛡️ ESKORTE (FOLGT MIR)', timer: 25 };
      livingAllies.forEach((b, idx) => {
        const angle = (idx / Math.max(1, livingAllies.length)) * Math.PI * 2;
        b.tacticalOrder = {
          type: 'follow',
          offsetX: Math.cos(angle) * 2.6,
          offsetZ: Math.sin(angle) * 2.6,
          timer: 25
        };
        b.currentNavNode = null;
        b.pickNextWaypoint(this.plantedBomb);
      });

      const reply = responder ? ` • 🤖 BOT ${responder.name}: "Bin unterwegs! Gebe dir Rückendeckung!"` : '';
      CS.ui.showToast(`📻 [X] FUNK: "Brauche Rückendeckung! Folgt mir!"${reply}`, 'info');
    } else if (cmdType === 'hold') {
      CS.audio.announce('Hold this position!');
      this.activeSquadOrder = { label: '⚓ POSITION HALTEN & SICHERN', timer: 22 };
      livingAllies.forEach(b => {
        b.tacticalOrder = {
          type: 'hold',
          pos: b.position.clone(),
          timer: 22
        };
      });

      const reply = responder ? ` • 🤖 BOT ${responder.name}: "Roger! Halte und sichere diesen Sektor!"` : '';
      CS.ui.showToast(`📻 [V] FUNK: "Position halten & Winkel abdecken!"${reply}`, 'info');
    }
    this.updateHUD();
  }

  handlePlayerKillStreak(isHeadshot = false) {
    const nowSec = performance.now() * 0.001;
    this.player.roundKills = (this.player.roundKills || 0) + 1;

    if (this.currentMode === 'bomb') {
      this.player.multiKillCount = this.player.roundKills;
    } else {
      if (nowSec - (this.player.lastKillTime || 0) <= 8.5) {
        this.player.multiKillCount = (this.player.multiKillCount || 0) + 1;
      } else {
        this.player.multiKillCount = 1;
      }
    }
    this.player.lastKillTime = nowSec;

    const streak = this.player.multiKillCount;

    // 1. First Blood Check (First kill of the round!)
    if (!this.roundFirstBloodAwarded) {
      this.roundFirstBloodAwarded = true;
      CS.ui.recordMedal('firstBloods');
      const fbBonus = Math.max(10, Math.round(25 * this.getCreditMultiplier()));
      CS.ui.addCredits(fbBonus, '🩸 First Blood Bonus!');
      if (streak === 1) {
        CS.audio.playKillStreakSound(1);
        this.showMultiKillBanner('🩸🎯', 'FIRST BLOOD!', `+${fbBonus} CR ERSTER ABSCHUSS`, false);
        return;
      }
    }

    // 2. Multi-Kill Medals (Double Kill -> Triple Kill -> Ultra Kill -> ACE!)
    if (streak === 2) {
      CS.ui.recordMedal('doubleKills');
      const bonus = Math.round(25 * this.getCreditMultiplier());
      CS.ui.addCredits(bonus, '⚡ Double Kill Bonus!');
      CS.audio.playKillStreakSound(2);
      CS.audio.announce('Double Kill');
      this.showMultiKillBanner('💀💀', '⚡ DOUBLE KILL!', `+${bonus} BONUS CREDITS`, false);
    } else if (streak === 3) {
      CS.ui.recordMedal('tripleKills');
      const bonus = Math.round(50 * this.getCreditMultiplier());
      CS.ui.addCredits(bonus, '🔥 Triple Kill Bonus!');
      CS.audio.playKillStreakSound(3);
      CS.audio.announce('Triple Kill');
      this.showMultiKillBanner('💀💀💀', '🔥 TRIPLE KILL!', `+${bonus} BONUS CREDITS`, false);
    } else if (streak === 4) {
      CS.ui.recordMedal('ultraKills');
      const bonus = Math.round(85 * this.getCreditMultiplier());
      CS.ui.addCredits(bonus, '💀 Ultra Kill Bonus!');
      CS.audio.playKillStreakSound(4);
      CS.audio.announce('Ultra Kill');
      this.showMultiKillBanner('💀💀💀💀', '💥 ULTRA KILL!', `+${bonus} BONUS CREDITS`, false);
    } else if (streak >= 5) {
      CS.ui.recordMedal('aces');
      const bonus = Math.round(150 * this.getCreditMultiplier());
      CS.ui.addCredits(bonus, '👑 ★ A C E ★ Bonus!');
      CS.audio.playKillStreakSound(5);
      CS.audio.announce('Ace! Entire enemy team eliminated!');
      this.showMultiKillBanner('👑💀💀💀💀💀👑', '★ A C E ! ★ (TEAM WIPE)', `+${bonus} LEGENDÄRER ACE-BONUS CR!`, true);
    }
  }

  showMultiKillBanner(skullsText, titleText, subText, isAce = false) {
    const banner = document.getElementById('multikill-banner');
    const skullsEl = document.getElementById('multikill-skulls');
    const titleEl = document.getElementById('multikill-title');
    const subEl = document.getElementById('multikill-sub');
    if (!banner) return;

    if (skullsEl) skullsEl.textContent = skullsText;
    if (titleEl) titleEl.textContent = titleText;
    if (subEl) subEl.textContent = subText;
    banner.classList.toggle('ace-banner', !!isAce);
    banner.classList.remove('hidden');

    // Restart pop animation cleanly
    banner.style.animation = 'none';
    void banner.offsetWidth;
    banner.style.animation = '';

    clearTimeout(this._mkBannerTimeout);
    this._mkBannerTimeout = setTimeout(() => {
      banner.classList.add('hidden');
    }, isAce ? 4200 : 2700);
  }

  getBulletDecalMaterial() {
    if (this._bulletDecalMat) return this._bulletDecalMat;
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext('2d');

    // Outer scorched powder ring
    const grad = ctx.createRadialGradient(32, 32, 3, 32, 32, 26);
    grad.addColorStop(0, 'rgba(8, 10, 14, 0.96)');
    grad.addColorStop(0.38, 'rgba(22, 25, 32, 0.85)');
    grad.addColorStop(0.7, 'rgba(55, 60, 70, 0.35)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(32, 32, 26, 0, Math.PI * 2);
    ctx.fill();

    // Radial impact cracks
    ctx.strokeStyle = 'rgba(15, 18, 24, 0.78)';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.3;
      ctx.beginPath();
      ctx.moveTo(32 + Math.cos(a) * 5, 32 + Math.sin(a) * 5);
      ctx.lineTo(32 + Math.cos(a + 0.12) * 23, 32 + Math.sin(a - 0.1) * 23);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(c);
    this._bulletDecalMat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2
    });
    return this._bulletDecalMat;
  }

  spawnBulletDecal(hit) {
    if (!hit || !hit.face || !hit.object) return;
    const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
    const decalGeo = new THREE.PlaneGeometry(0.17, 0.17);
    const decalMesh = new THREE.Mesh(decalGeo, this.getBulletDecalMaterial());

    decalMesh.position.copy(hit.point).addScaledVector(normal, 0.012);
    const lookTarget = decalMesh.position.clone().add(normal);
    decalMesh.lookAt(lookTarget);
    decalMesh.rotateZ(Math.random() * Math.PI * 2);

    this.scene.add(decalMesh);
    this.bulletDecals.push({ mesh: decalMesh });

    if (this.bulletDecals.length > 65) {
      const oldest = this.bulletDecals.shift();
      if (oldest && oldest.mesh) this.scene.remove(oldest.mesh);
    }
  }

  spawnShellCasing(wData) {
    if (!this.camera || !wData || wData.id === 'knife') return;
    const isShotgun = wData.pellets && wData.pellets > 1;
    const shellMat = new THREE.MeshStandardMaterial({
      color: isShotgun ? 0xdc2626 : 0xfbbf24,
      metalness: isShotgun ? 0.3 : 0.88,
      roughness: 0.25
    });
    const shellGeo = new THREE.CylinderGeometry(0.011, 0.011, isShotgun ? 0.055 : 0.042, 6);
    const mesh = new THREE.Mesh(shellGeo, shellMat);

    const euler = new THREE.Euler(this.player.pitch, this.player.yaw, 0, 'YXZ');
    const ejectOffset = new THREE.Vector3(0.22, -0.11, -0.32).applyEuler(euler);
    mesh.position.copy(this.camera.position).add(ejectOffset);
    mesh.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    this.scene.add(mesh);

    const rightDir = new THREE.Vector3(1, 0.45 + Math.random() * 0.25, 0.15).normalize().applyEuler(euler);
    const speed = 2.6 + Math.random() * 1.1;

    this.shellCasings.push({
      mesh,
      vel: rightDir.multiplyScalar(speed).addScaledVector(this.player.velocity, 0.4),
      bounced: false,
      timer: 2.2
    });

    if (this.shellCasings.length > 25) {
      const oldest = this.shellCasings.shift();
      if (oldest && oldest.mesh) this.scene.remove(oldest.mesh);
    }
  }

  spawnDamageIndicator(sourcePos) {
    const container = document.getElementById('damage-indicator-container');
    if (!container || !sourcePos) return;

    const arcEl = document.createElement('div');
    arcEl.className = 'damage-arc';
    container.appendChild(arcEl);

    const entry = {
      el: arcEl,
      sourcePos: sourcePos.clone(),
      timer: 1.5,
      maxTimer: 1.5
    };
    this.damageIndicators.push(entry);
    this.updateSingleDamageIndicator(entry);
  }

  updateSingleDamageIndicator(ind) {
    const dx = ind.sourcePos.x - this.player.position.x;
    const dz = ind.sourcePos.z - this.player.position.z;
    // Player looks toward (-sin(yaw), -cos(yaw))
    const targetYaw = Math.atan2(-dx, -dz);
    const relAngle = this.player.yaw - targetYaw;
    const alpha = Math.max(0, Math.min(1, ind.timer / ind.maxTimer));
    ind.el.style.transform = `rotate(${relAngle.toFixed(3)}rad)`;
    ind.el.style.opacity = alpha.toFixed(2);
  }

  updateDamageIndicators(dt) {
    for (let i = this.damageIndicators.length - 1; i >= 0; i--) {
      const ind = this.damageIndicators[i];
      ind.timer -= dt;
      if (ind.timer <= 0) {
        ind.el.remove();
        this.damageIndicators.splice(i, 1);
      } else {
        this.updateSingleDamageIndicator(ind);
      }
    }
  }

  clearDamageIndicators() {
    if (this.damageIndicators) {
      this.damageIndicators.forEach(ind => ind.el?.remove());
    }
    this.damageIndicators = [];
    const container = document.getElementById('damage-indicator-container');
    if (container) container.innerHTML = '';
  }

  // ==========================================================================
  // LINE OF SIGHT, TRACERS & PARTICLES
  // ==========================================================================
  hasLineOfSight(p1, p2) {
    const dir = p2.clone().sub(p1);
    const dist = dir.length();
    if (dist < 0.2) return true;
    dir.normalize();

    // Check active Smoke Clouds first!
    for (const sc of this.smokeClouds) {
      const toCenter = sc.position.clone().sub(p1);
      const proj = toCenter.dot(dir);
      if (proj > 0 && proj < dist) {
        const closestPt = p1.clone().addScaledVector(dir, proj);
        if (closestPt.distanceTo(sc.position) < sc.radius) {
          return false; // Smoke blocks sightline!
        }
      }
    }

    this.raycaster.set(p1, dir);
    this.raycaster.far = dist - 0.2;
    const hits = this.raycaster.intersectObjects(CS.mapBuilder.raycastMeshes, false);
    return hits.length === 0;
  }

  spawnTracer(start, end) {
    const mat = new THREE.LineBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.85 });
    const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.tracers.push({ mesh: line, timer: 0.065 });
  }

  spawnImpactParticles(pos, colorHex = 0xfacc15, count = 8, speedScale = 3.5) {
    const mat = new THREE.MeshBasicMaterial({ color: colorHex });
    const geo = new THREE.BoxGeometry(0.055, 0.055, 0.055);
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(geo, mat);
      m.position.copy(pos);
      this.scene.add(m);
      this.particles.push({
        mesh: m,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * speedScale,
          Math.random() * speedScale,
          (Math.random() - 0.5) * speedScale
        ),
        timer: 0.35 + Math.random() * 0.25
      });
    }
  }

  flashHitmarkerUI(isHeadshot) {
    const hm = document.getElementById('hitmarker');
    if (!hm) return;
    hm.classList.remove('hidden', 'headshot');
    if (isHeadshot) hm.classList.add('headshot');
    clearTimeout(this._hmTimeout);
    this._hmTimeout = setTimeout(() => hm.classList.add('hidden'), 140);
  }

  showBanner(title, subtitle) {
    const banner = document.getElementById('round-banner');
    if (!banner) return;
    document.getElementById('banner-title').textContent = title;
    document.getElementById('banner-sub').textContent = subtitle;
    banner.classList.remove('hidden');
    clearTimeout(this._bannerTimeout);
    this._bannerTimeout = setTimeout(() => banner.classList.add('hidden'), 3600);
  }

  // ==========================================================================
  // MAIN GAME UPDATE & PHYSICS LOOP
  // ==========================================================================
  loop(now) {
    requestAnimationFrame((t) => this.loop(t));
    const dt = Math.min(0.05, (now - this.lastFrameTime) / 1000);
    this.lastFrameTime = now;

    if (!this.running || this.paused) return;

    this.updateMatchTimers(dt);
    this.updatePlayer(dt);
    this.updateBots(dt);
    this.updateWorldEntities(dt);
    CS.mapBuilder.updateEnvironment(dt, now * 0.001);
    this.updateViewmodelAnimations(dt);
    this.updateHUD();

    // Render 3D World + First-Person Viewmodel Overlay
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    this.renderer.clearDepth();
    this.renderer.render(this.vmScene, this.vmCamera);

    // Render Live 2D Tactical Radar
    const radarCanvas = document.getElementById('radar-canvas');
    if (radarCanvas) {
      CS.mapBuilder.renderRadar(
        radarCanvas.getContext('2d'),
        radarCanvas.width,
        radarCanvas.height,
        this.player,
        this.bots,
        this.plantedBomb,
        this.droppedBomb
      );
    }
  }

  updateMatchTimers(dt) {
    if (this.roundPhase === 'ended') return;

    if (this.buyZoneTimer > 0) this.buyZoneTimer -= dt;

    // 5-Minute Master Round Timer (frozen once the bomb is planted so the 40s C4 timer governs the round!)
    if (!this.plantedBomb.active) {
      this.phaseTimer -= dt;
    }

    // Planted C4 Fuse Timer
    if (this.plantedBomb.active) {
      this.plantedBomb.timer -= dt;
      this.plantedBomb.beepCooldown -= dt;
      if (this.plantedBomb.beepCooldown <= 0) {
        const ratio = Math.max(0.05, this.plantedBomb.timer / 40);
        this.plantedBomb.beepCooldown = Math.max(0.11, ratio * 0.95);
        const listenerForward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.yaw);
        CS.audio.playBombBeep(1 + (1 - ratio) * 0.45, this.plantedBomb.position, this.player.position, listenerForward);
      }
      if (this.plantedBomb.timer <= 0) {
        this.detonateC4();
        return;
      }
    }

    this.checkRoundWinConditions();
    if (this.roundPhase === 'ended') return;

    // When the master round timer finishes (and bomb is NOT planted):
    if (this.phaseTimer <= 0 && !this.plantedBomb.active) {
      if (this.currentMode === 'bomb') {
        this.endRound('CT', 'Rundenzeit abgelaufen — Bombenplätze erfolgreich verteidigt!');
      } else {
        const winner = this.scores.CT >= this.scores.T ? 'CT' : 'T';
        this.endRound(winner, '5-Minuten-Rundenzeit abgelaufen!');
      }
    }
  }

  getSafePlayerSpawn() {
    const teamList = CS.mapBuilder.spawns[this.player.team] || [];
    const dmList = (this.modeConfig.respawn && CS.mapBuilder.spawns.DM) ? CS.mapBuilder.spawns.DM : [];
    const spList = [...teamList, ...dmList];
    if (spList.length === 0) return { x: 0, y: 0, z: -62, rotY: Math.PI };

    // Score each candidate spawn point by its minimum distance to any living enemy bot
    const scored = spList.map(sp => {
      let minDistToEnemy = 999;
      for (const b of this.bots) {
        if (!b.dead && b.team !== this.player.team) {
          const d = Math.hypot(sp.x - b.position.x, sp.z - b.position.z);
          if (d < minDistToEnemy) minDistToEnemy = d;
        }
      }
      return { sp, minDistToEnemy };
    });

    // Sort safest first and pick randomly among the top 5 safest spawn points for variety!
    scored.sort((a, b) => b.minDistToEnemy - a.minDistToEnemy);
    const topCandidates = scored.slice(0, Math.min(5, scored.length));
    return topCandidates[Math.floor(Math.random() * topCandidates.length)].sp;
  }

  getSpectatableBots() {
    const allies = this.bots.filter(b => !b.dead && b.team === this.player.team);
    if (allies.length > 0) return allies;
    return this.bots.filter(b => !b.dead);
  }

  cycleSpectatorTarget(dir = 1) {
    const pool = this.getSpectatableBots();
    if (pool.length === 0) {
      this.player.spectateBotId = null;
      return;
    }
    const curIdx = pool.findIndex(b => b.id === this.player.spectateBotId);
    const nextIdx = (curIdx + dir + pool.length) % pool.length;
    this.player.spectateBotId = pool[nextIdx].id;
    CS.audio.playUISound('click');
  }

  updatePlayer(dt) {
    if (this.player.dead) {
      this.player.deathAnimTimer = (this.player.deathAnimTimer || 0) + dt;
      const fallProgress = Math.min(1, this.player.deathAnimTimer / 0.58);
      const easeFall = 1 - Math.pow(1 - fallProgress, 3);

      // Update Death Screen Respawn Countdown Bar / Bomb Mode Spectator Info
      const respTextEl = document.getElementById('death-respawn-text');
      const respFillEl = document.getElementById('death-respawn-fill');
      const maxDelay = this.modeConfig.respawnDelay || 2.8;

      if (this.modeConfig.respawn) {
        // First-person camera collapse to the ground + dramatic head tilt (roll)
        const targetDeadEye = 0.24;
        this.player.eyeHeight += (targetDeadEye - this.player.eyeHeight) * Math.min(1, dt * 8.5);
        const targetPitch = -0.22;
        this.player.pitch += (targetPitch - this.player.pitch) * Math.min(1, dt * 6.5);

        // Smoothly turn camera toward the killer (Killcam look-at)
        if (this.player.killerPos) {
          const dx = this.player.killerPos.x - this.player.position.x;
          const dz = this.player.killerPos.z - this.player.position.z;
          const desiredYaw = Math.atan2(-dx, -dz);
          let diff = desiredYaw - this.player.yaw;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          this.player.yaw += diff * Math.min(1, dt * 4.5);
        }

        this.camera.position.set(
          this.player.position.x,
          this.player.position.y + this.player.eyeHeight,
          this.player.position.z
        );
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.player.yaw;
        this.camera.rotation.x = this.player.pitch;
        this.camera.rotation.z = easeFall * 0.58 * (this.player.deathRollDir || 1);

        this.player.respawnTimer -= dt;
        const rem = Math.max(0, this.player.respawnTimer);
        if (respTextEl) respTextEl.textContent = `Wiedereinstieg in ${rem.toFixed(1)}s...`;
        if (respFillEl) respFillEl.style.width = `${Math.min(100, (rem / maxDelay) * 100)}%`;

        if (this.player.respawnTimer <= 0) {
          const sp = this.getSafePlayerSpawn();
          this.player.dead = false;
          this.player.deathAnimTimer = 0;
          this.player.killerPos = null;
          this.player.health = 100;
          this.player.armor = 100;
          this.player.hasHelmet = true;
          this.player.spawnShieldMax = 5.0;
          this.player.spawnShieldTimer = 5.0;
          this.player.eyeHeight = 1.65;
          this.player.pitch = 0;
          this.player.recoilKick = 0;
          this.player.recoilPitchAccum = 0;
          this.player.recoilYawAccum = 0;
          this.camera.rotation.z = 0;
          this.viewmodelGroup.visible = true;
          this.player.position.set(sp.x, sp.y || 0, sp.z);
          this.player.velocity.set(0, 0, 0);
          document.getElementById('death-screen-overlay')?.classList.add('hidden');
          // Refill weapon magazines on respawn
          [1, 2].forEach(slotNum => {
            const item = this.player.slots[slotNum];
            if (item && CS.WEAPONS[item.id]) {
              item.mag = CS.WEAPONS[item.id].magSize;
              item.reserve = CS.WEAPONS[item.id].reserveAmmo;
            }
          });
          CS.ui.showToast('🛡️ Spawn-Schild aktiv (5s Unverwundbarkeit)', 'info');
        }
      } else {
        // NO RESPAWN (Bomb Defusal Mode): Stay dead until round ends & spectate living agents!
        if (this.player.deathAnimTimer < 1.8) {
          const targetDeadEye = 0.24;
          this.player.eyeHeight += (targetDeadEye - this.player.eyeHeight) * Math.min(1, dt * 8.5);
          const targetPitch = -0.22;
          this.player.pitch += (targetPitch - this.player.pitch) * Math.min(1, dt * 6.5);

          if (this.player.killerPos) {
            const dx = this.player.killerPos.x - this.player.position.x;
            const dz = this.player.killerPos.z - this.player.position.z;
            const desiredYaw = Math.atan2(-dx, -dz);
            let diff = desiredYaw - this.player.yaw;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            this.player.yaw += diff * Math.min(1, dt * 4.5);
          }

          this.camera.position.set(
            this.player.position.x,
            this.player.position.y + this.player.eyeHeight,
            this.player.position.z
          );
          this.camera.rotation.order = 'YXZ';
          this.camera.rotation.y = this.player.yaw;
          this.camera.rotation.x = this.player.pitch;
          this.camera.rotation.z = easeFall * 0.58 * (this.player.deathRollDir || 1);
        } else {
          // Follow a living teammate / bot in spectator view while waiting for round end
          this.viewmodelGroup.visible = false;
          const pool = this.getSpectatableBots();
          let specBot = pool.find(b => b.id === this.player.spectateBotId);
          if (!specBot && pool.length > 0) {
            specBot = pool[0];
            this.player.spectateBotId = specBot.id;
          }
          if (specBot) {
            const backOffset = new THREE.Vector3(Math.sin(specBot.yaw) * 2.8, 2.1, Math.cos(specBot.yaw) * 2.8);
            this.camera.position.set(
              specBot.position.x + backOffset.x,
              specBot.position.y + backOffset.y,
              specBot.position.z + backOffset.z
            );
            this.camera.rotation.order = 'YXZ';
            this.camera.rotation.y = specBot.yaw;
            this.camera.rotation.x = -0.18;
            this.camera.rotation.z = 0;
          }
        }

        const { ctAlive, tAlive } = this.getTeamAliveCounts();
        const pool = this.getSpectatableBots();
        const specBot = pool.find(b => b.id === this.player.spectateBotId) || pool[0];
        const specLabel = specBot ? `🎥 Zuschauer: BOT ${specBot.name} (${specBot.team}) [KLICK/SPACE wechseln] • ` : '';
        if (this.plantedBomb.active) {
          const bRem = Math.max(0, this.plantedBomb.timer);
          if (respTextEl) respTextEl.textContent = `${specLabel}💣 Bombe tickt (${bRem.toFixed(1)}s) — ${ctAlive} CT vs ${tAlive} T lebend`;
          if (respFillEl) respFillEl.style.width = `${Math.min(100, (bRem / (this.modeConfig.bombTime || 40)) * 100)}%`;
        } else {
          if (respTextEl) respTextEl.textContent = `${specLabel}Kein Respawn — Warte auf Rundenende (${ctAlive} CT vs ${tAlive} T lebend)`;
          if (respFillEl) respFillEl.style.width = '0%';
        }
      }
      return;
    }

    // Countdown Spawn Shield (paused while Buy Menu [B] is open so you can shop safely!)
    if (this.player.spawnShieldTimer > 0 && !this.buyMenuOpen) {
      this.player.spawnShieldTimer = Math.max(0, this.player.spawnShieldTimer - dt);
    }

    // Automatic weapon continuous fire
    const wData = this.getActiveWeaponData();
    if (this.mouseDownLeft && wData.automatic && !this.buyMenuOpen) {
      this.tryFireWeapon(false);
    }

    if (this.player.fireCooldown > 0) this.player.fireCooldown -= dt;
    if (this.player.drawTimer > 0) this.player.drawTimer -= dt;
    if (this.player.inspectTimer > 0) this.player.inspectTimer -= dt;

    if (this.player.reloading) {
      this.player.reloadTimer -= dt;
      if (this.player.reloadTimer <= 0) {
        this.completeReload();
      }
    }

    // Flashbang screen fade
    if (this.player.flashedAlpha > 0) {
      this.player.flashedAlpha = Math.max(0, this.player.flashedAlpha - dt * 0.35);
    }
    const flashEl = document.getElementById('flashbang-overlay');
    if (flashEl) {
      flashEl.style.opacity = this.player.flashedAlpha.toFixed(3);
    }

    // Smooth Recoil Recovery (fast & responsive after firing stops)
    if (!this.mouseDownLeft && this.player.recoilPitchAccum > 0) {
      const rec = Math.min(this.player.recoilPitchAccum, dt * (0.38 + this.player.recoilPitchAccum * 4.5));
      this.player.pitch -= rec;
      this.player.recoilPitchAccum -= rec;
    }
    this.player.recoilKick = Math.max(0, this.player.recoilKick - dt * 0.65);

    // Crouch & Walk States
    this.player.crouching = !!(this.keys['ControlLeft'] || this.keys['KeyC']);
    this.player.walking = !!(this.keys['ShiftLeft'] || this.keys['ShiftRight']);
    const targetEye = this.player.crouching ? 1.05 : 1.65;
    this.player.eyeHeight += (targetEye - this.player.eyeHeight) * Math.min(1, dt * 12);

    // Freeze player movement only during initial 4s freeze phase in Bomb mode
    if (this.roundPhase !== 'buy') {
      let moveForward = 0;
      let moveRight = 0;
      if (this.keys['KeyW'] || this.keys['ArrowUp']) moveForward += 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) moveForward -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) moveRight += 1;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveRight -= 1;

      const forwardVec = new THREE.Vector3(-Math.sin(this.player.yaw), 0, -Math.cos(this.player.yaw));
      const rightVec = new THREE.Vector3(Math.cos(this.player.yaw), 0, -Math.sin(this.player.yaw));
      const wishDir = new THREE.Vector3()
        .addScaledVector(forwardVec, moveForward)
        .addScaledVector(rightVec, moveRight);

      if (wishDir.lengthSq() > 0) wishDir.normalize();

      let baseSpeed = 6.6 * (wData.moveSpeed || 0.9);
      if (this.player.crouching) baseSpeed *= 0.52;
      else if (this.player.walking) baseSpeed *= 0.58;
      if (this.player.scopeIndex >= 0) baseSpeed *= 0.65;

      this.player.velocity.x = wishDir.x * baseSpeed;
      this.player.velocity.z = wishDir.z * baseSpeed;
    } else {
      this.player.velocity.x = 0;
      this.player.velocity.z = 0;
    }

    // Gravity
    this.player.velocity.y -= 19.5 * dt;

    // Move & Slide along Map Colliders
    const r = 0.42;
    const nx = this.player.position.x + this.player.velocity.x * dt;
    if (!this.checkPlayerCollision(nx, this.player.position.y, this.player.position.z, r)) {
      this.player.position.x = nx;
    } else {
      this.player.velocity.x = 0;
    }

    const nz = this.player.position.z + this.player.velocity.z * dt;
    if (!this.checkPlayerCollision(this.player.position.x, this.player.position.y, nz, r)) {
      this.player.position.z = nz;
    } else {
      this.player.velocity.z = 0;
    }

    // Vertical floor & step-up check
    let groundY = 0;
    let floorSurface = 'stone';
    for (const c of CS.mapBuilder.colliders) {
      if (this.player.position.x + r > c.minX && this.player.position.x - r < c.maxX &&
          this.player.position.z + r > c.minZ && this.player.position.z - r < c.maxZ) {
        if (c.maxY <= this.player.position.y + 0.65 && c.maxY >= groundY) {
          groundY = c.maxY;
          floorSurface = c.surface || 'stone';
        }
      }
    }

    this.player.position.y += this.player.velocity.y * dt;
    if (this.player.position.y <= groundY) {
      this.player.position.y = groundY;
      this.player.velocity.y = 0;
      this.player.onGround = true;
    } else {
      this.player.onGround = false;
    }

    // Footstep Audio (Silent when Shift-walking or Crouching!)
    const horizSpd = Math.hypot(this.player.velocity.x, this.player.velocity.z);
    if (this.player.onGround && horizSpd > 2.2 && !this.player.walking && !this.player.crouching) {
      this.player.stepDistance += horizSpd * dt;
      if (this.player.stepDistance >= 2.35) {
        this.player.stepDistance = 0;
        CS.audio.playFootstep(floorSurface);
      }
    }

    // C4 Planting & Defusing Interaction ([E] or Left Click with C4)
    this.updateBombInteraction(dt);

    // Pickup / Swap Dropped Weapons with [E]
    if (this.player.pickupCooldown > 0) this.player.pickupCooldown -= dt;
    if (this.keys['KeyE'] && (this.player.pickupCooldown || 0) <= 0 && this.player.plantingProgress <= 0 && this.player.defusingProgress <= 0) {
      let nearestIdx = -1;
      let nearestDist = 2.4;
      for (let i = 0; i < this.droppedItems.length; i++) {
        const d = this.player.position.distanceTo(this.droppedItems[i].position);
        if (d < nearestDist) {
          nearestDist = d;
          nearestIdx = i;
        }
      }
      if (nearestIdx !== -1) {
        const dItem = this.droppedItems[nearestIdx];
        const targetSlot = dItem.slot;
        const oldSlotData = this.player.slots[targetSlot];

        // Remove picked-up weapon from ground first
        this.scene.remove(dItem.mesh);
        this.droppedItems.splice(nearestIdx, 1);

        // If player already has a weapon in that slot, drop/swap it onto the ground
        if (oldSlotData) {
          const dropDir = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.yaw);
          const dropPos = this.player.position.clone().addScaledVector(dropDir, 1.35);
          this.spawnDroppedWeapon(oldSlotData, dropPos, oldSlotData.skinId);
        }

        this.player.slots[targetSlot] = dItem.itemData;
        this.player.pickupCooldown = 0.45;
        CS.audio.playUISound('buy');
        const wName = CS.WEAPONS[dItem.weaponId]?.name || dItem.weaponId;
        const sName = dItem.skinId && dItem.skinId !== 'default' ? ` | ${CS.SKINS[dItem.skinId]?.name}` : '';
        CS.ui.showToast(`🔫 Aufgehoben: ${wName}${sName}`, 'info');
        this.switchSlot(targetSlot);
        this.rebuildViewmodel();
        this.updateHUD();
      }
    }

    // Update Camera Transform
    this.camera.position.set(
      this.player.position.x,
      this.player.position.y + this.player.eyeHeight,
      this.player.position.z
    );
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.player.yaw;
    this.camera.rotation.x = this.player.pitch;
    this.camera.rotation.z = 0;
  }

  checkPlayerCollision(x, y, z, r) {
    const mb = CS.mapBuilder.mapBounds || { minX: -82, maxX: 82, minZ: -84, maxZ: 84 };
    if (x < mb.minX + 0.8 || x > mb.maxX - 0.8 || z < mb.minZ + 0.8 || z > mb.maxZ - 0.8) return true;
    for (const c of CS.mapBuilder.colliders) {
      if (c.maxY <= y + 0.62) continue; // Step-up allowed
      if (y + this.player.eyeHeight < c.minY) continue;
      if (x + r > c.minX && x - r < c.maxX && z + r > c.minZ && z - r < c.maxZ) {
        return true;
      }
    }
    return false;
  }

  updateBombInteraction(dt) {
    const barWrap = document.getElementById('action-progress-wrap');
    const barFill = document.getElementById('action-progress-fill');
    const barLabel = document.getElementById('action-progress-label');
    const promptEl = document.getElementById('interaction-prompt');

    let showPrompt = '';
    let activePct = 0;

    // 1. Terrorist Player Planting C4 at Bombsite A or B
    const site = this.getBombsiteAt(this.player.position);
    if (this.player.team === 'T' && this.player.slots[5] && site && !this.plantedBomb.active && this.roundPhase !== 'ended') {
      showPrompt = `Halte [E] oder Linksklick zum Platzieren der Bombe auf ${site.name}`;
      const holdingPlant = this.keys['KeyE'] || (this.mouseDownLeft && this.player.activeSlot === 5);
      if (holdingPlant) {
        this.player.plantingProgress += dt;
        activePct = Math.min(100, (this.player.plantingProgress / 3.2) * 100);
        const codeDigits = '7355608'.slice(0, Math.ceil((activePct / 100) * 7));
        if (barLabel) barLabel.textContent = `C4 CODE EINGEBEN: ${codeDigits.padEnd(7, '_')} (${Math.round(activePct)}%)`;
        if (this.player.plantingProgress >= 3.2) {
          this.player.slots[5] = null;
          this.player.plantingProgress = 0;
          this.plantC4(this.player.position, site.name, CS.ui.profile.playerName);
          this.switchSlot(this.player.slots[1] ? 1 : 2);
        }
      } else {
        this.player.plantingProgress = 0;
      }
    }

    // 2. CT Player Defusing Planted C4
    if (this.player.team === 'CT' && this.plantedBomb.active) {
      const dist = Math.hypot(
        this.player.position.x - this.plantedBomb.position.x,
        this.player.position.z - this.plantedBomb.position.z
      );
      if (dist < 3.0) {
        const reqTime = this.player.hasDefuseKit ? 2.5 : 5.0;
        showPrompt = `Halte [E] zum Entschärfen der Bombe (${reqTime}s${this.player.hasDefuseKit ? ' mit Kit' : ''})`;
        if (this.keys['KeyE']) {
          this.player.defusingProgress += dt;
          activePct = Math.min(100, (this.player.defusingProgress / reqTime) * 100);
          if (barLabel) barLabel.textContent = `BOMBE WIRD ENTSCHÄRFT... ${Math.round(activePct)}%`;
          if (this.player.defusingProgress >= reqTime) {
            this.player.defusingProgress = 0;
            this.defuseC4(CS.ui.profile.playerName);
          }
        } else {
          this.player.defusingProgress = 0;
        }
      }
    }

    // 3. Nearby Dropped Weapon Prompt if not planting/defusing C4
    if (!showPrompt && !this.player.dead) {
      let nearestItem = null;
      let nearestDist = 2.4;
      for (const dItem of this.droppedItems) {
        const d = this.player.position.distanceTo(dItem.position);
        if (d < nearestDist) {
          nearestDist = d;
          nearestItem = dItem;
        }
      }
      if (nearestItem) {
        const wName = CS.WEAPONS[nearestItem.weaponId]?.name || nearestItem.weaponId;
        const skinLabel = nearestItem.skinId && nearestItem.skinId !== 'default' ? ` | ${CS.SKINS[nearestItem.skinId]?.name}` : '';
        const actionVerb = this.player.slots[nearestItem.slot] ? 'Tauschen gegen' : 'Aufheben:';
        showPrompt = `Drücke [E] zum ${actionVerb} ${wName}${skinLabel}`;
      }
    }

    if (promptEl) {
      promptEl.textContent = showPrompt;
      promptEl.classList.toggle('hidden', !showPrompt);
    }
    if (barWrap && barFill) {
      barWrap.classList.toggle('hidden', activePct <= 0);
      barFill.style.width = `${activePct}%`;
    }
  }

  updateBots(dt) {
    for (const b of this.bots) {
      b.update(dt, this);
    }
  }

  updateWorldEntities(dt) {
    // 0. Dropped C4 Pickup (by living Terrorist player or Terrorist bot)
    if (this.droppedBomb.active && !this.plantedBomb.active && this.roundPhase !== 'ended') {
      if (this.droppedBomb.mesh) {
        this.droppedBomb.mesh.rotation.y += dt * 1.8;
      }
      if (!this.player.dead && this.player.team === 'T' && !this.player.slots[5]) {
        if (this.player.position.distanceTo(this.droppedBomb.position) < 2.2) {
          this.player.slots[5] = { id: 'c4' };
          if (this.droppedBomb.mesh) {
            this.scene.remove(this.droppedBomb.mesh);
            this.droppedBomb.mesh = null;
          }
          this.droppedBomb.active = false;
          CS.audio.playUISound('buy');
          CS.ui.showToast('💣 Du hast das C4 aufgehoben! Platziere es bei A oder B [E].', 'gold');
          this.updateHUD();
        }
      }
      if (this.droppedBomb.active) {
        for (const b of this.bots) {
          if (!b.dead && b.team === 'T' && !b.hasC4) {
            if (b.position.distanceTo(this.droppedBomb.position) < 2.5) {
              b.hasC4 = true;
              if (this.droppedBomb.mesh) {
                this.scene.remove(this.droppedBomb.mesh);
                this.droppedBomb.mesh = null;
              }
              this.droppedBomb.active = false;
              b.pickNextWaypoint(this.plantedBomb);
              break;
            }
          }
        }
      }
    }

    // 1. Active Thrown Grenades
    for (let i = this.activeGrenades.length - 1; i >= 0; i--) {
      const g = this.activeGrenades[i];
      g.fuseTimer -= dt;
      g.velocity.y -= 17.5 * dt;

      const nx = g.position.x + g.velocity.x * dt;
      if (this.checkPlayerCollision(nx, g.position.y, g.position.z, 0.15)) {
        g.velocity.x *= -0.55;
      } else {
        g.position.x = nx;
      }

      const nz = g.position.z + g.velocity.z * dt;
      if (this.checkPlayerCollision(g.position.x, g.position.y, nz, 0.15)) {
        g.velocity.z *= -0.55;
      } else {
        g.position.z = nz;
      }

      g.position.y += g.velocity.y * dt;
      if (g.position.y <= 0.15) {
        g.position.y = 0.15;
        if (g.type === 'molotov') {
          g.fuseTimer = 0; // Molotov shatters on ground impact!
        } else {
          g.velocity.y *= -0.45;
          g.velocity.x *= 0.72;
          g.velocity.z *= 0.72;
        }
      }
      g.mesh.rotation.x += dt * 8;
      g.mesh.rotation.z += dt * 6;

      if (g.fuseTimer <= 0) {
        this.detonateGrenade(g);
        this.activeGrenades.splice(i, 1);
      }
    }

    // 2. Volumetric Smoke Clouds
    for (let i = this.smokeClouds.length - 1; i >= 0; i--) {
      const sc = this.smokeClouds[i];
      sc.timer -= dt;
      sc.mesh.rotation.y += dt * 0.15;
      if (sc.timer <= 0) {
        this.scene.remove(sc.mesh);
        this.smokeClouds.splice(i, 1);
      }
    }

    // 3. Molotov Fire Zones
    for (let i = this.fireZones.length - 1; i >= 0; i--) {
      const fz = this.fireZones[i];
      fz.timer -= dt;
      fz.tickTimer -= dt;
      if (fz.tickTimer <= 0) {
        fz.tickTimer = 0.28;
        // Burn damage to anyone inside fire radius
        if (!this.player.dead && this.player.position.distanceTo(fz.position) < fz.radius) {
          this.damagePlayer(8, null, false);
        }
        for (const b of this.bots) {
          if (!b.dead && b.position.distanceTo(fz.position) < fz.radius) {
            const killed = b.takeDamage(12, this.player, false);
            if (killed) this.onEntityKilled(this.player, b, 'molotov', false);
          }
        }
      }
      if (fz.timer <= 0) {
        this.scene.remove(fz.mesh);
        this.scene.remove(fz.light);
        this.fireZones.splice(i, 1);
      }
    }

    // 4. Bullet Tracers
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.timer -= dt;
      if (t.timer <= 0) {
        this.scene.remove(t.mesh);
        this.tracers.splice(i, 1);
      }
    }

    // 5. Impact Sparks & Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.timer -= dt;
      p.vel.y -= 12 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      if (p.timer <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }

    // 6. Ejected 3D Brass Shell Casings (with floor bounce & metallic clink)
    const groundRefY = (this.player.position.y || 0) + 0.025;
    for (let i = this.shellCasings.length - 1; i >= 0; i--) {
      const c = this.shellCasings[i];
      c.timer -= dt;
      c.vel.y -= 16.5 * dt;
      c.mesh.position.addScaledVector(c.vel, dt);
      c.mesh.rotation.x += c.rotVel.x * dt;
      c.mesh.rotation.y += c.rotVel.y * dt;
      c.mesh.rotation.z += c.rotVel.z * dt;

      if (c.mesh.position.y <= groundRefY) {
        c.mesh.position.y = groundRefY;
        c.vel.y *= -0.38;
        c.vel.x *= 0.65;
        c.vel.z *= 0.65;
        c.rotVel.multiplyScalar(0.5);
        if (!c.bounced) {
          c.bounced = true;
          CS.audio.playShellClink();
        }
      }

      if (c.timer <= 0) {
        this.scene.remove(c.mesh);
        this.shellCasings.splice(i, 1);
      }
    }

    // 7. Gently hover/rotate dropped weapons on the ground
    for (const dItem of this.droppedItems) {
      if (dItem.mesh) {
        dItem.mesh.rotation.y += dt * 0.65;
      }
    }

    // 8. Directional Damage Indicators & Active Squad Order Timer
    this.updateDamageIndicators(dt);
    if (this.activeSquadOrder) {
      this.activeSquadOrder.timer -= dt;
      if (this.activeSquadOrder.timer <= 0) {
        this.activeSquadOrder = null;
      }
    }
  }

  updateViewmodelAnimations(dt) {
    const model = this.viewmodelGroup.children[0];
    if (!model) return;

    const t = performance.now() * 0.001;
    const speed = Math.hypot(this.player.velocity.x, this.player.velocity.z);
    const bobAmp = this.player.onGround ? Math.min(1, speed / 6.0) * 0.014 : 0.003;
    const bobX = Math.cos(t * 9.5) * bobAmp;
    const bobY = Math.abs(Math.sin(t * 9.5)) * bobAmp * 1.3;

    // Base position + recoil kick
    let posX = 0.24 + bobX;
    let posY = -0.23 - bobY;
    let posZ = -0.44 + this.player.recoilKick;
    let rotX = this.player.recoilKick * 1.4;
    let rotY = 0;
    let rotZ = 0;

    const ud = model.userData || {};

    // 1. Weapon Draw Animation
    if (this.player.drawTimer > 0) {
      const p = this.player.drawTimer / 0.36;
      posY -= p * 0.22;
      rotX -= p * 0.65;
      if (ud.weaponId === 'knife' && ud.knifeModelId === 'knife_karambit') {
        rotX += p * Math.PI * 2; // Karambit finger spin on draw!
      }
    }

    // 2. Visual Magazine Drop & Insert Reload Animation!
    if (this.player.reloading) {
      const progress = 1 - (this.player.reloadTimer / this.player.reloadDuration);
      rotZ = 0.38 * Math.sin(progress * Math.PI);
      rotX = 0.22 * Math.sin(progress * Math.PI);

      if (ud.magMesh && ud.magDefaultPos) {
        let magDrop = 0;
        if (progress < 0.35) magDrop = (progress / 0.35) * 0.22;
        else if (progress < 0.72) magDrop = (1 - (progress - 0.35) / 0.37) * 0.22;
        ud.magMesh.position.y = ud.magDefaultPos.y - magDrop;
        if (ud.leftArmGroup && ud.leftHandDefaultPos) {
          ud.leftArmGroup.position.y = ud.leftHandDefaultPos.y - magDrop * 0.85;
        }
      }
    } else if (ud.magMesh && ud.magDefaultPos) {
      ud.magMesh.position.copy(ud.magDefaultPos);
      if (ud.leftArmGroup && ud.leftHandDefaultPos) {
        ud.leftArmGroup.position.copy(ud.leftHandDefaultPos);
      }
    }

    // 3. [F] Key Weapon / Knife Inspect Animation!
    if (this.player.inspectTimer > 0) {
      const p = 1 - (this.player.inspectTimer / 2.6);
      if (ud.weaponId === 'knife' && (ud.knifeModelId === 'knife_karambit' || ud.knifeModelId === 'knife_butterfly')) {
        // Spin Karambit / Flip Butterfly Knife!
        rotX += Math.sin(p * Math.PI * 2) * Math.PI;
        rotZ += Math.sin(p * Math.PI) * 0.45;
      } else {
        // Classic CS Weapon Skin Inspect (tilt left side, then right side)
        rotZ = Math.sin(p * Math.PI * 2) * 0.52;
        rotY = Math.sin(p * Math.PI) * 0.38;
        posX -= Math.sin(p * Math.PI) * 0.06;
        posY += Math.sin(p * Math.PI) * 0.04;
      }
    }

    // 4. Pistol Slide / Rifle Bolt Kickback on Fire
    if (ud.slideOrBoltMesh && ud.slideDefaultPos) {
      ud.slideOrBoltMesh.position.z = ud.slideDefaultPos.z + this.player.recoilKick * 0.45;
    }

    // 5. First-Person Weapon Drop Animation on Player Death
    if (this.player.dead) {
      const dp = Math.min(1, (this.player.deathAnimTimer || 0) / 0.42);
      posY -= dp * 0.48;
      posZ -= dp * 0.15;
      rotX -= dp * 1.15;
      rotZ += dp * 0.75 * (this.player.deathRollDir || 1);
    }

    model.position.set(posX, posY, posZ);
    model.rotation.set(rotX, rotY, rotZ);

    // Update Muzzle Flash position
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= dt;
      if (ud.muzzlePoint) {
        const mp = ud.muzzlePoint.clone().applyMatrix4(model.matrixWorld);
        this.muzzleFlashMesh.position.copy(mp);
        this.muzzleFlashLight.position.copy(mp);
      }
      if (this.muzzleFlashTimer <= 0) {
        this.muzzleFlashMesh.visible = false;
        this.muzzleFlashLight.intensity = 0;
      }
    }
  }

  updateHUD() {
    // Top Score & Timer Bar
    const ctScoreEl = document.getElementById('hud-score-ct');
    const tScoreEl = document.getElementById('hud-score-t');
    if (ctScoreEl) ctScoreEl.textContent = this.scores.CT;
    if (tScoreEl) tScoreEl.textContent = this.scores.T;

    const timerEl = document.getElementById('hud-timer');
    if (timerEl) {
      const secs = Math.max(0, Math.ceil(this.phaseTimer));
      const m = Math.floor(secs / 60);
      const s = String(secs % 60).padStart(2, '0');
      if (this.plantedBomb && this.plantedBomb.active) {
        timerEl.textContent = `${m}:${s} • 💣 ${Math.max(0, this.plantedBomb.timer).toFixed(1)}s`;
        timerEl.classList.add('bomb-alert');
      } else {
        timerEl.textContent = `${m}:${s}`;
        timerEl.classList.remove('bomb-alert');
      }
    }

    // Alive Counts & Active AI Difficulty Badge
    const ctAlive = (this.player.team === 'CT' && !this.player.dead ? 1 : 0) + this.bots.filter(b => b.team === 'CT' && !b.dead).length;
    const tAlive = (this.player.team === 'T' && !this.player.dead ? 1 : 0) + this.bots.filter(b => b.team === 'T' && !b.dead).length;
    const diffData = this.getDifficultyData();
    const aliveEl = document.getElementById('hud-alive-counts');
    if (aliveEl) {
      aliveEl.innerHTML = `${ctAlive} Alive vs ${tAlive} Alive &bull; <span style="color:${diffData.color}">${diffData.icon} KI: ${diffData.name.toUpperCase()} (${diffData.creditMult}x CR)</span>`;
    }

    // Active Tactical Squad Order Badge below Radar
    const squadBadge = document.getElementById('squad-order-badge');
    if (squadBadge) {
      if (this.activeSquadOrder && this.activeSquadOrder.timer > 0) {
        squadBadge.classList.remove('hidden');
        squadBadge.textContent = `${this.activeSquadOrder.label} (${Math.ceil(this.activeSquadOrder.timer)}s)`;
      } else {
        squadBadge.classList.add('hidden');
      }
    }

    // Spawn Shield HUD Badge & Protective Screen Glow
    const shieldBadge = document.getElementById('spawn-shield-badge');
    const shieldTimerEl = document.getElementById('spawn-shield-timer');
    const shieldFillEl = document.getElementById('spawn-shield-fill');
    const shieldVig = document.getElementById('spawn-shield-vignette');
    const shieldActive = !this.player.dead && this.player.spawnShieldTimer > 0;
    if (shieldBadge) shieldBadge.classList.toggle('hidden', !shieldActive);
    if (shieldActive) {
      if (shieldTimerEl) shieldTimerEl.textContent = `${this.player.spawnShieldTimer.toFixed(1)}s`;
      if (shieldFillEl) {
        const pct = Math.min(100, Math.max(0, (this.player.spawnShieldTimer / (this.player.spawnShieldMax || 5.0)) * 100));
        shieldFillEl.style.width = `${pct}%`;
      }
      if (shieldVig) shieldVig.style.opacity = '0.55';
    } else if (shieldVig) {
      shieldVig.style.opacity = '0';
    }

    // Health, Armor & Money
    const hpEl = document.getElementById('hud-hp');
    const apEl = document.getElementById('hud-ap');
    const moneyEl = document.getElementById('hud-money');
    if (hpEl) hpEl.textContent = this.player.health;
    if (apEl) apEl.textContent = this.player.armor;
    if (moneyEl) moneyEl.textContent = `$${this.player.money.toLocaleString('de-DE')}`;

    // Ammo & Active Weapon + Skin Name
    const wData = this.getActiveWeaponData();
    const slotObj = this.player.slots[this.player.activeSlot];
    const ammoEl = document.getElementById('hud-ammo');
    const wNameEl = document.getElementById('hud-weapon-name');

    if (ammoEl) {
      if (wData.id === 'knife' || wData.isC4) {
        ammoEl.textContent = '∞';
      } else if (wData.isGrenade) {
        ammoEl.textContent = `${this.player.slots[4].length}x`;
      } else if (slotObj) {
        ammoEl.textContent = this.player.reloading ? 'RELOAD...' : `${slotObj.mag} / ${slotObj.reserve}`;
      }
    }

    if (wNameEl) {
      const skinId = (slotObj && slotObj.skinId) ? slotObj.skinId : (CS.ui.profile.weaponSkins[wData.id] || 'default');
      const skinLabel = skinId !== 'default' ? ` | ${CS.SKINS[skinId]?.name}` : '';
      const displayName = wData.id === 'knife' ? CS.KNIFE_MODELS[CS.ui.profile.equippedKnife]?.name : wData.name;
      wNameEl.textContent = `${displayName}${skinLabel}`;
    }

    // Inventory Slots Bar (Bottom Right)
    for (let s = 1; s <= 5; s++) {
      const slotEl = document.getElementById(`hud-slot-${s}`);
      if (!slotEl) continue;
      slotEl.classList.toggle('active', this.player.activeSlot === s);
      let label = '-';
      if (s === 1 && this.player.slots[1]) label = CS.WEAPONS[this.player.slots[1].id]?.name;
      else if (s === 2 && this.player.slots[2]) label = CS.WEAPONS[this.player.slots[2].id]?.name;
      else if (s === 3) label = CS.KNIFE_MODELS[CS.ui.profile.equippedKnife]?.name || 'Messer';
      else if (s === 4) label = this.player.slots[4].length ? `Granaten (${this.player.slots[4].length})` : '-';
      else if (s === 5) label = this.player.slots[5] ? '💣 C4 Bombe' : '-';
      slotEl.querySelector('.slot-name').textContent = label;
    }
  }
}

CS.game = new TacticalGame();
window.addEventListener('DOMContentLoaded', () => {
  CS.ui.init();
  CS.game.init();
});
