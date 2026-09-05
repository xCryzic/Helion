import { InterestForm } from '../components/forms/InterestForm'

export function RegisterInterest() {
  return (
    <section className="register-interest" id="register-interest" aria-labelledby="interest-title">
      <div className="container register-interest__grid">
        <div className="register-interest__intro" data-reveal>
          <p className="eyebrow">Your first move</p><h2 id="interest-title">Register<br />interest.</h2>
          <p>Tell us where you want to compete. Official registration will open later.</p>
          <div className="register-interest__discount"><span>Same email</span><p>May qualify for a registration discount later. Amount and conditions to be confirmed.</p></div>
        </div>
        <div data-reveal><InterestForm /></div>
      </div>
    </section>
  )
}
