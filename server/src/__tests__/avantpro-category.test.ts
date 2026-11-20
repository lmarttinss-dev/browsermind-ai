import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser, type Page } from 'playwright'
import { extractAvantproCategoryFields } from '../avantpro-category.js'
describe('métricas agregadas AvantPro',()=>{
 let browser:Browser;let page:Page
 beforeAll(async()=>{browser=await chromium.launch({headless:true,args:['--no-sandbox']});page=await browser.newPage()})
 afterAll(async()=>{await browser?.close()})
 it('preserva as métricas do cabeçalho, remove tooltip e lê Shadow DOM sem duplicar',async()=>{
  await page.setContent('<div class="avantpro-filter-card"><span class="avantpro-filter-card-label">Full<span class="tooltip">Dica oculta</span></span><span class="avantpro-filter-card-value">26</span></div><div id="shadow"></div>')
  await page.evaluate(()=>{document.querySelector('#shadow')!.attachShadow({mode:'open'}).innerHTML='<div class="avantpro-filter-card"><span class="avantpro-filter-card-label">Full</span><span class="avantpro-filter-card-value">26</span></div><div class="avantpro-filter-card"><span class="avantpro-filter-card-label">Vendedores</span><span class="avantpro-filter-card-value">44</span></div>'})
  expect(await page.evaluate(extractAvantproCategoryFields)).toEqual([{label:'Full',value:'26'},{label:'Vendedores',value:'44'}])
 })
})
