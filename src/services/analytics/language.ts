/** Regras locais e auditáveis para as expressões exibidas nos rankings. */
const URLS = /(?:https?:\/\/|www\.)[^\s<>"']+|\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b|\b(?:[a-z\d-]+\.)+(?:com(?:\.br)?|org(?:\.br)?|net(?:\.br)?|gov(?:\.br)?|edu(?:\.br)?|io|app|me|info|co|br)(?:\/[^\s<>"']*)?/giu

export function normalizeTerm(value: string): string {
  return value.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

export function textWithoutLinks(value: string): string {
  return value.replace(URLS, ' ')
}

/** Contagem lexical geral, sem links, e-mails nem fragmentos de domínios. */
export function tokens(value: string): string[] {
  return normalizeTerm(textWithoutLinks(value)).match(/[a-z\p{L}\d]{2,}/gu) || []
}

const COMMON = new Set(`a o e de da do dos das um uma uns umas em no na nos nas para por com que se os as eu voce voces nos meu minha meus minhas seu sua seus suas ele ela eles elas mas ou foi sou sao esse essa isso isto aquele aquela aqui ali la ja nao sim pra pro por favor agora bem muito mais menos ter tem tinha quando como quem onde porque entao ate ainda tambem mesmo tudo todos todas cada to ta estou ser era assim sobre depois antes hoje ontem amanha gente aos pelas pelos numa num desde sem pelo pela vou vai vamos qual quais ha as esta este estes estas esse esses essas alguem ninguem algo nada alguma alguns algumas tem tenho temos so ta ok certo blz ne ai ah oh eh pra voce bom boa dia noite tarde link links https http www com br org net html php amp utm pdf jpg png jpeg mp4 zip arquivo arquivos mensagem mensagens isto aquele aquela foi sendo ficam fica fazem faz feito pode podem podia primeiro segunda muito obrigada obrigado favor vc vcs rs`.split(/\s+/))
// Frases explícitas são contadas como uma unidade: uma ocorrência não soma as palavras isoladas.
const PHRASES = [
  'bom dia', 'boa tarde', 'boa noite', 'tudo bem', 'te amo', 'amo voce',
  'muito obrigado', 'muito obrigada', 'ate amanha', 'por favor', 'se cuida',
  'de nada', 'com certeza', 'meu deus', 'e ai', 'ate mais', 'se deus quiser'
].map(normalizeTerm).sort((a,b)=>b.split(' ').length-a.split(' ').length)
const phraseParts = PHRASES.map(s=>({term:s,parts:s.split(' ')}))

export function termsForRanking(value:string): string[] {
  const result:string[]=[]
  // Processar trechos separados por links impede criar falsos "bom dia"
  // quando uma URL foi inserida entre as palavras.
  for(const segment of value.split(URLS)) {
    const raw=tokens(segment)
    for(let i=0;i<raw.length;){
      const phrase=phraseParts.find(p=>p.parts.every((part,k)=>raw[i+k]===part))
      if(phrase){result.push(phrase.term);i+=phrase.parts.length;continue}
      const term=raw[i++]
      if(term.length>=3 && !COMMON.has(term) && !/^\d+$/.test(term))result.push(term)
    }
  }
  return result
}

/** Busca sem diferenciar acentos/maiúsculas, com trechos seguros para <mark> no Vue. */
function maskLinks(value:string):string {
  return value.replace(URLS,match=>match.replace(/[^\r\n]/g,'\ufff0'))
}
export function highlightedParts(value:string,term:string):{text:string;highlight:boolean}[] {
  const needle=normalizeTerm(term).replace(/\s+/g,' ')
  if(!needle)return [{text:value,highlight:false}]
  const normalized:string[]=[];const offsets:number[]=[]
  const masked=maskLinks(value)
  for(let i=0;i<masked.length;){
    const ch=String.fromCodePoint(masked.codePointAt(i)!)
    const start=i;i+=ch.length
    for(const letter of ch.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'')){
      if(/\s/.test(letter) && normalized.at(-1)===' ')continue
      normalized.push(/\s/.test(letter)?' ':letter);offsets.push(start)
    }
  }
  const folded=normalized.join('');const result:{text:string;highlight:boolean}[]=[]
  let from=0, cursor=0
  while((from=folded.indexOf(needle,cursor))>=0){
    const before=from===0?'':folded[from-1],after=folded[from+needle.length]||''
    // Não destacar partes internas de outras palavras.
    if((before&&/[\p{L}\d]/u.test(before))||(after&&/[\p{L}\d]/u.test(after))){cursor=from+needle.length;continue}
    const start=offsets[from], end=offsets[from+needle.length]??value.length
    const previous=result.reduce((n,p)=>n+p.text.length,0)
    if(start>previous)result.push({text:value.slice(previous,start),highlight:false})
    result.push({text:value.slice(start,end),highlight:true})
    cursor=from+needle.length
  }
  const consumed=result.reduce((n,p)=>n+p.text.length,0)
  if(consumed<value.length)result.push({text:value.slice(consumed),highlight:false})
  return result.length?result:[{text:value,highlight:false}]
}
export function containsTerm(value:string,term:string):boolean {
  return highlightedParts(value,term).some(part=>part.highlight)
}
