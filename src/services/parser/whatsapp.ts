import type { ChatMessage, DateOrder, ParseOptions, ParsedChat, MessageKind } from '../../types'

const marks = /[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g
const headerAndroid = /^(\d{1,4}[/.\-]\d{1,2}[/.\-]\d{1,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?)\s*(a\.?m\.?|p\.?m\.?)?\s+[-–]\s+(.+)$/i
const headerIos = /^\[(\d{1,4}[/.\-]\d{1,2}[/.\-]\d{1,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?)\s*(a\.?m\.?|p\.?m\.?)?\]\s*(?:[-–]\s*)?(.+)$/i
const media = /(m[íi]dia (ocult[ao]|omitid[ao])|<\s*media omitted\s*>|<\s*(attached|anexo):|imagem ocult[ao]|video omitted|image omitted|audio omitted|sticker omitted|figurinha omitida|sticker omitted|document omitted|arquivo anexado|\(file attached\)|\.(?:jpg|jpeg|png|opus|mp4|webp)\s*\(arquivo anexado\))/i
const deleted = /(mensagem apagada|mensagem foi apagada|esta mensagem foi apagada|you deleted this message|this message was deleted|message deleted)/i
const audio = /\b(?:áudio|audio|ptt|\.opus|voice message)\b/i
const sticker = /\b(?:figurinha|sticker|\.webp)\b/i

interface Head { date: string; time: string; ampm: string; body: string }
function head(line: string): Head | null {
  const cleaned=line.replace(marks,'').replace(/\u202f/g,' ').trimStart()
  const m = headerIos.exec(cleaned) || headerAndroid.exec(cleaned)
  if(!m) return null
  return {date:m[1],time:m[2],ampm:(m[3]||'').toLowerCase().replace(/\./g,''),body:m[4]}
}
function dateParts(raw: string): number[] {return raw.split(/[\/.\-]/).map(Number)}
export function detectDateOrder(input: string): {order: DateOrder; ambiguous:boolean; warning?:string} {
  let dmy=0,mdy=0,ymd=0
  for(const line of input.slice(0,2_000_000).split(/\r?\n/).slice(0,8000)) {
    const h=head(line); if(!h) continue
    const [a,b,c]=dateParts(h.date)
    if(a>31 && String(a).length===4) {ymd++;continue}
    if(a>12 && b<=12) dmy++
    if(b>12 && a<=12) mdy++
    if(c>31 && a<=12 && b<=12) continue
  }
  if(ymd>0 && !dmy && !mdy) return {order:'YMD',ambiguous:false}
  if(dmy && mdy) return {order:dmy>=mdy?'DMY':'MDY',ambiguous:true,warning:'Datas conflitantes encontradas; confira se o arquivo mistura formatos.'}
  if(dmy) return {order:'DMY',ambiguous:false}
  if(mdy) return {order:'MDY',ambiguous:false}
  return {order:'DMY',ambiguous:true,warning:'As datas permitem duas leituras (dia/mês ou mês/dia). Confirme o formato antes de analisar.'}
}
function parseDate(date:string,time:string,ampm:string,order:DateOrder): number|null {
  const parts=dateParts(date);if(parts.length!==3) return null
  let [a,b,c]=parts
  let y=order==='YMD'?a:c
  let month=order==='YMD'?b:order==='DMY'?b:a
  let day=order==='YMD'?c:order==='DMY'?a:b
  if (y<100) y+=y>=70?1900:2000
  const t=time.split(':').map(Number)
  let hour=t[0]
  if(ampm) {if(hour<1 || hour>12) return null;hour=hour%12+(ampm.startsWith('p')?12:0)}
  if(y<1970||y>2100||month<1||month>12||day<1||day>31||hour>23||t[1]>59||(t[2]||0)>59) return null
  const dt=new Date(y,month-1,day,hour,t[1],t[2]||0)
  if(dt.getFullYear()!==y||dt.getMonth()!==month-1||dt.getDate()!==day) return null
  return dt.getTime()
}
function getKind(text:string, author:string|null):MessageKind {
  if (!author) return 'system'
  if (deleted.test(text) && text.length<145) return 'deleted'
  if (media.test(text) && text.length<250) return 'media'
  return 'text'
}
export function mediaSubtype(text: string): 'audio'|'sticker'|'other' {
  return audio.test(text)?'audio':sticker.test(text)?'sticker':'other'
}
function splitAuthor(body:string):{author:string|null;text:string} {
  const pos=body.indexOf(': ')
  if(pos<=0 || pos>110) return {author:null,text:body}
  const author=body.slice(0,pos).trim()
  if(!author || author.includes('\n')) return {author:null,text:body}
  return {author,text:body.slice(pos+2)}
}
export function parseWhatsApp(raw:string, options:ParseOptions={}, onProgress?:(n:number)=>void):ParsedChat {
  const detection=detectDateOrder(raw)
  const order=options.order||detection.order
  const warnings:string[]=[]
  if(detection.warning) warnings.push(options.order ? `Datas interpretadas como ${order} conforme o formato escolhido. Confira a prévia para validar.` : detection.warning)
  const lines=raw.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n').split('\n')
  const msgs:ChatMessage[]=[]
  let skipped=0
  for(let i=0;i<lines.length;i++) {
    const h=head(lines[i]);const ts=h?parseDate(h.date,h.time,h.ampm,order):null
    if(h && ts!==null) {
      const pair=splitAuthor(h.body)
      const entry:ChatMessage={id:msgs.length,timestamp:ts,author:pair.author,text:pair.text,kind:getKind(pair.text,pair.author)}
      msgs.push(entry)
    } else if(msgs.length) {
      msgs[msgs.length-1].text+='\n'+lines[i]
      const prev=msgs[msgs.length-1]
      prev.kind=getKind(prev.text,prev.author)
    } else if(lines[i].trim()) skipped++
    if(i%3000===0) onProgress?.(Math.round(100*i/Math.max(1,lines.length)))
  }
  // Stable sort to make sure statistics do not depend on export order.
  msgs.sort((a,b)=>a.timestamp-b.timestamp||a.id-b.id)
  msgs.forEach((m,i)=>m.id=i)
  const participants=[...new Set(msgs.map(m=>m.author).filter((s):s is string=>Boolean(s)))]
  if(!msgs.length) warnings.push('Nenhuma linha reconhecida como mensagem. Exporte a conversa pelo WhatsApp (sem mídia é suficiente).')
  if(skipped) warnings.push(`${skipped} linha(s) antes da primeira mensagem foram ignoradas.`)
  if(msgs.length>0 && msgs.filter(m=>m.author===null).length>msgs.length*.5) warnings.push('Mais de metade dos registros parecem mensagens do sistema. Confira o arquivo.')
  onProgress?.(100)
  return {messages:msgs,participants,warnings,skipped,source:options.source||'Conversa importada',order,ambiguousDates:detection.ambiguous}
}
