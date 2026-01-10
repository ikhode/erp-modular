#!/bin/bash

# Script para migrar CHECKLIST_ERP.md a GitHub Issues

# Leer el archivo y procesar líneas
while IFS= read -r line; do
  if [[ $line =~ ^- \[[ x]\] \*\*([0-9]+\.[0-9]+\.[0-9]+)\*\* (.+)$ ]]; then
    status="${BASH_REMATCH[1]}"
    task_id="${BASH_REMATCH[2]}"
    description="${BASH_REMATCH[3]}"
    if [[ $status == " " ]]; then
      # Crear issue para pendiente
      gh issue create --title "$task_id $description" --body "Tarea pendiente del checklist ERP: $description" --label "pending,erp-checklist"
    fi
  fi
done < CHECKLIST_ERP.md
