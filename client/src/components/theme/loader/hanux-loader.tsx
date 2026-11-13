"use client";

import { useId } from "react";

// HANUX loader — inline SVG, no <img> needed.
//
//   <HanuxLoader />                       // 352 × 72
//   <HanuxLoader width={176} />           // scales; height follows the aspect ratio
//   <HanuxLoader className="mx-auto" />
//
// Every instance gets its own gradient ids (via useId), so several loaders
// can sit on one page without clashing. Class and keyframe names are
// prefixed with "hx-" to stay clear of your own CSS.

const CSS = `
  /* One 11.6s cycle:
       open     0    – 0.4s   the merged dot opens out evenly into five dots on a ring, which starts spinning
       spinner  0.4  – 3.1s   (the ring spins clockwise at a steady speed until the circle breaks)
                              0.4 – 1.5  each dot's head sweeps forward until the five arcs close into a full circle
                              1.5 – 2.0  the full circle holds
                              2.0 – 2.35 the circle breaks: the arcs recoil anticlockwise for a moment
                              2.35 – 3.1 then swing clockwise again as the tails catch up, back into five dots
       merge    3.2  – 4.6s   the dots spiral inward, overlap at the centre and pulse as one dot
       row      4.6  – 5.9s   the merged dot splits apart into a single horizontal row
       letters  5.9  – 10.0s  each dot stretches along its letter's outline, holds, winds back up
       merge    10.0 – 11.6s  the dots gather at the centre and pulse as one dot again, then it repeats
     All dots move in lockstep (no stagger) so the ring always opens and closes evenly.
     --cx is the row's centre, measured from the dot's home (the letters sit 70px apart);
     --ox / --oy is the dot's place on the ring (radius 22px, 72° apart), measured from the row's centre;
     --a is that same place as a position along the ring's outline (0–360, starting at 3 o'clock);
     --ex / --ey is the next slot round (where the dot ends up after the circle breaks apart);
     --s is where on the outline (0–360) the dot joins the letter;
     --dx / --dy is that same point, measured from the dot's home. */

  .hx-loader, .hx-loader svg {
    overflow: visible;     /* lets the dots travel outside each letter's box */
  }

  .hx-glyph {
    --cx: calc((2 - var(--i)) * 70px);
  }

  .hx-dot,
  .hx-letter,
  .hx-ring,
  .hx-orbit {
    animation-duration: 11.6s;
    animation-iteration-count: infinite;
    animation-fill-mode: both;
  }

  /* The ring turns as one piece around the row's centre. Each dot sits inside
     its group, so when a dot moves to the centre it spirals in. 720° = no
     rotation left over, so the row lines up straight afterwards. */
  .hx-orbit {
    transform-box: view-box;
    transform-origin: calc(32px + var(--cx)) 32px;
    animation-name: hx-orbit;
  }

  .hx-dot {
    fill: var(--g);
    transform-box: view-box;
    transform-origin: 32px 32px;
    animation-name: hx-dot;
  }

  /* The ring is drawn in each letter's own box and moved over to the row's
     centre with translate, so the letter's gradient travels with it. */
  .hx-ring {
    fill: none;
    stroke: var(--g);
    stroke-width: 8;
    stroke-linecap: round;
    translate: var(--cx) 0;
    animation-name: hx-ring;
  }

  .hx-letter {
    fill: none;
    stroke: var(--g);
    stroke-width: 8;
    stroke-linecap: round;
    stroke-linejoin: round;
    animation-name: hx-letter;
  }

  /* Steady clockwise spin until the full circle breaks (2.0s), a quick anticlockwise
     recoil (2.0 – 2.35s), then clockwise again, picking up speed until the dots meet in
     the centre (where the spin stops unseen). 720° = whole turns, so the row comes out straight. */
  @keyframes hx-orbit {
    0%      { rotate: 0deg;   animation-timing-function: linear; }
    17.24%  { rotate: 400deg; animation-timing-function: cubic-bezier(.25,.6,.4,1); }
    20.26%  { rotate: 375deg; animation-timing-function: cubic-bezier(.5,0,.6,1); }
    32.76%, 100% { rotate: 720deg; }
  }

  @keyframes hx-dot {
    /* open: the merged dot spreads onto the ring at stroke size */
    0%      { translate: var(--cx) 0; scale: 1; opacity: 1; animation-timing-function: cubic-bezier(.3,0,.2,1); }
    3.44%   { translate: calc(var(--cx) + var(--ox)) var(--oy); scale: .667; opacity: 1; }
    /* spinner: the ring arcs take over while the circle forms, holds and breaks apart */
    3.45%, 26.7% { translate: calc(var(--cx) + var(--ox)) var(--oy); scale: .667; opacity: 0; }
    26.71%, 27.59% { translate: calc(var(--cx) + var(--ex)) var(--ey); scale: .667; opacity: 1;
              animation-timing-function: cubic-bezier(.45,0,.55,1); }
    /* merge: spiral into the centre, then pulse together as one dot */
    32.76%  { translate: var(--cx) 0; scale: .8;   animation-timing-function: cubic-bezier(.3,0,.4,1); }
    35.34%  { translate: var(--cx) 0; scale: 1.35; animation-timing-function: cubic-bezier(.5,0,.5,1); }
    37.93%, 39.66% { translate: var(--cx) 0; scale: 1; animation-timing-function: cubic-bezier(.65,0,.35,1); }
    /* row: split out to each letter's home */
    45.69%, 50.86% { translate: 0 0; scale: 1; animation-timing-function: cubic-bezier(.65,0,.35,1); }
    /* letters: glide onto the outline and hand over to the stroke */
    53.97%  { translate: var(--dx) var(--dy); scale: .667; opacity: 1; }
    54%, 86.46% { translate: var(--dx) var(--dy); scale: .667; opacity: 0; }
    /* merge again: the wound-up dots gather at the centre and pulse as one dot */
    86.5%   { translate: var(--dx) var(--dy); scale: .667; opacity: 1; animation-timing-function: cubic-bezier(.65,0,.35,1); }
    90.95%  { translate: var(--cx) 0; scale: .8;   animation-timing-function: cubic-bezier(.3,0,.4,1); }
    93.97%  { translate: var(--cx) 0; scale: 1.35; animation-timing-function: cubic-bezier(.5,0,.5,1); }
    96.55%, 100% { translate: var(--cx) 0; scale: 1; opacity: 1; }
  }

  /* Each arc starts as a dot at its slot (--a) and its head sweeps forward one slot (72),
     so the five arcs meet in a full circle. After the hold the heads snap back (72 → 50),
     opening gaps that travel anticlockwise; then head and tail both run clockwise into
     the next slot, where the arc becomes a dot again. */
  @keyframes hx-ring {
    0%, 3.44% { opacity: 0; stroke-dasharray: 0.1 359.9; stroke-dashoffset: calc(var(--a) * -1); }
    3.45%     { opacity: 1; stroke-dasharray: 0.1 359.9; stroke-dashoffset: calc(var(--a) * -1);
                animation-timing-function: cubic-bezier(.65,0,.35,1); }
    12.93%, 17.24% { opacity: 1; stroke-dasharray: 72 288; stroke-dashoffset: calc(var(--a) * -1);
                animation-timing-function: cubic-bezier(.25,.6,.4,1); }
    20.26%    { opacity: 1; stroke-dasharray: 50 310; stroke-dashoffset: calc(var(--a) * -1);
                animation-timing-function: cubic-bezier(.45,0,.35,1); }
    26.7%     { opacity: 1; stroke-dasharray: 0.1 359.9; stroke-dashoffset: calc((var(--a) + 72) * -1); }
    26.71%, 100% { opacity: 0; stroke-dasharray: 0.1 359.9; stroke-dashoffset: calc((var(--a) + 72) * -1); }
  }

  @keyframes hx-letter {
    0%, 53.97% { opacity: 0; stroke-dasharray: 0.1 359.9; stroke-dashoffset: calc(var(--s) * -1); }
    54%     { opacity: 1; stroke-dasharray: 0.1 359.9; stroke-dashoffset: calc(var(--s) * -1);
              animation-timing-function: cubic-bezier(.65,0,.35,1); }
    66.9%, 74.66% { opacity: 1; stroke-dasharray: 360 0; stroke-dashoffset: calc(var(--s) * -1);
              animation-timing-function: cubic-bezier(.65,0,.35,1); }
    86.46%  { opacity: 1; stroke-dasharray: 0.1 359.9; stroke-dashoffset: calc((var(--s) + 360) * -1); }
    86.5%, 100% { opacity: 0; stroke-dasharray: 0.1 359.9; stroke-dashoffset: calc((var(--s) + 360) * -1); }
  }

  @media (prefers-reduced-motion: reduce) {
    .hx-dot, .hx-ring { display: none; }
    .hx-orbit, .hx-letter { animation: none; }
  }
`;

