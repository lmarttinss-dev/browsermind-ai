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
 it('aceita um JSON completo com texto de apresentação sem inferir dados ausentes',()=>{
  expect(parseFullMarketInterpretation('Segue a análise:\n'+JSON.stringify(interpretation)+'\nFim.')).toEqual(interpretation)
  expect(()=>parseFullMarketInterpretation('Segue: {"category":"teste"}')).toThrow()
 })
 it('corrige automaticamente uma resposta inválida usando a mesma captura',async()=>{
  const requests:string[]=[]
  const doc=await generateFullMarketReport(reportEvidence,async prompt=>{requests.push(prompt);return requests.length===1?'JSON truncado {':JSON.stringify(interpretation)})
  expect(requests).toHaveLength(2)
  const retry=JSON.parse(requests[1])
  expect(retry.request.evidence).toEqual(JSON.parse(requests[0]).evidence)
  expect(retry.formatCorrection.previousResponse).toBe('JSON truncado {')
  expect(doc.sections).toHaveLength(17)
 })
 it('limita a correção de formato e continua rejeitando seções incompletas',async()=>{
  let calls=0
  await expect(generateFullMarketReport(reportEvidence,async()=>{calls++;return '{}'})).rejects.toThrow('correção automática')
  expect(calls).toBe(2)
 })
 it('não repete uma chamada que falhou no provedor',async()=>{
  let calls=0
  await expect(generateFullMarketReport(reportEvidence,async()=>{calls++;throw new Error('Provedor indisponível')})).rejects.toThrow('Provedor indisponível')
  expect(calls).toBe(1)
 })
 it('aceita o envelope de contrato sem gastar outra chamada e mantém a validação completa',async()=>{
  let calls=0
  const doc=await generateFullMarketReport(reportEvidence,async()=>{calls++;return JSON.stringify({contract:interpretation})})
  expect(calls).toBe(1);expect(doc.sections).toHaveLength(17)
  expect(()=>parseFullMarketInterpretation(JSON.stringify({contract:{category:'Incompleto'}}))).toThrow()
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
 it('cria sumário com destinos únicos para as seções novas e anteriores',()=>{
  const html=fullMarketReportHtml(fullDocument)
  expect(html).toContain('id="report-summary"')
  for(const section of fullDocument.sections){expect(html).toContain('href="#'+section.id+'"');expect(html).toContain('id="'+section.id+'"')}
  expect(html).toContain('Voltar ao sumário')
  const previous=legacyMarketReportHtml('## 📊 Métricas da Categoria (AvantPro)\nDados\n### 🚚 Análise de Frete da Categoria\nFretes\n## Conclusão Executiva\nConclusão\n## Conclusão Executiva\nComplemento','Salvo')
  for(const id of ['metrics','shipping','conclusion','conclusion-2']){expect(previous).toContain('href="#'+id+'"');expect(previous).toContain('id="'+id+'"')}
  expect(previous).toContain('<h2>Sumário</h2>')
 })
 it('completa a precificação de relatórios interrompidos apenas com referências disponíveis',()=>{
  const report='## Métricas da Categoria (AvantPro)\n\n| Métrica | Valor |\n|---|---|\n| Menor Preço | **R$ 17,49** |\n| Maior Preço | **R$ 99,39** |\n\n## Tarefa 1 - Análise da Demanda\nRelatório interrompido'
  const html=legacyMarketReportHtml(report,'Produto',30.69)
  expect(html).toContain('id="pricing"');expect(html).toContain('id="suggestedPricing"')
  expect(html).toContain('href="#pricing"');expect(html).toContain('R$ 17,49');expect(html).toContain('R$ 99,39');expect(html).toContain('R$ 30,69')
  expect(html).toContain('Não informado na captura salva')
  expect(html).not.toContain('R$ 58,44')
  const complete=legacyMarketReportHtml(report+'\n## Estratégia de Precificação\nTexto preservado\n## Sugestão de Precificação para Venda\nSugestão preservada','Produto')
  expect(complete.match(/id="pricing"/g)).toHaveLength(1)
  expect(complete).toContain('Texto preservado');expect(complete).not.toContain('Referências de preço disponíveis')
 })
 it('usa o JSON validado da IA sem permitir que ela escolha o layout',async()=>{
  const doc=await generateFullMarketReport(reportEvidence,async(prompt,system)=>{
   expect(prompt).toContain('contract');expect(system).toContain('Não gere HTML');return JSON.stringify(interpretation)
  })
  expect(doc.sections).toHaveLength(17)
 })
})
