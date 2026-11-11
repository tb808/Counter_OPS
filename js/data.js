// ============================================================================
// COUNTER OPS: TACTICAL STRIKE - GAME DATABASE (Weapons, Skins, Cases, Maps)
// ============================================================================
window.CS = window.CS || {};

CS.RARITIES = {
  milspec:    { id: 'milspec',    name: 'Mil-Spec (Blau)',       color: '#4b69ff', glow: 'rgba(75,105,255,0.45)', weight: 55 },
  restricted: { id: 'restricted', name: 'Restricted (Violett)',  color: '#8847ff', glow: 'rgba(136,71,255,0.45)', weight: 25 },
  classified: { id: 'classified', name: 'Classified (Pink)',     color: '#d32ce6', glow: 'rgba(211,44,230,0.5)',  weight: 12 },
  covert:     { id: 'covert',     name: 'Covert (Rot)',          color: '#eb4b4b', glow: 'rgba(235,75,75,0.55)',  weight: 6  },
  gold:       { id: 'gold',       name: '★ Spezial-Objekt (Gold)', color: '#ffd700', glow: 'rgba(255,215,0,0.65)', weight: 2  }
};

CS.WEAPONS = {
  // --- PISTOLS (SLOT 2) ---
  glock: {
    id: 'glock', name: 'Glock-18', category: 'pistols', slot: 2, team: 'T',
    price: 200, killReward: 300,
    damage: 29, headMult: 3.6, armorPen: 0.52, range: 110,
    fireRate: 400, automatic: false, burstCapable: true,
    magSize: 20, reserveAmmo: 120, reloadTime: 2.1,
    spreadBase: 0.004, spreadMove: 0.012, recoilUp: 0.0055, recoilSide: 0.002,
    moveSpeed: 0.96, soundType: 'pistol_light',
    desc: 'Standard-Pistole der Terroristen. Großes 20-Schuss-Magazin und optionaler 3-Schuss-Feuerstoß (Rechtsklick).'
  },
  usps: {
    id: 'usps', name: 'USP-S', category: 'pistols', slot: 2, team: 'CT',
    price: 200, killReward: 300,
    damage: 35, headMult: 3.8, armorPen: 0.55, range: 130,
    fireRate: 352, automatic: false, silenced: true, canToggleSilencer: true,
    magSize: 12, reserveAmmo: 24, reloadTime: 2.1,
    spreadBase: 0.0025, spreadMove: 0.010, recoilUp: 0.0045, recoilSide: 0.0015,
    moveSpeed: 0.96, soundType: 'pistol_silenced',
    desc: 'Schallgedämpfte Präzisionspistole der CTs. Extrem genau und verrät die Position nicht auf dem Radar.'
  },
  p250: {
    id: 'p250', name: 'P250', category: 'pistols', slot: 2, team: 'BOTH',
    price: 300, killReward: 300,
    damage: 38, headMult: 3.7, armorPen: 0.68, range: 120,
    fireRate: 400, automatic: false,
    magSize: 13, reserveAmmo: 26, reloadTime: 2.2,
    spreadBase: 0.0035, spreadMove: 0.013, recoilUp: 0.0065, recoilSide: 0.0025,
    moveSpeed: 0.96, soundType: 'pistol_med',
    desc: 'Günstige Seitenwaffe mit hoher Durchschlagskraft gegen gepanzerte Gegner.'
  },
  deagle: {
    id: 'deagle', name: 'Desert Eagle', category: 'pistols', slot: 2, team: 'BOTH',
    price: 700, killReward: 300,
    damage: 62, headMult: 3.9, armorPen: 0.93, range: 160,
    fireRate: 267, automatic: false,
    magSize: 7, reserveAmmo: 35, reloadTime: 2.3,
    spreadBase: 0.002, spreadMove: 0.022, recoilUp: 0.016, recoilSide: 0.0045,
    moveSpeed: 0.92, soundType: 'deagle',
    desc: 'Legendäre Handkanone. Tötet im Stehen mit einem einzigen präzisen Kopfschuss auf jede Distanz.'
  },

  // --- SMGS & SHOTGUNS (SLOT 1 - HEAVY/SMG) ---
  mp9: {
    id: 'mp9', name: 'MP9 Tactical', category: 'smgs', slot: 1, team: 'BOTH',
    price: 1250, killReward: 600,
    damage: 26, headMult: 3.5, armorPen: 0.60, range: 95,
    fireRate: 857, automatic: true,
    magSize: 30, reserveAmmo: 120, reloadTime: 2.1,
    spreadBase: 0.0055, spreadMove: 0.012, recoilUp: 0.0045, recoilSide: 0.0028,
    moveSpeed: 0.96, soundType: 'smg',
    desc: 'Extrem schnell feuernde Maschinenpistole. Ideal für den Nahkampf und Eco-Runden ($600 Kill-Bonus).'
  },
  ump45: {
    id: 'ump45', name: 'UMP-45', category: 'smgs', slot: 1, team: 'BOTH',
    price: 1200, killReward: 600,
    damage: 35, headMult: 3.5, armorPen: 0.65, range: 105,
    fireRate: 666, automatic: true,
    magSize: 25, reserveAmmo: 100, reloadTime: 2.5,
    spreadBase: 0.005, spreadMove: 0.013, recoilUp: 0.0058, recoilSide: 0.0028,
    moveSpeed: 0.93, soundType: 'smg_heavy',
    desc: 'Schwere Maschinenpistole mit starker Rüstungsdurchdringung und kontrollierbarem Rückstoß.'
  },
  nova: {
    id: 'nova', name: 'Nova Schrotflinte', category: 'smgs', slot: 1, team: 'BOTH',
    price: 1050, killReward: 900,
    damage: 24, pellets: 8, headMult: 2.5, armorPen: 0.55, range: 65,
    fireRate: 68, automatic: false,
    magSize: 8, reserveAmmo: 32, reloadTime: 2.8,
    spreadBase: 0.032, spreadMove: 0.025, recoilUp: 0.018, recoilSide: 0.005,
    moveSpeed: 0.88, soundType: 'shotgun',
    desc: 'Pump-Action-Schrotflinte. Tödlich auf kurze Distanz und bringt satte $900 pro Abschuss!'
  },
  xm1014: {
    id: 'xm1014', name: 'XM1014 Auto-Shotgun', category: 'smgs', slot: 1, team: 'BOTH',
    price: 2000, killReward: 900,
    damage: 20, pellets: 7, headMult: 2.4, armorPen: 0.72, range: 70,
    fireRate: 171, automatic: true,
    magSize: 7, reserveAmmo: 32, reloadTime: 2.6,
    spreadBase: 0.035, spreadMove: 0.028, recoilUp: 0.013, recoilSide: 0.005,
    moveSpeed: 0.86, soundType: 'shotgun_auto',
    desc: 'Vollautomatische Taktik-Schrotflinte. Dominiert enge Korridore und Bombenplätze.'
  },

  // --- RIFLES & SNIPERS (SLOT 1) ---
  famas: {
    id: 'famas', name: 'FAMAS F1', category: 'rifles', slot: 1, team: 'BOTH',
    price: 1950, killReward: 300,
    damage: 30, headMult: 3.5, armorPen: 0.70, range: 150,
    fireRate: 666, automatic: true, burstCapable: true,
    magSize: 25, reserveAmmo: 90, reloadTime: 2.7,
    spreadBase: 0.0038, spreadMove: 0.018, recoilUp: 0.006, recoilSide: 0.0028,
    moveSpeed: 0.89, soundType: 'rifle_light',
    desc: 'Preiswertes Bullpup-Sturmgewehr mit umschaltbarem 3-Schuss-Burst-Modus (Rechtsklick).'
  },
  m4a1s: {
    id: 'm4a1s', name: 'M4A1-S', category: 'rifles', slot: 1, team: 'BOTH',
    price: 2900, killReward: 300,
    damage: 34, headMult: 3.4, armorPen: 0.72, range: 180,
    fireRate: 600, automatic: true, silenced: true, canToggleSilencer: true,
    magSize: 25, reserveAmmo: 75, reloadTime: 2.6,
    spreadBase: 0.0018, spreadMove: 0.016, recoilUp: 0.0045, recoilSide: 0.0018,
    moveSpeed: 0.90, soundType: 'rifle_silenced',
    desc: 'Schallgedämpftes CT-Sturmgewehr mit minimalem Rückstoß, hoher Präzision und ohne Leuchtspur.'
  },
  m4a4: {
    id: 'm4a4', name: 'M4A4', category: 'rifles', slot: 1, team: 'BOTH',
    price: 3000, killReward: 300,
    damage: 33, headMult: 3.5, armorPen: 0.70, range: 175,
    fireRate: 666, automatic: true,
    magSize: 30, reserveAmmo: 90, reloadTime: 2.7,
    spreadBase: 0.0024, spreadMove: 0.018, recoilUp: 0.0055, recoilSide: 0.0024,
    moveSpeed: 0.89, soundType: 'rifle_m4',
    desc: 'Vollautomatisches Standard-Sturmgewehr mit 30 Schuss und hoher Feuerrate für Verteidiger.'
  },
  ak47: {
    id: 'ak47', name: 'AK-47', category: 'rifles', slot: 1, team: 'BOTH',
    price: 2700, killReward: 300,
    damage: 37, headMult: 3.85, armorPen: 0.78, range: 190,
    fireRate: 600, automatic: true,
    magSize: 30, reserveAmmo: 90, reloadTime: 2.5,
    spreadBase: 0.0025, spreadMove: 0.022, recoilUp: 0.0072, recoilSide: 0.0032,
    moveSpeed: 0.87, soundType: 'rifle_ak',
    desc: 'Das ikonischste Sturmgewehr der Welt. Tötet jeden Gegner sofort mit einem Kopfschuss – auch mit Helm.'
  },
  aug: {
    id: 'aug', name: 'AUG Scoped', category: 'rifles', slot: 1, team: 'BOTH',
    price: 3300, killReward: 300,
    damage: 32, headMult: 3.6, armorPen: 0.90, range: 195,
    fireRate: 600, automatic: true, scopeLevels: [1.6],
    magSize: 30, reserveAmmo: 90, reloadTime: 3.0,
    spreadBase: 0.002, spreadMove: 0.018, recoilUp: 0.0048, recoilSide: 0.002,
    moveSpeed: 0.88, soundType: 'rifle_m4',
    desc: 'Präzisionsgewehr mit taktischem ACOG-Visier (Rechtsklick) und enormer Rüstungsdurchdringung.'
  },
  ssg08: {
    id: 'ssg08', name: 'SSG 08 (Scout)', category: 'rifles', slot: 1, team: 'BOTH',
    price: 1700, killReward: 300,
    damage: 88, headMult: 4.0, armorPen: 0.85, range: 300,
    fireRate: 48, automatic: false, boltAction: true, scopeLevels: [2.4, 5.5],
    magSize: 10, reserveAmmo: 90, reloadTime: 2.8,
    spreadBase: 0.0006, spreadUnscoped: 0.018, spreadMove: 0.022, recoilUp: 0.014, recoilSide: 0.003,
    moveSpeed: 0.94, soundType: 'sniper_scout',
    desc: 'Leichtes Scharfschützengewehr mit hoher Laufgeschwindigkeit und tödlichen Kopfschüssen.'
  },
  awp: {
    id: 'awp', name: 'AWP Magnum', category: 'rifles', slot: 1, team: 'BOTH',
    price: 4750, killReward: 100,
    damage: 118, headMult: 4.0, armorPen: 0.98, range: 350,
    fireRate: 41, automatic: false, boltAction: true, scopeLevels: [2.6, 6.5],
    magSize: 5, reserveAmmo: 30, reloadTime: 3.4,
    spreadBase: 0.0003, spreadUnscoped: 0.045, spreadMove: 0.045, recoilUp: 0.022, recoilSide: 0.005,
    moveSpeed: 0.78, soundType: 'sniper_awp',
    desc: 'Hochleistungs-Scharfschützengewehr. Ein Treffer in den Oberkörper oder Kopf ist sofort tödlich.'
  },

  // --- KNIFE (SLOT 3) ---
  knife: {
    id: 'knife', name: 'Kampfmesser', category: 'melee', slot: 3, team: 'BOTH',
    price: 0, killReward: 1500,
    damage: 40, heavyDamage: 65, backstabDamage: 180, headMult: 1.5, armorPen: 0.85, range: 3.3,
    fireRate: 150, automatic: false,
    magSize: 0, reserveAmmo: 0, reloadTime: 0,
    spreadBase: 0, spreadMove: 0, recoilUp: 0.01, recoilSide: 0,
    moveSpeed: 1.08, soundType: 'knife',
    desc: 'Maximale Laufgeschwindigkeit. Linksklick für schnelle Schnitte, Rechtsklick für tödlichen Stich ($1500 Bonus).'
  },

  // --- GRENADES (SLOT 4) ---
  he: {
    id: 'he', name: 'HE-Granate', category: 'grenades', slot: 4, team: 'BOTH',
    price: 300, killReward: 300, isGrenade: true, grenadeType: 'he',
    damage: 98, range: 9.5, moveSpeed: 0.98,
    desc: 'Hochexplosive Splittergranate. Verursacht hohen Flächenschaden im Umkreis.'
  },
  flash: {
    id: 'flash', name: 'Blendgranate', category: 'grenades', slot: 4, team: 'BOTH',
    price: 200, killReward: 300, isGrenade: true, grenadeType: 'flash',
    damage: 1, range: 25, moveSpeed: 0.98,
    desc: 'Blendet und betäubt alle Personen, die in Richtung der Detonation blicken.'
  },
  smoke: {
    id: 'smoke', name: 'Rauchgranate', category: 'grenades', slot: 4, team: 'BOTH',
    price: 300, killReward: 300, isGrenade: true, grenadeType: 'smoke',
    damage: 0, range: 6.5, moveSpeed: 0.98,
    desc: 'Erzeugt für 15 Sekunden eine dichte Rauchwand, die Sichtlinien und Scharfschützen blockiert.'
  },
  molotov: {
    id: 'molotov', name: 'Brandgranate', category: 'grenades', slot: 4, team: 'BOTH',
    price: 400, killReward: 300, isGrenade: true, grenadeType: 'molotov',
    damage: 40, range: 5.2, moveSpeed: 0.98,
    desc: 'Entzündet beim Aufprall den Boden und blockiert Durchgänge mit intensivem Feuer.'
  },

  // --- C4 BOMB (SLOT 5) ---
  c4: {
    id: 'c4', name: 'C4 Sprengladung', category: 'c4', slot: 5, team: 'T',
    price: 0, killReward: 0, isC4: true,
    damage: 0, moveSpeed: 0.98,
    desc: 'Auf Bombenplatz A oder B mit Linksklick oder [E] platzieren (Code: 7355608).'
  }
};

