import { EventModule } from '../components/events/EventModule'
import { supportingEvents } from '../data/events'

export function CompetitionLandscape() {
  return (
    <section className="competition-landscape" aria-labelledby="competition-title">
      <div className="container">
        <header className="competition-landscape__header" data-reveal>
          <p className="eyebrow eyebrow--dark">Competition landscape / 02—06</p>
          <h2 id="competition-title">Pick your arena.</h2>
          <p>Six confirmed competitions, each built around a different way of making, solving or competing.</p>
        </header>
        <div className="competition-landscape__grid">
          {supportingEvents.map((event, index) => <EventModule event={event} index={index} key={event.id} />)}
        </div>
      </div>
    </section>
  )
}
