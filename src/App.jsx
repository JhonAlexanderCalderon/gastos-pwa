import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import { Spinner } from './components/ui/Spinner'
import { AuthPage } from './pages/AuthPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { CoupleSetupPage } from './pages/CoupleSetupPage'
import { HomePage } from './pages/HomePage'
import { AddExpensePage } from './pages/AddExpensePage'
import { HistoryPage } from './pages/HistoryPage'
import { SummaryPage } from './pages/SummaryPage'
import { SettingsPage } from './pages/SettingsPage'

function AppRoutes() {
  const { firebaseUser, appUser, couple, loading } = useApp()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!firebaseUser) return <AuthPage />
  if (!appUser?.name) return <OnboardingPage />
  if (!appUser?.coupleId) return <CoupleSetupPage />

  return (
    <Routes>
      <Route path="/home"        element={<HomePage />} />
      <Route path="/add-expense" element={<AddExpensePage />} />
      <Route path="/history"     element={<HistoryPage />} />
      <Route path="/summary"     element={<SummaryPage />} />
      <Route path="/settings"    element={<SettingsPage />} />
      <Route path="*"            element={<Navigate to="/home" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  )
}
