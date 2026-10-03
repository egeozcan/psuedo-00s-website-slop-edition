#!/usr/bin/env python3
"""
_build/games.py -- the arcade. 9 games, all hand-rolled, all playable.
(the 9th one is a raycaster. its engine is game-3d.js, hand-written,
because 2000 lines of raycasting inside a python string felt wrong.)

Run:  python3 _build/games.py      (or just: python3 _build/build.py)
"""

import os, sys, textwrap

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build import chrome, PAGES, ROOT, page  # noqa: E402

GAME_CSS = r"""
<style>
.gwrap { background:#c0c0c0; border-top:2px solid #fff; border-left:2px solid #fff;
         border-bottom:2px solid #404040; border-right:2px solid #404040; padding:6px; }
canvas { display:block; image-rendering:pixelated; background:#000; border:2px inset #555; }
.hud { display:flex; gap:6px; align-items:center; flex-wrap:wrap; font-family:"Courier New",monospace;
       font-size:12px; background:#000; color:#00ff41; padding:4px 6px; margin-bottom:6px; }
.hud b { color:#ffff00; }
.cell { width:18px; height:18px; line-height:16px; text-align:center; font-family:"Courier New",monospace;
        font-size:12px; font-weight:bold; float:left; cursor:pointer; user-select:none;
        background:#c0c0c0; border-top:2px solid #fff; border-left:2px solid #fff;
        border-bottom:2px solid #808080; border-right:2px solid #808080; }
.cell.open { background:#b0b0b0; border:1px solid #808080; cursor:default; }
.cell.boom { background:#ff0000; }
.cell.flag { color:#ff0000; }
.n1{color:#0000ff}.n2{color:#008000}.n3{color:#ff0000}.n4{color:#000080}
.n5{color:#800000}.n6{color:#008080}.n7{color:#000}.n8{color:#808080}
.tile { width:60px; height:60px; line-height:58px; text-align:center; font-size:30px; float:left;
        margin:3px; cursor:pointer; user-select:none; color:#ffd700;
        background:#2222aa; border-top:3px solid #6666ff; border-left:3px solid #6666ff;
        border-bottom:3px solid #111166; border-right:3px solid #111166; }
.tile.down { background:#333388; color:#333388; border-top-color:#111166; border-left-color:#111166;
        border-bottom-color:#6666ff; border-right-color:#6666ff; }
.big { font-family:"Comic Sans MS",cursive; font-size:40px; color:#00ff41; min-height:48px; }

/* ---- the raycaster. it needed its own bits. ---- */
#rc-stage { position:relative; line-height:0; background:#000; border:2px inset #555; }
#rc-cv { display:block; width:100%; height:auto; image-rendering:pixelated; cursor:crosshair; }
#rc-overlay { position:absolute; inset:0; display:none; flex-direction:column;
              align-items:center; justify-content:center; text-align:center;
              background:rgba(0,0,0,0.88); font-family:"Courier New",monospace;
              color:#00ff41; padding:8px; overflow:auto; line-height:1.45; }
.rctitle { font-size:22px; font-weight:bold; color:#00ff41; letter-spacing:1px;
           text-shadow:2px 2px #003b00; margin-bottom:6px; }
.rcsmall { font-size:11px; line-height:1.5; color:#8effb0; max-width:560px; margin:4px 0; }
.rcbtns { margin:10px 0 4px 0; display:flex; gap:6px; flex-wrap:wrap; justify-content:center; line-height:1.6; }
#rc-overlay input { background:#000; color:#00ff41; border:2px inset #555; padding:4px;
                    font-family:"Courier New",monospace; font-size:14px; text-align:center;
                    text-transform:uppercase; width:180px; }
.rchelp { font-size:10px; display:flex; gap:8px; padding:2px 4px; color:#8effb0;
          border-bottom:1px dotted #0a5c2a; max-width:600px; text-align:left;
          line-height:1.45; }
.rc-key { color:#ffd700; min-width:96px; display:inline-block; }
.rchelpwrap { max-height:196px; overflow:auto; }
#rc-map { position:absolute; left:0; right:0; top:0; bottom:0; margin:auto;
          display:none; image-rendering:pixelated; border:2px solid #2a6a3a;
          background:#000; box-shadow:0 0 0 100vmax rgba(0,0,0,0.55); }
#rc-mm { position:absolute; right:3px; bottom:3px; image-rendering:pixelated;
         opacity:0.88; border:1px solid #2a6a3a; pointer-events:none; }
#rc-log { position:absolute; left:5px; bottom:4px; font-family:"Courier New",monospace;
          font-size:9px; line-height:1.35; text-shadow:1px 1px #000; pointer-events:none;
          max-width:70%; }
.rcbar { height:7px; background:#111; border:1px solid #666; margin-top:2px; }
.rcbar b { display:block; height:100%; }
#rc-hpbar b { background:linear-gradient(90deg,#a01010,#ff4040); }
#rc-arbar b { background:linear-gradient(90deg,#1030a0,#4090ff); }
.rcstat { color:#ffd700; }

/* ---- the flash era ---- */
#fl-stage { position:relative; line-height:0; background:#05070c; border:2px inset #555; }
#fl-cv { display:block; width:100%; height:auto; image-rendering:pixelated; cursor:pointer; }
#fl-overlay { position:relative; display:flex; flex-direction:column;
              align-items:center; justify-content:flex-start; text-align:center;
              background:#05070c; font-family:"Courier New",monospace; padding:10px 8px;
              overflow:visible; line-height:1.45; }
#fl-stage.playing #fl-overlay { position:absolute; inset:0; display:none; overflow:hidden; }
.fltitle { font:bold 26px "Comic Sans MS",cursive; color:#fff; letter-spacing:1px;
           text-shadow:2px 2px #0a2a8a, 4px 4px #000; margin:2px 0 4px 0; }
.flsmall { font-size:10px; color:#9fb0c8; line-height:1.5; margin:2px 0 6px 0; max-width:600px; }
.flbtns { margin:4px 0 8px 0; display:flex; gap:6px; flex-wrap:wrap; justify-content:center; line-height:1.6; }
.flgrid { display:grid; grid-template-columns:repeat(3, 1fr); gap:8px; width:100%; max-width:620px; }
.flcard { background:#0e1420; border:2px solid #1d2a42; padding:5px; cursor:pointer;
          font-family:"Courier New",monospace; transition:border-color .12s, transform .12s; }
.flcard:hover { border-color:#3fa9ff; transform:translateY(-2px); }
.flcard.flready .flload { display:none; }
.flthumb { position:relative; background:#000; border:1px solid #26344e; }
.flthumb canvas { display:block; width:100%; height:auto; image-rendering:pixelated; }
.flload { position:absolute; left:0; bottom:0; right:0; font-size:8px; color:#6fd0ff;
          background:rgba(0,0,0,0.75); text-align:center; padding:1px 0; }
.flname { font-size:10px; color:#ffd94a; margin-top:3px; }
.flyear { color:#5a6a80; font-size:8px; }
.fldesc { font-size:8px; color:#8a9ab0; line-height:1.35; margin-top:2px; min-height:32px; }
.flbest { font-size:8px; color:#4fb845; margin-top:2px; }
@media (max-width:520px) { .flgrid { grid-template-columns:repeat(2,1fr); } }
</style>
"""

HUD = r"""<div class="hud">%s</div>"""


def game(fname, title, hud, body, js, desc):
    page(fname, title, desc, GAME_CSS + body, "<script>\n" + textwrap.dedent(js).strip("\n") + "\n</script>")


