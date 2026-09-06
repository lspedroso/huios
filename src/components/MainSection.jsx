import Carousel from './Carousel'
import LoginForm from './LoginForm'

export default function MainSection() {
  return (
    <main className="main" id="main">
      <div className="main-inner">
        <div className="main-header-area">
          <h2 id="carousel-title" className="section-title">
            Momentos
          </h2>
          <p className="section-text">
            Memórias do nosso retiro HUIÓS.
          </p>
        </div>

        <section className="main-carousel-area" aria-labelledby="carousel-title">
          <Carousel />
        </section>

        <section className="main-right" aria-labelledby="login-title">
          <LoginForm />
        </section>
      </div>
    </main>
  )
}