// --- SKINS & COSMETICS DATABASE ---
CS.SKINS = {
  default: {
    id: 'default', name: 'Standard Issue', rarity: 'milspec', price: 0,
    primary: '#26292e', secondary: '#17191c', accent: '#484e58',
    metalness: 0.65, roughness: 0.42, pattern: 'standard', previewWeapon: 'm4a4',
    desc: 'Ab Werk brünierter Militärstahl und mattschwarzes Polymer.'
  },
  camo_desert: {
    id: 'camo_desert', name: 'Sandstorm Digital', rarity: 'milspec', price: 250,
    primary: '#c2a675', secondary: '#7a6342', accent: '#3d3122',
    metalness: 0.25, roughness: 0.68, pattern: 'digital_camo', previewWeapon: 'ak47',
    desc: 'Digitales Wüstentarnmuster für Einsätze in trockenen Regionen.'
  },
  arctic_wolf: {
    id: 'arctic_wolf', name: 'Arctic Wolf', rarity: 'milspec', price: 300,
    primary: '#dce4ec', secondary: '#6c7c8c', accent: '#242e38',
    metalness: 0.35, roughness: 0.5, pattern: 'camo_stripes', previewWeapon: 'awp',
    desc: 'Arktisches Schneetarn-Design mit kontrastreichen Schieferstreifen.'
  },
  cobalt_grid: {
    id: 'cobalt_grid', name: 'Cobalt Hex', rarity: 'milspec', price: 320,
    primary: '#163878', secondary: '#0c1c3d', accent: '#3ca0ff',
    metalness: 0.72, roughness: 0.32, pattern: 'hex_grid', previewWeapon: 'm4a4',
    desc: 'Eloxiertes Kobaltblau mit lasergraviertem Wabenmuster.'
  },
  redline: {
    id: 'redline', name: 'Redline Carbon', rarity: 'restricted', price: 550,
    primary: '#191a1e', secondary: '#0d0e11', accent: '#ff1e27',
    metalness: 0.55, roughness: 0.35, pattern: 'redline', previewWeapon: 'ak47',
    desc: 'Echtes Kohlefasergewebe mit feuerroten Nadelstreifen.'
  },
  amber_blaze: {
    id: 'amber_blaze', name: 'Amber Blaze', rarity: 'restricted', price: 600,
    primary: '#b85d14', secondary: '#241811', accent: '#ffae00',
    metalness: 0.85, roughness: 0.22, pattern: 'fade_metallic', previewWeapon: 'deagle',
    desc: 'Metallischer Bronze- und Bernsteinglanz mit Hitzeverfärbung.'
  },
  printstream: {
    id: 'printstream', name: 'Printstream XX', rarity: 'classified', price: 950,
    primary: '#f2f4f8', secondary: '#141619', accent: '#d8b4fe',
    metalness: 0.45, roughness: 0.25, pattern: 'printstream', previewWeapon: 'deagle',
    desc: 'Perlmuttweiße Keramikbeschichtung mit tiefschwarzem Tech-Layout und "XX"-Typografie.'
  },
  crimson_web: {
    id: 'crimson_web', name: 'Crimson Web', rarity: 'classified', price: 1050,
    primary: '#9e1118', secondary: '#141416', accent: '#050505',
    metalness: 0.58, roughness: 0.36, pattern: 'crimson_web', previewWeapon: 'm4a4',
    desc: 'Blutroter Hydro-Dip-Lack überzogen mit einem schwarzen Spinnennetz-Muster.'
  },
  case_hardened: {
    id: 'case_hardened', name: 'Case Hardened (Blue Gem)', rarity: 'classified', price: 1200,
    primary: '#3688ff', secondary: '#d49b35', accent: '#8c44d4',
    metalness: 0.92, roughness: 0.18, pattern: 'case_hardened', previewWeapon: 'ak47',
    desc: 'Einsatzgehärteter Stahl mit seltenem hohem Blauanteil ("Blue Gem").'
  },
  asiimov: {
    id: 'asiimov', name: 'Asiimov', rarity: 'covert', price: 1800,
    primary: '#f4f5f7', secondary: '#ff6600', accent: '#181a1d',
    metalness: 0.32, roughness: 0.30, pattern: 'asiimov', previewWeapon: 'awp',
    desc: 'Ikonisches Sci-Fi-Design in Reinweiß, Leuchtorange und Mattschwarz.'
  },
  fade: {
    id: 'fade', name: 'Full Fade 100%', rarity: 'covert', price: 2100,
    primary: '#ff2a85', secondary: '#ffb700', accent: '#7928ca',
    metalness: 0.95, roughness: 0.14, pattern: 'fade_rainbow', previewWeapon: 'awp',
    desc: 'Spiegelpolierte Chrom-Oberfläche mit fließendem Violett-Pink-Gold-Farbverlauf.'
  },
  hyper_beast: {
    id: 'hyper_beast', name: 'Hyper Beast', rarity: 'covert', price: 1950,
    primary: '#00d4ff', secondary: '#ff007b', accent: '#7bff00',
    metalness: 0.45, roughness: 0.32, pattern: 'hyper_beast', previewWeapon: 'm4a1s',
    desc: 'Aggressives psychedelisches Monster-Artwork in leuchtenden Neonfarben.'
  },
  neon_rider: {
    id: 'neon_rider', name: 'Neon Rider', rarity: 'covert', price: 1850,
    primary: '#ff00aa', secondary: '#00f0ff', accent: '#120824',
    metalness: 0.65, roughness: 0.24, pattern: 'neon_rider', previewWeapon: 'ak47',
    desc: 'Synthwave-Cyberpunk-Lackierung mit leuchtendem Cyan- und Magenta-Grid.'
  },
  dragon_lore: {
    id: 'dragon_lore', name: '★ Dragon Lore', rarity: 'gold', price: 3800,
    primary: '#d4af37', secondary: '#4a5228', accent: '#c82814',
    metalness: 0.78, roughness: 0.22, pattern: 'dragon_lore', previewWeapon: 'awp',
    desc: 'Legendäres Sammlerstück mit keltischer Ornamentik und feuerspeiendem Drachenmotiv.'
  },
  emerald_doppler: {
    id: 'emerald_doppler', name: '★ Gamma Doppler Emerald', rarity: 'gold', price: 3500,
    primary: '#00c853', secondary: '#004d25', accent: '#69f0ae',
    metalness: 0.96, roughness: 0.12, pattern: 'emerald', previewWeapon: 'm4a1s',
    desc: 'Flüssig wirkendes, tiefgrünes Smaragd-Metallic-Finish der höchsten Seltenheitsstufe.'
  },
  gold_arabesque: {
    id: 'gold_arabesque', name: '★ Gold Arabesque', rarity: 'gold', price: 4200,
    primary: '#ffcc33', secondary: '#996515', accent: '#fff2b2',
    metalness: 0.98, roughness: 0.10, pattern: 'gold_engraved', previewWeapon: 'ak47',
    desc: '24-Karat vergoldetes Gehäuse mit feinsten floralen Gravuren.'
  },

  // --- LEVEL-EXKLUSIVE SKINS (NICHT IM SHOP ODER KISTEN ERHÄLTLICH!) ---
  veteran_stripe: {
    id: 'veteran_stripe', name: '★ Veteran Tiger (Lv.1 Exklusiv)', rarity: 'restricted', price: 0,
    levelExclusive: true, unlockLevel: 1,
    primary: '#f59e0b', secondary: '#18181b', accent: '#fbbf24',
    metalness: 0.68, roughness: 0.28, pattern: 'tiger_stripe', previewWeapon: 'm4a4',
    desc: 'Exklusive Belohnung für Level 1: Aggressives Schwarz-Gold-Tigerstreifen-Tarnmuster.'
  },
  ruby_doppler: {
    id: 'ruby_doppler', name: '★ Doppler Ruby (Lv.4 Exklusiv)', rarity: 'covert', price: 0,
    levelExclusive: true, unlockLevel: 4,
    primary: '#e11d48', secondary: '#4c0519', accent: '#fda4af',
    metalness: 0.95, roughness: 0.12, pattern: 'ruby_crystal', previewWeapon: 'ak47',
    desc: 'Exklusive Belohnung für Level 4: Flüssig glänzendes, tiefrotes Rubin-Kristall-Finish.'
  },
  sapphire_galaxy: {
    id: 'sapphire_galaxy', name: '★ Sapphire Starlight (Lv.7 Exklusiv)', rarity: 'covert', price: 0,
    levelExclusive: true, unlockLevel: 7,
    primary: '#2563eb', secondary: '#090d16', accent: '#38bdf8',
    metalness: 0.94, roughness: 0.14, pattern: 'sapphire_nebula', previewWeapon: 'awp',
    desc: 'Exklusive Belohnung für Level 7: Kosmischer Saphir-Nebel mit funkelnden Sternenpartikeln.'
  },
  obsidian_prestige: {
    id: 'obsidian_prestige', name: '★ Obsidian Lightning (Lv.9 Exklusiv)', rarity: 'gold', price: 0,
    levelExclusive: true, unlockLevel: 9,
    primary: '#090d16', secondary: '#1e1b4b', accent: '#fbbf24',
    metalness: 0.96, roughness: 0.11, pattern: 'obsidian_lightning', previewWeapon: 'deagle',
    desc: 'Exklusive Belohnung für Level 9: Vulkanschwarzes Obsidian-Gehäuse durchzogen von 24k Gold-Blitzen.'
  }
};

