import * as THREE from 'three';

// --- Renderer, scene, camera, lights ---
const $ = (id) => document.getElementById(id);
const canvas = $('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
renderer.setPixelRatio(1);
renderer.setSize(640, 360, false);
renderer.shadowMap.enabled = false;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#0a1720');
const camera = new THREE.OrthographicCamera(-23, 23, 13, -13, .1, 120);

const hemi = new THREE.HemisphereLight(0xc8ffff, 0x183044, 2.1);
scene.add(hemi);
const keyLight = new THREE.DirectionalLight(0xffecd1, 2.3);
keyLight.position.set(-7, 18, 10);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0x34dce5, 1.2);
fillLight.position.set(12, 11, -10);
scene.add(fillLight);

const townRoot = new THREE.Group();
scene.add(townRoot);
const actorRoot = new THREE.Group();
scene.add(actorRoot);
const battleRoot = new THREE.Group();
scene.add(battleRoot);
battleRoot.visible = false;

const clock = new THREE.Clock();

const palette = {
  ink: 0x071722, grass: 0x286b5c, grass2: 0x327c68, path: 0x768d83,
  stone: 0x4c6773, cyan: 0x56d8d3, lime: 0xc9fa68, pink: 0xff70ae,
  cream: 0xe8e2be, navy: 0x193d56, orange: 0xffa75a, blue: 0x4ca9db
};

// --- Geometry helpers ---
const mats = {};
function mat(color, extra = {}) {
  const k = String(color) + JSON.stringify(extra);
  return mats[k] ||= (new THREE.MeshLambertMaterial({ color, ...extra }));
}
function box(parent, x, y, z, w, h, d, color, opts = {}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts));
  m.position.set(x, y, z);
  m.castShadow = false;
  m.receiveShadow = false;
  parent.add(m);
  return m;
}
function plane(parent, x, y, z, w, d, color, rotation = -Math.PI / 2) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(color));
  m.rotation.x = rotation;
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
function labelSprite(text, color = '#d8fff4', bg = '#09202c') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = bg;
  g.fillRect(2, 8, 252, 48);
  g.strokeStyle = color;
  g.lineWidth = 4;
  g.strokeRect(2, 8, 252, 48);
  g.fillStyle = color;
  g.font = 'bold 19px monospace';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 128, 33);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(4.2, 1.05, 1);
  return s;
}
function randomTileTexture() {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#337a63';
  g.fillRect(0, 0, 64, 64);
  for (let y = 0; y < 64; y += 8)
    for (let x = 0; x < 64; x += 8) {
      if (((x + y) / 8) % 2 === 0) {
        g.fillStyle = '#2f725f';
        g.fillRect(x, y, 8, 8);
      }
      if (Math.random() > .78) {
        g.fillStyle = '#66a77c';
        g.fillRect(x + 2, y + 2, 2, 2);
      }
    }
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(5, 4);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function addTree(x, z, variant = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  townRoot.add(g);
  box(g, 0, .7, 0, .6, 1.4, .6, 0x704f49);
  const col = variant ? 0x2e9d81 : 0x4ba775;
  box(g, 0, 2, 0, 2.5, 2.2, 2.5, col);
  box(g, -.56, 2.36, .1, 1.5, 1.25, 1.6, variant ? 0x44b98e : 0x62bd83);
  box(g, .65, 1.65, -.1, 1.2, 1.2, 1.3, variant ? 0x238770 : 0x368d68);
  if (variant === 2) box(g, 0, 3.25, 0, .55, .35, .55, palette.lime);
  return g;
}
function addBuilding({ x, z, w = 5, d = 4, h = 3.1, title, color = palette.cyan, roof = palette.navy, type = 'shop' }) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  townRoot.add(g);
  const wall = type === 'home' ? 0x5e7480 : 0x224459;
  box(g, 0, h / 2, 0, w, h, d, wall);
  box(g, 0, h + .18, 0, w + .5, .38, d + .5, roof);
  box(g, 0, h - .35, d / 2 + .04, w - .2, .16, .12, color, { emissive: color, emissiveIntensity: .35 });
  box(g, 0, .62, d / 2 + .08, 1.05, 1.25, .13, type === 'home' ? 0x3c4e5a : 0x102b3b);
  box(g, -.85, 1.6, d / 2 + .09, .52, .62, .15, 0x90c9c0);
  box(g, .85, 1.6, d / 2 + .09, .52, .62, .15, 0x90c9c0);
  box(g, 0, .25, 0, w + .28, .5, d + .28, 0x294857);
  const s = labelSprite(title, `#${new THREE.Color(color).getHexString()}`, '#091a29');
  s.position.set(0, h + 1.0, 0);
  g.add(s);
  if (type === 'home') {
    box(g, 0, h + .65, -.1, w * .26, .65, d * .3, 0x385262);
    box(g, -w * .3, h + .2, -.1, w * .14, .55, .14, 0x8cebe0);
  }
  if (type === 'gate') {
    // A welcoming, oversized gate made from chunky circuit pillars.
    box(g, -w * .42, h * .9, d / 2 + .2, .65, h * 1.8, .75, color);
    box(g, w * .42, h * .9, d / 2 + .2, .65, h * 1.8, .75, color);
    box(g, 0, h * 1.78, d / 2 + .2, w * 1.22, .65, .8, color);
    box(g, 0, h * 1.31, d / 2 + .22, .17, .52, .16, palette.lime, { emissive: palette.lime, emissiveIntensity: .8 });
  }
  return g;
}

