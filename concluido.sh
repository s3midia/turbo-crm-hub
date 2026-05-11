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
