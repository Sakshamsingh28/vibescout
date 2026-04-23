import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { analyzeBusinessVibe } from '../services/vibeAnalysis.js'
import { saveReport, saveContact } from '../services/firestore.js'
import { Link2, Upload, X, Zap, Globe, Image as ImageIcon, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const STEPS = ['Input', 'Scanning', 'Report']
const SCAN_MESSAGES = [
  'Fetching Maps presence...',
  'Analyzing entity photos & vibe...',
  'Scanning social footprint...',
  'Extracting brand identity...',
  'Identifying OLED palette...',
  'Building enterprise recommendations...',
  'Composing final intelligence report...',
]

export default function AnalyzePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef()
  const [tab, setTab] = useState('url') // url | screenshot
  const [url, setUrl] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [imgFile, setImgFile] = useState(null)
  const [imgPreview, setImgPreview] = useState(null)
  const [step, setStep] = useState(0) // 0=input, 1=scanning, 2=done
  const [scanMsg, setScanMsg] = useState(0)
  const [error, setError] = useState('')

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setImgFile(f)
    const reader = new FileReader()
    reader.onload = ev => setImgPreview(ev.target.result)
    reader.readAsDataURL(f)
  }

  useEffect(() => {
    const handlePaste = (e) => {
      const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.indexOf('image') === 0) {
          const f = item.getAsFile();
          if (f) {
            setTab('screenshot');
            setImgFile(f);
            const reader = new FileReader();
            reader.onload = ev => setImgPreview(ev.target.result);
            reader.readAsDataURL(f);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (!f) return
    setImgFile(f)
    const reader = new FileReader()
    reader.onload = ev => setImgPreview(ev.target.result)
    reader.readAsDataURL(f)
  }

  const runAnalysis = async () => {
    if (tab === 'url' && !url.trim() && !businessName.trim()) {
      setError('Please enter a URL or business name'); return
    }
    if (tab === 'screenshot' && !imgFile) {
      setError('Please upload a screenshot'); return
    }
    setError(''); setStep(1)

    // Animate scan messages
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
        url: url.trim() || null,
        screenshotBase64: base64,
        businessName: businessName.trim() || null
      })

      if (!report || Object.keys(report).length < 3 || (!report.businessName && !report.businessType)) {
        throw new Error('AI returned empty or invalid data. Please try again or provide more specific details.')
      }

      clearInterval(msgTimer)

      // Navigate to preview mode without auto-saving
      const reportData = {
        ...report,
        sourceUrl: url.trim() || null,
        hasScreenshot: !!base64,
      }

      setStep(2)
      setTimeout(() => navigate('/report/preview', { state: { report: reportData } }), 800)
    } catch(e) {
      clearInterval(msgTimer)
      setError('Analysis failed: ' + e.message)
      setStep(0)
    }
  }

  if (step === 1) return <ScanningScreen message={SCAN_MESSAGES[scanMsg]} />
  if (step === 2) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh',
      flexDirection:'column', gap:16 }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#020617' }}>
        <Zap size={32} />
      </div>
      <div style={{ fontFamily:'var(--font-head)', fontSize:24, fontWeight:700, color: 'var(--text)' }}>Scan Complete</div>
      <div style={{ color:'var(--text2)', fontSize:15 }}>Routing to intelligence report...</div>
    </motion.div>
  )

  return (
    <div className="page-container" style={{ padding:'64px 48px', maxWidth:720, margin:'0 auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ marginBottom:48 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
          <div style={{ width:32, height:32, borderRadius:8,
            background:'var(--accent)', boxShadow: 'var(--glow)',
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Zap size={16} color="#020617" fill="#020617"/>
          </div>
          <span style={{ fontSize:13, color:'var(--accent)', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight: 600 }}>
            Intelligence Scanner
          </span>
        </div>
        <h1 style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:36, letterSpacing:'-0.03em', marginBottom:12, color: 'var(--text)' }}>
          Initialize New Scan
        </h1>
        <p style={{ color:'var(--text2)', fontSize:16, lineHeight:1.6, fontWeight: 400 }}>
          Provide an entity URL or drop a visual capture. The AI will extract intelligence signals and compile a comprehensive profile.
        </p>
      </motion.div>

      {/* Card */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:20, overflow:'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', background: 'var(--bg3)' }}>
          {[
            { key:'url',        label:'URL / Identity', icon:<Globe size={16}/> },
            { key:'screenshot', label:'Visual Capture',   icon:<ImageIcon size={16}/> },
          ].map(t => (
            <motion.button key={t.key} onClick={()=>setTab(t.key)} 
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
              style={{
                flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                padding:'18px 24px', fontSize:14, fontWeight:600, cursor:'pointer',
                background: tab===t.key ? 'var(--bg2)' : 'transparent',
                border:'none',
                borderBottom: tab===t.key ? '2px solid var(--accent)' : '2px solid transparent',
                color: tab===t.key ? 'var(--text)' : 'var(--text3)',
                transition:'color 0.2s, background 0.2s'
              }}>
              {t.icon}{t.label}
            </motion.button>
          ))}
        </div>

        <div style={{ padding:32 }}>
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
              {tab === 'url' ? (
                <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
                  <div>
                    <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:8, letterSpacing:'0.06em', textTransform:'uppercase', fontWeight: 600 }}>
                      Entity URL
                    </label>
                    <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
                      <Link2 size={16} style={{ position:'absolute', left:16, color:'var(--text3)' }}/>
                      <input value={url} onChange={e=>setUrl(e.target.value)}
                        placeholder="https://maps.google.com/..."
                        style={{
                          width:'100%', padding:'14px 16px 14px 44px',
                          background:'var(--bg)', border:'1px solid var(--border)',
                          borderRadius:12, fontSize:15, color:'var(--text)', outline:'none',
                          transition: 'border 0.2s, box-shadow 0.2s'
                        }}
                        onFocus={e=>{e.target.style.borderColor='var(--accent)';e.target.style.boxShadow='0 0 0 2px rgba(34,197,94,0.1)'}}
                        onBlur={e=>{e.target.style.borderColor='var(--border)';e.target.style.boxShadow='none'}}
                      />
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                    <div style={{ flex:1, height:1, background:'var(--border)' }}/>
                    <span style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.1em', fontWeight: 600 }}>or query</span>
                    <div style={{ flex:1, height:1, background:'var(--border)' }}/>
                  </div>
                  <div>
                    <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:8, letterSpacing:'0.06em', textTransform:'uppercase', fontWeight: 600 }}>
                      Identity Descriptor
                    </label>
                    <input value={businessName} onChange={e=>setBusinessName(e.target.value)}
                      placeholder="e.g. Acme Corp, New York"
                      style={{
                        width:'100%', padding:'14px 16px',
                        background:'var(--bg)', border:'1px solid var(--border)',
                        borderRadius:12, fontSize:15, color:'var(--text)', outline:'none',
                        transition: 'border 0.2s, box-shadow 0.2s'
                      }}
                      onFocus={e=>{e.target.style.borderColor='var(--accent)';e.target.style.boxShadow='0 0 0 2px rgba(34,197,94,0.1)'}}
                      onBlur={e=>{e.target.style.borderColor='var(--border)';e.target.style.boxShadow='none'}}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <motion.div
                    whileHover={{ borderColor: 'var(--accent)', backgroundColor: 'rgba(34,197,94,0.02)' }}
                    onDrop={handleDrop} onDragOver={e=>e.preventDefault()}
                    onClick={()=>fileRef.current?.click()}
                    style={{
                      border:`2px dashed ${imgPreview ? 'var(--accent)' : 'var(--border2)'}`,
                      borderRadius:16, padding:'48px 32px', textAlign:'center', cursor:'pointer',
                      background: imgPreview ? 'var(--bg)' : 'var(--bg)',
                      transition:'border 0.2s, background 0.2s', position:'relative'
                    }}
                  >
                    {imgPreview ? (
                      <div>
                        <img src={imgPreview} alt="Preview"
                          style={{ maxHeight:200, maxWidth:'100%', borderRadius:10, objectFit:'contain' }}/>
                        <motion.button 
                          whileHover={{ scale: 1.1, backgroundColor: 'rgba(239,68,68,0.8)' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={e=>{e.stopPropagation();setImgFile(null);setImgPreview(null)}}
                          style={{
                            position:'absolute', top:16, right:16, background:'var(--bg3)',
                            border:'1px solid var(--border)', borderRadius:'50%', width:32, height:32,
                            display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text)'
                          }}>
                          <X size={16}/>
                        </motion.button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width:56, height:56, borderRadius:16, background:'var(--bg3)',
                          border:'1px solid var(--border)', display:'flex', alignItems:'center',
                          justifyContent:'center', marginBottom:20 }}>
                          <Upload size={24} color="var(--text2)"/>
                        </div>
                        <div style={{ fontSize:16, fontWeight:600, marginBottom:8, color: 'var(--text)' }}>
                          Drop visual capture here
                        </div>
                        <div style={{ fontSize:13, color:'var(--text3)' }}>
                          Click to browse system files (Maps, Search, etc.)
                        </div>
                      </div>
                    )}
                  </motion.div>
                  <input ref={fileRef} type="file" accept="image/*"
                    onChange={handleFile} style={{ display:'none' }}/>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop:24, padding:'12px 16px', background:'rgba(239,68,68,0.1)',
              border:'1px solid rgba(239,68,68,0.2)', borderRadius:10, fontSize:14, color:'var(--red)', fontWeight: 500 }}>
              {error}
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'0 32px 32px', background: 'var(--bg2)' }}>
          <motion.button 
            onClick={runAnalysis} 
            whileHover={{ scale: 1.02, boxShadow: '0 0 24px rgba(34,197,94,0.3)' }}
            whileTap={{ scale: 0.98 }}
            style={{
              width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:12,
              padding:'16px', borderRadius:14, fontSize:16, fontWeight:600,
              background:'var(--accent)', border:'none', color:'#020617',
              cursor:'pointer', transition:'all 0.2s'
            }}
          >
            <Zap size={20} fill="#020617"/>
            Initialize Scan Sequence
            <ChevronRight size={18}/>
          </motion.button>
          <p style={{ textAlign:'center', marginTop:16, fontSize:13, color:'var(--text3)', fontWeight: 500 }}>
            Automated intelligence extraction across distributed networks.
          </p>
        </div>
      </motion.div>
    </div>
  )
}

