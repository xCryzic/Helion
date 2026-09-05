import symbolLogo from '../../assets/Helion-Logo.png'
import { ActionLink } from '../components/ui/ActionLink'

export function Hero() {
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero__grid" aria-hidden="true" />
      <div className="hero__flare" aria-hidden="true" />

      <div className="hero__inner container">
        <div className="hero__content">
          <p className="eyebrow hero__eyebrow reveal reveal--one">
            <span>Student-run technology festival</span>
            <span>For school students</span>
          </p>

          <h1 className="hero__title reveal reveal--two" id="hero-title">
            <span className="hero__title-line">Three days.</span>
            <span className="hero__title-line hero__title-line--accent">Six arenas.</span>
            <span className="hero__title-line">Make your mark.</span>
          </h1>

          <div className="hero__footer reveal reveal--three">
            <p className="hero__lede">
              Code. Build. Design. Compete. HELION 2027 brings six competitions and a
              wider technology experience into one three-day festival.
            </p>
            <div className="hero__actions">
              <ActionLink href="#register-interest">Register interest</ActionLink>
              <a className="text-link" href="#festival-scale">
                Explore the festival <span aria-hidden="true">↓</span>
              </a>
            </div>
            <p className="hero__status" role="note">
              Interest registration is open. Official registration and festival dates
              will be announced later.
            </p>
          </div>
        </div>

        <aside className="hero-signal reveal reveal--four" aria-label="HELION 2027 status">
          <div className="hero-signal__topline">
            <span>HEL / 27</span>
            <span>Signal 01</span>
          </div>
          <div className="hero-signal__mark">
            <span className="hero-signal__axis hero-signal__axis--x" aria-hidden="true" />
            <span className="hero-signal__axis hero-signal__axis--y" aria-hidden="true" />
            <img src={symbolLogo} alt="" />
          </div>
          <div className="hero-signal__meta">
            <div>
              <span>Edition</span>
              <strong>2027</strong>
            </div>
            <div>
              <span>Dates</span>
              <strong>To be announced</strong>
            </div>
          </div>
        </aside>
      </div>

      <div className="hero__rail" aria-hidden="true">
        <span>Scroll to enter</span>
        <i />
      </div>
    </section>
  )
}
