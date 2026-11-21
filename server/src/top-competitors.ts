export type FocusOffer={itemId:string|null;title:string;seller:string|null;url:string|null;price:number|null;monthlyPace:number|null;ageDays:number|null;logistics:string|null}
export function selectTopCompetitors(offers:FocusOffer[]){
 const eligible=offers.filter(o=>o.seller?.trim()&&typeof o.monthlyPace==='number'&&Number.isFinite(o.monthlyPace)&&o.monthlyPace>0)
 const sorted=[...eligible].sort((a,b)=>b.monthlyPace!-a.monthlyPace!||(a.itemId||a.url||a.title).localeCompare(b.itemId||b.url||b.title))
 const seen=new Set<string>()
 return sorted.filter(offer=>{
  const key=offer.seller!.trim().replace(/\s+/g,' ').toLocaleUpperCase('pt-BR')
  if(seen.has(key))return false
  seen.add(key);return true
 }).slice(0,5)
}