// --- Character / robot models ---
function blobShadow(parent, radius = .7, opacity = .42, y = .05) {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 4, 32, 32, 30);
  grad.addColorStop(0, `rgba(3,9,14,${opacity})`);
  grad.addColorStop(.55, `rgba(3,9,14,${opacity * .55})`);
  grad.addColorStop(1, 'rgba(3,9,14,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2, radius * 2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  m.renderOrder = -1;
  parent.add(m);
  return m;
}
function createHumanoid(torso = 0x42b9bd, accent = 0xc9fa68) {
  const g = new THREE.Group();
  // legs + boots
  box(g, -.22, .16, 0, .24, .32, .34, 0x1e4a5a);
  box(g, .22, .16, 0, .24, .32, .34, 0x1e4a5a);
  box(g, -.22, .04, .05, .27, .1, .4, 0x162430);
  box(g, .22, .04, .05, .27, .1, .4, 0x162430);
  // torso + belt + chest accent
  box(g, 0, .54, 0, .72, .5, .44, torso);
  box(g, 0, .37, 0, .74, .13, .46, 0x1e4a5a);
  box(g, 0, .63, .23, .4, .14, .05, accent, { emissive: accent, emissiveIntensity: .35 });
  // arms (sleeve + hand)
  box(g, -.53, .5, 0, .21, .44, .26, torso);
  box(g, -.53, .24, 0, .19, .18, .24, 0xf2d2ad);
  box(g, .53, .5, 0, .21, .44, .26, torso);
  box(g, .53, .24, 0, .19, .18, .24, 0xf2d2ad);
  // head (face + hair)
  box(g, 0, 1.02, 0, .54, .52, .5, 0xf2d2ad);
  box(g, 0, 1.31, 0, .58, .12, .54, accent);
  box(g, 0, 1.08, .24, .54, .26, .08, accent);
  box(g, -.29, 1.02, 0, .09, .5, .5, accent);
  box(g, .29, 1.02, 0, .09, .5, .5, accent);
  box(g, -.15, 1.06, .26, .09, .1, .04, 0x102635);
  box(g, .15, 1.06, .26, .09, .1, .04, 0x102635);
  blobShadow(g, .62, .4);
  return g;
}
function frameColors(frame) {
  return ({
    CINDER: { main: 0xe87948, edge: 0xffd073, core: 0xfff1a6 },
    TIDAL: { main: 0x399cce, edge: 0x8af6ec, core: 0xe1fff5 },
    MOSS: { main: 0x54a46d, edge: 0xc9fa68, core: 0xf4ffd1 }
  })[frame] || { main: 0x399cce, edge: 0x8af6ec, core: 0xe1fff5 };
}
// --- Parts & Ghostlight AI templates (Robopon workbench depth) ---
const PART_SLOTS = ['head', 'arms', 'legs', 'battery', 'core'];
const PARTS_LIBRARY = {
  visor:     { slot: 'head',    name: 'VISOR',         hp: 0,  atk: 0, glyph: '◉', desc: 'Clear optics. A steady read.' },
  horned:    { slot: 'head',    name: 'HORNED CROWN',  hp: 0,  atk: 2, glyph: '▲', desc: 'A crest that says: hit me first.' },
  dome:      { slot: 'head',    name: 'ARMOR DOME',    hp: 4,  atk: 0, glyph: '◍', desc: 'Thick shell for the thinkers.' },
  grip:      { slot: 'arms',    name: 'GRIP HANDS',    hp: 0,  atk: 0, glyph: '✋', desc: 'Standard manipulators.' },
  claw:      { slot: 'arms',    name: 'STRIKE CLAWS',  hp: 0,  atk: 3, glyph: '⛏', desc: 'Sharp. Adds punch to AI Drive.' },
  shield:    { slot: 'arms',    name: 'VANGUARD SHIELD', hp: 4, atk: 0, glyph: '▣', desc: 'Brace against the worst.' },
  strider:   { slot: 'legs',    name: 'STRIDER LEGS',  hp: 0,  atk: 0, glyph: '‖', desc: 'Balanced stance.' },
  tread:     { slot: 'legs',    name: 'TREAD BASE',    hp: 5,  atk: 0, glyph: '▬', desc: 'Low and planted. Hard to topple.' },
  boost:     { slot: 'legs',    name: 'BOOST THRUSTERS', hp: 0, atk: 2, glyph: '»', desc: 'Legs that answer before you ask.' },
  cell:      { slot: 'battery', name: 'STANDARD CELL', hp: 0,  atk: 0, glyph: '▱', desc: 'Reliable juice.' },
  volt:      { slot: 'battery', name: 'VOLT CELL',     hp: -2, atk: 3, glyph: '⚡', desc: 'Hot current. Powerful, brittle.' },
  reserve:   { slot: 'battery', name: 'RESERVE CELL',  hp: 6,  atk: 0, glyph: '▰', desc: 'A tank for long nights.' },
  pulse:     { slot: 'core',    name: 'PULSE CORE',    hp: 0,  atk: 0, glyph: '◈', desc: 'A steady heartbeat.' },
  overclock: { slot: 'core',    name: 'OVERCLOCK CORE', hp: -2, atk: 4, glyph: '◉', desc: 'Redlines the Drive.' },
  guardian:  { slot: 'core',    name: 'GUARDIAN CORE', hp: 5,  atk: 0, glyph: '◈', desc: 'A core that shields its host.' }
};
const STARTER_PARTS = { head: 'visor', arms: 'grip', legs: 'strider', battery: 'cell', core: 'pulse' };
const FRAME_STATS = {
  CINDER: { hp: 58, atk: 7 },
  TIDAL:  { hp: 64, atk: 5 },
  MOSS:   { hp: 70, atk: 3 }
};
const AI_TEMPLATES = {
  KINDLE: { tag: 'AGGRESSIVE',   color: '#ffb958', glyph: '▲', line: '“Burn bright. Hit first, hit last.”',      desc: 'Hot instincts — AI Drive lands hard.',           driveBase: 20 },
  TIDE:   { tag: 'SUPPORT',      color: '#71c9a4', glyph: '≈', line: '“Steady. We hold the line together.”',      desc: 'A calm current — AI Drive also restores HP.',     driveBase: 12, heal: 10 },
  VOLT:   { tag: 'FAST / RISKY', color: '#ffd073', glyph: '⚡', line: '“Faster. We outrun the hit.”',              desc: 'Reckless speed — big Drive, small recoil.',       driveBase: 26, recoil: 4 },
  MOSS:   { tag: 'GUARD',        color: '#c9fa68', glyph: '▣', line: '“Root down. They won’t move us.”',          desc: 'Patient — AI Drive raises your guard.',           driveBase: 8,  guard: true },
  ECHO:   { tag: 'DECEPTION',    color: '#c78cff', glyph: '◐', line: '“Let them chase the wrong shadow.”',        desc: 'Tricky — AI Drive muddies the next attack.',     driveBase: 14, weaken: true },
  HOLLOW: { tag: 'WILDCARD',     color: '#5ff6e7', glyph: '❋', line: '“Roll the dice. The Signal loves a gamble.”', desc: 'Unpredictable — every Drive is a gamble.',       driveBase: null, wild: true }
};
const AI_MIGRATE = { SPARK: 'KINDLE', BASTION: 'MOSS', ORACLE: 'ECHO' };
function robotStats(robot) {
  const f = FRAME_STATS[robot?.frame] || FRAME_STATS.TIDAL;
  let hp = f.hp, atk = f.atk;
  for (const slot of PART_SLOTS) {
    const part = PARTS_LIBRARY[robot?.[slot]];
    if (part) { hp += part.hp; atk += part.atk; }
  }
  if (state.parts?.prism) hp += 10;
  if (state.parts?.coil) atk += 2;
  return { hp, atk };
}
function aiTemplate() { return AI_TEMPLATES[state.ai] || AI_TEMPLATES.KINDLE; }
function resolveDrive() {
  let t = aiTemplate();
  if (t.wild) {
    const others = Object.values(AI_TEMPLATES).filter(x => !x.wild);
    t = others[Math.floor(Math.random() * others.length)];
  }
  const spec = {
    dmg: (t.driveBase ?? 20) + robotStats(state.robot).atk,
    heal: t.heal, recoil: t.recoil, guard: t.guard, weaken: t.weaken, wild: aiTemplate().wild
  };
  if (state.parts?.coil && spec.heal) spec.heal += 4;
  return spec;
}
function createRobot(frame = 'TIDAL', name = 'PIP', scale = 1, build = null) {
  const c = frameColors(frame), g = new THREE.Group();
  g.scale.setScalar(scale);
  const coreMat = new THREE.MeshLambertMaterial({ color: c.core, emissive: c.core, emissiveIntensity: .6 });
  const visorMat = new THREE.MeshLambertMaterial({ color: 0xd8fff4, emissive: 0xd8fff4, emissiveIntensity: .8 });
  const eyeMat = new THREE.MeshLambertMaterial({ color: 0xd8fff4, emissive: 0xd8fff4, emissiveIntensity: 1.15 });
  // torso + belly panel + back thruster
  box(g, 0, 1.15, 0, 1.45, 1.25, 1.12, c.main);
  box(g, 0, 1.0, .57, .78, .46, .08, c.edge);
  box(g, 0, 1.5, -.6, .5, .52, .16, c.main);
  box(g, 0, 1.5, -.7, .32, .32, .08, c.core, { emissive: c.core, emissiveIntensity: .7 });
  // energy core (pulseable) + head + visor + eyes + grill
  const core = new THREE.Mesh(new THREE.BoxGeometry(.34, .5, .14), coreMat);
  core.position.set(0, 1.18, .57);
  g.add(core);
  box(g, 0, 2.05, 0, 1.0, .72, .92, c.edge);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(.7, .16, .12), visorMat);
  visor.position.set(0, 2.0, .5);
  g.add(visor);
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(.14, .1, .05), eyeMat);
  eyeL.position.set(-.2, 2.0, .55);
  const eyeR = new THREE.Mesh(new THREE.BoxGeometry(.14, .1, .05), eyeMat);
  eyeR.position.set(.2, 2.0, .55);
  g.add(eyeL, eyeR);
  box(g, 0, 1.78, .5, .34, .1, .08, 0x091c2a);
  // shoulders + pauldrons + arms + hands
  box(g, -.76, 1.35, 0, .42, .88, .48, c.edge);
  box(g, .76, 1.35, 0, .42, .88, .48, c.edge);
  box(g, -.76, 1.86, 0, .52, .18, .58, c.main);
  box(g, .76, 1.86, 0, .52, .18, .58, c.main);
  box(g, -.76, .86, .05, .43, .18, .49, c.main);
  box(g, .76, .86, .05, .43, .18, .49, c.main);
  box(g, -.76, .5, .05, .4, .3, .4, 0x091c2a);
  box(g, .76, .5, .05, .4, .3, .4, 0x091c2a);
  // hips + knees + feet
  box(g, -.42, .36, 0, .48, .72, .53, 0x25495d);
  box(g, .42, .36, 0, .48, .72, .53, 0x25495d);
  box(g, -.42, .2, .28, .46, .2, .24, c.edge);
  box(g, .42, .2, .28, .46, .2, .24, c.edge);
  box(g, -.42, .08, .13, .62, .2, .72, c.edge);
  box(g, .42, .08, .13, .62, .2, .72, c.edge);
  // frame-specific head crests
  if (frame === 'TIDAL') {
    box(g, 0, 2.62, 0, .12, .52, .12, c.edge);
    box(g, 0, 2.92, 0, .2, .12, .2, c.core, { emissive: c.core, emissiveIntensity: .9 });
  }
  if (frame === 'CINDER') {
    box(g, 0, 2.53, 0, .24, .48, .24, c.main);
    box(g, -.54, 2.28, 0, .24, .4, .24, c.edge);
    box(g, .54, 2.28, 0, .24, .4, .24, c.edge);
  }
  if (frame === 'MOSS') {
    box(g, -.56, 2.18, 0, .32, .48, .3, c.edge);
    box(g, .56, 2.18, 0, .32, .48, .3, c.edge);
  }
  // part-specific kit (workbench depth — model reflects the build)
  if (build) {
    if (build.head === 'horned') {
      box(g, -.32, 2.5, 0, .16, .34, .16, c.edge);
      box(g, .32, 2.5, 0, .16, .34, .16, c.edge);
    }
    if (build.head === 'dome') {
      box(g, 0, 2.6, 0, 1.12, .34, 1.02, c.edge);
    }
    if (build.arms === 'claw') {
      box(g, -.84, .5, .18, .18, .26, .18, c.core, { emissive: c.core, emissiveIntensity: .5 });
      box(g, .84, .5, .18, .18, .26, .18, c.core, { emissive: c.core, emissiveIntensity: .5 });
    }
    if (build.arms === 'shield') {
      box(g, -.9, .86, .34, .16, .66, .1, c.edge);
    }
    if (build.legs === 'tread') {
      box(g, -.42, .08, .13, .74, .2, .86, c.main);
      box(g, .42, .08, .13, .74, .2, .86, c.main);
    }
    if (build.legs === 'boost') {
      box(g, -.42, .3, -.36, .3, .18, .18, c.core, { emissive: c.core, emissiveIntensity: .6 });
      box(g, .42, .3, -.36, .3, .18, .18, c.core, { emissive: c.core, emissiveIntensity: .6 });
    }
    if (build.battery === 'volt') {
      box(g, 0, 1.15, -.64, .2, .3, .1, c.core, { emissive: c.core, emissiveIntensity: .8 });
    }
    if (build.core === 'overclock') {
      box(g, 0, 1.18, .7, .1, .32, .1, c.edge, { emissive: c.edge, emissiveIntensity: .9 });
    }
  }
  blobShadow(g, .95, .42);
  g.coreMat = coreMat;
  g.visorMat = visorMat;
  return g;
}

