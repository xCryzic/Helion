import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { AdminApp } from './admin/AdminApp'
import './styles/global.css'
import './styles/content.css'
import './styles/form.css'
import './styles/admin.css'

declare global {
  interface Window {
    admin: () => void
  }
}

window.admin = () => window.location.assign('/admin')
const Root = window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/') ? AdminApp : App

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
