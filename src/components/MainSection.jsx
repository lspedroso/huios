import Carousel from './Carousel'
import LoginForm from './LoginForm'

export default function MainSection() {
  return (
    <main className="main" id="main">
      <div className="main-inner">
        <section className="main-left" aria-labelledby="carousel-title">
          <h2 id="carousel-title" className="section-title">
            Momentos
          </h2>
          <p className="section-text">
            Memórias do HUIÓS em movimento contínuo.
          </p>
          <Carousel />
        </section>

        <section className="main-right" aria-labelledby="login-title">
          <LoginForm />
        </section>
      </div>
    </main>
  )
}
