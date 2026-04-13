# Claude Code Setup — Permissions Whitelist

**AI 201 — Student Reference | Spring 2026**

This is the permissions whitelist used by the instructor during development. Copy it into your own Claude Code settings to avoid getting prompted for every file read, edit, and common CLI command.

---

## Where to Put This

Your **user-level** settings file lives at:

```
~/.claude/settings.json
```

On Windows, that's typically:

```
C:\Users\YOUR_USERNAME\.claude\settings.json
```

If the file doesn't exist, create it. If it does, merge the `permissions` block with whatever is already there.

---

## The Settings File

Copy this entire file:

```json
{
  "permissions": {
    "allow": [
      "Read(*)",
      "Edit(*)",
      "Write(*)",
      "MultiEdit(*)",
      "Bash(ls:*)",
      "Bash(dir:*)",
      "Bash(cat:*)",
      "Bash(head:*)",
      "Bash(tail:*)",
      "Bash(type:*)",
      "Bash(echo:*)",
      "Bash(find:*)",
      "Bash(grep:*)",
      "Bash(rg:*)",
      "Bash(wc:*)",
      "Bash(diff:*)",
      "Bash(sort:*)",
      "Bash(uniq:*)",
      "Bash(pwd:*)",
      "Bash(cd:*)",
      "Bash(tree:*)",
      "Bash(mkdir:*)",
      "Bash(touch:*)",
      "Bash(cp:*)",
      "Bash(mv:*)",
      "Bash(git:*)",
      "Bash(gh:*)",
      "Bash(npm:*)",
      "Bash(npx:*)",
      "Bash(yarn:*)",
      "Bash(pnpm:*)",
      "Bash(bun:*)",
      "Bash(node:*)",
      "Bash(tsc:*)",
      "Bash(python:*)",
      "Bash(python3:*)",
      "Bash(py:*)",
      "Bash(pip:*)",
      "Bash(pip3:*)",
      "Bash(uv:*)",
      "Bash(dotnet:*)",
      "Bash(cargo:*)",
      "Bash(rustc:*)",
      "Bash(go:*)",
      "Bash(make:*)",
      "Bash(cmake:*)",
      "Bash(gcc:*)",
      "Bash(g++:*)",
      "Bash(clang:*)",
      "Bash(sed:*)",
      "Bash(awk:*)",
      "Bash(curl:*)",
      "Bash(wget:*)",
      "Bash(tar:*)",
      "Bash(unzip:*)",
      "Bash(zip:*)",
      "Bash(7z:*)",
      "Bash(chmod:*)",
      "Bash(lsof:*)",
      "Bash(netstat:*)",
      "Bash(ping:*)",
      "Bash(which:*)",
      "Bash(where:*)",
      "Bash(whoami:*)",
      "Bash(env:*)",
      "Bash(set:*)",
      "Bash(export:*)",
      "Bash(source:*)",
      "Bash(date:*)",
      "Bash(du:*)",
      "Bash(df:*)",
      "Bash(docker:*)",
      "Bash(docker-compose:*)",
      "Bash(jest:*)",
      "Bash(pytest:*)",
      "Bash(vitest:*)",
      "Bash(eslint:*)",
      "Bash(prettier:*)",
      "Bash(jq:*)",
      "Bash(xargs:*)",
      "Bash(tee:*)",
      "Bash(sqlite3:*)",
      "Bash(code:*)",
      "WebFetch(*)"
    ],
    "deny": [
      "Bash(rm -rf /:*)",
      "Bash(rm -rf ~:*)",
      "Bash(rm -rf C::*)",
      "Bash(del /s /q C::*)",
      "Bash(format:*)",
      "Bash(diskpart:*)",
      "Bash(sudo:*)",
      "Bash(su:*)",
      "Bash(runas:*)",
      "Bash(ssh:*)",
      "Bash(scp:*)",
      "Bash(rsync:*)",
      "Bash(reboot:*)",
      "Bash(shutdown:*)",
      "Bash(reg:*)",
      "Bash(regedit:*)",
      "Bash(bcdedit:*)",
      "Bash(schtasks:*)",
      "Bash(sc:*)",
      "Bash(net user:*)",
      "Bash(net localgroup:*)",
      "Bash(icacls:*)",
      "Bash(takeown:*)",
      "Bash(cipher /w:*)",
      "Read(**/.env)",
      "Read(**/*.pem)",
      "Read(**/*.key)",
      "Read(**/*secret*)",
      "Read(**/*credential*)",
      "Read(**/.ssh/*)"
    ]
  }
}
```

---

## What This Does

### Allow List (what Claude can do without asking)
- **File operations:** Read, edit, write, and search any file in your project
- **Navigation:** `ls`, `find`, `tree`, `cd`, `pwd` — browsing your project
- **Git:** All git commands including add, commit, push, pull, branch, etc.
- **Package managers:** npm, yarn, pnpm, bun — install and run scripts
- **Build tools:** Node, TypeScript, Vite (via npx), ESLint, Prettier
- **Web:** Fetch URLs for documentation or API reference
- **Common utilities:** grep, diff, sort, curl, jq, etc.

### Deny List (what Claude can never do)
- **Destructive system commands:** `rm -rf /`, `format`, `diskpart` — wipe protection
- **Privilege escalation:** `sudo`, `su`, `runas` — no admin access
- **Remote access:** `ssh`, `scp`, `rsync` — no connecting to other machines
- **System modification:** Registry edits, scheduled tasks, service control, user management
- **Sensitive files:** `.env`, `.pem`, `.key`, secrets, credentials, SSH keys — Claude can't read these

### What's NOT on either list
Anything not explicitly allowed or denied will prompt you for permission. This is the safe default — if Claude wants to run something unusual, you get to decide.

---

## Customizing

You can add tools specific to your workflow. The pattern is:

```
"Bash(command:*)"     ← allows any arguments to that command
"Bash(command arg:*)" ← allows only commands starting with "command arg"
```

For example, if you use Gemini CLI:
```json
"Bash(gemini:*)"
```

---

## Known Gotchas

### Compound Commands Break the Whitelist

The permission matcher evaluates the **first command** in a chain. If you or Claude run:

```bash
cd "C:/my/project" && git add . && git commit -m "message"
```

The matcher sees `cd`, not `git`. Even though both are whitelisted individually, the compound structure can trigger an approval prompt.

**Fix:** Run each command separately. Use absolute paths instead of `cd`. If Claude is chaining commands with `&&`, tell it to stop — each command should be its own call.

---

*AI 201 Creative Computing with AI | Spring 2026 | SCAD Applied AI Degree Program*