# ===========================================================================
# ARCADE INDEX
# ===========================================================================
page("games.html", "GAMES - funnysite",
     "9 games. all of them work. i checked. i am aware of what i am saying.",
     r"""
      <h2>THE ARCADE</h2>
      <p class="note">nine games, and then a whole separate era of small ones. no installs.
      no downloads. no "coming soon" (except the ones that are coming soon, which are
      listed, and there are two).</p>

      <div class="center" style="margin:10px 0">
        <a class="btn2000" href="game-maze.html">&#9642; THE MAZE</a>
        <a class="btn2000" href="game-mines.html">&#9889; MINESWEEPER</a>
        <a class="btn2000" href="game-memory.html">&#9635; MEMORY</a>
        <a class="btn2000" href="game-reaction.html">&#9873; REACTION TEST</a>
        <br><br>
        <a class="btn2000" href="game-sliding.html">&#9638; SLIDING PUZZLE</a>
        <a class="btn2000" href="game-hanoi.html">&#9642; TOWER OF HANOI</a>
        <a class="btn2000" href="game-mind.html">&#129504; MIND READER</a>
        <a class="btn2000" href="game-worm.html">&#128165; ONE BUTTON WORM</a><br><br>
        <a class="btn2000" href="game-3d.html">&#9632; THE RAYCASTER (3D)</a><br>
        <a class="btn2000" href="flash.html">&#9733; THE FLASH ERA (12 GAMES)</a>
      </div>

      <h2>HIGH SCORES (WHICH ARE YOURS, SINCE YOU ARE THE ONLY PLAYER)</h2>
      <table width="100%" cellpadding="4" cellspacing="0" class="bev">
        <tr class="titlebar"><td>GAME</td><td>BEST</td><td>HELD BY</td><td>WHEN</td></tr>
        <tr class="bev-in"><td>THE MAZE</td><td class="mono" id="hs-maze">--:--</td><td class="mono">you</td><td class="mono">recently</td></tr>
        <tr><td>MINESWEEPER (expert)</td><td class="mono" id="hs-mines">999s</td><td class="mono">me, in 2003</td><td class="mono">2003-11-02</td></tr>
        <tr class="bev-in"><td>MEMORY</td><td class="mono" id="hs-memory">-- moves</td><td class="mono">you, probably</td><td class="mono">today</td></tr>
        <tr><td>REACTION TEST</td><td class="mono" id="hs-react">-- ms</td><td class="mono">a person I know</td><td class="mono">unclear</td></tr>
        <tr class="bev-in"><td>SLIDING PUZZLE</td><td class="mono" id="hs-slide">-- moves</td><td class="mono">nobody</td><td class="mono">never</td></tr>
        <tr><td>TOWER OF HANOI</td><td class="mono">2^<i>n</i>-1</td><td class="mono">a monk, allegedly</td><td class="mono">forever</td></tr>
        <tr class="bev-in"><td>MIND READER</td><td class="mono">7/7</td><td class="mono">me</td><td class="mono">every time</td></tr>
        <tr><td>ONE BUTTON WORM</td><td class="mono" id="hs-worm">--</td><td class="mono">a dog I once watched</td><td class="mono">once</td></tr>
        <tr class="bev-in"><td>THE RAYCASTER</td><td class="mono" id="hs-ray">--</td><td class="mono">nobody, yet</td><td class="mono">in the future</td></tr>
      </table>
      <p class="note">scores are stored in <b>your</b> browser. if you clear it, the scores
      are gone forever, and so is the last proof you were ever here.</p>

      <h2>THE GAMES THAT WERE TOO MUCH</h2>
      <div class="sunken" style="padding:8px" class="small">
        <p style="margin:4px 0"><b>THE 3D ONE</b> &mdash; i wrote a raycaster. it worked. it was
        terrifying. it is 1 file and 0 assets. you can see the entire world from inside a
        box. <i>i am not ready to show you.</i> <b>i have since changed my mind. it is the
        button at the top. it is called THE RAYCASTER. it is six levels and a toaster.</b></p>
        <p style="margin:4px 0"><b>THE 2 PLAYER ONE</b> &mdash; two mice, one cursor, a
        shape. that's it. that's the game. it took 6 weeks and it is not fun alone and
        it is <i>extremely</i> fun at 2am. (code is in my head. my head is not available.)</p>
        <p style="margin:4px 0"><b>THE FLYING ONE</b> &mdash; it is a plane game where you cannot
        crash, you can only be mildly embarrassed. <b>COMING SOON</b></p>
        <p style="margin:4px 0"><b>THE TYPING GAME</b> &mdash; it types my sentences at you and
        you type them back. <b>COMING SOON (probably never)</b></p>
      </div>

      <div class="tape">INSERT COIN &middot; NO COIN SLOT &middot; 1 COIN = 1 REGRET</div>
     """,
     r"""
     <script>
     (function () {
       var map = { "hs-maze": "funnysite.maze", "hs-memory": "funnysite.memory",
                   "hs-react": "funnysite.react", "hs-slide": "funnysite.slide",
                   "hs-worm": "funnysite.worm", "hs-ray": "funnysite.raycaster" };
       for (var id in map) {
         var v = localStorage.getItem(map[id]);
         if (v) document.getElementById(id).textContent = v;
       }
     })();
     </script>
     """)


