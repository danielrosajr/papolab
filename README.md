# 💬 PapoLab — Cada conversa conta uma história

**Laboratório local de conversas do WhatsApp.** Transforme um `.txt` ou `.zip` de exportação em gráficos, rankings, troféus, memórias e cartões PNG compartilháveis, **sem login, backend, API ou upload de conteúdo privado**.

> **v0.1.0 · Primeira versão funcional / base evolutiva.** Interface em português brasileiro. Projeto preparado para GitHub Pages.

## O que funciona nesta versão

- Importação TXT e ZIP; formatos comuns de Android e iOS, multilinha, AM/PM, datas brasileiras e internacionais, mensagens de sistema, mídia omitida e mensagens apagadas.
- Confirmação obrigatória quando a ordem das datas for ambígua; prévia de mensagens reconhecidas oculta até a pessoa clicar para revelar.
- Motor de estatísticas com respostas por troca de turno, sessões (limite ajustável, padrão 8h), média/mediana, atividade, vocabulário, emojis, perguntas explícitas e muito mais.
- **10 modos reais de exploração:** Visão Geral, Detetive, Amigos, Casal, Grupos, Família, Linguagem, Nostalgia, Comunicação e Wrapped. Cada um prioriza dados e interações diferentes.
- Comparador de participantes, descobertas explicadas, prêmios com limites mínimos, rastreador de expressões, máquina do tempo por ano, marcos e memórias manuais temporárias.
- Filtros por participante, intervalo de datas, tipo, dia da semana e faixa de horários.
- Geração de PNG nativa em **9:16, 1:1 e 16:9**, oito paletas, seleção de conteúdos, anonimização e ocultação de datas **ativadas por padrão**. Exportação adicional de resumo JSON agregado e anonimizado.
- Dark/light, layout responsivo, modo demo com conversa 100% inventada, PWA com cache offline dos recursos depois da primeira visita.

### Limitações transparentes da v0.1

- Indicadores de áudios, figurinhas e mídias dependem dos marcadores de texto presentes no export, não analisam anexos e **não medem duração**.
- O parser cobre **formatos comuns**, não todas as traduções, regiões e versões possíveis do WhatsApp. Confirme o início, o fim e a prévia. Arquivos com formatos mistos ou datas imprecisas podem exigir ajustes posteriores.
- Um arquivo pode ter meses/anos parciais. Variações não devem ser tratadas como causas nem prova de um fato pessoal. Tempo de resposta medido por turnos não equivale a prazo real de resposta.
- Emojis compostos (sequências Unicode) podem ser contabilizados por partes. Risadas, palavras carinhosas e perguntas são **detecções heurísticas de texto explícito**, não diagnósticos emocionais.
- Limite de arquivo de 100 MB para evitar consumo de memória extremo. O parser roda em Worker; recalcular filtros/estatísticas ainda é síncrono e históricos excepcionalmente grandes podem causar lentidão.
- Não salva conversas ou memórias entre visitas. Paleta de cores pode ficar armazenada localmente; os dados da conversa só permanecem na memória da aba.
- A função Wrapped possui slides interativos, mas a exportação de PNG é de um **cartão-resumo**, não da sequência animada. Exportação de vídeo/PDF e comparações entre dois arquivos são futuras melhorias.
- Interface inicialmente em português. Internacionalização completa é evolução futura.

## Executar no Ubuntu (Node.js 22 recomendado)

```bash
# Descompacte o ZIP e acesse a pasta papolab
cd papolab
npm install
npm run dev
```

