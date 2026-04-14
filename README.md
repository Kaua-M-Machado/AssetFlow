# AssetFlow — Gestão de Ativos TI

Sistema web para gestão de inventário de hardware de TI.

## Requisitos

- Node.js instalado (versão 14 ou superior)

## Como executar

1. Abra o terminal na pasta do projeto
2. Execute o servidor:

```bash
node server.js
```

3. Abra o navegador em: **http://localhost:3000**

## Estrutura do projeto

```
inventario/
├── server.js         ← Backend Node.js (sem dependências externas)
├── index.html        ← Interface principal
├── style.css         ← Estilos
├── app.js            ← Lógica do frontend
├── inventario.json   ← Banco de dados (criado automaticamente)
└── README.md
```

## Funcionalidades

- ✅ Cadastro de ativos com: Tipo, Modelo/Marca, Colaborador, Setor
- ✅ ID numérico único gerado automaticamente
- ✅ Dados persistidos em `inventario.json`
- ✅ Listagem com zebra striping, busca e filtros
- ✅ Ordenação por qualquer coluna
- ✅ Exclusão com confirmação modal
- ✅ Estatísticas em tempo real
- ✅ Layout responsivo (mobile, tablet, desktop)

## Campos

| Campo | Descrição |
|-------|-----------|
| ID | Identificador único numérico (gerado automaticamente) |
| Tipo | Computador, Notebook, Monitor, Teclado, Mouse, etc. |
| Modelo/Marca | Descrição do equipamento (ex: Dell Inspiron 15) |
| Colaborador | Nome completo do usuário responsável |
| Setor | TI, RH, Financeiro, Comercial, etc. |
