<script setup lang="ts">
import {computed,ref,shallowRef,onBeforeUnmount,nextTick} from 'vue'
import {ArrowUpRight,Upload,ShieldCheck,Sun,Moon,Share2,Trash2,SlidersHorizontal,FileText,LockKeyhole,ChevronRight,Info,Menu,RotateCcw} from 'lucide-vue-next'
import type {DateOrder,ModuleId,ParsedChat,ChatMessage} from './types'
import {modules} from './modules/catalog'
import {demoChat} from './data/demo/chat'
import {readWhatsAppFile} from './services/parser/files'
import {detectDateOrder} from './services/parser/whatsapp'
import {analyze} from './services/analytics/engine'
import {containsTerm,highlightedParts,termsForRanking} from './services/analytics/language'
import {dateLabel,fmt,compact,percent} from './utils/format'
import ModulePanel from './components/ModulePanel.vue'
import ShareEditor from './components/ShareEditor.vue'

const chat=shallowRef<ParsedChat|null>(null)
const active=ref<ModuleId>('overview')
const dark=ref((()=>{try{return localStorage.getItem('papolab-theme')!=='light'}catch{return true}})())
const isImporting=ref(false),fileProgress=ref(0),error=ref(''),howto=ref(false),share=ref(false),showMessages=ref(false),navOpen=ref(false)
const pending=ref<{text:string;filename:string}|null>(null),order=ref<DateOrder>('DMY')
const fileInput=ref<HTMLInputElement|null>(null)
const excludedAuthors=ref<string[]>([]),previewTerm=ref(''),previewAnchor=ref<HTMLElement|null>(null)
const author=ref(''),start=ref(''),end=ref(''),kind=ref(''),weekday=ref(''),hourFrom=ref(0),hourTo=ref(23),gapHours=ref(8),content=ref(true)
let worker:Worker|null=null
const selected=computed(()=>modules.find(m=>m.id===active.value)!)
const scoped=computed<ChatMessage[]>(()=>{
  if(!chat.value)return []
  const since=start.value?new Date(start.value+'T00:00:00').getTime():0
  const until=end.value?new Date(end.value+'T23:59:59').getTime():Infinity
  return chat.value.messages.filter(m=>m.author&&(!author.value||m.author===author.value)&&m.timestamp>=since&&m.timestamp<=until&&(!kind.value||m.kind===kind.value)&&(weekday.value===''||new Date(m.timestamp).getDay()===Number(weekday.value))&&new Date(m.timestamp).getHours()>=hourFrom.value&&new Date(m.timestamp).getHours()<=hourTo.value)
})
const filtered=computed(()=>scoped.value.filter(m=>!excludedAuthors.value.includes(m.author!)))
const previewMatches=computed(()=>content.value&&previewTerm.value.trim()?scoped.value.filter(m=>m.kind==='text'&&containsTerm(m.text,previewTerm.value)):scoped.value)
const previewIncluded=computed(()=>previewMatches.value.filter(m=>!excludedAuthors.value.includes(m.author!)).length)
const previewIgnored=computed(()=>previewMatches.value.length-previewIncluded.value)
const data=computed(()=>analyze(filtered.value,gapHours.value,content.value))
const isFiltered=computed(()=>!!(author.value||excludedAuthors.value.length||start.value||end.value||kind.value||weekday.value||hourFrom.value!==0||hourTo.value!==23))
const includedTerms=(m:ChatMessage)=>content.value&&m.kind==='text'?Array.from(new Set(termsForRanking(m.text))).slice(0,16):[]
function previewSnippet(m:ChatMessage):string{
  if(!content.value||!previewTerm.value)return m.text.slice(0,650)+(m.text.length>650?'…':'')
  const segments=highlightedParts(m.text,previewTerm.value)
  let position=0
  for(const segment of segments){if(segment.highlight){const from=Math.max(0,position-110),until=Math.min(m.text.length,position+segment.text.length+180);return (from?'…':'')+m.text.slice(from,until)+(until<m.text.length?'…':'')}position+=segment.text.length}
  return m.text.slice(0,650)+(m.text.length>650?'…':'')
}
async function inspectTerm(term:string){previewTerm.value=term;showMessages.value=true;await nextTick();previewAnchor.value?.scrollIntoView({behavior:'smooth',block:'start'})}
function pick(){fileInput.value?.click()}
function onFileInput(e:Event){const el=e.target as HTMLInputElement;void importFile(el.files?.[0]);el.value=''}
function resetFilters(){author.value='';start.value='';end.value='';kind.value='';weekday.value='';hourFrom.value=0;hourTo.value=23;excludedAuthors.value=[];previewTerm.value=''}
function setTheme(){dark.value=!dark.value;try{localStorage.setItem('papolab-theme',dark.value?'dark':'light')}catch{ /* Tema funciona mesmo sem armazenamento. */ }}
function clear(){worker?.terminate();worker=null;pending.value=null;chat.value=null;share.value=false;error.value='';resetFilters();active.value='overview';showMessages.value=false;previewTerm.value='' }
function example(){clear();chat.value=demoChat()}
async function importFile(file?:File){if(!file)return;error.value='';pending.value=null;isImporting.value=true;fileProgress.value=0
 try{
  const {text,filename}=await readWhatsAppFile(file,p=>fileProgress.value=Math.round(p*.35))
  const detected=detectDateOrder(text)
  if(detected.ambiguous){pending.value={text,filename};order.value=detected.order;isImporting.value=false;return}
  parseText(text,filename,detected.order)
 }catch(e){isImporting.value=false;error.value=e instanceof Error?e.message:'Falha ao importar arquivo.'}
}
function confirmOrder(){if(!pending.value)return;const {text,filename}=pending.value;pending.value=null;parseText(text,filename,order.value)}
function parseText(text:string,filename:string,format:DateOrder){
 isImporting.value=true;fileProgress.value=35
 worker?.terminate();worker=new Worker(new URL('./workers/parse.worker.ts',import.meta.url),{type:'module'})
 worker.onmessage=(e:MessageEvent<{type:string;percent?:number;result?:ParsedChat;message?:string}>)=>{
  if(e.data.type==='progress')fileProgress.value=35+Math.round((e.data.percent||0)*.65)
  if(e.data.type==='error'){isImporting.value=false;error.value=e.data.message||'Falha ao analisar o arquivo.';worker?.terminate();worker=null}
  if(e.data.type==='complete'){isImporting.value=false;worker?.terminate();worker=null
   if(!e.data.result?.messages.length){error.value='Não encontramos mensagens válidas. Confira se o arquivo é um histórico exportado pelo WhatsApp.';return}
   chat.value=e.data.result;active.value='overview';resetFilters();showMessages.value=false;fileProgress.value=100
  }
 }
 worker.onerror=()=>{isImporting.value=false;error.value='O navegador interrompeu o processamento. Tente exportar a conversa sem mídia.';worker?.terminate();worker=null}
 worker.postMessage({text,source:filename,order:format})
}
function drop(e:DragEvent){const file=e.dataTransfer?.files[0];if(file)void importFile(file)}
function selectedMode(id:ModuleId){active.value=id;navOpen.value=false;window.scrollTo({top:0,behavior:'smooth'})}
function exportSummary(){if(!chat.value)return;const a=data.value;const payload={version:'papolab-v0.2.0',note:'Somente estatísticas agregadas; verifique se deseja compartilhar.',messages:a.count,participants:a.participants.map((p,i)=>({id:`Participante ${i+1}`,messages:p.messages,words:p.words})),days:a.activeDays,spanDays:a.spanDays,sessions:a.sessions};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='papolab-relatorio-anonimo.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}
onBeforeUnmount(()=>worker?.terminate())
</script>
<template>
  <div class="app" :class="{'light':!dark}">
  <input ref="fileInput" type="file" accept=".txt,.zip,text/plain,application/zip" hidden @change="onFileInput"/>
  <template v-if="!chat">
    <header class="welcome-header"><div class="brand" @click="clear"><div class="brand-icon">•••</div><div>PAPO<span>LAB</span><small>CONVERSATION INTELLIGENCE</small></div></div><div class="top-actions"><span class="private-top"><ShieldCheck :size="16"/> 100% no seu navegador</span><button class="icon-btn" :title="dark?'Ativar tema claro':'Ativar tema escuro'" @click="setTheme"><Sun v-if="dark" :size="20"/><Moon v-else :size="20"/></button></div></header>
    <main class="welcome">
      <section class="hero"><div class="hero-canvas" aria-hidden="true"><div class="orbit orbit-1"></div><div class="orbit orbit-2"></div><div class="bubble bubble-1">😂<span>2.481 risadas</span></div><div class="bubble bubble-2">🏆<span>Mais falante</span></div><div class="bubble bubble-3">💗<span>Nossa história</span></div><div class="hero-emoji">💬</div></div>
        <div class="hero-copy"><span class="hero-badge"><span class="green-dot"></span> LABORATÓRIO DE CONVERSAS · V0.2</span><h1>Uma conversa.<br/><em>Mil histórias</em><br/>pra descobrir.</h1><p>Importe um histórico do WhatsApp e transforme mensagens em estatísticas, memes, recordes e retrospectivas incríveis — sem enviar sua conversa para lugar nenhum.</p><div class="hero-buttons"><button class="btn btn-primary btn-large" @click="pick"><Upload :size="19"/> Analisar minha conversa <ArrowUpRight :size="17"/></button><button class="btn btn-secondary btn-large" @click="example">Experimentar demo <ChevronRight :size="17"/></button></div><div class="hero-proof"><span><ShieldCheck :size="17"/> Privado de verdade</span><span><LockKeyhole :size="17"/> Sem cadastro</span><span>✦ Gratuito</span></div></div>
      </section>
      <section class="quick-guide"><div class="section-heading"><div><span class="eyebrow">SEM COMPLICAÇÃO</span><h2>O caminho é simples.</h2></div><button class="text-link" @click="howto=true">Como exportar uma conversa? ↗</button></div><div class="steps"><div><span class="step-number">01</span><span class="step-icon">📤</span><h3>Exporte</h3><p>No WhatsApp, escolha “Exportar conversa”, preferencialmente sem mídia.</p></div><div><span class="step-number">02</span><span class="step-icon">🧪</span><h3>Investigue</h3><p>Troque entre 10 modos com perguntas e análises diferentes.</p></div><div><span class="step-number">03</span><span class="step-icon">✨</span><h3>Compartilhe</h3><p>Crie um card que revela só o que você escolher mostrar.</p></div></div></section>
      <section class="modes-preview"><div class="section-heading"><div><span class="eyebrow">10 FORMAS DE ENXERGAR O MESMO PAPO</span><h2>Escolha seu laboratório.</h2></div></div><div class="preview-grid"><button v-for="m in modules" :key="m.id" class="preview-tile" @click="example();selectedMode(m.id)"><span class="tile-emoji">{{m.emoji}}</span><strong>{{m.name}}</strong><small>{{m.description}}</small><span class="tile-arrow">↗</span></button></div></section>
      <div class="drop-area" @dragover.prevent @drop.prevent="drop"><FileText :size="25"/><div><b>Prefere arrastar um arquivo aqui?</b><small>Aceitamos .txt e .zip exportados do WhatsApp. Limite: 100 MB.</small></div><button class="btn btn-secondary" @click="pick">Selecionar arquivo</button></div>
      <footer class="footer"><span>PAPOLAB • FEITO PARA CURIOSIDADE, NÃO VIGILÂNCIA.</span><span>Conversas não são enviadas para nenhum servidor.</span></footer>
    </main>
  </template>
  <template v-else>
    <div class="workspace"><aside class="sidebar" :class="{'nav-open':navOpen}"><div class="brand brand-sidebar" @click="clear"><div class="brand-icon">•••</div><div>PAPO<span>LAB</span><small>SEU LABORATÓRIO</small></div></div><div class="sidebar-label">EXPLORAR CONVERSA</div><nav aria-label="Modos de análise"><button v-for="m in modules" :key="m.id" class="nav-item" :class="{'selected':active===m.id}" :style="{'--item-color':m.accent}" @click="selectedMode(m.id)"><span>{{m.emoji}}</span><span>{{m.name}}</span><span class="nav-arrow">›</span></button></nav><div class="sidebar-bottom"><div class="privacy-mini"><ShieldCheck :size="19"/><div><b>Seu arquivo é privado.</b><small>Análise 100% local.</small></div></div><button class="sidebar-reset" @click="clear"><Trash2 :size="16"/> Apagar conversa e sair</button></div></aside>
    <main class="main-area"><header class="work-topbar"><button class="icon-btn mobile-menu" @click="navOpen=!navOpen" aria-label="Abrir ou fechar menu"><Menu :size="23"/></button><div class="breadcrumb"><span>Laboratório</span><span>›</span><b>{{selected.name}}</b></div><div class="top-actions"><button class="icon-btn" :title="dark?'Tema claro':'Tema escuro'" @click="setTheme"><Sun v-if="dark" :size="20"/><Moon v-else :size="20"/></button><button class="btn btn-secondary top-small" @click="exportSummary">↓ JSON</button><button class="btn btn-primary top-small" @click="share=true"><Share2 :size="17"/> Criar cartão</button></div></header>
    <div class="main-content"><div class="intro-row"><div><span class="mode-kicker" :style="{color:selected.accent}">{{selected.emoji}} {{selected.kicker}}</span><h1>{{selected.name}}<span class="title-period"> / PapoLab</span></h1><p>{{selected.description}} Dados da conversa importada, sem adivinhações.</p></div><div class="file-chip"><FileText :size="18"/><div><strong>{{chat.source}}</strong><small>{{fmt(chat.messages.length)}} registros reconhecidos</small></div><button class="icon-btn" title="Importar outra conversa" @click="pick"><RotateCcw :size="17"/></button></div></div>
      <div class="module-guide"><div class="module-guide-head"><span class="eyebrow">QUAL É A IDEIA DESTE MODO?</span><strong>{{selected.emoji}} {{selected.name}}</strong></div><div class="module-guide-grid"><div><b>Quando usar</b><p>{{selected.useWhen}}</p></div><div><b>O que você vai encontrar</b><p>{{selected.shows}}</p></div><div><b>O que não podemos concluir</b><p>{{selected.limits}}</p></div></div></div>
      <div class="filter-panel"><div class="filter-title"><span><SlidersHorizontal :size="18"/> Refinar análise</span><button v-if="isFiltered" class="text-btn" @click="resetFilters">Limpar filtros</button></div><div class="filter-grid"><label>Participante<select v-model="author"><option value="">Todas as pessoas</option><option v-for="p in chat.participants" :key="p" :value="p">{{p}}</option></select></label><label>De<input v-model="start" type="date"/></label><label>Até<input v-model="end" type="date"/></label><label>Tipo<select v-model="kind"><option value="">Todos</option><option value="text">Texto</option><option value="media">Mídia sinalizada</option><option value="deleted">Apagadas</option></select></label><label>Dia da semana<select v-model="weekday"><option value="">Qualquer dia</option><option v-for="(d,i) in ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']" :key="i" :value="String(i)">{{d}}</option></select></label></div><details class="excluded-filter" :open="excludedAuthors.length>0?true:undefined"><summary>🚫 Ignorar pessoas ou números das estatísticas <b v-if="excludedAuthors.length">({{excludedAuthors.length}} ignorados)</b></summary><p class="muted tiny">Marque contatos para simular o histórico sem eles. Não apaga mensagens do arquivo e afeta todos os módulos, gráficos e cartões. Você pode desmarcar a qualquer momento.</p><div class="exclude-grid"><label v-for="p in chat.participants" :key="p" class="exclude-person"><input v-model="excludedAuthors" type="checkbox" :value="p"/><span>{{p}}</span></label></div><button v-if="excludedAuthors.length" class="text-btn" @click="excludedAuthors=[]">Incluir todos novamente</button></details><details class="advanced"><summary>Opções avançadas e método</summary><div class="advance-inner"><label>Inatividade que separa sessões: <b>{{gapHours}} h</b><input v-model.number="gapHours" type="range" min="1" max="24"/></label><label>Hora mínima: <b>{{hourFrom}}h</b><input v-model.number="hourFrom" type="range" min="0" :max="hourTo"/></label><label>Hora máxima: <b>{{hourTo}}h</b><input v-model.number="hourTo" type="range" max="23" :min="hourFrom"/></label><label class="check"><input v-model="content" type="checkbox"/> Análise de conteúdo textual (emojis, expressões, palavras)</label></div></details></div>
      <details class="import-summary"><summary>✓ Importação concluída: {{fmt(chat.messages.length)}} registros reconhecidos · {{fmt(chat.participants.length)}} participantes <span>Ver detalhes</span></summary><div class="import-details"><span><b>{{chat.messages.filter(m=>m.author).length}}</b> mensagens humanas</span><span><b>{{chat.messages.filter(m=>!m.author).length}}</b> eventos do sistema</span><span><b>{{dateLabel(chat.messages[0]?.timestamp||0)}}</b> primeira data</span><span><b>{{dateLabel(chat.messages.at(-1)?.timestamp||0)}}</b> última data</span><span><b>{{chat.order}}</b> ordem da data</span><span><b>{{chat.skipped}}</b> linhas iniciais ignoradas</span></div><p>Prévia de textos desativada por padrão. Todas as estatísticas excluem mensagens do sistema; filtros podem reduzir a amostra analisada.</p></details>
      <div v-if="chat.warnings.length" class="notice"><Info :size="17"/><div><span v-for="(w,i) in chat.warnings" :key="i">{{w}} {{i<chat.warnings.length-1?' · ':''}}</span></div></div>
      <template v-if="data.count"><div v-if="excludedAuthors.length" class="notice">🚫 {{fmt(scoped.length-filtered.length)}} mensagens de {{excludedAuthors.length}} participante(s) estão fora de todos os cálculos.</div><div class="stats-grid"><div class="stat"><span>MENSAGENS</span><strong>{{compact(data.count)}}</strong><small>{{fmt(data.count)}} registros humanos</small><i>💬</i></div><div class="stat"><span>PALAVRAS</span><strong>{{compact(data.words)}}</strong><small>{{fmt(data.characters)}} caracteres</small><i>✍️</i></div><div class="stat"><span>DIAS ATIVOS</span><strong>{{fmt(data.activeDays)}}</strong><small>de {{fmt(data.spanDays)}} dias no intervalo</small><i>📅</i></div><div class="stat"><span>PARTICIPANTES</span><strong>{{fmt(data.participants.length)}}</strong><small>{{data.participants[0]?.name}} lidera em mensagens</small><i>👥</i></div></div>
        <div class="insight-banner"><div class="insight-icon">✦</div><div><span class="eyebrow">DESCOBERTA RÁPIDA</span><h3>{{data.insights[0]?.title}}</h3><p>{{data.insights[0]?.detail}}</p></div><span class="insight-stamp">BASEADO NO HISTÓRICO FILTRADO</span></div>
        <ModulePanel :mode="active" :data="data" :messages="filtered" :content="content" :gap="gapHours" @inspect-term="inspectTerm"/>

      </template><div v-else class="empty-filter"><span>🔎</span><h2>Nenhuma mensagem passou pelos filtros.</h2><p>Experimente outro participante, período ou tipo de mensagem.</p><button class="btn btn-primary" @click="resetFilters">Limpar filtros</button></div>
        <div ref="previewAnchor" class="panel message-preview"><div class="panel-heading"><div><span class="eyebrow">AUDITORIA DOS DADOS</span><h3>Quais mensagens e palavras entraram na análise?</h3></div><button class="btn btn-secondary" @click="showMessages=!showMessages">{{showMessages?'Ocultar trechos':'Revelar prévia'}}</button></div>
        <p class="muted tiny">Os filtros de data, autor, horário e tipo são respeitados. As mensagens dos contatos ignorados aparecem marcadas como "fora da análise" para facilitar a conferência.</p>
        <template v-if="showMessages"><div class="search-row preview-search"><input v-model="previewTerm" :disabled="!content" aria-label="Auditar termo" placeholder="Buscar palavra ou expressão; ex.: bom dia"/><button v-if="previewTerm" class="btn btn-secondary" @click="previewTerm=''">Limpar busca</button></div><p class="muted tiny">{{fmt(previewIncluded)}} mensagens correspondentes incluídas · {{fmt(previewIgnored)}} ignoradas. Exibindo até 30. Clique em um termo no módulo Linguagem para investigar sua origem.</p>
        <div class="snippets audit-snippets"><div v-for="m in previewMatches.slice(0,30)" :key="m.id" :class="{'audit-excluded':excludedAuthors.includes(m.author!)}"><div class="audit-head"><b>{{m.author}} · {{dateLabel(m.timestamp)}} · {{m.kind}}</b><span :class="excludedAuthors.includes(m.author!)?'audit-badge excluded':'audit-badge'">{{excludedAuthors.includes(m.author!)?'Fora da análise':'Contabilizada'}}</span></div><p><template v-for="(piece,i) in highlightedParts(previewSnippet(m),content?previewTerm:'')" :key="i"><mark v-if="piece.highlight">{{piece.text}}</mark><template v-else>{{piece.text}}</template></template></p><p v-if="!excludedAuthors.includes(m.author!)&&includedTerms(m).length" class="audit-terms"><strong>Termos contabilizados: </strong><button v-for="term in includedTerms(m)" :key="term" class="word-chip" @click="previewTerm=term">{{term}}</button></p><p v-else-if="excludedAuthors.includes(m.author!)" class="muted tiny">Nenhuma palavra desta mensagem entra nos resultados enquanto o contato estiver ignorado.</p></div><div v-if="!previewMatches.length" class="muted">Nenhuma mensagem encontrada para essa expressão dentro do filtro atual.</div></div></template><p class="muted tiny">Trechos são revelados só por sua escolha e nunca são incluídos automaticamente na imagem compartilhada. A contagem por termo considera ocorrências, não apenas mensagens únicas.</p></div>
      <div class="workspace-footer">🔒 Nada sai do navegador. <button @click="clear">Apagar tudo agora</button> · v0.2.0</div>
    </div></main></div>
  </template>
  <div v-if="isImporting" class="modal-backdrop"><div class="modal progress-modal" role="status"><div class="processing-icon">🧪</div><h2>Analisando seu papo...</h2><p>Lendo e reconhecendo as mensagens no seu próprio navegador.</p><div class="progress"><span :style="{width:fileProgress+'%'}"></span></div><b>{{fileProgress}}%</b><small class="muted">Arquivos grandes podem exigir mais memória no aparelho.</small></div></div>
  <div v-if="pending" class="modal-backdrop"><div class="modal confirm-modal" role="dialog" aria-modal="true" aria-label="Confirmar formato de datas"><span class="eyebrow">CONFIRMAÇÃO IMPORTANTE</span><h2>Qual é a ordem das datas?</h2><p>O arquivo usa datas ambíguas, como 04/05/2025. Para não interpretar os dias incorretamente, escolha o formato correspondente à sua exportação.</p><label class="field">Formato das datas<select v-model="order"><option value="DMY">Dia / Mês / Ano (Brasil)</option><option value="MDY">Mês / Dia / Ano (EUA)</option><option value="YMD">Ano / Mês / Dia</option></select></label><div class="modal-actions"><button class="btn btn-secondary" @click="pending=null">Cancelar</button><button class="btn btn-primary" @click="confirmOrder">Confirmar e analisar</button></div></div></div>
  <div v-if="error" class="modal-backdrop"><div class="modal confirm-modal" role="alertdialog" aria-modal="true"><span class="eyebrow error-label">NÃO FOI POSSÍVEL IMPORTAR</span><h2>Ops! Falhou a leitura.</h2><p>{{error}}</p><p class="muted">Tente usar “Exportar conversa” → “Sem mídia” no WhatsApp.</p><div class="modal-actions"><button class="btn btn-secondary" @click="error=''">Fechar</button><button class="btn btn-primary" @click="error='';pick()">Escolher outro arquivo</button></div></div></div>
  <div v-if="howto" class="modal-backdrop" @click.self="howto=false"><div class="modal confirm-modal howto" role="dialog" aria-modal="true"><div class="modal-head"><div><span class="eyebrow">TUTORIAL RAPIDINHO</span><h2>Como exportar?</h2></div><button class="icon-btn" @click="howto=false">✕</button></div><div class="howto-content"><h3>🤖 Android</h3><p>Abra a conversa → menu <b>⋮</b> → <b>Mais</b> → <b>Exportar conversa</b> → <b>Sem mídia</b> → salve o arquivo .txt ou .zip.</p><h3>🍎 iPhone</h3><p>Abra a conversa → toque no <b>nome do contato/grupo</b> → <b>Exportar conversa</b> → <b>Sem mídia</b> → salve em Arquivos e selecione aqui.</p><div class="notice"><ShieldCheck :size="17"/><span>Exporte somente conversas às quais você tem acesso legítimo e respeite a privacidade das outras pessoas.</span></div><p class="muted tiny">A posição dos menus depende da versão do WhatsApp. Exporte sem mídias para reduzir o arquivo.</p></div><button class="btn btn-primary wide" @click="howto=false;pick()">Escolher meu arquivo</button></div></div>
  <ShareEditor v-if="share&&chat" :data="data" :module="selected" @close="share=false"/>
  </div>
</template>
