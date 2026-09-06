import { createClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL || ''
// O SDK do Supabase requer a URL base do projeto (sem /rest/v1/ nem barras no final)
export const supabaseUrl = rawUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
export const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl !== 'https://seu-projeto.supabase.co' &&
  supabaseAnonKey !== 'sua-chave-anon-publica-aqui'
)

if (!isSupabaseConfigured) {
  console.warn(
    '[Huíos Supabase] Variáveis de ambiente VITE_SUPABASE_URL e/ou VITE_SUPABASE_ANON_KEY não configuradas. ' +
    'Crie um arquivo .env na raiz com as credenciais do seu projeto Supabase.'
  )
}

// Inicializa o cliente real se configurado, ou um cliente dummy seguro para evitar erros em tempo de execução
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
)
