import { festivalExperiences } from '../data/events'

export function FestivalExperience() {
  return (
    <section className="festival-experience" id="experience" aria-labelledby="experience-title">
      <div className="festival-experience__backdrop" aria-hidden="true">HELION / BEYOND THE COMPETITION</div>
      <div className="container festival-experience__inner">
        <div className="festival-experience__header" data-reveal>
          <p className="eyebrow">The wider festival</p>
          <h2 id="experience-title">The competition is only part of it.</h2>
          <p>There is always something happening at HELION, even outside the main competitions.</p>
        </div>
        <ol className="experience-list">
          {festivalExperiences.map((experience, index) => (
            <li key={experience.id} data-reveal>
              <span>{String(index + 1).padStart(2, '0')}</span><strong>{experience.name}</strong><i aria-hidden="true">↗</i>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