Abra o endereço que o Vite mostrar (geralmente http://localhost:5173). Para validar:

```bash
npm test
npm run build
npm run preview
```

Após o primeiro `npm install`, considere adicionar o `package-lock.json` gerado ao Git para tornar futuras instalações reproduzíveis. Este pacote fonte não inclui um lockfile pré-gerado. A pasta `dist/` é o build de produção. `examples/` traz exportações totalmente sintéticas para testes; o botão de demonstração gera muitos outros dados locais.

## Publicar no GitHub Pages — passo a passo

1. Crie um repositório **público** no GitHub, por exemplo `papolab`.
2. Na pasta do projeto, execute:

```bash
git init
git add .
git commit -m "feat: lançar PapoLab v0.1.0 com parser, dez modos e cartões PNG"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/papolab.git
git push -u origin main
```

3. No repositório: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Abra a aba **Actions** e acompanhe **Publicar PapoLab no GitHub Pages**. O workflow executa `npm install`, testes, build e deploy automaticamente a cada push em `main`.
5. A URL prevista para um repositório de projeto é `https://SEU-USUARIO.github.io/papolab/`. O **nome real do repositório determina a URL**.

**Importante:** `vite.config.ts` detecta automaticamente `GITHUB_REPOSITORY` no GitHub Actions e configura o caminho de base como `/nome-do-repositorio/`. Para repositórios `SEU-USUARIO.github.io`, usa `/`. Para publicar manualmente em uma subpasta diferente, rode `VITE_BASE_PATH=/sua-pasta/ npm run build`.

Se quiser usar `gh` (GitHub CLI autenticado):

```bash
git init && git add . && git commit -m "feat: lançar PapoLab v0.1.0"
git branch -M main
gh repo create papolab --public --source=. --remote=origin --push
```

Depois configure **Settings → Pages → GitHub Actions**. Este ZIP não cria nem publica repositórios por conta própria.

## Estrutura

```text
papolab/
├── .github/workflows/deploy.yml   # build, teste e GitHub Pages
├── examples/                       # dados de teste fictícios
├── public/                         # ícone PWA
├── src/
│   ├── components/                 # gráficos, módulos, comparação, exportação
│   ├── data/demo/                  # dataset inventado
│   ├── modules/                    # catálogo dos 10 módulos
│   ├── services/
│   │   ├── parser/                 # TXT, ZIP e datas
│   │   ├── analytics/              # motor matemático
│   │   ├── insights/               # descobertas e troféus
│   │   └── export/                 # gerador de PNG via Canvas
│   ├── types/                      # contratos TypeScript
│   ├── utils/                      # datas e formatação
│   ├── workers/                    # parsing fora da thread principal
│   ├── App.vue                     # experiência e estado em memória
│   └── style.css                   # design responsivo
├── tests/                          # testes Vitest
└── vite.config.ts                  # PWA + base dinâmica
```

## Critérios e privacidade

- **Mensagens totais:** entradas atribuídas a pessoas, sem contar mensagens de sistema.
- **Sessões:** períodos separados por mais de X horas sem mensagens; X é configurável (padrão: 8h).
- **Tempo de resposta:** apenas mudanças de autor dentro de uma sessão; mediana em minutos. Mensagens sucessivas de uma mesma pessoa não geram várias respostas. Pausas longas que iniciam novas sessões são excluídas.
- **Dias ativos:** datas locais com mensagens; **dias vazios**: datas dentro do intervalo importado sem registros.
- **Troféus:** ao menos 10 mensagens por participante elegível e um número mínimo no indicador do prêmio.
- **Compartilhamento:** prévia exata em Canvas; nomes anonimizados, datas ocultas e trechos privados excluídos por padrão; PNG baixado somente ao clicar. Revise o conteúdo antes de compartilhar, inclusive com outros participantes.
- **Sem telemetria:** sem ferramentas de tracking e sem Google Fonts/remotos; após publicar o app estático, os históricos ficam no navegador. GitHub Pages, enquanto hospeda os arquivos públicos do site, pode receber requisições normais para baixar o aplicativo e seus recursos, mas não recebe a conversa importada.
- **Apagar tudo:** “Apagar conversa e sair” libera o estado de conversas na interface. Fechar a aba descarta os dados não persistidos. Observação: navegadores podem gerenciar memória de forma própria; o app não salva dados da conversa em localStorage, IndexedDB ou servidores.

Este produto foi pensado para análises de conversas às quais o usuário tenha acesso legítimo, com respeito ao consentimento e à privacidade das pessoas. Não infere mentira, traição, fidelidade, qualidade da relação, inteligência, intenção ou estado psicológico.

## Atualizar no futuro

1. Altere arquivos e testes.
2. Mude `version` no `package.json` e registre novidades no `CHANGELOG.md`.
3. Rode `npm test && npm run build`.
4. Faça `git add . && git commit -m "feat: descrever melhoria" && git push`.
5. Em **Releases**, crie a tag correspondente à versão (ex.: `v0.2.0`).

**Primeira tag sugerida:** `v0.1.0`. **Nome da release:** `PapoLab v0.1.0 — O início do laboratório`.

## Licença

MIT — consulte `LICENSE`.