// --- KNIFE MODELS ---
CS.KNIFE_MODELS = {
  knife_default: {
    id: 'knife_default', name: 'Taktisches Kampfmesser', rarity: 'milspec', price: 0, previewSkin: 'default',
    desc: 'Robuste Standard-Militärklinge.'
  },
  knife_m9: {
    id: 'knife_m9', name: '★ M9 Bayonet', rarity: 'gold', price: 2200, previewSkin: 'crimson_web',
    desc: 'Schweres Bajonett mit markanter Rückensäge und massivem Parierelement.'
  },
  knife_butterfly: {
    id: 'knife_butterfly', name: '★ Butterfly Knife (Balisong)', rarity: 'gold', price: 2800, previewSkin: 'fade',
    desc: 'Faltmesser mit geteiltem Griff und spektakulärer Flip-Animation beim Ziehen & Inspizieren [F].'
  },
  knife_karambit: {
    id: 'knife_karambit', name: '★ Karambit', rarity: 'gold', price: 3200, previewSkin: 'emerald_doppler',
    desc: 'Geschwungene Tigerkralle mit Fingerring. Rotiert beim Ziehen und Inspizieren [F] um den Zeigefinger!'
  },
  knife_talon: {
    id: 'knife_talon', name: '★ Talon Knife | Prestige (Lv.10 Exklusiv)', rarity: 'gold', price: 0,
    levelExclusive: true, unlockLevel: 10, previewSkin: 'obsidian_prestige',
    desc: 'Exklusive Global-Elite-Belohnung für Level 10: Gezahnte Tigerkralle mit Elfenbeingriff, Messingnieten & Finger-Spin [F]!'
  }
};