// --- NPC roster & thoughts (P1.8: hold S to scan) ---
const SCAN_RADIUS = 4.5;
const NPC_DEFS = [
  { id: 'wren', name: 'WREN', kind: 'human', torso: 0x367d9a, accent: 0xff70ae, x: -2.2, z: 6.2, labelY: 2.15, label: '#ffaad0', idea: null,
    thoughts: ['That second heartbeat in the Gate… it isn’t noise. It’s a name.', 'Seven days. That’s how long the Signal runs. Then it forgets — or you do.', 'Build a partner. Trust it. That’s the whole trick.'] },
  { id: 'moss', name: 'MOSS', kind: 'human', torso: 0xb9758d, accent: 0xc9fa68, x: 8.6, z: 2.1, labelY: 2.15, label: '#c9fa68', idea: null,
    thoughts: ['Two scrap for a chip. Fair is fair.', 'Nothing leaves Bitspring. A neighbor’s problem is a neighbor’s part.', 'Trades outlast memories here. That’s the point of a small town.'] },
  { id: 'nella', name: 'NELLA', kind: 'human', torso: 0xd98bb0, accent: 0x5ff6e7, x: 4.4, z: 6.4, labelY: 2.15, label: '#5ff6e7', idea: 'home-seven',
    thoughts: ['Counting houses again. Seven on the west lane.', 'The seventh one has a blue door. Nobody lives there now.', 'A package came for it once. Then the truck stopped coming.'] },
  { id: 'courier', name: 'COURIER', kind: 'robot', frame: 'TIDAL', x: 3.2, z: 1.6, labelY: 1.55, label: '#8af6ec', idea: null, needs: 'home-seven',
    thoughts: ['route… [CORRUPT]… deliver to… seven…', 'west lane… blue door… then the address unravels.', 'a package without a door is just a heavy box.'],
    doneThoughts: ['delivered. a blue door on the west lane. route restored.', 'thank you. the town forgets, but I carry it anyway.'] },
  { id: 'pipo', name: 'PIPO', kind: 'human', torso: 0x8ba4b0, accent: 0xffa75a, x: -5.8, z: -1.6, labelY: 2.15, label: '#ffa75a', idea: null,
    thoughts: ['I remember when the network had one street and no name.', 'Kids think the static is new. It was always there — it just got louder.', 'Check your battery before you check your luck.'] },
  { id: 'six', name: 'SIX', kind: 'human', torso: 0x5e7f9e, accent: 0xc78cff, x: -4.4, z: -4.2, labelY: 2.15, label: '#c78cff', idea: null,
    thoughts: ['A hundred feeds and none of them know we exist.', 'The ads are getting weird. They advertise things I only dreamed about.', 'Signal’s bad tonight. Or maybe it’s listening.'] },
  { id: 'gull', name: 'GULL', kind: 'human', torso: 0x5fae9a, accent: 0xffd073, x: 12.6, z: -4.0, labelY: 2.15, label: '#ffd073', idea: null,
    thoughts: ['Drones eat the sky here. Crumbs of light.', 'If you launch a box and it never lands, who owns the box?', 'I’ve lost three kites to the static. I’m keeping the fourth.'] },
  { id: 'tally', name: 'TALLY', kind: 'human', torso: 0x7a6bb0, accent: 0xc9fa68, x: 12.4, z: 1.0, labelY: 2.15, label: '#c9fa68', idea: null,
    thoughts: ['Lantern oil, frame polish, fresh cores. Ask for anything.', 'The Gate’s been hungry lately. More kids go in than come out talking.', 'If Moss shortchanges you, it’s on purpose and it’s a lesson.'] },
  { id: 'orr', name: 'ORR', kind: 'human', torso: 0xb07a6a, accent: 0x5ff6e7, x: -12.2, z: 4.6, labelY: 2.15, label: '#5ff6e7', idea: null,
    thoughts: ['The seventh house is empty, but its porch light still comes on at dusk.', 'Someone still pays the power bill. Or something does.', 'Blue door, west lane. Don’t linger — the light follows you home.'] },
  { id: 'mav', name: 'MAV', kind: 'human', torso: 0x4e7d95, accent: 0xff70ae, x: 0, z: -4.4, labelY: 2.15, label: '#ff70ae', idea: null,
    thoughts: ['The Gate doesn’t fight. It tests. There’s a difference.', 'Every match is a question. Lose, and it asks again louder.', 'Null units come from the static. Where the static comes from — that’s the match we all lose.'] }
];
function npcThoughts(def) {
  return (def.id === 'courier' && state.imprintDone && def.doneThoughts) ? def.doneThoughts : def.thoughts;
}
function bubbleHTML(def) {
  return `<div class="sb-name">${def.name}</div>` + npcThoughts(def).map(t => `<div class="sb-line">${t}</div>`).join('');
}
function npcsInRange() {
  return npcs.filter(n => Math.hypot(player.position.x - n.def.x, player.position.z - n.def.z) <= SCAN_RADIUS);
}
function scanningNow() {
  if (!state.started || state.zone !== 'town' || dialogueOpen || activeModal() || isDayCardOpen()) return false;
  return !!keys['KeyS'] && npcsInRange().length > 0;
}
function showIdeaToast(text) {
  const t = $('idea-toast');
  if (!t) return;
  t.textContent = '◈ ' + text;
  t.style.display = 'block';
  clearTimeout(ideaToastTimer);
  ideaToastTimer = setTimeout(() => { t.style.display = 'none'; }, 2400);
}
function collectIdea(id) {
  if (!Array.isArray(state.ideas)) state.ideas = [];
  if (state.ideas.includes(id)) return;
  state.ideas.push(id);
  save();
  sfxPickup();
  showIdeaToast(id === 'home-seven' ? 'IDEA GAINED — HOME // 07' : 'IDEA GAINED — ' + id.toUpperCase());
}
function updateScan() {
  const layer = $('scan-layer'), hint = $('scan-hint');
  if (!layer) return;
  const active = scanningNow();
  if (hint) hint.style.display = active ? 'block' : 'none';
  const inRange = active ? npcsInRange() : [];
  for (const n of npcs) {
    const el = n.bubbleEl;
    if (!el) continue;
    if (!inRange.includes(n)) { el.style.display = 'none'; continue; }
    if (n.def.idea) collectIdea(n.def.idea);
    const v = new THREE.Vector3(n.def.x, n.def.labelY + 0.35, n.def.z).project(camera);
    el.style.left = ((v.x * 0.5 + 0.5) * window.innerWidth) + 'px';
    el.style.top = ((-v.y * 0.5 + 0.5) * window.innerHeight) + 'px';
    el.style.display = 'block';
  }
}
function imprintCourier() {
  if (state.imprintDone) {
    showDialogue('COURIER', ['Delivered and logged. The seventh house remembers now.', 'Whatever the Signal took, the west lane kept one address.']);
    return;
  }
  if (!state.ideas.includes('home-seven')) {
    showDialogue('COURIER', ['…address… corrupted. I carry, but I cannot find the door.', 'The west lane’s seventh house. Someone in town still knows it. Scan the neighbors — hold S and listen.']);
    return;
  }
  state.imprintDone = true;
  state.chips += 2;
  const dropPool = ['prism', 'coil'].filter(p => !state.parts[p]);
  let rewardLine;
  if (dropPool.length) {
    const d = dropPool[0];
    state.parts[d] = true;
    rewardLine = d === 'prism' ? 'It also hands you a PRISM PLATING.' : 'It also hands you a PHASE COIL.';
  } else {
    state.scrap += 2;
    rewardLine = 'It adds two salvage bits to the crate.';
  }
  save();
  refreshHud();
  sfxConfirm();
  const cn = npcs.find(n => n.def.id === 'courier');
  if (cn?.bubbleEl) cn.bubbleEl.innerHTML = bubbleHTML(cn.def);
  showDialogue('COURIER', ['Route restored. HOME // 07, west lane, blue door. The package is home.', `For your trouble: two data chips from the delivery fee. ${rewardLine}`, 'The town forgets its own streets sometimes. It’s good someone remembers.']);
}

