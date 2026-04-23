import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext.jsx'
import AuthPage from './pages/AuthPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AnalyzePage from './pages/AnalyzePage.jsx'
import ReportPage from './pages/ReportPage.jsx'
import ContactsPage from './pages/ContactsPage.jsx'
import Layout from './components/Layout.jsx'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'var(--text2)' }}>Loading...</div>
  return user ? children : <Navigate to="/auth" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="analyze" element={<AnalyzePage />} />
        <Route path="report/:id" element={<ReportPage />} />
        <Route path="contacts" element={<ContactsPage />} />
      </Route>
    </Routes>
  )
}