// --- AGENT OUTFITS & APPEARANCE ---
CS.AGENT_OUTFITS = {
  sas_navy: {
    id: 'sas_navy', name: 'SAS Midnight Tactical', price: 0, rarity: 'milspec',
    suitColor: '#1f2937', vestColor: '#111827', helmetColor: '#1e293b', visorColor: '#38bdf8',
    accentColor: '#0284c7',
    desc: 'Britische SAS-Kommandomontur mit S10-Atemschutzmaske (Doppelglas-Linsen & Seitenfilter), Funkgerät und Blendgranaten-Brustgurt.'
  },
  gign_urban: {
    id: 'gign_urban', name: 'GIGN Riot Specialist', price: 450, rarity: 'restricted',
    suitColor: '#334155', vestColor: '#1e293b', helmetColor: '#0f172a', visorColor: '#facc15',
    accentColor: '#eab308',
    desc: 'Schwerer Juggernaut-Breacher mit Altyn-Titanhelm, klappbarem Gold-Panoramavisier, 360°-Halskrause, Unterleibspanzer & Schrotpatronen-Gurt.'
  },
  desert_seal: {
    id: 'desert_seal', name: 'SEAL Sandstorm Ops', price: 500, rarity: 'restricted',
    suitColor: '#a88b60', vestColor: '#6b5638', helmetColor: '#856d47', visorColor: '#10b981',
    accentColor: '#d97706',
    desc: 'Wüsten-Spezialeinheit mit 4-fach Panorama-Nachtsichtgerät (GPNVG-18), gewebtem Shemagh-Halstuch und Langstrecken-Doppelantennen-Funkrucksack.'
  },
  phoenix_crimson: {
    id: 'phoenix_crimson', name: 'Phoenix Enforcer', price: 850, rarity: 'classified',
    suitColor: '#27171c', vestColor: '#450a0a', helmetColor: '#18181b', visorColor: '#ef4444',
    accentColor: '#dc2626',
    desc: 'Schwere Söldner-Sturmrüstung mit ballistischer Totenkopf-Maske, rotem Kommando-Barett, gekreuztem MG-Patronengurt und Stachel-Schulterplatten.'
  },
  cyber_spectre: {
    id: 'cyber_spectre', name: 'Cyber Spectre Neon', price: 1400, rarity: 'covert',
    suitColor: '#090d16', vestColor: '#1e1b4b', helmetColor: '#0f172a', visorColor: '#00f0ff',
    accentColor: '#ec4899',
    desc: 'Futuristischer Cyber-Exosuit mit V-Laser-Visier, leuchtenden Magenta-Datenfinne, Brust-Energiereaktor und Zwillings-Schubdüsen am Rücken.'
  },
  gold_commander: {
    id: 'gold_commander', name: '★ Global Elite Commander', price: 2600, rarity: 'gold',
    suitColor: '#141416', vestColor: '#292524', helmetColor: '#1c1917', visorColor: '#ffd700',
    accentColor: '#ffd700',
    desc: 'Prunkvolle 24k-Gold-Kommandantenrüstung mit Lorbeer-Helmkrone, geprägtem Goldadler-Brustharnisch, Epauletten und Kommandanten-Umhang.'
  },
  ghost_recon: {
    id: 'ghost_recon', name: '★ Ghost Phantom (Lv.3 Exklusiv)', price: 0, rarity: 'classified',
    levelExclusive: true, unlockLevel: 3,
    suitColor: '#090d16', vestColor: '#18181b', helmetColor: '#090d16', visorColor: '#a855f7',
    accentColor: '#9333ea',
    desc: 'Exklusive Level-3-Belohnung: Scharfschützen-Kapuzenmantel mit Phantom-Schädelmaske, 3-linsigem Violett-Sonargerät und Tarn-Umhang.'
  },
  valkyrie_prime: {
    id: 'valkyrie_prime', name: '★ Prime Titan Enforcer (Lv.8 Exklusiv)', price: 0, rarity: 'gold',
    levelExclusive: true, unlockLevel: 8,
    suitColor: '#e2e8f0', vestColor: '#1e293b', helmetColor: '#f8fafc', visorColor: '#00f0ff',
    accentColor: '#fbbf24',
    desc: 'Exklusive Level-8-Belohnung: Reinweiße Walküren-Titanrüstung mit goldenen Helmflügeln, Cyan-Diamantkern und 4 Energie-Schwingen am Rücken.'
  }
};

