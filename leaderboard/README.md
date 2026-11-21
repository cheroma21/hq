# Math competition leaderboard

Animated leaderboard overlays for LumaFusion. Each clip is 5 seconds, 1920×1080, 30fps.
The default output is a green-screen MP4: save it to iOS Photos, import it into LumaFusion,
and remove the green with Color & Effects → Chroma Key.

## Files
- `standings.json`: the results of every question. **This is the only file to edit.**
- `template.html`: the look and the animation.
- `make.js`: adds up the running totals and renders a clip.
- `videos/`: the finished clips (`.mov` files are git-ignored because they're over GitHub's size limit).

## Adding a question
1. Add the results under `questions` in `standings.json`, using the places shown in the screenshot:
   ```json
   "2": [
     { "team": "Hybrid D", "place": 1 },
     { "team": "Mangham High School A", "place": 2 }
   ]
   ```
   Points per question come from `points_by_place` (1st = 5, 2nd = 4, 3rd = 3, 4th = 2, 5th = 1).
   A place beyond that list, or a team missing from the screenshot, earns 0 points.
   Team names must match their earlier spelling exactly. Tied teams can share a place.
2. Run `node leaderboard/make.js <question>`. This writes `videos/Leaderboard_Q<n>_greenscreen.mp4`.
   - `--alpha` writes a transparent ProRes 4444 `.mov` instead.
   - `--preview <photo.jpg>` also writes a preview over a photo, for checking.

## How the clips play
- **Question 1:** teams scroll up into place, then Hybrid D's bar turns black.
- **Question 2 onward:** the clip opens on the previous question's final board. The title rolls
  to the new question number, and a "+N" badge pops up beside each bar (green, or gray for +0).
  The tiles then move to their new positions, Norway-style, with the teams moving up passing
  in front, while the totals count up. After a hold, the board drifts up and fades out.
- A question where nobody placed is recorded as `"7": []` and gets no clip; the next clip opens on the last board shown and rolls the title from that question (e.g. 6 → 8).
- Ranks use competition ranking: tied totals share a number (1, 2, 2, 4).
- The board shows only the top 5 (`max_rows`). A team entering the top 5 slides in from below; a team dropping out slides down and fades away. Teams below 5th still keep their running totals.
- `highlight` (Hybrid D) always gets the black bar.
- In green-screen mode, soft shadows are off and green-ish color tabs are darkened so the key stays clean.

Needs Node with Playwright/Chromium and ffmpeg (both preinstalled in Claude Code cloud sessions).
