// ============================================================================
// COUNTER OPS: TACTICAL STRIKE - LOBBY, SHOP, UNBOXING, CUSTOMIZER & HUD UI
// ============================================================================
window.CS = window.CS || {};

class UIManager {
  constructor() {
    this.storageKey = 'counter_ops_profile_v1';
    this.profile = this.loadProfile();

    // Lobby 3D Preview Scene
    this.lobbyRenderer = null;
    this.lobbyScene = null;
    this.lobbyCamera = null;
    this.lobbyStageGroup = null;
    this.lobbyPreviewMode = 'agent'; // 'agent' or 'weapon'
    this.lobbyYaw = Math.PI - 0.35;
    this.isDraggingLobby = false;

    // Unboxing state
    this.selectedCaseId = 'case_sandstorm';
    this.isUnboxing = false;
    this.lastUnboxedItem = null;

    // Shop & Customizer filter state
    this.shopFilter = 'all';
    this.customizerWeapon = 'ak47';
    this.previewWeaponOverride = 'auto';
  }

  getDefaultStats() {
    return {
      kills: 0,
      deaths: 0,
      headshotKills: 0,
      roundsPlayed: 0,
      roundsWon: 0,
      roundsLost: 0,
      shotsFired: 0,
      shotsHit: 0,
      totalDamage: 0,
      bombsPlanted: 0,
      bombsDefused: 0,
      firstBloods: 0,
      doubleKills: 0,
      tripleKills: 0,
      ultraKills: 0,
      aces: 0,
      clutchesWon: 0,
      bestKillStreak: 0,
      casesOpened: 0,
      totalCreditsEarned: 0,
      weaponKills: {},
      weaponHeadshots: {},
      weaponShots: {},
      weaponHits: {},
      mapRounds: {}
    };
  }

