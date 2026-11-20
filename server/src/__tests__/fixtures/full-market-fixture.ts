import { FULL_MARKET_SECTIONS, SCORE_KEYS, buildFullMarketEvidence, composeFullMarketDocument, type MarketInterpretation } from '../../full-market-report.js'
import type { CompetitorListing } from '../../competitor-listings.js'
const offer = (id:string,seller:string,price:number,cost:number):CompetitorListing => ({itemId:id,catalogId:null,seller,title:'Produto <script>alert(1)</script>',positions:[1],url:'https://example.com/'+id,advertising:false,
  metrics:'Anúncio criado em\n01/11/2026\nVendas estimadas\n120\nRitmo atual (vendas/mês)\n60\nVendidos\n300',
  avantproShipping:{source:'AvantPro',text:'R$ '+cost,amount:cost},observed:{price,logistics:'Full',freeShipping:true,delivery:null,sponsored:false}})
export const reportEvidence=buildFullMarketEvidence({title:'Teste de relatório',url:'https://lista.mercadolivre.com.br/teste',analyzedAt:'2026-11-20T15:00:00Z',listings:[offer('MLB1','Loja A',20,6.85),offer('MLB2','Loja B',30,6.95),offer('MLB1','Loja A',20,6.85)]})
export const interpretation:MarketInterpretation={category:'Jogos e brinquedos',decision:'Entrar com plano',executiveSummary:'Compare custos e diferenciação antes de investir.',scores:Object.fromEntries(SCORE_KEYS.map(key=>[key,6])) as MarketInterpretation['scores'],
 sections:Object.fromEntries(FULL_MARKET_SECTIONS.map(([id])=>[id,{summary:'Analise as duas ofertas observadas antes de entrar.',findings:['Preços e fretes disponíveis na amostra.'],recommendations:['Simule custos completos antes de definir a oferta.']}])) as MarketInterpretation['sections']}
export const fullDocument=composeFullMarketDocument(reportEvidence,interpretation)