# ===========================================================================
# THE MAZE
# ===========================================================================
game("game-maze.html", "THE MAZE - funnysite",
     "TIME <b id='t'>0.0s</b> &nbsp; BEST <b id='b'>--</b> &nbsp; MOVES <b id='m'>0</b> &nbsp; SIZE <b id='s'>31x23</b>",
     r"""
      <h2>THE MAZE</h2>
      <p class="note">green square = you. red square = the other thing. arrows or WASD to
      move. the arrow keys will scroll this entire website, which is a problem i have
      created for myself, repeatedly.</p>
      <div class="gwrap">
        <div class="hud">
          <span>TIME <b id="t">0.0s</b></span>&nbsp;
          <span>BEST <b id="b">--</b></span>&nbsp;
          <span>MOVES <b id="m">0</b></span>&nbsp;
          <span>GOAL <b>top right, like life</b></span>
        </div>
        <canvas id="cv" width="496" height="368"></canvas>
        <p class="center" style="margin:8px 0 2px 0">
          <button class="btn2000" id="new">NEW MAZE</button>
          <button class="btn2000" id="solve">SOLVE IT FOR ME</button>
          <button class="btn2000" id="bigger">BIGGER MAZE</button>
        </p>
        <p class="note center">the maze regenerates every time. there is no "level 2". there
        is only this maze, forever, again.</p>
      </div>
     """,
     r"""
     var CELL = 16, DX = [0, 0, -1, 1], DY = [-1, 1, 0, 0], BIT = [1, 2, 4, 8];
     var W = 31, H = 23, cells = [], px = 0, py = 0, ex = 30, ey = 0;
     var moves = 0, t0 = 0, timer = null, path = [], walking = null;

     function idx(x, y) { return y * W + x; }

     function generate() {
       cells = [];
       for (var i = 0; i < W * H; i++) cells.push(15);
       var s = idx(0, H - 1);
       cells[s] = 0;
       var stack = [s];
       while (stack.length) {
         var cur = stack[stack.length - 1], x = cur % W, y = (cur / W) | 0, opts = [];
         for (var d = 0; d < 4; d++) {
           var nx = x + DX[d], ny = y + DY[d];
           if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
           if (cells[idx(nx, ny)] === 15) opts.push(d);
         }
         if (!opts.length) { stack.pop(); continue; }
         var pick = opts[(Math.random() * opts.length) | 0];
         var ax = x + DX[pick], ay = y + DY[pick];
         cells[cur] &= ~BIT[pick];
         cells[idx(ax, ay)] &= ~BIT[(pick + 2) % 4];
         stack.push(idx(ax, ay));
       }
       ex = W - 1; ey = 0; px = 0; py = H - 1;
       moves = 0; path = []; walking = null;
       document.getElementById("m").textContent = 0;
     }

     function bfs() {
       var prev = new Int32Array(W * H).fill(-1), seen = new Uint8Array(W * H);
       var q = [idx(px, py)]; seen[q[0]] = 1;
       while (q.length) {
         var cur = q.shift(), x = cur % W, y = (cur / W) | 0;
         if (x === ex && y === ey) break;
         for (var d = 0; d < 4; d++) {
           if (cells[cur] & BIT[d]) continue;
           var nx = x + DX[d], ny = y + DY[d];
           if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
           var ni = idx(nx, ny);
           if (seen[ni]) continue;
           seen[ni] = 1; prev[ni] = cur; q.push(ni);
         }
       }
       var out = [], c = idx(ex, ey);
       while (c !== -1) { out.unshift(c); c = prev[c]; }
       return out;
     }

     function draw() {
       var c = document.getElementById("cv"), g = c.getContext("2d");
       g.fillStyle = "#000"; g.fillRect(0, 0, c.width, c.height);
       g.strokeStyle = "#33ff33"; g.lineWidth = 1;
       g.beginPath();
       for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
         var m = cells[idx(x, y)], x0 = x * CELL, y0 = y * CELL;
         if (m & 1) { g.moveTo(x0, y0); g.lineTo(x0 + CELL, y0); }
         if (m & 8) { g.moveTo(x0 + CELL, y0); g.lineTo(x0 + CELL, y0 + CELL); }
         if (m & 4) { g.moveTo(x0, y0 + CELL); g.lineTo(x0, y0); }
         if (m & 2) { g.moveTo(x0, y0 + CELL); g.lineTo(x0 + CELL, y0 + CELL); }
       }
       g.stroke();
       g.fillStyle = "#ff3333";
       g.fillRect(ex * CELL + 3, ey * CELL + 3, CELL - 6, CELL - 6);
       g.fillStyle = "#33ff33";
       g.fillRect(px * CELL + 3, py * CELL + 3, CELL - 6, CELL - 6);
       if (walking) {
         g.fillStyle = "#0088ff";
         for (var i = 0; i < walking.length; i++) {
           var p = walking[i];
           g.fillRect((p % W) * CELL + 6, ((p / W) | 0) * CELL + 6, 4, 4);
         }
       }
     }

     function startTimer() {
       if (timer) return;
       t0 = Date.now();
       timer = setInterval(function () {
         document.getElementById("t").textContent = ((Date.now() - t0) / 1000).toFixed(1) + "s";
       }, 100);
     }
     function stopTimer() { clearInterval(timer); timer = null; }

     function win() {
       stopTimer();
       var secs = ((Date.now() - t0) / 1000).toFixed(1);
       var best = localStorage.getItem("funnysite.maze");
       if (!best || parseFloat(secs) < parseFloat(best)) {
         localStorage.setItem("funnysite.maze", secs);
         alert("YOU ESCAPED IN " + secs + "s.\n\nnew personal best.\n(the previous best was " + (best || "none, you were the first, of course") + ")\n\npress OK to be mediocre again");
       } else {
         alert("YOU ESCAPED IN " + secs + "s.\n\nbest: " + best + "s\nyou are getting slower. this is a trend.");
       }
       generate(); draw();
     }

     function move(d) {
       if (walking) return;
       startTimer();
       var nx = px + DX[d], ny = py + DY[d];
       if (nx < 0 || ny < 0 || nx >= W || ny >= H) return;
       if (cells[idx(px, py)] & BIT[d]) return;
       px = nx; py = ny; moves++;
       document.getElementById("m").textContent = moves;
       if (px === ex && py === ey) return win();
       draw();
     }

     document.addEventListener("keydown", function (e) {
       var map = { 38: 0, 40: 1, 37: 2, 39: 3, 87: 0, 83: 1, 65: 2, 68: 3 };
       if (map[e.keyCode] !== undefined) { e.preventDefault(); move(map[e.keyCode]); }
     });
     document.getElementById("new").addEventListener("click", function () {
       generate(); draw(); startTimer();
     });
     document.getElementById("bigger").addEventListener("click", function () {
       W = Math.min(W + 8, 39); H = Math.min(H + 6, 29);
       var c = document.getElementById("cv");
       c.width = W * CELL; c.height = H * CELL;
       generate(); draw();
     });
     document.getElementById("solve").addEventListener("click", function () {
       path = bfs(); walking = []; startTimer();
       var i = 0;
       var iv = setInterval(function () {
         if (i >= path.length) { clearInterval(iv); walking = null; win(); return; }
         var p = path[i++];
         walking.push(p); px = p % W; py = (p / W) | 0;
         moves++; document.getElementById("m").textContent = moves;
         draw();
       }, 12);
     });

     var b = localStorage.getItem("funnysite.maze");
     if (b) document.getElementById("b").textContent = b + "s";
     generate(); draw();
     """,
     "a maze. green to red. it regenerates. it always regenerates.")


