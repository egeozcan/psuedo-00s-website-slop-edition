# funnysite

A website. On the internet. About stuff.

24 hand-built pages, early-2000s aesthetic, zero dependencies, zero frameworks.
The arcade has a 3D one in it now (1 file, 0 libraries, it surprised me too)
and a whole Flash-era wing: twelve tiny games in one file, in a portal.
Everything works, including the parts that were jokes.
Including the parts that were jokes about the parts that were jokes.

## Run it

```sh
python3 -m http.server 8848
# then open http://localhost:8848/index.html
```

(Opening `index.html` straight off the filesystem works too. A server is only
nicer because the counter lies less over http.)

## What's here

| Page | |
|---|---|
| `index.html` | the brain dump. the homepage. the whole pitch. |
| `funfacts.html` | 20 facts sorted by how much the author believes them, plus unlockable ones |
| `quotes.html` | quotes + a quote box that saves on your own computer only |
| `jokes.html` | knock knock, tech support, and one with no punchline |
| `puzzles.html` | riddles, ROT-13, spot-the-difference (0 pictures), order of operations |
| `games.html` | the arcade: 9 games, all playable |
| `flash.html` | **the flash era.** twelve small games, one file, no plugins, with a loading bar on every card |
| `game-maze.html` | generated maze, timer, solver, personal best |
| `game-mines.html` | minesweeper w/ flagging, chording, safe first click |
| `game-memory.html` | 4x4 memory pairs + a cheat peek |
| `game-reaction.html` | reaction timer w/ false-start penalty and a "lie mode" |
| `game-sliding.html` | 3x3 / 4x4 sliding puzzle |
| `game-hanoi.html` | tower of hanoi, steps or watches it solve itself |
| `game-mind.html` | binary search dressed up as mind reading |
| `game-worm.html` | one button, one worm, zero chill |
| `game-3d.html` | **the 3d one.** a raycaster: 6 levels + a generated one, textured floors, sprites, doors, keys, secrets, six monsters, four weapons |
| `music.html` | top 8 songs + a downloadable mixtape (a .txt) |
| `guestbook.html` | guestbook (stored in localStorage, so: yours alone) |
| `theweb.html` | a webring that is 78% dead, real links, blinkies |
| `about.html` | colophon, FAQ, and a list of what this site is not |
| `secrets.html` | not in the menu. also not a secret. |
| `eggs.html` | not in the menu. 33 things you have found, and the ones you have not |
| `goose.html` | not in the menu. the goose |
| `404.html` | a lost page with a small room and snacks |

## Site-wide features

- **Visitor counter** (counts you, only you), **live clock**, **7 other themes**
- **`THEME.MID`** — a chiptune theme synthesised in the browser (it is 4 notes)
- **A hand-rolled animated GIF favicon** (a bobbing piece of toast)
- Deep-link prevention: the mind reader genuinely works, the counter genuinely lies

## The eggs

There are **33**. They all live in `common.js` and they all end up in one place:
the log at `eggs.html`, which is not in any menu.

Some of them take four seconds. Some of them require you to play nine games, or
visit twenty-two pages, or be awake at 3am, or press the same words in the
corner of the screen forty-two times because it did not appear to be doing
anything.

The three most reliable ones, in order of how quickly you will find them:

1. **the arrows.** everyone knows the arrows.
2. **the theme button says 1/7.** count to seven. then do it again.
3. **the key above the tab key.** press it. type `help`.

I am not going to write the rest down here, because a list of eggs is just the
eggs page with the hunt removed, and the hunt is the only part I like. The log
tells you how many you have found, in the footer, once you have found at least
one. It will not tell you which ones. It is honest about that.

Notes for whoever edits this next:

- `FS.unlock(id, opts)` is the only way to award an egg. `id` must be in `EGGS`.
- `data-when-egg="id"` on any element reveals it the moment that egg lands.
  (the goose's row in the webring uses this.)
- eggs are stored in `localStorage` under `funnysite.v1.eggs`. clearing your
  browser data does not remove the eggs. it just removes the eggs.

## Editing

`index.html` is hand-written; it's the masterpiece, hands off.
The other 23 pages are stamped out by the build scripts, because I am not
typing the same sidebar 21 times like a 2004 person would have to:

```sh
python3 _build/games.py     # stamps all 23 pages (imports build.py)
python3 _build/maps.py      # re-checks the raycaster's 6 hand-drawn maps
python3 _build/make_favicon.py   # rewrites favicon.gif, byte by byte
```

Edit the page content in `_build/build.py` and `_build/games.py`, then re-run.
`game-3d.js` and `flash.js` are hand-written like `common.js` — the page just points at it. The six
levels in it were drawn in `_build/maps.py`, which checks every row is 27 characters
wide, BFS-checks that you can actually walk to the exit pad, and complains loudly if a
locked door has its own key behind it.
`_build/` is tooling and is not part of the site.

## Notes

- No cookies, no trackers, no analytics, no build step required to view.
- The 16x16 background tile is the most stable thing in this repository.
- Nothing here is AI-generated. Look at the line breaks. Nobody would choose
  these line breaks. I chose these line breaks.
- The Konami code had four extra arrows in it and therefore had never once been
  completed, by anyone, including me. That is fixed. Twenty years of my own
  website being unfindable was the part I could not defend.
