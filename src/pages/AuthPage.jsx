import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { Zap, Mail, Lock, User, Eye, EyeOff, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from 'framer-motion'
import InfiniteGrid from '../components/ui/infinite-grid-integration.tsx'

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
    <div style={{ minHeight:'100vh', display:'flex', background:'#020617', position: 'relative', overflow: 'hidden' }}>
      {/* Background Layer */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.3 }}>
        <InfiniteGrid />
      </div>
      {/* Left Side: Form */}
      <div style={{ flex: 1.2, display:'flex', alignItems:'center', justifyContent:'center', padding: '40px', position: 'relative', zIndex: 1 }}>
        <motion.div 
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
          style={{ width:'100%', maxWidth: 400 }}>
          
          <div style={{ marginBottom: 40 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 16 }}>
              {mode === 'login' ? 'Sign in to your account to continue' : 'Join the VibeScout intelligence network'}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap: 20 }}>
            {mode === 'signup' && (
              <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>Name</label>
                <div style={{ position:'relative' }}>
                  <User size={18} style={{ position:'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input 
                    value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="Enter your name" required
                    style={{ width: '100%', padding: '14px 16px 14px 48px', background: 'transparent', border: '1px solid #1e293b', borderRadius: 12, color: '#fff', fontSize: 15, outline: 'none' }} 
                  />
                </div>
              </div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>Email</label>
              <div style={{ position:'relative' }}>
                <Mail size={18} style={{ position:'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input 
                  type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                  placeholder="name@example.com" required
                  style={{ width: '100%', padding: '14px 16px 14px 48px', background: 'transparent', border: '1px solid #1e293b', borderRadius: 12, color: '#fff', fontSize: 15, outline: 'none' }} 
                />
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>Password</label>
              <div style={{ position:'relative' }}>
                <Lock size={18} style={{ position:'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input 
                  type={showPw ? 'text' : 'password'} value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                  placeholder="Enter your password" required
                  style={{ width: '100%', padding: '14px 48px', background: 'transparent', border: '1px solid #1e293b', borderRadius: 12, color: '#fff', fontSize: 15, outline: 'none' }} 
                />
                <button 
                  type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position:'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {mode === 'login' && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <label style={{ display:'flex', alignItems:'center', gap: 8, fontSize: 14, color: '#94a3b8', cursor: 'pointer' }}>
                  <input type="checkbox" style={{ accentColor: '#7c3aed' }} /> Remember me
                </label>
                <button type="button" style={{ background:'none', border:'none', color: '#7c3aed', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                  Forgot password?
                </button>
              </div>
            )}

            <motion.button 
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              type="submit" disabled={loading}
              style={{ width: '100%', padding: '16px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: 'pointer', marginTop: 12 }}>
              {loading ? 'Processing...' : mode === 'login' ? 'Sign in' : 'Sign up'}
            </motion.button>
          </form>

          <div style={{ margin: '32px 0', display:'flex', alignItems:'center', gap: 16 }}>
            <div style={{ flex:1, height:1, background: '#1e293b' }} />
            <span style={{ fontSize: 12, color: '#475569', fontWeight: 700, letterSpacing: '0.05em' }}>OR CONTINUE WITH</span>
            <div style={{ flex:1, height:1, background: '#1e293b' }} />
          </div>

          <motion.button 
            onClick={handleGoogle} whileHover={{ background: '#0f172a' }}
            style={{ width: '100%', padding: '14px', background: 'transparent', border: '1px solid #1e293b', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#fff" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#fff" d="M9 18c2.43 0 4.467-.806 5.956-2.184L12.048 13.56c-.413.277-.942.441-1.548.441-2.372 0-4.382-1.601-5.1-3.753H2.342v2.333C3.822 15.53 6.223 17.5 9 17.5z" opacity=".8"/><path fill="#fff" d="M3.9 10.248a4.847 4.847 0 0 1 0-3.096V4.819H2.342a8.992 8.992 0 0 0 0 8.362L3.9 10.248z" opacity=".8"/><path fill="#fff" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 6.223 0 3.822 1.97 2.342 4.819L5.1 7.152C5.818 4.999 7.828 3.58 9 3.58z" opacity=".8"/></svg>
            Continue with Google
          </motion.button>

          <p style={{ textAlign: 'center', marginTop: 32, color: '#94a3b8', fontSize: 15 }}>
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              style={{ background: 'none', border: 'none', color: '#7c3aed', fontWeight: 600, cursor: 'pointer', fontSize: 15 }}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </motion.div>
      </div>

      {/* Right Side: Visual */}
      <div style={{ flex: 1, background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #c084fc 100%)', position:'relative', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', zIndex: 1 }}>
        <div style={{ position:'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.1) 0%, transparent 50%)' }} />
        
        {/* Navigation Arrows (Visual only) */}
        <div style={{ position:'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: 10, background: 'rgba(0,0,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center', color: '#fff', cursor:'pointer' }}>
          <ChevronLeft size={24} />
        </div>
        <div style={{ position:'absolute', right: 24, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: 10, background: 'rgba(0,0,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center', color: '#fff', cursor:'pointer' }}>
          <ChevronRight size={24} />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ textAlign:'center', color:'#fff', maxWidth: 440, padding: 40 }}>
          <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 32px' }}>
            <ShieldCheck size={40} />
          </div>
          <h2 style={{ fontSize: 40, fontWeight: 800, marginBottom: 24 }}>Secure Authentication</h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
            Your data is protected with industry-standard encryption and security measures. Sign in with confidence.
          </p>
          
          {/* Slide dots */}
          <div style={{ display:'flex', gap: 8, justifyContent:'center', marginTop: 40 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: i===0?24:8, height: 8, borderRadius: 4, background: i===0?'#fff':'rgba(255,255,255,0.3)' }} />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