# ===========================================================================
# MINESWEEPER
# ===========================================================================
game("game-mines.html", "MINESWEEPER - funnysite",
     "",
     r"""
      <h2>MINESWEEPER</h2>
      <p class="note">left click = reveal. right click = flag. the first click is always safe
      (i am not a monster, i checked). click a number with the right number of flags around it
      to open its neighbours. that's "chording" and it's the best feeling in the world.</p>
      <div class="gwrap">
        <div class="hud">
          <span>MINES <b id="left">10</b></span>&nbsp;
          <span>TIME <b id="t">0</b>s</span>&nbsp;
          <span>BEST <b id="b">999</b>s</span>&nbsp;
          <span>STATUS <b id="st">idle</b></span>
        </div>
        <div id="grid" style="width:max-content;background:#808080;padding:3px;overflow:hidden"></div>
        <p class="center" style="margin:8px 0 2px 0">
          <button class="btn2000" data-size="9">9x9 / 10</button>
          <button class="btn2000" data-size="16">16x16 / 40</button>
          <button class="btn2000" data-size="24">EXPERT (do not)</button>
          <button class="btn2000" id="peek">FLAG A RANDOM MINE (CHEAT)</button>
        </p>
      </div>
     """,
     r"""
     var N = 9, MINES = 10, grid = [], started = false, dead = false, won = false, flags = 0, t0 = 0, ti = null;
     var el = document.getElementById("grid"), hudL = document.getElementById("left");

     function reset(n, m) {
       N = n; MINES = m; started = false; dead = false; won = false; flags = 0;
       grid = []; el.innerHTML = ""; hudL.textContent = MINES;
       document.getElementById("st").textContent = "idle";
       clearInterval(ti); document.getElementById("t").textContent = "0";
       for (var y = 0; y < N; y++) {
         var row = document.createElement("div");
         row.style.cssText = "clear:both;line-height:0";
         grid.push([]);
         for (var x = 0; x < N; x++) {
           var c = document.createElement("div");
           c.className = "cell"; c.dataset.x = x; c.dataset.y = y;
           (function (node) {
             node.addEventListener("click", function (e) { if (e.button === 0) click(node, e.shiftKey); });
             node.addEventListener("contextmenu", function (e) { e.preventDefault(); flag(node); });
           })(c);
           row.appendChild(c); grid[y].push({ m: false, n: 0, open: false, flag: false, node: c });
         }
         el.appendChild(row);
       }
     }

     function lay(sx, sy) {
       var pool = [];
       for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) if (!(x === sx && y === sy)) pool.push([x, y]);
       for (var i = pool.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
       for (var k = 0; k < MINES; k++) { var p = pool[k]; grid[p[1]][p[0]].m = true; }
       for (var y2 = 0; y2 < N; y2++) for (var x2 = 0; x2 < N; x2++) {
         var n = 0;
         for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
           var nx = x2 + dx, ny = y2 + dy;
           if (nx >= 0 && ny >= 0 && nx < N && ny < N && grid[ny][nx].m) n++;
         }
         grid[y2][x2].n = n;
       }
     }

     function open(x, y) {
       var c = grid[y][x];
       if (c.open || c.flag || dead || won) return;
       c.open = true; c.node.className = "cell open";
       if (c.m) { c.node.className = "cell open boom"; c.node.textContent = "*"; return lose(); }
       c.node.textContent = c.n || "";
       if (c.n) c.node.className = "cell open n" + c.n;
       if (!c.n) for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
         var nx = x + dx, ny = y + dy;
         if (nx >= 0 && ny >= 0 && nx < N && ny < N) open(nx, ny);
       };
     }

     function click(node, shift) {
       var x = +node.dataset.x, y = +node.dataset.y, c = grid[y][x];
       if (dead || won) return;
       if (!started) { started = true; lay(x, y); t0 = Date.now(); ti = setInterval(function () { document.getElementById("t").textContent = ((Date.now() - t0) / 1000) | 0; }, 500); }
       if (c.open && c.n && shift) {
         var f = 0;
         for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
           var nx = x + dx, ny = y + dy;
           if (nx >= 0 && ny >= 0 && nx < N && ny < N && grid[ny][nx].flag) f++;
         }
         if (f === c.n) for (var dy2 = -1; dy2 <= 1; dy2++) for (var dx2 = -1; dx2 <= 1; dx2++) {
           var mx = x + dx2, my = y + dy2;
           if (mx >= 0 && my >= 0 && mx < N && my < N) open(mx, my);
         }
         return;
       }
       if (c.flag) return;
       open(x, y);
       checkWin();
     }

     function flag(node) {
       if (dead || won) return;
       var c = grid[+node.dataset.y][+node.dataset.x];
       if (c.open) return;
       c.flag = !c.flag;
       node.className = "cell" + (c.flag ? " flag" : "");
       node.textContent = c.flag ? "⚑" : "";
       flags += c.flag ? 1 : -1;
       hudL.textContent = MINES - flags;
     }

     function checkWin() {
       var closed = 0;
       for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) if (!grid[y][x].open) closed++;
       if (closed === MINES) {
         won = true; clearInterval(ti);
         var secs = ((Date.now() - t0) / 1000) | 0;
         document.getElementById("st").textContent = "YOU WON";
         var best = parseInt(localStorage.getItem("funnysite.mines") || "9999", 10);
         if (secs < best) { localStorage.setItem("funnysite.mines", String(secs)); document.getElementById("b").textContent = secs; }
         FS.rain("★");
         alert("YOU CLEARED " + N + "x" + N + " in " + secs + "s.\n\nflagging is a skill and i will not be explaining further.");
         reset(N, MINES);
       }
     }

     function lose() {
       dead = true; clearInterval(ti);
       document.getElementById("st").textContent = "you lost";
       for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
         var c = grid[y][x];
         if (c.m && !c.flag) { c.node.className = "cell open boom"; c.node.textContent = "*"; }
       }
       setTimeout(function () { alert("boom. the mine was the whole time, being a mine."); reset(N, MINES); }, 350);
     }

     var btns = document.querySelectorAll("[data-size]");
     for (var i = 0; i < btns.length; i++) {
       (function (b) {
         b.addEventListener("click", function () {
           var s = +b.dataset.size;
           reset(s, s === 9 ? 10 : s === 16 ? 40 : 99);
         });
       })(btns[i]);
     }
     document.getElementById("peek").addEventListener("click", function () {
       var pool = [];
       for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) if (grid[y][x].m && !grid[y][x].flag) pool.push([x, y]);
       if (!pool.length) return;
       var p = pool[(Math.random() * pool.length) | 0];
       alert("there's a mine at row " + (p[1] + 1) + ", column " + (p[0] + 1) + ".\n\ndon't tell anyone. (i'm the only one.)");
     });
     reset(9, 10);
     """,
     "minesweeper. right click flags. the first click is free. i checked.")


# ===========================================================================
# MEMORY
# ===========================================================================
game("game-memory.html", "MEMORY - funnysite",
     "",
     r"""
      <h2>MEMORY (4x4)</h2>
      <p class="note">find the pairs. this is a game about the gap between what you think
      you remember and what you remember. that is also a description of my entire personality.</p>
      <div class="gwrap">
        <div class="hud">
          <span>MOVES <b id="mv">0</b></span>&nbsp;
          <span>PAIRS <b id="pr">0/8</b></span>&nbsp;
          <span>BEST <b id="b">--</b></span>
        </div>
        <div id="board" style="width:max-content;overflow:hidden"></div>
        <p class="center" style="margin:8px 0 2px 0">
          <button class="btn2000" id="again">SHUFFLE (YOU GET A NEW SET)</button>
          <button class="btn2000" id="peek">CHEAT PEEK (0.5s)</button>
        </p>
      </div>
     """,
     r"""
     var SYM = ["★", "●", "▲", "■", "♦", "♥", "☂", "☕"];
     var deck = [], open = [], moves = 0, lock = false, board = document.getElementById("board");

     function shuffle() {
       deck = SYM.concat(SYM);
       for (var i = deck.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, t = deck[i]; deck[i] = deck[j]; deck[j] = t; }
       open = []; moves = 0; lock = false;
       document.getElementById("mv").textContent = 0;
       document.getElementById("pr").textContent = "0/8";
       board.innerHTML = "";
       for (var k = 0; k < 16; k++) {
         var d = document.createElement("div");
         d.className = "tile down"; d.dataset.i = k; d.textContent = "·";
         (function (node) {
           node.addEventListener("click", function () { flip(node); });
         })(d);
         board.appendChild(d);
       }
       var b = localStorage.getItem("funnysite.memory");
       if (b) document.getElementById("b").textContent = b + " moves";
     }

     function flip(node) {
       if (lock || node.classList.contains("down") === false) return;
       node.classList.remove("down"); node.textContent = deck[+node.dataset.i];
       open.push(node);
       if (open.length === 2) {
         moves++; document.getElementById("mv").textContent = moves;
         var a = open[0], b = open[1];
         if (deck[+a.dataset.i] === deck[+b.dataset.i]) {
           open = [];
           var found = +document.getElementById("pr").textContent.split("/")[0] + 1;
           document.getElementById("pr").textContent = found + "/8";
           if (found === 8) finish();
         } else {
           lock = true;
           setTimeout(function () {
             for (var i = 0; i < 2; i++) { open[i].classList.add("down"); open[i].textContent = "·"; }
             open = []; lock = false;
           }, 700);
         }
       }
     }

     function finish() {
       var best = localStorage.getItem("funnysite.memory");
       if (!best || moves < +best) {
         localStorage.setItem("funnysite.memory", String(moves));
         alert("all pairs, in " + moves + " moves.\n\nnew best. you are, briefly, a person with a good memory.");
       } else alert("all pairs in " + moves + " moves. best: " + best + ".");
     }

     document.getElementById("again").addEventListener("click", shuffle);
     document.getElementById("peek").addEventListener("click", function () {
       lock = true;
       var tiles = document.querySelectorAll(".tile");
       for (var i = 0; i < 16; i++) { tiles[i].classList.remove("down"); tiles[i].textContent = deck[i]; }
       setTimeout(function () {
         for (var i = 0; i < 16; i++) if (!open.includes(tiles[i])) { tiles[i].classList.add("down"); tiles[i].textContent = "·"; }
         lock = false;
       }, 500);
     });
     shuffle();
     """,
     "memory. 16 tiles. 8 pairs. no timer, because that would be unkind.")


