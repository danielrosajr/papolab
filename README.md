# 💬 PapoLab — Laboratório de conversas

**v0.2.0** · Vue 3 + TypeScript + Vite · Processamento no navegador · Publicação gratuita no GitHub Pages

Importe uma conversa exportada do WhatsApp (TXT ou ZIP), explore dez módulos de análise, veja dados estatísticos, recordes, troféus e retrospectivas por ano. O histórico é processado localmente: sem backend, sem login e sem envio de mensagens para um servidor.

## Novidades da v0.2.0

- **Ranking linguístico limpo:** links, sites, e-mails, números isolados e palavras de preenchimento deixam de poluir a nuvem. Expressões como `bom dia`, `boa noite`, `boa tarde`, `tudo bem` e `te amo` são contadas como uma unidade (em vez de contabilizar suas palavras separadamente). Não há interpretação semântica ou IA externa.
- **Contatos ignorados:** no painel **Refinar análise → Ignorar pessoas ou números**, marque um ou mais participantes. Gráficos, cards, estatísticas, comparações e retrospectivas passam a desconsiderar suas mensagens. Não remove mensagens do arquivo; desmarcar recupera a análise original.
- **Auditoria de palavras e mensagens:** no módulo **Linguagem**, clique num termo frequente e role para a seção **Auditoria dos dados**. Veja as mensagens reais, o trecho destacado, os termos que contribuíram para o ranking e quais mensagens ficaram de fora por exclusão de participantes. Mensagens ficam ocultas até clicar para revelar ou solicitar uma auditoria.
- **Explicação dos dez modos:** cada painel apresenta "quando usar", "o que você vai encontrar" e "o que não podemos concluir".
- **Retrospectiva de ano:** em **Wrapped**, escolha 2026, 2025 ou outro ano presente no arquivo. O aplicativo recalcula os slides, gráficos, pessoas, recordes e permite criar **um cartão PNG daquele ano**. O módulo **Nostalgia** também ganhou relatório anual detalhado com botão para compartilhar.
- **Esconder termos da nuvem:** personalize quais palavras aparecem nesse ranking, sem alterar métricas de outras telas.

## Funcionalidades

- Importação TXT/ZIP, exportações comuns Android/iOS, múltiplas linhas, datas ambíguas, textos e sinalizações de mídia.
- Módulos **Visão geral**, **Detetive**, **Amigos**, **Casal**, **Grupos**, **Família**, **Linguagem**, **Nostalgia**, **Comunicação** e **Wrapped**.
- Filtros por autor, autores ignorados, datas, tipo, dia da semana e faixa horária.
- Métricas de respostas por troca de autor, sessões (pausa ajustável), mediana, total, rankings, vocabulário e atividade.
- Cartões PNG em 9:16, 1:1 e 16:9, com oito temas, anonimização e ocultação de datas ativadas por padrão.
- Dark/light, modo demo sintético, PWA/offline após carregamento inicial, relatório JSON agregado.

## Atualizar pelo navegador — sem terminal Git

### Atualização a partir da v0.1.1

1. Extraia **`papolab-v0.2.0-atualizacao-github.zip`** no computador.
2. Abra [seu repositório](https://github.com/danielrosajr/papolab) no GitHub.
3. Para atualizar pastas e arquivos diretamente no navegador, pressione **`.`** na página do repositório para abrir o editor `github.dev`. No painel de arquivos, substitua os arquivos existentes pelos arquivos extraídos e adicione os dois novos (`src/services/analytics/language.ts` e `tests/language.test.ts`), mantendo a estrutura de pastas.
4. Abra **Source Control**, revise as alterações e confirme o commit na branch `main`.
5. Em **Actions**, acompanhe o workflow **Publicar PapoLab no GitHub Pages**. Se necessário, em **Settings → Pages**, escolha **GitHub Actions** como origem.

Se preferir o GitHub tradicional, navegue até a pasta correspondente e use **Add file → Upload files** para cada conjunto de arquivos. O importante é **não jogar arquivos de `src/` na raiz**: preserve os diretórios do ZIP.

**Commit sugerido:** `feat: PapoLab v0.2.0 com expressões, exclusão de participantes e Wrapped anual`

**Tag / release:** `v0.2.0` (GitHub → Releases → Draft a new release → Choose a tag → Create new tag `v0.2.0`).

### Instalar pela primeira vez

Extraia **`papolab-v0.2.0-completo-github.zip`**, crie um repositório público e envie a estrutura do projeto. Depois, em **Settings → Pages → Build and deployment**, selecione **GitHub Actions**. A URL de um repositório de projeto será `https://SEU-USUARIO.github.io/papolab/`.

## Desenvolver e testar localmente (opcional)

No Ubuntu, com Node.js 22:

```bash
npm install
npm run dev
```

Depois de instalar dependências, também é possível executar:

```bash
npm test
npm run build
```

O deploy do GitHub Actions já roda testes, verificação TypeScript e build do Vite. Nenhuma conexão Git via terminal é necessária para publicar a atualização.

## Metodologia e limitações

- **Frases combinadas:** `bom dia` ocupa um termo próprio em vez de somar `bom` e `dia` na nuvem. Regras locais e reproduzíveis em `src/services/analytics/language.ts`; o vocabulário de expressões pode crescer. Palavras comuns (stopwords) são removidas apenas do **ranking**, não das mensagens do arquivo.
- **Contagem:** o ranking soma ocorrências, enquanto a auditoria indica número de **mensagens** que contêm a expressão. Uma mensagem com duas ocorrências pode valer 2 no ranking e 1 na auditoria.
- **Exclusão de participantes:** recalcula dados somente com as mensagens não excluídas. Ao remover um autor intermediário, as sessões e os intervalos de respostas remanescentes podem mudar; não é uma reconstrução de quem teria escrito no mundo real.
- **Datas/retrospectivas:** o PapoLab só conhece o intervalo importado. Um resumo de 2026 pode representar janeiro–outubro, por exemplo, e não pressupõe dezembro. Filtros globais também se aplicam ao ano selecionado.
- **Privacidade:** mensagens e nomes não saem do dispositivo. O editor de compartilhamento permite optar por revelar nomes; a anonimização vem ativada. Peça consentimento antes de compartilhar dados que possam identificar outras pessoas.
- **Importação:** formatos regionais incomuns podem não ser reconhecidos; consulte as mensagens reconhecidas após importar. Indicadores de áudio/figurinha dependem dos marcadores disponíveis, não da análise das mídias reais.
- **Desempenho:** leitura usa Web Worker, mas filtros estatísticos ainda são síncronos no navegador. Históricos enormes podem gerar pausas em celulares de baixa memória. Limite de importação: 100 MB.
- **PWA:** funcionamento offline depende de ao menos uma visita bem-sucedida e do armazenamento em cache do navegador.
- **A fazer:** exportação de slideshow completo, comparação entre arquivos distintos, internacionalização completa e outras expansões.

## Testes incluídos

`tests/parser.test.ts` (formatos Android/iOS), `tests/analytics.test.ts` (métricas), `tests/export.test.ts` (anonimização) e `tests/language.test.ts` (links, frases, acentos, exclusão e datas).

Projeto livre para uso e aprimoramento; leia `LICENSE`.
