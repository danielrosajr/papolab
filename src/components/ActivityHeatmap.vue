<script setup lang="ts">
import {computed} from 'vue'
import type {CountItem} from '../types'
const props=defineProps<{items:CountItem[]}>()
const cells=computed(()=>{
  const lookup=new Map(props.items.map(d=>[d.key,d.value]))
  const last=props.items.at(-1)?.key
  if(!last)return []
  const d=new Date(last+'T12:00:00')
  const arr:{date:string;value:number;level:number}[]=[]
  const highest=Math.max(1,...props.items.map(v=>v.value))
  for(let i=97;i>=0;i--) {const cur=new Date(d);cur.setDate(d.getDate()-i);const date=`${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}-${String(cur.getDate()).padStart(2,'0')}`;const value=lookup.get(date)||0;arr.push({date,value,level:value===0?0:Math.max(1,Math.ceil(4*value/highest))})}
  return arr
})
</script>
<template><div class="heatmap"><div v-for="d in cells" :key="d.date" class="heat-cell" :class="'heat-'+d.level" :title="`${d.date}: ${d.value} mensagens`" :aria-label="`${d.date}: ${d.value} mensagens`"></div></div><div class="heat-caption">Últimos 98 dias do histórico disponível <span>menos ░ ▒ ▓ █ mais</span></div></template>
