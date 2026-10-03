#!/usr/bin/env python3
"""
_build/make_favicon.py -- writes favicon.gif by hand, byte by byte.

a 16x16 toast, bobbing. that is the whole icon. (i wrote a GIF encoder
in a build script to avoid a dependency, which is the most 2004 thing
this repo has done so far, and it's not close.)
"""

import os, struct

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
W = H = 16
PALETTE = [(0x00, 0x00, 0x00), (0xFF, 0xCC, 0x33), (0x66, 0x33, 0x00), (0x00, 0xFF, 0xFF)]
BLACK, GOLD, CRUST, SPARK = 0, 1, 2, 3


def frame(y0, spark):
    """16 rows of 16 pixels. a piece of toast. it is bobbing."""
    px = [[BLACK] * W for _ in range(H)]
    for y in range(y0, y0 + 9):
        for x in range(3, 13):
            px[y][x] = CRUST
    for y in range(y0 + 1, y0 + 8):
        for x in range(4, 12):
            px[y][x] = GOLD
    for hx, hy in ((6, 3), (9, 5), (7, 2), (10, 4), (5, 5)):
        px[y0 + hy][hx] = CRUST
    px[y0 + 1][spark] = SPARK
    return b"".join(bytes(row) for row in px)


class Bits:
    def __init__(self):
        self.buf, self.cur, self.n = bytearray(), 0, 0

    def write(self, code, width):
        for i in range(width):
            self.cur |= ((code >> i) & 1) << self.n
            self.n += 1
            if self.n == 8:
                self.buf.append(self.cur)
                self.cur, self.n = 0, 0

    def flush(self):
        if self.n:
            self.buf.append(self.cur)
        return bytes(self.buf)


def lzw(data, mcs):
    clear, end = 1 << mcs, (1 << mcs) + 1
    dic = {bytes([i]): i for i in range(clear)}
    nxt, width, out = end + 1, mcs + 1, Bits()
    out.write(clear, width)
    w = b""
    for ch in data:
        wc = w + bytes([ch])
        if wc in dic:
            w = wc
            continue
        out.write(dic[w], width)
        dic[wc] = nxt
        nxt += 1
        if nxt > (1 << width):
            if width < 12:
                width += 1
            else:
                out.write(clear, width)
                dic = {bytes([i]): i for i in range(clear)}
                nxt, width = end + 1, mcs + 1
        w = bytes([ch])
    if w:
        out.write(dic[w], width)
    out.write(end, width)
    return out.flush()


def chunk(tag, payload):
    return tag + struct.pack("<H", len(payload)) + payload + b"\x00"


def build(frames, delay_cs=45):
    g = bytearray(b"GIF89a")
    g += struct.pack("<HHBBB", W, H, 0xF1, 0, 0)          # 4-colour global table
    for r, gg, b in PALETTE:
        g += bytes((r, gg, b))
    g += b"\x21\xFF\x0BNETSCAPE2.0\x03\x01\x00\x00\x00"  # loop forever, like everything here
    for data, spark in frames:
        g += b"\x21\xF9\x04\x00" + struct.pack("<H", delay_cs) + b"\x00\x00"
        g += b"\x2C" + struct.pack("<HHHHB", 0, 0, W, H, 0)
        g += bytes((2,))                                  # LZW min code size
        comp = lzw(data, 2)
        for i in range(0, len(comp), 255):
            part = comp[i:i + 255]
            g += bytes((len(part),)) + part
        g += b"\x00"
    return bytes(g) + b"\x3B"


if __name__ == "__main__":
    gif = build([(frame(3, 2), 2), (frame(2, 13), 13), (frame(3, 2), 2), (frame(4, 6), 6)])
    path = os.path.join(ROOT, "favicon.gif")
    with open(path, "wb") as f:
        f.write(gif)
    print(f"wrote favicon.gif ({len(gif)} bytes, {len(gif)//1} of hand-rolled GIF)")
