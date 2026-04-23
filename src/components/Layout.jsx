import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { LayoutDashboard, Search, BookUser, LogOut, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/auth')
  }

  const navItems = [
    { to: '/',         icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/analyze',  icon: Search,          label: 'Analyze'   },
    { to: '/contacts', icon: BookUser,        label: 'Contacts'  },
  ]

  return (
    <div className="app-layout" style={{ display:'flex', minHeight:'100vh', background:'var(--bg)' }}>
      {/* Sidebar */}
      <aside className="app-sidebar" style={{
        width: 260, background: 'var(--bg2)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: '32px 0',
        position: 'fixed', height: '100vh', zIndex: 100
      }}>
        {/* Logo */}
        <div style={{ padding: '0 24px 32px' }}>
          <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'var(--accent)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow: 'var(--glow)'
            }}>
              <Zap size={20} color="#020617" fill="#020617" />
            </div>
            <div>
              <div style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:18, letterSpacing:'-0.02em', color: 'var(--text)' }}>VibeScout</div>
              <div style={{ fontSize:11, color:'var(--text3)', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight: 600 }}>Intelligence</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'16px 16px', display:'flex', flexDirection:'column', gap:8 }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to==='/'} style={{ textDecoration: 'none' }}>
              {({ isActive }) => (
                <motion.div
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500,
                    color: isActive ? 'var(--text)' : 'var(--text2)',
                    background: isActive ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                    border: isActive ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'color 0.2s ease, border 0.2s ease, background 0.2s ease'
                  }}
                >
                  <Icon size={18} color={isActive ? 'var(--accent)' : 'var(--text2)'} />
                  {label}
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="user-section" style={{ padding:'24px 16px 0', borderTop:'1px solid var(--border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, padding: '0 8px' }}>
            <div style={{
              width:36, height:36, borderRadius:'50%', overflow:'hidden',
              background:'var(--bg3)', border: '1px solid var(--border)',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:14, fontWeight:600, color:'var(--text)', flexShrink:0
            }}>
              {user?.photoURL
                ? <img src={user.photoURL} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                : (user?.displayName?.[0] || user?.email?.[0] || 'U').toUpperCase()
              }
            </div>
            <div style={{ overflow:'hidden' }}>
              <div style={{ fontSize:14, fontWeight:500, color: 'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {user?.displayName || 'Enterprise User'}
              </div>
              <div style={{ fontSize:12, color:'var(--text3)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {user?.email}
              </div>
            </div>
          </div>
          <motion.button 
            onClick={handleLogout}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--red)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            whileTap={{ scale: 0.98 }}
            style={{
              display:'flex', alignItems:'center', gap:8, width:'100%',
              padding:'10px 16px', borderRadius:10, fontSize:13, fontWeight: 500, color:'var(--text2)',
              background:'transparent', border:'1px solid var(--border)', cursor:'pointer',
            }}
          >
            <LogOut size={16} />Sign out
          </motion.button>
        </div>
      </aside>

      {/* Main */}
      <main className="app-main" style={{ marginLeft:260, flex:1, minHeight:'100vh', background:'var(--bg)' }}>
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ height: '100%' }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  )
}
