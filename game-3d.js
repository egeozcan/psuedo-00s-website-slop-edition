/* =====================================================================
   THE RAYCASTER  --  game-3d.js

   1 file. 0 libraries. 0 build steps. 1 canvas. 1 array of integers that
   is a castle.

   It renders textured walls (DDA), a floor and a ceiling (perspective
   cast, per pixel), billboards (depth buffered, lit), muzzle flash
   light, distance fog, a vector weapon, a minimap, an automap, doors
   with keys, secret walls, exploding barrels, nine weapons' worth of
   shooting, enemies with a BFS flow field, and six levels plus one that
   builds itself while you watch.

   Everything below was typed by a person. Nobody would choose these line
   breaks. I chose these line breaks.
   ===================================================================== */
(function () {
  "use strict";

  var FS = window.FS || {};

  /* -------------------------------------------------------------------
     0. SMALL MATH. THAT IS ALL THE MATH THERE IS.
     ------------------------------------------------------------------- */
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function irnd(n) { return (Math.random() * n) | 0; }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  function angNorm(a) {
    while (a < 0) a += Math.PI * 2;
    while (a >= Math.PI * 2) a -= Math.PI * 2;
    return a;
  }
  function angDiff(a, b) { var d = angNorm(a - b); return d > Math.PI ? d - Math.PI * 2 : d; }
  /* deterministic noise, so a texture is the same texture every time */
  function nz(x, y, s) {
    var n = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
    n = (n ^ (n >> 13)) * 1274126177;
    return ((n ^ (n >> 16)) >>> 0) / 4294967295;
  }

  /* -------------------------------------------------------------------
     1. CONSTANTS
     ------------------------------------------------------------------- */
  var VW = 400, VH = 250;          /* internal resolution. chunky on purpose */
  var TEX = 64, TMASK = 63;
  var SHADES = 16;                 /* how many brightness steps we cache */
  var SAVE_KEY = "funnysite.raycaster";
  var AMMO_NAMES = ["bullets", "shells", "heavy", "toast"];

  var WEAPONS = [
    { name: "PISTOL",   ammo: 0, dmg: 16, pellets: 1, spread: 0.010, rate: 0.26, auto: false, range: 34, shake: 1.2, snd: "pistol", kick: 3 },
    { name: "SHOTGUN",  ammo: 1, dmg: 11, pellets: 9, spread: 0.085, rate: 0.72, auto: false, range: 20, shake: 5.0, snd: "shotgun", kick: 8 },
    { name: "CHAINGUN", ammo: 2, dmg: 10, pellets: 1, spread: 0.055, rate: 0.085, auto: true,  range: 30, shake: 2.2, snd: "chaingun", kick: 4 },
    { name: "TOASTER",  ammo: 3, dmg: 62, pellets: 0, spread: 0,     rate: 0.55, auto: false, range: 22, shake: 3.0, snd: "toaster", kick: 6, proj: true }
  ];

  var ENEMY = {
    grunt:   { hp: 46,  speed: 1.55, r: 0.34, melee: 6,  ranged: 0, cd: 1.3,  score: 100,  h: 0.85, name: "GRUNT" },
    runner:  { hp: 30,  speed: 3.05, r: 0.27, melee: 5,  ranged: 0, cd: 1.5,  score: 160,  h: 0.80, name: "RUNNER" },
    gunner:  { hp: 58,  speed: 1.45, r: 0.33, melee: 5,  ranged: 8,  cd: 1.7,  score: 240,  h: 0.95, name: "GUNNER" },
    turret:  { hp: 78,  speed: 0,    r: 0.40, melee: 0,  ranged: 11, cd: 1.1,  score: 210,  h: 0.80, name: "TURRET" },
    toaster: { hp: 86,  speed: 2.20, r: 0.36, melee: 9,  ranged: 14, cd: 1.8,  score: 420,  h: 0.80, name: "TOASTER" },
    boss:    { hp: 760, speed: 1.05, r: 0.95, melee: 16, ranged: 12, cd: 0.9,  score: 5000, h: 1.75, name: "WEBMASTER 1.0" }
  };

  var PICKUPS = {
    h: { kind: "hp",    v: 25, spr: "medkit", msg: "PICKED UP A MEDKIT. +25." },
    H: { kind: "hp",    v: 60, spr: "medkit", msg: "PICKED UP THE BIG MEDKIT. +60. YOU ARE NOT AS GOOD AS YOU LOOK." },
    b: { kind: "armor", v: 50, spr: "battery", msg: "PICKED UP A BATTERY. +50 ARMOUR." },
    a: { kind: "ammo", ai: 0, v: 22, spr: "ammo",  msg: "PICKED UP 22 BULLETS." },
    A: { kind: "ammo", ai: 2, v: 40, spr: "heavy", msg: "PICKED UP 40 HEAVY BULLETS." },
    s: { kind: "ammo", ai: 1, v: 8,  spr: "shells", msg: "PICKED UP 8 SHELLS." },
    t: { kind: "ammo", ai: 3, v: 12, spr: "toastammo", msg: "PICKED UP 12 SLICES. THEY ARE WARM." },
    k: { kind: "key", ki: 0, spr: "key0", msg: "YOU FOUND A BLUE KEY." },
    y: { kind: "key", ki: 1, spr: "key1", msg: "YOU FOUND A YELLOW KEY." },
    r: { kind: "key", ki: 2, spr: "key2", msg: "YOU FOUND A RED KEY." },
    "2": { kind: "weapon", wi: 1, spr: "shotgun", msg: "YOU GOT THE SHOTGUN. IT IS LOUD AND THAT IS THE POINT." },
    "3": { kind: "weapon", wi: 2, spr: "chaingun", msg: "YOU GOT THE CHAINGUN. IT HAS A PROBLEM. THE PROBLEM IS NOISE." },
    "4": { kind: "weapon", wi: 3, spr: "toastergun", msg: "YOU FOUND A TOASTER GUN. THE TOASTER KNOWS." },
    o: { kind: "barrel", spr: "barrel", msg: "" }
  };

  /* -------------------------------------------------------------------
     2. AUDIO. IT IS ALL OSCILLATORS AND ONE NOISE BUFFER.
     ------------------------------------------------------------------- */
  var AC = null, MASTER = null, MUTED = false, NOISE = null;

  function actx() {
    if (!AC) {
      try {
        AC = new (window.AudioContext || window.webkitAudioContext)();
        MASTER = AC.createGain();
        MASTER.gain.value = 0.45;
        MASTER.connect(AC.destination);
        NOISE = AC.createBuffer(1, AC.sampleRate * 1.2, AC.sampleRate);
        var d = NOISE.getChannelData(0);
        for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      } catch (e) { AC = null; }
    }
    if (AC && AC.state === "suspended") { try { AC.resume(); } catch (e) {} }
    return AC;
  }

  function tone(f, dur, type, vol, slide, delay) {
    var c = actx(); if (!c || MUTED) return;
    var t = c.currentTime + (delay || 0);
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || "square";
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol == null ? 0.07 : vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(MASTER);
    o.start(t); o.stop(t + dur + 0.03);
  }

  function hiss(dur, vol, cut, sweep, delay) {
    var c = actx(); if (!c || MUTED) return;
    var t = c.currentTime + (delay || 0);
    var s = c.createBufferSource(); s.buffer = NOISE;
    var f = c.createBiquadFilter(); f.type = "lowpass";
    f.frequency.setValueAtTime(cut || 2400, t);
    if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(80, sweep), t + dur);
    var g = c.createGain();
    g.gain.setValueAtTime(vol == null ? 0.12 : vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(MASTER);
    s.start(t); s.stop(t + dur + 0.02);
  }

  var SFX = {
    pistol:   function () { tone(340, 0.07, "square", 0.10, 90); hiss(0.05, 0.07, 3200, 400); },
    shotgun:  function () { hiss(0.22, 0.22, 4200, 200); tone(120, 0.18, "sawtooth", 0.12, 40); },
    chaingun: function () { tone(300, 0.05, "square", 0.08, 110); hiss(0.04, 0.06, 3600, 600); },
    toaster:  function () { tone(1046, 0.10, "triangle", 0.11, 1318); tone(1318, 0.28, "triangle", 0.09, 1046, 0.11); },
    ding:     function () { tone(1318, 0.09, "triangle", 0.10); tone(1760, 0.30, "triangle", 0.09, 0, 0.10); },
    hit:      function () { tone(1100, 0.035, "square", 0.07, 700); },
    flesh:    function () { hiss(0.09, 0.10, 1400, 250); },
    die:      function () { hiss(0.30, 0.13, 1800, 120); tone(220, 0.30, "sawtooth", 0.07, 55); },
    hurt:     function () { tone(180, 0.16, "sawtooth", 0.11, 70); hiss(0.08, 0.06, 900); },
    armor:    function () { tone(660, 0.10, "sine", 0.09); tone(990, 0.14, "sine", 0.07, 0, 0.05); },
    pickup:   function () { tone(988, 0.05, "square", 0.07); tone(1319, 0.09, "square", 0.06, 0, 0.05); },
    key:      function () { tone(1046, 0.07, "square", 0.07); tone(1318, 0.07, "square", 0.07, 0, 0.08); tone(1568, 0.18, "square", 0.06, 0, 0.16); },
    door:     function () { hiss(0.42, 0.09, 900, 160); tone(70, 0.25, "sine", 0.10, 45); },
    locked:   function () { tone(160, 0.09, "square", 0.09); tone(140, 0.14, "square", 0.08, 0, 0.10); },
    secret:   function () { tone(523, 0.08, "triangle", 0.08); tone(784, 0.10, "triangle", 0.08, 0, 0.09); tone(1046, 0.26, "triangle", 0.07, 0, 0.19); },
    boom:     function () { hiss(0.55, 0.26, 5200, 90); tone(90, 0.42, "sine", 0.16, 30); },
    step:     function () { hiss(0.05, 0.035, 700); },
    growl:    function () { tone(70, 0.42, "sawtooth", 0.06, 55); tone(104, 0.38, "sawtooth", 0.04, 82, 0.03); },
    menu:     function () { tone(700, 0.03, "square", 0.05); },
    select:   function () { tone(880, 0.05, "square", 0.07); tone(1320, 0.09, "square", 0.05, 0, 0.05); },
    level:    function () { tone(392, 0.12, "square", 0.07); tone(523, 0.12, "square", 0.07, 0, 0.12); tone(659, 0.30, "square", 0.07, 0, 0.24); },
    win:      function () { [523, 659, 784, 1046, 1318].forEach(function (f, i) { tone(f, 0.20, "square", 0.07, 0, i * 0.13); }); },
    lose:     function () { [392, 349, 311, 262].forEach(function (f, i) { tone(f, 0.34, "sawtooth", 0.08, 0, i * 0.20); }); },
    honk:     function () { tone(420, 0.20, "sawtooth", 0.10, 300); tone(408, 0.26, "sawtooth", 0.09, 250, 0.24); },
    nope:     function () { tone(180, 0.09, "square", 0.08); tone(120, 0.14, "square", 0.07, 0, 0.10); },
    land:     function () { tone(70, 0.18, "sine", 0.10, 40); }
  };

  /* which map character is which monster. a table, because a string of
     letters is a bug waiting for one stray space. */
  var ENEMY_CH = { E: "grunt", R: "runner", G: "gunner", T: "turret", O: "toaster", B: "boss" };

  /* a four note theme. the original was four notes. so is this one. */
  var musicTimer = null, musicOn = false;
  var MUSIC = [110, 110, 146.83, 130.81, 110, 164.81, 146.83, 98];
  function musicTick() {
    if (!musicOn) return;
    var f = MUSIC[(musicStep++) % MUSIC.length];
    tone(f, 0.22, "triangle", 0.05, 0);
    if (musicStep % 2 === 0) tone(f * 2, 0.12, "square", 0.025, 0, 0.11);
  }
  var musicStep = 0;
  function toggleMusic(on) {
    musicOn = (on === undefined) ? !musicOn : on;
    if (musicOn) { if (!musicTimer) musicTimer = setInterval(musicTick, 330); }
    else { clearInterval(musicTimer); musicTimer = null; }
    return musicOn;
  }

  /* -------------------------------------------------------------------
     3. CANVAS PLUMBING
     ------------------------------------------------------------------- */
  function newCanvas(w, h) {
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    return c;
  }

  var frameCv = newCanvas(VW, VH);
  var fctx = frameCv.getContext("2d");
  var img = fctx.createImageData(VW, VH);
  var buf = new Uint32Array(img.data.buffer);

  /* build a Uint32Array out of whatever a canvas contains */
  function grab(c) {
    var d = c.getContext("2d").getImageData(0, 0, c.width, c.height);
    return new Uint32Array(d.data.buffer.slice(0));
  }
  function packRGB(r, g, b) { return 0xff000000 | (b << 16) | (g << 8) | r; }

  /* -------------------------------------------------------------------
     4. TEXTURES. 64x64. PAINTED WITH 1x1 RECTANGLES LIKE A PERSON.
     ------------------------------------------------------------------- */
  var T_WALL = 0, T_STONE = 1, T_METAL = 2, T_TECH = 3, T_WOOD = 4, T_CARPETW = 5,
      T_DOOR = 6, T_DOOR1 = 7, T_DOOR2 = 8, T_DOOR3 = 9, T_EXIT = 10, T_TOASTERW = 11,
      T_SERVER = 12, T_GRATE = 13, T_CEILW = 14, T_CARPETW2 = 15;
  var WALL_TEX_COUNT = 16;

  var WTEX = [];      /* Uint32Array per wall texture */
  var FTEX = [];      /* floor / ceiling textures */
  var shCache = [];   /* [texIndex][shadeLevel] lazily built Uint32Arrays */
  var fog = [8, 9, 16];

  function T(fn) {
    var c = newCanvas(TEX, TEX), g = c.getContext("2d");
    fn(g);
    return grab(c);
  }
  function px(g, x, y, col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }

  function buildTextures() {
    WTEX[T_WALL] = T(function (g) {
      for (var y = 0; y < TEX; y++) for (var x = 0; x < TEX; x++) {
        var row = (y / 16) | 0, off = (row % 2) * 16;
        var bx = (x + off) % 32, by = y % 16;
        var mortar = by < 2 || (bx < 2);
        var v = nz(x, y, 7);
        var r, gr, b;
        if (mortar) { r = 96; gr = 92; b = 86; }
        else { r = 118 + v * 46; gr = 54 + v * 26; b = 44 + v * 20; }
        if (v > 0.93) { r += 40; gr += 30; b += 26; }
        px(g, x, y, "rgb(" + (r | 0) + "," + (gr | 0) + "," + (b | 0) + ")");
      }
    });
    WTEX[T_STONE] = T(function (g) {
      for (var y = 0; y < TEX; y++) for (var x = 0; x < TEX; x++) {
        var by = y % 32, bx = x % 32;
        var edge = by < 2 || bx < 2;
        var v = nz(x, y, 11);
        var c = edge ? 58 : 104 + v * 52;
        if (nz((x / 8) | 0, (y / 8) | 0, 3) > 0.8) c += 14;
        px(g, x, y, "rgb(" + (c | 0) + "," + (c + 3) + "," + (c + 8) + ")");
      }
    });
    WTEX[T_METAL] = T(function (g) {
      for (var y = 0; y < TEX; y++) for (var x = 0; x < TEX; x++) {
        var panel = (x % 32 < 2 || y % 32 < 2);
        var v = nz(x, y, 13);
        var c = panel ? 40 : 84 + v * 34 + ((y % 32 < 8) ? 14 : 0);
        px(g, x, y, "rgb(" + (c | 0) + "," + (c + 6) + "," + (c + 14) + ")");
      }
      /* rivets */
      for (var ry = 6; ry < 64; ry += 28) for (var rx = 6; rx < 64; rx += 28) {
        px(g, rx, ry, "#b9c6d6"); px(g, rx + 1, ry, "#6d7a8a");
        px(g, rx, ry + 1, "#6d7a8a"); px(g, rx + 1, ry + 1, "#39424e");
      }
    });
    WTEX[T_TECH] = T(function (g) {
      for (var y = 0; y < TEX; y++) for (var x = 0; x < TEX; x++) {
        var v = nz(x, y, 17);
        var c = 34 + v * 20;
        px(g, x, y, "rgb(" + (c | 0) + "," + (c + 22) + "," + (c + 46) + ")");
      }
      for (var i = 0; i < 64; i += 8) { px(g, i, 30, "#2b6ea8"); px(g, i + 4, 34, "#1d4a76"); }
      for (var j = 0; j < 8; j++) px(g, 20 + j, 46, "#59d0ff");
      px(g, 44, 46, "#ffd94a"); px(g, 45, 46, "#ffd94a"); px(g, 44, 47, "#ffd94a");
      g.fillStyle = "#0d1a26"; g.fillRect(0, 0, 64, 2); g.fillRect(0, 62, 64, 2);
    });
    WTEX[T_WOOD] = T(function (g) {
      for (var y = 0; y < TEX; y++) for (var x = 0; x < TEX; x++) {
        var plank = (y / 16) | 0;
        var v = nz(x, y, 19 + plank);
        var grain = Math.sin((x + plank * 9) * 0.7) * 6;
        var r = 104 + v * 34 + grain, gg = 68 + v * 24 + grain, b = 36 + v * 14;
        if (y % 16 < 2) { r -= 44; gg -= 30; b -= 16; }
        px(g, x, y, "rgb(" + (r | 0) + "," + (gg | 0) + "," + (b | 0) + ")");
      }
    });
    WTEX[T_CARPETW] = T(function (g) {
      for (var y = 0; y < TEX; y++) for (var x = 0; x < TEX; x++) {
        var v = nz(x, y, 23);
        var r = 92 + v * 26, gg = 22 + v * 12, b = 26 + v * 14;
        if ((x + y) % 32 < 2) { r += 40; gg += 18; b += 6; }
        if ((x % 16 === 8) && (y % 16 === 8)) { r += 70; gg += 46; b += 10; }
        px(g, x, y, "rgb(" + (r | 0) + "," + (gg | 0) + "," + (b | 0) + ")");
      }
    });
    WTEX[T_CARPETW2] = WTEX[T_CARPETW];
    function doorTex(base, stripe) {
      return T(function (g) {
        for (var y = 0; y < TEX; y++) for (var x = 0; x < TEX; x++) {
          var v = nz(x, y, 29);
          var c = base + v * 22;
          px(g, x, y, "rgb(" + (c | 0) + "," + (c + 6) + "," + (c + 10) + ")");
        }
        for (var k = 0; k < 64; k += 16) {
          for (var j = 0; j < 4; j++) {
            px(g, k + 2, 6 + j, stripe); px(g, k + 6, 6 + j, stripe);
            px(g, k + 10, 6 + j, stripe); px(g, k + 14, 6 + j, stripe);
          }
        }
        g.fillStyle = "#141414"; g.fillRect(0, 0, 64, 3); g.fillRect(0, 61, 64, 3);
        g.fillRect(0, 0, 3, 64); g.fillRect(61, 0, 3, 64);
        g.fillStyle = "#c9d2dc"; g.fillRect(28, 28, 8, 12);
        g.fillStyle = "#5b6672"; g.fillRect(28, 38, 8, 2);
      });
    }
    WTEX[T_DOOR] = doorTex(96, "#ffd94a");
    WTEX[T_DOOR1] = doorTex(48, "#6fb6ff");
    WTEX[T_DOOR2] = doorTex(96, "#ffd94a");
    WTEX[T_DOOR3] = doorTex(104, "#ff7a6a");
    WTEX[T_EXIT] = T(function (g) {
      g.fillStyle = "#101820"; g.fillRect(0, 0, 64, 64);
      g.fillStyle = "#ffd94a"; g.fillRect(0, 0, 64, 12); g.fillRect(0, 52, 64, 12);
      g.fillStyle = "#1a1a1a";
      for (var i = 0; i < 64; i += 8) { g.fillRect(i, 0, 4, 12); g.fillRect(i, 52, 4, 12); }
      g.fillStyle = "#00e05a"; g.font = "bold 20px 'Courier New',monospace";
      g.fillText("EXIT", 10, 39);
      g.fillStyle = "#0a2b18"; g.fillRect(8, 42, 48, 2);
    });
    WTEX[T_TOASTERW] = T(function (g) {
      for (var y = 0; y < TEX; y++) for (var x = 0; x < TEX; x++) {
        var v = nz(x, y, 31);
        var c = 130 + v * 60;
        if (x < 3 || x > 60) c -= 70;
        px(g, x, y, "rgb(" + (c | 0) + "," + (c + 4) + "," + (c + 10) + ")");
      }
      g.fillStyle = "#3a3a3a"; g.fillRect(14, 26, 36, 8);
      g.fillStyle = "#c58a3c"; g.fillRect(18, 26, 28, 3);
      g.fillStyle = "#d94a3a"; g.fillRect(24, 14, 5, 5); g.fillRect(36, 14, 5, 5);
      g.fillStyle = "#fff"; g.fillRect(25, 15, 2, 2); g.fillRect(37, 15, 2, 2);
      g.fillStyle = "#2b2b2b"; g.fillRect(20, 44, 24, 3);
    });
    WTEX[T_SERVER] = T(function (g) {
      for (var y = 0; y < TEX; y++) for (var x = 0; x < TEX; x++) {
        var v = nz(x, y, 37);
        px(g, x, y, "rgb(" + (16 + v * 14) + "," + (18 + v * 16) + "," + (22 + v * 20) + ")");
      }
      for (var u = 3; u < 62; u += 8) {
        g.fillStyle = "#2a3038"; g.fillRect(u, 3, 6, 58);
        for (var l = 0; l < 8; l++) {
          g.fillStyle = "#ff5a3a"; g.fillRect(u + 1, 5 + l * 7, 1, 1);
          g.fillStyle = "#5aff8a"; g.fillRect(u + 3, 5 + l * 7, 1, 1);
        }
      }
    });
    WTEX[T_GRATE] = T(function (g) {
      for (var y = 0; y < TEX; y++) for (var x = 0; x < TEX; x++) {
        var v = nz(x, y, 41);
        var bar = (x % 8 < 5);
        var c = bar ? 60 + v * 26 : 24 + v * 12;
        px(g, x, y, "rgb(" + (c | 0) + "," + (c + 4) + "," + (c + 6) + ")");
      }
    });
    WTEX[T_CEILW] = WTEX[T_TECH];

    /* floor + ceiling */
    FTEX[0] = T(function (g) {          /* grey tile */
      for (var y = 0; y < TEX; y++) for (var x = 0; x < TEX; x++) {
        var chk = (((x / 32) | 0) + ((y / 32) | 0)) % 2;
        var v = nz(x, y, 43);
        var c = (chk ? 74 : 58) + v * 26;
        if (x % 32 < 1 || y % 32 < 1) c -= 26;
        px(g, x, y, "rgb(" + (c | 0) + "," + (c + 2) + "," + (c + 6) + ")");
      }
    });
    FTEX[1] = T(function (g) {          /* carpet */
      for (var y = 0; y < TEX; y++) for (var x = 0; x < TEX; x++) {
        var v = nz(x, y, 47);
        var r = 74 + v * 30, gg = 18 + v * 10, b = 24 + v * 12;
        if (nz(x, y, 53) > 0.985) { r += 70; gg += 50; b += 12; }
        px(g, x, y, "rgb(" + (r | 0) + "," + (gg | 0) + "," + (b | 0) + ")");
      }
    });
    FTEX[2] = FTEX[0];                 /* grate floor reuses tile */
    FTEX[3] = T(function (g) {          /* ceiling light panel */
      for (var y = 0; y < TEX; y++) for (var x = 0; x < TEX; x++) {
        var panel = x > 8 && x < 55 && y > 8 && y < 55;
        var v = nz(x, y, 59);
        var c = panel ? 150 + v * 40 : 40 + v * 16;
        px(g, x, y, "rgb(" + (c | 0) + "," + (c + 2) + "," + (c - (panel ? 10 : 4)) + ")");
      }
    });
    FTEX[4] = T(function (g) {          /* dark concrete ceiling */
      for (var y = 0; y < TEX; y++) for (var x = 0; x < TEX; x++) {
        var v = nz(x, y, 61);
        px(g, x, y, "rgb(" + ((38 + v * 22) | 0) + "," + ((38 + v * 22) | 0) + "," + ((44 + v * 24) | 0) + ")");
      }
    });
    FTEX[5] = T(function (g) {          /* exit pad */
      for (var y = 0; y < TEX; y++) for (var x = 0; x < TEX; x++) {
        var y2 = ((y % 16) < 8), x2 = ((x % 16) < 8);
        var on = (x2 === y2);
        var v = nz(x, y, 67);
        var c = on ? 190 : 40;
        px(g, x, y, "rgb(" + c + "," + (on ? 170 : 44) + "," + (on ? 40 : 20) + ")");
      }
    });

    for (var i = 0; i < WALL_TEX_COUNT; i++) shCache[i] = [];
    for (var f = 0; f < FTEX.length; f++) shCache[WTEX.length + f] = [];
  }

  /* brightness cache: tex pixel * shade, mixed toward fog */
  function shadeTex(ti, lvl) {
    var src = ti >= WTEX.length ? FTEX[ti - WTEX.length] : WTEX[ti];
    var c = shCache[ti];
    var s = c[lvl];
    if (s) return s;
    s = new Uint32Array(src.length);
    var m = lvl / (SHADES - 1);
    var im = 1 - m;
    for (var i = 0; i < src.length; i++) {
      var p = src[i];
      if (((p >>> 24) & 255) === 0) { s[i] = p; continue; }
      var r = ((p & 255) * m + fog[0] * im) | 0;
      var g = (((p >> 8) & 255) * m + fog[1] * im) | 0;
      var b = (((p >> 16) & 255) * m + fog[2] * im) | 0;
      s[i] = 0xff000000 | (b << 16) | (g << 8) | r;
    }
    c[lvl] = s;
    return s;
  }

  /* -------------------------------------------------------------------
     5. SPRITES. drawn with shapes, because a person can draw a toaster
        and cannot draw an ASCII toaster.
     ------------------------------------------------------------------- */
  var SPR = {};

  function mkSprite(w, h, draw) {
    var c = newCanvas(w, h), g = c.getContext("2d");
    g.clearRect(0, 0, w, h);
    draw(g, w, h);
    return { w: w, h: h, cv: c, px: grab(c) };
  }

  function ell(g, x, y, rx, ry, col) {
    g.fillStyle = col; g.beginPath();
    g.ellipse(x, y, rx, ry, 0, 0, 6.2832); g.fill();
  }
  function rct(g, x, y, w, h, col) { g.fillStyle = col; g.fillRect(x, y, w, h); }

  function buildSprites() {
    /* --- GRUNT: a green imp with opinions --- */
    SPR.grunt = [];
    for (var f = 0; f < 6; f++) {
      SPR.grunt.push(mkSprite(52, 60, function (g, W, H) {
        var ph = (f / 6) * Math.PI * 2;
        var swing = Math.sin(ph) * 5;
        /* legs */
        rct(g, 17, 44 + Math.max(0, swing), 7, 14, "#1d5c1c");
        rct(g, 29, 44 + Math.max(0, -swing), 7, 14, "#1d5c1c");
        rct(g, 14, 55 + Math.max(0, swing), 11, 5, "#123a11");
        rct(g, 28, 55 + Math.max(0, -swing), 11, 5, "#123a11");
        /* body */
        ell(g, 26, 34, 15, 16, "#2c6b26");
        ell(g, 26, 32, 13, 13, "#47913a");
        ell(g, 22, 27, 7, 5, "#6fb85a");
        /* arms */
        var as = Math.sin(ph) * 3;
        ell(g, 11, 36 + as, 5, 9, "#2c6b26");
        ell(g, 41, 36 - as, 5, 9, "#2c6b26");
        /* head */
        ell(g, 26, 17, 14, 12, "#47913a");
        ell(g, 26, 13, 11, 8, "#6fb85a");
        /* horns */
        rct(g, 13, 5, 3, 8, "#e0dcc0"); rct(g, 15, 3, 2, 4, "#f2eeda");
        rct(g, 36, 5, 3, 8, "#e0dcc0"); rct(g, 34, 3, 2, 4, "#f2eeda");
        /* eyes */
        ell(g, 20, 16, 4, 4, "#f6f6e8"); ell(g, 32, 16, 4, 4, "#f6f6e8");
        ell(g, 20, 16, 2, 2, "#c02020"); ell(g, 32, 16, 2, 2, "#c02020");
        /* mouth + teeth */
        rct(g, 17, 23, 18, 6, "#1a1410");
        for (var t = 0; t < 4; t++) rct(g, 18 + t * 4, 23, 2, 3, "#f0ecd8");
      }));
    }
    /* --- RUNNER: red, thin, in a hurry --- */
    SPR.runner = [];
    for (var f2 = 0; f2 < 6; f2++) {
      SPR.runner.push(mkSprite(46, 58, function (g, W, H) {
        var ph = (f2 / 6) * Math.PI * 2;
        var sw = Math.sin(ph) * 6;
        rct(g, 14, 40 + sw, 5, 15, "#7a1d18");
        rct(g, 25, 40 - sw, 5, 15, "#7a1d18");
        rct(g, 11, 53 + sw, 10, 4, "#4a110f");
        rct(g, 24, 53 - sw, 10, 4, "#4a110f");
        ell(g, 22, 30, 11, 13, "#a52a22");
        ell(g, 22, 28, 9, 10, "#d2453a");
        ell(g, 7, 33 - sw, 4, 10, "#a52a22");
        ell(g, 37, 33 + sw, 4, 10, "#a52a22");
        ell(g, 22, 14, 11, 10, "#d2453a");
        rct(g, 16, 17, 5, 4, "#ffe9c9"); rct(g, 23, 17, 5, 4, "#ffe9c9");
        rct(g, 18, 18, 2, 3, "#200a08"); rct(g, 24, 18, 2, 3, "#200a08");
        rct(g, 16, 22, 12, 4, "#2a0c0a");
        for (var q = 0; q < 3; q++) rct(g, 17 + q * 4, 22, 2, 2, "#f0e0d0");
      }));
    }
    /* --- GUNNER: blue trooper with a gun and a job --- */
    SPR.gunner = [];
    for (var f3 = 0; f3 < 6; f3++) {
      SPR.gunner.push(mkSprite(56, 60, function (g, W, H) {
        var ph = (f3 / 6) * Math.PI * 2;
        var sw = Math.sin(ph) * 4;
        rct(g, 18, 42 + sw, 8, 14, "#1e2a52");
        rct(g, 30, 42 - sw, 8, 14, "#1e2a52");
        rct(g, 15, 54 + sw, 12, 5, "#101828"); rct(g, 29, 54 - sw, 12, 5, "#101828");
        rct(g, 14, 24, 28, 22, "#2f4494");
        rct(g, 16, 26, 24, 6, "#3c58b8");
        rct(g, 20, 34, 16, 5, "#16203e");
        ell(g, 28, 16, 12, 11, "#c99a72");
        ell(g, 28, 12, 13, 9, "#e0b287");
        ell(g, 28, 8, 13, 6, "#3d4a66");            /* helmet */
        rct(g, 15, 12, 26, 3, "#2a3350");
        ell(g, 23, 16, 3, 3, "#12161f"); ell(g, 33, 16, 3, 3, "#12161f");
        rct(g, 20, 20, 16, 2, "#5c3a2a");
        /* arms + weapon */
        rct(g, 8, 26 + Math.sin(ph) * 2, 8, 7, "#2f4494");
        rct(g, 40, 26 - Math.sin(ph) * 2, 10, 7, "#2f4494");
        rct(g, 44, 22, 12, 6, "#20242c");
        rct(g, 52, 20, 6, 4, "#4a5260");
        rct(g, 44, 28, 5, 9, "#6b4a2c");
      }));
    }
    /* --- TURRET: it was bolted to the ceiling in 1997 and never asked --- */
    SPR.turret = [];
    for (var f4 = 0; f4 < 6; f4++) {
      SPR.turret.push(mkSprite(52, 44, function (g, W, H) {
        var ph = (f4 / 6) * Math.PI * 2;
        ell(g, 26, 16, 18, 12, "#565f6c");
        ell(g, 26, 13, 14, 8, "#79838f");
        rct(g, 24, 22, 5, 20, "#3a4149");
        rct(g, 8, 26 + Math.sin(ph) * 3, 20, 7, "#2b3138");
        rct(g, 24, 24 + Math.sin(ph) * 3, 24, 8, "#434b55");
        rct(g, 44, 25 + Math.sin(ph) * 3, 8, 6, "#20252b");
        ell(g, 26, 20, 4, 4, "#ff3b30");
        ell(g, 26, 20, 2, 2, "#ffd0c8");
      }));
    }
    /* --- TOASTER: the site mascot, weaponised --- */
    SPR.toaster = [];
    for (var f5 = 0; f5 < 6; f5++) {
      SPR.toaster.push(mkSprite(52, 52, function (g, W, H) {
        var ph = (f5 / 6) * Math.PI * 2;
        var lift = Math.max(0, Math.sin(ph)) * 5;
        rct(g, 12, 44, 6, 7, "#8e97a3"); rct(g, 34, 44, 6, 7, "#8e97a3");
        rct(g, 9, 16, 34, 30, "#aab3bd");
        rct(g, 11, 18, 30, 26, "#d3dae2");
        rct(g, 13, 20, 26, 4, "#f2f6fa");
        rct(g, 14, 24, 24, 6, "#2a2f36");              /* the slot */
        rct(g, 18, 24, 16, 4, "#c58a3c");             /* the toast */
        if (lift > 0) rct(g, 19, 24 - lift, 14, lift + 2, "#d9a457");
        ell(g, 19, 37, 4, 4, "#f6f6e8"); ell(g, 33, 37, 4, 4, "#f6f6e8");
        ell(g, 19, 37, 2, 2, "#1d2229"); ell(g, 33, 37, 2, 2, "#1d2229");
        if (f5 % 3 === 0) { rct(g, 17, 34, 4, 1, "#7c848e"); rct(g, 31, 34, 4, 1, "#7c848e"); }
        rct(g, 22, 43, 8, 2, "#5f6874");
        rct(g, 40, 28, 5, 6, "#7d8792");              /* the lever */
      }));
    }
    /* --- WEBMASTER 1.0: it has been loading since 2001 --- */
    SPR.boss = [];
    for (var f6 = 0; f6 < 6; f6++) {
      SPR.boss.push(mkSprite(96, 104, function (g, W, H) {
        var ph = (f6 / 6) * Math.PI * 2;
        var bob = Math.sin(ph) * 3;
        rct(g, 18, 74 + bob, 22, 28, "#1c1c22");
        rct(g, 56, 74 - bob, 22, 28, "#1c1c22");
        ell(g, 48, 78, 40, 22, "#c8c2b4");            /* shoulders */
        rct(g, 42, 66, 12, 16, "#a02a2a");            /* tie */
        rct(g, 46, 62, 4, 8, "#7a1d1d");
        ell(g, 48, 36 + bob, 30, 30, "#e0b287");      /* face */
        ell(g, 48, 20 + bob, 30, 16, "#8a6a3a");      /* hair */
        for (var h = 0; h < 12; h++) rct(g, 20 + h * 5, 12 + (h % 3) * 3, 4, 12, "#8a6a3a");
        ell(g, 36, 34 + bob, 10, 9, "#ffffff");       /* glasses */
        ell(g, 60, 34 + bob, 10, 9, "#ffffff");
        ell(g, 36, 34 + bob, 5, 5, "#20303f");
        ell(g, 60, 34 + bob, 5, 5, "#20303f");
        rct(g, 44, 32 + bob, 10, 3, "#5a5a5a");
        rct(g, 24, 22 + bob, 16, 3, "#4a3418");       /* brows */
        rct(g, 56, 22 + bob, 16, 3, "#4a3418");
        ell(g, 48, 56 + bob, 18, 8, "#4a3418");       /* moustache */
        rct(g, 34, 50 + bob, 28, 3, "#7a4a2a");
      }));
    }

    /* --- white flash versions, for when you hit something --- */
    function flashOf(arr) {
      return arr.map(function (s) {
        var c = newCanvas(s.w, s.h), g = c.getContext("2d");
        var id = g.createImageData(s.w, s.h), d = id.data;
        for (var i = 0; i < s.px.length; i++) {
          var p = s.px[i];
          d[i * 4] = 255; d[i * 4 + 1] = 240; d[i * 4 + 2] = 240; d[i * 4 + 3] = (p >>> 24) & 255;
        }
        g.putImageData(id, 0, 0);
        return { w: s.w, h: s.h, px: new Uint32Array(id.data.buffer.slice(0)) };
      });
    }
    SPR.gruntFlash = flashOf(SPR.grunt);
    SPR.runnerFlash = flashOf(SPR.runner);
    SPR.gunnerFlash = flashOf(SPR.gunner);
    SPR.turretFlash = flashOf(SPR.turret);
    SPR.toasterFlash = flashOf(SPR.toaster);
    SPR.bossFlash = flashOf(SPR.boss);

    /* --- things you pick up --- */
    SPR.medkit = mkSprite(26, 22, function (g) {
      rct(g, 1, 3, 24, 18, "#f4f4f4"); rct(g, 1, 3, 24, 3, "#d8d8d8");
      rct(g, 3, 5, 20, 14, "#ffffff"); rct(g, 10, 7, 6, 11, "#d02020");
      rct(g, 7, 10, 12, 5, "#d02020"); rct(g, 1, 19, 24, 2, "#9a9a9a");
    });
    SPR.battery = mkSprite(24, 26, function (g) {
      rct(g, 3, 4, 18, 21, "#2048a0"); rct(g, 5, 6, 14, 17, "#3a6ad8");
      rct(g, 7, 1, 10, 4, "#c8c8c8");
      rct(g, 11, 9, 3, 8, "#ffd94a"); rct(g, 8, 12, 9, 3, "#ffd94a");
    });
    SPR.ammo = mkSprite(24, 20, function (g) {
      rct(g, 1, 4, 22, 15, "#6b4a2c"); rct(g, 2, 5, 20, 6, "#87633c");
      for (var i = 0; i < 3; i++) {
        rct(g, 5 + i * 6, 1, 3, 5, "#d8b23a"); rct(g, 5 + i * 6, 0, 3, 2, "#e8e8e8");
      }
      rct(g, 2, 17, 20, 2, "#4a3218");
    });
    SPR.heavy = mkSprite(26, 20, function (g) {
      rct(g, 1, 4, 24, 15, "#3a3f46"); rct(g, 2, 5, 22, 6, "#565d66");
      for (var i = 0; i < 4; i++) rct(g, 4 + i * 5, 1, 4, 5, "#c8a02a");
      rct(g, 2, 17, 22, 2, "#22262b");
    });
    SPR.shells = mkSprite(24, 20, function (g) {
      rct(g, 1, 5, 22, 14, "#a8281c"); rct(g, 2, 6, 20, 5, "#cc3a2a");
      for (var i = 0; i < 3; i++) { rct(g, 5 + i * 6, 1, 4, 7, "#c03a28"); rct(g, 5 + i * 6, 0, 4, 2, "#e8d8b0"); }
    });
    SPR.toastammo = mkSprite(22, 22, function (g) {
      rct(g, 3, 3, 16, 16, "#d9a457"); rct(g, 5, 5, 12, 12, "#eec077");
      rct(g, 3, 3, 4, 3, "#c08a3c"); rct(g, 15, 16, 4, 3, "#c08a3c");
    });
    function keySpr(col) {
      return mkSprite(20, 20, function (g) {
        ell(g, 8, 8, 5, 5, col); ell(g, 8, 8, 2, 2, "#20242c");
        rct(g, 9, 11, 3, 8, col); rct(g, 9, 16, 6, 2, col); rct(g, 9, 13, 5, 2, col);
      });
    }
    SPR.key0 = keySpr("#3a8fff"); SPR.key1 = keySpr("#ffd94a"); SPR.key2 = keySpr("#ff5a4a");
    SPR.shotgun = mkSprite(40, 16, function (g) {
      rct(g, 2, 6, 34, 5, "#3a3f46"); rct(g, 4, 4, 12, 4, "#6b4a2c");
      rct(g, 8, 10, 7, 6, "#6b4a2c"); rct(g, 18, 4, 3, 3, "#20242c");
    });
    SPR.chaingun = mkSprite(44, 18, function (g) {
      rct(g, 2, 5, 40, 7, "#2a2f36");
      for (var i = 0; i < 4; i++) rct(g, 10 + i * 7, 2, 4, 13, "#565d66");
      rct(g, 2, 11, 10, 6, "#6b4a2c");
    });
    SPR.toastergun = mkSprite(40, 24, function (g) {
      rct(g, 2, 8, 22, 14, "#c8d0d8"); rct(g, 3, 9, 20, 5, "#eef2f6");
      rct(g, 5, 11, 16, 4, "#2a2f36");
      rct(g, 24, 11, 14, 4, "#565d66");
      ell(g, 7, 17, 2, 2, "#1d2229"); ell(g, 14, 17, 2, 2, "#1d2229");
    });
    SPR.barrel = mkSprite(28, 34, function (g) {
      rct(g, 2, 2, 24, 30, "#5a6a3a"); rct(g, 4, 4, 20, 26, "#6d7f45");
      rct(g, 2, 8, 24, 3, "#3d4a26"); rct(g, 2, 22, 24, 3, "#3d4a26");
      rct(g, 8, 14, 12, 3, "#ffd94a");
      rct(g, 6, 17, 16, 4, "#c8a02a");
    });
    SPR.exit = mkSprite(30, 14, function (g) {
      rct(g, 2, 4, 26, 7, "#ffd94a"); rct(g, 6, 5, 18, 5, "#3a2f00");
      rct(g, 4, 1, 22, 3, "#a89000");
    });
    SPR.gib = mkSprite(10, 10, function (g) {
      ell(g, 5, 5, 4, 3, "#a01818"); ell(g, 4, 4, 2, 2, "#d03030");
    });
    SPR.plasma = mkSprite(14, 14, function (g) {
      ell(g, 7, 7, 6, 6, "#ff3b30"); ell(g, 7, 7, 3, 3, "#ffd0a0");
    });
    SPR.bullet = mkSprite(10, 6, function (g) {
      ell(g, 5, 3, 4, 2, "#ffe9a8"); ell(g, 5, 3, 2, 1, "#ffffff");
    });
    SPR.toastshot = mkSprite(16, 16, function (g) {
      rct(g, 2, 2, 12, 12, "#d9a457"); rct(g, 4, 4, 8, 8, "#eec077");
      rct(g, 2, 2, 3, 3, "#c08a3c"); rct(g, 11, 11, 3, 3, "#c08a3c");
    });
    SPR.blood = mkSprite(16, 8, function (g) {
      ell(g, 8, 5, 7, 3, "#7a1010"); ell(g, 5, 4, 3, 2, "#a01818");
    });

    /* the guns you hold, drawn big, drawn last */
    SPR.hand0 = mkSprite(70, 60, function (g) {
      rct(g, 24, 30, 42, 16, "#3a3f46"); rct(g, 28, 34, 40, 10, "#565d66");
      rct(g, 22, 44, 16, 14, "#7a5a3a"); rct(g, 30, 20, 12, 14, "#4a5058");
    });
    SPR.hand1 = mkSprite(90, 62, function (g) {
      rct(g, 10, 26, 76, 14, "#4a5058"); rct(g, 14, 30, 72, 8, "#6a7280");
      rct(g, 6, 38, 22, 20, "#7a5a3a"); rct(g, 30, 40, 14, 18, "#7a5a3a");
      rct(g, 20, 20, 10, 8, "#8a6742");
    });
    SPR.hand2 = mkSprite(94, 64, function (g) {
      rct(g, 6, 26, 84, 16, "#2a2f36");
      for (var i = 0; i < 5; i++) rct(g, 20 + i * 14, 14, 8, 28, "#565d66");
      rct(g, 4, 40, 20, 20, "#6b4a2c");
    });
    SPR.hand3 = mkSprite(76, 62, function (g) {
      rct(g, 14, 26, 34, 24, "#c8d0d8"); rct(g, 16, 28, 30, 8, "#eef2f6");
      rct(g, 18, 32, 26, 6, "#2a2f36"); rct(g, 46, 32, 26, 8, "#565d66");
      rct(g, 16, 48, 12, 10, "#8e97a3"); rct(g, 34, 48, 12, 10, "#8e97a3");
    });
    SPR.muzzle = mkSprite(60, 60, function (g) {
      ell(g, 30, 30, 14, 14, "#fff6c8");
      ell(g, 30, 30, 8, 8, "#ffffff");
      for (var a = 0; a < 6; a++) {
        var an = (a / 6) * 6.2832;
        g.fillStyle = "#ffe9a0";
        g.beginPath();
        g.moveTo(30 + Math.cos(an) * 6, 30 + Math.sin(an) * 6);
        g.lineTo(30 + Math.cos(an + 0.2) * 28, 30 + Math.sin(an + 0.2) * 28);
        g.lineTo(30 + Math.cos(an - 0.2) * 28, 30 + Math.sin(an - 0.2) * 28);
        g.closePath(); g.fill();
      }
    });
  }

  /* -------------------------------------------------------------------
     6. LEVELS. drawn by hand, in a text editor, like the whole website.
        every row is exactly WIDTH characters. i checked. i checked twice.
     ------------------------------------------------------------------- */
  var LEVELS = [
    {
      name: "THE LOBBY", sub: "1 / 6",
      hint: "YOU ARE IN THE LOBBY. THERE IS NOTHING TO BE AFRAID OF HERE. THAT IS THE LIE.",
      amb: 1.00, fogd: 17, fogc: [10, 11, 20], wall: T_WALL, wall2: T_STONE,
      floorT: 0, ceilT: 3, par: 60, face: 0,
      map: [
        "###########################",
        "#...h....#........#......a#",
        "#........#....E...#......E#",
        "#...E....+........+....X..#",
        "#........#....a...#......s#",
        "###+#####........#####+####",
        "#........#........#....R..#",
        "#...2....+....R...+...a...#",
        "#........#........#......h#",
        "#...a....#....b...#......s#",
        "########+.........+########",
        "#.......a#........#.......#",
        "#...h...E+....E...+...E...#",
        "#......os#........#.......#",
        "#...a....#....a...#......G#",
        "#########........+#########",
        "#...E...a#........#.....&.#",
        "#.......s+....a...+.......#",
        "#..@h....#........#...b...#",
        "###########################",
        "###########################",
      ]
    },
    {
      name: "CARPET LEVEL", sub: "2 / 6",
      hint: "BLUE DOORS NEED BLUE KEYS. THIS IS NOT A SECRET. IT IS JUST TRUE.",
      amb: 0.88, fogd: 13, fogc: [14, 6, 8], wall: T_CARPETW, wall2: T_WOOD,
      floorT: 1, ceilT: 1, par: 90, face: 0,
      map: [
        "###########################",
        "#...k....#........#...h...#",
        "#........R+....E..........#",
        "#..E....#........#.#......#",
        "########=.........+########",
        "#........#....a...#......s#",
        "#...2....+....R..........E#",
        "#........#........#......s#",
        "#...a....#....b...#......a#",
        "#########........+#########",
        "#.......R+........#......E#",
        "#..E....#....E...#........#",
        "#.......#........#........#",
        "#..h....#....a...#.....X..#",
        "########+:........+########",
        "#.......#........#........#",
        "#...3....+....R..........G#",
        "#.......#........#.......s#",
        "#.@y....#...a....#.....G..#",
        "#########........+#########",
        "###########################",
      ]
    },
    {
      name: "THE SERVER ROOM", sub: "3 / 6",
      hint: "SOMETHING HAS BEEN DEFRAGMENTING IN HERE SINCE 2001. IT IS STILL DEFRAGMENTING.",
      amb: 0.80, fogd: 11, fogc: [6, 12, 10], wall: T_SERVER, wall2: T_METAL,
      floorT: 0, ceilT: 4, par: 120, face: 0,
      map: [
        "###########################",
        "#...a....%%%%%....#.......#",
        "#........%%%%%.T.#....h...#",
        "#..#####.+%%%%%.###..###..#",
        "#..#...#.#%%%%%...#..#.G#.#",
        "#..#.E.#.#%%%%%...#.#...#.#",
        "#..#...#.+...#...##.#####.#",
        "#..#####.#...#.####.......#",
        "#.......G#...#...#.....G..#",
        "####+#####...#...#.##+#####",
        "#.............#...........#",
        "#.#####...X...#...###.....#",
        "#.#...#.......#...........#",
        "#.#.T.#...#####...#...R...#",
        "#.#...#.........#.#.......#",
        "#.#####.....#####..####...#",
        "#....s.......#............#",
        "#...a.......+....b........#",
        "#.@..E......#.......h.....#",
        "###########################",
        "###########################",
      ]
    },
    {
      name: "CARPET LEVEL II", sub: "4 / 6",
      hint: "YES IT IS THE SEQUEL. NOBODY ASKED FOR THE SEQUEL.",
      amb: 0.84, fogd: 12, fogc: [16, 5, 9], wall: T_CARPETW, wall2: T_CARPETW2,
      floorT: 1, ceilT: 4, par: 150, face: 0,
      map: [
        "###########################",
        "#...h............#...a....#",
        "#....E......G....#...E....#",
        "#........+........+......##",
        "########:........:#########",
        "#................#.......##",
        "#..2........yE........R...#",
        "#........+........+......##",
        "#....a...........#...a....#",
        "#####;####........###;#####",
        "#........&.......#.......##",
        "#..E........G....#....E...#",
        "#........+........+......##",
        "#...h............#...h....#",
        "#########...X....##########",
        "#................#.......##",
        "#..O.......r.E...#....O...#",
        "#........+........+......##",
        "#..@a............#...s....#",
        "###########################",
        "###########################",
      ]
    },
    {
      name: "TOASTER DREAMS", sub: "5 / 6",
      hint: "YOU HEAR IT BEFORE YOU SEE IT. YOU ALWAYS HEAR IT BEFORE YOU SEE IT.",
      amb: 0.76, fogd: 10, fogc: [18, 12, 4], wall: T_TOASTERW, wall2: T_METAL,
      floorT: 2, ceilT: 4, par: 180, face: 0,
      map: [
        "###########################",
        "#................#........#",
        "#..&&........R...#........#",
        "#..##....+........+...h...#",
        "#..##.......O....#........#",
        "#####+####........###+#####",
        "#................#........#",
        "#...T....+....T...+......T#",
        "#................#........#",
        "#####+####........###+#####",
        "#................#........#",
        "#...O....+....O...+..O....#",
        "#................#........#",
        "#####+####........###+#####",
        "#............X...#........#",
        "#...G....+........+..G....#",
        "#................#........#",
        "#...s....+...a....+...s...#",
        "#..@R............#...E....#",
        "###########################",
        "###########################",
      ]
    },
    {
      name: "THE END OF THE INTERNET", sub: "6 / 6",
      hint: "FINAL LEVEL. THE ONE THAT WAS UNDER CONSTRUCTION SINCE MARCH.",
      amb: 0.70, fogd: 12, fogc: [10, 4, 16], wall: T_TECH, wall2: T_STONE,
      floorT: 5, ceilT: 4, par: 210, face: 0,
      map: [
        "###########################",
        "#................#........#",
        "#...a.......O....#...a....#",
        "#........+........+.......#",
        "#####+####........###+#####",
        "#................#........#",
        "#...T.......G....#...T....#",
        "#........+........+.......#",
        "#####+####........###+#####",
        "#........&.......#........#",
        "#...R............#...R....#",
        "#########........##########",
        "#...........B....#........#",
        "#########........##########",
        "#...R............#...R....#",
        "#####+####........###+#####",
        "#........&.......#........#",
        "#...h............#...h....#",
        "#..@.X...........#..a.....#",
        "###########################",
        "###########################",
      ]
    }
  ];

  /* the level that builds itself in front of you. only reachable if you
     have found every secret wall, which nobody has, including me. */
  function nightmareLevel() {
    var w = 39, h = 31, m = [];
    for (var y = 0; y < h; y++) { m.push([]); for (var x = 0; x < w; x++) m[y].push("#"); }
    var rooms = [];
    function carve(rx, ry, rw, rh) {
      for (var y = ry; y < ry + rh; y++) for (var x = rx; x < rx + rw; x++) m[y][x] = ".";
      rooms.push([rx, ry, rw, rh]);
    }
    carve(1, 1, w - 2, h - 2);
    /* knock out some rooms */
    var rc = [[3, 3, 8, 7], [14, 3, 9, 6], [26, 3, 9, 7], [3, 13, 7, 8], [13, 12, 10, 7], [26, 13, 9, 8], [4, 24, 9, 5], [17, 23, 8, 6], [28, 24, 8, 5]];
    for (var i = 0; i < rc.length; i++) carve(rc[i][0], rc[i][1], rc[i][2], rc[i][3]);
    /* corridors */
    for (var k = 0; k < rc.length - 1; k++) {
      var a = rc[k], b = rc[k + 1];
      var ax = a[0] + (a[2] >> 1), ay = a[1] + (a[3] >> 1);
      var bx = b[0] + (b[2] >> 1), by = b[1] + (b[3] >> 1);
      var x = ax, y = ay;
      while (x !== bx) { m[y][x] = "."; x += (bx > x ? 1 : -1); }
      while (y !== by) { m[y][x] = "."; y += (by > y ? 1 : -1); }
      m[by][bx] = ".";
    }
    /* the exit goes in the last room, the boss of the last room goes next to it */
    var last = rc[rc.length - 1];
    m[last[1] + (last[3] >> 1)][last[0] + (last[2] >> 1)] = "X";
    m[rc[0][1] + (rc[0][3] >> 1)][rc[0][0] + (rc[0][2] >> 1)] = "E";
    /* scatter the population */
    var spawns = "EEERRRRGGTTOOEEEEGRRTEOO";
    var placed = 0;
    for (var s = 0; s < 260 && placed < 22; s++) {
      var sx = 2 + irnd(w - 4), sy = 2 + irnd(h - 4);
      if (m[sy][sx] === ".") { m[sy][sx] = spawns[placed % spawns.length]; placed++; }
    }
    var loot = "haasbkkkkysssrrhhaaabbb";
    for (var q = 0; q < 200 && q < 14; q++) {
      var lx = 2 + irnd(w - 4), ly = 2 + irnd(h - 4);
      if (m[ly][lx] === ".") m[ly][lx] = loot[q];
    }
    /* some walls are secret. two of them. of course. */
    m[rc[3][1]][rc[3][0] + 2] = "&";
    m[rc[6][1]][rc[6][0] + 3] = "&";
    return {
      name: "NIGHTMARE", sub: "7 / 7 - it built itself while you were reading this",
      hint: "YOU FOUND EVERY SECRET WALL. THIS LEVEL WAS WRITTEN BY THE LEVEL GENERATOR. THE LEVEL GENERATOR IS ALSO ME.",
      amb: 0.72, fogd: 9, fogc: [12, 2, 8], wall: T_STONE, wall2: T_METAL,
      floorT: 1, ceilT: 4, par: 300, face: 0,
      map: m.map(function (r) { return r.join(""); })
    };
  }

  /* -------------------------------------------------------------------
     7. STATE
     ------------------------------------------------------------------- */
  var S = {
    mode: "title",     /* title | brief | play | pause | dead | clear | win */
    li: 0, lw: 0, lh: 0,
    tile: null, wtex: null, doorAt: null, exitIdx: -1,
    doors: [], items: [], enemies: [], projs: [], gibs: [], fx: [],
    seen: null, flow: null, flowT: 0,
    t: 0, frame: 0, last: 0, msg: [], shake: 0, flash: 0, fade: 1, hitMark: 0,
    secrets: 0, totalSecrets: 0, runKills: 0, runTime: 0, runScore: 0,
    meleeLock: 0, god: false, lie: false, cheats: false,
    boss: null
  };

  var P = {
    x: 2.5, y: 2.5, ang: 0, vx: 0, vy: 0,
    hp: 100, ar: 0, keys: [false, false, false],
    ammo: [50, 0, 0, 0], weapons: [0], weap: 0,
    bob: 0, bobAmp: 0, kick: 0, fireT: 0, cd: 0,
    dead: false, sprint: false, crouch: false, god: false
  };

  /* -------------------------------------------------------------------
     8. GRID QUERIES
     ------------------------------------------------------------------- */
  function idx(x, y) { return y * S.lw + x; }
  function inside(x, y) { return x >= 0 && y >= 0 && x < S.lw && y < S.lh; }
  function tileAt(x, y) { return inside(x, y) ? S.tile[idx(x, y)] : 1; }

  /* tile codes: 0 floor, 1 wall, 2 secret wall, 3 exit, 4 door */
  function isSolidCell(x, y) {
    if (!inside(x, y)) return true;
    var t = S.tile[idx(x, y)];
    if (t === 0 || t === 3) return false;
    if (t === 4) {
      var d = S.doors[S.doorAt[idx(x, y)]];
      return !d || d.open < 0.82;
    }
    return true;
  }
  function blocksSight(x, y) {
    if (!inside(x, y)) return true;
    var t = S.tile[idx(x, y)];
    if (t === 0 || t === 3) return false;
    if (t === 4) {
      var d = S.doors[S.doorAt[idx(x, y)]];
      return !d || d.open < 0.55;
    }
    return true;
  }

  /* does a circle at (x,y) with radius r hit anything? */
  function hitsWall(x, y, r) {
    var x0 = Math.floor(x - r), x1 = Math.floor(x + r);
    var y0 = Math.floor(y - r), y1 = Math.floor(y + r);
    for (var gy = y0; gy <= y1; gy++) {
      for (var gx = x0; gx <= x1; gx++) {
        if (!isSolidCell(gx, gy)) continue;
        var cx = clamp(x, gx, gx + 1), cy = clamp(y, gy, gy + 1);
        var dx = x - cx, dy = y - cy;
        if (dx * dx + dy * dy < r * r) return true;
      }
    }
    return false;
  }

  function moveEnt(e, dx, dy, r) {
    var nx = e.x + dx;
    if (!hitsWall(nx, e.y, r)) e.x = nx;
    var ny = e.y + dy;
    if (!hitsWall(e.x, ny, r)) e.y = ny;
  }

  /* march a ray through the grid until something solid. returns distance */
  function rayWall(ang, maxD, ox, oy) {
    var dx = Math.cos(ang), dy = Math.sin(ang);
    var d = 0, step = 0.035;
    for (d = step; d < maxD; d += step) {
      if (isSolidCell(Math.floor(ox + dx * d), Math.floor(oy + dy * d))) return d;
    }
    return maxD;
  }

  function lineOfSight(ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var steps = Math.ceil(dist / 0.22);
    for (var i = 1; i < steps; i++) {
      var t = i / steps;
      if (blocksSight(Math.floor(ax + dx * t), Math.floor(ay + dy * t))) return false;
    }
    return true;
  }

  /* BFS flow field toward the player, so the monsters do not walk into walls */
  function buildFlow() {
    var n = S.lw * S.lh;
    if (!S.flow || S.flow.length !== n) S.flow = new Int16Array(n);
    var f = S.flow;
    for (var i = 0; i < n; i++) f[i] = -1;
    var px = Math.floor(P.x), py = Math.floor(P.y);
    if (!inside(px, py)) return;
    var q = [idx(px, py)];
    f[q[0]] = 0;
    var head = 0;
    while (head < q.length) {
      var c = q[head++];
      var cx = c % S.lw, cy = (c / S.lw) | 0;
      var nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (var k = 0; k < 4; k++) {
        var nx = cx + nb[k][0], ny = cy + nb[k][1];
        if (!inside(nx, ny)) continue;
        var ni = idx(nx, ny);
        if (f[ni] !== -1) continue;
        if (blocksSight(nx, ny)) continue;
        f[ni] = f[c] + 1;
        q.push(ni);
      }
    }
  }

  function flowDir(x, y) {
    var gx = Math.floor(x), gy = Math.floor(y);
    var best = -1, bx = 0, by = 0, bd = 1e9;
    for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      var nx = gx + dx, ny = gy + dy;
      if (!inside(nx, ny) || blocksSight(nx, ny)) continue;
      if (dx && dy && (blocksSight(gx + dx, gy) || blocksSight(gx, gy + dy))) continue;
      var v = S.flow[idx(nx, ny)];
      if (v < 0) continue;
      if (v < bd) { bd = v; best = v; bx = dx; by = dy; }
    }
    if (best < 0) return null;
    var len = Math.sqrt(bx * bx + by * by);
    return { x: bx / len, y: by / len };
  }

  /* -------------------------------------------------------------------
     9. LEVEL LOADING
     ------------------------------------------------------------------- */
  function loadLevel(i, opts) {
    var L = LEVELS[i];
    S.li = i;
    var rows = L.map, h = rows.length, w = 0;
    for (var r0 = 0; r0 < h; r0++) w = Math.max(w, rows[r0].length);
    S.lw = w; S.lh = h;
    S.tile = new Uint8Array(w * h);
    S.wtex = new Uint8Array(w * h);
    S.doorAt = new Int32Array(w * h);
    S.seen = new Uint8Array(w * h);
    S.doors = []; S.items = []; S.enemies = []; S.projs = []; S.gibs = []; S.fx = [];
    S.boss = null; S.exitIdx = -1;
    S.amb = L.amb; S.fogd = L.fogd; fog = L.fogc;
    S.floorT = L.floorT; S.ceilT = L.ceilT;
    for (var q = 0; q < SHADES; q++) { /* the fog changed, so the cache is a lie now */
      for (var t2 = 0; t2 < shCache.length; t2++) shCache[t2][q] = null;
    }

    var start = null;
    for (var y = 0; y < h; y++) {
      var row = rows[y];
      for (var x = 0; x < w; x++) {
        var ch = x < row.length ? row.charAt(x) : "#";
        var i2 = idx(x, y);
        S.doorAt[i2] = -1;
        if (ch === "#") { S.tile[i2] = 1; S.wtex[i2] = L.wall; }
        else if (ch === "%") { S.tile[i2] = 1; S.wtex[i2] = L.wall2; }
        else if (ch === "&") { S.tile[i2] = 2; S.wtex[i2] = L.wall; }
        else if (ch === "@") { S.tile[i2] = 0; start = [x + 0.5, y + 0.5]; }
        else if (ch === "X") { S.tile[i2] = 3; S.exitIdx = i2; }
        else if (ch === "+" || ch === "=" || ch === ":" || ch === ";") {
          S.tile[i2] = 4;
          S.wtex[i2] = ch === "+" ? T_DOOR : (ch === "=" ? T_DOOR1 : (ch === ":" ? T_DOOR2 : T_DOOR3));
          S.doorAt[i2] = S.doors.length;
          S.doors.push({ x: x, y: y, open: 0, want: 0, lock: ch === "+" ? 0 : (ch === "=" ? 1 : (ch === ":" ? 2 : 3)), tex: S.wtex[i2], wob: 0 });
        }
        else { S.tile[i2] = 0; }
      }
    }
    /* second pass: the things that live in cells. they need the grid finished
       before they can be told where the floor is. */
    for (var y2 = 0; y2 < h; y2++) {
      var row2 = rows[y2];
      for (var x2 = 0; x2 < w; x2++) {
        var c2 = x2 < row2.length ? row2.charAt(x2) : "#";
        if (ENEMY_CH[c2]) spawnEnemy(ENEMY_CH[c2], x2 + 0.5, y2 + 0.5);
        if (PICKUPS[c2]) {
          var pk = PICKUPS[c2];
          if (pk.kind === "barrel") spawnEnemy("barrel", x2 + 0.5, y2 + 0.5);
          else S.items.push({
            x: x2 + 0.5, y: y2 + 0.5, kind: pk.kind, v: pk.v, ai: pk.ai, ki: pk.ki, wi: pk.wi,
            spr: SPR[pk.spr], t: rnd(0, 6), got: false
          });
        }
      }
    }
    if (!start) {
      for (var sy = 0; sy < h; sy++) for (var sx = 0; sx < w; sx++) {
        if (S.tile[idx(sx, sy)] === 0) { start = [sx + 0.5, sy + 0.5]; sx = w; sy = h; }
      }
    }
    /* nobody spawns in your face. it is not a difficulty setting, it is manners. */
    if (start) {
      for (var k9 = S.enemies.length - 1; k9 >= 0; k9--) {
        var e9 = S.enemies[k9];
        if (Math.hypot(e9.x - start[0], e9.y - start[1]) < 3.2) S.enemies.splice(k9, 1);
      }
    }
    P.x = start ? start[0] : 2.5;
    P.y = start ? start[1] : 2.5;
    P.ang = L.face || 0;
    P.vx = P.vy = 0; P.kick = 0; P.fireT = 0;
    P.bob = 0; P.bobAmp = 0; P.yawDrift = 0;
    S.padNag = 0; S.warned = false;
    if (opts && opts.fresh) {
      P.hp = 100; P.ar = 0; P.keys = [false, false, false];
      P.ammo = [50, 0, 0, 0]; P.weapons = [0]; P.weap = 0;
      S.runKills = 0; S.runScore = 0; S.runTime = 0; S.secrets = 0;
    }
    S.itemsTotal = S.items.length;
    verifyLevel();
    buildFlow();
    S.flowT = 0;
    S.fade = 1;
  }

  /* i check the maps myself. if the exit cannot be reached, i say so, loudly,
     in the console, where nobody will look. */
  function verifyLevel() {
    var seen = new Uint8Array(S.lw * S.lh);
    if (S.exitIdx < 0) { console.warn("[raycaster] level " + (S.li + 1) + " has no exit pad"); return; }
    var q = [idx(Math.floor(P.x), Math.floor(P.y))];
    seen[q[0]] = 1;
    var head = 0, found = false;
    while (head < q.length) {
      var c = q[head++];
      if (c === S.exitIdx) { found = true; break; }
      var cx = c % S.lw, cy = (c / S.lw) | 0;
      var nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (var k = 0; k < 4; k++) {
        var nx = cx + nb[k][0], ny = cy + nb[k][1];
        if (!inside(nx, ny)) continue;
        var ni = idx(nx, ny);
        if (seen[ni]) continue;
        var t = S.tile[ni];
        if (t === 1 || t === 2) continue;
        seen[ni] = 1; q.push(ni);
      }
    }
    if (!found) console.warn("[raycaster] level " + (S.li + 1) + " (" + LEVELS[S.li].name + "): the exit pad cannot be reached. the map is wrong.");
  }

  function spawnEnemy(type, x, y) {
    var def = ENEMY[type] || { hp: 20, speed: 0, r: 0.3, melee: 0, ranged: 0, cd: 1, score: 10, h: 0.7, name: "BARREL" };
    var mul = 1 + S.li * 0.13;
    S.enemies.push({
      type: type, x: x, y: y, ang: rnd(0, 6.28),
      hp: type === "barrel" ? 20 : Math.round(def.hp * mul),
      maxhp: type === "barrel" ? 20 : Math.round(def.hp * mul),
      dmgMul: 1 + S.li * 0.07,
      spd: def.speed * (1 + S.li * 0.04),
      def: def,
      state: "idle", stateT: 0, atkCd: rnd(0, 1.2), anim: rnd(0, 6),
      dead: false, deadT: 0, flash: 0, alertT: 0, seenT: -99, painT: 0,
      isBarrel: type === "barrel"
    });
    if (type === "boss") S.boss = S.enemies[S.enemies.length - 1];
  }

  /* -------------------------------------------------------------------
     10. MESSAGES. the log is the most honest part of any game like this.
     ------------------------------------------------------------------- */
  function say(txt, col) {
    S.msg.push({ t: txt, c: col || "#00ff41", life: 3.4 });
    if (S.msg.length > 4) S.msg.shift();
    paintLog();
  }
  function paintLog() {
    var el = document.getElementById("rc-log");
    if (!el) return;
    var h = "";
    for (var i = 0; i < S.msg.length; i++) {
      var m = S.msg[i];
      h += '<div style="color:' + m.c + '">' + m.t + "</div>";
    }
    el.innerHTML = h;
  }

  /* -------------------------------------------------------------------
     11. INPUT
     ------------------------------------------------------------------- */
  var keys = {}, mouseDown = false, dragging = false;
  var sens = 0.0022, fovWide = 0.72;
  var mouseLocked = false;

  function planeLen() { return fovWide; }

  function initInput(cv) {
    window.addEventListener("keydown", function (e) {
      if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
      var k = e.key.toLowerCase();
      if (["w", "a", "s", "d", " ", "shift", "control", "tab", "e", "r", "q", "b", "m", "escape",
           "arrowup", "arrowdown", "arrowleft", "arrowright", "1", "2", "3", "4", "5", "f2", "?"].indexOf(k) >= 0) {
        if (S.mode === "play") e.preventDefault();
      }
      if (keys[k]) return;
      keys[k] = true;
      onKey(k, e);
    });
    window.addEventListener("keyup", function (e) { keys[e.key.toLowerCase()] = false; });
    window.addEventListener("blur", function () {
      keys = {}; mouseDown = false;
      if (S.mode === "play") setMode("pause");
    });

    cv.addEventListener("mousedown", function (e) {
      if (S.mode !== "play") return;
      e.preventDefault();
      mouseDown = true;
      if (!mouseLocked) dragging = true;
      fire();
    });
    window.addEventListener("mouseup", function () { mouseDown = false; dragging = false; });
    cv.addEventListener("contextmenu", function (e) { e.preventDefault(); });

    window.addEventListener("mousemove", function (e) {
      if (S.mode !== "play") return;
      if (mouseLocked && e.movementX !== undefined) {
        P.ang = angNorm(P.ang + e.movementX * sens);
        P.yawDrift = (e.movementY || 0) * sens;
      } else if (dragging) {
        P.ang = angNorm(P.ang + (e.movementX || 0) * sens * 1.6);
      }
      if (P.yawDrift) P.yawDrift *= 0.86;
    });

    document.addEventListener("pointerlockchange", function () {
      mouseLocked = (document.pointerLockElement === cv);
      if (!mouseLocked && S.mode === "play" && !opts.noLock) setMode("pause");
    });
  }

  function requestLock(cv) {
    try { if (cv.requestPointerLock) cv.requestPointerLock(); } catch (e) {}
  }

  function onKey(k, e) {
    if (S.mode === "title") {
      if (k === "enter" || k === " ") { SFX.select(); startRun(); }
      else if (k === "?") showHelp();
      return;
    }
    if (k === "escape") {
      if (S.mode === "play") setMode("pause");
      else if (S.mode === "pause") { if (S.cheatOpen) closeCheat(); else resume(); }
      else if (S.cheatOpen) closeCheat();
      return;
    }
    if (k === "f2") { openCheat(); return; }
    if (S.mode === "play") {
      if (k >= "1" && k <= "5") selectWeapon(+k - 1);
      else if (k === "q") { if (!P.keys[0]) say("YOU FIND NO BLUE KEY.", "#ff5555"); else say("SWITCH TO WEAPONS WITH 1-5. THE KEY IS FOR DOORS.", "#ffcc44"); }
      else if (k === "e") useThing();
      else if (k === "r") say("THERE IS NO RELOAD IN THIS BUILD. THE AMMO IS THE RELOAD.", "#ffcc44");
      else if (k === "m") say(toggleMusic() ? "THEME.3D: ON. IT IS STILL FOUR NOTES." : "THEME.3D: OFF. SILENCE IS ALSO FOUR NOTES.", "#66ddff");
      else if (k === "b") { S.lie = !S.lie; say(S.lie ? "LIE MODE ON. THE NUMBERS WILL ENCOURAGE YOU." : "LIE MODE OFF. THE NUMBERS NEVER HAD ANYTHING TO SAY."); }
      else if (k === "f") fovWide = (fovWide > 0.8) ? 0.72 : 0.95;
      else if (k === "?") showHelp();
      else if (k === "tab") { S.mapOpen = !S.mapOpen; }
      else if (k === "p") { S.mapOpen = !S.mapOpen; }
      if (k === " ") fire();
    } else if (S.mode === "dead") {
      if (k === "enter" || k === " " || k === "r") { retryLevel(); }
    } else if (S.mode === "clear") {
      if (k === "enter" || k === " ") nextLevel();
    } else if (S.mode === "win") {
      if (k === "enter" || k === " ") setMode("title");
    }
  }

  function selectWeapon(i) {
    if (i >= P.weapons.length) { say("YOU DO NOT HAVE THAT. YET.", "#ffcc44"); return; }
    P.weap = i; P.fireT = 0.25;
    SFX.menu();
  }

  /* -------------------------------------------------------------------
     12. THE CHEAT CONSOLE. because of course there is one.
     ------------------------------------------------------------------- */
  function openCheat() {
    S.cheatOpen = true;
    showOverlay(
      "<div class='rctitle'>CHEAT CONSOLE</div>" +
      "<div class='rcsmall'>TYPE A CHEAT. THIS IS NOT A MENU. THIS IS A DOOR YOU LEFT OPEN.</div>" +
      "<input id='rc-cheat' class='mono' maxlength='16' spellcheck='false' autocomplete='off'>" +
      "<div class='rcsmall'>ENTER = RUN &middot; ESC = LEAVE &middot; TRY: IDDQD</div>",
      function (root) {
        var inp = document.getElementById("rc-cheat");
        inp.focus();
        inp.addEventListener("keydown", function (e) {
          e.stopPropagation();
          if (e.key === "Escape") { closeCheat(); return; }
          if (e.key === "Enter") {
            var v = inp.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
            closeCheat();
            if (v === "IDDQD") {
              P.god = true; S.god = true;
              say("GOD MODE. YOU CANNOT DIE IN HERE. YOU CAN STILL BE BORED.", "#ffff66");
              if (FS.unlock) FS.unlock("iddqd", { say: "<b>you typed the cheat into my game.</b> into the website. it worked. of course it worked." });
            } else if (v === "IDKFA") {
              P.hp = 100; P.ar = 100; P.ammo = [50, 25, 60, 30];
              P.weapons = [0, 1, 2, 3];
              say("EVERYTHING, AT ONCE. YOU HAVE NO RESTraint AND IT SHOWS.", "#ffff66");
            } else if (v === "XYZZY") {
              say("NOTHING HAPPENED.", "#66ddff");
              setTimeout(function () { say("...EXCEPT THAT A WALL JUST MOVED. SOMEWHERE. GO AND LOOK.", "#66ddff"); }, 1400);
              openAllSecrets();
            } else if (v === "SHERLOCK") {
              say("ELEMENTARY. IT WAS THE CORRIDOR. IT IS ALWAYS THE CORRIDOR.", "#66ddff");
              killAll();
            } else if (v === "TOASTER") {
              say("THE TOASTER IS WARM. THE TOASTER HAS ALWAYS BEEN WARM.", "#ffcc44");
              toggleMusic(true);
            } else if (v === "NOCLIP") {
              P.noclip = !P.noclip;
              say(P.noclip ? "YOU CAN WALK THROUGH THE WEBSITE NOW." : "THE WEBSITE IS SOLID AGAIN.");
            } else if (v === "PEPE") {
              say("there is no pepé here. there is a toaster. there has only ever been a toaster.", "#ffcc44");
            } else {
              say("CHEAT NOT RECOGNISED. THERE ARE 6 REAL ONES. GUESS. (IDDQD IS THE OBVIOUS ONE.)", "#ff5555");
            }
          }
        });
      }
    );
  }
  function closeCheat() { S.cheatOpen = false; hideOverlay(); }
  function openAllSecrets() {
    for (var i = 0; i < S.tile.length; i++) if (S.tile[i] === 2) S.tile[i] = 0;
    say("EVERY SECRET WALL IN THIS LEVEL IS NOW A FLOOR. CHEAT.", "#66ddff");
  }
  function killAll() {
    for (var i = 0; i < S.enemies.length; i++) {
      var e = S.enemies[i];
      if (!e.dead && !e.isBarrel) hurtEnemy(e, 9999, false, 0, 0);
    }
  }

  /* -------------------------------------------------------------------
     13. SHOOTING
     ------------------------------------------------------------------- */
  function rayHitEnemies(ang, maxD, ox, oy) {
    var best = null, bestD = maxD;
    var dx = Math.cos(ang), dy = Math.sin(ang);
    for (var i = 0; i < S.enemies.length; i++) {
      var e = S.enemies[i];
      if (e.dead) continue;
      var ex = e.x - ox, ey = e.y - oy;
      var proj = ex * dx + ey * dy;
      if (proj < 0 || proj > bestD) continue;
      var perp = Math.abs(ex * -dy + ey * dx);
      var r = e.def.r + 0.06;
      if (perp > r) continue;
      var t = proj - Math.sqrt(Math.max(0, r * r - perp * perp));
      if (t < bestD && t > 0.1) { bestD = t; best = e; }
    }
    return { e: best, d: bestD };
  }

  function fire() {
    if (S.mode !== "play" || P.dead) return;
    var w = WEAPONS[P.weapons[P.weap]];
    if (P.fireT > 0) return;
    if (P.ammo[w.ammo] <= 0) {
      P.fireT = 0.25;
      SFX.nope ? SFX.nope() : SFX.menu();
      say("NO " + AMMO_NAMES[w.ammo].toUpperCase() + ". THE GUN IS A NOVELTY.", "#ff5555");
      if (P.weapons.length > 1) {
        var alt = P.weapons[P.weap === 0 ? 1 : 0];
        P.weap = P.weap === 0 ? 1 : 0;
        var w2 = WEAPONS[P.weapons[P.weap]];
        if (P.ammo[w2.ammo] > 0) say("SWITCHED TO " + w2.name + ".");
      }
      return;
    }
    P.fireT = w.rate;
    P.ammo[w.ammo]--;
    S.flash = 1;
    S.shake = Math.max(S.shake, w.shake);
    P.kick = w.kick;
    SFX[w.snd]();
    /* a gunshot is a knock on the door. the neighbours hear it. */
    for (var a0 = 0; a0 < S.enemies.length; a0++) {
      var n0 = S.enemies[a0];
      if (n0.dead || n0.state !== "idle") continue;
      if (Math.hypot(n0.x - P.x, n0.y - P.y) < 13 && lineOfSight(n0.x, n0.y, P.x, P.y)) {
        n0.alertT = 5;
      }
    }

    if (w.proj) {
      S.projs.push({
        x: P.x + Math.cos(P.ang) * 0.4, y: P.y + Math.sin(P.ang) * 0.4,
        vx: Math.cos(P.ang) * 13, vy: Math.sin(P.ang) * 13, life: 2.2,
        dmg: w.dmg, kind: "toast", ang: P.ang, spin: 0, from: "you"
      });
      return;
    }
    for (var p = 0; p < w.pellets; p++) {
      var a = P.ang + rnd(-w.spread, w.spread);
      var wallD = rayWall(a, w.range, P.x, P.y);
      var hit = rayHitEnemies(a, wallD, P.x, P.y);
      if (hit.e) {
        hurtEnemy(hit.e, w.dmg, true, hit.d, a);
        spawnGibs(hit.e.x, hit.e.y, 3, 0.6);
        SFX.hit();
        S.hitMark = 0.12;
      } else if (wallD < w.range - 0.2) {
        /* hit a wall: put a mark on it, because i am detail-oriented */
        spawnSpark(P.x + Math.cos(a) * wallD, P.y + Math.sin(a) * wallD, a);
      }
    }
  }

  function hurtEnemy(e, dmg, showHit, d, a) {
    if (e.dead) return;
    e.hp -= dmg;
    e.flash = 0.09;
    e.alertT = 6;
    if (e.isBarrel) { explode(e); return; }
    if (e.state === "idle") { e.state = "alert"; SFX.growl(); }
    if (e.hp <= 0) {
      e.dead = true; e.deadT = 0;
      S.runKills++;
      S.runScore += e.def.score;
      SFX.die();
      spawnGibs(e.x, e.y, 7, 1.5);
      S.fx.push({ kind: "text", x: e.x, y: e.y, life: 1.0, t: "" });
      if (e.type === "toaster") {
        say("A TOASTER IS DOWN. IT WAS NOT BEING CAREFUL.", "#ffcc44");
        if (FS.sfx && FS.sfx.honk) FS.sfx.honk();
      }
    }
  }

  function explode(e) {
    e.dead = true; e.deadT = 0;
    S.shake = Math.max(S.shake, 9);
    SFX.boom();
    spawnGibs(e.x, e.y, 12, 2.6);
    S.fx.push({ kind: "boom", x: e.x, y: e.y, life: 0.35 });
    var d = Math.hypot(e.x - P.x, e.y - P.y);
    if (d < 2.4) hurtPlayer(Math.round(72 * (1 - d / 2.4)), "A BARREL. THE BARREL DID NOTHING WRONG.");
    for (var i = 0; i < S.enemies.length; i++) {
      var o = S.enemies[i];
      if (o === e || o.dead) continue;
      var dd = Math.hypot(o.x - e.x, o.y - e.y);
      if (dd < 2.6) hurtEnemy(o, Math.round(130 * (1 - dd / 2.6)), false, 0, 0);
    }
  }

  function spawnGibs(x, y, n, power) {
    for (var i = 0; i < n; i++) {
      var a = rnd(0, 6.28), sp = rnd(1, 3) * power;
      S.gibs.push({
        x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        z: 0.35, vz: rnd(1.2, 3.4), life: rnd(3, 6), spr: SPR.gib, h: 0.16, b: 0,
        spin: rnd(0, 6), ang: a, rest: 0
      });
    }
  }
  function spawnSpark(x, y, a) {
    S.gibs.push({
      x: x, y: y, vx: Math.cos(a + Math.PI) * 0.4, vy: Math.sin(a + Math.PI) * 0.4,
      z: 0.5, vz: 0.4, life: 0.25, spr: SPR.gib, h: 0.1, b: 0.4, spin: 0, ang: a, rest: 1
    });
  }

  function hurtPlayer(dmg, why) {
    if (P.dead || P.god) return;
    var toArmor = Math.min(P.ar, Math.round(dmg * 0.4));
    P.ar -= toArmor;
    var rest = dmg - toArmor;
    P.hp -= rest;
    P.painT = 0.35;
    S.shake = Math.max(S.shake, 3 + dmg * 0.12);
    SFX.hurt();
    S.deathCause = why || "SOMETHING, EVENTUALLY";
    say("-" + dmg + " HP. " + (why || ""), "#ff5555");
    if (P.hp <= 0) { P.hp = 0; killPlayer(); }
  }

  function killPlayer() {
    P.dead = true;
    SFX.lose();
    saveBest();
    setMode("dead");
  }

  /* -------------------------------------------------------------------
     14. PICKUPS, DOORS, SECRETS
     ------------------------------------------------------------------- */
  function pickup(it) {
    it.got = true;
    var msg = "";
    if (it.kind === "hp") { P.hp = Math.min(100, P.hp + it.v); msg = it.v === 60 ? "PICKED UP THE BIG MEDKIT. +60." : "PICKED UP A MEDKIT. +25."; SFX.pickup(); }
    else if (it.kind === "armor") { P.ar = Math.min(100, P.ar + it.v); msg = "PICKED UP A BATTERY. +50 ARMOUR."; SFX.armor(); }
    else if (it.kind === "ammo") { P.ammo[it.ai] += it.v; msg = "PICKED UP " + it.v + " " + AMMO_NAMES[it.ai].toUpperCase() + "."; SFX.pickup(); }
    else if (it.kind === "key") { P.keys[it.ki] = true; msg = ["YOU FOUND A BLUE KEY.", "YOU FOUND A YELLOW KEY.", "YOU FOUND A RED KEY."][it.ki]; SFX.key(); }
    else if (it.kind === "weapon") {
      if (P.weapons.indexOf(it.wi) < 0) { P.weapons.push(it.wi); P.weap = P.weapons.length - 1; }
      else { P.ammo[WEAPONS[it.wi].ammo] += 25; }
      msg = ["", "YOU GOT THE SHOTGUN. IT IS LOUD AND THAT IS THE POINT.",
             "YOU GOT THE CHAINGUN. IT HAS A PROBLEM. THE PROBLEM IS NOISE.",
             "YOU FOUND A TOASTER GUN. THE TOASTER KNOWS."][it.wi];
      SFX.select();
    }
    if (msg) say(msg);
  }

  /* the door you are standing in front of. no line-of-sight test here on
     purpose: the door itself is solid, so a sight test would always fail and
     the door would be a rock you can stand next to and shout at. */
  function nearestDoor() {
    var best = null, bd = 1.75;
    for (var i = 0; i < S.doors.length; i++) {
      var d = S.doors[i];
      var cx = d.x + 0.5, cy = d.y + 0.5;
      var dist = Math.sqrt((cx - P.x) * (cx - P.x) + (cy - P.y) * (cy - P.y));
      if (dist > bd) continue;
      var toDoor = Math.atan2(cy - P.y, cx - P.x);
      if (Math.abs(angDiff(toDoor, P.ang)) > 1.75) continue;
      bd = dist; best = d;
    }
    return best;
  }

  function useThing() {
    var d = nearestDoor();
    var KEYNAME = ["", "BLUE", "YELLOW", "RED"];
    if (d) {
      if (d.lock === 0) {
        d.want = d.want ? 0 : 1;
        SFX.door();
        say(d.want ? "YOU OPEN THE DOOR." : "YOU CLOSE THE DOOR. WHY.");
      } else if (P.keys[d.lock - 1]) {
        var name = KEYNAME[d.lock];
        P.keys[d.lock - 1] = false;
        d.lock = 0; d.want = 1;
        S.wtex[idx(d.x, d.y)] = T_DOOR;   /* it is just a door now */
        SFX.door();
        say("THE " + name + " KEY FITS. IT DOES NOT COME BACK. THAT IS THE DEAL.");
      } else {
        SFX.locked();
        say("LOCKED. YOU NEED A " + KEYNAME[d.lock] + " KEY.", "#ff5555");
      }
      return;
    }
    /* secret walls: stand close, look at it, press E, act surprised */
    var fx = Math.floor(P.x + Math.cos(P.ang) * 0.9);
    var fy = Math.floor(P.y + Math.sin(P.ang) * 0.9);
    if (inside(fx, fy) && S.tile[idx(fx, fy)] === 2) {
      S.tile[idx(fx, fy)] = 0;
      S.secrets++;
      markSecret(S.li + ":" + idx(fx, fy));
      SFX.secret();
      say("A WALL JUST STOPPED BEING A WALL. THIS IS THE WHOLE GENRE.", "#66ddff");
      say("SECRET WALLS FOUND, EVER, IN THIS BROWSER: " + secretTotal() + " / 3.");
      return;
    }
    say("YOU USE THE WALL ON NOTHING. IT IS NOT EVEN SURPRISED.");
  }

  /* -------------------------------------------------------------------
     15. UPDATE
     ------------------------------------------------------------------- */
  function update(dt) {
    S.t += dt;
    /* the cheat console is a pause. you should not be eaten while typing. */
    if (S.mode !== "play" || S.cheatOpen) { S.shake *= 0.9; S.flash *= 0.82; return; }

    S.runTime += dt;
    S.flash *= Math.pow(0.0015, dt);
    S.shake *= Math.pow(0.02, dt);
    S.hitMark = Math.max(0, S.hitMark - dt);
    S.meleeLock = Math.max(0, (S.meleeLock || 0) - dt);
    if (P.painT) P.painT = Math.max(0, P.painT - dt);
    S.fade = Math.max(0, S.fade - dt * 1.4);

    /* --- player movement --- */
    var fwd = (keys["w"] || keys["arrowup"] ? 1 : 0) - (keys["s"] || keys["arrowdown"] ? 1 : 0);
    var str = (keys["d"] || keys["arrowright"] ? 1 : 0) - (keys["a"] || keys["arrowleft"] ? 1 : 0);
    P.sprint = !!(keys["shift"]);
    P.crouch = !!(keys["control"]);
    var spd = (P.sprint ? 4.9 : 3.35) * (P.crouch ? 0.55 : 1) * (P.hp < 25 ? 0.85 : 1);
    var ca = Math.cos(P.ang), sa = Math.sin(P.ang);
    var mvx = (ca * fwd - sa * str), mvy = (sa * fwd + ca * str);
    var ml = Math.sqrt(mvx * mvx + mvy * mvy);
    if (ml > 0.001) { mvx /= ml; mvy /= ml; }
    var acc = 22;
    P.vx += (mvx * spd - P.vx) * Math.min(1, acc * dt);
    P.vy += (mvy * spd - P.vy) * Math.min(1, acc * dt);
    var r = P.noclip ? 0.02 : 0.26;
    moveEnt(P, P.vx * dt, 0, r);
    moveEnt(P, 0, P.vy * dt, r);

    /* head bob + footsteps */
    var moving = ml > 0.01;
    P.bobAmp += ((moving ? 1 : 0) - P.bobAmp) * Math.min(1, 8 * dt);
    var prevBob = P.bob;
    P.bob += dt * (P.sprint ? 13 : 8.5) * P.bobAmp;
    if (Math.floor(prevBob / Math.PI) !== Math.floor(P.bob / Math.PI) && moving) SFX.step();
    if (P.kick > 0) P.kick = Math.max(0, P.kick - dt * 34);

    if (P.fireT > 0) P.fireT -= dt;
    if (mouseDown) { var w = WEAPONS[P.weapons[P.weap]]; if (w.auto) fire(); }

    /* --- doors --- */
    for (var i = 0; i < S.doors.length; i++) {
      var d = S.doors[i];
      d.open += (d.want - d.open) * Math.min(1, 4.2 * dt);
      if (d.open < 0.01 && d.open > -0.01) d.open = d.want ? 0.01 : 0;
    }

    /* --- items --- */
    for (var it = 0; it < S.items.length; it++) {
      var I = S.items[it];
      if (I.got) continue;
      I.t += dt;
      var d2 = Math.hypot(I.x - P.x, I.y - P.y);
      if (d2 < 0.55) {
        if (I.kind === "key" && P.keys[I.ki]) { I.got = true; say("YOU ALREADY HAVE THAT KEY. YOU DROP IT. NOBODY WILL EVER KNOW."); continue; }
        if (I.kind === "weapon" && P.weapons.indexOf(I.wi) >= 0) {
          P.ammo[WEAPONS[I.wi].ammo] += 25; I.got = true; SFX.pickup();
          say("ANOTHER " + WEAPONS[I.wi].name + " AMMO. THE WORLD IS ENDLESS."); continue;
        }
        if (I.kind === "hp" && P.hp >= 100) continue;
        if (I.kind === "armor" && P.ar >= 100) continue;
        pickup(I);
      }
    }

    /* --- mark cells as seen, for the automap --- */
    var steps = 26;
    for (var s = 0; s < steps; s++) {
      var a = P.ang - 0.7 + (s / steps) * 1.4;
      var dd = 0.4;
      while (dd < 9) {
        var gx = Math.floor(P.x + Math.cos(a) * dd), gy = Math.floor(P.y + Math.sin(a) * dd);
        if (inside(gx, gy)) {
          S.seen[idx(gx, gy)] = 1;
          if (blocksSight(gx, gy)) break;
        }
        dd += 0.25;
      }
    }

    /* --- flow field for the monsters --- */
    S.flowT -= dt;
    if (S.flowT <= 0) { buildFlow(); S.flowT = 0.18; }

    /* --- enemies --- */
    for (var e = 0; e < S.enemies.length; e++) {
      var en = S.enemies[e];
      en.flash = Math.max(0, en.flash - dt);
      if (en.dead) { en.deadT += dt; continue; }
      updateEnemy(en, dt);
    }
    /* remove corpses that have been lying about for too long */
    for (var d3 = S.enemies.length - 1; d3 >= 0; d3--) {
      if (S.enemies[d3].dead && S.enemies[d3].deadT > 22 && !S.enemies[d3].isBarrel) S.enemies.splice(d3, 1);
    }

    /* --- projectiles --- */
    for (var p2 = S.projs.length - 1; p2 >= 0; p2--) {
      var pr = S.projs[p2];
      pr.life -= dt;
      pr.x += pr.vx * dt; pr.y += pr.vy * dt;
      pr.spin += dt * 12;
      if (pr.kind === "toast") {
        pr.vx *= Math.pow(0.55, dt); pr.vy *= Math.pow(0.55, dt);
        if (rnd(0, 1) < dt * 22) {
          S.gibs.push({ x: pr.x, y: pr.y, vx: rnd(-.2, .2), vy: rnd(-.2, .2), z: 0.3, vz: rnd(.1, .6), life: 1.2, spr: SPR.gib, h: 0.1, b: 0.2, spin: 0, ang: 0, rest: 0 });
        }
      }
      var dead = pr.life <= 0 || isSolidCell(Math.floor(pr.x), Math.floor(pr.y));
      if (!dead && pr.from !== "you") {
        if (Math.hypot(pr.x - P.x, pr.y - P.y) < 0.35) {
          hurtPlayer(Math.round(pr.dmg), "A " + (pr.kind === "plasma" ? "PLASMA BALL" : "PIECE OF TOAST") + ".");
          dead = true;
        }
      }
      if (!dead && pr.from === "you") {
        var hh = rayHitEnemies(Math.atan2(pr.vy, pr.vx), 1.0, pr.x, pr.y);
        if (hh.e) {
          hurtEnemy(hh.e, pr.dmg, true, 0, 0);
          spawnGibs(hh.e.x, hh.e.y, 8, 1.2);
          SFX.flesh();
          dead = true;
        }
      }
      if (dead) { S.projs.splice(p2, 1); if (pr.kind === "toast") S.fx.push({ kind: "boom", x: pr.x, y: pr.y, life: 0.2, small: 1 }); }
    }

    /* --- gibs --- */
    for (var g = S.gibs.length - 1; g >= 0; g--) {
      var G = S.gibs[g];
      G.life -= dt;
      if (G.rest) continue;
      G.x += G.vx * dt; G.y += G.vy * dt;
      G.z += G.vz * dt; G.vz -= 7 * dt;
      if (G.z <= 0) {
        G.z = 0;
        if (Math.abs(G.vz) > 0.6) { G.vz = -G.vz * 0.34; SFX.step(); }
        else { G.vz = 0; G.rest = 1; G.b = G.h; }
        G.vx *= 0.6; G.vy *= 0.6;
      }
      if (G.life <= 0 || isSolidCell(Math.floor(G.x), Math.floor(G.y))) S.gibs.splice(g, 1);
    }
    if (S.gibs.length > 240) S.gibs.splice(0, S.gibs.length - 240);

    for (var fx = S.fx.length - 1; fx >= 0; fx--) {
      S.fx[fx].life -= dt;
      if (S.fx[fx].life <= 0) S.fx.splice(fx, 1);
    }

    /* --- the exit pad --- */
    if (S.exitIdx >= 0) {
      var ex = S.exitIdx % S.lw + 0.5, ey = ((S.exitIdx / S.lw) | 0) + 0.5;
      if (Math.hypot(ex - P.x, ey - P.y) < 0.6) {
        var alive = 0;
        for (var a2 = 0; a2 < S.enemies.length; a2++) if (!S.enemies[a2].dead && !S.enemies[a2].isBarrel) alive++;
        if (alive === 0) levelClear();
        else if (!S.padNag || S.t - S.padNag > 2) { S.padNag = S.t; say("THE PAD IS LOCKED. " + alive + " THING" + (alive === 1 ? "" : "S") + " STILL MOVING.", "#ffcc44"); }
      }
    }

    if (P.hp < 30 && !S.warned && P.hp > 0) { S.warned = true; say("YOU ARE HURT. THE HUD IS NOT BEING OPTIMISTIC. IT IS JUST RED.", "#ff5555"); }
    if (P.hp > 45) S.warned = false;

    /* the level can never be lost to arithmetic: if you are completely out
       of ammunition, the level quietly puts some on the floor next to you and
       says nothing about it. i have done this in a real game. it works. */
    var totalAmmo = 0, usable = false;
    for (var wi = 0; wi < P.weapons.length; wi++) {
      var wdef = WEAPONS[P.weapons[wi]];
      totalAmmo += P.ammo[wdef.ammo];
      if (wdef.proj || P.ammo[wdef.ammo] > 0) usable = true;
    }
    if (totalAmmo <= 0 && !usable) {
      S.noAmmoT = (S.noAmmoT || 0) + dt;
      if (S.noAmmoT > 2.5) {
        S.noAmmoT = 0;
        var ax = P.x + Math.cos(P.ang) * 0.7, ay = P.y + Math.sin(P.ang) * 0.7;
        if (!hitsWall(ax, ay, 0.2)) {
          S.items.push({ x: ax, y: ay, kind: "ammo", ai: 0, v: 24, spr: SPR.ammo, t: 0, got: false });
          say("A BOX OF BULLETS APPEARS ON THE FLOOR. NEITHER OF US WILL EVER MENTION IT.", "#66ddff");
        } else {
          P.ammo[0] += 12;
          say("12 BULLETS, OUT OF NOWHERE, INTO YOUR POCKETS. ALSO UNSPOKEN.");
        }
      }
    } else S.noAmmoT = 0;
  }

  function updateEnemy(e, dt) {
    var def = e.def;
    e.anim += dt * (e.state === "chase" ? 9 : 3);
    var ddx = P.x - e.x, ddy = P.y - e.y;
    var dist = Math.sqrt(ddx * ddx + ddy * ddy);
    var toA = Math.atan2(ddy, ddx);
    e.ang = angNorm(e.ang + angDiff(toA, e.ang) * Math.min(1, dt * (e.state === "chase" ? 7 : 2.2)));

    var sees = dist < 15 && lineOfSight(e.x, e.y, P.x, P.y) &&
               (dist < 5.5 || Math.abs(angDiff(toA, e.ang)) < 1.15);
    if (sees) e.seenT = S.t;
    e.alertT = Math.max(0, e.alertT - dt);

    if (e.state === "idle" && (sees || e.alertT > 0)) { e.state = "alert"; e.stateT = 0; }

    if (e.state === "idle") {
      /* wander a little, so the level is not a photograph */
      if (rnd(0, 1) < dt * 0.4) e.wander = rnd(0, 6.28);
      if (e.wander !== undefined) {
        e.ang = angNorm(e.ang + rnd(-1, 1) * dt * 1.2);
        var wx = e.x + Math.cos(e.ang) * e.spd * 0.4 * dt;
        var wy = e.y + Math.sin(e.ang) * e.spd * 0.4 * dt;
        if (!hitsWall(wx, wy, def.r)) { e.x = wx; e.y = wy; } else e.wander = undefined;
      }
      return;
    }
    if (e.state === "alert") {
      e.stateT += dt;
      if (e.stateT > 0.35) e.state = "chase";
      return;
    }

    /* chase */
    var dir = null;
    if (!e.isBarrel && def.speed > 0) {
      if (sees && Math.abs(angDiff(toA, e.ang)) < 0.8) dir = { x: ddx / dist, y: ddy / dist };
      else {
        dir = flowDir(e.x, e.y);
        if (dir) e.ang = Math.atan2(dir.y, dir.x);
      }
      if (dir) {
        var sp = e.spd * (1 + Math.min(0.4, dist * -0.01 + 0.1));
        /* keep a little distance from the player if it shoots */
        if (def.ranged && dist < 3.2 && sees) sp = -sp * 0.8;
        moveEnt(e, dir.x * sp * dt, dir.y * sp * dt, def.r);
      } else if (rnd(0, 1) < dt * 0.5) {
        /* no path. shuffle. something in the wall has gone wrong. */
        e.ang = angNorm(e.ang + rnd(-1.4, 1.4));
      }
    }

    /* attack */
    e.atkCd -= dt;
    if (e.atkCd <= 0 && sees && dist < 15) {
      if (def.ranged) {
        e.atkCd = def.cd * rnd(0.8, 1.25);
        var lead = dist / 14;
        var a = Math.atan2(P.y + P.vy * lead - e.y, P.x + P.vx * lead - e.x) + rnd(-0.09, 0.09);
        S.projs.push({
          x: e.x + Math.cos(a) * (def.r + 0.15), y: e.y + Math.sin(a) * (def.r + 0.15),
          vx: Math.cos(a) * 11, vy: Math.sin(a) * 11, life: 3, kind: "plasma",
          dmg: def.ranged * e.dmgMul, ang: a, spin: 0, from: "them"
        });
        SFX.growl();
      } else if (def.melee && dist < 1.05) {
        /* one thing is allowed to hit you at a time. this is the oldest
           trick in the genre and it is why you can actually fight back. */
        e.atkCd = def.cd;
        if (S.meleeLock <= 0) {
          S.meleeLock = 0.9;
          hurtPlayer(Math.round(def.melee * e.dmgMul), "A " + def.name + ".");
          if (e.type === "toaster") { SFX.ding(); spawnSpark(P.x, P.y, rnd(0, 6)); }
        }
      }
    }
    /* barrels notice you exist and then stop existing */
    if (e.isBarrel && sees && dist < 4.5 && rnd(0, 1) < dt * 1.5) e.atkCd = 0;
    if (e.isBarrel && e.atkCd <= 0 && dist < 5 && sees) explode(e);
  }

  function enemiesLeft() {
    var n = 0;
    for (var i = 0; i < S.enemies.length; i++) if (!S.enemies[i].dead && !S.enemies[i].isBarrel) n++;
    return n;
  }

  /* -------------------------------------------------------------------
     16. RENDER. this is the bit everyone came for.
     ------------------------------------------------------------------- */
  var zbuf = new Float32Array(VW);
  var pdirX = 0, pdirY = 1, planX = 1, planY = 0;

  function lightLevel(dist) {
    var f = 1 - dist / S.fogd;
    if (f < 0) f = 0;
    var flick = 0.055 * Math.sin(S.t * 11.3) + 0.035 * Math.sin(S.t * 27.7 + 1.3);
    var q = S.amb * 0.70 + f * 0.30 + flick + S.flash * 0.55;
    var l = (q * (SHADES - 1)) | 0;
    return l < 0 ? 0 : (l > SHADES - 1 ? SHADES - 1 : l);
  }

  function renderWorld() {
    var ca = Math.cos(P.ang), sa = Math.sin(P.ang);
    var pl = planeLen();
    pdirX = ca; pdirY = sa;
    planX = -sa * pl; planY = ca * pl;

    var shakeX = 0, shakeY = 0;
    if (S.shake > 0.05) {
      shakeX = rnd(-S.shake, S.shake) * 1.4;
      shakeY = rnd(-S.shake, S.shake) * 1.1;
    }
    var horizon = VH * 0.5 + P.bobAmp * 3.2 + P.kick * 1.6 + (P.yawDrift || 0) * 40 + shakeY;
    S.horizon = horizon;

    drawFloorCeil(horizon);
    drawWalls(horizon, shakeX);
    drawSprites();
  }

  /* the floor and the ceiling, cast one screen row at a time. for each row
     the distance is fixed, so we walk across the row sampling a texture.
     this is 100,000 pixels a frame and it is the reason it looks like a place
     instead of a diagram. */
  function drawFloorCeil(horizon) {
    var base = WTEX.length;
    var floorT = base + S.floorT, ceilT = base + S.ceilT, padT = base + 5;
    var maxD = S.fogd * 1.35;
    var y, p, rowD, fx, fy, stepX, stepY, row, x, lvl, tex, ti, tx, ty;

    for (y = Math.max(0, Math.ceil(horizon)); y < VH; y++) {
      p = y - horizon;
      if (p < 1) continue;
      rowD = (0.5 * VH) / p;
      if (rowD > maxD) rowD = maxD;
      fx = P.x + rowD * (pdirX - planX);
      fy = P.y + rowD * (pdirY - planY);
      stepX = rowD * (2 * planX) / VW;
      stepY = rowD * (2 * planY) / VW;
      row = y * VW;
      lvl = lightLevel(rowD);
      tex = shadeTex(floorT, lvl);
      for (x = 0; x < VW; x++) {
        tx = fx | 0; ty = fy | 0;
        ti = inside(tx, ty) && S.tile[idx(tx, ty)] === 3 ? padT : floorT;
        if (ti === padT) {
          buf[row + x] = shadeTex(padT, lvl)[((((fy * TEX) | 0) & TMASK) << 6) | (((fx * TEX) | 0) & TMASK)];
        } else {
          buf[row + x] = tex[((((fy * TEX) | 0) & TMASK) << 6) | (((fx * TEX) | 0) & TMASK)];
        }
        fx += stepX; fy += stepY;
      }
    }
    for (y = Math.min(VH - 1, Math.floor(horizon)); y >= 0; y--) {
      p = horizon - y;
      if (p < 1) continue;
      rowD = (0.5 * VH) / p;
      if (rowD > maxD) rowD = maxD;
      fx = P.x + rowD * (pdirX - planX);
      fy = P.y + rowD * (pdirY - planY);
      stepX = rowD * (2 * planX) / VW;
      stepY = rowD * (2 * planY) / VW;
      row = y * VW;
      lvl = lightLevel(rowD);
      tex = shadeTex(ceilT, lvl);
      for (x = 0; x < VW; x++) {
        buf[row + x] = tex[((((fy * TEX) | 0) & TMASK) << 6) | (((fx * TEX) | 0) & TMASK)];
        fx += stepX; fy += stepY;
      }
    }
  }

  function drawWalls(horizon, shakeX) {
    for (var x = 0; x < VW; x++) {
      var camX = 2 * x / VW - 1;
      var rdx = pdirX + planX * camX + shakeX * 0.004;
      var rdy = pdirY + planY * camX + shakeX * 0.004;

      /* --- DDA. the classic. march the grid until a wall is in the way. --- */
      var mapX = Math.floor(P.x), mapY = Math.floor(P.y);
      var ddx = rdx === 0 ? 1e30 : Math.abs(1 / rdx);
      var ddy = rdy === 0 ? 1e30 : Math.abs(1 / rdy);
      var stepX = rdx < 0 ? -1 : 1, stepY = rdy < 0 ? -1 : 1;
      var sdx = (rdx < 0 ? (P.x - mapX) : (1 - (P.x - mapX))) * ddx;
      var sdy = (rdy < 0 ? (P.y - mapY) : (1 - (P.y - mapY))) * ddy;
      var side = 0, hit = 0, guard = 0, cell = -1;
      while (guard++ < 256) {
        if (sdx < sdy) { sdx += ddx; mapX += stepX; side = 0; }
        else { sdy += ddy; mapY += stepY; side = 1; }
        if (mapX < 0 || mapY < 0 || mapX >= S.lw || mapY >= S.lh) { hit = 1; break; }
        cell = idx(mapX, mapY);
        var t = S.tile[cell];
        if (t === 1 || t === 2) { hit = 1; break; }
        if (t === 4) {
          var dr = S.doors[S.doorAt[cell]];
          if (!dr || dr.open < 0.82) { hit = 1; break; }
        }
      }
      /* the ray direction is dir + camX*plane, and plane is perpendicular to
         dir, so the DDA parameter IS the perpendicular distance. no trig. */
      var pd = ((side === 0) ? (sdx - ddx) : (sdy - ddy));
      if (pd < 0.02) pd = 0.02;
      zbuf[x] = pd;

      /* doors retract upward like a garage door, because it is 2004 */
      var bottom = 1;
      if (hit && cell >= 0 && S.tile[cell] === 4) {
        var d2 = S.doors[S.doorAt[cell]];
        if (d2) bottom = 1 - d2.open;
      }
      if (bottom <= 0.02) continue;

      var lineH = VH / pd;
      var drawS = horizon - lineH * 0.5;
      var drawE = horizon + lineH * (0.5 - (1 - bottom));

      var ti2 = (hit && cell >= 0) ? S.wtex[cell] : T_STONE;
      var lvl = lightLevel(pd) - (side === 1 ? 3 : 0);
      if (lvl < 0) lvl = 0; else if (lvl > SHADES - 1) lvl = SHADES - 1;
      var tex = shadeTex(ti2, lvl);

      /* which bit of the wall did we hit? */
      var wallX = (side === 0) ? (P.y + pd * rdy) : (P.x + pd * rdx);
      wallX -= Math.floor(wallX);
      var texX = (wallX * TEX) | 0;
      if ((side === 0 && rdy > 0) || (side === 1 && rdx < 0)) texX = TMASK - texX;
      texX &= TMASK;

      var stepT = TEX / lineH;
      var texPos = (drawS - horizon + lineH * 0.5) * stepT;
      if (texPos < 0) texPos += TEX;

      var ys = Math.max(0, drawS | 0), ye = Math.min(VH - 1, drawE | 0);
      for (var yy = ys; yy <= ye; yy++) {
        buf[yy * VW + x] = tex[(((texPos | 0) & TMASK) << 6) | texX];
        texPos += stepT;
      }
    }
  }

  /* one billboard. depth tested against the wall buffer, lit by the same
     fog the walls use, alpha blended by hand because we are in 2004. */
  function drawSprite(spr, wx, wy, hWorld, bWorld, bright, bob) {
    var dx = wx - P.x, dy = wy - P.y;
    var invDet = 1 / (planX * pdirY - pdirX * planY);
    var trX = invDet * (pdirY * dx - pdirX * dy);
    var trY = invDet * (-planY * dx + planX * dy);
    if (trY < 0.15) return;
    var sx = (VW / 2) * (1 + trX / trY);
    var hPix = hWorld * VH / trY;
    var wPix = hPix * (spr.w / spr.h);
    var yBot = S.horizon + (0.5 - bWorld) * VH / trY;
    if (bob) yBot -= bob * hPix;
    var x0 = Math.max(0, Math.ceil(sx - wPix / 2));
    var x1 = Math.min(VW - 1, Math.floor(sx + wPix / 2));
    var y0 = Math.max(0, Math.ceil(yBot - hPix));
    var y1 = Math.min(VH - 1, Math.floor(yBot));
    if (x1 < x0 || y1 < y0) return;
    var lvl = bright == null ? lightLevel(trY) : bright;
    if (lvl < 0) lvl = 0; else if (lvl > SHADES - 1) lvl = SHADES - 1;
    var m = lvl / (SHADES - 1), im = 1 - m;
    var px_ = spr.px, wTex = spr.w, hTex = spr.h;
    for (var x = x0; x <= x1; x++) {
      if (trY >= zbuf[x]) continue;
      var u = ((x - (sx - wPix / 2)) / wPix) * wTex;
      if (u < 0 || u >= wTex) continue;
      var uu = u | 0;
      var col = x * 0 + uu;
      for (var y = y0; y <= y1; y++) {
        /* row 0 of the sprite is the TOP of the sprite, and screen y grows
           downward, so the fraction from the top is 1 - the fraction from
           the bottom. get this backwards and every monster is upside down,
           which they were, for about an hour. */
        var v = (1 - (yBot - y) / hPix) * hTex;
        if (v < 0 || v >= hTex) continue;
        var p = px_[(v | 0) * wTex + col];
        var a = (p >>> 24) & 255;
        if (a === 0) continue;
        var di = y * VW + x;
        if (a === 255) {
          var r = ((p & 255) * m + fog[0] * im) | 0;
          var g = (((p >> 8) & 255) * m + fog[1] * im) | 0;
          var b = (((p >> 16) & 255) * m + fog[2] * im) | 0;
          buf[di] = 0xff000000 | (b << 16) | (g << 8) | r;
        } else {
          var d0 = buf[di], af = a / 255;
          var rr = (((p & 255) * m + fog[0] * im) * af + (d0 & 255) * (1 - af)) | 0;
          var gg = ((((p >> 8) & 255) * m + fog[1] * im) * af + ((d0 >> 8) & 255) * (1 - af)) | 0;
          var bb = ((((p >> 16) & 255) * m + fog[2] * im) * af + ((d0 >> 16) & 255) * (1 - af)) | 0;
          buf[di] = 0xff000000 | (bb << 16) | (gg << 8) | rr;
        }
      }
    }
  }

  function drawSprites() {
    var list = [], i, e, d;

    /* --- the population --- */
    for (i = 0; i < S.enemies.length; i++) {
      e = S.enemies[i];
      d = Math.sqrt((e.x - P.x) * (e.x - P.x) + (e.y - P.y) * (e.y - P.y));
      if (d > 26) continue;
      if (e.dead && !e.isBarrel && e.deadT > 1.6) continue;
      var spr = null;
      if (e.isBarrel) spr = SPR.barrel;
      else {
        var set = SPR[e.type] || SPR.grunt;
        var f = ((e.anim / 5) | 0) % set.length;
        var fl = SPR[e.type + "Flash"];
        spr = (e.flash > 0 && fl) ? fl[f] : set[f];
      }
      list.push({
        d: d, spr: spr, kind: "enemy", e: e, x: e.x, y: e.y,
        h: e.def.h, b: 0,
        bob: (e.def.speed > 0 && !e.dead) ? Math.abs(Math.sin(e.anim * 0.5)) * 0.04 : 0
      });
    }
    /* --- the things on the floor --- */
    for (i = 0; i < S.items.length; i++) {
      var I = S.items[i];
      if (I.got) continue;
      d = Math.sqrt((I.x - P.x) * (I.x - P.x) + (I.y - P.y) * (I.y - P.y));
      if (d > 20) continue;
      list.push({ d: d, spr: I.spr, kind: "item", x: I.x, y: I.y, h: 0.44, b: 0.02, bob: Math.sin(I.t * 2.2) * 0.03 });
    }
    /* --- the exit pad --- */
    if (S.exitIdx >= 0) {
      var ex = S.exitIdx % S.lw + 0.5, ey = ((S.exitIdx / S.lw) | 0) + 0.5;
      d = Math.sqrt((ex - P.x) * (ex - P.x) + (ey - P.y) * (ey - P.y));
      if (d < 22) list.push({ d: d, spr: SPR.exit, kind: "pad", x: ex, y: ey, h: 0.16, b: 0, bob: 0 });
    }
    /* --- things in the air --- */
    for (i = 0; i < S.projs.length; i++) {
      var pr = S.projs[i];
      d = Math.sqrt((pr.x - P.x) * (pr.x - P.x) + (pr.y - P.y) * (pr.y - P.y));
      if (d > 22) continue;
      list.push({
        d: d, spr: pr.kind === "toast" ? SPR.toastshot : SPR.plasma, kind: "proj",
        x: pr.x, y: pr.y, h: pr.kind === "toast" ? 0.34 : 0.30, b: 0.45, bob: 0,
        bright: Math.min(SHADES - 1, lightLevel(d) + 5)
      });
    }
    for (i = 0; i < S.gibs.length; i++) {
      var G = S.gibs[i];
      d = Math.sqrt((G.x - P.x) * (G.x - P.x) + (G.y - P.y) * (G.y - P.y));
      if (d > 15) continue;
      list.push({ d: d, spr: G.spr, kind: "gib", x: G.x, y: G.y, h: G.h, b: G.z, bob: 0 });
    }
    for (i = 0; i < S.fx.length; i++) {
      var FX = S.fx[i];
      if (FX.kind !== "boom") continue;
      d = Math.sqrt((FX.x - P.x) * (FX.x - P.x) + (FX.y - P.y) * (FX.y - P.y));
      if (d > 20) continue;
      list.push({
        d: d, spr: SPR.muzzle, kind: "boom", x: FX.x, y: FX.y,
        h: (FX.small ? 0.8 : 1.9) * (0.4 + FX.life * 2.4), b: 0.45, bob: 0, bright: SHADES - 1
      });
    }

    list.sort(function (a, b) { return b.d - a.d; });

    for (i = 0; i < list.length; i++) {
      var it = list[i];
      if (it.kind === "enemy") {
        var en = it.e;
        if (en.dead) {
          /* corpses squash into a puddle. it is the only animation that
             matters and it costs one multiply. */
          var squash = clamp(1 - en.deadT * 3.2, 0.1, 1);
          drawSprite(it.spr, en.x, en.y, Math.max(0.10, en.def.h * squash),
                     en.isBarrel ? 0 : (1 - squash) * en.def.h, null, 0);
          if (!en.isBarrel) drawSprite(SPR.blood, en.x, en.y, 0.05, 0, null, 0);
        } else {
          drawSprite(it.spr, en.x, en.y, en.def.h, 0, null, it.bob);
        }
      } else if (it.kind === "pad") {
        drawSprite(SPR.exit, it.x, it.y, 0.16, 0, enemiesLeft() === 0 ? SHADES - 1 : null, 0);
      } else {
        drawSprite(it.spr, it.x, it.y, it.h, it.b, it.bright, it.bob);
      }
    }
  }

  /* -------------------------------------------------------------------
     17. HUD / SCREENS
     ------------------------------------------------------------------- */
  function hudText() {
    var w = WEAPONS[P.weapons[P.weap]];
    var hp = P.hp, en = enemiesLeft();
    if (S.lie) { hp = Math.min(100, hp + 18); en = 0; }
    var set = function (id, v) { var e = document.getElementById(id); if (e && e.textContent !== v) e.textContent = v; };
    set("rc-hp", Math.ceil(hp));
    set("rc-ar", Math.ceil(P.ar));
    set("rc-ammo", P.ammo[w.ammo] + " / " + w.name);
    set("rc-key", (P.keys[0] ? "B" : "-") + (P.keys[1] ? "Y" : "-") + (P.keys[2] ? "R" : "-"));
    set("rc-depth", (S.li + 1) + "/" + (LEVELS.length + 1));
    set("rc-left", String(en));
    set("rc-kills", String(S.runKills));
    set("rc-score", String(S.runScore));
    set("rc-time", fmtTime(S.runTime));
    set("rc-par", fmtTime(LEVELS[S.li].par));
    set("rc-item", (S.itemsTotal - countLeft()) + "/" + S.itemsTotal);
    var hpEl = document.getElementById("rc-hpbar");
    if (hpEl) hpEl.style.width = clamp(hp, 0, 100) + "%";
    var arEl = document.getElementById("rc-arbar");
    if (arEl) arEl.style.width = clamp(P.ar, 0, 100) + "%";
  }
  function countLeft() {
    var n = 0;
    for (var i = 0; i < S.items.length; i++) if (!S.items[i].got) n++;
    return n;
  }
  function fmtTime(s) {
    var m = (s / 60) | 0, ss = (s % 60) | 0;
    return (m < 10 ? "0" : "") + m + ":" + (ss < 10 ? "0" : "") + ss;
  }

  /* -------------------------------------------------------------------
     18. OVERLAYS
     ------------------------------------------------------------------- */
  function overlayEl() { return document.getElementById("rc-overlay"); }
  function showOverlay(html, after) {
    var o = overlayEl();
    o.style.display = "flex";
    o.innerHTML = html;
    if (after) after(o);
    var b = o.querySelector("button");
    if (b) b.focus();
  }
  function hideOverlay() { var o = overlayEl(); o.style.display = "none"; o.innerHTML = ""; }

  var opts = { noLock: false };

  function setMode(m) {
    S.mode = m;
    var cv = document.getElementById("rc-cv");
    if (m === "play") {
      hideOverlay();
      if (!opts.noLock) requestLock(cv);
    } else {
      try { if (document.exitPointerLock) document.exitPointerLock(); } catch (e) {}
      keys = {}; mouseDown = false;
    }
    if (m === "title") showTitle();
    if (m === "brief") showBrief();
    if (m === "pause") showPause();
    if (m === "dead") showDead();
    if (m === "clear") showClear();
    if (m === "win") showWin();
  }

  function btn(id, label) { return '<button class="btn2000" id="' + id + '">' + label + "</button>"; }

  function showTitle() {
    var best = "";
    try { best = localStorage.getItem(SAVE_KEY) || ""; } catch (e) {}
    var nm = "";
    if (hasAllSecrets() && nightmareBuilt) {
      nm = '<div class="rcsmall" style="color:#66ddff">NIGHTMARE (7/7) UNLOCKED &mdash; you found every secret wall. it builds itself.</div>' +
           '<div class="rcbtns"><button class="btn2000" id="b-nm">&#9654; JUST THE NIGHTMARE (WHY NOT)</button></div>';
    }
    showOverlay(
      '<div class="rctitle">THE RAYCASTER</div>' +
      '<div class="rcsmall">A FIRST PERSON SHOOTER IN 1 FILE.<br>0 FRAMEWORKS. 0 LIBRARIES. 0 ASSETS.<br>' +
      'EVERY TEXTURE IS A RECTANGLE. EVERY MONSTER IS A SHAPE.<br>THE TOASTER IS REAL.</div>' +
      '<div class="rcbtns">' +
      btn("b-start", "&#9654; ENTER THE BUILDING") + " " +
      btn("b-help", "? HOW DO I PLAY") +
      "</div>" +
      nm +
      '<div class="rcsmall" style="margin-top:6px">BEST RUN: <span class="mono">' + (best || "NONE. YOU ARE FIRST. YOU ARE ALSO THE ONLY ONE.") + "</span></div>",
      function () {
        document.getElementById("b-start").addEventListener("click", function () { SFX.select(); startRun(); });
        document.getElementById("b-help").addEventListener("click", function () { SFX.menu(); showHelp(true); });
        var n = document.getElementById("b-nm");
        if (n) n.addEventListener("click", function () {
          SFX.select();
          loadLevel(LEVELS.length - 1, { fresh: true });
          setMode("brief");
        });
      }
    );
  }

  var HELP = [
    ["W A S D", "walk (strafe on A/D)"],
    ["MOUSE", "look. click to shoot. if the mouse is rude, hold the button and drag."],
    ["SHIFT", "run. CTRL crouches. neither is important."],
    ["1 - 5", "pick a weapon. you may not have it yet."],
    ["CLICK", "fire. hold it on the chaingun."],
    ["E", "open doors. the blue one needs the blue key. stand at a suspicious wall and press E again."],
    ["TAB / P", "the automap. it is the map. that is what maps are."],
    ["B", "lie mode. the numbers get encouraging. they were never true."],
    ["M", "THEME.3D. four notes. the same four."],
    ["F", "wider field of view. for the people who want to see the corners of the room."],
    ["F2", "the cheat console. there are five. IDDQD still works. it always works."],
    ["ESC", "pause, and the list of everything above, again."]
  ];

  function showHelp(fromTitle) {
    var rows = "";
    for (var i = 0; i < HELP.length; i++) {
      rows += '<div class="rchelp"><span class="mono rc-key">' + HELP[i][0] + "</span><span>" + HELP[i][1] + "</span></div>";
    }
    showOverlay(
      '<div class="rctitle">HOW TO PLAY</div>' +
      '<div class="rchelpwrap">' + rows + "</div>" +
      '<div class="rcbtns">' + btn("b-ok", fromTitle ? "&#9654; ENTER THE BUILDING" : "&#9654; BACK") + "</div>",
      function () {
        document.getElementById("b-ok").addEventListener("click", function () {
          SFX.menu();
          if (fromTitle) startRun(); else if (S.mode === "pause") showPause(); else setMode(S.mode);
        });
      }
    );
  }

  function showBrief() {
    var L = LEVELS[S.li];
    showOverlay(
      '<div class="rctitle">' + L.name + '</div>' +
      '<div class="rcsmall">' + L.sub + "</div>" +
      '<div class="rcsmall" style="color:#ffcc44;margin:6px 0">' + L.hint + "</div>" +
      '<div class="rcbtns">' + btn("b-go", "&#9654; GO") + "</div>" +
      '<div class="rcsmall">par time ' + fmtTime(L.par) + " · enemies " + countEnemiesOnMap() + " · items " + S.itemsTotal + "</div>",
      function () {
        document.getElementById("b-go").addEventListener("click", function () {
          SFX.select(); SFX.level();
          say("LEVEL " + L.sub + ": " + L.name, "#ffcc44");
          setMode("play");
        });
      }
    );
  }
  function countEnemiesOnMap() {
    var n = 0;
    for (var i = 0; i < S.enemies.length; i++) if (!S.enemies[i].isBarrel) n++;
    return n;
  }

  function showPause() {
    showOverlay(
      '<div class="rctitle">PAUSED</div>' +
      '<div class="rcsmall">' + LEVELS[S.li].name + " &middot; " + fmtTime(S.runTime) + " &middot; " + S.runKills + " KILLS &middot; " + S.runScore + " POINTS</div>" +
      '<div class="rcbtns">' +
      btn("b-res", "&#9654; RESUME") + " " +
      btn("b-help2", "? KEYS") + "<br><br>" +
      btn("b-restart", "&#8635; RESTART LEVEL") + " " +
      btn("b-quit", "&#9632; BACK TO TITLE") + "</div>",
      function () {
        document.getElementById("b-res").addEventListener("click", function () { SFX.menu(); resume(); });
        document.getElementById("b-help2").addEventListener("click", function () { SFX.menu(); showHelp(); });
        document.getElementById("b-restart").addEventListener("click", function () { SFX.select(); retryLevel(); });
        document.getElementById("b-quit").addEventListener("click", function () { SFX.menu(); setMode("title"); });
      }
    );
  }
  function resume() { setMode("play"); }

  function showDead() {
    var cause = S.deathCause || "SOMETHING";
    showOverlay(
      '<div class="rctitle" style="color:#ff4040">YOU DIED</div>' +
      '<div class="rcsmall">CAUSE: ' + cause + "<br>" + LEVELS[S.li].name + " &middot; " + S.runKills + " KILLS &middot; " + S.runScore + " POINTS &middot; " + fmtTime(S.runTime) + "</div>" +
      (P.god ? '<div class="rcsmall" style="color:#ffff66">YOU HAD GOD MODE ON. THE MONSTERS DID NOT. THEY WILL REMEMBER.</div>' : "") +
      '<div class="rcbtns">' + btn("b-retry", "&#9654; TRY THIS LEVEL AGAIN") + " " + btn("b-title", "&#9632; TITLE") + "</div>" +
      '<div class="rcsmall">the level does not reset. it is still there. it will be there when you get back.</div>',
      function () {
        document.getElementById("b-retry").addEventListener("click", function () { SFX.select(); retryLevel(); });
        document.getElementById("b-title").addEventListener("click", function () { SFX.menu(); setMode("title"); });
      }
    );
  }

  function showClear() {
    var L = LEVELS[S.li];
    var under = S.runTime <= L.par;
    var nextIsNightmare = (S.li === LEVELS.length - 1) && secretTotal() >= 3 && !nightmareBuilt;
    var last = S.li >= LEVELS.length - 1 && !nextIsNightmare;
    var nextName = last ? "" :
      (nextIsNightmare ? "NIGHTMARE (it writes itself while you watch)" : LEVELS[S.li + 1].name);
    showOverlay(
      '<div class="rctitle" style="color:#66ff88">LEVEL CLEAR</div>' +
      '<div class="rcsmall">' + L.name + " in " + fmtTime(S.runTime) + (under ? " &mdash; UNDER PAR" : " &mdash; OVER PAR BY " + fmtTime(S.runTime - L.par)) + "<br>" +
      "kills " + S.runKills + " &middot; score " + S.runScore + " &middot; items " + (S.itemsTotal - countLeft()) + "/" + S.itemsTotal +
      "<br>secret walls in this browser: " + secretTotal() + "/3</div>" +
      (last ? "" : '<div class="rcsmall" style="color:#ffcc44">NEXT: ' + nextName + "</div>") +
      '<div class="rcbtns">' + btn("b-next", last ? "&#9654; FINISH IT" : "&#9654; NEXT LEVEL") + " " +
      btn("b-t2", "&#9632; TITLE") + "</div>",
      function () {
        document.getElementById("b-next").addEventListener("click", function () { SFX.select(); nextLevel(); });
        document.getElementById("b-t2").addEventListener("click", function () { SFX.menu(); setMode("title"); });
      }
    );
  }

  function showWin() {
    var best = "";
    try { best = localStorage.getItem(SAVE_KEY) || ""; } catch (e) {}
    showOverlay(
      '<div class="rctitle" style="color:#ffd94a">THE END OF THE INTERNET</div>' +
      '<div class="rcsmall">' +
      "you killed " + S.runKills + " things. you collected " + (S.itemsTotal - countLeft()) + " items on this floor and you found " + S.secrets + " secret walls.<br>" +
      "total time " + fmtTime(S.runTime) + " · score " + S.runScore + "<br>" +
      "the door is behind you. it is just a rectangle with a texture on it now. it was always just that.<br><br>" +
      "best run: " + (best || "none") +
      "</div>" +
      '<div class="rcbtns">' + btn("b-again", "&#9654; GO BACK IN") + " " + btn("b-t3", "&#9632; TITLE") + "</div>" +
      '<div class="rcsmall" style="margin-top:8px">thank you for playing a thing i typed. go outside. it is 2004 outside.</div>',
      function () {
        document.getElementById("b-again").addEventListener("click", function () { SFX.select(); startRun(); });
        document.getElementById("b-t3").addEventListener("click", function () { SFX.menu(); setMode("title"); });
        if (FS.unlock) FS.unlock("raycaster", {
          rain: "TOASTER",
          say: "<b>the 3d one.</b> i said i wasn't ready to show you. i wasn't. " +
               "you finished it anyway, which is the whole review of this website in one sentence."
        });
        if (FS.rain) FS.rain("TOASTER");
      }
    );
  }

  /* -------------------------------------------------------------------
     19. FLOW: start, clear, next, retry, records
     ------------------------------------------------------------------- */
  var nightmareBuilt = false;
  function startRun() {
    loadLevel(0, { fresh: true });
    setMode("brief");
  }
  function retryLevel() {
    P.dead = false;
    loadLevel(S.li, {});
    setMode("brief");
  }
  function levelClear() {
    if (S.mode !== "play") return;
    SFX.win();
    var L = LEVELS[S.li];
    saveBest();
    say("LEVEL CLEAR. " + L.name + " IN " + fmtTime(S.runTime) +
        (S.runTime <= L.par ? ", UNDER PAR." : ", OVER PAR. THE MONSTERS ARE SMUG."), "#66ff88");
    setMode("clear");
  }
  function nextLevel() {
    var next = S.li + 1;
    if (next >= LEVELS.length) {
      /* if you found every secret wall there is a seventh level, and the
         seventh level has to write itself, so it does */
      if (secretTotal() >= 3 && !nightmareBuilt) {
        LEVELS[LEVELS.length] = nightmareLevel();
        nightmareBuilt = true;
        next = LEVELS.length - 1;
      } else { setMode("win"); return; }
    }
    loadLevel(next, {});
    setMode("brief");
  }

  /* the secret walls are remembered properly: by which wall, not how many
     times you opened one. if you reload mid-level you still get credit. */
  function secretList() {
    try { return JSON.parse(localStorage.getItem("funnysite.secrets") || "[]") || []; } catch (e) { return []; }
  }
  function markSecret(id) {
    try {
      var a = secretList();
      if (a.indexOf(id) < 0) { a.push(id); localStorage.setItem("funnysite.secrets", JSON.stringify(a)); }
    } catch (e) {}
  }
  function secretTotal() { return secretList().length; }
  function hasAllSecrets() { return secretTotal() >= 3; }

  function saveBest() {
    try {
      var prev = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      var cur = { depth: S.li + 1, kills: S.runKills, score: S.runScore, time: Math.round(S.runTime) };
      if (!prev || cur.depth > prev.depth || (cur.depth === prev.depth && cur.score > prev.score)) {
        localStorage.setItem(SAVE_KEY, JSON.stringify(cur));
      }
    } catch (e) {}
    try { if (S.li + 1 >= 1) localStorage.setItem("funnysite.raycaster", "L" + (S.li + 1) + " / " + S.runKills + " kills"); } catch (e) {}
  }

  /* -------------------------------------------------------------------
     20. MINIMAP + AUTOMAP
     ------------------------------------------------------------------- */
  var mmCv, mmCtx, amCv, amCtx;
  function drawMap(canvas, size, full) {
    var g = canvas.getContext("2d");
    var pad = full ? 4 : 2;
    var sc = (size - pad * 2) / Math.max(S.lw, S.lh);
    g.fillStyle = "#000";
    g.fillRect(0, 0, size, size);
    function wx(x) { return pad + x * sc; }
    function wy(y) { return pad + y * sc; }
    for (var y = 0; y < S.lh; y++) {
      for (var x = 0; x < S.lw; x++) {
        var i = idx(x, y);
        if (!S.seen[i] && full) continue;
        var t = S.tile[i];
        if (t === 0 || t === 3) {
          if (full) { g.fillStyle = (t === 3) ? "#7a5a10" : "#12181c"; g.fillRect(wx(x), wy(y), sc, sc); }
          continue;
        }
        if (t === 4) {
          var d = S.doors[S.doorAt[i]];
          g.fillStyle = d && d.open > 0.5 ? "#2c7a3a" : (d && d.lock === 1 ? "#2a5aa0" : d && d.lock === 2 ? "#a08a20" : d && d.lock === 3 ? "#a03028" : "#7a5a28");
          g.fillRect(wx(x), wy(y), Math.max(1, sc), Math.max(1, sc));
          continue;
        }
        g.fillStyle = (t === 2) ? "#2a3038" : "#5a6a7a";
        g.fillRect(wx(x), wy(y), Math.max(1, sc), Math.max(1, sc));
      }
    }
    if (!full) {
      /* items + enemies within range */
      for (var k = 0; k < S.items.length; k++) {
        var I = S.items[k];
        if (I.got) continue;
        if (Math.hypot(I.x - P.x, I.y - P.y) > 8) continue;
        g.fillStyle = "#66ff88";
        g.fillRect(wx(I.x) - 1, wy(I.y) - 1, 2, 2);
      }
    }
    for (var e = 0; e < S.enemies.length; e++) {
      var en = S.enemies[e];
      if (en.dead) continue;
      if (!full && S.t - en.seenT > 1.6) continue;
      g.fillStyle = "#ff4040";
      var sz = full ? 2 : 1.5;
      g.fillRect(wx(en.x) - sz / 2, wy(en.y) - sz / 2, sz, sz);
    }
    if (S.exitIdx >= 0) {
      var ex = S.exitIdx % S.lw + 0.5, ey = ((S.exitIdx / S.lw) | 0) + 0.5;
      g.fillStyle = enemiesLeft() === 0 ? "#00ff66" : "#ffaa00";
      g.fillRect(wx(ex) - 2, wy(ey) - 2, 4, 4);
    }
    /* the player */
    var px = wx(P.x), py = wy(P.y);
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.moveTo(px + Math.cos(P.ang) * 5, py + Math.sin(P.ang) * 5);
    g.lineTo(px + Math.cos(P.ang + 2.5) * 4, py + Math.sin(P.ang + 2.5) * 4);
    g.lineTo(px + Math.cos(P.ang - 2.5) * 4, py + Math.sin(P.ang - 2.5) * 4);
    g.closePath(); g.fill();
  }

  /* -------------------------------------------------------------------
     21. THE FRAME
     ------------------------------------------------------------------- */
  function frame(ts) {
    requestAnimationFrame(frame);
    if (!S.last) S.last = ts;
    var dt = Math.min(0.05, (ts - S.last) / 1000);
    S.last = ts;
    S.frame++;

    update(dt);
    renderWorld();
    fctx.putImageData(img, 0, 0);
    var c = document.getElementById("rc-cv");
    if (c) c.getContext("2d").drawImage(frameCv, 0, 0);

    paintOverlays();
    if (amCv) {
      var wantMap = !!S.mapOpen && S.mode === "play";
      if (wantMap) drawMap(amCv, amCv.width, true);
      amCv.style.display = wantMap ? "block" : "none";
    }
    if (mmCv) drawMap(mmCv, mmCv.width, false);
    hudText();
    if (S.msg.length) {
      for (var i = S.msg.length - 1; i >= 0; i--) {
        S.msg[i].life -= dt;
        if (S.msg[i].life <= 0) S.msg.splice(i, 1);
      }
      paintLog();
    }
  }

  /* everything drawn on top of the low-res buffer, in crisp vector, because
     the gun deserves better than a 4-bit sprite */
  var fx0 = null;
  function paintOverlays() {
    var c = document.getElementById("rc-cv");
    if (!c) return;
    var g = c.getContext("2d");
    var VWp = VW, VHp = VH;

    if (S.mode === "title" || S.mode === "brief" || S.mode === "pause" ||
        S.mode === "dead" || S.mode === "clear" || S.mode === "win" || S.cheatOpen) return;

    /* crosshair */
    if (S.mode === "play") {
      g.strokeStyle = S.hitMark > 0 ? "#ff5555" : "rgba(120,255,140,0.8)";
      g.lineWidth = 1;
      var cx = VWp / 2, cy = VHp / 2 + P.bobAmp * 3.2 + P.kick * 1.6;
      g.beginPath();
      g.moveTo(cx - 7, cy); g.lineTo(cx - 3, cy);
      g.moveTo(cx + 3, cy); g.lineTo(cx + 7, cy);
      g.moveTo(cx, cy - 7); g.lineTo(cx, cy - 3);
      g.moveTo(cx, cy + 3); g.lineTo(cx, cy + 7);
      g.stroke();
      if (S.hitMark > 0) {
        g.strokeStyle = "#ff3333"; g.lineWidth = 2;
        g.beginPath();
        g.moveTo(cx - 5, cy - 5); g.lineTo(cx - 2, cy - 2);
        g.moveTo(cx + 5, cy - 5); g.lineTo(cx + 2, cy - 2);
        g.moveTo(cx - 5, cy + 5); g.lineTo(cx - 2, cy + 2);
        g.moveTo(cx + 5, cy + 5); g.lineTo(cx + 2, cy + 2);
        g.stroke();
      }
    }

    /* the weapon */
    if (S.mode === "play" && !P.dead) {
      var wi = P.weapons[P.weap];
      var spr = [SPR.hand0, SPR.hand1, SPR.hand2, SPR.hand3][wi] || SPR.hand0;
      var bobX = Math.sin(P.bob) * 6 * P.bobAmp;
      var bobY = Math.abs(Math.cos(P.bob)) * 4 * P.bobAmp;
      var k = P.kick / 26;
      var scale = (wi === 1 ? 0.92 : wi === 2 ? 0.98 : 1.0) * 1.35;
      var w = spr.w * scale * (1 + k * 0.12);
      var h = spr.h * scale * (1 - k * 0.05);
      var dx = VWp * 0.5 - w * 0.36 + bobX;
      var dy = VHp - h * 0.92 + bobY + k * 34;
      g.save();
      g.translate(dx + w / 2, dy + h / 2);
      g.rotate((P.weap === 3 ? 1 : -1) * 0.04 + bobX * 0.002);
      g.globalAlpha = 0.97;
      g.drawImage(spr.cv, -w / 2, -h / 2, w, h);
      g.restore();
      if (S.flash > 0.25) {
        var ms = 30 + S.flash * 60;
        g.globalAlpha = Math.min(1, S.flash);
        g.drawImage(SPR.muzzle.cv, dx + w * 0.30 - ms / 2, dy + h * 0.06 - ms / 2, ms, ms);
        g.globalAlpha = 1;
      }
      /* reload-ish dip when out of ammo */
      var wpn = WEAPONS[wi];
      if (P.ammo[wpn.ammo] === 0) {
        g.fillStyle = "rgba(255,80,80,0.85)";
        g.font = "7px 'Courier New',monospace";
        g.textAlign = "center";
        g.fillText("NO " + AMMO_NAMES[wpn.ammo].toUpperCase(), VWp / 2, VHp - 26);
        g.textAlign = "left";
      }
    }

    /* damage + low health */
    if (P.painT > 0 || (P.hp < 30 && !S.lie)) {
      var pulse = P.painT > 0 ? P.painT / 0.35 : (0.25 + 0.25 * Math.sin(S.t * 6));
      g.fillStyle = "rgba(150,10,10," + (pulse * 0.34).toFixed(3) + ")";
      g.fillRect(0, 0, VWp, VHp);
    }
    /* full-screen vignette, because a lit rectangle in a dark room is a cheat */
    if (!fx0) fx0 = makeVignette(VWp, VHp);
    g.drawImage(fx0, 0, 0);

    /* the fade in at the start of a level */
    if (S.fade > 0) { g.fillStyle = "rgba(0,0,0," + S.fade.toFixed(3) + ")"; g.fillRect(0, 0, VWp, VHp); }

    /* muzzle flash lights the whole room slightly */
    if (S.flash > 0.05) {
      g.fillStyle = "rgba(255,230,170," + (S.flash * 0.10).toFixed(3) + ")";
      g.fillRect(0, 0, VWp, VHp);
    }

    /* scanlines. 2004. they were everywhere. i miss them. */
    if (S.mode === "play") {
      g.fillStyle = "rgba(0,0,0,0.10)";
      for (var y = 0; y < VHp; y += 3) g.fillRect(0, y, VWp, 1);
    }

    /* lie mode badge */
    if (S.lie && S.mode === "play") {
      g.fillStyle = "rgba(255,80,255,0.9)";
      g.font = "7px 'Courier New',monospace";
      g.fillText("LIE MODE: EVERYTHING IS FINE", 4, 10);
    }
  }

  function makeVignette(w, h) {
    var c = newCanvas(w, h), g = c.getContext("2d");
    var grd = g.createRadialGradient(w / 2, h / 2, h * 0.28, w / 2, h / 2, h * 0.95);
    grd.addColorStop(0, "rgba(0,0,0,0)");
    grd.addColorStop(1, "rgba(0,0,0,0.55)");
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    return c;
  }

  /* -------------------------------------------------------------------
     22. BOOT
     ------------------------------------------------------------------- */
  function boot() {
    if (!document.getElementById("rc-cv")) return;
    buildTextures();
    buildSprites();
    S.last = 0;
    mmCv = document.getElementById("rc-mm");
    amCv = document.getElementById("rc-map");
    loadLevel(0, { fresh: true });   /* so the maps have something to draw */
    /* the seventh level exists the moment you have earned it */
    if (hasAllSecrets() && !nightmareBuilt) {
      LEVELS[LEVELS.length] = nightmareLevel();
      nightmareBuilt = true;
    }
    var cv = document.getElementById("rc-cv");
    initInput(cv);
    setMode("title");
    /* pointer lock, politely, with a fallback if the browser says no */
    cv.addEventListener("click", function () {
      if (S.mode === "play" && !mouseLocked) {
        try { if (cv.requestPointerLock) cv.requestPointerLock(); } catch (e) {}
      }
    });
    requestAnimationFrame(frame);
  }

  /* a public-ish surface, because i like a small surface */
  window.RAYCASTER = {
    boot: boot,
    /* the console gets a back door. this is a website with 31 secrets in it;
       one back door in a 3d game is not going to ruin the whole thing. */
    dev: {
      state: S, player: P, weapons: WEAPONS,
      tp: function (x, y) { P.x = x; P.y = y; P.vx = P.vy = 0; },
      clear: function () { killAll(); },
      level: function (i) { loadLevel(i, {}); setMode("brief"); }
    },
    unlock: function () { if (FS.unlock) FS.unlock("raycaster", { say: "you called the game from the console. that is not an egg. it is just you." }); },
    level: LEVELS,
    version: "1.0 (it has been 1.0 since i typed it)"
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
