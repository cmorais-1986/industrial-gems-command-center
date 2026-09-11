import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
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
  GitCompare,
  History,
  Lightbulb,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Play,
  RotateCcw,
  Save,
  Send,
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
  gemCode: string;
  process: string;
  status: "Concluída" | "Em revisão" | "Executando";
  roi: string;
  date: string;
  accent: string;
};

const initialHistory: HistoryRun[] = [
  { id: "SIM-024", scenario: "Refugo elevado na CNC-02", gem: "Scorpios", gemCode: "GEM-01", process: "Usinagem CNC", status: "Executando", roi: "4.2 : 1", date: "agora", accent: "amber" },
  { id: "SIM-023", scenario: "VOCs acima do baseline", gem: "Scorpios", gemCode: "GEM-01", process: "Pintura E-coat", status: "Concluída", roi: "3.7 : 1", date: "há 2h", accent: "green" },
  { id: "SIM-022", scenario: "Invasão zona de exclusão", gem: "Forja Nação", gemCode: "GEM-02", process: "Prensa hidráulica", status: "Concluída", roi: "2.9 : 1", date: "ontem", accent: "cyan" },
  { id: "SIM-021", scenario: "Viés na inspeção visual", gem: "CyberNetics", gemCode: "GEM-04", process: "Inspeção automatizada", status: "Em revisão", roi: "—", date: "ontem", accent: "purple" },
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

function RoiPanel({ onRegisterDecision }: { onRegisterDecision?: () => void }) {
  return <div className="roi-panel"><div className="roi-main"><span className="roi-eyebrow">ROI PROJETADO</span><strong>4.2<span>:1</span></strong><Badge tone="green"><ArrowUpRight size={12} /> acima do gate mínimo</Badge></div><div className="roi-metrics"><div><span>Investimento</span><strong>R$ 18.4k</strong></div><div><span>Economia anual</span><strong>R$ 77.2k</strong></div><div><span>Payback</span><strong>2.9 meses</strong></div><div><span>VPL 12 meses</span><strong>R$ 58.8k</strong></div></div><div className="roi-decision"><div className="decision-icon"><CheckCircle2 size={16} /></div><div><strong>Recomendação: aprovar piloto</strong><span>Gate financeiro aprovado pelo CFO Agent · confiança 91%</span></div><button onClick={() => { onRegisterDecision?.(); toast.success("Decisão registrada", { description: "Piloto aprovado para a próxima rodada" }); }}>Registrar decisão <ArrowUpRight size={14} /></button></div></div>;
}

type GovernanceDecisionRecord = {
  id: number;
  decision: string;
  rationale: string;
  status: "Registrada" | "Aprovada" | "Rejeitada";
  createdAt: Date | string;
};

function GovernanceAuditTrail({ decisionId }: { decisionId: number }) {
  const { data: audits } = trpc.governance.audit.useQuery({ decisionId });
  return <div className="governance-audit-trail">{audits?.slice(0, 4).map((audit) => <span key={audit.id}><History size={10} /> <strong>{audit.action}</strong> · {audit.authorName} · {new Date(audit.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>)}</div>;
}

function GovernancePanel({ decisions, onUpdate, statusFilter, periodFilter, onStatusFilterChange, onPeriodFilterChange }: { decisions: GovernanceDecisionRecord[]; onUpdate: (id: number, decision: string, rationale: string, status: GovernanceDecisionRecord["status"]) => void; statusFilter: string; periodFilter: string; onStatusFilterChange: (value: string) => void; onPeriodFilterChange: (value: string) => void }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftDecision, setDraftDecision] = useState("");
  const [draftRationale, setDraftRationale] = useState("");
  const beginEdit = (item: GovernanceDecisionRecord) => { setEditingId(item.id); setDraftDecision(item.decision); setDraftRationale(item.rationale); };
  return <section className="governance-panel"><SectionHeader icon={ShieldCheck} eyebrow="GOVERNANCE LEDGER" title="Decisões persistidas" action={<div className="governance-filter-tools"><select aria-label="Filtrar decisões por status" value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)}><option>Todos</option><option>Aprovada</option><option>Registrada</option><option>Rejeitada</option></select><select aria-label="Filtrar decisões por período" value={periodFilter} onChange={(event) => onPeriodFilterChange(event.target.value)}><option value="Todos">Todo período</option><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option></select><Badge tone="cyan">{decisions.length} registradas</Badge></div>} /><div className="governance-decision-list">{decisions.map((item) => editingId === item.id ? <div className="governance-decision-row" key={item.id}><div className="governance-edit-grid"><input value={draftDecision} onChange={(event) => setDraftDecision(event.target.value)} aria-label="Título da decisão" /><textarea value={draftRationale} onChange={(event) => setDraftRationale(event.target.value)} aria-label="Justificativa da decisão" /><div className="governance-decision-actions"><button onClick={() => { onUpdate(item.id, draftDecision, draftRationale, item.status); setEditingId(null); }}><Check size={12} /> Salvar</button><button className="reject" onClick={() => setEditingId(null)}><X size={12} /> Cancelar</button></div></div></div> : <div className="governance-decision-row" key={item.id}><div className="governance-decision-top"><strong>{item.decision}</strong><Badge tone={item.status === "Aprovada" ? "green" : item.status === "Rejeitada" ? "red" : "amber"}>{item.status}</Badge></div><p>{item.rationale}</p><GovernanceAuditTrail decisionId={item.id} /><div className="governance-decision-actions"><button onClick={() => beginEdit(item)}><Pencil size={12} /> Editar</button>{item.status !== "Aprovada" && <button onClick={() => onUpdate(item.id, item.decision, item.rationale, "Aprovada")}><Check size={12} /> Aprovar</button>}{item.status !== "Rejeitada" && <button className="reject" onClick={() => onUpdate(item.id, item.decision, item.rationale, "Rejeitada")}><X size={12} /> Rejeitar</button>}</div></div>)}{decisions.length === 0 && <span className="governance-empty">Nenhuma decisão foi registrada para esta simulação.</span>}</div></section>;
}

