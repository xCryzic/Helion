export type EventFormat = {
  id: string
  name: string
  shortName: string
  category: string
  activity: string
  duration: string | null
  description: string | null
  detailsStatus: 'confirmed' | 'coming-soon'
}

export const eventFormats: readonly EventFormat[] = [
  { id: 'hackathon', name: 'Hackathon', shortName: 'Hackathon', category: 'Flagship build competition', activity: 'Build and develop a technology project.', duration: '2–3 days', description: null, detailsStatus: 'coming-soon' },
  { id: 'robo-battle', name: 'Robo Battle', shortName: 'Robo Battle', category: 'Engineering + robotics', activity: 'Engineer and test a robot in competition.', duration: null, description: null, detailsStatus: 'coming-soon' },
  { id: 'minecraft', name: 'Minecraft Gaming Competition', shortName: 'Minecraft Gaming Competition', category: 'Gaming competition', activity: 'Compete in Minecraft.', duration: null, description: null, detailsStatus: 'coming-soon' },
  { id: 'ctf', name: 'CTF', shortName: 'CTF', category: 'Cybersecurity competition', activity: 'Solve cybersecurity challenges.', duration: null, description: null, detailsStatus: 'coming-soon' },
  { id: 'game-development', name: 'Game Development Competition', shortName: 'Game Development Competition', category: 'Game creation competition', activity: 'Build and prototype a playable experience.', duration: null, description: null, detailsStatus: 'coming-soon' },
  { id: 'uiux-branding', name: 'UI/UX + Branding Competition', shortName: 'UI/UX + Branding Competition', category: 'Design competition', activity: 'Design an interface and visual identity.', duration: null, description: null, detailsStatus: 'coming-soon' },
] as const

export const eventIds = new Set(eventFormats.map((event) => event.id))
export const flagshipEvent = eventFormats[0]
export const supportingEvents = eventFormats.slice(1)

export const festivalExperiences = [
  { id: 'workshops', name: 'Workshops' },
  { id: 'stalls', name: 'Stalls' },
  { id: 'exhibitions', name: 'Exhibitions' },
] as const