// --- GLOVES (FIRST-PERSON & AGENT HANDS) ---
CS.GLOVES = {
  gloves_default: {
    id: 'gloves_default', name: 'Standard Taktik-Handschuhe', price: 0, rarity: 'milspec',
    primary: '#1f2328', secondary: '#323842', accent: '#4b5563'
  },
  gloves_crimson: {
    id: 'gloves_crimson', name: '★ Specialist Gloves | Crimson Kimono', price: 1100, rarity: 'classified',
    primary: '#18181b', secondary: '#b91c1c', accent: '#ef4444'
  },
  gloves_pandora: {
    id: 'gloves_pandora', name: '★ Sport Gloves | Pandora\'s Box', price: 1500, rarity: 'covert',
    primary: '#4c1d95', secondary: '#1e1b4b', accent: '#a855f7'
  },
  gloves_spearmint: {
    id: 'gloves_spearmint', name: '★ Moto Gloves | Spearmint', price: 1350, rarity: 'covert',
    primary: '#e2e8f0', secondary: '#0d9488', accent: '#2dd4bf'
  },
  gloves_gold: {
    id: 'gloves_gold', name: '★ Omega Gloves | Imperial Gold', price: 2200, rarity: 'gold',
    primary: '#1c1917', secondary: '#d97706', accent: '#ffd700'
  },
  gloves_cobalt: {
    id: 'gloves_cobalt', name: '★ Amphibious Gloves | Cyber Cobalt (Lv.5 Exklusiv)', price: 0, rarity: 'covert',
    levelExclusive: true, unlockLevel: 5,
    primary: '#0c1c3d', secondary: '#1d4ed8', accent: '#00f0ff'
  }
};

