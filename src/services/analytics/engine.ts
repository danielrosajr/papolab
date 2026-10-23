import type {Analytics, ChatMessage, CountItem, ParticipantStats} from '../../types'
import {dayStart,keyDay,keyMonth,median} from '../../utils/format'
import {mediaSubtype} from '../parser/whatsapp'
import {makeInsights,makeTrophies} from '../insights/rules'

import {tokens,termsForRanking} from './language'
export {tokens,termsForRanking} from './language'
export function best(list:CountItem[]):CountItem|null{return [...list].sort((a,b)=>b.value-a.value||a.key.localeCompare(b.key))[0]||null}
function countMap(m:Map<string,number>,s:string,n=1) {m.set(s,(m.get(s)||0)+n)}
const counts=(map:Map<string,number>):CountItem[]=>[...map].map(([key,value])=>({key,value})).sort((a,b)=>a.key.localeCompare(b.key))
const top=(map:Map<string,number>,limit=12):CountItem[]=>counts(map).sort((a,b)=>b.value-a.value||a.key.localeCompare(b.key)).slice(0,limit)
const emptyPerson=(name:string):ParticipantStats=>({name,messages:0,words:0,characters:0,avgWords:0,short:0,long:0,questions:0,exclamations:0,laughing:0,emoji:0,media:0,deleted:0,night:0,starts:0,ends:0,streakMessages:0,consecutiveRuns:0,love:0,hearts:0,audios:0,stickers:0,uppercase:0,vocabulary:0,medResponse:null,replies:0,activeDays:0})
export function analyze(messages:ChatMessage[],gapHours=8,contentAnalysis=true):Analytics {
  const sorted=[...messages].filter(m=>m.author!==null).sort((a,b)=>a.timestamp-b.timestamp||a.id-b.id)
  const people=new Map<string,ParticipantStats>()
  const days=new Map<string,number>(), months=new Map<string,number>(),years=new Map<string,number>(), words=new Map<string,number>(), emojis=new Map<string,number>()
  const vocab=new Map<string,Set<string>>(), activePersonDays=new Map<string,Set<string>>(), responses=new Map<string,number[]>()
  const sessionStarts=new Map<string,number>(),sessionEnds=new Map<string,number>()
  let chars=0,wordCount=0,media=0,deleted=0,questions=0,night=0,loveExpressions=0,sessions=0,longestSilenceHours=0,longestSilenceStart:null|number=null
  const hours=Array(24).fill(0) as number[],weekdays=Array(7).fill(0) as number[]
  const gap=gapHours*3600000
  let prev:ChatMessage|null=null,prevPerson:string|null=null,sessionLast:string|null=null,currentRun=0
  for(const m of sorted) {
    const author=m.author!
    if(!people.has(author)) {people.set(author,emptyPerson(author));vocab.set(author,new Set());responses.set(author,[]);activePersonDays.set(author,new Set())}
    const p=people.get(author)!
    p.messages++
    const day=keyDay(m.timestamp), month=keyMonth(m.timestamp), yr=day.slice(0,4)
    countMap(days,day);countMap(months,month);countMap(years,yr)
    activePersonDays.get(author)!.add(day)
    const d=new Date(m.timestamp),hour=d.getHours()
    hours[hour]++;weekdays[d.getDay()]++
    if(hour<6) {p.night++;night++}
    if(m.kind==='media') {p.media++;media++;const subtype=mediaSubtype(m.text);if(subtype==='audio')p.audios++;if(subtype==='sticker')p.stickers++}
    if(m.kind==='deleted') {p.deleted++;deleted++}
    const text=m.kind==='text'?m.text:''
    const w=tokens(text);p.words+=w.length;wordCount+=w.length;p.characters+=text.length;chars+=text.length
    if(w.length<=3)p.short++
    if(w.length>=55)p.long++
    if(contentAnalysis && text) {
      const emoji=text.match(/\p{Extended_Pictographic}/gu)||[]
      p.emoji+=emoji.length
      for(const e of emoji)countMap(emojis,e)
      const hits=(text.match(/\?/g)||[]).length;p.questions+=hits;questions+=hits
      p.exclamations+=(text.match(/!/g)||[]).length
      if(/(?:k{3,}|(?:ha){3,}|(?:he){3,}|rsrs|😂|🤣)/i.test(text))p.laughing++
      if(/\b(te amo|amo você|amo voce|saudades|saudade|meu amor|minha vida|te adoro)\b/i.test(text)) {p.love++;loveExpressions++}
      p.hearts+=(text.match(/[❤♥💗💖💕💓💞💘💝💜💙💚💛🧡🤍🖤]/gu)||[]).length
      if(/[a-záéíóúãõç]/i.test(text)&&text===text.toLocaleUpperCase('pt-BR')&&text.length>=5)p.uppercase++
      for(const t of w)vocab.get(author)!.add(t)
      for(const term of termsForRanking(text))countMap(words,term)
    }
    const isNew=!prev||m.timestamp-prev.timestamp>gap
    if(isNew) {
      sessions++;p.starts++;countMap(sessionStarts,author)
      if(prev && sessionLast) {const pp=people.get(sessionLast);if(pp)pp.ends++;countMap(sessionEnds,sessionLast)}
      if(prev) {const silence=(m.timestamp-prev.timestamp)/3600000;if(silence>longestSilenceHours){longestSilenceHours=silence;longestSilenceStart=prev.timestamp}}
      currentRun=0;prevPerson=null
    }
    if(prev&&!isNew&&prevPerson!==author) {
      // One response per change of speaker, not per message.
      responses.get(author)!.push((m.timestamp-prev.timestamp)/60000)
      p.replies++
    }
    if(prevPerson===author&&!isNew) {currentRun++;p.streakMessages++; if(currentRun===1)p.consecutiveRuns++}
    else currentRun=0
    prev=m;prevPerson=author;sessionLast=author
  }
  if(sessionLast){const pp=people.get(sessionLast);if(pp)pp.ends++;countMap(sessionEnds,sessionLast)}
  const participants=[...people.values()].sort((a,b)=>b.messages-a.messages)
  for(const p of participants) {
    p.avgWords=p.messages?p.words/p.messages:0
    p.vocabulary=vocab.get(p.name)!.size
    p.activeDays=activePersonDays.get(p.name)!.size
    const rsp=responses.get(p.name)!
    p.medResponse=rsp.length?median(rsp):null
  }
  const daily=counts(days),monthly=counts(months),annual=counts(years)
  const first=sorted[0]?.timestamp||0,last=sorted.at(-1)?.timestamp||0
  const spanDays=sorted.length?Math.round((dayStart(last)-dayStart(first))/86400000)+1:0
  const emptyDays=Math.max(0,spanDays-daily.length)
  const dailyVals=daily.map(d=>d.value)
  const allResponses=[...responses.values()].flat()
  let streak=0,current=0,previousDay=0
  for(const item of daily) {const t=new Date(`${item.key}T12:00:00`).getTime();current=(previousDay&&Math.round((t-previousDay)/86400000)===1)?current+1:1;streak=Math.max(streak,current);previousDay=t}
  const result:Analytics={count:sorted.length,words:wordCount,characters:chars,media,deleted,participants,dates:{first,last},spanDays,activeDays:daily.length,emptyDays,
    meanActive:daily.length?sorted.length/daily.length:0,medianActive:median(dailyVals),daily,months:monthly,years:annual,hours,weekdays,
    topWords:contentAnalysis?top(words,20):[],topEmojis:contentAnalysis?top(emojis,12):[],biggestDay:best(daily),busiestMonth:best(monthly),
    streak,sessions,responseMedian:allResponses.length?median(allResponses):null,longestSilenceHours,longestSilenceStart,
    sessionStarts:top(sessionStarts,50),sessionEnds:top(sessionEnds,50),loveExpressions,questions,night,gapHours,insights:[],trophies:[]}
  result.insights=makeInsights(result)
  result.trophies=makeTrophies(result,contentAnalysis)
  return result
}
