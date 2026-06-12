import { useEffect, useRef, useState } from 'react'
import { useStore } from './store/useStore'
import LoadSimulatorModal, { type ModalActivityUpdate } from './components/LoadSimulatorModal'
import SimulatorRegister from './components/SimulatorRegister'
import {
  registerSimulatorSession,
  updateSimulatorActivity,
  unregisterSimulatorSession,
} from './lib/simulatorSession'

export default function SimulatorApp() {
  const darkMode = useStore(s => s.darkMode)
  const isFirstRender = useRef(true)
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    const html = document.documentElement
    if (isFirstRender.current) {
      isFirstRender.current = false
      html.classList.toggle('light', !darkMode)
      return
    }
    html.classList.add('switching-theme')
    html.classList.toggle('light', !darkMode)
    const t = setTimeout(() => html.classList.remove('switching-theme'), 280)
    return () => clearTimeout(t)
  }, [darkMode])

  useEffect(() => {
    return () => { unregisterSimulatorSession() }
  }, [])

  function handleRegister(name: string) {
    setUserName(name)
    registerSimulatorSession(name)
  }

  function handleActivityChange(data: ModalActivityUpdate) {
    updateSimulatorActivity(data)
  }

  if (!userName) {
    return <SimulatorRegister onRegister={handleRegister} />
  }

  return (
    <LoadSimulatorModal
      onClose={() => {}}
      standalone
      userName={userName ?? undefined}
      onActivityChange={handleActivityChange}
      onBack={() => setUserName(null)}
    />
  )
}
