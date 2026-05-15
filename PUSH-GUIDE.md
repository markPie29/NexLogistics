# Git Push Guide — FMS Client Projects

**GitHub Account:** `jcuady` — `jcuady@gmail.com`

| Project | Local Directory | GitHub Repo | Branch |
|---|---|---|---|
| SK Logistics Services | `C:\Users\jcuad\OneDrive\Documents\SKLogistics` | `mozhdeveloper/sk-logistics-FMS` | `master` |
| MTS Trucking Incorporated | `C:\Users\jcuad\OneDrive\Documents\MTSTrucking` | `mozhdeveloper/mts-trucking-FMS` | `main` |

---

## Part 1 — First-Time Setup (Run Once)

Run this once globally so all commits use the correct identity:

```powershell
git config --global user.name "jcuady"
git config --global user.email "jcuady@gmail.com"
```

Verify it applied:

```powershell
git config --global user.name
git config --global user.email
```

---

## Part 2 — Standard Push Workflow

### SK Logistics Services

```powershell
cd "C:\Users\jcuad\OneDrive\Documents\SKLogistics"

# Stage all changes
git add -A

# Commit with a descriptive message
git commit -m "feat: describe what you changed"

# Push to GitHub
git push origin master
```

### MTS Trucking Incorporated

```powershell
cd "C:\Users\jcuad\OneDrive\Documents\MTSTrucking"

# Stage all changes
git add -A

# Commit with a descriptive message
git commit -m "feat: describe what you changed"

# Push to GitHub
git push origin main
```

> **Note:** SK Logistics uses branch `master`. MTS Trucking uses branch `main`. Do not mix them up.

---

## Part 3 — Commit Message Convention

Use these prefixes for clean, readable history:

| Prefix | When to use |
|---|---|
| `feat:` | New feature or page |
| `fix:` | Bug fix |
| `style:` | UI/visual change only, no logic change |
| `refactor:` | Code restructure, no behavior change |
| `chore:` | Config, dependencies, non-code updates |
| `docs:` | Documentation only |

**Examples:**
```
feat: add trip detail page with status timeline
fix: correct vehicle plate format in notifications
style: update sidebar active state to brand red
chore: add AI_CONTEXT.md for project reference
```

---

## Part 4 — Porting a Feature from NexLogistics → Client Projects

When you develop or improve something in **NexLogistics** and want to copy it into SK Logistics or MTS Trucking, you MUST do a find-and-replace pass before committing. Missing even one reference will cause branding bleed.

### 4A — Refactor Checklist: NexLogistics → SK Logistics

Copy the files, then replace the following:

| Find (NexLogistics) | Replace with (SK Logistics) |
|---|---|
| `NEX-101` ... `NEX-110` | `SKL-101` ... `SKL-110` |
| `@nexlogistics.demo` | `@sklogistics.demo` |
| `nex-ui` | `skl-ui` |
| `nex-fleet` | `skl-fleet` |
| `nex-drivers` | `skl-drivers` |
| `nex-trips` | `skl-trips` |
| `nex-payroll` | `skl-payroll` |
| `nex-expenses` | `skl-expenses` |
| `nex-maintenance` | `skl-maintenance` |
| `NexLogistics` | `SK Logistics Services` |
| `Nex Logistics` | `SK Logistics Services` |
| `NEX Logistics` | `SK Logistics Services` |
| `NexVision` | *(remove or replace with SK Logistics)* |
| `Nex AI Engine` | `SK AI Engine` |
| `#66B2B2` (teal) | `#D31A21` (brand-red) |
| `#0B1220` (dark navy) | `#212529` (brand-charcoal) |

**PowerShell snippet** — replace in all source files at once:

```powershell
$root = "C:\Users\jcuad\OneDrive\Documents\SKLogistics"
$files = Get-ChildItem -Path $root -Recurse -Include "*.ts","*.tsx","*.css","*.json" `
  | Where-Object { $_.FullName -notmatch 'node_modules|\.next|\.git' }

$replacements = @{
  'NEX-'              = 'SKL-'
  '@nexlogistics.demo'= '@sklogistics.demo'
  '"nex-'             = '"skl-'
  'NexLogistics'      = 'SK Logistics Services'
  'Nex Logistics'     = 'SK Logistics Services'
  'NexVision'         = 'SK Logistics Services'
  'Nex AI Engine'     = 'SK AI Engine'
}

foreach ($file in $files) {
  $content = Get-Content $file.FullName -Raw
  $changed = $false
  foreach ($find in $replacements.Keys) {
    if ($content -match [regex]::Escape($find)) {
      $content = $content.Replace($find, $replacements[$find])
      $changed = $true
    }
  }
  if ($changed) {
    Set-Content -Path $file.FullName -Value $content -NoNewline
    Write-Host "Updated: $($file.Name)"
  }
}
```

---

### 4B — Refactor Checklist: NexLogistics → MTS Trucking

Copy the files, then replace the following:

| Find (NexLogistics) | Replace with (MTS Trucking) |
|---|---|
| `NEX-101` ... `NEX-110` | `MTS-101` ... `MTS-110` |
| `@nexlogistics.demo` | `@mtstrucking.demo` |
| `nex-ui` | `mts-ui` |
| `nex-fleet` | `mts-fleet` |
| `nex-drivers` | `mts-drivers` |
| `nex-trips` | `mts-trips` |
| `nex-payroll` | `mts-payroll` |
| `nex-expenses` | `mts-expenses` |
| `nex-maintenance` | `mts-maintenance` |
| `NexLogistics` | `MTS Trucking Incorporated` |
| `Nex Logistics` | `MTS Trucking Incorporated` |
| `NEX Logistics` | `MTS Trucking Incorporated` |
| `NexVision` | *(remove or replace with MTS Trucking)* |
| `Nex AI Engine` | `MTS AI Engine` |
| `#66B2B2` (teal) | `#E3000F` (brand-red / Chevron Red) |
| `#0B1220` (dark navy) | `#111111` (brand-black) |

