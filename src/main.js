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
function createRobot(frame = 'TIDAL', name = 'PIP', scale = 1) {
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
  blobShadow(g, .95, .42);
  g.coreMat = coreMat;
  g.visorMat = visorMat;
  return g;
}

// --- Town ---
function buildTown() {
  townRoot.clear();
  actorRoot.clear();
  battleRoot.clear();
  battleRoot.visible = false;
  townRoot.visible = true;
  actorRoot.visible = true;
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
  // Wren and the neighborhood's patient trade steward.
  const wren = createHumanoid(0x367d9a, 0xff70ae);
  wren.position.set(-2.2, 0, 6.2);
  actorRoot.add(wren);
  const steward = createHumanoid(0xb9758d, 0xc9fa68);
  steward.position.set(8.6, 0, 2.1);
  actorRoot.add(steward);
  const guideMark = labelSprite('WREN', '#ffaad0', '#271424');
  guideMark.scale.set(2, 0.5, 1);
  guideMark.position.set(-2.2, 2.15, 6.2);
  actorRoot.add(guideMark);
  const tradeMark = labelSprite('MOSS', '#c9fa68', '#17251a');
  tradeMark.scale.set(2, 0.5, 1);
  tradeMark.position.set(8.6, 2.15, 2.1);
  actorRoot.add(tradeMark);
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
const state = {
  started: false, zone: 'town', chips: 8, scrap: 1, parts: {}, robot: null, ai: null, roster: [],
  activeTab: 'build', selectedFrame: 'TIDAL', selectedAI: 'SPARK', message: '', introSeen: false, wins: 0
};
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
      chips: state.chips, scrap: state.scrap, parts: state.parts, robot: state.robot, ai: state.ai, roster: state.roster, wins: state.wins, introSeen: state.introSeen
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
      if (s) Object.assign(state, s);
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
    const n = createRobot(state.robot.frame, state.robot.name, .48);
    buddyModel = n;
    companion.clear();
    companion.add(n);
  }
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
    { id: 'wren', x: -2.2, z: 6.2, d: 1.4, name: 'TALK TO WREN' }
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
    html += `<p class="section-note">A Ghostlight is a small, trained decision engine. Pick one and teach your partner a different way to read danger. Your choice changes its AI Drive in battle.</p><div class="cards">
 <button class="choice ${state.selectedAI === 'SPARK' ? 'selected' : ''}" data-ai="SPARK"><span class="chip">OFFENSE</span><i class="swatch" style="background:#ffb958"></i><strong>SPARK</strong><p>Quick instincts. AI Drive hits hard and builds extra tempo.</p></button>
 <button class="choice ${state.selectedAI === 'BASTION' ? 'selected' : ''}" data-ai="BASTION"><span class="chip">DEFENSE</span><i class="swatch" style="background:#71c9a4"></i><strong>BASTION</strong><p>Keep your partner standing. AI Drive restores a little HP.</p></button>
 <button class="choice ${state.selectedAI === 'ORACLE' ? 'selected' : ''}" data-ai="ORACLE"><span class="chip">TACTICS</span><i class="swatch" style="background:#c78cff"></i><strong>ORACLE</strong><p>Read the next attack. AI Drive deals steady damage and reveals it.</p></button>
 </div><div class="field-row"><div class="field"><label>Selected core</label><input value="${state.selectedAI} • Ghostlight class" readonly></div><button class="action" id="install-ai" ${!state.robot || state.chips < 1 ? 'disabled' : ''}>${state.ai === state.selectedAI ? 'CORE INSTALLED' : 'INSTALL • 1 DATA CHIP'}</button></div><p class="section-note">${!state.robot ? 'First assemble a frame, then come back to install its mind.' : state.ai ? `Installed now: ${state.ai}. Changing cores costs one data chip.` : 'One data chip covers the first core installation.'}</p>`;
  } else {
    html += `<p class="section-note">Choose a frame, give it a name, and make a partner. You do not need to know how to build a robot yet; everyone starts with a frame and a promise.</p><div class="cards">${frameCard('CINDER', 'Hot-start frame. Hits a little harder, with less armor.', 0xe87948, 'QUICK')}${frameCard('TIDAL', 'A steady all-rounder with a bright, stable core.', 0x399cce, 'BALANCED')}${frameCard('MOSS', 'Sturdy legs and a patient shield response.', 0x54a46d, 'STURDY')}</div><div class="field-row"><div class="field"><label>Partner call sign</label><input id="robot-name" maxlength="12" value="${state.robot?.name || 'PIP'}" placeholder="e.g. PIP"></div><button class="action" id="build-robot" ${state.chips < 3 ? 'disabled' : ''}>${state.robot ? 'REGISTER ANOTHER • 3 CHIPS' : 'BUILD PARTNER • 3 CHIPS'}</button></div><p class="section-note">${state.robot ? `Active partner: ${state.robot.name} (${state.robot.frame}). You can register more frames and change your active partner at the Swap Meet.` : 'A first build costs 3 data chips. Your starter crate contains 8.'}</p>`;
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
  $('build-robot')?.addEventListener('click', buildRobot);
  $('install-ai')?.addEventListener('click', installAI);
}
function panelMessage(s) {
  state.message = s;
  const m = $('panel-message');
  if (m) m.textContent = s;
}
function buildRobot() {
  if (state.chips < 3) return;
  const input = $('robot-name');
  const name = (input?.value || 'PIP').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 12) || 'PIP';
  state.chips -= 3;
  const robot = { name, frame: state.selectedFrame, ai: null, active: true };
  state.roster = (state.roster || []).map(r => ({ ...r, active: false }));
  state.roster.push(robot);
  state.roster.forEach((r, i) => r.active = i === state.roster.length - 1);
  state.robot = robot;
  state.ai = null;
  save();
  refreshHud();
  sfxRobot();
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
  if (activeModal()) return;
  if (dialogueOpen) { advanceDialogue(); return; }
  if (state.zone === 'battle') return;
  const c = interaction || nearBuilding();
  if (!c) {
    showDialogue('BITSpring SIGNAL', ['The plaza hums beneath your feet. A town can be small and still have room for a whole future.']);
    return;
  }
  if (c.id === 'wren') {
    showDialogue('WREN', [
      'Hey, new neighbor. I’m Wren. Bitspring is a little town built where three old network routes forgot to end.',
      'The Hatchery makes frames. The Swap Meet keeps our parts moving. The Battle Gate is where we check that our training still works.',
      'A robot is more than its shell. Take a Ghostlight from the Hatchery and teach your partner what kind of trouble to get into.',
      'One strange thing: the Gate has been hearing a second heartbeat in the static. Maybe your new friend can listen back.'
    ]);
  } else if (c.id === 'forge') {
    openPanel(state.robot ? 'build' : 'build');
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
  if (state.zone !== 'town' || activeModal() || dialogueOpen || !state.started) return;
  let dx = 0, dz = 0;
  if (keys.KeyW || keys.ArrowUp) dz -= 1;
  if (keys.KeyS || keys.ArrowDown) dz += 1;
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
  if (!state.started || state.zone !== 'town' || dialogueOpen || activeModal()) {
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
  const hero = createRobot(state.robot.frame, state.robot.name, 1.45);
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
function chipDmg(chip) {
  if (chip.id === 'drive') {
    if (state.ai === 'BASTION') return 13 + (state.parts.coil ? 5 : 0);
    if (state.ai === 'ORACLE') return 18 + (state.parts.coil ? 5 : 0);
    return 22 + (state.parts.coil ? 7 : 0);
  }
  return chip.dmg;
}
function chipDesc(chip) {
  if (chip.id === 'drive') return state.ai === 'BASTION' ? `STRIKE ${chipDmg(chip)} + RESTORE ${state.parts.coil ? 13 : 9}` : `STRIKE ${chipDmg(chip)}`;
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
  setMusicTheme('battle');
  townRoot.visible = false;
  actorRoot.visible = false;
  battleRoot.visible = true;
  const max = robotMaxHP();
  battle = {
    heroHP: max, heroMax: max, enemyHP: 48, enemyMax: 48,
    deck: buildDeck(), hand: [], discard: [], queue: [],
    heroPos: { c: 1, r: 1 }, enemyPos: { c: 1, r: 1 }, moved: false,
    guard: false, evade: false, round: 1, done: false, enemyIntent: null, heroModel: null, enemyModel: null
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
  return 60 + (state.robot?.frame === 'MOSS' ? 8 : 0) + (state.parts.prism ? 10 : 0);
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
      const dmg = chipDmg(chip) + (chip.id !== 'drive' && linedUp ? 3 : 0);
      battle.enemyHP = Math.max(0, battle.enemyHP - dmg);
      totalDmg += dmg;
      if (chip.id === 'drive' && state.ai === 'BASTION') {
        const heal = state.parts.coil ? 13 : 9;
        battle.heroHP = Math.min(battle.heroMax, battle.heroHP + heal);
        lines.push(`BASTION restores ${heal} HP, then strikes for ${dmg}.`);
      } else {
        lines.push(`${state.robot.name} fires ${chip.name} for ${dmg}${chip.id !== 'drive' && linedUp ? ' (lined up!)' : ''}.`);
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
    battle.heroHP = Math.max(0, battle.heroHP - dmg);
    sfxEnemyHit();
    battle.heroModel.position.x -= .25;
    setTimeout(() => battle.heroModel.position.x += .25, 160);
    log = `NULL-01 lands ${intent.name} for ${dmg}${battle.guard ? ' (guarded)' : ''}.`;
  }
  battle.guard = false;
  battle.evade = false;
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
    save();
    showDialogue('BITSpring SIGNAL', [
      'A new day starts in Bitspring, at the end of the old network. Wren is waiting near the plaza.',
      'Walk to the Hatchery when you are ready. A starter crate is already paid for.'
    ]);
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
  Object.assign(state, { started: false, zone: 'town', chips: 8, scrap: 1, parts: {}, robot: null, ai: null, roster: [], activeTab: 'build', selectedFrame: 'TIDAL', selectedAI: 'SPARK', message: '', introSeen: false, wins: 0 });
  try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(SAVE_KEY_V1); } catch {}   // a confirmed erase clears both keys
  savePresent = false;
  begin();
}
function frameLoop() {
  requestAnimationFrame(frameLoop);
  const dt = Math.min(clock.getDelta(), .04);
  movePlayer(dt);
  updatePrompt();
  if (state.zone === 'town' && state.robot) {
    const t = performance.now() / 500;
    buddyModel.position.y = .04 + Math.sin(t) * .06;
    buddyModel.rotation.y = Math.sin(t * .55) * .12;
    if (buddyModel.coreMat) buddyModel.coreMat.emissiveIntensity = .55 + Math.sin(performance.now() / 320) * .3;
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
  if (dialogueOpen && (e.code === 'Enter' || e.code === 'Space')) advanceDialogue();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });
$('start-button').onclick = newGame;
$('continue-button').onclick = begin;
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
  get battle() { return battle; },
  get state() { return state; }
};
