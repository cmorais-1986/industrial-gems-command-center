import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  FlaskConical,
  Gauge,
  GitBranch,
  History,
  Lightbulb,
  MoreHorizontal,
  Play,
  RotateCcw,
  Save,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  TriangleAlert,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

type SimulationDetailProps = {
  gemName: string;
  gemCode: string;
  onClose: () => void;
};

type HistoryRun = {
  id: string;
  scenario: string;
  gem: string;
  status: "Concluída" | "Em revisão" | "Executando";
  roi: string;
  date: string;
  accent: string;
};

const initialHistory: HistoryRun[] = [
  { id: "SIM-024", scenario: "Refugo elevado na CNC-02", gem: "Scorpios", status: "Executando", roi: "4.2 : 1", date: "agora", accent: "amber" },
  { id: "SIM-023", scenario: "VOCs acima do baseline", gem: "Scorpios", status: "Concluída", roi: "3.7 : 1", date: "há 2h", accent: "green" },
  { id: "SIM-022", scenario: "Invasão zona de exclusão", gem: "Forja Nação", status: "Concluída", roi: "2.9 : 1", date: "ontem", accent: "cyan" },
  { id: "SIM-021", scenario: "Viés na inspeção visual", gem: "CyberNetics", status: "Em revisão", roi: "—", date: "ontem", accent: "purple" },
];

const tabs = ["Overview", "SPC & Capacidade", "Pareto", "FMEA", "ROI & Decisão"];

function Badge({ children, tone = "amber" }: { children: React.ReactNode; tone?: "amber" | "green" | "cyan" | "purple" | "red" }) {
  return <span className={`detail-badge detail-badge-${tone}`}>{children}</span>;
}

function SectionHeader({ icon: Icon, eyebrow, title, action }: { icon: React.ComponentType<{ size?: number }>; eyebrow: string; title: string; action?: React.ReactNode }) {
  return <div className="detail-section-header"><div className="detail-section-title"><span className="detail-icon"><Icon size={15} /></span><div><span className="detail-eyebrow">{eyebrow}</span><h3>{title}</h3></div></div>{action}</div>;
}

function SpcChart() {
  const points = [72, 67, 71, 61, 65, 59, 63, 56, 54, 58, 51, 48, 52, 43, 47, 41, 45, 39, 43, 37, 40, 34, 31, 35, 27, 30, 24, 29, 22, 18];
  const max = 90; const min = 10;
  const polyline = points.map((v, i) => `${(i / (points.length - 1)) * 100},${((max - v) / (max - min)) * 82 + 8}`).join(" ");
  return <div className="spc-chart-wrap"><div className="chart-axis-labels"><span>12%</span><span>8%</span><span>4%</span><span>0%</span></div><div className="spc-chart"><div className="spc-grid g1" /><div className="spc-grid g2" /><div className="spc-grid g3" /><div className="spc-grid g4" /><div className="control-line upper"><span>UCL 8.9%</span></div><div className="control-line center"><span>CL 5.2%</span></div><div className="control-line lower"><span>LCL 1.5%</span></div><svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="spcFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#39d6c3" stopOpacity=".2" /><stop offset="1" stopColor="#39d6c3" stopOpacity="0" /></linearGradient></defs><polygon points={`0,100 ${polyline} 100,100`} fill="url(#spcFill)" /><polyline points={polyline} fill="none" stroke="#39d6c3" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />{points.map((v, i) => <circle key={i} cx={(i / (points.length - 1)) * 100} cy={((max - v) / (max - min)) * 82 + 8} r={i > 24 ? "1.2" : "0.8"} fill={i > 24 ? "#f5a524" : "#8fe9df"} vectorEffect="non-scaling-stroke" />)}</svg><div className="spc-x-axis"><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span><span>00:00</span><span>04:00</span></div></div></div>;
}

