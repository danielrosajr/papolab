<script setup lang="ts">
import {computed} from 'vue'
import {Line,Bar} from 'vue-chartjs'
import {Chart as ChartJS,CategoryScale,LinearScale,PointElement,LineElement,BarElement,Tooltip,Filler,Legend} from 'chart.js'
import type {CountItem} from '../types'
import {monthLabel} from '../utils/format'
ChartJS.register(CategoryScale,LinearScale,PointElement,LineElement,BarElement,Tooltip,Filler,Legend)
const props=withDefaults(defineProps<{items:CountItem[];type?:'line'|'bar';color?:string;monthly?:boolean;limit?:number}>(),{type:'line',color:'#b8eb7a',limit:80})
const dataset=computed(()=>{
  const input=props.items
  // Evenly aggregate dense daily series instead of placing thousands of points on the axis.
  const batch=Math.max(1,Math.ceil(input.length/props.limit))
  const pts:CountItem[]=[]
  for(let i=0;i<input.length;i+=batch)pts.push({key:input[i].key,value:input.slice(i,i+batch).reduce((s,p)=>s+p.value,0)})
  return {labels:pts.map(p=>props.monthly?monthLabel(p.key):p.key),datasets:[{label:'Mensagens',data:pts.map(p=>p.value),borderColor:props.color,backgroundColor:props.color+'55',fill:true,tension:.32,pointRadius:pts.length>25?0:3,borderWidth:2,barBorderRadius:5}]}
})
const options={responsive:true,maintainAspectRatio:false,interaction:{mode:'index' as const,intersect:false},plugins:{legend:{display:false},tooltip:{backgroundColor:'#22243b',titleColor:'#fff',bodyColor:'#e9ebf8'}},scales:{x:{ticks:{color:'#a5aac5',maxTicksLimit:7,maxRotation:0},grid:{display:false}},y:{beginAtZero:true,ticks:{color:'#a5aac5',precision:0},grid:{color:'rgba(145,155,195,.10)'}}}}
</script>
<template><div class="chart-wrap"><Bar v-if="type==='bar'" :data="dataset" :options="options"/><Line v-else :data="dataset" :options="options"/></div></template>
