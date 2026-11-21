import type { Page } from 'playwright'
/** Self-contained: executes only on a public Mercado Livre listing. */
export function readAvantproCaptureState() {
  const roots: (Document | ShadowRoot)[] = [document]
  const rows = document.querySelectorAll('.ui-search-layout__item')
  const cards = Array.from(rows.length ? rows : document.querySelectorAll('.poly-card, .ui-search-result')).filter(card => card.querySelector('.poly-component__title, .ui-search-item__title, a[href*="/MLB"], a[href*="/p/MLB"], a[href*="/up/MLB"]'))
  let cardsWithData = 0, pendingFields = 0, fields = 0, categoryFields = 0
  const signature: string[] = []
  const unavailableCards: number[] = []
  for (let i=0; i<cards.length; i++) {
    const cardRoots: (Element | ShadowRoot)[] = [cards[i]]
    let count = 0
    let explicitUnavailable = false
    while (cardRoots.length) {
      const root = cardRoots.pop()!
      root.querySelectorAll('.avantpro-product-info-row').forEach(row => {
        const label = row.querySelector('.avantpro-product-info-row-label')?.cloneNode(true) as Element | undefined
        label?.querySelectorAll('svg, [class*=tooltip]').forEach(element => element.remove())
        const name = (label?.textContent || '').replace(/\s+/g,' ').trim()
        if (!name) return
        const value = row.querySelector('.avantpro-product-info-row-value')
        const text = (value?.textContent || '').replace(/\s+/g,' ').trim()
        if (!value || !text || value.querySelector('[role=status], .avantpro-product-info-field-spinner, [aria-busy=true], .animate-spin') || /^(carregando|aguarde|\.\.\.)/i.test(text)) pendingFields++
        fields++; count++; signature.push(i+'|'+name+'|'+text)
      })
      root.querySelectorAll('.avantpro-product-container, .avantpro-product-info-container, [data-avantpro]').forEach(element => {
        signature.push('block|'+i+'|'+((element as HTMLElement).innerText || element.textContent || '').trim())
      })
      root.querySelectorAll('[class*=avantpro][aria-label], [class*=avantpro] [aria-label]').forEach(element => {
        signature.push('badge|'+i+'|'+element.getAttribute('aria-label'))
      })
      root.querySelectorAll('.avantpro-product-container [role=status], .avantpro-product-container .animate-spin').forEach(element => {
        if(!element.closest('.avantpro-product-info-row'))pendingFields++
      })
      root.querySelectorAll('.avantpro-panel-content__unavailable, .avantpro-product-info-error, [data-avantpro-status=unavailable]').forEach(element => {
        if (/não foi possível carregar|dados indisponíveis|dados não disponíveis/i.test(element.textContent || '')) explicitUnavailable = true
      })
      root.querySelectorAll('*').forEach(element => { if(element.shadowRoot)cardRoots.push(element.shadowRoot) })
    }
    if (count) cardsWithData++
    else if (explicitUnavailable) unavailableCards.push(i+1)
  }
  while (roots.length) {
    const root=roots.pop()!
    root.querySelectorAll('.avantpro-filter-card-label').forEach(element=>{
      const card=element.closest('.avantpro-filter-card')||element.parentElement
      const value=card?.querySelector('.avantpro-filter-card-value, .avantpro-produto-pro-badge-count')
      const text=(value?.textContent||'').replace(/\s+/g,' ').trim()
      if(!value||!text||value.querySelector('[role=status], [aria-busy=true], .animate-spin')||/^(carregando|aguarde|\.\.\.)/i.test(text))pendingFields++
      categoryFields++;signature.push('category|'+element.textContent+'|'+text)
    })
    root.querySelectorAll('*').forEach(element=>{if(element.shadowRoot)roots.push(element.shadowRoot)})
  }
  return { cards:cards.length,cardsWithData,unavailableCards,fields,categoryFields,pendingFields,signature:signature.join('\n') }
}
export type AvantproCaptureMetadata = { status:'complete'; capturedAt:string; rawCards:number; cardsWithData:number; explicitUnavailableCards:number[]; fields:number; categoryFields:number }
export async function captureCompleteAvantproPage<T extends object>(page:Page, extract:()=>Promise<T>, options:{timeout?:number;stableFor?:number;pollInterval?:number}={}):Promise<T & { avantproCapture:AvantproCaptureMetadata }> {
  const initialUrl=page.url()
  const url=new URL(initialUrl)
  if(url.protocol!=='https:'||url.hostname!=='lista.mercadolivre.com.br')throw new Error('Abra uma listagem pública de busca do Mercado Livre para capturar os dados AvantPro. Páginas da conta não são aceitas.')
  const deadline=Date.now()+(options.timeout??120000)
  const poll=options.pollInterval??300
  const stableFor=options.stableFor??900
  const scroll=await page.evaluate(()=>({x:window.scrollX,y:window.scrollY}))
  let last:ReturnType<typeof readAvantproCaptureState>|null=null
  try {
    const preferred=page.locator('.ui-search-layout__item')
    const cards=await preferred.count()?preferred:page.locator('.poly-card, .ui-search-result')
    let count=await cards.count()
    if(count>220)throw new Error('A listagem excede o limite de captura. Use uma página com até 200 anúncios distintos.')
    for(let i=0;i<count;i+=4){
      if(Date.now()>deadline)throw new Error('A captura AvantPro excedeu o prazo. O relatório não foi gerado.')
      if(page.url()!==initialUrl)throw new Error('A página mudou durante a captura. Aguarde a busca e gere a análise novamente.')
      await cards.nth(i).evaluate(element=>element.scrollIntoView({block:"center",behavior:"instant"}))
      await page.waitForTimeout(100)
      count=await cards.count()
      if(count>220)throw new Error('A listagem excede o limite de captura. Use uma página com até 200 anúncios distintos.')
    }
    if(page.url()!==initialUrl)throw new Error('A página mudou durante o carregamento AvantPro.')
    const loadAttempts:Record<string,number>={}
    const loadAvailableCards=async()=>{
      const clicked=await page.locator('button.avantpro-load-data-btn').evaluateAll((buttons,attempts)=>buttons.flatMap((element,index)=>{
        const button=element as HTMLButtonElement
        const key=button.closest('[data-slot]')?.getAttribute('data-slot')||'button-'+index
        if((attempts[key]||0)>=3||button.disabled||!/carregar dados avantpro/i.test(button.textContent||''))return []
        button.click();return [key]
      }),loadAttempts)
      for(const key of clicked)loadAttempts[key]=(loadAttempts[key]||0)+1
    }
    await loadAvailableCards()
    let nextLoad=Date.now()+5000
    let signature='', stableSince=Date.now()
    while(Date.now()<deadline){
      if(page.url()!==initialUrl)throw new Error('A página mudou durante a captura. O relatório anterior foi preservado.')
      if(Date.now()>=nextLoad){await loadAvailableCards();nextLoad=Date.now()+5000}
      last=await page.evaluate(readAvantproCaptureState)
      const ready=last.cards>0&&last.categoryFields>0&&last.pendingFields===0&&last.cardsWithData+last.unavailableCards.length===last.cards
      if(!ready||signature!==last.signature){signature=last.signature;stableSince=Date.now()}
      if(ready&&Date.now()-stableSince>=stableFor){
        const data=await extract()
        const after=await page.evaluate(readAvantproCaptureState)
        if(page.url()===initialUrl&&after.signature===signature&&after.pendingFields===0&&after.cards===last.cards){
          return {...data,avantproCapture:{status:'complete',capturedAt:new Date().toISOString(),rawCards:after.cards,cardsWithData:after.cardsWithData,explicitUnavailableCards:after.unavailableCards,fields:after.fields,categoryFields:after.categoryFields}}
        }
        stableSince=Date.now();signature=after.signature
      }
      await page.waitForTimeout(poll)
    }
    throw new Error('Captura AvantPro incompleta: '+(last?.pendingFields??0)+' campos carregando, '+Math.max(0,(last?.cards??0)-(last?.cardsWithData??0)-(last?.unavailableCards.length??0))+' anúncios sem dados e '+(last?.categoryFields??0)+' métricas de categoria. Aguarde a extensão e tente novamente; nenhuma análise parcial foi gerada.')
  } finally {
    if(page.url()===initialUrl)await page.evaluate(position=>window.scrollTo(position.x,position.y),scroll).catch(()=>{})
  }
}
