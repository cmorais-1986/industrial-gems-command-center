import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Clock3,
  Cpu,
  Database,
  FlaskConical,
  Factory,
  Gauge,
  GitBranch,
  Layers3,
  LayoutDashboard,
  Leaf,
  LogOut,
  Mail,
  Menu,
  MoreHorizontal,
  Play,
  Radar,
  RefreshCcw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  TerminalSquare,
  UserRound,
  TrendingUp,
  Wrench,
  X,
  Zap,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import SimulationDetail from "../components/SimulationDetail";
import ProductionWorkbench from "../components/ProductionWorkbench";

type Gem = {
  id: string;
  name: string;
  sector: string;
  code: string;
  color: string;
  accent: string;
  status: string;
  signal: string;
  focus: string;
  score: number;
};

type ActivityItem = {
  time: string;
  title: string;
  detail: string;
  tone: "amber" | "cyan" | "green" | "purple";
  icon: typeof Activity;
};

const gems: Gem[] = [
  {
    id: "scorpios",
    name: "Scorpios Metalworks",
    sector: "Automotiva · Tier 1/2",
    code: "GEM-01",
    color: "amber",
    accent: "#f5a524",
    status: "Em execução",
    signal: "OEE 78%",
    focus: "CNC · Qualidade · SGI",
    score: 82,
  },
  {
    id: "forja",
    name: "Forja Nação",
    sector: "Metalurgia pesada",
    code: "GEM-02",
    color: "cyan",
    accent: "#39d6c3",
    status: "Pronto",
    signal: "Risco 2.4",
    focus: "EHS · NR-12 · HAZOP",
    score: 74,
  },
  {
    id: "helvetia",
    name: "Helvetia EcoChemicals",
    sector: "Química · Processo contínuo",
    code: "GEM-03",
    color: "green",
    accent: "#73d37a",
    status: "Monitorando",
    signal: "Carbono ↓ 8%",
    focus: "ESG · ACV · Efluentes",
    score: 91,
  },
  {
    id: "cybernetics",
    name: "CyberNetics AeroSpace",
    sector: "Alta tecnologia",
    code: "GEM-04",
    color: "purple",
    accent: "#b58cff",
    status: "Em revisão",
    signal: "Bias 1.8%",
    focus: "IA · ISO 42001 · Quality",
    score: 68,
  },
];

const activity: ActivityItem[] = [
  { time: "agora", title: "Simulation Loop iniciado", detail: "SIM-024 · Refugo CNC-02", tone: "amber", icon: Play },
  { time: "há 6 min", title: "Data Quality Gate aprovado", detail: "90 dias · 18.420 observações", tone: "cyan", icon: CheckCircle2 },
  { time: "há 14 min", title: "Anomalia detectada", detail: "Pintura · VOCs +12,4%", tone: "purple", icon: Radar },
  { time: "há 31 min", title: "CFO Agent concluiu análise", detail: "ROI projetado 4,2 : 1", tone: "green", icon: TrendingUp },
];

const navItems = [
  { label: "Command Center", icon: LayoutDashboard },
  { label: "Produção", icon: Factory },
  { label: "Simulações", icon: FlaskConical },
  { label: "GEMS industriais", icon: Layers3 },
  { label: "Agentes & CIOS", icon: BrainCircuit },
  { label: "Dados & Analytics", icon: Database },
  { label: "Governança de IA", icon: ShieldCheck },
];

function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "amber" | "green" | "cyan" | "purple" }) {
  return <span className={`status-pill status-pill-${tone}`}>{children}</span>;
}