function AiAssistant({ onClose, simulationId }: { onClose: () => void; simulationId: string }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "assistant" | "user"; text: string }>>([]);
  const { data: storedMessages } = trpc.copilot.list.useQuery({ simulationId });
  const trpcUtils = trpc.useUtils();
  const createMessage = trpc.copilot.create.useMutation({ onSuccess: () => trpcUtils.copilot.list.invalidate({ simulationId }) });
  useEffect(() => {
    if (storedMessages?.length) setMessages(storedMessages.map((item) => ({ role: item.role, text: item.message })));
    else if (storedMessages) setMessages([{ role: "assistant", text: "Analisei os dados da SIM-024. Encontrei uma tendência de deterioração no processo e três oportunidades de melhoria priorizadas." }, { role: "assistant", text: "A causa dominante é desgaste da ferramenta (42%). Recomendo reduzir a troca preventiva para 360 ciclos e validar o piloto com uma nova rodada de 30 dias." }]);
  }, [storedMessages]);
  const sendMessage = (prompt = input) => {
    const clean = prompt.trim();
    if (!clean) return;
    const response = clean.toLowerCase().includes("roi") ? "O ROI projetado é 4,2:1, com payback de 2,9 meses. O cenário supera o gate mínimo de 3:1 e está pronto para aprovação do piloto." : clean.toLowerCase().includes("melhor") || clean.toLowerCase().includes("ação") ? "Priorize: 1) troca preventiva em 360 ciclos; 2) checklist de setup; 3) inspeção da matéria-prima no recebimento. Essas ações atacam 80% do impacto observado." : "Minha leitura indica processo instável, com 12 pontos fora dos limites de controle. Posso detalhar o plano de ação, o impacto financeiro ou comparar com outra rodada.";
    setMessages((items) => [...items, { role: "user", text: clean }, { role: "assistant", text: response }]);
    createMessage.mutate({ simulationId, role: "user", message: clean });
    createMessage.mutate({ simulationId, role: "assistant", message: response });
    setInput("");
  };
  return <section className="ai-copilot-card"><div className="ai-copilot-header"><div className="ai-title-wrap"><div className="ai-orb"><Sparkles size={16} /></div><div><span className="detail-eyebrow">COPILOTO CIOS</span><h3>Analista de processo</h3></div><Badge tone="green"><span className="status-live-dot" /> online</Badge></div><button className="ai-close" onClick={onClose}><X size={16} /></button></div><div className="ai-context"><span><BarChart3 size={13} /> Lendo SPC, Pareto, FMEA e ROI</span><span>contexto: SIM-024</span></div><div className="ai-messages">{messages.map((message, index) => <div className={`ai-message ${message.role}`} key={`${message.role}-${index}`}><div className="ai-message-icon">{message.role === "assistant" ? <Sparkles size={12} /> : <span>CA</span>}</div><p>{message.text}</p></div>)}</div><div className="ai-quick-prompts"><button onClick={() => sendMessage("Quais melhorias devo priorizar?")}><Lightbulb size={12} /> Priorizar melhorias</button><button onClick={() => sendMessage("Explique o ROI")}>ROI da recomendação</button><button onClick={() => sendMessage("Como estabilizar o processo?")}>Estabilizar SPC</button></div><div className="ai-input-row"><input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === "Enter" && sendMessage()} placeholder="Pergunte sobre os resultados..." /><button onClick={() => sendMessage()} aria-label="Enviar pergunta"><Send size={14} /></button></div></section>;
}

