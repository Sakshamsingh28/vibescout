import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { Zap, Mail, Lock, User, Eye, EyeOff, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from 'framer-motion'

export default function AuthPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // login | signup
  const [form, setForm] = useState({ name:'', email:'', password:'' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogle = async () => {
    setLoading(true); setError('')
    try { await signInWithGoogle(); navigate('/') }
    catch(e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      if (mode === 'login') await signInWithEmail(form.email, form.password)
      else await signUpWithEmail(form.email, form.password, form.name)
      navigate('/')
    } catch(e) {
      setError(e.message.replace('Firebase: ','').replace(/\(auth.*\)/,''))
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'var(--bg)' }}>
      {/* Left Side: Form */}
      <div style={{ flex: 1.2, display:'flex', alignItems:'center', justifyContent:'center', padding: '40px' }}>
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          style={{ width:'100%', maxWidth: 400 }}>
          
          <div style={{ marginBottom: 40 }}>
            <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 24 }}>
               <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Zap size={18} color="#fff" fill="#fff" />
              </div>
              <span style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:20, color:'var(--text)' }}>VibeScout</span>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>
              {mode === 'login' ? 'Sign in to your account to continue' : 'Join the VibeScout intelligence network'}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap: 20 }}>
            {mode === 'signup' && (
              <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Name</label>
                <div style={{ position:'relative' }}>
                  <User size={18} style={{ position:'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="Enter your name" required
                    style={{ width: '100%', padding: '14px 16px 14px 48px', background: '#fff', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', fontSize: 15, outline: 'none' }} 
                  />
                </div>
              </div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Email</label>
              <div style={{ position:'relative' }}>
                <Mail size={18} style={{ position:'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  placeholder="name@example.com" required
                  style={{ width: '100%', padding: '14px 16px 14px 48px', background: '#fff', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', fontSize: 15, outline: 'none' }} 
                />
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Password</label>
              <div style={{ position:'relative' }}>
                <Lock size={18} style={{ position:'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                  placeholder="Enter your password" required
                  style={{ width: '100%', padding: '14px 16px 14px 48px', background: '#fff', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', fontSize: 15, outline: 'none' }} 
                />
                <button 
                  type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position:'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <p style={{ color: '#ef4444', fontSize: 13, fontWeight: 500 }}>{error}</p>}

            <motion.button 
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              type="submit" disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '16px', justifyContent:'center', marginTop: 12 }}>
              {loading ? 'Processing...' : mode === 'login' ? 'Sign in' : 'Sign up'}
            </motion.button>
          </form>

          <div style={{ margin: '32px 0', display:'flex', alignItems:'center', gap: 16 }}>
            <div style={{ flex:1, height:1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>OR</span>
            <div style={{ flex:1, height:1, background: 'var(--border)' }} />
          </div>

          <motion.button 
            onClick={handleGoogle} whileHover={{ background: 'var(--surface-hover)' }}
            style={{ width: '100%', padding: '14px', background: '#fff', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184L12.048 13.56c-.413.277-.942.441-1.548.441-2.372 0-4.382-1.601-5.1-3.753H2.342v2.333C3.822 15.53 6.223 17.5 9 17.5z"/><path fill="#FBBC05" d="M3.9 10.248a4.847 4.847 0 0 1 0-3.096V4.819H2.342a8.992 8.992 0 0 0 0 8.362L3.9 10.248z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 6.223 0 3.822 1.97 2.342 4.819L5.1 7.152C5.818 4.999 7.828 3.58 9 3.58z"/></svg>
            Continue with Google
          </motion.button>

          <p style={{ textAlign: 'center', marginTop: 32, color: 'var(--text-muted)', fontSize: 15 }}>
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', fontSize: 15 }}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </motion.div>
      </div>

      {/* Right Side: Visual */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, #7C3AED 0%, #0EA5E9 100%)', position:'relative', display: window.innerWidth > 1024 ? 'flex' : 'none', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
        <div style={{ position:'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)' }} />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign:'center', color:'#fff', maxWidth: 440, padding: 40 }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 32px' }}>
            <ShieldCheck size={40} />
          </div>
          <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 24, letterSpacing: '-0.04em' }}>Business Intelligence for Professionals</h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.9)', lineHeight: 1.6 }}>
            Access advanced vibe telemetry and market positioning reports in a clean, modern workspace.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
