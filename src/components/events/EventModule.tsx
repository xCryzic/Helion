import type { EventFormat } from '../../data/events'

type EventModuleProps = { event: EventFormat; index: number }

export function EventModule({ event, index }: EventModuleProps) {
  return (
    <article className={`event-module event-module--${event.id}`} data-reveal>
      <div className="event-module__index" aria-hidden="true">{String(index + 2).padStart(2, '0')}</div>
      <div className="event-module__body">
        <p className="event-module__category">{event.category}</p>
        <h3>{event.name}</h3>
        <p className="event-module__activity">{event.activity}</p>
      </div>
      <dl className="event-module__meta">
        <div><dt>Duration</dt><dd>{event.duration ?? 'To be announced'}</dd></div>
        <div><dt>Details</dt><dd>{event.detailsStatus === 'coming-soon' ? 'Coming soon' : 'Confirmed'}</dd></div>
      </dl>
      <span className="event-module__signal" aria-hidden="true" />
    </article>
  )
}
