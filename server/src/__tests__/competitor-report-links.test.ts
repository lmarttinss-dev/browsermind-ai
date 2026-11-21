import {expect,it} from 'vitest'
import {fullMarketReportHtml} from '../full-market-report-html.js'
import {fullDocument} from './fixtures/full-market-fixture.js'
function documentWithTable(rowLinks?: (string|null)[]){
 const doc=structuredClone(fullDocument)
 doc.sections.find(s=>s.id==='competition')!.tables=[{title:'Ofertas concorrentes',columns:['ID','Título'],rows:[['MLB123456','Produto']],...(rowLinks?{rowLinks}:{})}]
 return doc
}
it('uses captured links for competitors',()=>{
 const html=fullMarketReportHtml(documentWithTable(['https://www.mercadolivre.com.br/produto/p/MLB123?wid=MLB123456']))
 expect(html).toContain('href="https://www.mercadolivre.com.br/produto/p/MLB123?wid=MLB123456"')
 expect(html).toContain('class="competitor-link"')
})
it('restores links from existing item IDs without regenerating reports',()=>{
 expect(fullMarketReportHtml(documentWithTable())).toContain('href="https://produto.mercadolivre.com.br/MLB-123456-_JM"')
})
it('does not render unsafe captured links',()=>{
 const html=fullMarketReportHtml(documentWithTable(['javascript:alert(1)']))
 expect(html).not.toContain('href="javascript:')
})

it('links Task 3 sellers to their captured offer, including saved reports',()=>{
 const doc=documentWithTable(['https://www.mercadolivre.com.br/p/MLB123'])
 doc.sections.find(s=>s.id==='competition')!.tables[0].columns=['ID','Vendedor']
 doc.sections.find(s=>s.id==='competition')!.tables[0].rows=[['MLB123456','Loja Exemplo']]
 doc.sections.find(s=>s.id==='concentration')!.tables=[{title:'Presença dos vendedores na amostra',columns:['Vendedor','Anúncios'],rows:[['Loja Exemplo',1],['Sem referência',1]]}]
 const html=fullMarketReportHtml(doc)
 expect(html).toContain('title="Abrir anúncio deste vendedor na amostra" href="https://www.mercadolivre.com.br/p/MLB123"')
 expect(html).toMatch(/>Loja Exemplo <svg[^>]*class="report-inline-icon"/)
 expect(html).toContain('<td>Sem referência</td>')
})
