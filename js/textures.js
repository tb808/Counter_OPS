// ============================================================================
// COUNTER OPS: TACTICAL STRIKE - REALISTIC PBR TEXTURE & SKIN GENERATOR
// ============================================================================
window.CS = window.CS || {};

class TextureGenerator {
  constructor() {
    this.cache = {};
    this.skinCache = {};
    this.skinCanvasCache = {};
    this.previewCache = {};
  }

  createCanvas(w = 512, h = 512) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  toThreeTexture(canvas, repeatX = 1, repeatY = 1) {
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    tex.needsUpdate = true;
    return tex;
  }

  // --- REALISTIC MAP ENVIRONMENT PBR MATERIALS ---
  getMaterial(type, repeatX = 2, repeatY = 2) {
    const key = `${type}_${repeatX}_${repeatY}`;
    if (this.cache[key]) return this.cache[key];

    const c = this.createCanvas(512, 512);
    const ctx = c.getContext('2d');
    const b = this.createCanvas(512, 512);
    const bctx = b.getContext('2d');

    let roughness = 0.82;
    let metalness = 0.06;
    let bumpScale = 0.045;

    // 1. NATURAL DESERT SAND & EARTH GROUND (Organic, non-grid!)
    if (type === 'sandstone_floor' || type === 'desert_earth') {
      const grad = ctx.createRadialGradient(256, 256, 40, 256, 256, 360);
      grad.addColorStop(0, '#d8be92');
      grad.addColorStop(0.5, '#cbb082');
      grad.addColorStop(1, '#bfa171');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      bctx.fillStyle = '#808080';
      bctx.fillRect(0, 0, 512, 512);

      // Soft wind-blown sand ripples
      for (let y = 0; y < 512; y += 8) {
        ctx.fillStyle = y % 16 === 0 ? 'rgba(255,244,218,0.08)' : 'rgba(120,90,50,0.07)';
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= 512; x += 32) {
          ctx.quadraticCurveTo(x + 16, y + Math.sin(x * 0.04 + y) * 5, x + 32, y);
        }
        ctx.lineTo(512, y + 6);
        ctx.lineTo(0, y + 6);
        ctx.fill();
      }

      // Organic dirt patches, pebbles & small stones
      for (let i = 0; i < 8500; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const sz = 1 + Math.random() * 3.5;
        ctx.fillStyle = Math.random() > 0.48 ? 'rgba(250,235,205,0.16)' : 'rgba(115,86,52,0.16)';
        ctx.fillRect(x, y, sz, sz);
        bctx.fillStyle = Math.random() > 0.5 ? '#9c9c9c' : '#646464';
        bctx.fillRect(x, y, sz, sz);
      }
      // Small scattered desert stones
      for (let i = 0; i < 95; i++) {
        const x = Math.random() * 500;
        const y = Math.random() * 500;
        const r = 2 + Math.random() * 4.5;
        ctx.fillStyle = i % 2 === 0 ? '#9c825b' : '#b2976e';
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        bctx.fillStyle = '#c8c8c8';
        bctx.beginPath(); bctx.arc(x, y, r, 0, Math.PI * 2); bctx.fill();
      }
      roughness = 0.94;
      metalness = 0.02;
    }
    // 2. PAVED STONE ROAD / SIDEWALK PATHS
    else if (type === 'stone_road' || type === 'cobble_floor') {
      ctx.fillStyle = type === 'stone_road' ? '#b59c78' : '#63666c';
      ctx.fillRect(0, 0, 512, 512);
      bctx.fillStyle = '#404040';
      bctx.fillRect(0, 0, 512, 512);

      // Irregular weathered stone slabs
      const rows = 8;
      const rh = 512 / rows;
      for (let r = 0; r < rows; r++) {
        let x = 0;
        while (x < 512) {
          const w = 52 + ((r * 37 + x * 19) % 44);
          const drawW = Math.min(w, 512 - x);
          const shade = ((r * 23 + x * 13) % 28) - 14;
          if (type === 'stone_road') {
            ctx.fillStyle = `rgb(${186 + shade}, ${160 + shade}, ${122 + shade})`;
          } else {
            ctx.fillStyle = `rgb(${102 + shade}, ${105 + shade}, ${112 + shade})`;
          }
          ctx.beginPath();
          ctx.roundRect(x + 2, r * rh + 2, drawW - 4, rh - 4, 5);
          ctx.fill();

          bctx.fillStyle = '#c4c4c4';
          bctx.beginPath();
          bctx.roundRect(x + 3, r * rh + 3, drawW - 6, rh - 6, 5);
          bctx.fill();
          x += drawW;
        }
      }
      // Dust & moss in crevices
      for (let i = 0; i < 4000; i++) {
        ctx.fillStyle = 'rgba(40,35,25,0.12)';
        ctx.fillRect(Math.random() * 512, Math.random() * 512, 3, 3);
      }
      roughness = 0.85;
    }
    // 3. LUSH ORGANIC GRASS & MOSS TURF
    else if (type === 'grass_ground') {
      ctx.fillStyle = '#3b6e38';
      ctx.fillRect(0, 0, 512, 512);
      bctx.fillStyle = '#707070';
      bctx.fillRect(0, 0, 512, 512);

      for (let i = 0; i < 9000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const cols = ['#2e5a2b', '#4d8542', '#5c9649', '#346331', '#739e52'];
        ctx.fillStyle = cols[i % cols.length];
        ctx.fillRect(x, y, 2, 6);
        bctx.fillStyle = i % 2 === 0 ? '#a0a0a0' : '#585858';
        bctx.fillRect(x, y, 2, 5);
      }
      roughness = 0.92;
      metalness = 0.02;
    }
    // 4. WEATHERED STUCCO / PLASTER HOUSE WALLS (Mediterranean / Middle Eastern)
    else if (type === 'stucco_wall' || type === 'stucco_ochre' || type === 'stucco_white' || type === 'sandstone_wall') {
      const baseMap = {
        stucco_wall: '#e2cba4',
        stucco_ochre: '#d49b62',
        stucco_white: '#ebe6dc',
        sandstone_wall: '#d8be92'
      };
      ctx.fillStyle = baseMap[type] || '#e2cba4';
      ctx.fillRect(0, 0, 512, 512);
      bctx.fillStyle = '#888888';
      bctx.fillRect(0, 0, 512, 512);

      // Plaster sponge texture & subtle stains
      for (let i = 0; i < 6500; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,250,240,0.10)' : 'rgba(110,82,52,0.10)';
        ctx.fillRect(x, y, 5, 5);
        bctx.fillStyle = Math.random() > 0.5 ? '#9a9a9a' : '#707070';
        bctx.fillRect(x, y, 4, 4);
      }

      // Exposed brick/stone patches & lower dado stone trim at bottom of wall
      ctx.fillStyle = 'rgba(130, 102, 70, 0.35)';
      ctx.fillRect(0, 420, 512, 92);
      ctx.strokeStyle = 'rgba(90, 68, 44, 0.45)';
      ctx.lineWidth = 3;
      for (let x = 0; x < 512; x += 64) {
        ctx.strokeRect(x, 420, 64, 46);
        ctx.strokeRect(x - 32, 466, 64, 46);
      }