// --- UNBOXING CASES (KISTEN) ---
CS.CASES = [
  {
    id: 'case_sandstorm',
    name: 'Operation Sandstorm Kiste',
    price: 250,
    color: '#d97706',
    icon: '📦',
    desc: 'Klassische Einsatzkiste mit bewährten Waffenskins und Chance auf ein ★ Spezial-Messer.',
    items: [
      { type: 'skin', id: 'camo_desert', rarity: 'milspec' },
      { type: 'skin', id: 'arctic_wolf', rarity: 'milspec' },
      { type: 'skin', id: 'cobalt_grid', rarity: 'milspec' },
      { type: 'skin', id: 'redline', rarity: 'restricted' },
      { type: 'skin', id: 'amber_blaze', rarity: 'restricted' },
      { type: 'skin', id: 'crimson_web', rarity: 'classified' },
      { type: 'skin', id: 'case_hardened', rarity: 'classified' },
      { type: 'skin', id: 'asiimov', rarity: 'covert' },
      { type: 'knife', id: 'knife_m9', rarity: 'gold' },
      { type: 'knife', id: 'knife_karambit', rarity: 'gold' }
    ]
  },
  {
    id: 'case_cyber',
    name: 'Neon Cyber Strike Kiste',
    price: 450,
    color: '#00f0ff',
    icon: '💎',
    desc: 'High-Tech Kollektion mit leuchtenden Cyberpunk-Skins, Printstream, Fade & Butterfly-Messern.',
    items: [
      { type: 'skin', id: 'cobalt_grid', rarity: 'milspec' },
      { type: 'skin', id: 'redline', rarity: 'restricted' },
      { type: 'skin', id: 'printstream', rarity: 'classified' },
      { type: 'skin', id: 'case_hardened', rarity: 'classified' },
      { type: 'skin', id: 'hyper_beast', rarity: 'covert' },
      { type: 'skin', id: 'neon_rider', rarity: 'covert' },
      { type: 'skin', id: 'fade', rarity: 'covert' },
      { type: 'glove', id: 'gloves_pandora', rarity: 'covert' },
      { type: 'knife', id: 'knife_butterfly', rarity: 'gold' },
      { type: 'skin', id: 'emerald_doppler', rarity: 'gold' }
    ]
  },
  {
    id: 'case_legend',
    name: 'Global Legend Tresorkiste',
    price: 850,
    color: '#ffd700',
    icon: '👑',
    desc: 'Premium-Tresor! Deutlich erhöhte Chancen auf Covert-Raritäten, ★ Dragon Lore, ★ Karambit & Gold-Handschuhe.',
    items: [
      { type: 'skin', id: 'printstream', rarity: 'classified' },
      { type: 'skin', id: 'crimson_web', rarity: 'classified' },
      { type: 'skin', id: 'asiimov', rarity: 'covert' },
      { type: 'skin', id: 'fade', rarity: 'covert' },
      { type: 'skin', id: 'hyper_beast', rarity: 'covert' },
      { type: 'skin', id: 'dragon_lore', rarity: 'gold' },
      { type: 'skin', id: 'emerald_doppler', rarity: 'gold' },
      { type: 'skin', id: 'gold_arabesque', rarity: 'gold' },
      { type: 'knife', id: 'knife_karambit', rarity: 'gold' },
      { type: 'knife', id: 'knife_butterfly', rarity: 'gold' },
      { type: 'glove', id: 'gloves_gold', rarity: 'gold' }
    ]
  }
];

// --- MAPS METADATA ---
CS.MAPS = {
  de_sandstorm: {
    id: 'de_sandstorm',
    name: 'SANDSTORM (Dust / Mirage)',
    code: 'DE_SANDSTORM',
    theme: 'desert',
    subtitle: 'Klassische 3-Lane Wüstenstadt mit A-Lang, Katakomben, Mid-Fenster und Basar.',
    skyTop: '#3a7bd5',
    skyBottom: '#e8c89b',
    fogColor: '#d9be96',
    ambientColor: 0xfff1dc,
    sunColor: 0xffe4b5
  },
  de_foundry: {
    id: 'de_foundry',
    name: 'INFERNO PLAZA (Altstadt / Werk)',
    code: 'DE_INFERNO',
    theme: 'industrial',
    subtitle: 'Europäischer Innenhof mit Brunnen auf B, Banana-Gasse, Backstein-Arkaden und Stahlbrücken.',
    skyTop: '#1e3c72',
    skyBottom: '#f3904f',
    fogColor: '#c99378',
    ambientColor: 0xffdfc8,
    sunColor: 0xffb07c
  },
  de_reactor: {
    id: 'de_reactor',
    name: 'NUCLEAR FACILITY (Nuke / Cyber)',
    code: 'DE_REACTOR',
    theme: 'facility',
    subtitle: 'Hochsicherheits-Reaktorkomplex mit leuchtenden Kühlsilos, Oberdeck-Catwalks und Kontrollraum.',
    skyTop: '#0f2027',
    skyBottom: '#2c5364',
    fogColor: '#1b2c38',
    ambientColor: 0xcce6ff,
    sunColor: 0xd8f0ff
  }
};

