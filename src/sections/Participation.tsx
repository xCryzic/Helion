import { ActionLink } from '../components/ui/ActionLink'

const steps = [
  ['01', 'Share your interest', 'Tell us who you are and which confirmed competitions interest you.'],
  ['02', 'Watch for registration', 'Official registration will open later, once the remaining details are confirmed.'],
  ['03', 'Use the same email', 'The same email may make you eligible for a registration discount. Conditions are not yet finalized.'],
] as const

export function Participation() {
  return (
    <section className="participation" id="participation" aria-labelledby="participation-title">
      <div className="container participation__grid">
        <div className="participation__lead" data-reveal>
          <p className="eyebrow eyebrow--dark">From interest to entry</p>
          <h2 id="participation-title">Raise your hand now. Register later.</h2>
          <p>Interest registration is the first signal—not an account and not official event registration.</p>
          <ActionLink href="#register-interest">Register interest</ActionLink>
        </div>
        <ol className="participation__steps">
          {steps.map(([number, title, description]) => (
            <li key={number} data-reveal><span>{number}</span><div><h3>{title}</h3><p>{description}</p></div></li>
          ))}
        </ol>
      </div>
    </section>
  )
}
