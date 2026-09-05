import { SiteHeader } from './components/site/SiteHeader'
import { ScrollProgress } from './components/site/ScrollProgress'
import { SiteFooter } from './components/site/SiteFooter'
import { useScrollReveal } from './hooks/useScrollReveal'
import { CompetitionLandscape } from './sections/CompetitionLandscape'
import { FAQ } from './sections/FAQ'
import { FestivalScale } from './sections/FestivalScale'
import { FestivalExperience } from './sections/FestivalExperience'
import { FlagshipEvent } from './sections/FlagshipEvent'
import { Hero } from './sections/Hero'
import { Participation } from './sections/Participation'
import { RegisterInterest } from './sections/RegisterInterest'
import { Sponsors } from './sections/Sponsors'

export function App() {
  useScrollReveal()

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <ScrollProgress />
      <SiteHeader />
      <main id="main-content">
        <Hero />
        <FestivalScale />
        <FlagshipEvent />
        <CompetitionLandscape />
        <FestivalExperience />
        <Participation />
        <Sponsors />
        <FAQ />
        <RegisterInterest />
      </main>
      <SiteFooter />
    </>
  )
}