// --- Town ---
function buildTown() {
  townRoot.clear();
  actorRoot.clear();
  battleRoot.clear();
  battleRoot.visible = false;
  townRoot.visible = true;
  actorRoot.visible = true;
  const scanLayerEl = $('scan-layer');
  if (scanLayerEl) scanLayerEl.innerHTML = '';
  const grassTex = randomTileTexture();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(34, 24), new THREE.MeshLambertMaterial({ map: grassTex, color: 0xffffff }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -.08;
  townRoot.add(ground);
  // Raised, checker-cut road into the plaza.
  for (let z = -10; z <= 9; z++)
    for (let x = -1; x <= 1; x++)
      box(townRoot, x, .015, z, 1, .06, 1, ((x + z) % 2 === 0) ? 0x7e9288 : 0x87978a);
  for (let x = -12; x <= 12; x++)
    for (let z = -1; z <= 1; z++)
      box(townRoot, x, .02, z, 1, .07, 1, ((x + z) % 2 === 0) ? 0x82968c : 0x71867f);
  // A square where the roads meet, with a friendly signal fountain.
  box(townRoot, 0, .04, 0, 7, .09, 7, 0x526f78);
  box(townRoot, 0, .12, 0, 4.4, .12, 4.4, 0x94a99b);
  const fountain = new THREE.Group();
  fountain.position.set(0, 0, 0);
  townRoot.add(fountain);
  box(fountain, 0, .42, 0, 1.8, .7, 1.8, 0x487a82);
  box(fountain, 0, .9, 0, 1.15, .28, 1.15, 0x81c8bb);
  box(fountain, 0, 1.4, 0, .44, .8, .44, palette.cyan, { emissive: palette.cyan, emissiveIntensity: .45 });
  box(fountain, 0, 1.88, 0, .85, .15, .85, palette.lime, { emissive: palette.lime, emissiveIntensity: .65 });
  addBuilding({ x: -9, z: -1, w: 5.2, d: 4.8, h: 3.3, title: 'HATCHERY', color: palette.cyan, roof: 0x163a4e });
  addBuilding({ x: 9, z: -1, w: 5.2, d: 4.8, h: 3.1, title: 'SWAP MEET', color: palette.pink, roof: 0x354052 });
  addBuilding({ x: 0, z: -8, w: 4.4, d: 2.2, h: 1.7, title: 'BATTLE GATE', color: palette.lime, roof: 0x294d4b, type: 'gate' });
  addBuilding({ x: -10.7, z: 7.5, w: 4.2, d: 3.8, h: 2.6, title: 'HOME // 07', color: 0x89c7c7, roof: 0x425665, type: 'home' });
  addBuilding({ x: 10.7, z: 7.5, w: 4.2, d: 3.8, h: 2.6, title: 'HOME // 08', color: 0xdf8dae, roof: 0x51425d, type: 'home' });
  // Flower pixels and old signal lamps mark the walk home.
  const lamps = [[-3, -4], [3, -4], [-3, 4], [3, 4], [-13, 0], [13, 0]];
  for (const [x, z] of lamps) {
    box(townRoot, x, .9, z, .18, 1.8, .18, 0x344d5b);
    box(townRoot, x, 1.9, z, .54, .18, .54, palette.cyan, { emissive: palette.cyan, emissiveIntensity: .5 });
    box(townRoot, x, .18, z, .62, .3, .62, 0x576e71);
  }
  const trees = [[-14, -8, 1], [-13, 6, 0], [14, -6, 2], [14, 7, 1], [-6, -10, 0], [6, -10, 1], [-14, 1, 2], [14, 2, 0], [-7, 8, 1], [7, 8, 0]];
  trees.forEach(a => addTree(...a));
  // NPCs — every neighbor has thoughts (hold S to scan). One carries an idea; the courier needs it.
  npcs = [];
  for (const def of NPC_DEFS) {
    const model = def.kind === 'robot' ? createRobot(def.frame || 'TIDAL', def.name, .5) : createHumanoid(def.torso, def.accent);
    model.position.set(def.x, 0, def.z);
    actorRoot.add(model);
    const label = labelSprite(def.name, def.label, '#091a29');
    label.scale.set(2, 0.5, 1);
    label.position.set(def.x, def.labelY, def.z);
    actorRoot.add(label);
    const bubbleEl = document.createElement('div');
    bubbleEl.className = 'scan-bubble';
    bubbleEl.style.display = 'none';
    bubbleEl.innerHTML = bubbleHTML(def);
    $('scan-layer').appendChild(bubbleEl);
    npcs.push({ def, model, label, bubbleEl });
  }
  player.position.set(0, 0, 8.4);
  player.rotation.y = Math.PI;
  actorRoot.add(player);
  companion.position.set(-.95, 0, 8.65);
  actorRoot.add(companion);
  obstacles = [
    { x: -9, z: -1, w: 5.8, d: 5.2 },
    { x: 9, z: -1, w: 5.8, d: 5.2 },
    { x: -10.7, z: 7.5, w: 4.6, d: 4.2 },
    { x: 10.7, z: 7.5, w: 4.6, d: 4.2 },
    { x: 0, z: -8, w: 5.2, d: 2.8 },
    ...trees.map(([x, z]) => ({ x, z, w: 1, d: 1 }))
  ];
  camera.position.set(20, 26, 25);
  camera.lookAt(0, 0, 0);
}

// --- Player / companion / state ---
const player = createHumanoid(0x2eabc0, 0xe8de9c);
player.scale.setScalar(.9);
const companion = new THREE.Group();
let buddyModel = createRobot('TIDAL', 'PIP', .48);
companion.add(buddyModel);
let obstacles = [];
let npcs = [];
let ideaToastTimer = null;
const state = {
  started: false, zone: 'town', chips: 8, scrap: 1, parts: {}, robot: null, ai: null, roster: [],
  activeTab: 'build', selectedFrame: 'TIDAL', selectedAI: 'KINDLE', message: '', introSeen: false, wins: 0, day: 1, mission: null,
  ideas: [], imprintDone: false
};

// --- Day / mission system (P1.7) ---
let dayCardCallback = null;
function newMission(day) {
  return {
    day,
    name: 'FIRST CONTACT',
    objectives: [
      { id: 'meet-wren', label: 'Meet Wren by the plaza', done: false },
      { id: 'build-robot', label: 'Build your partner at the Hatchery', done: false },
      { id: 'win-gate', label: 'Win a Battle Gate match', done: false }
    ],
    complete: false,
    teaserPending: false
  };
}
function isDayCardOpen() { return $('day-card').style.display === 'flex'; }
function renderMission() {
  const mt = $('mission-tracker');
  if (!mt) return;
  const m = state.mission;
  if (!m || !state.started || state.zone === 'battle') { mt.style.display = 'none'; return; }
  mt.style.display = 'block';
  $('mt-day').textContent = 'DAY ' + String(m.day).padStart(2, '0');
  $('mt-name').textContent = m.complete ? 'CLEAR' : m.name;
  $('mt-list').innerHTML = m.objectives.map(o =>
    `<li class="mt-item${o.done ? ' done' : ''}"><span class="mt-mark">${o.done ? '✓' : '▸'}</span>${o.label}</li>`
  ).join('');
}
function completeObjective(id) {
  const m = state.mission;
  if (!m || m.complete) return;
  const o = m.objectives.find(x => x.id === id);
  if (!o || o.done) return;
  o.done = true;
  if (m.objectives.every(x => x.done)) { m.complete = true; m.teaserPending = true; }
  renderMission();
  sfxPickup();
  save();
}
function showDayCard({ kicker, title, sub, copy, buttonLabel, onDone }) {
  $('day-card-kicker').textContent = kicker;
  $('day-card-title').textContent = title;
  $('day-card-sub').textContent = sub;
  $('day-card-copy').textContent = copy;
  $('day-card-button').textContent = buttonLabel;
  dayCardCallback = onDone;
  $('day-card').style.display = 'flex';
  sfxSelect();
}
function showDayEndCard() {
  showDayCard({
    kicker: 'DAY 1 — CLEAR',
    title: 'DAY 2',
    sub: 'SIGNAL HUNT',
    copy: 'The Gate’s second heartbeat was a name, not noise: PIP. The Signal has taken an interest. Tomorrow it hunts back — rest up, and keep an eye on the static.',
    buttonLabel: 'KEEP EXPLORING ▸',
    onDone: () => showDialogue('WREN', [
      'You hear it too, then. The Signal counted your win. Whatever watches this town just wrote your name down.',
      'Day 2 will be different. Get some rest — tomorrow we listen back.'
    ])
  });
}
const keys = {};
let dialogueQueue = [];
let dialogueOpen = false;
let interaction = null;
let modalTab = 'build';
let battle = null;
let battleAnimating = false;
let audioContext = null;
let masterGain = null;
let musicTimer = null;
let musicEnabled = true;
let musicTheme = 'town';
let musicStep = 0;
let nextMusicTime = 0;
let noiseBuffer = null;
let battleIntensity = 0;
const townMelody = [74, null, 78, null, 81, 78, 76, null, 74, null, 78, 81, 83, null, 81, null, 78, null, 81, null, 85, null, 83, 81, 78, null, 76, null, 74, null, 69, null];
const battleMelody = [74, 78, 81, 78, 74, null, 81, 85, 83, 81, 78, 81, 86, null, 85, 81, 78, 81, 83, 86, 88, null, 86, 83, 81, 78, 81, 85, 83, null, 78, null];

// --- Audio (procedural WebAudio) ---
const settings = { musicOn: true, volume: 0.32 };
function loadSettings() {
  try { Object.assign(settings, JSON.parse(localStorage.getItem('bitspring-settings-v1') || '{}')); } catch {}
  musicEnabled = settings.musicOn !== false;
}
function saveSettings() {
  try { localStorage.setItem('bitspring-settings-v1', JSON.stringify(settings)); } catch {}
}
function setMusicButton() {
  const b = $('music-toggle');
  b.textContent = musicEnabled ? '♫ MUSIC ON' : '♫ MUSIC OFF';
  b.setAttribute('aria-pressed', String(musicEnabled));
}
function initAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioContext) {
    audioContext = new AudioContextClass();
    masterGain = audioContext.createGain();
    masterGain.gain.value = .0001;
    masterGain.connect(audioContext.destination);
    const length = Math.floor(audioContext.sampleRate * .35);
    noiseBuffer = audioContext.createBuffer(1, length, audioContext.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  }
  return audioContext;
}
function startMusic() {
  const ctx = initAudio();
  if (!ctx) return;
  ctx.resume();
  musicEnabled = true;
  settings.musicOn = true;
  masterGain.gain.setTargetAtTime(settings.volume, ctx.currentTime, .12);
  nextMusicTime = ctx.currentTime + .05;
  setMusicButton();
  if (!musicTimer) musicTimer = window.setInterval(scheduleMusic, 25);
  saveSettings();
}
function setVolume(v) {
  settings.volume = Math.max(0, Math.min(1, v));
  if (masterGain && audioContext && musicEnabled) masterGain.gain.setTargetAtTime(settings.volume, audioContext.currentTime, .06);
  saveSettings();
  const s = $('volume-slider');
  if (s) s.value = Math.round(settings.volume * 100);
}
function setMusicTheme(theme) {
  if (musicTheme === theme) return;
  musicTheme = theme;
  musicStep = 0;
  if (audioContext) nextMusicTime = audioContext.currentTime + .08;
}
function toggleMusic() {
  if (musicEnabled) {
    musicEnabled = false;
    settings.musicOn = false;
    if (masterGain && audioContext) masterGain.gain.setTargetAtTime(.0001, audioContext.currentTime, .06);
    setMusicButton();
    saveSettings();
  } else startMusic();
}
function playTone(midi, when, duration, wave = 'square', volume = .025, slide = null) {
  if (!audioContext || !masterGain) return;
  const osc = audioContext.createOscillator(), amp = audioContext.createGain();
  osc.type = wave;
  const hz = 440 * Math.pow(2, (midi - 69) / 12);
  osc.frequency.setValueAtTime(slide || hz, when);
  if (slide) osc.frequency.exponentialRampToValueAtTime(hz, when + Math.min(.09, duration * .7));
  amp.gain.setValueAtTime(.0001, when);
  amp.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), when + .008);
  amp.gain.exponentialRampToValueAtTime(.0001, when + duration);
  osc.connect(amp);
  amp.connect(masterGain);
  osc.start(when);
  osc.stop(when + duration + .015);
}
function playNoise(when, volume = .012, dur = .045, type = 'highpass', freq = 3500) {
  if (!audioContext || !noiseBuffer) return;
  const src = audioContext.createBufferSource(), filter = audioContext.createBiquadFilter(), amp = audioContext.createGain();
  src.buffer = noiseBuffer;
  filter.type = type;
  filter.frequency.value = freq;
  amp.gain.setValueAtTime(.0001, when);
  amp.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), when + .004);
  amp.gain.exponentialRampToValueAtTime(.0001, when + dur);
  src.connect(filter);
  filter.connect(amp);
  amp.connect(masterGain);
  src.start(when);
  src.stop(when + dur + .02);
}
function scheduleMusicStep(step, when) {
  const inBattle = musicTheme === 'battle',
        melody = inBattle ? battleMelody : townMelody,
        roots = inBattle ? [50, 46, 48, 43] : [50, 45, 47, 43],
        root = roots[Math.floor(step / 8) % 4],
        beat = step % 8;
  if (beat === 0 || beat === 4) {
    playTone(root - 12, when, .23, 'triangle', inBattle ? .2 : .17);
    if (beat === 0) playTone(root + 12, when, .15, 'square', inBattle ? .05 : .04);
  }
  if (beat === 2 || beat === 6) playNoise(when, inBattle ? .03 : .019);
  else if (beat === 1 || beat === 5) playNoise(when, inBattle ? .012 : .008);
  const note = melody[step];
  if (note !== null && note !== undefined) playTone(note, when, inBattle ? .14 : .13, 'square', inBattle ? .12 : .11);
  if (beat === 0 && step % 16 === 0) {
    const chord = inBattle ? [0, 3, 7] : [0, 4, 7];
    chord.forEach((interval, i) => playTone(root + interval + 12, when, .2, 'triangle', i === 0 ? .04 : .025));
  }
  if (!inBattle) {
    // town: shimmering arpeggio + an evolving counter-line on the back half of the phrase
    const arp = [0, 12, 7, 12, 4, 12, 7, 12];
    playTone(root + 24 + arp[step % 8], when, .09, 'square', .018);
    if (step >= 16) {
      const counter = [86, null, 83, null, 81, 83, 79, null, 81, null, 78, null, 76, 78, 74, null];
      const cn = counter[step % 16];
      if (cn) playTone(cn, when, .11, 'triangle', .03);
    }
  } else {
    // battle: intensity layers that rise as the match drags on
    if (battleIntensity >= .3 && note !== null && beat % 2 === 0) playTone(note + 12, when + .11, .1, 'square', .028);
    if (battleIntensity >= .6) {
      if (beat % 2 === 1) playNoise(when, .015, .03, 'highpass', 6000);
      if (beat === 2 || beat === 6) playTone(root - 24, when, .12, 'sawtooth', .055);
    }
    if (battleIntensity >= 1 && beat % 2 === 0) playTone(root - 12, when + .06, .1, 'triangle', .11);
  }
}
function scheduleMusic() {
  if (!audioContext || !musicEnabled || audioContext.state !== 'running') return;
  const now = audioContext.currentTime;
  if (nextMusicTime < now) nextMusicTime = now + .025;
  const tempo = musicTheme === 'battle' ? 132 : 104;
  while (nextMusicTime < now + .13) {
    scheduleMusicStep(musicStep, nextMusicTime);
    musicStep = (musicStep + 1) % 32;
    nextMusicTime += 60 / tempo / 2;
  }
}

// --- SFX (procedural one-shots) ---
function nowTime() { return audioContext ? audioContext.currentTime : 0; }
function sfxSelect() { const t = nowTime(); playTone(76, t, .06, 'square', .03); }
function sfxConfirm() { const t = nowTime(); playTone(83, t, .07, 'square', .035); playTone(88, t + .07, .09, 'square', .035); }
function sfxBlip() { const t = nowTime(); playTone(72, t, .035, 'square', .018); }
function sfxRobot() { const t = nowTime(); playTone(62, t, .06, 'square', .035); playTone(74, t + .05, .06, 'square', .03); playTone(86, t + .1, .08, 'square', .03); }
function sfxHit() { const t = nowTime(); playNoise(t, .03); playTone(88, t, .07, 'square', .045, 160); }
function sfxHeavyHit() { const t = nowTime(); playNoise(t, .04, .05, 'lowpass', 900); playTone(52, t, .1, 'sawtooth', .05, 90); playTone(88, t, .06, 'square', .04, 180); }
function sfxGuard() { const t = nowTime(); playTone(70, t, .06, 'triangle', .04); playTone(74, t + .05, .06, 'triangle', .04); }
function sfxHeal() { const t = nowTime(); [72, 76, 79].forEach((m, i) => playTone(m, t + i * .06, .09, 'triangle', .04)); }
function sfxEnemyHit() { const t = nowTime(); playNoise(t, .035, .06, 'lowpass', 700); playTone(55, t, .12, 'sawtooth', .04, 70); }
function sfxPickup() { const t = nowTime(); playTone(84, t, .05, 'square', .03); playTone(96, t + .05, .07, 'square', .03); }
function playJingle(won) {
  const t = nowTime() + .02;
  if (won) {
    [[72, 0], [76, .12], [79, .24], [84, .36], [88, .48]].forEach(([m, d]) => playTone(m, t + d, .3, 'square', .07));
    [72, 76, 79, 84].forEach(m => playTone(m + 12, t + .6, .5, 'triangle', .04));
  } else {
    [[69, 0], [66, .14], [62, .28], [57, .44]].forEach(([m, d]) => playTone(m, t + d, .32, 'triangle', .07));
    playTone(45, t + .6, .6, 'triangle', .05);
  }
}

