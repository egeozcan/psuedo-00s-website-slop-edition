#!/usr/bin/env python3
"""
_build/blevels.py -- designs (and proves) the four BLOXORZ levels.

a 3-long brick on an N x N board. x = lying east, z = lying south,
o = standing up. it tips when it rolls sideways, which is the entire game.

BLOX_LEVELS in the file shipped with four hand-typed boards and all four
were unwinnable, which you cannot tell by looking at them. so: generate,
solve, keep only what the solver can finish.
"""
import random

LEVELS = [
    # name, board size, hole count, seed
    ("TWO AND THREE", 6, 2, 5),
    ("THE FOUR HOLE", 7, 4, 19),
    ("SOMETHING NARROW", 8, 5, 41),
    ("THE LAST ONE", 8, 7, 77),
]

MOVES = [(1, 0), (-1, 0), (0, 1), (0, -1)]


def cells(x, y, st):
    if st == "x":
        return [(x, y), (x + 1, y), (x + 2, y)]
    if st == "z":
        return [(x, y), (x, y + 1), (x, y + 2)]
    return [(x, y)]


def step(x, y, st, dx, dy, N, holes):
    nx, ny, ns = x, y, st
    if st == "x":
        if dx == 1: nx += 3; ns = "o"
        elif dx == -1: nx -= 1; ns = "o"
        elif dy == 1: ny += 1
        else: ny -= 1
    elif st == "o":
        if dx == 1: ns = "z"
        elif dx == -1: nx -= 2; ns = "z"
        elif dy == 1: ns = "x"
        else: ny -= 2; ns = "x"
    else:
        if dx == 1: nx += 1; ns = "o"
        elif dx == -1: nx -= 1; ns = "o"
        elif dy == 1: ny += 1
        else: ny -= 3
    for (cx, cy) in cells(nx, ny, ns):
        if cx < 0 or cy < 0 or cx >= N or cy >= N:
            return None
        if (cx, cy) in holes:
            return None
    return (nx, ny, ns)


def solve(N, holes, goal):
    start = (0, 0, "x")
    if any(c in holes for c in cells(0, 0, "x")):
        return False, 0, "the brick starts in a hole"
    if goal in holes:
        return False, 0, "the goal is a hole"
    seen = {start}
    q = [start]
    n = 0
    while q:
        x, y, st = q.pop()
        n += 1
        for (dx, dy) in MOVES:
            r = step(x, y, st, dx, dy, N, holes)
            if r is None:
                continue
            if r[2] == "o" and (r[0], r[1]) == goal:
                return True, n, ""
            if r not in seen:
                seen.add(r)
                q.append(r)
    return False, n, "no solution"


def generate(name, N, hole_count, seed):
    rnd = random.Random(seed)
    spawn = set(cells(0, 0, "x"))
    for attempt in range(4000):
        holes = set()
        pool = [(x, y) for y in range(N) for x in range(N) if (x, y) not in spawn]
        rnd.shuffle(pool)
        holes = set(pool[:hole_count])
        # the goal wants to be far from the start and not in a hole
        far = [(x, y) for (x, y) in pool if x + y > N]
        goal = far[len(far) // 2 + rnd.randint(0, max(0, len(far) // 3))]
        ok, n, why = solve(N, holes, goal)
        if ok:
            return holes, goal, n, attempt
    return None, None, 0, 0


def js_list(levels):
    out = ["  var BLOX_LEVELS = ["]
    for i, (name, N, holes, goal) in enumerate(levels):
        hl = ", ".join("[%d, %d]" % h for h in sorted(holes))
        out.append('    { n: "%s", N: %d, holes: [%s], goal: [%d, %d] }%s'
                   % (name, N, hl, goal[0], goal[1], "," if i < len(levels) - 1 else ""))
    out.append("  ];")
    return "\n".join(out)


if __name__ == "__main__":
    made = []
    for (name, N, hc, seed) in LEVELS:
        holes, goal, n, attempt = generate(name, N, hc, seed)
        if holes is None:
            print(f"  !! {name}: could not generate a solvable board")
            continue
        ok, _, _ = solve(N, holes, goal)
        print(f"  {'OK ' if ok else '!! '} {name}: {N}x{N}, {len(holes)} holes, "
              f"goal {goal}, {n} states, took {attempt} tries")
        made.append((name, N, holes, goal))
    print()
    print(js_list(made))