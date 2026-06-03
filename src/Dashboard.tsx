import { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "sonner";
import { Button } from "./components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select"
import { Calendar } from "./components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./components/ui/alert-dialog"

// @ts-ignore
import logoImg from "./logo.png"

type Transacao = {
  id: string
  descricao: string
  categoria: string
  banco: string
  valor: number
  tipo: "entrada" | "saida"
  data: string
  status: "realizado" | "pendente"
}

interface DashboardProps {
  currentUser: {
    id: string;
    nome: string;
    email: string;
  };
  onLogout: () => void;
}

export default function Dashboard({ currentUser, onLogout }: DashboardProps) {
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [viewAtual, setViewAtual] = useState<'painel' | 'formulario'>('painel')
  const [tipoAtual, setTipoAtual] = useState<"entrada" | "saida">("saida")
  
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [mostrarTodas, setMostrarTodas] = useState(false)

  const [categorias, setCategorias] = useState<string[]>(["Alimentação", "Moradia", "Transporte", "Lazer", "Salário", "Freelance"])
  const [bancos, setBancos] = useState<string[]>(["Nubank", "Itaú", "Inter", "Carteira"])
  
  const [descricao, setDescricao] = useState("")
  const [valor, setValor] = useState("")
  const [categoria, setCategoria] = useState("")
  const [banco, setBanco] = useState("")
  const [dataTransacao, setDataTransacao] = useState<Date | undefined>(new Date())
  const [status, setStatus] = useState<"realizado" | "pendente">("realizado")
  const [modoRepeticao, setModoRepeticao] = useState<"avista" | "parcelado" | "recorrente">("avista")
  const [parcelas, setParcelas] = useState("2")

  const [criandoCategoria, setCriandoCategoria] = useState(false)
  const [novaCategoriaNome, setNovaCategoriaNome] = useState("")
  const [criandoBanco, setCriandoBanco] = useState(false)
  const [novoBancoNome, setNovoBancoNome] = useState("")

  const [graficoView, setGraficoView] = useState<'semana' | 'mes'>('semana')

  const [mesSelecionado, setMesSelecionado] = useState(() => {
    const hoje = new Date()
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
  })

  // CHAVES DINÂMICAS EXCLUSIVAS POR USUÁRIO
  const chavesDB = useMemo(() => ({
    transacoes: `@financas:${currentUser.id}:transacoes`,
    categorias: `@financas:${currentUser.id}:categorias`,
    bancos: `@financas:${currentUser.id}:bancos`
  }), [currentUser.id])

  const mesesDisponiveis = useMemo(() => {
    return Array.from({length: 12}, (_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      return {
        value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
      }
    })
  }, [])

  const carregarDados = () => {
    try {
      const dbTransacoes = localStorage.getItem(chavesDB.transacoes)
      const dbCategorias = localStorage.getItem(chavesDB.categorias)
      const dbBancos = localStorage.getItem(chavesDB.bancos)
      
      if (dbTransacoes) {
        const parsed = JSON.parse(dbTransacoes)
        if (Array.isArray(parsed)) setTransacoes(parsed.filter((t: any) => t && t.id))
      } else {
        setTransacoes([]) // Garante painel limpo se não houver dados
      }
      
      if (dbCategorias) {
        const parsed = JSON.parse(dbCategorias)
        if (Array.isArray(parsed) && parsed.length > 0) setCategorias(parsed)
      }
      
      if (dbBancos) {
        const parsed = JSON.parse(dbBancos)
        if (Array.isArray(parsed) && parsed.length > 0) setBancos(parsed)
      }
    } catch (e) {
      console.error("Erro ao carregar os dados:", e)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [chavesDB])

  useEffect(() => {
    // Salva automaticamente nos bancos de dados específicos do usuário atual
    if (transacoes.length > 0 || localStorage.getItem(chavesDB.transacoes)) {
      localStorage.setItem(chavesDB.transacoes, JSON.stringify(transacoes))
    }
    localStorage.setItem(chavesDB.categorias, JSON.stringify(categorias))
    localStorage.setItem(chavesDB.bancos, JSON.stringify(bancos))
  }, [transacoes, categorias, bancos, chavesDB])

  const formatarMoeda = (valorNum: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorNum)
  }

  const formatarDataBr = (dataIso: string) => {
    if (!dataIso || !dataIso.includes('-')) return 'Recente'
    const partes = dataIso.split('-')
    return `${partes[2]}/${partes[1]}/${partes[0]}`
  }

  const transacoesMesSelecionado = useMemo(() => {
    return transacoes.filter(t => t.data.startsWith(mesSelecionado))
  }, [transacoes, mesSelecionado])

  const receitasRealizadas = transacoesMesSelecionado.filter(t => t.tipo === "entrada" && t.status === "realizado").reduce((acc, t) => acc + t.valor, 0)
  const despesasRealizadas = transacoesMesSelecionado.filter(t => t.tipo === "saida" && t.status === "realizado").reduce((acc, t) => acc + t.valor, 0)
  const saldoAtual = receitasRealizadas - despesasRealizadas
  const saldoGeralAcumulado = transacoes.filter(t => t.tipo === "entrada" && t.status === "realizado").reduce((acc, t) => acc + t.valor, 0) - transacoes.filter(t => t.tipo === "saida" && t.status === "realizado").reduce((acc, t) => acc + t.valor, 0)

  const dadosSparkline = useMemo(() => {
    const partes = mesSelecionado.split('-')
    const anoSel = parseInt(partes[0])
    const mesSel = parseInt(partes[1])
    const result = []
    
    let receitasAnterior = 0, despesasAnterior = 0, saldoAnterior = 0

    for (let i = 4; i >= 0; i--) {
      const d = new Date(anoSel, mesSel - 1 - i, 1)
      const strAnoMes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const label = d.toLocaleString('pt-BR', { month: 'short' })
      
      const tMes = transacoes.filter(t => t.data.startsWith(strAnoMes) && t.status === "realizado")
      const rec = tMes.filter(t => t.tipo === "entrada").reduce((acc, t) => acc + t.valor, 0)
      const des = tMes.filter(t => t.tipo === "saida").reduce((acc, t) => acc + t.valor, 0)
      const sal = rec - des

      if (i === 1) {
        receitasAnterior = rec; despesasAnterior = des; saldoAnterior = sal;
      }

      result.push({ name: label, entradas: rec, saidas: des, saldo: sal })
    }

    const calcPerc = (atual: number, ant: number) => {
      if (ant === 0) return atual > 0 ? 100 : 0
      return Math.round(((atual - ant) / Math.abs(ant)) * 100)
    }

    return {
      historico: result,
      percSaldo: calcPerc(saldoAtual, saldoAnterior),
      percReceitas: calcPerc(receitasRealizadas, receitasAnterior),
      percDespesas: calcPerc(despesasRealizadas, despesasAnterior)
    }
  }, [transacoes, mesSelecionado, saldoAtual, receitasRealizadas, despesasRealizadas])

  const dadosGraficoDisplay = useMemo(() => {
    if (graficoView === 'semana') {
      const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      const result = [];
      const hoje = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(hoje);
        d.setDate(d.getDate() - i);
        const dataIso = d.toISOString().split('T')[0];
        const tDia = transacoes.filter(t => t.data === dataIso && t.status === 'realizado');
        result.push({
          name: diasSemana[d.getDay()],
          incomes: tDia.filter(t => t.tipo === "entrada").reduce((sum, t) => sum + t.valor, 0),
          expenses: tDia.filter(t => t.tipo === "saida").reduce((sum, t) => sum + t.valor, 0)
        });
      }
      return result;
    } else {
      const partes = mesSelecionado.split('-')
      const ano = parseInt(partes[0])
      const mes = parseInt(partes[1])
      const diasNoMes = new Date(ano, mes, 0).getDate()
      const result = []
      for(let i = 1; i <= Math.min(diasNoMes, 31); i++) {
        const diaStr = String(i).padStart(2, '0')
        const targetDate = `${mesSelecionado}-${diaStr}`
        const tDia = transacoes.filter(t => t.data === targetDate && t.status === 'realizado')
        result.push({
          name: `Dia ${diaStr}`,
          incomes: tDia.filter(t => t.tipo === "entrada").reduce((sum, t) => sum + t.valor, 0),
          expenses: tDia.filter(t => t.tipo === "saida").reduce((sum, t) => sum + t.valor, 0)
        })
      }
      return result.length ? result : [{ name: 'Início', incomes: 0, expenses: 0 }]
    }
  }, [transacoes, mesSelecionado, graficoView])

  const totalMes = (receitasRealizadas + despesasRealizadas) || 1
  const dadosCustomers = [
    { name: "Entradas", value: Math.round((receitasRealizadas / totalMes) * 100), color: "#81c926" },
    { name: "Saídas", value: Math.round((despesasRealizadas / totalMes) * 100), color: "#2a362f" },
  ]

  const gerarIdUnico = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
  }

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valorCru = e.target.value.replace(/\D/g, "");
    if (!valorCru) {
      setValor("");
      return;
    }
    const valorNumerico = parseInt(valorCru, 10) / 100;
    const formatado = new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(valorNumerico);
    setValor(formatado);
  };

  const salvarNovaCategoriaInline = () => {
    const nomeLimpo = novaCategoriaNome.trim()
    if (nomeLimpo && !categorias.includes(nomeLimpo)) {
      setCategorias([...categorias, nomeLimpo]); setCategoria(nomeLimpo)
    }
    setNovaCategoriaNome(""); setCriandoCategoria(false)
  }

  const salvarNovoBancoInline = () => {
    const nomeLimpo = novoBancoNome.trim()
    if (nomeLimpo && !bancos.includes(nomeLimpo)) {
      setBancos([...bancos, nomeLimpo]); setBanco(nomeLimpo)
    }
    setNovoBancoNome(""); setCriandoBanco(false)
  }

  const limparFormulario = () => {
    setDescricao(""); 
    setValor(""); 
    setDataTransacao(new Date()); 
    setStatus("realizado"); 
    setModoRepeticao("avista"); 
    setParcelas("2");
    setEditandoId(null);
  }

  const adicionarTransacao = (e: React.FormEvent) => {
    e.preventDefault()
    if (!dataTransacao) return

    const valorLimpo = valor.replace(/\D/g, "");
    const valorNum = parseInt(valorLimpo, 10) / 100;

    if (isNaN(valorNum) || valorNum <= 0) return

    const catFinal: string = categoria || (categorias.length > 0 ? categorias[0] : "Geral");
    const bancoFinal: string = banco || (bancos.length > 0 ? bancos[0] : "Carteira");

    let dataBase = new Date(dataTransacao.getFullYear(), dataTransacao.getMonth(), dataTransacao.getDate(), 12, 0, 0)

    if (editandoId) {
      const editadas = transacoes.map(t => {
        if (t.id === editandoId) {
          return { ...t, descricao, valor: valorNum, categoria: catFinal, banco: bancoFinal, status, data: dataBase.toISOString().split('T')[0], tipo: tipoAtual }
        }
        return t
      })
      setTransacoes(editadas)
      toast.success("Transação atualizada com sucesso!")
    } else {
      let novasTransacoes: Transacao[] = []
      if (modoRepeticao === "parcelado" && tipoAtual === "saida") {
        const qtdParcelas = parseInt(parcelas)
        const valorParcela = valorNum / qtdParcelas
        for (let i = 1; i <= qtdParcelas; i++) {
          novasTransacoes.push({ id: gerarIdUnico(), descricao: `${descricao} (${i}/${qtdParcelas})`, valor: valorParcela, categoria: catFinal, banco: bancoFinal, status: i === 1 ? status : "pendente", data: dataBase.toISOString().split('T')[0], tipo: tipoAtual })
          dataBase.setMonth(dataBase.getMonth() + 1)
        }
      } else if (modoRepeticao === "recorrente") {
        for (let i = 1; i <= 12; i++) {
          novasTransacoes.push({ id: gerarIdUnico(), descricao, valor: valorNum, categoria: catFinal, banco: bancoFinal, status: i === 1 ? status : "pendente", data: dataBase.toISOString().split('T')[0], tipo: tipoAtual })
          dataBase.setMonth(dataBase.getMonth() + 1)
        }
      } else {
        novasTransacoes.push({ id: gerarIdUnico(), descricao, valor: valorNum, categoria: catFinal, banco: bancoFinal, status, data: dataBase.toISOString().split('T')[0], tipo: tipoAtual })
      }
      const todasOrdenadas = [...novasTransacoes, ...transacoes].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      setTransacoes(todasOrdenadas)
      toast.success("Transação criada com sucesso!")
    }

    limparFormulario();
    setViewAtual('painel')
  }

  const alternarStatus = (id: string) => {
    setTransacoes(transacoes.map(t => t.id === id ? { ...t, status: t.status === "realizado" ? "pendente" : "realizado" } : t))
  }

  const irParaEdicao = (t: Transacao) => {
    setEditandoId(t.id)
    setTipoAtual(t.tipo)
    setDescricao(t.descricao)
    setValor(new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(t.valor))
    setDataTransacao(new Date(t.data + "T12:00:00"))
    setCategoria(t.categoria)
    setBanco(t.banco)
    setStatus(t.status)
    setModoRepeticao("avista")
    setViewAtual('formulario')
  }

  const irParaFormulario = (tipo: "entrada" | "saida") => {
    limparFormulario(); 
    setTipoAtual(tipo); 
    setViewAtual('formulario');
  }

  const voltarAoPainel = () => {
    limparFormulario();
    setViewAtual('painel');
  }

  const handleRefresh = () => {
    carregarDados();
    setRefreshKey(prev => prev + 1);
    toast.success("Dados do painel atualizados e gráficos recarregados!");
  }

  const handleCheckForUpdates = () => {
    if (typeof window !== 'undefined' && (window as any).require) {
      const { ipcRenderer } = (window as any).require('electron');
      ipcRenderer.send('check-for-updates-manual');
    } else {
      toast.info("A verificação de atualizações funciona apenas na versão instalada.");
    }
  };

  const catSelectValue = categoria || (categorias.length > 0 ? categorias[0] : undefined);
  const bancoSelectValue = banco || (bancos.length > 0 ? bancos[0] : undefined);

  return (
    <div className="flex h-screen w-full bg-[#f4f7f6] overflow-hidden font-sans text-slate-800 antialiased selection:bg-[#81c926] selection:text-white">

      {/* SIDEBAR ESQUERDA - Afastada com pt-16 para não colar nas bolinhas */}
      <aside className="hidden md:flex w-[250px] bg-white border-r border-gray-100 flex-col shrink-0 h-full overflow-y-auto [scrollbar-width:none]">
        <div className="flex items-center gap-3 px-8 pt-16 pb-10 sticky top-0 bg-white z-10">
          <div className="w-8 h-8 bg-[#81c926] rounded-lg flex items-center justify-center overflow-hidden p-1">
            <img src={logoImg} alt="Nexo Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-[#2a362f]">Nexo</span>
        </div>

        <div className="flex-1 px-4 space-y-8">
          <div>
            <p className="text-[12px] font-bold text-gray-400 mb-3 px-4">Visão Geral</p>
            <nav className="space-y-1">
              <button onClick={voltarAoPainel} className="w-full flex items-center gap-4 px-4 py-3 bg-[#f3faeb] border-l-4 border-[#81c926] text-[#81c926] font-bold rounded-r-xl transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> Painel
              </button>
              <a href="#" className="flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-gray-700 font-semibold transition-colors border-l-4 border-transparent">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> Projetos
              </a>
              <a href="#" className="flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-gray-700 font-semibold transition-colors border-l-4 border-transparent">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg> Análises
              </a>
            </nav>
          </div>

          <div>
            <p className="text-[12px] font-bold text-gray-400 mb-3 px-4">Negócios</p>
            <nav className="space-y-1">
              <a href="#" className="flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-gray-700 font-semibold transition-colors border-l-4 border-transparent">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 100 4 2 2 0 000-4z" /></svg> Loja
              </a>
              <button onClick={onLogout} className="w-full flex items-center gap-4 px-4 py-3 text-gray-400 hover:text-gray-700 font-semibold transition-colors border-l-4 border-transparent mt-4 outline-none border-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg> Sair
              </button>
            </nav>
          </div>
        </div>
        <div className="px-8 pb-8 mt-auto shrink-0">
          <p className="text-[11px] text-gray-300 font-semibold">@Nexo App 2026</p>
        </div>
      </aside>

      {/* ÁREA CENTRAL */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto px-4 md:px-10 pb-8 pt-16 [scrollbar-width:thin] scroll-smooth relative">
        
        {viewAtual === 'painel' && (
          <div className="animate-in fade-in duration-300 w-full h-full flex flex-col">
            
            <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8 shrink-0">
              <div>
                <h1 className="text-3xl font-extrabold text-[#2a362f] mb-1 tracking-tight">Painel</h1>
                <p className="text-sm font-medium text-gray-400">Acompanhe todos os detalhes do seu financeiro.</p>
              </div>
              <div className="flex items-center gap-4">
                
                <button onClick={handleRefresh} className="p-2.5 bg-white rounded-full shadow-sm text-gray-400 hover:text-[#81c926] transition-colors border-none outline-none" title="Atualizar Painel">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>

                <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
                  <SelectTrigger className="w-[180px] h-10 bg-white !border-0 !border-transparent !outline-none rounded-full shadow-sm font-extrabold text-[#2a362f] focus:ring-0 focus:ring-offset-0 capitalize">
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent className="z-[200] !border-0 !border-transparent !outline-none shadow-xl bg-white rounded-xl">
                    <SelectGroup>
                      {mesesDisponiveis.map(m => (
                        <SelectItem key={m.value} value={m.value} className="font-bold capitalize cursor-pointer !border-0 !outline-none">
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

              </div>
            </header>

            <div className="bg-[#81c926] rounded-[2.5rem] p-3 flex flex-col xl:flex-row gap-3 mb-8 shrink-0 shadow-lg shadow-[#81c926]/20">
              <div className="bg-[#72b420] rounded-[2rem] p-5 flex flex-1 justify-between items-center relative overflow-hidden shadow-sm gap-2">
                <div className="relative z-10 flex-1 min-w-0 pr-2">
                  <p className="text-white/90 text-[12px] xl:text-[13px] font-semibold mb-1">Saldo Total</p>
                  <h3 className="text-white text-xl xl:text-[26px] font-extrabold tracking-tight mb-2 leading-none whitespace-nowrap" title={formatarMoeda(saldoAtual)}>{formatarMoeda(saldoAtual)}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-5 h-5 bg-white rounded-md flex items-center justify-center shadow-sm shrink-0">
                      <svg className="w-3 h-3 text-[#81c926]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d={dadosSparkline.percSaldo >= 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} /></svg>
                    </div>
                    <span className="text-white text-xs font-bold">{dadosSparkline.percSaldo >= 0 ? '+' : ''}{dadosSparkline.percSaldo}%</span>
                  </div>
                </div>
                <div className="relative z-10 h-14 w-20 xl:w-24 shrink-0">
                  <ResponsiveContainer width="100%" height="100%" key={`saldo-${refreshKey}`}>
                    <AreaChart data={dadosSparkline.historico}>
                      <defs>
                        <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#fff" stopOpacity={0.4}/><stop offset="95%" stopColor="#fff" stopOpacity={0}/></linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="saldo" stroke="#fff" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSaldo)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#72b420] rounded-[2rem] p-5 flex flex-1 justify-between items-center relative overflow-hidden shadow-sm gap-2">
                <div className="relative z-10 flex-1 min-w-0 pr-2">
                  <p className="text-white/90 text-[12px] xl:text-[13px] font-semibold mb-1">Entradas</p>
                  <h3 className="text-white text-xl xl:text-[26px] font-extrabold tracking-tight mb-2 leading-none whitespace-nowrap" title={formatarMoeda(receitasRealizadas)}>{formatarMoeda(receitasRealizadas)}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-5 h-5 bg-white rounded-md flex items-center justify-center shadow-sm shrink-0">
                      <svg className="w-3 h-3 text-[#81c926]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d={dadosSparkline.percReceitas >= 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} /></svg>
                    </div>
                    <span className="text-white text-xs font-bold">{dadosSparkline.percReceitas >= 0 ? '+' : ''}{dadosSparkline.percReceitas}%</span>
                  </div>
                </div>
                <div className="relative z-10 h-14 w-20 xl:w-24 shrink-0">
                  <ResponsiveContainer width="100%" height="100%" key={`entradas-${refreshKey}`}>
                    <AreaChart data={dadosSparkline.historico}>
                      <defs>
                        <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#fff" stopOpacity={0.4}/><stop offset="95%" stopColor="#fff" stopOpacity={0}/></linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="entradas" stroke="#fff" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEntrada)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#72b420] rounded-[2rem] p-5 flex flex-1 justify-between items-center relative overflow-hidden shadow-sm gap-2">
                <div className="relative z-10 flex-1 min-w-0 pr-2">
                  <p className="text-white/90 text-[12px] xl:text-[13px] font-semibold mb-1">Saídas</p>
                  <h3 className="text-white text-xl xl:text-[26px] font-extrabold tracking-tight mb-2 leading-none whitespace-nowrap" title={formatarMoeda(despesasRealizadas)}>{formatarMoeda(despesasRealizadas)}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-5 h-5 bg-white rounded-md flex items-center justify-center shadow-sm shrink-0">
                      <svg className="w-3 h-3 text-[#81c926]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d={dadosSparkline.percDespesas <= 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} /></svg>
                    </div>
                    <span className="text-white text-xs font-bold">{dadosSparkline.percDespesas <= 0 ? '' : '+'}{dadosSparkline.percDespesas}%</span>
                  </div>
                </div>
                <div className="relative z-10 h-14 w-20 xl:w-24 shrink-0">
                  <ResponsiveContainer width="100%" height="100%" key={`saidas-${refreshKey}`}>
                    <AreaChart data={dadosSparkline.historico}>
                      <defs>
                        <linearGradient id="colorSaida" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#fff" stopOpacity={0.4}/><stop offset="95%" stopColor="#fff" stopOpacity={0}/></linearGradient>
                      </defs>
                        <Area type="monotone" dataKey="saidas" stroke="#fff" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSaida)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8 flex-shrink-0">
              <div className="lg:col-span-2 bg-white rounded-3xl p-7 shadow-sm border-none flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-extrabold text-[#2a362f]">Fluxo de Caixa</h2>
                    
                    <div className="flex flex-wrap items-center gap-2 md:flex-row">
                      <Button 
                        variant={graficoView === 'semana' ? 'default' : 'outline'} 
                        onClick={() => setGraficoView('semana')}
                        className={`h-8 px-3 text-xs rounded-lg !outline-none ${graficoView === 'semana' ? "bg-[#81c926] text-[#2a362f] hover:bg-[#8ee12d] font-bold border-none" : "text-gray-500 font-bold border-gray-200"}`}
                      >
                        Semana Atual
                      </Button>
                      <Button 
                        variant={graficoView === 'mes' ? 'default' : 'outline'} 
                        onClick={() => setGraficoView('mes')}
                        className={`h-8 px-3 text-xs rounded-lg !outline-none ${graficoView === 'mes' ? "bg-[#81c926] text-[#2a362f] hover:bg-[#8ee12d] font-bold border-none" : "text-gray-500 font-bold border-gray-200"}`}
                      >
                        Mês Sel.
                      </Button>
                    </div>

                  </div>
                  <div className="flex gap-4 text-xs font-bold">
                    <span className="text-[#81c926] flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#81c926]"></span>Entradas</span>
                    <span className="text-yellow-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400"></span>Saídas</span>
                  </div>
                </div>
                <div className="flex-1 min-h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%" key={`linha-${refreshKey}`}>
                    <LineChart data={dadosGraficoDisplay} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} tickFormatter={(value) => value >= 1000 ? `R$${value / 1000}k` : `R$${value}`} />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-3 rounded-xl shadow-lg border-none">
                                <p className="text-xs font-bold text-gray-500 mb-2">{label}</p>
                                <p className="text-sm font-bold text-[#81c926]">Entradas: {formatarMoeda(payload[0].value as number)}</p>
                                <p className="text-sm font-bold text-yellow-500">Saídas: {formatarMoeda(payload[1].value as number)}</p>
                              </div>
                            )
                          }
                          return null
                        }}
                        cursor={{ stroke: '#81c926', strokeWidth: 20, strokeOpacity: 0.1 }}
                      />
                      <Line type="monotone" dataKey="incomes" stroke="#81c926" strokeWidth={4} dot={false} activeDot={{ r: 6, fill: '#81c926', stroke: '#fff', strokeWidth: 3 }} />
                      <Line type="monotone" dataKey="expenses" stroke="#facc15" strokeWidth={4} dot={false} activeDot={{ r: 6, fill: '#facc15', stroke: '#fff', strokeWidth: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-7 shadow-sm border-none flex flex-col items-center relative">
                <h2 className="text-xl font-extrabold text-[#2a362f] self-start w-full mb-2">Transações</h2>
                <div className="flex-1 w-full flex items-center justify-center relative min-h-[180px]">
                  <ResponsiveContainer width="100%" height="100%" key={`pie-${refreshKey}`}>
                    <PieChart>
                      <Pie data={dadosCustomers} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none" cornerRadius={10}>
                        {dadosCustomers.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-extrabold text-[#2a362f]">{dadosCustomers[0].value}%</span>
                    <span className="text-xs font-bold text-gray-400">Entradas</span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2.5 w-full mt-4 text-sm font-bold text-gray-400 ml-4">
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#81c926]"></span>Entradas</span>
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#2a362f]"></span>Saídas</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-7 shadow-sm border-none flex-grow flex flex-col overflow-hidden">
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h2 className="text-xl font-extrabold text-[#2a362f]">Transações Recentes</h2>
                <button onClick={() => setMostrarTodas(!mostrarTodas)} className="text-sm font-bold text-[#2a362f] hover:text-[#81c926] transition-colors outline-none">{mostrarTodas ? "Ver Menos" : "Ver Todas"}</button>
              </div>
              
              <div className="w-full flex-grow flex flex-col overflow-hidden">
                <div className="flex text-xs font-extrabold text-gray-400 mb-4 pb-4 border-b border-gray-50 gap-2 shrink-0 px-2">
                  <div className="flex-[2] min-w-0">ID / Descrição</div>
                  <div className="flex-1 hidden md:block">Data</div>
                  <div className="w-28 shrink-0 text-right md:text-left">Valor</div>
                  <div className="w-24 shrink-0 text-center hidden sm:block">Status</div>
                  <div className="w-20 shrink-0 text-right">Ações</div>
                </div>
                
                <div className="space-y-1 flex-grow overflow-y-auto overflow-x-hidden [scrollbar-width:thin] pr-2">
                  {transacoesMesSelecionado.length === 0 ? (
                    <div className="text-center py-6 text-sm font-medium text-gray-400">Nenhuma transação neste mês.</div>
                  ) : (
                    transacoesMesSelecionado.slice(0, mostrarTodas ? undefined : 15).map((t) => (
                      <div key={t.id} className="flex items-center text-sm font-bold text-gray-500 hover:bg-gray-50 py-2 px-2 rounded-xl transition-colors group">
                        
                        <div className="flex-[2] min-w-0 flex items-center gap-3">
                          <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center ${t.tipo === 'entrada' ? 'bg-[#f3faeb] text-[#81c926]' : 'bg-[#fff1f2] text-red-400'}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d={t.tipo === 'entrada' ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} />
                            </svg>
                          </div>
                          <span className="text-[#2a362f] truncate pr-2" title={t.descricao}>{t.descricao}</span>
                        </div>

                        <div className="flex-1 hidden md:block text-xs lg:text-sm truncate pr-2">
                          {formatarDataBr(t.data)}
                        </div>

                        <div className="w-28 shrink-0 text-[#2a362f] text-right md:text-left pr-2 truncate">
                          {t.tipo === 'saida' ? '-' : '+'}{formatarMoeda(t.valor)}
                        </div>

                        <div className="w-24 shrink-0 text-center hidden sm:block">
                           <span onClick={() => alternarStatus(t.id)} className={`px-2 py-1 rounded-md text-[10px] uppercase tracking-wider font-extrabold cursor-pointer transition-all ${
                             t.status === 'pendente' ? 'bg-yellow-50 text-yellow-500 hover:bg-yellow-100' : 'bg-[#f3faeb] text-[#81c926] hover:bg-[#e6f4d9]'
                           }`}>
                             {t.status === 'pendente' ? 'Pendente' : 'Concluído'}
                           </span>
                        </div>

                        <div className="w-20 shrink-0 flex justify-end items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                           <button onClick={() => irParaEdicao(t)} className="p-1.5 text-gray-400 hover:text-[#81c926] hover:bg-[#f3faeb] rounded-lg transition-colors border-none outline-none" title="Editar">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                           </button>

                           <AlertDialog>
                             <AlertDialogTrigger asChild>
                               <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border-none outline-none" title="Apagar">
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                               </button>
                             </AlertDialogTrigger>
                             <AlertDialogContent className="bg-white rounded-[2rem] !border-0 !border-transparent !outline-none shadow-2xl sm:max-w-[425px]">
                               <AlertDialogHeader>
                                 <AlertDialogTitle className="text-2xl font-extrabold text-[#2a362f]">Tem certeza absoluta?</AlertDialogTitle>
                                 <AlertDialogDescription className="text-sm font-medium text-gray-500 mt-2">
                                   Essa ação não pode ser desfeita. Isso vai apagar permanentemente o registro <span className="font-bold text-[#2a362f]">"{t.descricao}"</span>.
                                 </AlertDialogDescription>
                               </AlertDialogHeader>
                               <AlertDialogFooter className="mt-6">
                                 <AlertDialogCancel className="h-12 rounded-xl font-bold !border-0 bg-gray-100 text-gray-600 hover:bg-gray-200 outline-none">Cancelar</AlertDialogCancel>
                                 <AlertDialogAction 
                                   onClick={() => {
                                      setTransacoes(prev => prev.filter(item => item.id !== t.id));
                                      toast.success("Transação apagada com sucesso.");
                                   }} 
                                   className="h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-extrabold !border-0 outline-none"
                                 >
                                   Sim, Apagar
                                 </AlertDialogAction>
                               </AlertDialogFooter>
                             </AlertDialogContent>
                           </AlertDialog>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {viewAtual === 'formulario' && (
          <div className="animate-in slide-in-from-right-10 duration-300 w-full h-full flex flex-col relative max-w-4xl mx-auto">
            <header className="flex items-center gap-6 mb-6 shrink-0">
              <Button variant="outline" onClick={voltarAoPainel} className="rounded-2xl border-none text-gray-600 hidden lg:flex gap-2 h-12 px-6 font-bold hover:bg-gray-50 shadow-sm bg-white outline-none">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7-7h18" /></svg> Voltar
              </Button>
              <div>
                <h1 className="text-3xl font-extrabold text-[#2a362f] mb-1 tracking-tight">
                  {editandoId ? "Editar " : "Adicionar "} {tipoAtual === "entrada" ? "Receita" : "Despesa"}
                </h1>
                <p className="text-sm font-medium text-gray-400">Preencha os dados abaixo.</p>
              </div>
            </header>

            <div className="flex-1 pb-4">
              <form onSubmit={adicionarTransacao} className="flex flex-col gap-3 h-full justify-start">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-5 rounded-[2rem] shadow-sm border-none shrink-0">
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Valor Total (R$)</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="0,00" 
                      value={valor} 
                      onChange={handleValorChange} 
                      className="flex h-12 mt-1 w-full rounded-2xl border-none bg-gray-50 px-5 py-2 text-2xl font-extrabold text-[#2a362f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#81c926] shadow-inner transition-all placeholder:text-gray-300"
                    />
                  </div>
                  <div className="md:col-span-2 mt-1">
                    <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Descrição Breve</label>
                    <input required type="text" placeholder="Ex: Mercado Mensal, Salário, Compra Online..." value={descricao} onChange={(e) => setDescricao(e.target.value)} className="flex h-10 mt-1 w-full rounded-xl border-none bg-gray-50 px-5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#81c926] shadow-inner transition-all placeholder:text-gray-400 text-[#2a362f]"/>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
                  <div className="bg-white p-5 rounded-[2rem] shadow-sm flex flex-col justify-center border-none">
                      <div className="flex justify-between items-center h-4 mb-2">
                        <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Categoria</label>
                        <button type="button" onClick={() => setCriandoCategoria(!criandoCategoria)} className="text-[10px] text-[#81c926] font-extrabold hover:text-green-700 transition-colors bg-[#f3faeb] px-2 py-0.5 rounded-md outline-none">{criandoCategoria ? "Voltar" : "+ Criar"}</button>
                      </div>
                      <div className="h-10 w-full relative">
                        {criandoCategoria ? (
                          <div className="flex gap-2 w-full h-full animate-in fade-in zoom-in-95 duration-150">
                            <input autoFocus type="text" placeholder="Categoria..." value={novaCategoriaNome} onChange={(e) => setNovaCategoriaNome(e.target.value)} className="min-w-0 flex-1 h-full rounded-xl border-none bg-gray-50 px-4 text-sm font-bold shadow-inner focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#81c926] text-[#2a362f]"/>
                            <Button type="button" onClick={salvarNovaCategoriaInline} className="w-10 shrink-0 h-full rounded-xl bg-[#81c926] text-[#2a362f] p-0 flex items-center justify-center hover:bg-[#8ee12d] shadow-md border-none outline-none"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></Button>
                          </div>
                        ) : (
                          <Select value={catSelectValue} onValueChange={setCategoria}>
                            <SelectTrigger className="flex h-full w-full rounded-xl !border-0 !border-transparent shadow-inner bg-gray-50 px-4 font-bold text-[#2a362f] focus:outline-none focus:ring-2 focus:ring-[#81c926] transition-all text-sm outline-none">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="z-[200] bg-white !border-0 !border-transparent !outline-none shadow-2xl rounded-xl p-1">
                              <SelectGroup>{categorias.map(cat => <SelectItem key={cat} value={cat} className="font-bold text-sm cursor-pointer !border-0 !outline-none focus:bg-gray-50 rounded-lg">{cat}</SelectItem>)}</SelectGroup>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                  </div>

                  <div className="bg-white p-5 rounded-[2rem] shadow-sm flex flex-col justify-center border-none">
                      <div className="flex justify-between items-center h-4 mb-2">
                        <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Conta</label>
                        <button type="button" onClick={() => setCriandoBanco(!criandoBanco)} className="text-[10px] text-[#81c926] font-extrabold hover:text-green-700 transition-colors bg-[#f3faeb] px-2 py-0.5 rounded-md outline-none">{criandoBanco ? "Voltar" : "+ Criar"}</button>
                      </div>
                      <div className="h-10 w-full relative">
                        {criandoBanco ? (
                          <div className="flex gap-2 w-full h-full animate-in fade-in zoom-in-95 duration-150">
                            <input autoFocus type="text" placeholder="Banco..." value={novoBancoNome} onChange={(e) => setNovoBancoNome(e.target.value)} className="min-w-0 flex-1 h-full rounded-xl border-none bg-gray-50 px-4 text-sm font-bold shadow-inner focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#81c926] text-[#2a362f]"/>
                            <Button type="button" onClick={salvarNovoBancoInline} className="w-10 shrink-0 h-full rounded-xl bg-[#81c926] text-[#2a362f] p-0 flex items-center justify-center hover:bg-[#8ee12d] shadow-md border-none outline-none"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></Button>
                          </div>
                        ) : (
                          <Select value={bancoSelectValue} onValueChange={setBanco}>
                            <SelectTrigger className="flex h-full w-full rounded-xl !border-0 !border-transparent shadow-inner bg-gray-50 px-4 font-bold text-[#2a362f] focus:outline-none focus:ring-2 focus:ring-[#81c926] transition-all text-sm outline-none">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="z-[200] bg-white !border-0 !border-transparent !outline-none shadow-2xl rounded-xl p-1">
                              <SelectGroup>{bancos.map(b => <SelectItem key={b} value={b} className="font-bold text-sm cursor-pointer !border-0 !outline-none focus:bg-gray-50 rounded-lg">{b}</SelectItem>)}</SelectGroup>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-5 rounded-[2rem] shadow-sm border-none shrink-0">
                  <div className="flex flex-col">
                    <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1 mb-2">Data da Transação</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-bold h-10 rounded-xl !border-0 shadow-inner bg-gray-50 hover:bg-gray-100 transition-all text-sm text-[#2a362f] px-4 outline-none">
                          <svg className="mr-2 h-4 w-4 text-[#81c926]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {dataTransacao ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(dataTransacao) : <span>Selecionar data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-[200] rounded-2xl shadow-2xl !border-0 !border-transparent bg-white !outline-none" align="start">
                        <Calendar mode="single" selected={dataTransacao} onSelect={setDataTransacao} className="rounded-2xl !border-0 !border-transparent bg-white p-4 outline-none" />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="shrink-0">
                    <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Status do Lançamento</label>
                    <div className="flex bg-gray-50 shadow-inner p-1 rounded-xl h-10 items-center border-none">
                      <button type="button" onClick={() => setStatus("realizado")} className={`w-1/2 rounded-lg text-xs font-extrabold h-full transition-all flex items-center justify-center gap-1.5 outline-none ${status === 'realizado' ? 'bg-white shadow-sm text-[#81c926]' : 'text-gray-400 hover:text-gray-600'}`}>
                         <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> {tipoAtual === 'entrada' ? 'Recebido' : 'Pago'}
                      </button>
                      <button type="button" onClick={() => setStatus("pendente")} className={`w-1/2 rounded-lg text-xs font-extrabold h-full transition-all flex items-center justify-center gap-1.5 outline-none ${status === 'pendente' ? 'bg-white shadow-sm text-yellow-500' : 'text-gray-400 hover:text-gray-600'}`}>
                         <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Pendente
                      </button>
                    </div>
                  </div>
                </div>

                {!editandoId && (
                  <div className="bg-white p-5 rounded-[2rem] shadow-sm border-none shrink-0">
                    <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Modalidade / Repetição</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button type="button" onClick={() => setModoRepeticao("avista")} className={`rounded-xl text-xs font-bold h-10 border-2 transition-all outline-none ${modoRepeticao === 'avista' ? 'bg-[#2a362f] border-[#2a362f] text-[#81c926] shadow-md' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}>Transação Única</button>
                      
                      {tipoAtual === 'saida' && (
                        <button type="button" onClick={() => setModoRepeticao("parcelado")} className={`rounded-xl text-xs font-bold h-10 border-2 transition-all outline-none ${modoRepeticao === 'parcelado' ? 'bg-[#2a362f] border-[#2a362f] text-[#81c926] shadow-md' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}>Compra Parcelada</button>
                      )}
                      
                      <button type="button" onClick={() => setModoRepeticao("recorrente")} className={`rounded-xl text-xs font-bold h-10 border-2 transition-all outline-none ${modoRepeticao === 'recorrente' ? 'bg-[#2a362f] border-[#2a362f] text-[#81c926] shadow-md' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}>Fixo (Mensal)</button>
                    </div>

                    {modoRepeticao === "parcelado" && tipoAtual === 'saida' && (
                      <div className="animate-in fade-in slide-in-from-top-2 p-3 bg-gray-50 rounded-2xl mt-3 flex items-center justify-between gap-4 shadow-inner border-none">
                        <span className="text-sm font-extrabold text-[#2a362f] flex items-center gap-2 shrink-0"><div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm"><svg className="w-3 h-3 text-[#81c926]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h16" /></svg></div> Defina parcelas:</span>
                        <input type="number" min="2" max="120" value={parcelas} onChange={(e) => setParcelas(e.target.value)} className="w-20 h-10 rounded-xl border-none bg-white px-3 text-center focus:outline-none focus:ring-2 focus:ring-[#81c926] font-extrabold text-base text-[#2a362f] shadow-sm"/>
                      </div>
                    )}

                    {modoRepeticao === "recorrente" && (
                      <div className="animate-in fade-in p-3 bg-[#f3faeb] text-[#69a121] rounded-xl mt-3 text-[11px] font-bold border border-[#81c926]/20 flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Esta opção criará 12 lançamentos mensais automáticos no sistema.
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-2 max-w-lg mx-auto w-full mt-auto">
                  <Button type="button" variant="outline" className="w-full h-12 rounded-2xl text-gray-600 font-bold border-none shadow-sm bg-white hover:bg-gray-50 text-sm outline-none" onClick={voltarAoPainel}>Cancelar</Button>
                  <Button type="submit" className="w-full h-12 rounded-2xl text-[#2a362f] font-extrabold bg-[#81c926] hover:bg-[#8ee12d] shadow-xl shadow-[#81c926]/40 text-sm transition-transform hover:-translate-y-0.5 border-none outline-none">
                    {editandoId ? 'Atualizar Transação' : (tipoAtual === 'entrada' ? 'Salvar Receita' : 'Salvar Despesa')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* SIDEBAR DIREITA */}
      <aside className="w-[340px] hidden xl:flex flex-col justify-between bg-[#38433e] text-white shrink-0 h-full overflow-hidden shadow-2xl relative z-20">
        
        <div className="p-6 pt-16 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="font-extrabold text-xl tracking-wide">Perfil</h2>
            <div className="flex gap-4 items-center">
              <div className="relative cursor-pointer hover:bg-white/10 p-1.5 rounded-full transition-colors"><svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg><div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#38433e]"></div></div>
              
              <Popover>
                <PopoverTrigger asChild>
                  <button className="cursor-pointer hover:bg-white/10 p-1.5 rounded-full transition-colors bg-transparent border-none outline-none">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-52 p-2 z-[200] rounded-2xl shadow-xl border-none bg-[#42504a] mr-4 outline-none" align="end">
                  <button 
                    onClick={handleCheckForUpdates}
                    className="w-full text-left px-3 py-2.5 text-sm font-bold text-white hover:bg-white/10 rounded-xl transition-colors flex items-center gap-2 border-none outline-none"
                  >
                    <svg className="w-4 h-4 text-[#81c926]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Verificar Atualizações
                  </button>
                </PopoverContent>
              </Popover>

            </div>
          </div>

          <div className="relative mb-6 mt-2">
            <div className="w-full h-[90px] bg-[#81c926] rounded-[1.5rem] relative overflow-hidden shadow-lg shadow-black/10 border-none">
              <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 200 100"><rect x="20" y="20" width="40" height="40" fill="none" stroke="white" strokeWidth="2" transform="rotate(45 40 40)"/><rect x="40" y="40" width="30" height="30" fill="white" opacity="0.5" transform="rotate(45 55 55)"/><line x1="120" y1="80" x2="160" y2="40" stroke="white" strokeWidth="2" /><line x1="140" y1="90" x2="170" y2="60" stroke="white" strokeWidth="2" /><circle cx="160" cy="30" r="3" fill="white" /></svg>
            </div>
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-[#38433e] rounded-full p-1 shadow-xl flex items-center justify-center text-xl font-bold uppercase">
              {currentUser?.nome ? currentUser.nome.charAt(0) : "U"}
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-lg font-extrabold tracking-wide mb-1">{currentUser?.nome || "Usuário"}</h3>
            <p className="text-[11px] text-gray-400 font-bold mb-3">{currentUser?.email || "usuario@nexo.com"}</p>
            <div className="flex gap-1 justify-center mb-4">
              <div className="w-8 h-1 rounded-full bg-[#81c926]"></div><div className="w-8 h-1 rounded-full bg-[#81c926]"></div><div className="w-8 h-1 rounded-full bg-[#81c926]"></div><div className="w-8 h-1 rounded-full bg-[#81c926]"></div><div className="w-8 h-1 rounded-full bg-[#81c926]"></div><div className="w-8 h-1 rounded-full bg-[#2a332e]"></div><div className="w-8 h-1 rounded-full bg-[#2a332e]"></div><div className="w-8 h-1 rounded-full bg-[#2a332e]"></div>
            </div>

            <div className="flex w-full justify-between px-2 text-center mb-4">
              <div><p className="text-base font-extrabold text-white">12</p><p className="text-[10px] text-gray-400 font-bold mt-0.5">Projetos</p></div><div className="w-px h-6 bg-[#4b5952] self-center"></div>
              <div><p className="text-base font-extrabold text-white">5</p><p className="text-[10px] text-gray-400 font-bold mt-0.5">Contas</p></div><div className="w-px h-6 bg-[#4b5952] self-center"></div>
              <div><p className="text-base font-extrabold text-white">8</p><p className="text-[10px] text-gray-400 font-bold mt-0.5">Avisos</p></div>
            </div>

            <button className="w-full py-2.5 bg-[#81c926] text-[#2a362f] rounded-xl text-xs font-extrabold flex justify-center items-center gap-2 hover:bg-[#8ee12d] transition-colors shadow-lg shadow-[#81c926]/10 border-none outline-none"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg> Editar Perfil</button>
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="bg-[#42504a] rounded-3xl p-5 shadow-inner relative overflow-hidden border-none">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-bold text-white">Carteira</h2>
              <svg className="w-4 h-4 text-gray-400 cursor-pointer hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            
            <div className="bg-[#2a342d] rounded-2xl p-4 text-center shadow-[inset_0_4px_12px_rgba(0,0,0,0.2)] mb-4 flex flex-col items-center justify-center border-none">
              <div className="w-8 h-8 bg-white/5 text-[#81c926] rounded-lg flex items-center justify-center mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              </div>
              <h3 className="text-[24px] font-extrabold text-[#81c926] leading-none mb-1 truncate w-full px-2" title={formatarMoeda(saldoGeralAcumulado)}>
                {formatarMoeda(saldoGeralAcumulado)}
              </h3>
              <p className="text-[9px] text-[#81c926]/80 font-bold uppercase tracking-wide">Saldo Acumulado</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <button onClick={() => irParaFormulario("entrada")} className="w-full py-2.5 bg-[#81c926] text-[#2a362f] rounded-xl text-xs font-extrabold hover:bg-[#8ee12d] transition-all shadow-lg shadow-[#81c926]/10 flex items-center justify-center gap-2 border-none outline-none">
                 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg> Nova Receita
              </button>
              <button onClick={() => irParaFormulario("saida")} className="w-full py-2.5 bg-transparent border-2 border-[#52635a] text-white hover:border-[#81c926] hover:text-[#81c926] rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 outline-none">
                 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg> Nova Despesa
              </button>
            </div>
          </div>
        </div>
      </aside>

    </div>
  );
}