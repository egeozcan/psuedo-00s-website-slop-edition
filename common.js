/* ==========================================================================
   common.js  --  the funnysite plumbing
   Load this on every page. Contains: counter, clock, chiptune player,
   a cursed theme button, and 30 eggs. one of them is a toaster.
   ========================================================================== */

var FS = (function () {
  var PAGE = document.body.getAttribute("data-page") || "unknown";
  var KEY  = "funnysite.v1." + PAGE;

  function bump(store) {
    try {
      var n = (parseInt(localStorage.getItem(store), 10) || 0) + 1;
      localStorage.setItem(store, String(n));
      return n;
    } catch (e) { return 0; }
  }

  function bumpRead(store) {
    try {
      var n = (parseInt(localStorage.getItem(store), 10) || 0) + 1;
      localStorage.setItem(store, String(n));
      return n;
    } catch (e) { return 1; }
  }

  /* ---- the counter. yes, it counts you. only you. ---- */
  function counters() {
    var nodes = document.querySelectorAll("[data-counter]");
    for (var i = 0; i < nodes.length; i++) {
      var which = nodes[i].getAttribute("data-counter");
      var val;
      if (which === "total")      val = bumpRead("funnysite.v1.site");
      else if (which === "page")  val = bumpRead(KEY);
      else                        val = parseInt(localStorage.getItem("funnysite.v1.site"), 10) || 1;
      var s = String(val);
      while (s.length < 6) s = "0" + s;
      nodes[i].textContent = s;
    }
  }

  /* ---- the clock, which knows more than it should ---- */
  var toastTime = false;
  function paintClock() {
    var out = document.getElementById("fs-clock");
    if (!out) return;
    var d = new Date(toastTime ? Date.now() + 9 * 3600 * 1000 : Date.now());
    var h = d.getHours();
    var ampm = h >= 12 ? "PM" : "AM";
    h = h % 12; if (h === 0) h = 12;
    var pad = function (n) { return n < 10 ? "0" + n : "" + n; };
    out.textContent = h + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()) + " " + ampm;
  }
  function clock() {
    paintClock();
    setInterval(paintClock, 1000);
  }

  /* ---- chiptune player. 100% legally distinct from every other one ---- */
  var Audio = {
    ctx: null,
    on: false,
    seq: null,
    step: 0,
    song: [
      76, 0, 79, 0, 84, 0, 79, 0,  76, 0, 72, 0, 74, 0, 0, 0,
      77, 0, 81, 0, 88, 0, 81, 0,  77, 0, 74, 0, 72, 0, 0, 0
    ],
    bass: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    get: function () { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); return this.ctx; },
    hz: function (n) { return 440 * Math.pow(2, (n - 69) / 12); },
    blip: function (n, t, len, type, vol) {
      if (!n) return;
      var c = this.get(), o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.value = this.hz(n);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + len + 0.02);
    },
    tick: function () {
      var c = this.get();
      var t = c.currentTime + 0.05;
      var i = this.step % this.song.length;
      this.blip(this.song[i], t, 0.16, "square", 0.06);
      if (i % 4 === 0) this.blip(36 + [0, 5, 7, 3][(this.step / 4 | 0) % 4], t, 0.5, "triangle", 0.12);
      if (i % 8 === 4) this.blip(0, 0, 0, "sine", 0);           // drum
      this.step++;
    },
    toggle: function (btn) {
      if (this.on) {
        clearInterval(this.seq);
        this.on = false;
        btn.textContent = "▶ PLAY THEME.MID";
        if (window.sfx) sfx.pop();
        return;
      }
      var c = this.get();
      if (c.state === "suspended") c.resume();
      this.on = true;
      btn.textContent = "■ STOP MUSIC (why did you) ";
      var self = this;
      this.tick();
      this.seq = setInterval(function () { self.tick(); }, 190);
    }
  };

  /* ---- the cursed theme button ---- */
  var THEMES = [
    ["#1a1a2e", "#232044", "#c0c0c0"],
    ["#000000", "#111111", "#c0c0c0"],
    ["#3b1f00", "#4a2800", "#d4d0c8"],
    ["#001b1b", "#003333", "#c0c0c0"],
    ["#2b0033", "#3d004d", "#d0c0d4"],
    ["#ff00ff", "#cc66cc", "#000000"],
    ["#f5e6c8", "#e8d4a0", "#333333"]
  ];
  /* theme 8 exists. there are 8 themes. you have only ever seen 7. */
  function theme(n) {
    if (n === undefined) n = parseInt(localStorage.getItem("funnysite.v1.theme"), 10) || 0;
    var i = ((n % THEMES.length) + THEMES.length) % THEMES.length;
    var eight = (n % 8) === 7;
    var t = THEMES[i];
    document.body.classList.toggle("fs-theme8", eight);
    if (!eight) {
      document.body.style.backgroundColor = t[0];
      document.body.style.backgroundImage = "none";
      document.documentElement.style.setProperty("--nope", t[1]);
      var main = document.querySelectorAll(".bev, .bev-in, .sunken, .counter-wrap");
      for (var k = 0; k < main.length; k++) main[k].style.backgroundColor = t[2];
    } else {
      document.body.style.backgroundColor = "";
      document.body.style.backgroundImage = "";
      document.documentElement.style.removeProperty("--nope");
      var m2 = document.querySelectorAll(".bev, .bev-in, .sunken, .counter-wrap");
      for (var k2 = 0; k2 < m2.length; k2++) m2[k2].style.backgroundColor = "";
    }
    var b = document.getElementById("fs-theme");
    /* n === 0 means you have never clicked it. in that case we leave the label
       exactly as the html said it, which is a lie, which is the whole point. */
    if (b && n !== 0) b.textContent = "✔ THEME " + ((n % 8) + 1) + "/8 (NICE" + (eight ? ", LIE" : "") + ")";
    return eight;
  }

  /* ---- star rain, for those who find the secret ---- */
  function rain(text) {
    var chars = text.split("");
    for (var i = 0; i < 60; i++) {
      var s = document.createElement("span");
      s.textContent = chars[i % chars.length];
      s.style.cssText = "position:fixed;z-index:9999;pointer-events:none;font-size:" +
        (10 + Math.random() * 26) + "px;color:" +
        ["#ff00ff", "#00ffff", "#ffff00", "#00ff00", "#ffffff"][i % 5] +
        ";left:" + (Math.random() * 100) + "vw;top:-40px;transition:transform " +
        (2 + Math.random() * 3) + "s linear;font-family:'Comic Sans MS',cursive";
      document.body.appendChild(s);
      (function (el) {
        requestAnimationFrame(function () {
          el.style.transform = "translateY(" + (window.innerHeight + 60) + "px) rotate(" +
            (Math.random() * 720 - 360) + "deg)";
        });
        setTimeout(function () { el.remove(); }, 5200);
      })(s);
    }
  }

  /* ==========================================================================
     THE EGG SYSTEM
     ==========================================================================
     33 of them. 3 are real. the rest are load-bearing.

     unlock(id) is the only way in. it records the find, makes a noise,
     puts a banner up for 4 seconds, and then gets out of your way.
     ========================================================================== */

  var EGGS = [
    ["konami",        "THE CODE WAS RIGHT",        "you pressed the buttons. everyone knows the buttons. almost nobody presses them."],
    ["konami-rev",    "THE OTHER KONAMI",         "the same song, backwards. it is a sadder song. it is the same length."],
    ["theme8",        "THERE ARE EIGHT THEMES",    "you found the button that cycles past the end. it lied to you for years. so did i."],
    ["win-buttons",   "WINDOWS BUTTONS WORK",      "all three. the close button does not close anything. it never has."],
    ["type-toaster",  "THE TOASTER KNOWS",        "you typed it. i did not tell you to type it. i told you nothing, which is how it happened."],
    ["rot13",         "GUR CNFFJBEQ",              "you typed it the other way round. almost nobody does that. that is the whole test."],
    ["counter23",     "RECOUNTED",                 "23 clicks. there is one visitor. it is still only you. it was always only you."],
    ["nothing42",     "ANSWERED",                 "42 clicks on a sentence that does not matter. you are, at this point, a person I like."],
    ["iddqd",         "GOD MODE (NOT AVAILABLE)",  "you typed a cheat code from a game i have never played, into a website, for fun. correct behaviour."],
    ["xyzzy",         "NOTHING HAPPENED",         "eight seconds later: something did happen. you were just looking elsewhere."],
    ["sherlock",      "ELEMENTARY",               "it was a pipe. obviously it was a pipe. he had a violin too. the violin is worse."],
    ["idle",          "THE PATIENT ONE",          "you stopped moving for thirty seconds. i waited. nothing happened. then something did."],
    ["toaster-time",  "IT IS LATER THERE",         "the toaster is nine hours ahead and it has been warm for some time."],
    ["tourist",       "YOU SAW ALL OF IT",         "every page. nothing was hiding. you checked anyway. that is the whole internet."],
    ["press1000",     "THE BUTTON LEFT",          "one thousand. it did not stay. it comes back eventually. it always comes back."],
    ["console",       "THE WINDOW THAT WAS NEVER OPENED", "you pressed the backtick. the prompt was always there. it has been waiting since 2004 with nothing to type at."],
    ["the-goose",     "THE GOOSE",                "the marquee said not to email me about the goose. the goose would like a word."],
    ["poll-diff",     "A DIFFERENT QUESTION",      "five times you picked the other box. you have a question. you may now ask it."],
    ["longpress",     "YOU HELD ON",               "two and a half seconds of holding a webpage. i am not going to ask why."],
    ["letters",       "SIX LETTERS",               "every letter in the logo. in order? no. in any order. it did not matter. it never did."],
    ["escape",        "THERE IS NOTHING TO ESCAPE","you pressed escape five times. there is no menu. there has never been a menu. close the tab like a person."],
    ["users",         "0 OF THEM ME",              "there is one of you and one of me and one of the goose. the goose does not count."],
    ["printed",       "IT IS PHYSICAL NOW",        "you printed the website. it is in a room. a real room. i cannot reach it. i tried."],
    ["small-hours",   "IT IS THE SMALL HOURS",     "everyone else is asleep. you and the site. two insomniacs and a counter."],
    ["second-toaster","THE SECOND TOASTER",        "the goose's page. you found the goose's page. the goose is looking at you."],
    ["egg-log",       "THE EGG LOG",               "a page that lists thirty eggs. you are on it. you are, at this moment, one of them."],
    ["arcade",        "ALL NINE GAMES",           "you played them. all of them. including the worm. including the one in 3d that i said i was not ready to show you."],
    ["meta",          "META",                      "ten of them. you are not looking for a page any more. you are reading a website."],
    ["goose-friend",  "HE LIKES YOU",              "ten pokes. the goose sat down. that is what sitting down means. that is what it means now."],
    ["flash",         "THE FLASH ERA",            "you played all twelve of them. not the button that says so - the button is still there and it still does nothing. you played them. i have never done that either, and i wrote them."],
    ["raycaster",     "I WAS NOT READY",          "you finished the 3d one. on the arcade page i wrote that i wrote a raycaster, that it worked, and that i was not ready to show you. i was not ready. you played it anyway. that is the review of this website."],
    ["im-here",       "THERE IS NO FINAL EGG",    "one left. it is this one, and it does not lead anywhere. that is the joke. that was always the joke."],
    ["toast",         "EVERYTHING IS TOAST",       "the eggs are done. the toaster is warm. thank you for playing. seriously. go outside."],
  ];
  var EGG_BY_ID = {};
  for (var ei = 0; ei < EGGS.length; ei++) EGG_BY_ID[EGGS[ei][0]] = EGGS[ei];
  var EGG_KEY = "funnysite.v1.eggs";

  function eggsFound() {
    try { return JSON.parse(localStorage.getItem(EGG_KEY)) || {}; } catch (e) { return {}; }
  }
  function eggsSave(o) {
    try { localStorage.setItem(EGG_KEY, JSON.stringify(o)); } catch (e) {}
  }
  function eggCount() { var f = eggsFound(), n = 0; for (var k in f) if (f.hasOwnProperty(k)) n++; return n; }

  /* ---- sfx: every egg makes a different small noise ---- */
  var sfx = (function () {
    var c = null;
    function ctx() {
      if (!c) { try { c = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
      if (c.state === "suspended") { try { c.resume(); } catch (e) {} }
      return c;
    }
    function tone(f, t0, len, type, vol, slideTo) {
      var c2 = ctx(); if (!c2) return;
      var o = c2.createOscillator(), g = c2.createGain();
      o.type = type || "square";
      o.frequency.setValueAtTime(f, t0);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + len);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol == null ? 0.05 : vol, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + len);
      o.connect(g); g.connect(c2.destination);
      o.start(t0); o.stop(t0 + len + 0.02);
    }
    function seq(list, gap, type, vol) {
      var c2 = ctx(); if (!c2) return;
      var t = c2.currentTime + 0.01;
      for (var i = 0; i < list.length; i++) tone(list[i], t + i * gap, gap * 1.6, type, vol);
    }
    return {
      pop:    function () { seq([880, 1320], 0.06, "square", 0.045); },
      chime:  function () { seq([1046, 1318, 1568, 2093], 0.075, "triangle", 0.05); },
      coin:   function () { seq([988, 1319], 0.06, "square", 0.05); },
      nope:   function () { seq([200, 150], 0.13, "square", 0.05); },
      sad:    function () { seq([392, 370, 349, 330], 0.13, "triangle", 0.05); },
      god:    function () { seq([220, 330, 440, 660, 880], 0.05, "sawtooth", 0.04); },
      honk:   function () {
        var c2 = ctx(); if (!c2) return;
        var t = c2.currentTime + 0.01;
        tone(420, t, 0.2, "sawtooth", 0.055, 300);
        tone(408, t + 0.24, 0.26, "sawtooth", 0.05, 250);
      },
      click:  function () { tone(1200, (ctx() || { currentTime: 0 }).currentTime + 0.005, 0.03, "square", 0.03); }
    };
  })();

  /* ---- the status balloon. bottom left. polite but unavoidable. ---- */
  function say(html, ms) {
    var d = document.createElement("div");
    d.className = "fs-say";
    d.innerHTML = html;
    document.body.appendChild(d);
    while (document.querySelectorAll(".fs-say").length > 4) {
      var old = document.querySelector(".fs-say");
      if (old) old.remove(); else break;
    }
    setTimeout(function () { d.classList.add("bye"); }, ms || 4200);
    setTimeout(function () { d.remove(); }, (ms || 4200) + 500);
    return d;
  }

  /* ---- the banner. this is the reward, don't miss it. ---- */
  function banner(title) {
    var b = document.getElementById("fs-ach");
    if (!b) {
      b = document.createElement("div");
      b.id = "fs-ach";
      document.body.appendChild(b);
    }
    b.innerHTML = "<b>&#9733; ACHIEVEMENT UNLOCKED: " + title + " &#9733;</b>" +
      "<div class='fs-ach-sub'>this is worth nothing. it is still yours.</div>";
    b.className = "on";
    clearTimeout(banner.t);
    banner.t = setTimeout(function () { b.className = ""; }, 4600);
  }

  /* ---- the count, if you have started. if you have not, the site says nothing,
     because a website that tells you it has secrets is a website with no secrets. ---- */
  function footerNote() {
    var n = eggCount();
    var note = document.getElementById("fs-eggnote");
    if (note) {
      note.innerHTML = n === 0 ? "" :
        n + " of " + EGGS.length + " found. " +
        (n >= EGGS.length
          ? "all of them. the site is finished. it will not be better now."
          : "the list is on <a href='eggs.html'>a page that is not in the menu</a>, " +
            "because a menu entry would have been showing off.");
    }
    var live = document.querySelectorAll("[data-eggnum]");
    for (var l = 0; l < live.length; l++) live[l].innerHTML = "<b>" + n + "</b> of <b>" + EGGS.length + "</b>";
    return n;
  }
  /* ---- reveal anything tagged with data-when-egg="id" once that egg lands ---- */
  function revealFor(id) {
    var nodes = document.querySelectorAll("[data-when-egg='" + id + "']");
    for (var i = 0; i < nodes.length; i++) nodes[i].classList.remove("hidden");
  }

  /* ---- unlock ---- */
  function unlock(id, opts) {
    opts = opts || {};
    var e = EGG_BY_ID[id];
    if (!e) return false;
    var f = eggsFound();
    var fresh = !f[id];
    if (fresh) { f[id] = Date.now(); eggsSave(f); revealFor(id); }
    if (!fresh) {
      if (opts.again) sfx.pop();
      return false;
    }
    if (!opts.silent) { sfx.chime(); banner(e[1]); }
    if (opts.rain) rain(opts.rain);
    if (opts.say) say(opts.say);
    if (opts.go) setTimeout(function () { location.href = opts.go; }, opts.wait || 2200);
    footerNote();
    setTimeout(endgame, 900);
    return true;
  }

  /* ---- the last few eggs depend on how many of the others you have ---- */
  function endgame() {
    var c = eggCount();
    if (c >= 10) unlock("meta", { silent: true });
    if (c >= EGGS.length - 1) unlock("im-here", {
      say: "<b>" + (EGGS.length - 1) + " out of " + EGGS.length + ".</b> the last one is not " +
           "a place. it is just the sentence you are reading. you are holding it."
    });
    if (c >= EGGS.length) unlock("toast", {
      rain: "TOAST",
      say: "<b>that was the last one.</b> the site has gone quiet on purpose. " +
           "the toaster is warm if you want anything. go outside. it is fine out there."
    });
  }

  /* ==========================================================================
     1. the konami. because of course.
     ========================================================================== */
  function secrets() {
    /* the real one. the previous version had four extra arrows in it, which meant
       that since 2004 nobody had ever actually completed it. including me. */
    var seq = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];              /* up up down down left right left right b a */
    var rev = [65, 66, 39, 37, 39, 37, 40, 40, 38, 38];              /* the whole thing, backwards */
    var at = 0, at2 = 0;
    window.addEventListener("keydown", function (e) {
      var justKonami = false;
      if (e.keyCode === seq[at]) { at++; if (at === seq.length) { at = 0; gotIt(); justKonami = true; } }
      else { at = (e.keyCode === seq[0]) ? 1 : 0; }
      /* the "a" that finishes the konami must not also open the backwards one,
         or you can never type the second one straight after the first. */
      if (justKonami) return;
      if (e.keyCode === rev[at2]) { at2++; if (at2 === rev.length) { at2 = 0; gotItBackwards(); } }
      else { at2 = 0; }
    });
    var titles = ["funnysite", "You Are On A Website", "MID", ""];
    var ti = 0;
    setInterval(function () { document.title = titles[ti++ % 4]; }, 2300);
  }
  function gotIt() {
    unlock("konami", {
      rain: "YOU FOUND IT",
      say: "<b>★★★ ACHIEVEMENT: YOU READ THE SOURCE CODE ★★★</b><br>" +
           "there are " + (EGGS.length - 1) + " more of these. you have found 1. " +
           "good luck. <a href='eggs.html'>[ the log ]</a>"
    });
    var strip = document.getElementById("fs-strip");
    /* don't overwrite the marquee. it has been carrying a warning since 2004
       and that warning is load-bearing. add a second one underneath it. */
    if (strip && !document.getElementById("fs-strip2")) {
      var t = document.createElement("div");
      t.className = "strip";
      t.id = "fs-strip2";
      t.style.borderTop = "0";
      var msg = "★★★ ACHIEVEMENT UNLOCKED: YOU READ THE SOURCE CODE ★★★ " +
        "&nbsp;|&nbsp; <a href='eggs.html'>[ the egg log ]</a> " +
        "&nbsp;|&nbsp; <a href='secrets.html'>[ the thing that isn't a secret ]</a> " +
        "&nbsp;|&nbsp; there are " + (EGGS.length - 1) + " more. they are all worse. good luck.&nbsp;&nbsp;|&nbsp;&nbsp; ";
      t.innerHTML = "<marquee scrollamount='2' behavior='scroll'>" + msg + msg + msg + msg + "</marquee>";
      strip.parentNode.insertBefore(t, strip.nextSibling);
    }
    try { localStorage.setItem("funnysite.v1.konami", "1"); } catch (e) {}
  }
  function gotItBackwards() {
    rain("TOAST TOAST");
    unlock("konami-rev", {
      say: "the same code, backwards. it plays the same song, sadly. " +
           "go and stand in a different room. you have earned the room."
    });
    sfx.sad();
    walkToaster();
  }

  /* ==========================================================================
     2. words you can type anywhere on this website
     ========================================================================== */
  var CODES = [
    ["toaster", "type-toaster", "you typed the word. the word is all it takes. " +
      "that is the entire security model of this website."],
    ["gur cnffjbeq", "rot13", "the toaster, rotated thirteen places. you did that on purpose. " +
      "you did that on purpose in a website that is about toast."],
    ["iddqd", "iddqd", "GOD MODE. everything on this page is now invincible. " +
      "including me. i checked. nothing is different."],
    ["xyzzy", "xyzzy", ""],
    ["sherlock", "sherlock", ""]
  ];
  function typed() {
    var buf = "";
    window.addEventListener("keydown", function (e) {
      var t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      var k = e.key;
      if (k.length !== 1) return;
      buf = (buf + k.toLowerCase()).slice(-40);
      /* don't let the page scroll out from under someone typing "gur cnffjbeq" */
      if (k === " ") {
        for (var q = 0; q < CODES.length; q++) {
          var c = CODES[q][0];
          if (c.indexOf(" ") >= 0 && buf.slice(0, -1) === c.slice(0, c.indexOf(" "))) e.preventDefault();
        }
      }
      for (var i = 0; i < CODES.length; i++) {
        var code = CODES[i][0], id = CODES[i][1], note = CODES[i][2];
        if (buf.slice(-code.length) !== code) continue;
        if (id === "type-toaster") {
          if (unlock(id, { rain: "TOAST", say: note })) walkToaster();
          sfx.pop();
        } else if (id === "iddqd") {
          if (unlock(id, { say: note })) sfx.god();
          document.body.classList.add("fs-god");
        } else if (id === "xyzzy") {
          if (unlock(id, { silent: true })) {
            say("nothing happened.");
            setTimeout(function () {
              say("something happened. you were not looking. that is the whole trick, " +
                  "that has always been the whole trick.");
              rain("?");
            }, 8000);
          }
        } else if (id === "sherlock") {
          if (unlock(id, { say: note })) sfx.coin();
          var pipe = document.createElement("div");
          pipe.className = "fs-pipe";
          pipe.textContent = "♨";
          document.body.appendChild(pipe);
          setTimeout(function () { pipe.remove(); }, 9000);
        } else {
          unlock(id, { rain: "TOAST", say: note });
          walkToaster();
        }
        buf = "";
      }
    });
  }

  /* ==========================================================================
     3. the toaster walks. it has always wanted to.
     ========================================================================== */
  function walkToaster(opts) {
    opts = opts || {};
    var S = 3, W = 34, H = 26;
    var cv = document.createElement("canvas");
    var w = W * S, h = H * S;
    cv.width = w; cv.height = h;
    cv.className = "fs-walker";
    document.body.appendChild(cv);
    var c = cv.getContext("2d");
    c.scale(S, S);
    var x = -w, y = window.innerHeight - h - 6;
    var t0 = Date.now(), dur = opts.dur || 5200;
    function frame() {
      var p = (Date.now() - t0) / dur;
      if (p >= 1) { cv.remove(); return; }
      x = -w + p * (window.innerWidth + w * 2);
      var bob = Math.abs(Math.sin(p * 34)) * 2;
      y = window.innerHeight - h - 6 - bob;
      c.clearRect(0, 0, W, H);
      c.fillStyle = "rgba(0,0,0,0.18)";
      c.beginPath(); c.ellipse(W / 2, H - 1.5, 12, 1.6, 0, 0, 7); c.fill();
      /* body */
      c.fillStyle = "#b8bcc2"; c.strokeStyle = "#2a2a2a"; c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(4, 22); c.lineTo(4, 9); c.quadraticCurveTo(4, 5, 8, 5);
      c.lineTo(26, 5); c.quadraticCurveTo(30, 5, 30, 9);
      c.lineTo(30, 22); c.closePath(); c.fill(); c.stroke();
      /* the slot */
      c.fillStyle = "#222"; c.fillRect(8, 5, 18, 2.4);
      /* the toast, which is the point */
      var rise = 3 + Math.sin(p * 6) * 0.8;
      c.fillStyle = "#d9a25a"; c.strokeStyle = "#7a4d1d"; c.lineWidth = 0.7;
      c.beginPath();
      c.moveTo(11, 7); c.lineTo(11, 7 - rise); c.quadraticCurveTo(17, 4 - rise, 23, 7 - rise);
      c.lineTo(23, 7); c.closePath(); c.fill(); c.stroke();
      /* lever */
      c.fillStyle = "#555"; c.fillRect(30, 13, 4, 1.6);
      /* legs */
      c.fillStyle = "#333"; c.fillRect(6, 22, 3, 2); c.fillRect(25, 22, 3, 2);
      cv.style.transform = "translate(" + x + "px," + y + "px)";
      requestAnimationFrame(frame);
    }
    frame();
  }

  /* ==========================================================================
     4. the goose
     ========================================================================== */
  function honk() { sfx.honk(); }

  function drawGoose(c, t, mood, scale) {
    /* a goose. hand-drawn. in a canvas. like it is 2004 and nobody is looking. */
    var S = scale || 2, W = 62, H = 46;
    c.setTransform(S, 0, 0, S, 0, 0);
    c.clearRect(0, 0, W, H);
    c.fillStyle = "rgba(0,0,0,0.15)";
    c.beginPath(); c.ellipse(30, H - 2, 17, 2, 0, 0, 7); c.fill();
    /* body */
    c.fillStyle = "#fbfbf6"; c.strokeStyle = "#1a1a1a"; c.lineWidth = 1;
    c.beginPath();
    c.moveTo(14, 32); c.quadraticCurveTo(6, 26, 14, 18);
    c.quadraticCurveTo(24, 12, 40, 16);
    c.quadraticCurveTo(50, 20, 46, 30);
    c.quadraticCurveTo(42, 36, 30, 36);
    c.quadraticCurveTo(20, 36, 14, 32);
    c.closePath(); c.fill(); c.stroke();
    /* wing */
    c.beginPath();
    c.moveTo(22, 20); c.quadraticCurveTo(32, 18, 40, 24);
    c.quadraticCurveTo(32, 28, 22, 20); c.closePath();
    c.fillStyle = "#e9e9e2"; c.fill(); c.stroke();
    /* neck + head */
    var sway = Math.sin(t) * (mood === "walk" ? 1.4 : 0.3);
    c.beginPath();
    c.moveTo(38, 20);
    c.quadraticCurveTo(48 + sway, 16, 48 + sway, 8);
    c.lineWidth = 4.5; c.strokeStyle = "#fbfbf6"; c.stroke();
    c.lineWidth = 1; c.strokeStyle = "#1a1a1a";
    c.beginPath(); c.arc(48 + sway, 7, 5, 0, 7); c.fill(); c.stroke();
    /* beak */
    c.fillStyle = "#e8862a"; c.strokeStyle = "#7a3c08"; c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(52 + sway, 6); c.lineTo(60 + sway, 8.5); c.lineTo(52 + sway, 10.5);
    c.closePath(); c.fill(); c.stroke();
    /* eye */
    c.fillStyle = "#111";
    c.beginPath(); c.arc(49.5 + sway, 5.6, 1.1, 0, 7); c.fill();
    /* legs */
    c.strokeStyle = "#e8862a"; c.lineWidth = 1.6;
    var step = mood === "walk" ? Math.sin(t * 5) * 3 : 0;
    c.beginPath();
    c.moveTo(22, 35); c.lineTo(22 - step, H - 3);
    c.moveTo(30, 35); c.lineTo(30 + step, H - 3);
    c.stroke();
  }

  function goose(opts) {
    opts = opts || {};
    if (document.querySelector(".fs-goose")) return;
    var cv = document.createElement("canvas");
    cv.className = "fs-goose" + (opts.big ? " big" : "");
    cv.width = 62 * 2; cv.height = 46 * 2;
    document.body.appendChild(cv);
    var c = cv.getContext("2d");
    var x = 40, y = window.innerHeight - 110, tx = x, ty = y;
    var t = 0, nextHop = 0, sitting = false;
    function frame() {
      t += 0.05;
      var dx = tx - x, dy = ty - y, d = Math.sqrt(dx * dx + dy * dy);
      if (d > 6 && Date.now() > nextHop) {
        nextHop = Date.now() + 210;
        x += dx * 0.14; y += dy * 0.14;
        drawGoose(c, t, "walk");
        if (Math.random() < 0.06) honk();
      } else {
        drawGoose(c, t, sitting ? "sit" : "idle");
      }
      cv.style.transform = "translate(" + x + "px," + y + "px)";
      requestAnimationFrame(frame);
    }
    frame();
    /* it ignores you for a while. it is not rude. it is a goose. */
    var sx = x, sy = y;
    for (var i = 0; i < 8; i++) {
      setTimeout(function (fx, fy) {
        tx = fx + (Math.random() * 220 - 110);
        ty = fy + (Math.random() * 200 - 150);
        ty = Math.max(40, Math.min(window.innerHeight - 110, ty));
      }, 700 + i * 260, sx, sy);
    }
    window.addEventListener("mousemove", function (e) {
      tx = e.clientX - 60; ty = Math.max(30, Math.min(window.innerHeight - 120, e.clientY - 40));
    });
    cv.addEventListener("click", function () { honk(); cv.style.transform += " scale(1.08)"; });
    return cv;
  }

  /* ==========================================================================
     5. the title bar. three buttons. one of them is a liar.
     ========================================================================== */
  function titleBar() {
    var grip = document.querySelector(".titlebar .grip");
    if (!grip) return;
    var used = {};
    try { used = JSON.parse(localStorage.getItem("funnysite.v1.winbtn") || "{}"); } catch (e) {}
    var syms = grip.textContent.replace(/\s+/g, "").split("");
    grip.innerHTML = "";
    for (var i = 0; i < syms.length; i++) {
      (function (idx, sym) {
        var b = document.createElement("span");
        b.className = "fs-tbtn";
        b.textContent = sym === "_" ? "▁" : (sym === "X" ? "✕" : "□");
        b.title = ["minimise", "maximise", "close"][idx] || "";
        b.dataset.tbtn = idx;
        grip.appendChild(b);
        b.addEventListener("click", function () {
          used[idx] = true;
          try { localStorage.setItem("funnysite.v1.winbtn", JSON.stringify(used)); } catch (e) {}
          sfx.click();
          if (idx === 0) {
            document.body.classList.toggle("fs-min");
            b.textContent = document.body.classList.contains("fs-min") ? "▣" : "▁";
            if (document.body.classList.contains("fs-min"))
              say("minimised. it is still here. minimising does not make it go away.", 3000);
          } else if (idx === 1) {
            document.body.classList.toggle("fs-max");
            b.textContent = document.body.classList.contains("fs-max") ? "❐" : "□";
            if (document.body.classList.contains("fs-max"))
              say("maximised. you have gained 200 pixels. they were always yours.", 3000);
          } else {
            /* no confirm(), no alert(). they are for pages that need a decision.
               this page does not need a decision. this page needs a note. */
            var bar = document.querySelector(".titlebar");
            if (bar) { bar.classList.add("shake"); setTimeout(function () { bar.classList.remove("shake"); }, 500); }
            sfx.nope();
            say("<b>there is no &#10005;.</b> there has never been a &#10005;. it is decorative. " +
                "i am sorry.<br>you have to close the tab like a person.", 5200);
          }
          if (used["0"] && used["1"] && used["2"])
            unlock("win-buttons", {
              say: "<b>all three buttons.</b> the ✕ does not close anything. it never has. " +
                   "everything else on this website closes it too, eventually. you just have to keep loading pages."
            });
        });
      })(i, syms[i]);
    }
  }

  /* ==========================================================================
     6. small, cheap, everywhere eggs
     ========================================================================== */
  function counterEgg() {
    var n = 0;
    document.addEventListener("click", function (e) {
      var t = e.target;
      if (!t || !t.getAttribute) return;
      if (t.getAttribute("data-counter") !== "total") return;
      n++;
      if (n === 23) {
        unlock("counter23", {
          say: "<b>23.</b> congratulations. you are visitor number 23. there is one visitor. " +
               "there has only ever been one visitor. you are extremely consistent."
        });
      }
      if (n >= 23 && n < 40 && t.textContent !== String(n)) {
        t.textContent = (function () { var s = String(n); while (s.length < 6) s = "0" + s; return s; })();
        if (n === 24) sfx.pop();
      }
    });
  }

  function nothingEgg() {
    var t = 0;
    document.addEventListener("click", function (e) {
      var el = e.target;
      if (!el || !el.textContent) return;
      if (el.textContent.indexOf("nothing here is important") < 0) return;
      t++;
      el.style.color = ["#cc0000", "#006600", "#0000cc"][t % 3];
      el.style.background = t % 2 ? "#ffff00" : "";
      if (t === 42) {
        el.style.background = "";
        unlock("nothing42", {
          rain: "42",
          say: "<b>42.</b> the answer, on a sentence that has never once mattered. " +
               "i am not going to say it out loud. it is printed all over this website."
        });
      }
    });
  }

  function clockEgg() {
    var c = document.getElementById("fs-clock");
    if (!c) return;
    var n = 0;
    c.addEventListener("click", function () {
      n++;
      sfx.click();
      if (n % 6 === 0) { toastTime = false; n = 0; resetLabel(); say("it is your time again. it always will be."); return; }
      if (n % 2 === 1) toastTime = true;
      resetLabel();
      if (n === 3) {
        toastTime = true;
        unlock("toaster-time", {
          say: "<b>the toaster is nine hours ahead.</b> it has been on since 4am local. " +
               "it has had a great deal of time to think about what it knows."
        });
      }
    });
    function resetLabel() {
      var lbl = c.parentNode ? c.parentNode.querySelector(".gray") : null;
      if (lbl) lbl.textContent = toastTime ? "TOASTER TIME (9 HOURS AHEAD)" : "YOUR LOCAL TIME";
    }
  }

  function usersEgg() {
    var u = document.getElementById("fs-users");
    if (!u) return;
    u.className = "gray fs-clickable";
    u.addEventListener("click", function () {
      unlock("users", {
        say: "there is one of you. one of me. and the goose, but the goose does not count " +
             "because the goose has never registered."
      });
      u.textContent = "1 OF THEM ME (YOU)";
    });
  }

  function lettersEgg() {
    var h1 = document.querySelector("h1.big");
    if (!h1) return;
    /* "F U N N Y S I T E" -- nine letters, and the spaces are not decorative,
       they are the 5 brain cells, left to right. */
    var NOTES = {
      F: "F: for funnysite. and for 'fine'. and for the sound a toaster makes.",
      U: "U: the vowel i lean on the most. statistically. probably.",
      N: "N: nobody knows what it stands for. it is a filler letter. i am the filler letter.",
      N2: "N again. two of them. there are five brain cells and there are two of these.",
      Y: "Y: the letter you type when you are tired and it should have been an I.",
      S: "S: for site. also for 'stop'. also for 'sorry'.",
      I: "I: the whole pronoun. it is doing a lot of work in this logo alone.",
      T: "T: the letter that has never once helped me. like gazebo.",
      E: "E: for eggs. obviously. it was always for eggs."
    };
    var ORDER = ["F", "U", "N", "N2", "Y", "S", "I", "T", "E"];
    var raw = h1.textContent.trim();
    var found = 0;
    h1.innerHTML = "";
    var chars = raw.split("");
    var k = 0;
    for (var i = 0; i < chars.length; i++) {
      (function (ch) {
        var s = document.createElement("span");
        s.className = "fs-letter";
        s.textContent = ch === " " ? "\u00a0" : ch;
        var key = ch === " " ? null : ORDER[k++];
        s.title = key ? NOTES[key] : "";
        h1.appendChild(s);
        if (ch === " ") return;
        (function (el, note) {
          el.addEventListener("click", function () {
            if (el.dataset.done) { say(note, 3600); return; }
            found++;
            el.dataset.done = "1";
            var col = ["#cc0000", "#006600", "#0000cc", "#cc00cc",
                       "#ff8800", "#008080", "#880000", "#4040a0", "#008000"][found - 1];
            el.style.color = col;
            /* the logo is drawn with background-clip:text, so the letter colour
               has to be set on the fill as well or you will not see a thing */
            el.style.webkitTextFillColor = col;
            say(note, 3600);
            sfx.pop();
            if (found === 9) {
              unlock("letters", {
                rain: "★",
                say: "<b>nine.</b> nine letters in the logo and five brain cells. " +
                     "4 of the letters are load-bearing and i have never worked out which. " +
                     "that is the joke. that has been the joke since 2004."
              });
            }
          });
        })(s, s.title);
      })(chars[i]);
    }
  }

  function escapeEgg() {
    var n = 0, t0 = 0;
    window.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      var now = Date.now();
      if (now - t0 > 4000) n = 0;
      t0 = now; n++;
      if (n === 5) {
        n = 0;
        unlock("escape", {
          say: "nothing to escape from. no menus, no dialogs, no popups under this one. " +
               "you are free. you have been free since 1998. you can leave whenever you like."
        });
      }
    });
  }

  function idleEgg() {
    var timer = null;
    function reset() {
      clearTimeout(timer);
      timer = setTimeout(function () {
        var first = !eggsFound()["idle"];
        if (first) {
          unlock("idle", {
            say: "you stopped. thirty seconds of nothing. i waited, because that is " +
                 "the correct behaviour for a website, and because i am nosy."
          });
        }
        walkToaster({ dur: 7000 });
        setTimeout(reset, 45000);   /* it comes back. it always comes back. */
      }, 30000);
    }
    ["mousemove", "keydown", "scroll", "click", "touchstart"].forEach(function (ev) {
      window.addEventListener(ev, reset, { passive: true });
    });
    reset();
  }

  function longPressEgg() {
    var t = null;
    window.addEventListener("mousedown", function (e) {
      var t2 = e.target;
      if (!t2 || !t2.closest) return;
      if (t2.closest("a,button,input,textarea,select,canvas,.cell,.tile,.blinkie,.navlink")) return;
      clearTimeout(t);
      t = setTimeout(function () {
        unlock("longpress", {
          rain: "HELD",
          say: "you held on for two and a half seconds. in 2004 that was how you " +
               "opened a program. i miss it. i am not going to say that again."
        });
        walkToaster();
      }, 2500);
    });
    ["mouseup", "mouseleave", "scroll", "touchend"].forEach(function (ev) {
      window.addEventListener(ev, function () { clearTimeout(t); });
    });
  }

  function printEgg() {
    window.addEventListener("afterprint", function () {
      unlock("printed", {
        say: "<b>it exists now.</b> it is on paper. i cannot reach paper. i have tried. " +
             "the goose has also tried. the goose is not helpful."
      });
    });
  }

  function smallHours() {
    var h = new Date().getHours();
    if (h >= 2 && h < 4) {
      unlock("small-hours", {
        silent: true,
        say: "<b>it is " + (h === 2 ? "two" : "three") + " in the morning.</b> " +
             "everyone else is asleep. it is just you and the counter and me. " +
             "the counter is not sleeping either. the counter does not sleep at all."
      });
    }
  }

  /* ==========================================================================
     7. the tour. every page. there are not that many.
     ========================================================================== */
  var ALL_PAGES = [
    "index.html", "funfacts.html", "quotes.html", "jokes.html", "puzzles.html",
    "games.html", "music.html", "guestbook.html", "theweb.html", "about.html",
    "secrets.html", "404.html", "eggs.html", "goose.html",
    "game-maze.html", "game-mines.html", "game-memory.html", "game-reaction.html",
    "game-sliding.html", "game-hanoi.html", "game-mind.html", "game-worm.html",
    "game-3d.html", "flash.html"
  ];
  var GAME_KEYS = ["funnysite.maze", "funnysite.mines", "funnysite.memory",
                   "funnysite.react", "funnysite.slide", "funnysite.hanoi",
                   "funnysite.mind", "funnysite.worm", "funnysite.raycaster"];
  function tour() {
    var seen = {};
    try { seen = JSON.parse(localStorage.getItem("funnysite.v1.seen") || "{}"); } catch (e) {}
    seen[PAGE] = (seen[PAGE] || 0) + 1;
    try { localStorage.setItem("funnysite.v1.seen", JSON.stringify(seen)); } catch (e) {}
    var n = 0;
    for (var i = 0; i < ALL_PAGES.length; i++) if (seen[ALL_PAGES[i]]) n++;
    if (n >= ALL_PAGES.length) {
      unlock("tourist", {
        say: "<b>every page.</b> all " + ALL_PAGES.length + " of them, including the one " +
             "about the goose and the one that lists this. there was nothing hidden. " +
             "you were checking anyway. that is not a flaw in the website, that is a flaw in you, and i mean it nicely."
      });
      var u = document.getElementById("fs-users");
      if (u) u.textContent = "1 USER ONLINE (IT WAS ALWAYS YOU)";
      var o = document.getElementById("fs-online");
      if (o) o.textContent = "1 USER ONLINE";
    }
    /* the arcade: nine games, nine keys, nine wins */
    var played = 0;
    for (var g = 0; g < GAME_KEYS.length; g++) {
      try { if (localStorage.getItem(GAME_KEYS[g])) played++; } catch (e) {}
    }
    if (played >= GAME_KEYS.length) {
      unlock("arcade", {
        rain: "9/9",
        say: "<b>all nine games.</b> including the worm. including hanoi. including the " +
             "3d one, which took the longest and complained the least. " +
             "there is no trophy for this because a trophy would imply you were supposed to."
      });
    }
  }

  /* ==========================================================================
     8. the goose, part two: you typed it, or you clicked it, or you waited.
     ========================================================================== */
  function gooseEgg() {
    if (PAGE === "goose.html") { unlock("second-toaster"); return; }
    document.addEventListener("click", function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var gooseLink = t.closest("#fs-gooselink");
      if (!gooseLink) return;
      e.preventDefault();
      if (unlock("the-goose", {
        say: "you clicked the one thing i told you not to ask about. " +
             "<b>the goose would like a word.</b> <a href='goose.html'>[ let it ]</a>",
        wait: 0
      })) {
        walkToaster();
        setTimeout(function () { goose(); }, 900);
      }
    });
  }

  /* ==========================================================================
     9. the fake command prompt. press the backtick key. that is the whole hint.
     ========================================================================== */
  function console_() {
    var open = false, box = null, print = function () {};
    function make() {
      box = document.createElement("div");
      box.className = "fs-console";
      box.innerHTML =
        "<div class='fs-console-bar'>C:\\WINDOWS\\system32\\funnysite.exe &nbsp;<span class='gray'>[ a window that was never opened ]</span></div>" +
        "<pre id='fs-out' class='fs-out'></pre>" +
        "<span class='fs-prompt'>C:\\WINDOWS\\system32&gt;</span><span><input id='fs-in' spellcheck='false' autocomplete='off'></span>";
      document.body.appendChild(box);
      var out = box.querySelector("#fs-out");
      var input = box.querySelector("#fs-in");
      print = function (s, cls) {
        var line = document.createElement("span");
        line.className = cls || "";
        line.textContent = s + "\n";
        out.appendChild(line);
        out.scrollTop = out.scrollHeight;
      };
      print("funnysite console [version 1.0.2004]");
      print("(c) me. all rights reserved. none of them enforced.");
      print("Type HELP if you are lost. Type EXIT if you are done.");
      print("");
      input.focus();
      input.addEventListener("keydown", function (e) {
        e.stopPropagation();
        if (e.key !== "Enter") return;
        var cmd = input.value.trim().toLowerCase();
        print("C:\\WINDOWS\\system32>" + cmd, "cmd");
        input.value = "";
        run(cmd);
      });
      input.focus();
    }
    function run(cmd) {
      var p = print;
      var parts = cmd.split(/\s+/);
      switch (parts[0]) {
        case "":
          break;
        case "help":
          p("DIR       list the website");
          p("VER       version");
          p("WHY       why any of this");
          p("TOAST     ring the toaster");
          p("GOOSE     find the goose");
          p("EGGS      how many you have found");
          p("UNLOCK n  mark egg n as found  (you have to have earned it first)");
          p("404       go somewhere that does not exist");
          p("SUDO      try it");
          p("RM -RF /  try it");
          p("CAT f     read a file. they are all jokes");
          p("EXIT      close this");
          p("");
          p("There are " + EGGS.length + " eggs. This window is not one of them, which is a lie, it is one of them.");
          break;
        case "dir":
          p(" Volume in drive C is FUNNY");
          p(" Directory of C:\\WINDOWS\\system32");
          p("");
          for (var i = 0; i < ALL_PAGES.length; i++) {
            var kb = 3 + (ALL_PAGES[i].length % 11);
            p("11/04/2004   " + String(9 + (i % 9)).slice(-2) + ":" +
              ("0" + (i * 7 % 60)).slice(-2) + "a   " + kb + "k  " + ALL_PAGES[i]);
          }
          p("common.js   " + (9 + EGGS.length) + "k");
          p("style.css    9k");
          p("favicon.gif  280k  (a hand-drawn toast. it bobs.)");
          p("robots.txt    1k");
          p("");
          p("     " + ALL_PAGES.length + " file(s)   " + (2081 + ALL_PAGES.length) + " bytes free");
          p("");
          p("goose.txt     0k  (it is empty. it was always going to be empty.)");
          break;
        case "ver":
          p("funnysite [version 1.0.2004]");
          p("the browser is the only dependency and it is 25 years old");
          break;
        case "why":
          p("i don't know.");
          p("it is a brain dump. thoughts have to go somewhere or they sit in your head");
          p("and get louder, and then they are all you are, and that is not a website, that is a symptom.");
          p("");
          p("you are here though. so it is working, at least partially.");
          break;
        case "toast":
          walkToaster(); sfx.pop();
          p("the toaster has been rang. it will not acknowledge this.");
          break;
        case "goose":
          p("opening the goose...");
          setTimeout(function () { location.href = "goose.html"; }, 900);
          break;
        case "eggs":
          var f = eggCount();
          p("you have found " + f + " of " + EGGS.length + ".");
          if (f >= EGGS.length) p("all of them. genuinely. what are you doing still.");
          else if (f === 0) p("none? on this page? there is literally one on this page.");
          else p("the log is at eggs.html. it will not tell you which ones. it is honest.");
          break;
        case "unlock":
          if (!eggsFound()["konami"]) { sfx.nope(); p("you did not read the source code. nice try."); break; }
          var n = parseInt(parts[1], 10);
          if (!n || n < 1 || n > EGGS.length) { p("there is no egg " + parts[1] + ". there is no egg 0 either."); break; }
          unlock(EGGS[n - 1][0], { say: "cheated. it counts. i cannot stop you and i would not." });
          p("marked. it counts. do not tell anyone." + (n === 1 ? " especially not that one, it is free." : ""));
          break;
        case "sudo":
          sfx.nope();
          p("nice try.");
          break;
        case "rm":
          sfx.nope();
          p("nice try.");
          p("also this is a website. there is nothing to remove. there is only the page you are on.");
          break;
        case "cat":
          var f2 = parts[1] || "";
          if (f2 === "favicon.gif") p("you cannot cat an image. it is a picture of a piece of toast. it bobs. that is all it does. it is the best thing i have made.");
          else if (f2 === "robots.txt") p("# the secret page is disallowed. it is one click away in the marquee. robots.txt has never once been obeyed. not by me. not by you. not by anything.");
          else if (f2 === "common.js") p("this file. you are in it. you have been in it since the konami unlocked, which was 30 lines ago, mentally.");
          else if (f2 === "style.css") p("the background tile is 16x16. it has been 16x16 since 2004. it will be 16x16 at the heat death of the universe. it is the most stable thing in the repository.");
          else if (ALL_PAGES.indexOf(f2) >= 0) p("open it. it is right there. it is a link. you have legs and a mouse.");
          else p("cat: " + f2 + ": no such file, or it exists, and it is a joke, and the joke is that you cannot tell.");
          break;
        case "404":
          location.href = "404.html";
          break;
        case "cls":
          out.innerHTML = "";
          break;
        case "exit":
        case "quit":
          box.remove(); open = false;
          say("closed. the window was never really open. like most of the things on this site.");
          break;
        default:
          sfx.nope();
          p("'" + parts[0] + "' is not recognised as an internal or external command.");
          p("this is the most 1998 sentence this website could possibly produce, and it did.");
      }
    }
    window.addEventListener("keydown", function (e) {
      if (e.key !== "`" && e.keyCode !== 192) return;
      var t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (!open) {
        open = true;
        unlock("console", {
          say: "<b>you found the window that was never opened.</b> it has been on the C: " +
               "drive this whole time. nothing has ever run here. you just did."
        });
        if (!box) make();
        box.querySelector("#fs-in").focus();
      }
    });
  }

  /* ==========================================================================
     10. the theme button has one more setting than it admits to
     ========================================================================== */
  function themeEgg() {
    var b = document.getElementById("fs-theme");
    if (!b) return;
    var used = {};
    try { used = JSON.parse(localStorage.getItem("funnysite.v1.themes") || "{}"); } catch (e) {}
    b.addEventListener("click", function () {
      var n = (parseInt(localStorage.getItem("funnysite.v1.theme"), 10) || 0) + 1;
      try { localStorage.setItem("funnysite.v1.theme", String(n)); } catch (e) {}
      var eight = theme(n);
      used[n % 8] = true;
      try { localStorage.setItem("funnysite.v1.themes", JSON.stringify(used)); } catch (e) {}
      if (eight) {
        sfx.chime();
        unlock("theme8", {
          rain: "🌈",
          say: "<b>theme 8 of 8.</b> the button has been lying. it says 1/7. it has said 1/7 " +
               "since before you got here. there is an eighth theme and it is this one " +
               "and it is the only one i did not check."
        });
      }
    });
  }

  /* ==========================================================================
     init
     ========================================================================== */
  function init() {
    counters();
    clock();
    theme();
    secrets();
    typed();
    titleBar();
    counterEgg();
    nothingEgg();
    clockEgg();
    usersEgg();
    lettersEgg();
    escapeEgg();
    idleEgg();
    longPressEgg();
    printEgg();
    smallHours();
    tour();
    gooseEgg();
    console_();
    themeEgg();
    if (PAGE === "eggs.html") renderEggLog();

    var mb = document.getElementById("fs-midi");
    if (mb) mb.addEventListener("click", function () { Audio.toggle(mb); });
    /* the theme button is wired up in themeEgg(), which is above, and which
       knows about the one it is not supposed to have. */
    var nav = document.querySelectorAll("[data-nav]");
    for (var i = 0; i < nav.length; i++) {
      if (nav[i].getAttribute("href") === PAGE) nav[i].className = "navlink here";
    }
    var yr = document.getElementById("fs-year");
    if (yr) yr.textContent = "1998-2004";

    /* if the last egg is already found, the site says so, quietly, everywhere */
    if (eggsFound()["toast"]) {
      var s = document.getElementById("fs-strip");
      if (s) s.setAttribute("data-allfound", "1");
    }

    for (var g = 0; g < EGGS.length; g++) revealFor(EGGS[g][0]);
    footerNote();
    setTimeout(endgame, 400);   /* in case you arrived carrying most of them */
  }

  /* ---- the egg log page draws itself ---- */
  function renderEggLog() {
    var host = document.getElementById("eggs-list");
    if (!host) return;
    var f = eggsFound();
    var html = "";
    for (var i = 0; i < EGGS.length; i++) {
      var e = EGGS[i], got = !!f[e[0]];
      html += '<tr class="' + (got ? "got" : "") + '">' +
        '<td class="mono tiny" style="width:30px">' + (got ? "&#10003;" : "??") + "</td>" +
        '<td class="mono tiny" style="width:26px;color:#888">' + (got ? ("0" + (i + 1)).slice(-2) : "--") + "</td>" +
        '<td class="small"><b>' + (got ? e[1] : "&#9608;&#9608;&#9608;&#9608;&#9608;&#9608;&#9608;&#9608;&#9608;&#9608;&#9608;&#9608;&#9608;&#9608;") + "</b>" +
        (got ? '<div class="tiny gray">' + e[2] + "</div>" : "") + "</td></tr>";
    }
    host.innerHTML = html;
    var n = eggCount();
    var c = document.getElementById("eggs-count");
    if (c) c.innerHTML = "<b>" + n + "</b> of <b>" + EGGS.length + "</b>";
    if (n === 0) {
      var z = document.getElementById("eggs-zero");
      if (z) z.classList.remove("hidden");
    }
    var give = document.getElementById("eggs-giveup");
    if (give) give.addEventListener("click", function () {
      if (!confirm("Mark all thirty as found?\n\nThis does not give you the feeling.\nThis gives you the list.")) return;
      var all = {};
      for (var i = 0; i < EGGS.length; i++) all[EGGS[i][0]] = Date.now();
      eggsSave(all);
      renderEggLog();
      sfx.chime();
      say("thirty out of thirty. on the technicality. that is not the same as finding them " +
          "and you know it and i know it and this list knows it.");
    });
    unlock("egg-log", { silent: true });
  }

  return {
    init: init, rain: rain, audio: Audio, bump: bump,
    unlock: unlock, eggs: EGGS, eggsFound: eggsFound, eggCount: eggCount,
    say: say, sfx: sfx, honk: honk, goose: goose, walkToaster: walkToaster,
    drawGoose: drawGoose
  };
})();

/* sfx is used inside FS before this assignment runs (only on click, so: fine) */
window.sfx = FS.sfx;

document.addEventListener("DOMContentLoaded", FS.init);
