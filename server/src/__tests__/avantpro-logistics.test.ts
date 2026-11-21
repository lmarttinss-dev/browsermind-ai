import {describe,expect,it} from 'vitest'
import {summarizeAvantproLogistics} from '../avantpro-logistics.js'
import {buildFullMarketEvidence,composeFullMarketDocument,repairStoredMarketLogistics,generateFullMarketReport} from '../full-market-report.js'
import {reportEvidence,interpretation,fullDocument} from './fixtures/full-market-fixture.js'
const fields=[['FULL','27'],['Flex','5'],['Correios','3'],['Coleta','8'],['Places','13'],['Outros','0']].map(([label,value])=>({label,value}))
describe('logística do AvantPro com dados preparados',()=>{
 it('prioriza o agregado disponível sem usar a base de ofertas deduplicadas',()=>{
  const result=summarizeAvantproLogistics(fields,[{label:'Não informado',value:51}])
  expect(result).toMatchObject({scope:'category',base:56,source:'AvantPro - Logística de Entrega',missing:[]})
  expect(result.items[0]).toEqual({label:'Full',value:27})
  expect(result.items).not.toContainEqual({label:'Não informado',value:51})
 })
 it('preserva zero explícito e não inventa categorias ausentes ou contadores conflitantes',()=>{
  expect(summarizeAvantproLogistics([{label:'Outros',value:'0'}],[])).toMatchObject({scope:'category',base:0,items:[{label:'Outros',value:0}]})
  const conflict=summarizeAvantproLogistics([...fields,{label:'Full',value:'28'}],[])
  expect(conflict.conflicts).toEqual(['Full']);expect(conflict.items.some(item=>item.label==='Full')).toBe(false)
  expect(summarizeAvantproLogistics([], [{label:'Não informado',value:51}])).toMatchObject({scope:'offers',base:51})
 })
 it('corrige o relatório anterior a partir da própria captura sem alterar outras seções',()=>{
  const old=structuredClone(fullDocument)
  old.sections.find(section=>section.id==='metrics')!.tables[0].rows.push(...fields.map(field=>[field.label+' (AvantPro)',field.value]))
  old.sections.find(section=>section.id==='logistics')!.summary='Todos os anúncios sem logística informada'
  const fixed=repairStoredMarketLogistics(old)
  const logistics=fixed.sections.find(section=>section.id==='logistics')!
  expect(logistics.summary).toContain('Full: 27')
  expect(logistics.tables[0].rows[0]).toEqual(['Full',27,'48,21%'])
  expect(logistics.tables[1].rows[1]).toEqual(['Base dos percentuais',56])
  expect(fixed.sections.filter(section=>section.id!=='logistics')).toEqual(old.sections.filter(section=>section.id!=='logistics'))
  expect(old.sections.find(section=>section.id==='logistics')!.summary).toContain('sem logística')
 })
 it('entrega os contadores corretos ao template e rejeita campos ainda carregando',()=>{
  const listings=reportEvidence.offers.map((offer,i)=>({positions:[i+1],itemId:offer.itemId,catalogId:offer.catalogId,title:offer.title,seller:offer.seller,url:offer.url,advertising:false,metrics:'Vendidos\n100'}))
  const evidence=buildFullMarketEvidence({listings,title:'Teste',url:'https://lista.mercadolivre.com.br/teste',categoryFields:fields})
  const doc=composeFullMarketDocument(evidence,interpretation)
  expect(doc.sections.find(section=>section.id==='logistics')!.tables[0].rows[0]).toEqual(['Full',27,'48,21%'])
  expect(()=>buildFullMarketEvidence({listings:listings.map(listing=>({...listing,avantproFields:[{label:'Frete',value:null,status:'loading' as const}]})),title:'Teste',url:''})).toThrow('carregando')
 })
 it('envia todos os campos capturados à interpretação, inclusive os não usados nos indicadores',async()=>{
  const captured=[{label:'Estoque',value:'120',status:'ready' as const},{label:'Comissão',value:'R$ 3,20',status:'ready' as const},{label:'Campo adicional AvantPro',value:'Valor preservado',status:'ready' as const}]
  const evidence=buildFullMarketEvidence({title:'Teste',url:'https://lista.mercadolivre.com.br/teste',categoryFields:fields,listings:[{positions:[1],itemId:'MLB1',catalogId:null,title:'Produto',seller:'Loja',url:null,advertising:false,metrics:'Dados AvantPro',avantproFields:captured}]})
  await generateFullMarketReport(evidence,async message=>{
   const payload=JSON.parse(message),transport=payload.evidence
   const offer=Object.fromEntries(transport.encoding.offerColumns.map((column:string,i:number)=>[column,transport.offers[0][i]]))
   const restoredFields=(offer.fields as [number,string,string][]).map(([label,value,status])=>({label:transport.encoding.fieldLabels[label],value,status}))
   expect(restoredFields).toEqual(captured)
   expect((offer.rawTextLines as number[]).map(index=>transport.encoding.rawTextDictionary[index]).join('\n')).toBe('Dados AvantPro')
   expect(transport.logisticsBase).toBe(56)
   return JSON.stringify(interpretation)
  })
 })

})
