import { useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Layers3, LayoutDashboard, BarChart3, Kanban, Tags, Building2, Calculator, Globe, Settings, Menu, X, ChevronRight, ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import { useStore } from "@/store/useStore";

const destinations = [
  { to: "/", label: "Visão geral", icon: LayoutDashboard, group: "Workspace" },
  { to: "/market-analysis", label: "Panorama de mercado", icon: BarChart3, group: "Pesquisa" },
  { to: "/pipeline", label: "Esteira de produtos", icon: Kanban, group: "Pesquisa" },
  { to: "/categories", label: "Categorias", icon: Tags, group: "Pesquisa" },
  { to: "/supplier-analysis", label: "Fornecedores", icon: Building2, group: "Ferramentas" },
  { to: "/calculator", label: "Calculadora de importação", icon: Calculator, group: "Ferramentas" },
  { to: "/browser", label: "Assistente de navegação", icon: Globe, group: "Ferramentas" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const online = useStore(s => s.serverOnline);
  const setShowSettings = useStore(s => s.setShowSettings);
  const current = destinations.find(d => d.to === "/" ? pathname === "/" : pathname.startsWith(d.to));
  return <div className="app-shell">
    <a href="#workspace" className="skip-link">Ir para o conteúdo</a>
    {open && <button className="nav-backdrop" aria-label="Fechar menu" onClick={() => setOpen(false)} />}
    <aside className={open ? "app-sidebar is-open" : "app-sidebar"}>
      <NavLink to="/" onClick={() => setOpen(false)} className="brand"><span className="brand-mark"><Layers3 size={22}/></span><span>BrowserMind<small>INTELLIGENCE WORKSPACE</small></span><span className="version">v2</span></NavLink>
      <button className="mobile-close" onClick={() => setOpen(false)} aria-label="Fechar menu"><X size={20}/></button>
      <nav aria-label="Navegação principal">
        {destinations.map((item, index) => <div key={item.to}>
          {(index === 0 || destinations[index - 1].group !== item.group) && <p className="nav-group">{item.group}</p>}
          <NavLink end={item.to === "/"} to={item.to} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}><item.icon size={18}/><span>{item.label}</span></NavLink>
        </div>)}
      </nav>
      <div className="sidebar-footer"><div className="workspace-note"><strong>✦ Da pesquisa à decisão.</strong><p>Seu próximo produto começa com uma boa análise.</p></div>
      <button className="nav-item" onClick={() => setShowSettings(true)}><Settings size={18}/>Configurações</button>
      <div className="connection"><span className={online ? "online" : ""}/>{online ? "Servidor conectado" : "Servidor desconectado"}</div></div>
    </aside>
    <div className="app-main">
      <header className="app-header"><button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Abrir menu" aria-expanded={open}><Menu size={21}/></button><span className="breadcrumb">Workspace</span><ChevronRight size={14}/><strong>{current?.label || "Detalhes"}</strong><span className="header-badge">Seu espaço de inteligência</span></header>
      <main id="workspace" tabIndex={-1} className={pathname === "/" || pathname === "/browser" ? "workspace-content" : "workspace-content workspace-module"}>{children}</main>
    </div>
  </div>;
}

const tools = [
  { to: "/pipeline", icon: Kanban, title: "Esteira de produtos", text: "Organize oportunidades e acompanhe cada etapa da sua pesquisa.", color: "violet", tag: "ORGANIZAR" },
  { to: "/supplier-analysis", icon: Building2, title: "Encontre o fornecedor certo", text: "Avalie fornecedores e reúna informações para sua próxima compra.", color: "amber", tag: "VALIDAR" },
  { to: "/calculator", icon: Calculator, title: "Faça a conta antes de importar", text: "Simule custos de importação e planeje sua operação.", color: "mint", tag: "PLANEJAR" },
];
export function HomePage() {
  return <div className="home-page">
    <div className="home-heading"><div><p className="eyebrow"><Sparkles size={14}/> SEU WORKSPACE, MAIS INTELIGENTE</p><h1>Boas decisões começam aqui<span>.</span></h1><p>Pesquise mercados, conecte oportunidades e avance com confiança.</p></div><Link to="/pipeline" className="quiet-link">Minha esteira <ArrowUpRight size={17}/></Link></div>
    <section className="home-hero" aria-labelledby="hero-title"><div className="hero-copy"><span className="hero-tag">✦ DO MERCADO À OPORTUNIDADE</span><h2 id="hero-title">Descubra o potencial<br/>do seu próximo produto.</h2><p>Explore demanda, oferta e concorrência em um panorama de mercado. Transforme sua pesquisa no próximo passo.</p><Link to="/market-analysis" className="primary-link">Explorar mercado <ArrowRight size={18}/></Link></div><div className="hero-art" aria-hidden="true"><div className="orbit"/><div className="art-card"><BarChart3 size={32}/><span>Perspectiva de mercado</span><div className="art-bars">{[30,48,40,64,55,85,100].map((h,i)=><i key={i} style={{height:h}}/>)}</div><div className="art-card-footer">PESQUISAR → ENTENDER → DECIDIR</div></div></div></section>
    <div className="section-heading"><h2>Da ideia ao próximo passo</h2><span>Escolha por onde começar</span></div>
    <section className="tool-grid" aria-label="Ferramentas de trabalho">{tools.map(tool => <Link key={tool.to} to={tool.to} className={"tool-card " + tool.color}><div className="tool-card-top"><span className="tool-icon"><tool.icon size={23}/></span><ArrowUpRight size={18}/></div><span className="tool-tag">{tool.tag}</span><h3>{tool.title}</h3><p>{tool.text}</p><span className="tool-action">Abrir ferramenta <ArrowRight size={15}/></span></Link>)}</section>
    <section className="quick-links" aria-label="Mais ferramentas"><div><h2>Seu trabalho, conectado</h2><p>Mais formas de explorar e organizar.</p></div><Link to="/categories"><Tags size={18}/><span>Categorias<small>Organize por nicho</small></span><ArrowUpRight size={16}/></Link><Link to="/browser"><Globe size={18}/><span>Assistente<small>Pesquise com apoio da IA</small></span><ArrowUpRight size={16}/></Link></section>
  </div>;
}
