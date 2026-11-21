import {afterAll,beforeAll,describe,expect,it,vi} from 'vitest'
import {chromium,type Browser,type Page} from 'playwright'
import {captureCompleteAvantproPage} from '../avantpro-capture.js'
import {extractCompetitorListings} from '../competitor-listings.js'
const fixture=(pending:boolean)=>'<div class="avantpro-filter-card"><span class="avantpro-filter-card-label">FULL</span><span class="avantpro-filter-card-value" id="category">'+(pending?'<span role="status">Carregando</span>':'27')+'</span></div><div class="ui-search-layout__item"><a class="poly-component__title" href="https://produto.mercadolivre.com.br/MLB-1001-produto">Produto</a><div class="avantpro-product-container"><div class="avantpro-product-info-row"><span class="avantpro-product-info-row-label">Frete<span class="tooltip">Texto da dica</span></span><span class="avantpro-product-info-row-value" id="freight">'+(pending?'<span role="status">Carregando</span>':'R$ 6,85')+'</span></div><div class="avantpro-product-info-row"><span class="avantpro-product-info-row-label">Estoque</span><span class="avantpro-product-info-row-value">120</span></div></div></div>'
describe('captura AvantPro obrigatória antes da geração',()=>{
 let browser:Browser;let page:Page
 beforeAll(async()=>{browser=await chromium.launch({headless:true,args:['--no-sandbox']})})
 afterAll(async()=>{await browser?.close()})
 async function open(html:string){page=await browser.newPage();await page.route('**/*',route=>route.fulfill({body:html,contentType:'text/html; charset=utf-8'}));await page.goto('https://lista.mercadolivre.com.br/teste')}
 it('só extrai após todos os campos e contadores terminarem de carregar e estabilizarem',async()=>{
  await open(fixture(true))
  await page.evaluate(()=>{setTimeout(()=>{document.querySelector('#freight')!.textContent='R$ 6,85'},260);setTimeout(()=>{document.querySelector('#category')!.textContent='27'},400)})
  const extract=vi.fn(async()=>({listings:await page.evaluate(extractCompetitorListings)}))
  const result=await captureCompleteAvantproPage(page,extract,{timeout:10000,stableFor:80,pollInterval:30})
  expect(result.avantproCapture).toMatchObject({status:'complete',rawCards:1,cardsWithData:1,fields:2,categoryFields:1})
  expect(result.listings[0].avantproFields).toContainEqual({label:'Estoque',value:'120',status:'ready'})
  expect(result.listings[0].avantproShipping?.amount).toBe(6.85)
  expect(extract).toHaveBeenCalledOnce();await page.close()
 },15000)
 it('bloqueia a extração e a análise se algum campo continua pendente',async()=>{
  await open(fixture(true));const extract=vi.fn(async()=>({}))
  await expect(captureCompleteAvantproPage(page,extract,{timeout:1200,stableFor:30,pollInterval:20})).rejects.toThrow('Captura AvantPro incompleta')
  expect(extract).not.toHaveBeenCalled();await page.close()
 })
 it('aceita ausência explicitamente informada, sem convertê-la em zero',async()=>{
  await open(fixture(false).replace('R$ 6,85','—'))
  const result=await captureCompleteAvantproPage(page,async()=>({listings:await page.evaluate(extractCompetitorListings)}),{timeout:1500,stableFor:40,pollInterval:20})
  expect(result.listings[0].avantproFields).toContainEqual({label:'Frete',value:null,status:'unavailable'})
  expect(result.listings[0].avantproShipping?.amount).toBeNull();await page.close()
 })
 it('aguarda também o conteúdo de outros módulos AvantPro fora das linhas padrão',async()=>{
  await open(fixture(false))
  await page.evaluate(()=>{const module=document.createElement('div');module.className='avantpro-product-info-container';module.innerHTML='<span id="revenue" role="status">Carregando</span>';document.querySelector('.avantpro-product-container')!.append(module);setTimeout(()=>{const value=document.querySelector('#revenue')!;value.removeAttribute('role');value.textContent='Faturamento do produto R$ 1.000,00'},260)})
  const result=await captureCompleteAvantproPage(page,async()=>({listings:await page.evaluate(extractCompetitorListings)}),{timeout:1800,stableFor:60,pollInterval:20})
  expect(result.listings[0].metrics).toContain('Faturamento do produto R$ 1.000,00')
  expect(result.avantproCapture.status).toBe('complete');await page.close()
 })
 it('não gera relatório sem os contadores de categoria carregados',async()=>{
  await open(fixture(false));await page.locator('.avantpro-filter-card').evaluate(element=>element.remove())
  const extract=vi.fn(async()=>({}))
  await expect(captureCompleteAvantproPage(page,extract,{timeout:1200,stableFor:30,pollInterval:20})).rejects.toThrow('0 métricas de categoria')
  expect(extract).not.toHaveBeenCalled();await page.close()
 })
 it('aciona Carregar dados Avantpro nos cards ainda não carregados',async()=>{
  await open(fixture(false))
  await page.evaluate(()=>{
    const container=document.querySelector('.avantpro-product-container')!
    container.innerHTML='<button class="avantpro-load-data-btn">Carregar dados Avantpro</button>'
    container.querySelector('button')!.addEventListener('click',()=>{setTimeout(()=>{container.innerHTML='<div class="avantpro-product-info-row"><span class="avantpro-product-info-row-label">Frete</span><span class="avantpro-product-info-row-value">R$ 6,85</span></div>'},120)})
  })
  const result=await captureCompleteAvantproPage(page,async()=>({listings:await page.evaluate(extractCompetitorListings)}),{timeout:1800,stableFor:60,pollInterval:20})
  expect(result.listings[0].avantproShipping?.amount).toBe(6.85)
  expect(result.avantproCapture.cardsWithData).toBe(1);await page.close()
 })
 it('carrega um botão que só aparece depois da primeira verificação',async()=>{
  await open(fixture(false))
  await page.evaluate(()=>{
    const container=document.querySelector('.avantpro-product-container')!
    container.textContent='Aguardando extensão'
    setTimeout(()=>{
      container.innerHTML='<button class="avantpro-load-data-btn">Carregar dados Avantpro</button>'
      container.querySelector('button')!.addEventListener('click',()=>{container.innerHTML='<div class="avantpro-product-info-row"><span class="avantpro-product-info-row-label">Frete</span><span class="avantpro-product-info-row-value">R$ 6,85</span></div>'})
    },500)
  })
  const result=await captureCompleteAvantproPage(page,async()=>({listings:await page.evaluate(extractCompetitorListings)}),{timeout:12000,stableFor:60,pollInterval:50})
  expect(result.listings[0].avantproShipping?.amount).toBe(6.85)
  expect(result.avantproCapture.cardsWithData).toBe(1);await page.close()
 },15000)
 it('reconhece o contador ProdutoPro que usa um seletor próprio',async()=>{
  await open(fixture(false)+'<button class="avantpro-filter-card"><span class="avantpro-filter-card-label">ProdutoPro</span><span class="avantpro-produto-pro-badge-count">0</span></button>')
  const result=await captureCompleteAvantproPage(page,async()=>({ok:true}),{timeout:1800,stableFor:60,pollInterval:20})
  expect(result.avantproCapture.categoryFields).toBe(2)
  expect(result.avantproCapture.status).toBe('complete');await page.close()
 })
 it('rejeita páginas de conta antes de ler qualquer DOM',async()=>{
  const fake={url:()=> 'https://www.mercadolivre.com.br/vendas'} as Page
  const extract=vi.fn(async()=>({}))
  await expect(captureCompleteAvantproPage(fake,extract)).rejects.toThrow('Páginas da conta')
  expect(extract).not.toHaveBeenCalled()
 })
})