# ===========================================================================
# REACTION TIME
# ===========================================================================
game("game-reaction.html", "REACTION TEST - funnysite",
     "",
     r"""
      <h2>REACTION TEST</h2>
      <p class="note">click the button. it goes green at a random moment. click it again.
      if you click before green, you get a penalty, which is fair, because the button
      literally told you to wait and you didn't.</p>
      <div class="gwrap">
        <div class="big center" id="state">CLICK TO BEGIN</div>
        <div id="pad" style="height:150px;background:#808080;border-top:2px solid #404040;
             border-left:2px solid #404040;border-bottom:2px solid #ffffff;border-right:2px solid #ffffff;
             display:flex;align-items:center;justify-content:center;font-family:'Comic Sans MS',cursive;
             font-size:26px;cursor:pointer;text-align:center;padding:0 12px;">
          PRESS ME
        </div>
        <p class="center" style="margin:8px 0 2px 0">
          <button class="btn2000" id="again">RESET AVERAGE</button>
          <button class="btn2000" id="lie">LIE MODE (reports 40% faster)</button>
        </p>
        <table width="100%" cellpadding="3" cellspacing="0" class="small" style="margin-top:4px">
          <tr><td><b>ATTEMPT</b></td><td class="mono" id="a">-</td><td><b>RESULT</b></td><td class="mono" id="r">-</td></tr>
          <tr class="bev-in"><td><b>AVERAGE</b></td><td class="mono" id="avg">-</td><td><b>BEST</b></td><td class="mono" id="best">-</td></tr>
        </table>
      </div>
     """,
     r"""
     var state = 0, go = 0, hist = [], lying = false;
     var pad = document.getElementById("pad"), st = document.getElementById("state");

     function show() {
       st.textContent = hist.length ? (hist.reduce(function (a, b) { return a + b; }, 0) / hist.length).toFixed(0) + " ms" : "CLICK TO BEGIN";
       document.getElementById("a").textContent = hist.length || "-";
       document.getElementById("avg").textContent = hist.length ? (hist.reduce(function (a, b) { return a + b; }, 0) / hist.length).toFixed(0) + " ms" : "-";
       var b = hist.length ? Math.min.apply(null, hist) : null;
       document.getElementById("best").textContent = b ? b + " ms" : "-";
       if (b) localStorage.setItem("funnysite.react", b + " ms");
     }

     pad.addEventListener("click", function () {
       if (state === 0) {
         state = 1; pad.style.background = "#ff0000"; pad.textContent = "WAIT FOR GREEN";
         st.textContent = "waiting...";
         go = Date.now() + 1500 + Math.random() * 3500;
         setTimeout(check, 100);
       } else if (state === 1) {
         state = 0; pad.style.background = "#808080"; pad.textContent = "PRESS ME";
         st.textContent = "TOO EARLY (+200ms)";
         hist.push(999);
         show();
       } else if (state === 2) {
         var ms = Date.now() - t2;
         if (lying) ms = Math.round(ms * 0.6);
         hist.push(ms); show();
         state = 0; pad.style.background = "#808080"; pad.textContent = "PRESS ME";
         st.textContent = ms + " ms. again?";
       }
     });

     var t2 = 0;
     function check() {
       if (state !== 1) return;
       if (Date.now() >= go) {
         state = 2; t2 = Date.now();
         pad.style.background = "#00cc44"; pad.textContent = "NOW";
         st.textContent = "CLICK NOW";
         return;
       }
       setTimeout(check, 20);
     }

     document.getElementById("again").addEventListener("click", function () { hist = []; show(); });
     document.getElementById("lie").addEventListener("click", function () {
       lying = !lying; this.textContent = lying ? "LIE MODE: ON (you are amazing)" : "LIE MODE (reports 40% faster)";
     });
     show();
     """,
     "click the pad. wait for green. click again. that's the whole website.")


# ===========================================================================
# SLIDING PUZZLE
# ===========================================================================
game("game-sliding.html", "SLIDING PUZZLE - funnysite",
     "",
     r"""
      <h2>SLIDING PUZZLE</h2>
      <p class="note">click a tile next to the gap. move every tile into order. the gap is
      the empty one. it is not a tile. it is a <i>concept</i>.</p>
      <div class="gwrap">
        <div class="hud">
          <span>MOVES <b id="mv">0</b></span>&nbsp;
          <span>BEST <b id="b">--</b></span>&nbsp;
          <span>MODE <b id="mode">3x3</b></span>
        </div>
        <div id="board" style="width:max-content;overflow:hidden"></div>
        <p class="center" style="margin:8px 0 2px 0">
          <button class="btn2000" data-n="3">3x3</button>
          <button class="btn2000" data-n="4">4x4 (HARDER, WORSE)</button>
          <button class="btn2000" id="shuffle">SCRAMBLE</button>
          <button class="btn2000" id="solve">SOLVE IT (I DON'T WANT TO PLAY EITHER)</button>
        </p>
      </div>
     """,
     r"""
     var N = 3, tiles = [], empty = 0, moves = 0, board = document.getElementById("board");

     function solved() {
       for (var i = 0; i < tiles.length; i++) if (i !== tiles.length - 1 && tiles[i] !== i) return false;
       return true;
     }

     function build() {
       board.innerHTML = ""; moves = 0;
       document.getElementById("mv").textContent = 0;
       for (var i = 0; i < N * N; i++) {
         var d = document.createElement("div");
         d.className = "tile"; d.dataset.i = i;
         (function (node) { node.addEventListener("click", function () { tap(+node.dataset.i); }); })(d);
         board.appendChild(d);
       }
       scramble();
     }

     function scramble() {
       /* scramble by legal moves, so it is always solvable. this is the honest way. */
       tiles = []; empty = N * N - 1;
       for (var i = 0; i < N * N - 1; i++) tiles.push(i);
       for (var k = 0; k < 200; k++) {
         var ns = nbrs(empty);
         var to = ns[(Math.random() * ns.length) | 0];
         tiles[empty] = tiles[to]; tiles[to] = -1;
         empty = to;
       }
       if (solved()) scramble();
       paint();
     }

     function nbrs(i) {
       var x = i % N, y = (i / N) | 0, r = [];
       if (x > 0) r.push(i - 1);
       if (x < N - 1) r.push(i + 1);
       if (y > 0) r.push(i - N);
       if (y < N - 1) r.push(i + N);
       return r;
     }

     function paint() {
       var nodes = board.children;
       for (var i = 0; i < tiles.length; i++) {
         nodes[i].style.display = tiles[i] < 0 ? "none" : "block";
         if (tiles[i] >= 0) nodes[i].textContent = tiles[i] + 1;
       }
     }

     function tap(i) {
       if (nbrs(empty).indexOf(i) < 0) return;
       tiles[empty] = tiles[i]; tiles[i] = -1; empty = i;
       moves++; document.getElementById("mv").textContent = moves;
       paint();
       if (solved()) {
         var best = localStorage.getItem("funnysite.slide");
         if (!best || moves < +best) { localStorage.setItem("funnysite.slide", String(moves)); document.getElementById("b").textContent = moves; }
         FS.rain("★");
         alert("solved in " + moves + " moves.\n\ni did not even watch. but i saw.");
       }
     }

     var bs = document.querySelectorAll("[data-n]");
     for (var i = 0; i < bs.length; i++) (function (b) {
       b.addEventListener("click", function () {
         N = +b.dataset.n;
         document.getElementById("mode").textContent = N + "x" + N;
         build();
       });
     })(bs[i]);
     document.getElementById("shuffle").addEventListener("click", scramble);
     document.getElementById("solve").addEventListener("click", function () {
       while (!solved()) { var ns = nbrs(empty); var to = ns[(Math.random() * ns.length) | 0]; tiles[empty] = tiles[to]; tiles[to] = -1; empty = to; }
       moves = 0; document.getElementById("mv").textContent = "0 (auto)"; paint();
     });
     build();
     """,
     "sliding puzzle. 3x3 or 4x4. there is also a button that solves it. i wrote it so you don't have to.")


