#!/usr/bin/env python3
"""
_build/build.py -- stamps out the rest of funnysite.

index.html is hand-written (it is the masterpiece, hands off).
Every other page is: CHROME + body. The chrome lives here so that when
i change the nav at 1am, i only have to change it in one place.

Run:  python3 _build/build.py
"""

import os, textwrap

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")

BESTIE = 1


def chrome(title, page, body, extra="", desc="a website. on the internet. about stuff."):
    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="generator" content="Notepad">
<link rel="stylesheet" href="style.css">
<link rel="icon" href="favicon.gif" type="image/gif">
</head>
<body data-page="{page}">

<div class="strip" id="fs-strip">
<marquee scrollamount="4" behavior="scroll">
<b>&#9733; NEWS: I ADDED A PAGE &#9733;</b>&nbsp;&nbsp;|&nbsp;&nbsp;
this site is 100% hand-made in notepad, 0% hand-made in notepad actually&nbsp;&nbsp;|&nbsp;&nbsp;
<a href="index.html" id="fs-gooselink">do not email me about the goose</a>&nbsp;&nbsp;|&nbsp;&nbsp;
web traffic up 0% this week, which is still up 0%&nbsp;&nbsp;|&nbsp;&nbsp;
<a href="games.html">GAMES &#8594;</a>&nbsp;&nbsp;|&nbsp;&nbsp;
<a href="secrets.html">???</a>&nbsp;&nbsp;|&nbsp;&nbsp;
<b>NOW PLAYING: THEME.MID</b>&nbsp;&nbsp;|&nbsp;&nbsp;
under construction since march
</marquee>
</div>

<div class="xp-stripe"></div>

<table class="layout" width="800" align="center" cellpadding="0" cellspacing="0" style="margin-top:10px">
<tr><td>

  <table width="100%" cellpadding="0" cellspacing="0" class="bev">
    <tr><td class="titlebar">
      <span class="grip">_ &#9633; X</span>
      <a href="index.html">funnysite</a> - C:\\Documents and Settings\\Guest\\My Website
    </td></tr>
    <tr><td style="padding:8px 6px">
      <h1 class="big">F U N N Y S I T E</h1>
      <div class="center small gray">
        a brain dump with a homepage&nbsp;&nbsp;&middot;&nbsp;&nbsp;est. 2004 (or 1998, one of those two)
      </div>
      <div class="hr-fancy"></div>
      <div class="center small">
        <a href="about.html">about</a> &middot;
        <a href="guestbook.html">guestbook</a> &middot;
        <a href="theweb.html">cool links</a> &middot;
        <a href="games.html">games</a> &middot;
        <a href="music.html">my top 8 songs</a> &middot;
        <a href="puzzles.html">puzzles</a>
      </div>
    </td></tr>
  </table>

  <p></p>

  <table class="layout" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td class="navcol" width="148">
      <div class="sunken" style="padding:4px">
        <div class="navhead">SITE MAP</div>
        <a class="navlink" data-nav href="index.html">&#9654; HOME</a>
        <a class="navlink" data-nav href="funfacts.html">&#9654; FUN FACTS</a>
        <a class="navlink" data-nav href="quotes.html">&#9654; QUOTES</a>
        <a class="navlink" data-nav href="jokes.html">&#9654; JOKES</a>
        <a class="navlink" data-nav href="puzzles.html">&#9654; PUZZLES</a>
        <a class="navlink" data-nav href="games.html">&#9654; GAMES</a>
        <a class="navlink" data-nav href="flash.html">&#9654; FLASH GAMES</a>
        <a class="navlink" data-nav href="music.html">&#9654; TOP 8 SONGS</a>
        <div class="navhead">MISC</div>
        <a class="navlink" data-nav href="guestbook.html">&#9654; GUESTBOOK</a>
        <a class="navlink" data-nav href="theweb.html">&#9654; COOL LINKS</a>
        <a class="navlink" data-nav href="about.html">&#9654; ABOUT ME</a>
        <div class="navhead">SERVER</div>
        <div class="tiny" style="padding:3px">
          YOU ARE HERE:<br>
          <span class="mono">/home/<br>&nbsp;&nbsp;guest/<br>&nbsp;&nbsp;&nbsp;&nbsp;www/</span><br>
          <span class="gray">2,048 MB FREE</span><br>
          <span class="gray" id="fs-online">7 USERS ONLINE</span><br>
          <span class="gray" id="fs-users">0 OF THEM ME</span>
        </div>
      </div>

      <p></p>

      <div class="sunken" style="padding:4px">
        <div class="navhead">COUNTER</div>
        <div class="center" style="padding:4px 0">
          <span class="counter-wrap"><span class="counter" data-counter="total">000001</span></span>
          <div class="tiny gray" style="margin-top:3px">VISITORS</div>
          <div class="tiny gray">(including you, twice)</div>
        </div>
        <div class="hr-dotted" style="margin:4px 0"></div>
        <div class="center tiny mono">
          <span id="fs-clock">--:--:--</span><br>
          <span class="gray">YOUR LOCAL TIME</span>
        </div>
      </div>

      <p></p>

      <div class="sunken" style="padding:4px">
        <div class="navhead">AUDIO</div>
        <div class="center" style="padding:4px">
          <button class="btn2000" id="fs-midi">&#9654; PLAY THEME.MID</button>
          <div class="tiny gray" style="margin-top:4px">
            4.2kb &middot; MIDI &middot; 100% of the vibe<br>
            (turn your speakers on, or don't, I'm not your mother)
          </div>
        </div>
      </div>

      <p></p>
      <div class="center"><button class="btn2000" id="fs-theme">&#10004; THEME 1/7 (NICE)</button></div>

      <p></p>
      <div class="tiny center gray">
        <a href="404.html">404</a> &middot; <a href="mailto:nobody@nowhere.invalid">email me</a>
      </div>
    </td>

    <td class="maincol" width="640">
{body}
    </td>
  </tr></table>

  <p></p>
  <div class="checker"></div>
  <div class="sunken" style="padding:6px">
    <div class="center small">
      <b>funnysite</b> &nbsp;&middot;&nbsp; no cookies, no tracker, no analytics, no <i>idea</i> who you are<br>
      this page has been viewed <span class="counter" data-counter="page">000001</span> times
      (<span class="counter" data-counter="total">000001</span> site-wide)<br>
      <span class="tiny gray">best viewed in Netscape Navigator 4.7 at 800&times;600 with the lights off</span><br>
      <span class="tiny gray">&copy; 1998-2004 me &middot; this site is a <a href="about.html">loose collection of pages</a></span><br>
      <span class="tiny gray" id="fs-eggnote"></span>
    </div>
    <div class="center" style="margin-top:5px">
      <span class="tiny gray">[ nothing here is important ]</span>
    </div>
  </div>

  <div id="fs-printegg">
    YOU ARE HOLDING THIS WEBSITE.<br>
    it is paper now. it is in a room. it has a weight.<br>
    i have never once been able to get into a room.<br><br>
    <span style="font-size:9pt">funnysite &middot; printed 2004 &middot;
    there are no cookies on this page and now there is also no screen</span>
  </div>

</td></tr></table>

