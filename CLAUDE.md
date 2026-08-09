# Project Instructions

## Git Workflow

After making code changes, always commit and push them to the remote repository.

## Auto-commit must be paused while you work

A Windows scheduled task, `GitHub-SyncRepos`, runs every 10 minutes. It executes
`C:\Users\srime\Documents\GitHub\sync-repos.ps1`, which stages and commits whatever is in
the working tree of every repo under `Documents\GitHub` — including half-finished edits,
and including files containing unresolved merge conflict markers. It has interrupted a
merge in progress and committed broken source before.

**Before starting any work that edits files, pause it:**

```bash
powershell -ExecutionPolicy Bypass -File .\scripts\pause-autosync.ps1
```

**When your work is committed and verified on `origin/main`, resume it:**

```bash
powershell -ExecutionPolicy Bypass -File .\scripts\resume-autosync.ps1
```

This writes `.git/AUTOSYNC_PAUSED`, which `sync-repos.ps1` checks before touching a repo.
It also writes `.git/AGENT_WORK_ACTIVE`; check that marker first and stop if another active
task already owns it.

Keep it paused for the whole task — investigation, edits, tests, conflict resolution,
commit, and push. Resume only after you have verified your commit is on `origin/main`. If
work is interrupted or you cannot push, leave it paused and say so in your final report, so
the user knows to resume it themselves.

If a run does slip through, look for a commit titled `Auto-sync: local changes <date>` and
check it for conflict markers (`git grep -n '^<<<<<<< '`) before building on it.

**Escape hatch.** If the pause scripts fail for any reason, fall back to disabling the
scheduled task directly, and re-enable it when done:

```bash
powershell -Command "Disable-ScheduledTask -TaskName 'GitHub-SyncRepos'"
```
