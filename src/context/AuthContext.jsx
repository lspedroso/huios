import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminLoading, setAdminLoading] = useState(true)

  // Verifica se o usuário autenticado possui role = 'adm' na tabela public.profiles
  const verifyAdmin = async (userId, currentSession = null) => {
    if (!isSupabaseConfigured || !userId) {
      setIsAdmin(false)
      setAdminLoading(false)
      return false
    }

    setAdminLoading(true)

    try {
      // Obtém o token JWT ativo (do parâmetro, do state ou da sessão ativa do Supabase)
      let token = currentSession?.access_token || session?.access_token
      if (!token) {
        try {
          const { data: sessData } = await supabase.auth.getSession()
          token = sessData?.session?.access_token
        } catch {
          // Continua com as tentativas
        }
      }

      // 1. Tenta verificar via função RPC is_admin() (security definer, executa com privilégios de banco)
      try {
        const { data: rpcAdmin, error: rpcError } = await supabase.rpc('is_admin')
        if (!rpcError && rpcAdmin === true) {
          console.log('[Auth] Admin confirmado via RPC is_admin()')
          setIsAdmin(true)
          setAdminLoading(false)
          return true
        }
      } catch (rpcErr) {
        console.warn('[Auth] RPC is_admin não disponível ou falhou:', rpcErr)
      }

      // 2. Consulta direta à tabela public.profiles via client SDK
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .maybeSingle()

        if (!error && data && data.role === 'adm') {
          console.log('[Auth] Admin confirmado via public.profiles (SDK):', data)
          setIsAdmin(true)
          setAdminLoading(false)
          return true
        }
      } catch (sdkErr) {
        console.warn('[Auth] Consulta public.profiles via SDK falhou:', sdkErr)
      }

      // 3. Fallbacks diretos via REST fetch com o Bearer token (imune a delay de sync interna do SDK)
      if (token) {
        // 3a. Fallback via RPC REST com Bearer token
        try {
          const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/is_admin`, {
            method: 'POST',
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          if (rpcRes.ok) {
            const isAdm = await rpcRes.json()
            if (isAdm === true) {
              console.log('[Auth] Admin confirmado via REST RPC is_admin')
              setIsAdmin(true)
              setAdminLoading(false)
              return true
            }
          }
        } catch (rpcFetchErr) {
          console.warn('[Auth] REST RPC fallback falhou:', rpcFetchErr)
        }

        // 3b. Fallback direto na tabela profiles via REST com Bearer token
        try {
          const res = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=role`, {
            headers: {
              apikey: supabaseAnonKey,
              Authorization: `Bearer ${token}`
            }
          })
          if (res.ok) {
            const profilesData = await res.json()
            if (Array.isArray(profilesData) && profilesData[0]?.role === 'adm') {
              console.log('[Auth] Admin confirmado via REST profiles:', profilesData[0])
              setIsAdmin(true)
              setAdminLoading(false)
              return true
            }
          }
        } catch (fetchErr) {
          console.warn('[Auth] REST profiles fallback falhou:', fetchErr)
        }
      }

      console.log('[Auth] Usuário não possui permissão de admin:', userId)
      setIsAdmin(false)
      setAdminLoading(false)
      return false
    } catch (err) {
      console.error('[Auth] verifyAdmin exception:', err)
      setIsAdmin(false)
      setAdminLoading(false)
      return false
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      setAdminLoading(false)
      return
    }

    let isMounted = true

    // Detecta se a URL contém tokens de retorno de autenticação OAuth
    const isOAuthRedirect = () => {
      if (typeof window === 'undefined') return false
      const hash = window.location.hash || ''
      const search = window.location.search || ''
      return (
        hash.includes('access_token=') ||
        hash.includes('refresh_token=') ||
        hash.includes('error=') ||
        search.includes('code=')
      )
    }

    // Se estiver no retorno de um OAuth, segura o loading em true para evitar redirecionamento prematuro
    if (isOAuthRedirect()) {
      setLoading(true)
      setAdminLoading(true)
    }

    // Processamento unificado de sessão e verificação de perfil
    const processSession = async (currentSession, source = 'unknown') => {
      if (!isMounted) return

      setSession(currentSession)
      const currentUser = currentSession?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        // Usuário logado: valida se possui role 'adm' aguardando o término
        await verifyAdmin(currentUser.id, currentSession)
      } else {
        // Se ainda não há sessão, mas o hash/search do OAuth está na URL,
        // aguarda o Supabase extrair os tokens antes de finalizar o loading.
        if (isOAuthRedirect()) {
          console.log('[Auth] Aguardando processamento do OAuth redirect pelo Supabase...')
          return
        }

        setIsAdmin(false)
        setAdminLoading(false)
      }

      if (isMounted) {
        setLoading(false)
      }
    }

    // 1. Escuta alterações de estado de autenticação em tempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return
        console.log(`[Auth] onAuthStateChange event: ${event}`)

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setSession(null)
          setIsAdmin(false)
          setAdminLoading(false)
          setLoading(false)
          return
        }

        await processSession(currentSession, `event:${event}`)
      }
    )

    // 2. Obtém a sessão inicial armazenada caso o evento demore a ser disparado
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!isMounted) return
      if (initialSession) {
        await processSession(initialSession, 'getSession')
      } else if (!isOAuthRedirect()) {
        await processSession(null, 'getSession:null')
      }
    }).catch((err) => {
      console.error('[Auth] getSession error:', err)
      if (isMounted && !isOAuthRedirect()) {
        setLoading(false)
        setAdminLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Tradutor de erros técnicos do Supabase para mensagens amigáveis em português
  const translateAuthError = (error) => {
    if (!error) return ''
    console.error('[Supabase Auth Error]:', error)
    const msg = (error.message || error.msg || '').toLowerCase()
    const errorCode = (error.error_code || error.code || '').toString().toLowerCase()

    if (
      errorCode.includes('rate_limit') ||
      errorCode === '429' ||
      msg.includes('rate limit') ||
      msg.includes('over_email_send_rate_limit')
    ) {
      return 'Limite de envio de e-mails do Supabase temporariamente atingido (plano gratuito permite apenas 3 e-mails/hora). Para criar e testar novas contas agora sem esperar, adicione o usuário pelo painel do Supabase em "Authentication > Users > Add user" com "Auto Confirm" marcado!'
    }
    if (msg.includes('invalid login credentials')) {
      return 'E-mail ou senha incorretos. Verifique seus dados e tente novamente.'
    }
    if (msg.includes('user already registered') || msg.includes('already registered')) {
      return 'Este e-mail já está cadastrado. Alterne para "Entrar" para acessar sua conta.'
    }
    if (msg.includes('password should be at least')) {
      return 'A senha deve possuir no mínimo 6 caracteres.'
    }
    if (msg.includes('email not confirmed')) {
      return 'E-mail não confirmado. Verifique o link de ativação enviado para sua caixa de entrada ou pasta de Spam antes de entrar.'
    }
    if (msg.includes('invalid format') || msg.includes('valid email')) {
      return 'Por favor, informe um endereço de e-mail válido.'
    }
    if (msg.includes('failed to fetch') || msg.includes('networkerror')) {
      return 'Erro de conexão com o servidor. Verifique sua internet e tente novamente.'
    }

    return 'Não foi possível processar a solicitação no momento. Tente novamente em instantes.'
  }

  const signIn = async (email, password) => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Supabase não configurado. Por favor configure as variáveis de ambiente.'
      }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })

      if (error) {
        return { success: false, error: translateAuthError(error) }
      }

      if (data.user) {
        await verifyAdmin(data.user.id)
      }

      return { success: true, user: data.user, session: data.session }
    } catch (err) {
      return { success: false, error: translateAuthError(err) }
    }
  }

  const signUp = async (email, password, name = '') => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Supabase não configurado. Por favor configure as variáveis de ambiente.'
      }
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim()
          }
        }
      })

      if (error) {
        return { success: false, error: translateAuthError(error) }
      }

      return { success: true, user: data.user, session: data.session }
    } catch (err) {
      return { success: false, error: translateAuthError(err) }
    }
  }

  const signInWithGoogle = async (redirectTo = '/inscricao') => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Supabase não configurado. Por favor configure as variáveis de ambiente.'
      }
    }

    try {
      const targetUrl = redirectTo.startsWith('http')
        ? redirectTo
        : `${window.location.origin}${redirectTo.startsWith('/') ? redirectTo : '/' + redirectTo}`

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: targetUrl
        }
      })

      if (error) {
        return { success: false, error: translateAuthError(error) }
      }

      return { success: true, data }
    } catch (err) {
      return { success: false, error: translateAuthError(err) }
    }
  }

  const signOut = async () => {
    if (!isSupabaseConfigured) return
    try {
      await supabase.auth.signOut()
    } catch {
      // Falha silenciosa em caso de logout offline
    }
    try {
      sessionStorage.removeItem('huios_inscricao_temp')
    } catch {
      // Falha silenciosa caso sessionStorage não esteja acessível
    }
    setUser(null)
    setSession(null)
    setIsAdmin(false)
    setAdminLoading(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isAdmin,
        adminLoading,
        verifyAdmin,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        translateAuthError,
        isConfigured: isSupabaseConfigured
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider')
  }
  return context
}
