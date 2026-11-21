import { Marked, Renderer } from 'marked'
import { chromium } from 'playwright'
import { FULL_MARKET_SECTIONS, repairStoredMarketCatalog, repairStoredMarketLogistics, validateFullMarketDocument, type FullMarketDocument, type ReportChart, type ReportTable } from './full-market-report.js'
export const escapeReportText = (value: unknown) => String(value ?? 'Não informado').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[character]!)
const safeUrl = (value: string) => { try { const url = new URL(value); return /^https?:$/.test(url.protocol) ? url.href : null } catch { return null } }
const dateLabel = (value:string) => new Date(value).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})
const REPORT_STYLE = `
:root{color-scheme:light;font-family:Arial,Helvetica,sans-serif;color:#1b2435;background:#f2f4f9;font-synthesis:none}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font-size:14px;line-height:1.65}.report{max-width:1120px;margin:auto;padding:32px 34px 52px}h1,h2,h3,h4,p{margin-top:0}h1{font-size:34px;line-height:1.15;letter-spacing:-1.1px;max-width:800px;margin-bottom:16px}h2{font-size:23px;line-height:1.3;letter-spacing:-.45px;margin:0}h3{font-size:16px;line-height:1.4;margin:26px 0 12px}h4{font-size:13px;margin:20px 0 8px}a{color:#4f46e5;text-decoration:none;overflow-wrap:anywhere}a:hover{text-decoration:underline}.eyebrow{display:flex;align-items:center;gap:8px;letter-spacing:2px;font-weight:700;font-size:10px;color:#665cf0;text-transform:uppercase;margin-bottom:22px}.logo{background:#4f46e5;color:white;border-radius:8px;width:28px;height:28px;display:inline-flex;align-items:center;justify-content:center;font-size:14px;letter-spacing:0}.cover,.contents,.report-section,.sources{background:white;border:1px solid #e5e8ef;border-radius:16px;padding:32px;margin-bottom:22px}.cover{border-top:5px solid #4f46e5}.subtitle{font-size:15px;color:#647086;margin-bottom:8px}.meta{font-size:11px;color:#768197;overflow-wrap:anywhere}.badge{display:inline-block;background:#eeedff;color:#4338ca;border:1px solid #ddd9ff;border-radius:30px;padding:5px 13px;font-size:11px;font-weight:700}.executive{border-left:3px solid #4f46e5;background:#f7f7ff;border-radius:0 10px 10px 0;padding:20px;margin:26px 0}.executive p{margin:12px 0 0}.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:24px 0 12px}.metric{border:1px solid #e5e8ef;border-radius:10px;padding:17px 14px;min-width:0}.metric span{font-size:11px;color:#647086}.metric strong{display:block;font-size:25px;line-height:1.3;color:#222d45;margin:7px 0;overflow-wrap:anywhere}.metric small{display:block;font-size:10px;color:#7a8295}.contents h2{font-size:18px}.contents li{min-width:0;margin:0}.back-to-summary{display:inline-block;margin:8px 0 12px;font-size:11px;color:#6e65c4}section[id],h2[id],h3[id]{scroll-margin-top:20px}.contents ol{list-style:none;padding:0;margin:20px 0 0;display:grid;grid-template-columns:1fr 1fr;gap:8px 24px}.contents a{display:grid;grid-template-columns:24px minmax(0,1fr);align-items:start;gap:12px;height:100%;color:#465268;font-size:12px;border-bottom:1px solid #edf0f5;padding:7px 0}.contents a span{color:#6e65e5;font-size:10px;font-weight:bold;padding-top:2px}.section-head{display:flex;gap:16px;align-items:flex-start;margin-bottom:22px}.section-number{flex:none;width:38px;height:38px;border-radius:11px;color:#5147db;background:#eeedff;font-size:13px;font-weight:bold;display:flex;align-items:center;justify-content:center}.section-kicker{font-size:9px;letter-spacing:1.5px;color:#8b94a6;text-transform:uppercase;font-weight:bold;margin-bottom:4px}.lead{font-size:14px;color:#37445b;white-space:pre-line}.insights{padding:17px 20px;background:#f7f8fb;border-radius:10px;margin:18px 0}.insights h4{margin:0 0 8px;color:#3c4770}.recommendations{border-left:3px solid #8f88ed;padding-left:18px;margin-top:20px}.recommendations h4{color:#4f46e5}ul{padding-left:19px;margin:8px 0}li{margin:7px 0;overflow-wrap:anywhere}.table-block{margin:24px 0}.table-scroll{overflow-x:auto}table{width:100%;border-collapse:collapse;font-size:11px;line-height:1.5;text-align:left}thead{background:#f0f1f9;color:#4b5373}th{font-size:10px;font-weight:700;letter-spacing:.1px}th,td{padding:10px 11px;vertical-align:top;border-bottom:1px solid #e8ebf1;overflow-wrap:anywhere}tbody tr:nth-child(even){background:#fafbfe}th:first-child{border-radius:7px 0 0 0}th:last-child{border-radius:0 7px 0 0}.chart{border:1px solid #e7e9f2;border-radius:10px;padding:18px;margin:22px 0}.chart h3{margin:0 0 18px;font-size:13px}.chart svg{display:block;width:100%;height:auto}.chart text{font-family:Arial,Helvetica,sans-serif}.chart-note,.note{font-size:10px;color:#778298}.sources h2{font-size:17px}.sources li{font-size:11px;color:#667287}.footer{display:flex;justify-content:space-between;gap:15px;font-size:10px;color:#9199aa;padding:10px}.empty{color:#8b94a6}.legacy h1{font-size:29px}.legacy h2{font-size:22px;border-top:1px solid #e5e8ef;padding-top:26px;margin-top:32px}.legacy h3{font-size:17px}.legacy h4{font-size:14px}.legacy blockquote{border-left:3px solid #ada6f1;padding:12px 18px;margin:16px 0;background:#f8f7ff;color:#566078}.legacy pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:10px}.legacy table{margin:18px 0}.legacy img{display:none}
@media(max-width:700px){.report{padding:12px}.cover,.contents,.report-section,.sources{padding:21px;border-radius:12px}h1{font-size:27px}.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.contents ol{grid-template-columns:1fr}.metric strong{font-size:23px}h2{font-size:20px}th,td{padding:8px}.chart{padding:10px}}
@media print{@page{size:A4;margin:16mm 14mm 19mm}:root,body{background:white;color:#1b2435;font-size:10.5pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}.report{max-width:none;padding:0;margin:0}.cover,.contents,.report-section,.sources{padding:0;border:0;border-radius:0;margin:0 0 28px}.cover{border-top:4px solid #4f46e5;padding-top:20px;break-after:page}.contents{break-after:page}.report-section{break-before:auto;padding-top:18px}.report-section[id="demand"],.report-section[id="competition"]{break-before:page}.report-section:not(:has(.table-block)):not(:has(.chart)){break-inside:avoid}.sources{break-before:auto}.section-head{break-after:avoid}h1{font-size:28pt}h2{font-size:20pt}h3{font-size:12pt;break-after:avoid}h4{break-after:avoid}.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.metric strong{font-size:23pt}.metric{padding:15px}.lead{font-size:10.5pt}.executive,.metrics,.insights,.chart{break-inside:avoid}.contents ol{display:block;columns:2;column-gap:26px}.contents li{break-inside:avoid;margin:0}.contents a{font-size:10pt;padding:8px 0}.table-scroll{overflow:visible}table{font-size:8pt;table-layout:auto}th{font-size:8pt}th,td{padding:7px 6px}thead{display:table-header-group}tr{break-inside:avoid}.table-block{break-inside:auto}.chart{padding:14px}p,li{orphans:3;widows:3}.footer,.back-to-summary{display:none}a{color:#4f46e5;text-decoration:none}.legacy{font-size:10pt}.legacy h2{break-after:avoid}.legacy table{font-size:8pt}}
`
function shell(title:string,body:string){return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'"><title>${escapeReportText(title)}</title><style>${REPORT_STYLE}</style></head><body><main class="report">${body}<div class="footer"><span>BrowserMind AI · Inteligência de mercado</span><span>Dados AvantPro · Análise da amostra capturada</span></div></main></body></html>`}
export function reportChartHtml(chart:ReportChart){
  const items=chart.items.filter(item=>Number.isFinite(item.value)&&item.value>0)
  if(!items.length)return ''
  const max=Math.max(...items.map(item=>item.value));const width=800,height=items.length*29+12
  return `<figure class="chart"><h3>${escapeReportText(chart.title)}</h3><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeReportText(chart.title)}">${items.map((item,i)=>{const y=i*29+6;const length=item.value/max*430;return `<text x="0" y="${y+14}" font-size="11" fill="#5c6780">${escapeReportText(item.label)}</text><rect x="235" y="${y}" width="430" height="19" rx="4" fill="#f0f1f8"/><rect x="235" y="${y}" width="${length}" height="19" rx="4" fill="${i%2?'#8e87ec':'#5548dd'}"/><text x="680" y="${y+14}" font-size="11" fill="#303b54">${escapeReportText(item.value.toLocaleString('pt-BR',{maximumFractionDigits:1})+(item.percentage!=null?' ('+item.percentage.toLocaleString('pt-BR',{maximumFractionDigits:1})+'%)':''))}</text>`}).join('')}</svg><div class="chart-note">Unidade: ${escapeReportText(chart.unit)} · Valores observados na amostra</div>${chart.note?`<div class="chart-note">${escapeReportText(chart.note)}</div>`:''}</figure>`
}
function reportTableHtml(table:ReportTable){return `<div class="table-block"><h3>${escapeReportText(table.title)}</h3><div class="table-scroll"><table><thead><tr>${table.columns.map(column=>`<th scope="col">${escapeReportText(column)}</th>`).join('')}</tr></thead><tbody>${table.rows.length?table.rows.map(row=>`<tr>${row.map(cell=>`<td>${cell===null?'<span class="empty">Não informado</span>':escapeReportText(cell)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${table.columns.length}" class="empty">Não informado na captura.</td></tr>`}</tbody></table></div></div>`}
type ContentsEntry = { id: string; title: string; level: number }
function reportContents(entries: ContentsEntry[]) {
 if (!entries.length) return ''
 return `<nav class="contents" id="report-summary" aria-label="Sumário"><h2>Sumário</h2><ol>${entries.map((entry,i)=>`<li class="${entry.level===3?'subsection':''}"><a href="#${entry.id}"><span>${String(i+1).padStart(2,'0')}</span>${escapeReportText(entry.title)}</a></li>`).join('')}</ol></nav>`
}
const backToSummary = '<a class="back-to-summary" href="#report-summary">Voltar ao sumário ↑</a>'
function normalizeSectionTitle(title: string) { return title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim() }
export function fullMarketReportHtml(value:FullMarketDocument){
 const doc=repairStoredMarketCatalog(repairStoredMarketLogistics(validateFullMarketDocument(value)));const url=safeUrl(doc.sourceUrl)
 return shell(doc.title,`<header class="cover"><div class="eyebrow"><span class="logo">B</span> BrowserMind AI · Relatório estratégico</div><h1>${escapeReportText(doc.title)}</h1><p class="subtitle">${escapeReportText(doc.category)}</p><p class="meta">Análise de ${escapeReportText(dateLabel(doc.analyzedAt))} · Horário de Brasília</p>${url?`<p class="meta">Fonte: <a href="${escapeReportText(url)}" target="_blank" rel="noopener noreferrer">Listagem analisada</a></p>`:''}<div class="executive"><span class="badge">${escapeReportText(doc.decision)}</span><p>${escapeReportText(doc.executiveSummary)}</p></div><div class="metrics">${doc.indicators.map(metric=>`<div class="metric"><span>${escapeReportText(metric.label)}</span><strong>${escapeReportText(metric.value)}</strong><small>${escapeReportText(metric.note)}</small></div>`).join('')}</div><p class="note">Dados observados e cálculos da aplicação. Interpretação estratégica produzida por IA.</p></header>
 ${reportContents(doc.sections)}
 ${doc.sections.map((section,i)=>`<section class="report-section" id="${section.id}"><div class="section-head"><span class="section-number">${String(i+1).padStart(2,'0')}</span><div><div class="section-kicker">${section.level===3?'Perfil da categoria':'Análise estratégica'}</div><h2>${escapeReportText(section.title)}</h2></div></div><p class="lead">${escapeReportText(section.summary)}</p>${section.tables.map(reportTableHtml).join('')}${section.charts.map(reportChartHtml).join('')}${section.findings.length?`<div class="insights"><h4>Leitura dos dados</h4><ul>${section.findings.map(item=>`<li>${escapeReportText(item)}</li>`).join('')}</ul></div>`:''}${section.recommendations.length?`<div class="recommendations"><h4>Próximos passos</h4><ul>${section.recommendations.map(item=>`<li>${escapeReportText(item)}</li>`).join('')}</ul></div>`:''}${backToSummary}</section>`).join('')}
 <section class="sources"><h2>Fontes, cobertura e limites</h2><ul>${doc.limitations.map(item=>`<li>${escapeReportText(item)}</li>`).join('')}</ul></section>`)
}
function freightValueChart(columns:string[], rows:string[][]):ReportChart|null {
 const clean=(value:string)=>value.replace(/\*\*/g,'').trim()
 const headers=columns.map(column=>clean(column).toLocaleLowerCase('pt-BR'))
 const amount=headers.findIndex(label=>/valor.*frete|^valor$/.test(label))
 const count=headers.findIndex(label=>label.includes('vendedores')&&!label.includes('%'))
 const percent=headers.findIndex(label=>label.includes('vendedores')&&label.includes('%'))
 if(amount<0||count<0||percent<0)return null
 const items=rows.flatMap(row=>{
  const label=clean(row[amount]||'');const value=Number(clean(row[count]||'').replace(/\./g,''))
  const percentage=Number(clean(row[percent]||'').replace('%','').replace(',','.'))
  if(!/^R\$/.test(label)||!Number.isFinite(value)||value<=0)return []
  return [{label,value,percentage:Number.isFinite(percentage)&&percentage>=0&&percentage<=100?percentage:null}]
 })
 return items.length?{title:'Distribuição dos valores de frete',items,unit:'vendedores únicos com frete informado',note:'Percentuais conforme a tabela AvantPro. Um vendedor pode aparecer em mais de um valor.'}:null
}
function legacyChart(code:string){
 const title=code.match(/title\s+"([^"\n]+)"/)?.[1]||code.match(/title\s+([^\n]+)/)?.[1]||'Distribuição observada'
 if(/^\s*pie\b/.test(code)){
  const items=[...code.matchAll(/^\s*"([^"\n]+)"\s*:\s*(\d+(?:\.\d+)?)/gm)].map(match=>({label:match[1],value:Number(match[2])}))
  if(items.length)return reportChartHtml({title,items,unit:'valor informado no relatório anterior'})
 }
 if(/^\s*xychart(?:-beta)?\b/.test(code)){
  const labels=code.match(/x-axis\s*\[([^\]]+)\]/)?.[1].split(',').map(label=>label.trim().replace(/^"|"$/g,''))
  const values=code.match(/bar\s*\[([^\]]+)\]/)?.[1].split(',').map(Number)
  if(labels&&values&&labels.length===values.length&&values.every(value=>Number.isFinite(value)&&value>=0))return reportChartHtml({title,items:labels.map((label,i)=>({label,value:values[i]})),unit:'valor informado no relatório anterior'})
 }
 return '<p class="note">Gráfico anterior indisponível. Consulte os valores nas tabelas desta seção.</p>'
}
export function legacyMarketReportHtml(markdown:string,title:string,referencePrice?:number){
 const entries: ContentsEntry[] = []
 const priceMetrics = new Map<string,string>()
 const usedIds = new Map<string,number>()
 const standardRenderer=new Renderer()
 const parser=new Marked({gfm:true,breaks:false,renderer:{
  heading(token){
   const title=token.text.replace(/\*\*|__|`/g,'').trim()
   const normalized=normalizeSectionTitle(title)
   const known=FULL_MARKET_SECTIONS.find(([,label])=>normalized===normalizeSectionTitle(label)||normalized.startsWith(normalizeSectionTitle(label)+' '))
   const listed=token.depth===2||token.depth===3&&!!known
   if(!listed)return standardRenderer.heading.call(this,token)
   const base=known?.[0]||'section-'+normalized.replace(/ /g,'-').slice(0,100)||'section'
   const occurrence=(usedIds.get(base)||0)+1;usedIds.set(base,occurrence)
   const id=base+(occurrence>1?'-'+occurrence:'')
   entries.push({id,title,level:known?.[2]||token.depth})
   return `<h${token.depth} id="${id}">${this.parser.parseInline(token.tokens)}</h${token.depth}>${backToSummary}`
  },
  table(token){
   const headers=token.header.map(cell=>normalizeSectionTitle(cell.text))
   if(headers[0]&&/metrica|indicador/.test(headers[0])&&headers[1]?.includes('valor')){
    for(const row of token.rows){
     const label=normalizeSectionTitle(row[0]?.text||'')
     const value=(row[1]?.text||'').replace(/\*\*|__/g,'').trim()
     const key=/^menor preco|^preco minimo/.test(label)?'min':/^maior preco|^preco maximo/.test(label)?'max':/^preco mediano|^mediana$/.test(label)?'median':/^preco medio|^media de precos/.test(label)?'mean':null
     if(key&&/^R\$\s*\d[\d.]*,\d{2}$/.test(value)&&!priceMetrics.has(key))priceMetrics.set(key,value)
    }
   }
   const table=standardRenderer.table.call(this,token);const chart=freightValueChart(token.header.map(cell=>cell.text),token.rows.map(row=>row.map(cell=>cell.text)));return table+(chart?reportChartHtml(chart):'')
  },
  html({text}){return escapeReportText(text)},
  image({text}){return `<span>${escapeReportText(text)}</span>`},
  link({href,tokens}){const label=this.parser.parseInline(tokens);if(href.startsWith('#')&&/^#[a-zA-Z0-9_-]+$/.test(href))return `<a href="${escapeReportText(href)}">${label}</a>`;const url=safeUrl(href);return url?`<a href="${escapeReportText(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`:label},
  code({text,lang}){return lang?.trim()==='mermaid'?legacyChart(text):`<pre><code>${escapeReportText(text)}</code></pre>`},
 }})
 const repaired=markdown.replace(/^\x60\x60\x60mermaid[^\n]*\n(?:(?!\x60\x60\x60)[\s\S])*?\x60\x60\x60mermaid[^\n]*\n/gm,'\x60\x60\x60mermaid\n')
 const content=parser.parse(repaired,{async:false}) as string
 const extraSections:string[]=[]
 const price=(key:string)=>priceMetrics.get(key)||'Não informado na captura salva'
 const ownPrice=typeof referencePrice==='number'&&Number.isFinite(referencePrice)&&referencePrice>0?referencePrice.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}).replace(/\u00a0/g,' '):'Não informado'
 if(!entries.some(entry=>entry.id==='pricing')){
  entries.push({id:'pricing',title:'Estratégia de Precificação',level:2})
  extraSections.push('<h2 id="pricing">Estratégia de Precificação</h2>'+backToSummary+'<p>O relatório anterior foi salvo incompleto. As referências abaixo usam somente os preços registrados na própria captura e o cadastro do produto; não são uma nova pesquisa de mercado.</p>'+reportTableHtml({title:'Referências de preço disponíveis',columns:['Indicador','Valor','Fonte'],rows:[['Menor preço observado',price('min'),'AvantPro - captura salva'],['Maior preço observado',price('max'),'AvantPro - captura salva'],['Preço mediano',price('median'),'Captura salva; não inferido a partir dos extremos'],['Preço médio',price('mean'),'Captura salva; não inferido a partir dos extremos'],['Preço do produto cadastrado',ownPrice,'Cadastro do produto']]}))
 }
 if(!entries.some(entry=>entry.id==='suggestedPricing')){
  entries.push({id:'suggestedPricing',title:'Sugestão de Precificação para Venda',level:2})
  extraSections.push('<h2 id="suggestedPricing">Sugestão de Precificação para Venda</h2>'+backToSummary+reportTableHtml({title:'Referências para definir o posicionamento',columns:['Posicionamento','Referência observada','Condição'],rows:[['Faixa de entrada',price('min'),'Comparar a oferta e validar os custos antes de competir pelo menor preço'],['Posicionamento central',price('median'),'Exige a mediana dos anúncios; não usar o ponto médio entre mínimo e máximo'],['Faixa superior',price('max'),'Exige diferenciação; o maior preço observado não comprova demanda'],['Preço mínimo viável','Não calculável apenas com a listagem','Informar custo do produto, comissão, impostos, embalagem, despesas e frete na calculadora']]} )+'<p class="note">Os valores são referências da concorrência, não preços recomendados com margem garantida. Valide o preço de venda na calculadora do produto antes de definir a oferta.</p>')
 }
 return shell(title,`<header class="cover"><div class="eyebrow"><span class="logo">B</span> BrowserMind AI · Análise de mercado</div><h1>${escapeReportText(title)}</h1><p class="meta">Relatório salvo anteriormente. Conteúdo original preservado.</p></header>${reportContents(entries)}<article class="report-section legacy">${content}${extraSections.join('')}</article>`)
}
export function savedMarketReportHtml(product:{title:string;marketReport?:string;marketDocument?:unknown;price?:number}){
 if(product.marketDocument)return fullMarketReportHtml(validateFullMarketDocument(product.marketDocument))
 if(!product.marketReport?.trim())throw new Error('Este produto ainda não possui relatório de mercado.')
 return legacyMarketReportHtml(product.marketReport,product.title,product.price)
}
export async function createFullMarketReportPdf(html:string):Promise<Buffer>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']})
 try{
  const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage()
  await page.route('**/*',route=>route.abort());await page.setContent(html,{waitUntil:'load',timeout:15000})
  return await page.pdf({format:'A4',printBackground:true,preferCSSPageSize:true,displayHeaderFooter:true,
   headerTemplate:'<span></span>',footerTemplate:'<div style="font:9px Arial;color:#8a91a0;width:100%;margin:0 14mm;display:flex;justify-content:space-between;border-top:1px solid #e5e8ef;padding-top:8px"><span>BrowserMind AI · Análise de mercado</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',margin:{top:'16mm',bottom:'19mm',left:'14mm',right:'14mm'}})
 }finally{await browser.close()}
}
