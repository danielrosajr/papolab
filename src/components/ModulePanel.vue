<script setup lang="ts">
import {computed,ref,watch} from 'vue'
import type {Analytics,ChatMessage,ModuleId,ParticipantStats} from '../types'
import {analyze,tokens} from '../services/analytics/engine'
import {dateLabel,fmt,hoursLabel,monthLabel,percent} from '../utils/format'
import TrendChart from './TrendChart.vue'
import ActivityHeatmap from './ActivityHeatmap.vue'
import ComparePeople from './ComparePeople.vue'
const props=defineProps<{mode:ModuleId;data:Analytics;messages:ChatMessage[];content:boolean;gap:number}>()
const search=ref(''),year=ref(''),ranking=ref('messages'),memoryText=ref(''),memoryDate=ref(''),memories=ref<{date:string;text:string}[]>([]),slide=ref(0),showExcerpts=ref(false)
const years=computed(()=>props.data.years.map(p=>p.key))
watch(years,ys=>{if(!ys.includes(year.value))year.value=ys.at(-1)||''},{immediate:true})
const yearData=computed(()=>analyze(props.messages.filter(m=>new Date(m.timestamp).getFullYear().toString()===year.value),props.gap,props.content))
const weekNames=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const modeEmoji:Record<ModuleId,string>={overview:'📊',detective:'🕵️',friends:'😂',couple:'💗',groups:'🏆',family:'🏡',language:'🧠',nostalgia:'📼',communication:'💬',wrapped:'✨'}
function metricValue(p:ParticipantStats,field:string):number{return Number(p[field as keyof ParticipantStats]||0)}
const sortedParticipants=computed(()=>[...props.data.participants].sort((a,b)=>metricValue(b,ranking.value)-metricValue(a,ranking.value)))
const tracked=computed(()=>{
 const needle=search.value.trim().toLocaleLowerCase('pt-BR')
 if(!needle || !props.content)return {total:0,monthly:[] as {key:string;value:number}[]}
 const map=new Map<string,number>();let total=0
 for(const m of props.messages)if(m.kind==='text'&&m.text.toLocaleLowerCase('pt-BR').includes(needle)){total++;const date=new Date(m.timestamp);const key=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;map.set(key,(map.get(key)||0)+1)}
 return {total,monthly:[...map].sort(([a],[b])=>a.localeCompare(b)).map(([key,value])=>({key,value}))}
})
const peakHour=computed(()=>props.data.hours.indexOf(Math.max(...props.data.hours)))
const mostActiveWeekday=computed(()=>props.data.weekdays.indexOf(Math.max(...props.data.weekdays)))
const gaps=computed(()=>{
 const sorted=props.messages.filter(m=>m.author).slice().sort((a,b)=>a.timestamp-b.timestamp)
 const arr:{start:number;end:number;hours:number}[]=[]
 for(let i=1;i<sorted.length;i++){const hours=(sorted[i].timestamp-sorted[i-1].timestamp)/3600000;if(hours>props.gap)arr.push({start:sorted[i-1].timestamp,end:sorted[i].timestamp,hours})}
 return arr.sort((a,b)=>b.hours-a.hours).slice(0,5)
})
const loveFirst=computed(()=>props.content?props.messages.find(m=>m.kind==='text'&&/\bte amo\b/i.test(m.text)):undefined)
const periodChange=computed(()=>{
 const a=props.data.months
 return a.slice(1).map((x,i)=>({key:x.key,current:x.value,previous:a[i].value,delta:a[i].value?Math.round((x.value-a[i].value)/a[i].value*100):0})).sort((x,y)=>Math.abs(y.delta)-Math.abs(x.delta)).slice(0,5)
})
const wrapped=computed(()=>{
 const a=props.data
 return [
  {top:'ABRAM ALAS',main:'Cada papo tem uma história.',bottom:`${fmt(a.count)} mensagens disponíveis para descobrir.`,emoji:'✨'},
  {top:'UM NÚMERO GIGANTE',main:fmt(a.count),bottom:'Mensagens humanas no arquivo importado.',emoji:'💬'},
  {top:'ELENCO PRINCIPAL',main:a.participants[0]?.name||'—',bottom:`${a.participants[0]?percent(a.participants[0].messages,a.count):'0%'} das mensagens`,emoji:'🎤'},
  {top:'DATA LENDÁRIA',main:a.biggestDay?.key||'—',bottom:`${fmt(a.biggestDay?.value||0)} mensagens no recorde diário`,emoji:'📅'},
  {top:'DIA APÓS DIA',main:`${fmt(a.activeDays)} dias`,bottom:'Com pelo menos uma mensagem no arquivo.',emoji:'🌟'},
  {top:'O EMOJI',main:a.topEmojis[0]?.key||'—',bottom:a.topEmojis.length?`${fmt(a.topEmojis[0].value)} ocorrências`:'Análise textual desativada ou sem emojis.',emoji:'👑'},
  {top:'HORA DO PAPO',main:`${String(peakHour.value).padStart(2,'0')}h`,bottom:'Faixa horária com mais mensagens registradas.',emoji:'🕒'},
  {top:'CAMPEÃO DO GRUPO',main:a.trophies[0]?.winner||'—',bottom:a.trophies[0]?.label||'Sem troféu elegível nesta amostra.',emoji:'🏆'},
  {top:'MAIOR SEQUÊNCIA',main:`${a.streak} dias`,bottom:'Dias seguidos com atividade no histórico.',emoji:'🔥'},
  {top:'FIM? NÃO.',main:'O papo continua.',bottom:'E as melhores histórias nem sempre cabem em números.',emoji:'💚'}]
})
function addMemory(){if(!memoryText.value.trim())return;memories.value.push({date:memoryDate.value||'Sem data',text:memoryText.value.slice(0,240).trim()});memoryText.value=''}
function countsByYear(year:string){return props.data.years.find(p=>p.key===year)?.value||0}
const yearsSorted=computed(()=>[...years.value].sort())
const daysOfWeek=computed(()=>props.data.weekdays.map((count,index)=>({name:weekNames[index],count})))
const longestText=computed(()=>props.messages.filter(m=>m.kind==='text').reduce((winner,m)=>tokens(m.text).length>tokens(winner?.text||'').length?m:winner,null as ChatMessage|null))
</script>
<template>
  <template v-if="mode==='overview'">
    <div class="layout-two"><div class="panel"><div class="panel-heading"><div><span class="eyebrow">EVOLUÇÃO NO TEMPO</span><h3>O ritmo da conversa</h3></div><span class="dim tiny">Por mês</span></div><TrendChart :items="data.months" monthly color="#b8ef79"/></div>
    <div class="panel"><div class="panel-heading"><div><span class="eyebrow">HALL DA PARTICIPAÇÃO</span><h3>Quem falou mais?</h3></div></div><div v-for="(p,i) in data.participants.slice(0,7)" :key="p.name" class="rank"><span class="rank-pos">{{String(i+1).padStart(2,'0')}}</span><div class="rank-main"><div class="rank-label"><b>{{p.name}}</b><span>{{percent(p.messages,data.count)}}</span></div><div class="progress"><span :style="{width:(100*p.messages/Math.max(1,data.count))+'%'}"></span></div></div></div></div></div>
    <div class="layout-two"><div class="panel"><div class="eyebrow">QUANDO TUDO ACONTECE</div><h3>Horários favoritos</h3><TrendChart :items="data.hours.map((v,i)=>({key:`${i}h`,value:v}))" type="bar" color="#9db2ff" :limit="24"/><p class="muted tiny">Horário registrado na exportação; pode variar conforme fuso e aparelho.</p></div>
    <div class="panel"><div class="eyebrow">DIAS DE ATIVIDADE</div><h3>Um pequeno mapa de calor</h3><ActivityHeatmap :items="data.daily"/><div class="numbers-row"><span><b>{{fmt(data.activeDays)}}</b><small>dias ativos</small></span><span><b>{{fmt(data.emptyDays)}}</b><small>dias sem registro</small></span><span><b>{{data.streak}}</b><small>maior sequência</small></span></div></div></div>
    <div class="panel"><div class="eyebrow">EM NÚMEROS • BASE DO LABORATÓRIO</div><h3>Mais detalhes do histórico</h3><div class="numbers-row extra-numbers"><span><b>{{data.meanActive.toFixed(1).replace('.',',')}}</b><small>média de mensagens por dia ativo</small></span><span><b>{{data.medianActive.toFixed(1).replace('.',',')}}</b><small>mediana por dia ativo</small></span><span><b>{{fmt(data.media)}}</b><small>marcadores de mídia</small></span><span><b>{{fmt(data.deleted)}}</b><small>mensagens apagadas sinalizadas</small></span><span><b>{{data.streak}}</b><small>maior sequência de dias ativos</small></span><span><b>{{weekNames[mostActiveWeekday]}}</b><small>dia da semana mais movimentado</small></span></div></div>
    <ComparePeople v-if="data.participants.length>1" :data="data"/>
  </template>

  <template v-else-if="mode==='detective'">
    <div class="panel investigator"><div class="eyebrow">ARQUIVO DE EVIDÊNCIAS • SEM ADIVINHAÇÕES</div><h3>O que os dados realmente mostram?</h3><p class="muted">Mudanças de frequência não provam sentimentos, mentiras ou acontecimentos. Cada pista abaixo é só um padrão mensurável.</p>
      <div class="clue-grid"><div class="clue" v-for="fact in data.insights.slice(0,6)" :key="fact.id"><span>⟡ EVIDÊNCIA</span><h4>{{fact.title}}</h4><p>{{fact.detail}}</p><details><summary>Como calculamos?</summary><small>{{fact.method}} Período: {{fact.period}}.</small></details></div></div>
    </div>
    <div class="layout-two"><div class="panel"><div class="eyebrow">SESSÕES DE CONVERSA</div><h3>Quem dá o primeiro oi?</h3><div v-for="item in data.sessionStarts.slice(0,6)" :key="item.key" class="list-stat"><span>{{item.key}}</span><b>{{fmt(item.value)}} sessões</b></div><p class="muted tiny">Uma nova sessão começa depois de mais de {{gap}} horas sem mensagens no arquivo.</p></div>
    <div class="panel"><div class="eyebrow">HIATOS OBSERVADOS</div><h3>Os maiores intervalos</h3><div v-for="g in gaps" :key="g.start" class="gap-row"><b>{{Math.round(g.hours)}} horas</b><span>{{dateLabel(g.start)}} → {{dateLabel(g.end)}}</span></div><p v-if="!gaps.length" class="dim">Não há pausas maiores que o limite atual.</p><p class="muted tiny">Não significa ausência de contato por outras plataformas ou pessoalmente.</p></div></div>
    <div class="panel"><div class="eyebrow">MUDANÇAS MENSAIS</div><h3>Os maiores saltos</h3><div class="change-grid"><div v-for="p in periodChange" :key="p.key"><b :class="p.delta>=0?'good':'warm'">{{p.delta>0?'+':''}}{{p.delta}}%</b><span>{{monthLabel(p.key)}}</span><small>{{p.previous}} → {{p.current}} mensagens</small></div></div><p class="muted tiny">Comparação bruta de meses consecutivos. Meses parciais podem distorcer a variação; não é inferência causal.</p></div>
  </template>

  <template v-else-if="mode==='friends'">
    <div class="panel"><div class="eyebrow">🏆 ACADEMIA DE TROFÉUS</div><h3>As premiações da conversa</h3><p class="muted">Critérios objetivos, zoeira opcional. Prêmios só aparecem quando há dados suficientes.</p><div class="trophy-grid"><div class="trophy" v-for="t in data.trophies" :key="t.id"><div class="trophy-icon">{{t.icon}}</div><h4>{{t.label}}</h4><strong>{{t.winner}}</strong><span>{{fmt(t.count)}} · {{t.criterion}}</span></div></div><p v-if="!data.trophies.length" class="muted">Ainda não há amostra suficiente para distribuir troféus.</p></div>
    <ComparePeople v-if="data.participants.length>1" :data="data"/>
    <div class="panel fun-panel"><div class="eyebrow">ROAST AMIGÁVEL • SEM HUMILHAÇÃO</div><h3>Laudo 100% brincadeira 😎</h3><p v-if="data.participants[0]">{{data.participants[0].name}} assumiu {{percent(data.participants[0].messages,data.count)}} das mensagens. Alguém precisava manter o papo vivo, né? 🎤</p><p v-if="data.trophies.find(t=>t.id==='night')">A coruja oficial é {{data.trophies.find(t=>t.id==='night')?.winner}}. Parece que o travesseiro não participa do grupo. 🦉</p></div>
  </template>

  <template v-else-if="mode==='couple'">
    <div class="layout-two"><div class="panel love-panel"><div class="eyebrow">💗 PALAVRAS DE CARINHO</div><div class="big-number">{{fmt(data.loveExpressions)}}</div><h3>Mensagens com expressões afetuosas explícitas</h3><p class="muted tiny">Busca por termos predefinidos como “te amo”, “saudade” e “te adoro”. Zero não significa falta de afeto.</p></div>
    <div class="panel"><div class="eyebrow">NOSSA HISTÓRIA REGISTRADA</div><h3>Marcos reais, sem invenção</h3><div class="milestone"><b>📍 {{dateLabel(data.dates.first)}}</b><span>Primeira mensagem disponível neste arquivo</span></div><div v-if="loveFirst" class="milestone"><b>💌 {{dateLabel(loveFirst.timestamp)}}</b><span>Primeira ocorrência de “te amo” encontrada</span></div><div v-if="data.busiestMonth" class="milestone"><b>✨ {{monthLabel(data.busiestMonth.key)}}</b><span>Mês com maior volume de mensagens</span></div></div></div>
    <div class="panel"><div class="eyebrow">RITMO DAS MEMÓRIAS</div><h3>Um histórico em movimento</h3><TrendChart :items="data.months" monthly color="#ff93a7"/><p class="muted tiny">Mensagens não medem amor, confiança, fidelidade ou qualidade de relacionamento.</p></div>
    <div class="panel"><div class="eyebrow">CÁPSULA DO TEMPO • SÓ NESTA SESSÃO</div><h3>Guarde um acontecimento seu</h3><div class="memory-form"><input v-model="memoryDate" type="date" aria-label="Data da memória"/><input v-model="memoryText" maxlength="240" placeholder="Ex.: nossa primeira viagem..." aria-label="Descrição da memória"/><button class="btn btn-secondary" @click="addMemory">+ Adicionar</button></div><div v-for="(m,i) in memories" :key="i" class="milestone"><b>{{m.date}}</b><span>{{m.text}}</span><button class="text-btn" @click="memories.splice(i,1)">Remover</button></div><p class="muted tiny">Não salvamos memórias automaticamente. Ao fechar a aba, elas desaparecem.</p></div>
  </template>

  <template v-else-if="mode==='groups'">
    <div class="panel"><div class="panel-heading"><div><div class="eyebrow">CAMPEONATO DO PAPO</div><h3>Ranking dinâmico</h3></div><select v-model="ranking"><option value="messages">Mensagens</option><option value="words">Palavras</option><option value="night">Madrugada</option><option value="emoji">Emojis</option><option value="starts">Sessões iniciadas</option><option value="vocabulary">Palavras distintas</option></select></div><div v-for="(p,i) in sortedParticipants" :key="p.name" class="leaderboard"><span class="lb-pos">{{i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}}</span><b>{{p.name}}</b><span>{{fmt(metricValue(p,ranking))}}</span></div></div>
    <div class="layout-two"><div class="panel"><div class="eyebrow">A LIGA AO LONGO DOS ANOS</div><h3>Temporadas históricas</h3><TrendChart :items="data.years" type="bar" color="#f1bc5d" :limit="30"/></div><div class="panel"><div class="eyebrow">HALL DA FAMA</div><h3>Os destaques oficiais</h3><div v-for="t in data.trophies.slice(0,6)" :key="t.id" class="list-stat"><span>{{t.icon}} {{t.label}}</span><b>{{t.winner}}</b></div></div></div>
  </template>

  <template v-else-if="mode==='family'">
    <div class="layout-two"><div class="panel"><div class="eyebrow">🏡 NOSSO ÁLBUM</div><h3>Os dias mais animados</h3><div v-for="(d,i) in [...data.daily].sort((a,b)=>b.value-a.value).slice(0,5)" :key="d.key" class="milestone"><b>{{i+1}}. {{d.key}}</b><span>{{fmt(d.value)}} mensagens registradas</span></div></div><div class="panel"><div class="eyebrow">TRADIÇÃO É ESTAR PRESENTE</div><h3>Quais dias da semana têm mais papo?</h3><div v-for="d in daysOfWeek" :key="d.name" class="list-stat"><span>{{d.name}}</span><b>{{fmt(d.count)}}</b></div></div></div>
    <div class="panel"><div class="eyebrow">CALENDÁRIO DE LEMBRANÇAS</div><h3>Registre memórias da família</h3><div class="memory-form"><input v-model="memoryDate" type="date" aria-label="Data do evento"/><input v-model="memoryText" maxlength="240" placeholder="Ex.: reunião de família..." aria-label="Sua memória"/><button class="btn btn-secondary" @click="addMemory">+ Adicionar</button></div><div class="milestone" v-for="(m,i) in memories" :key="i"><b>{{m.date}}</b><span>{{m.text}}</span><button class="text-btn" @click="memories.splice(i,1)">Remover</button></div><p class="muted tiny">Não deduzimos parentesco, gerações ou acontecimentos pelo nome das pessoas. Memórias manuais não são enviadas nem salvas.</p></div>
  </template>

  <template v-else-if="mode==='language'">
    <div class="panel"><div class="eyebrow">🧠 RASTREADOR DE EXPRESSÕES</div><h3>Onde aquela palavra apareceu?</h3><p class="muted">Encontre mensagens que contenham um termo ou expressão. A busca considera texto literal, não sinônimos.</p><div class="search-row"><input v-model="search" :disabled="!content" placeholder="Ex.: saudade, kkkkk, bora..." aria-label="Palavra ou expressão para buscar"/><span class="pill">{{fmt(tracked.total)}} mensagens</span></div><TrendChart v-if="tracked.monthly.length" :items="tracked.monthly" type="bar" monthly color="#9eb9ff"/><p v-if="!content" class="muted">Ative “Análise de texto” nas opções do painel para usar este recurso.</p></div>
    <div class="layout-two"><div class="panel"><div class="eyebrow">DICIONÁRIO DA CONVERSA</div><h3>Palavras favoritas</h3><div class="word-cloud"><span v-for="(word,i) in data.topWords.slice(0,20)" :key="word.key" :style="{fontSize:(1.05+Math.max(0,7-i)*.13)+'rem'}" :title="`${word.value} ocorrências`">{{word.key}} <small>{{word.value}}</small></span></div><p class="muted tiny">Termos frequentes (com palavras comuns removidas) em textos exportados.</p></div><div class="panel"><div class="eyebrow">A LINGUAGEM DOS EMOJIS</div><h3>Top pictogramas</h3><div class="emoji-cloud"><span v-for="p in data.topEmojis.slice(0,9)" :key="p.key"><b>{{p.key}}</b><small>{{fmt(p.value)}}</small></span></div><p class="muted tiny">A contagem é aproximada para emojis compostos por vários caracteres.</p></div></div>
    <div class="panel"><div class="eyebrow">OUTRAS CURIOSIDADES</div><div class="numbers-row"><span><b>{{fmt(data.questions)}}</b><small>sinais de pergunta</small></span><span><b>{{fmt(data.words)}}</b><small>palavras totais</small></span><span><b>{{fmt(longestText?tokens(longestText.text).length:0)}}</b><small>palavras no maior textão</small></span></div><p class="muted tiny">Pontuação explícita ≠ todas as perguntas reais. Comprimento de mensagem não indica inteligência ou personalidade.</p></div>
  </template>

  <template v-else-if="mode==='nostalgia'">
    <div class="panel"><div class="panel-heading"><div><div class="eyebrow">📼 MÁQUINA DO TEMPO</div><h3>Escolha um ano do histórico</h3></div><select v-model="year" aria-label="Ano para revisitar"><option v-for="y in yearsSorted" :key="y" :value="y">{{y}}</option></select></div><div class="time-trip"><div><span class="eyebrow">TEMPORADA {{year}}</span><strong>{{fmt(countsByYear(year))}}</strong><span>mensagens nesse ano</span></div><div><span class="eyebrow">DIAS ATIVOS</span><strong>{{fmt(yearData.activeDays)}}</strong><span>dias com mensagens</span></div><div><span class="eyebrow">ESTRELA DA TEMPORADA</span><strong class="smaller">{{yearData.participants[0]?.name||'—'}}</strong><span>mais mensagens no ano</span></div></div><TrendChart :items="yearData.months" type="bar" monthly color="#cab0ff"/></div>
    <div class="layout-two"><div class="panel"><div class="eyebrow">PRIMEIRAS E ÚLTIMAS PÁGINAS</div><h3>Os limites do arquivo</h3><div class="milestone"><b>⏳ {{dateLabel(data.dates.first)}}</b><span>Primeira mensagem disponível</span></div><div class="milestone"><b>⏰ {{dateLabel(data.dates.last)}}</b><span>Última mensagem disponível</span></div></div><div class="panel"><div class="eyebrow">RECORDES ANTIGOS</div><h3>Top meses de todos os tempos</h3><div v-for="m in [...data.months].sort((a,b)=>b.value-a.value).slice(0,5)" :key="m.key" class="list-stat"><span>{{monthLabel(m.key)}}</span><b>{{fmt(m.value)}}</b></div></div></div>
    <div class="panel"><div class="eyebrow">LEMBRANÇAS COM CONTROLE</div><h3>Prévia de mensagens reais</h3><button class="btn btn-secondary" @click="showExcerpts=!showExcerpts">{{showExcerpts?'Ocultar trechos':'Revelar 5 trechos de '+year}}</button><div v-if="showExcerpts" class="snippets"><div v-for="m in messages.filter(m=>m.kind==='text'&&new Date(m.timestamp).getFullYear().toString()===year).slice(0,5)" :key="m.id"><b>{{m.author}} · {{dateLabel(m.timestamp)}}</b><p>{{m.text.slice(0,280)}}</p></div></div><p class="muted tiny">Trechos ficam ocultos por padrão e nunca são adicionados ao PNG compartilhado.</p></div>
  </template>

  <template v-else-if="mode==='communication'">
    <div class="layout-two"><div class="panel"><div class="eyebrow">💬 TROCA DE TURNOS</div><div class="big-number">{{hoursLabel(data.responseMedian)}}</div><h3>Mediana entre turnos de pessoas diferentes</h3><p class="muted tiny">Medida por mudança de autor dentro das sessões de até {{gap}} h. Não indica obrigação de resposta, disponibilidade ou respeito.</p></div><div class="panel"><div class="eyebrow">SESSÕES IDENTIFICADAS</div><div class="big-number">{{fmt(data.sessions)}}</div><h3>Inícios de período de conversa</h3><p class="muted tiny">Uma pausa superior a {{gap}} horas inicia outra sessão. Mudar esse limite altera a estatística.</p></div></div>
    <div class="panel"><div class="eyebrow">PERFIL DE RITMO</div><h3>Respostas por participante</h3><div v-for="p in data.participants" :key="p.name" class="leaderboard"><span>💬</span><b>{{p.name}}</b><span>{{hoursLabel(p.medResponse)}} <small>· {{p.replies}} respostas</small></span></div></div>
    <ComparePeople v-if="data.participants.length>1" :data="data"/>
    <div class="panel"><div class="eyebrow">MOVIMENTO NA SEMANA</div><h3>Frequência por dia</h3><div class="weekday-bars"><div v-for="d in daysOfWeek" :key="d.name"><span>{{d.name}}</span><div class="progress"><span :style="{width:(100*d.count/Math.max(1,...data.weekdays))+'%'}"></span></div><b>{{fmt(d.count)}}</b></div></div></div>
  </template>

  <template v-else-if="mode==='wrapped'">
    <div class="panel wrap-stage"><div class="eyebrow">PAPOLAB WRAPPED · SLIDE {{slide+1}} DE {{wrapped.length}}</div><div class="wrap-visual" :key="slide"><div class="wrap-emoji">{{wrapped[slide].emoji}}</div><span>{{wrapped[slide].top}}</span><h2>{{wrapped[slide].main}}</h2><p>{{wrapped[slide].bottom}}</p><span class="wrap-watermark">PAPOLAB • DADOS REAIS, HISTÓRIAS SUAS</span></div><div class="wrap-controls"><button class="btn btn-secondary" :disabled="slide===0" @click="slide=Math.max(0,slide-1)">← Anterior</button><div class="slide-dots"><button v-for="(_,i) in wrapped" :key="i" :class="{'active':slide===i}" :aria-label="`Ir ao slide ${i+1}`" @click="slide=i"></button></div><button class="btn btn-primary" @click="slide=(slide+1)%wrapped.length">{{slide===wrapped.length-1?'Recomeçar ↺':'Próximo →'}}</button></div><p class="muted tiny">Use “Criar cartão” no topo para personalizar e baixar um PNG em 9:16, 1:1 ou 16:9.</p></div>
  </template>
  <div class="method-note"><span>{{modeEmoji[mode]}} Método transparente</span> Estes resultados analisam somente as mensagens presentes no arquivo importado. Não medem sentimentos, intenções ou contatos fora do WhatsApp.</div>
</template>
