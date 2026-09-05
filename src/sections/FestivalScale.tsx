import { eventFormats } from '../data/events'
import { SectionShell } from '../components/layout/SectionShell'

export function FestivalScale() {
  return (
    <SectionShell
      className="festival-scale"
      innerClassName="festival-scale__inner"
      id="festival-scale"
      aria-labelledby="scale-title"
    >
      <div className="festival-scale__intro">
        <p className="eyebrow eyebrow--dark">The shape of HELION</p>
        <h2 id="scale-title">
          Not one lane.
          <br />
          A whole field.
        </h2>
        <p>
          Six competitions sit inside a three-day technology festival with workshops,
          stalls and exhibitions beyond the main arenas.
        </p>
      </div>

      <div className="scale-stat scale-stat--days">
        <span className="scale-stat__number">03</span>
        <div>
          <span className="scale-stat__label">Days</span>
          <span className="scale-stat__note">One continuous festival</span>
        </div>
      </div>

      <div className="scale-stat scale-stat--formats">
        <span className="scale-stat__number">06</span>
        <div>
          <span className="scale-stat__label">Competitions</span>
          <span className="scale-stat__note">Confirmed lineup</span>
        </div>
      </div>

      <div className="format-index" aria-label="Confirmed event formats">
        <span className="format-index__label">Program index</span>
        <div className="format-index__track">
          {eventFormats.map((event, index) => (
            <span key={event.id}>
              <b>{String(index + 1).padStart(2, '0')}</b>
              {event.name}
            </span>
          ))}
        </div>
      </div>
    </SectionShell>
  )
}