# ===========================================================================
# TOWER OF HANOI
# ===========================================================================
game("game-hanoi.html", "TOWER OF HANOI - funnysite",
     "",
     r"""
      <h2>TOWER OF HANOI</h2>
      <p class="note">move the whole tower to the right peg, one disk at a time, never
      putting a big one on a small one. the minimum number of moves is 2^n &minus; 1, which
      is a real number, which means the minimum number of moves is a real number, and that
      is the most upsetting sentence in mathematics.</p>
      <div class="gwrap">
        <div class="hud">
          <span>DISKS <b id="dn">5</b></span>&nbsp;
          <span>MOVES <b id="mv">0</b></span>&nbsp;
          <span>OPTIMAL <b id="opt">31</b></span>&nbsp;
          <span>VERDICT <b id="vd">waiting</b></span>
        </div>
        <div id="scene"></div>
        <p class="center" style="margin:8px 0 2px 0">
          <button class="btn2000" id="go">SOLVE IT (STEP BY STEP)</button>
          <button class="btn2000" id="goauto">WATCH IT FAST</button>
          <button class="btn2000" id="stop">STOP (PANIC)</button>
          <button class="btn2000" data-n="5">5 DISKS</button>
          <button class="btn2000" data-n="10">10 DISKS</button>
          <button class="btn2000" data-n="15">15 DISKS (32,767 MOVES. NO.)</button>
        </p>
      </div>
     """,
     r"""
     var N = 5, pegs = [[], [], []], scene = document.getElementById("scene"), iv = null, moves = 0;

     function render() {
       var html = '<div style="display:flex;justify-content:space-around;background:#000;padding:10px 0">';
       for (var p = 0; p < 3; p++) {
         html += '<div style="text-align:center"><div class="tiny mono" style="color:#00ff41">PEG ' + (p + 1) + '</div>';
         for (var i = N - 1; i >= 0; i--) {
           if (pegs[p][i] !== undefined) {
             var w = 18 + (pegs[p][i] - 1) * 11;   /* bigger disk = wider bar. index 0 is the biggest, and it sits at the bottom. */
             html += '<div style="width:' + w + 'px;height:12px;margin:1px auto;background:#' +
               ["ff4444", "44ff44", "4488ff"][pegs[p][i] % 3] + ';border:1px solid #fff"></div>';
           }
         }
         html += '<div style="width:80px;height:8px;background:#888;margin:4px auto 0"></div></div>';
       }
       scene.innerHTML = html + "</div>";
       document.getElementById("mv").textContent = moves;
       document.getElementById("opt").textContent = Math.pow(2, N) - 1;
       var v = document.getElementById("vd");
       v.textContent = moves === 0 ? "waiting" : moves <= Math.pow(2, N) - 1 ? "optimal so far" : "worse than the monks";
       if (moves > Math.pow(2, N) - 1) v.style.color = "#ff4444";
     }

     function init() {
       pegs = [[], [], []];
       for (var i = 0; i < N; i++) pegs[0][i] = N - i;
       moves = 0; render();
     }

     function solve(speed) {
       if (iv) return;
       if (moves > 0) init();
       if (N > 18) return alert("18 is the limit. 2^18 is 262,144 and i respect you too much to render that.");
       var gen = [];
       (function gen_(n, a, b, c) {
         if (n === 0) return;
         gen_(n - 1, a, c, b);
         gen.push([a, b]);
         gen_(n - 1, c, b, a);
       })(N, 0, 2, 1);
       var i = 0;
       function step() {
         if (i >= gen.length) {
           clearInterval(iv); iv = null;
           try { localStorage.setItem("funnysite.hanoi", String(moves)); } catch (e) {}
           alert("done. " + moves + " moves. optimal is " + (Math.pow(2, N) - 1) + ". you matched it. the monks nod."); return;
         }
         var m = gen[i++];
         pegs[m[1]].push(pegs[m[0]].pop());
         moves++; render();
       }
       iv = setInterval(step, speed ? 4 : 220);
     }

     document.getElementById("go").addEventListener("click", function () { solve(false); });
     document.getElementById("goauto").addEventListener("click", function () { solve(true); });
     document.getElementById("stop").addEventListener("click", function () { clearInterval(iv); iv = null; render(); });
     var bs = document.querySelectorAll("[data-n]");
     for (var i = 0; i < bs.length; i++) (function (b) {
       b.addEventListener("click", function () { clearInterval(iv); iv = null; N = +b.dataset.n; document.getElementById("dn").textContent = N; init(); });
     })(bs[i]);
     init();
     """,
     "tower of hanoi. 2^n - 1 moves. a monk would be proud. a monk would also be faster.")


# ===========================================================================
# MIND READER
# ===========================================================================
game("game-mind.html", "MIND READER - funnysite",
     "",
     r"""
      <h2>MIND READER</h2>
      <p class="note">think of a number between 1 and 63. do not tell me. i will read your
      mind using six yes/no questions. this is not a trick. it is arithmetic, but so is
      the lottery, and people watch that on tv.</p>
      <div class="gwrap">
        <div class="hud"><span>QUESTION <b id="qn">0/6</b></span>&nbsp;<span>TRUST <b id="tr">100%</b></span>&nbsp;
          <span>THOUGHTS READ <b id="tr2">0</b></span></div>
        <div style="background:#000;color:#00ff41;font-family:'Courier New',monospace;font-size:16px;
                    padding:16px;text-align:center;min-height:60px" id="say">
          think of a number from 1 to 63.
        </div>
        <p class="center" style="margin:8px 0 2px 0">
          <button class="btn2000" id="yes">YES, IT'S SMALLER THAN THAT</button>
          <button class="btn2000" id="no">NO, IT'S BIGGER THAN THAT</button>
          <button class="btn2000" id="restart">START OVER (FORGET EVERYTHING)</button>
        </p>
        <div class="center" id="result" style="font-family:'Comic Sans MS',cursive;font-size:26px"></div>
      </div>
     """,
     r"""
     var lo = 0, hi = 62, q = 0, trust = 100, thoughts = 0;
     var say = document.getElementById("say"), res = document.getElementById("result");

     function ask() {
       if (lo === hi) return done();
       q++;
       document.getElementById("qn").textContent = q + "/6";
       var mid = Math.floor((lo + hi) / 2);
       say.innerHTML = "is your number<br><b style='font-size:30px;color:#ffff00'>" + (mid + 1) + " or less?</b>";
     }
     function step(yes) {
       if (lo === hi) return;
       var mid = Math.floor((lo + hi) / 2);
       if (yes) { lo = mid + 1; thoughts++; } else hi = mid;
       say.innerHTML = thoughts % 3 === 0
         ? "<span style='color:#ff4488'>i can hear you thinking. it's very loud.</span>"
         : "hm. interesting. " + (hi - lo + 1) + " possibilities left. that's fewer. that's good for me.";
       ask();
     }
     function done() {
       document.getElementById("qn").textContent = "6/6";
       say.innerHTML = "i know your number. i have always known your number.";
       res.innerHTML = "YOUR NUMBER IS <span style='color:#ff4488'>" + (lo + 1) + "</span>";
       try { localStorage.setItem("funnysite.mind", String(lo + 1)); } catch (e) {}
       var t = Math.max(3, 100 - thoughts * 4);
       document.getElementById("tr").textContent = t + "%";
       document.getElementById("tr2").textContent = thoughts;
       document.getElementById("tr").parentElement.style.color = t < 50 ? "#ff4444" : "#00ff41";
     }
     document.getElementById("yes").addEventListener("click", function () { step(false); });
     document.getElementById("no").addEventListener("click", function () { step(true); });
     document.getElementById("restart").addEventListener("click", function () {
       lo = 0; hi = 62; q = 0; trust = 100; thoughts = 0; res.innerHTML = "";
       say.textContent = "think of a number from 1 to 63.";
       document.getElementById("qn").textContent = "0/6";
       document.getElementById("tr").textContent = "100%";
       document.getElementById("tr2").textContent = "0";
     });
     """,
     "binary search with theatrics. 6 questions. it is just arithmetic but the hat helps.")


