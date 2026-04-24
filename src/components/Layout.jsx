import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { LayoutDashboard, Search, BookUser, LogOut, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/auth')
  }

  const navItems = [
    { to: '/',         icon: LayoutDashboard, label: 'Overview' },
    { to: '/analyze',  icon: Search,          label: 'Analyze'   },
    { to: '/contacts', icon: BookUser,        label: 'Contacts'  },
  ]

  return (
    <div className="app-layout" style={{ minHeight:'100vh', background:'var(--bg)', color:'var(--text)', display:'flex', flexDirection:'column' }}>
      
      {/* Top Header */}
      <header style={{ 
        height: 72, padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)', position: 'fixed', top: 0, width: '100%', zIndex: 100, background: 'rgba(3, 7, 18, 0.8)', backdropFilter: 'blur(12px)'
      }}>
        <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: 'var(--accent)',
            display:'flex', alignItems:'center', justifyContent:'center', boxShadow: '0 0 20px var(--accent-glow)'
          }}>
            <Zap size={20} color="#fff" fill="#fff" />
          </div>
          <span style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:20, letterSpacing:'-0.02em' }}>VibeScout</span>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap: 16 }}>
          <div style={{ display:'flex', alignItems:'center', gap: 10, padding: '4px 12px 4px 6px', background: 'var(--bg2)', borderRadius: 100, border: '1px solid var(--border)' }}>
             <div style={{
              width:28, height:28, borderRadius:'50%', overflow:'hidden', background:'var(--bg3)', display:'flex',alignItems:'center',justifyContent:'center', fontSize:11, fontWeight:700
            }}>
              {user?.photoURL ? <img src={user.photoURL} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} /> : (user?.email?.[0] || 'U').toUpperCase()}
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>{user?.displayName || user?.email?.split('@')[0]}</span>
          </div>
          <button 
            onClick={handleLogout}
            style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 8 }}>
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, paddingTop: 72, paddingBottom: 100 }}>
        <Outlet />
      </main>

      {/* Bottom Floating Navigation (Image 2 style) */}
      <div style={{ 
        position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', 
        zIndex: 1000, pointerEvents: 'none'
      }}>
        <motion.nav 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          style={{ 
            pointerEvents: 'auto', background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(20px)',
            border: '1px solid var(--border2)', borderRadius: 20, padding: 8, display: 'flex', gap: 4,
            boxShadow: '0 12px 48px rgba(0,0,0,0.5)'
          }}>
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
            
            return (
              <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
                <motion.div
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 20px', borderRadius: 14, fontSize: 14, fontWeight: 600,
                    color: isActive ? '#fff' : 'var(--text3)',
                    background: isActive ? '#000' : 'transparent',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer'
                  }}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{label}</span>
                </motion.div>
              </NavLink>
            )
          })}
        </motion.nav>
      </div>
    </div>
  )
}
