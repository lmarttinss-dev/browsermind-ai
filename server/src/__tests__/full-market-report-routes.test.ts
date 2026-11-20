import { afterEach, describe, expect, it, vi } from 'vitest'
import express from 'express'
import request from 'supertest'
import pipelineRouter from '../routes/pipeline.js'
import { Product } from '../models/product.js'
import { fullDocument } from './fixtures/full-market-fixture.js'
vi.mock('../full-market-report-html.js',async importOriginal=>{
 const original=await importOriginal<typeof import('../full-market-report-html.js')>()
 return {...original,createFullMarketReportPdf:vi.fn(async()=>Buffer.from('%PDF-1.4\nmock'))}
})
const app=()=>express().use(express.json()).use('/pipeline',pipelineRouter)
afterEach(()=>vi.restoreAllMocks())
describe('HTML e PDF do relatório completo',()=>{
 it('rejeita documentos inválidos sem salvar ou exportar',async()=>{
  await request(app()).post('/pipeline/market-report/export-pdf').send({document:{version:1}}).expect(400)
  await request(app()).patch('/pipeline/id/market-report').send({report:'anterior',document:{version:1}}).expect(400)
 })
 it('salva juntos o documento validado e o conteúdo de compatibilidade',async()=>{
  const save=vi.spyOn(Product,'findByIdAndUpdate').mockResolvedValue({_id:'test'} as any)
  await request(app()).patch('/pipeline/id/market-report').send({report:'texto cliente',document:fullDocument}).expect(200)
  const update=save.mock.calls[0][1] as any
  expect(update.$set.marketDocument.version).toBe(1)
  expect(update.$set.marketReport).toContain('Análise de Frete da Categoria')
  expect(update.$set.marketReport).not.toBe('texto cliente')
 })
 it('limpa o documento anterior ao salvar um relatório legado',async()=>{
  const save=vi.spyOn(Product,'findByIdAndUpdate').mockResolvedValue({_id:'test'} as any)
  await request(app()).patch('/pipeline/id/market-report').send({report:'# Legado'}).expect(200)
  expect((save.mock.calls[0][1] as any).$set.marketDocument).toBeNull()
 })
 it('serve o mesmo documento para HTML e exportação PDF',async()=>{
  vi.spyOn(Product,'findById').mockReturnValue({select:vi.fn().mockResolvedValue({title:'Produto',marketReport:'compatibilidade',marketDocument:fullDocument})} as any)
  const html=await request(app()).get('/pipeline/id/market-report/html').expect(200).expect('Content-Type',/html/)
  expect(html.text).toContain('Percentual por valor de frete')
  expect(html.text.match(/class="report-section"/g)).toHaveLength(17)
  await request(app()).get('/pipeline/id/market-report/pdf').expect(200).expect('Content-Type',/pdf/)
  await request(app()).post('/pipeline/market-report/export-pdf').send({document:fullDocument}).expect(200).expect('Content-Type',/pdf/)
 })
 it('preserva relatórios antigos e responde 404 quando não existe análise',async()=>{
  const lookup=vi.spyOn(Product,'findById')
  lookup.mockReturnValueOnce({select:vi.fn().mockResolvedValue({title:'Salvo',marketReport:'# Original\n\nTexto preservado'})} as any)
  expect((await request(app()).get('/pipeline/id/market-report/html').expect(200)).text).toContain('Texto preservado')
  lookup.mockReturnValueOnce({select:vi.fn().mockResolvedValue(null)} as any)
  await request(app()).get('/pipeline/id/market-report/pdf').expect(404)
 })
})
