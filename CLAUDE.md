# Notes for Claude

## Math competition leaderboard (`leaderboard/`)
When the user sends a screenshot of a question's results, read the places from it and add them
to `leaderboard/standings.json` under the next question number. Then run
`node leaderboard/make.js <n>` and send them `leaderboard/videos/Leaderboard_Q<n>_greenscreen.mp4`.
Report the running totals table that the script prints. See `leaderboard/README.md`.
- Scoring: 1st = 5, 2nd = 4, 3rd = 3, 4th = 2, 5th = 1. Totals add up across questions. Hybrid D is always highlighted. Show only the top 5 (`max_rows: 5`).
- ~40 teams compete. Each screenshot shows only that question's top 5; record every team listed (new teams get added, everyone else gets 0 that question).
- Keep team names spelled exactly as in earlier questions. If a name looks like a variant of an existing team, or a screenshot is unreadable, ask the user instead of guessing.
- Natchitoches Central High School is the A team (B is separate). It shows as "...School A" from Q12 via `display_names`; keep recording it under the original name.
- If nobody placed on a question, record it as an empty list; make.js skips its clip (the user wants no clip for it).
- The user's workflow: green-screen MP4 → iOS Photos → LumaFusion Chroma Key.
- `.mov` files are git-ignored (too big for GitHub); commit the MP4s.