      // Subtle architectural horizontal bands
      ctx.fillStyle = 'rgba(100, 75, 48, 0.25)';
      ctx.fillRect(0, 0, 512, 16);
      ctx.fillRect(0, 414, 512, 8);
      roughness = 0.86;
    }
    // 5. AGED EUROPEAN BRICK WALL
    else if (type === 'brick_wall') {
      ctx.fillStyle = '#7c382b';
      ctx.fillRect(0, 0, 512, 512);
      bctx.fillStyle = '#303030';
      bctx.fillRect(0, 0, 512, 512);

      const rows = 16;
      const cols = 8;
      const rh = 512 / rows;
      const cw = 512 / cols;
      for (let r = 0; r < rows; r++) {
        const off = (r % 2) * (cw / 2);
        for (let col = -1; col <= cols; col++) {
          const x = col * cw + off;
          const y = r * rh;
          const shade = ((r * 29 + col * 17) % 36) - 18;
          ctx.fillStyle = `rgb(${138 + shade}, ${64 + Math.floor(shade * 0.5)}, ${48 + Math.floor(shade * 0.4)})`;
          ctx.fillRect(x + 3, y + 3, cw - 6, rh - 6);
          bctx.fillStyle = '#b8b8b8';
          bctx.fillRect(x + 3, y + 3, cw - 6, rh - 6);
        }
      }
      for (let i = 0; i < 3500; i++) {
        ctx.fillStyle = 'rgba(30,22,18,0.12)';
        ctx.fillRect(Math.random() * 512, Math.random() * 512, 5, 5);
      }
      roughness = 0.82;
    }
    // 6. TERRACOTTA ROOF TILES
    else if (type === 'roof_tiles') {
      ctx.fillStyle = '#b44c2b';
      ctx.fillRect(0, 0, 512, 512);
      bctx.fillStyle = '#505050';
      bctx.fillRect(0, 0, 512, 512);

      for (let x = 0; x < 512; x += 32) {
        const g = ctx.createLinearGradient(x, 0, x + 32, 0);
        g.addColorStop(0, '#7c2d12');
        g.addColorStop(0.5, '#d95f38');
        g.addColorStop(1, '#7c2d12');
        ctx.fillStyle = g;
        ctx.fillRect(x, 0, 32, 512);

        bctx.fillStyle = '#d0d0d0';
        bctx.fillRect(x + 6, 0, 20, 512);
      }
      for (let y = 0; y < 512; y += 48) {
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fillRect(0, y, 512, 5);
      }
      roughness = 0.72;
    }
    // 7. HIGH-TECH FACILITY METAL & TREAD FLOOR
    else if (type === 'metal_wall') {
      ctx.fillStyle = '#2d3748';
      ctx.fillRect(0, 0, 512, 512);
      bctx.fillStyle = '#808080';
      bctx.fillRect(0, 0, 512, 512);

      for (let y = 0; y < 512; y += 2) {
        ctx.fillStyle = y % 4 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
        ctx.fillRect(0, y, 512, 1);
      }
      ctx.strokeStyle = '#1a202c';
      ctx.lineWidth = 6;
      bctx.strokeStyle = '#202020';
      bctx.lineWidth = 6;
      for (let x = 0; x < 512; x += 128) {
        for (let y = 0; y < 512; y += 256) {
          ctx.strokeRect(x, y, 128, 256);
          bctx.strokeRect(x, y, 128, 256);
        }
      }
      ctx.fillStyle = '#eab308';
      ctx.fillRect(0, 468, 512, 44);
      ctx.fillStyle = '#111827';
      for (let sx = -64; sx < 576; sx += 48) {
        ctx.beginPath();
        ctx.moveTo(sx, 468); ctx.lineTo(sx + 24, 468);
        ctx.lineTo(sx, 512); ctx.lineTo(sx - 24, 512);
        ctx.closePath(); ctx.fill();
      }
      roughness = 0.38;
      metalness = 0.65;
    } else if (type === 'tread_floor') {
      ctx.fillStyle = '#1e2631';
      ctx.fillRect(0, 0, 512, 512);
      bctx.fillStyle = '#606060';
      bctx.fillRect(0, 0, 512, 512);

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      bctx.strokeStyle = '#d0d0d0';
      bctx.lineWidth = 3;
      for (let x = 0; x < 512; x += 32) {
        for (let y = 0; y < 512; y += 32) {
          ctx.beginPath();
          ctx.moveTo(x + 8, y + 16); ctx.lineTo(x + 24, y + 16);
          ctx.moveTo(x + 16, y + 8); ctx.lineTo(x + 16, y + 24);
          ctx.stroke();
          bctx.beginPath();
          ctx.moveTo(x + 8, y + 16); ctx.lineTo(x + 24, y + 16);
          bctx.stroke();
        }
      }
      roughness = 0.42;
      metalness = 0.6;
    } else if (type === 'wood_crate') {
      ctx.fillStyle = '#9c7343';
      ctx.fillRect(0, 0, 512, 512);
      bctx.fillStyle = '#808080';
      bctx.fillRect(0, 0, 512, 512);

      for (let y = 0; y < 512; y += 64) {
        ctx.fillStyle = y % 128 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
        ctx.fillRect(0, y, 512, 64);
        ctx.strokeStyle = '#4a3219';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, y, 512, 64);
        bctx.strokeStyle = '#303030';
        bctx.lineWidth = 4;
        bctx.strokeRect(0, y, 512, 64);
      }
      ctx.strokeStyle = '#6b4c28';
      ctx.lineWidth = 36;
      ctx.strokeRect(18, 18, 476, 476);
      ctx.beginPath();
      ctx.moveTo(24, 24); ctx.lineTo(488, 488);
      ctx.stroke();

      ctx.fillStyle = 'rgba(25,20,15,0.65)';
      ctx.font = 'bold 34px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('TAC-SUPPLY // 7.62', 256, 250);
      roughness = 0.78;
      metalness = 0.05;
    } else if (type === 'container_blue' || type === 'container_red' || type === 'container_teal') {
      const baseCol = type === 'container_blue' ? '#1d4ed8' : (type === 'container_red' ? '#b91c1c' : '#0f766e');
      ctx.fillStyle = baseCol;
      ctx.fillRect(0, 0, 512, 512);
      bctx.fillStyle = '#808080';
      bctx.fillRect(0, 0, 512, 512);

      for (let x = 0; x < 512; x += 32) {
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fillRect(x, 0, 14, 512);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(x + 14, 0, 6, 512);
        bctx.fillStyle = '#303030';
        bctx.fillRect(x, 0, 14, 512);
        bctx.fillStyle = '#d0d0d0';
        bctx.fillRect(x + 14, 0, 18, 512);
      }
      ctx.strokeStyle = 'rgba(15,23,42,0.7)';
      ctx.lineWidth = 20;
      ctx.strokeRect(10, 10, 492, 492);
      roughness = 0.45;
      metalness = 0.55;
    } else if (type === 'awning_red' || type === 'awning_blue' || type === 'awning_green') {
      const stripeCol = type === 'awning_red' ? '#b91c1c' : (type === 'awning_blue' ? '#1d4ed8' : '#15803d');
      for (let x = 0; x < 512; x += 64) {
        ctx.fillStyle = (x / 64) % 2 === 0 ? stripeCol : '#f8fafc';
        ctx.fillRect(x, 0, 64, 512);
      }
      roughness = 0.9;
      metalness = 0.0;
    } else if (type === 'concrete_barrier') {
      // Weathered concrete barrier with hazard caution stripes
      ctx.fillStyle = '#8f9ba8';
      ctx.fillRect(0, 0, 512, 512);
      bctx.fillStyle = '#808080';
      bctx.fillRect(0, 0, 512, 512);

      // Noise speckles & distress
      for (let i = 0; i < 400; i++) {
        const nx = Math.random() * 512, ny = Math.random() * 512;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.12)';
        ctx.fillRect(nx, ny, 3 + Math.random() * 6, 2 + Math.random() * 4);
      }
      // Diagonal hazard safety stripes band along the center
      const bandTop = 140, bandH = 230;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, bandTop, 512, bandH);
      ctx.clip();
      ctx.fillStyle = '#eab308';
      ctx.fillRect(0, bandTop, 512, bandH);
      ctx.fillStyle = '#1e293b';
      for (let x = -200; x < 720; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, bandTop);
        ctx.lineTo(x + 40, bandTop);
        ctx.lineTo(x + 40 - bandH * 0.5, bandTop + bandH);
        ctx.lineTo(x - bandH * 0.5, bandTop + bandH);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      // Dirt & weather grime along bottom edge
      const grime = ctx.createLinearGradient(0, 512, 0, 420);
      grime.addColorStop(0, 'rgba(40,30,20,0.45)');
      grime.addColorStop(1, 'rgba(40,30,20,0)');
      ctx.fillStyle = grime;
      ctx.fillRect(0, 420, 512, 92);
      roughness = 0.88;
      metalness = 0.08;
    } else if (type === 'metal_panel') {
      // Riveted steel/galvanized industrial metal
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, 0, 512, 512);
      bctx.fillStyle = '#808080';
      bctx.fillRect(0, 0, 512, 512);
      // Panel grid seams
      ctx.strokeStyle = 'rgba(15,23,42,0.8)';
      ctx.lineWidth = 6;
      ctx.strokeRect(12, 12, 488, 488);
      ctx.beginPath();
      ctx.moveTo(256, 12); ctx.lineTo(256, 500);
      ctx.moveTo(12, 256); ctx.lineTo(500, 256);
      ctx.stroke();
      // Rivets
      ctx.fillStyle = '#cbd5e1';
      for (let rx = 36; rx <= 476; rx += 70) {
        for (let ry of [28, 242, 270, 484]) {
          ctx.beginPath(); ctx.arc(rx, ry, 5, 0, Math.PI * 2); ctx.fill();
        }
      }
      roughness = 0.42;
      metalness = 0.72;
    } else if (type === 'camo_tarp') {
      // Military / cargo heavy canvas tarp
      ctx.fillStyle = '#3f4e38';
      ctx.fillRect(0, 0, 512, 512);
      bctx.fillStyle = '#808080';
      bctx.fillRect(0, 0, 512, 512);
      // Camo blotches
      const camoCols = ['#283624', '#556644', '#1f281b', '#62583e'];
      for (let i = 0; i < 28; i++) {
        ctx.fillStyle = camoCols[i % camoCols.length];
        ctx.beginPath();
        const bx = (i * 73) % 512, by = (i * 109) % 512;
        ctx.ellipse(bx, by, 36 + (i % 4) * 14, 24 + (i % 3) * 12, (i * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }
      roughness = 0.92;
      metalness = 0.02;
    }

    const mapTex = this.toThreeTexture(c, repeatX, repeatY);
    const bumpTex = this.toThreeTexture(b, repeatX, repeatY);

    const mat = new THREE.MeshStandardMaterial({
      map: mapTex,
      bumpMap: bumpTex,
      bumpScale,
      roughness,
      metalness
    });

    this.cache[key] = mat;
    return mat;
  }

  // Create Atmospheric Sky Dome Texture with Sun & Horizon Gradient
  getSkyDomeMaterial(theme = 'desert') {
    const key = `skydome_${theme}`;
    if (this.cache[key]) return this.cache[key];

    const c = this.createCanvas(1024, 512);
    const ctx = c.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 512);

    if (theme === 'desert') {
      grad.addColorStop(0.0, '#1a56db');
      grad.addColorStop(0.42, '#60a5fa');
      grad.addColorStop(0.72, '#fde68a');
      grad.addColorStop(1.0, '#d97706');
    } else if (theme === 'industrial') {
      grad.addColorStop(0.0, '#1e1b4b');
      grad.addColorStop(0.45, '#4338ca');
      grad.addColorStop(0.75, '#fb923c');
      grad.addColorStop(1.0, '#9a3412');
    } else {
      grad.addColorStop(0.0, '#090d16');
      grad.addColorStop(0.5, '#0f2942');
      grad.addColorStop(0.8, '#0284c7');
      grad.addColorStop(1.0, '#0f172a');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    // Painted wispy high-altitude clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    for (let i = 0; i < 45; i++) {
      const cx = (i * 97) % 980;
      const cy = 110 + ((i * 53) % 180);
      const rx = 45 + (i % 5) * 22;
      const ry = 10 + (i % 3) * 6;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glowing Sun disc
    const sunGrad = ctx.createRadialGradient(720, 210, 8, 720, 210, 95);
    sunGrad.addColorStop(0, 'rgba(255, 255, 240, 1.0)');
    sunGrad.addColorStop(0.3, 'rgba(254, 240, 138, 0.65)');
    sunGrad.addColorStop(1, 'rgba(254, 240, 138, 0.0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(720, 210, 95, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(c);
    const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false });
    this.cache[key] = mat;
    return mat;
  }

  // Create Bombsite Floor Decal Texture (A or B)
  getBombsiteDecalMaterial(letter = 'A') {
    const key = `bombsite_${letter}`;
    if (this.cache[key]) return this.cache[key];

    const c = this.createCanvas(512, 512);
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 512, 512);

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 14;
    ctx.setLineDash([32, 18]);
    ctx.strokeRect(24, 24, 464, 464);
    ctx.setLineDash([]);

    const grad = ctx.createRadialGradient(256, 256, 30, 256, 256, 220);
    grad.addColorStop(0, 'rgba(239, 68, 68, 0.36)');
    grad.addColorStop(1, 'rgba(239, 68, 68, 0.04)');
    ctx.fillStyle = grad;
    ctx.fillRect(24, 24, 464, 464);

    ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
    ctx.font = '900 220px "Segoe UI", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, 256, 245);

    ctx.font = 'bold 34px monospace';
    ctx.fillStyle = 'rgba(255, 220, 180, 0.85)';
    ctx.fillText(`BOMBSITE ${letter}`, 256, 415);

    const tex = new THREE.CanvasTexture(c);
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false
    });
    this.cache[key] = mat;
    return mat;
  }

  // --- PROCEDURAL WEAPON SKIN TEXTURE CANVAS (SHARED BY 3D & 2D PREVIEWS) ---
  getSkinCanvas(skinId = 'default') {
    const skin = CS.SKINS[skinId] || CS.SKINS.default;
    if (this.skinCanvasCache[skin.id]) return this.skinCanvasCache[skin.id];

    const c = this.createCanvas(512, 512);
    const ctx = c.getContext('2d');
    const p = skin.pattern;

    ctx.fillStyle = skin.primary;
    ctx.fillRect(0, 0, 512, 512);

    if (p === 'asiimov') {
      ctx.fillStyle = '#f5f6f8';
      ctx.fillRect(0, 0, 512, 512);
      // Bold orange & carbon-black geometric sci-fi stripes
      ctx.fillStyle = '#ff6600';
      ctx.beginPath();
      ctx.moveTo(0, 85); ctx.lineTo(390, 85); ctx.lineTo(275, 225); ctx.lineTo(0, 225);
      ctx.fill();

      ctx.fillStyle = '#141619';
      ctx.beginPath();
      ctx.moveTo(220, 0); ctx.lineTo(512, 0); ctx.lineTo(512, 330); ctx.lineTo(110, 330);
      ctx.fill();

      ctx.fillStyle = '#ff6600';
      ctx.beginPath();
      ctx.moveTo(0, 355); ctx.lineTo(512, 220); ctx.lineTo(512, 285); ctx.lineTo(0, 420);
      ctx.fill();

      ctx.fillStyle = '#141619';
      ctx.fillRect(0, 425, 512, 87);

      // Diagonal white & orange tech stripes
      ctx.strokeStyle = '#ff6600';
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.moveTo(30, 490); ctx.lineTo(480, 40);
      ctx.stroke();

      ctx.strokeStyle = '#f5f6f8';
      ctx.lineWidth = 7;
      ctx.strokeRect(310, 70, 96, 96);
      // Crosshair emblem
      ctx.beginPath();
      ctx.arc(135, 155, 28, 0, Math.PI * 2);
      ctx.moveTo(95, 155); ctx.lineTo(175, 155);
      ctx.moveTo(135, 115); ctx.lineTo(135, 195);
      ctx.stroke();
    } else if (p === 'fade_rainbow') {
      const grad = ctx.createLinearGradient(0, 40, 512, 470);
      grad.addColorStop(0.0, '#7928ca');
      grad.addColorStop(0.46, '#ff2a85');
      grad.addColorStop(1.0, '#ffb700');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
      // Subtle anodized sheen waves
      const sheen = ctx.createLinearGradient(0, 0, 512, 0);
      sheen.addColorStop(0, 'rgba(255,255,255,0.0)');
      sheen.addColorStop(0.5, 'rgba(255,255,255,0.22)');
      sheen.addColorStop(1, 'rgba(255,255,255,0.0)');
      ctx.fillStyle = sheen;
      ctx.fillRect(0, 0, 512, 512);
    } else if (p === 'fade_metallic') {
      const grad = ctx.createLinearGradient(0, 0, 512, 380);
      grad.addColorStop(0.0, '#1c120c');
      grad.addColorStop(0.45, '#b85d14');
      grad.addColorStop(0.8, '#ffae00');
      grad.addColorStop(1.0, '#ffe082');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
    } else if (p === 'dragon_lore') {
      const grad = ctx.createLinearGradient(0, 0, 512, 0);
      grad.addColorStop(0, '#c8a438');
      grad.addColorStop(0.55, '#ead076');
      grad.addColorStop(1, '#55602b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      // Celtic knotwork checker trim along top & bottom
      for (let x = 0; x < 512; x += 20) {
        ctx.fillStyle = (x / 20) % 2 === 0 ? '#2b2210' : '#f5dc82';
        ctx.fillRect(x, 12, 20, 22);
        ctx.fillRect(x, 478, 20, 22);
        ctx.fillStyle = (x / 20) % 2 !== 0 ? '#2b2210' : '#d4af37';
        ctx.fillRect(x, 34, 20, 12);
        ctx.fillRect(x, 466, 20, 12);
      }

      // Red & orange dragon silhouette + fire breath across center
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.moveTo(45, 290);
      ctx.quadraticCurveTo(130, 140, 230, 230);
      ctx.quadraticCurveTo(310, 130, 415, 210);
      ctx.lineTo(485, 165);
      ctx.lineTo(455, 260);
      ctx.quadraticCurveTo(350, 340, 240, 285);
      ctx.quadraticCurveTo(140, 370, 45, 290);
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#1f1608';
      ctx.stroke();

      // Dragon flames
      ctx.fillStyle = '#ff9900';
      for (let i = 0; i < 9; i++) {
        ctx.beginPath();
        ctx.moveTo(110 + i * 42, 255);
        ctx.quadraticCurveTo(135 + i * 42, 165, 165 + i * 40, 245);
        ctx.quadraticCurveTo(135 + i * 42, 325, 110 + i * 42, 255);
        ctx.fill();
      }
    } else if (p === 'hyper_beast') {
      const grad = ctx.createRadialGradient(256, 240, 20, 256, 256, 340);
      grad.addColorStop(0, '#ff007b');
      grad.addColorStop(0.45, '#7928ca');
      grad.addColorStop(0.78, '#00d4ff');
      grad.addColorStop(1, '#090618');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      // Psychedelic neon tendrils
      const cols = ['#00f0ff', '#ff007b', '#7bff00', '#ffbe0b'];
      for (let i = 0; i < 14; i++) {
        ctx.strokeStyle = cols[i % cols.length];
        ctx.lineWidth = 10 - (i % 4) * 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 60 + i * 30);
        ctx.bezierCurveTo(170, 10 + i * 35, 340, 480 - i * 30, 512, 90 + i * 26);
        ctx.stroke();
      }
      // Monster fangs row
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 4;
      for (let i = 0; i < 9; i++) {
        ctx.beginPath();
        ctx.moveTo(36 + i * 48, 190);
        ctx.lineTo(60 + i * 48, 315);
        ctx.lineTo(84 + i * 48, 190);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      // Glowing beast eye
      ctx.fillStyle = '#7bff00';
      ctx.beginPath();
      ctx.ellipse(355, 135, 34, 18, -0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.ellipse(355, 135, 10, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (p === 'printstream') {
      ctx.fillStyle = '#f4f6fa';
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = '#121316';
      ctx.fillRect(0, 290, 512, 222);
      // Iridescent pearlescent strip
      const pGrad = ctx.createLinearGradient(0, 240, 512, 290);
      pGrad.addColorStop(0, '#67e8f9');
      pGrad.addColorStop(0.5, '#f0abfc');
      pGrad.addColorStop(1, '#fde68a');
      ctx.fillStyle = pGrad;
      ctx.fillRect(0, 242, 512, 42);

      ctx.fillStyle = '#121316';
      ctx.font = '900 74px "Segoe UI", sans-serif';
      ctx.fillText('XX // CS-OPS', 28, 135);
      ctx.font = 'bold 28px monospace';
      ctx.fillText('PRNT_STRM // MK.II', 32, 205);

      ctx.fillStyle = '#f4f6fa';
      ctx.font = '900 54px monospace';
      ctx.fillText('PEARL.TECH_01', 28, 395);
      // Tech hazard / barcode blocks
      for (let x = 30; x < 470; x += 22) {
        ctx.fillRect(x, 430, (x % 44 === 0) ? 14 : 6, 42);
      }
    } else if (p === 'crimson_web') {
      const g = ctx.createRadialGradient(256, 256, 20, 256, 256, 360);
      g.addColorStop(0, '#c81018');
      g.addColorStop(1, '#6e090e');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 512, 512);

      ctx.strokeStyle = '#0e0e11';
      ctx.lineWidth = 3.5;
      const centers = [[190, 210], [380, 140]];
      centers.forEach(([cx, cy]) => {
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(a) * 340, cy + Math.sin(a) * 340);
          ctx.stroke();
        }
        for (let r = 28; r < 300; r += 34) {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
    } else if (p === 'case_hardened') {
      ctx.fillStyle = '#d49b35';
      ctx.fillRect(0, 0, 512, 512);
      // Deterministic Blue Gem & purple heat-tempering blotches
      for (let i = 0; i < 32; i++) {
        const x = ((i * 97 + 43) % 480) + 16;
        const y = ((i * 137 + 71) % 480) + 16;
        const rad = 55 + (i % 5) * 24;
        const g = ctx.createRadialGradient(x, y, 6, x, y, rad);
        g.addColorStop(0, '#00a2ff');
        g.addColorStop(0.45, '#2563eb');
        g.addColorStop(0.75, '#7e22ce');
        g.addColorStop(1, 'rgba(212,155,53,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (p === 'redline') {
      ctx.fillStyle = '#131519';
      ctx.fillRect(0, 0, 512, 512);
      // Carbon fiber weave
      for (let y = 0; y < 512; y += 12) {
        for (let x = 0; x < 512; x += 12) {
          ctx.fillStyle = ((x + y) / 12) % 2 === 0 ? '#22262f' : '#181b22';
          ctx.fillRect(x, y, 10, 6);
        }
      }
      // Racing red pinstripes
      ctx.fillStyle = '#ff1722';
      ctx.fillRect(0, 145, 512, 18);
      ctx.fillRect(0, 174, 512, 7);
      ctx.fillRect(0, 295, 512, 16);
      ctx.fillRect(0, 322, 512, 6);
      // Diagonal red accent slash
      ctx.beginPath();
      ctx.moveTo(310, 0); ctx.lineTo(355, 0); ctx.lineTo(210, 512); ctx.lineTo(165, 512);
      ctx.fill();
    } else if (p === 'neon_rider') {
      ctx.fillStyle = '#100520';
      ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
      ctx.lineWidth = 3;
      for (let i = 0; i < 512; i += 36) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
      }
      const g = ctx.createLinearGradient(0, 80, 512, 420);
      g.addColorStop(0, '#ff00aa');
      g.addColorStop(0.5, '#9d4edd');
      g.addColorStop(1, '#00f0ff');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 150); ctx.lineTo(512, 50); ctx.lineTo(512, 230); ctx.lineTo(0, 330);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'italic 900 68px "Segoe UI", sans-serif';
      ctx.fillText('NEON // RIDER', 24, 245);
    } else if (p === 'emerald') {
      const g = ctx.createLinearGradient(0, 0, 512, 512);
      g.addColorStop(0, '#003d1e');
      g.addColorStop(0.35, '#00c853');
      g.addColorStop(0.68, '#69f0ae');
      g.addColorStop(1, '#004d25');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 20; i++) {
        const rx = (i * 83) % 512;
        const ry = (i * 113) % 512;
        const rg = ctx.createRadialGradient(rx, ry, 5, rx, ry, 95);
        rg.addColorStop(0, 'rgba(105, 240, 174, 0.45)');
        rg.addColorStop(1, 'rgba(0, 77, 37, 0)');
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(rx, ry, 95, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (p === 'gold_engraved') {
      const g = ctx.createLinearGradient(0, 0, 512, 512);
      g.addColorStop(0, '#b47b16');
      g.addColorStop(0.3, '#ffd700');
      g.addColorStop(0.55, '#fff3b0');
      g.addColorStop(0.8, '#d4af37');
      g.addColorStop(1, '#784b08');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 512, 512);
      // Intricate arabesque scrollwork rings
      ctx.strokeStyle = 'rgba(92, 54, 6, 0.55)';
      ctx.lineWidth = 4;
      for (let y = 32; y < 512; y += 64) {
        for (let x = 32; x < 512; x += 64) {
          ctx.beginPath();
          ctx.arc(x, y, 26, 0, Math.PI * 1.65);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x, y, 14, Math.PI * 0.4, Math.PI * 2);
          ctx.stroke();
        }
      }
    } else if (p === 'hex_grid') {
      const g = ctx.createLinearGradient(0, 0, 512, 512);
      g.addColorStop(0, '#0c1c3d');
      g.addColorStop(0.5, '#1d4ed8');
      g.addColorStop(1, '#09152e');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      const sz = 28;
      for (let y = 0; y < 512 + sz; y += sz * 1.5) {
        for (let x = 0; x < 512 + sz; x += sz * 1.732) {
          const ox = x + (Math.round(y / (sz * 1.5)) % 2) * (sz * 0.866);
          ctx.beginPath();
          for (let s = 0; s < 6; s++) {
            const ang = (s * Math.PI) / 3;
            const px = ox + Math.cos(ang) * (sz * 0.82);
            const py = y + Math.sin(ang) * (sz * 0.82);
            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
    } else if (p === 'camo_stripes') {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, 0, 512, 512);
      const stripeCols = ['#64748b', '#1e293b', '#94a3b8'];
      for (let i = 0; i < 24; i++) {
        ctx.fillStyle = stripeCols[i % stripeCols.length];
        ctx.beginPath();
        const sy = (i * 45) % 560 - 40;
        ctx.moveTo(0, sy);
        ctx.lineTo(220, sy + 65);
        ctx.lineTo(512, sy - 20);
        ctx.lineTo(512, sy + 28);
        ctx.lineTo(220, sy + 110);
        ctx.lineTo(0, sy + 42);
        ctx.closePath();
        ctx.fill();
      }
    } else if (p === 'standard') {
      const g = ctx.createLinearGradient(0, 0, 0, 512);
      g.addColorStop(0, '#333840');
      g.addColorStop(0.5, '#22252a');
      g.addColorStop(1, '#15171b');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 512, 512);
    } else {
      // Digital Camo (Sandstorm Digital etc.)
      ctx.fillStyle = skin.primary;
      ctx.fillRect(0, 0, 512, 512);
      ctx.fillStyle = skin.secondary;
      for (let i = 0; i < 110; i++) {
        ctx.fillRect((i * 79) % 480, (i * 53) % 480, 48, 26);
      }
      ctx.fillStyle = skin.accent;
      for (let i = 0; i < 80; i++) {
        ctx.fillRect((i * 113) % 480, (i * 67) % 480, 32, 34);
      }
    }

    this.skinCanvasCache[skin.id] = c;
    return c;
  }

  // --- PROCEDURAL WEAPON SKIN MATERIAL GENERATOR ---
  getWeaponSkinMaterial(skinId = 'default', part = 'body') {
    const skin = CS.SKINS[skinId] || CS.SKINS.default;
    const key = `skin_${skin.id}_${part}`;
    if (this.skinCache[key]) return this.skinCache[key];

    if (part === 'dark_metal') {
      const m = new THREE.MeshStandardMaterial({
        color: 0x1a1d22,
        metalness: 0.78,
        roughness: 0.34
      });
      this.skinCache[key] = m;
      return m;
    }

    const c = this.getSkinCanvas(skin.id);
    const tex = this.toThreeTexture(c, 1, 1);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      metalness: skin.metalness,
      roughness: skin.roughness
    });

    this.skinCache[key] = mat;
    return mat;
  }

  // ==========================================================================
  // CS2 PANORAMA STUDIO WEAPON & COSMETIC PREVIEW RENDERER (DATA-URL IMAGES)
  // Generates realistic Counter-Strike style studio weapon images showing
  // the exact skin on the weapon body, knives, gloves, agent outfits & cases!
  // ==========================================================================
  getCosmeticPreviewDataURL(type, id, weaponOverride = null) {
    const cacheKey = `${type}__${id}__${weaponOverride || 'auto'}`;
    if (this.previewCache[cacheKey]) return this.previewCache[cacheKey];

    const W = 420;
    const H = 210;
    const c = this.createCanvas(W, H);
    const ctx = c.getContext('2d');

    // Determine Rarity for Studio Rim Glow
    let rarityKey = 'milspec';
    if (type === 'skin') rarityKey = CS.SKINS[id]?.rarity || 'milspec';
    else if (type === 'knife') rarityKey = CS.KNIFE_MODELS[id]?.rarity || 'gold';
    else if (type === 'glove') rarityKey = CS.GLOVES[id]?.rarity || 'covert';
    else if (type === 'outfit') rarityKey = CS.AGENT_OUTFITS[id]?.rarity || 'restricted';
    const rar = CS.RARITIES[rarityKey] || CS.RARITIES.milspec;

    // 1. Studio Backdrop + Subtle Carbon Grid + Rarity Spotlight
    const bgGrad = ctx.createRadialGradient(W * 0.5, H * 0.48, 12, W * 0.5, H * 0.5, W * 0.65);
    bgGrad.addColorStop(0, '#1e293b');
    bgGrad.addColorStop(0.65, '#0f172a');
    bgGrad.addColorStop(1, '#060911');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle diagonal studio lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    for (let x = -H; x < W + H; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x - H, H);
      ctx.stroke();
    }

    // Rarity ambient spotlight glow behind weapon
    const glowGrad = ctx.createRadialGradient(W * 0.5, H * 0.54, 6, W * 0.5, H * 0.54, 155);
    glowGrad.addColorStop(0, rar.glow || 'rgba(56,189,248,0.45)');
    glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, W, H);

    // Studio floor shadow ellipse
    ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
    ctx.beginPath();
    ctx.ellipse(W * 0.5, H - 18, 138, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Dispatch by cosmetic type
    if (type === 'skin') {
      const skin = CS.SKINS[id] || CS.SKINS.default;
      const wId = (weaponOverride && weaponOverride !== 'auto') ? weaponOverride : (skin.previewWeapon || 'ak47');
      if (wId === 'knife') {
        this._drawKnifeStudioRender(ctx, 'knife_karambit', skin.id, W, H);
      } else {
        this._drawWeaponStudioRender(ctx, wId, skin.id, W, H);
      }
      // Subtle weapon model badge in top-right corner
      const wObj = CS.WEAPONS[wId];
      if (wObj) {
        this._drawCornerTag(ctx, wObj.name.toUpperCase(), W, H);
      }
    } else if (type === 'knife') {
      const k = CS.KNIFE_MODELS[id] || CS.KNIFE_MODELS.knife_default;
      const skinId = (weaponOverride && weaponOverride !== 'auto') ? weaponOverride : (k.previewSkin || 'default');
      this._drawKnifeStudioRender(ctx, k.id, skinId, W, H);
      this._drawCornerTag(ctx, '★ MELEE SPECIAL', W, H);
    } else if (type === 'glove') {
      this._drawGloveStudioRender(ctx, id, W, H);
      this._drawCornerTag(ctx, '★ TACTICAL GLOVES', W, H);
    } else if (type === 'outfit') {
      this._drawOutfitStudioRender(ctx, id, W, H);
      this._drawCornerTag(ctx, 'AGENT OUTFIT', W, H);
    } else if (type === 'case') {
      this._drawCaseStudioRender(ctx, id, W, H);
    }

    const url = c.toDataURL('image/png');
    this.previewCache[cacheKey] = url;
    return url;
  }

  _drawCornerTag(ctx, label, W, H) {
    ctx.save();
    ctx.font = '800 10.5px "Segoe UI", sans-serif';
    const tw = ctx.measureText(label).width;
    ctx.fillStyle = 'rgba(9, 13, 22, 0.72)';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(W - tw - 20, 8, tw + 12, 18, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, W - 14, 17);
    ctx.restore();
  }

  // Helper: Fill a closed path with the procedural skin canvas + 3D cylindrical lighting
  _fillPathWithSkin(ctx, skinCanvas, skinObj, bbox) {
    const { x, y, w, h } = bbox;
    ctx.save();
    ctx.clip();

    // Draw the procedural skin texture stretched across the weapon body bounding box
    ctx.drawImage(skinCanvas, x - 12, y - 20, w + 24, h + 40);

    // 3D Cylindrical top-to-bottom lighting & bevel shadow
    const shadeGrad = ctx.createLinearGradient(0, y, 0, y + h);
    shadeGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.36)');
    shadeGrad.addColorStop(0.18, 'rgba(255, 255, 255, 0.06)');
    shadeGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.0)');
    shadeGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0.58)');
    ctx.fillStyle = shadeGrad;
    ctx.fillRect(x - 10, y - 10, w + 20, h + 20);

    // Specular metallic diagonal sheen for high-metalness skins
    if ((skinObj?.metalness || 0.5) > 0.55) {
      const spec = ctx.createLinearGradient(x, y, x + w * 0.7, y + h);
      spec.addColorStop(0.0, 'rgba(255,255,255,0)');
      spec.addColorStop(0.45, 'rgba(255,255,255,0.24)');
      spec.addColorStop(0.55, 'rgba(255,255,255,0)');
      ctx.fillStyle = spec;
      ctx.fillRect(x - 10, y - 10, w + 20, h + 20);
    }

    ctx.restore();

    // Crisp outer metallic edge contour
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  _getGunmetalGrad(ctx, y1, y2) {
    const g = ctx.createLinearGradient(0, y1, 0, y2);
    g.addColorStop(0.0, '#475569');
    g.addColorStop(0.25, '#1e293b');
    g.addColorStop(0.65, '#0f172a');
    g.addColorStop(1.0, '#334155');
    return g;
  }

  // --- DETAILED WEAPON STUDIO RENDERS (AK-47, AWP, M4A4, M4A1-S, DEAGLE, USP-S, GLOCK, MP9, ETC.) ---
  _drawWeaponStudioRender(ctx, weaponId, skinId, W, H) {
    const skin = CS.SKINS[skinId] || CS.SKINS.default;
    const skinCanvas = this.getSkinCanvas(skin.id);
    const isDefault = skin.id === 'default';

    ctx.save();
    // Slight dynamic CS2 showcase tilt (-3 degrees)
    ctx.translate(W / 2, H / 2 + 2);
    ctx.rotate(-0.045);
    ctx.translate(-W / 2, -H / 2 - 2);

    // 1A. AWP (ARCTIC WARFARE MAGNUM SNIPER RIFLE)
    if (weaponId === 'awp') {
      // Heavy Fluted Barrel & Dual-Chamber Muzzle Brake
      ctx.fillStyle = this._getGunmetalGrad(ctx, 76, 92);
      ctx.fillRect(275, 80, 118, 9);
      ctx.fillRect(386, 75, 20, 19);
      ctx.fillStyle = '#090d16';
      ctx.fillRect(390, 78, 4, 13);
      ctx.fillRect(398, 78, 4, 13);

      // Folded Steel Bipod under forend
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(246, 108, 52, 7);
      ctx.beginPath();
      ctx.arc(296, 113, 6, 0, Math.PI * 2);
      ctx.fill();

      // Box Magazine & Trigger Guard
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(172, 108, 38, 28);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(142, 108, 24, 16);

      // Main AWP Thumbhole Chassis (SKINNED!)
      ctx.beginPath();
      ctx.moveTo(20, 82);
      ctx.lineTo(96, 82);
      ctx.lineTo(118, 74);
      ctx.lineTo(286, 74);
      ctx.lineTo(278, 106);
      ctx.lineTo(154, 110);
      ctx.lineTo(142, 152);
      ctx.lineTo(122, 152);
      ctx.lineTo(126, 122);
      ctx.lineTo(94, 132);
      ctx.lineTo(20, 138);
      ctx.closePath();

      // Thumbhole cutout in stock
      ctx.moveTo(96, 98);
      ctx.quadraticCurveTo(116, 98, 116, 116);
      ctx.quadraticCurveTo(96, 120, 92, 106);
      ctx.closePath();

      this._fillPathWithSkin(ctx, skinCanvas, skin, { x: 18, y: 70, w: 272, h: 86 });

      // Buttpad & Cheekpad
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(16, 82, 8, 56);
      ctx.fillRect(42, 75, 44, 8);

      // Bolt handle & Receiver ejection port
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(156, 78, 38, 6);
      ctx.fillStyle = '#090d16';
      ctx.beginPath(); ctx.arc(154, 89, 5, 0, Math.PI * 2); ctx.fill();

      // Giant 50mm Telescopic Sniper Scope
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(160, 60, 10, 15);
      ctx.fillRect(224, 60, 10, 15);
      ctx.fillStyle = this._getGunmetalGrad(ctx, 44, 64);
      ctx.fillRect(128, 49, 130, 11);
      ctx.fillRect(190, 40, 15, 10);

      ctx.beginPath();
      ctx.moveTo(112, 44); ctx.lineTo(132, 49); ctx.lineTo(132, 60); ctx.lineTo(112, 65); ctx.closePath();
      ctx.moveTo(248, 49); ctx.lineTo(280, 41); ctx.lineTo(280, 68); ctx.lineTo(248, 60); ctx.closePath();
      this._fillPathWithSkin(ctx, skinCanvas, skin, { x: 112, y: 40, w: 170, h: 30 });

      const lensGrad = ctx.createLinearGradient(276, 42, 282, 67);
      lensGrad.addColorStop(0, '#38bdf8');
      lensGrad.addColorStop(0.5, '#0284c7');
      lensGrad.addColorStop(1, '#6ee7b7');
      ctx.fillStyle = lensGrad;
      ctx.fillRect(277, 42, 4, 25);
    }

    // 1B. SSG 08 (SCOUT LIGHTWEIGHT SKELETON BOLT-ACTION SNIPER)
    else if (weaponId === 'ssg08') {
      // Stainless Fluted Free-Float Barrel
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(262, 82, 134, 5.5);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(390, 80, 12, 9.5); // Thread protector muzzle

      // Compact Magazine & Angled Tactical Pistol Grip
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(184, 102, 24, 22);
      ctx.beginPath();
      ctx.moveTo(134, 102); ctx.lineTo(154, 102); ctx.lineTo(142, 148); ctx.lineTo(122, 146); ctx.closePath();
      ctx.fill();

      // Lightweight Skeletonized Chassis + KeyMod Forend (SKINNED!)
      ctx.beginPath();
      // Skeleton Stock with open triangle cutout
      ctx.moveTo(28, 86);
      ctx.lineTo(124, 80);
      ctx.lineTo(266, 76);
      ctx.lineTo(260, 98);
      ctx.lineTo(134, 102);
      ctx.lineTo(106, 118);
      ctx.lineTo(28, 126);
      ctx.closePath();
      // Skeleton stock cutout window
      ctx.moveTo(46, 96);
      ctx.lineTo(98, 92);
      ctx.lineTo(96, 108);
      ctx.lineTo(46, 114);
      ctx.closePath();
      this._fillPathWithSkin(ctx, skinCanvas, skin, { x: 26, y: 74, w: 244, h: 56 });

      // Adjustable Cheek Riser & KeyMod Forend Slots
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(52, 74, 46, 7);
      for (let kx = 196; kx < 254; kx += 14) {
        ctx.fillRect(kx, 85, 8, 4);
      }

      // Compact Scout Scope
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(156, 64, 8, 14);
      ctx.fillRect(208, 64, 8, 14);
      ctx.fillRect(138, 55, 96, 9);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(232, 54, 4, 11);
    }

    // 2. AK-47 ASSAULT RIFLE
    else if (weaponId === 'ak47') {
      // Barrel, Gas Tube & Front Sight Triangle
      ctx.fillStyle = this._getGunmetalGrad(ctx, 74, 98);
      ctx.fillRect(298, 86, 94, 7); // Main barrel
      ctx.fillRect(294, 75, 50, 6); // Gas tube
      // Angled gas block
      ctx.beginPath();
      ctx.moveTo(340, 75); ctx.lineTo(352, 86); ctx.lineTo(338, 86); ctx.closePath();
      ctx.fill();
      // Iconic AK Front Sight Triangle
      ctx.beginPath();
      ctx.moveTo(368, 86); ctx.lineTo(376, 62); ctx.lineTo(384, 62); ctx.lineTo(386, 86); ctx.closePath();
      ctx.fill();
      // Slanted muzzle compensator & cleaning rod
      ctx.fillRect(390, 84, 10, 9);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(302, 94, 82, 2);

      // Curved Banana Magazine (Skinned or Bakelite Orange/Dark)
      ctx.beginPath();
      ctx.moveTo(186, 108);
      ctx.quadraticCurveTo(196, 152, 226, 182);
      ctx.lineTo(252, 168);
      ctx.quadraticCurveTo(222, 140, 216, 108);
      ctx.closePath();
      if (isDefault) {
        ctx.fillStyle = '#7c2d12';
        ctx.fill();
      } else {
        this._fillPathWithSkin(ctx, skinCanvas, skin, { x: 184, y: 108, w: 70, h: 76 });
      }
      // Magazine ribs
      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(196, 126); ctx.lineTo(222, 122);
      ctx.moveTo(204, 146); ctx.lineTo(232, 138);
      ctx.moveTo(214, 164); ctx.lineTo(242, 154);
      ctx.stroke();

      // Trigger Guard & Pistol Grip
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.2;
      ctx.strokeRect(152, 108, 28, 16);
      ctx.beginPath();
      ctx.moveTo(126, 108); ctx.lineTo(150, 108); ctx.lineTo(136, 158); ctx.lineTo(112, 154); ctx.closePath();
      ctx.fillStyle = isDefault ? '#5c3418' : '#1e293b';
      ctx.fill();

      // Buttstock + Receiver + Handguard (MAIN SKINNED BODY!)
      ctx.beginPath();
      // Buttstock
      ctx.moveTo(26, 92);
      ctx.lineTo(116, 80);
      ctx.lineTo(116, 106);
      ctx.lineTo(26, 136);
      ctx.closePath();
      // Receiver + Dust Cover + Handguard
      ctx.moveTo(116, 74);
      ctx.quadraticCurveTo(175, 68, 232, 73);
      ctx.lineTo(302, 74);
      ctx.lineTo(302, 104);
      ctx.lineTo(232, 106);
      ctx.lineTo(228, 112);
      ctx.lineTo(116, 110);
      ctx.closePath();

      if (isDefault) {
        // Classic AK wood stock/handguard + dark steel receiver
        ctx.fillStyle = '#26292e';
        ctx.fillRect(116, 72, 118, 38);
        ctx.fillStyle = '#7a441e';
        ctx.beginPath();
        ctx.moveTo(26, 92); ctx.lineTo(116, 80); ctx.lineTo(116, 106); ctx.lineTo(26, 136); ctx.closePath();
        ctx.fill();
        ctx.fillRect(234, 74, 68, 30);
      } else {
        this._fillPathWithSkin(ctx, skinCanvas, skin, { x: 24, y: 68, w: 282, h: 72 });
      }

      // AK Mechanical Details (Ejection port, bolt handle, fire selector, handguard vents)
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(178, 78, 44, 7);
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(142, 92, 56, 8); // Receiver dimple
      // Handguard cooling slots
      ctx.fillRect(248, 82, 12, 5);
      ctx.fillRect(265, 82, 12, 5);
      ctx.fillRect(282, 82, 12, 5);
      // Buttpad
      ctx.fillStyle = '#090d16';
      ctx.fillRect(22, 92, 6, 44);
    }

    // 3. M4A4 & M4A1-S RIFLES
    else if (weaponId === 'm4a4' || weaponId === 'm4a1s') {
      const isSilenced = weaponId === 'm4a1s';

      // Barrel & Suppressor / Flash Hider
      ctx.fillStyle = this._getGunmetalGrad(ctx, 76, 96);
      ctx.fillRect(296, 81, 56, 8);
      // A2 Front Sight triangle
      ctx.beginPath();
      ctx.moveTo(312, 81); ctx.lineTo(318, 60); ctx.lineTo(326, 60); ctx.lineTo(330, 81); ctx.closePath();
      ctx.fill();

      if (isSilenced) {
        // Long M4A1-S Suppressor (Silencer)
        ctx.beginPath();
        ctx.roundRect(334, 76, 70, 17, 3);
        this._fillPathWithSkin(ctx, skinCanvas, skin, { x: 334, y: 76, w: 70, h: 17 });
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        for (let sx = 344; sx < 394; sx += 10) ctx.fillRect(sx, 76, 3, 17);
      } else {
        // M4A4 Birdcage flash hider
        ctx.fillRect(350, 79, 18, 12);
      }

      // STANAG 30-Round Magazine
      ctx.beginPath();
      ctx.moveTo(186, 112);
      ctx.lineTo(216, 112);
      ctx.quadraticCurveTo(222, 146, 232, 172);
      ctx.lineTo(200, 178);
      ctx.quadraticCurveTo(190, 146, 186, 112);
      ctx.closePath();
      this._fillPathWithSkin(ctx, skinCanvas, skin, { x: 184, y: 112, w: 50, h: 68 });

      // AR Pistol Grip & Trigger Guard
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(128, 112); ctx.lineTo(152, 112); ctx.lineTo(136, 160); ctx.lineTo(114, 156); ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.strokeRect(152, 112, 32, 14);

      // Crane Stock + Upper/Lower Receiver + Quad-Rail Handguard (SKINNED!)
      ctx.beginPath();
      // Adjustable Crane Stock
      ctx.moveTo(28, 76);
      ctx.lineTo(98, 76);
      ctx.lineTo(118, 82);
      ctx.lineTo(118, 96);
      ctx.lineTo(88, 96);
      ctx.lineTo(44, 134);
      ctx.lineTo(28, 134);
      ctx.closePath();

      // Receiver + Handguard
      ctx.moveTo(118, 70);
      ctx.lineTo(298, 72);
      ctx.lineTo(298, 104);
      ctx.lineTo(224, 106);
      ctx.lineTo(218, 116);
      ctx.lineTo(118, 112);
      ctx.closePath();

      this._fillPathWithSkin(ctx, skinCanvas, skin, { x: 26, y: 68, w: 276, h: 68 });

      // Top Picatinny Rail / M4A4 Holographic Sight vs M4A1-S Carry Handle
      ctx.fillStyle = '#0f172a';
      for (let rx = 124; rx < 292; rx += 8) {
        ctx.fillRect(rx, 66, 5, 4);
      }
      if (isSilenced) {
        // Classic M4A1-S Carry Handle Arch
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.moveTo(130, 68); ctx.lineTo(140, 53); ctx.lineTo(208, 53); ctx.lineTo(216, 68);
        ctx.stroke();
      } else {
        // M4A4 Tactical Holographic Red-Dot Sight + Stubby Vertical Foregrip
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(156, 49, 44, 18, 3);
        ctx.fill();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.fillRect(166, 52, 24, 10);
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(178, 57, 2.2, 0, Math.PI * 2); ctx.fill();
        // M4A4 stubby tactical foregrip under handguard
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(248, 104, 16, 30, 3);
        ctx.fill();
      }
      // Handguard rail vents & ejection port
      ctx.fillStyle = 'rgba(9,13,22,0.7)';
      for (let vx = 234; vx < 290; vx += 14) {
        ctx.beginPath(); ctx.roundRect(vx, 82, 9, 6, 2); ctx.fill();
      }
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(174, 78, 32, 7);
    }

    // 4. PISTOLS: DESERT EAGLE, USP-S, GLOCK-18, P250 (4 DISTINCT DESIGNS)
    else if (['deagle', 'usps', 'glock', 'p250'].includes(weaponId)) {
      const isDeagle = weaponId === 'deagle';
      const isUSPS = weaponId === 'usps';
      const isGlock = weaponId === 'glock';
      const isP250 = weaponId === 'p250';

      const startX = isUSPS ? 54 : (isDeagle ? 94 : 112);
      const slideLen = isDeagle ? 228 : (isUSPS ? 168 : (isP250 ? 164 : 186));
      const slideH = isDeagle ? 46 : (isGlock ? 32 : 36);
      const slideY = isDeagle ? 48 : 54;

      // Attached Knurled Suppressor & Tactical Under-Rail Light for USP-S
      if (isUSPS) {
        ctx.beginPath();
        ctx.roundRect(startX + slideLen - 2, slideY + 5, 138, 25, 3);
        this._fillPathWithSkin(ctx, skinCanvas, skin, { x: startX + slideLen - 2, y: slideY + 5, w: 138, h: 25 });
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        for (let sx = startX + slideLen + 12; sx < startX + slideLen + 124; sx += 12) {
          ctx.fillRect(sx, slideY + 5, 3, 25);
        }
        // Tactical Under-Barrel Laser/Flashlight Module
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(startX + slideLen - 54, slideY + slideH + 2, 46, 16, 3);
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(startX + slideLen - 10, slideY + slideH + 5, 3, 10);
      }

      // Exposed Hammer Spur for Deagle & USP-S
      if (isDeagle || isUSPS) {
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.moveTo(startX + 4, slideY + 12);
        ctx.lineTo(startX - 14, slideY + 2);
        ctx.lineTo(startX - 10, slideY + 18);
        ctx.lineTo(startX + 6, slideY + 26);
        ctx.closePath();
        ctx.fill();
      }

      // Lower Polymer/Alloy Frame, Trigger Guard & Grip
      ctx.fillStyle = isGlock ? '#111827' : this._getGunmetalGrad(ctx, slideY + slideH, 178);
      ctx.beginPath();
      ctx.moveTo(startX + 6, slideY + slideH - 2);
      ctx.lineTo(startX + slideLen - (isDeagle ? 6 : 16), slideY + slideH - 2);
      ctx.lineTo(startX + slideLen - (isDeagle ? 12 : 20), slideY + slideH + 14);
      ctx.lineTo(startX + 72, slideY + slideH + 14);
      // Grip angle (Glock has a steeper Austrian grip angle + extended mag base)
      ctx.lineTo(startX + (isGlock ? 40 : 48), isGlock ? 182 : 174);
      ctx.lineTo(startX - (isGlock ? 10 : 2), isGlock ? 178 : 170);
      ctx.lineTo(startX + 14, slideY + slideH + 16);
      ctx.lineTo(startX + 2, slideY + slideH + 6);
      ctx.closePath();
      ctx.fill();

      // Extended Magazine Baseplate for Glock & Deagle
      if (isGlock || isDeagle) {
        ctx.fillStyle = '#090d16';
        ctx.fillRect(startX - (isGlock ? 12 : 4), isGlock ? 175 : 168, 54, 8);
      }

      // Trigger guard & curved trigger
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3.5;
      ctx.strokeRect(startX + 66, slideY + slideH + 10, 42, 26);
      ctx.beginPath();
      ctx.arc(startX + 82, slideY + slideH + 18, 9, 0.2, 1.9);
      ctx.stroke();

      // Skinned Grip Inlay Panel
      ctx.beginPath();
      ctx.moveTo(startX + 20, slideY + slideH + 16);
      ctx.lineTo(startX + 54, slideY + slideH + 16);
      ctx.lineTo(startX + 38, 166);
      ctx.lineTo(startX + 6, 164);
      ctx.closePath();
      this._fillPathWithSkin(ctx, skinCanvas, skin, { x: startX, y: slideY + slideH + 12, w: 60, h: 65 });

      // Top Pistol Slide (MAIN SKINNED SURFACE!)
      ctx.beginPath();
      if (isDeagle) {
        // Iconic Desert Eagle massive stepped triangular barrel & slide
        ctx.moveTo(startX, slideY + 10);
        ctx.lineTo(startX + 20, slideY);
        ctx.lineTo(startX + slideLen - 14, slideY);
        ctx.lineTo(startX + slideLen, slideY + 14);
        ctx.lineTo(startX + slideLen, slideY + slideH);
        ctx.lineTo(startX, slideY + slideH);
      } else if (isP250) {
        // Angled modern SIG P250 chamfered slide
        ctx.moveTo(startX, slideY + 8);
        ctx.lineTo(startX + 12, slideY);
        ctx.lineTo(startX + slideLen - 10, slideY);
        ctx.lineTo(startX + slideLen, slideY + 8);
        ctx.lineTo(startX + slideLen - 4, slideY + slideH);
        ctx.lineTo(startX, slideY + slideH);
      } else if (isGlock) {
        // Strict boxy squared Glock-18 slide
        ctx.rect(startX, slideY, slideLen, slideH);
      } else {
        ctx.roundRect(startX, slideY, slideLen, slideH, [6, 6, 2, 2]);
      }
      ctx.closePath();
      this._fillPathWithSkin(ctx, skinCanvas, skin, { x: startX, y: slideY, w: slideLen, h: slideH });

      // Sights, Ejection Port & Slide Serrations
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(startX + 10, slideY - 6, 14, 6);
      ctx.fillRect(startX + slideLen - 20, slideY - 6, 10, 6);
      ctx.fillStyle = isGlock ? '#1e293b' : '#cbd5e1';
      ctx.fillRect(startX + slideLen * 0.42, slideY + 6, 38, 11);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(startX + 18 + i * 7, slideY + 8, 3, slideH - 16);
      }
      if (isDeagle) {
        // Deagle top barrel rib cutouts
        for (let rx = startX + 125; rx < startX + slideLen - 24; rx += 14) {
          ctx.fillRect(rx, slideY + 2, 8, 5);
        }
      }
    }

    // 5A. MP9 (COMPACT SWISS MACHINE PISTOL WITH INTEGRATED FOREGRIP & STICK MAG)
    else if (weaponId === 'mp9') {
      // Short Threaded Barrel & Flash Hider
      ctx.fillStyle = this._getGunmetalGrad(ctx, 76, 96);
      ctx.fillRect(282, 80, 36, 10);
      ctx.fillRect(314, 77, 16, 16);

      // Side-Folding Skeleton Buttstock
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(126, 82); ctx.lineTo(44, 86); ctx.lineTo(44, 120); ctx.lineTo(126, 100);
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(38, 82, 8, 42);

      // Long Translucent/Dark Stick Magazine protruding from Pistol Grip!
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(164, 104); ctx.lineTo(192, 104); ctx.lineTo(180, 184); ctx.lineTo(152, 182); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      for (let by = 118; by < 174; by += 8) ctx.fillRect(162, by, 14, 4);

      // Integrated Forward Vertical Foregrip & Trigger Guard
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(248, 102, 22, 48, 4);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.strokeRect(192, 104, 56, 18);

      // Compact Boxy MP9 Upper Receiver (SKINNED!)
      ctx.beginPath();
      ctx.roundRect(122, 66, 164, 40, 5);
      this._fillPathWithSkin(ctx, skinCanvas, skin, { x: 122, y: 66, w: 164, h: 40 });

      // Top Picatinny Rail & Ejection Port
      ctx.fillStyle = '#090d16';
      for (let rx = 130; rx < 278; rx += 10) ctx.fillRect(rx, 62, 6, 4);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(184, 76, 36, 9);
    }

    // 5B. UMP-45 (HEAVY .45 ACP SUBMACHINE GUN)
    else if (weaponId === 'ump45') {
      // Barrel
      ctx.fillStyle = this._getGunmetalGrad(ctx, 78, 96);
      ctx.fillRect(284, 84, 46, 9);

      // Straight Thick .45 ACP Magazine in front of trigger + Angled Grip
      ctx.beginPath();
      ctx.moveTo(212, 108); ctx.lineTo(238, 108); ctx.lineTo(246, 178); ctx.lineTo(220, 180); ctx.closePath();
      this._fillPathWithSkin(ctx, skinCanvas, skin, { x: 210, y: 108, w: 38, h: 74 });

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(144, 108); ctx.lineTo(168, 108); ctx.lineTo(154, 158); ctx.lineTo(130, 154); ctx.closePath();
      ctx.fill();

      // Skeletonized Polymer Buttstock
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(34, 82); ctx.lineTo(126, 78); ctx.lineTo(126, 104); ctx.lineTo(34, 130); ctx.closePath();
      ctx.moveTo(52, 92); ctx.lineTo(112, 88); ctx.lineTo(112, 98); ctx.lineTo(52, 114); ctx.closePath();
      ctx.fill('evenodd');

      // Blocky UMP-45 Upper Receiver & Handguard (SKINNED!)
      ctx.beginPath();
      ctx.moveTo(124, 68);
      ctx.lineTo(288, 68);
      ctx.lineTo(288, 104);
      ctx.lineTo(244, 106);
      ctx.lineTo(238, 116);
      ctx.lineTo(124, 112);
      ctx.closePath();
      this._fillPathWithSkin(ctx, skinCanvas, skin, { x: 124, y: 68, w: 164, h: 48 });

      // Handguard cooling slots & rear sight
      ctx.fillStyle = '#090d16';
      ctx.fillRect(242, 80, 34, 8);
      ctx.fillRect(132, 60, 14, 8);
      ctx.fillRect(272, 60, 10, 8);
    }

    // 5C. FAMAS (FRENCH BULLPUP ASSAULT RIFLE WITH ARCHED CARRY HANDLE)
    else if (weaponId === 'famas') {
      // Barrel & Folded Underbarrel Bipod
      ctx.fillStyle = this._getGunmetalGrad(ctx, 78, 98);
      ctx.fillRect(292, 84, 72, 8);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(204, 106, 86, 5);

      // Bullpup Rear Magazine (BEHIND Pistol Grip!)
      ctx.beginPath();
      ctx.moveTo(76, 112); ctx.lineTo(104, 112); ctx.lineTo(110, 174); ctx.lineTo(82, 176); ctx.closePath();
      this._fillPathWithSkin(ctx, skinCanvas, skin, { x: 76, y: 112, w: 36, h: 66 });

      // Center Pistol Grip & Forward Trigger Guard
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(156, 110); ctx.lineTo(180, 110); ctx.lineTo(168, 160); ctx.lineTo(144, 156); ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(180, 110, 28, 16);

      // Bullpup Body + Iconic Full-Length Raised Carry Handle Tunnel (SKINNED!)
      ctx.beginPath();
      // Main Bullpup Stock & Receiver
      ctx.moveTo(28, 74);
      ctx.lineTo(294, 76);
      ctx.lineTo(294, 106);
      ctx.lineTo(116, 112);
      ctx.lineTo(28, 122);
      ctx.closePath();
      // Raised Carry Handle Arch
      ctx.moveTo(96, 76);
      ctx.lineTo(108, 46);
      ctx.lineTo(268, 46);
      ctx.lineTo(278, 76);
      ctx.closePath();
      // Inner cutout under carry handle
      ctx.moveTo(120, 74);
      ctx.lineTo(124, 58);
      ctx.lineTo(254, 58);
      ctx.lineTo(258, 74);
      ctx.closePath();
      this._fillPathWithSkin(ctx, skinCanvas, skin, { x: 26, y: 44, w: 272, h: 80 });

      // Rubber buttpad & cheek rest
      ctx.fillStyle = '#090d16';
      ctx.fillRect(24, 74, 8, 48);
    }

    // 5D. AUG (STEYR BULLPUP RIFLE WITH INTEGRATED SCOPE & FRONT FOREGRIP)
    else if (weaponId === 'aug') {
      // Heavy Barrel & Flash Hider
      ctx.fillStyle = this._getGunmetalGrad(ctx, 76, 96);
      ctx.fillRect(278, 82, 88, 7);
      ctx.fillRect(362, 80, 18, 11);

      // Rear Waffle Magazine (Behind Grip) + Forward Folding Vertical Foregrip!
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(74, 112); ctx.lineTo(104, 112); ctx.lineTo(96, 174); ctx.lineTo(66, 170); ctx.closePath();
      ctx.fill();
      // Front vertical foregrip + Main pistol grip with full handguard loop
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(248, 102, 18, 48, 4);
      ctx.roundRect(156, 108, 22, 50, 4);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(176, 152); ctx.lineTo(204, 146); ctx.lineTo(200, 106);
      ctx.stroke();

      // Stepped Steyr Bullpup Chassis (SKINNED!)
      ctx.beginPath();
      ctx.moveTo(28, 78);
      ctx.lineTo(142, 74);
      ctx.lineTo(152, 66);
      ctx.lineTo(280, 72);
      ctx.lineTo(280, 102);
      ctx.lineTo(142, 112);
      ctx.lineTo(28, 126);
      ctx.closePath();
      this._fillPathWithSkin(ctx, skinCanvas, skin, { x: 26, y: 64, w: 258, h: 64 });

      // Angled Integrated Swarovski ACOG Scope on Top
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(148, 68); ctx.lineTo(164, 46); ctx.lineTo(256, 46); ctx.lineTo(246, 70); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(253, 47, 4, 14);
    }

    // 5E. NOVA & XM1014 (PUMP-ACTION & TACTICAL AUTO SHOTGUNS)
    else {
      const isXM = weaponId === 'xm1014';

      // Long 12-Gauge Shotgun Barrel + Underbarrel Tubular Magazine
      ctx.fillStyle = this._getGunmetalGrad(ctx, 74, 102);
      ctx.fillRect(216, 76, 178, 8);
      ctx.fillRect(216, 86, 162, 7);

      // Perforated Heat-Shield on XM1014 Barrel
      if (isXM) {
        ctx.fillStyle = '#0f172a';
        for (let hx = 228; hx < 348; hx += 12) {
          ctx.fillRect(hx, 74, 7, 4);
        }
      }

      // Ribbed Sliding Pump Forend (Nova) or Tactical Angled Forend (XM1014)
      ctx.fillStyle = isXM ? '#0f172a' : '#1e293b';
      ctx.beginPath();
      ctx.roundRect(236, 84, 88, 18, 4);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      for (let gx = 246; gx < 316; gx += 8) ctx.fillRect(gx, 85, 4, 16);

      // Stock & Receiver (SKINNED!)
      ctx.beginPath();
      if (isXM) {
        // XM1014 Tactical Pistol Grip + Collapsible Dual-Rod Buttstock
        ctx.moveTo(22, 86);
        ctx.lineTo(98, 82);
        ctx.lineTo(118, 72);
        ctx.lineTo(224, 72);
        ctx.lineTo(224, 102);
        ctx.lineTo(132, 104);
        ctx.lineTo(120, 148);
        ctx.lineTo(100, 146);
        ctx.lineTo(108, 106);
        ctx.lineTo(22, 132);
      } else {
        // Classic Nova Swept Hunting/Combat Shotgun Buttstock & Receiver
        ctx.moveTo(20, 96);
        ctx.lineTo(104, 82);
        ctx.lineTo(122, 72);
        ctx.lineTo(224, 72);
        ctx.lineTo(224, 102);
        ctx.lineTo(114, 108);
        ctx.lineTo(96, 122);
        ctx.lineTo(20, 142);
      }
      ctx.closePath();
      this._fillPathWithSkin(ctx, skinCanvas, skin, { x: 18, y: 70, w: 210, h: 80 });

      // 4 Red 12-Gauge Shotgun Shells Mounted on Receiver Side-Saddle!
      for (let s = 0; s < 4; s++) {
        const sx = 142 + s * 14;
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(sx, 80, 8, 14);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(sx, 94, 8, 5);
      }
    }

    ctx.restore();
  }

  // --- DETAILED ★ KNIFE STUDIO RENDERS (KARAMBIT, BUTTERFLY, M9 BAYONET, TACTICAL) ---
  _drawKnifeStudioRender(ctx, knifeId, skinId, W, H) {
    const skin = CS.SKINS[skinId] || CS.SKINS.default;
    const skinCanvas = this.getSkinCanvas(skin.id);

    ctx.save();
    if (knifeId === 'knife_karambit') {
      // ★ KARAMBIT: Finger ring + Curved grip + Sweeping Tiger-Claw Blade
      // 1. Finger Ring
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(96, 142, 18, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Ergonomic Curved Handle with finger notches
      ctx.fillStyle = '#111827';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(108, 128);
      ctx.quadraticCurveTo(155, 86, 212, 82);
      ctx.lineTo(216, 114);
      ctx.quadraticCurveTo(165, 118, 118, 148);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Handle grip ribs
      ctx.strokeStyle = '#475569';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(132 + i * 18, 108 - i * 4);
        ctx.lineTo(138 + i * 18, 126 - i * 4);
        ctx.stroke();
      }

      // 3. Curved Karambit Claw Blade (SKINNED!)
      ctx.beginPath();
      ctx.moveTo(212, 80);
      ctx.quadraticCurveTo(308, 52, 356, 148); // Outer spine curve to sharp tip
      ctx.quadraticCurveTo(292, 102, 214, 114); // Inner razor edge curve
      ctx.closePath();
      this._fillPathWithSkin(ctx, skinCanvas, skin, { x: 210, y: 50, w: 150, h: 105 });

      // Razor bevel highlight along inner curve
      ctx.strokeStyle = 'rgba(255,255,255,0.65)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(216, 112);
      ctx.quadraticCurveTo(292, 100, 354, 146);
      ctx.stroke();
    } else if (knifeId === 'knife_butterfly') {
      // ★ BUTTERFLY KNIFE (BALISONG): Split skeletonized handles + Spear blade
      // Twin handles slightly splayed open
      const drawBaliHandle = (yOff, rot) => {
        ctx.save();
        ctx.translate(212, 105 + yOff);
        ctx.rotate(rot);
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-142, -11, 142, 22, 6);
        ctx.fill();
        ctx.stroke();
        // Skinned handle inlay & skeleton holes
        ctx.beginPath();
        ctx.roundRect(-130, -6, 116, 12, 4);
        this._fillPathWithSkin(ctx, skinCanvas, skin, { x: -130, y: -6, w: 116, h: 12 });
        ctx.fillStyle = '#090d16';
        for (let hx = -112; hx <= -32; hx += 26) {
          ctx.beginPath(); ctx.arc(hx, 0, 4.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      };
      drawBaliHandle(-10, 0.11);
      drawBaliHandle(10, -0.11);

      // Balisong Spear Blade (SKINNED!)
      ctx.beginPath();
      ctx.moveTo(212, 88);
      ctx.lineTo(315, 84);
      ctx.lineTo(368, 105);
      ctx.lineTo(315, 124);
      ctx.lineTo(212, 122);
      ctx.closePath();
      this._fillPathWithSkin(ctx, skinCanvas, skin, { x: 212, y: 82, w: 158, h: 44 });

      // Tang pins
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(206, 95, 4, 0, Math.PI * 2);
      ctx.arc(206, 115, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // ★ M9 BAYONET or TACTICAL COMBAT KNIFE
      const isM9 = knifeId === 'knife_m9';
      ctx.translate(W / 2, H / 2);
      ctx.rotate(-0.08);
      ctx.translate(-W / 2, -H / 2);

      // Ribbed Combat Handle & Pommel
      ctx.fillStyle = '#111827';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(62, 88, 106, 34, 6);
      ctx.fill();
      ctx.stroke();
      for (let gx = 78; gx < 156; gx += 14) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(gx, 90, 6, 30);
      }

      // Crossguard with M9 Muzzle Ring
      ctx.fillStyle = '#334155';
      ctx.fillRect(166, 66, 12, 76);

      // Heavy Clip-Point Blade with M9 Sawback Teeth (SKINNED!)
      ctx.beginPath();
      ctx.moveTo(178, 80);
      if (isM9) {
        for (let sx = 192; sx < 292; sx += 12) {
          ctx.lineTo(sx, 80);
          ctx.lineTo(sx + 5, 72);
          ctx.lineTo(sx + 10, 80);
        }
      }
      ctx.lineTo(318, 80);
      ctx.lineTo(372, 104); // Sharp clip point
      ctx.quadraticCurveTo(330, 130, 178, 126);
      ctx.closePath();
      this._fillPathWithSkin(ctx, skinCanvas, skin, { x: 178, y: 70, w: 196, h: 62 });

      // Blood groove (fuller)
      ctx.fillStyle = 'rgba(0,0,0,0.42)';
      ctx.beginPath();
      ctx.roundRect(198, 94, 108, 7, 3);
      ctx.fill();
    }
    ctx.restore();
  }

  // --- DETAILED ★ GLOVE STUDIO RENDERS ---
  _drawGloveStudioRender(ctx, gloveId, W, H) {
    const g = CS.GLOVES[gloveId] || CS.GLOVES.gloves_default;

    const drawSingleGlove = (cx, cy, rot, scaleX) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.scale(scaleX, 1);

      // Fingers
      const fingerPositions = [[-34, -36, 16, 48], [-12, -46, 17, 56], [10, -44, 17, 54], [31, -32, 15, 44]];
      fingerPositions.forEach(([fx, fy, fw, fh]) => {
        ctx.fillStyle = g.primary;
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(fx, fy, fw, fh, 8);
        ctx.fill();
        ctx.stroke();
        // Finger armor pad
        ctx.fillStyle = g.accent;
        ctx.beginPath();
        ctx.roundRect(fx + 3, fy + 10, fw - 6, 14, 4);
        ctx.fill();
      });

      // Thumb
      ctx.save();
      ctx.translate(-42, 12);
      ctx.rotate(-0.48);
      ctx.fillStyle = g.primary;
      ctx.beginPath();
      ctx.roundRect(-10, -32, 20, 46, 9);
      ctx.fill();
      ctx.restore();

      // Main Dorsal Hand Body
      ctx.fillStyle = g.primary;
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-40, -6, 88, 74, 14);
      ctx.fill();
      ctx.stroke();

      // Secondary Armor Dorsal Plate
      ctx.fillStyle = g.secondary;
      ctx.beginPath();
      ctx.roundRect(-32, 6, 72, 42, 8);
      ctx.fill();

      // Hard Carbon Knuckle Guard Strip
      ctx.fillStyle = g.accent;
      ctx.beginPath();
      ctx.roundRect(-34, -6, 76, 16, 6);
      ctx.fill();

      // Wrist Cuff & Tactical Strap
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-34, 54, 76, 18);
      ctx.fillStyle = g.accent;
      ctx.fillRect(-16, 58, 40, 10);

      ctx.restore();
    };

    drawSingleGlove(154, 108, -0.14, 1);
    drawSingleGlove(268, 108, 0.14, -1);
  }

  // --- DETAILED AGENT OUTFIT STUDIO RENDERS ---
  _drawOutfitStudioRender(ctx, outfitId, W, H) {
    const o = CS.AGENT_OUTFITS[outfitId] || CS.AGENT_OUTFITS.sas_navy;
    const cx = W / 2;

    ctx.save();
    // Shoulders & Tactical Suit
    ctx.fillStyle = o.suitColor;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cx - 88, 104, 176, 98, [34, 34, 0, 0]);
    ctx.fill();
    ctx.stroke();

    // Shoulder Armor Pads
    ctx.fillStyle = o.accentColor;
    ctx.beginPath();
    ctx.roundRect(cx - 92, 114, 28, 48, 10);
    ctx.roundRect(cx + 64, 114, 28, 48, 10);
    ctx.fill();

    // Plate Carrier Vest & Mag Pouches
    ctx.fillStyle = o.vestColor;
    ctx.beginPath();
    ctx.roundRect(cx - 56, 112, 112, 90, 10);
    ctx.fill();
    ctx.fillStyle = o.accentColor;
    ctx.fillRect(cx - 28, 122, 56, 12); // Chest patch
    ctx.fillStyle = o.helmetColor;
    [-34, 0, 34].forEach(px => {
      ctx.fillRect(cx + px - 12, 148, 24, 36);
    });

    // Ballistic Helmet & Head
    ctx.fillStyle = o.helmetColor;
    ctx.beginPath();
    ctx.roundRect(cx - 42, 34, 84, 72, [36, 36, 16, 16]);
    ctx.fill();
    ctx.stroke();

    // Glowing Ballistic Visor / Goggles
    ctx.shadowColor = o.visorColor;
    ctx.shadowBlur = 16;
    ctx.fillStyle = o.visorColor;
    ctx.beginPath();
    ctx.roundRect(cx - 32, 58, 64, 24, 8);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Visor reflection slash
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.moveTo(cx - 18, 58); ctx.lineTo(cx - 4, 58); ctx.lineTo(cx - 16, 82); ctx.lineTo(cx - 26, 82);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // --- DETAILED WEAPON CASE RENDER ---
  _drawCaseStudioRender(ctx, caseId, W, H) {
    const caseObj = CS.CASES.find(c => c.id === caseId) || CS.CASES[0];
    const cx = W / 2;
    const cy = H / 2 + 12;

    ctx.save();
    // Armored Military Crate Body
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = caseObj.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(cx - 110, cy - 48, 220, 92, 10);
    ctx.fill();
    ctx.stroke();

    // Crate Lid
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(cx - 118, cy - 62, 236, 24, 6);
    ctx.fill();
    ctx.stroke();

    // Glowing Rarity Core & Latches
    ctx.fillStyle = caseObj.color;
    ctx.fillRect(cx - 76, cy - 52, 18, 42);
    ctx.fillRect(cx + 58, cy - 52, 18, 42);
    ctx.beginPath();
    ctx.arc(cx, cy - 4, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#090d16';
    ctx.font = '900 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CS', cx, cy - 4);
    ctx.restore();
  }
}

CS.textures = new TextureGenerator();
