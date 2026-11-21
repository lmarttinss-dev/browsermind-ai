import {describe,it,expect} from 'vitest'
import {classifyAvantproCatalog,summarizeAvantproCatalog} from '../avantpro-catalog.js'
import {repairStoredMarketCatalog,validateFullMarketDocument} from '../full-market-report.js'
import {fullDocument} from './fixtures/full-market-fixture.js'
describe('catálogo exclusivamente pelo AvantPro',()=>{
 const fields=[{label:'Em Catálogo',value:'24'},{label:'Fora Catálogo',value:'36'}]
 it('prioriza os 60 registros AvantPro sobre as ofertas deduplicadas',()=>{
  const result=summarizeAvantproCatalog(fields,Array(51).fill('inCatalog'))
  expect(result).toMatchObject({inCatalog:24,outsideCatalog:36,base:60,scope:'category',percentagesAvailable:true})
 })
 it('classifica pelos módulos AvantPro e preserva o desconhecido',()=>{
  expect(classifyAvantproCatalog('',[{label:'Vendas do catálogo'},{label:'Atual ganhador'}])).toBe('inCatalog')
  expect(classifyAvantproCatalog('',[{label:'Vendas do produto'},{label:'Nome do vendedor'}])).toBe('outsideCatalog')
  expect(classifyAvantproCatalog('Frete\nR$ 6,85')).toBe('unknown')
  expect(summarizeAvantproCatalog([],['inCatalog','outsideCatalog','unknown'])).toMatchObject({inCatalog:1,outsideCatalog:1,unknown:1,base:3})
 })
 it('não transforma contador ausente em zero nem calcula percentuais parciais',()=>{
  expect(summarizeAvantproCatalog(fields.slice(0,1),[])).toMatchObject({inCatalog:24,outsideCatalog:null,percentagesAvailable:false})
  expect(summarizeAvantproCatalog([{label:'Em Catálogo',value:'0'},{label:'Fora de Catálogo',value:'10'}],[])).toMatchObject({inCatalog:0,outsideCatalog:10,base:10})
 })
 it('não escolhe arbitrariamente entre contadores conflitantes',()=>{
  const result=summarizeAvantproCatalog([...fields,{label:'Em Catálogo',value:'25'}],[])
  expect(result).toMatchObject({inCatalog:null,outsideCatalog:36,percentagesAvailable:false,conflicts:['Em catálogo']})
 })
 it('repara tabela e gráfico salvos com os mesmos contadores sem alterar outras seções',()=>{
  const old=structuredClone(fullDocument)
  old.sections.find(s=>s.id==='metrics')!.tables[0].rows.push(...fields.map(f=>[f.label+' (AvantPro)',f.value]))
  old.sections.find(s=>s.id==='account')!.tables=[{title:'Estrutura de catálogo',columns:['Estrutura','Anúncios','%'],rows:[['Em catálogo',48,'94,12%'],['Fora de catálogo',3,'5,88%']]}]
  const fixed=repairStoredMarketCatalog(old),account=fixed.sections.find(s=>s.id==='account')!
  expect(account.tables[0].rows).toEqual([['Em catálogo',24,'40%'],['Fora de catálogo',36,'60%']])
  expect(account.charts[0].items).toEqual([{label:'Em catálogo',value:24,percentage:40},{label:'Fora de catálogo',value:36,percentage:60}])
  expect(validateFullMarketDocument(fixed)).toBe(fixed)
  expect(fixed.sections.filter(s=>s.id!=='account')).toEqual(old.sections.filter(s=>s.id!=='account'))
  expect(repairStoredMarketCatalog(fixed)).toBe(fixed)
 })
})
