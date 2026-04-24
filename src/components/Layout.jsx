import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { LayoutDashboard, Search, BookUser, LogOut, Zap, Menu, X, Plus, Bell, Moon, Sun } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

const SidebarContent = ({ user, handleLogout, location, navItems }) => (
  <div style={{ display:'flex', flexDirection:'column', height:'100%', padding: '24px 16px' }}>
    {/* Brand Logo */}
    <Link to="/" style={{ textDecoration:'none', color:'inherit', marginBottom: 40, paddingLeft: 8 }}>
      <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: 'var(--accent)',
          display:'flex', alignItems:'center', justifyContent:'center'
        }}>
          <Zap size={18} color="#fff" fill="#fff" />
        </div>
        <span style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:20, letterSpacing:'-0.03em' }}>VibeScout</span>
      </div>
    </Link>

    {/* Main Nav */}
    <nav style={{ display:'flex', flexDirection:'column', gap: 4, flex: 1 }}>
      {navItems.map(({ to, icon: Icon, label }) => {
        const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
        return (
          <NavLink key={to} to={to} className={`sidebar-item ${isActive ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        )
      })}

    </nav>

    {/* User Footer */}
    <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid var(--border)' }}>
      <div style={{ display:'flex', alignItems:'center', gap: 12, padding: '0 8px' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, overflow:'hidden', background:'var(--accent-light)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {user?.photoURL ? <img src={user.photoURL} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} /> : (user?.email?.[0] || 'U').toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.displayName || user?.email?.split('@')[0]}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pro Plan</div>
        </div>
        <button onClick={handleLogout} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}>
          <LogOut size={16} />
        </button>
      </div>
    </div>
  </div>
)

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1024)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    if (isDark) document.body.classList.add('dark')
    else document.body.classList.remove('dark')
  }, [isDark])

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/auth')
  }

  const navItems = [
    { to: '/',         icon: LayoutDashboard, label: 'Home' },
    { to: '/analyze',  icon: Zap,             label: 'Vibe AI'   },
    { to: '/contacts', icon: BookUser,        label: 'My Contacts'  },
  ]

  const commonProps = { user, handleLogout, location, navItems }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      
      {/* Desktop Sidebar */}
      {isDesktop && (
        <aside style={{ 
          width: 260, height: '100vh', position: 'fixed', left: 0, top: 0, 
          background: 'var(--surface)', borderRight: '1px solid var(--border)',
          zIndex: 100
        }}>
          <SidebarContent {...commonProps} />
        </aside>
      )}

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex: 1000 }}
            />
            <motion.aside 
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              style={{ width: 260, height: '100vh', position: 'fixed', left: 0, top: 0, background: 'var(--surface)', zIndex: 1001 }}
            >
              <SidebarContent {...commonProps} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div style={{ 
        flex: 1, 
        marginLeft: isDesktop ? 260 : 0,
        display: 'flex', flexDirection: 'column',
        width: isDesktop ? 'calc(100% - 260px)' : '100%'
      }}>
        
        {/* Top Header */}
        <header style={{ 
          height: 72, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--surface)', borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, zIndex: 90
        }}>
          <div style={{ display:'flex', alignItems:'center', gap: 16 }}>
            {!isDesktop && (
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                style={{ background:'none', border:'none', cursor:'pointer' }}>
                <Menu size={24} />
              </button>
            )}
            <div style={{ display:'flex', flexDirection:'column' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>Mon, July 7</span>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>Hello, {user?.displayName?.split(' ')[0] || 'Explorer'}</h2>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
            <button onClick={() => setIsDark(!isDark)} className="glass" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor: 'pointer' }}>
              {isDark ? <Sun size={18} color="var(--text-muted)" /> : <Moon size={18} color="var(--text-muted)" />}
            </button>
            <button className="glass" style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Bell size={18} color="var(--text-muted)" />
            </button>
            <button className="btn-primary" style={{ padding: '8px 16px', fontSize: 13, borderRadius: 10 }}>
              <Plus size={16} />
              <span style={{ display: isDesktop ? 'inline' : 'none' }}>Create Scan</span>
            </button>
          </div>
        </header>

        <main style={{ padding: '24px', flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