// --- AI DIFFICULTY MODES (LEICHT, MITTEL, SCHWER, NIGHTMARE) ---
CS.DIFFICULTIES = {
  easy: {
    id: 'easy',
    name: 'Leicht',
    label: 'LEICHT (REKRUT)',
    icon: '🟢',
    color: '#4ade80',
    creditMult: 0.7,
    xpMult: 0.75,
    badge: '0.7x CR',
    desc: 'Entspannte KI: Langsame Reaktion, geringe Trefferquote, kaum Ausweichbewegung, leichte Rüstung & keine Granaten.',
    tactics: 'Statisches Zielen • Geringe Sichtweite • Nur Pistolen & SMGs',
    sightRange: 75,
    fovCos: -0.15,          // ~100° cone unless alerted
    reactionTime: 0.58,
    aimTurnSpeed: 4.2,
    navTurnSpeed: 4.5,
    fireAngleMax: 0.42,
    fireRateMult: 1.95,     // Shoots much slower
    hitChanceBase: 0.24,
    hitChanceMin: 0.05,
    hitDistFalloff: 0.0048,
    headshotChance: 0.04,
    damageMult: 0.35,
    tracerSpread: 1.15,
    moveSpeed: 4.3,
    strafeSpeed: 0.7,
    strafeMin: 1.1,
    strafeMax: 1.8,
    crouchChance: 0.0,
    grenadeChance: 0.0,
    maxGrenades: 0,
    calloutRange: 0,
    hearingRange: 10,
    startArmor: 50,
    hasHelmet: false,
    hasDefuseKit: false,
    plantTime: 4.0,
    defuseTime: 6.0,
    weaponTier: 'easy'
  },
  medium: {
    id: 'medium',
    name: 'Mittel',
    label: 'MITTEL (SOLDAT)',
    icon: '🟡',
    color: '#facc15',
    creditMult: 1.0,
    xpMult: 1.0,
    badge: '1.0x CR',
    desc: 'Ausgewogene KI: Solide Zielgenauigkeit, moderates Strafen, Standard-Taktik und normale Reaktionszeit.',
    tactics: 'Moderates Strafen • Gemischte Waffen • Gelegentliche Deckung',
    sightRange: 95,
    fovCos: -0.5,           // ~120° half-sphere awareness
    reactionTime: 0.38,
    aimTurnSpeed: 6.8,
    navTurnSpeed: 5.5,
    fireAngleMax: 0.36,
    fireRateMult: 1.60,
    hitChanceBase: 0.38,
    hitChanceMin: 0.08,
    hitDistFalloff: 0.0046,
    headshotChance: 0.08,
    damageMult: 0.45,
    tracerSpread: 0.85,
    moveSpeed: 4.9,
    strafeSpeed: 1.7,
    strafeMin: 0.8,
    strafeMax: 1.4,
    crouchChance: 0.14,
    grenadeChance: 0.05,
    maxGrenades: 1,
    calloutRange: 16,
    hearingRange: 22,
    startArmor: 75,
    hasHelmet: true,
    hasDefuseKit: false,
    plantTime: 3.6,
    defuseTime: 5.0,
    weaponTier: 'medium'
  },
  hard: {
    id: 'hard',
    name: 'Schwer',
    label: 'SCHWER (VETERAN)',
    icon: '🟠',
    color: '#f97316',
    creditMult: 1.5,
    xpMult: 1.35,
    badge: '+50% CR (1.5x)',
    desc: 'Klassische Herausforderung (Standard): Schnelle Reflexe, aktives Strafen, präzise Gewehre & volle Rüstung.',
    tactics: 'Taktisches Strafen & Ducken • Volle Rüstung • Team-Fokus',
    sightRange: 115,
    fovCos: -1.0,           // Full 360° situational awareness (exact current baseline)
    reactionTime: 0.24,
    aimTurnSpeed: 9.5,
    navTurnSpeed: 6.5,
    fireAngleMax: 0.32,
    fireRateMult: 1.35,
    hitChanceBase: 0.52,
    hitChanceMin: 0.12,
    hitDistFalloff: 0.0045,
    headshotChance: 0.14,
    damageMult: 0.55,
    tracerSpread: 0.60,
    moveSpeed: 5.4,
    strafeSpeed: 2.6,
    strafeMin: 0.6,
    strafeMax: 1.4,
    crouchChance: 0.28,
    grenadeChance: 0.14,
    maxGrenades: 1,
    calloutRange: 28,
    hearingRange: 34,
    startArmor: 100,
    hasHelmet: true,
    hasDefuseKit: true,
    plantTime: 3.2,
    defuseTime: 2.5,
    weaponTier: 'hard'
  },
  nightmare: {
    id: 'nightmare',
    name: 'Nightmare',
    label: 'NIGHTMARE (GLOBAL ELITE)',
    icon: '💀',
    color: '#ef4444',
    creditMult: 2.25,
    xpMult: 2.0,
    badge: '+125% CR (2.25x)',
    desc: 'Gnadenlose Pro-KI: Flick-Shots, hohe Kopfschussrate, Crouch-Peeking, Team-Callouts, Geräusch-Ortung & Taktik-Granaten!',
    tactics: 'Crouch-Peeking & Counter-Strafe • Team-Swarming • Wirft Granaten',
    sightRange: 145,
    fovCos: -1.0,
    reactionTime: 0.11,
    aimTurnSpeed: 16.0,
    navTurnSpeed: 9.2,
    fireAngleMax: 0.24,
    fireRateMult: 1.02,     // Near maximum weapon fire rate
    hitChanceBase: 0.72,
    hitChanceMin: 0.22,
    hitDistFalloff: 0.0034,
    headshotChance: 0.28,
    damageMult: 0.72,
    tracerSpread: 0.32,
    moveSpeed: 6.1,
    strafeSpeed: 3.9,
    strafeMin: 0.26,
    strafeMax: 0.55,
    crouchChance: 0.62,
    grenadeChance: 0.35,
    maxGrenades: 2,
    calloutRange: 58,
    hearingRange: 65,
    startArmor: 100,
    hasHelmet: true,
    hasDefuseKit: true,
    plantTime: 2.6,
    defuseTime: 2.0,
    weaponTier: 'nightmare'
  }
};

// --- GAME MODES ---
CS.MODES = {
  bomb: {
    id: 'bomb',
    name: 'Bombenentschärfung (Kein Respawn)',
    shortName: 'BOMB DEFUSAL',
    icon: '💣',
    creditMult: 1.25,
    maxRounds: 12,
    startMoney: 1000,
    roundTime: 300,
    buyTime: 300,
    bombTime: 40,
    respawn: false,
    respawnDelay: 0,
    desc: 'Kein Respawn: Wer stirbt, bleibt bis zum Rundenende tot! Höchster Modus-Credit-Bonus (+25% CR).'
  },
  tdm: {
    id: 'tdm',
    name: 'Team Deathmatch (5 Min Runde)',
    shortName: 'TEAM DEATHMATCH',
    icon: '⚔️',
    creditMult: 1.0,
    scoreLimit: 999,
    startMoney: 16000,
    roundTime: 300,
    buyTime: 300,
    respawn: true,
    respawnDelay: 2.5,
    desc: '5 Minuten durchgehende Action mit direktem Respawn! Alle Waffen sind jederzeit über [B] frei wählbar.'
  },
  armsrace: {
    id: 'armsrace',
    name: 'Waffenspiel (5 Min Runde)',
    shortName: 'ARMS RACE',
    icon: '🏆',
    creditMult: 1.15,
    scoreLimit: 16,
    startMoney: 0,
    roundTime: 300,
    buyTime: 0,
    respawn: true,
    respawnDelay: 2.0,
    progression: ['mp9', 'ump45', 'nova', 'xm1014', 'famas', 'm4a1s', 'm4a4', 'ak47', 'aug', 'ssg08', 'awp', 'deagle', 'p250', 'usps', 'glock', 'knife'],
    desc: '5-Minuten-Runde: Jeder Abschuss rüstet sofort die nächste Waffe aus bis zum finalen Goldenen Messer! (+15% CR)'
  },
  practice: {
    id: 'practice',
    name: 'Bot-Training & Freies Spiel (5 Min)',
    shortName: 'TRAINING',
    icon: '🎯',
    creditMult: 0.6,
    maxRounds: 99,
    startMoney: 16000,
    roundTime: 300,
    buyTime: 300,
    bombTime: 45,
    respawn: true,
    respawnDelay: 2.0,
    desc: '5-Minuten-Runde mit $16.000 Startgeld: Jederzeit Waffen & Granaten kaufen, Maps erkunden und Aiming trainieren.'
  }
};

// --- RANKS & 10-STAGE LEVEL PROGRESSION ---
CS.RANKS = [
  { level: 0,  name: 'Silver I',                      minXP: 0,    icon: '🥈' },
  { level: 1,  name: 'Silver II',                     minXP: 300,  icon: '🥈' },
  { level: 2,  name: 'Silver Elite',                  minXP: 700,  icon: '🥈' },
  { level: 3,  name: 'Gold Nova I',                   minXP: 1200, icon: '⭐' },
  { level: 4,  name: 'Gold Nova Master',              minXP: 1850, icon: '🌟' },
  { level: 5,  name: 'Master Guardian I',             minXP: 2650, icon: '🛡️' },
  { level: 6,  name: 'Master Guardian Elite',         minXP: 3600, icon: '⚔️' },
  { level: 7,  name: 'Distinguished Master Guardian', minXP: 4750, icon: '🎖️' },
  { level: 8,  name: 'Legendary Eagle',               minXP: 6100, icon: '🦅' },
  { level: 9,  name: 'Supreme Master First Class',    minXP: 7700, icon: '👑' },
  { level: 10, name: 'The Global Elite',              minXP: 9600, icon: '🌐' }
];

