import {afterEach,expect,it,vi} from 'vitest'
import express from 'express'
import request from 'supertest'
import router from '../routes/pipeline.js'
import {Product} from '../models/product.js'
import {savedListingReportHtml} from '../full-market-report-html.js'
afterEach(()=>vi.restoreAllMocks())
it('renders listing sections and working summary without market-only additions',()=>{
 const html=savedListingReportHtml({title:'Anúncio',analysisReport:`## 📊 Qualidade do anúncio
Texto
## Oferta
Descrição`})
 expect(html).toContain('Análise do anúncio')
 expect(html).toContain('report-inline-icon')
 expect(html).toContain('href="#section-qualidade-do-anuncio"')
 expect(html).toContain('id="section-qualidade-do-anuncio"')
 expect(html).not.toContain('O relatório anterior foi salvo incompleto')
 expect(html).not.toContain('Sugestão de Precificação para Venda')
})
it('serves saved listing HTML and handles missing reports',async()=>{
 vi.spyOn(Product,'findById').mockReturnValue({select:vi.fn().mockResolvedValue({title:'Anúncio',analysisReport:`## Oferta
Conteúdo`})} as any)
 const app=express().use('/pipeline',router)
 const response=await request(app).get('/pipeline/id/analysis-report/html').expect(200)
 expect(response.text).toContain('Conteúdo')
 vi.mocked(Product.findById).mockReturnValue({select:vi.fn().mockResolvedValue({title:'Sem análise'})} as any)
 await request(app).get('/pipeline/id/analysis-report/html').expect(404)
})