// --- Save / load / HUD ---
const SAVE_KEY = 'bitspring.save.v2';
const SAVE_KEY_V1 = 'bitspring-save-v1';
let savePresent = false;
function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      version: 2,
      chips: state.chips, scrap: state.scrap, parts: state.parts, robot: state.robot, ai: state.ai, roster: state.roster, wins: state.wins, introSeen: state.introSeen, day: state.day, mission: state.mission, ideas: state.ideas, imprintDone: state.imprintDone
    }));
    savePresent = true;
  } catch {}
}
function load() {
  try {
    let raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      raw = localStorage.getItem(SAVE_KEY_V1);   // migrate a legacy v1 save up to v2
      if (raw) localStorage.setItem(SAVE_KEY, JSON.stringify(Object.assign({ version: 2 }, JSON.parse(raw))));
      // the v1 key is left intact as a backup — never lose a player's save
    }
    if (raw) {
      const s = JSON.parse(raw);
      if (s) {
        Object.assign(state, s);
        // migrate legacy 3-template AI names → 6 Ghostlight templates (P1.6)
        if (AI_MIGRATE[state.ai]) state.ai = AI_MIGRATE[state.ai];
        if (state.robot && AI_MIGRATE[state.robot.ai]) state.robot.ai = AI_MIGRATE[state.robot.ai];
        if (Array.isArray(state.roster)) state.roster.forEach(r => { if (AI_MIGRATE[r.ai]) r.ai = AI_MIGRATE[r.ai]; });
        // backfill part slots for pre-workbench robots so they never render empty
        const fill = (r) => { for (const slot of PART_SLOTS) if (!r[slot]) r[slot] = STARTER_PARTS[slot]; };
        if (state.robot) fill(state.robot);
        if (Array.isArray(state.roster)) state.roster.forEach(fill);
        // P1.7: reconcile day + mission for saves from before the Day system
        if (state.day == null) state.day = 1;
        if (!state.mission) {
          state.mission = newMission(1);
          if (state.robot) state.mission.objectives.find(o => o.id === 'build-robot').done = true;
          if (state.wins > 0) state.mission.objectives.find(o => o.id === 'win-gate').done = true;
        }
        // P1.8: default the scan/imprint fields for older saves
        if (!Array.isArray(state.ideas)) state.ideas = [];
        if (state.imprintDone == null) state.imprintDone = false;
      }
      savePresent = true;
    }
  } catch {}
}
function refreshHud() {
  const chipsEl = $('hud-chips');
  if (chipsEl) chipsEl.textContent = state.chips;
  $('bot-card').style.display = state.robot ? 'block' : 'none';
  companion.visible = !!state.robot;
  if (state.robot) {
    $('hud-bot-name').textContent = state.robot.name;
    $('hud-bot-detail').textContent = `${state.robot.frame} FRAME • ${state.ai || 'NO AI CORE'}`;
    const n = createRobot(state.robot.frame, state.robot.name, .48, state.robot);
    buddyModel = n;
    companion.clear();
    companion.add(n);
  }
  renderMission();
}
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(640, 360, false);
  camera.left = -23;
  camera.right = 23;
  camera.top = 13;
  camera.bottom = -13;
  camera.updateProjectionMatrix();
}

// --- Interaction ---
function nearBuilding() {
  let best = null, dist = Infinity;
  const candidates = [
    { id: 'forge', x: -9, z: 1.8, d: 2.6, name: 'ENTER HATCHERY • DESIGN A ROBOT' },
    { id: 'trade', x: 9, z: 2.0, d: 2.6, name: 'VISIT SWAP MEET • TRADE PARTS' },
    { id: 'gate', x: 0, z: -5.4, d: 2.2, name: 'ENTER BATTLE GATE • TEST YOUR AI' },
    { id: 'wren', x: -2.2, z: 6.2, d: 1.4, name: 'TALK TO WREN' },
    { id: 'courier', x: 3.2, z: 1.6, d: 1.5, name: 'TALK TO COURIER' }
  ];
  for (const c of candidates) {
    const d = Math.hypot(player.position.x - c.x, player.position.z - c.z);
    if (d < c.d && d < dist) { best = c; dist = d; }
  }
  return best;
}
function showDialogue(speaker, lines) {
  dialogueQueue = lines.slice();
  dialogueOpen = true;
  $('speaker').textContent = speaker;
  $('dialogue').style.display = 'block';
  sfxSelect();
  advanceDialogue();
}
function advanceDialogue() {
  if (!dialogueQueue.length) {
    dialogueOpen = false;
    $('dialogue').style.display = 'none';
    return;
  }
  $('dialogue-line').textContent = dialogueQueue.shift();
  sfxBlip();
}
function openPanel(tab = 'build') {
  if (dialogueOpen) {
    dialogueOpen = false;
    $('dialogue').style.display = 'none';
  }
  modalTab = tab;
  sfxConfirm();
  renderPanel();
  $('modal-shade').style.display = 'flex';
}
function closePanel() {
  $('modal-shade').style.display = 'none';
}
function frameCard(frame, desc, color, tag) {
  return `<button class="choice ${state.selectedFrame === frame ? 'selected' : ''}" data-frame="${frame}"><span class="chip">${tag}</span><i class="swatch" style="background:#${new THREE.Color(color).getHexString()}"></i><strong>${frame}</strong><p>${desc}</p></button>`;
}