function ComparePanel({ history, onClose }: { history: HistoryRun[]; onClose: () => void }) {
  const completed = history.filter((item) => item.status === "Concluída");
  const [leftId, setLeftId] = useState(completed[0]?.id ?? "SIM-023");
  const [rightId, setRightId] = useState(completed[1]?.id ?? "SIM-022");
  const left = history.find((item) => item.id === leftId) ?? history[1];
  const right = history.find((item) => item.id === rightId) ?? history[2];
  return <section className="compare-card"><div className="compare-header"><div><span className="detail-eyebrow">SCENARIO COMPARISON</span><h3>Comparar resultados lado a lado</h3><p>Selecione duas execuções concluídas para identificar ganhos, riscos e diferenças de processo.</p></div><button className="ai-close" onClick={onClose}><X size={16} /></button></div><div className="compare-selectors"><label><span>Rodada A</span><select value={left?.id} onChange={(event) => setLeftId(event.target.value)}>{completed.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.scenario}</option>)}</select></label><div className="compare-vs">VS</div><label><span>Rodada B</span><select value={right?.id} onChange={(event) => setRightId(event.target.value)}>{completed.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.scenario}</option>)}</select></label></div><div className="compare-columns"><div className="compare-column compare-a"><div className="compare-column-head"><Badge tone="cyan">RODADA A</Badge><strong>{left?.scenario}</strong><span>{left?.id} · {left?.date}</span></div><div className="compare-metric"><span>Refugo</span><strong>4.0%</strong><small>baseline</small></div><div className="compare-metric"><span>Cpk</span><strong>1.41</strong><small className="good">acima do gate</small></div><div className="compare-metric"><span>ROI</span><strong>{left?.roi}</strong><small>projetado</small></div></div><div className="compare-delta"><div><ArrowUpRight size={13} /><strong>-6.0 pp</strong><span>refugo</span></div><div><TrendingUp size={13} /><strong>+0.59</strong><span>Cpk</span></div><div><GitCompare size={13} /><strong>+1.3x</strong><span>ROI</span></div></div><div className="compare-column compare-b"><div className="compare-column-head"><Badge tone="amber">RODADA B</Badge><strong>{right?.scenario}</strong><span>{right?.id} · {right?.date}</span></div><div className="compare-metric"><span>Refugo</span><strong>10.0%</strong><small className="warn">acima da meta</small></div><div className="compare-metric"><span>Cpk</span><strong className="warn">0.82</strong><small className="warn">abaixo do gate</small></div><div className="compare-metric"><span>ROI</span><strong>{right?.roi}</strong><small>projetado</small></div></div></div><div className="compare-insight"><Sparkles size={14} /><span><strong>Leitura do Analyst Agent:</strong> a Rodada A é 60% mais estável e preserva capacidade. A diferença sugere que a troca preventiva de ferramenta deve ser mantida como controle padrão.</span></div></section>;
}