# ===========================================================================
# ONE BUTTON WORM
# ===========================================================================
game("game-worm.html", "ONE BUTTON WORM - funnysite",
     "",
     r"""
      <h2>ONE BUTTON WORM</h2>
      <p class="note">press SPACE (or click) to jump. do not hit the spikes. that is the
      entire rule. the spike is the enemy. the worm is neutral.</p>
      <div class="gwrap">
        <div class="hud">
          <span>SCORE <b id="sc">0</b></span>&nbsp;
          <span>BEST <b id="b">--</b></span>&nbsp;
          <span>SPEED <b id="sp">1.0</b></span>&nbsp;
          <span>CAUSE OF DEATH <b id="cd">-</b></span>
        </div>
        <canvas id="cv" width="520" height="200"></canvas>
        <p class="center" style="margin:8px 0 2px 0">
          <button class="btn2000" id="go">START (SPACE)</button>
          <button class="btn2000" id="hard">HARD MODE (2 BUTTONS. GOOD LUCK.)</button>
        </p>
      </div>
     """,
     r"""
     var c = document.getElementById("cv"), g = c.getContext("2d");
     var bird = 80, y = 120, v = 0, spikes = [], score = 0, alive = false, hard = false, raf = null, last = 0;

     function reset() {
       y = 120; v = 0; bird = 80; score = 0; spikes = [];
       document.getElementById("sc").textContent = 0;
       document.getElementById("cd").textContent = "-";
     }

     function frame(ts) {
       var dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
       var speed = 3.2 + score * 0.06 + (hard ? 1.2 : 0);
       document.getElementById("sp").textContent = (speed / 3.2).toFixed(1);
       v += 0.42 * (speed / 3.2); y += v;
       if (y < 8) { y = 8; v = 2; }
       if (y > 168) die("ground");
       if (spikes.length && spikes[0] < bird - 10) spikes.shift();
       if (!spikes.length || spikes[spikes.length - 1] < c.width - 60) {
         if (Math.random() < (hard ? 0.035 : 0.02)) {
           spikes.push(c.width);
           if (hard && Math.random() < 0.4) spikes.push(c.width + 40);
         }
       }
       spikes.forEach(function (s) { s -= speed; });
       for (var i = 0; i < spikes.length; i++) {
         if (Math.abs(spikes[i] - bird) < 14 && y > 120) return die("spike");
       }
       score += dt * 10 * (hard ? 1.4 : 1);
       document.getElementById("sc").textContent = Math.floor(score);
       draw();
       if (alive) raf = requestAnimationFrame(frame);
     }

     function draw() {
       g.fillStyle = "#87ceeb"; g.fillRect(0, 0, c.width, c.height);
       g.fillStyle = "#90ee90"; g.fillRect(0, 170, c.width, 30);
       g.fillStyle = "#8b4513";
       for (var i = 0; i < spikes.length; i++) {
         var x = spikes[i];
         g.beginPath(); g.moveTo(x, 170); g.lineTo(x + 14, 130); g.lineTo(x + 28, 170); g.closePath(); g.fill();
       }
       g.fillStyle = "#ffd700"; g.beginPath(); g.arc(bird, y, 11, 0, 6.284); g.fill();
       g.fillStyle = "#000"; g.beginPath(); g.arc(bird + 4, y - 3, 2.5, 0, 6.284); g.fill();
       g.font = "10px 'Courier New'"; g.fillText("this is a worm-shaped circle. it is having a good day.", 10, 20);
     }

     function die(why) {
       alive = false; cancelAnimationFrame(raf);
       document.getElementById("cd").textContent = why;
       var s = Math.floor(score), best = parseInt(localStorage.getItem("funnysite.worm") || "0", 10);
       if (s > best) { localStorage.setItem("funnysite.worm", String(s)); document.getElementById("b").textContent = s; }
       g.fillStyle = "rgba(0,0,0,0.75)"; g.fillRect(0, 0, c.width, c.height);
       g.fillStyle = "#00ff41"; g.font = "20px 'Comic Sans MS'"; g.textAlign = "center";
       g.fillText("GAME OVER (" + why + ")", c.width / 2, 90);
       g.font = "12px 'Courier New'";
       g.fillText("score " + s + " · best " + Math.max(best, s), c.width / 2, 115);
       g.fillText("the worm is at peace. the spike did nothing wrong.", c.width / 2, 140);
       g.textAlign = "left";
     }

     function jump() {
       if (!alive) { reset(); alive = true; last = performance.now(); raf = requestAnimationFrame(frame); }
       v = -5.2;
     }

     document.addEventListener("keydown", function (e) {
       if (e.code === "Space") { e.preventDefault(); jump(); }
     });
     c.addEventListener("click", jump);
     document.getElementById("go").addEventListener("click", jump);
     document.getElementById("hard").addEventListener("click", function () {
       hard = !hard; this.textContent = hard ? "EASY MODE (BACK TO ONE BUTTON)" : "HARD MODE (2 BUTTONS. GOOD LUCK.)";
       reset();
     });
     var b = localStorage.getItem("funnysite.worm");
     if (b) document.getElementById("b").textContent = b;
     draw();
     """,
     "one button. one worm. zero chill. press space.")


