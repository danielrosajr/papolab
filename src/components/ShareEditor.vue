<script setup lang="ts">
import {computed,nextTick,onMounted,ref,watch} from 'vue'
import type {Analytics,ModuleDefinition} from '../types'
import {drawShareCard} from '../services/export/card'
const props=defineProps<{data:Analytics;module:ModuleDefinition;initialTitle?:string}>()
const emit=defineEmits<{close:[]}>()
const target=ref<HTMLCanvasElement|null>(null)
const format=ref<'story'|'square'|'wide'>('story')
const theme=ref('neon')
const title=ref(props.initialTitle||'Nossa conversa em números')
const anonymous=ref(true),hideDates=ref(true),showWords=ref(false),showRank=ref(true),showRecords=ref(true)
const options=computed(()=>({format:format.value,theme:theme.value,title:title.value,anonymous:anonymous.value,hideDates:hideDates.value,showWords:showWords.value,showRank:showRank.value,showRecords:showRecords.value}))
function draw(){if(target.value)drawShareCard(target.value,props.data,props.module,options.value)}
watch(options,()=>nextTick(draw),{deep:true})
onMounted(draw)
function download(){if(!target.value)return;draw();target.value.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`papolab-${format.value}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)},'image/png')}
</script>
<template><div class="modal-backdrop" @click.self="emit('close')"><section class="modal share-modal" role="dialog" aria-modal="true" aria-label="Editor de compartilhamento"><div class="modal-head"><div><span class="eyebrow">ESTÚDIO DE COMPARTILHAMENTO</span><h2>Seu papo. Sua arte. ✨</h2></div><button class="icon-btn" @click="emit('close')" aria-label="Fechar">✕</button></div>
  <div class="share-grid"><div class="share-options"><label class="field">Título<input v-model="title" maxlength="70" placeholder="Nossa retrospectiva"/></label>
   <label class="field">Formato<select v-model="format"><option value="story">Story · 9:16</option><option value="square">Post · 1:1</option><option value="wide">Horizontal · 16:9</option></select></label>
   <label class="field">Tema<select v-model="theme"><option value="neon">Neon cítrico</option><option value="romance">Romântico</option><option value="detective">Detetive</option><option value="retro">Retrô</option><option value="minimal">Minimalista</option><option value="party">Festa</option><option value="elegant">Elegante</option><option value="dark">Dark</option></select></label>
   <label class="check"><input v-model="anonymous" type="checkbox"/> Anonimizar nomes (recomendado)</label>
   <label class="check"><input v-model="hideDates" type="checkbox"/> Ocultar datas completas</label>
   <label class="check"><input v-model="showRank" type="checkbox"/> Mostrar ranking</label>
   <label class="check"><input v-model="showRecords" type="checkbox"/> Mostrar recorde do dia</label>
   <label class="check"><input v-model="showWords" type="checkbox"/> Mostrar palavras frequentes</label>
   <p class="note">Nada é publicado automaticamente. Mensagens privadas nunca aparecem no cartão; nomes são ocultados por padrão.</p>
   <button class="btn btn-primary wide" @click="download">↓ Exportar PNG</button>
  </div><div class="share-preview"><canvas ref="target" aria-label="Prévia exata do PNG a exportar"></canvas><span class="tiny dim">Prévia do arquivo final • Processamento local</span></div></div>
</section></div></template>
