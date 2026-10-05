#!/usr/bin/env python3
"""
_build/glevels.py -- designs (and proves) the four GRAVITY BOX levels.

the game gives you three verbs: walk left, walk right, flip gravity.
after every verb you fall until you hit something. so a level is playable
iff a breadth-first search over (x, y, which-way-is-down), with falling
resolved at every step, can reach the goal.

this script builds levels as grids, hangs arrows off them, and refuses to
print a level that the solver cannot finish. ASCII art by hand got 1 of 4
right the first time, so we stopped doing that.
"""
import random

W, H = 21, 10
random.seed(20041226)


def solid(c):
    return c in "#><"


def lethal(c, grav):
    return (c == ">" and grav < 0) or (c == "<" and grav > 0)


def fall(g, x, y, grav):
    for _ in range(H + 4):
        nxt = y + grav
        if not (0 <= nxt < H) or solid(g[nxt][x]):
            break
        if lethal(g[nxt][x], grav):
            return None
        y = nxt
    return None if lethal(g[y][x], grav) else (x, y, grav)


def solve(g):
    start = goal = None
    for y in range(H):
        for x in range(W):
            if g[y][x] == "S":
                start = (x, y)
            elif g[y][x] == "X":
                goal = (x, y)
    if not start or not goal:
        return False, "no start or goal"
    s0 = fall(g, start[0], start[1], 1)
    if not s0:
        return False, "the start is fatal"
    seen, q, n = {s0}, [s0], 0
    while q:
        x, y, grav = q.pop()
        n += 1
        if (x, y) == goal:
            return True, n
        for t in ((x - 1, y, grav), (x + 1, y, grav), (x, y, -grav)):
            tx, ty, tg = t
            if lethal(g[ty][tx], tg):
                continue
            if tx != x and solid(g[ty][tx]):
                continue
            r = fall(g, tx, ty, tg)
            if r and r not in seen:
                seen.add(r)
                q.append(r)
    return False, "the goal cannot be reached (%d states)" % n


def blank():
    return [["#"] * W for _ in range(H)]


def carve_horizontal(g, y, x0, x1):
    for x in range(x0, x1 + 1):
        g[y][x] = "."


def build(name, ledges, arrows, start, goal):
    """ledges: [(y, x0, x1)] floors, with a hole to drop through between them."""
    g = blank()
    for (y, x0, x1) in ledges:
        carve_horizontal(g, y, x0, x1)
    for (ax, ay, ch) in arrows:
        g[ay][ax] = ch
    g[start[1]][start[0]] = "S"
    g[goal[1]][goal[0]] = "X"
    ok, why = solve(["".join(r) for r in g])
    return g, ok, why


def show(g):
    return ["".join(r) for r in g]


# ---------------------------------------------------------------------------
# level 1: INTRO. three floors, drop through a hole, arrows at the bottom.
# ---------------------------------------------------------------------------
L1 = [
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
]

# ---------------------------------------------------------------------------
# levels 2-4 are generated: ledges with holes, arrows added one at a time and
# rolled back if the solver says the level died.
# ---------------------------------------------------------------------------

def connect(g, a, b):
    """carve a shaft from ledge a down to ledge b at a column they share"""
    (ay, ax0, ax1) = a
    (by, bx0, bx1) = b
    lo, hi = max(ax0, bx0), min(ax1, bx1)
    x = hi if hi >= lo else ax1
    for y in range(ay, by + 1):
        g[y][x] = "."


def make(seed, ledges, start, goal, arrow_budget):
    rnd = random.Random(seed)
    g = blank()
    for (y, x0, x1) in ledges:
        carve_horizontal(g, y, x0, x1)
    # connect every ledge to the one below it that it overlaps, whatever
    # order they were written in. ledges are sorted by row first.
    ordered = sorted(ledges, key=lambda l: (l[0], l[1]))
    for i in range(len(ordered)):
        for j in range(i + 1, len(ordered)):
            connect(g, ordered[i], ordered[j])
    g = [r[:] for r in g]
    g[start[1]][start[0]] = "S"
    g[goal[1]][goal[0]] = "X"
    base = ["".join(r) for r in g]
    ok, _ = solve(base)
    if not ok:
        return None, "the empty level is already broken"
    spots = [(x, y) for y in range(1, H - 1) for x in range(1, W - 1) if g[y][x] == "."]
    rnd.shuffle(spots)
    placed = 0
    for (x, y) in spots:
        if placed >= arrow_budget:
            break
        for ch in (">", "<"):
            g[y][x] = ch
            ok, _ = solve(["".join(r) for r in g])
            if ok:
                placed += 1
                break
            g[y][x] = "."
    return ["".join(r) for r in g], "%d arrows survived" % placed


# ledges must overlap horizontally with the ledge below, or the shaft
# cannot exist. each list below is top-to-bottom and left-to-right.
L2, why2 = make(7,
                [(1, 1, 8), (1, 12, 19),
                 (4, 1, 8), (4, 12, 19),
                 (7, 1, 19)],
                (3, 1), (17, 7), 14)
L3, why3 = make(11,
                [(1, 1, 6), (1, 10, 19),
                 (4, 1, 6), (4, 10, 19),
                 (7, 1, 19)],
                (3, 1), (18, 7), 16)
L4, why4 = make(23,
                [(1, 1, 6), (1, 10, 19),
                 (4, 1, 6), (4, 10, 19),
                 (7, 1, 19)],
                (3, 1), (18, 7), 18)

NAMES = ["INTRO", "SPIKES", "WATER", "THE END"]
OUT = [L1, L2, L3, L4]


if __name__ == "__main__":
    allok = True
    for name, rows in zip(NAMES, OUT):
        if rows is None:
            print(f"  !! {name}: generation failed ({why2 if name=='SPIKES' else why3 if name=='WATER' else why4})")
            allok = False
            continue
        bad = [i for i, r in enumerate(rows) if len(r) != W]
        if bad:
            print(f"  !! {name}: rows {bad} are not {W} wide")
            allok = False
            continue
        ok, why = solve(rows)
        print(f"  {'OK ' if ok else '!! '} {name}: {why}")
        allok = ok and allok
    print("all levels playable" if allok else "SOME LEVELS ARE UNPLAYABLE")
    print()
    for name, rows in zip(NAMES, OUT):
        if rows:
            print(f'    {{ n: "{name}", map: [')
            for r in rows:
                print(f'        "{r}",')
            print("      ] },")