// --- Panels (Hatchery / Swap Meet / AI core) ---
function renderPanel() {
  const isTrade = modalTab === 'trade';
  const isAI = modalTab === 'ai';
  let title = isTrade || modalTab === 'robots' ? 'NEIGHBORHOOD SWAP MEET' : isAI ? 'GHOSTLIGHT AI CORE BAY' : 'THE HATCHERY';
  let kick = isTrade || modalTab === 'robots' ? 'LOCAL EXCHANGE • NO SIGNAL LEAVES TOWN' : isAI ? 'A GOOD MIND MAKES A GOOD PARTNER' : 'BUILD SOMETHING THAT CAN CHOOSE';
  let html = `<header class="panel-head"><div><div class="panel-title">${title}</div><div class="panel-kicker">${kick}</div></div><div class="inventory">DATA CHIPS <b style="color:var(--lime)">${state.chips}</b> &nbsp; SCRAP <b style="color:var(--pink)">${state.scrap}</b></div><button class="close" id="close-panel">ESC ✕</button></header>`;
  if (interaction?.id === 'forge') html += `<nav class="tabs"><button class="tab ${modalTab === 'build' ? 'active' : ''}" data-tab="build">01 / ASSEMBLE</button><button class="tab ${isAI ? 'active' : ''}" data-tab="ai">02 / AI CORE</button></nav>`;
  if (interaction?.id === 'trade') html += `<nav class="tabs"><button class="tab ${isTrade ? 'active' : ''}" data-tab="trade">PARTS EXCHANGE</button><button class="tab ${modalTab === 'robots' ? 'active' : ''}" data-tab="robots">ROBOT EXCHANGE</button></nav>`;
  if (isTrade) {
    html += `<p class="section-note">Moss keeps the old town's swap board. Trade data chips for useful hardware; every deal is local and neighbor-to-neighbor.</p><div class="trade-list">
 <div class="trade-row"><div class="trade-icon">▣</div><div class="trade-copy"><strong>PRISM PLATING</strong><small>Bright armor • +10 max HP • ${state.parts.prism ? 'OWNED' : '2 data chips'}</small></div><button data-buy="prism" ${state.chips < 2 || state.parts.prism ? 'disabled' : ''}>${state.parts.prism ? 'IN KIT' : 'TRADE 2'}</button></div>
 <div class="trade-row"><div class="trade-icon">⌁</div><div class="trade-copy"><strong>PHASE COIL</strong><small>Resonant wire • strengthens AI Drive • ${state.parts.coil ? 'OWNED' : '3 data chips'}</small></div><button data-buy="coil" ${state.chips < 3 || state.parts.coil ? 'disabled' : ''}>${state.parts.coil ? 'IN KIT' : 'TRADE 3'}</button></div>
 <div class="trade-row"><div class="trade-icon">✦</div><div class="trade-copy"><strong>SCRAP BUNDLE</strong><small>Three salvage bits for one data chip • SCRAP: ${state.scrap}</small></div><button data-sell="scrap" ${state.scrap < 3 ? 'disabled' : ''}>TRADE 3</button></div>
 <div class="trade-row"><div class="trade-icon">↔</div><div class="trade-copy"><strong>NEIGHBORHOOD BARTER</strong><small>Give Moss 2 spare parts; receive 2 data chips</small></div><button data-sell="parts" ${state.scrap < 2 ? 'disabled' : ''}>BARTER 2</button></div></div>`;
  } else if (modalTab === 'robots') {
    const robots = state.roster || [];
    html += `<p class="section-note">A partner is never inventory. The town trade board can copy a robot's frame pattern for a neighbor, but the original stays with you. Register a new frame at the Hatchery.</p><div class="trade-list">${robots.length ? robots.map((r, i) => `<div class="trade-row"><div class="trade-icon">${i === 0 ? '✦' : '▣'}</div><div class="trade-copy"><strong>${r.name}</strong><small>${r.frame} FRAME • ${r.ai || 'UNTRAINED'} AI • ${r.active ? 'YOUR PARTNER' : 'ROSTER'}</small></div><button data-active="${i}" ${r.active ? 'disabled' : ''}>${r.active ? 'ACTIVE' : 'SET PARTNER'}</button></div>`).join('') : `<p class="section-note">No robot designs registered yet. The Hatchery is just down the lane.</p>`}</div>`;
  } else if (isAI) {
    html += `<p class="section-note">A Ghostlight is a small, trained mind. Install one to set how your partner reads danger — and how its AI Drive behaves in battle. There are six, and none of them agree on anything.</p><div class="cards ai-cards">`;
    for (const [id, t] of Object.entries(AI_TEMPLATES)) {
      html += `<button class="choice ${state.selectedAI === id ? 'selected' : ''}" data-ai="${id}"><span class="chip">${t.tag}</span><i class="swatch" style="background:${t.color}"></i><strong>${id}</strong><p>${t.desc}</p><small class="ai-line">${t.line}</small></button>`;
    }
    html += `</div><div class="field-row"><div class="field"><label>Selected core</label><input value="${state.selectedAI} • Ghostlight class" readonly></div><button class="action" id="install-ai" ${!state.robot || state.chips < 1 ? 'disabled' : ''}>${state.ai === state.selectedAI ? 'CORE INSTALLED' : 'INSTALL • 1 DATA CHIP'}</button></div><p class="section-note">${!state.robot ? 'First assemble a frame, then come back to install its mind.' : state.ai ? `Installed now: ${state.ai} (${AI_TEMPLATES[state.ai]?.tag || 'UNTRAINED'}). Changing cores costs one data chip.` : 'One data chip covers the first core installation.'}</p>`;
  } else {
    html += `<p class="section-note">A partner is frame, limbs, battery, core, and mind. Pick the frame; the Hatchery fits the rest. Every part changes how your partner fights — POWER feeds the AI Drive.</p><div class="cards">${frameCard('CINDER', 'Hot-start frame. Hits a little harder, with less armor.', 0xe87948, 'QUICK')}${frameCard('TIDAL', 'A steady all-rounder with a bright, stable core.', 0x399cce, 'BALANCED')}${frameCard('MOSS', 'Sturdy legs and a patient shield response.', 0x54a46d, 'STURDY')}</div><div class="field-row"><div class="field"><label>Partner call sign</label><input id="robot-name" maxlength="12" value="${state.robot?.name || 'PIP'}" placeholder="e.g. PIP"></div><button class="action" id="build-robot" ${state.chips < 3 ? 'disabled' : ''}>${state.robot ? 'REGISTER ANOTHER • 3 CHIPS' : 'BUILD PARTNER • 3 CHIPS'}</button></div>${statPreview()}`;
    html += state.robot
      ? `<p class="section-note">PARTS BAY — rework ${state.robot.name}’s loadout. Each slot has three fittings; swapping is free while you are in the Hatchery.</p><div class="parts-bay">${PART_SLOTS.map(slotRow).join('')}</div>`
      : `<p class="section-note">A first build costs 3 data chips and ships with a starter kit: visor, grip hands, strider legs, a standard cell, and a pulse core. Your starter crate contains 8.</p>`;
  }
  html += `<div class="message" id="panel-message">${state.message || ''}</div>`;
  $('panel').innerHTML = html;
  $('close-panel').onclick = closePanel;
  $('panel').querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { modalTab = b.dataset.tab; state.message = ''; sfxSelect(); renderPanel(); });
  $('panel').querySelectorAll('[data-frame]').forEach(b => b.onclick = () => { state.selectedFrame = b.dataset.frame; sfxSelect(); renderPanel(); });
  $('panel').querySelectorAll('[data-ai]').forEach(b => b.onclick = () => { state.selectedAI = b.dataset.ai; sfxSelect(); renderPanel(); });
  $('panel').querySelectorAll('[data-buy]').forEach(b => b.onclick = () => buyPart(b.dataset.buy));
  $('panel').querySelectorAll('[data-sell]').forEach(b => b.onclick = () => sellTrade(b.dataset.sell));
  $('panel').querySelectorAll('[data-active]').forEach(b => b.onclick = () => setActiveRobot(+b.dataset.active));
  $('panel').querySelectorAll('[data-slot]').forEach(b => b.onclick = () => setPart(b.dataset.slot, b.dataset.part));
  $('build-robot')?.addEventListener('click', buildRobot);
  $('install-ai')?.addEventListener('click', installAI);
}
function panelMessage(s) {
  state.message = s;
  const m = $('panel-message');
  if (m) m.textContent = s;
}
function partModText(p) {
  const bits = [];
  if (p.hp) bits.push(`HP ${p.hp > 0 ? '+' : ''}${p.hp}`);
  if (p.atk) bits.push(`PWR ${p.atk > 0 ? '+' : ''}${p.atk}`);
  return bits.length ? bits.join(' · ') : '±0';
}
function previewStats() {
  const base = state.robot || STARTER_PARTS;
  const robot = { frame: state.selectedFrame, head: base.head, arms: base.arms, legs: base.legs, battery: base.battery, core: base.core };
  return robotStats(robot);
}
function statPreview() {
  const s = previewStats();
  const ai = state.robot ? (state.ai || '—') : (state.selectedAI || '—');
  return `<div class="stat-preview"><div class="stat"><span class="stat-k">MAX HP</span><span class="stat-v lime">${s.hp}</span></div><div class="stat"><span class="stat-k">POWER</span><span class="stat-v cyan">${s.atk}</span></div><div class="stat"><span class="stat-k">AI MIND</span><span class="stat-v pink">${ai}</span></div></div>`;
}
function slotRow(slot) {
  const cur = state.robot?.[slot] || STARTER_PARTS[slot];
  const opts = Object.entries(PARTS_LIBRARY).filter(([, p]) => p.slot === slot)
    .map(([id, p]) => `<button class="part-opt ${id === cur ? 'on' : ''}" data-slot="${slot}" data-part="${id}" title="${p.desc}"><span class="pg">${p.glyph}</span><span class="pn">${p.name}</span><span class="ps">${partModText(p)}</span></button>`).join('');
  return `<div class="part-slot"><div class="slot-head">${slot.toUpperCase()}<span class="slot-cur">${PARTS_LIBRARY[cur]?.name || '—'}</span></div><div class="part-opts">${opts}</div></div>`;
}
function setPart(slot, id) {
  if (!state.robot || !PARTS_LIBRARY[id]) return;
  state.robot[slot] = id;
  const idx = state.roster?.findIndex(r => r.name === state.robot.name && r.frame === state.robot.frame && r.active);
  if (idx >= 0) state.roster[idx][slot] = id;
  save();
  refreshHud();
  sfxConfirm();
  state.message = `${PARTS_LIBRARY[id].name} fitted to the ${slot.toUpperCase()} slot.`;
  renderPanel();
}
function buildRobot() {
  if (state.chips < 3) return;
  const input = $('robot-name');
  const name = (input?.value || 'PIP').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 12) || 'PIP';
  state.chips -= 3;
  const robot = { name, frame: state.selectedFrame, ai: null, active: true, ...STARTER_PARTS };
  state.roster = (state.roster || []).map(r => ({ ...r, active: false }));
  state.roster.push(robot);
  state.roster.forEach((r, i) => r.active = i === state.roster.length - 1);
  state.robot = robot;
  state.ai = null;
  save();
  refreshHud();
  sfxRobot();
  completeObjective('build-robot');
  state.message = `${name} is registered. A frame is only a beginning; choose a Ghostlight core next.`;
  modalTab = 'ai';
  renderPanel();
}
function setActiveRobot(i) {
  state.roster = (state.roster || []).map((r, j) => ({ ...r, active: j === i }));
  state.robot = state.roster[i];
  state.ai = state.robot.ai || null;
  save();
  refreshHud();
  sfxConfirm();
  state.message = `${state.robot.name} is your partner now.`;
  modalTab = 'robots';
  renderPanel();
}
function installAI() {
  if (!state.robot || state.chips < 1) return;
  if (state.ai !== state.selectedAI) state.chips--;
  state.ai = state.selectedAI;
  state.robot.ai = state.selectedAI;
  state.roster = state.roster || [];
  const idx = state.roster.findIndex(r => r.name === state.robot.name && r.frame === state.robot.frame && r.active);
  if (idx >= 0) state.roster[idx].ai = state.selectedAI;
  save();
  refreshHud();
  sfxConfirm();
  state.message = `${state.selectedAI} core installed. Your partner can think for itself now.`;
  renderPanel();
}
function buyPart(part) {
  const cost = part === 'prism' ? 2 : 3;
  if (state.chips < cost || state.parts[part]) return;
  state.chips -= cost;
  state.parts[part] = true;
  save();
  refreshHud();
  sfxConfirm();
  state.message = `Moss hands over the ${part === 'prism' ? 'Prism Plating' : 'Phase Coil'}. Good swap.`;
  renderPanel();
}
function sellTrade(kind) {
  if (kind === 'scrap') {
    if (state.scrap < 3) return;
    state.scrap -= 3;
    state.chips++;
    state.message = 'Three salvage bits make one clean data chip.';
  } else {
    if (state.scrap < 2) return;
    state.scrap -= 2;
    state.chips += 2;
    state.message = 'A fair barter: two spare bits for two data chips.';
  }
  save();
  refreshHud();
  sfxConfirm();
  renderPanel();
}
function interact() {
  if (activeModal() || isDayCardOpen()) return;
  if (dialogueOpen) { advanceDialogue(); return; }
  if (state.zone === 'battle') return;
  const c = interaction || nearBuilding();
  if (!c) {
    showDialogue('BITSpring SIGNAL', ['The plaza hums beneath your feet. A town can be small and still have room for a whole future.']);
    return;
  }
  if (c.id === 'wren') {
    completeObjective('meet-wren');
    showDialogue('WREN', [
      'Hey, new neighbor. I’m Wren. Bitspring is a little town built where three old network routes forgot to end.',
      'The Hatchery makes frames. The Swap Meet keeps our parts moving. The Battle Gate is where we check that our training still works.',
      'A robot is more than its shell. Take a Ghostlight from the Hatchery and teach your partner what kind of trouble to get into.',
      'One strange thing: the Gate has been hearing a second heartbeat in the static. Maybe your new friend can listen back.'
    ]);
  } else if (c.id === 'forge') {
    openPanel(state.robot ? 'build' : 'build');
  } else if (c.id === 'courier') {
    imprintCourier();
  } else if (c.id === 'trade') {
    openPanel('trade');
  } else if (c.id === 'gate') {
    if (!state.robot) {
      showDialogue('BATTLE GATE', ['The old gate wakes up, then politely declines. “Partner registration required.”', 'The Hatchery is west of the plaza.']);
      return;
    }
    if (!state.ai) {
      showDialogue('BATTLE GATE', ['Your partner answers the Gate’s ping, but the signal cannot find an AI core.', 'Install a Ghostlight at the Hatchery first.']);
      return;
    }
    startBattle();
  }
}
function activeModal() {
  return $('modal-shade').style.display === 'flex';
}
function collides(x, z) {
  if (x < -15 || x > 15 || z < -10 || z > 10) return true;
  return obstacles.some(o => Math.abs(x - o.x) < o.w / 2 + .35 && Math.abs(z - o.z) < o.d / 2 + .35);
}
function movePlayer(dt) {
  if (state.zone !== 'town' || activeModal() || dialogueOpen || !state.started || isDayCardOpen()) return;
  let dx = 0, dz = 0;
  if (keys.KeyW || keys.ArrowUp) dz -= 1;
  if (keys.ArrowDown) dz += 1;
  if (keys.KeyS && !scanningNow()) dz += 1;
  if (keys.KeyA || keys.ArrowLeft) dx -= 1;
  if (keys.KeyD || keys.ArrowRight) dx += 1;
  if (dx && dz) { dx *= .707; dz *= .707; }
  const speed = 5.2;
  const nx = player.position.x + dx * speed * dt, nz = player.position.z + dz * speed * dt;
  if (!collides(nx, player.position.z)) player.position.x = nx;
  if (!collides(player.position.x, nz)) player.position.z = nz;
  if (dx || dz) player.rotation.y = Math.atan2(dx, dz);
  const target = new THREE.Vector3(player.position.x, 0, player.position.z);
  camera.position.set(target.x + 20, target.y + 26, target.z + 25);
  camera.lookAt(target);
  const followX = player.position.x - .95, followZ = player.position.z + .35;
  companion.position.x += (followX - companion.position.x) * Math.min(1, dt * 5);
  companion.position.z += (followZ - companion.position.z) * Math.min(1, dt * 5);
}
function updatePrompt() {
  if (!state.started || state.zone !== 'town' || dialogueOpen || activeModal() || isDayCardOpen()) {
    $('prompt').style.display = 'none';
    return;
  }
  interaction = nearBuilding();
  if (interaction) {
    $('prompt-text').textContent = interaction.name;
    $('prompt').style.display = 'block';
  } else $('prompt').style.display = 'none';
}

