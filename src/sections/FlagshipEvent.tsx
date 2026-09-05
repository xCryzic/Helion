import { flagshipEvent } from '../data/events'
import { ActionLink } from '../components/ui/ActionLink'
import symbolLogo from '../../assets/Helion-Logo.png'

export function FlagshipEvent() {
  return (
    <section className="flagship" id="competitions" aria-labelledby="flagship-title">
      <div className="flagship__frame container">
        <div className="flagship__heading" data-reveal>
          <p className="eyebrow">Flagship competition / 01</p>
          <h2 id="flagship-title">{flagshipEvent.name}</h2>
        </div>
        <div className="flagship__duration" data-reveal>
          <span>Duration</span><strong>{flagshipEvent.duration}</strong><small>Confirmed</small>
        </div>
        <div className="flagship__statement" data-reveal>
          <p>{flagshipEvent.activity}</p>
          <p className="flagship__pending">Theme, format and competition details will be announced later.</p>
          <ActionLink href="#register-interest" variant="quiet">Mark your interest</ActionLink>
        </div>
        <div className="flagship__visual">
          <span className="flagship__axis flagship__axis--horizontal" aria-hidden="true" />
          <span className="flagship__axis flagship__axis--vertical" aria-hidden="true" />
          <img src={symbolLogo} alt="HELION symbol" />
        </div>
      </div>
    </section>
  )
}
