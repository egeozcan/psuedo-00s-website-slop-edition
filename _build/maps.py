#!/usr/bin/env python3
"""
_build/maps.py -- writes the six hand-drawn level maps for the raycaster,
checks that every row is the same width, and BFS-checks that the exit pad
can actually be reached from the player start. if it cannot, it shouts.

Run: python3 _build/maps.py          # prints the JS
"""

W = 27
H = 21

# each row is 27 chars. "|" is only for my counting; it is removed.
RAW = {
"lobby": [
 "#########|#########|#########",
 "#...h....|#........|#.......a#",
 "#........|#....E...|#.......E#",
 "#...E....|+........|+.....X..#",
 "#........|#....a...|#.......s#",
 "####+#####|........|#####+####",
 "#........|#........|#.....R..#",
 "#...2....|+....R...|+....a...#",
 "#........|#........|#.......h#",
 "#...a....|#....b...|#.......s#",
 "########+|.........+##########",
 "#.......a|#........|#........#",
 "#...h...E|+....E...|+....E...#",
 "#......os|#........|#........#",
 "#...a....|#....a...|#.......G#",
 "#########|........+##########",
 "#...E...a|#........|#......&.#",
 "#.......s|+....a...|+........#",
 "#...h....|#........|#....b...#",
 "#########|#########|##########",
 "#########|#########|##########",
],
"carpet": [
 "#########|#########|#########",
 "#...k....|#........|#....h...#",
 "#........R+....E...+........#",
 "#...E....#|........|.#......#",
 "########=|.........+#########",
 "#........|#....a...|#.......s#",
 "#...2....+....R....+.......E#",
 "#........|#........|#.......s#",
 "#...a....|#....b...|#.......a#",
 "#########|........+##########",
 "#.......R+........#|.......E#",
 "#...E....#|....E...#|........#",
 "#........#|........#|........#",
 "#...h....#|....a...#|.....X..#",
 "########+:........+##########",
 "#........#|........#|........#",
 "#...3....+....R....+.......G#",
 "#........#|........#|.......s#",
 "#...y....#|...a....#|.....G..#",
 "#########|........+##########",
 "#########|#########|##########",
],
"server": [
 "#########|#########|#########",
 "#...a....|%%%%%....|#.......#",
 "#........|%%%%%.T.#|....h...#",
 "#..#####.+%%%%%.###|#..###..#",
 "#..#...#.#%%%%%...#|#..#.G#.#",
 "#..#.E.#.#%%%%%...#|#..#...#.#",
 "#..#...#.+...#...#|#..#####.#",
 "#..#####.#...#.###|#........#",
 "#.......G#...#...#.#|.....G..#",
 "####+#####...#...#.+####+#####",
 "#.............#...........#",
 "#.#####...X...#...###.....#",
 "#.#...#.......#...........#",
 "#.#.T.#...#####...#...R...#",
 "#.#...#.........#.#.......#",
 "#.#####.....#####..####...#",
 "#....s.......#...........#",
 "#...a.......+....b........#",
 "#....E......#.......h.....#",
 "#########|#########|##########",
 "#########|#########|##########",
],
"carpet2": [
 "#########|#########|#########",
 "#...h....|........|....a....#",
 "#....E...|...G....|....E....#",
 "#........+........+........##",
 "########:........:##########",
 "#........|........|........##",
 "#..2.....|...yE....|.....R...#",
 "#........+........+......##",
 "#....a...|........|....a....#",
 "#####;####........####;#####",
 "#........|&.......|........##",
 "#..E.....|...G....|.....E...#",
 "#........+........+........##",
 "#...h....|........|....h....#",
 "#########|...X....|##########",
 "#........|........|........##",
 "#..O.....|..r.E...|.....O...#",
 "#........+........+......##",
 "#...a....|........|....s....#",
 "#########|#########|##########",
 "#########|#########|##########",
],
"toaster": [
 "#########|#########|#########",
 "#........|........|........#",
 "#..&&....|....R...|........#",
 "#..##....+........+....h...#",
 "#..##....|...O....|........#",
 "#####+####........####+#####",
 "#........|........|........#",
 "#...T....+....T...+.......T#",
 "#........|........|........#",
 "#####+####........####+#####",
 "#........|........|........#",
 "#...O....+....O...+....O....#",
 "#........|........|........#",
 "#####+####........####+#####",
 "#........|....X...|........#",
 "#...G....+........+....G....#",
 "#........|........|........#",
 "#...s....+...a....+....s...#",
 "#...R....|........|....E....#",
 "#########|#########|##########",
 "#########|#########|##########",
],
"endnet": [
 "#########|#########|#########",
 "#........|........|........#",
 "#...a....|...O....|....a....#",
 "#........+........+........#",
 "#####+####........####+#####",
 "#........|........|........#",
 "#...T....|...G....|....T....#",
 "#........+........+........#",
 "#####+####........####+#####",
 "#........|&.......|........#",
 "#...R....|........|....R....#",
 "#########|........|##########",
 "#........|...B....|........#",
 "#########|........|##########",
 "#...R....|........|....R....#",
 "#####+####........####+#####",
 "#........|&.......|........#",
 "#...h....|........|....h....#",
 "#....X...|........|...a.....#",
 "#########|#########|##########",
 "#########|#########|##########",
],
}

SOLIDS = set("#%&")
LOCKED = set("=:;")