// --- Battle ---
function createArena() {
  battleRoot.clear();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 12), mat(0x153344));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -.05;
  battleRoot.add(ground);
  for (let x = -9; x <= 9; x += 2)
    for (let z = -5; z <= 5; z += 2)
      plane(battleRoot, x, .01, z, 1.88, 1.88, ((x + z) % 4 === 0) ? 0x1b4351 : 0x173a49);
  // luminous lane divider and four chipped boundary pylons
  box(battleRoot, 0, .05, 0, .15, .08, 10.5, palette.cyan, { emissive: palette.cyan, emissiveIntensity: .35 });
  for (const [x, z] of [[-9, -5], [9, -5], [-9, 5], [9, 5]]) {
    box(battleRoot, x, .72, z, .45, 1.45, .45, palette.cyan, { emissive: palette.cyan, emissiveIntensity: .3 });
    box(battleRoot, x, 1.52, z, .72, .2, .72, palette.lime, { emissive: palette.lime, emissiveIntensity: .7 });
  }
  const hero = createRobot(state.robot.frame, state.robot.name, 1.45, state.robot);
  hero.position.set(-4, 0, 0);
  battleRoot.add(hero);
  const enemy = createRobot('CINDER', 'NULL-01', 1.38);
  enemy.position.set(4, 0, 0);
  enemy.rotation.y = Math.PI;
  battleRoot.add(enemy);
  battle.heroModel = hero;
  battle.enemyModel = enemy;
  camera.position.set(13, 17, 18);
  camera.lookAt(0, .5, 0);
}
// --- Battle v2 (Battle-Network-style chip deck) ---
const CHIP_LIBRARY = {
  ping:  { name: 'PING',     kind: 'atk',   dmg: 12, glyph: '▸', tone: 'cyan' },
  boom:  { name: 'BOOM',     kind: 'atk',   dmg: 20, glyph: '✦', tone: 'pink' },
  drive: { name: 'AI DRIVE', kind: 'atk',   glyph: '⌁', tone: 'lime' },
  guard: { name: 'GUARD',    kind: 'guard', glyph: '▣', tone: 'cyan' },
  patch: { name: 'PATCH',    kind: 'heal',  amount: 18, glyph: '✚', tone: 'lime' },
  dash:  { name: 'DASH',     kind: 'dash',  glyph: '»', tone: 'pink' }
};
const COLUMN_NAMES = ['LEFT', 'MID', 'RIGHT'];
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } }
function buildDeck() {
  const deck = [];
  const add = (id, n) => { for (let i = 0; i < n; i++) deck.push({ id, ...CHIP_LIBRARY[id] }); };
  add('ping', 5); add('boom', 3); add('drive', 2); add('guard', 3); add('patch', 2); add('dash', 1);
  return deck;
}
function chipDmg(chip) { return chip.dmg; }
function chipDesc(chip) {
  if (chip.id === 'drive') {
    const t = aiTemplate();
    const dmg = (t.wild ? 20 : (t.driveBase ?? 20)) + robotStats(state.robot).atk;
    const fx = [];
    if (t.heal) fx.push(`RESTORE ${state.parts.coil ? t.heal + 4 : t.heal}`);
    if (t.recoil) fx.push(`RECKLESS −${t.recoil}`);
    if (t.guard) fx.push('GUARD');
    if (t.weaken) fx.push('FOG');
    return t.wild ? `GAMBLE ${dmg}` : `STRIKE ${dmg}${fx.length ? ' ' + fx.join(' ') : ''}`;
  }
  if (chip.kind === 'atk') return `STRIKE ${chip.dmg}`;
  if (chip.kind === 'guard') return 'HALVE NEXT HIT';
  if (chip.kind === 'heal') return `RESTORE ${chip.amount}`;
  return 'EVADE + REPOSITION';
}
function drawTo(n) {
  while (battle.hand.length < n) {
    if (!battle.deck.length) { if (!battle.discard.length) break; battle.deck = battle.discard; battle.discard = []; shuffle(battle.deck); }
    battle.hand.push(battle.deck.pop());
  }
}
function rollEnemyIntent() {
  const options = [
    { name: 'HEAVY STRIKE', kind: 'hit', dmg: 14, col: battle.heroPos.c },
    { name: 'SPLIT SHOT', kind: 'hit', dmg: 9, col: Math.floor(Math.random() * 3) },
    { name: 'RECHARGE', kind: 'heal', amount: 8 }
  ];
  if (battle.round >= 3) options.push({ name: 'OVERRUN', kind: 'hit', dmg: 18, col: Math.floor(Math.random() * 3) });
  battle.enemyIntent = options[Math.floor(Math.random() * options.length)];
}
function startBattle() {
  interaction = null;
  state.zone = 'battle';
  renderMission();
  setMusicTheme('battle');
  townRoot.visible = false;
  actorRoot.visible = false;
  battleRoot.visible = true;
  const max = robotMaxHP();
  battle = {
    heroHP: max, heroMax: max, enemyHP: 48, enemyMax: 48,
    deck: buildDeck(), hand: [], discard: [], queue: [],
    heroPos: { c: 1, r: 1 }, enemyPos: { c: 1, r: 1 }, moved: false,
    guard: false, evade: false, weakened: false, round: 1, done: false, enemyIntent: null, heroModel: null, enemyModel: null
  };
  shuffle(battle.deck);
  drawTo(5);
  battleIntensity = 0;
  createArena();
  battleRoot.visible = true;
  $('zone-name').textContent = 'BATTLE GATE';
  $('zone-sub').textContent = 'ROGUE SIGNAL • NULL-01';
  $('hud-right').innerHTML = '<strong>LIVE MATCH</strong><br>FIRST SIGNAL WINS';
  $('battle-ui').style.display = 'grid';
  $('battle-finish').style.display = 'none';
  rollEnemyIntent();
  updateBattleUI('A rogue signal crawls out of the static. Line up your column and play up to three chips.');
}
function robotMaxHP() {
  return robotStats(state.robot).hp;
}
function renderHand() {
  const el = $('chip-hand');
  if (!el) return;
  el.innerHTML = battle.hand.map((c, i) => `<button class="chip-card ${c.tone}${battle.queue.includes(c) ? ' queued' : ''}" data-chip="${i}"><span class="chip-glyph">${c.glyph}</span><strong>${c.name}</strong><small>${chipDesc(c)}</small></button>`).join('');
  el.querySelectorAll('[data-chip]').forEach(b => b.onclick = () => toggleChip(+b.dataset.chip));
}
function renderQueue() {
  document.querySelectorAll('#battle-ui .qslot').forEach((s, i) => {
    const c = battle.queue[i];
    s.textContent = c ? c.glyph : '';
    s.className = 'qslot' + (c ? ` filled ${c.tone}` : '');
  });
}
function renderField() {
  const heroEl = $('hero-grid'), enemyEl = $('enemy-grid');
  if (!heroEl || !enemyEl) return;
  heroEl.innerHTML = ''; enemyEl.innerHTML = '';
  const aimCol = (battle.enemyIntent?.kind === 'hit' && !battle.done) ? battle.enemyIntent.col : -1;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    const hc = document.createElement('div');
    hc.className = 'cell' + (battle.heroPos.r === r && battle.heroPos.c === c ? ' hero' : (c === aimCol ? ' aim' : ''));
    hc.onclick = () => moveHero(c, r);
    heroEl.appendChild(hc);
    const ec = document.createElement('div');
    ec.className = 'cell' + (battle.enemyPos.r === r && battle.enemyPos.c === c ? ' enemy' : '');
    enemyEl.appendChild(ec);
  }
}
function moveHero(c, r) {
  if (!battle || battle.done || battleAnimating || battle.moved) return;
  battle.heroPos = { c, r };
  battle.moved = true;
  sfxSelect();
  updateBattleUI('You sidestep to a new panel.');
}
function toggleChip(handIdx) {
  if (battle.done || battleAnimating) return;
  const chip = battle.hand[handIdx];
  if (!chip) return;
  const qi = battle.queue.indexOf(chip);
  if (qi >= 0) battle.queue.splice(qi, 1);
  else if (battle.queue.length < 3) battle.queue.push(chip);
  else { sfxSelect(); updateBattleUI('At most three chips per turn.'); return; }
  sfxSelect();
  updateBattleUI();
}
function updateBattleUI(log) {
  $('hero-hp-text').textContent = `${Math.max(0, battle.heroHP)} / ${battle.heroMax}`;
  $('enemy-hp-text').textContent = `${Math.max(0, battle.enemyHP)} / ${battle.enemyMax}`;
  $('hero-hp-bar').style.width = `${Math.max(0, battle.heroHP) / battle.heroMax * 100}%`;
  $('enemy-hp-bar').style.width = `${Math.max(0, battle.enemyHP) / battle.enemyMax * 100}%`;
  $('hero-label').textContent = state.robot?.name || 'YOUR UNIT';
  if (log) $('battle-log').textContent = log;
  if (battle.done) {
    $('enemy-intent').innerHTML = '';
    $('battle-turn').textContent = 'MATCH COMPLETE';
  } else {
    const it = battle.enemyIntent;
    $('enemy-intent').innerHTML = it.kind === 'heal'
      ? '<b class="i-heal">NULL-01 TELEGRAPHS: RECHARGE</b>'
      : `<b class="i-hit">NULL-01 TELEGRAPHS: ${it.name} → ${COLUMN_NAMES[it.col]} COLUMN</b>`;
    $('battle-turn').textContent = battleAnimating ? 'ROGUE UNIT THINKING…' : 'YOUR TURN • PLAY UP TO 3 CHIPS';
  }
  $('chip-execute').disabled = battle.done || battleAnimating || !battle.queue.length;
  renderHand();
  renderQueue();
  renderField();
}
function executeQueue() {
  if (!battle || battle.done || battleAnimating) return;
  if (!battle.queue.length) { updateBattleUI('Play at least one chip before executing.'); return; }
  battleAnimating = true;
  const chips = battle.queue.slice();
  battle.queue = [];
  const linedUp = battle.heroPos.c === battle.enemyPos.c;
  let totalDmg = 0;
  const lines = [];
  for (const chip of chips) {
    const hi = battle.hand.indexOf(chip);
    if (hi >= 0) battle.hand.splice(hi, 1);
    battle.discard.push(chip);
    if (chip.kind === 'atk') {
      if (chip.id === 'drive') {
        const s = resolveDrive();
        battle.enemyHP = Math.max(0, battle.enemyHP - s.dmg);
        totalDmg += s.dmg;
        if (s.heal) {
          battle.heroHP = Math.min(battle.heroMax, battle.heroHP + s.heal);
          lines.push(`${state.robot.name} drives for ${s.dmg}; ${state.ai} restores ${s.heal} HP.`);
        } else if (s.recoil) {
          battle.heroHP = Math.max(0, battle.heroHP - s.recoil);
          lines.push(`${state.robot.name} overdrives for ${s.dmg} — ${s.recoil} HP recoil.`);
        } else if (s.guard) {
          battle.guard = true;
          lines.push(`${state.robot.name} drives ${s.dmg}, rooting into guard.`);
        } else if (s.weaken) {
          battle.weakened = true;
          lines.push(`${state.robot.name} drives ${s.dmg} and fogs NULL-01’s aim.`);
        } else if (s.wild) {
          lines.push(`${state.robot.name} gambles — HOLLOW lands ${s.dmg}.`);
        } else {
          lines.push(`${state.robot.name} fires AI DRIVE for ${s.dmg}.`);
        }
      } else {
        const dmg = chipDmg(chip) + (linedUp ? 3 : 0);
        battle.enemyHP = Math.max(0, battle.enemyHP - dmg);
        totalDmg += dmg;
        lines.push(`${state.robot.name} fires ${chip.name} for ${dmg}${linedUp ? ' (lined up!)' : ''}.`);
      }
    } else if (chip.kind === 'guard') {
      battle.guard = true;
      lines.push(`${state.robot.name} raises a guard.`);
    } else if (chip.kind === 'heal') {
      battle.heroHP = Math.min(battle.heroMax, battle.heroHP + chip.amount);
      lines.push(`A field ${chip.name.toLowerCase()} restores ${chip.amount} HP.`);
    } else if (chip.kind === 'dash') {
      battle.evade = true;
      lines.push(`${state.robot.name} dashes — the next hit will slip past.`);
    }
  }
  if (totalDmg > 0) {
    sfxHeavyHit();
    battle.enemyModel.position.x += .35;
    setTimeout(() => battle.enemyModel.position.x -= .35, 160);
  } else sfxHit();
  updateBattleUI(lines.join(' '));
  if (battle.enemyHP <= 0) { setTimeout(() => finishBattle(true), 600); return; }
  setTimeout(() => enemyAct(), 700);
}
function enemyAct() {
  const intent = battle.enemyIntent;
  let log;
  if (intent.kind === 'heal') {
    const healed = Math.min(battle.enemyMax - battle.enemyHP, intent.amount);
    battle.enemyHP = Math.min(battle.enemyMax, battle.enemyHP + intent.amount);
    log = `NULL-01 recharges ${healed} HP.`;
    sfxGuard();
  } else if (battle.evade) {
    log = `${state.robot.name} slipped the ${intent.name} entirely.`;
    sfxSelect();
  } else if (battle.heroPos.c !== intent.col) {
    log = `The ${intent.name} rakes the ${COLUMN_NAMES[intent.col]} column — you step clear.`;
    sfxSelect();
  } else {
    let dmg = intent.dmg;
    if (battle.guard) dmg = Math.ceil(dmg / 2);
    if (battle.weakened) dmg = Math.ceil(dmg / 2);
    battle.heroHP = Math.max(0, battle.heroHP - dmg);
    sfxEnemyHit();
    battle.heroModel.position.x -= .25;
    setTimeout(() => battle.heroModel.position.x += .25, 160);
    const tags = [];
    if (battle.guard) tags.push('guarded');
    if (battle.weakened) tags.push('fogged');
    log = `NULL-01 lands ${intent.name} for ${dmg}${tags.length ? ' (' + tags.join(', ') + ')' : ''}.`;
  }
  battle.guard = false;
  battle.evade = false;
  battle.weakened = false;
  battle.enemyPos = { c: Math.floor(Math.random() * 3), r: Math.floor(Math.random() * 3) };
  battle.round++;
  battleIntensity = Math.min(1, (battle.round - 1) / 3);
  battleAnimating = false;
  if (battle.heroHP <= 0) {
    updateBattleUI(log);
    setTimeout(() => finishBattle(false), 500);
    return;
  }
  rollEnemyIntent();
  battle.moved = false;
  drawTo(5);
  updateBattleUI(log + ' Your turn — read the telegraph and line up.');
}
function finishBattle(won) {
  battle.done = true;
  battleAnimating = false;
  playJingle(won);
  if (won) {
    state.wins++;
    completeObjective('win-gate');
    state.chips += 4;
    state.scrap += 2;
    const dropPool = ['prism', 'coil'].filter(p => !state.parts[p]);
    let dropLine;
    if (dropPool.length) {
      const drop = dropPool[Math.floor(Math.random() * dropPool.length)];
      state.parts[drop] = true;
      dropLine = drop === 'prism' ? 'It dropped a PRISM PLATING — bright armor, now yours.' : 'It dropped a PHASE COIL — resonant wire for your AI Drive.';
    } else {
      state.scrap += 2;
      dropLine = 'Its cache held only more salvage — +2 scrap.';
    }
    save();
    refreshHud();
    $('finish-title').textContent = 'SIGNAL SECURED';
    $('finish-copy').textContent = `NULL-01 was carrying a packet of stolen memories. You recovered 4 data chips and 2 salvage. ${dropLine} The heartbeat in the static is still there, farther out.`;
  } else {
    $('finish-title').textContent = 'PARTNER DOWN';
    $('finish-copy').textContent = `${state.robot.name} is safe. Wren will patch you up back in town; the Gate can wait until you are ready.`;
  }
  $('battle-finish').style.display = 'flex';
  updateBattleUI(won ? 'You found the soft spot in NULL-01’s shell.' : 'The match is over.');
  $('finish-button').onclick = returnTown;
}
function returnTown() {
  state.zone = 'town';
  setMusicTheme('town');
  battleRoot.visible = false;
  townRoot.visible = true;
  actorRoot.visible = true;
  camera.position.set(player.position.x + 20, 26, player.position.z + 25);
  camera.lookAt(player.position.x, 0, player.position.z);
  $('battle-ui').style.display = 'none';
  $('battle-finish').style.display = 'none';
  $('zone-name').textContent = 'BITSPRING';
  $('zone-sub').textContent = 'LOWER CIRCUIT • HOME SECTOR';
  $('hud-right').innerHTML = `<strong>DAY 01</strong><br>DATA CHIPS <b id=\"hud-chips\">${state.chips}</b>`;
  save();
  refreshHud();
  if (battle?.heroHP <= 0) {
    showDialogue('WREN', [
      `${state.robot.name} did great. A bad match is still a good lesson. I gave your partner a full charge.`,
      `Null-01 wasn’t a local bot. I’ve never seen a signal move like that through the old route.`
    ]);
  }
  if (state.mission?.teaserPending) {
    state.mission.teaserPending = false;
    save();
    showDayEndCard();
  }
}