// --- LEVEL-UP EXCLUSIVE REWARDS (NUR DURCH LEVEL-AUFSTIEG FREISCHALTBAR!) ---
CS.LEVEL_REWARDS = [
  {
    level: 1,
    minXP: 300,
    title: '★ Veteran Tiger (Waffen-Skin) + 200 CR',
    desc: 'Exklusiver Schwarz-Gold-Tigerstreifen-Skin für alle Waffen + 200 Start-Credits.',
    subtitle: 'Exklusiver Schwarz-Gold-Tigerstreifen-Skin für alle Waffen + 200 Start-Credits.',
    rarity: 'restricted',
    cosmetic: { type: 'skin', id: 'veteran_stripe', weapon: 'm4a4', weaponPreview: 'm4a4' },
    credits: 200,
    freeCaseId: null
  },
  {
    level: 2,
    minXP: 700,
    title: '400 Credits + 1x Gratis Sandstorm-Kiste',
    desc: 'Großes Einsatz-Soldpaket (+400 CR) plus eine kostenlose Operation Sandstorm Kiste zum Öffnen!',
    subtitle: 'Großes Einsatz-Soldpaket (+400 CR) plus eine kostenlose Operation Sandstorm Kiste zum Öffnen!',
    rarity: 'classified',
    cosmetic: null,
    credits: 400,
    freeCaseId: 'case_sandstorm'
  },
  {
    level: 3,
    minXP: 1200,
    title: '★ Ghost Phantom (Agenten-Outfit) + 250 CR',
    desc: 'Exklusiver Stealth-Kampfanzug mit leuchtend violettem Nachtsicht-Visier + 250 Credits.',
    subtitle: 'Exklusiver Stealth-Kampfanzug mit leuchtend violettem Nachtsicht-Visier + 250 Credits.',
    rarity: 'classified',
    cosmetic: { type: 'outfit', id: 'ghost_recon' },
    credits: 250,
    freeCaseId: null
  },
  {
    level: 4,
    minXP: 1850,
    title: '★ Doppler Ruby (Waffen-Skin) + 350 CR',
    desc: 'Exklusives, flüssig glänzendes Rubin-Kristall-Finish für alle Waffen + 350 Credits.',
    subtitle: 'Exklusives, flüssig glänzendes Rubin-Kristall-Finish für alle Waffen + 350 Credits.',
    rarity: 'covert',
    cosmetic: { type: 'skin', id: 'ruby_doppler', weapon: 'ak47', weaponPreview: 'ak47' },
    credits: 350,
    freeCaseId: null
  },
  {
    level: 5,
    minXP: 2650,
    title: '★ Amphibious Gloves | Cyber Cobalt + 450 CR',
    desc: 'Exklusive kobaltblaue Carbon-Taktikhandschuhe für Ego- & Agenten-Ansicht + 450 Credits.',
    subtitle: 'Exklusive kobaltblaue Carbon-Taktikhandschuhe für Ego- & Agenten-Ansicht + 450 Credits.',
    rarity: 'covert',
    cosmetic: { type: 'glove', id: 'gloves_cobalt' },
    credits: 450,
    freeCaseId: null
  },
  {
    level: 6,
    minXP: 3600,
    title: '650 Credits + 1x Gratis Cyber Strike Kiste',
    desc: 'Massiver Sold-Bonus (+650 CR) plus eine kostenlose Neon Cyber Strike Kiste!',
    subtitle: 'Massiver Sold-Bonus (+650 CR) plus eine kostenlose Neon Cyber Strike Kiste!',
    rarity: 'covert',
    cosmetic: null,
    credits: 650,
    freeCaseId: 'case_cyber'
  },
  {
    level: 7,
    minXP: 4750,
    title: '★ Sapphire Starlight (Waffen-Skin) + 550 CR',
    desc: 'Exklusives kosmisches Saphir-Nebel-Finish mit Sternenpartikeln + 550 Credits.',
    subtitle: 'Exklusives kosmisches Saphir-Nebel-Finish mit Sternenpartikeln + 550 Credits.',
    rarity: 'covert',
    cosmetic: { type: 'skin', id: 'sapphire_galaxy', weapon: 'awp', weaponPreview: 'awp' },
    credits: 550,
    freeCaseId: null
  },
  {
    level: 8,
    minXP: 6100,
    title: '★ Prime Titan Enforcer (Agenten-Outfit) + 700 CR',
    desc: 'Exklusive weiß-goldene Titan-Kommandantenrüstung mit Cyan-Visier + 700 Credits.',
    subtitle: 'Exklusive weiß-goldene Titan-Kommandantenrüstung mit Cyan-Visier + 700 Credits.',
    rarity: 'gold',
    cosmetic: { type: 'outfit', id: 'valkyrie_prime' },
    credits: 700,
    freeCaseId: null
  },
  {
    level: 9,
    minXP: 7700,
    title: '★ Obsidian Lightning (Waffen-Skin) + 900 CR',
    desc: 'Exklusives vulkanschwarzes Obsidian-Gehäuse mit 24k Gold-Blitzen + 900 Credits.',
    subtitle: 'Exklusives vulkanschwarzes Obsidian-Gehäuse mit 24k Gold-Blitzen + 900 Credits.',
    rarity: 'gold',
    cosmetic: { type: 'skin', id: 'obsidian_prestige', weapon: 'deagle', weaponPreview: 'deagle' },
    credits: 900,
    freeCaseId: null
  },
  {
    level: 10,
    minXP: 9600,
    title: '★ Talon Knife | Prestige + 1.500 CR + Legend-Kiste',
    desc: 'Ultimative Global-Elite-Belohnung: Exklusives ★ Talon Knife mit Finger-Spin [F], +1.500 CR & 1x Global Legend Tresorkiste!',
    subtitle: 'Ultimative Global-Elite-Belohnung: Exklusives ★ Talon Knife mit Finger-Spin [F], +1.500 CR & 1x Global Legend Tresorkiste!',
    rarity: 'gold',
    cosmetic: { type: 'knife', id: 'knife_talon' },
    credits: 1500,
    freeCaseId: 'case_legend'
  }
];