function ScanningScreen({ message }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        height:'100vh', gap:40, padding:32
      }}
    >
      {/* Animated Core */}
      <div style={{ position:'relative', width:120, height:120 }}>
        <motion.div 
          animate={{ scale: [1, 1.1, 1], boxShadow: ['0 0 20px rgba(34,197,94,0.2)', '0 0 60px rgba(34,197,94,0.5)', '0 0 20px rgba(34,197,94,0.2)'] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width:120, height:120, borderRadius:'50%',
            background:'var(--accent)',
            display:'flex', alignItems:'center', justifyContent:'center'
          }}>
          <Zap size={48} color="#020617" fill="#020617"/>
        </motion.div>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          style={{
            position:'absolute', inset:-8,
            borderRadius:'50%', border:'2px dashed rgba(34,197,94,0.3)'
          }}
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          style={{
            position:'absolute', inset:-16,
            borderRadius:'50%', border:'1px solid rgba(34,197,94,0.1)'
          }}
        />
      </div>

      <div style={{ textAlign:'center' }}>
        <h2 style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:32, letterSpacing:'-0.02em', marginBottom:12, color: 'var(--text)' }}>
          Processing Data Streams
        </h2>
        <motion.p 
          key={message}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ color:'var(--accent)', fontSize:16, minHeight:24, fontWeight:500, letterSpacing: '0.02em' }}
        >
          {message}
        </motion.p>
      </div>

      <p style={{ fontSize:14, color:'var(--text3)', maxWidth:480, textAlign:'center', lineHeight: 1.6 }}>
        Aggregating cross-platform telemetry and synthesizing enterprise intelligence. Stand by...
      </p>
    </motion.div>
  )
}
