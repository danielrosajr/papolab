import {describe,it,expect} from 'vitest'
import {parseWhatsApp} from '../src/services/parser/whatsapp'
import {analyze} from '../src/services/analytics/engine'
import {containsTerm,highlightedParts,termsForRanking,tokens} from '../src/services/analytics/language'

describe('Ranking de palavras e expressões',()=>{
 it('não polui a nuvem com URLs, domínios ou fragmentos',()=>{
  const terms=termsForRanking('Pesquisa: https://exemplo.com.br/curso/inscricao?url=foo www.teste.org clique em https://outra.com/teste e também acesse o link')
  expect(terms).toContain('pesquisa')
  for(const token of ['https','http','www','com','br','tambem','link','inscricao','outra'])expect(terms).not.toContain(token)
 })
 it('conta bom dia, boa noite e tudo bem como expressões indivisíveis',()=>{
  const a=termsForRanking('Bom dia! Tudo bem? Boa noite, pessoal. BOM DIA novamente.')
  expect(a.filter(w=>w==='bom dia')).toHaveLength(2)
  expect(a).toContain('boa noite')
  expect(a).toContain('tudo bem')
  expect(a).not.toContain('bom')
  expect(a).not.toContain('dia')
 })
 it('audita com diferenças de acentos e maiúsculas sem marcar URL',()=>{
  const text='Também disse Bom Dia. https://exemplo.com.br/tambem'
  expect(containsTerm(text,'tambem')).toBe(true)
  expect(containsTerm(text,'bom dia')).toBe(true)
  expect(containsTerm('https://site.com/cursopago','curso')).toBe(false)
  expect(highlightedParts(text,'bom dia').filter(p=>p.highlight).map(p=>p.text)).toEqual(['Bom Dia'])
 })
 it('mantém contagens de mensagens e anos ao excluir autores',()=>{
  const chat=parseWhatsApp('01/10/2025, 10:00 - Ana: Bom dia!\n01/10/2025, 11:00 - Bia: Boa noite!\n01/10/2026, 10:00 - Ana: tudo bem?\n01/10/2026, 10:01 - Bia: ótimo!')
  const filtered=chat.messages.filter(m=>m.author!=='Bia')
  const a=analyze(filtered)
  expect(a.count).toBe(2)
  expect(a.years).toEqual([{key:'2025',value:1},{key:'2026',value:1}])
  expect(a.topWords.find(p=>p.key==='bom dia')?.value).toBe(1)
  expect(analyze(filtered.filter(m=>new Date(m.timestamp).getFullYear()===2026)).count).toBe(1)
  expect(tokens('HTTP://exemplo.org  olá pessoal')).toEqual(['ola','pessoal'])
 })
})
