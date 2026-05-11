#!/bin/bash
# Notificação de sucesso para o Antigravity usando macOS Notification Center

# Cores para o terminal
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}✅ TAREFA CONCLUÍDA COM SUCESSO!${NC}"

# Dispara a notificação visual com o som "Hero"
osascript -e 'display notification "Antigravity finalizou a tarefa com sucesso!" with title "Tarefa Concluída" sound name "Hero"'

# Comando de voz opcional (em segundo plano)
say "Tarefa finalizada" &

exit 0
