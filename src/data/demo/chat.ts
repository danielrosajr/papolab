// Fully fictional, deterministic history. No real conversations are bundled.
import type { ChatMessage, ParsedChat } from '../../types'
export function demoChat(): ParsedChat {
  const names = ['Lia', 'Rafa', 'Bia', 'Caio', 'Duda']
  const texts = [
    'Bom dia! ☀️', 'kkkkkkkk não acredito 😂', 'Quem topa sair sábado?', 'Eu topo! ❤️',
    'Tô chegando em 10 minutos', 'Gente, olha isso 👀', 'Saudades de vocês 💜', 'Partiu café? ☕',
    'A melhor ideia de todas!!!', 'O que vocês acham?', 'SOCORRO KKKKK', 'Te amo, família 💕',
    'Vou mandar áudio depois', 'Nossa, que história maravilhosa', 'Já resolveram aquilo?',
    'Precisamos marcar outro encontro!', '😂😂😂', 'Isso merece um textão enorme explicando tudo e organizando cada detalhe da nossa próxima aventura.',
    'A foto ficou linda! 😍', 'Feliz aniversário! 🎂', 'E aí, bora?', 'Saudades daquela viagem de julho!',
    'A gente se fala depois?', 'Boa noite, pessoal 🌙', 'Tudo bem por aí?', 'Boa tarde, turma!'
  ]
  const messages: ChatMessage[] = []
  let id=0
  for (let day=0; day<380;day++) {
    const base = new Date(2025, 8, 1+day).getTime()
    if (day % 13 === 0) continue
    const volume = 2 + (day * 13 % 22) + (day % 23 === 0 ? 45 : 0)
    for(let i=0;i<volume;i++) {
      const name = names[(i*7+day*3+Math.floor(i/4))%names.length]
      const time=base + (7*60 + (i*41+day*17)%990) * 60000
      const choice=(i*11+day*7)%texts.length
      messages.push({id:id++,timestamp:time,author:name,text:texts[choice],kind:'text'})
    }
  }
  messages.sort((a,b)=>a.timestamp-b.timestamp)
  messages.forEach((m,i)=>m.id=i)
  return {messages,participants:names,warnings:['Demonstração com mensagens inteiramente fictícias.'],ambiguousDates:false,source:'Conversa de demonstração',order:'DMY',skipped:0}
}