function ParetoChart() {
  const bars = [{ label: "Desgaste ferramenta", value: 42, color: "#f5a524" }, { label: "Setup / troca", value: 23, color: "#d89432" }, { label: "Matéria-prima", value: 15, color: "#aa7631" }, { label: "Parâmetro", value: 11, color: "#7f5c2d" }, { label: "Outros", value: 9, color: "#5b4b31" }];
  return <div className="pareto-chart"><div className="pareto-bars">{bars.map((bar, i) => <div className="pareto-row" key={bar.label}><span className="pareto-label">{bar.label}</span><div className="pareto-bar-track"><span style={{ width: `${bar.value * 1.9}%`, background: bar.color }} /></div><strong>{bar.value}%</strong></div>)}</div><div className="pareto-cumulative"><span className="cum-label">Acumulado</span><svg viewBox="0 0 300 66" preserveAspectRatio="none"><polyline points="0,58 76,40 135,29 197,21 280,14" fill="none" stroke="#b58cff" strokeWidth="2" vectorEffect="non-scaling-stroke" /><circle cx="76" cy="40" r="3" fill="#b58cff" /><circle cx="135" cy="29" r="3" fill="#b58cff" /><circle cx="197" cy="21" r="3" fill="#b58cff" /><circle cx="280" cy="14" r="3" fill="#b58cff" /></svg><div className="cum-scale"><span>0</span><span>50</span><span>80</span><span>100%</span></div></div></div>;
}

function FmeaTable() {
  const rows = [
    ["Desgaste da ferramenta", "Alto", "8", "7", "5", "280", "Monitorar"],
    ["Variação matéria-prima", "Médio", "6", "5", "6", "180", "Investigar"],
    ["Setup fora do padrão", "Médio", "6", "4", "4", "96", "Controlar"],
    ["Sensor de posição", "Baixo", "4", "3", "4", "48", "Aceitar"],
  ];
  return <div className="fmea-table-wrap"><table className="fmea-table"><thead><tr><th>Modo de falha</th><th>Sev.</th><th>Ocor.</th><th>Det.</th><th>RPN</th><th>Prioridade</th></tr></thead><tbody>{rows.map((row) => <tr key={row[0]}><td><span className="fmea-failure-dot" />{row[0]}</td><td>{row[2]}</td><td>{row[3]}</td><td>{row[4]}</td><td><strong className={Number(row[5]) > 200 ? "rpn-high" : Number(row[5]) > 100 ? "rpn-mid" : "rpn-low"}>{row[5]}</strong></td><td><Badge tone={Number(row[5]) > 200 ? "red" : Number(row[5]) > 100 ? "amber" : "green"}>{row[6]}</Badge></td></tr>)}</tbody></table></div>;
}

function RoiPanel() {
  return <div className="roi-panel"><div className="roi-main"><span className="roi-eyebrow">ROI PROJETADO</span><strong>4.2<span>:1</span></strong><Badge tone="green"><ArrowUpRight size={12} /> acima do gate mínimo</Badge></div><div className="roi-metrics"><div><span>Investimento</span><strong>R$ 18.4k</strong></div><div><span>Economia anual</span><strong>R$ 77.2k</strong></div><div><span>Payback</span><strong>2.9 meses</strong></div><div><span>VPL 12 meses</span><strong>R$ 58.8k</strong></div></div><div className="roi-decision"><div className="decision-icon"><CheckCircle2 size={16} /></div><div><strong>Recomendação: aprovar piloto</strong><span>Gate financeiro aprovado pelo CFO Agent · confiança 91%</span></div><button onClick={() => toast.success("Decisão registrada", { description: "Piloto aprovado para a próxima rodada" })}>Registrar decisão <ArrowUpRight size={14} /></button></div></div>;
}

