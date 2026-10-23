import type {Analytics, Insight, Trophy, ParticipantStats} from '../../types'
import {dateLabel,fmt,monthLabel,percent} from '../../utils/format'
export function makeInsights(a:Analytics):Insight[] {
  if(!a.count)return []
  const period=`${dateLabel(a.dates.first)} — ${dateLabel(a.dates.last)}`
  const ins:Insight[]=[]
  const add=(id:string,title:string,detail:string,method:string,value?:string)=>ins.push({id,title,detail,method,value,category:'estatística',period})
  if(a.biggestDay)add('top-day','O dia que bombou',`${a.biggestDay.key} teve ${fmt(a.biggestDay.value)} mensagens.`, 'Maior contagem de mensagens humanas por data local.',fmt(a.biggestDay.value))
  if(a.busiestMonth)add('top-month','O mês mais conversado',`${monthLabel(a.busiestMonth.key)} concentrou ${fmt(a.busiestMonth.value)} mensagens.`, 'Maior contagem de mensagens por mês civil local.',monthLabel(a.busiestMonth.key))
  if(a.participants.length) {const p=a.participants[0];add('leader','Quem mais apareceu',`${p.name} enviou ${percent(p.messages,a.count)} das mensagens registradas.`, 'Mensagens atribuídas a cada participante, divididas pelo total.',p.name)}
  if(a.activeDays)add('active-days','Dias de papo',`Houve mensagens em ${fmt(a.activeDays)} de ${fmt(a.spanDays)} dias do intervalo exportado.`, 'Contagem de datas únicas com mensagens; ausência no export não prova ausência de contato.',`${a.activeDays} dias`)
  if(a.longestSilenceHours>=a.gapHours)add('silence','Maior intervalo entre mensagens',`${(a.longestSilenceHours/24).toFixed(1).replace('.',',')} dias entre duas mensagens registradas.`, 'Diferença entre horários de mensagens adjacentes; não indica afastamento na vida real.',`${Math.round(a.longestSilenceHours)} h`)
  if(a.sessions>=3)add('session','Começos de conversa',`${fmt(a.sessions)} sessões ao separar intervalos de mais de ${a.gapHours} horas.`, 'Cada pausa superior ao limite selecionado inicia uma nova sessão.',fmt(a.sessions))
  if(a.topEmojis.length)add('emoji','O emoji que domina',`O ${a.topEmojis[0].key} apareceu ${fmt(a.topEmojis[0].value)} vezes.`, 'Contagem de caracteres pictográficos em mensagens de texto.',a.topEmojis[0].key)
  if(a.years.length>=2){const newest=a.years.at(-1)!,oldest=a.years[0];add('epochs','Histórico entre anos',`O registro vai de ${oldest.key} a ${newest.key}, com ${fmt(newest.value)} mensagens em ${newest.key}.`,'Contagem por ano civil; anos parciais não devem ser comparados como completos.',newest.key)}
  return ins
}
export function makeTrophies(a:Analytics,contentAnalysis=true):Trophy[] {
  const trophies:Trophy[]=[]
  const award=(id:string,label:string,icon:string,field:keyof ParticipantStats,min:number,criterion:string)=>{
    const eligible=a.participants.filter(p=>p.messages>=10)
    if(!eligible.length)return
    const ranked=[...eligible].sort((x,y)=>Number(y[field]||0)-Number(x[field]||0))
    const winner=ranked[0],n=Number(winner[field]||0)
    if(n<min)return
    trophies.push({id,label,icon,winner:winner.name,count:n,criterion})
  }
  award('chat','Microfone de ouro','🎙️','messages',10,'Maior número de mensagens (mínimo 10).')
  award('night','Coruja da madrugada','🦉','night',3,'Mais mensagens entre 0h e 5h59 (mínimo 3).')
  award('starts','CEO do primeiro oi','🚀','starts',3,'Mais sessões iniciadas (mínimo 3 sessões).')
  award('long','Lenda do textão','📜','long',2,'Mais mensagens com ao menos 55 palavras (mínimo 2).')
  award('rapid','Metralhadora de mensagens','⚡','streakMessages',5,'Mais mensagens consecutivas adicionais no mesmo turno/sessão (mínimo 5).')
  if(contentAnalysis){
    award('laugh','Rei/Rainha do KKKKK','😂','laughing',3,'Mais mensagens contendo kkk, hahaha, rsrs ou emoji de risada (mínimo 3).')
    award('emoji','Imperador dos emojis','👑','emoji',5,'Maior contagem de emojis (mínimo 5).')
    award('questions','Mestre das perguntas','❓','questions',3,'Mais sinais ? enviados (mínimo 3).')
    award('love','Correio do carinho','💌','love',2,'Mais mensagens com expressões carinhosas predefinidas (mínimo 2).')
  }
  award('audio','Capitão dos áudios','🎧','audios',2,'Mais indicadores de áudio exportado (mínimo 2).')
  return trophies
}
