import {describe,it,expect} from 'vitest'
import {detectDateOrder,parseWhatsApp} from '../src/services/parser/whatsapp'
describe('Parser WhatsApp',()=>{
 it('lê Android brasileiro e texto multilinha',()=>{
  const raw='15/10/2025, 08:20 - Ana: Bom dia! ☀️\nContinuação com acento\n15/10/2025, 08:21 - Bruno: Bora?'
  const c=parseWhatsApp(raw)
  expect(c.messages).toHaveLength(2)
  expect(c.messages[0].text).toContain('Continuação com acento')
  expect(c.participants).toEqual(['Ana','Bruno'])
  expect(c.ambiguousDates).toBe(false)
 })
 it('lê iOS com segundos e AM/PM',()=>{
  const c=parseWhatsApp('[10/21/25, 11:45:00 PM] John: Hey!\n[10/22/25, 12:03:00 AM] Jane: Hello',{order:'MDY'})
  expect(c.messages).toHaveLength(2)
  expect(new Date(c.messages[1].timestamp).getHours()).toBe(0)
 })
 it('detecta data internacional e pede confirmação das ambíguas',()=>{
  expect(detectDateOrder('12/28/2025, 12:00 - Ana: Oi').order).toBe('MDY')
  expect(detectDateOrder('04/05/2025, 12:00 - Ana: Oi').ambiguous).toBe(true)
  const d=parseWhatsApp('04/05/2025, 12:00 - Ana: Oi',{order:'MDY'})
  expect(new Date(d.messages[0].timestamp).getMonth()).toBe(3)
 })
 it('preserva linhas que parecem datas no meio do texto',()=>{
  const c=parseWhatsApp('15/10/2025, 08:20 - Ana: Agenda:\n15/10/2025, 10:00 jantar\n15/10/2025, 09:20 - Ana: Depois')
  expect(c.messages).toHaveLength(2)
  expect(c.messages[0].text).toContain('jantar')
 })
 it('diferencia mensagens de sistema, mídia e apagadas',()=>{
  const c=parseWhatsApp('15/10/2025, 08:20 - Grupo criado\n15/10/2025, 08:21 - Ana: <Mídia oculta>\n15/10/2025, 08:22 - Bruno: Esta mensagem foi apagada')
  expect(c.messages.map(m=>m.kind)).toEqual(['system','media','deleted'])
 })
 it('diferencia participantes semelhantes',()=>{
  const c=parseWhatsApp('15/10/2025, 08:20 - Ana: Oi\n15/10/2025, 08:21 - Ana Maria: Olá')
  expect(c.participants).toEqual(['Ana','Ana Maria'])
 })
 it('lida com histórico vazio',()=>{
  expect(parseWhatsApp('arquivo não é exportação').messages).toHaveLength(0)
 })
})
