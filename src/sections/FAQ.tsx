import { faqItems } from '../data/faq'

export function FAQ() {
  return (
    <section className="faq" id="faq" aria-labelledby="faq-title">
      <div className="container faq__grid">
        <header data-reveal><p className="eyebrow eyebrow--dark">Before you ask</p><h2 id="faq-title">Known now.<br />More soon.</h2></header>
        <div className="faq__list">
          {faqItems.map((item, index) => (
            <details key={item.question} data-reveal>
              <summary><span>{String(index + 1).padStart(2, '0')}</span>{item.question}<i aria-hidden="true" /></summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
