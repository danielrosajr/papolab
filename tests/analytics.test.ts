import {describe,it,expect} from 'vitest'
import {parseWhatsApp} from '../src/services/parser/whatsapp'
import {analyze} from '../src/services/analytics/engine'
describe('Motor de estatísticas',()=>{
 const c=parseWhatsApp('15/10/2025, 08:00 - Ana: Oi\n15/10/2025, 08:01 - Ana: Tudo bem?\n15/10/2025, 08:06 - Bia: Sim! ❤️\n15/10/2025, 08:10 - Bia: kkkkk\n16/10/2025, 19:00 - Ana: Bom dia!')
 it('agrupa turnos e mede uma resposta por troca de autor',()=>{
  const a=analyze(c.messages)
  expect(a.count).toBe(5)
  expect(a.sessions).toBe(2)
  expect(a.participants.find(p=>p.name==='Bia')?.replies).toBe(1)
  expect(a.participants.find(p=>p.name==='Bia')?.medResponse).toBe(5)
  expect(a.participants.find(p=>p.name==='Ana')?.starts).toBe(2)
 })
 it('conta dias ativos, lacunas e dá troféus somente com amostra mínima',()=>{
  const a=analyze(c.messages)
  expect(a.activeDays).toBe(2)
  expect(a.emptyDays).toBe(0)
  expect(a.trophies).toHaveLength(0)
 })
 it('evita interpretações textuais quando desativadas',()=>{
  const a=analyze(c.messages,8,false)
  expect(a.topWords).toHaveLength(0)
  expect(a.topEmojis).toHaveLength(0)
  expect(a.loveExpressions).toBe(0)
 })
 it('respeita filtros por data e participante quando dados são pré-filtrados',()=>{
  const a=analyze(c.messages.filter(m=>m.author==='Bia'))
  expect(a.count).toBe(2)
  expect(a.participants.map(p=>p.name)).toEqual(['Bia'])
 })
 it('calcula média e mediana por dia ativo',()=>{
  const a=analyze(c.messages)
  expect(a.meanActive).toBe(2.5)
  expect(a.medianActive).toBe(2.5)
 })
 it('retorna zeros estáveis para dados vazios',()=>{
  const a=analyze([])
  expect(a.count).toBe(0)
  expect(a.insights).toHaveLength(0)
  expect(a.responseMedian).toBeNull()
 })
})