export default function SimulationDetail({ gemName, gemCode, onClose }: SimulationDetailProps) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [scenario, setScenario] = useState("Refugo elevado na CNC-02");
  const [process, setProcess] = useState("Usinagem CNC");
  const [baseline, setBaseline] = useState("4");
  const [target, setTarget] = useState("2");
  const [days, setDays] = useState("90");
  const [history, setHistory] = useState(initialHistory);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("Todos");

  const filteredHistory = useMemo(() => historyFilter === "Todos" ? history : history.filter((item) => item.status === historyFilter), [history, historyFilter]);

  const executeScenario = () => {
    if (!scenario.trim()) { toast.error("Informe um nome para o cenário"); return; }
    setIsExecuting(true);
    const newRun: HistoryRun = { id: `SIM-${String(25 + history.length).padStart(3, "0")}`, scenario, gem: gemName.split(" ")[0], status: "Executando", roi: "—", date: "agora", accent: "amber" };
    setHistory((items) => [newRun, ...items]);
    toast.success("Cenário parametrizado criado", { description: `${newRun.id} · gerando dados sintéticos` });
    window.setTimeout(() => { setIsExecuting(false); setHistory((items) => items.map((item) => item.id === newRun.id ? { ...item, status: "Concluída", roi: "4.6 : 1", accent: "green" } : item)); toast.success("Execução concluída", { description: "SPC, Pareto, FMEA e ROI atualizados" }); }, 1700);
  };

  return <div className="detail-overlay"><div className="detail-shell">
    <header className="detail-topbar"><div className="detail-top-left"><button className="detail-back" onClick={onClose}><ArrowLeft size={16} /> Command Center</button><span className="detail-divider">/</span><span className="detail-current">{gemCode} · {scenario}</span></div><div className="detail-top-actions"><span className="synthetic-label"><span className="pulse-dot" /> DADOS SINTÉTICOS</span><button className="detail-icon-button" onClick={() => toast.info("Exportação preparada", { description: "Relatório CIOS pronto para download" })}><Download size={16} /></button><button className="detail-close" onClick={onClose} aria-label="Fechar"><X size={18} /></button></div></header>
    <div className="detail-content">
      <section className="detail-heading"><div><div className="detail-heading-kicker"><span className="heading-accent" /> SIMULATION WORKBENCH <span className="detail-version">CIOS v3.0</span></div><h1>{scenario}<span>.</span></h1><div className="detail-heading-meta"><Badge tone="amber"><span className="tiny-pulse" /> Executando</Badge><span><GitBranch size={13} /> {gemName}</span><span><Clock3 size={13} /> SIM-024 · rodada 04</span><span><Settings2 size={13} /> Semente 2026-024</span></div></div><div className="detail-heading-actions"><button className="secondary-button" onClick={() => setShowForm(!showForm)}><Settings2 size={14} /> Parametrizar</button><button className="detail-run-button" onClick={executeScenario} disabled={isExecuting}><Play size={14} fill="currentColor" /> {isExecuting ? "Executando..." : "Executar rodada"}</button></div></section>
      <nav className="detail-tabs">{tabs.map((tab) => <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>{tab}{tab === "SPC & Capacidade" && <span className="tab-new">LIVE</span>}</button>)}</nav>
      {showForm && <section className="scenario-form-card"><div className="scenario-form-head"><div><span className="detail-eyebrow">SCENARIO BUILDER</span><h3>Parametrizar nova rodada</h3></div><button onClick={() => setShowForm(false)}><X size={16} /></button></div><div className="scenario-form-grid"><label>Nome do cenário<input value={scenario} onChange={(e) => setScenario(e.target.value)} /></label><label>Processo<select value={process} onChange={(e) => setProcess(e.target.value)}><option>Usinagem CNC</option><option>Estamparia</option><option>Pintura E-coat</option><option>Montagem</option></select></label><label>Baseline de refugo (%)<input type="number" value={baseline} onChange={(e) => setBaseline(e.target.value)} /></label><label>Meta de refugo (%)<input type="number" value={target} onChange={(e) => setTarget(e.target.value)} /></label><label>Janela de dados (dias)<input type="number" value={days} onChange={(e) => setDays(e.target.value)} /></label><label>Injeção de falha<select defaultValue="Desgaste progressivo"><option>Desgaste progressivo</option><option>Setup fora do padrão</option><option>Variação de matéria-prima</option><option>Sem falha (baseline)</option></select></label></div><div className="scenario-form-foot"><span><Sparkles size={14} /> Dados serão gerados com semente reprodutível</span><button className="save-scenario" onClick={() => { setShowForm(false); toast.success("Parâmetros salvos", { description: `${process} · ${days} dias · baseline ${baseline}% → meta ${target}%` }); }}><Save size={14} /> Salvar parâmetros</button></div></section>}
      <section className="detail-kpi-row"><div className="detail-kpi-card"><div className="detail-kpi-top"><span>REFUGO ATUAL</span><TriangleAlert size={15} /></div><strong>11.0<span>%</span></strong><div className="kpi-change negative"><ArrowUpRight size={12} /> +7.0 pp vs. baseline</div></div><div className="detail-kpi-card"><div className="detail-kpi-top"><span>CAPACIDADE Cpk</span><Gauge size={15} /></div><strong>0.82</strong><div className="kpi-change negative"><ArrowDownRight size={12} /> abaixo de 1.33 mínimo</div></div><div className="detail-kpi-card"><div className="detail-kpi-top"><span>PARADAS</span><Zap size={15} /></div><strong>14.6<span>h</span></strong><div className="kpi-change negative"><ArrowUpRight size={12} /> +34% vs. ciclo anterior</div></div><div className="detail-kpi-card kpi-positive"><div className="detail-kpi-top"><span>ROI PROJETADO</span><TrendingUp size={15} /></div><strong>4.2<span>:1</span></strong><div className="kpi-change positive"><ArrowUpRight size={12} /> gate financeiro aprovado</div></div></section>
      {activeTab === "Overview" && <>
        <section className="detail-analysis-grid"><div className="detail-card spc-card"><SectionHeader icon={ActivityIcon} eyebrow="STATISTICAL PROCESS CONTROL" title="Carta de controle · % refugo" action={<div className="chart-status"><span className="status-live-dot" /> monitorando</div>} /><SpcChart /><div className="chart-summary"><span><i className="summary-dot cyan" /> Processo instável</span><span>12 pontos fora do controle</span><span>σ = 2.1%</span></div></div><div className="detail-card pareto-card"><SectionHeader icon={BarChart3} eyebrow="ANALYSE" title="Pareto de causas" action={<button className="card-menu"><MoreHorizontal size={15} /></button>} /><ParetoChart /><div className="insight-callout"><Lightbulb size={14} /><span><strong>Insight do Analyst Agent</strong> Desgaste da ferramenta responde por 42% do refugo.</span></div></div></section>
        <section className="detail-analysis-grid second"><div className="detail-card fmea-card"><SectionHeader icon={ShieldCheck} eyebrow="RISK ENGINEERING" title="FMEA dinâmica" action={<Badge tone="red">1 risco crítico</Badge>} /><FmeaTable /><div className="table-foot"><span><span className="legend-square red" /> RPN &gt; 200 requer ação imediata</span><button onClick={() => setActiveTab("FMEA")}>Ver análise completa <ArrowUpRight size={13} /></button></div></div><div className="detail-card decision-card"><SectionHeader icon={Target} eyebrow="DECISION ENGINE" title="Decisão recomendada" /><div className="decision-hero"><div className="recommendation-icon"><Sparkles size={20} /></div><div><Badge tone="green">APROVAR PILOTO</Badge><h4>Troca preventiva de ferramenta</h4><p>Reduzir intervalo de troca de 480 para 360 ciclos.</p></div></div><div className="decision-list"><div><span>Impacto esperado</span><strong>↓ 6.8 pp refugo</strong></div><div><span>Confiança dos agentes</span><strong>91%</strong></div><div><span>Gate humano</span><strong className="human-ok"><CheckCircle2 size={13} /> aprovado</strong></div></div><button className="decision-button" onClick={() => toast.success("Plano de ação criado", { description: "5W2H adicionado ao workspace" })}>Criar plano 5W2H <ArrowUpRight size={14} /></button></div></section>
        <section className="detail-card roi-card"><SectionHeader icon={TrendingUp} eyebrow="FINANCIAL GATE" title="Retorno da melhoria" action={<button className="expand-button" onClick={() => setActiveTab("ROI & Decisão")}>Detalhar ROI <ArrowUpRight size={13} /></button>} /><RoiPanel /></section>
      </>}
      {activeTab === "SPC & Capacidade" && <section className="detail-card tab-expanded"><SectionHeader icon={Gauge} eyebrow="STATISTICAL PROCESS CONTROL" title="SPC & capacidade do processo" /><SpcChart /><div className="expanded-stats"><div><span>Cp</span><strong>0.91</strong><small>potencial</small></div><div><span>Cpk</span><strong className="negative-text">0.82</strong><small>realizado</small></div><div><span>σ do processo</span><strong>2.1%</strong><small>desvio padrão</small></div><div><span>Fora de controle</span><strong className="negative-text">12</strong><small>observações</small></div></div></section>}
      {activeTab === "Pareto" && <section className="detail-card tab-expanded"><SectionHeader icon={BarChart3} eyebrow="ANALYSE ENGINE" title="Pareto de causas de refugo" /><ParetoChart /><div className="pareto-explanation"><strong>Regra 80/20:</strong> as três primeiras causas concentram <span>80% do impacto</span>. A recomendação prioriza desgaste de ferramenta e setup porque possuem maior controlabilidade e ROI de intervenção.</div></section>}
      {activeTab === "FMEA" && <section className="detail-card tab-expanded"><SectionHeader icon={ShieldCheck} eyebrow="RISK ENGINEERING" title="FMEA dinâmica da CNC-02" /><FmeaTable /><div className="fmea-action-grid"><div><span>Risco prioritário</span><strong>Desgaste da ferramenta</strong></div><div><span>RPN atual</span><strong className="rpn-high">280</strong></div><div><span>Ação recomendada</span><strong>Troca preventiva a cada 360 ciclos</strong></div></div></section>}
      {activeTab === "ROI & Decisão" && <section className="detail-card tab-expanded"><SectionHeader icon={TrendingUp} eyebrow="FINANCIAL GATE" title="Caso econômico e decisão" /><RoiPanel /><div className="decision-audit"><Check size={15} /><span>Validação registrada: CFO Agent · Lean Master Agent · Human Gate</span></div></section>}
      <section className="detail-card history-card"><div className="history-head"><SectionHeader icon={History} eyebrow="EXPERIMENT LOG" title="Histórico de execuções" /><div className="history-filters">{["Todos", "Concluída", "Em revisão"].map((filter) => <button key={filter} className={historyFilter === filter ? "active" : ""} onClick={() => setHistoryFilter(filter)}>{filter}</button>)}</div></div><div className="history-list">{filteredHistory.map((run) => <div className="history-row" key={run.id}><div className={`history-run-icon ${run.accent}`}><FlaskConical size={15} /></div><div className="history-run-main"><strong>{run.scenario}</strong><span>{run.id} · {run.gem} · {run.date}</span></div><Badge tone={run.status === "Concluída" ? "green" : run.status === "Executando" ? "amber" : "purple"}>{run.status === "Executando" && <span className="tiny-pulse" />}{run.status}</Badge><span className="history-roi">{run.roi}</span><button className="history-open" onClick={() => toast.info("Execução selecionada", { description: `${run.id} · ${run.scenario}` })}>Abrir <ArrowUpRight size={13} /></button></div>)}</div></section>
    </div>
  </div></div>;
}

function ActivityIcon(props: React.ComponentProps<typeof Gauge>) { return <Zap {...props} />; }
