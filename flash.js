/* =====================================================================
   THE FLASH ERA  --  flash.js

   twelve games, one file, zero libraries, zero .swf files.

   every game here is a small machine: init(), update(dt), draw(ctx), and
   whatever inputs it wants. the shell underneath them does the loop, the
   score, the high score, the pause, the scanlines and the beep.

   i did not download any of these. i typed them, in the spirit of the
   things they are reminded of, which is the most this website does.
   ===================================================================== */
(function () {
  "use strict";

  var FS = window.FS || {};

  /* -------------------------------------------------------------------
     0. SOUND. four oscillators and a noise buffer. that is the whole
        sound department. the whole site has one midi file.
     ------------------------------------------------------------------- */
  var AC = null, MASTER = null, MUTED = false, NOISE = null;

  function actx() {
    if (!AC) {
      try {
        AC = new (window.AudioContext || window.webkitAudioContext)();
        MASTER = AC.createGain(); MASTER.gain.value = 0.35; MASTER.connect(AC.destination);
        NOISE = AC.createBuffer(1, AC.sampleRate * 0.6, AC.sampleRate);
        var d = NOISE.getChannelData(0);
        for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      } catch (e) { AC = null; }
    }
    if (AC && AC.state === "suspended") { try { AC.resume(); } catch (e) {} }
    return AC;
  }
  function tone(f, dur, type, vol, slide) {
    var c = actx(); if (!c || MUTED) return;
    var t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = type || "square";
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol == null ? 0.07 : vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(MASTER); o.start(t); o.stop(t + dur + 0.02);
  }
  function hiss(dur, vol, cut, sweep) {
    var c = actx(); if (!c || MUTED) return;
    var t = c.currentTime, s = c.createBufferSource(); s.buffer = NOISE;
    var f = c.createBiquadFilter(); f.type = "lowpass";
    f.frequency.setValueAtTime(cut || 2400, t);
    if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(90, sweep), t + dur);
    var g = c.createGain();
    g.gain.setValueAtTime(vol == null ? 0.1 : vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(MASTER); s.start(t); s.stop(t + dur + 0.02);
  }
  var SFX = {
    blip: function () { tone(760, 0.04, "square", 0.05); },
    jump: function () { tone(330, 0.12, "square", 0.06, 780); },
    coin: function () { tone(988, 0.05, "square", 0.06); tone(1319, 0.10, "square", 0.05, 0, 0.05); },
    hit:  function () { tone(180, 0.09, "square", 0.07, 90); },
    die:  function () { tone(300, 0.4, "sawtooth", 0.08, 60); },
    win:  function () { [523, 659, 784, 1046].forEach(function (f, i) { tone(f, 0.18, "square", 0.06, 0, i * 0.1); }); },
    shoot:function () { tone(420, 0.05, "square", 0.05, 160); hiss(0.04, 0.05, 3000, 800); },
    tick: function () { tone(1200, 0.02, "square", 0.03); },
    whoosh:function () { hiss(0.18, 0.07, 900, 3000); },
    thud: function () { tone(90, 0.14, "sine", 0.09, 45); },
    pop:  function () { hiss(0.06, 0.06, 1600, 400); }
  };

  /* -------------------------------------------------------------------
     1. SMALL MATH + DRAWING HELPERS
     ------------------------------------------------------------------- */
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function irnd(n) { return (Math.random() * n) | 0; }
  function pick(a) { return a[(Math.random() * a.length) | 0]; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function approach(v, target, step) { return v < target ? Math.min(v + step, target) : Math.max(v - step, target); }
  function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }
  function circleRect(cx, cy, r, rx, ry, rw, rh) {
    var nx = clamp(cx, rx, rx + rw), ny = clamp(cy, ry, ry + rh);
    var dx = cx - nx, dy = cy - ny;
    return dx * dx + dy * dy <= r * r;
  }
  function txt(c, s, x, y, size, col, align, font) {
    c.fillStyle = col || "#fff";
    c.font = (size || 10) + "px " + (font || '"Courier New",monospace');
    c.textAlign = align || "left";
    c.fillText(s, x, y);
    c.textAlign = "left";
  }
  function rct(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }
  function box(c, x, y, w, h, col) {
    c.strokeStyle = col; c.lineWidth = 1;
    c.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w) - 1, Math.round(h) - 1);
  }
  function circ(c, x, y, r, col) { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.fill(); }
  /* distance from a point to a segment, and the closest point on it */
  function segPoint(ax, ay, bx, by, px, py) {
    var dx = bx - ax, dy = by - ay;
    var l2 = dx * dx + dy * dy || 1e-6;
    var t = clamp(((px - ax) * dx + (py - ay) * dy) / l2, 0, 1);
    var cx = ax + dx * t, cy = ay + dy * t;
    return { d: Math.hypot(px - cx, py - cy), x: cx, y: cy, t: t };
  }

  /* ===================================================================
     2. THE TWELVE
     =================================================================== */

  /* -------------------------------------------------------------------
     2.1  FALLING SAND  (2005-ish: nobody made this one, everybody copied it)
     ------------------------------------------------------------------- */
  var MAT = { EMPTY: 0, SAND: 1, WATER: 2, OIL: 3, WOOD: 4, FIRE: 5, LAVA: 6, STONE: 7, STEAM: 8 };

  var gSand = {
    id: "sand", name: "FALLING SAND", year: "2005", w: 480, h: 300,
    desc: "paint sand, water, fire. it is 8 kinds of pixel and it is enough for an hour.",
    init: function (g) {
      g.cell = 4;
      g.gw = Math.floor(g.w / g.cell); g.gh = Math.floor(g.h / g.cell);
      g.m = new Uint8Array(g.gw * g.gh);
      g.brush = MAT.SAND; g.paint = 1;
      g.acc = 0; g.fps = 0;
      /* a starter landscape: ground, a puddle, a little fire */
      for (var x = 0; x < g.gw; x++) {
        var hgt = g.gh - 6 - Math.round(Math.sin(x * 0.21) * 3 + Math.sin(x * 0.07) * 4);
        for (var y = hgt; y < g.gh; y++) g.m[y * g.gw + x] = MAT.STONE;
        for (var y2 = hgt - 2; y2 < hgt; y2++) g.m[y2 * g.gw + x] = MAT.SAND;
      }
      for (var i = 0; i < 3; i++) {
        var cx = 20 + irnd(g.gw - 40), cy = 30 + irnd(40);
        for (var dy = -6; dy <= 6; dy++) for (var dx = -8; dx <= 8; dx++) {
          if (dx * dx / 64 + dy * dy / 36 < 1) g.m[(cy + dy) * g.gw + cx + dx] = i === 1 ? MAT.WATER : MAT.SAND;
        }
      }
    },
    set: function (g, x, y, m) {
      x = clamp(Math.floor(x / g.cell), 0, g.gw - 1);
      y = clamp(Math.floor(y / g.cell), 0, g.gh - 1);
      for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
        var nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= g.gw || ny >= g.gh) continue;
        if (dx || dy) {
          var v = g.m[ny * g.gw + nx];
          if (v !== MAT.EMPTY && v !== MAT.WATER && v !== MAT.OIL && v !== MAT.FIRE && v !== MAT.STEAM) return;
        }
        g.m[ny * g.gw + nx] = m;
      }
    },
    brushAt: function (g, x, y, down) {
      if (!down) return;
      g.set(g, x, y, g.brush);
    },
    tap: function (g, x, y) {
      var order = [MAT.SAND, MAT.WATER, MAT.OIL, MAT.WOOD, MAT.FIRE, MAT.LAVA, MAT.STONE, MAT.EMPTY];
      var i = order.indexOf(g.brush);
      g.brush = order[(i + 1) % order.length];
    },
    update: function (g, dt) {
      g.acc += dt;
      if (g.acc < 1 / 45) return;
      var step = Math.min(3, Math.floor(g.acc * 45)); g.acc = 0;
      var gw = g.gw, gh = g.gh, m = g.m, x, y, i, v, below, side, tt;
      for (var s = 0; s < step; s++) {
        for (y = 0; y < gh; y++) {
          var up = (y & 1) === 1;                 /* alternate direction = less bias */
          for (var xi = 0; xi < gw; xi++) {
            x = up ? gw - 1 - xi : xi;
            i = y * gw + x; v = m[i];
            if (v === MAT.EMPTY || v === MAT.WOOD || v === MAT.STONE) continue;
            below = (y < gh - 1) ? m[(y + 1) * gw + x] : MAT.STONE;

            if (v === MAT.FIRE) {
              m[i] = Math.random() < 0.22 ? MAT.EMPTY : MAT.FIRE;
              /* fire eats oil and wood, dies in water, makes steam */
              for (var d = 0; d < 5; d++) {
                var ax = x + (d === 1 ? 1 : d === 2 ? -1 : 0), ay = y + (d === 3 ? 1 : d === 4 ? -1 : 0);
                if (ax < 0 || ay < 0 || ax >= gw || ay >= gh) continue;
                var j = ay * gw + ax, n = m[j];
                if (n === MAT.OIL || (n === MAT.WOOD && Math.random() < 0.02)) m[j] = MAT.FIRE;
                if (n === MAT.WATER && Math.random() < 0.06) m[j] = MAT.STEAM;
              }
              continue;
            }
            if (v === MAT.STEAM) { m[i] = Math.random() < 0.03 ? MAT.WATER : MAT.EMPTY; continue; }

            if (v === MAT.SAND || v === MAT.LAVA) {
              if (below === MAT.EMPTY || below === MAT.WATER || below === MAT.OIL ||
                  ((v === MAT.LAVA) && (below === MAT.SAND))) {
                if (below === MAT.WATER && v === MAT.LAVA) { m[i] = MAT.STONE; m[(y + 1) * gw + x] = MAT.STEAM; continue; }
                m[i] = below; m[(y + 1) * gw + x] = v; continue;
              }
              var dir = Math.random() < 0.5 ? -1 : 1;
              for (var t = 0; t < 2; t++) {
                var dd = t === 0 ? dir : -dir;
                var nx = x + dd;
                if (nx < 0 || nx >= gw || y + 1 >= gh) continue;
                var nv = m[(y + 1) * gw + nx];
                if (nv === MAT.EMPTY || nv === MAT.WATER || nv === MAT.OIL) {
                  m[i] = nv; m[(y + 1) * gw + nx] = v; break;
                }
              }
              if (v === MAT.LAVA && Math.random() < 0.02) {
                for (var b = 0; b < 4; b++) {
                  var bx = x + (b & 1 ? 1 : -1), by = y + (b & 2 ? 1 : -1);
                  if (bx < 0 || by < 0 || bx >= gw || by >= gh) continue;
                  var bj = by * gw + bx;
                  if (m[bj] === MAT.WOOD || m[bj] === MAT.OIL) m[bj] = MAT.FIRE;
                }
              }
              continue;
            }

            /* liquids: fall, then spread */
            if (v === MAT.WATER || v === MAT.OIL) {
              if (below === MAT.EMPTY) { m[i] = MAT.EMPTY; m[(y + 1) * gw + x] = v; continue; }
              if (v === MAT.LAVA && below !== MAT.STONE) continue;
              side = Math.random() < 0.5 ? -1 : 1;
              var moved = false;
              for (var q = 0; q < 2; q++) {
                var sd = q === 0 ? side : -side;
                var lx = x + sd;
                if (lx < 0 || lx >= gw) continue;
                var same = (y + 1 < gh) ? m[(y + 1) * gw + lx] : MAT.STONE;
                var here = m[y * gw + lx];
                if (same === MAT.EMPTY && (here === MAT.EMPTY || here === v || (v === MAT.OIL && here === MAT.WATER))) {
                  m[(y + 1) * gw + lx] = v; m[i] = MAT.EMPTY; moved = true; break;
                }
                if (here === MAT.EMPTY) { m[y * gw + lx] = v; m[i] = MAT.EMPTY; moved = true; break; }
              }
              if (!moved && Math.random() < 0.06) { /* nothing. liquids are patient. */ }
              if (v === MAT.WATER) {
                for (var f = 0; f < 5; f++) {
                  var fx = x + (f === 1 ? 1 : f === 2 ? -1 : 0), fy = y + (f === 3 ? 1 : f === 4 ? -1 : 0);
                  if (fx < 0 || fy < 0 || fx >= gw || fy >= gh) continue;
                  var fj = fy * gw + fx, fn = m[fj];
                  if (fn === MAT.FIRE && Math.random() < 0.25) { m[fj] = MAT.STEAM; m[i] = Math.random() < 0.5 ? MAT.STEAM : MAT.EMPTY; }
                  if (fn === MAT.LAVA) { m[fj] = MAT.STONE; }
                }
              }
            }
          }
        }
      }
    },
    draw: function (g, c) {
      var cols = [];
      cols[MAT.EMPTY] = "#0b0e14";
      cols[MAT.SAND] = "#e8c46a";
      cols[MAT.WATER] = "#2f6fd0";
      cols[MAT.OIL] = "#2a2418";
      cols[MAT.WOOD] = "#7a5230";
      cols[MAT.FIRE] = "#ff7a1a";
      cols[MAT.LAVA] = "#ff3b10";
      cols[MAT.STONE] = "#5c6270";
      cols[MAT.STEAM] = "#8fa8c0";
      for (var y = 0; y < g.gh; y++) for (var x = 0; x < g.gw; x++) {
        var v = g.m[y * g.gw + x];
        if (v === MAT.EMPTY) continue;
        c.fillStyle = cols[v];
        c.fillRect(x * g.cell, y * g.cell, g.cell, g.cell);
      }
      /* brush + palette */
      var names = ["SAND", "WATER", "OIL", "WOOD", "FIRE", "LAVA", "STONE", "ERASE"];
      var order = [MAT.SAND, MAT.WATER, MAT.OIL, MAT.WOOD, MAT.FIRE, MAT.LAVA, MAT.STONE, MAT.EMPTY];
      txt(c, names[order.indexOf(g.brush)], 6, 12, 10, cols[g.brush === MAT.EMPTY ? MAT.STONE : g.brush]);
      txt(c, "CLICK TO CYCLE", g.w - 6, 12, 8, "#667", "right");
      txt(c, "PAINT WITH THE MOUSE. RIGHT-CLICK ERASES.", 6, g.h - 6, 8, "#4a5a6a");
    },
    mouse: function (g, x, y, down, right) {
      if (right) g.set(g, x, y, MAT.EMPTY);
      else g.brushAt(g, x, y, down);
    },
    score: 0
  };

  /* -------------------------------------------------------------------
     2.2  LINE RIDER  (2006, the one everybody's dad played at 2am)
     ------------------------------------------------------------------- */
  var gLiner = {
    id: "liner", name: "LINE RIDER", year: "2006", w: 480, h: 300,
    desc: "draw a line, the rider rides it. crash and it starts over. that is the whole game.",
    init: function (g) {
      g.seg = [];
      /* a starting ramp so you are not staring at an empty screen */
      /* a flat shelf to start on, and a bump further along, because starting
         the game by sliding off a ramp is not how anyone remembers this */
      g.seg.push({ x1: 10, y1: 228, x2: 210, y2: 248, done: 1 });
      g.seg.push({ x1: 300, y1: 250, x2: 430, y2: 212, done: 1 });
      g.wheels = [
        { x: 70, y: 226, vx: 0, vy: 0, g: 0, on: 0 },
        { x: 100, y: 224, vx: 0, vy: 0, g: 0, on: 0 }
      ];
      g.head = { x: 85, y: 208, vx: 0, vy: 0 };
      g.running = 1; g.crashT = 0; g.maxX = 60; g.trail = [];
    },
    drawSeg: function (g, x1, y1, x2, y2) {
      g.seg.push({ x1: x1, y1: y1, x2: x2, y2: y2, done: 0 });
    },
    press: function (g, x, y) { g.drag = { x1: x, y1: y, x2: x, y2: y }; },
    dragMove: function (g, x, y) {
      if (g.drag) { g.drag.x2 = x; g.drag.y2 = y; }
    },
    release: function (g) {
      if (!g.drag) return;
      var dx = g.drag.x2 - g.drag.x1, dy = g.drag.y2 - g.drag.y1;
      if (Math.abs(dx) + Math.abs(dy) > 8) g.drawSeg(g, g.drag.x1, g.drag.y1, g.drag.x2, g.drag.y2);
      g.drag = null;
    },
    update: function (g, dt) {
      /* camera follows the rider */
      var w = g.wheels[0], h = g.wheels[1];
      var cx = (w.x + h.x) / 2;
      g.cam = g.cam == null ? cx - g.w / 2 : clamp(cx - g.w / 2, -40, 4000);
      if (g.crashT > 0) { g.crashT -= dt; return; }
      if (!g.running) return;
      var wheel, i, s, best, nx, ny;
      for (i = 0; i < 2; i++) {
        wheel = g.wheels[i];
        wheel.vy += 620 * dt;
        wheel.vx *= 0.995;
        wheel.x += wheel.vx * dt; wheel.y += wheel.vy * dt;
        wheel.on = 0;
        for (var k = 0; k < g.seg.length; k++) {
          s = g.seg[k];
          best = segPoint(s.x1, s.y1, s.x2, s.y2, wheel.x, wheel.y);
          if (best.d < 9) {
            /* push out along the normal, kill the normal velocity */
            var ddx = wheel.x - best.x, ddy = wheel.y - best.y;
            var len = Math.hypot(ddx, ddy) || 1;
            var nX = ddx / len, nY = ddy / len;
            wheel.x += nX * (9 - best.d); wheel.y += nY * (9 - best.d);
            var vn = wheel.vx * nX + wheel.vy * nY;
            if (vn < 0) { wheel.vx -= vn * nX * 1.02; wheel.vy -= vn * nY * 1.02; }
            if (nY < -0.45) { wheel.on = 1; wheel.vx -= wheel.vx * 0.12; }   /* the normal points away from the line, i.e. up */
          }
        }
      }
      /* keep the wheels a fixed distance apart: that is the entire chassis.
         clamp the correction, because unclamped positional constraints in a
         physics toy are a slingshot pointed at 900,000 pixels. */
      var dx = g.wheels[1].x - g.wheels[0].x, dy = g.wheels[1].y - g.wheels[0].y;
      var d = Math.hypot(dx, dy) || 1, rest = 30;
      var diff = clamp((d - rest) * 0.5, -5, 5);
      var nx2 = dx / d, ny2 = dy / d;
      g.wheels[0].x += nx2 * diff; g.wheels[0].y += ny2 * diff;
      g.wheels[1].x -= nx2 * diff; g.wheels[1].y -= ny2 * diff;
      /* head rides on top of the middle, and if the head hits a line, you die */
      var mx = (g.wheels[0].x + g.wheels[1].x) / 2;
      var my = (g.wheels[0].y + g.wheels[1].y) / 2 - 16;
      g.head.vx = lerp(g.head.vx, (mx - g.head.x) * 9, 0.5);
      g.head.vy = lerp(g.head.vy, (my - g.head.y) * 9, 0.5);
      g.head.x += g.head.vx * dt * 3; g.head.y += g.head.vy * dt * 3;
      for (var k2 = 0; k2 < g.seg.length; k2++) {
        var s2 = g.seg[k2];
        if (segPoint(s2.x1, s2.y1, s2.x2, s2.y2, g.head.x, g.head.y).d < 8) { crash(g); break; }
      }
      /* nobody survives that. if the maths ever goes silly, so does the rider. */
      for (var v = 0; v < 2; v++) {
        var wv = g.wheels[v];
        var sp2 = Math.hypot(wv.vx, wv.vy);
        if (sp2 > 2200) { crash(g); return; }
        if (sp2 > 800) { wv.vx *= 800 / sp2; wv.vy *= 800 / sp2; }
      }
      /* fell off the bottom of the world */
      if (g.head.y > g.h + 60 || mx > 6000 || mx < -200) crash(g);
      g.maxX = Math.max(g.maxX, mx);
      g.score = Math.floor((g.maxX - 60) / 8);
    },
    draw: function (g, c) {
      c.fillStyle = "#0e1016"; c.fillRect(0, 0, g.w, g.h);
      /* hills, for depth. very 2006. */
      c.fillStyle = "#141824";
      c.beginPath(); c.moveTo(0, g.h);
      for (var x = 0; x <= g.w; x += 8) {
        c.lineTo(x, g.h - 60 - Math.sin((x + (g.cam || 0)) * 0.006) * 22 - Math.sin((x + (g.cam || 0)) * 0.017) * 12);
      }
      c.lineTo(g.w, g.h); c.closePath(); c.fill();
      c.save();
      c.translate(-(g.cam || 0), 0);
      c.strokeStyle = "#c8ccd8"; c.lineWidth = 2;
      c.beginPath();
      for (var i = 0; i < g.seg.length; i++) {
        var s = g.seg[i];
        c.moveTo(s.x1, s.y1); c.lineTo(s.x2, s.y2);
      }
      c.stroke();
      if (g.drag) { c.strokeStyle = "#ffd94a"; c.beginPath(); c.moveTo(g.drag.x1, g.drag.y1); c.lineTo(g.drag.x2, g.drag.y2); c.stroke(); }
      /* the rider: two wheels, a body, a head, and optimism */
      var w = g.wheels[0], h = g.wheels[1];
      var mx = (w.x + h.x) / 2, my = (w.y + h.y) / 2;
      c.strokeStyle = g.crashT > 0 ? "#ff5050" : "#f4f4f4"; c.lineWidth = 3;
      c.beginPath(); c.moveTo(w.x, w.y); c.lineTo(h.x, h.y); c.stroke();
      for (var k = 0; k < 2; k++) {
        var wh = g.wheels[k];
        c.fillStyle = "#0e1016"; c.beginPath(); c.arc(wh.x, wh.y, 6, 0, 6.2832); c.fill();
        c.strokeStyle = "#9aa4b8"; c.lineWidth = 2; c.stroke();
      }
      c.strokeStyle = g.crashT > 0 ? "#ff5050" : "#f4f4f4"; c.lineWidth = 3;
      c.beginPath(); c.moveTo(mx, my); c.lineTo(g.head.x, g.head.y); c.stroke();
      c.fillStyle = "#f4f4f4"; c.beginPath(); c.arc(g.head.x, g.head.y, 6, 0, 6.2832); c.fill();
      c.restore();
      txt(c, "DRAG TO DRAW. SPACE = CLEAR + RESTART. R = JUST RESTART. C = UNDO.", 6, 14, 9, "#8892a8");
      if (g.crashT > 0) txt(c, "CRASH. PRESS R.", g.w / 2, g.h / 2, 18, "#ff5050", "center");
    },
    key: function (g, k) {
      if (k === " ") { g.seg = []; SFX.pop(); g.restart(g); }
      else if (k === "r") g.restart(g);
    },
    restart: function (g) {
      g.wheels[0] = { x: 70, y: 226, vx: 0, vy: 0, on: 0 };
      g.wheels[1] = { x: 100, y: 224, vx: 0, vy: 0, on: 0 };
      g.head = { x: 85, y: 208, vx: 0, vy: 0 };
      g.running = 1; g.crashT = 0; g.maxX = 70; g.cam = null; g.score = 0;
    },
    score: 0
  };
  function crash(g) {
    if (g.crashT > 0) return;
    g.crashT = 1.2; g.running = 0;
    g.bestNow = Math.max(g.bestNow || 0, g.score);
    SFX.die();
  }

  /* -------------------------------------------------------------------
     2.3  BLOXORZ  (2008: roll a 3-long brick into holes, tip it over)
     ------------------------------------------------------------------- */
  /* every board below was generated and proven solvable by _build/blevels.py.
     the first four boards in this file were typed by hand and all four were
     unwinnable, which is not something you can see by looking at them. */
  var BLOX_LEVELS = [
    { n: "TWO AND THREE", N: 6, holes: [[0, 1], [4, 1]], goal: [5, 4] },
    { n: "THE FOUR HOLE", N: 7, holes: [[0, 1], [3, 3], [3, 4], [4, 4]], goal: [6, 4] },
    { n: "SOMETHING NARROW", N: 8, holes: [[0, 5], [3, 4], [5, 6], [6, 2], [7, 6]], goal: [3, 7] },
    { n: "THE LAST ONE", N: 8, holes: [[2, 3], [2, 6], [5, 1], [6, 2], [6, 7], [7, 0], [7, 5]], goal: [6, 5] }
  ];

  var gBlox = {
    id: "blox", name: "BLOXORZ", year: "2008", w: 480, h: 340,
    desc: "roll the brick. fall in a hole and you have to restart. it is 3 of them and you cannot cheat.",
    init: function (g) {
      g.li = 0; g.N = 8; g.moves = 0; g.loadLevel(g, 0);
    },
    loadLevel: function (g, i) {
      g.li = i;
      var L = BLOX_LEVELS[i];
      g.N = L.N;
      g.holes = L.holes; g.goal = L.goal;
      g.bx = 0; g.by = 0; g.state = "x";     /* x: lying along x, z: along z, o: upright */
      g.moves = 0; g.moving = 0; g.dead = 0; g.won = 0;
    },
    move: function (g, dx, dy) {
      if (g.dead || g.won || g.moving) return;
      var nx = g.bx, ny = g.by, ns = g.state;
      /* The tipping rules of a 1x1x3 block. x = lying east, z = lying south,
         o = standing on end. Rolling sideways tips it; rolling along its
         length just slides it. These were wrong in the first build, which
         made all four boards unwinnable, so they are now proven in
         _build/blevels.py before a single one of them ships. */
      if (g.state === "x") {
        if (dx === 1) { nx += 3; ns = "o"; }
        else if (dx === -1) { nx -= 1; ns = "o"; }
        else if (dy === 1) { ny += 1; }
        else { ny -= 1; }
      } else if (g.state === "o") {
        if (dx === 1) { ns = "z"; }
        else if (dx === -1) { nx -= 2; ns = "z"; }
        else if (dy === 1) { ns = "x"; }
        else { ny -= 2; ns = "x"; }
      } else {
        if (dx === 1) { nx += 1; ns = "o"; }
        else if (dx === -1) { nx -= 1; ns = "o"; }
        else if (dy === 1) { ny += 1; }
        else { ny -= 3; }
      }
      var cells = bloxCells(g, nx, ny, ns);
      for (var i = 0; i < cells.length; i++) {
        var c = cells[i];
        if (c[0] < 0 || c[1] < 0 || c[0] >= g.N || c[1] >= g.N) return;
        if (isHole(g, c[0], c[1])) { g.dead = 1; SFX.die(); return; }
      }
      if (ns === "o" && nx === g.goal[0] && ny === g.goal[1]) { g.won = 1; SFX.win(); }
      if (g.dead || g.won) { g.score = g.li * 10000 + g.moves; return; }
      g.bx = nx; g.by = ny; g.state = ns; g.moves++; g.score = g.li * 10000 + g.moves;
      SFX.tick();
    },
    key: function (g, k) {
      if (g.won) { if (k === "r" || k === "enter" || k === " ") g.loadLevel(g, Math.min(BLOX_LEVELS.length - 1, g.li + 1)); return; }
      if (g.dead) { if (k === "r" || k === "enter" || k === " ") { g.loadLevel(g, g.li); } return; }
      if (k === "arrowleft" || k === "a") g.move(g, -1, 0);
      if (k === "arrowright" || k === "d") g.move(g, 1, 0);
      if (k === "arrowup" || k === "w") g.move(g, 0, -1);
      if (k === "arrowdown" || k === "s") g.move(g, 0, 1);
    },
    update: function (g, dt) {
      if (g.won && g.wonT == null) g.wonT = g.t;
    },
    draw: function (g, c) {
      var S = Math.floor(Math.min(g.w, g.h) / (g.N + 1));
      var ox = (g.w - S * g.N) / 2, oy = 26;
      rct(c, 0, 0, g.w, g.h, "#14161d");
      for (var y = 0; y < g.N; y++) for (var x = 0; x < g.N; x++) {
        var px = ox + x * S, py = oy + y * S;
        rct(c, px + 1, py + 1, S - 2, S - 2, "#23262f");
        box(c, px + 1, py + 1, S - 2, S - 2, "#2e323c");
        if (isHole(g, x, y)) {
          rct(c, px + 2, py + 2, S - 4, S - 4, "#07080b");
          box(c, px + 2, py + 2, S - 4, S - 4, "#8a2b2b");
        }
        if (x === g.goal[0] && y === g.goal[1]) {
          box(c, px + 4, py + 4, S - 8, S - 8, "#39d353");
        }
      }
      /* the brick, drawn like a brick, tipped or not */
      var cells = bloxCells(g, g.bx, g.by, g.state);
      for (var i = 0; i < cells.length; i++) {
        var cc = cells[i];
        var px2 = ox + cc[0] * S, py2 = oy + cc[1] * S;
        var top = "#c8912f", side = "#8a5f18", edge = "#f0c060";
        if (g.state === "o") { top = "#e0b04a"; side = "#a87a22"; edge = "#ffe09a"; }
        rct(c, px2 + 3, py2 + 3, S - 6, S - 6, side);
        rct(c, px2 + 3, py2 + 3, S - 6, (S - 6) * 0.55, top);
        box(c, px2 + 3, py2 + 3, S - 6, S - 6, edge);
      }
      txt(c, BLOX_LEVELS[g.li].n + "   LEVEL " + (g.li + 1) + "/" + BLOX_LEVELS.length + "   MOVES " + g.moves, 8, 16, 10, "#8892a8");
      txt(c, "ARROWS TO ROLL. THE BRICK IS 3 BLOCKS LONG AND FINALLY HAS TO FIT THROUGH A 1x1 HOLE.", 8, g.h - 8, 8, "#4a5a6a");
      if (g.dead) txt(c, "IN THE HOLE. R TO TRY IT AGAIN.", g.w / 2, g.h / 2, 16, "#ff5050", "center");
      if (g.won) txt(c, "FIT. SPACE FOR LEVEL " + Math.min(BLOX_LEVELS.length, g.li + 2) + ".", g.w / 2, g.h / 2, 14, "#39d353", "center");
    },
    score: 0
  };
  function bloxCells(g, x, y, s) {
    if (s === "x") return [[x, y], [x + 1, y], [x + 2, y]];
    if (s === "z") return [[x, y], [x, y + 1], [x, y + 2]];
    return [[x, y]];
  }
  function isHole(g, x, y) {
    for (var i = 0; i < g.holes.length; i++) if (g.holes[i][0] === x && g.holes[i][1] === y) return true;
    return false;
  }

  /* -------------------------------------------------------------------
     2.4  UNICORN ATTACK  (2010: a line drawing of a unicorn, infinite)
     ------------------------------------------------------------------- */
  var gUni = {
    id: "unicorn", name: "UNICORN ATTACK", year: "2010", w: 480, h: 300,
    desc: "a unicorn runs forever. click to jump. it is white on white and it still works.",
    init: function (g) {
      g.x = 60; g.y = 200; g.vy = 0; g.jumps = 0; g.ground = 220;
      g.spd = 115; g.parts = []; g.score = 0; g.dead = 0; g.coinT = 0;
      g.buildTo = 780; g.nextAt = 560;   /* first spike about four seconds in */
      g.bestNow = 0;
      for (var i = 0; i < 400; i++) g.parts.push({ x: -i * 12, y: 0, h: Math.sin(i * 0.11) * 16 + Math.sin(i * 0.037) * 22 });
    },
    update: function (g, dt) {
      if (g.dead) return;
      g.x += g.spd * dt;
      g.spd = Math.min(300, g.spd + 4 * dt);
      g.vy += 900 * dt;
      g.y += g.vy * dt;
      var gy = g.ground + Math.sin((g.x + g.parts.length * 12) * 0.011) * 8;
      g.groundY = gy;
      if (g.y >= gy) { g.y = gy; g.vy = 0; g.jumps = 0; }
      g.score = Math.floor(g.x / 8);
      /* scenery scrolls, and the world is built well past the right edge so
         that obstacles have somewhere to be placed. building it only to the
         screen edge meant the front never advanced and nothing ever spawned. */
      var shift = g.spd * dt;
      for (var i = 0; i < g.parts.length; i++) { g.parts[i].x -= shift; }
      while (g.parts[g.parts.length - 1].x < g.buildTo) {
        var last = g.parts[g.parts.length - 1];
        g.parts.push({ x: last.x + 12, y: 0, h: rnd(-22, 22), spike: 0, bird: 0 });
      }
      for (var k = 0; k < g.parts.length; k++) {
        var p = g.parts[k];
        if (p.x < -20) { g.parts.splice(k, 1); k--; continue; }
        if (p.spike && Math.abs(p.x - g.x) < 12 && g.y > gy - 14) { g.die(g); return; }
        if (p.bird && Math.abs(p.x - g.x) < 13 && Math.abs(p.y - (g.y - 10)) < 14) { g.die(g); return; }
        if (p.coin && Math.abs(p.x - g.x) < 14 && Math.abs(p.y - (g.y - 10)) < 18) {
          p.coin = 0; g.score += 50; SFX.coin();
        }
      }
      /* obstacles go in by DISTANCE, so the pace is identical on every
         machine and nobody gets a wall of spikes */
      var frontier = g.parts[g.parts.length - 1].x;
      if (frontier >= g.nextAt) {
        var r = Math.random();
        if (r < 0.44) { g.parts.push({ x: frontier, y: 0, h: 0, spike: 1 }); g.nextAt = frontier + rnd(170, 340); }
        else if (r < 0.74) { g.parts.push({ x: frontier, y: gy - rnd(55, 105), h: 0, bird: 1 }); g.nextAt = frontier + rnd(150, 280); }
        else { g.parts.push({ x: frontier, y: gy - rnd(35, 95), h: 0, coin: 1 }); g.nextAt = frontier + rnd(70, 160); }
      }
      if (g.nextAt + 200 > g.buildTo) g.buildTo = g.nextAt + 200;
    },
    die: function (g) { g.dead = 1; SFX.die(); g.bestNow = Math.max(g.bestNow || 0, g.score); },
    tap: function (g) {
      if (g.dead) return;
      if (g.jumps < 2) { g.vy = -380; g.jumps++; SFX.jump(); }
    },
    key: function (g, k) {
      if (g.dead && (k === "r" || k === " " || k === "enter")) { g.init(g); SFX.blip(); }
    },
    draw: function (g, c) {
      rct(c, 0, 0, g.w, g.h, "#fdfdfb");
      /* the ground is a shape, not a fence. one polygon, stroked once. */
      var gy0 = g.groundY || 220;
      c.fillStyle = "#eceae4";
      c.beginPath();
      c.moveTo(g.parts[0].x - 20, g.h + 10);
      for (var i = 0; i < g.parts.length; i++) c.lineTo(g.parts[i].x, gy0 + g.parts[i].h);
      c.lineTo(g.parts[g.parts.length - 1].x + 20, g.h + 10);
      c.closePath();
      c.fill();
      c.strokeStyle = "#111"; c.lineWidth = 2;
      c.beginPath();
      c.moveTo(g.parts[0].x - 20, gy0 + g.parts[0].h);
      for (var i2 = 1; i2 < g.parts.length; i2++) c.lineTo(g.parts[i2].x, gy0 + g.parts[i2].h);
      c.lineTo(g.parts[g.parts.length - 1].x + 20, gy0 + g.parts[g.parts.length - 1].h);
      c.stroke();
      for (var k = 0; k < g.parts.length; k++) {
        var q = g.parts[k];
        var gy2 = (g.groundY || 220) + q.h;
        if (q.spike) {
          c.beginPath(); c.moveTo(q.x - 8, gy2 + 1); c.lineTo(q.x, gy2 - 15); c.lineTo(q.x + 8, gy2 + 1); c.closePath();
          c.fillStyle = "#111"; c.fill();
        } else if (q.bird) {
          c.beginPath(); c.arc(q.x, q.y, 5, 0, 6.28); c.fillStyle = "#111"; c.fill();
          c.beginPath(); c.moveTo(q.x - 8, q.y - 3); c.lineTo(q.x + 2, q.y); c.lineTo(q.x - 8, q.y + 3); c.stroke();
        } else if (q.coin) {
          c.beginPath(); c.arc(q.x, q.y, 6, 0, 6.28); c.strokeStyle = "#111"; c.stroke();
        }
      }
      /* the unicorn */
      c.strokeStyle = "#111"; c.lineWidth = 3;
      var x = g.x, y = g.y;
      c.beginPath();
      c.moveTo(x - 14, y - 14); c.lineTo(x + 12, y - 16);   /* body */
      c.moveTo(x + 8, y - 18); c.lineTo(x + 18, y - 30);    /* neck */
      c.moveTo(x + 18, y - 30); c.lineTo(x + 26, y - 32);   /* head */
      c.moveTo(x + 26, y - 32); c.lineTo(x + 34, y - 26);   /* horn */
      c.moveTo(x - 12, y - 12); c.lineTo(x - 16, y);        /* legs */
      c.moveTo(x - 4, y - 12); c.lineTo(x, y);
      c.moveTo(x + 2, y - 12); c.lineTo(x + 8, y);
      c.moveTo(x - 14, y - 12); c.lineTo(x - 22, y - 22);   /* tail */
      c.stroke();
      c.lineWidth = 2;
      for (var f = 0; f < 5; f++) {
        c.beginPath();
        c.moveTo(x - 22 - f * 6, y - 22);
        c.quadraticCurveTo(x - 26 - f * 6, y - 16, x - 22 - f * 6, y - 10);
        c.stroke();
      }
      txt(c, "UNICORN ATTACK", 8, 18, 12, "#111");
      txt(c, "CLICK TO JUMP \u00b7 TWICE IF YOU MUST \u00b7 BIRDS SIT AT HEAD HEIGHT", 8, g.h - 10, 8, "#777");
      if (g.dead) {
        rct(c, 0, 0, g.w, g.h, "rgba(255,255,255,0.86)");
        txt(c, "THE UNICORN IS DEAD", g.w / 2, g.h / 2 - 4, 18, "#111", "center");
        txt(c, "R TO RUN AGAIN", g.w / 2, g.h / 2 + 16, 10, "#666", "center");
      }
    },
    score: 0
  };

  /* -------------------------------------------------------------------
     2.5  GRAVITY BOX  (the fall-down game. everyone wrote one. this is mine)
     ------------------------------------------------------------------- */
  /* same story as blox: _build/glevels.py refuses to emit a board that its
     breadth-first search cannot finish. */
  var GB_LEVELS = [
    { n: "INTRO", map: [
        "#####################",
        "#........#..........#",
        "#........#..........#",
        "#....S...+.....>>>>.#",
        "#........#.........>#",
        "#........#.........>#",
        "####.#####...########",
        "#...................#",
        "#..<<<<<<.........X.#",
        "#####################",
      ] },
    { n: "SPIKES", map: [
        "#####################",
        "#>.S.....###.>.>>...#",
        "########.##########>#",
        "########.##########.#",
        "#>.>.....###.>>.....#",
        "########.##########.#",
        "########.##########>#",
        "#.>..>.>.........X.>#",
        "#####################",
        "#####################",
      ] },
    { n: "WATER", map: [
        "#####################",
        "#..S...###..>>....>>#",
        "######.############.#",
        "######.############>#",
        "#.>>>>.###......>.>.#",
        "######.############>#",
        "######.############>#",
        "#..>>>............X.#",
        "#####################",
        "#####################",
      ] },
    { n: "THE END", map: [
        "#####################",
        "#..S...###..>.>>..>.#",
        "######.############>#",
        "######.############.#",
        "#.>>.>.###>....>.>.>#",
        "######.############>#",
        "######.############>#",
        "#.>>>>............X.#",
        "#####################",
        "#####################",
      ] }
  ];

  var gGrav = {
    id: "gravity", name: "GRAVITY BOX", year: "2007", w: 340, h: 186,
    desc: "one button. you fall, then you fall upward, and the level slowly becomes optional.",
    init: function (g) { g.li = 0; g.load(g, 0); },
    load: function (g, i) {
      g.li = i;
      var L = GB_LEVELS[i];
      g.map = L.map;
      g.MW = L.map[0].length; g.MH = L.map.length;
      for (var y = 0; y < g.MH; y++) for (var x = 0; x < g.MW; x++) {
        if (L.map[y].charAt(x) === "S") { g.px = x; g.py = y; }
        if (L.map[y].charAt(x) === "X") { g.gx = x; g.gy = y; }
      }
      g.doors = [];
      g.py_ = 1; g.vy = 0; g.done = 0; g.dead = 0; g.touch = 0;
      if (g.gx == null) console.warn("[flash] gravity box level " + i + " has no goal");
      /* every row of a map should be the same width. shout if one is not. */
      for (var r = 0; r < g.MH; r++) {
        if (g.map[r].length !== g.MW) console.warn("[flash] gravity box map row " + r + " is " + g.map[r].length + " wide, wanted " + g.MW);
      }
    },
    move: function (g, dir) {
      if (g.dead || g.done) return;
      var nx = clamp(Math.round(g.px) + dir, 0, g.MW - 1);
      var y0 = Math.floor(g.py);
      var here = g.map[y0] ? g.map[y0].charAt(nx) : "#";
      if (here === "#") return;
      g.px = nx;
      g.vy = g.vy;
      var cur = g.map[y0] ? g.map[y0].charAt(nx) : "#";
      if ((cur === ">" && g.py_ < 0) || (cur === "<" && g.py_ > 0)) {
        g.dead = 1; g.bestNow = Math.max(g.bestNow || 0, g.score); SFX.die();
      }
      if (g.gx != null && nx === g.gx && y0 === g.gy) { g.done = 1; g.score += 500; SFX.win(); }
    },
    solid: function (g, x, y) {
      if (x < 0 || y < 0 || x >= g.MW || y >= g.MH) return true;
      var row = g.map[y];
      if (!row) return true;
      var c = row.charAt(x);
      return c === "#" || c === ">" || c === "<";
    },
    flip: function (g) {
      if (g.py_ < 0) return;
      g.py_ = -g.py_; g.vy = 0; SFX.whoosh();
    },
    update: function (g, dt) {
      if (g.dead || g.done) return;
      g.vy += 760 * dt;
      g.vy = clamp(g.vy, -520, 520);
      g.py += g.vy * dt;
      var px2 = clamp(Math.round(g.px), 0, g.MW - 1);
      var y0 = Math.floor(g.py);
      var edge = g.py_ > 0 ? y0 + 1 : y0 - 1;
      /* stand on a floor, or hang from a ceiling */
      if (g.solid(g, px2, edge) && (g.py_ > 0 ? g.vy > 0 : g.vy < 0)) {
        g.py = y0; g.vy = 0;
      }
      g.py = clamp(g.py, 1, g.MH - 2);
      y0 = Math.floor(g.py);
      /* arrows are floors that only bite from the wrong side. that is the
         entire difference between this game and a spike. */
      var cur = g.map[y0] ? g.map[y0].charAt(px2) : "#";
      if ((cur === ">" && g.py_ < 0) || (cur === "<" && g.py_ > 0)) {
        g.dead = 1; g.bestNow = Math.max(g.bestNow || 0, g.score); SFX.die(); return;
      }
      /* the door at the end */
      if (g.gx != null && Math.abs(px2 - g.gx) < 1 && Math.abs(y0 - g.gy) < 1) {
        g.done = 1; g.score += 500 + g.li * 100; SFX.win();
      }
      g.score = g.li * 1000 + Math.max(0, (g.gy || 0) - Math.round(g.py));
    },
    tap: function (g) { if (!g.dead && !g.done) g.flip(g); },
    key: function (g, k) {
      if (k === "a" || k === "arrowleft") { g.move(g, -1); return; }
      if (k === "d" || k === "arrowright") { g.move(g, 1); return; }
      if (g.done) { if (k === "r" || k === " " || k === "enter") g.load(g, Math.min(GB_LEVELS.length - 1, g.li + 1)); return; }
      if (g.dead) { if (k === "r" || k === " " || k === "enter") g.load(g, g.li); return; }
      if (k === " " || k === "arrowup" || k === "arrowdown" || k === "w" || k === "s") g.flip(g);
    },
    draw: function (g, c) {
      var S = Math.min(g.w / g.MW, g.h / g.MH);
      var ox = (g.w - g.MW * S) / 2, oy = (g.h - g.MH * S) / 2;
      rct(c, 0, 0, g.w, g.h, "#0b0d12");
      for (var y = 0; y < g.MH; y++) for (var x = 0; x < g.MW; x++) {
        var ch = g.map[y].charAt(x), px = ox + x * S, py = oy + y * S;
        if (ch === "#") { rct(c, px, py, S, S, "#3d4454"); rct(c, px, py, S, S * 0.25, "#525b6f"); }
        else if (ch === ">") { rct(c, px, py, S, S, "#8a2020"); rct(c, px + S * 0.2, py + S * 0.2, S * 0.6, S * 0.6, "#ff5a4a"); }
        else if (ch === "<") { rct(c, px, py, S, S, "#20508a"); rct(c, px + S * 0.2, py + S * 0.2, S * 0.6, S * 0.6, "#4aa8ff"); }
        else if (ch === "X") { rct(c, px, py, S, S, "#2a5a30"); box(c, px, py, S, S, "#39d353"); }
        else if (ch === "+") { rct(c, px, py, S, S, "#1c3a26"); box(c, px, py, S, S, "#3fae5a"); }
        else if (ch === ".") { rct(c, px, py, S, S, "#161a22"); }
      }
      rct(c, ox + g.px * S + S * 0.15, oy + g.py * S + S * 0.15, S * 0.7, S * 0.7, g.py_ > 0 ? "#ffd94a" : "#ff7a4a");
      txt(c, GB_LEVELS[g.li].n + "  " + (g.li + 1) + "/" + GB_LEVELS.length, 8, 14, 10, "#8892a8");
      txt(c, "A/D MOVE  \u00b7  SPACE FLIPS GRAVITY  \u00b7  ARROWS BITE FROM ONE SIDE ONLY", 8, g.h - 6, 8, "#4a5a6a");
      if (g.dead) txt(c, "SPLAT. R.", g.w / 2, g.h / 2, 16, "#ff5a4a", "center");
      if (g.done) txt(c, "LEVEL CLEAR. SPACE.", g.w / 2, g.h / 2, 14, "#39d353", "center");
    },
    score: 0
  };

  /* -------------------------------------------------------------------
     2.6  FLOPPY  (the ragdoll one. QWOP was a crime. this is the same crime)
     ------------------------------------------------------------------- */
  var gFlop = {
    id: "floppy", name: "FLOPPY", year: "2008", w: 480, h: 300,
    desc: "you are two legs and a mouse. walking is theoretically possible. i have never managed it.",
    init: function (g) {
      g.gx = 70; g.ground = 264; g.phase = 0; g.vx = 0;
      g.reach = 58; g.hipH = 88;
      g.legs = [
        { a: 0, fx: 70, fy: 264, kx: 70, ky: 210, down: 1, was: 1 },
        { a: Math.PI, fx: 70, fy: 264, kx: 70, ky: 210, down: 1, was: 1 }
      ];
      g.steps = 0; g.dust = []; g.crashed = 0; g.target = 2000; g.won = 0;
    },
    /* two-bone IK. hip, knee, foot. the knee bends out the way it has to. */
    solve: function (g, hx, hy, tx, ty, L1, L2, pole) {
      var dx = tx - hx, dy = ty - hy;
      var d = Math.max(1e-3, Math.hypot(dx, dy));
      var dd = clamp(d, Math.abs(L1 - L2) + 1, L1 + L2 - 1);
      var a = (L1 * L1 - L2 * L2 + dd * dd) / (2 * dd);
      var h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
      var mx = hx + dx / d * a, my = hy + dy / d * a;
      /* the knee sits on one side of the hip->foot line. pick the side. */
      var nx = -dy / d, ny = dx / d;
      return { kx: mx + nx * h * pole, ky: my + ny * h * pole };
    },
    update: function (g, dt) {
      if (g.won) return;
      var want = g.want || { x: g.gx + 80, y: g.ground - 120 };
      var lean = clamp((want.x - g.gx) / 160, -1, 1);
      var effort = clamp(Math.hypot(want.x - g.gx, want.y - (g.ground - g.hipH)) / 150, 0, 1.6);
      g.phase += dt * (1.1 + effort * 3.4);
      /* the body leans where you point and accelerates gently. gravity is for
         the scenery, not for you. */
      var target = lean * (34 + effort * 62);
      g.vx = approach(g.vx, target, 120 * dt);
      g.gx += g.vx * dt;
      g.gx = clamp(g.gx, 40, g.w - 40);
      var bob = Math.sin(g.phase * 2) * 3;
      var hipY = g.ground - g.hipH + bob;
      for (var i = 0; i < 2; i++) {
        var L = g.legs[i];
        var a = g.phase * Math.PI * 2 + i * Math.PI;
        /* the foot traces a flat loop: forward along the floor, then up and
           back. a real stride, or as close as two maths legs get. */
        var tx = g.gx + Math.cos(a) * (26 + effort * 42);
        var ty = g.ground - Math.max(0, Math.sin(a)) * (14 + effort * 34);
        if (ty >= g.ground) {
          ty = g.ground;
          L.down = 1;
          if (!L.was) { g.steps++; SFX.step ? SFX.step() : SFX.thud(); }
          /* a planted foot scrubs forward: that is the only thrust in here */
          g.vx += Math.cos(a) * 26 * dt * 60 * 0.06;
          if (!L.puff) {
            L.puff = 0.18;
            for (var p = 0; p < 3; p++) g.dust.push({ x: tx, y: g.ground - 2, vx: rnd(-26, 26), vy: rnd(-34, -8), life: 0.45 });
          }
        } else L.down = 0;
        L.was = L.down;
        L.puff = Math.max(0, (L.puff || 0) - dt);
        L.fx = tx; L.fy = ty;
        var k = g.solve(g, g.gx, hipY, tx, ty, g.reach, g.reach, 1);
        L.kx = k.kx; L.ky = k.ky;
      }
      g.hipY = hipY;
      for (var d2 = g.dust.length - 1; d2 >= 0; d2--) {
        var q = g.dust[d2];
        q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 70 * dt; q.life -= dt;
        if (q.life <= 0) g.dust.splice(d2, 1);
      }
      g.score = Math.max(g.score, Math.floor((g.gx - 70) / 3));
      if (g.gx > g.target) { g.won = 1; g.score = Math.max(g.score, 2500); SFX.win(); }
    },
    draw: function (g, c) {
      rct(c, 0, 0, g.w, g.h, "#eef2f7");
      rct(c, 0, 0, g.w, 74, "#dbe6f2");
      circ(c, 90, 44, 16, "#f4e9b8");
      rct(c, 0, g.ground, g.w, g.h - g.ground, "#cbd3de");
      rct(c, 0, g.ground, g.w, 3, "#a8b2c0");
      for (var k = 0; k < 8; k++) rct(c, k * 70, g.ground + 6, 30, 2, "#b6c0ce");
      var cam = clamp(g.gx - 120, -40, 4000);
      c.save(); c.translate(-cam, 0);
      /* the finish: a flag, like 1911 */
      rct(c, g.target, g.ground - 104, 3, 104, "#8a94a4");
      rct(c, g.target + 3, g.ground - 104, 22, 14, "#e0483a");
      /* the walker */
      var hx = g.gx, hy = g.hipY || (g.ground - g.hipH);
      c.strokeStyle = "#2b3140"; c.lineCap = "round";
      for (var i = 0; i < 2; i++) {
        var L = g.legs[i];
        c.lineWidth = L.down ? 6 : 5;
        c.strokeStyle = L.down ? "#2b3140" : "#59637a";
        c.beginPath();
        c.moveTo(hx, hy); c.lineTo(L.kx, L.ky); c.lineTo(L.fx, L.fy);
        c.stroke();
        c.fillStyle = "#2b3140";
        c.beginPath(); c.arc(L.kx, L.ky, 5, 0, 6.28); c.fill();
        /* foot */
        c.fillStyle = "#1f2430";
        c.beginPath(); c.arc(L.fx, L.fy, 4.5, 0, 6.28); c.fill();
      }
      c.lineWidth = 10; c.strokeStyle = "#2b3140";
      c.beginPath(); c.moveTo(hx, hy + 16); c.lineTo(hx, hy); c.stroke();
      c.fillStyle = "#2b3140";
      c.beginPath(); c.arc(hx, hy - 13, 10, 0, 6.28); c.fill();
      c.fillStyle = "#eef2f7";
      rct(c, hx - 6, hy - 15, 3, 3, "#eef2f7");
      rct(c, hx + 3, hy - 15, 3, 3, "#eef2f7");
      c.lineCap = "butt";
      for (var d = 0; d < g.dust.length; d++) {
        var p = g.dust[d];
        c.globalAlpha = clamp(p.life * 2.2, 0, 1);
        circ(c, p.x, p.y, 2.5, "#a8b2c0");
        c.globalAlpha = 1;
      }
      c.restore();
      txt(c, "FLOPPY", 8, 18, 12, "#2b3140");
      txt(c, "MOVE THE MOUSE. FAR = FAST STEPS. SIDEWAYS = A DIRECTION.", 8, g.h - 10, 8, "#6b7688");
      txt(c, "DISTANCE " + Math.max(0, Math.floor(g.gx - 70)) + "m   STEPS " + g.steps, g.w - 8, 18, 9, "#2b3140", "right");
      if (g.won) {
        rct(c, 0, 0, g.w, g.h, "rgba(255,255,255,0.82)");
        txt(c, "YOU WALKED", g.w / 2, g.h / 2 - 4, 22, "#2b3140", "center");
        txt(c, "to the flag. in a straight line. barely. R TO GO AGAIN", g.w / 2, g.h / 2 + 16, 10, "#6b7688", "center");
      }
    },
    tap: function (g) { if (g.won) g.init(g); },
    key: function (g, k) { if (k === "r") g.init(g); },
    score: 0
  };

  /* -------------------------------------------------------------------
     2.7  BRICKS  (breakout. there is no clever way to describe breakout)
     ------------------------------------------------------------------- */
  var gBricks = {
    id: "bricks", name: "BRICKS", year: "2001", w: 480, h: 320,
    desc: "the paddle is the only thing you have ever had. five bricks deep, then the ball gets faster.",
    init: function (g) {
      g.lives = 3; g.level = 0; g.pw = 64; g.ph = 12;
      g.newLevel(g); g.newBall(g);
    },
    newBall: function (g) {
      g.bx = g.w / 2; g.by = g.h - 40; g.vx = rnd(-90, 90); g.vy = -300; g.stuck = 1;
    },
    newLevel: function (g) {
      g.rows = 4 + g.level;
      g.bricks = [];
      var cols = 9, bw = (g.w - 20) / cols;
      for (var r = 0; r < g.rows; r++) for (var c = 0; c < cols; c++) {
        g.bricks.push({ x: 10 + c * bw, y: 30 + r * 14, w: bw - 3, h: 12, hp: r < 1 ? 2 : 1, col: (r + c) % 5 });
      }
      g.pu = null;
    },
    update: function (g, dt) {
      if (g.dead) return;
      if (!g.bricks.length && !g.levelUp) { g.level++; g.newLevel(g); g.levelUp = 1; g.pauseT = 1; }
      if (g.pauseT > 0) { g.pauseT -= dt; if (g.pauseT <= 0) g.levelUp = 0; }
      /* arrows win over the mouse. a paddle you can only move with a mouse is
         not a paddle, it is a rumour. */
      var kl = (g.keys["arrowleft"] || g.keys["a"]) ? 1 : 0;
      var kr = (g.keys["arrowright"] || g.keys["d"]) ? 1 : 0;
      if (kl || kr) g.px = clamp(g.px + (kr - kl) * 340 * dt, 0, g.w - g.pw);
      else g.px = clamp(g.mx - g.pw / 2, 0, g.w - g.pw);
      if (g.stuck) { g.bx = g.px + g.pw / 2; g.by = g.h - 40; return; }
      var sp = 1 + g.level * 0.12;
      g.bx += g.vx * sp * dt; g.by += g.vy * sp * dt;
      if (g.bx < 4) { g.bx = 4; g.vx = Math.abs(g.vx); SFX.blip(); }
      if (g.bx > g.w - 4) { g.bx = g.w - 4; g.vx = -Math.abs(g.vx); SFX.blip(); }
      if (g.by < 4) { g.by = 4; g.vy = Math.abs(g.vy); SFX.blip(); }
      /* paddle */
      if (g.by + 6 >= g.h - 30 && g.by <= g.h - 24 &&
          g.bx > g.px - 4 && g.bx < g.px + g.pw + 4 && g.vy > 0) {
        g.vy = -Math.abs(g.vy) * 1.02;
        var off = (g.bx - (g.px + g.pw / 2)) / (g.pw / 2);
        g.vx = off * 230;
        SFX.blip();
      }
      if (g.by > g.h + 10) {
        g.lives--;
        if (g.lives <= 0) { g.dead = 1; g.bestNow = Math.max(g.bestNow || 0, g.score); SFX.die(); }
        else g.newBall(g);
      }
      /* bricks */
      for (var i = g.bricks.length - 1; i >= 0; i--) {
        var b = g.bricks[i];
        if (!overlap(g.bx - 4, g.by - 4, 8, 8, b.x, b.y, b.w, b.h)) continue;
        /* which side? */
        var ox = Math.min(g.bx + 4 - b.x, b.x + b.w - (g.bx - 4));
        var oy = Math.min(g.by + 4 - b.y, b.y + b.h - (g.by - 4));
        if (ox < oy) g.vx = -g.vx; else g.vy = -g.vy;
        b.hp--;
        g.score += 10;
        SFX.hit();
        if (b.hp <= 0) {
          g.bricks.splice(i, 1);
          g.score += 15;
          if (Math.random() < 0.07) g.pu = { x: b.x + b.w / 2, y: b.y, t: "x" + pick(["wide", "slow", "multi", "life"]) };
        }
        break;
      }
      /* power-ups */
      if (g.pu) {
        g.pu.y += 90 * dt;
        if (circleRect(g.pu.x, g.pu.y, 7, g.px, g.h - 30, g.pw, g.ph)) {
          SFX.coin();
          if (g.pu.t === "xwide") g.pw = 110;
          else if (g.pu.t === "xslow") g.slow = 8;
          else if (g.pu.t === "xmulti") g.multi = 1;
          else if (g.pu.t === "xlife") g.lives++;
          g.pu = null;
        } else if (g.pu.y > g.h) g.pu = null;
      }
      g.score = Math.max(g.score || 0, 0) + 0;
    },
    tap: function (g) { if (g.stuck) { g.stuck = 0; g.vy = -300; SFX.blip(); } else if (g.dead) { g.dead = 0; g.lives = 3; g.level = 0; g.score = 0; g.newLevel(g); g.newBall(g); } },
    key: function (g, k) {
      if (g.dead && (k === " " || k === "enter")) { g.tap(g); return; }
      if (k === " ") g.tap(g);
      if (k === "arrowleft" || k === "a") g.px = clamp(g.px - 26, 0, g.w - g.pw);
      if (k === "arrowright" || k === "d") g.px = clamp(g.px + 26, 0, g.w - g.pw);
    },
    draw: function (g, c) {
      rct(c, 0, 0, g.w, g.h, "#0b0d12");
      var cols = ["#e05252", "#e08a3a", "#e0d23a", "#4ec25a", "#4a8fe0"];
      for (var i = 0; i < g.bricks.length; i++) {
        var b = g.bricks[i];
        rct(c, b.x, b.y, b.w, b.h, cols[b.col]);
        rct(c, b.x, b.y, b.w, 3, "rgba(255,255,255,0.28)");
        if (b.hp > 1) rct(c, b.x, b.y + b.h - 3, b.w, 3, "rgba(0,0,0,0.3)");
      }
      if (g.pu) {
        circ(c, g.pu.x, g.pu.y, 7, "#ffd94a");
        txt(c, "?", g.pu.x, g.pu.y + 3, 9, "#000", "center");
      }
      rct(c, g.px, g.h - 30, g.pw, g.ph, "#d8dde6");
      rct(c, g.px, g.h - 30, g.pw, 4, "#ffffff");
      circ(c, g.bx, g.by, 4, "#ffffff");
      txt(c, "SCORE " + (g.score | 0) + "   LIVES " + g.lives + "   LEVEL " + (g.level + 1), 8, 16, 10, "#8892a8");
      txt(c, "ARROWS OR MOUSE  \u00b7  SPACE LAUNCHES  \u00b7  CLICK TOO", 8, g.h - 6, 8, "#4a5a6a");
      if (g.dead) {
        rct(c, 0, 0, g.w, g.h, "rgba(0,0,0,0.7)");
        txt(c, "NO BALLS LEFT", g.w / 2, g.h / 2, 18, "#fff", "center");
        txt(c, "SPACE TO TRY AGAIN", g.w / 2, g.h / 2 + 18, 10, "#8892a8", "center");
      }
    },
    score: 0
  };

  /* -------------------------------------------------------------------
     2.8  NOODLE  (snake. the oldest game on the internet after tetris)
     ------------------------------------------------------------------- */
  var gNood = {
    id: "noodle", name: "NOODLE", year: "2002", w: 480, h: 320,
    desc: "a snake. eat the dots. do not eat yourself. that is genuinely the whole thing.",
    init: function (g) {
      g.cols = 20; g.rows = 15; g.reset(g);
    },
    reset: function (g) {
      g.snake = [{ x: 10, y: 7 }, { x: 9, y: 7 }, { x: 8, y: 7 }];
      g.dir = { x: 1, y: 0 }; g.turn = null; g.grow = 0; g.speed = 7; g.acc = 0;
      g.food = g.place(g); g.score = 0; g.dead = 0;
    },
    place: function (g) {
      var p;
      for (var tries = 0; tries < 200; tries++) {
        p = { x: irnd(g.cols), y: irnd(g.rows) };
        var hit = false;
        for (var i = 0; i < g.snake.length; i++) if (g.snake[i].x === p.x && g.snake[i].y === p.y) hit = true;
        if (!hit) return p;
      }
      return p;
    },
    key: function (g, k) {
      if (g.dead) { if (k === " " || k === "r") g.reset(g); return; }
      if (k === "arrowleft" || k === "a") g.turn = { x: -1, y: 0 };
      if (k === "arrowright" || k === "d") g.turn = { x: 1, y: 0 };
      if (k === "arrowup" || k === "w") g.turn = { x: 0, y: -1 };
      if (k === "arrowdown" || k === "s") g.turn = { x: 0, y: 1 };
    },
    update: function (g, dt) {
      if (g.dead) return;
      g.acc += dt * g.speed;
      while (g.acc >= 1) {
        g.acc -= 1;
        if (g.turn) {
          if (g.turn.x !== -g.dir.x || g.turn.y !== -g.dir.y) g.dir = g.turn;
          g.turn = null;
        }
        var head = g.snake[0];
        var nx = (head.x + g.dir.x + g.cols) % g.cols;
        var ny = (head.y + g.dir.y + g.rows) % g.rows;
        for (var i = 0; i < g.snake.length; i++) {
          if (g.snake[i].x === nx && g.snake[i].y === ny) {
            g.dead = 1; g.bestNow = Math.max(g.bestNow || 0, g.score); SFX.die(); return;
          }
        }
        g.snake.unshift({ x: nx, y: ny });
        if (nx === g.food.x && ny === g.food.y) {
          g.grow += 2; g.score += 10 + Math.floor(g.snake.length / 3);
          g.speed = Math.min(18, 7 + g.snake.length * 0.22);
          g.food = g.place(g); SFX.coin();
        } else g.snake.pop();
      }
    },
    draw: function (g, c) {
      var S = Math.min(g.w / g.cols, g.h / g.rows);
      var ox = (g.w - g.cols * S) / 2, oy = (g.h - g.rows * S) / 2;
      rct(c, 0, 0, g.w, g.h, "#0b0d12");
      for (var y = 0; y < g.rows; y++) for (var x = 0; x < g.cols; x++) {
        if ((x + y) % 2) rct(c, ox + x * S, oy + y * S, S, S, "#11141b");
      }
      circ(c, ox + (g.food.x + 0.5) * S, oy + (g.food.y + 0.5) * S, S * 0.34, "#e0483a");
      for (var i = g.snake.length - 1; i >= 0; i--) {
        var s = g.snake[i];
        var col = i === 0 ? "#7ee36a" : (i % 2 ? "#3f9c37" : "#4fb845");
        rct(c, ox + s.x * S + 1, oy + s.y * S + 1, S - 2, S - 2, col);
      }
      var hd = g.snake[0];
      rct(c, ox + hd.x * S + 3, oy + hd.y * S + 3, 3, 3, "#0b0d12");
      rct(c, ox + hd.x * S + S - 6, oy + hd.y * S + 3, 3, 3, "#0b0d12");
      txt(c, "NOODLE", 8, 16, 11, "#4fb845");
      txt(c, "ARROWS. IT WRAPS AROUND THE EDGES BECAUSE THE EDGES ARE BORING.", 8, g.h - 8, 8, "#4a5a6a");
      if (g.dead) {
        rct(c, 0, 0, g.w, g.h, "rgba(0,0,0,0.72)");
        txt(c, "YOU ATE YOURSELF", g.w / 2, g.h / 2, 16, "#fff", "center");
        txt(c, "SPACE TO START OVER", g.w / 2, g.h / 2 + 18, 10, "#8892a8", "center");
      }
    },
    score: 0
  };

  /* -------------------------------------------------------------------
     2.9  HOP  (one button. the stick figure. the platypus of flash games)
     ------------------------------------------------------------------- */
  /* gaps are in PIXELS now, because in tiles they were 120 wide and a jump
     is 76 wide, which is how you ship a game where the player dies at x=65. */
  var HOP_LEVELS = [
    { n: "ONE BUTTON", speed: 96,
      gaps: [[150, 196], [330, 372], [520, 556]],
      spikes: [260, 640], end: 760 },
    { n: "TWO BUTTONS", speed: 104,
      gaps: [[140, 192], [300, 348], [470, 512], [620, 664]],
      spikes: [250, 420, 580, 720], end: 830 },
    { n: "THE PIT", speed: 112,
      gaps: [[130, 186], [280, 330], [430, 476], [580, 626], [700, 742]],
      spikes: [240, 390, 540, 670], end: 880 }
  ];

  var gHop = {
    id: "hop", name: "ONE BUTTON", year: "2004", w: 480, h: 260,
    desc: "you run by yourself. one button makes you jump. hold it for a bigger jump. that's it.",
    init: function (g) { g.li = 0; g.load(g, 0); },
    load: function (g, i) {
      g.li = i;
      var L = HOP_LEVELS[i];
      g.gaps = L.gaps; g.spikes = L.spikes; g.spd = L.speed; g.end = L.end;
      g.x = 30; g.y = 0; g.vy = 0; g.hold = 0; g.dead = 0; g.won = 0; g.legT = 0;
      g.ground = g.h - 40;
    },
    overGap: function (g, x) {
      for (var i = 0; i < g.gaps.length; i++) {
        if (x >= g.gaps[i][0] && x <= g.gaps[i][1]) return true;
      }
      return false;
    },
    /* the player is a point. a spike is 26 wide. being 11px away kills you. */
    nearSpike: function (g, ahead) {
      for (var i = 0; i < g.spikes.length; i++) {
        if (Math.abs(g.spikes[i] - ahead) < 26) return true;
      }
      return false;
    },
    jump: function (g) {
      if (g.y === 0) { g.vy = -(g.hold ? 470 : 350); SFX.jump(); }
    },
    tap: function (g) { if (g.dead || g.won) { g.load(g, g.li); return; } g.jump(g); },
    key: function (g, k) {
      if (k === " " || k === "arrowup" || k === "w") { g.tap(g); }
      if (k === "r") g.load(g, g.li);
    },
    update: function (g, dt) {
      if (g.dead || g.won) return;
      g.x += g.spd * dt;
      g.vy += 1100 * dt;
      g.y += g.vy * dt;
      var onGround = !g.overGap(g, g.x);
      if (g.y >= 0 && onGround) {
        g.y = 0; g.vy = 0;
      } else if (g.y >= 0) {
        g.y += 220 * dt;         /* falling into a hole: slower, so you can see it */
        if (g.y > 140) { g.dead = 1; g.bestNow = Math.max(g.bestNow || 0, g.score); SFX.die(); }
      }
      for (var i = 0; i < g.spikes.length; i++) {
        var sx = g.spikes[i] * 40 + 20;
        if (Math.abs(g.x - sx) < 11 && g.y > -14) { g.dead = 1; g.bestNow = Math.max(g.bestNow || 0, g.score); SFX.die(); return; }
      }
      if (g.x > g.end) {
        g.won = 1; g.score = (g.li + 1) * 1000 + Math.floor(g.x); SFX.win();
      }
      g.score = Math.max(g.score, Math.floor(g.x / 3) + g.li * 200);
      g.legT += dt * (g.y === 0 ? 14 : 4);
    },
    draw: function (g, c) {
      rct(c, 0, 0, g.w, g.h, "#cfe6f5");
      c.fillStyle = "#b8d8ec";
      for (var i = 0; i < 5; i++) c.beginPath(), c.arc(i * 130 - 40, 60, 26, 0, 6.28), c.fill();
      var cam = clamp(g.x - 60, 0, 4000);
      c.save(); c.translate(-cam, 0);
      rct(c, -100, g.ground, 6000, g.h, "#8fd06a");
      rct(c, -100, g.ground, 6000, 6, "#6cb04c");
      for (var k = 0; k < g.gaps.length; k++) {
        rct(c, g.gaps[k][0], g.ground - 2, g.gaps[k][1] - g.gaps[k][0], 4, "#5a2b22");
      }
      for (var s = 0; s < g.spikes.length; s++) {
        var sx2 = g.spikes[s] - 13;
        for (var t = 0; t < 3; t++) {
          c.fillStyle = "#9aa4b4";
          c.beginPath();
          c.moveTo(sx2 + t * 9, g.ground + 1); c.lineTo(sx2 + t * 9 + 4, g.ground - 15); c.lineTo(sx2 + t * 9 + 9, g.ground + 1);
          c.closePath(); c.fill();
        }
      }
      /* the runner: a stick figure with opinions */
      var px = g.x, py = g.ground + g.y;
      var run = Math.sin(g.legT) * 9;
      c.strokeStyle = "#2a2f3a"; c.lineWidth = 4; c.lineCap = "round";
      c.beginPath(); c.arc(px, py - 26, 7, 0, 6.28); c.stroke();
      c.beginPath();
      c.moveTo(px, py - 18); c.lineTo(px, py - 8);
      c.moveTo(px, py - 16); c.lineTo(px - 8 + run, py - 20);
      c.moveTo(px, py - 16); c.lineTo(px + 8 - run, py - 20);
      c.moveTo(px, py - 8); c.lineTo(px - run, py);
      c.moveTo(px, py - 8); c.lineTo(px + run, py);
      c.stroke(); c.lineCap = "butt";
      if (g.won) { rct(c, g.end, g.ground - 60, 4, 60, "#39d353"); }
      c.restore();
      txt(c, HOP_LEVELS[g.li].n + "  " + (g.li + 1) + "/" + HOP_LEVELS.length + "   HOLD TO JUMP HIGHER", 8, 16, 10, "#2a3a4a");
      txt(c, "SPACE OR CLICK TO JUMP. HOLD IT IN THE AIR TO JUMP HIGHER.", 8, g.h - 8, 8, "#3a5a6a");
      if (g.dead) txt(c, "R TO RUN AGAIN", g.w / 2, g.h / 2, 16, "#b03030", "center");
      if (g.won) txt(c, "LEVEL CLEAR. SPACE.", g.w / 2, g.h / 2, 14, "#2a7a3a", "center");
    },
    score: 0
  };

  /* -------------------------------------------------------------------
     2.10 SWITCH  (colour gates. one button. instant readability)
     ------------------------------------------------------------------- */
  var gSwi = {
    id: "switch", name: "COLOUR SWITCH", year: "2011", w: 480, h: 260,
    desc: "you run and you are a colour. click to be a different colour. match the wall or be a wall.",
    init: function (g) {
      g.x = 40; g.y = g.h - 46; g.col = 0; g.spd = 130; g.score = 0; g.dead = 0;
      g.gates = []; g.coins = [];
      for (var i = 0; i < 30; i++) {
        g.gates.push({ x: 300 + i * 130, col: irnd(3), h: 60 + irnd(60), passed: 0 });
      }
      for (var k = 0; k < 60; k++) g.coins.push({ x: 260 + k * 90, got: 0 });
    },
    update: function (g, dt) {
      if (g.dead) return;
      g.x += g.spd * dt;
      g.spd = Math.min(320, g.spd + 2.5 * dt);
      var cols = ["#e0483a", "#3a7de0", "#e0c23a"];
      for (var i = 0; i < g.gates.length; i++) {
        var gt = g.gates[i];
        if (gt.x < g.x - 20) continue;
        if (gt.x < g.x + 8 && gt.x > g.x - 8) {
          if (gt.col !== g.col) { g.dead = 1; g.bestNow = Math.max(g.bestNow || 0, g.score); SFX.die(); return; }
          gt.passed = 1; SFX.blip();
        }
      }
      for (var k = 0; k < g.coins.length; k++) {
        var cn = g.coins[k];
        if (cn.got) continue;
        if (Math.abs(cn.x - g.x) < 12) { cn.got = 1; g.score += 5; SFX.coin(); }
      }
      g.score = Math.max(g.score, Math.floor(g.x / 4));
      g.dist = g.x;
    },
    tap: function (g) { if (g.dead) { g.init(g); g.x = 40; g.dead = 0; return; } g.col = (g.col + 1) % 3; SFX.blip(); },
    key: function (g, k) { if (k === " " || k === "arrowup" || k === "w" || k === "r") g.tap(g); },
    draw: function (g, c) {
      var cols = ["#e0483a", "#3a7de0", "#e0c23a"];
      rct(c, 0, 0, g.w, g.h, "#10131a");
      rct(c, 0, g.y + 12, g.w, 8, "#1b2029");
      var cam = clamp(g.x - 70, 0, 100000);
      for (var i = 0; i < g.gates.length; i++) {
        var gt = g.gates[i];
        var x = gt.x - cam;
        if (x < -40 || x > g.w + 40) continue;
        /* the gap is the gap between the block above and the floor */
        rct(c, x, g.y - gt.h + 12, 12, gt.h, cols[gt.col]);
        rct(c, x, g.y + 20, 12, 60, cols[gt.col]);
      }
      for (var k = 0; k < g.coins.length; k++) {
        var cn = g.coins[k];
        var cx = cn.x - cam;
        if (cn.got || cx < -20 || cx > g.w + 20) continue;
        circ(c, cx, g.y - 18, 6, "#ffd94a");
      }
      var px = g.x - cam;
      rct(c, px - 10, g.y - 6, 20, 18, cols[g.col]);
      rct(c, px - 10, g.y - 6, 20, 4, "rgba(255,255,255,0.35)");
      txt(c, "SCORE " + (g.score | 0), 8, 16, 11, "#8892a8");
      txt(c, "CLICK TO SWITCH COLOUR. THE WALL IS NOT BEING SUBTLE.", 8, g.h - 8, 8, "#4a5a6a");
      if (g.dead) {
        rct(c, 0, 0, g.w, g.h, "rgba(0,0,0,0.7)");
        txt(c, "WRONG COLOUR", g.w / 2, g.h / 2, 18, cols[g.col], "center");
        txt(c, "CLICK TO RUN AGAIN", g.w / 2, g.h / 2 + 18, 10, "#8892a8", "center");
      }
    },
    score: 0
  };

  /* -------------------------------------------------------------------
     2.11 DEFEND  (you are the last wall. aliens are very literal)
     ------------------------------------------------------------------- */
  var gDef = {
    id: "defend", name: "DEFEND", year: "2008", w: 480, h: 300,
    desc: "you are in the bunker on the left. they come from the right. click. that is the job.",
    init: function (g) {
      g.aliens = []; g.shots = []; g.booms = [];
      g.wave = 1; g.spawnT = 0.6; g.score = 0; g.hp = 6; g.over = 0;
      g.waveT = 0; g.breather = 1.2; g.alive = 0; g.waveKills = 0;
    },
    spawn: function (g) {
      var r = Math.random();
      var type = r < 0.12 ? "big" : (r < 0.42 ? "runner" : "grunt");
      g.aliens.push({
        x: g.w + 20, y: 200 + rnd(-30, 30), type: type,
        hp: type === "big" ? 5 : (type === "runner" ? 1 : 2),
        spd: type === "big" ? 22 : (type === "runner" ? 62 : 42),
        t: rnd(0, 6), shootT: rnd(1, 3), hit: 0
      });
    },
    update: function (g, dt) {
      if (g.over) return;
      g.waveT += dt;
      /* a wave is a timer, not a queue. clearing the screen used to advance
         the wave instantly, which meant wave 31 inside a minute. */
      if (g.breather > 0) g.breather -= dt;
      g.spawnT -= dt;
      if (g.breather <= 0 && g.spawnT <= 0) {
        g.spawn(g);
        g.alive++;
        g.spawnT = Math.max(0.75, 1.5 - g.wave * 0.07) * rnd(0.75, 1.35);
      }
      if (g.waveT > 22) { g.wave++; g.waveT = 0; g.breather = 2.2; sayWave(g); }
      for (var i = g.aliens.length - 1; i >= 0; i--) {
        var a = g.aliens[i];
        a.hit = Math.max(0, a.hit - dt);
        a.t += dt;
        a.x -= a.spd * dt * (1 + g.wave * 0.05);
        a.shootT -= dt;
        if (a.shootT <= 0 && a.x > 150 && a.x < 400) {
          a.shootT = rnd(3.2, 5.5);
          if (a.type !== "runner") {
            g.booms.push({ x: a.x, y: a.y, vx: -120, vy: rnd(-30, 10), kind: "eb", life: 4 });
          }
        }
        if (a.x < 62) {
          g.hp--;
          g.aliens.splice(i, 1);
          SFX.die();
          if (g.hp <= 0) { g.over = 1; g.bestNow = Math.max(g.bestNow || 0, g.score); }
        }
      }
      for (var s = g.shots.length - 1; s >= 0; s--) {
        var sh = g.shots[s];
        sh.x += 460 * dt;
        var gone = sh.x > g.w + 10;
        for (var k = g.aliens.length - 1; k >= 0 && !gone; k--) {
          var b = g.aliens[k];
          if (circleRect(sh.x, sh.y, 4, b.x - 12, b.y - 18, 24, 36)) {
            b.hp--; b.hit = 0.12; gone = true;
            g.score += 10;
            SFX.hit();
            if (b.hp <= 0) {
              g.aliens.splice(k, 1);
              g.score += b.type === "big" ? 100 : 20;
              SFX.pop();
              for (var p = 0; p < 6; p++) g.booms.push({ x: b.x, y: b.y, vx: rnd(-90, 90), vy: rnd(-140, 20), kind: "p", life: rnd(0.3, 0.7) });
            }
          }
        }
        if (gone) g.shots.splice(s, 1);
      }
      for (var b2 = g.booms.length - 1; b2 >= 0; b2--) {
        var p2 = g.booms[b2];
        p2.x += p2.vx * dt; p2.y += p2.vy * dt;
        if (p2.kind === "eb") p2.vy += 40 * dt;
        p2.life -= dt;
        if (p2.life <= 0 || p2.x < 40) g.booms.splice(b2, 1);
        if (p2.kind === "eb" && p2.x < 92) { g.hp -= 1; g.booms.splice(b2, 1); SFX.die(); if (g.hp <= 0) g.over = 1; }
      }
    },
    tap: function (g, x, y) {
      if (g.over) { g.init(g); return; }
      g.shots.push({ x: 86, y: clamp(y, 20, g.h - 20) });
      SFX.shoot();
    },
    key: function (g, k) {
      if (g.over && (k === " " || k === "enter" || k === "r")) g.init(g);
    },
    draw: function (g, c) {
      rct(c, 0, 0, g.w, g.h, "#0a0d13");
      /* night sky + a moon, because it is a siege */
      rct(c, 0, 0, g.w, 120, "#141b2a");
      circ(c, 400, 44, 14, "#e8e2c0");
      rct(c, 0, 210, g.w, g.h - 210, "#1c2028");
      /* the bunker */
      rct(c, 20, 160, 60, 120, "#3b4453");
      rct(c, 20, 160, 60, 8, "#586375");
      rct(c, 40, 190, 20, 24, "#0a0d13");
      for (var h = 0; h < 5; h++) rct(c, 26 + h * 11, 232, 8, 10, h < g.hp ? "#39d353" : "#2a3030");
      for (var i = 0; i < g.aliens.length; i++) {
        var a = g.aliens[i];
        var col = a.hit > 0 ? "#ffffff" : (a.type === "big" ? "#b040e0" : a.type === "runner" ? "#e0d23a" : "#5ad06a");
        var s = a.type === "big" ? 1.6 : (a.type === "runner" ? 0.8 : 1);
        var bob = Math.sin(a.t * 8) * 3;
        circ(c, a.x, a.y + bob, 12 * s, col);
        rct(c, a.x - 9 * s, a.y + 8 * s + bob, 18 * s, 10 * s, col);
        rct(c, a.x - 7 * s, a.y - 2 * s + bob, 4 * s, 3 * s, "#0a0d13");
        rct(c, a.x + 3 * s, a.y - 2 * s + bob, 4 * s, 3 * s, "#0a0d13");
        if (a.hp > 1) for (var q = 0; q < a.hp - 1; q++) rct(c, a.x - 8 * s + q * 7, a.y - 20 * s, 5, 3, "#ff5050");
      }
      for (var k = 0; k < g.booms.length; k++) {
        var p = g.booms[k];
        circ(c, p.x, p.y, p.kind === "eb" ? 5 : 3, p.kind === "eb" ? "#ff6a4a" : "#5ad06a");
      }
      for (var s2 = 0; s2 < g.shots.length; s2++) {
        rct(c, g.shots[s2].x, g.shots[s2].y - 1, 10, 3, "#ffd94a");
      }
      /* the gunner, aiming where you clicked */
      c.strokeStyle = "#8b95a8"; c.lineWidth = 4; c.lineCap = "round";
      c.beginPath(); c.moveTo(62, 210); c.lineTo(88, g.my ? g.my : 200); c.stroke(); c.lineCap = "butt";
      txt(c, "DEFEND", 8, 18, 12, "#5ad06a");
      txt(c, "SCORE " + (g.score | 0) + "    WAVE " + g.wave, 8, 32, 9, "#8892a8");
      txt(c, "CLICK TO SHOOT. AIM WITH THE MOUSE. THEY WILL GET THROUGH.", 8, g.h - 8, 8, "#4a5a6a");
      if (g.over) {
        rct(c, 0, 0, g.w, g.h, "rgba(0,0,0,0.72)");
        txt(c, "THE BUNKER IS GONE", g.w / 2, g.h / 2, 18, "#ff5050", "center");
        txt(c, "CLICK OR SPACE TO HOLD IT AGAIN", g.w / 2, g.h / 2 + 18, 10, "#8892a8", "center");
      }
      if (g.waveT > 20 && g.aliens.length === 0) {
        txt(c, "WAVE " + g.wave, g.w / 2, 120, 22, "#39d353", "center");
      }
    },
    score: 0
  };
  function sayWave(g) { SFX.win(); }

  /* -------------------------------------------------------------------
     2.12 SLING  (two sticks and a bag of bricks. everyone did this by 2010)
     ------------------------------------------------------------------- */
  var SLING_LEVELS = [
    { blocks: [[3, 0, "wood"], [2, 1, "wood"], [3, 1, "glass"], [4, 1, "wood"], [3, 2, "wood"], [2, 2, "glass"]], target: [3, 3] },
    { blocks: [[2, 0, "wood"], [3, 0, "wood"], [2, 1, "glass"], [3, 1, "glass"], [4, 1, "wood"], [2, 2, "wood"], [3, 2, "wood"], [4, 2, "wood"]], target: [3, 3] },
    { blocks: [[2, 0, "wood"], [3, 0, "wood"], [4, 0, "glass"], [2, 1, "glass"], [3, 1, "wood"], [4, 1, "wood"], [2, 2, "wood"], [3, 2, "wood"], [4, 2, "glass"], [3, 3, "wood"]], target: [5, 3] }
  ];

  var gSling = {
    id: "sling", name: "SLING", year: "2010", w: 480, h: 320,
    desc: "drag the sling, let go, knock the tower down. the glass is there to be enjoyed, not respected.",
    init: function (g) { g.load(g, 0); },
    load: function (g, i) {
      g.li = i;
      var L = SLING_LEVELS[i];
      g.blocks = L.blocks.map(function (b) {
        return { x: 250 + b[0] * 26, y: 250 - (b[1] + 1) * 24, w: 24, h: 22, kind: b[2], hp: b[2] === "glass" ? 1 : 3, vx: 0, vy: 0, dead: 0 };
      });
      g.balls = [];
      g.ammo = 3;
      g.drag = null;
      g.score = i * 1000;
      g.won = 0; g.over = 0;
    },
    press: function (g, x, y) {
      if (g.over) { g.load(g, g.li); return; }
      if (g.won) { g.load(g, Math.min(SLING_LEVELS.length - 1, g.li + 1)); return; }
      if (Math.hypot(x - 70, y - 250) < 46) g.drag = { x: 70, y: 250, x2: x, y2: y };
    },
    dragMove: function (g, x, y) { if (g.drag) { g.drag.x2 = x; g.drag.y2 = y; } },
    release: function (g) {
      if (!g.drag) return;
      var dx = g.drag.x - g.drag.x2, dy = g.drag.y - g.drag.y2;
      if (Math.hypot(dx, dy) > 8 && g.ammo > 0) {
        g.ammo--;
        g.balls.push({ x: g.drag.x2, y: g.drag.y2, vx: dx * 5.5, vy: dy * 5.5, r: 9, life: 12, rolling: 0 });
        SFX.whoosh();
      }
      g.drag = null;
    },
    update: function (g, dt) {
      if (g.over) return;
      for (var i = g.balls.length - 1; i >= 0; i--) {
        var b = g.balls[i];
        b.vy += 900 * dt;
        b.x += b.vx * dt; b.y += b.vy * dt;
        /* the floor. bounce ONCE on impact, then roll. bouncing every frame
           is how the ball used to kill itself in half a second. */
        if (b.y + b.r >= 300) {
          b.y = 300 - b.r;
          if (b.vy > 0) { b.vy = -b.vy * 0.42; SFX.thud(); }
          if (Math.abs(b.vy) < 46) { b.rolling = 1; b.vy = 0; }
          b.vx *= 0.995;
        }
        if (b.rolling) b.vy = 0;
        if (b.x < b.r) { b.x = b.r; b.vx *= -0.5; b.rolling = 0; }
        if (b.x > g.w - b.r) { b.x = g.w - b.r; b.vx *= -0.5; b.rolling = 0; }
        var hitAny = false;
        for (var k = g.blocks.length - 1; k >= 0; k--) {
          var bl = g.blocks[k];
          if (bl.dead) continue;
          if (circleRect(b.x, b.y, b.r, bl.x, bl.y, bl.w, bl.h)) {
            hitAny = true;
            bl.hp -= Math.min(2, Math.ceil(Math.abs(b.vx) / 120) + 1);
            g.score += bl.kind === "glass" ? 25 : 10;
            b.vx *= -0.45; b.vy = -Math.abs(b.vy) * 0.3;
            /* shove the block a bit. nobody simulates this properly. */
            bl.vx += b.vx * 0.18; bl.vy -= 30;
            SFX.hit();
            if (bl.hp <= 0) {
              bl.dead = 1; g.score += 20;
              for (var p = 0; p < (bl.kind === "glass" ? 9 : 4); p++) {
                g.balls.push({ x: bl.x + rnd(0, 24), y: bl.y + rnd(0, 22), vx: rnd(-120, 120), vy: rnd(-260, -40), r: 2.5, shard: 1, life: 1.4, rolling: 0 });
              }
              SFX.pop();
            }
          }
        }
        /* a stone that has stopped moving is a stone that is not a problem
           any more. shards live until they leave the room. */
        if (!b.shard && !b.rolling && Math.hypot(b.vx, b.vy) < 26 && b.life < 6) g.balls.splice(i, 1);
        if (b.shard && (b.y > 340 || b.life < 0)) g.balls.splice(i, 1);
      }
      /* blocks fall and stack (loosely) */
      for (var m = g.blocks.length - 1; m >= 0; m--) {
        var b2 = g.blocks[m];
        if (b2.dead) { g.blocks.splice(m, 1); continue; }
        b2.vy += 900 * dt;
        b2.x += b2.vx * dt; b2.y += b2.vy * dt;
        b2.vx *= 0.99;
        if (b2.y + b2.h > 300) { b2.y = 300 - b2.h; b2.vy = 0; b2.vx *= 0.8; }
        for (var n = 0; n < g.blocks.length; n++) {
          var o = g.blocks[n];
          if (o === b2 || o.dead) continue;
          if (overlap(b2.x, b2.y, b2.w, b2.h, o.x, o.y, o.w, o.h)) {
            if (b2.vy > 0 && b2.y + b2.h - o.y < 26) { b2.y = o.y - b2.h; b2.vy = 0; }
            else if (b2.vx > 0) b2.x = o.x - b2.w;
            else if (b2.vx < 0) b2.x = o.x + o.w;
          }
        }
        if (b2.x < 0) { b2.x = 0; b2.vx = 0; }
        if (b2.x > g.w - b2.w) { b2.x = g.w - b2.w; b2.vx = 0; }
        b2.vx = clamp(b2.vx, -260, 260);
      }
      if (!g.blocks.length) {
        if (g.li >= SLING_LEVELS.length - 1) { g.won = 1; g.score += 500; SFX.win(); }
        else { g.won = 1; SFX.win(); }
      } else if (!g.balls.length && g.ammo <= 0 && g.blocks.length) {
        g.over = 1; SFX.die();
      }
      g.score = g.score;
    },
    draw: function (g, c) {
      rct(c, 0, 0, g.w, g.h, "#bcd8e8");
      circ(c, 400, 50, 18, "#f0e8c0");
      rct(c, 0, 300, g.w, 20, "#7cb04a");
      rct(c, 0, 300, g.w, 4, "#8fd05a");
      for (var h = 0; h < 6; h++) {
        c.fillStyle = "rgba(255,255,255,0.7)";
        c.beginPath();
        c.ellipse(60 + h * 90, 40 + (h % 3) * 22, 26, 9, 0, 0, 6.28);
        c.fill();
      }
      /* the sling */
      c.strokeStyle = "#6b4a2c"; c.lineWidth = 5;
      c.beginPath();
      c.moveTo(70, 300); c.lineTo(58, 268); c.lineTo(70, 236);
      c.moveTo(70, 300); c.lineTo(82, 268); c.lineTo(70, 236);
      c.stroke();
      if (g.drag) {
        c.strokeStyle = "#4a3a22"; c.lineWidth = 3;
        c.beginPath(); c.moveTo(58, 268); c.lineTo(g.drag.x2, g.drag.y2); c.lineTo(82, 268); c.stroke();
        circ(c, g.drag.x2, g.drag.y2, 9, "#8a8f98");
      }
      for (var i = 0; i < g.blocks.length; i++) {
        var b = g.blocks[i];
        rct(c, b.x, b.y, b.w, b.h, b.kind === "glass" ? "#8fd8e8" : "#b9834a");
        rct(c, b.x, b.y, b.w, 4, b.kind === "glass" ? "#d8f4ff" : "#d6a068");
        if (b.kind === "glass") {
          c.strokeStyle = "rgba(255,255,255,0.6)"; c.lineWidth = 1;
          c.beginPath(); c.moveTo(b.x + 4, b.y + b.h - 4); c.lineTo(b.x + b.w - 4, b.y + 4); c.stroke();
        }
      }
      for (var k = 0; k < g.balls.length; k++) {
        var s = g.balls[k];
        circ(c, s.x, s.y, s.r, s.shard ? "#bfe8f4" : "#6b6f78");
      }
      txt(c, "SLING", 8, 18, 12, "#3a4a5a");
      txt(c, "AMMO " + g.ammo, 8, 32, 10, "#3a4a5a");
      txt(c, "DRAG THE STONE, LET GO. SPACE ALSO FIRES STRAIGHT UP.", 8, g.h - 8, 8, "#3a5a6a");
      if (g.over) {
        rct(c, 0, 0, g.w, g.h, "rgba(0,0,0,0.6)");
        txt(c, "OUT OF STONES", g.w / 2, g.h / 2, 18, "#fff", "center");
        txt(c, "CLICK TO TRY THE LEVEL AGAIN", g.w / 2, g.h / 2 + 18, 10, "#ccc", "center");
      }
      if (g.won) {
        rct(c, 0, 0, g.w, g.h, "rgba(0,0,0,0.55)");
        txt(c, "TOWER DOWN", g.w / 2, g.h / 2 - 8, 20, "#ffe27a", "center");
        txt(c, g.li >= SLING_LEVELS.length - 1 ? "THAT WAS THE LAST ONE. CLICK TO SEE THE SCORE." : "CLICK FOR THE NEXT TOWER", g.w / 2, g.h / 2 + 16, 10, "#fff", "center");
      }
    },
    key: function (g, k) {
      if (g.over || g.won) { if (k === " " || k === "enter" || k === "r") g.load(g, g.over ? g.li : Math.min(SLING_LEVELS.length - 1, g.li + 1)); return; }
      if (k === " ") { if (g.ammo > 0) { g.ammo--; g.balls.push({ x: 70, y: 250, vx: 320, vy: -300, r: 9 }); SFX.whoosh(); } }
    },
    score: 0
  };

  var DEFS = [gSand, gLiner, gBlox, gUni, gGrav, gFlop, gBricks, gNood, gHop, gSwi, gDef, gSling];

  /* ===================================================================
     3. THE SHELL: loop, score, chrome, menu, input
     =================================================================== */
  var VW = 480, VH = 300;
  var cv, ctx, frameCv, fctx, vig;
  var P = { mode: "boot", idx: -1, g: null, best: 0, finished: 0, hover: -1, t: 0 };
  var thumbCvs = [];

  /* a game is a bag of methods and a bag of numbers. copy the methods off the
     definition, reset the numbers, hand it over. */
  function blank(def) {
    var g = {};
    for (var k in def) g[k] = def[k];
    g.def = def;
    g.id = def.id;
    g.w = def.w; g.h = def.h;
    g.score = 0; g.bestNow = 0;
    g.mx = g.w / 2; g.my = g.h / 2; g.down = false;
    g.keys = {};
    g.t = 0;
    return g;
  }

  function launch(i) {
    P.idx = i;
    P.g = blank(DEFS[i]);
    P.g.init(P.g);
    P.mode = "play";
    P.t = 0;
    try { P.best = parseInt(localStorage.getItem("funnysite.flash." + DEFS[i].id) || "0", 10) || 0; } catch (e) { P.best = 0; }
    fitCanvas();
    hideOverlay();
    if (P.onState) P.onState();
  }

  function toMenu() {
    P.mode = "menu";
    P.g = null;
    P.mapOpen = false;
    fitCanvas();          /* puts the canvas away and the portal back */
    showMenu();
  }

  function fitCanvas() {
    if (!cv) return;
    var def = P.g ? P.g.def : null;
    VW = def ? def.w : 480;
    VH = def ? def.h : 300;
    if (frameCv.width !== VW || frameCv.height !== VH) {
      frameCv.width = VW; frameCv.height = VH;
      img = fctx.createImageData(VW, VH);
      buf = new Uint32Array(img.data.buffer);
    }
    cv.width = VW; cv.height = VH;
    vig = null;
    if (cv) cv.style.display = (P.mode === "play") ? "block" : "none";
    if (stageEl) stageEl.className = (P.mode === "play") ? "playing" : "";
  }

  var img = null, buf = null;
  var last = 0, acc = 0;

  function frame(ts) {
    requestAnimationFrame(frame);
    if (!last) last = ts;
    var dt = Math.min(0.05, (ts - last) / 1000);
    last = ts;

    if (P.mode === "menu" || P.mode === "boot") { drawMenuStage(ts); return; }
    if (!P.g) { toMenu(); return; }

    var g = P.g;
    g.t += dt;
    P.t += dt;
    /* the game runs on a fixed 60hz accumulator so physics does not care
         whether your monitor is 60 or 144 */
    acc += dt;
    var steps = 0;
    while (acc >= 1 / 60 && steps < 4) {
      acc -= 1 / 60; steps++;
      try { g.update(g, 1 / 60); } catch (e) { g.dead = 1; console.error(e); }
    }

    fctx.fillStyle = "#000";
    fctx.fillRect(0, 0, VW, VH);
    ctx.clearRect(0, 0, VW, VH);
    try { g.draw(g, ctx); } catch (e) { txt(ctx, "this game fell over: " + e.message, 10, 20, 10, "#f66"); console.error(e); }
    drawChrome(g);
  }

  function drawChrome(g) {
    /* scanlines + vignette, because every flash game had a CRT */
    if (!vig || vig.width !== VW) {
      vig = document.createElement("canvas");
      vig.width = VW; vig.height = VH;
      var vg = vig.getContext("2d");
      var grd = vg.createRadialGradient(VW / 2, VH / 2, VH * 0.3, VW / 2, VH / 2, VH * 1.0);
      grd.addColorStop(0, "rgba(0,0,0,0)");
      grd.addColorStop(1, "rgba(0,0,0,0.42)");
      vg.fillStyle = grd; vg.fillRect(0, 0, VW, VH);
      vg.fillStyle = "rgba(0,0,0,0.10)";
      for (var y = 0; y < VH; y += 3) vg.fillRect(0, y, VW, 1);
    }
    ctx.drawImage(vig, 0, 0);
    /* the top strip: score, best, and where to go back to */
    rct(ctx, 0, 0, VW, 13, "rgba(0,0,0,0.55)");
    txt(ctx, g.def.name, 5, 10, 9, "#d8dde6");
    if (g.score || g.best) {
      txt(ctx, "SCORE " + (g.score | 0), VW / 2, 10, 9, "#ffd94a", "center");
      txt(ctx, "BEST " + P.best, VW - 5, 10, 9, "#8892a8", "right");
    }
  }

  /* twelve played. there is a reward and the reward is that somebody noticed. */
  function checkAllPlayed() {
    if (P.eggDone) return;
    var n = updatePlayedCount();
    if (n >= DEFS.length && FS.unlock) {
      P.eggDone = true;
      FS.unlock("flash", {
        rain: "12/12",
        say: "<b>all twelve of them.</b> there was no button for that. there has never been " +
             "a button for that, on any of these, anywhere, ever. you just went and played them."
      });
      if (FS.rain) FS.rain("TOAST");
    }
  }

  function saveBest() {
    if (!P.g) return;
    var key = "funnysite.flash." + P.g.id;
    var s = Math.max(P.g.score | 0, P.g.bestNow | 0);
    var had = null;
    try { had = localStorage.getItem(key); } catch (e) {}
    if (s > P.best || had === null) {
      /* even a zero gets written, because "i opened it once and immediately
         died" is still the difference between played and never played. */
      P.best = Math.max(s, P.best);
      try { localStorage.setItem(key, String(Math.max(s, P.best))); } catch (e) {}
    }
    P.g.bestNow = 0;
    checkAllPlayed();
  }

  /* ---- input ---- */
  function initInput() {
    window.addEventListener("keydown", function (e) {
      var k = e.key.toLowerCase();
      if (P.mode !== "play" || !P.g) return;
      if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", "r", "enter"].indexOf(k) >= 0) e.preventDefault();
      if (P.g.keys[k]) return;
      P.g.keys[k] = 1;
      if (k === "escape") { saveBest(); toMenu(); return; }
      if (k === "r") saveBest();      /* restarting should not throw away a run */
      if (k === "m") { MUTED = !MUTED; return; }
      if (P.g.key) P.g.key(P.g, k);
    });
    window.addEventListener("keyup", function (e) { if (P.g) P.g.keys[e.key.toLowerCase()] = 0; });
    window.addEventListener("blur", function () {
      if (!P.g) return;
      P.g.keys = {}; P.g.down = 0;
      saveBest();
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden && P.g) saveBest();
    });

    cv.addEventListener("mousedown", function (e) {
      if (P.mode !== "play" || !P.g) return;
      e.preventDefault();
      actx();
      var r = cv.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width * VW;
      var y = (e.clientY - r.top) / r.height * VH;
      P.g.down = 1; P.g.mx = x; P.g.my = y;
      if (P.g.press) P.g.press(P.g, x, y);
      if (P.g.tap) P.g.tap(P.g, x, y);
    });
    window.addEventListener("mouseup", function () {
      if (!P.g) return;
      P.g.down = 0;
      if (P.g.release) P.g.release(P.g, P.g.mx, P.g.my);
    });
    window.addEventListener("mousemove", function (e) {
      if (!P.g || P.mode !== "play") return;
      var r = cv.getBoundingClientRect();
      P.g.mx = (e.clientX - r.left) / r.width * VW;
      P.g.my = (e.clientY - r.top) / r.height * VH;
      if (P.g.dragMove) P.g.dragMove(P.g, P.g.mx, P.g.my);
      if (P.g.mouse) P.g.mouse(P.g, P.g.mx, P.g.my, P.g.down, e.button === 2);
    });
    cv.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    cv.addEventListener("touchstart", function (e) {
      if (!P.g) return;
      e.preventDefault();
      var t = e.touches[0], r = cv.getBoundingClientRect();
      P.g.mx = (t.clientX - r.left) / r.width * VW;
      P.g.my = (t.clientY - r.top) / r.height * VH;
      P.g.down = 1;
      if (P.g.tap) P.g.tap(P.g, P.g.mx, P.g.my);
    }, { passive: false });
    cv.addEventListener("touchmove", function (e) {
      if (!P.g) return;
      e.preventDefault();
      var t = e.touches[0], r = cv.getBoundingClientRect();
      P.g.mx = (t.clientX - r.left) / r.width * VW;
      P.g.my = (t.clientY - r.top) / r.height * VH;
      if (P.g.dragMove) P.g.dragMove(P.g, P.g.mx, P.g.my);
    }, { passive: false });
    cv.addEventListener("touchend", function (e) {
      if (!P.g) return;
      e.preventDefault();
      P.g.down = 0;
      if (P.g.release) P.g.release(P.g, P.g.mx, P.g.my);
    }, { passive: false });
  }

  /* ---- the portal / menu ---- */
  var portal, stageEl, ovEl;

  function showMenu() {
    if (!ovEl) return;
    ovEl.style.display = "flex";
    ovEl.innerHTML =
      '<div class="fltitle">THE FLASH ERA</div>' +
      '<div class="flsmall">TWELVE GAMES. NO PLUG-INS. NO .SWF FILES. NO WAITING FOR IT.<br>' +
      'EVERY ONE OF THESE IS A RUDE IMPRESSION OF SOMETHING THAT EXISTED. NONE OF THEM ARE THE THING.</div>' +
      '<div class="flbtns">' +
      '<button class="btn2000" id="f-random">&#127922; PLAY A RANDOM ONE</button> ' +
      '<button class="btn2000" id="f-all">&#10003; MARK ALL PLAYED</button>' +
      "</div>" +
      '<div class="flgrid" id="f-grid"></div>' +
      '<div class="flsmall">PLAYED: <b id="f-played">0</b>/12 &middot; best scores live in your browser &middot; ' +
      'ESC goes back to the portal &middot; M mutes (it is 4 sounds)</div>';
    var grid = document.getElementById("f-grid");
    thumbCvs = [];
    DEFS.forEach(function (def, i) {
      var best = 0;
      try { best = parseInt(localStorage.getItem("funnysite.flash." + def.id) || "0", 10) || 0; } catch (e) {}
      var card = document.createElement("div");
      card.className = "flcard";
      card.innerHTML =
        '<div class="flthumb"><canvas width="160" height="100"></canvas><span class="flload">LOADING…</span></div>' +
        '<div class="flname">' + def.name + ' <span class="flyear">' + def.year + "</span></div>" +
        '<div class="fldesc">' + def.desc + "</div>" +
        '<div class="flbest">' + (best ? "BEST " + best : "NOT PLAYED YET") + "</div>";
      card.addEventListener("click", function () { launch(i); });
      card.addEventListener("mouseenter", function () { P.hover = i; });
      card.addEventListener("mouseleave", function () { if (P.hover === i) P.hover = -1; });
      grid.appendChild(card);
      thumbCvs.push(card.querySelector("canvas"));
      var spin = setTimeout(function () {
        var bar = card.querySelector(".flload");
        if (bar) bar.parentNode.removeChild(bar);
        card.classList.add("flready");
        paintThumb(i, thumbCvs[i]);
      }, 120 + i * 45);   /* the loading bar. every single one of them had one */
    });
    checkAllPlayed();
    document.getElementById("f-random").addEventListener("click", function () { launch(irnd(DEFS.length)); });
    document.getElementById("f-all").addEventListener("click", function () {
      /* no cheat here. play them. it is twelve games, they are small, that is
         the entire appeal of the era. */
      SFX.nope ? SFX.nope() : SFX.hit();
      flashNote("there is no button for that. there is no button for that anywhere.");
    });
    updatePlayedCount();
  }

  function updatePlayedCount() {
    var n = 0;
    for (var i = 0; i < DEFS.length; i++) {
      try { if (localStorage.getItem("funnysite.flash." + DEFS[i].id)) n++; } catch (e) {}
    }
    var el = document.getElementById("f-played");
    if (el) el.textContent = n;
    return n;
  }

  function flashNote(msg) {
    var d = document.createElement("div");
    d.className = "fs-say";
    d.innerHTML = msg;
    document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, 3600);
  }

  /* thumbnails: one frame of the real game, at card size */
  function paintThumb(i, canvas) {
    if (!canvas) return;
    var def = DEFS[i];
    var g = blank(def);
    g.w = 160; g.h = 100;
    try { g.init(g); } catch (e) { return; }
    for (var s = 0; s < 30; s++) { try { g.update(g, 1 / 30); } catch (e) {} }
    var c = canvas.getContext("2d");
    c.save();
    c.scale(160 / def.w, 100 / def.h);
    c.fillStyle = "#000"; c.fillRect(0, 0, def.w, def.h);
    try { g.draw(g, c); } catch (e) {}
    c.restore();
  }

  var liveThumbs = [];
  function drawMenuStage(ts) {
    /* nothing to render in the stage behind the portal, but we still run the
       loop so that the card you are pointing at comes alive. */
    if (P.hover >= 0 && thumbCvs[P.hover]) {
      P.hoverT = (P.hoverT || 0) + 1;
      if (P.hoverT % 3 === 0) paintThumbLive(P.hover, thumbCvs[P.hover]);
    }
  }
  function paintThumbLive(i, canvas) {
    var def = DEFS[i];
    var g = liveThumbs[i];
    if (!g) {
      g = blank(def);
      g.w = 160; g.h = 100;
      try { g.init(g); } catch (e) { liveThumbs[i] = false; return; }
      liveThumbs[i] = g;
      for (var w = 0; w < 30; w++) { try { g.update(g, 1 / 30); } catch (e) {} }
    }
    if (!g) return;
    /* hold it down a little, so the preview has something to show */
    g.down = true; g.mx = 80; g.my = 40;
    try { g.update(g, 1 / 30); } catch (e) {}
    var c = canvas.getContext("2d");
    c.save();
    c.scale(160 / def.w, 100 / def.h);
    c.fillStyle = "#000"; c.fillRect(0, 0, def.w, def.h);
    try { g.draw(g, c); } catch (e) {}
    c.restore();
  }

  function hideOverlay() {
    if (!ovEl) return;
    ovEl.style.display = "none";
    ovEl.innerHTML = "";
  }

  /* ---- public-ish surface ---- */
  function boot() {
    if (!document.getElementById("fl-cv")) return;
    cv = document.getElementById("fl-cv");
    ctx = cv.getContext("2d");
    frameCv = document.createElement("canvas");
    fctx = frameCv.getContext("2d");
    portal = document.getElementById("fl-portal");
    stageEl = document.getElementById("fl-stage");
    ovEl = document.getElementById("fl-overlay");
    initInput();
    toMenu();
    requestAnimationFrame(frame);
  }

  window.FLASH = {
    boot: boot,
    launch: launch,
    menu: toMenu,
    games: DEFS.map(function (d) { return { id: d.id, name: d.name, year: d.year, desc: d.desc }; }),
    /* the console gets a door, like it does in the 3d one */
    dev: {
      current: function () { return P.g; },
      launch: launch,
      menu: toMenu
    },
    /* a smoke test, because twelve games is a lot of untested code and i
       would rather find the crash now than in front of a visitor */
    smoke: function (frames) {
      frames = frames || 240;
      var out = [];
      for (var i = 0; i < DEFS.length; i++) {
        var g = blank(DEFS[i]);
        var err = null;
        try {
          g.init(g);
          for (var f = 0; f < frames; f++) {
            g.mx = g.w * (0.2 + 0.6 * Math.random());
            g.my = g.h * (0.2 + 0.6 * Math.random());
            g.down = (f % 7) < 3;
            g.update(g, 1 / 60);
            if (f % 23 === 0) {
              [" ", "arrowleft", "arrowright", "arrowup", "arrowdown", "r"].forEach(function (k) {
                try { g.key && g.key(g, k); } catch (e) { throw e; }
              });
              try { g.tap && g.tap(g, g.mx, g.my); } catch (e) { throw e; }
            }
            if (f === frames - 1) {
              var c = document.createElement("canvas");
              c.width = g.w; c.height = g.h;
              g.draw(g, c.getContext("2d"));
            }
          }
        } catch (e) { err = e.message + " @ " + (e.stack || "").split("\n")[1]; }
        out.push({ id: DEFS[i].id, err: err, score: g.score | 0 });
      }
      return out;
    }
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
