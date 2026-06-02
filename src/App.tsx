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

// Componente da Barra Superior estilo macOS
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
  const [loadingText, setLoadingText] = useState("Iniciando motores...")

  // ESCUTA O ELECTRON PARA O AUTO-UPDATE REAL
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).require) {
      const { ipcRenderer } = (window as any).require('electron');
      
      // O Electron avisa que o arquivo .exe invisível terminou de baixar
      ipcRenderer.on('update-ready', () => {
        toast("Nova versão disponível!", {
          description: "O download da atualização foi concluído em segundo plano.",
          duration: Infinity, // Fica travado na tela até clicar
          action: {
            label: "Atualizar agora",
            onClick: () => {
              // Manda a ordem para o Electron fechar o app e instalar o novo
              ipcRenderer.send('install-update');
            }
          }
        });
      });

      return () => {
        ipcRenderer.removeAllListeners('update-ready');
      };
    }
  }, []);

  // ANIMAÇÃO DE CARREGAMENTO (SPLASH SCREEN)
  useEffect(() => {
    if (!isAppLoading) return;
    const texts = [
      { time: 1000, msg: "Criptografando dados locais..." },
      { time: 2000, msg: "Sincronizando sua carteira..." },
      { time: 3000, msg: "Otimizando performance visual..." },
      { time: 4000, msg: "Quase pronto para decolar..." }
    ];
    texts.forEach(item => {
      setTimeout(() => setLoadingText(item.msg), item.time);
    });
    
    const timer = setTimeout(() => setIsAppLoading(false), 5000);
    return () => clearTimeout(timer);
  }, [isAppLoading]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#f4f7f6] relative rounded-2xl shadow-2xl">
      {/* TOASTER GLOBAL */}
      <Toaster theme="dark" position="bottom-right" className="font-sans z-[99999]" />
      <TitleBar />
      
      {/* --- SPLASH SCREEN SURPREENDENTE (5 SEGUNDOS) --- */}
      {isAppLoading && (
        <div className="absolute inset-0 z-[10000] bg-[#1a1a1a] flex flex-col items-center justify-center overflow-hidden">
          
          {/* Fundo com Blobs Animados */}
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#81c926]/10 rounded-full blur-[120px] animate-[pulse_8s_infinite]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#81c926]/5 rounded-full blur-[100px] animate-[pulse_12s_infinite]"></div>
          
          {/* Partículas Flutuantes */}
          {[...Array(20)].map((_, i) => (
            <div 
              key={i}
              className="absolute bg-white/10 rounded-full animate-float"
              style={{
                width: Math.random() * 6 + 'px',
                height: Math.random() * 6 + 'px',
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                animationDuration: (Math.random() * 5 + 5) + 's',
                animationDelay: (Math.random() * 5) + 's'
              }}
            />
          ))}

          {/* Central: Logo com Glow Neon */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-32 h-32 bg-[#2a2a2a] rounded-[2.5rem] flex items-center justify-center shadow-[0_0_50px_rgba(129,201,38,0.3)] p-6 mb-8 animate-[bounce-soft_4s_infinite_ease-in-out]">
              <img src={logoImg} alt="Nexo Logo" className="w-full h-full object-contain animate-[spin-slow_20s_linear_infinite]" />
            </div>
            
            <h1 className="text-white text-6xl font-black tracking-tighter mb-2 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              Nexo<span className="text-[#81c926]">.</span>
            </h1>
            
            {/* Texto Dinâmico */}
            <p className="text-gray-400 font-medium text-sm tracking-widest uppercase h-6 animate-pulse">
              {loadingText}
            </p>

            {/* Anel de Progresso Circular SVG */}
            <div className="mt-12 relative w-16 h-16">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                <circle 
                  cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" 
                  strokeDasharray={176}
                  className="text-[#81c926] animate-[progress-circle_5s_linear_forwards]" 
                />
              </svg>
            </div>
          </div>

          <style>{`
            @keyframes progress-circle { 0% { stroke-dashoffset: 176; } 100% { stroke-dashoffset: 0; } }
            @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes bounce-soft { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
            @keyframes float { 
              0% { transform: translateY(0) translateX(0); opacity: 0; } 
              50% { opacity: 0.5; }
              100% { transform: translateY(-100vh) translateX(50px); opacity: 0; } 
            }
          `}</style>
        </div>
      )}

      {/* ÁREA DE CONTEÚDO (LOGIN OU DASHBOARD) */}
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