---
name: release
description: Release a new version of Dzino — runs gates, tags, pushes, deploys to Vercel prod, and aliases to the stable URL.
---

# /release

Release a new version of Dzino to production.

1. Run all gates: `cd app && bun run build && bun run typecheck && bun run lint && bun run test`
2. If any gate fails, fix it before proceeding
3. Determine version bump from git log since last tag (patch/minor/major)
4. Merge current branch into main: `git checkout main && git merge <branch> --no-ff`
5. Create git tag: `git tag v<version> -m "Dzino v<version>"`
6. Push main + tags: `git push origin main --tags`
7. Create GitHub release with changelog from commits since last tag
8. Deploy to Vercel: `cd app && vercel deploy --prod --token $VERCEL_TOKEN --yes`
9. Alias to stable URL: `vercel alias set <deploy-url> dzino-app.vercel.app --token $VERCEL_TOKEN --yes`
10. Verify deployment is live at https://dzino-app.vercel.app
11. Report: version, release URL, stable URL (always https://dzino-app.vercel.app)

Environment: `VERCEL_TOKEN` must be set or passed as argument.
Stable URL: https://dzino-app.vercel.app (never changes)
