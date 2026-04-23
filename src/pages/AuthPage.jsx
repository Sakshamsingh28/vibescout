import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { Zap, Mail, Lock, User, Globe2, Eye, EyeOff } from "lucide-react"
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
    <div style={{
      minHeight:'100vh', background:'var(--bg)', display:'flex',
      alignItems:'center', justifyContent:'center', padding:24,
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Abstract Background Elements */}
      <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, background: 'radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -100, right: -100, width: 400, height: 400, background: 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
        style={{
          width:'100%', maxWidth:440,
          background:'var(--bg2)', border:'1px solid var(--border)',
          borderRadius:24, padding:'48px 40px',
          boxShadow:'0 24px 80px rgba(0,0,0,0.6)',
          position: 'relative', zIndex: 1
      }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            style={{
              width:64, height:64, borderRadius:16,
              background:'var(--accent)',
              display:'flex', alignItems:'center', justifyContent:'center',
              margin:'0 auto 20px', boxShadow:'0 0 32px rgba(34,197,94,0.2)'
            }}>
            <Zap size={32} color="#020617" fill="#020617" />
          </motion.div>
          <h1 style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:32, letterSpacing:'-0.03em', marginBottom:8, color: 'var(--text)' }}>
            VibeScout
          </h1>
          <p style={{ color:'var(--text2)', fontSize:15 }}>
            {mode==='login' ? 'Authenticate to access network' : 'Initialize new enterprise account'}
          </p>
        </div>

        {/* Google */}
        <motion.button 
          whileHover={{ scale: 1.02, backgroundColor: 'var(--bg)' }} whileTap={{ scale: 0.98 }}
          onClick={handleGoogle} disabled={loading} style={{
            width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:12,
            padding:'14px 16px', borderRadius:14, fontSize:15, fontWeight:600,
            background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)',
            marginBottom:24, cursor:'pointer', transition: 'background 0.2s'
        }}>
          <Globe2 size={18} />
          Authenticate via Google
        </motion.button>

        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24 }}>
          <div style={{ flex:1, height:1, background:'var(--border)' }} />
          <span style={{ fontSize:12, color:'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>or secure line</span>
          <div style={{ flex:1, height:1, background:'var(--border)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <AnimatePresence mode="popLayout">
            {mode==='signup' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <InputField icon={<User size={16}/>} placeholder="Full Designation"
                  value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} />
              </motion.div>
            )}
          </AnimatePresence>
          <InputField icon={<Mail size={16}/>} type="email" placeholder="Communication Address"
            value={form.email} onChange={v=>setForm(f=>({...f,email:v}))} />
          <div style={{ position:'relative' }}>
            <InputField icon={<Lock size={16}/>} type={showPw?'text':'password'} placeholder="Security Key"
              value={form.password} onChange={v=>setForm(f=>({...f,password:v}))} />
            <motion.button 
              whileHover={{ color: 'var(--text)' }}
              type="button" onClick={()=>setShowPw(s=>!s)} style={{
                position:'absolute', right:16, top:'50%', transform:'translateY(-50%)',
                background:'var(--bg)', border:'1px solid var(--border)', borderRadius: 8, color:'var(--text3)', padding:6,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
            </motion.button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ padding:'12px 16px', background:'rgba(239,68,68,0.1)',
                border:'1px solid rgba(239,68,68,0.2)', borderRadius:10, fontSize:14, color:'var(--red)', fontWeight: 500 }}>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button 
            whileHover={{ scale: 1.02, boxShadow: '0 0 24px rgba(34,197,94,0.3)' }} whileTap={{ scale: 0.98 }}
            type="submit" disabled={loading} style={{
              width:'100%', padding:'16px', borderRadius:14, fontSize:15, fontWeight:600,
              background:'var(--accent)', border:'none', color:'#020617',
              marginTop:8, opacity: loading ? 0.7 : 1, cursor: 'pointer'
          }}>
            {loading ? 'Processing…' : mode==='login' ? 'Establish Connection' : 'Register Identity'}
          </motion.button>
        </form>

        <p style={{ textAlign:'center', marginTop:24, fontSize:14, color:'var(--text3)', fontWeight: 500 }}>
          {mode==='login' ? "Unregistered entity? " : "Existing profile? "}
          <motion.button 
            whileHover={{ color: 'var(--accent)' }}
            onClick={()=>{setMode(m=>m==='login'?'signup':'login');setError('')}}
            style={{ background:'none',border:'none',color:'var(--text)',fontWeight:600,cursor:'pointer',fontSize:14, transition: 'color 0.2s', textDecoration: 'underline', textUnderlineOffset: 4 }}>
            {mode==='login' ? 'Initialize' : 'Authenticate'}
          </motion.button>
        </p>
      </motion.div>
    </div>
  )
}

function InputField({ icon, type='text', placeholder, value, onChange }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
      <span style={{ position:'absolute', left:16, color: focused ? 'var(--accent)' : 'var(--text3)', display:'flex', alignItems:'center', transition: 'color 0.2s' }}>
        {icon}
      </span>
      <input type={type} placeholder={placeholder} value={value}
        onChange={e=>onChange(e.target.value)} required
        style={{
          width:'100%', padding:'16px 16px 16px 44px',
          background:'var(--bg)', border:'1px solid var(--border)',
          borderRadius:12, fontSize:15, color:'var(--text)', outline:'none',
          transition:'border 0.2s, box-shadow 0.2s',
          borderColor: focused ? 'var(--accent)' : 'var(--border)',
          boxShadow: focused ? '0 0 0 2px rgba(34,197,94,0.1)' : 'none'
        }}
        onFocus={()=>setFocused(true)}
        onBlur={()=>setFocused(false)}
      />
    </div>
  )
}