const PALETTE = "#4285F4;#EA4335;#FBBC05;#34A853;#4285F4";
const PALETTE_SHIFTED = "#EA4335;#FBBC05;#34A853;#4285F4;#EA4335";

type LetterPath = { d: string; s?: number };
type Letter = {
    x: number; a: number; ox: string; oy: string; ex: string; ey: string;
    s: number; dx: string; dy: string; paths: LetterPath[];
};

const LETTERS: Letter[] = [
    // H
    {
        x: 0, a: 270, ox: "0px", oy: "-22px", ex: "20.92px", ey: "-6.80px", s: 236.2, dx: "-0.01px", dy: "2.50px",
        paths: [
            { d: "M 6.50,4 L 6.50,4 Q 9,4 9,6.50 L 9,27 Q 9,29.50 11.50,29.50 L 52.50,29.50 Q 55,29.50 55,27 L 55,6.50 Q 55,4 57.50,4 L 57.50,4 Q 60,4 60,6.50 L 60,57.50 Q 60,60 57.50,60 L 57.50,60 Q 55,60 55,57.50 L 55,37 Q 55,34.50 52.50,34.50 L 11.50,34.50 Q 9,34.50 9,37 L 9,57.50 Q 9,60 6.50,60 L 6.50,60 Q 4,60 4,57.50 L 4,6.50 Q 4,4 6.50,4 Z" }
        ]
    },
    // A
    {
        x: 70, a: 342, ox: "20.92px", oy: "-6.80px", ex: "12.93px", ey: "17.80px", s: 290.4, dx: "0px", dy: "9.5px",
        paths: [
            { d: "M 5.14,57.50 L 28.46,6.28 Q 29.50,4 32,4 L 32,4 Q 34.50,4 35.54,6.28 L 58.86,57.50 Q 60,60 57.25,60 L 57.25,60 Q 54.50,60 53.36,57.50 L 48.49,46.73 Q 47.25,44 44.25,44 L 19.75,44 Q 16.75,44 15.51,46.73 L 10.64,57.50 Q 9.50,60 6.75,60 L 6.75,60 Q 4,60 5.14,57.50 Z" },
            { d: "M 22.10,39 L 41.90,39 Q 44.9,39 43.66,36.27 L 33.24,13.23 Q 32,10.50 30.76,13.23 L 20.34,36.27 Q 19.1,39 22.10,39 Z", s: 43.0 }
        ]
    },
    // N
    {
        x: 140, a: 54, ox: "12.93px", oy: "17.80px", ex: "-12.93px", ey: "17.80px", s: 274.9, dx: "-1.74px", dy: "1.65px",
        paths: [
            { d: "M 4,57.50 L 4,6.50 Q 4,4 6.50,4 L 6.50,4 Q 9,4 10.71,5.82 L 53.29,51.18 Q 55,53 55,50.50 L 55,6.50 Q 55,4 57.50,4 L 57.50,4 Q 60,4 60,6.50 L 60,57.50 Q 60,60 57.50,60 L 57.50,60 Q 55,60 53.29,58.18 L 10.71,12.82 Q 9,11 9,13.50 L 9,57.50 Q 9,60 6.50,60 L 6.50,60 Q 4,60 4,57.50 Z" }
        ]
    },
    // U
    {
        x: 210, a: 126, ox: "-12.93px", oy: "17.80px", ex: "-20.92px", ey: "-6.80px", s: 85.0, dx: "0px", dy: "24px",
        paths: [
            { d: "M 6.50,4 Q 9,4 9,6.50 L 9,33 C 9,45.70 19.30,56 32,56 C 44.70,56 55,45.70 55,33 L 55,6.50 Q 55,4 57.50,4 Q 60,4 60,6.50 L 60,33 C 60,48.46 47.46,61 32,61 C 16.54,61 4,48.46 4,33 L 4,6.50 Q 4,4 6.50,4 Z" }
        ]
    },
    // X
    {
        x: 280, a: 198, ox: "-20.92px", oy: "-6.80px", ex: "0px", ey: "-22px", s: 313.3, dx: "-3.64px", dy: "0px",
        paths: [
            { d: "M 5.75,4 L 5.75,4 Q 7.50,4 8.74,5.24 L 30.23,26.73 Q 32,30 33.77,26.73 L 55.26,5.24 Q 56.50,4 58.25,4 L 58.25,4 Q 60,4 60,5.75 L 60,5.75 Q 60,7.50 58.76,8.74 L 37.27,30.23 Q 34,32 37.27,33.77 L 58.76,55.26 Q 60,56.50 60,58.25 L 60,58.25 Q 60,60 58.25,60 L 58.25,60 Q 56.50,60 55.26,58.76 L 33.77,37.27 Q 32,34 30.23,37.27 L 8.74,58.76 Q 7.50,60 5.75,60 L 5.75,60 Q 4,60 4,58.25 L 4,58.25 Q 4,56.50 5.24,55.26 L 26.73,33.77 Q 30,32 26.73,30.23 L 5.24,8.74 Q 4,7.50 4,5.75 L 4,5.75 Q 4,4 5.75,4 Z" }
        ]
    }
];