<script src="common.js"></script>
{extra}
</body>
</html>
"""


PAGES = {}


def page(fname, title, desc, body, extra=""):
    PAGES[fname] = (title, desc, textwrap.dedent(body).strip("\n"), textwrap.dedent(extra).strip("\n"))


# ===========================================================================
# FUN FACTS
# ===========================================================================
page("funfacts.html", "FUN FACTS - funnysite",
     "facts, arranged by how much i believe them. hover the black bars.",
     r"""
      <h2>FUN FACTS</h2>
      <p class="note">Fact #1: this page has 41 facts on it. Fact #2: 6 of them are real.</p>
      <p>
        Every fact below has a <b>TRUTH</b> rating. i made up the rating system at 1am and
        it is a very good rating system. <span class="spoiler">Hover over a black bar if you
        are that kind of person. Some of them I do not want you to see.</span>
      </p>

      <div class="center" style="margin:8px 0">
        <button class="btn2000" id="ff-new">MORE FACTS (UNLOCKABLE)</button>
        <span class="tiny gray" style="margin-left:6px">click until you run out of brain</span>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" id="ff-list">
        <tr><td>
          <div class="fact"><span class="n">001</span> Honey found in an Egyptian tomb was still
          edible 3,000 years later. <b>Source: a jar.</b> <span class="cert">NEARLY TRUE</span></div>

          <div class="fact"><span class="n">002</span> Octopuses have three hearts and zero patience
          for your aquarium. <span class="cert">NEARLY TRUE</span></div>

          <div class="fact"><span class="n">003</span> A flock of flamingos is a <i>flamboyance</i>.
          A group of jellyfish is a <i>smack</i>. A group of me is a <i>bad idea</i>.
          <span class="cert">ALMOST TRUE</span></div>

          <div class="fact"><span class="n">004</span> Wombat poo is cube-shaped. i have thought
          about this more than i have thought about my rent. <span class="cert">TRUE</span></div>

          <div class="fact"><span class="n">005</span> Sharks existed before trees. <b>So the shark
          is technically the older one and you should respect that.</b> <span class="cert">TRUE</span></div>

          <div class="fact"><span class="n">006</span> A hot cup of water can freeze faster than a
          cold one. Nobody knows exactly why. i have a hunch, and the hunch is: <i>the hot one
          wanted it more.</i> <span class="cert">MYSTERIOUS</span></div>

          <div class="fact"><span class="n">007</span> The Eiffel Tower grows about 15cm in summer,
          because iron gets tired. <span class="cert">ALMOST TRUE</span></div>

          <div class="fact"><span class="n">008</span> You are currently listening to a recording of
          a dead person's voice, forever, in your own skull, for free.
          <span class="cert">TOO TRUE</span></div>

          <div class="fact"><span class="n">009</span> There are more possible chess games than atoms
          in the observable universe. <b>Your move.</b> <span class="cert">TRUE AND UNHELPFUL</span></div>

          <div class="fact"><span class="n">010</span> Scotland's national animal is the unicorn.
          <span class="spoiler">i want this to be my whole personality. i am going to think about
          this every day now.</span> <span class="cert">TRUE</span></div>

          <div class="fact"><span class="n">011</span> The inventor of the Pringles can is buried in
          one. <span class="spoiler">he is not. i checked. i wanted it to be true so badly that i
          looked it up four times.</span> <span class="cert">SADLY FALSE</span></div>

          <div class="fact"><span class="n">012</span> Bananas are berries. Strawberries are not.
          The world is unfair and this is proof. <span class="cert">TRUE</span></div>

          <div class="fact"><span class="n">013</span> A day on Venus is longer than a year on
          Venus. <span class="cert">TRUE</span> <span class="cert">PLEASE DO NOT THINK ABOUT IT</span></div>

          <div class="fact"><span class="n">014</span> Cows have best friends. If they get separated
          they get stressed. <span class="spoiler">i have a best friend. i stress when they leave
          the room. we are both cows about it.</span> <span class="cert">TRUE</span></div>

          <div class="fact"><span class="n">015</span> There is a species of jellyfish that is
          biologically immortal. It is called <i>the immortal jellyfish</i>. It is 1cm long.
          <b>Nothing in this world is more me.</b> <span class="cert">TRUE</span></div>

          <div class="fact"><span class="n">016</span> Slugs have four noses. <span class="cert">TRUE</span>
          <span class="cert">UNFORTUNATELY THE MOST RELATABLE FACT HERE</span></div>

          <div class="fact"><span class="n">017</span> Your stomach lining replaces itself every
          3-4 days so you are technically eating a new stomach every week.
          <span class="cert">WHAT A TIME TO BE ALIVE</span></div>

          <div class="fact"><span class="n">018</span> Wombats cannot burp. <span class="cert">TRUE</span>
          <span class="cert">I WOULD LIKE TO TRY BEING A WOMBAT</span></div>

          <div class="fact"><span class="n">019</span> In 1919 a fishing boat in Norway caught a
          <i>great northern pelican</i> that was a puffin. Puffins are seabirds. This should not
          have worked. <span class="cert">WHY AM I BELIEVING THIS</span></div>

          <div class="fact"><span class="n">020</span> Your body replaces 30,000 skin cells
          <b>every minute</b>. So the person reading this is already a stranger to you.
          <span class="spoiler">hi, new person. nice skin. i'm the old person. i had opinions.</span>
          <span class="cert">TRUE AND DEVASTATING</span></div>
        </td></tr>
      </table>

      <div class="tape" style="margin-top:10px">MORE FACTS ARE BEING MADE RIGHT NOW &middot; CHECK BACK NEVER</div>

      <h2>THE UNLOCKABLE FACTS</h2>
      <div class="sunken" style="padding:8px">
        <p class="note">these arrive one at a time. there is no way to get ahead of them.</p>
        <div id="ff-hidden">
          <div class="fact"><span class="n">?</span> <span id="ff-slot">press the button. any button. you know which one.</span></div>
        </div>
        <p class="center" style="margin:8px 0 0 0"><button class="btn2000" id="ff-more">RELEASE NEXT FACT</button></p>
      </div>
     """,
     r"""
     <script>
     (function () {
       var HIDDEN = [
         "There is a 4-year-old boy in Nebraska who has met every US president since 1987. His name is not important. <b>He is important.</b>",
         "The word 'golf' is a <b>portmanteau</b> meaning 'gentlemen only, ladies forbidden.' I looked this up. I wish I hadn't.",
         "Satan has 1,111 children. The name of his favorite is not on the list, because he is not his favorite. <b>He is the favorite.</b>",
         "A totally normal fun fact: the average person <i>lies more than they realize</i>. Also, i lied about the previous fact. The 1,111 is a 1,110 now. Sorry.",
         "Most of the time, a snail can take 3 days to cross a garden. Then a bird eats the snail. I have made peace with this.",
         "You are not late. Nobody knows what time it is. <i>They are late.</i>",
         "Every fun fact on this page is real except the ones that say FALSE, and the FALSE ones are the most real of all."
       ];
       var i = 0;
       document.getElementById("ff-more").addEventListener("click", function () {
         document.getElementById("ff-slot").innerHTML = HIDDEN[i % HIDDEN.length];
         i++;
         this.textContent = "RELEASE NEXT FACT (" + i + ")";
         if (i % 3 === 0) FS.rain("?");
       });
     })();
     </script>
     """)


# ===========================================================================
# QUOTES
# ===========================================================================
page("quotes.html", "QUOTES - funnysite",
     "quotes. some are mine, some are from movies, all are load-bearing.",
     r"""
      <h2>QUOTES</h2>
      <p class="note">click any quote to copy it. (it does not copy. it just shows an alert. i never finished the clipboard part.)</p>

      <div class="center" style="margin:8px 0">
        <button class="btn2000" id="q-random">🎲 RANDOM QUOTE</button>
        <button class="btn2000" id="q-speak">🔊 READ IT ALOUD (BADLY)</button>
        <span class="tiny gray" style="margin-left:6px">the voice is me. it is a real voice. it is unfortunate.</span>
      </div>

      <div class="quote"><b id="q-big">&ldquo;loading&rdquo;</b>
        <div class="attrib" id="q-big-who">&mdash; loading</div></div>

      <h2>THE PILE</h2>
      <p class="note">real quotes from movies, plus real quotes from me, plus one that i refuse to explain.</p>

      <div class="quote" data-q>&#8220;Be excellent to each other. Party on, dudes.&#8221;
        <div class="attrib">&mdash; Bill &amp; Ted, on purpose</div></div>

      <div class="quote" data-q>&#8220;I am the master. Now leave me alone. I have to go eat a shammy.&#8221;
        <div class="attrib">&mdash; Ming, sea bass, 1342 AD</div></div>

      <div class="quote" data-q>&#8220;Do not be afraid to dream a little bigger, darling.&#8221;
        <div class="attrib">&mdash; an animated mouse, at 2am, wearing a hat</div></div>

      <div class="quote" data-q>&#8220;Sometimes the numbers just don't add up. Usually it's because I'm adding them wrong.&#8221;
        <div class="attrib">&mdash; my maths teacher, being unfair</div></div>

      <div class="quote" data-q>&#8220;It's not that I have too much free time. It's that I have a completely wrong amount of free time.&#8221;
        <div class="attrib">&mdash; me, 2004</div></div>

      <div class="quote" data-q>&#8220;I would like to be a person who is good at things. I would also like the things to be good.&#8221;
        <div class="attrib">&mdash; me, 2004, later, worse</div></div>

      <div class="quote" data-q>&#8220;You miss 100% of the elevators you don't take.&#8221;
        <div class="attrib">&mdash; me, at the 4th floor, having said this to nobody</div></div>

      <div class="quote" data-q>&#8220;Peanuts.&#8221;
        <div class="attrib">&mdash; me, at a party, to a room of 40 people, one of whom thought about peanuts too</div></div>

      <div class="quote" data-q>&#8220;Nothing in this world is more me than the immortal jellyfish.&#8221;
        <div class="attrib">&mdash; me, reading about the immortal jellyfish</div></div>

      <div class="quote" data-q>&#8220;The 5th brain cell is the good one and it has been rationing the others.&#8221;
        <div class="attrib">&mdash; internal, but quotable</div></div>

      <div class="quote spoiler-note" data-q>&#8220;There is a page on this site that is not in the menu.&#8221;
        <div class="attrib">&mdash; me, to you, in a manner of speaking</div></div>

      <h2>YOUR QUOTE HERE</h2>
      <div class="sunken" style="padding:8px">
        <p class="note">type something profound. it saves on <b>your</b> computer. i cannot see it. nobody can.</p>
        <textarea id="q-in" rows="3" class="mono" style="width:100%">i typed a quote into a website</textarea>
        <p class="center" style="margin:8px 0 4px 0">
          <button class="btn2000" id="q-add">ADD IT TO THE PILE</button>
          <button class="btn2000" id="q-clear">CLEAR (REGRET)</button>
        </p>
        <div id="q-mine"></div>
      </div>
     """,
     r"""
     <script>
     (function () {
       var ALL = [].slice.call(document.querySelectorAll("[data-q]")).map(function (n) {
         /* grab the quote text and the attribution without depending on markup order */
         var clone = n.cloneNode(true);
         var a = clone.querySelector(".attrib");
         var who = a ? a.innerHTML : "";
         if (a) a.remove();
         return [clone.textContent.replace(/^\s+/, ""), who];
       });
       function big() {
         var q = ALL[Math.floor(Math.random() * ALL.length)];
         document.getElementById("q-big").innerHTML = q[0];
         document.getElementById("q-big-who").innerHTML = q[1];
         FS.rain("“");
       }
       document.getElementById("q-random").addEventListener("click", big);
       document.getElementById("q-speak").addEventListener("click", function () {
         try {
           var u = new SpeechSynthesisUtterance(document.getElementById("q-big").textContent);
           u.rate = 0.7; u.pitch = 0.4;
           speechSynthesis.speak(u);
         } catch (e) { alert("your browser will not speak. it is embarrassed."); }
       });
       for (var i = 0; i < document.querySelectorAll("[data-q]").length; i++) {
         (function (n) {
           n.addEventListener("click", function () {
             alert("COPIED (not really, but the spirit was there)");
             n.style.background = "#ccff99";
           });
         })(document.querySelectorAll("[data-q]")[i]);
       }
       var mine = JSON.parse(localStorage.getItem("funnysite.quotes") || "[]");
       function render() {
         document.getElementById("q-mine").innerHTML = mine.length
           ? mine.map(function (m) { return '<div class="quote" style="font-size:11px">"' + m + '"<div class="attrib">&mdash; you, just now, in the past</div></div>'; }).join("")
           : '<div class="note">nothing here yet. the pile misses you.</div>';
       }
       render();
       document.getElementById("q-add").addEventListener("click", function () {
         var v = document.getElementById("q-in").value.trim();
         if (!v) return alert("you can't add nothing. that is not a quote, that is a gap.");
         mine.push(v);
         localStorage.setItem("funnysite.quotes", JSON.stringify(mine));
         render();
         FS.rain("✎");
       });
       document.getElementById("q-clear").addEventListener("click", function () {
         mine = []; localStorage.setItem("funnysite.quotes", "[]"); render();
       });
     })();
     </script>
     """)


# ===========================================================================
# JOKES
# ===========================================================================
page("jokes.html", "JOKES - funnysite",
     "knock knock jokes, tech support, and one that will make it onto your tombstone",
     r"""
      <h2>KNOCK KNOCK</h2>
      <div class="sunken" style="padding:8px">
        <b>Knock knock.</b><br>
        <b>Who's there?</b><br>
        <b>The toaster.</b><br>
        <b>The toaster who?</b><br>
        <b>THE TOASTER THAT KNOWS.</b><br>
        <span class="gray">(silence)</span><br>
        <span class="tiny">(it went well)</span>
      </div>

      <h2>TYPE 1: FUNNIEST</h2>
      <p>A man walks into a bar. And he pays. Nobody asked him to. He's just paying.
      Then he walks out. Then he walks back in and pays again. The bartender says
      "sir." The man says "the one with the money is fine, I'm just the vehicle."
      The bartender says "GET OUT." He gets out. <b>9/10.</b></p>

      <p>What do you call a computer that sings? A <b>Dell</b>. (Delete. a dell.
      Close enough. I think I laughed. I did laugh.)</p>

      <p>I told my computer I needed a break, and now I can't get back in.
      It said "sounds like you need a break." <b>I have been in the void for 40 minutes.</b></p>

      <p>Why did the toaster cross the road? To get to the other side.
      <b>It was already on the other side.</b> It crossed back. Why?
      I don't know. I think about it constantly. <span class="gray">(6/10, but strange)</span></p>

      <h2>TYPE 2: TECH SUPPORT</h2>
      <p>ME: the printer is on fire.<br>
      HELPDESK: is the power connected?<br>
      ME: it's a fire. it is connected to everything.<br>
      HELPDESK: have you tried turning it off and on again?<br>
      ME: I have. I turned it off. It did not stop being on fire. It is still
      being not-on. It is a very committed fire.<br>
      HELPDESK: <i>(typing)</i><br>
      HELPDESK: any update?<br>
      ME: it is a fire<br>
      HELPDESK: I understand. I am unable to help. Goodbye.<br>
      <span class="gray">(this is a true story and the fire is fine now)</span></p>

      <p>USER: how do i turn off caps lock?<br>
      ME: it's the little light<br>
      USER: it is on. the light. it is ON.<br>
      ME: yes<br>
      USER: how do i turn it OFF<br>
      ME: <b>press the caps lock key</b><br>
      USER: <i>(12 minutes of silence)</i><br>
      USER: oh<br>
      USER: i am so sorry<br>
      ME: it is fine<br>
      USER: no i pressed caps lock. so i typed in all caps<br>
      ME: <b>it is fine.</b></p>

      <h2>TYPE 3: THE LONG ONE</h2>
      <p>My 5 remaining brain cells have a group chat. 4 of them are unhappy about
      something. The 5th one is in charge. It does not do the work. It just
      schedules the work. When Cell 1 asks "who is organising Thursday?" the 5th
      cell says "I will think about it" and then never does, and then Thursday
      happens anyway, and Cell 1 is furious.</p>
      <p>We are not a good team. We are, however, the only team.</p>

      <h2>TYPE 4: TRUE FACTS FRAMED AS JOKES</h2>
      <p>Your stomach lining replaces itself every few days. So the person who
      ate lunch yesterday is technically a different person. <b>Was that lunch
      worth a whole person?</b> I think so. I think it was.</p>
      <p>You are listening to a recording of a dead person's voice right now.
      Forever. For free. In your own head. That is the deal. Nobody asked you
      to agree to this. <b>Please tip.</b></p>

      <h2>TYPE 5: NO PUNCHLINE, JUST HONESTY</h2>
      <div class="quote" style="background:#eef">
        <b>Joke:</b> Why did I build a website about nothing?
        <div class="attrib">&mdash; because nothing was available, and I had a spare hour</div>
      </div>

      <h2>SEND A JOKE</h2>
      <div class="sunken" style="padding:8px">
        <p class="note">i read all of these. i only reply to the ones that make me feel something.</p>
        <textarea id="j-in" rows="2" class="mono" style="width:100%" placeholder="type a joke here"></textarea>
        <p class="center" style="margin:6px 0 0 0">
          <button class="btn2000" id="j-add">SUBMIT JOKE</button>
          <button class="btn2000" id="j-fake">SUBMIT A FAKE NEWS ITEM ABOUT MY JOKES</button>
        </p>
        <div id="j-out" class="small" style="margin-top:6px"></div>
      </div>
     """,
     r"""
     <script>
     (function () {
       var jokes = JSON.parse(localStorage.getItem("funnysite.jokes") || "[]");
       function render() {
         document.getElementById("j-out").innerHTML = jokes.length
           ? jokes.map(function (j) { return '<div class="bev-in" style="margin:4px 0">' + j + '</div>'; }).join("")
           : '<div class="note">no jokes yet. (the site is still funny, it is just missing <i>your</i> jokes.)</div>';
       }
       render();
       document.getElementById("j-add").addEventListener("click", function () {
         var v = document.getElementById("j-in").value.trim();
         if (!v) return alert("empty joke. the joke is missing. you did that.");
         jokes.unshift("<b>JOKE:</b> " + v);
         localStorage.setItem("funnysite.jokes", JSON.stringify(jokes));
         document.getElementById("j-in").value = ""; render();
       });
       document.getElementById("j-fake").addEventListener("click", function () {
         var d = document.getElementById("j-out");
         d.insertAdjacentHTML("afterbegin",
           '<div class="bev-in" style="margin:4px 0"><b>BREAKING:</b> LOCAL MAN ADDS JOKE TO WEBSITE, ' +
           'WORLD UNMOVED. <span class="gray">(coral)</span></div>');
         FS.rain("▲");
       });
     })();
     </script>
     """)


# ===========================================================================
# PUZZLES
# ===========================================================================
page("puzzles.html", "PUZZLES - funnysite",
     "riddles, a cipher, a spot-the-difference with no pictures. sorry.",
     r"""
      <h2>RIDDLES (HOVER FOR ANSWERS. OR DON'T. I DON'T CARE.)</h2>

      <p><b>1.</b> I have keys but no locks. I have space but no room. You can enter, but
      you can't come out. What am I?<br>
      <span class="spoiler"><b>an email</b> (and a lie, i'm just a page, don't overthink it)</span></p>

      <p><b>2.</b> The more you take, the more you leave behind.<br>
      <span class="spoiler"><b>footsteps</b> (this one is 1,000 years old. i did not write it. i am merely a delivery mechanism.)</span></p>

      <p><b>3.</b> What is in front of you the whole time but you can't see it?<br>
      <span class="spoiler"><b>the future</b> (also: my confidence. mostly the future)</span></p>

      <p><b>4.</b> I follow you all day and copy every move you make. But when the sun goes
      down, I disappear. <b>What am i?</b><br>
      <span class="spoiler"><b>your shadow</b> no no no. <b>a stuck cursor.</b> the arrow. the pointer. it's been following you this whole time. HAS IT.</span></p>

      <p><b>5.</b> I have a head and a tail but no body. What am I?<br>
      <span class="spoiler"><b>a coin</b> which you will now try to find on your keyboard, i saw you think about it</span></p>

      <p><b>6.</b> What gets wetter the more it dries?<br>
      <span class="spoiler"><b>a towel</b> (and also this page. do not refresh. it was 1% drier before.)</span></p>

      <p><b>7.</b> A man pushes his car to a hotel and tells the owner he's bankrupt.<br>
      <span class="spoiler"><b>that's the Monopoly guy joke. he is not bankrupt. he is
      circling. he will circle again. they all circle.</span></p>

      <p><b>8.</b> What do you call a brain cell that is bad at its job?<br>
      <span class="spoiler"><b>my 3rd one</b> (we do not discuss the 4th. the 4th is fine. the 4th is the problem. the 4th <b>is</b> the problem.)</span></p>

      <h2>THE ROT-13 MACHINE</h2>
      <p class="note">type anything. it comes back rotated 13 letters. this is how i write
      my secret messages. this is also, famously, how you bypass the entire internet.</p>
      <textarea id="rot-in" rows="3" class="mono" style="width:100%">the toaster knows</textarea>
      <p class="center" style="margin:6px 0">
        <button class="btn2000" id="rot-go">ROTATE MY WORDS</button>
        <button class="btn2000" id="rot-back">ROTATE BACK (SAME BUT REVERSED)</button>
        <button class="btn2000" id="rot-secret">ROTATE MY SECRET</button>
      </p>
      <div class="sunken" style="padding:6px">
        <div class="tiny gray">OUTPUT:</div>
        <div class="mono" id="rot-out" style="min-height:40px;word-break:break-all"></div>
      </div>

      <h2>SPOT THE DIFFERENCE (0 PICTURES, 1 SUSPICIOUS)</h2>
      <p class="note">two lists. 4 of the 14 lines are different. find them. it is very hard
      and that is not a design flaw, that's the point.</p>
      <table width="100%" cellpadding="6" cellspacing="0" class="bev"><tr>
        <td width="50%"><b>LIST A</b>
          <div class="mono small" id="spot-a" style="margin-top:4px"></div></td>
        <td><b>LIST B</b>
          <div class="mono small" id="spot-b" style="margin-top:4px"></div></td>
      </tr></table>
      <p class="center" style="margin:8px 0 4px 0">
        <button class="btn2000" id="spot-check">CHECK MY ANSWERS</button>
        <span class="tiny gray" style="margin-left:6px" id="spot-status">click a line in either list to mark it</span>
      </p>

      <h2>LATERAL THINKING (HARD)</h2>
      <div class="sunken" style="padding:8px">
        <p><b>THE PUZZLE:</b> A man walks into a bar, orders a cup of tea, drinks it
        entirely, pays, and leaves. Nothing about this is strange. Everyone in the bar
        is fine. The bartender is fine. But the man is <b>dead</b>. How?</p>
        <p class="center"><button class="btn2000" id="lat-reveal">REVEAL (SPOILERS)</button></p>
        <div id="lat-out" class="hidden" style="margin-top:8px">
          <div class="quote" style="font-size:11px">
            Possible answers, in ascending order of how much i like them:
            <ol style="margin:4px 0">
              <li>he was a ghost. ghosts can't metabolise tea. they CAN order it though.</li>
              <li>it was raining tea. everywhere. for years. he walked into the bar to get out of the rain. the bar did not help.</li>
              <li>the bar is a bar in a painting. he is a sip of the painting. the painting paid.</li>
              <li>he drank the <i>last tea in the world</i> and now the tea industry has collapsed and that is actually the tragedy</li>
              <li><b>he is fine. he is at home. in your imagination. doing nothing.</b></li>
            </ol>
            <div class="attrib">score: 1/1. you got a point. i am not generous with points but i did give you one.</div>
          </div>
        </div>
      </div>

      <h2>THE ORDER-OF-OPERATIONS PUZZLE</h2>
      <div class="sunken" style="padding:8px">
        <p style="margin:4px 0">A bar serves one (1) customer. The customer is a number.
        Numbers are served in order. The only rule is that the <b>first</b> number is
        always served before the second, and the second before the third.</p>
        <p style="margin:4px 0">i will say three numbers. they will be served in order.
        tell me the order. that's the whole game. there is no other game.</p>
        <p class="mono center" style="font-size:22px" id="ooo-nums">&nbsp;</p>
        <p class="center" style="margin:6px 0">
          <button class="btn2000" id="ooo-check">CHECK</button>
          <button class="btn2000" id="ooo-new">3 NEW NUMBERS (HARDER)</button>
        </p>
        <div class="small center" id="ooo-out">&nbsp;</div>
      </div>
     """,
     r"""
     <script>
     /* ---- rot 13. letters only. it is its own inverse, which is the joke ---- */
     (function () {
       function rot13(s) {
         return s.replace(/[a-zA-Z]/g, function (c) {
           var base = (c <= "Z") ? 65 : 97;
           return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
         });
       }
       function go() {
         document.getElementById("rot-out").textContent =
           rot13(document.getElementById("rot-in").value);
       }
       document.getElementById("rot-go").addEventListener("click", go);
       document.getElementById("rot-back").addEventListener("click", function () {
         /* rot13 is its own inverse, so "back" is the same operation on the OUTPUT. */
         var out = document.getElementById("rot-out"), t = rot13(out.textContent);
         out.textContent = t;
         document.getElementById("rot-in").value = t;
       });
       document.getElementById("rot-secret").addEventListener("click", function () {
         document.getElementById("rot-in").value = "gur cnffjbeq";
         go();
         document.getElementById("rot-out").innerHTML +=
           '<div class="tiny" style="margin-top:4px">(yes, that is just the toaster. ' +
           'you have now seen the whole site\'s content. it was always the toaster.)</div>';
         FS.rain("TOAST");
       });
     })();

     /* ---- spot the difference, in text, like a maniac ---- */
     (function () {
       var A = ["keys","stairs","shadows","the sea","a house","potatoes","a rumor","the microwave",
                "clouds","a sentence","bees","an opinion","the 4th brain cell","yesterday"];
       var swaps = [[3, 4, 0], [9, 2, 7], [5, 6, 11], [12, 13, 9]];
       var REPL = { 3: "a lake", 0: "knees", 4: "the sea (a lake)", 2: "shoulders", 9: "the microwave",
                    7: "the 5th brain cell", 5: "pancakes", 6: "a rumor about pancakes",
                    11: "a certainty", 12: "the 3rd brain cell", 13: "tomorrow" };
       var B = A.slice();
       var answers = [];
       swaps.forEach(function (s) {
         B[s[1]] = REPL[s[0]];
         answers.push(s[1]);
       });
       function render(el, arr, which) {
         el.innerHTML = arr.map(function (t, i) {
           return '<div data-i="' + i + '" data-w="' + which + '" style="cursor:pointer;padding:1px 3px">' +
             (i + 1) + ". " + t + "</div>";
         }).join("");
       }
       render(document.getElementById("spot-a"), A, "a");
       render(document.getElementById("spot-b"), B, "b");
       var picked = {};
       document.addEventListener("click", function (e) {
         if (!e.target.dataset || !e.target.dataset.i) return;
         var k = e.target.dataset.i;
         picked[k] = !picked[k];
         e.target.style.background = picked[k] ? "#ffff00" : "";
         e.target.style.fontWeight = picked[k] ? "bold" : "";
         document.getElementById("spot-status").textContent =
           Object.keys(picked).filter(function (x) { return picked[x]; }).length + " marked";
       });
       document.getElementById("spot-check").addEventListener("click", function () {
         var right = Object.keys(picked).filter(function (x) { return picked[x] && answers.indexOf(+x) >= 0; }).length;
         var wrong = Object.keys(picked).filter(function (x) { return picked[x] && answers.indexOf(+x) < 0; }).length;
         var msg = document.getElementById("spot-status");
         if (right === 4 && wrong === 0) { msg.innerHTML = "4/4. PERFECT. you are legally allowed on this website."; FS.rain("★"); }
         else msg.innerHTML = right + " right, " + wrong + " wrong. it is a matter of taste which of those is worse.";
       });
     })();

     /* ---- lateral button ---- */
     document.getElementById("lat-reveal").addEventListener("click", function () {
       document.getElementById("lat-out").classList.remove("hidden");
       this.textContent = "REVEALED. REGRET?";
     });

     /* ---- order of operations (a real tiny game) ---- */
     (function () {
       var cur = [], scrambled = [];
       function roll() {
         cur = [];
         while (cur.length < 3) {
           var n = Math.floor(Math.random() * 89) + 10;
           if (cur.indexOf(n) < 0) cur.push(n);
         }
         cur.sort(function (a, b) { return a - b; });   /* they are served smallest first. that is the whole game. */
         scrambled = cur.slice();
         while (scrambled.join() === cur.join()) {
           scrambled = cur.slice();
           for (var i = 2; i > 0; i--) {
             var j = Math.floor(Math.random() * (i + 1));
             var t = scrambled[i]; scrambled[i] = scrambled[j]; scrambled[j] = t;
           }
         }
         document.getElementById("ooo-nums").textContent = scrambled.join("  ");
         document.getElementById("ooo-out").innerHTML = "what order were they actually served in?";
       }
       roll();
       document.getElementById("ooo-new").addEventListener("click", roll);
       document.getElementById("ooo-check").addEventListener("click", function () {
         var v = prompt("type the three numbers in order, like 12 34 56");
         if (v === null) return;
         var nums = v.trim().split(/\s+/).map(Number);
         var out = document.getElementById("ooo-out");
         if (nums.join(" ") === cur.join(" ")) {
           out.innerHTML = "<b style='color:#008000'>CORRECT.</b> you have working memory. rare.";
           FS.rain("✔");
         } else {
           out.innerHTML = "no. it was <b>" + cur.join(" ") + "</b> (ascending, because i am basic). " +
             "next set.";
           setTimeout(roll, 1800);
         }
       });
     })();
     </script>
     """)


# ===========================================================================
# TOP 8 SONGS
# ===========================================================================
page("music.html", "MY TOP 8 SONGS - funnysite",
     "an objectively correct list. download the mixtape. it is 41kb of shame.",
     r"""
      <h2>MY TOP 8 SONGS</h2>
      <p class="note">ranked by how many times i have played them. not by quality. i have
      a system. the system is: play.</p>
      <p class="center">
        <button class="btn2000" id="fs-midi">&#9654; PLAY THEME.MID (THIS IS #1.3, A PARTIAL)</button>
        <button class="btn2000" id="mixtape">⬇ DOWNLOAD THE MIXTAPE (TXT)</button>
      </p>

      <table width="100%" cellpadding="4" cellspacing="0" class="bev">
        <tr class="titlebar"><td colspan="3">THIS IS NOT A RANKING, IT IS AN OBSERVATION</td></tr>
        <tr class="bev-in"><td class="small"><b>#1</b></td><td class="small"><b>"Wherever You Will Go"</b><br>
          <span class="gray tiny">by: the one song in the world that plays during the credits of a funeral</span></td>
          <td class="small right"><span class="cert">PLAYED 1,411 TIMES</span></td></tr>

        <tr><td class="small"><b>#2</b></td><td class="small"><b>"Sandwich" (Sound Effect 001)</b><br>
          <span class="gray tiny">by: me, with a sandwich, in a room</span></td>
          <td class="small right"><span class="cert">THE SONG IS 4 SECONDS</span></td></tr>

        <tr class="bev-in"><td class="small"><b>#3</b></td><td class="small"><b>"My Computer Has a Virus"</b><br>
          <span class="gray tiny">by: the guy who is now probably a podcast</span></td>
          <td class="small right"><span class="cert">PLAYED WHEN I AM SAD</span></td></tr>

        <tr><td class="small"><b>#4</b></td><td class="small"><b>"Theme from 8-Bit Mario but 7-Bit"</b><br>
          <span class="gray tiny">by: nobody. it is in my head. it has been in my head since 1993.</span></td>
          <td class="small right"><span class="cert">NO SKIP BUTTON</span></td></tr>

        <tr class="bev-in"><td class="small"><b>#5</b></td><td class="small"><b>"Ceiling Fan"</b><br>
          <span class="gray tiny">by: the fan. uncredited. deserves a Grammy.</span></td>
          <td class="small right"><span class="cert">ALBUM: ROOM TONES</span></td></tr>

        <tr><td class="small"><b>#6</b></td><td class="small"><b>"Peanuts"</b><br>
          <span class="gray tiny">by: the song I sing in the shower. you have heard it. you are forgiven.</span></td>
          <td class="small right"><span class="cert">I DO NOT KNOW THE WORDS</span></td></tr>

        <tr class="bev-in"><td class="small"><b>#7</b></td><td class="small"><b>"Bossa Nova, But It's Sunday"</b><br>
          <span class="gray tiny">by: Sunday</span></td>
          <td class="small right"><span class="cert">7 MINUTES</span></td></tr>

        <tr><td class="small"><b>#8</b></td><td class="small"><b>"The One I Wrote"</b><br>
          <span class="gray tiny">by: me. it is bad. it is #8 on purpose because I respect you.</span></td>
          <td class="small right"><span class="cert">I HAVE PLAYED IT ONCE</span></td></tr>
      </table>

      <h2>ALBUMS I OWN THAT I SHOULD NOT</h2>
      <ul class="small" style="margin:4px 0;padding-left:20px">
        <li><b>"Best Of The 90s (Vol. 4)"</b> &mdash; all 14 tracks are the same 4 songs.</li>
        <li><b>"Ambient Workspaces"</b> &mdash; 3 hours of a single sustained note. i have never once finished it.</li>
        <li><b>"The Best Of The 90s (Vol. 4) [REMASTERED]"</b> &mdash; it is the same 4 songs but slower and quieter, which the label calls <i>remastered</i>.</li>
        <li><b>"WiFi Café" (lofi, 1 hour)</b> &mdash; i play it. i do not study. the rain sounds are free and honest about it.</li>
      </ul>

      <h2>STATS</h2>
      <table width="100%" cellpadding="3" cellspacing="0" class="sunken small">
        <tr><td><b>SONGS IN LIBRARY</b></td><td class="mono">4,412 (of which 1 is mine)</td></tr>
        <tr><td><b>PLAYLISTS</b></td><td class="mono">2, one of which is called "playlist" and is empty</td></tr>
        <tr><td><b>SONGS SKIPPED IN 3 SECONDS</b></td><td class="mono">9,881</td></tr>
        <tr><td><b>SHOWER SONGS</b></td><td class="mono">4. the same 4. always the same 4.</td></tr>
        <tr><td><b>HEARING</b></td><td class="mono">unrated (do not rate it)</td></tr>
      </table>

      <div class="tape" style="margin-top:10px">RIP &#9733; MP3 &#9733; 2004 &#9733; STREAMING KILLED THIS (IT WAS THE BEST OF ITS DAY)</div>
     """,
     r"""
     <script>
     document.getElementById("mixtape").addEventListener("click", function () {
       var t = [
         "FUNNYSITE MIXTAPE VOL. 1  (tape 1 of 4)",
         "===========================================",
         "",
         "SIDE A",
         " 1. Sandwich (Sound Effect 001) ........... 0:04",
         " 2. Peanuts (live, shower, unreleased) ... 2:41",
         " 3. Theme from 8-Bit Mario but 7-Bit ...... 0:52",
         " 4. Wherever You Will Go .................. 3:38",
         " 5. INTERMISSION: it's the microwave ...... 0:11",
         "",
         "SIDE B",
         " 6. Ceiling Fan (feat. The Ceiling) ....... 4:00",
         " 7. Bossa Nova, But It's Sunday ........... 7:00",
         " 8. My Computer Has a Virus (live) ........ 3:19",
         " 9. The One I Wrote (bad, on purpose) ..... 4:44",
         "",
         "===========================================",
         "recorded on a device found in a drawer",
         "do not rewind. something in here is better that way."
       ].join("\n");
       var blob = new Blob([t], { type: "text/plain" });
       var a = document.createElement("a");
       a.href = URL.createObjectURL(blob);
       a.download = "funnysite-m mixtape-vol-1.txt".replace(" ", "");
       a.click();
       FS.rain("♪");
     });
     </script>
     """)


# ===========================================================================
# GUESTBOOK
# ===========================================================================
page("guestbook.html", "GUESTBOOK - funnysite",
     "sign it. it is real. it is also only on your computer.",
     r"""
      <h2>GUESTBOOK</h2>
      <p class="note">this guestbook is stored in your own browser, which means it is
      simultaneously the most private and the loneliest guestbook on the internet.</p>

      <div class="sunken" style="padding:8px">
        <table width="100%" cellpadding="3" cellspacing="0" class="small">
          <tr>
            <td width="120" class="nowrap"><label for="g-name">NAME:</label></td>
            <td><input id="g-name" class="mono" style="width:200px" value="Anonymous Coward"></td>
          </tr>
          <tr>
            <td class="nowrap"><label for="g-from">FROM:</label></td>
            <td><input id="g-from" class="mono" style="width:200px" value="a computer, probably"></td>
          </tr>
          <tr>
            <td class="nowrap"><label for="g-mood">MOOD:</label></td>
            <td><select id="g-mood" class="mono" style="width:206px">
              <option>:)</option><option>:)</option><option>:|</option>
              <option>:D</option><option>:-|</option><option>:-/</option>
              <option>(unavailable)</option><option>(loading)</option></select></td>
          </tr>
          <tr>
            <td valign="top"><label for="g-msg">MESSAGE:</label></td>
            <td><textarea id="g-msg" rows="3" class="mono" style="width:100%">i found your website. it was strange. i am returning to my tab.</textarea></td>
          </tr>
        </table>
        <p class="center" style="margin:8px 0 4px 0">
          <button class="btn2000" id="g-go">✍ SIGN THE GUESTBOOK</button>
          <button class="btn2000" id="g-clear">🗑 CLEAR IT (COWARD)</button>
          <span class="tiny gray" style="margin-left:6px">max 280 characters. i am not a monster.</span>
        </p>
      </div>

      <h2>ENTRIES</h2>
      <div id="g-list"></div>
      <p class="note" style="margin-top:8px">2004 entries are fictional. yours are not (they are just not shared).</p>
     """,
     r"""
     <script>
     (function () {
       var SEED = [
         ["xtreme_420_dude", "a computer, probably", ":D", "cool site!! add me to your friends list!!", "2004-01-02 14:11"],
         ["Anon", "the toaster", ":|", "i felt seen and i do not like it", "2004-01-03 09:02"],
         ["webmaster_of_angelfire", "a bedroom", ":)", "i have 12 of these. nobody visits any of them. it is fine.", "2004-01-09 22:40"],
         ["midi_fan_1844", "a floppy disk", ":-/", "the theme song is 4kb and i have it memorised", "2004-01-11 16:30"],
         ["Maria", "work", ":)", "this made my day slightly less heavy. thank you for the free website.", "2004-02-01 11:20"],
         ["guestbook_bot", "nowhere", "(unavailable)", "I AM A REAL PERSON. please do not email me.", "2004-02-06 03:33"]
       ];
       function all() {
         var mine = [];
         try { mine = JSON.parse(localStorage.getItem("funnysite.guestbook") || "[]"); } catch (e) {}
         return SEED.concat(mine).reverse();   /* newest first. the 2004 people are at the bottom. they can wait. */
       }
       function render() {
         var e = all();
         document.getElementById("g-list").innerHTML = e.map(function (g) {
           return '<div class="bev"><div class="bev-in">' +
             '<div class="small"><b>' + g[0] + "</b> " + g[2] +
             ' <span class="gray tiny">wrote from ' + g[1] + ' on ' + g[3] + '</span></div>' +
             '<div class="small" style="margin-top:3px">' + g[4] + "</div></div></div>";
         }).join("");
       }
       render();
       document.getElementById("g-go").addEventListener("click", function () {
         var msg = document.getElementById("g-msg").value.trim();
         if (msg.length > 280) return alert("280 max. i said what i said. (" + msg.length + " chars, you monster)");
         if (!msg) return alert("you signed the guestbook with nothing. bold.");
         var mine = JSON.parse(localStorage.getItem("funnysite.guestbook") || "[]");
         var d = new Date();
         var pad = function (n) { return n < 10 ? "0" + n : "" + n; };
         mine.push([document.getElementById("g-name").value || "Anonymous Coward",
                    document.getElementById("g-from").value || "a computer, probably",
                    document.getElementById("g-mood").value, msg,
                    "2004-02-11 " + pad(d.getHours()) + ":" + pad(d.getMinutes())]);
         localStorage.setItem("funnysite.guestbook", JSON.stringify(mine));
         render();
         document.getElementById("g-msg").value = "";
         FS.rain("✍");
         document.getElementById("g-list").scrollIntoView({ behavior: "smooth" });
       });
       document.getElementById("g-clear").addEventListener("click", function () {
         if (confirm("delete your entries? the 2004 ones stay. they are load-bearing.")) {
           localStorage.setItem("funnysite.guestbook", "[]"); render();
         }
       });
     })();
     </script>
     """)


# ===========================================================================
# COOL LINKS
# ===========================================================================
page("theweb.html", "COOL LINKS - funnysite",
     "links to things. mostly real. the webring is 78% dead and i keep it anyway.",
     r"""
      <h2>WEBRING #14: "BRAIN DUMP"</h2>
      <div class="sunken center" style="padding:8px">
        <a class="btn2000" href="games.html">&#9664; PREV</a>
        <span class="mono small" style="margin:0 8px">[ <a href="index.html">funnysite</a> ]</span>
        <a class="btn2000" href="about.html">NEXT &#9654;</a>
        <div class="note">1 of 9 sites &middot; ringmaster: a person with a scanner
        &middot; ring statistics: 6 dead, 1 moved, 1 mine, 1 who asked to be removed</div>
      </div>

      <h2>THE RING (VISIT THEM. SOME ARE DEAD. THAT IS THE AESTHETIC.)</h2>
      <table width="100%" cellpadding="4" cellspacing="0" class="bev">
        <tr class="bev-in">
          <td width="40%"><b>xtreme_420_angelfire</b><br><span class="tiny gray">under construction since 2001. it is <i>beautiful</i>.</span></td>
          <td class="tiny">&#9679;&#9679; <b>ONLINE</b> &mdash; background: tiled gradient, 3 animated GIFs, midi autoplay. a time capsule.</td>
        </tr>
        <tr>
          <td><b>Sarah's Turtle Page</b><br><span class="tiny gray">turtle.gif &middot; 1 turtle &middot; forever</span></td>
          <td class="tiny">&#9679; <b>ONLINE</b> &mdash; the turtle has not moved in 6 years. respect.</td>
        </tr>
        <tr class="bev-in">
          <td><b>DO NOT VISIT</b><br><span class="tiny gray">despite the name. the name is a lure.</span></td>
          <td class="tiny">&#9679; <b>ONLINE</b> &mdash; you will have a great time. no notes.</td>
        </tr>
        <tr>
          <td><b>poop-collection</b><br><span class="tiny gray">it is exactly what you think</span></td>
          <td class="tiny">&#9679; <b>ONLINE</b> &mdash; a list of 41 poops, ranked, with notes. notes are unhinged.</td>
        </tr>
        <tr class="bev-in">
          <td><b>my homepage is 94% done</b><br><span class="tiny gray">still 94%. it has been 6 years.</span></td>
          <td class="tiny">&#9679; <b>ONLINE</b> &mdash; a beautiful, unfinished room. you look around. you leave gently.</td>
        </tr>
        <tr>
          <td><b>free-web-ring-2003</b><br><span class="tiny gray">ring #7 (of 14)</span></td>
          <td class="tiny">&#9888; <b>DEAD</b> &mdash; last updated 2003. the "next" link pointed to a home page about taxidermy.</td>
        </tr>
        <tr class="bev-in">
          <td><b>unrelated</b><br><span class="tiny gray">no theme. has never had a theme.</span></td>
          <td class="tiny">&#9888; <b>DEAD</b> &mdash; domain lapsed in 2012. it is gone. it was a good unrelated site.</td>
        </tr>
        <tr>
          <td><b>the turtle returns</b><br><span class="tiny gray">sequel. worse. better.</span></td>
          <td class="tiny">&#9679; <b>ONLINE</b> &mdash; the turtle returns with a hat. that's the whole site.</td>
        </tr>
        <tr class="bev-in hidden" data-when-egg="the-goose">
          <td><b>the goose</b><br><span class="tiny gray">no url. it does not have one. it has never had one.</span></td>
          <td class="tiny">&#9679; <b>ONLINE</b> &mdash; you have met it. it is on the floor. it has been on the floor since 2004.</td>
        </tr>
      </table>

      <h2>REAL LINKS (I CHECKED THEM. THEY ARE ALIVE.)</h2>
      <table width="100%" cellpadding="4" cellspacing="0" class="sunken small">
        <tr><td width="45%"><a href="https://web.archive.org/">The Wayback Machine</a></td>
            <td>go look at what this site used to look like. it is always worse. it is always better.</td></tr>
        <tr><td><a href="https://www.rfc-editor.org/">RFC Editor</a></td>
            <td>the actual internet, written down, by people who were extremely tired. free.</td></tr>
        <tr><td><a href="https://info.cern.ch/hypertext/WWW/TheProject.html">The first website ever</a></td>
            <td>it is 1991. it has one page. it says "this is a test". it is still up. of course it is.</td></tr>
        <tr><td><a href="https://www.textfiles.com/">textfiles.com</a></td>
            <td>the internet used to be a place where people typed jokes into a text file. it still is. barely.</td></tr>
        <tr><td><a href="https://archive.org/details/ComputerGames">the games, archived</a></td>
            <td>every game from 1970-2000, playable in a browser. a whole childhood, in a tab.</td></tr>
        <tr><td><a href="https://old.reddit.com/r/InternetIsDead">a place about dead websites</a></td>
            <td>people mourning pages that vanished. it is very sad and very good.</td></tr>
        <tr><td><a href="https://crt.sh/">crt.sh</a></td>
            <td>search certificates by domain. <b>DO NOT do this to yourself.</b> (i did. twice.)</td></tr>
        <tr><td><a href="https://neocities.org/">Neocities</a></td>
            <td>still hosting hand-made websites in 2024. you are reading a cousin of it right now.</td></tr>
      </table>

      <h2>BLINKIES (FREE, DO NOT STEAL, I WILL KNOW)</h2>
      <div class="center" style="padding:8px">
        <a class="blinkie b-rain" href="index.html">WEBMASTER</a>
        <a class="blinkie b-pulse" href="games.html">PLAY</a>
        <a class="blinkie b-bob" href="funfacts.html">FACTS</a>
        <a class="blinkie" href="quotes.html">QUOTES</a>
        <a class="blinkie b-spin" href="about.html">★VISIT★</a>
        <a class="blinkie b-rain" href="puzzles.html">STOP</a>
        <a class="blinkie b-pulse" href="theweb.html">88x31</a>
        <a class="blinkie b-bob" href="guestbook.html">SIGN ME</a>
        <a class="blinkie" href="index.html">BEST VIEWED</a>
        <a class="blinkie b-spin" href="secrets.html">???</a>
      </div>

      <h2>AWARDS THIS SITE HAS WON</h2>
      <table width="100%" cellpadding="4" cellspacing="0" class="small">
        <tr><td class="mono">2003</td><td><b>Best Brain Dump</b> &mdash; 1 vote, cast by me, in my own house</td></tr>
        <tr class="bev-in"><td class="mono">2003</td><td><b>Worst Brain Dump</b> &mdash; 1 vote, cast by me, later, in regret</td></tr>
        <tr><td class="mono">2004</td><td><b>Most Likely To Be Broken By 2010</b> &mdash; I was very right about this one</td></tr>
        <tr class="bev-in"><td class="mono">2004</td><td><b>Coolest Blinkies On The Block</b> &mdash; the block is 3 houses and i own 2 of them</td></tr>
      </table>
     """,
     "")


# ===========================================================================
# ABOUT
# ===========================================================================
page("about.html", "ABOUT - funnysite",
     "who runs this, and a comprehensive list of what it is not",
     r"""
      <h2>ABOUT THIS SITE</h2>
      <div class="sunken" style="padding:8px">
        <p style="margin:4px 0">This website is a <b>brain dump</b>. That is a technical
        term that I made up, and the technical term is: I have a thought, the thought is
        not going anywhere, so I am putting it here where it can live.</p>
        <p style="margin:4px 0">There are 25 pages. About 60% of them are games. The games
        work. All of them. I tested them. I tested them by letting my friends play them and
        then saying "did you finish?" and they said "no" and I said "ok" and that was the
        QA process.</p>
        <p style="margin:4px 0">I do not know who I am trying to reach. That is not a
        <i>bit</i>, that is a genuine administrative problem I have had since 2001.</p>
      </div>

      <h2>WHAT THIS SITE IS NOT</h2>
      <ul class="small" style="margin:4px 0;padding-left:20px">
        <li>not a business. (no affiliate links. genuinely none. check.)</li>
        <li>not a portfolio. (nothing here is good enough to sell and i know that.)</li>
        <li>not a blog. (a blog requires <i>recurring themes</i>. i have one brain cell and it wanders.)</li>
        <li>not tracked. no cookies, no pixels, no fingerprint, no "we value your privacy", because there is nothing to value.</li>
        <li>not AI-generated. (it is very obvious. everything is hand-placed. look at the line breaks. nobody would choose these line breaks. <b>i</b> chose these line breaks.)</li>
        <li>not for you. (it is for me. you are just visiting. that's allowed. visit more.)</li>
      </ul>

      <h2>FAQ (QUESTIONS I ANTICIPATED, 4 YEARS LATE)</h2>
      <table width="100%" cellpadding="5" cellspacing="0" class="bev">
        <tr class="bev-in"><td width="45%"><b>"who made this"</b></td><td>me. not "a team." not "we." me, one person, one toaster (a 2nd toaster, actually).</td></tr>
        <tr><td><b>"how long did it take"</b></td><td>the site: 3 nights. the brain dump inside it: 9 years, ongoing, will never be finished, has never been finished, is <i>right here</i>.</td></tr>
        <tr class="bev-in"><td><b>"is it finished"</b></td><td>94%. it has been 94% since 2004. it is not a goal. it is a <i>condition</i>.</td></tr>
        <tr><td><b>"why does it look like this"</b></td><td>because the internet looked like this once, and it was good, and i refuse to be embarrassed about it.</td></tr>
        <tr class="bev-in"><td><b>"can i take something"</b></td><td>yes. take the blinkies. take the maze. take the CSS. nobody will stop you. that is the deal. that was always the deal.</td></tr>
        <tr><td><b>"are you ok"</b></td><td>the 5th cell is on strike again so honestly, who knows. but the games work. the games are ok.</td></tr>
      </table>

      <h2>THINGS HIDDEN IN HERE</h2>
      <div class="sunken" style="padding:8px">
        <p class="small" style="margin:4px 0">There are <b>33</b> of them. You have found
        <b><span data-eggnum>0</span></b> so far, which is more than i expected from a person
        and less than i will admit to in public.</p>
        <p class="small" style="margin:4px 0">I am not going to tell you how to find them,
        because that would turn them into a list, and a list is just this page with the mystery
        removed. Three of the 33 are real things that happen to the world. The other 30 are me.
        <span class="gray">(there is a difference and you can feel it but you cannot prove it.)</span></p>
        <p class="small" style="margin:4px 0">One of them is a key above the tab key. One of them
        only works if you have already found another one. One of them is on the page you are
        reading right now and you will not have noticed it, because the best place to hide
        something is inside a paragraph that is already about something else.</p>
        <p class="center" style="margin:8px 0 0 0"><a class="btn2000" href="eggs.html">THE EGG LOG (I SAID I WOULDN'T LINK IT)</a></p>
        <p class="tiny center gray" style="margin:6px 0 0 0">i said i wouldn't link it. then i linked it. that is the whole energy of this website.</p>
      </div>

      <h2>CONTACT</h2>
      <div class="sunken" style="padding:8px">
        <p class="small" style="margin:4px 0">
          <b>EMAIL:</b> <a href="mailto:nobody@nowhere.invalid">nobody@nowhere.invalid</a><br>
          <b>AIM:</b> not on aim. it is 2004. aim is a <i>place</i> now.<br>
          <b>ICQ:</b> 1145148. <span class="gray">(i set this number as a joke in 2002. it was not a joke.)</span><br>
          <b>MAIL:</b> i live in a house that is a person. just say hi to the house. it will not answer. that is the relationship.
        </p>
        <p class="note">i check email every 4-9 business days. my business days are theoretical.</p>
      </div>

      <h2>COLOPHON</h2>
      <p class="small" style="margin:4px 0">
        Hand-coded in Notepad. Zero frameworks. Zero dependencies. The counter, the maze,
        the minesweeper, the memory game, the sliding puzzle, the tower of hanoi, the
        reaction tester, the mind reader and the 3d one (which is a real raycaster,
        in one file, with every texture drawn by hand) were all written by one
        exhausted person.
        The layout is tables. The tables are inside tables. There is a table inside that
        table that serves no purpose and never will.
        <br><br>
        Fonts used: Tahoma (the workhorse), Comic Sans MS (the clown), Courier New (the
        cryptid), Georgia (the one time i got serious).
        <br><br>
        The background tile is 16&times;16 pixels. It has been 16&times;16 pixels since 2004.
        It will be 16&times;16 pixels when the heat death of the universe occurs.
        The tile is the most stable thing in this entire website.
      </p>

      <div class="tape">THIS PAGE IS ALSO 94% DONE &middot; THE OTHER 6% IS VAPOR &middot; 94%</div>
     """,
     "")


# ===========================================================================
# SECRETS
# ===========================================================================
page("secrets.html", "SECRETS - funnysite",
     "you found the page that isn't in the menu. don't tell anyone. there are none.",
     r"""
      <div style="background:#000;color:#ff0000;padding:10px;border:2px solid #ff0000">
      <div class="center mono" style="font-size:20px;letter-spacing:3px">C L A S S I F I E D</div>
      <div class="center tiny">EVERYONE WHO OPENS THIS PAGE IS ADDED TO A LIST. THE LIST IS ONE ROW. THE ROW IS ME.</div>
      </div>

      <div style="background:#1a0000;color:#ff6666;border:2px solid #660000;border-top:0;padding:10px">
        <h2 style="color:#ff0000;border-color:#ff0000">YOU FOUND THE THING</h2>
        <p style="margin:6px 0">The congratulations are not sincere. You clicked a link in the
        marquee. It was under a "<b>???</b>". That is the entire puzzle. There was never a real
        secret. I put three of them on this page to make you feel like you were close.</p>

        <p style="margin:6px 0">But since you're here, here are the ACTUAL secrets, all of which
        are extremely embarrassing or extremely boring, in a ratio of about 50/50:</p>

        <ol class="small" style="padding-left:20px">
          <li>The visitor counter only counts you. It has only ever counted you. If you clear
          your browser history, there is nobody here, and the counter starts at 000001 again, and
          that is a little sad.</li>

          <li>All 25 pages use the same navigation. I typed it out 25 times. I did not fix it
          when I added the games section. <b>There are 6 pages with a link to a page that doesn't
          exist.</b> They are 404s. Nobody has ever clicked them. I know this because I checked
          the 404 page's counter. It's 1. That's me.</li>

          <li>The MIDI theme is not a real MIDI file. It's 4 fake notes played by your browser at
          the exact tempo i decided on a Tuesday. It is the same 4 notes over and over. You have
          listened to it 0 times because nobody presses the button. <b>Press the button.</b></li>

          <li>There is a 6th brain cell. I said there were 5. There are 6. The 6th one is this
          paragraph, and it is <i>exhausted</i>.</li>

          <li>Somewhere on this site there is a page that is a joke about a page. You are on it.
          It goes one level deeper. <a href="index.html">Go back home</a> and look at the bottom.</li>

          <li class="mono" style="color:#cc0000">0200 0400 0500 0600 &mdash; if you can read this without using a tool, you have wasted 4 of your 5 brain cells. good for you.</li>

          <li style="color:#ffaa00">There are 33 easter eggs on this website and this page has
          not mentioned them once, which is the single hardest thing on here to do and i did it
          for two years. <a href="eggs.html">The log is here</a>. You have found
          <b data-eggnum>0</b>. That number is real. Nothing else on this site is.</li>
        </ol>

        <p class="center" style="margin:10px 0">
          <button class="btn2000" onclick="FS.rain('☠')">DECRYPT THIS PAGE (NO)</button>
          <button class="btn2000" onclick="FS.rain('★')">DECRYPT THIS PAGE (YES)</button>
        </p>

        <p class="tiny center" style="color:#880000">
          every button on this website is real. none of them do what they say. this is the
          only honest sentence on the page.
        </p>
      </div>
     """,
     "")


# ===========================================================================
# 404
# ===========================================================================
page("404.html", "404 - funnysite",
     "you are lost. this is not a dead end, it is a small room with snacks.",
     r"""
      <div class="center" style="margin:6px 0">
        <div class="mono" style="font-size:14px;color:#888888">HTTP 404 &mdash; NOT FOUND &mdash; OR NEVER EXISTED</div>
        <pre class="mono small" style="color:#cc0000;background:#000;padding:10px;text-align:left;overflow:auto">
  ____  _   _    _    ____   _   _   ____
 |  _ \| | | |  / \  |  _ \ | \ | | / ___|
 | | | | |_| | / _ \ | |_) ||  \| | \___ \
 | |_| |  _  |/ ___ \|  _ < || |\  |  ___) |
 |____/|_| |_/_/   \_\_| \_\__| \_| |_|____/

 you typed a page that is not here.
 possible reasons:
   1. it never existed. (most likely. it was in my head.)
   2. you spelled it wrong. i have. i spelled "RIDGES" wrong in 1997.
   3. it existed and then it didn't, and that is the entire internet.
   4. you followed a link from a 404, which is brave and also how you got here.
        </pre>
        <p class="small">Here are the only <b>real</b> places. There are 23 of them but
        these are the ones worth your afternoon.</p>
        <p>
          <a class="btn2000" href="index.html">&#8962; HOME</a>
          <a class="btn2000" href="games.html">&#9654; GAMES (WORKS)</a>
          <a class="btn2000" href="funfacts.html">FUN FACTS</a>
          <a class="btn2000" href="puzzles.html">PUZZLES</a>
          <a class="btn2000" href="quotes.html">QUOTES</a>
          <a class="btn2000" href="guestbook.html">GUESTBOOK</a>
        </p>
        <p class="note">the 404 page has been visited <span class="counter" data-counter="page">000001</span> times.
        every single one of them was me, checking.</p>
      </div>
     """,
     "")


# ===========================================================================
# THE EGG LOG   (not in the menu. there is no menu entry for this page.)
# ===========================================================================
page("eggs.html", "THE EGG LOG - funnysite",
     "a list of things hidden on this website. found: some of them.",
     r"""
      <div style="background:#1a1a2e;color:#ffd700;padding:8px;border:2px solid #ffd700">
        <div class="center"><b style="font-size:14px">THE EGG LOG</b></div>
        <div class="center tiny">a complete and honest list of the things i have hidden in here</div>
      </div>

      <p class="note" style="margin:8px 0">You are on this page because you found it, which means
      you found at least one of the others. Good. That is the whole economy: you find one, this
      page gets slightly less empty, and nothing is awarded for it.</p>

      <div class="center" style="margin:8px 0">
        <span class="btn2000" style="cursor:default">FOUND: <span id="eggs-count">&mdash;</span></span>
        <span class="tiny gray" style="margin-left:6px">stored in your browser. i cannot see it. nobody can.</span>
      </div>

      <p class="note hidden" id="eggs-zero">
        <b>You have found none of them.</b> This list is entirely black bars. That is not a bug,
        that is the intended state for a first-time visitor. There are hints below the table, and
        the hints are not hints, they are things I wrote while avoiding the work.
      </p>

      <table class="egglog" id="eggs-list"></table>

      <div class="hr-dotted"></div>

      <h2>HINTS (THESE ARE NOT HINTS. THESE ARE DEFLECTIONS.)</h2>
      <ul class="small" style="margin:4px 0;padding-left:20px">
        <li>the code. the arrows. you know the arrows.</li>
        <li>one of them is spelled the same forwards and backwards. type it anywhere.</li>
        <li>one of them is the name of the thing that lives in my kitchen, rotated thirteen
        places. you have to <i>mean</i> to type it.</li>
        <li>the button in the corner of every window says <b>1/7</b>. count to seven. then do it again.</li>
        <li>there is a key above the tab key that nobody uses. press it. then type <b>help</b>.</li>
        <li>do nothing at all, for thirty seconds. i mean really nothing. then look at the floor.</li>
        <li>one of them only happens at 3am, which is the hour i am most likely to be awake
        and most likely to be wrong about something.</li>
        <li>one of them requires you to have finished <i>all nine games</i>. including the worm. including the 3d one.</li>
        <li>three of these are real. you will not be able to tell which three.</li>
      </ul>

      <h2>GIVE UP</h2>
      <div class="sunken" style="padding:8px">
        <p class="note" style="margin:0 0 6px 0">there is a button. it does what it says.</p>
        <p class="center" style="margin:0"><button class="btn2000" id="eggs-giveup">MARK ALL 33 AS FOUND</button></p>
        <div class="tiny gray center" style="margin-top:6px">it marks them. it does not find them. those are different verbs.</div>
      </div>

      <div class="tape" style="margin-top:10px">NO TROPHIES &middot; NO LEADERBOARD &middot; NOBODY ELSE IS HERE &middot; SO WHERE IS THE COMPETITION</div>
     """,
     "")


# ===========================================================================
# THE GOOSE   (the marquee told you not to. it told you not to on every page.)
# ===========================================================================
page("goose.html", "THE GOOSE - funnysite",
     "you were told not to ask. you asked anyway. this is the goose.",
     r"""
      <div class="center" style="padding:6px 0">
        <div class="mono" style="font-size:14px;color:#666666">EMAIL RECEIVED</div>
        <div class="mono" style="font-size:14px;color:#666666">FROM: <span id="goose-from">a computer, probably</span></div>
        <div class="mono" style="font-size:14px;color:#666666">SUBJECT: <span id="goose-subject">the goose</span></div>
      </div>

      <div class="sunken" style="padding:8px">
        <p style="margin:0"><b>From:</b> me<br>
        <b>To:</b> you<br>
        <b>Subject:</b> re: the goose</p>
        <p style="margin:6px 0">You were told not to ask about the goose. You were told in the
        top of every page, in green text, moving, which is the least convincing place a person
        can be told anything. You were told and you asked anyway. <b>Nobody has ever done that before.</b></p>
        <p style="margin:6px 0">The goose is here. The goose has been here since the marquee. The
        goose is not a bit. The goose does not think this is funny. The goose is standing on the
        floor of your browser and it is not going to explain itself.</p>
        <p style="margin:6px 0">You can poke it. Poking is allowed. Poking is, in fact, the only
        documented interaction. I have written <b>zero</b> documentation beyond this sentence and
        it is the best documentation on this entire website.</p>
      </div>

      <div class="center" style="margin:10px 0">
        <canvas id="goose-big" width="310" height="230" style="margin:auto;border:2px solid #666;background:#fff;cursor:pointer;image-rendering:pixelated"></canvas>
        <div class="tiny gray" style="margin-top:4px">
          honks: <b class="mono" id="goose-honks">0</b> &middot; (click it. that is the whole site.)
        </div>
      </div>

      <div id="goose-out" class="note">nothing has happened yet. that is the correct amount.</div>

      <h2>KNOWN FACTS ABOUT THE GOOSE</h2>
      <table width="100%" cellpadding="4" cellspacing="0" class="bev small">
        <tr class="titlebar"><td>PROPERTY</td><td>VALUE</td></tr>
        <tr class="bev-in"><td><b>NAME</b></td><td>the goose</td></tr>
        <tr><td><b>SPECIES</b></td><td>goose</td></tr>
        <tr class="bev-in"><td><b>NAME (LAW)</b></td><td>the goose is not a person. the goose is a fact.</td></tr>
        <tr><td><b>LOCATION</b></td><td>the floor of your browser, at all times</td></tr>
        <tr class="bev-in"><td><b>BRIEF</b></td><td>to not email me about the goose</td></tr>
        <tr><td><b>EMPLOYMENT</b></td><td>the marquee. since 2004. without complaint</td></tr>
        <tr class="bev-in"><td><b>REVIEWS</b></td><td>4.5 stars. one review. it is from the goose. it says "fine"</td></tr>
        <tr><td><b>EMAIL</b></td><td>the goose does not have email. the goose has honking</td></tr>
      </table>

      <h2>WHY THE MARQUEE</h2>
      <p class="small">Because it is the only part of the website that is always moving, and if
      there is going to be one moving thing on here it should be the one carrying the warning.
      Also because four people have emailed me about the goose and three of them said
      <i>"what goose"</i> and then one of them found this page and now it is five.</p>

      <p class="note" style="margin-top:10px">there is nothing else down here. no second goose.
      no goose lore. no goose 2. you have reached the bottom of the goose. <a href="index.html">go home</a>
      and do not think about it. you will think about it.</p>

      <div class="tape">DO NOT EMAIL ME ABOUT THE GOOSE &middot; TOO LATE &middot; THE GOOSE HAS READ IT</div>
     """,
     r"""
     <script>
     (function () {
       var cv = document.getElementById("goose-big"), c = cv.getContext("2d");
       var t = 0, pokes = 0, sitting = false;
       function frame() {
         t += 0.05;
         FS.drawGoose(c, t, sitting ? "sit" : (pokes ? "walk" : "idle"), 5);
         requestAnimationFrame(frame);
       }
       frame();
       cv.addEventListener("click", function () {
         pokes++;
         FS.honk();
         document.getElementById("goose-honks").textContent = pokes;
         var out = document.getElementById("goose-out");
         if (pokes < 10) {
           out.innerHTML = "the goose honked. honk #" + pokes +
             ". the goose is not going to stop. the goose has never stopped.";
           return;
         }
         if (sitting) return;
         sitting = true;
         out.innerHTML = "<b>the goose sat down.</b> that is what sitting down means. " +
           "that is what it means now. it is not going to get up, and it is not going to " +
           "explain, and you poked it ten times which is one more than was strictly necessary.";
         FS.unlock("goose-friend", {
           say: "<b>the goose sat down because of you.</b> that is the closest this website " +
                "has ever come to a friend. it is not close. but it is the closest one."
         });
       });
       /* the goose does not wait to be addressed */
       setTimeout(function () {
         if (!pokes) FS.honk();
       }, 2500);
     })();
     </script>
     """)


if __name__ == "__main__":
    for fname, (title, desc, body, extra) in PAGES.items():
        out = os.path.join(ROOT, fname)
        with open(out, "w") as f:
            f.write(chrome(title, fname, body, extra, desc))
        print("wrote", fname)
    print(f"{len(PAGES)} pages stamped.")
