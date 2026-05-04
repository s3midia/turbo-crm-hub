#!/bin/bash

# Script para Auto-Push (Antigravity)
# Este script monitora mudanças nos arquivos e faz o push automaticamente para o Git.

# Configurações
INTERVALO=5 # Segundos entre cada verificação

echo "------------------------------------------------"
echo "🚀 Auto-Push Antigravity Ativado!"
echo "📍 Diretório: $(pwd)"
echo "⏱️ Verificação a cada $INTERVALO segundos"
echo "------------------------------------------------"

while true; do
  # Verifica se há qualquer alteração no repositório (arquivos novos, modificados ou deletados)
  if [[ -n $(git status --short) ]]; then
    echo "✨ Alterações detectadas às $(date +'%H:%M:%S')"
    
    # Adiciona alterações (respeitando o .gitignore)
    git add .
    
    # Cria o commit com data e hora
    TIMESTAMP=$(date +'%d/%m/%Y %H:%M:%S')
    git commit -m "Auto-push: $TIMESTAMP"
    
    # Tenta fazer o push
    echo "📤 Fazendo push para o servidor..."
    if git push; then
      echo "✅ Push realizado com sucesso!"
    else
      echo "❌ Erro ao fazer push. Verifique sua conexão ou conflitos."
    fi
    
    echo "------------------------------------------------"
  fi
  
  # Espera o intervalo definido
  sleep $INTERVALO
done
