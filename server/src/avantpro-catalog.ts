export type CatalogStatus='inCatalog'|'outsideCatalog'|'unknown'
const normalized=(value:string)=>value.replace(/\s*\(AvantPro\)\s*$/i,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ')
/** Classification comes from the AvantPro module, never the URL or missing ID. */
export function classifyAvantproCatalog(metrics:string,fields?:{label:string}[]):CatalogStatus{
 const labels=(fields?.length?fields.map(field=>field.label):metrics.split('\n')).map(normalized)
 const inside=labels.some(label=>['vendas do catalogo','atual ganhador','anuncio ganhador criado em'].includes(label))
 const outside=labels.some(label=>['vendas do produto','nome do vendedor','anuncio criado em'].includes(label))
 return inside===outside?'unknown':inside?'inCatalog':'outsideCatalog'
}
export function summarizeAvantproCatalog(fields:{label:string;value:string}[],statuses:CatalogStatus[]){
 const definitions=[{key:'inCatalog',label:'Em catálogo',aliases:['em catalogo']},{key:'outsideCatalog',label:'Fora de catálogo',aliases:['fora catalogo','fora de catalogo']}] as const
 const counts=new Map<string,Set<number>>()
 for(const field of fields){
  const definition=definitions.find(item=>(item.aliases as readonly string[]).includes(normalized(field.label)))
  const raw=field.value.replace(/[\s\u00a0]/g,'')
  if(!definition||!/^\d+(?:\.\d{3})*$/.test(raw))continue
  const value=Number(raw.replace(/\./g,''))
  if(!Number.isSafeInteger(value))continue
  if(!counts.has(definition.key))counts.set(definition.key,new Set())
  counts.get(definition.key)!.add(value)
 }
 const conflicts=definitions.filter(item=>(counts.get(item.key)?.size||0)>1).map(item=>item.label)
 const items=definitions.flatMap(item=>counts.get(item.key)?.size===1?[{label:item.label,value:[...counts.get(item.key)!][0]}]:[])
 const missing=definitions.filter(item=>!items.some(row=>row.label===item.label)).map(item=>item.label)
 if(counts.size){
  const base=items.reduce((sum,item)=>sum+item.value,0)
  return {items,base,source:'AvantPro - contadores de catálogo',scope:'category' as const,missing,conflicts,percentagesAvailable:missing.length===0&&base>0,
   inCatalog:items.find(item=>item.label==='Em catálogo')?.value??null,outsideCatalog:items.find(item=>item.label==='Fora de catálogo')?.value??null,unknown:null,
   description:'Base: soma dos contadores Em Catálogo e Fora Catálogo da própria captura AvantPro. Pode incluir anúncios repetidos e diferir das ofertas deduplicadas. Contador ausente não significa zero.'}
 }
 const inside=statuses.filter(status=>status==='inCatalog').length,outside=statuses.filter(status=>status==='outsideCatalog').length,unknown=statuses.length-inside-outside
 return {items:[{label:'Em catálogo',value:inside},{label:'Fora de catálogo',value:outside},{label:'Não informado',value:unknown}],base:statuses.length,source:'AvantPro - módulos por anúncio',scope:'offers' as const,missing,conflicts,percentagesAvailable:statuses.length>0,inCatalog:inside,outsideCatalog:outside,unknown,
  description:'Classificação pelos campos do módulo AvantPro de cada oferta deduplicada. URL e ausência de ID de catálogo não classificam a oferta. Sem sinal explícito, a classificação é Não informado.'}
}
