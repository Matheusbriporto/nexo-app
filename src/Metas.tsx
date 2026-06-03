import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "./components/ui/button";
import { Calendar } from "./components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./components/ui/alert-dialog";

export type Meta = {
  id: string;
  titulo: string;
  valorAlvo: number;
  valorGuardado: number;
  dataPrazo: string;
};

interface MetasProps {
  metas: Meta[];
  setMetas: React.Dispatch<React.SetStateAction<Meta[]>>;
  formatarMoeda: (valor: number) => string;
  formatarDataBr: (data: string) => string;
}

export default function Metas({ metas, setMetas, formatarMoeda, formatarDataBr }: MetasProps) {
  // Estados do Form de Meta
  const [isMetaModalOpen, setIsMetaModalOpen] = useState(false);
  const [editandoMetaId, setEditandoMetaId] = useState<string | null>(null);
  const [metaTitulo, setMetaTitulo] = useState("");
  const [metaAlvo, setMetaAlvo] = useState("");
  const [metaPrazo, setMetaPrazo] = useState<Date | undefined>(new Date());

  // Estados dos Modais de Depósito e Resgate
  const [isDepositoModalOpen, setIsDepositoModalOpen] = useState(false);
  const [isResgateModalOpen, setIsResgateModalOpen] = useState(false);
  const [metaSelecionada, setMetaSelecionada] = useState<Meta | null>(null);
  const [valorOperacao, setValorOperacao] = useState("");

  const gerarIdUnico = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  };

  const aplicarMascaraDinheiro = (valorInserido: string, setFuncao: (v: string) => void) => {
    let valorCru = valorInserido.replace(/\D/g, "");
    if (!valorCru) { setFuncao(""); return; }
    const valorNumerico = parseInt(valorCru, 10) / 100;
    setFuncao(new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valorNumerico));
  };

  const abrirNovaMeta = () => {
    setEditandoMetaId(null);
    setMetaTitulo(""); setMetaAlvo(""); setMetaPrazo(new Date());
    setIsMetaModalOpen(true);
  };

  const abrirEdicaoMeta = (meta: Meta) => {
    setEditandoMetaId(meta.id);
    setMetaTitulo(meta.titulo);
    setMetaAlvo(new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(meta.valorAlvo));
    setMetaPrazo(new Date(meta.dataPrazo + "T12:00:00"));
    setIsMetaModalOpen(true);
  };

  const salvarMeta = (e: React.FormEvent) => {
    e.preventDefault();
    const valorNum = parseInt(metaAlvo.replace(/\D/g, ""), 10) / 100;
    if (isNaN(valorNum) || valorNum <= 0) return;

    if (editandoMetaId) {
      setMetas(metas.map(m => m.id === editandoMetaId ? {
        ...m,
        titulo: metaTitulo,
        valorAlvo: valorNum,
        dataPrazo: metaPrazo ? metaPrazo.toISOString().split('T')[0] : m.dataPrazo
      } : m));
      toast.success("Meta atualizada com sucesso! ✏️");
    } else {
      const novaMeta: Meta = {
        id: gerarIdUnico(),
        titulo: metaTitulo,
        valorAlvo: valorNum,
        valorGuardado: 0,
        dataPrazo: metaPrazo ? metaPrazo.toISOString().split('T')[0] : ""
      };
      setMetas([...metas, novaMeta]);
      toast.success("Meta criada com sucesso! 🎯");
    }
    
    setIsMetaModalOpen(false);
  };

  const adicionarSaldoMeta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!metaSelecionada) return;
    
    const valorNum = parseInt(valorOperacao.replace(/\D/g, ""), 10) / 100;
    if (isNaN(valorNum) || valorNum <= 0) return;

    setMetas(metas.map(m => m.id === metaSelecionada.id ? { ...m, valorGuardado: m.valorGuardado + valorNum } : m));
    setIsDepositoModalOpen(false);
    setValorOperacao(""); setMetaSelecionada(null);
    toast.success("Valor guardado no cofre! 💰");
  };

  const retirarSaldoMeta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!metaSelecionada) return;
    
    const valorNum = parseInt(valorOperacao.replace(/\D/g, ""), 10) / 100;
    if (isNaN(valorNum) || valorNum <= 0) return;

    if (valorNum > metaSelecionada.valorGuardado) {
      toast.error("O valor não pode ser maior do que você tem guardado!");
      return;
    }

    setMetas(metas.map(m => m.id === metaSelecionada.id ? { ...m, valorGuardado: m.valorGuardado - valorNum } : m));
    setIsResgateModalOpen(false);
    setValorOperacao(""); setMetaSelecionada(null);
    toast.success("Valor retirado do cofre! 💸");
  };

  const excluirMeta = (id: string) => {
    setMetas(metas.filter(m => m.id !== id));
    toast.success("Meta excluída com sucesso.");
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full h-full flex flex-col relative max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold text-[#2a362f] mb-1 tracking-tight">Cofre de Metas</h1>
          <p className="text-sm font-medium text-gray-400">Guarde dinheiro e acompanhe o progresso dos seus sonhos.</p>
        </div>
        <Button onClick={abrirNovaMeta} className="bg-[#81c926] hover:bg-[#8ee12d] text-[#2a362f] font-extrabold rounded-2xl h-12 px-6 shadow-xl shadow-[#81c926]/20 border-none outline-none transition-transform hover:-translate-y-0.5">
          + Nova Meta
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto pb-8 [scrollbar-width:none]">
        {metas.length === 0 ? (
          <div className="w-full h-64 border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-6 mt-4">
            <div className="w-16 h-16 bg-[#f3faeb] text-[#81c926] rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-lg font-extrabold text-[#2a362f] mb-1">Nenhuma meta ainda</h3>
            <p className="text-sm font-bold text-gray-400 max-w-xs">Crie sua primeira meta para começar a guardar dinheiro de forma organizada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metas.map(meta => {
              const progresso = meta.valorAlvo > 0 ? (meta.valorGuardado / meta.valorAlvo) * 100 : 0;
              return (
                <div key={meta.id} className="bg-white rounded-3xl p-6 shadow-sm flex flex-col relative group border border-transparent hover:border-gray-100 transition-all">
                  
                  {/* BOTOÕES DE AÇÃO SUPERIORES (Surgem no Hover) */}
                  <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => abrirEdicaoMeta(meta)} className="w-8 h-8 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center outline-none hover:bg-blue-100" title="Editar Meta">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => excluirMeta(meta.id)} className="w-8 h-8 bg-red-50 text-red-500 rounded-full flex items-center justify-center outline-none hover:bg-red-100" title="Excluir Meta">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-2 pr-20">
                    <div className="w-10 h-10 bg-[#f3faeb] rounded-xl flex items-center justify-center text-[#81c926] shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                    </div>
                    <h3 className="text-xl font-extrabold text-[#2a362f] truncate" title={meta.titulo}>{meta.titulo}</h3>
                  </div>
                  
                  <p className="text-xs font-extrabold text-gray-400 mb-6 uppercase tracking-widest flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> Prazo: {formatarDataBr(meta.dataPrazo)}
                  </p>

                  <div className="mb-2">
                    <div className="w-full bg-gray-100 rounded-full h-3.5 mb-2 overflow-hidden shadow-inner">
                      <div className="bg-[#81c926] h-full rounded-full transition-all duration-1000 shadow-sm" style={{ width: `${Math.min(progresso, 100)}%` }}></div>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-extrabold text-[#81c926]">{formatarMoeda(meta.valorGuardado)} <span className="text-[10px] text-gray-400 font-bold ml-1">({progresso.toFixed(0)}%)</span></span>
                      <span className="text-xs font-bold text-gray-400">Objetivo: {formatarMoeda(meta.valorAlvo)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-6">
                    <Button onClick={() => { setMetaSelecionada(meta); setValorOperacao(""); setIsDepositoModalOpen(true); }} className="w-full py-2.5 bg-[#2a362f] text-[#81c926] rounded-xl text-xs font-extrabold hover:bg-black transition-all flex items-center justify-center gap-1.5 border-none outline-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg> Guardar
                    </Button>
                    <Button onClick={() => { setMetaSelecionada(meta); setValorOperacao(""); setIsResgateModalOpen(true); }} variant="outline" className="w-full py-2.5 bg-gray-50 text-gray-600 rounded-xl text-xs font-extrabold hover:bg-gray-100 transition-all flex items-center justify-center gap-1.5 border-none outline-none shadow-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 20V4m-8 8l8-8 8 8" /></svg> Retirar
                    </Button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: Criar / Editar Meta */}
      <AlertDialog open={isMetaModalOpen} onOpenChange={setIsMetaModalOpen}>
        <AlertDialogContent className="bg-white rounded-[2.5rem] !border-0 !border-transparent !outline-none shadow-2xl sm:max-w-[450px] p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-extrabold text-[#2a362f] flex items-center gap-3">
              <div className="w-10 h-10 bg-[#f3faeb] text-[#81c926] rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              </div>
              {editandoMetaId ? "Editar Meta" : "Nova Meta"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-bold text-gray-400 mt-2">
              Defina um objetivo financeiro e guarde dinheiro para ele.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form onSubmit={salvarMeta} className="flex flex-col gap-4 mt-6">
            <div>
              <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Título da Meta</label>
              <input required type="text" placeholder="Ex: Viagem de Férias, Carro Novo..." value={metaTitulo} onChange={(e) => setMetaTitulo(e.target.value)} className="flex h-12 mt-1 w-full rounded-2xl border-none bg-gray-50 px-5 text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#81c926] shadow-inner transition-all text-[#2a362f]"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Valor Alvo (R$)</label>
                <input required type="text" placeholder="0,00" value={metaAlvo} onChange={(e) => aplicarMascaraDinheiro(e.target.value, setMetaAlvo)} className="flex h-12 mt-1 w-full rounded-2xl border-none bg-gray-50 px-5 text-sm font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#81c926] shadow-inner transition-all text-[#2a362f]"/>
              </div>
              <div>
                <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Prazo Final</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-bold h-12 rounded-2xl !border-0 shadow-inner bg-gray-50 hover:bg-white hover:ring-2 hover:ring-[#81c926] transition-all text-sm text-[#2a362f] px-4 outline-none">
                      {metaPrazo ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(metaPrazo) : <span>Selecionar</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[200] rounded-2xl shadow-2xl !border-0 bg-white" align="center"><Calendar mode="single" selected={metaPrazo} onSelect={setMetaPrazo} className="rounded-2xl !border-0 bg-white p-4" /></PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <AlertDialogCancel className="h-12 rounded-2xl font-bold !border-0 bg-gray-100 text-gray-600 hover:bg-gray-200 outline-none w-full">Cancelar</AlertDialogCancel>
              <Button type="submit" className="h-12 rounded-2xl bg-[#81c926] hover:bg-[#8ee12d] text-[#2a362f] font-extrabold !border-0 outline-none w-full shadow-lg shadow-[#81c926]/30">
                {editandoMetaId ? "Atualizar Meta" : "Criar Meta"}
              </Button>
            </div>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL: Depositar na Meta */}
      <AlertDialog open={isDepositoModalOpen} onOpenChange={setIsDepositoModalOpen}>
        <AlertDialogContent className="bg-white rounded-[2.5rem] !border-0 !border-transparent !outline-none shadow-2xl sm:max-w-[400px] p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-extrabold text-[#2a362f]">Guardar no Cofre</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-bold text-gray-400 mt-2">
              Quanto dinheiro você quer destinar para <strong className="text-[#81c926]">{metaSelecionada?.titulo}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form onSubmit={adicionarSaldoMeta} className="flex flex-col gap-4 mt-4">
            <div>
              <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Valor do Depósito (R$)</label>
              <input required autoFocus type="text" placeholder="0,00" value={valorOperacao} onChange={(e) => aplicarMascaraDinheiro(e.target.value, setValorOperacao)} className="flex h-14 mt-1 w-full rounded-2xl border-none bg-gray-50 px-5 text-2xl font-extrabold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#81c926] shadow-inner transition-all text-[#2a362f] text-center"/>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <AlertDialogCancel className="h-12 rounded-2xl font-bold !border-0 bg-gray-100 text-gray-600 hover:bg-gray-200 outline-none w-full">Cancelar</AlertDialogCancel>
              <Button type="submit" className="h-12 rounded-2xl bg-[#2a362f] hover:bg-black text-[#81c926] font-extrabold !border-0 outline-none w-full shadow-lg">Depositar</Button>
            </div>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      {/* MODAL: Resgatar da Meta */}
      <AlertDialog open={isResgateModalOpen} onOpenChange={setIsResgateModalOpen}>
        <AlertDialogContent className="bg-white rounded-[2.5rem] !border-0 !border-transparent !outline-none shadow-2xl sm:max-w-[400px] p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-extrabold text-[#2a362f]">Retirar do Cofre</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-bold text-gray-400 mt-2">
              Quanto dinheiro você quer retirar da meta <strong className="text-[#81c926]">{metaSelecionada?.titulo}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form onSubmit={retirarSaldoMeta} className="flex flex-col gap-4 mt-4">
            <div>
              <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest ml-1">Valor do Resgate (R$)</label>
              <input required autoFocus type="text" placeholder="0,00" value={valorOperacao} onChange={(e) => aplicarMascaraDinheiro(e.target.value, setValorOperacao)} className="flex h-14 mt-1 w-full rounded-2xl border-none bg-gray-50 px-5 text-2xl font-extrabold focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-400 shadow-inner transition-all text-[#2a362f] text-center"/>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <AlertDialogCancel className="h-12 rounded-2xl font-bold !border-0 bg-gray-100 text-gray-600 hover:bg-gray-200 outline-none w-full">Cancelar</AlertDialogCancel>
              <Button type="submit" className="h-12 rounded-2xl bg-gray-100 hover:bg-gray-200 text-red-500 font-extrabold !border-0 outline-none w-full shadow-sm">Retirar</Button>
            </div>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}