import {expect,it} from 'vitest'
import {selectTopCompetitors,type FocusOffer} from '../top-competitors.js'
import {withTopCompetitors,fullMarketReportHtml} from '../full-market-report-html.js'
import {fullDocument} from './fixtures/full-market-fixture.js'
const offer=(id:string,seller:string|null,pace:number|null):FocusOffer=>({itemId:id,seller,monthlyPace:pace,title:id,url:'https://example.com/'+id,price:10,ageDays:30,logistics:'Full'})
it('ranks monthly pace and diversifies sellers rather than filling with duplicates',()=>{
 const result=selectTopCompetitors([offer('a',' Loja A ',10),offer('b','loja a',100),offer('c','B',90),offer('d',null,500),offer('e','E',null),offer('f','F',0)])
 expect(result.map(o=>o.itemId)).toEqual(['b','c'])
})
it('selects at most five and deterministically breaks ties',()=>{
 const rows=Array.from({length:8},(_,i)=>offer(String(i),String(i),50))
 expect(selectTopCompetitors(rows.reverse()).map(o=>o.itemId)).toEqual(['0','1','2','3','4'])
})
it('adds focus inside competition without new sections or modifying saved input',()=>{
 const doc=withTopCompetitors(fullDocument)
 expect(doc.sections).toHaveLength(fullDocument.sections.length)
 const competition=doc.sections.find(s=>s.id==='competition')!
 expect(competition.tables[0].title).toBe('Até 5 anúncios para estudar')
 expect(competition.tables[0].rows).toHaveLength(2)
 expect(fullDocument.sections.find(s=>s.id==='competition')!.tables[0].title).toBe('Ofertas concorrentes')
 expect(withTopCompetitors(doc).sections.find(s=>s.id==='competition')!.tables).toHaveLength(competition.tables.length)
 expect(fullMarketReportHtml(fullDocument)).toContain('Até 5 anúncios para estudar')
})
it('explains missing monthly data without using lifetime or periodless estimates',()=>{
 const doc=structuredClone(fullDocument)
 doc.sections.find(s=>s.id==='demand')!.tables.find(t=>t.title==='Idade dos anúncios e tração de vendas')!.rows.forEach(row=>{row[5]='Não informado';row[6]='99999'})
 const focused=withTopCompetitors(doc).sections.find(s=>s.id==='competition')!
 expect(focused.tables[0].rows).toEqual([])
 expect(focused.tables[1].rows.some(row=>row[0]==='Sem seleção')).toBe(true)
})
