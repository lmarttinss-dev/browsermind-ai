import { useStore } from "@/store/useStore";
import { Globe, Monitor, ArrowUpRight, Sparkles, WifiOff } from "lucide-react";

export function BrowserViewport() {
  const { browserActive, screenshot, browserUrl, browserTitle, serverOnline } = useStore();
  const title = !serverOnline ? "Vamos conectar seu workspace" : !browserActive ? "Uma nova perspectiva começa aqui" : "Pronto para explorar";
  const description = !serverOnline ? "A conexão com o servidor está indisponível. Assim que ela voltar, você poderá continuar sua pesquisa." : !browserActive ? "Inicie o navegador, abra uma página e use o assistente ao lado para aprofundar sua pesquisa." : "Digite um endereço na barra acima. A prévia da página aparecerá neste espaço.";
  return <section className="browser-canvas" aria-label="Prévia do navegador">
    <div className="canvas-heading"><span><Globe size={14}/>{browserTitle || "Seu espaço de pesquisa"}</span><span className="canvas-state">{browserActive ? "Sessão ativa" : "Prévia da página"}</span></div>
    {serverOnline && browserActive && screenshot ? <div className="canvas-image"><img src={`data:image/png;base64,${screenshot}`} alt={`Prévia de ${browserTitle || browserUrl || "página aberta"}`} draggable={false}/></div> :
    <div className="browser-welcome"><div className="welcome-symbol">{!serverOnline ? <WifiOff size={32}/> : <Globe size={36}/>}</div><span className="eyebrow">NAVEGUE. EXPLORE. ENTENDA.</span><h2>{title}</h2><p>{description}</p>
    <div className="browser-steps"><div><span>01</span><Monitor size={18}/><strong>Abra uma página</strong><small>Seu ponto de partida</small></div><div><span>02</span><Sparkles size={18}/><strong>Converse com a IA</strong><small>Dê contexto à sua pesquisa</small></div><div><span>03</span><ArrowUpRight size={18}/><strong>Encontre respostas</strong><small>Avance com clareza</small></div></div></div>}
    <footer className="canvas-footer"><span><span className={browserActive ? "status-dot active" : "status-dot"}/>{browserActive ? "Navegador conectado" : "Aguardando conexão"}</span><span>Prévia de navegação</span></footer>
  </section>;
}