**PowerShell snippet** — replace in all source files at once:

```powershell
$root = "C:\Users\jcuad\OneDrive\Documents\MTSTrucking"
$files = Get-ChildItem -Path $root -Recurse -Include "*.ts","*.tsx","*.css","*.json" `
  | Where-Object { $_.FullName -notmatch 'node_modules|\.next|\.git' }

$replacements = @{
  'NEX-'              = 'MTS-'
  '@nexlogistics.demo'= '@mtstrucking.demo'
  '"nex-'             = '"mts-'
  'NexLogistics'      = 'MTS Trucking Incorporated'
  'Nex Logistics'     = 'MTS Trucking Incorporated'
  'NexVision'         = 'MTS Trucking Incorporated'
  'Nex AI Engine'     = 'MTS AI Engine'
}

foreach ($file in $files) {
  $content = Get-Content $file.FullName -Raw
  $changed = $false
  foreach ($find in $replacements.Keys) {
    if ($content -match [regex]::Escape($find)) {
      $content = $content.Replace($find, $replacements[$find])
      $changed = $true
    }
  }
  if ($changed) {
    Set-Content -Path $file.FullName -Value $content -NoNewline
    Write-Host "Updated: $($file.Name)"
  }
}
```

---

### 4C — Porting a Feature Between SK ↔ MTS

When copying a feature from SK Logistics into MTS Trucking (or vice versa), replace these:

**SK → MTS:**

| Find (SK) | Replace with (MTS) |
|---|---|
| `SKL-` | `MTS-` |
| `@sklogistics.demo` | `@mtstrucking.demo` |
| `skl-` | `mts-` |
| `SK Logistics Services` | `MTS Trucking Incorporated` |
| `SK AI Engine` | `MTS AI Engine` |
| `brand-red` (#D31A21) | `brand-red` (#E3000F) *(same token, different value — no code change needed if using Tailwind tokens)* |
| `brand-burgundy` | `brand-black` |
| `font-display` Montserrat italic | `font-display` Montserrat Bold (no italic for MTS) |
| `rounded-xl` / `rounded-lg` | `rounded-sm` or no rounding (MTS is sharp/industrial) |

**MTS → SK:**

| Find (MTS) | Replace with (SK) |
|---|---|
| `MTS-` | `SKL-` |
| `@mtstrucking.demo` | `@sklogistics.demo` |
| `mts-` | `skl-` |
| `MTS Trucking Incorporated` | `SK Logistics Services` |
| `MTS AI Engine` | `SK AI Engine` |
| `shadow-industrial` | `shadow-glow` (SK uses soft glow shadows) |
| `rounded-none` / `rounded-sm` | `rounded-md` / `rounded-lg` (SK uses rounded corners) |

---

## Part 5 — After Porting: Verification Steps

Run this before committing to make sure no old brand strings slipped through:

**For SK Logistics:**
```powershell
cd "C:\Users\jcuad\OneDrive\Documents\SKLogistics"
Get-ChildItem -Recurse -Include "*.ts","*.tsx" | Where-Object { $_.FullName -notmatch 'node_modules|\.next' } |
  Select-String -Pattern 'NEX-|NexLogistics|NexVision|nexlogistics\.demo|"nex-' |
  ForEach-Object { "$($_.Filename):$($_.LineNumber): $($_.Line.Trim())" }
```

**For MTS Trucking:**
```powershell
cd "C:\Users\jcuad\OneDrive\Documents\MTSTrucking"
Get-ChildItem -Recurse -Include "*.ts","*.tsx" | Where-Object { $_.FullName -notmatch 'node_modules|\.next' } |
  Select-String -Pattern 'NEX-|NexLogistics|NexVision|nexlogistics\.demo|"nex-' |
  ForEach-Object { "$($_.Filename):$($_.LineNumber): $($_.Line.Trim())" }
```

If either command produces output, fix those files before committing.

Then do a build check:
```powershell
# SK
cd "C:\Users\jcuad\OneDrive\Documents\SKLogistics"; npm run build

# MTS
cd "C:\Users\jcuad\OneDrive\Documents\MTSTrucking"; npm run build
```

Both must show **0 TypeScript errors** before pushing.

---

## Part 6 — Authentication Troubleshooting

If `git push` prompts for credentials or fails with 401/403:

**Option A — Use GitHub Personal Access Token (PAT)**
1. Go to: https://github.com/settings/tokens
2. Generate a new token (classic) with `repo` scope
3. When prompted for password during push, paste the token instead

**Option B — Store credentials so you're not asked every time**
```powershell
git config --global credential.helper store
```
Then push once and enter your username (`jcuady`) and PAT. Git will remember it.

**Option C — Use GitHub CLI**
```powershell
gh auth login
```
Follow the browser prompt to authenticate with `jcuady@gmail.com`.

---

## Quick Reference

```powershell
# Push SK Logistics
cd "C:\Users\jcuad\OneDrive\Documents\SKLogistics"
git add -A
git commit -m "feat: your message here"
git push origin master

# Push MTS Trucking
cd "C:\Users\jcuad\OneDrive\Documents\MTSTrucking"
git add -A
git commit -m "feat: your message here"
git push origin main
```