  loadProfile() {
    const defaultStats = this.getDefaultStats();
    const defaultProfile = {
      playerName: 'StrikeCommander',
      credits: 0, // Starts at 0 credits - earn through playing matches!
      xp: 450,
      economyVersion: 2,
      totalKills: 0,
      ownedSkins: ['default', 'camo_desert'],
      ownedKnives: ['knife_default'],
      ownedOutfits: ['sas_navy'],
      ownedGloves: ['gloves_default'],
      equippedOutfit: 'sas_navy',
      equippedGlove: 'gloves_default',
      equippedKnife: 'knife_default',
      showcaseWeapon: 'ak47',
      weaponSkins: {
        glock: 'default', usps: 'default', p250: 'default', deagle: 'default',
        mp9: 'default', ump45: 'default', nova: 'default', xm1014: 'default',
        famas: 'default', m4a1s: 'default', m4a4: 'default', ak47: 'default',
        aug: 'default', ssg08: 'default', awp: 'default', knife: 'default'
      },
      settings: {
        sensitivity: 2.2,
        volume: 0.75,
        crosshairColor: '#00ff66',
        crosshairSize: 8,
        crosshairGap: 4,
        botCount: 4, // 5v5 (Player + 4 allies vs 5 enemies)
        difficulty: 'hard' // Default AI difficulty ('easy', 'medium', 'hard', 'nightmare')
      },
      stats: defaultStats
    };

    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return defaultProfile;
      const parsed = JSON.parse(raw);
      if (!parsed.economyVersion || parsed.economyVersion < 2) {
        parsed.credits = 0;
        parsed.economyVersion = 2;
      }
      const mergedStats = {
        ...defaultStats,
        ...(parsed.stats || {}),
        weaponKills: { ...(parsed.stats?.weaponKills || {}) },
        weaponHeadshots: { ...(parsed.stats?.weaponHeadshots || {}) },
        weaponShots: { ...(parsed.stats?.weaponShots || {}) },
        weaponHits: { ...(parsed.stats?.weaponHits || {}) },
        mapRounds: { ...(parsed.stats?.mapRounds || {}) }
      };
      // Migrate legacy totalKills if higher than stats.kills
      if ((parsed.totalKills || 0) > (mergedStats.kills || 0)) {
        mergedStats.kills = parsed.totalKills;
      }
      return {
        ...defaultProfile,
        ...parsed,
        weaponSkins: { ...defaultProfile.weaponSkins, ...(parsed.weaponSkins || {}) },
        settings: { ...defaultProfile.settings, ...(parsed.settings || {}) },
        stats: mergedStats
      };
    } catch (e) {
      return defaultProfile;
    }
  }

  ensureStats() {
    if (!this.profile.stats) {
      this.profile.stats = this.getDefaultStats();
    }
    return this.profile.stats;
  }

  recordShotFired(weaponId) {
    const st = this.ensureStats();
    st.shotsFired = (st.shotsFired || 0) + 1;
    if (weaponId) {
      st.weaponShots[weaponId] = (st.weaponShots[weaponId] || 0) + 1;
    }
  }

  recordShotHit(weaponId, damage = 0, isHeadshot = false, countHit = true) {
    const st = this.ensureStats();
    if (countHit) {
      st.shotsHit = (st.shotsHit || 0) + 1;
      if (weaponId) {
        st.weaponHits[weaponId] = (st.weaponHits[weaponId] || 0) + 1;
      }
    }
    st.totalDamage = Math.round((st.totalDamage || 0) + Math.max(0, damage));
  }

  recordDamageOnly(damage = 0) {
    const st = this.ensureStats();
    st.totalDamage = Math.round((st.totalDamage || 0) + Math.max(0, damage));
  }

  recordKill(weaponId, isHeadshot = false, roundStreak = 1) {
    const st = this.ensureStats();
    st.kills = (st.kills || 0) + 1;
    this.profile.totalKills = st.kills;
    if (isHeadshot) {
      st.headshotKills = (st.headshotKills || 0) + 1;
      if (weaponId) {
        st.weaponHeadshots[weaponId] = (st.weaponHeadshots[weaponId] || 0) + 1;
      }
    }
    if (weaponId) {
      st.weaponKills[weaponId] = (st.weaponKills[weaponId] || 0) + 1;
    }
    if (roundStreak > (st.bestKillStreak || 0)) {
      st.bestKillStreak = roundStreak;
    }
    this.saveProfile();
  }

  recordDeath() {
    const st = this.ensureStats();
    st.deaths = (st.deaths || 0) + 1;
    this.saveProfile();
  }

  recordMedal(medalKey) {
    const st = this.ensureStats();
    st[medalKey] = (st[medalKey] || 0) + 1;
    this.saveProfile();
  }

  recordRoundEnd(won, mapId) {
    const st = this.ensureStats();
    st.roundsPlayed = (st.roundsPlayed || 0) + 1;
    if (won) st.roundsWon = (st.roundsWon || 0) + 1;
    else st.roundsLost = (st.roundsLost || 0) + 1;
    if (mapId) {
      st.mapRounds[mapId] = (st.mapRounds[mapId] || 0) + 1;
    }
    this.saveProfile();
  }

  saveProfile() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.profile));
    } catch (e) {}
    this.updateHeaderStats();
  }

  addCredits(amount, reason = '') {
    const rounded = Math.round(amount);
    if (rounded > 0) {
      const st = this.ensureStats();
      st.totalCreditsEarned = (st.totalCreditsEarned || 0) + rounded;
    }
    this.profile.credits = Math.max(0, Math.round(this.profile.credits + amount));
    this.saveProfile();
    if (reason) this.showToast(`${amount >= 0 ? '+' : ''}${amount} CR — ${reason}`, 'gold');
  }

  addXP(amount) {
    this.profile.xp = Math.max(0, Math.round(this.profile.xp + amount));
    this.saveProfile();
  }

  getRankInfo() {
    let current = CS.RANKS[0];
    let next = CS.RANKS[1] || CS.RANKS[0];
    for (let i = 0; i < CS.RANKS.length; i++) {
      if (this.profile.xp >= CS.RANKS[i].minXP) {
        current = CS.RANKS[i];
        next = CS.RANKS[i + 1] || CS.RANKS[i];
      }
    }
    const progress = next === current ? 100 : Math.min(100, Math.round(((this.profile.xp - current.minXP) / (next.minXP - current.minXP)) * 100));
    return { current, next, progress };
  }

  init() {
    this.initLobby3D();
    this.bindLobbyEvents();
    this.updateHeaderStats();
    this.renderModeAndMapSelection();
    this.renderDifficultySelectors();
    this.renderCustomizer();
    this.renderCasesTab();
    this.renderShopTab();
    this.renderStatsTab();
    this.applySettingsToUI();
    this.updateCrosshairDOM();
  }

  // ==========================================================================
  // 3D INTERACTIVE LOBBY CHARACTER & WEAPON SHOWCASE
  // ==========================================================================
  initLobby3D() {
    const canvas = document.getElementById('lobby-canvas');
    if (!canvas) return;

    this.lobbyRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.lobbyRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.lobbyRenderer.setSize(window.innerWidth, window.innerHeight);
    this.lobbyRenderer.shadowMap.enabled = true;

    this.lobbyScene = new THREE.Scene();
    this.lobbyCamera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
    this.lobbyCamera.position.set(0, 1.35, 3.7);
    this.lobbyCamera.lookAt(0, 1.05, 0);

    // Hangar Lighting
    const hemi = new THREE.HemisphereLight(0xdbeafe, 0x0f172a, 0.85);
    this.lobbyScene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.35);
    keyLight.position.set(3, 5, 4);
    keyLight.castShadow = true;
    this.lobbyScene.add(keyLight);

    const rimCyan = new THREE.PointLight(0x00f0ff, 1.4, 9);
    rimCyan.position.set(-2.5, 2.4, -1.8);
    this.lobbyScene.add(rimCyan);

    const rimGold = new THREE.PointLight(0xff9900, 1.1, 9);
    rimGold.position.set(2.5, 1.6, -1.5);
    this.lobbyScene.add(rimGold);

    // Glowing Pedestal Platform
    const pedGroup = new THREE.Group();
    const baseCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 1.3, 0.14, 36),
      new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.8, roughness: 0.25 })
    );
    baseCyl.position.y = -0.07;
    baseCyl.receiveShadow = true;
    pedGroup.add(baseCyl);

    const neonRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.16, 0.018, 12, 48),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    neonRing.rotation.x = Math.PI / 2;
    neonRing.position.y = 0.01;
    pedGroup.add(neonRing);
    this.lobbyScene.add(pedGroup);

    this.lobbyStageGroup = new THREE.Group();
    this.lobbyScene.add(this.lobbyStageGroup);

    // Drag to rotate showcase model
    let lastX = 0;
    canvas.addEventListener('mousedown', (e) => {
      this.isDraggingLobby = true;
      lastX = e.clientX;
    });
    window.addEventListener('mouseup', () => { this.isDraggingLobby = false; });
    window.addEventListener('mousemove', (e) => {
      if (!this.isDraggingLobby) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      this.lobbyYaw += dx * 0.01;
    });

    window.addEventListener('resize', () => {
      if (!this.lobbyRenderer || !this.lobbyCamera) return;
      this.lobbyCamera.aspect = window.innerWidth / window.innerHeight;
      this.lobbyCamera.updateProjectionMatrix();
      this.lobbyRenderer.setSize(window.innerWidth, window.innerHeight);
    });

    this.rebuildLobbyShowcase();
    this.animateLobby();
  }

  rebuildLobbyShowcase() {
    if (!this.lobbyStageGroup) return;
    while (this.lobbyStageGroup.children.length > 0) {
      this.lobbyStageGroup.remove(this.lobbyStageGroup.children[0]);
    }

    const wId = this.profile.showcaseWeapon || 'ak47';
    const skinId = this.profile.weaponSkins[wId] || 'default';
    const knifeId = this.profile.equippedKnife || 'knife_default';
    const outfitId = this.profile.equippedOutfit || 'sas_navy';
    const gloveId = this.profile.equippedGlove || 'gloves_default';

    if (this.lobbyPreviewMode === 'weapon') {
      // Close-up 3D Weapon / Knife Inspection on Pedestal
      const wModel = CS.weaponBuilder.buildWeaponModel(wId, skinId, knifeId, gloveId, outfitId, false);
      wModel.scale.set(2.9, 2.9, 2.9);
      wModel.position.set(0, 1.15, 0.15);
      wModel.rotation.y = Math.PI / 2;
      this.lobbyStageGroup.add(wModel);
    } else {
      // Full 3D Customized Agent holding Equipped Weapon + Skin
      const agent = CS.buildAgentModel('CT', outfitId, wId, skinId, knifeId, gloveId);
      agent.position.set(0, 0, 0);
      this.lobbyStageGroup.add(agent);
    }

    // Update badge in lobby corner
    const badgeEl = document.getElementById('showcase-caption');
    if (badgeEl) {
      const wName = wId === 'knife' ? CS.KNIFE_MODELS[knifeId]?.name : CS.WEAPONS[wId]?.name;
      const sName = CS.SKINS[skinId]?.name || 'Standard';
      const oName = CS.AGENT_OUTFITS[outfitId]?.name || 'SAS';
      badgeEl.innerHTML = `<strong>${oName}</strong> &bull; ${wName} | <span style="color:#38bdf8">${sName}</span>`;
    }
  }

  animateLobby() {
    requestAnimationFrame(() => this.animateLobby());
    const lobbyEl = document.getElementById('lobby-screen');
    if (!lobbyEl || lobbyEl.classList.contains('hidden')) return;

    if (!this.isDraggingLobby) {
      this.lobbyYaw += 0.0045;
    }
    if (this.lobbyStageGroup) {
      this.lobbyStageGroup.rotation.y = this.lobbyYaw;
    }
    if (this.lobbyRenderer && this.lobbyScene && this.lobbyCamera) {
      this.lobbyRenderer.render(this.lobbyScene, this.lobbyCamera);
    }
  }

  // ==========================================================================
  // LOBBY NAVIGATION & EVENTS
  // ==========================================================================
  bindLobbyEvents() {
    // Top navigation tabs (scoped strictly to .lobby-nav buttons with data-tab!)
    document.querySelectorAll('.lobby-nav .nav-tab-btn[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        CS.audio.playUISound('click');
        document.querySelectorAll('.lobby-nav .nav-tab-btn[data-tab]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tabId = btn.dataset.tab;
        document.querySelectorAll('.lobby-tab-panel').forEach(p => p.classList.remove('active'));
        const panel = document.getElementById(`tab-${tabId}`);
        if (panel) panel.classList.add('active');

        // Automatically switch 3D preview between full Agent and Weapon closeup
        if (tabId === 'loadout') {
          this.rebuildLobbyShowcase();
        } else if (tabId === 'stats') {
          this.renderStatsTab();
        }
      });
    });

    // Player Name Callsign input & Reset Stats button on Stats tab
    const nameInput = document.getElementById('stats-player-name-input');
    if (nameInput) {
      nameInput.value = this.profile.playerName || 'StrikeCommander';
      nameInput.addEventListener('change', (e) => {
        const cleaned = (e.target.value || '').trim().slice(0, 20) || 'StrikeCommander';
        this.profile.playerName = cleaned;
        e.target.value = cleaned;
        this.saveProfile();
        this.showToast(`✓ Agenten-Rufzeichen geändert zu: ${cleaned}`, 'info');
      });
    }

    const resetStatsBtn = document.getElementById('btn-reset-stats');
    if (resetStatsBtn) {
      resetStatsBtn.addEventListener('click', () => {
        CS.audio.playUISound('click');
        if (!this._confirmResetStats) {
          this._confirmResetStats = true;
          resetStatsBtn.textContent = '⚠️ SICHER? NOCHMAL KLICKEN';
          clearTimeout(this._resetConfirmTimer);
          this._resetConfirmTimer = setTimeout(() => {
            this._confirmResetStats = false;
            resetStatsBtn.textContent = '🔄 Statistiken zurücksetzen';
          }, 3500);
          return;
        }
        this._confirmResetStats = false;
        resetStatsBtn.textContent = '🔄 Statistiken zurücksetzen';
        this.profile.stats = this.getDefaultStats();
        this.profile.totalKills = 0;
        this.saveProfile();
        this.renderStatsTab();
        this.showToast('🔄 Alle Kampfstatistiken wurden auf 0 zurückgesetzt.', 'info');
      });
    }

    // Toggle 3D showcase mode (Agent vs Weapon Zoom)
    const toggleViewBtn = document.getElementById('btn-toggle-3d-view');
    if (toggleViewBtn) {
      toggleViewBtn.addEventListener('click', () => {
        CS.audio.playUISound('click');
        this.lobbyPreviewMode = this.lobbyPreviewMode === 'agent' ? 'weapon' : 'agent';
        toggleViewBtn.textContent = this.lobbyPreviewMode === 'agent' ? '🔍 Waffen-Nahaufnahme' : '🧍 Agenten-Ansicht';
        this.rebuildLobbyShowcase();
      });
    }

    // Start Match Button
    const startBtn = document.getElementById('btn-start-match');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        CS.audio.playUISound('buy');
        const selectedMode = document.querySelector('.mode-card.selected')?.dataset.mode || 'bomb';
        const selectedMap = document.querySelector('.map-card.selected')?.dataset.map || 'de_sandstorm';
        const selectedTeam = document.querySelector('.team-pick-btn.selected')?.dataset.team || 'CT';
        const selectedDiff = this.profile.settings.difficulty || 'hard';
        CS.game.startMatch(selectedMode, selectedMap, selectedTeam, selectedDiff);
      });
    }

    // Shop category filter buttons
    document.querySelectorAll('.shop-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        CS.audio.playUISound('click');
        document.querySelectorAll('.shop-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.shopFilter = btn.dataset.filter;
        this.renderShopTab();
      });
    });

    // Settings inputs
    const sensSlider = document.getElementById('setting-sens');
    if (sensSlider) {
      sensSlider.addEventListener('input', (e) => {
        this.profile.settings.sensitivity = parseFloat(e.target.value);
        document.getElementById('setting-sens-val').textContent = this.profile.settings.sensitivity.toFixed(1);
        this.saveProfile();
      });
    }
    const volSlider = document.getElementById('setting-vol');
    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        this.profile.settings.volume = parseFloat(e.target.value);
        document.getElementById('setting-vol-val').textContent = Math.round(this.profile.settings.volume * 100) + '%';
        CS.audio.setVolume(this.profile.settings.volume);
        this.saveProfile();
      });
    }
    const chColor = document.getElementById('setting-ch-color');
    if (chColor) {
      chColor.addEventListener('input', (e) => {
        this.profile.settings.crosshairColor = e.target.value;
        this.updateCrosshairDOM();
        this.saveProfile();
      });
    }
    const botSlider = document.getElementById('setting-bots');
    if (botSlider) {
      botSlider.addEventListener('input', (e) => {
        this.profile.settings.botCount = parseInt(e.target.value, 10);
        const totalPerTeam = this.profile.settings.botCount + 1;
        document.getElementById('setting-bots-val').textContent = `${totalPerTeam}v${totalPerTeam}`;
        this.saveProfile();
      });
    }
  }

  updateHeaderStats() {
    const crEl = document.getElementById('header-credits');
    if (crEl) crEl.textContent = this.profile.credits.toLocaleString('de-DE');

    const rankInfo = this.getRankInfo();
    const rankNameEl = document.getElementById('header-rank-name');
    if (rankNameEl) rankNameEl.textContent = `${rankInfo.current.icon} ${rankInfo.current.name}`;

    const xpFill = document.getElementById('header-xp-fill');
    if (xpFill) xpFill.style.width = `${rankInfo.progress}%`;
  }

  // ==========================================================================
  // PLAY TAB: MODES, MAPS & TEAM SELECTION
  // ==========================================================================
  renderModeAndMapSelection() {
    const modeContainer = document.getElementById('mode-list');
    if (modeContainer) {
      modeContainer.innerHTML = Object.values(CS.MODES).map((m, idx) => `
        <div class="mode-card ${idx === 0 ? 'selected' : ''}" data-mode="${m.id}">
          <div class="mode-icon">${m.icon}</div>
          <div class="mode-info">
            <div class="mode-title" style="display:flex;justify-content:space-between;align-items:center;"><span>${m.name}</span><span class="diff-cr-pill">🪙 ${m.creditMult || 1}x CR</span></div>
            <div class="mode-desc">${m.desc}</div>
          </div>
        </div>
      `).join('');

      modeContainer.querySelectorAll('.mode-card').forEach(card => {
        card.addEventListener('click', () => {
          CS.audio.playUISound('click');
          modeContainer.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
        });
      });
    }

    const mapContainer = document.getElementById('map-list');
    if (mapContainer) {
      mapContainer.innerHTML = Object.values(CS.MAPS).map((mp, idx) => `
        <div class="map-card ${idx === 0 ? 'selected' : ''}" data-map="${mp.id}">
          <div class="map-preview-banner theme-${mp.theme}">
            <span class="map-code-badge">${mp.code}</span>
          </div>
          <div class="map-card-body">
            <h4>${mp.name}</h4>
            <p>${mp.subtitle}</p>
          </div>
        </div>
      `).join('');

      mapContainer.querySelectorAll('.map-card').forEach(card => {
        card.addEventListener('click', () => {
          CS.audio.playUISound('click');
          mapContainer.querySelectorAll('.map-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
        });
      });
    }

    document.querySelectorAll('.team-pick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        CS.audio.playUISound('click');
        document.querySelectorAll('.team-pick-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });
  }

  // ==========================================================================
  // CUSTOMIZER TAB: AGENT OUTFIT, GLOVES, KNIFE & WEAPON SKINS
  // ==========================================================================
  renderCustomizer() {
    // 1. Agent Outfits
    const outfitGrid = document.getElementById('customizer-outfits');
    if (outfitGrid) {
      outfitGrid.innerHTML = Object.values(CS.AGENT_OUTFITS).map(o => {
        const owned = this.profile.ownedOutfits.includes(o.id);
        const equipped = this.profile.equippedOutfit === o.id;
        const rar = CS.RARITIES[o.rarity];
        const imgUrl = CS.textures.getCosmeticPreviewDataURL('outfit', o.id);
        return `
          <div class="item-card ${equipped ? 'equipped' : ''} ${!owned ? 'locked' : ''}"
               style="border-color:${rar.color}" data-outfit="${o.id}">
            <div class="item-swatch">
              <img class="cosmetic-preview-img" src="${imgUrl}" alt="${o.name}" />
            </div>
            <div class="item-name">${o.name}</div>
            <div class="item-status">${equipped ? '✓ AUSGERÜSTET' : (owned ? 'AUSRÜSTEN' : `🔒 Im Shop (${o.price} CR)`)}</div>
          </div>
        `;
      }).join('');

      outfitGrid.querySelectorAll('.item-card').forEach(card => {
        card.addEventListener('click', () => {
          const id = card.dataset.outfit;
          if (this.profile.ownedOutfits.includes(id)) {
            CS.audio.playUISound('buy');
            this.profile.equippedOutfit = id;
            this.lobbyPreviewMode = 'agent';
            this.saveProfile();
            this.renderCustomizer();
            this.rebuildLobbyShowcase();
          } else {
            this.showToast('Dieses Agenten-Outfit kannst du im ITEM SHOP freischalten!', 'info');
          }
        });
      });
    }

    // 2. Gloves & Knives
    const gearGrid = document.getElementById('customizer-knives-gloves');
    if (gearGrid) {
      const equippedKnifeSkin = this.profile.weaponSkins?.knife || 'default';
      const knifeCards = Object.values(CS.KNIFE_MODELS).map(k => {
        const owned = this.profile.ownedKnives.includes(k.id);
        const equipped = this.profile.equippedKnife === k.id;
        const rar = CS.RARITIES[k.rarity];
        const knifeSkinToShow = equippedKnifeSkin !== 'default' ? equippedKnifeSkin : (k.previewSkin || 'default');
        const imgUrl = CS.textures.getCosmeticPreviewDataURL('knife', k.id, knifeSkinToShow);
        return `
          <div class="item-card ${equipped ? 'equipped' : ''} ${!owned ? 'locked' : ''}"
               style="border-color:${rar.color}" data-type="knife" data-id="${k.id}">
            <div class="item-swatch">
              <img class="cosmetic-preview-img" src="${imgUrl}" alt="${k.name}" />
            </div>
            <div class="item-name">${k.name}</div>
            <div class="item-status">${equipped ? '✓ AKTIVES MESSER' : (owned ? 'AUSRÜSTEN' : `🔒 ${k.price} CR`)}</div>
          </div>
        `;
      });

      const gloveCards = Object.values(CS.GLOVES).map(g => {
        const owned = this.profile.ownedGloves.includes(g.id);
        const equipped = this.profile.equippedGlove === g.id;
        const rar = CS.RARITIES[g.rarity];
        const imgUrl = CS.textures.getCosmeticPreviewDataURL('glove', g.id);
        return `
          <div class="item-card ${equipped ? 'equipped' : ''} ${!owned ? 'locked' : ''}"
               style="border-color:${rar.color}" data-type="glove" data-id="${g.id}">
            <div class="item-swatch">
              <img class="cosmetic-preview-img" src="${imgUrl}" alt="${g.name}" />
            </div>
            <div class="item-name">${g.name}</div>
            <div class="item-status">${equipped ? '✓ AKTIVE HANDSCHUHE' : (owned ? 'AUSRÜSTEN' : `🔒 ${g.price} CR`)}</div>
          </div>
        `;
      });

      gearGrid.innerHTML = [...knifeCards, ...gloveCards].join('');
      gearGrid.querySelectorAll('.item-card').forEach(card => {
        card.addEventListener('click', () => {
          const type = card.dataset.type;
          const id = card.dataset.id;
          if (type === 'knife') {
            if (this.profile.ownedKnives.includes(id)) {
              CS.audio.playUISound('buy');
              this.profile.equippedKnife = id;
              this.profile.showcaseWeapon = 'knife';
              this.saveProfile();
              this.renderCustomizer();
              this.rebuildLobbyShowcase();
            } else {
              this.showToast('Messer in Kisten ziehen oder im ITEM SHOP kaufen!', 'info');
            }
          } else if (type === 'glove') {
            if (this.profile.ownedGloves.includes(id)) {
              CS.audio.playUISound('buy');
              this.profile.equippedGlove = id;
              this.saveProfile();
              this.renderCustomizer();
              this.rebuildLobbyShowcase();
            } else {
              this.showToast('Handschuhe in Kisten ziehen oder im ITEM SHOP kaufen!', 'info');
            }
          }
        });
      });
    }

    // 3. Weapon Selector & Skin Assignment
    const weaponSelectEl = document.getElementById('customizer-weapon-list');
    if (weaponSelectEl) {
      const customizableWeapons = Object.values(CS.WEAPONS).filter(w => !w.isGrenade && !w.isC4);
      weaponSelectEl.innerHTML = customizableWeapons.map(w => `
        <button class="weapon-pill-btn ${this.customizerWeapon === w.id ? 'active' : ''}" data-wid="${w.id}">
          ${w.name}
        </button>
      `).join('');

      weaponSelectEl.querySelectorAll('.weapon-pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          CS.audio.playUISound('click');
          this.customizerWeapon = btn.dataset.wid;
          this.profile.showcaseWeapon = this.customizerWeapon;
          this.saveProfile();
          this.renderCustomizer();
          this.rebuildLobbyShowcase();
        });
      });
    }

    const skinGrid = document.getElementById('customizer-skins');
    if (skinGrid) {
      const currentEquippedSkin = this.profile.weaponSkins[this.customizerWeapon] || 'default';
      const wName = CS.WEAPONS[this.customizerWeapon]?.name || 'AK-47';
      skinGrid.innerHTML = Object.values(CS.SKINS).map(s => {
        const owned = this.profile.ownedSkins.includes(s.id);
        const equipped = currentEquippedSkin === s.id;
        const rar = CS.RARITIES[s.rarity];
        const imgUrl = CS.textures.getCosmeticPreviewDataURL('skin', s.id, this.customizerWeapon);
        return `
          <div class="item-card ${equipped ? 'equipped' : ''} ${!owned ? 'locked' : ''}"
               style="border-color:${rar.color}" data-skin="${s.id}">
            <div class="item-swatch">
              <img class="cosmetic-preview-img" src="${imgUrl}" alt="${wName} | ${s.name}" />
            </div>
            <div class="item-name">${wName} | ${s.name}</div>
            <div class="item-rarity" style="color:${rar.color}">${rar.name}</div>
            <div class="item-status">${equipped ? '✓ AUSGERÜSTET' : (owned ? 'AUSRÜSTEN' : `🔒 ${s.price} CR`)}</div>
          </div>
        `;
      }).join('');

      skinGrid.querySelectorAll('.item-card').forEach(card => {
        card.addEventListener('click', () => {
          const sId = card.dataset.skin;
          if (this.profile.ownedSkins.includes(sId)) {
            CS.audio.playUISound('buy');
            this.profile.weaponSkins[this.customizerWeapon] = sId;
            this.profile.showcaseWeapon = this.customizerWeapon;
            this.saveProfile();
            this.renderCustomizer();
            this.rebuildLobbyShowcase();
          } else {
            this.showToast('Diesen Skin kannst du in Kisten ziehen oder im Shop kaufen!', 'info');
          }
        });
      });
    }

    // Apply skin to all weapons button
    const applyAllBtn = document.getElementById('btn-apply-skin-all');
    if (applyAllBtn) {
      applyAllBtn.onclick = () => {
        const activeSkin = this.profile.weaponSkins[this.customizerWeapon] || 'default';
        Object.keys(this.profile.weaponSkins).forEach(k => {
          this.profile.weaponSkins[k] = activeSkin;
        });
        CS.audio.playUISound('buy');
        this.saveProfile();
        this.renderCustomizer();
        this.showToast(`Skin "${CS.SKINS[activeSkin].name}" auf alle Waffen ausgerüstet!`, 'gold');
      };
    }
  }

  // Helper: Render Weapon Preview Switcher Bar for Shop & Cases
  renderWeaponPreviewBars() {
    const previewOptions = [
      { id: 'auto', label: '★ Signatur-Waffe' },
      { id: 'ak47', label: 'AK-47' },
      { id: 'awp', label: 'AWP' },
      { id: 'm4a4', label: 'M4A4' },
      { id: 'm4a1s', label: 'M4A1-S' },
      { id: 'deagle', label: 'Desert Eagle' },
      { id: 'usps', label: 'USP-S' },
      { id: 'glock', label: 'Glock-18' },
      { id: 'mp9', label: 'MP9' },
      { id: 'aug', label: 'AUG' },
      { id: 'famas', label: 'FAMAS' },
      { id: 'knife', label: '★ Messer' }
    ];

    ['shop-weapon-preview-bar', 'case-weapon-preview-bar'].forEach(barId => {
      const barEl = document.getElementById(barId);
      if (!barEl) return;
      barEl.innerHTML = previewOptions.map(opt => `
        <button class="weapon-pill-btn ${this.previewWeaponOverride === opt.id ? 'active' : ''}" data-pwid="${opt.id}">
          ${opt.label}
        </button>
      `).join('');

      barEl.querySelectorAll('.weapon-pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          CS.audio.playUISound('click');
          this.previewWeaponOverride = btn.dataset.pwid;
          this.renderCasesTab();
          this.renderShopTab();
        });
      });
    });
  }

  // ==========================================================================
  // CASES & UNBOXING ROULETTE TAB ("KISTEN ÖFFNEN")
  // ==========================================================================
  renderCasesTab() {
    this.renderWeaponPreviewBars();
    const casesListEl = document.getElementById('case-selector-list');
    if (!casesListEl) return;

    casesListEl.innerHTML = CS.CASES.map(c => {
      const caseImg = CS.textures.getCosmeticPreviewDataURL('case', c.id);
      return `
        <div class="case-card ${this.selectedCaseId === c.id ? 'selected' : ''}" data-case="${c.id}" style="border-color:${c.color}">
          <div class="case-preview-wrap">
            <img class="cosmetic-preview-img" src="${caseImg}" alt="${c.name}" />
          </div>
          <div class="case-title">${c.name}</div>
          <div class="case-price">${c.price} CR</div>
          <div class="case-desc">${c.desc}</div>
        </div>
      `;
    }).join('');

    casesListEl.querySelectorAll('.case-card').forEach(card => {
      card.addEventListener('click', () => {
        if (this.isUnboxing) return;
        CS.audio.playUISound('click');
        this.selectedCaseId = card.dataset.case;
        this.renderCasesTab();
      });
    });

    const activeCase = CS.CASES.find(c => c.id === this.selectedCaseId) || CS.CASES[0];
    const contentsEl = document.getElementById('case-contents-preview');
    if (contentsEl && activeCase) {
      contentsEl.innerHTML = activeCase.items.map(it => {
        const meta = this.getCosmeticMeta(it.type, it.id, this.previewWeaponOverride);
        const rar = CS.RARITIES[it.rarity];
        const owned = this.isCosmeticOwned(it.type, it.id);
        return `
          <div class="case-loot-item" style="border-bottom: 3px solid ${rar.color}" data-type="${it.type}" data-id="${it.id}">
            <div class="loot-swatch">
              <img class="cosmetic-preview-img" src="${meta.imageUrl}" alt="${meta.name}" />
              ${owned ? '<span class="loot-owned-badge">✓ IM INVENTAR</span>' : ''}
            </div>
            <div class="loot-name">${meta.name}</div>
            <div class="loot-rar" style="color:${rar.color}">${rar.name}</div>
          </div>
        `;
      }).join('');
    }

    const openBtn = document.getElementById('btn-open-case');
    if (openBtn && activeCase) {
      openBtn.textContent = `🔓 ${activeCase.name} KAUFEN & ÖFFNEN (${activeCase.price} CR)`;
      openBtn.onclick = () => this.startCaseUnboxing(activeCase);
    }

    // Pre-populate the inline roulette strip with preview cards from the selected case
    const trackEl = document.getElementById('roulette-track');
    if (trackEl && activeCase && !this.isUnboxing) {
      const previewSlots = [];
      for (let i = 0; i < 14; i++) {
        previewSlots.push(activeCase.items[i % activeCase.items.length]);
      }
      trackEl.style.transition = 'none';
      trackEl.style.transform = 'translate3d(0px, 0, 0)';
      trackEl.innerHTML = previewSlots.map((slot, idx) => this.buildRouletteCardHTML(slot, idx)).join('');
    }
  }

  buildRouletteCardHTML(slot, idx) {
    const meta = this.getCosmeticMeta(slot.type, slot.id, this.previewWeaponOverride);
    const rar = CS.RARITIES[slot.rarity] || CS.RARITIES.milspec;
    const parts = meta.name.split(' | ');
    const weaponHdr = parts.length > 1 ? parts[0] : (slot.type === 'knife' ? '★ Messer' : (slot.type === 'glove' ? '★ Handschuhe' : 'Cosmetic'));
    const skinTitle = parts.length > 1 ? parts[1] : meta.name;

    return `
      <div class="roulette-card" data-slot-idx="${idx}" style="border-bottom: 5px solid ${rar.color}; box-shadow: inset 0 -22px 32px ${rar.glow}">
        <div class="roulette-swatch">
          <img class="cosmetic-preview-img" src="${meta.imageUrl}" alt="${meta.name}" />
        </div>
        <div class="roulette-footer">
          <div class="roulette-weapon-type" style="color:${slot.rarity === 'gold' ? '#fbbf24' : '#94a3b8'}">${weaponHdr}</div>
          <div class="roulette-title">${skinTitle}</div>
        </div>
      </div>
    `;
  }

  getCosmeticMeta(type, id, weaponOverride = null) {
    const wOverride = weaponOverride || this.previewWeaponOverride || 'auto';
    if (type === 'skin') {
      const s = CS.SKINS[id] || CS.SKINS.default;
      const wId = (wOverride && wOverride !== 'auto') ? wOverride : (s.previewWeapon || 'ak47');
      const wName = CS.WEAPONS[wId]?.name || 'AK-47';
      return {
        name: `${wName} | ${s.name}`,
        shortName: s.name,
        weaponId: wId,
        imageUrl: CS.textures.getCosmeticPreviewDataURL('skin', s.id, wId),
        swatch: `linear-gradient(135deg, ${s.primary}, ${s.secondary}, ${s.accent})`,
        price: s.price
      };
    } else if (type === 'knife') {
      const k = CS.KNIFE_MODELS[id] || CS.KNIFE_MODELS.knife_default;
      return {
        name: k.name,
        shortName: k.name,
        imageUrl: CS.textures.getCosmeticPreviewDataURL('knife', k.id, k.previewSkin || 'default'),
        swatch: `linear-gradient(135deg, #ffd700, #b45309, #1f2937)`,
        price: k.price
      };
    } else if (type === 'glove') {
      const g = CS.GLOVES[id] || CS.GLOVES.gloves_default;
      return {
        name: g.name,
        shortName: g.name,
        imageUrl: CS.textures.getCosmeticPreviewDataURL('glove', g.id),
        swatch: `linear-gradient(135deg, ${g.primary}, ${g.secondary}, ${g.accent})`,
        price: g.price
      };
    } else {
      const o = CS.AGENT_OUTFITS[id] || CS.AGENT_OUTFITS.sas_navy;
      return {
        name: `Agent | ${o.name}`,
        shortName: o.name,
        imageUrl: CS.textures.getCosmeticPreviewDataURL('outfit', o.id),
        swatch: `linear-gradient(135deg, ${o.suitColor}, ${o.visorColor})`,
        price: o.price
      };
    }
  }

  rollCaseItem(caseObj) {
    // Weighted roll by rarity
    const pool = caseObj.items.map(it => ({
      ...it,
      weight: CS.RARITIES[it.rarity]?.weight || 10
    }));
    const totalWeight = pool.reduce((s, i) => s + i.weight, 0);
    let r = Math.random() * totalWeight;
    for (const item of pool) {
      r -= item.weight;
      if (r <= 0) return item;
    }
    return pool[0];
  }

  startCaseUnboxing(caseObj) {
    if (this.isUnboxing) return;
    if (this.profile.credits < caseObj.price) {
      this.showToast(`Nicht genug Credits! Du benötigst ${caseObj.price} CR.`, 'error');
      return;
    }

    this.profile.credits -= caseObj.price;
    this.recordMedal('casesOpened');
    this.saveProfile();
    this.isUnboxing = true;
    CS.audio.playUISound('buy');
    CS.audio.playUISound('case_unlock');

    const winModal = document.getElementById('unbox-winner-modal');
    if (winModal) winModal.classList.add('hidden');

    // Open the Counter-Strike Live Case Opening Stage Modal right in front of the player!
    const stageModal = document.getElementById('cs-unbox-stage-modal');
    const stageBadge = document.getElementById('cs-unbox-stage-badge');
    const stageTitle = document.getElementById('cs-unbox-stage-title');
    const stageSub = document.getElementById('cs-unbox-stage-sub');
    const unlockBox = document.getElementById('cs-case-unlock-box');
    const unlockImg = document.getElementById('cs-case-unlock-img');

    if (stageModal) {
      if (stageTitle) stageTitle.textContent = caseObj.name.toUpperCase();
      if (stageBadge) stageBadge.textContent = '🗝️ KISTE WIRD ENTRIEGELT...';
      if (stageSub) stageSub.textContent = 'Schloss wird geöffnet — Counter-Strike Roulette startet...';
      if (unlockImg) unlockImg.src = CS.textures.getCosmeticPreviewDataURL('case', caseObj.id);
      if (unlockBox) unlockBox.style.display = 'flex';
      stageModal.classList.remove('hidden');
    }

    // Generate 48 roulette slots; index 38 is the predetermined winner!
    const winIndex = 38;
    const slots = [];
    for (let i = 0; i < 48; i++) {
      slots.push(this.rollCaseItem(caseObj));
    }
    const winner = slots[winIndex];
    this.lastUnboxedItem = winner;

    const cardsHTML = slots.map((slot, idx) => this.buildRouletteCardHTML(slot, idx)).join('');

    // Prepare BOTH the modal roulette track and the inline tab roulette track
    const modalTrackEl = document.getElementById('cs-modal-roulette-track');
    const modalViewportEl = document.getElementById('cs-modal-roulette-viewport');
    const inlineTrackEl = document.getElementById('roulette-track');
    const inlineViewportEl = document.getElementById('inline-roulette-viewport');

    [modalTrackEl, inlineTrackEl].forEach(tEl => {
      if (!tEl) return;
      tEl.style.transition = 'none';
      tEl.style.transform = 'translate3d(0px, 0, 0)';
      tEl.innerHTML = cardsHTML;
    });

    if (modalViewportEl) modalViewportEl.classList.add('spinning');
    if (inlineViewportEl) inlineViewportEl.classList.add('spinning');

    const cardWidth = 172; // 162px card width + 10px gap
    const trackPaddingLeft = 20;
    const jitter = (Math.random() - 0.5) * 58;

    const modalCards = modalTrackEl ? Array.from(modalTrackEl.querySelectorAll('.roulette-card')) : [];
    const inlineCards = inlineTrackEl ? Array.from(inlineTrackEl.querySelectorAll('.roulette-card')) : [];
    const modalNeedle = modalViewportEl ? modalViewportEl.querySelector('.roulette-needle') : null;
    const inlineNeedle = inlineViewportEl ? inlineViewportEl.querySelector('.roulette-needle') : null;

    // Begin actual reel spin after brief 380ms case-unlocking shake
    setTimeout(() => {
      if (stageBadge) stageBadge.textContent = '🎰 COUNTER-STRIKE KISTEN-ROULETTE LÄUFT';
      if (unlockBox) unlockBox.style.display = 'none';

      const modalWidth = (modalViewportEl && modalViewportEl.clientWidth) ? modalViewportEl.clientWidth : 860;
      const inlineWidth = (inlineViewportEl && inlineViewportEl.clientWidth) ? inlineViewportEl.clientWidth : 720;

      const modalTargetOffset = Math.max(0, trackPaddingLeft + (winIndex * cardWidth) - (modalWidth / 2) + (cardWidth / 2) + jitter);
      const inlineTargetOffset = Math.max(0, trackPaddingLeft + (winIndex * cardWidth) - (inlineWidth / 2) + (cardWidth / 2) + jitter);

      const spinDuration = 4800;
      const startTime = performance.now();
      let lastTickCardIdx = -1;
      let prevModalCard = null;
      let prevInlineCard = null;

      const animateRoulette = (now) => {
        if (!this.isUnboxing) return;
        const elapsed = now - startTime;
        const t = Math.min(1, Math.max(0, elapsed / spinDuration));
        // Authentic CS:GO / CS2 high-exponent deceleration curve
        const easeOut = 1 - Math.pow(1 - t, 4.55);

        const currentModalX = easeOut * modalTargetOffset;
        const currentInlineX = easeOut * inlineTargetOffset;

        if (modalTrackEl) modalTrackEl.style.transform = `translate3d(-${currentModalX.toFixed(2)}px, 0, 0)`;
        if (inlineTrackEl) inlineTrackEl.style.transform = `translate3d(-${currentInlineX.toFixed(2)}px, 0, 0)`;

        // Determine which card is currently under the center needle
        const centerPosInTrack = currentModalX + (modalWidth / 2) - trackPaddingLeft;
        const currentCardIdx = Math.max(0, Math.min(slots.length - 1, Math.floor(centerPosInTrack / cardWidth)));

        if (currentCardIdx !== lastTickCardIdx) {
          lastTickCardIdx = currentCardIdx;
          CS.audio.playUISound('tick');

          if (prevModalCard) prevModalCard.classList.remove('active-roulette-card');
          if (prevInlineCard) prevInlineCard.classList.remove('active-roulette-card');

          const curM = modalCards[currentCardIdx];
          const curI = inlineCards[currentCardIdx];
          if (curM) { curM.classList.add('active-roulette-card'); prevModalCard = curM; }
          if (curI) { curI.classList.add('active-roulette-card'); prevInlineCard = curI; }

          const passingSlot = slots[currentCardIdx];
          if (passingSlot && stageSub) {
            const pMeta = this.getCosmeticMeta(passingSlot.type, passingSlot.id, this.previewWeaponOverride);
            const pRar = CS.RARITIES[passingSlot.rarity];
            stageSub.innerHTML = `<span style="color:${pRar?.color || '#38bdf8'};font-weight:900;">${pMeta.name}</span>`;
          }

          [modalNeedle, inlineNeedle].forEach(nEl => {
            if (!nEl) return;
            nEl.classList.add('tick-pulse');
          });
          clearTimeout(this._needlePulseTimeout);
          this._needlePulseTimeout = setTimeout(() => {
            [modalNeedle, inlineNeedle].forEach(nEl => nEl && nEl.classList.remove('tick-pulse'));
          }, 50);
        }

        if (t < 1) {
          requestAnimationFrame(animateRoulette);
        } else {
          if (modalViewportEl) modalViewportEl.classList.remove('spinning');
          if (inlineViewportEl) inlineViewportEl.classList.remove('spinning');
          if (prevModalCard) prevModalCard.classList.remove('active-roulette-card');
          if (prevInlineCard) prevInlineCard.classList.remove('active-roulette-card');

          if (modalCards[winIndex]) modalCards[winIndex].classList.add('winner-roulette-card');
          if (inlineCards[winIndex]) inlineCards[winIndex].classList.add('winner-roulette-card');

          const winMeta = this.getCosmeticMeta(winner.type, winner.id, this.previewWeaponOverride);
          if (stageBadge) stageBadge.textContent = '★ GEZOGENES OBJEKT ★';
          if (stageSub) stageSub.innerHTML = `<span style="color:#fbbf24;font-weight:900;font-size:15px;">🎉 ${winMeta.name}</span>`;

          setTimeout(() => {
            if (stageModal) stageModal.classList.add('hidden');
            this.isUnboxing = false;
            this.finishCaseUnboxing(winner, caseObj);
          }, 680);
        }
      };

      requestAnimationFrame(animateRoulette);
    }, 380);
  }

  finishCaseUnboxing(winner, caseObj = null) {
    CS.audio.playUISound('unbox_win');
    const meta = this.getCosmeticMeta(winner.type, winner.id, this.previewWeaponOverride);
    const rar = CS.RARITIES[winner.rarity];

    let isDuplicate = false;
    if (winner.type === 'skin') {
      if (this.profile.ownedSkins.includes(winner.id)) isDuplicate = true;
      else this.profile.ownedSkins.push(winner.id);
    } else if (winner.type === 'knife') {
      if (this.profile.ownedKnives.includes(winner.id)) isDuplicate = true;
      else this.profile.ownedKnives.push(winner.id);
    } else if (winner.type === 'glove') {
      if (this.profile.ownedGloves.includes(winner.id)) isDuplicate = true;
      else this.profile.ownedGloves.push(winner.id);
    }

    const cashback = isDuplicate ? Math.round((meta.price || 300) * 0.45) : 0;
    if (cashback > 0) {
      this.profile.credits += cashback;
    }

    this.saveProfile();
    this.renderCustomizer();
    this.renderCasesTab();
    this.renderShopTab();

    // Show Winner Modal with High-Res Weapon Render
    const modal = document.getElementById('unbox-winner-modal');
    if (modal) {
      const floatVal = (Math.random() * 0.068).toFixed(4);
      document.getElementById('unbox-win-name').textContent = meta.name;
      document.getElementById('unbox-win-rarity').textContent = `${rar.name} • Factory New (Float: ${floatVal})`;
      document.getElementById('unbox-win-rarity').style.color = rar.color;
      const swatchEl = document.getElementById('unbox-win-swatch');
      if (swatchEl) {
        swatchEl.style.borderColor = rar.color;
        swatchEl.style.boxShadow = `0 0 28px ${rar.glow}`;
        swatchEl.innerHTML = `<img class="cosmetic-preview-img" src="${meta.imageUrl}" alt="${meta.name}" />`;
      }
      document.getElementById('unbox-win-dup').textContent = isDuplicate
        ? `Bereits im Inventar! Du erhältst +${cashback} CR Duplikat-Bonus!`
        : 'NEUES OBJEKT FREIGESCHALTET!';

      modal.classList.remove('hidden');

      document.getElementById('btn-equip-unboxed').onclick = () => {
        if (winner.type === 'skin') {
          Object.keys(this.profile.weaponSkins).forEach(w => {
            this.profile.weaponSkins[w] = winner.id;
          });
        } else if (winner.type === 'knife') {
          this.profile.equippedKnife = winner.id;
          this.profile.showcaseWeapon = 'knife';
        } else if (winner.type === 'glove') {
          this.profile.equippedGlove = winner.id;
        }
        this.saveProfile();
        this.renderCustomizer();
        this.rebuildLobbyShowcase();
        modal.classList.add('hidden');
        this.showToast(`${meta.name} sofort ausgerüstet!`, 'gold');
      };

      const reopenBtn = document.getElementById('btn-reopen-case');
      const targetCase = caseObj || CS.CASES.find(c => c.id === this.selectedCaseId) || CS.CASES[0];
      if (reopenBtn && targetCase) {
        reopenBtn.textContent = `🔄 NOCHMAL ÖFFNEN (${targetCase.price} CR)`;
        reopenBtn.onclick = () => {
          modal.classList.add('hidden');
          this.startCaseUnboxing(targetCase);
        };
      }

      document.getElementById('btn-close-unboxed').onclick = () => {
        modal.classList.add('hidden');
      };
    }
  }

  // ==========================================================================
  // DIRECT COSMETICS ITEM SHOP TAB ("ITEM SHOP")
  // ==========================================================================
  renderShopTab() {
    this.renderWeaponPreviewBars();
    const shopGrid = document.getElementById('shop-items-grid');
    if (!shopGrid) return;

    const catalog = [];
    Object.values(CS.SKINS).forEach(s => {
      if (s.price > 0) catalog.push({ type: 'skin', id: s.id, rarity: s.rarity, price: s.price, desc: s.desc });
    });
    Object.values(CS.KNIFE_MODELS).forEach(k => {
      if (k.price > 0) catalog.push({ type: 'knife', id: k.id, rarity: k.rarity, price: k.price, desc: k.desc });
    });
    Object.values(CS.AGENT_OUTFITS).forEach(o => {
      if (o.price > 0) catalog.push({ type: 'outfit', id: o.id, rarity: o.rarity, price: o.price, desc: o.desc });
    });
    Object.values(CS.GLOVES).forEach(g => {
      if (g.price > 0) catalog.push({ type: 'glove', id: g.id, rarity: g.rarity, price: g.price, desc: 'Taktische Spezial-Handschuhe für die Ego- und Agenten-Ansicht.' });
    });

    const filtered = catalog.filter(it => this.shopFilter === 'all' || it.type === this.shopFilter);

    shopGrid.innerHTML = filtered.map(item => {
      const meta = this.getCosmeticMeta(item.type, item.id, this.previewWeaponOverride);
      const rar = CS.RARITIES[item.rarity];
      const owned = this.isCosmeticOwned(item.type, item.id);
      return `
        <div class="shop-card" style="border-top: 3px solid ${rar.color}">
          <div class="shop-swatch">
            <img class="cosmetic-preview-img" src="${meta.imageUrl}" alt="${meta.name}" />
            <span class="shop-rarity-tag" style="background:${rar.color}">${rar.name}</span>
          </div>
          <div class="shop-card-body">
            <h4>${meta.name}</h4>
            <p>${item.desc}</p>
            <button class="shop-buy-btn ${owned ? 'owned' : ''}" data-type="${item.type}" data-id="${item.id}" data-price="${item.price}">
              ${owned ? '✓ IM INVENTAR (AUSRÜSTEN)' : `🛒 KAUFEN FÜR ${item.price} CR`}
            </button>
          </div>
        </div>
      `;
    }).join('');

    shopGrid.querySelectorAll('.shop-buy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        const id = btn.dataset.id;
        const price = parseInt(btn.dataset.price, 10);
        const owned = this.isCosmeticOwned(type, id);

        if (owned) {
          this.equipCosmetic(type, id);
          return;
        }
        if (this.profile.credits < price) {
          this.showToast(`Nicht genug Credits! Dir fehlen ${price - this.profile.credits} CR.`, 'error');
          return;
        }

        this.profile.credits -= price;
        if (type === 'skin') this.profile.ownedSkins.push(id);
        else if (type === 'knife') this.profile.ownedKnives.push(id);
        else if (type === 'outfit') this.profile.ownedOutfits.push(id);
        else if (type === 'glove') this.profile.ownedGloves.push(id);

        CS.audio.playUISound('buy');
        this.equipCosmetic(type, id);
        this.saveProfile();
        this.renderShopTab();
        this.renderCasesTab();
        this.renderCustomizer();
      });
    });
  }

  isCosmeticOwned(type, id) {
    if (type === 'skin') return this.profile.ownedSkins.includes(id);
    if (type === 'knife') return this.profile.ownedKnives.includes(id);
    if (type === 'outfit') return this.profile.ownedOutfits.includes(id);
    if (type === 'glove') return this.profile.ownedGloves.includes(id);
    return false;
  }

  equipCosmetic(type, id) {
    const meta = this.getCosmeticMeta(type, id);
    if (type === 'skin') {
      Object.keys(this.profile.weaponSkins).forEach(w => {
        this.profile.weaponSkins[w] = id;
      });
    } else if (type === 'knife') {
      this.profile.equippedKnife = id;
      this.profile.showcaseWeapon = 'knife';
    } else if (type === 'outfit') {
      this.profile.equippedOutfit = id;
      this.lobbyPreviewMode = 'agent';
    } else if (type === 'glove') {
      this.profile.equippedGlove = id;
    }
    this.saveProfile();
    this.rebuildLobbyShowcase();
    this.showToast(`${meta.name} ausgerüstet!`, 'gold');
  }

  // ==========================================================================
  // 5. CAREER & COMBAT STATISTICS TAB ("STATISTIKEN")
  // ==========================================================================
  renderStatsTab() {
    const st = this.ensureStats();
    const rankInfo = this.getRankInfo();

    // Update top header profile row
    const rankIconEl = document.getElementById('stats-rank-icon');
    const rankSubEl = document.getElementById('stats-rank-subtitle');
    const nameInput = document.getElementById('stats-player-name-input');
    const favPillEl = document.getElementById('stats-fav-weapon-pill');

    if (rankIconEl) rankIconEl.textContent = rankInfo.current.icon;
    if (rankSubEl) {
      rankSubEl.innerHTML = `${rankInfo.current.name} &bull; <strong>${this.profile.xp.toLocaleString('de-DE')} XP</strong> (${rankInfo.progress}% bis ${rankInfo.next.name})`;
    }
    if (nameInput && document.activeElement !== nameInput) {
      nameInput.value = this.profile.playerName || 'StrikeCommander';
    }

    // Core KPI calculations
    const kills = st.kills || 0;
    const deaths = st.deaths || 0;
    const kd = deaths > 0 ? (kills / deaths) : kills;
    const kdFormatted = kd.toFixed(2);
    const kdColor = kd >= 1.5 ? '#4ade80' : (kd >= 1.0 ? '#38bdf8' : '#fbbf24');
    const kdPct = Math.min(100, Math.round((kd / 2.5) * 100));

    const hsKills = st.headshotKills || 0;
    const hsRate = kills > 0 ? Math.round((hsKills / kills) * 100) : 0;

    const roundsPlayed = st.roundsPlayed || 0;
    const roundsWon = st.roundsWon || 0;
    const roundsLost = st.roundsLost || 0;
    const winRate = roundsPlayed > 0 ? Math.round((roundsWon / roundsPlayed) * 100) : 0;

    const shotsFired = st.shotsFired || 0;
    const shotsHit = Math.min(shotsFired, st.shotsHit || 0);
    const accuracy = shotsFired > 0 ? Math.round((shotsHit / shotsFired) * 100) : 0;

    const totalDmg = st.totalDamage || 0;
    const adr = roundsPlayed > 0 ? Math.round(totalDmg / roundsPlayed) : totalDmg;

    // 1. Render Top 6 KPI Cards
    const kpiGrid = document.getElementById('stats-kpi-grid');
    if (kpiGrid) {
      const kpis = [
        {
          label: '⚔️ K/D-VERHÄLTNIS',
          val: kdFormatted,
          sub: `${kills.toLocaleString('de-DE')} Kills / ${deaths.toLocaleString('de-DE')} Tode`,
          pct: kdPct,
          accent: kdColor
        },
        {
          label: '💀 GESAMTE KILLS & TODE',
          val: `${kills.toLocaleString('de-DE')} / ${deaths.toLocaleString('de-DE')}`,
          sub: `Beste Serie: ${st.bestKillStreak || 0} Kills in 1 Runde`,
          pct: Math.min(100, Math.round((kills / Math.max(1, kills + deaths)) * 100)),
          accent: '#38bdf8'
        },
        {
          label: '🎯 KOPFSCHUSS-QUOTE',
          val: `${hsRate}%`,
          sub: `${hsKills.toLocaleString('de-DE')} Kopfschuss-Kills`,
          pct: hsRate,
          accent: '#f59e0b'
        },
        {
          label: '🏆 RUNDEN-BILANZ (SIEGRATE)',
          val: `${winRate}%`,
          sub: `${roundsPlayed} Gespielt • ${roundsWon} S / ${roundsLost} N`,
          pct: winRate,
          accent: '#4ade80'
        },
        {
          label: '🔫 TREFFGENAUIGKEIT',
          val: `${accuracy}%`,
          sub: `${shotsHit.toLocaleString('de-DE')} Treffer / ${shotsFired.toLocaleString('de-DE')} Schüsse`,
          pct: accuracy,
          accent: '#a855f7'
        },
        {
          label: '💥 SCHADEN & Ø ADR',
          val: `${adr.toLocaleString('de-DE')} ADR`,
          sub: `${totalDmg.toLocaleString('de-DE')} Gesamtschaden`,
          pct: Math.min(100, Math.round((adr / 300) * 100)),
          accent: '#ef4444'
        }
      ];

      kpiGrid.innerHTML = kpis.map(k => `
        <div class="stats-kpi-card" style="--kpi-accent:${k.accent}">
          <div class="stats-kpi-label">${k.label}</div>
          <div class="stats-kpi-val" style="color:${k.accent}">${k.val}</div>
          <div class="stats-kpi-sub">${k.sub}</div>
          <div class="stats-kpi-bar">
            <div class="stats-kpi-bar-fill" style="width:${k.pct}%"></div>
          </div>
        </div>
      `).join('');
    }

    // 2. Render Weapon Arsenal Breakdown (Kills, Headshots & Accuracy per Weapon)
    const weaponIds = [
      'ak47', 'm4a1s', 'm4a4', 'awp', 'deagle', 'usps', 'glock',
      'mp9', 'ump45', 'famas', 'aug', 'ssg08', 'p250', 'nova', 'xm1014',
      'knife', 'he', 'molotov'
    ];

    const weaponRows = weaponIds.map(wId => {
      const wObj = CS.WEAPONS[wId] || { id: wId, name: wId.toUpperCase() };
      const wKills = st.weaponKills?.[wId] || 0;
      const wHs = st.weaponHeadshots?.[wId] || 0;
      const wShots = st.weaponShots?.[wId] || 0;
      const wHits = Math.min(wShots, st.weaponHits?.[wId] || 0);
      const wAcc = wShots > 0 ? Math.round((wHits / wShots) * 100) : 0;
      const wHsPct = wKills > 0 ? Math.round((wHs / wKills) * 100) : 0;
      return { wId, wObj, wKills, wHs, wShots, wHits, wAcc, wHsPct };
    }).sort((a, b) => (b.wKills - a.wKills) || (b.wShots - a.wShots));

    const maxWeaponKills = Math.max(1, weaponRows[0]?.wKills || 1);
    const favWeapon = weaponRows[0] && weaponRows[0].wKills > 0 ? weaponRows[0] : null;
    if (favPillEl) {
      favPillEl.textContent = favWeapon
        ? `★ Lieblingswaffe: ${favWeapon.wObj.name} (${favWeapon.wKills} Kills)`
        : '★ Lieblingswaffe: Noch keine Kills';
    }

    const wepListEl = document.getElementById('stats-weapons-list');
    if (wepListEl) {
      wepListEl.innerHTML = weaponRows.map((row, idx) => {
        const isTop = idx === 0 && row.wKills > 0;
        const barPct = row.wKills > 0 ? Math.max(6, Math.round((row.wKills / maxWeaponKills) * 100)) : 0;
        const skinId = this.profile.weaponSkins?.[row.wId] || 'default';
        const skinName = (!row.wObj.isGrenade && skinId !== 'default') ? ` | ${CS.SKINS[skinId]?.name || ''}` : '';

        let thumbUrl = '';
        if (row.wId === 'knife') {
          const kId = this.profile.equippedKnife || 'knife_default';
          thumbUrl = CS.textures.getCosmeticPreviewDataURL('knife', kId, CS.KNIFE_MODELS[kId]?.previewSkin || 'default');
        } else if (!row.wObj.isGrenade) {
          thumbUrl = CS.textures.getCosmeticPreviewDataURL('skin', skinId, row.wId);
        } else {
          thumbUrl = CS.textures.getCosmeticPreviewDataURL('skin', 'crimson_web', 'ak47');
        }

        const displayName = row.wId === 'knife'
          ? (CS.KNIFE_MODELS[this.profile.equippedKnife]?.name || 'Kampfmesser')
          : row.wObj.name;

        const subDetails = row.wObj.isGrenade
          ? `Explosiv- / Brandschaden`
          : `🎯 ${row.wHs} Kopfschüsse (${row.wHsPct}%) &bull; ${row.wShots} Schüsse (${row.wAcc}% Präzision)`;

        return `
          <div class="stats-weapon-row ${isTop ? 'top-weapon' : ''}">
            <img class="stats-wep-thumb" src="${thumbUrl}" alt="${displayName}" />
            <div>
              <div class="stats-wep-title">
                <span>${displayName}<span style="color:#38bdf8;font-size:11px;">${skinName}</span></span>
                ${isTop ? '<span style="background:#fbbf24;color:#0f172a;font-size:9.5px;padding:1px 6px;border-radius:4px;font-weight:900;">★ NR. 1</span>' : ''}
              </div>
              <div class="stats-wep-sub">${subDetails}</div>
            </div>
            <div class="stats-wep-bar-wrap">
              <div class="stats-wep-bar-track">
                <div class="stats-wep-bar-fill" style="width:${barPct}%"></div>
              </div>
            </div>
            <div class="stats-wep-kills">${row.wKills.toLocaleString('de-DE')} Kills</div>
          </div>
        `;
      }).join('');
    }

    // 3. Render Combat Medals & Bomb Operations Grid
    const medalsGrid = document.getElementById('stats-medals-grid');
    if (medalsGrid) {
      const medals = [
        { icon: '👑', name: 'ACEs (5x Kills)', val: st.aces || 0 },
        { icon: '🏆', name: '1vX Clutches', val: st.clutchesWon || 0 },
        { icon: '💥', name: 'Ultra Kills (4x)', val: st.ultraKills || 0 },
        { icon: '🔥', name: 'Triple Kills (3x)', val: st.tripleKills || 0 },
        { icon: '⚡', name: 'Double Kills (2x)', val: st.doubleKills || 0 },
        { icon: '🩸', name: 'First Bloods', val: st.firstBloods || 0 },
        { icon: '💣', name: 'C4 Platziert', val: st.bombsPlanted || 0 },
        { icon: '✂️', name: 'C4 Entschärft', val: st.bombsDefused || 0 },
        { icon: '🎖️', name: 'Beste Kill-Serie', val: st.bestKillStreak || 0 }
      ];

      medalsGrid.innerHTML = medals.map(m => `
        <div class="stats-medal-card">
          <div class="stats-medal-icon">${m.icon}</div>
          <div>
            <div class="stats-medal-val">${m.val.toLocaleString('de-DE')}</div>
            <div class="stats-medal-name">${m.name}</div>
          </div>
        </div>
      `).join('');
    }

    // 4. Render Map & Economy Career Extras
    const extraEl = document.getElementById('stats-career-extra');
    if (extraEl) {
      const totalCosmeticsOwned =
        (this.profile.ownedSkins?.length || 0) +
        (this.profile.ownedKnives?.length || 0) +
        (this.profile.ownedGloves?.length || 0) +
        (this.profile.ownedOutfits?.length || 0);
      const totalCosmeticsMax =
        Object.keys(CS.SKINS || {}).length +
        Object.keys(CS.KNIFE_MODELS || {}).length +
        Object.keys(CS.GLOVES || {}).length +
        Object.keys(CS.AGENT_OUTFITS || {}).length;

      const mapItems = Object.values(CS.MAPS || {}).map(mp => ({
        label: `🗺️ ${mp.name}`,
        val: `${(st.mapRounds?.[mp.id] || 0)} Runden`
      }));

      const careerItems = [
        ...mapItems,
        { label: '🪙 Verdiente Credits (Gesamt)', val: `${(st.totalCreditsEarned || 0).toLocaleString('de-DE')} CR` },
        { label: '📦 Geöffnete Waffenkisten', val: `${(st.casesOpened || 0).toLocaleString('de-DE')} Kisten` },
        { label: '🎨 Sammlung freigeschaltet', val: `${totalCosmeticsOwned} / ${totalCosmeticsMax} Items` },
        { label: '⭐ Karriere-Erfahrung', val: `${this.profile.xp.toLocaleString('de-DE')} XP` }
      ];

      extraEl.innerHTML = careerItems.map(it => `
        <div class="stats-extra-row">
          <span class="stats-extra-label">${it.label}</span>
          <span class="stats-extra-val">${it.val}</span>
        </div>
      `).join('');
    }
  }

  applySettingsToUI() {
    const s = this.profile.settings;
    if (document.getElementById('setting-sens')) {
      document.getElementById('setting-sens').value = s.sensitivity;
      document.getElementById('setting-sens-val').textContent = s.sensitivity.toFixed(1);
    }
    if (document.getElementById('setting-vol')) {
      document.getElementById('setting-vol').value = s.volume;
      document.getElementById('setting-vol-val').textContent = Math.round(s.volume * 100) + '%';
      CS.audio.setVolume(s.volume);
    }
    if (document.getElementById('setting-ch-color')) {
      document.getElementById('setting-ch-color').value = s.crosshairColor;
    }
    if (document.getElementById('setting-bots')) {
      document.getElementById('setting-bots').value = s.botCount;
      const t = s.botCount + 1;
      document.getElementById('setting-bots-val').textContent = `${t}v${t}`;
    }
    this.syncDifficultyControls(s.difficulty || 'hard');
  }

  renderDifficultySelectors() {
    const activeDiff = this.profile.settings.difficulty || 'hard';
    const diffs = Object.values(CS.DIFFICULTIES || {});
    if (!diffs.length) return;

    const buildDiffButtonsHTML = (currId) => diffs.map(d => `
      <button type="button" class="diff-card-btn ${d.id === currId ? 'selected' : ''}" data-diff="${d.id}" style="--diff-color:${d.color}">
        <div class="diff-card-top">
          <span class="diff-icon-name">${d.icon} ${d.name}</span>
          <span class="diff-cr-pill">🪙 ${d.creditMult}x CR</span>
        </div>
        <div class="diff-card-sub">${d.tactics}</div>
      </button>
    `).join('');

    ['difficulty-list', 'settings-difficulty-bar', 'pause-difficulty-bar'].forEach(containerId => {
      const el = document.getElementById(containerId);
      if (!el) return;
      el.innerHTML = buildDiffButtonsHTML(activeDiff);
      el.querySelectorAll('.diff-card-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const chosen = btn.dataset.diff;
          CS.audio.playUISound('click');
          this.profile.settings.difficulty = chosen;
          this.saveProfile();
          this.syncDifficultyControls(chosen);
          if (CS.game && CS.game.running) {
            CS.game.setDifficulty(chosen);
          }
        });
      });
    });

    this.updateDifficultyInfoBox(activeDiff);
  }

  syncDifficultyControls(diffId) {
    ['difficulty-list', 'settings-difficulty-bar', 'pause-difficulty-bar'].forEach(containerId => {
      const el = document.getElementById(containerId);
      if (!el) return;
      el.querySelectorAll('.diff-card-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.diff === diffId);
      });
    });
    this.updateDifficultyInfoBox(diffId);
  }

  updateDifficultyInfoBox(diffId) {
    const infoEl = document.getElementById('difficulty-tactics-info');
    if (!infoEl || !CS.DIFFICULTIES) return;
    const d = CS.DIFFICULTIES[diffId] || CS.DIFFICULTIES.hard;
    infoEl.style.borderColor = d.color;
    infoEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
        <strong style="color:${d.color};font-size:11.5px;">${d.icon} ${d.label}</strong>
        <span style="color:#fbbf24;font-weight:900;font-size:11px;">🪙 ${d.badge} &bull; ⭐ ${d.xpMult}x XP</span>
      </div>
      <div style="font-size:10.5px;color:#cbd5e1;line-height:1.3;">${d.desc}</div>
    `;
  }

  _unusedApplyEnd() {
    if (false) {
    }
  }

  updateCrosshairDOM() {
    const col = this.profile.settings.crosshairColor || '#00ff66';
    document.querySelectorAll('.ch-line, .ch-dot').forEach(el => {
      el.style.backgroundColor = col;
    });
  }

  // ==========================================================================
  // IN-GAME BUY MENU ([B] KEY)
  // ==========================================================================
  renderBuyMenu(game) {
    const container = document.getElementById('buy-menu-grid');
    if (!container) return;

    const moneyEl = document.getElementById('buy-menu-money');
    if (moneyEl) moneyEl.textContent = `$${game.player.money.toLocaleString('de-DE')}`;

    const categories = [
      { key: 'pistols', title: '1. PISTOLEN', items: ['glock', 'usps', 'p250', 'deagle'] },
      { key: 'smgs', title: '2. SMGS & SCHROT', items: ['mp9', 'ump45', 'nova', 'xm1014'] },
      { key: 'rifles', title: '3. GEWEHRE & SNIPER', items: ['famas', 'm4a1s', 'm4a4', 'ak47', 'aug', 'ssg08', 'awp'] },
      { key: 'gear', title: '4. AUSRÜSTUNG & GRANATEN', items: ['kevlar', 'helmet', 'defuse', 'he', 'flash', 'smoke', 'molotov'] }
    ];

    container.innerHTML = categories.map(cat => `
      <div class="buy-column">
        <div class="buy-col-header">${cat.title}</div>
        ${cat.items.map(id => {
          if (id === 'kevlar') {
            return `<button class="buy-item-btn" data-special="kevlar">
              <span class="b-name">🛡️ Kevlar-Weste (100 AP)</span>
              <span class="b-price">$650</span>
            </button>`;
          }
          if (id === 'helmet') {
            return `<button class="buy-item-btn" data-special="helmet">
              <span class="b-name">🪖 Kevlar + Ballistik-Helm</span>
              <span class="b-price">$1000</span>
            </button>`;
          }
          if (id === 'defuse') {
            if (game.player.team !== 'CT') return '';
            return `<button class="buy-item-btn" data-special="defuse">
              <span class="b-name">✂️ Entschärfungs-Kit (2.5s)</span>
              <span class="b-price">$400</span>
            </button>`;
          }
          const w = CS.WEAPONS[id];
          if (!w) return '';
          const skinId = this.profile.weaponSkins[id] || 'default';
          const skinName = skinId !== 'default' ? ` | ${CS.SKINS[skinId]?.name}` : '';
          const thumbHtml = !w.isGrenade
            ? `<img class="buy-weapon-thumb" src="${CS.textures.getCosmeticPreviewDataURL('skin', skinId, w.id)}" alt="${w.name}" />`
            : '';
          return `
            <button class="buy-item-btn" data-weapon="${w.id}">
              <div style="display:flex;align-items:center;gap:10px;">
                ${thumbHtml}
                <div>
                  <div class="b-name">${w.name}<span style="color:#38bdf8;font-size:11px">${skinName}</span></div>
                  <div class="b-sub">DMG: ${w.damage} • $${w.killReward || 300} Kill-Bonus</div>
                </div>
              </div>
              <span class="b-price">$${w.price}</span>
            </button>
          `;
        }).join('')}
      </div>
    `).join('');

    container.querySelectorAll('.buy-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.special) {
          game.buySpecialGear(btn.dataset.special);
        } else if (btn.dataset.weapon) {
          game.buyWeapon(btn.dataset.weapon);
        }
        this.renderBuyMenu(game);
      });
    });
  }

  // ==========================================================================
  // KILLFEED, TOASTS & SCOREBOARD ([TAB])
  // ==========================================================================
  addKillfeedEntry(killerName, killerTeam, victimName, victimTeam, weaponId, isHeadshot = false) {
    const feed = document.getElementById('killfeed');
    if (!feed) return;
    const wName = CS.WEAPONS[weaponId]?.name || weaponId.toUpperCase();
    const row = document.createElement('div');
    row.className = 'killfeed-row';
    row.innerHTML = `
      <span class="kf-team-${killerTeam}">${killerName}</span>
      <span class="kf-weapon">[${wName}${isHeadshot ? ' 🎯' : ''}]</span>
      <span class="kf-team-${victimTeam}">${victimName}</span>
    `;
    feed.appendChild(row);
    setTimeout(() => {
      if (row.parentNode) row.remove();
    }, 5500);
  }

  showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast-item toast-${type}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.remove();
    }, 3400);
  }

  renderScoreboard(game) {
    const tbodyCT = document.getElementById('sb-body-ct');
    const tbodyT = document.getElementById('sb-body-t');
    if (!tbodyCT || !tbodyT) return;

    const allParticipants = [
      {
        name: `${this.profile.playerName} (DU)`,
        team: game.player.team,
        kills: game.player.kills,
        deaths: game.player.deaths,
        assists: game.player.assists,
        money: game.player.money,
        dead: game.player.dead,
        ping: '5 ms'
      },
      ...game.bots.map(b => ({
        name: `BOT ${b.name}`,
        team: b.team,
        kills: b.kills,
        deaths: b.deaths,
        assists: b.assists,
        money: b.money,
        dead: b.dead,
        ping: 'BOT'
      }))
    ];

    const renderRows = (team) => allParticipants
      .filter(p => p.team === team)
      .sort((a, b) => b.kills - a.kills)
      .map(p => `
        <tr class="${p.dead ? 'sb-dead' : ''}">
          <td>${p.dead ? '💀 ' : ''}${p.name}</td>
          <td>${p.kills}</td>
          <td>${p.assists}</td>
          <td>${p.deaths}</td>
          <td>$${p.money}</td>
          <td>${p.ping}</td>
        </tr>
      `).join('');

    tbodyCT.innerHTML = renderRows('CT');
    tbodyT.innerHTML = renderRows('T');
  }
}

CS.ui = new UIManager();
