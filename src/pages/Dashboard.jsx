import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { subscribeToReports, deleteReport } from '../services/firestore.js'
import { Search, Trash2, Coffee, Dumbbell, Scissors, Utensils, ShoppingBag, Building2, Calendar, Star, TrendingUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const TYPE_ICON = { cafe: Coffee, gym: Dumbbell, salon: Scissors, restaurant: Utensils, retail: ShoppingBag }
const TYPE_COLOR = { cafe:'#94A3B8', gym:'#94A3B8', salon:'#94A3B8', restaurant:'#94A3B8', retail:'#94A3B8', other:'#64748B' }

// Minimalist OLED gradients
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

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [filter, setFilter] = useState('all')

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

  const filteredReports = filter === 'all' ? reports : reports.filter(r => r.businessType === filter)
  const types = ['all', ...Array.from(new Set(reports.map(r => r.businessType).filter(Boolean)))]

  const firstName = user?.displayName?.split(' ')[0] || 'Enterprise'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const avgVibe = reports.length
    ? (reports.reduce((a, r) => a + (r.vibeScore || 0), 0) / reports.length).toFixed(1)
    : '–'

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  }
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  }

  return (
    <div className="page-container" style={{ padding:'48px 56px', maxWidth:1200, margin:'0 auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom:48 }}>
        <p style={{ color:'var(--text3)', fontSize:13, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12, fontWeight: 600 }}>
          {greeting}
        </p>
        <h1 style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:40, letterSpacing:'-0.03em', marginBottom:8, color: 'var(--text)' }}>
          {firstName}'s Overview
        </h1>
        <p style={{ color:'var(--text2)', fontSize:16, fontWeight: 400 }}>
          {reports.length === 0
            ? 'Initialize your first analysis to populate the dashboard.'
            : `${reports.length} report${reports.length !== 1 ? 's' : ''} actively tracked.`}
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div 
        className="grid-stats"
        variants={containerVariants} initial="hidden" animate="show"
        style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:24, marginBottom:48 }}
      >
        {[
          { label:'Total Reports', value: reports.length, color:'var(--text)', icon:<TrendingUp size={20}/> },
          { label:'Avg Vibe Score', value: avgVibe, color:'var(--text)', icon:<Star size={20}/> },
          { label:'Business Types', value: new Set(reports.map(r=>r.businessType).filter(Boolean)).size || 0, color:'var(--text)', icon:<Building2 size={20}/> }
        ].map((s, idx) => (
          <motion.div key={s.label} variants={itemVariants} style={{
            background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:16,
            padding:'28px 32px', display:'flex', alignItems:'center', gap:20,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            <div style={{
              width:48, height:48, borderRadius:12, flexShrink:0,
              background:'var(--bg3)', border: '1px solid var(--border)',
              display:'flex', alignItems:'center', justifyContent:'center',
              color: 'var(--text2)'
            }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize:32, fontFamily:'var(--font-head)', fontWeight:700, color:s.color, letterSpacing:'-0.02em', lineHeight:1 }}>
                {s.value}
              </div>
              <div style={{ fontSize:13, color:'var(--text3)', marginTop:6, fontWeight: 500 }}>{s.label}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Toolbar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:32, flexWrap:'wrap', gap:16 }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {types.map(t => (
            <motion.button 
              key={t} onClick={()=>setFilter(t)} 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              style={{
                padding:'8px 16px', borderRadius:24, fontSize:13, fontWeight:500, cursor:'pointer',
                background: filter===t ? 'var(--text)' : 'var(--bg2)',
                border: `1px solid ${filter===t ? 'var(--text)' : 'var(--border)'}`,
                color: filter===t ? 'var(--bg)' : 'var(--text2)',
                textTransform:'capitalize', transition:'background 0.2s, color 0.2s'
              }}
            >
              {t}
            </motion.button>
          ))}
        </div>
        <motion.button 
          onClick={()=>navigate('/analyze')} 
          whileHover={{ scale: 1.02, backgroundColor: 'var(--accent2)' }}
          whileTap={{ scale: 0.98 }}
          style={{
            display:'flex', alignItems:'center', gap:10, padding:'12px 24px', borderRadius:12,
            fontSize:14, fontWeight:600,
            background:'var(--accent)', border:'none', color:'#020617',
            boxShadow:'var(--glow)', cursor:'pointer'
          }}
        >
          <Search size={16}/> New Analysis
        </motion.button>
      </motion.div>

      {/* Grid */}
      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:24 }}>
          {[1,2,3].map(i=>(
            <div key={i} style={{ height:240, background:'var(--bg2)', borderRadius:16,
              border:'1px solid var(--border)', animation:'pulse 1.5s ease infinite' }} />
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{
          textAlign:'center', padding:'100px 24px', background:'var(--bg2)',
          border:'1px dashed var(--border2)', borderRadius:20
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)' }}>
              <Search size={32} />
            </div>
          </div>
          <h3 style={{ fontFamily:'var(--font-head)', fontWeight:600, fontSize:22, marginBottom:12, color: 'var(--text)' }}>
            {reports.length === 0 ? 'No Data Available' : 'No results for this filter'}
          </h3>
          <p style={{ color:'var(--text3)', fontSize:15, marginBottom:32, maxWidth: 400, margin: '0 auto 32px' }}>
            {reports.length === 0 ? 'Initiate an analysis scan to populate your enterprise dashboard with actionable intelligence.' : 'Try selecting a different category from the filter menu.'}
          </p>
          {reports.length === 0 && (
            <motion.button 
              onClick={()=>navigate('/analyze')} 
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{
                padding:'14px 32px', borderRadius:12, background:'var(--text)',
                border:'none', color:'var(--bg)', fontSize:15, fontWeight:600, cursor:'pointer'
              }}
            >
              Initialize Scan
            </motion.button>
          )}
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:24 }}>
          <AnimatePresence>
            {filteredReports.map((r) => (
              <ReportCard key={r.id} report={r} 
                onOpen={()=>navigate(`/report/${r.id}`)}
                onDelete={(e)=>handleDelete(e, r.id)}
                deleting={deleting === r.id}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}

function ReportCard({ report, onOpen, onDelete, deleting }) {
  const Icon = TYPE_ICON[report.businessType] || Building2
  const color = TYPE_COLOR[report.businessType] || '#94a3b8'
  const gradient = VIBE_GRADIENT[report.primaryVibe] || 'linear-gradient(135deg, rgba(255,255,255,0.05), transparent)'
  const palette = report.colorPalette || {}

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4, borderColor: 'var(--border2)', boxShadow: '0 12px 32px rgba(0,0,0,0.4)' }}
      onClick={onOpen} 
      style={{
        background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:16,
        overflow:'hidden', cursor:'pointer', position: 'relative',
        display: 'flex', flexDirection: 'column'
      }}
    >
      {/* Subtle top glow based on vibe */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, background: gradient, opacity: 0.6, pointerEvents: 'none' }} />

      <div style={{ padding:'24px', position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header row */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{
              width:44, height:44, borderRadius:12, flexShrink:0,
              background:'var(--bg3)', border:'1px solid var(--border)',
              display:'flex', alignItems:'center', justifyContent:'center'
            }}>
              <Icon size={20} color={color}/>
            </div>
            <div>
              <div style={{ fontFamily:'var(--font-head)', fontWeight:600, fontSize:16, letterSpacing:'-0.01em', lineHeight:1.2, color: 'var(--text)' }}>
                {report.businessName || 'Unknown Entity'}
              </div>
              <div style={{ fontSize:12, color:'var(--text3)', marginTop:4, textTransform:'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
                {report.businessType || 'business'} {report.location ? `· ${report.location}` : ''}
              </div>
            </div>
          </div>
          <motion.button 
            onClick={e=>{e.stopPropagation();onDelete(e)}} disabled={deleting} 
            whileHover={{ color: 'var(--red)', backgroundColor: 'rgba(239,68,68,0.1)' }}
            style={{
              background:'transparent', border:'none', color:'var(--text3)', padding:8,
              borderRadius:8, cursor:'pointer', opacity: deleting ? 0.4 : 1, flexShrink:0,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <Trash2 size={16}/>
          </motion.button>
        </div>

        {/* Vibe badge */}
        {report.primaryVibe && (
          <div style={{ marginBottom:16 }}>
            <span style={{
              display:'inline-block', padding:'4px 12px', borderRadius:24,
              fontSize:12, fontWeight:500, background:'var(--bg3)', color:'var(--text2)',
              border: '1px solid var(--border)'
            }}>
              {report.primaryVibe}
            </span>
          </div>
        )}

        {/* Palette swatches - very minimal */}
        <div style={{ flex: 1 }} />
        {Object.keys(palette).length > 0 && (
          <div style={{ display:'flex', gap:4, marginBottom:20 }}>
            {Object.values(palette).slice(0,5).map((c,i)=>(
              <div key={i} title={c} style={{
                width: 24, height: 24, borderRadius: '50%', background:c,
                border:'1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}/>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 'auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {report.googleRating && (
              <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:13, color:'var(--text2)', fontWeight: 500 }}>
                <Star size={14} fill="var(--text3)" color="var(--text3)"/> {report.googleRating}
              </span>
            )}
            {report.vibeScore && (
              <span style={{
                fontSize:12, padding:'4px 10px', borderRadius:6,
                background:'rgba(34, 197, 94, 0.1)', color:'var(--green)',
                fontWeight: 600
              }}>
                Score: {report.vibeScore}/10
              </span>
            )}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--text3)', fontWeight: 500 }}>
            <Calendar size={12}/>
            {report.createdAt?.toDate
              ? report.createdAt.toDate().toLocaleDateString('en-US',{month:'short',day:'numeric'})
              : 'Now'}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
