import React, { useState, useEffect } from 'react'
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
    <div className="absolute top-0 left-0 w-full h-10 flex items-center px-5 z-[99999]" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
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

  // AUTO-UPDATE
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).require) {
      const { ipcRenderer } = (window as any).require('electron');
      ipcRenderer.on('update-ready', () => {
        toast("Nova versão disponível!", {
          description: "O download da atualização foi concluído em segundo plano.",
          duration: Infinity,
          action: { label: "Atualizar agora", onClick: () => ipcRenderer.send('install-update') }
        });
      });
      return () => ipcRenderer.removeAllListeners('update-ready');
    }
  }, []);

  // SPLASH SCREEN (15s com Frases Financeiras)
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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#f4f7f6] relative rounded-2xl shadow-2xl">
      <Toaster theme="dark" position="bottom-right" className="font-sans z-[99999]" />
      
      {!isAppLoading && <TitleBar />}
      
      {/* SPLASH SCREEN RETANGULAR ISOLADA */}
      {isAppLoading && (
        <div className="fixed inset-0 z-[10000] bg-[#1a1a1a] flex items-center justify-center">
          <div className="w-[600px] h-[350px] bg-[#1a1a1a] border border-white/10 rounded-2xl flex flex-col items-center justify-center relative p-10 shadow-2xl overflow-hidden">
            
            <div className="w-20 h-20 mb-6">
              <img src={logoImg} alt="Logo" className="w-full h-full object-contain animate-pulse" />
            </div>
            
            <h2 className="text-white text-2xl font-bold tracking-tight mb-2">Nexo Finance</h2>
            <p className="text-gray-400 font-medium text-sm italic h-6 transition-all duration-500">
              "{loadingText}"
            </p>

            {/* Barra de progresso contida dentro das bordas arredondadas */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
              <div className="h-full bg-[#81c926] animate-[progress-bar_15s_linear_forwards]"></div>
            </div>
          </div>

          <style>{`
            @keyframes progress-bar { 0% { width: 0%; } 100% { width: 100%; } }
          `}</style>
        </div>
      )}

      {/* ÁREA DE CONTEÚDO */}
      <div className="flex-1 w-full h-full overflow-hidden">
        {!currentUser ? (
          <Login onLoginSucesso={(user) => setCurrentUser(user)} />
        ) : (
          <Dashboard currentUser={currentUser} onLogout={() => setCurrentUser(null)} />
        )}
      </div>
    </div>
  )
}