function MiniSparkline({ color = "#f5a524", values = [25, 34, 31, 48, 45, 63, 57, 72] }: { color?: string; values?: number[] }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 100;
    const y = 32 - ((value - min) / (max - min || 1)) * 25;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 100 36" className="mini-sparkline" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Donut({ value, label, color }: { value: number; label: string; color: string }) {
  const radius = 31;
  const circumference = 2 * Math.PI * radius;
  const dash = (value / 100) * circumference;
  return (
    <div className="donut-wrap" style={{ "--donut-color": color } as React.CSSProperties}>
      <svg viewBox="0 0 80 80" className="donut-svg" aria-label={`${label}: ${value}%`}>
        <circle cx="40" cy="40" r={radius} className="donut-track" />
        <circle cx="40" cy="40" r={radius} className="donut-value" strokeDasharray={`${dash} ${circumference - dash}`} />
      </svg>
      <div className="donut-label"><strong>{value}%</strong><span>{label}</span></div>
    </div>
  );
}

function AppMark() {
  return (
    <div className="app-mark" aria-label="Industrial GEMS">
      <div className="app-mark-orbit orbit-one" />
      <div className="app-mark-orbit orbit-two" />
      <div className="app-mark-core"><span>G</span></div>
    </div>
  );
}

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [activeNav, setActiveNav] = useState("Command Center");
  const [selectedGemId, setSelectedGemId] = useState("scorpios");
  const [isRunning, setIsRunning] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activityItems, setActivityItems] = useState(activity);
  const [showSimulationDetail, setShowSimulationDetail] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showProduction, setShowProduction] = useState(false);
  const selectedGem = gems.find((gem) => gem.id === selectedGemId) ?? gems[0];
  const filteredGems = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    if (!normalized) return gems;
    return gems.filter((gem) => `${gem.name} ${gem.sector} ${gem.focus}`.toLowerCase().includes(normalized));
  }, [query]);

  if (loading) {
    return <div className="auth-gate"><Loader2 size={24} className="auth-spinner" /><span>Validando acesso ao CIOS...</span></div>;
  }

  if (!isAuthenticated) {
    return <div className="auth-gate"><div className="auth-gate-mark"><AppMark /></div><span className="auth-gate-kicker">INDUSTRIAL GEMS · CIOS v3.0</span><h1>Acesso autenticado obrigatório<span>.</span></h1><p>Entre com sua conta Manus para acessar simulações, histórico, Copiloto e decisões de governança isolados por usuário.</p><button className="auth-gate-button" onClick={() => startLogin()}><ShieldCheck size={16} /> Entrar no laboratório</button><small>Ambiente fictício para simulações de aplicação de IA industrial.</small></div>;
  }

  const runSimulation = () => {
    if (isRunning) return;
    setIsRunning(true);
    toast.success("Simulation Loop iniciado", { description: `${selectedGem.code} · cenário de desvio operacional` });
    setActivityItems((items) => [{ time: "agora", title: "Simulation Loop iniciado", detail: `${selectedGem.code} · análise de cenário`, tone: "amber", icon: Play }, ...items.slice(0, 3)]);
    window.setTimeout(() => {
      setIsRunning(false);
      toast.success("Simulação concluída", { description: "CFO Gate aprovado · ROI projetado 4,2 : 1" });
      setActivityItems((items) => [{ time: "agora", title: "CFO Gate aprovado", detail: "ROI projetado 4,2 : 1", tone: "green", icon: CheckCircle2 }, ...items.slice(0, 3)]);
    }, 1700);
  };

  const handleNav = (label: string) => {
    setActiveNav(label);
    setIsSidebarOpen(false);
    if (label === "Produção") { setShowProduction(true); return; }
    if (label !== "Command Center") toast.info(`${label} selecionado`, { description: "Módulo visual em modo de simulação" });
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowProfile(false);
      toast.success("Sessão encerrada", { description: "Até a próxima simulação." });
    } catch {
      toast.error("Não foi possível encerrar a sessão");
    }
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${isSidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <div className="brand-row">
            <AppMark />
            <div>
            <div className="brand-name">Industrial <span>GEMS</span></div>
              <div className="brand-subtitle">Cognitive Operations Lab</div>
            </div>
            <button className="mobile-close" onClick={() => setIsSidebarOpen(false)} aria-label="Fechar menu"><X size={18} /></button>
          </div>
          <div className="simulation-badge"><span className="pulse-dot" /> AMBIENTE DE SIMULAÇÃO <span className="badge-dot">·</span> v3.0</div>
        </div>

        <div className="sidebar-section-label">Workspace</div>
        <nav className="main-nav" aria-label="Navegação principal">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.label === activeNav;
            return (
              <button key={item.label} className={`nav-item ${active ? "nav-item-active" : ""}`} onClick={() => handleNav(item.label)}>
                <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                <span>{item.label}</span>
                {item.label === "Simulações" && <span className="nav-count">12</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-section-label gem-label">GEMS ativos <span>4</span></div>
        <div className="gem-list">
          {gems.map((gem) => (
            <button key={gem.id} className={`gem-nav-item ${selectedGemId === gem.id ? "gem-nav-active" : ""}`} onClick={() => setSelectedGemId(gem.id)}>
              <span className="gem-nav-dot" style={{ background: gem.accent, boxShadow: `0 0 12px ${gem.accent}` }} />
              <span>{gem.name}</span>
              <span className="gem-code">{gem.code}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-cognitive-card">
            <div className="cognitive-card-head"><Sparkles size={15} /><span>CIOS v3.0</span><span className="live-chip">LIVE</span></div>
            <div className="cognitive-card-title">Motor cognitivo operacional</div>
            <div className="cognitive-card-meta"><span>8 camadas</span><span>•</span><span>24 agentes</span></div>
            <div className="cognitive-progress"><span style={{ width: "76%" }} /></div>
          </div>
          <button className="profile-row" onClick={() => setShowProfile(true)}>
            <div className="avatar">{(user?.name ?? "CA").slice(0, 2).toUpperCase()}</div>
            <div className="profile-text"><strong>{user?.name ?? "Usuário autenticado"}</strong><span>{user?.email ?? "Sessão Manus ativa"}</span></div>
            <UserRound size={17} className="muted-icon" />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left"><button className="mobile-menu" onClick={() => setIsSidebarOpen(true)} aria-label="Abrir menu"><Menu size={21} /></button><div className="breadcrumb"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{activeNav}</strong></div></div>
          <div className="topbar-actions">
            <div className="global-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar GEMS, simulações..." /><kbd>⌘ K</kbd></div>
            <button className="icon-button" onClick={() => toast.info("Sincronização local concluída", { description: "Dados sintéticos atualizados há poucos segundos" })} aria-label="Sincronizar"><RefreshCcw size={17} /></button>
            <button className="icon-button has-alert" onClick={() => toast.warning("3 alertas cognitivos", { description: "1 risco alto · 2 itens aguardando validação humana" })} aria-label="Alertas"><AlertTriangle size={17} /><span /></button>
            <button className="settings-button" onClick={() => toast.info("Configurações", { description: "Controles do ambiente de simulação" })}><Settings2 size={16} /><span>Configurar</span></button>
          </div>
        </header>

        <div className="content-wrap">
          <section className="hero-row">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> COGNITIVE INDUSTRIAL OPERATING SYSTEM <span className="eyebrow-version">3.0</span></div>
              <h1>Command Center<span className="title-period">.</span></h1>
              <p className="hero-copy">Simule. Aprenda. Decida melhor.<br /><span>O sistema operacional para transformar conhecimento industrial em inteligência aplicada.</span></p>
            </div>
            <div className="hero-actions">
              <div className="last-sync"><span className="sync-dot" /> Última sincronização <strong>agora</strong></div>
              <button className={`primary-button ${isRunning ? "button-running" : ""}`} onClick={() => setShowSimulationDetail(true)}><span className="button-icon"><Play size={14} fill="currentColor" /></span>{isRunning ? "Executando..." : "Nova simulação"}<ChevronDown size={14} /></button>
            </div>
          </section>

          <section className="overview-strip">
            <div className="overview-label"><span className="section-kicker">VISÃO GERAL</span><span className="section-sub">04 ambientes · 12 simulações este mês</span></div>
            <div className="overview-actions"><button className="text-action" onClick={() => toast.info("Dados sintéticos", { description: "Todos os resultados desta interface são simulados." })}>Sobre o laboratório <span>↗</span></button><span className="divider-dot" /><button className="view-toggle active"><LayoutDashboard size={14} /> Resumo</button><button className="view-toggle" onClick={() => toast.info("Visualização de pipeline", { description: "Em breve: mapa completo de fluxo CIOS" })}><GitBranch size={14} /> Pipeline</button></div>
          </section>

          <section className="kpi-grid">
            <div className="metric-card metric-highlight">
              <div className="metric-top"><span className="metric-label">SAÚDE DO ECOSSISTEMA</span><span className="metric-icon"><Activity size={16} /></span></div>
              <div className="metric-main"><strong>82.4</strong><span>/100</span><Pill tone="green"><ArrowUpRight size={12} /> 6.8%</Pill></div>
              <div className="metric-foot"><span>vs. ciclo anterior</span><MiniSparkline color="#f5a524" values={[53, 48, 59, 56, 67, 63, 74, 82]} /></div>
            </div>
            <div className="metric-card">
              <div className="metric-top"><span className="metric-label">SIMULAÇÕES ATIVAS</span><span className="metric-icon metric-icon-cyan"><FlaskConical size={16} /></span></div>
              <div className="metric-main"><strong>04</strong><Pill tone="cyan">+2 hoje</Pill></div>
              <div className="metric-foot"><span>12 concluídas no ciclo</span><div className="mini-bars"><i style={{ height: "32%" }} /><i style={{ height: "52%" }} /><i style={{ height: "42%" }} /><i style={{ height: "76%" }} /><i style={{ height: "61%" }} /><i style={{ height: "92%" }} /></div></div>
            </div>
            <div className="metric-card">
              <div className="metric-top"><span className="metric-label">AGENTES ONLINE</span><span className="metric-icon metric-icon-purple"><Bot size={16} /></span></div>
              <div className="metric-main"><strong>18</strong><span className="muted-text">/24</span><Pill tone="purple">75% ativos</Pill></div>
              <div className="metric-foot"><span>6 aguardando tarefa</span><div className="agent-dots">{Array.from({ length: 12 }).map((_, index) => <i key={index} className={index < 9 ? "on" : ""} />)}</div></div>
            </div>
            <div className="metric-card">
              <div className="metric-top"><span className="metric-label">ROI MÉDIO PROJETADO</span><span className="metric-icon metric-icon-green"><TrendingUp size={16} /></span></div>
              <div className="metric-main"><strong>4.2</strong><span>: 1</span><Pill tone="green">Acima do gate</Pill></div>
              <div className="metric-foot"><span>barreira mínima 3 : 1</span><MiniSparkline color="#73d37a" values={[31, 42, 37, 54, 49, 68, 64, 78]} /></div>
            </div>
          </section>

          <section className="main-grid">
            <div className="panel gem-panel">
              <div className="panel-header"><div><span className="section-kicker">PORTFÓLIO DE SIMULAÇÃO</span><h2>Escolha um ambiente</h2></div><button className="more-button" onClick={() => toast.info("Portfólio completo", { description: "4 GEMS permanentes configurados" })}><MoreHorizontal size={18} /></button></div>
              <div className="gem-cards">
                {filteredGems.map((gem) => (
                  <button key={gem.id} className={`gem-card gem-card-${gem.color} ${selectedGemId === gem.id ? "gem-card-selected" : ""}`} onClick={() => setSelectedGemId(gem.id)}>
                    <div className="gem-card-top"><span className="gem-index">{gem.code}</span><span className={`gem-status-dot ${gem.status === "Em execução" ? "is-live" : ""}`} /> <span className="gem-status">{gem.status}</span></div>
                    <div className="gem-visual"><div className="gem-orb"><span>{gem.name.charAt(0)}</span></div><div className="gem-signal"><strong>{gem.signal}</strong><span>sinal principal</span></div></div>
                    <div className="gem-card-name">{gem.name}</div><div className="gem-card-sector">{gem.sector}</div>
                    <div className="gem-card-bottom"><span>{gem.focus}</span><span className="gem-score">{gem.score}<small>/100</small></span></div>
                  </button>
                ))}
              </div>
              {filteredGems.length === 0 && <div className="empty-state"><Search size={19} /><span>Nenhum GEM encontrado para “{query}”.</span></div>}
            </div>

            <div className="panel simulation-panel">
              <div className="panel-header"><div><span className="section-kicker">SIMULATION LOOP</span><h2>Rodada em destaque</h2></div><Pill tone="amber"><span className="tiny-pulse" /> LIVE</Pill></div>
              <div className="simulation-hero"><div className="sim-topline"><span className="sim-id">SIM-024</span><span className="sim-time"><Clock3 size={13} /> 08:42 min</span></div><h3>Refugo elevado na CNC-02</h3><p>O índice de refugo subiu de <strong>4%</strong> para <strong>11%</strong> nos últimos três turnos.</p><div className="sim-meta"><span><Cpu size={14} /> {selectedGem.name}</span><span><Target size={14} /> DMAIC + SPC + FMEA</span></div></div>
              <div className="pipeline"><div className="pipeline-line"><span style={{ width: "72%" }} /></div>{["Define", "Measure", "Analyze", "Improve", "Control"].map((step, index) => <div className={`pipeline-step ${index < 3 ? "done" : index === 3 ? "current" : ""}`} key={step}><span className="step-dot">{index < 3 ? "✓" : index === 3 ? <span className="step-spinner" /> : index + 1}</span><span>{step}</span></div>)}</div>
              <div className="simulation-footer"><div className="sim-agent"><div className="mini-avatar"><Bot size={15} /></div><span><strong>Lean Master Agent</strong><small>+ 4 agentes colaborando</small></span></div><button className="run-link" onClick={() => setShowSimulationDetail(true)}>{isRunning ? "Executando" : "Abrir simulação"}<ArrowUpRight size={15} /></button></div>
            </div>
          </section>

          <section className="lower-grid">
            <div className="panel performance-panel">
              <div className="panel-header"><div><span className="section-kicker">DESEMPENHO CIOS</span><h2>Saúde dos ambientes</h2></div><button className="period-select" onClick={() => toast.info("Período alterado", { description: "Visualização: últimos 30 dias" })}>Últimos 30 dias <ChevronDown size={13} /></button></div>
              <div className="performance-content"><div className="chart-legend"><span><i className="legend-dot amber" /> Saúde GEM</span><span><i className="legend-dot muted" /> Gate mínimo</span></div><div className="line-chart"><div className="chart-y-axis"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div><div className="chart-canvas"><div className="grid-line line-100" /><div className="grid-line line-75" /><div className="grid-line line-50" /><div className="grid-line line-25" /><div className="threshold-line"><span>gate 70</span></div><svg viewBox="0 0 700 190" preserveAspectRatio="none" className="performance-svg"><defs><linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#f5a524" stopOpacity=".25" /><stop offset="100%" stopColor="#f5a524" stopOpacity="0" /></linearGradient></defs><path d="M0 128 C42 118 54 106 94 112 S143 132 176 103 S220 68 260 82 S308 99 350 70 S397 48 436 65 S482 85 520 54 S571 34 610 50 S654 35 700 23 L700 190 L0 190 Z" fill="url(#areaGradient)" /><path d="M0 128 C42 118 54 106 94 112 S143 132 176 103 S220 68 260 82 S308 99 350 70 S397 48 436 65 S482 85 520 54 S571 34 610 50 S654 35 700 23" fill="none" stroke="#f5a524" strokeWidth="3" strokeLinecap="round" /></svg><div className="chart-x-axis"><span>01 AGO</span><span>08 AGO</span><span>15 AGO</span><span>22 AGO</span><span>29 AGO</span><span>HOJE</span></div></div></div></div>
            </div>
            <div className="panel health-panel"><div className="panel-header"><div><span className="section-kicker">GOVERNANÇA</span><h2>Gates de confiança</h2></div><ShieldCheck size={18} className="panel-icon" /></div><div className="donut-row"><Donut value={92} label="Dados" color="#39d6c3" /><Donut value={76} label="Humano" color="#f5a524" /><Donut value={88} label="Financeiro" color="#b58cff" /></div><div className="health-note"><span className="health-note-icon"><CheckCircle2 size={15} /></span><span><strong>Pronto para decisão</strong><small>Todos os gates críticos estão dentro do limite.</small></span></div></div>
          </section>

          <section className="bottom-grid">
            <div className="panel activity-panel"><div className="panel-header"><div><span className="section-kicker">LOG OPERACIONAL</span><h2>Atividade recente</h2></div><button className="more-button" onClick={() => toast.info("Log completo", { description: "Exibindo os últimos eventos do CIOS" })}><MoreHorizontal size={18} /></button></div><div className="activity-list">{activityItems.map((item, index) => { const Icon = item.icon; return <div className="activity-row" key={`${item.title}-${index}`}><div className={`activity-icon activity-${item.tone}`}><Icon size={15} /></div><div className="activity-copy"><strong>{item.title}</strong><span>{item.detail}</span></div><span className="activity-time">{item.time}</span></div>; })}</div></div>
            <div className="panel agents-panel"><div className="panel-header"><div><span className="section-kicker">MULTIAGENTE</span><h2>Rede cognitiva</h2></div><button className="network-button" onClick={() => toast.success("Rede estável", { description: "18 agentes online · latência média 210 ms" })}><span className="network-pulse" /> Estável</button></div><div className="agent-visual"><div className="network-ring ring-outer" /><div className="network-ring ring-inner" /><div className="network-center"><BrainCircuit size={25} /><span>CIOS</span></div><div className="network-node node-1"><Bot size={13} /></div><div className="network-node node-2"><Gauge size={13} /></div><div className="network-node node-3"><Leaf size={13} /></div><div className="network-node node-4"><Wrench size={13} /></div><div className="network-node node-5"><ShieldCheck size={13} /></div></div><div className="agent-summary"><span><strong>18</strong> online</span><span><strong>04</strong> executando</span><span><strong>02</strong> gates</span></div></div>
          </section>

          <footer className="app-footer"><span><span className="footer-mark" /> Industrial GEMS Lab · ambiente fictício para simulações de IA</span><span>Construído sobre o <strong>CIOS v3.0</strong></span></footer>
        </div>
      </main>
      {showProfile && <div className="profile-overlay" role="dialog" aria-modal="true" aria-label="Perfil do usuário"><section className="profile-modal"><div className="profile-modal-head"><div><span className="section-kicker">IDENTIDADE E ACESSO</span><h2>Meu perfil</h2></div><button className="profile-close" onClick={() => setShowProfile(false)} aria-label="Fechar perfil"><X size={18} /></button></div><div className="profile-hero"><div className="profile-large-avatar">{(user?.name ?? "CA").slice(0, 2).toUpperCase()}</div><div><strong>{user?.name ?? "Usuário autenticado"}</strong><span>Conta Manus · dados isolados por usuário</span></div></div><div className="profile-fields"><div><UserRound size={15} /><span>Nome</span><strong>{user?.name ?? "Não informado"}</strong></div><div><Mail size={15} /><span>E-mail</span><strong>{user?.email ?? "Não informado"}</strong></div><div><ShieldCheck size={15} /><span>Permissão</span><strong>{user?.role === "admin" ? "Administrador" : "Usuário do laboratório"}</strong></div></div><div className="profile-modal-foot"><small>Suas simulações, mensagens e decisões são privadas.</small><button className="logout-button" onClick={handleLogout}><LogOut size={15} /> Sair da conta</button></div></section></div>}
      {showSimulationDetail && <SimulationDetail gemName={selectedGem.name} gemCode={selectedGem.code} onClose={() => setShowSimulationDetail(false)} />}
      {showProduction && <ProductionWorkbench onClose={() => { setShowProduction(false); setActiveNav("Command Center"); }} />}
    </div>
  );
}
