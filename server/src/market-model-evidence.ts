import type {FullMarketEvidence} from './full-market-report.js'
/** Lossless transport: the HTML renderer still receives the original evidence. */
export function compactMarketEvidence(evidence:FullMarketEvidence){
 const fieldLabels:string[]=[];const fieldIds=new Map<string,number>()
 const rawTextDictionary:string[]=[];const textIds=new Map<string,number>()
 const intern=(value:string,values:string[],ids:Map<string,number>)=>{
  let index=ids.get(value)
  if(index===undefined){index=values.length;values.push(value);ids.set(value,index)}
  return index
 }
 const columns=['itemId','catalogId','userProductId','catalogStatus','title','seller','url','price','logistics','sponsored','shipping','date','ageDays','creationSource','catalogCreated','estimatedSales','monthlyPace','lifetimeSales','fields','rawTextLines','badges','shippingPositions','shippingText'] as const
 const offers=evidence.offers.map((offer,index)=>{
  const shipping=evidence.shipping.offers[index]
  const data={...offer,
   fields:offer.fields.map(field=>{
    const {label,value,...metadata}=field
    const {status,...extra}=metadata as Record<string,unknown>
    return [intern(label,fieldLabels,fieldIds),value,status||(value===null?'unavailable':'ready'),...(Object.keys(extra).length?[extra]:[])]
   }),
   rawTextLines:offer.avantproText.split('\n').map(line=>intern(line,rawTextDictionary,textIds)),
   shippingPositions:shipping.positions,shippingText:shipping.text,
  }
  return columns.map(column=>data[column])
 })
 const {offers:shippingOffers,...shippingSummary}=evidence.shipping
 return {...evidence,
  encoding:{description:'offers são linhas com colunas offerColumns. fields são tuplas [índice em fieldLabels, valor, status, metadados opcionais]. rawTextLines são índices em rawTextDictionary; juntar com quebra de linha recupera o texto AvantPro completo. shippingPositions e shippingText preservam os detalhes de frete de cada oferta. Nenhum anúncio ou campo foi omitido.',offerColumns:columns,fieldLabels,rawTextDictionary},
  offers,shipping:shippingSummary,
 }
}
