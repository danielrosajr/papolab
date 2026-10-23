import JSZip from 'jszip'
export async function readWhatsAppFile(file:File,onProgress:(p:number)=>void):Promise<{text:string;filename:string}> {
  const ext=file.name.toLowerCase()
  if(!ext.endsWith('.txt')&&!ext.endsWith('.zip')) throw new Error('Escolha um arquivo .txt ou .zip exportado pelo WhatsApp.')
  if(file.size>100*1024*1024) throw new Error('Arquivo acima de 100 MB. Exporte a conversa sem mídia ou use um histórico menor.')
  if(ext.endsWith('.txt')) {
    const text=await new Promise<string>((resolve,reject)=>{
      const reader=new FileReader()
      reader.onprogress=e=>{if(e.lengthComputable)onProgress(Math.round(e.loaded/e.total*80))}
      reader.onerror=()=>reject(new Error('Não foi possível ler o arquivo selecionado.'))
      reader.onload=()=>resolve(String(reader.result||''))
      reader.readAsText(file,'utf-8')
    })
    onProgress(100);return {text,filename:file.name}
  }
  const zip=await JSZip.loadAsync(file)
  const candidates=Object.values(zip.files).filter(f=>!f.dir&&f.name.toLowerCase().endsWith('.txt')&&!f.name.startsWith('__MACOSX/'))
  if(!candidates.length) throw new Error('Este ZIP não possui nenhum .txt de conversa. Exporte o histórico sem mídia no WhatsApp.')
  candidates.sort((a,b)=>Number(/(?:^|\/)(_chat|whatsapp chat|conversa do whatsapp)/i.test(b.name))-Number(/(?:^|\/)(_chat|whatsapp chat|conversa do whatsapp)/i.test(a.name)))
  const chosen=candidates[0]
  const unpacked=(chosen as unknown as {_data?:{uncompressedSize?:number}})._data?.uncompressedSize
  if(unpacked&&unpacked>100*1024*1024) throw new Error('O TXT dentro do ZIP ultrapassa 100 MB.')
  const text=await chosen.async('string',m=>onProgress(Math.round(m.percent)))
  if(text.length>100*1024*1024)throw new Error('Conversa descompactada acima de 100 MB.')
  return {text,filename:chosen.name.split('/').at(-1)||file.name}
}
