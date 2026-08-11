import { useState } from 'react'

export default function Inscricao() {
  const [formulario, setFormulario] = useState({
    nome: '',
    idade: '',
    batizado: '',
    igreja: '',
    membroIgreja: ''
  })

  const [enviado, setEnviado] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    setEnviado(true)
  }

  if (enviado) {
    return (
      <main className="inscricao-page">
        <section className="pagamento-card">

          <span className="pagamento-label">
            INSCRIÇÃO
          </span>

          <h1>Quase lá!</h1>

          <p>
            Sua inscrição foi preenchida com sucesso.
          </p>

          <div className="resumo-inscricao">
            <h2>Retiro Huiós</h2>

            <div className="valor">
              <span>Valor da inscrição</span>
              <strong>R$ 180,00</strong>
            </div>
          </div>

          <button
            className="cta pagamento-button"
            type="button"
          >
            Continuar para pagamento
          </button>

        </section>
      </main>
    )
  }

  return (
    <main className="inscricao-page">

      <section className="inscricao-card">

        <span className="inscricao-label">
          RETIRO HUIÓS
        </span>

        <h1>Faça sua inscrição</h1>

        <p className="inscricao-description">
          Preencha seus dados para participar do retiro.
        </p>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label htmlFor="nome">
              Nome completo
            </label>

            <input
              id="nome"
              name="nome"
              type="text"
              placeholder="Digite seu nome"
              value={formulario.nome}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="idade">
              Idade
            </label>

            <input
              id="idade"
              name="idade"
              type="number"
              placeholder="Digite sua idade"
              min="1"
              max="100"
              value={formulario.idade}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>
              Você é batizado?
            </label>

            <div className="radio-group">

              <label className="radio-option">
                <input
                  type="radio"
                  name="batizado"
                  value="sim"
                  checked={formulario.batizado === 'sim'}
                  onChange={handleChange}
                  required
                />

                <span>Sim</span>
              </label>

              <label className="radio-option">
                <input
                  type="radio"
                  name="batizado"
                  value="nao"
                  checked={formulario.batizado === 'nao'}
                  onChange={handleChange}
                />

                <span>Não</span>
              </label>

            </div>
          </div>
          

          <div className="form-group">
            <label>
              Você é membro de alguma igreja?
            </label>

            <div className="radio-group">

              <label className="radio-option">
                <input
                  type="radio"
                  name="membroIgreja"
                  value="sim"
                  checked={formulario.membroIgreja === 'sim'}
                  onChange={handleChange}
                  required
                />

                <span>Sim</span>
              </label>

              <label className="radio-option">
                <input
                  type="radio"
                  name="membroIgreja"
                  value="nao"
                  checked={formulario.membroIgreja === 'nao'}
                  onChange={handleChange}
                />

                <span>Não</span>
              </label>

            </div>
          </div>
          {formulario.membroIgreja === 'sim' && (
  <div className="form-group">

    <label htmlFor="igreja">
      De qual igreja você é?
    </label>

    <input
      id="igreja"
      name="igreja"
      type="text"
      placeholder="Digite o nome da sua igreja"
      value={formulario.igreja}
      onChange={handleChange}
      required
    />

  </div>
)}
          

          <button
            className="cta inscricao-button"
            type="submit"
          >
            Continuar
          </button>

        </form>

      </section>

    </main>
  )
}