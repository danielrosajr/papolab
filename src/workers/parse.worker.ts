import {parseWhatsApp} from '../services/parser/whatsapp'
import type {DateOrder} from '../types'
self.onmessage=(event:MessageEvent<{text:string;order?:DateOrder;source:string}>)=>{
  try {
    const result=parseWhatsApp(event.data.text,{order:event.data.order,source:event.data.source},percent=>self.postMessage({type:'progress',percent}))
    self.postMessage({type:'complete',result})
  } catch(e) {self.postMessage({type:'error',message:e instanceof Error?e.message:'Falha de leitura desconhecida'})}
}
