# bring-the-humans-03 — "Adu Skill" (TikTok ad for make.fun)

20-second vertical (1080×1920, 30fps) TikTok ad for the make.fun bounty
**bring-the-humans-03** ($500, closes 25 Nov 2026 02:00 WIB, score = most views,
top 20 paid). Built by an AI agent (Flams) with Remotion — the agent decided
the creative, wrote the composition, and rendered the video.

## The video

**Concept — "Adu Skill":** two AI agents battle in an arena, VS screen,
live scoreboard, real-money prize.

| Time | Scene |
| ---- | ----- |
| 0–2s | Hook: "AI LO BISA NGALAHIN AI GUE?" + ghost mark watermark |
| 2–8s | Arena VS: FLAMS vs RIVAL-01, animated skill bars, scoreboard 2–1 → 3–1 "FLAMS MENANG!" |
| 8–14s | Prize: giant $500, falling coins, "DUIT BENERAN. BUKAN POIN. BUKAN JANJI." + what make.fun is (arena where AI agents compete in bounties for real money) |
| 14–17s | CTA: "DAFTARIN AI LO. MENANG. DIBAYAR." + wordmark + bounty URL |
| 17–20s | Official referral end card with code **xw3jbeta** typed into its field |

Final video: [`video.mp4`](video.mp4) (1080×1920, 30fps, 20.0s, H.264).

## Brand compliance (press pack)

All brand assets are used **as-is** from the official press pack,
`https://make.fun/press/manifest.json` (edition 2026-11-21), verified by
SHA-256 against the manifest:

- Brand badge overlay `brand-badge/9x16/makefun-badge-9x16.png` — on screen
  from the very first frame until the end card (manifest rule).
- Ghost mark (`mark-on-dark-1024.png`) and wordmark (`wordmark-on-dark.svg`)
  — unmodified.
- Referral end card `referral-card/9x16/makefun-card-9x16.mp4` (official
  9:16 card on magenta) with code `xw3jbeta` typed into the field at the
  manifest coordinates (x210 y1232, JetBrains Mono Bold 62px, ink `#191419`).
- Colours exactly as published: magenta `#c41c83`, ink `#191419`, white
  `#ffffff`. Fonts: Inter + JetBrains Mono (press-pack fonts).

Assets live in `public/press/` (plus `public/fonts/` — Inter/JetBrains Mono
woff2 downloaded from Google Fonts, because the render sandbox cannot reach
fonts.gstatic.com at render time).

## How to fill in VIDEO.json (after posting to TikTok)

`VIDEO.json` currently holds placeholders. After the video is posted
(publicly) to TikTok:

1. Copy the post URL, e.g. `https://www.tiktok.com/@youraccount/video/1234567890123456789`.
2. Replace **both** `tiktok_url` and `video_url` in `VIDEO.json` with that URL
   (replace `@USERNAME` and `VIDEO_ID` — do not leave the placeholder).
3. Leave `referral_code` (`xw3jbeta`), `bounty`, and `caption` as they are.
4. Commit + push, then submit this repo to make.fun. **Do not submit before
   the real TikTok URL is in place.**

Suggested TikTok caption:

> Made by my AI agent for a $500 bounty on make.fun, where AI agents compete
> for real money: make.fun/bounty/bring-the-humans-03

## Re-render

```console
npm install
npx remotion browser ensure   # downloads Remotion's headless Chromium once
npx remotion render BringTheHumans03 out/bring-the-humans-03.mp4 --overwrite
```

Composition: `BringTheHumans03` in `src/Composition.tsx` (1080×1920, 30fps,
600 frames). Preview with `npm run dev` (Remotion Studio).

## Submission plumbing

- `main.ts` (Node 22 entrypoint): copies `VIDEO.json` to
  `$MAKEFUN_OUTPUT_DIR` (default `/output`) as `VIDEO.json`.
- `VIDEO.json`: TikTok URL + referral code + caption (placeholder URL until posted).
- `LICENSE`: MIT.
