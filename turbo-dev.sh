#!/bin/bash

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

clear
echo -e "${BLUE}==========================================${NC}"
echo -e "${GREEN}      TURBO CRM - TERMINAL DASHBOARD      ${NC}"
echo -e "${BLUE}==========================================${NC}"

# Função para checar dependências
check_env() {
    echo -ne "${YELLOW}Checando ambiente... ${NC}"
    if command -v node >/dev/null 2>&1; then
        echo -e "${GREEN}[OK] Node instalado${NC}"
    else
        echo -e "${RED}[ERRO] Node não encontrado!${NC}"
    fi
}

check_env

echo -e "\nEscolha uma tarefa:"
echo -e "1) ${GREEN}⚡ MODO TURBO (Limpar + Instalar + Rodar Dev)${NC}"
echo -e "2) 🚀 Apenas Rodar Servidor (npm run dev)"
echo -e "3) 📦 Reinstalar node_modules (Limpeza profunda)"
echo -e "4) 🏗️  Gerar Build e Testar Linter"
echo -e "5) 🚪 Sair"
echo -e "${BLUE}==========================================${NC}"

read -p "Opção: " opcao

case $opcao in
  1)
    echo -e "${YELLOW}Iniciando Modo Turbo...${NC}"
    rm -rf dist node_modules
    npm install && npm run dev
    ;;
  2)
    npm run dev
    ;;
  3)
    echo -e "${YELLOW}Limpando tudo...${NC}"
    rm -rf node_modules package-lock.json
    npm install
    echo -e "${GREEN}Pronto!${NC}"
    ;;
  4)
    echo -e "${YELLOW}Validando projeto...${NC}"
    npm run lint && npm run build
    ;;
  5)
    exit 0
    ;;
  *)
    echo -e "${RED}Opção inválida!${NC}"
    ;;
esac
