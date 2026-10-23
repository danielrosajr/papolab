# PapoLab v0.2.0 — Palavras mais inteligentes e retrospectiva anual

Nesta versão, o PapoLab ganhou uma leitura linguística mais útil e formas de explorar as conversas com mais controle.

### Novidades
- Ranking de palavras sem `http`, `https`, `www`, URLs, e-mails e termos de preenchimento.
- Expressões como **bom dia**, **boa noite**, **boa tarde** e **tudo bem** contabilizadas juntas.
- Possibilidade de ignorar participantes ou números do WhatsApp, recalculando todos os módulos sem removê-los do arquivo.
- Auditoria de mensagens: veja quais mensagens entraram, quais ficaram de fora e quais termos foram contados; realce da expressão buscada.
- Explicações de quando usar cada um dos dez modos de análise e quais limites possuem.
- **Wrapped por ano:** selecione 2026, 2025 ou qualquer ano disponível e gere uma retrospectiva interativa, com cartão PNG daquele período.
- Relatório anual ampliado no módulo Nostalgia.
- Mais testes automatizados para termos, acentos e exclusões.

### Importante
- Tudo continua sendo processado no navegador. Nenhuma conversa é enviada para servidores.
- O resumo anual representa apenas as mensagens existentes no histórico importado. Anos podem estar incompletos.
- Para conferir de onde vem uma contagem, clique em um termo no módulo Linguagem.

**Commit:** `feat: PapoLab v0.2.0 com expressões, exclusão de participantes e Wrapped anual`

**Tag:** `v0.2.0`
