import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react'

export default function Hero({ onInscribe }) {
  return (
    <header className="hero" id="inicio">
      <div className="hero-bg" aria-hidden="true">
        <ShaderGradientCanvas
          className="hero-shader"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
          pixelDensity={1.2}
          fov={45}
        >
          <ShaderGradient
            preset="sunset"
            animate="on"
            type="sphere"
            color1="#F26E22"
            color2="#0D0D0D"
            color3="#8B3A12"
            brightness={1.35}
            grain="off"
            lightType="3d"
            envPreset="dawn"
            cAzimuthAngle={60}
            cDistance={7.1}
            cPolarAngle={90}
            cameraZoom={15.3}
            positionY={-0.15}
            reflection={0.1}
            uAmplitude={1.4}
            uDensity={1.1}
            uSpeed={0.1}
            uStrength={0.4}
          />
        </ShaderGradientCanvas>
        <div className="hero-glow" />
      </div>

      <div className="hero-content">
        <h1 className="hero-title">HUIÓS</h1>
        <p className="hero-subtitle">FILHOS MADUROS</p>
        <button className="cta" type="button" onClick={onInscribe}>
          Inscreva-se
        </button>
      </div>
    </header>
  )
}
