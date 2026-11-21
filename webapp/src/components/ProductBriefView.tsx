import { Package, Heart, CircleAlert, MessageCircle, Lightbulb } from 'lucide-react'
import type {ProductBrief} from '../../../shared/product-brief'
export function ProductBriefView({brief}:{brief:ProductBrief}){
 return <div className="product-brief">
  <section className="brief-summary"><span className="eyebrow">O PRODUTO EM POUCAS PALAVRAS</span><h2>O que é e para quem faz sentido</h2><p>{brief.summary}</p>{brief.audience&&<div><span>Indicado para</span><p>{brief.audience}</p></div>}<small>Atualizado em {new Date(brief.generatedAt).toLocaleDateString('pt-BR')}</small></section>
  <section className="brief-section"><h2><Package size={18}/>Características essenciais</h2>{brief.characteristics.length?<dl className="brief-specs">{brief.characteristics.map((x,i)=><div key={i}><dt>{x.name}</dt><dd>{x.value}</dd></div>)}</dl>:<p className="brief-empty">As características ainda não foram informadas nas fontes.</p>}</section>
  <div className="brief-opinions">
   <section className="brief-section"><h2><Heart size={18}/>O que os compradores valorizam</h2>{brief.benefits.length?<ul>{brief.benefits.map((x,i)=><li key={i}><strong>{x.text}</strong><p className="brief-evidence">{x.evidence}</p>{x.frequency&&<small>{x.frequency}</small>}</li>)}</ul>:<p className="brief-empty">Sem opiniões disponíveis para identificar elogios dos compradores.</p>}</section>
   <section className="brief-section"><h2><CircleAlert size={18}/>Pontos de atenção</h2>{brief.concerns.length?<ul>{brief.concerns.map((x,i)=><li key={i}><strong>{x.text}</strong><p className="brief-evidence">{x.evidence}</p>{x.frequency&&<small>{x.frequency}</small>}</li>)}</ul>:<p className="brief-empty">Sem relatos disponíveis para identificar problemas recorrentes.</p>}</section>
  </div>
  <section className="brief-section"><h2><MessageCircle size={18}/>Perguntas dos compradores</h2>{brief.questions.length?brief.questions.map((x,i)=><details key={i} className="brief-question"><summary>{x.question}</summary><p>{x.answer||'Resposta não disponível nas fontes. Confirme antes de informar ao comprador.'}</p><small>{x.evidence}</small></details>):<p className="brief-empty">Nenhuma pergunta foi fornecida. Acrescente perguntas e respostas para completar a ficha.</p>}</section>
  <section className="brief-section"><h2><Lightbulb size={18}/>Oportunidades de melhoria</h2>{brief.improvements.length?<ul>{brief.improvements.map((x,i)=><li key={i}><strong>{x.text}</strong><p className="brief-evidence">{x.basis}</p></li>)}</ul>:<p className="brief-empty">Ainda não há evidências suficientes para sugerir melhorias específicas.</p>}</section>
  {!!brief.limitations.length&&<aside className="brief-limitations"><h3>O que ainda falta saber</h3><ul>{brief.limitations.map((x,i)=><li key={i}>{x}</li>)}</ul></aside>}
 </div>
}
