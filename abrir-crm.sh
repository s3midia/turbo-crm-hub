#!/bin/bash

# ==========================================
# TURBO CRM - SCRIPT DE INICIALIZAÇÃO LOCAL
# ==========================================

# Cores para o terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # Sem cor

# Caminho do projeto
PROJECT_DIR="/Users/s3midiadigital/.gemini/antigravity/scratch/turbo-crm-hub/turbo-crm-hub"

cd "$PROJECT_DIR" || exit

clear
echo -e "${BLUE}==========================================${NC}"
echo -e "${GREEN}      🚀 INICIANDO TURBO CRM HUB         ${NC}"
echo -e "${BLUE}==========================================${NC}"

# 1. Verificar Node.js
if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}❌ Erro: Node.js não está instalado.${NC}"
    exit 1
fi

# 2. Verificar dependências
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Instalando dependências (primeira vez)...${NC}"
    npm install
fi

# 3. Abrir no VS Code (opcional - se o comando 'code' estiver instalado)
if command -v code >/dev/null 2>&1; then
    echo -e "${BLUE}📂 Abrindo no VS Code...${NC}"
    code .
fi

# 4. Iniciar servidor de desenvolvimento
echo -e "${GREEN}⚡ Iniciando servidor local...${NC}"
echo -e "${YELLOW}O navegador abrirá automaticamente em breve.${NC}"

# Rodar npm run dev
npm run dev
