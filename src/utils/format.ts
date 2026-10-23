export const fmt = (n: number) => new Intl.NumberFormat('pt-BR').format(n)
export const compact = (n: number) => new Intl.NumberFormat('pt-BR', {notation:'compact', maximumFractionDigits: 1}).format(n)
export const percent = (a: number, b: number) => b ? `${(100 * a / b).toFixed(1).replace('.', ',')}%` : '0%'
export const dateLabel = (ts: number) => new Date(ts).toLocaleDateString('pt-BR', {day:'2-digit', month:'short',year:'numeric'})
export const monthLabel = (key: string) => {const [y,m] = key.split('-').map(Number); return new Date(y,m-1,1).toLocaleDateString('pt-BR', {month:'short',year:'numeric'})}
export const hoursLabel = (n: number | null) => n === null ? '—' : n < 60 ? `${Math.round(n)} min` : n < 1440 ? `${(n / 60).toFixed(1).replace('.',',')} h` : `${(n / 1440).toFixed(1).replace('.',',')} dias`
export const median = (ns: number[]) => {if (!ns.length) return 0; const v=[...ns].sort((a,b)=>a-b); return (v[Math.floor((v.length-1)/2)]+v[Math.floor(v.length/2)])/2}
export const keyDay = (t: number) => {const d=new Date(t);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
export const keyMonth = (t: number) => keyDay(t).slice(0,7)
export const dayStart = (t: number) => { const d=new Date(t); return new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime() }
