# Histórico de versões

## v0.2.0 — 2026-10-23

### Adicionado
- Ranking de palavras mais limpo, com remoção de URLs, e-mails, domínios, números e palavras muito comuns.
- Expressões multi-palavra como "bom dia", "boa noite", "boa tarde" e "tudo bem" contabilizadas juntas na nuvem.
- Exclusão reversível de contatos e números nos filtros globais; cálculo refeito para todos os módulos e cartões.
- Painel de auditoria, com mensagens contabilizadas/ignoradas, termos reconhecidos e realce da palavra escolhida.
- Esconder termos personalizados na nuvem de linguagem.
- Guia de finalidade e limites para cada um dos dez módulos.
- Retrospectiva filtrável por ano (incluindo 2026), slides interativos, cartões PNG com dados do ano e relatório anual em Nostalgia.
- Novos testes de termos, links, acentos e filtros temporais.

### Ajustado
- Versão exibida na interface e no pacote para v0.2.0.
- README prioriza envio e atualização pelo navegador no GitHub.

### Limitação conhecida
- Os índices de ano descrevem somente o histórico importado, que pode ter cobertura parcial; não inferem acontecimentos externos.

## v0.1.1 — 2026-10-23
- Corrigidos atributos de horário duplicados em `src/App.vue` (TS1117).
- Adicionados tipos Node necessários à configuração do Vite (`process.env`, TS2591).

## v0.1.0 — 2026-10-23
- Fundação Vue 3/TS/Vite, TXT e ZIP WhatsApp, motor analítico, dez modos, demonstração, PWA, cartões e Github Actions.
