import {describe,it,expect} from 'vitest'
import {compactMarketEvidence} from '../market-model-evidence.js'
import {reportEvidence} from './fixtures/full-market-fixture.js'
describe('transporte compacto das evidências AvantPro',()=>{
 it('preserva todas as ofertas, campos, status, texto bruto, selos e detalhes do frete',()=>{
  const evidence=structuredClone(reportEvidence)
  evidence.offers[0].fields.push({label:'Campo desconhecido',value:'Informação exclusiva da extensão'})
  evidence.offers[0].badges=['Selo exclusivo']
  const original=JSON.stringify(evidence)
  const compact=compactMarketEvidence(evidence)
  const columns=compact.encoding.offerColumns
  compact.offers.forEach((row,index)=>{
   const offer=Object.fromEntries(columns.map((key,i)=>[key,row[i]]))
   const fields=(offer.fields as unknown[][]).map(([label,value,status,extra])=>({...(extra as object||{}),label:compact.encoding.fieldLabels[label as number],value,status}))
   expect(fields).toEqual(evidence.offers[index].fields.map(field=>({...field,status:'status' in field?field.status:field.value===null?'unavailable':'ready'})))
   const raw=(offer.rawTextLines as number[]).map(id=>compact.encoding.rawTextDictionary[id]).join('\n')
   expect(raw).toBe(evidence.offers[index].avantproText)
   for(const [key,value] of Object.entries(evidence.offers[index]))if(!['fields','avantproText'].includes(key))expect(offer[key]).toEqual(value)
   expect(offer.shippingPositions).toEqual(evidence.shipping.offers[index].positions)
   expect(offer.shippingText).toBe(evidence.shipping.offers[index].text)
  })
  expect(JSON.stringify(evidence)).toBe(original)
  expect(compact.shipping).not.toHaveProperty('offers')
  expect(compact.logistics).toEqual(evidence.logistics)
  expect(compact.categoryMetrics).toEqual(evidence.categoryMetrics)
 })
 it('reduz o tamanho com rótulos repetidos sem descartar a cauda da amostra',()=>{
  const evidence=structuredClone(reportEvidence)
  evidence.offers=Array.from({length:60},(_,i)=>({...reportEvidence.offers[0],itemId:'MLB'+i,avantproText:reportEvidence.offers[0].avantproText+'\nCampo final '+i}))
  evidence.shipping.offers=Array.from({length:60},(_,i)=>({...reportEvidence.shipping.offers[0],itemId:'MLB'+i}))
  const compact=compactMarketEvidence(evidence)
  expect(compact.offers).toHaveLength(60)
  expect(compact.encoding.rawTextDictionary).toContain('Campo final 59')
  expect(JSON.stringify(compact).length).toBeLessThan(JSON.stringify(evidence).length*0.8)
 })
})
