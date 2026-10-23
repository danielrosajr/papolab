<script setup lang="ts">
import {computed,ref,watch} from 'vue'
import type {Analytics,ParticipantStats} from '../types'
import {fmt,hoursLabel} from '../utils/format'
const props=defineProps<{data:Analytics}>()
const first=ref(''),second=ref('')
watch(()=>props.data.participants, list=>{if(!list.some(p=>p.name===first.value))first.value=list[0]?.name||'';if(!list.some(p=>p.name===second.value))second.value=list[1]?.name||list[0]?.name||''},{immediate:true})
const a=computed(()=>props.data.participants.find(p=>p.name===first.value))
const b=computed(()=>props.data.participants.find(p=>p.name===second.value))
const metrics:{key:keyof ParticipantStats;label:string;unit?:string}[]=[{key:'messages',label:'Mensagens'},{key:'words',label:'Palavras'},{key:'emoji',label:'Emojis'},{key:'starts',label:'Iniciou sessões'},{key:'night',label:'Madrugada'},{key:'questions',label:'Perguntas explícitas'}]
</script>
<template><div class="panel"><div class="panel-heading"><div><div class="eyebrow">DUELO DE DADOS</div><h3>Participante x participante</h3></div><span class="dim tiny">Sem vencedor moral — só números.</span></div>
  <div class="compare-choices"><select v-model="first" aria-label="Primeira pessoa"><option v-for="p in data.participants" :key="p.name" :value="p.name">{{p.name}}</option></select><span>vs</span><select v-model="second" aria-label="Segunda pessoa"><option v-for="p in data.participants" :key="p.name" :value="p.name">{{p.name}}</option></select></div>
  <div v-if="a&&b" class="compare-list"><div v-for="m in metrics" :key="m.key" class="compare-row"><div class="compare-nums"><b>{{fmt(Number(a[m.key]||0))}}</b><span>{{m.label}}</span><b>{{fmt(Number(b[m.key]||0))}}</b></div><div class="compare-bars"><span :style="{width:(Number(a[m.key]||0)/Math.max(1,Number(a[m.key]||0)+Number(b[m.key]||0))*100)+'%'}"></span><span :style="{width:(Number(b[m.key]||0)/Math.max(1,Number(a[m.key]||0)+Number(b[m.key]||0))*100)+'%'}"></span></div></div></div>
  <p v-if="a&&b" class="muted tiny">Mediana de resposta: {{a.name}} {{hoursLabel(a.medResponse)}} · {{b.name}} {{hoursLabel(b.medResponse)}}. Considera mudanças de autor dentro de sessões.</p>
</div></template>
