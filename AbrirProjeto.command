#!/bin/bash

# Este arquivo permite abrir o projeto dando um duplo clique no Finder

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR" || exit

# Chama o script principal
./abrir-crm.sh