# ===========================================================================
# THE RAYCASTER   (the engine lives in game-3d.js, which is hand-written,
#                  like common.js. it is 1 file and 0 dependencies.)
# ===========================================================================
page("game-3d.html", "THE RAYCASTER - funnysite",
     "a first person shooter in one file. no libraries. every texture is a rectangle.",
     GAME_CSS + r"""
      <h2>&#9642; THE RAYCASTER</h2>
      <p class="note">this is the 3d one. i said i wasn't ready to show you. i lied, or i
      was slow, and both of those are the same thing on this website. it is one file, it
      has no libraries, and every texture in it is a rectangle I typed. click the canvas to
      lock the mouse. if you hate that, hold the left button and drag &mdash; it works too,
      it is just worse.</p>

      <div class="gwrap">
        <div class="hud">
          <span>HEALTH <b id="rc-hp">100</b></span>&nbsp;
          <span>ARMOUR <b id="rc-ar">0</b></span>&nbsp;
          <span>AMMO <b id="rc-ammo">50 / PISTOL</b></span>&nbsp;
          <span>KEYS <b id="rc-key">---</b></span>&nbsp;
          <span>DEPTH <b id="rc-depth">1/6</b></span>&nbsp;
          <span>LEFT <b id="rc-left">0</b></span><br>
          <span>KILLS <b id="rc-kills">0</b></span>&nbsp;
          <span>SCORE <b id="rc-score">0</b></span>&nbsp;
          <span>ITEMS <b id="rc-item">0/0</b></span>&nbsp;
          <span>TIME <b id="rc-time">00:00</b> (PAR <span id="rc-par">01:00</span>)
        </div>
        <div id="rc-stage">
          <canvas id="rc-cv" width="400" height="250"></canvas>
          <canvas id="rc-map" width="396" height="246"></canvas>
          <canvas id="rc-mm" width="96" height="96"></canvas>
          <div id="rc-overlay"></div>
          <div id="rc-log"></div>
        </div>

        <div style="margin:6px 0 2px 0">
          <div class="rcbar"><b id="rc-hpbar" style="width:100%"></b></div>
          <div class="rcbar"><b id="rc-arbar" style="width:0%"></b></div>
        </div>

        <p class="center" style="margin:8px 0 2px 0">
          <span class="tiny gray">WASD move &middot; MOUSE look &middot; CLICK shoot &middot;
          1-4 weapons &middot; E use/door/secret wall &middot; TAB map &middot; B lie mode &middot;
          M music &middot; F2 cheats &middot; ESC pause</span>
        </p>
        <p class="note center">press <b>F2</b> and type <b>IDDQD</b>. it works. it has always
        worked. that is not a threat, it is a footnote.</p>
      </div>

      <h2>WHAT IS ACTUALLY IN HERE</h2>
      <div class="sunken" style="padding:8px">
        <ul class="small" style="margin:4px 0;padding-left:20px">
          <li><b>the renderer:</b> DDA raycasting for the walls, per-pixel floor and
          ceiling casting, depth-buffered billboards, distance fog, a per-frame brightness
          cache, muzzle-flash lighting, and a scanline overlay for the year.</li>
          <li><b>the art:</b> 15 textures and about 40 sprites, all drawn at runtime with
          <code>fillRect</code> and <code>ellipse</code>. no image files. no font files. the
          toaster is drawn by hand because it had to be.</li>
          <li><b>the monsters:</b> six types, each with a BFS flow field so they can find
          you around a corner instead of headbutting the wallpaper. turrets do not move.
          that is their whole personality.</li>
          <li><b>the weapons:</b> pistol, shotgun, chaingun, and a toaster gun that fires
          bread at 13 units per second.</li>
          <li><b>the secrets:</b> some walls are not walls. stand at one, look at it, press
          <b>E</b>. find three of them and a seventh level writes itself while you watch.</li>
        </ul>
        <p class="note" style="margin:8px 0 0 0">also: <a href="flash.html"><b>THE FLASH ERA</b></a>
        &mdash; twelve small games in one file, in a portal, with a loading bar on every card.
        because that is what that decade felt like from inside.</p>
      </div>
     """,
     '<script src="game-3d.js"></script>')


# ===========================================================================
# THE FLASH ERA   (twelve small games, one file, zero .swf files)
# ===========================================================================
page("flash.html", "THE FLASH ERA - funnysite",
     "twelve tiny games in a portal. no plugins. no loading. no waiting for it.",
     GAME_CSS + r"""
      <h2>&#9733; THE FLASH ERA</h2>
      <p class="note">there was a period when a website could be a <i>game</i>, and the game
      could be small, and nobody needed to be happy about it &mdash; the smallness <i>was</i>
      the happiness. twelve of them are in here. i wrote all twelve. they are not ports, they
      are not the real ones, and they are deliberately a bit worse than you remember.</p>

      <div class="gwrap">
        <div id="fl-stage">
          <canvas id="fl-cv" width="480" height="300" style="display:none"></canvas>
          <div id="fl-overlay"></div>
        </div>
        <p class="center" style="margin:8px 0 2px 0">
          <span class="tiny gray">MOUSE for the paddle, the slingshot and the gun &middot;
          ARROWS or WASD for everything else &middot; ESC back to the portal &middot; M mutes</span>
        </p>
      </div>

      <h2>THE DOZEN, HONESTLY DESCRIBED</h2>
      <table width="100%" cellpadding="4" cellspacing="0" class="bev">
        <tr class="titlebar"><td>GAME</td><td>ERA</td><td>WHAT IT REMEMBERS</td></tr>
        <tr class="bev-in"><td><b>FALLING SAND</b></td><td class="mono">2005</td>
          <td class="small">sand, water, oil, fire, lava, steam. eight kinds of pixel. you will lose an hour to it.</td></tr>
        <tr><td><b>LINE RIDER</b></td><td class="mono">2006</td>
          <td class="small">draw a line. the rider rides it. the rider does not care whether you drew a good line.</td></tr>
        <tr class="bev-in"><td><b>BLOXORZ</b></td><td class="mono">2008</td>
          <td class="small">a 3-block brick that has to be tipped through a 1x1 hole. four levels. no hints.</td></tr>
        <tr><td><b>UNICORN ATTACK</b></td><td class="mono">2010</td>
          <td class="small">a line drawing of a unicorn, running forever, on white. click to jump. twice if you must.</td></tr>
        <tr class="bev-in"><td><b>GRAVITY BOX</b></td><td class="mono">2007</td>
          <td class="small">one button flips gravity. the spikes only hurt from one side, which feels unfair until it doesn't.</td></tr>
        <tr><td><b>FLOPPY</b></td><td class="mono">2008</td>
          <td class="small">you are two legs and a mouse. walking is theoretically possible. i have never done it.</td></tr>
        <tr class="bev-in"><td><b>BRICKS</b></td><td class="mono">2001</td>
          <td class="small">the paddle. the ball. five rows. power-ups that nobody asked for but everybody wanted.</td></tr>
        <tr><td><b>NOODLE</b></td><td class="mono">2002</td>
          <td class="small">a snake, wrapping around the edges, because the edges are boring.</td></tr>
        <tr class="bev-in"><td><b>ONE BUTTON</b></td><td class="mono">2004</td>
          <td class="small">you run by yourself. one button. hold it in the air for a bigger jump. three short levels.</td></tr>
        <tr><td><b>COLOUR SWITCH</b></td><td class="mono">2011</td>
          <td class="small">you are a colour. the walls are a colour. one click decides which of you is lying.</td></tr>
        <tr class="bev-in"><td><b>DEFEND</b></td><td class="mono">2008</td>
          <td class="small">you are the last wall. they come from the right. click. that is the whole job description.</td></tr>
        <tr><td><b>SLING</b></td><td class="mono">2010</td>
          <td class="small">drag the stone, knock the tower down, the glass shatters because glass is there to be enjoyed.</td></tr>
      </table>

      <h2>WHY TWELVE AND NOT THIRTEEN</h2>
      <div class="sunken" style="padding:8px">
        <p class="note" style="margin:4px 0 0 0">because i could not think of a thirteenth that
        wasn't a remake of a sixth one. there were ten thousand of these and they were all
        thirty kilobytes and all of them asked you to come back tomorrow. none of them did,
        because none of them could. this is the version where they all remember you, in a
        single <span class="mono">localStorage</span> key each, and that is the only upgrade
        the decade gets.</p>
      </div>

      <div class="tape" style="margin-top:10px">NO PLUG-IN REQUIRED &middot; 0 SWF FILES &middot; 0 ASSETS &middot; 12 GAMES &middot; 1 FILE</div>
     """,
     '<script src="flash.js"></script>')


if __name__ == "__main__":
    for fname, (title, desc, body, extra) in PAGES.items():
        with open(os.path.join(ROOT, fname), "w") as f:
            f.write(chrome(title, fname, body, extra, desc))
        print("wrote", fname)
    print(f"{len(PAGES)} pages stamped.")
