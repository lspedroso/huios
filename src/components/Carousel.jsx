import { useEffect, useState } from 'react'

const imageModules = import.meta.glob('../../assets/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', {
  eager: true,
  import: 'default',
})

const SLIDES = Object.entries(imageModules)
  .map(([path, src]) => {
    const fileName = path.split('/').pop() ?? path
    const match = fileName.match(/(\d+)/)
    const num = match ? Number(match[1]) : 0
    return {
      id: num || fileName,
      src,
      label: `Foto ${num || fileName}`,
      num,
    }
  })
  .sort((a, b) => a.num - b.num)

export default function Carousel() {
  const [index, setIndex] = useState(0)
  const total = SLIDES.length

  useEffect(() => {
    if (total < 2) return undefined

    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % total)
    }, 3500)

    return () => clearInterval(timer)
  }, [total])

  if (total === 0) {
    return (
      <div className="carousel">
        <div className="carousel-placeholder">
          <span>Sem fotos</span>
          <small>Adicione imagens em /assets</small>
        </div>
      </div>
    )
  }

  const goTo = (next) => {
    setIndex(((next % total) + total) % total)
  }

  return (
    <div className="carousel">
      <div className="carousel-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {SLIDES.map((slide) => (
          <div className="carousel-slide" key={slide.id}>
            <img src={slide.src} alt={slide.label} loading="lazy" draggable={false} />
          </div>
        ))}
      </div>

      <button
        className="carousel-btn prev"
        type="button"
        aria-label="Slide anterior"
        onClick={() => goTo(index - 1)}
      >
        ‹
      </button>
      <button
        className="carousel-btn next"
        type="button"
        aria-label="Próximo slide"
        onClick={() => goTo(index + 1)}
      >
        ›
      </button>
    </div>
  )
}