// --- Boot / start ---
const NEW_BTN_HTML = 'NEW GAME<br><small style="font:9px \'Space Mono\';color:#d8f8bc">PRESS ENTER</small>';
let confirmNew = false;
function hasProgress() {
  return savePresent && (state.introSeen || state.robot || state.wins > 0 || (state.roster && state.roster.length > 0));
}
function updateTitle() {
  const cont = $('continue-button');
  if (hasProgress()) {
    cont.style.display = 'block';
    $('continue-sub').textContent = state.robot ? `${(state.robot.name || 'PARTNER').toUpperCase()} • ${state.ai || 'NO AI CORE'}` : 'RESUME DAY 01';
  } else {
    cont.style.display = 'none';
  }
}
function bootGame() {
  state.started = true;
  $('start-screen').style.display = 'none';
  $('hud').style.display = 'flex';
  $('music-toggle').style.display = 'block';
  $('volume-ctl').style.display = 'flex';
  initAudio();
  if (settings.musicOn) startMusic(); else setMusicButton();
  refreshHud();
}
function begin() {
  if (state.started) return;
  confirmNew = false;
  $('start-button').innerHTML = NEW_BTN_HTML;
  load();
  buildTown();
  bootGame();
  if (!state.introSeen) {
    state.introSeen = true;
    state.mission = newMission(1);
    save();
    renderMission();
    showDayCard({
      kicker: 'EPISODE 01 — HOME SIGNAL',
      title: 'DAY 1',
      sub: 'FIRST CONTACT',
      copy: 'The Signal wakes for seven days. Today it only watches. Meet Wren, build your partner, and prove yourself at the Battle Gate. Don’t let the town forget you.',
      buttonLabel: 'BEGIN ▸',
      onDone: () => showDialogue('BITSpring SIGNAL', [
        'A new day starts in Bitspring, at the end of the old network. Wren is waiting near the plaza.',
        'Walk to the Hatchery when you are ready. A starter crate is already paid for.'
      ])
    });
  }
}
function newGame() {
  if (state.started) return;
  if (hasProgress() && !confirmNew) {   // safety: one extra click before erasing a save
    confirmNew = true;
    $('start-button').innerHTML = 'ERASE SAVE?<br><small style="font:9px \'Space Mono\';color:#ffb3d0">CLICK AGAIN TO CONFIRM</small>';
    sfxSelect();
    return;
  }
  confirmNew = false;
  Object.assign(state, { started: false, zone: 'town', chips: 8, scrap: 1, parts: {}, robot: null, ai: null, roster: [], day: 1, mission: null, activeTab: 'build', selectedFrame: 'TIDAL', selectedAI: 'KINDLE', message: '', introSeen: false, wins: 0, ideas: [], imprintDone: false });
  try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(SAVE_KEY_V1); } catch {}   // a confirmed erase clears both keys
  savePresent = false;
  begin();
}
function frameLoop() {
  requestAnimationFrame(frameLoop);
  const dt = Math.min(clock.getDelta(), .04);
  movePlayer(dt);
  updatePrompt();
  updateScan();
  if (state.zone === 'town' && state.robot) {
    const t = performance.now() / 500;
    buddyModel.position.y = .04 + Math.sin(t) * .06;
    buddyModel.rotation.y = Math.sin(t * .55) * .12;
    if (buddyModel.coreMat) buddyModel.coreMat.emissiveIntensity = .55 + Math.sin(performance.now() / 320) * .3;
  }
  const courierNpc = npcs.find(n => n.def.id === 'courier');
  if (courierNpc?.model?.coreMat) {
    const cm = courierNpc.model.coreMat;
    if (state.imprintDone) cm.emissiveIntensity = .7 + Math.sin(performance.now() / 400) * .25;
    else cm.emissiveIntensity = Math.sin(performance.now() / 70) > .3 ? .75 : .12;
  }
  if (battle && !battle.done) {
    battle.heroModel && (battle.heroModel.rotation.y = -.12 + Math.sin(performance.now() / 600) * .045);
    battle.enemyModel && (battle.enemyModel.rotation.y = Math.PI + .12 + Math.sin(performance.now() / 520) * .045);
    if (battle.heroModel?.coreMat) battle.heroModel.coreMat.emissiveIntensity = .55 + Math.sin(performance.now() / 320) * .3;
    if (battle.enemyModel?.coreMat) battle.enemyModel.coreMat.emissiveIntensity = .55 + Math.sin(performance.now() / 300) * .35;
  }
  renderer.render(scene, camera);
}

// --- Input wiring ---
window.addEventListener('resize', resize);
window.addEventListener('keydown', e => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  keys[e.code] = true;
  if (e.repeat) return;
  if (e.code === 'Enter' && !state.started) { begin(); return; }
  if (e.code === 'KeyE') { interact(); return; }
  if (e.code === 'KeyM' && state.started) { toggleMusic(); return; }
  if (e.code === 'Escape') {
    if (activeModal()) closePanel();
    else if (dialogueOpen) { dialogueOpen = false; $('dialogue').style.display = 'none'; }
    return;
  }
  if (isDayCardOpen() && (e.code === 'Enter' || e.code === 'Space')) { $('day-card-button').click(); return; }
  if (dialogueOpen && (e.code === 'Enter' || e.code === 'Space')) advanceDialogue();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });
$('start-button').onclick = newGame;
$('continue-button').onclick = begin;
$('day-card-button').onclick = () => {
  if (!isDayCardOpen()) return;
  $('day-card').style.display = 'none';
  sfxConfirm();
  const cb = dayCardCallback; dayCardCallback = null;
  if (cb) cb();
};
$('music-toggle').onclick = toggleMusic;
$('volume-slider').oninput = e => setVolume(e.target.value / 100);
$('modal-shade').addEventListener('click', e => { if (e.target === $('modal-shade')) closePanel(); });
$('touch-act').addEventListener('click', interact);
document.querySelectorAll('.touch-pad button').forEach(b => {
  const code = { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' }[b.dataset.dir];
  const on = e => { e.preventDefault(); keys[code] = true; };
  const off = e => { e.preventDefault(); keys[code] = false; };
  b.addEventListener('pointerdown', on);
  b.addEventListener('pointerup', off);
  b.addEventListener('pointerleave', off);
  b.addEventListener('pointercancel', off);
});
// Load saved partner data before constructing the follower model.
load();
loadSettings();
$('volume-slider').value = Math.round(settings.volume * 100);
buildTown();
$('start-screen').style.display = 'flex';
$('music-toggle').style.display = 'block';
$('volume-ctl').style.display = 'flex';
setMusicButton();
updateTitle();
refreshHud();
resize();
frameLoop();
// QA debug handle (inert unless invoked from the console; used by the night-shift verification harness).
window.__bitspringDebug = {
  startBattle, executeQueue, toggleChip, moveHero, enemyAct, refreshHud,
  robotStats, resolveDrive, openPanel, renderPanel, buildRobot, setPart, installAI,
  renderMission, completeObjective, showDayCard, showDayEndCard, newMission,
  updateScan, npcsInRange, scanningNow, collectIdea, imprintCourier,
  get battle() { return battle; },
  get state() { return state; }
};