# where the player starts, if this cell is floor and can reach the exit
START = {
    "lobby":   [(3, 18), (2, 18), (6, 12), (2, 1)],
    "carpet":  [(3, 18), (2, 18), (2, 1)],
    "server":  [(2, 18), (2, 17), (4, 1), (2, 1)],
    "carpet2": [(3, 18), (2, 18), (2, 1)],
    "toaster": [(3, 18), (2, 18), (2, 1)],
    "endnet":  [(3, 18), (2, 18), (2, 1)],
}


def fix_chunk(c):
    """a chunk is exactly 9 chars, and it always keeps its first and last
    character (which is how the outside walls survive)."""
    while len(c) > 9:
        c = c[:1] + c[2:-1] + c[-1]
    while len(c) < 9:
        if c[-1] == "#":
            c = c[:-1] + "." + "#"
        else:
            c = c + "#"
    return c


def clean(rows, name):
    out = []
    for i, r in enumerate(rows):
        chunks = r.split("|")
        flat = r.replace("|", "")
        if len(chunks) != 3:
            # a row i forgot to chunk. slice it in three and let fix_chunk
            # keep the outside walls where they belong.
            chunks = [flat[0:9], flat[9:18], flat[18:]]
        chunks = [fix_chunk(c) for c in chunks]
        if len(chunks) != 3:
            raise SystemExit(f"{name} row {i}: expected 3 chunks of 9, got {len(chunks)}: {r}")
        r = "".join(chunks)
        if len(r) != W:
            raise SystemExit(f"{name} row {i} is {len(r)} chars: {r}")
        out.append(r)
    while len(out) < H:
        out.append("#" * W)
    return out


def flood(rows, start, open_secrets, open_locked=False):
    seen = {start}
    q = [start]
    while q:
        cx, cy = q.pop()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = cx + dx, cy + dy
            if not (0 <= nx < W and 0 <= ny < H):
                continue
            if (nx, ny) in seen:
                continue
            c = rows[ny][nx]
            if c in SOLIDS and not (open_secrets and c == "&"):
                continue
            if c in LOCKED and not open_locked:
                continue
            seen.add((nx, ny))
            q.append((nx, ny))
    return seen


def check_doors(rows, name, base_seen):
    """you must be able to stand next to every locked door WITHOUT having the
    key, otherwise the key is behind the door that needs the key."""
    problems = []
    lock_at = {}
    for y in range(H):
        for x in range(W):
            if rows[y][x] in LOCKED:
                lock_at[(x, y)] = rows[y][x]
    for (x, y), ch in lock_at.items():
        sides = 0
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            if (x + dx, y + dy) in base_seen:
                sides += 1
        if sides < 2:
            problems.append(f"locked door {ch} at {x},{y} has {sides} reachable side(s)")
    # the key for each lock must itself be reachable without using locked doors
    key_for = {"=": "k", ":": "y", ";": "r"}
    for (x, y), ch in lock_at.items():
        kc = key_for[ch]
        spots = [(kx, ky) for ky in range(H) for kx in range(W)
                 if rows[ky][kx] == kc and (kx, ky) in base_seen]
        if not spots:
            problems.append(f"key '{kc}' for {ch} at {x},{y} is not reachable without locked doors")
    if problems:
        print(f"  !! {name}: DOOR PROBLEMS")
        for pr in problems:
            print(f"       - {pr}")
    return not problems


def check(rows, name):
    """BFS from the player start to the exit pad."""
    chosen = None
    for cand in START[name]:
        # only plain floor, so the '@' marker never eats a key or a monster
        if rows[cand[1]][cand[0]] != ".":
            continue
        seen = flood(rows, cand, True)
        ex = [(x, y) for y in range(H) for x in range(W) if rows[y][x] == "X"]
        if ex and ex[0] in seen:
            chosen = cand
            break
    if chosen is None:
        print(f"  !! {name}: no candidate start reaches the exit")
        return False
    base = flood(rows, chosen, True, open_locked=False)
    doors_ok = check_doors(rows, name, base)   # before the '@' goes in
    rows = [list(r) for r in rows]
    rows[chosen[1]][chosen[0]] = "@"
    rows = ["".join(r) for r in rows]
    for y in range(H):
        for x in range(W):
            c = rows[y][x]
            if c == "X" and (x, y) not in seen:
                reach.append((x, y))
    enemies = sum(r.count("E") + r.count("R") + r.count("G") + r.count("T") +
                 r.count("O") + r.count("B") for r in rows)
    items = sum(1 for y in range(H) for x in range(W) if rows[y][x] in "hHbaAsktyr234o&")
    secrets = sum(r.count("&") for r in rows)
    reach = [c for c in [(x, y) for y in range(H) for x in range(W) if rows[y][x] == "X"]
             if c not in base]
    status = "OK " if not reach else "!! "
    print(f"  {status}{name}: start={chosen} enemies={enemies} items={items} secrets={secrets}"
          + (f" UNREACHABLE EXIT AT {reach}" if reach else ""))
    return (not reach) and doors_ok, rows


def emit():
    ok = True
    for name in ("lobby", "carpet", "server", "carpet2", "toaster", "endnet"):
        rows = clean(RAW[name], name)
        good, fixed = check(rows, name)
        ok = good and ok
        print("      map: [")
        for r in fixed:
            print(f'        "{r}",')
        print("      ],")
    print("all maps reachable" if ok else "SOME MAPS ARE BROKEN")


if __name__ == "__main__":
    emit()
