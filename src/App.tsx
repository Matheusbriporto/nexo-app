import { useState, useEffect } from 'react'
import Login from './Login'
import Dashboard from './Dashboard'
import { Toaster, toast } from "sonner"

// @ts-ignore
import logoImg from "./logo.png"

export type User = {
  id: string;
  nome: string;
  email: string;
}

const TitleBar = () => {
  const handleAction = (action: string) => {
    if (typeof window !== 'undefined' && (window as any).require) {
      const { ipcRenderer } = (window as any).require('electron');
      ipcRenderer.send(action);
    }
  };

  return (
    <div className="absolute top-0 left-0 w-full h-10 flex items-center px-5 z-[999999]" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
      <div className="flex gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button onClick={() => handleAction('window-close')} className="w-3.5 h-3.5 rounded-full bg-[#ff5f56] hover:bg-[#e0443e] border border-black/10 shadow-sm outline-none transition-colors" title="Fechar" />
        <button onClick={() => handleAction('window-minimize')} className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e] hover:bg-[#dea123] border border-black/10 shadow-sm outline-none transition-colors" title="Minimizar" />
        <button onClick={() => handleAction('window-maximize')} className="w-3.5 h-3.5 rounded-full bg-[#27c93f] hover:bg-[#1da931] border border-black/10 shadow-sm outline-none transition-colors" title="Maximizar" />
      </div>
    </div>
  );
};

export default function App() {
  const [isAppLoading, setIsAppLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loadingText, setLoadingText] = useState("Organizando suas economias...")
  
  // Memória para saber se a atualização está pronta
  const [updatePronto, setUpdatePronto] = useState(false)

  // ==========================================
  // AUTO-UPDATE - CAPTADOR DE EVENTOS
  // ==========================================
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).require) {
      const { ipcRenderer } = (window as any).require('electron');
      
      // Quando o download terminar, apenas "guarda" a informação, não mostra ainda!
      ipcRenderer.on('update-ready', () => {
        setUpdatePronto(true);
      });

      // Os status normais (ex: "Procurando...") podem aparecer normal
      ipcRenderer.on('update-status', (_: any, message: string) => {
        toast(message, { duration: 4000 });
      });

      return () => {
        ipcRenderer.removeAllListeners('update-ready');
        ipcRenderer.removeAllListeners('update-status');
      };
    }
  }, []);

  // ==========================================
  // DISPARADOR DO AVISO PERMANENTE NO DASHBOARD
  // ==========================================
  useEffect(() => {
    // Só dispara se o usuário estiver logado (currentUser) E se tiver atualização pronta
    if (currentUser && updatePronto) {
      toast("🚀 Atualização Disponível!", {
        description: "Uma nova versão do Nexo foi baixada e está pronta para ser instalada.",
        duration: Infinity, // Fica na tela para sempre (até clicar)
        cancel: {
          label: "Fechar",
          onClick: () => { /* Apenas fecha o toast sem fazer nada */ }
        },
        action: { 
          label: "Atualizar Agora", 
          onClick: () => {
            if (typeof window !== 'undefined' && (window as any).require) {
              const { ipcRenderer } = (window as any).require('electron');
              ipcRenderer.send('install-update');
            }
          } 
        }
      });
      // Reseta a memória para não ficar duplicando o aviso
      setUpdatePronto(false);
    }
  }, [currentUser, updatePronto]);

  // ==========================================
  // SPLASH SCREEN (15s)
  // ==========================================
  useEffect(() => {
    if (!isAppLoading) return;
    const phrases = [
      "Organizando suas economias...",
      "Analisando seus investimentos...",
      "O controle financeiro é a chave da liberdade...",
      "Cada centavo conta...",
      "Planejando seu futuro com inteligência...",
      "O hábito de poupar é o primeiro passo para o sucesso."
    ];
    
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % phrases.length;
      setLoadingText(phrases[index]);
    }, 2500);
    
    const timer = setTimeout(() => setIsAppLoading(false), 15000);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [isAppLoading]);

  return (
    <>
      <Toaster theme="dark" position="bottom-right" className="font-sans z-[99999]" />
      
      {isAppLoading ? (
        /* =========================================================
           SPLASH SCREEN: CAIXA FLUTUANTE COM FUNDO GEOMÉTRICO
           ========================================================= */
        <div className="h-screen w-screen bg-transparent flex items-center justify-center">
          
          <div className="w-[600px] h-[350px] bg-[#222a25] border border-white/10 rounded-2xl flex flex-col items-center justify-center relative shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
            
            <div className="absolute top-[-100px] left-[-80px] w-[300px] h-[300px] bg-white/[0.03] rotate-45 rounded-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-80px] right-[-80px] w-[250px] h-[250px] bg-white/[0.02] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-[-50px] left-[-50px] w-[250px] h-[250px] bg-[#81c926]/15 rounded-full blur-[70px] pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 mb-6">
                <img src={logoImg} alt="Logo" className="w-full h-full object-contain animate-pulse" />
              </div>
              
              <h2 className="text-white text-2xl font-bold tracking-tight mb-2">Nexo Finance</h2>
              <p className="text-[#a4b5ac] font-medium text-sm italic h-6 transition-all duration-500 text-center px-8">
                "{loadingText}"
              </p>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5 z-20">
              <div className="h-full bg-[#81c926] shadow-[0_0_10px_#81c926] animate-[progress-bar_15s_linear_forwards]"></div>
            </div>
          </div>

          <style>{`
            @keyframes progress-bar { 0% { width: 0%; } 100% { width: 100%; } }
          `}</style>
        </div>
      ) : (
        /* =========================================================
           APP PRONTO (INTERFACE COMPLETA DO SISTEMA)
           ========================================================= */
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#f4f7f6] relative rounded-2xl shadow-2xl animate-in fade-in duration-500">
          
          <TitleBar />

          <div className="flex-1 w-full h-full overflow-hidden">
            {!currentUser ? (
              <Login onLoginSucesso={(user) => setCurrentUser(user)} />
            ) : (
              <Dashboard currentUser={currentUser} onLogout={() => setCurrentUser(null)} />
            )}
          </div>
        </div>
      )}
    </>
  )
}