export type HanuxLoaderProps = React.SVGProps<SVGSVGElement> & {
    /** Accessible label read by screen readers. */
    label?: string;
};

export function HanuxLoader({ label = "Loading", width = 352, className, ...props }: HanuxLoaderProps) {
    const uid = "hx" + useId().replace(/[^a-zA-Z0-9_-]/g, "");

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="-4 -4 352 72"
            width={width}
            className={["hx-loader", className].filter(Boolean).join(" ")}
            role="img"
            aria-label={label}
            {...props}
        >
            <style>{CSS}</style>

            <defs>
                {LETTERS.map((_, i) => (
                    <linearGradient key={i} id={`${uid}-g${i}`} gradientUnits="userSpaceOnUse" x1="4" y1="4" x2="60" y2="60">
                        <stop offset="0">
                            <animate attributeName="stop-color" dur="6s" begin={`-${(i * 1.5).toFixed(1)}s`} repeatCount="indefinite" keyTimes="0;.25;.5;.75;1" values={PALETTE} />
                        </stop>
                        <stop offset="1">
                            <animate attributeName="stop-color" dur="6s" begin={`-${(i * 1.5).toFixed(1)}s`} repeatCount="indefinite" keyTimes="0;.25;.5;.75;1" values={PALETTE_SHIFTED} />
                        </stop>
                    </linearGradient>
                ))}
            </defs>

            {LETTERS.map((l, i) => (
                <svg
                    key={i}
                    className="hx-glyph"
                    x={l.x}
                    y={0}
                    width={64}
                    height={64}
                    viewBox="0 0 64 64"
                    style={
                        {
                            "--i": i, "--g": `url(#${uid}-g${i})`,
                            "--a": l.a, "--ox": l.ox, "--oy": l.oy, "--ex": l.ex, "--ey": l.ey,
                            "--s": l.s, "--dx": l.dx, "--dy": l.dy,
                        } as React.CSSProperties
                    }
                >
                    <g className="hx-orbit">
                        <circle className="hx-ring" cx={32} cy={32} r={22} pathLength={360} />
                        <circle className="hx-dot" cx={32} cy={32} r={6} />
                    </g>
                    {l.paths.map((p, k) => (
                        <path
                            key={k}
                            className="hx-letter"
                            pathLength={360}
                            d={p.d}
                            style={p.s !== undefined ? ({ "--s": p.s } as React.CSSProperties) : undefined}
                        />
                    ))}
                </svg>
            ))}
        </svg>
    );
}