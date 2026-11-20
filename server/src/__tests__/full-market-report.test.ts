import { describe, expect, it } from 'vitest'
import { FULL_MARKET_SECTIONS, SCORE_KEYS, buildFullMarketEvidence, composeFullMarketDocument, generateFullMarketReport, parseFullMarketInterpretation, validateFullMarketDocument, type MarketInterpretation } from '../full-market-report.js'
import { fullMarketReportHtml, legacyMarketReportHtml } from '../full-market-report-html.js'
import type { CompetitorListing } from '../competitor-listings.js'

import { reportEvidence, interpretation, fullDocument } from './fixtures/full-market-fixture.js'

describe('relatório HTML estruturado de mercado',()=>{
 it('calcula os indicadores, idade e percentuais sem duplicar ofertas',()=>{
  expect(reportEvidence.total).toBe(2)
  expect(reportEvidence.pricing).toMatchObject({min:20,max:30,median:25,mean:25})
  expect(reportEvidence.offers[0]).toMatchObject({ageDays:19,monthlyPace:60,estimatedSales:120})
  expect(reportEvidence.shipping.valueDistribution[0].sellerPercentage).toBe(50)
  expect(fullDocument.sections.map(section=>section.id)).toEqual(FULL_MARKET_SECTIONS.map(([id])=>id))
  expect(fullDocument.sections.find(section=>section.id==='score')?.tables[1].rows[0][1]).toBe('6')
 })
 it('exige todas as seções e rejeita respostas truncadas, notas inválidas e campos incompletos',()=>{
  expect(parseFullMarketInterpretation(JSON.stringify(interpretation))).toEqual(interpretation)
  expect(()=>parseFullMarketInterpretation('{')).toThrow()
  expect(()=>parseFullMarketInterpretation(JSON.stringify({...interpretation,sections:{}}))).toThrow()
  expect(()=>parseFullMarketInterpretation(JSON.stringify({...interpretation,scores:{...interpretation.scores,margem:12}}))).toThrow()
  expect(()=>buildFullMarketEvidence({title:'vazio',url:'',listings:[]})).toThrow()
 })
 it('valida o documento antes de salvar ou exportar',()=>{
  expect(validateFullMarketDocument(fullDocument)).toBe(fullDocument)
  expect(()=>validateFullMarketDocument({...fullDocument,sections:[]})).toThrow()
  const invalid=structuredClone(fullDocument);invalid.sections[0].tables[0].rows[0]=['Uma célula']
  expect(()=>validateFullMarketDocument(invalid)).toThrow()
  const badChart=structuredClone(fullDocument);badChart.sections[1].charts[0].items[0].value=-2
  expect(()=>validateFullMarketDocument(badChart)).toThrow()
 })
 it('gera HTML escapado com gráficos nativos e as 17 seções na ordem fixa',()=>{
  const html=fullMarketReportHtml(fullDocument)
  expect(html.match(/class="report-section"/g)).toHaveLength(17)
  expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
  expect(html).not.toContain('<script>')
  expect(html).not.toContain('mermaid')
  expect(html).toContain('<svg')
  expect(html).toContain('Percentual por valor de frete')
  expect(html).toContain('@media print')
 })
 it('preserva conteúdo anterior, bloqueia HTML/links perigosos e converte gráficos antigos',()=>{
  const html=legacyMarketReportHtml('# Anterior\n\n<script>alert(1)</script>\n\n[ruim](javascript:alert(1))\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n\x60\x60\x60mermaid\npie\n title "Frete"\n "R$ 6,85" : 3\n\x60\x60\x60','Salvo')
  expect(html).toContain('<table>');expect(html).toContain('<svg');expect(html).not.toContain('<script>');expect(html).not.toContain('href="javascript:')
 })
 it('mostra os valores de frete com vendedores e percentuais no mesmo gráfico nativo',()=>{
  const shipping=fullDocument.sections.find(section=>section.id==='shipping')!
  expect(shipping.charts[0]).toMatchObject({title:'Distribuição dos valores de frete',items:[{label:'R$ 6,85',value:1,percentage:50},{label:'R$ 6,95',value:1,percentage:50}]})
  expect(fullMarketReportHtml(fullDocument)).toContain('1 (50%)')
  const html=legacyMarketReportHtml('#### Percentual por Valor de Frete\n\n| Valor do frete | Vendedores únicos | % dos vendedores |\n|---|---|---|\n| R$ 6,85 | **15** | **35,7%** |','Salvo')
  expect(html).toContain('Distribuição dos valores de frete')
  expect(html).toContain('15 (35,7%)')
  expect(html).toContain('<svg')
 })
 it('usa o JSON validado da IA sem permitir que ela escolha o layout',async()=>{
  const doc=await generateFullMarketReport(reportEvidence,async(prompt,system)=>{
   expect(prompt).toContain('contract');expect(system).toContain('Não gere HTML');return JSON.stringify(interpretation)
  })
  expect(doc.sections).toHaveLength(17)
 })
})
