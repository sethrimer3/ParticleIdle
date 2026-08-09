# Project Instructions

## Git Workflow

After making code changes, always commit and push them to the remote repository.

## Auto-commit must be paused while you work

A Windows scheduled task, `GitHub-SyncRepos`, runs every 10 minutes. It executes
`C:\Users\srime\Documents\GitHub\sync-repos.ps1`, which stages and commits whatever is in
the working tree of every repo under `Documents\GitHub` — including half-finished edits,
and including files containing unresolved merge conflict markers. It has interrupted a
merge in progress and committed broken source before.

**Before starting any work that edits files, disable it:**

```bash
powershell -Command "Disable-ScheduledTask -TaskName 'GitHub-SyncRepos'"
```

**When your work is committed and pushed, re-enable it:**

```bash
powershell -Command "Enable-ScheduledTask -TaskName 'GitHub-SyncRepos'"
```

Keep it disabled for the whole task — investigation, edits, tests, conflict resolution,
commit, and push. Re-enable only after you have verified your commit is on `origin/main`.
If work is interrupted or you cannot push, leave it disabled and say so in your final
report, so the user knows to re-enable it themselves.

If a run does slip through, look for a commit titled `Auto-sync: local changes <date>` and
check it for conflict markers (`git grep -n '^<<<<<<< '`) before building on it.

### Do not use scripts/pause-autosync.ps1 here

`AGENTS.md` documents a marker-file workflow using `scripts/pause-autosync.ps1` and
`scripts/resume-autosync.ps1`. **Those scripts do not work in this checkout.** They call
`Get-EquatoriaRepository` in `scripts/autosync-common.ps1`, which throws
`Refusing to operate outside the Equatoria_Idle repository` unless both the repo directory
and the `origin` URL are named `Equatoria_Idle`; this clone is `ParticleIdle`. The marker
files they would create (`.git/AUTOSYNC_PAUSED`, `.git/AGENT_WORK_ACTIVE`) are also
ignored by `sync-repos.ps1`, which has no pause check of any kind. Disabling the scheduled
task is the only mechanism that actually stops the auto-commits.
