# Notes for Claude

## Math competition leaderboard (`leaderboard/`)
When the user sends a screenshot of a question's results, read the places from it and add them
to `leaderboard/standings.json` under the next question number. Then run
`node leaderboard/make.js <n>` and send them `leaderboard/videos/Leaderboard_Q<n>_greenscreen.mp4`.
Report the running totals table that the script prints. See `leaderboard/README.md`.
- Scoring: 1st = 5, 2nd = 4, 3rd = 3, 4th = 2, 5th = 1. Totals add up across questions. Hybrid D is always highlighted.
- Keep team names spelled exactly as in earlier questions. Ask the user if a screenshot is unreadable.
- The user's workflow: green-screen MP4 → iOS Photos → LumaFusion Chroma Key.
- `.mov` files are git-ignored (too big for GitHub); commit the MP4s.
