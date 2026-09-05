import completeLogo from '../../../assets/Helion-Logo-Complete.png'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <a className="footer-logo" href="#top" aria-label="HELION 2027 home"><img src={completeLogo} alt="HELION" /></a>
        <p>Student-run technology festival for school students.</p>
        <nav aria-label="Footer navigation">
          <a href="#competitions">Competitions</a><a href="#experience">Experience</a><a href="#faq">FAQ</a><a href="#register-interest">Register interest</a>
        </nav>
        <div className="site-footer__meta"><span>HELION 2027</span><span>Dates to be announced</span></div>
      </div>
    </footer>
  )
}
