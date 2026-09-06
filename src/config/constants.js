/**
 * Configurações Gerais do Huíos
 * 
 * ATENÇÃO: Se o número do WhatsApp oficial ainda não estiver configurado,
 * insira o número abaixo ou na variável de ambiente VITE_WHATSAPP_NUMBER.
 * Formato esperado: apenas números com DDI e DDD (exemplo: '5511999999999').
 * NÃO inventar número fictício.
 */
export const HUIOS_WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || ''

// Mensagens padrão para os fluxos do WhatsApp
export const HUIOS_WHATSAPP_MESSAGE =
  'Olá! Já estou inscrito(a) no Huíos e gostaria de falar com vocês sobre minha inscrição.'

export const HUIOS_WHATSAPP_MESSAGE_PAGAMENTO =
  'Olá! Acabei de realizar minha inscrição no Huíos e gostaria de receber as informações para realizar o pagamento.'

export const HUIOS_WHATSAPP_MESSAGE_PENDENTE =
  'Olá! Já possuo uma inscrição pendente no Huíos e gostaria de orientações sobre o pagamento.'

export const HUIOS_WHATSAPP_MESSAGE_CONFIRMADA =
  'Olá! Minha inscrição no Huíos já está confirmada e gostaria de tirar uma dúvida.'

/**
 * Função utilitária reutilizável para gerar link do WhatsApp com mensagem pré-formatada.
 * Codifica a mensagem de forma segura com encodeURIComponent.
 *
 * @param {string} phone - Número do telefone com DDI e DDD (opcional, usa constante padrão)
 * @param {string} message - Mensagem a ser enviada
 * @returns {string} Link https://wa.me/...
 */
export function getWhatsAppLink(
  phone = HUIOS_WHATSAPP_NUMBER,
  message = HUIOS_WHATSAPP_MESSAGE
) {
  const cleanPhone = phone ? String(phone).replace(/\D/g, '') : ''
  const encodedText = encodeURIComponent(message)

  if (!cleanPhone) {
    // Se o número ainda não estiver configurado, retorna o link genérico do WhatsApp Web/App com a mensagem pronta
    return `https://wa.me/?text=${encodedText}`
  }

  return `https://wa.me/${cleanPhone}?text=${encodedText}`
}

/**
 * Chave de armazenamento temporário dos dados do formulário de inscrição
 */
export const INSCRICAO_TEMP_KEY = 'huios_inscricao_temp'
