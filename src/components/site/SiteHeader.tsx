import { useEffect, useState } from 'react'
import completeLogo from '../../../assets/Helion-Logo-Complete.png'
import { ActionLink } from '../ui/ActionLink'

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <header className={`site-header ${scrolled ? 'site-header--scrolled' : ''}`}>
      <div className="site-header__inner container">
        <a className="brand-lockup" href="#top" aria-label="HELION 2027 home">
          <img src={completeLogo} alt="HELION" />
        </a>

        <button
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="site-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="menu-toggle__label">Menu</span>
          <span className="menu-toggle__icon" aria-hidden="true">
            <span />
            <span />
          </span>
        </button>

        <nav
          className={`site-nav ${menuOpen ? 'site-nav--open' : ''}`}
          id="site-navigation"
          aria-label="Primary navigation"
        >
          <a href="#top" onClick={() => setMenuOpen(false)}>
            Overview
          </a>
          <a href="#festival-scale" onClick={() => setMenuOpen(false)}>
            Scale
          </a>
          <a href="#competitions" onClick={() => setMenuOpen(false)}>
            Competitions
          </a>
          <a href="#experience" onClick={() => setMenuOpen(false)}>
            Experience
          </a>
          <a href="#sponsors" onClick={() => setMenuOpen(false)}>
            Sponsors
          </a>
          <ActionLink
            href="#register-interest"
            className="site-nav__cta"
            onClick={() => setMenuOpen(false)}
          >
            Register interest
          </ActionLink>
        </nav>
      </div>
    </header>
  )
}
