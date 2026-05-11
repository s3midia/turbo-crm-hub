# Completion Sound Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a script that plays a sound and speaks a success message on macOS when a task is finished.

**Architecture:** A standalone bash script in the root of the project that leverages macOS `afplay` and `say` utilities.

**Tech Stack:** Bash, macOS system utilities (`afplay`, `say`).

---

### Task 1: Create the Notification Script

**Files:**
- Create: `concluido.sh`

- [ ] **Step 1: Write the script content**

```bash
#!/bin/bash
# Success notification for Antigravity

# Colors for terminal
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}✅ TAREFA CONCLUÍDA COM SUCESSO!${NC}"

# Play Hero sound in background
afplay /System/Library/Sounds/Hero.aiff &

# Say success message in background (Portuguese)
# Using a common Portuguese voice if available, otherwise default
if say -v Luciana "teste" > /dev/null 2>&1; then
    say -v Luciana "Antigravity finalizou a tarefa com sucesso!" &
else
    say "Antigravity finalizou a tarefa com sucesso!" &
fi

wait
```

- [ ] **Step 2: Set executable permissions**

Run: `chmod +x concluido.sh`

- [ ] **Step 3: Verify the script runs**

Run: `./concluido.sh`
Expected: Terminal shows the green checkmark, sound plays (Hero), and voice speaks.

- [ ] **Step 4: Commit**

```bash
git add concluido.sh
git commit -m "feat: add completion notification script with sound and voice"
```
