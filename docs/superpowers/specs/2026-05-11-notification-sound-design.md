# Design Spec: Completion Notification Script

## Goal
Provide a distinct auditory and vocal feedback to the user whenever Antigravity finishes a complex action plan.

## Technical Details

### Script Name
`concluido.sh`

### Location
Root of the repository: `/Users/s3midiadigital/.gemini/antigravity/scratch/turbo-crm-hub/turbo-crm-hub/concluido.sh`

### Features
1. **Audio Feedback**: Uses `afplay` to play `/System/Library/Sounds/Hero.aiff`.
2. **Voice Announcement**: Uses `say` to announce completion in Portuguese.
3. **Visual Confirmation**: Prints a success message in the terminal with green colors.

### Implementation
```bash
#!/bin/bash
# Success notification for Antigravity

GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}✅ TAREFA CONCLUÍDA COM SUCESSO!${NC}"

# Play Hero sound
afplay /System/Library/Sounds/Hero.aiff &

# Say success message
say "Antigravity finalizou a tarefa!" &

wait
```

## Integration Plan
Antigravity will include `./concluido.sh` as the final command in its implementation plans for major tasks.

## Success Criteria
- The script executes without errors.
- The user hears the "Hero" sound.
- The user hears the voice notification.
