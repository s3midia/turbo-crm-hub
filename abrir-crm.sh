#!/bin/bash

# ==========================================
# TURBO CRM - SCRIPT DE INICIALIZAÇÃO LOCAL
# ==========================================

# Cores para o terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # Sem cor

# Caminho do projeto (Tenta detectar automaticamente se o fixo falhar)
FIXED_DIR="/Users/s3midiadigital/.gemini/antigravity/scratch/turbo-crm-hub/turbo-crm-hub"
if [ -d "$FIXED_DIR" ]; then
    PROJECT_DIR="$FIXED_DIR"
else
    PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
fi

cd "$PROJECT_DIR" || exit

clear
echo -e "${BLUE}==========================================${NC}"
echo -e "${GREEN}      🚀 INICIANDO TURBO CRM HUB         ${NC}"
echo -e "${BLUE}==========================================${NC}"

# 1. Verificar Node.js e NPM
if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}❌ Erro: Node.js não está instalado.${NC}"
    echo "Baixe em: https://nodejs.org/"
    read -p "Pressione [Enter] para sair..."
    exit 1
fi

# 2. Verificar dependências
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Instalando dependências (isso pode demorar um pouco)...${NC}"
    npm install || { echo -e "${RED}❌ Erro ao instalar dependências.${NC}"; read -p "Pressione [Enter] para sair..."; exit 1; }
fi

# 3. Abrir no VS Code (opcional)
if command -v code >/dev/null 2>&1; then
    echo -e "${BLUE}📂 Abrindo no VS Code...${NC}"
    code .
fi

# 4. Iniciar servidor de desenvolvimento e abrir navegador
echo -e "${GREEN}⚡ Iniciando servidor em http://127.0.0.1:3000${NC}"
echo -e "${YELLOW}O navegador deve abrir automaticamente.${NC}"
echo -e "${BLUE}Pressione Ctrl+C para parar o servidor.${NC}"
echo -e "------------------------------------------"

# Rodar npm run dev com flag de abrir
npm run dev -- --open --host 127.0.0.1 --port 3000

# Caso o comando acima pare por erro
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ O servidor parou inesperadamente.${NC}"
    read -p "Pressione [Enter] para ver os erros e sair..."
fi
