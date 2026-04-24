import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Image as ImageIcon, X, Trash2, ArrowUpRight, Zap, History, Star, Clock } from 'lucide-react'
import { analyzeBusinessVibe } from '../services/vibeAnalysis.js'
import { subscribeToReports, deleteReport } from '../services/firestore.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'

const SCAN_MESSAGES = [
  "Initializing neural engines...",
  "Capturing digital presence...",
  "Analyzing visual DNA...",
  "Synthesizing brand persona...",
  "Generating vibe report..."
]

const ScanningScreen = ({ message }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap: 24 }}>
    <motion.div
      animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      style={{ width: 64, height: 64, borderRadius: '50%', border: '4px solid var(--accent-light)', borderTopColor: 'var(--accent)' }}
    />
    <motion.p 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ fontSize: 18, fontWeight: 600, color: 'var(--accent)' }}>{message}</motion.p>
  </div>
)

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scanMsg, setScanMsg] = useState(0)
  const [reports, setReports] = useState([])
  const [imgFile, setImgFile] = useState(null)
  const [imgPreview, setImgPreview] = useState(null)
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    if (user) {
      const unsub = subscribeToReports(user.uid, (data) => {
        setReports(data.sort((a,b) => b.timestamp - a.timestamp))
      })
      return () => unsub()
    }
  }, [user])

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
      setError('Provide business name or screenshot'); return
    }
    setError(''); setScanning(true)
    let msgIdx = 0
    const msgTimer = setInterval(() => {
      msgIdx = (msgIdx + 1) % SCAN_MESSAGES.length
      setScanMsg(msgIdx)
    }, 1500)

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
        mimeType: imgFile?.type || 'image/png',
        businessName: query.includes('http') ? null : query
      })

      if (!report || Object.keys(report).length < 3) throw new Error('AI returned incomplete data.')
      navigate(`/report/${report.id}`, { state: { report } })
    } catch (e) {
      setError(e.message)
      setScanning(false)
    } finally {
      clearInterval(msgTimer)
    }
  }

  if (scanning) return <ScanningScreen message={SCAN_MESSAGES[scanMsg]} />

  return (
    <div className="fade-in">
      {/* Hero Control Bar */}
      <div style={{ display:'flex', gap: 16, marginBottom: 32, alignItems:'center', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 28, flex: 1, minWidth: 200 }}>Vibe Intelligence</h1>
        <div style={{ display:'flex', gap: 12 }}>
          {['all', 'restaurant', 'cafe', 'salon', 'gym'].map(t => (
            <button 
              key={t} onClick={() => setFilter(t)}
              style={{ 
                padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border)', background: filter === t ? 'var(--accent)' : 'var(--surface)',
                color: filter === t ? '#fff' : 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize'
              }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-top-grid">
        
        {/* Primary Scanner Card (Span 8) */}
        <motion.div 
          className="glass-card scanner-card" 
          style={{ position: 'relative', overflow: 'hidden', padding: 'max(24px, 5vw)' }}>
          <div style={{ maxWidth: 600 }}>
            <h2 style={{ fontSize: 32, marginBottom: 12 }}>Uncover the Digital DNA</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Enter a business name, URL, or upload a Google Maps screenshot to generate a deep-vibe intelligence report.</p>
            
            <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
              <div style={{ position: 'relative' }}>
                <Search size={20} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="e.g. Blue Bottle Coffee or maps.app.goo.gl/..."
                  style={{ width: '100%', padding: '20px 24px 20px 56px', borderRadius: 16, border: '1px solid var(--border)', fontSize: 16, outline: 'none' }}
                />
              </div>

              <div style={{ display:'flex', gap: 12, alignItems:'center', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 250px', position: 'relative' }}>
                  <input type="file" id="file" onChange={handleFile} hidden accept="image/*" />
                  <label htmlFor="file" style={{ 
                    display:'flex', alignItems:'center', gap: 10, padding: '16px 20px', borderRadius: 14, border: '1px dashed var(--border)',
                    background: imgPreview ? 'var(--bg)' : 'transparent', color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer', transition: 'all 0.2s'
                  }}>
                    {imgPreview ? (
                      <div style={{ display:'flex', alignItems:'center', gap: 10, width: '100%' }}>
                        <img src={imgPreview} style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                        <span style={{ flex: 1 }}>Image Attached</span>
                        <X size={16} onClick={(e) => { e.preventDefault(); setImgPreview(null); setImgFile(null); }} />
                      </div>
                    ) : (
                      <>
                        <ImageIcon size={20} />
                        <span>Upload Maps Screenshot</span>
                      </>
                    )}
                  </label>
                </div>
                <button 
                  onClick={runAnalysis}
                  className="btn-primary" style={{ padding: '16px 32px', height: 56 }}>
                  <Zap size={20} />
                  <span>Analyze</span>
                </button>
              </div>
              {error && <p style={{ color: '#ef4444', fontSize: 14, fontWeight: 500 }}>{error}</p>}
            </div>
          </div>
        </motion.div>

        <div className="info-card-container" style={{ display:'flex', flexDirection:'column', gap: 24 }}>
          <div className="glass-card" style={{ background: 'var(--accent)', color: '#fff' }}>
            <Zap size={24} style={{ marginBottom: 16 }} />
            <h3 style={{ color: '#fff', fontSize: 20, marginBottom: 8 }}>Vibe AI Pro</h3>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.5 }}>You have 48 intelligence credits remaining this month. Upgrade to Pro for unlimited telemetry.</p>
          </div>
          <div className="glass-card">
            <History size={24} style={{ marginBottom: 16, color: 'var(--accent)' }} />
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>Recent History</h3>
            <div style={{ display:'flex', flexDirection:'column', gap: 12 }}>
              {reports.slice(0, 3).map(r => (
                <div key={r.id} style={{ display:'flex', alignItems:'center', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 18 }}>
                    {r.businessType === 'restaurant' ? '🍴' : r.businessType === 'cafe' ? '☕' : '🏢'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{r.businessName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(r.timestamp?.seconds * 1000).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Large Results Grid */}
        <div style={{ gridColumn: 'span 12' }}>
          <h2 style={{ fontSize: 24, marginBottom: 24 }}>Intelligence Feed</h2>
          <div className="dashboard-grid">
            <AnimatePresence>
              {reports.filter(r => filter === 'all' || r.businessType === filter).map(report => (
                <motion.div
                  key={report.id}
                  layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-card" onClick={() => navigate(`/report/${report.id}`, { state: { report } })}
                  style={{ cursor: 'pointer', display:'flex', flexDirection:'column', gap: 16 }}
                >
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div style={{ padding: '4px 10px', background: 'var(--bg)', borderRadius: 8, fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
                      {report.businessType}
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteReport(report.id); }}
                      style={{ background:'none', border:'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div>
                    <h3 style={{ fontSize: 20, marginBottom: 4 }}>{report.businessName}</h3>
                    <div style={{ display:'flex', alignItems:'center', gap: 4, color: '#f59e0b', fontSize: 14, fontWeight: 700 }}>
                      <Star size={14} fill="#f59e0b" /> {report.googleRating || '4.5'} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({report.totalReviews || '120'})</span>
                    </div>
                  </div>

                  <div style={{ display:'flex', gap: 8, flexWrap: 'wrap' }}>
                    {report.brandPersonality?.adjectives?.slice(0, 3).map(adj => (
                      <span key={adj} style={{ fontSize: 11, color: 'var(--text-muted)', padding: '4px 8px', background: 'var(--bg)', borderRadius: 6 }}>{adj}</span>
                    ))}
                  </div>

                  <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap: 6, color: 'var(--text-muted)', fontSize: 12 }}>
                      <Clock size={14} />
                      {new Date(report.timestamp?.seconds * 1000).toLocaleDateString()}
                    </div>
                    <ArrowUpRight size={18} color="var(--accent)" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