function PdfReportSheet({ scenario, gemName, gemCode, history }: { scenario: string; gemName: string; gemCode: string; history: HistoryRun[] }) {
  return <section className="pdf-report-sheet"><div className="pdf-report-brand"><span>INDUSTRIAL GEMS · CIOS v3.0</span><strong>RELATÓRIO DE SIMULAÇÃO</strong></div><div className="pdf-report-title"><span>SIMULATION WORKBENCH</span><h1>{scenario}</h1><p>{gemCode} · {gemName} · relatório gerado em {new Date().toLocaleString("pt-BR")}</p></div><div className="pdf-report-kpis"><div><span>Refugo atual</span><strong>11.0%</strong></div><div><span>Cpk</span><strong>0.82</strong></div><div><span>Paradas</span><strong>14.6 h</strong></div><div><span>ROI projetado</span><strong>4.2 : 1</strong></div></div><div className="pdf-report-grid"><div className="detail-card"><SectionHeader icon={Gauge} eyebrow="STATISTICAL PROCESS CONTROL" title="Carta de controle · % refugo" /><SpcChart /></div><div className="detail-card"><SectionHeader icon={BarChart3} eyebrow="ANALYSE" title="Pareto de causas" /><ParetoChart /></div><div className="detail-card"><SectionHeader icon={ShieldCheck} eyebrow="RISK ENGINEERING" title="FMEA dinâmica" /><FmeaTable /></div><div className="detail-card"><SectionHeader icon={TrendingUp} eyebrow="FINANCIAL GATE" title="Retorno da melhoria" /><RoiPanel /></div></div><div className="pdf-report-history"><h2>Histórico filtrado</h2><table><thead><tr><th>ID</th><th>Cenário</th><th>Processo</th><th>Status</th><th>ROI</th></tr></thead><tbody>{history.map((run) => <tr key={run.id}><td>{run.id}</td><td>{run.scenario}</td><td>{run.process}</td><td>{run.status}</td><td>{run.roi}</td></tr>)}</tbody></table></div><footer>Documento sintético para simulação de aplicação de IA industrial · Dados fictícios · Industrial GEMS Lab</footer></section>;
}

