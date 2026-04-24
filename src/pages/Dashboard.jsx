import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { subscribeToReports, deleteReport } from '../services/firestore.js'
import { analyzeBusinessVibe } from '../services/vibeAnalysis.js'
import { Search, Trash2, Coffee, Dumbbell, Scissors, Utensils, ShoppingBag, Building2, Calendar, Star, TrendingUp, Zap, Upload, X, Globe, Image as ImageIcon, ChevronRight, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const TYPE_ICON = { cafe: Coffee, gym: Dumbbell, salon: Scissors, restaurant: Utensils, retail: ShoppingBag }
const TYPE_COLOR = { cafe:'#94A3B8', gym:'#94A3B8', salon:'#94A3B8', restaurant:'#94A3B8', retail:'#94A3B8', other:'#64748B' }

const VIBE_GRADIENT = {
  'Cozy & Warm':       'linear-gradient(135deg, rgba(245, 158, 11, 0.2), transparent)',
  'Industrial Chic':   'linear-gradient(135deg, rgba(148, 163, 184, 0.2), transparent)',
  'Minimalist Modern': 'linear-gradient(135deg, rgba(248, 250, 252, 0.1), transparent)',
  'Boho Eclectic':     'linear-gradient(135deg, rgba(217, 119, 6, 0.2), transparent)',
  'Luxury Premium':    'linear-gradient(135deg, rgba(255, 255, 255, 0.15), transparent)',
  'Rustic Artisan':    'linear-gradient(135deg, rgba(180, 83, 9, 0.2), transparent)',
  'Energetic Bold':    'linear-gradient(135deg, rgba(59, 130, 246, 0.2), transparent)',
  'Calm Wellness':     'linear-gradient(135deg, rgba(34, 197, 94, 0.2), transparent)',
  'Playful Fun':       'linear-gradient(135deg, rgba(236, 72, 153, 0.2), transparent)',
  'Dark & Moody':      'linear-gradient(135deg, rgba(15, 23, 42, 0.5), transparent)',
}

const SCAN_MESSAGES = [
  'Fetching Maps presence...',
  'Analyzing entity photos & vibe...',
  'Scanning social footprint...',
  'Extracting brand identity...',
  'Identifying OLED palette...',
  'Building enterprise recommendations...',
  'Composing final intelligence report...',
]

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef()
  
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [filter, setFilter] = useState('all')

  // Scanner State
  const [query, setQuery] = useState('')
  const [imgFile, setImgFile] = useState(null)
  const [imgPreview, setImgPreview] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanMsg, setScanMsg] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    const unsub = subscribeToReports(user.uid, (data) => {
      setReports(data); setLoading(false)
    })
    return unsub
  }, [user])

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Delete this report?')) return
    setDeleting(id)
    await deleteReport(id)
    setDeleting(null)
  }

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setImgFile(f)
    const reader = new FileReader()
    reader.onload = ev => setImgPreview(ev.target.result)
    reader.readAsDataURL(f)
  }

  const runAnalysis = async () => {
    if (!query.trim() && !imgFile) {
      setError('Please provide a business name or screenshot'); return
    }
    setError(''); setScanning(true)

    let msgIdx = 0
    const msgTimer = setInterval(() => {
      msgIdx = (msgIdx + 1) % SCAN_MESSAGES.length
      setScanMsg(msgIdx)
    }, 2000)

    try {
      let base64 = null
      if (imgFile) {
        base64 = await new Promise((res, rej) => {
          const r = new FileReader()
          r.onload = () => res(r.result.split(',')[1])
          r.onerror = rej
          r.readAsDataURL(imgFile)
        })
      }

      const report = await analyzeBusinessVibe({
        url: query.includes('http') ? query : null,
        screenshotBase64: base64,
        businessName: query.includes('http') ? null : query
      })

      if (!report || Object.keys(report).length < 3) {
        throw new Error('AI returned incomplete data. Please try again.')
      }

      clearInterval(msgTimer)
      setScanning(false)
      navigate('/report/preview', { state: { report: { ...report, sourceUrl: query, hasScreenshot: !!base64 } } })
    } catch(e) {
      clearInterval(msgTimer)
      setError('Scan failed: ' + e.message)
      setScanning(false)
    }
  }

  const filteredReports = filter === 'all' ? reports : reports.filter(r => r.businessType === filter)
  const types = ['all', ...Array.from(new Set(reports.map(r => r.businessType).filter(Boolean)))]
  const firstName = user?.displayName?.split(' ')[0] || 'Enterprise'

  if (scanning) return <ScanningScreen message={SCAN_MESSAGES[scanMsg]} />

  return (
    <div className="page-container" style={{ padding:'0 32px 64px', maxWidth:1200, margin:'0 auto' }}>
      
      {/* Hero Section with Scanner */}
      <section style={{ padding: '64px 0 80px', position:'relative' }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap: 24, marginBottom: 48 }}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            style={{ padding: '8px 16px', background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.2)', borderRadius: 100, color: 'var(--accent)', fontSize: 13, fontWeight: 700, letterSpacing: '0.05em' }}>
            AI-POWERED BUSINESS INTELLIGENCE
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ fontSize: 64, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1, maxWidth: 800 }}>
            Uncover the <span style={{ color: 'var(--accent)' }}>Vibe</span> of any business.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ fontSize: 20, color: 'var(--text2)', maxWidth: 600 }}>
            Analyze digital presence, visual identity, and brand personality in seconds with advanced AI telemetry.
          </motion.p>
        </div>

        {/* Floating Scanner Tab */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass" style={{ maxWidth: 800, margin: '0 auto', padding: 12, borderRadius: 24, boxShadow: '0 32px 64px rgba(0,0,0,0.4)', display: 'flex', gap: 12, alignItems: 'center' }}>
          
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={20} style={{ position: 'absolute', left: 20, color: 'var(--text3)' }} />
            <input 
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Business name or Google Maps URL..."
              style={{ width: '100%', padding: '18px 24px 18px 56px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, color: '#fff', fontSize: 16, outline: 'none' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
            <motion.button 
              whileHover={{ background: 'rgba(255,255,255,0.05)' }} onClick={() => fileRef.current.click()}
              style={{ padding: 14, background: imgPreview ? 'var(--accent)' : 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, color: imgPreview ? '#fff' : 'var(--text2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              {imgPreview ? <Zap size={20} fill="#fff" /> : <ImageIcon size={20} />}
              {imgPreview && <span style={{ fontSize: 13, fontWeight: 700 }}>Photo Attached</span>}
            </motion.button>
            {imgPreview && (
              <button 
                onClick={(e) => { e.stopPropagation(); setImgPreview(null); setImgFile(null); }}
                style={{ position:'absolute', top:-8, right:-8, background:'#ef4444', color:'#fff', border:'none', borderRadius:'50%', width:20, height:20, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:10 }}>
                <X size={12} />
              </button>
            )}
          </div>

          <motion.button 
            onClick={runAnalysis}
            whileHover={{ scale: 1.02, background: 'var(--accent)' }} whileTap={{ scale: 0.98 }}
            style={{ padding: '18px 32px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 16, fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
            Scan Sequence <ArrowRight size={20} />
          </motion.button>
        </motion.div>
        
        {error && <p style={{ textAlign: 'center', color: 'var(--red)', marginTop: 16, fontSize: 14, fontWeight: 500 }}>{error}</p>}
      </section>

      {/* Reports Section */}
      <div style={{ marginTop: 40 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 32 }}>
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>Recent Intelligence</h2>
          <div style={{ display:'flex', gap: 8 }}>
            {types.map(t => (
              <button key={t} onClick={() => setFilter(t)} style={{ padding: '6px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600, background: filter===t ? 'var(--accent)' : 'var(--bg2)', border: '1px solid var(--border)', color: filter===t ? '#fff' : 'var(--text2)', cursor: 'pointer', textTransform: 'capitalize' }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(350px,1fr))', gap:24 }}>
            {[1,2,3].map(i=>(
              <div key={i} style={{ height:200, background:'var(--bg2)', borderRadius:20, border:'1px solid var(--border)', animation:'pulse 2s infinite' }} />
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign:'center', background:'var(--bg2)', borderRadius:24, border: '1px dashed var(--border)' }}>
             <p style={{ color:'var(--text3)' }}>No reports found. Start your first scan above.</p>
          </div>
        ) : (
          <motion.div layout style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(350px,1fr))', gap:24 }}>
            {filteredReports.map(r => (
              <ReportCard key={r.id} report={r} onOpen={() => navigate(`/report/${r.id}`)} onDelete={(e) => handleDelete(e, r.id)} deleting={deleting === r.id} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

function ReportCard({ report, onOpen, onDelete, deleting }) {
  const Icon = TYPE_ICON[report.businessType] || Building2
  const color = TYPE_COLOR[report.businessType] || '#94a3b8'
  const gradient = VIBE_GRADIENT[report.primaryVibe] || 'linear-gradient(135deg, rgba(255,255,255,0.05), transparent)'

  return (
    <motion.div 
      layout whileHover={{ y: -5, borderColor: 'var(--accent)' }}
      onClick={onOpen}
      style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:24, padding: 24, cursor: 'pointer', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column', gap: 16 }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 100, background: gradient, opacity: 0.5 }} />
      
      <div style={{ position:'relative', zIndex: 1, display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div style={{ display:'flex', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--bg3)', border: '1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon size={24} color={color} />
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{report.businessName}</h3>
            <p style={{ fontSize: 13, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{report.businessType} · {report.location}</p>
          </div>
        </div>
        <button onClick={e => { e.stopPropagation(); onDelete(e); }} style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer' }}>
          <Trash2 size={18} />
        </button>
      </div>

      <div style={{ position:'relative', zIndex: 1, display:'flex', alignItems:'center', gap: 12 }}>
        <span style={{ padding: '4px 12px', background: 'var(--bg3)', borderRadius: 100, fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>{report.primaryVibe}</span>
        <div style={{ flex: 1 }} />
        <div style={{ display:'flex', alignItems:'center', gap: 4, color: 'var(--green)', fontSize: 14, fontWeight: 700 }}>
          <Star size={16} fill="var(--green)" /> {report.vibeScore}/10
        </div>
      </div>
    </motion.div>
  )
}

function ScanningScreen({ message }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'80vh', gap:40 }}>
      <div style={{ position:'relative', width:120, height:120 }}>
        <motion.div animate={{ scale: [1, 1.1, 1], boxShadow: ['0 0 20px rgba(124,58,237,0.2)', '0 0 60px rgba(124,58,237,0.5)', '0 0 20px rgba(124,58,237,0.2)'] }} transition={{ duration: 2, repeat: Infinity }} style={{ width:120, height:120, borderRadius:'50%', background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Zap size={48} color="#fff" fill="#fff" />
        </motion.div>
      </div>
      <div style={{ textAlign:'center' }}>
        <h2 style={{ fontSize:32, fontWeight:800, marginBottom:12 }}>Analyzing Data Streams</h2>
        <motion.p key={message} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ color:'var(--accent)', fontSize:18, fontWeight:600 }}>{message}</motion.p>
      </div>
    </motion.div>
  )
}
