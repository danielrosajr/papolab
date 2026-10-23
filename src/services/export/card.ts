import type {Analytics,ModuleDefinition} from '../../types'
import {compact,fmt,percent} from '../../utils/format'
export interface CardOptions {format:'story'|'square'|'wide';theme:string;title:string;anonymous:boolean;hideDates:boolean;showWords:boolean;showRank:boolean;showRecords:boolean}
const palettes:Record<string,[string,string,string]>={neon:['#101328','#b8ef79','#e1e5fa'],romance:['#381828','#ff9ebc','#fff1f6'],detective:['#101f1b','#d2cf78','#e2f0dd'],retro:['#402b57','#f6bb70','#fff5db'],minimal:['#e9edf5','#24344d','#24344d'],party:['#27164a','#f797cf','#f5ecff'],elegant:['#19263a','#d9c9a8','#eff3f8'],dark:['#0e111b','#9fd2f1','#e5ecfb']}
function rounded(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,fill:string){c.fillStyle=fill;c.beginPath();c.roundRect(x,y,w,h,r);c.fill()}
function text(c:CanvasRenderingContext2D,s:string,x:number,y:number,size:number,color:string,weight=600){c.fillStyle=color;c.font=`${weight} ${size}px system-ui, sans-serif`;c.fillText(s,x,y)}
function truncate(c:CanvasRenderingContext2D,s:string,max:number){let out=s;while(c.measureText(out).width>max&&out.length>1)out=out.slice(0,-2)+'…';return out}
export function drawShareCard(canvas:HTMLCanvasElement,a:Analytics,module:ModuleDefinition,o:CardOptions){
 const [w,h]=o.format==='story'?[720,1280]:o.format==='wide'?[1280,720]:[900,900]
 canvas.width=w;canvas.height=h
 const c=canvas.getContext('2d');if(!c)return
 const [bg,accent,ink]=palettes[o.theme]||palettes.neon
 const k=w/720,left=58*k,right=w-left
 c.fillStyle=bg;c.fillRect(0,0,w,h)
 const grad=c.createRadialGradient(w*.85,h*.12,0,w*.85,h*.12,w*.82)
 grad.addColorStop(0,accent+'35');grad.addColorStop(1,accent+'00');c.fillStyle=grad;c.fillRect(0,0,w,h)
 const ty=(p:number)=>p*(h/1280),font=(p:number)=>Math.round(p*k)
 rounded(c,left,ty(58),font(125),ty(41),ty(22),accent)
 text(c,'PAPOLAB',left+font(16),ty(86),font(18),bg,800)
 text(c,module.kicker.toUpperCase(),left,ty(160),font(18),accent,750)
 const headline=truncate(c,o.title||'Nossa conversa em números',w-left*2)
 text(c,headline,left,ty(232),font(38),ink,800)
 text(c,'Cada conversa conta uma história.',left,ty(281),font(19),ink,400)
 rounded(c,left,ty(322),w-left*2,ty(250),font(25),accent+'20')
 text(c,compact(a.count),left+font(29),ty(455),font(86),accent,800)
 text(c,'MENSAGENS ANALISADAS',left+font(29),ty(507),font(17),ink,750)
 const wide=o.format==='wide'
 const y2=wide?ty(620):ty(660)
 text(c,`${fmt(a.participants.length)} participantes`,left,y2,font(25),ink,700)
 text(c,`${fmt(a.activeDays)} dias ativos`,left,y2+ty(57),font(25),ink,700)
 let nextY=y2+ty(116)
 if(o.showRecords&&a.biggestDay){text(c,'🏆 Recorde de mensagens em um dia',left,nextY,font(20),accent,700);text(c,`${fmt(a.biggestDay.value)} mensagens${o.hideDates?'':` · ${a.biggestDay.key}`}`,left,nextY+ty(44),font(21),ink,500);nextY+=ty(118)}
 if(o.showRank&&a.participants.length){
  text(c,'TOP PARTICIPAÇÃO',left,nextY,font(17),accent,800);nextY+=ty(48)
  a.participants.slice(0,3).forEach((p,i)=>{
   const name=o.anonymous?`Participante ${i+1}`:p.name
   text(c,truncate(c,`${i+1}. ${name}`,w*.52),left,nextY,font(20),ink,650)
   const pr=percent(p.messages,a.count);text(c,pr,right-font(82),nextY,font(19),accent,800)
   nextY+=ty(52)
  })
 }
 if(o.showWords&&a.topWords.length&&nextY<h-ty(135)){text(c,`Palavras: ${a.topWords.slice(0,3).map(p=>p.key).join(' · ')}`,left,nextY,font(16),ink,400)}
 c.fillStyle=accent+'55';c.fillRect(left,h-ty(85),w-left*2,1)
 text(c,'🔒 Dados processados no dispositivo',left,h-ty(46),font(16),ink,500)
}