function mapStoredRun(run: { id: string; scenario: string; gemName: string; gemCode?: string; process?: string; status: HistoryRun["status"]; roi: string; createdAt: Date | string }): HistoryRun {
  const date = new Date(run.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  return { id: run.id, scenario: run.scenario, gem: run.gemName.split(" ")[0], gemCode: run.gemCode ?? "GEM-01", process: run.process ?? "Usinagem CNC", status: run.status, roi: run.roi, date, accent: run.status === "Concluída" ? "green" : run.status === "Em revisão" ? "purple" : "amber" };
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
  const [showAssistant, setShowAssistant] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("Todos");
  const [gemFilter, setGemFilter] = useState("Todos");
  const [processFilter, setProcessFilter] = useState("Todos");
  const [periodFilter, setPeriodFilter] = useState("Todos");
  const [governanceStatusFilter, setGovernanceStatusFilter] = useState("Todos");
  const [governancePeriodFilter, setGovernancePeriodFilter] = useState("Todos");
  const [hasBootstrapped, setHasBootstrapped] = useState(false);
  const isUnfiltered = gemFilter === "Todos" && processFilter === "Todos" && periodFilter === "Todos" && historyFilter === "Todos";
  const simulationFilters = useMemo(() => ({
    gemCode: gemFilter === "Todos" ? undefined : gemFilter,
    process: processFilter === "Todos" ? undefined : processFilter,
    status: historyFilter === "Todos" ? undefined : historyFilter as "Concluída" | "Em revisão" | "Executando",
    from: periodFilter === "Todos" ? undefined : new Date(Date.now() - Number(periodFilter) * 24 * 60 * 60 * 1000),
  }), [gemFilter, processFilter, periodFilter, historyFilter]);
  const { data: storedRuns } = trpc.simulations.list.useQuery(simulationFilters);
  const trpcUtils = trpc.useUtils();
  const bootstrapRuns = trpc.simulations.bootstrap.useMutation({ onSuccess: () => trpcUtils.simulations.list.invalidate() });
  const createRun = trpc.simulations.create.useMutation();
  const completeRun = trpc.simulations.complete.useMutation({ onSuccess: () => trpcUtils.simulations.list.invalidate() });
  const activeSimulationId = history.find((item) => item.scenario === scenario)?.id ?? history[0]?.id ?? "SIM-024";
  const governanceListInput = useMemo(() => ({ simulationId: activeSimulationId, status: governanceStatusFilter === "Todos" ? undefined : governanceStatusFilter as "Registrada" | "Aprovada" | "Rejeitada", from: governancePeriodFilter === "Todos" ? undefined : new Date(Date.now() - Number(governancePeriodFilter) * 24 * 60 * 60 * 1000) }), [activeSimulationId, governanceStatusFilter, governancePeriodFilter]);
  const { data: governanceDecisions } = trpc.governance.list.useQuery(governanceListInput);
  const registerDecision = trpc.governance.create.useMutation({ onSuccess: () => trpcUtils.governance.list.invalidate({ simulationId: activeSimulationId }) });
  const updateDecision = trpc.governance.update.useMutation({ onSuccess: () => { trpcUtils.governance.list.invalidate({ simulationId: activeSimulationId }); toast.success("Decisão atualizada", { description: "O ledger de governança foi sincronizado." }); } });

  useEffect(() => {
    if (!storedRuns) return;
    if (storedRuns.length === 0 && isUnfiltered && !hasBootstrapped) {
      setHasBootstrapped(true);
      bootstrapRuns.mutate();
      return;
    }
    if (storedRuns.length > 0) setHistory(storedRuns.map(mapStoredRun));
  }, [storedRuns, hasBootstrapped, isUnfiltered]);

  const filteredHistory = history;

  const saveDecision = () => {
    registerDecision.mutate({ simulationId: activeSimulationId, decision: "APROVAR PILOTO", rationale: "Troca preventiva de ferramenta de 480 para 360 ciclos; gate financeiro aprovado pelo CFO Agent.", status: "Aprovada" });
  };

  const saveGovernanceUpdate = (id: number, decision: string, rationale: string, status: "Registrada" | "Aprovada" | "Rejeitada") => {
    updateDecision.mutate({ id, decision, rationale, status });
  };

  const exportPdf = () => {
    document.body.classList.add("print-report-only");
    toast.info("Relatório completo pronto para PDF", { description: "Inclui SPC, Pareto, FMEA, ROI e histórico filtrado." });
    window.setTimeout(() => { window.print(); document.body.classList.remove("print-report-only"); }, 350);
  };

  const exportCsv = () => {
    const escapeCell = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const rows = filteredHistory.map((run) => [run.id, run.scenario, run.gemCode, run.gem, run.process, run.status, run.roi, run.date].map(escapeCell).join(";"));
    const csv = ["ID;Cenário;GEM;Ambiente;Processo;Status;ROI;Data", ...rows].join("\n");
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `industrial-gems-historico-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado", { description: `${filteredHistory.length} execução(ões) filtrada(s).` });
  };

  const exportHistoryPdf = () => {
    document.body.classList.add("print-history-only");
    toast.info("Histórico pronto para PDF", { description: "Na janela de impressão, selecione ‘Salvar como PDF’." });
    window.setTimeout(() => { window.print(); document.body.classList.remove("print-history-only"); }, 350);
  };

  const executeScenario = () => {
    if (!scenario.trim()) { toast.error("Informe um nome para o cenário"); return; }
    setIsExecuting(true);
    createRun.mutate({ gemCode, gemName, scenario, process, baselinePct: Number(baseline), targetPct: Number(target), windowDays: Number(days), failureMode: "Desgaste progressivo" }, {
      onSuccess: (created) => {
        const newRun = mapStoredRun(created);
        setHistory((items) => [newRun, ...items.filter((item) => item.id !== newRun.id)]);
        toast.success("Cenário persistido", { description: `${newRun.id} · gerando dados sintéticos` });
        window.setTimeout(() => completeRun.mutate({ id: created.id, roi: "4.6 : 1", resultSummary: "SPC, Pareto e FMEA atualizados após execução parametrizada." }, { onSuccess: (completed) => { setIsExecuting(false); setHistory((items) => items.map((item) => item.id === completed.id ? mapStoredRun(completed) : item)); toast.success("Execução concluída", { description: "Resultados salvos no banco de dados" }); }, onError: () => { setIsExecuting(false); toast.error("Não foi possível salvar os resultados"); } }), 1700);
      },
      onError: () => { setIsExecuting(false); toast.error("Não foi possível persistir a simulação", { description: "Verifique a conexão com o banco de dados" }); },
    });
  };

  return <div className="detail-overlay"><div className="detail-shell">
    <header className="detail-topbar"><div className="detail-top-left"><button className="detail-back" onClick={onClose}><ArrowLeft size={16} /> Command Center</button><span className="detail-divider">/</span><span className="detail-current">{gemCode} · {scenario}</span></div><div className="detail-top-actions"><span className="synthetic-label"><span className="pulse-dot" /> DADOS SINTÉTICOS</span><button className="detail-tool-button" onClick={() => setShowAssistant(!showAssistant)}><MessageCircle size={14} /> Copiloto IA</button><button className="detail-tool-button" onClick={() => setShowCompare(!showCompare)}><GitCompare size={14} /> Comparar</button><button className="detail-tool-button pdf-tool" onClick={exportPdf}><Download size={14} /> PDF</button><button className="detail-close" onClick={onClose} aria-label="Fechar"><X size={18} /></button></div></header>
    <div className="detail-content">
      <section className="detail-heading"><div><div className="detail-heading-kicker"><span className="heading-accent" /> SIMULATION WORKBENCH <span className="detail-version">CIOS v3.0</span></div><h1>{scenario}<span>.</span></h1><div className="detail-heading-meta"><Badge tone="amber"><span className="tiny-pulse" /> Executando</Badge><span><GitBranch size={13} /> {gemName}</span><span><Clock3 size={13} /> SIM-024 · rodada 04</span><span><Settings2 size={13} /> Semente 2026-024</span></div></div><div className="detail-heading-actions"><button className="secondary-button" onClick={() => setShowForm(!showForm)}><Settings2 size={14} /> Parametrizar</button><button className="detail-run-button" onClick={executeScenario} disabled={isExecuting}><Play size={14} fill="currentColor" /> {isExecuting ? "Executando..." : "Executar rodada"}</button></div></section>
      <nav className="detail-tabs">{tabs.map((tab) => <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>{tab}{tab === "SPC & Capacidade" && <span className="tab-new">LIVE</span>}</button>)}<span className="tabs-spacer" /><button className={`tab-tool ${showAssistant ? "active-tool" : ""}`} onClick={() => setShowAssistant(!showAssistant)}><MessageCircle size={13} /> Perguntar ao CIOS</button><button className={`tab-tool ${showCompare ? "active-tool" : ""}`} onClick={() => setShowCompare(!showCompare)}><GitCompare size={13} /> Comparar rodadas</button></nav>
      {showAssistant && <AiAssistant onClose={() => setShowAssistant(false)} simulationId={activeSimulationId} />}
      {showCompare && <ComparePanel history={history} onClose={() => setShowCompare(false)} />}
      {showForm && <section className="scenario-form-card"><div className="scenario-form-head"><div><span className="detail-eyebrow">SCENARIO BUILDER</span><h3>Parametrizar nova rodada</h3></div><button onClick={() => setShowForm(false)}><X size={16} /></button></div><div className="scenario-form-grid"><label>Nome do cenário<input value={scenario} onChange={(e) => setScenario(e.target.value)} /></label><label>Processo<select value={process} onChange={(e) => setProcess(e.target.value)}><option>Usinagem CNC</option><option>Estamparia</option><option>Pintura E-coat</option><option>Montagem</option></select></label><label>Baseline de refugo (%)<input type="number" value={baseline} onChange={(e) => setBaseline(e.target.value)} /></label><label>Meta de refugo (%)<input type="number" value={target} onChange={(e) => setTarget(e.target.value)} /></label><label>Janela de dados (dias)<input type="number" value={days} onChange={(e) => setDays(e.target.value)} /></label><label>Injeção de falha<select defaultValue="Desgaste progressivo"><option>Desgaste progressivo</option><option>Setup fora do padrão</option><option>Variação de matéria-prima</option><option>Sem falha (baseline)</option></select></label></div><div className="scenario-form-foot"><span><Sparkles size={14} /> Dados serão gerados com semente reprodutível</span><button className="save-scenario" onClick={() => { setShowForm(false); toast.success("Parâmetros salvos", { description: `${process} · ${days} dias · baseline ${baseline}% → meta ${target}%` }); }}><Save size={14} /> Salvar parâmetros</button></div></section>}
      <section className="detail-kpi-row"><div className="detail-kpi-card"><div className="detail-kpi-top"><span>REFUGO ATUAL</span><TriangleAlert size={15} /></div><strong>11.0<span>%</span></strong><div className="kpi-change negative"><ArrowUpRight size={12} /> +7.0 pp vs. baseline</div></div><div className="detail-kpi-card"><div className="detail-kpi-top"><span>CAPACIDADE Cpk</span><Gauge size={15} /></div><strong>0.82</strong><div className="kpi-change negative"><ArrowDownRight size={12} /> abaixo de 1.33 mínimo</div></div><div className="detail-kpi-card"><div className="detail-kpi-top"><span>PARADAS</span><Zap size={15} /></div><strong>14.6<span>h</span></strong><div className="kpi-change negative"><ArrowUpRight size={12} /> +34% vs. ciclo anterior</div></div><div className="detail-kpi-card kpi-positive"><div className="detail-kpi-top"><span>ROI PROJETADO</span><TrendingUp size={15} /></div><strong>4.2<span>:1</span></strong><div className="kpi-change positive"><ArrowUpRight size={12} /> gate financeiro aprovado</div></div></section>
      {activeTab === "Overview" && <>
        <section className="detail-analysis-grid"><div className="detail-card spc-card"><SectionHeader icon={ActivityIcon} eyebrow="STATISTICAL PROCESS CONTROL" title="Carta de controle · % refugo" action={<div className="chart-status"><span className="status-live-dot" /> monitorando</div>} /><SpcChart /><div className="chart-summary"><span><i className="summary-dot cyan" /> Processo instável</span><span>12 pontos fora do controle</span><span>σ = 2.1%</span></div></div><div className="detail-card pareto-card"><SectionHeader icon={BarChart3} eyebrow="ANALYSE" title="Pareto de causas" action={<button className="card-menu"><MoreHorizontal size={15} /></button>} /><ParetoChart /><div className="insight-callout"><Lightbulb size={14} /><span><strong>Insight do Analyst Agent</strong> Desgaste da ferramenta responde por 42% do refugo.</span></div></div></section>
        <section className="detail-analysis-grid second"><div className="detail-card fmea-card"><SectionHeader icon={ShieldCheck} eyebrow="RISK ENGINEERING" title="FMEA dinâmica" action={<Badge tone="red">1 risco crítico</Badge>} /><FmeaTable /><div className="table-foot"><span><span className="legend-square red" /> RPN &gt; 200 requer ação imediata</span><button onClick={() => setActiveTab("FMEA")}>Ver análise completa <ArrowUpRight size={13} /></button></div></div><div className="detail-card decision-card"><SectionHeader icon={Target} eyebrow="DECISION ENGINE" title="Decisão recomendada" /><div className="decision-hero"><div className="recommendation-icon"><Sparkles size={20} /></div><div><Badge tone="green">APROVAR PILOTO</Badge><h4>Troca preventiva de ferramenta</h4><p>Reduzir intervalo de troca de 480 para 360 ciclos.</p></div></div><div className="decision-list"><div><span>Impacto esperado</span><strong>↓ 6.8 pp refugo</strong></div><div><span>Confiança dos agentes</span><strong>91%</strong></div><div><span>Gate humano</span><strong className="human-ok"><CheckCircle2 size={13} /> aprovado</strong></div></div><button className="decision-button" onClick={() => toast.success("Plano de ação criado", { description: "5W2H adicionado ao workspace" })}>Criar plano 5W2H <ArrowUpRight size={14} /></button></div></section>
        <section className="detail-card roi-card"><SectionHeader icon={TrendingUp} eyebrow="FINANCIAL GATE" title="Retorno da melhoria" action={<button className="expand-button" onClick={() => setActiveTab("ROI & Decisão")}>Detalhar ROI <ArrowUpRight size={13} /></button>} /><RoiPanel onRegisterDecision={saveDecision} /></section>
      </>}
      {activeTab === "SPC & Capacidade" && <section className="detail-card tab-expanded"><SectionHeader icon={Gauge} eyebrow="STATISTICAL PROCESS CONTROL" title="SPC & capacidade do processo" /><SpcChart /><div className="expanded-stats"><div><span>Cp</span><strong>0.91</strong><small>potencial</small></div><div><span>Cpk</span><strong className="negative-text">0.82</strong><small>realizado</small></div><div><span>σ do processo</span><strong>2.1%</strong><small>desvio padrão</small></div><div><span>Fora de controle</span><strong className="negative-text">12</strong><small>observações</small></div></div></section>}
      {activeTab === "Pareto" && <section className="detail-card tab-expanded"><SectionHeader icon={BarChart3} eyebrow="ANALYSE ENGINE" title="Pareto de causas de refugo" /><ParetoChart /><div className="pareto-explanation"><strong>Regra 80/20:</strong> as três primeiras causas concentram <span>80% do impacto</span>. A recomendação prioriza desgaste de ferramenta e setup porque possuem maior controlabilidade e ROI de intervenção.</div></section>}
      {activeTab === "FMEA" && <section className="detail-card tab-expanded"><SectionHeader icon={ShieldCheck} eyebrow="RISK ENGINEERING" title="FMEA dinâmica da CNC-02" /><FmeaTable /><div className="fmea-action-grid"><div><span>Risco prioritário</span><strong>Desgaste da ferramenta</strong></div><div><span>RPN atual</span><strong className="rpn-high">280</strong></div><div><span>Ação recomendada</span><strong>Troca preventiva a cada 360 ciclos</strong></div></div></section>}
      {activeTab === "ROI & Decisão" && <section className="detail-card tab-expanded"><SectionHeader icon={TrendingUp} eyebrow="FINANCIAL GATE" title="Caso econômico e decisão" /><RoiPanel onRegisterDecision={saveDecision} /><div className="decision-audit"><Check size={15} /><span>Validação registrada: CFO Agent · Lean Master Agent · Human Gate · {governanceDecisions?.length ?? 0} decisão(ões) persistida(s)</span></div><GovernancePanel decisions={(governanceDecisions ?? []) as GovernanceDecisionRecord[]} onUpdate={saveGovernanceUpdate} statusFilter={governanceStatusFilter} periodFilter={governancePeriodFilter} onStatusFilterChange={setGovernanceStatusFilter} onPeriodFilterChange={setGovernancePeriodFilter} /></section>}
      <section className="detail-card history-card"><div className="history-head"><SectionHeader icon={History} eyebrow="EXPERIMENT LOG" title="Histórico de execuções" /><div className="history-filters"><select aria-label="Filtrar por GEM" value={gemFilter} onChange={(event) => setGemFilter(event.target.value)}><option value="Todos">Todos os GEMS</option><option value="GEM-01">GEM-01 · Scorpios</option><option value="GEM-02">GEM-02 · Forja</option><option value="GEM-03">GEM-03 · Helvetia</option><option value="GEM-04">GEM-04 · CyberNetics</option></select><select aria-label="Filtrar por processo" value={processFilter} onChange={(event) => setProcessFilter(event.target.value)}><option value="Todos">Todos os processos</option><option>Usinagem CNC</option><option>Pintura E-coat</option><option>Prensa hidráulica</option><option>Inspeção automatizada</option></select><select aria-label="Filtrar por período" value={periodFilter} onChange={(event) => setPeriodFilter(event.target.value)}><option value="Todos">Todo período</option><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option></select><select aria-label="Filtrar por status" value={historyFilter} onChange={(event) => setHistoryFilter(event.target.value)}><option>Todos</option><option>Concluída</option><option>Em revisão</option><option>Executando</option></select><button className="history-export-button" onClick={exportCsv}><Download size={12} /> CSV</button><button className="history-export-button" onClick={exportHistoryPdf}><Download size={12} /> PDF</button></div></div><div className="history-list">{filteredHistory.map((run) => <div className="history-row" key={run.id}><div className={`history-run-icon ${run.accent}`}><FlaskConical size={15} /></div><div className="history-run-main"><strong>{run.scenario}</strong><span>{run.id} · {run.gem} · {run.process} · {run.date}</span></div><Badge tone={run.status === "Concluída" ? "green" : run.status === "Executando" ? "amber" : "purple"}>{run.status === "Executando" && <span className="tiny-pulse" />}{run.status}</Badge><span className="history-roi">{run.roi}</span><button className="history-open" onClick={() => toast.info("Execução selecionada", { description: `${run.id} · ${run.scenario}` })}>Abrir <ArrowUpRight size={13} /></button></div>)}</div>{filteredHistory.length === 0 && <div className="history-empty">Nenhuma execução corresponde aos filtros selecionados.</div>}</section>
      <PdfReportSheet scenario={scenario} gemName={gemName} gemCode={gemCode} history={filteredHistory} />
    </div>
  </div></div>;
}

function ActivityIcon(props: React.ComponentProps<typeof Gauge>) { return <Zap {...props} />; }
