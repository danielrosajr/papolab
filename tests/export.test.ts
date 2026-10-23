import {describe,expect,it} from 'vitest'
import {drawShareCard, type CardOptions} from '../src/services/export/card'
import {analyze} from '../src/services/analytics/engine'
import {parseWhatsApp} from '../src/services/parser/whatsapp'
import {modules} from '../src/modules/catalog'

function canvasMock(){
 const strings:string[]=[]
 const c={
  fillText:(t:string)=>strings.push(t),fillRect:()=>{},beginPath:()=>{},roundRect:()=>{},fill:()=>{},
  createRadialGradient:()=>({addColorStop:()=>{}}),measureText:(s:string)=>({width:s.length*11})
 }
 const canvas={width:0,height:0,getContext:()=>c} as unknown as HTMLCanvasElement
 return {canvas,strings}
}
const result=analyze(parseWhatsApp('15/10/2025, 08:00 - Ana Silva: Oi\n15/10/2025, 08:01 - Bruno Fernandes: Olá').messages)
const base:CardOptions={format:'story',theme:'neon',title:'Nossa história',anonymous:true,hideDates:true,showWords:false,showRank:true,showRecords:true}
describe('Exportação compartilhável',()=>{
 it('não revela nomes nem datas específicas com padrões de privacidade ativos',()=>{
  const m=canvasMock()
  drawShareCard(m.canvas,result,modules[0],base)
  expect(m.canvas.width).toBe(720)
  expect(m.canvas.height).toBe(1280)
  expect(m.strings.join(' ')).not.toContain('Ana Silva')
  expect(m.strings.join(' ')).not.toContain('Bruno Fernandes')
  expect(m.strings.join(' ')).not.toContain('2025-10-15')
  expect(m.strings.join(' ')).toContain('Participante 1')
 })
 it('revela nomes somente quando explicitamente solicitados',()=>{
  const m=canvasMock()
  drawShareCard(m.canvas,result,modules[0],{...base,anonymous:false})
  expect(m.strings.join(' ')).toContain('Ana Silva')
 })
 it('oferece formatos 1:1 e 16:9',()=>{
  const m=canvasMock();drawShareCard(m.canvas,result,modules[0],{...base,format:'square'})
  expect([m.canvas.width,m.canvas.height]).toEqual([900,900])
  drawShareCard(m.canvas,result,modules[0],{...base,format:'wide'})
  expect([m.canvas.width,m.canvas.height]).toEqual([1280,720])
 })
})
