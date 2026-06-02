import React, { useState } from "react"
import { toast } from "sonner"
import { Button } from "./components/ui/button"
import { User } from "./App"

// @ts-ignore
import logoImg from "./logo.png"

interface LoginProps {
  onLoginSucesso: (user: User) => void;
}

export default function Login({ onLoginSucesso }: LoginProps) {
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [nome, setNome] = useState("")
  const [modo, setModo] = useState<"login" | "registro">("login")
  
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const gerarId = () => Date.now().toString(36) + Math.random().toString(36).substr(2)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsAuthenticating(true)

    setTimeout(() => {
      try {
        const usersDB = JSON.parse(localStorage.getItem("@financas:users") || "[]")

        if (modo === "registro") {
          if (usersDB.find((u: any) => u.email === email)) {
            toast.error("Este e-mail já está em uso.")
            setIsAuthenticating(false)
            return
          }
          const newUser = { id: gerarId(), nome, email, senha }
          localStorage.setItem("@financas:users", JSON.stringify([...usersDB, newUser]))
          toast.success("Conta criada com sucesso!")
          onLoginSucesso(newUser)
        } else {
          const user = usersDB.find((u: any) => u.email === email && u.senha === senha)
          if (user) {
            toast.success(`Bem-vindo de volta, ${user.nome}!`)
            onLoginSucesso(user)
          } else {
            toast.error("E-mail ou senha incorretos.")
            setIsAuthenticating(false)
          }
        }
      } catch (error) {
        toast.error("Erro ao acessar o banco de dados.")
        setIsAuthenticating(false)
      }
    }, 1500) // 1.5 segundos de animação de login
  }

  return (
    <div className="flex min-h-screen w-full font-sans antialiased bg-white selection:bg-[#81c926] selection:text-white relative">
      
      {/* OVERLAY DE CARREGAMENTO DO LOGIN */}
      {isAuthenticating && (
        <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="w-16 h-16 border-4 border-[#81c926]/20 border-t-[#81c926] rounded-full animate-spin mb-4"></div>
          <p className="text-xl font-extrabold text-[#2a362f] animate-pulse">
            {modo === 'login' ? 'Autenticando sessão...' : 'Criando seu ambiente...'}
          </p>
        </div>
      )}

      <div className="hidden lg:flex w-1/2 bg-[#2a362f] flex-col justify-between p-16 relative overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-5 pointer-events-none" viewBox="0 0 100 100">
          <rect x="10" y="10" width="40" height="40" fill="white" transform="rotate(45 25 25)"/>
          <circle cx="80" cy="80" r="20" fill="white" />
        </svg>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#81c926] rounded-full blur-3xl opacity-20 pointer-events-none"></div>

        <div className="z-10 flex items-center gap-4 mt-8">
          <div className="w-12 h-12 bg-[#81c926] rounded-xl flex items-center justify-center shadow-lg shadow-[#81c926]/20 p-2 overflow-hidden">
            <img src={logoImg} alt="Nexo Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold text-3xl text-white tracking-tight">Nexo</span>
        </div>

        <div className="z-10 max-w-md">
          <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
            O controle <span className="text-[#81c926]">absoluto</span> das suas finanças.
          </h1>
          <p className="text-lg text-gray-400 font-medium leading-relaxed">
            Acompanhe receitas, gerencie despesas e alcance suas metas financeiras em um ambiente totalmente seguro e local.
          </p>
        </div>

        <div className="z-10 text-xs text-gray-500 font-bold uppercase tracking-widest">
          © 2026 Nexo App
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-24 xl:px-32 relative bg-[#f4f7f6]">
        
        <div className="lg:hidden flex items-center gap-3 mb-12 mt-10">
          <div className="w-10 h-10 bg-[#81c926] rounded-xl flex items-center justify-center p-1.5 overflow-hidden shadow-md">
            <img src={logoImg} alt="Nexo Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold text-2xl text-[#2a362f] tracking-tight">Nexo</span>
        </div>

        <div className="w-full max-w-md mx-auto lg:mx-0 bg-white p-10 rounded-[2rem] shadow-sm border border-gray-100">
          <h2 className="text-3xl font-extrabold text-[#2a362f] mb-2 tracking-tight">
            {modo === "login" ? "Bem-vindo de volta" : "Criar sua conta"}
          </h2>
          <p className="text-sm font-medium text-gray-400 mb-10">
            {modo === "login" ? "Acesse o painel com o seu e-mail." : "Preencha os dados abaixo para o primeiro acesso."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {modo === "registro" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Nome Completo</label>
                <input required type="text" placeholder="Ex: Matheus" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full h-14 rounded-2xl border border-gray-200 bg-gray-50 px-5 text-[#2a362f] font-medium placeholder:text-gray-300 focus:bg-white focus:ring-2 focus:ring-[#81c926] outline-none transition-all" />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">E-mail</label>
              <input required type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-14 rounded-2xl border border-gray-200 bg-gray-50 px-5 text-[#2a362f] font-medium placeholder:text-gray-300 focus:bg-white focus:ring-2 focus:ring-[#81c926] outline-none transition-all" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest">Senha</label>
                {modo === "login" && (
                  <button type="button" onClick={() => toast.info("Por enquanto, o app é offline. Crie uma nova conta se esqueceu.")} className="text-[11px] font-bold text-[#81c926] hover:text-[#6eb41a] transition-colors">Esqueceu a senha?</button>
                )}
              </div>
              <input required type="password" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} className="w-full h-14 rounded-2xl border border-gray-200 bg-gray-50 px-5 text-[#2a362f] font-medium placeholder:text-gray-300 focus:bg-white focus:ring-2 focus:ring-[#81c926] outline-none transition-all" />
            </div>

            <Button type="submit" disabled={isAuthenticating} className="w-full h-14 rounded-2xl bg-[#81c926] hover:bg-[#8ee12d] text-[#2a362f] text-base font-extrabold shadow-lg shadow-[#81c926]/30 mt-6 transition-transform hover:-translate-y-0.5 border-none disabled:opacity-50">
              {modo === "login" ? "Entrar no Sistema" : "Começar agora"}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-400 font-bold text-[10px] uppercase tracking-widest">Ou</span>
            </div>
          </div>

          <div className="text-center">
            <button 
              type="button"
              onClick={() => {
                setModo(modo === "login" ? "registro" : "login")
                setNome(""); setEmail(""); setSenha("");
              }}
              className="text-sm font-bold text-gray-500 hover:text-[#2a362f] transition-colors outline-none"
            >
              {modo === "login" ? (
                <>Não tem uma conta? <span className="text-[#81c926]">Primeiro acesso</span></>
              ) : (
                <>Já possui conta? <span className="text-[#81c926]">Fazer login</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}