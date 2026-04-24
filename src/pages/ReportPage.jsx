import { useLocation, useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, Share2, Star, Zap, Layout as LayoutIcon, Palette, Users, Globe, ChevronRight, PhoneCall, Code, Target, Link as LinkIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getReport, saveReport } from '../services/firestore.js'
import { useAuth } from '../contexts/AuthContext.jsx'
export default function ReportPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [report, setReport] = useState(location.state?.report || null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    if (!user || !report || saved) return
    setSaving(true)
    try {
      const docId = await saveReport(user.uid, report)
      setReport({ ...report, id: docId })
      setSaved(true)
      // Replace the current history entry so refreshing doesn't lose the ID
      navigate(`/report/${docId}`, { replace: true, state: { report: { ...report, id: docId } } })
    } catch (e) {
      console.error("Error saving report", e)
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (!report && id) {
      getReport(id).then(setReport)
    }
  }, [id, report])

  if (!report) return <div style={{ padding: 40, textAlign: 'center' }}>Loading Report...</div>

  const renderBullets = (text) => {
    if (!text) return null
    return text.split('\n').filter(t => t.trim()).map((line, i) => (
      <div key={i} style={{ display:'flex', gap: 10, marginBottom: 10, fontSize: 15, lineHeight: 1.6, color: 'var(--text)' }}>
        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>•</span>
        <span>{line.replace(/^[•\-\*]\s*/, '')}</span>
      </div>
    ))
  }

  const Section = ({ title, icon: Icon, children, span = '1' }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className="glass-card" style={{ gridColumn: `span ${span}`, display:'flex', flexDirection:'column', gap: 20 }}>
      <div style={{ display:'flex', alignItems:'center', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-light)', display:'flex', alignItems:'center', justifyContent:'center', color: 'var(--accent)' }}>
          <Icon size={20} />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700 }}>{title}</h3>
      </div>
      <div>{children}</div>
    </motion.div>
  )

  return (
    <div className="fade-in" style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 100 }}>
      {/* Top Nav */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 40 }}>
        <button onClick={() => navigate('/')} style={{ background:'none', border:'none', display:'flex', alignItems:'center', gap: 8, color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>
          <ArrowLeft size={18} /> Back to Hub
        </button>
        <div style={{ display:'flex', gap: 12 }}>
          <button className="glass" style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid var(--border)', display:'flex', alignItems:'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
            <Share2 size={16} /> Share
          </button>
          <button onClick={handleSave} disabled={saving || saved || !!id} className="btn-primary" style={{ padding: '10px 20px', borderRadius: 12, fontSize: 13, opacity: saved || !!id ? 0.7 : 1 }}>
            <Zap size={16} /> {saving ? 'Saving...' : saved || !!id ? 'Saved to Database' : 'Commit to Database'}
          </button>
          <button className="glass" style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid var(--border)', display:'flex', alignItems:'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>

      {/* Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card" style={{ marginBottom: 32, padding: 48, background: 'linear-gradient(135deg, var(--surface) 0%, var(--bg) 100%)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'relative', zIndex: 2, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
          <div>
            <div style={{ padding: '6px 12px', background: 'var(--accent)', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 700, display:'inline-block', marginBottom: 16, textTransform: 'uppercase' }}>
              {report.businessType} Intelligence
            </div>
            <h1 style={{ fontSize: 48, marginBottom: 8, letterSpacing: '-0.04em' }}>{report.businessName}</h1>
            <div style={{ display:'flex', alignItems:'center', gap: 16, color: 'var(--text-muted)' }}>
              <div style={{ display:'flex', alignItems:'center', gap: 4, color: '#f59e0b', fontWeight: 700 }}>
                <Star size={18} fill="#f59e0b" /> {report.googleRating} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({report.totalReviews} reviews)</span>
              </div>
              <span>•</span>
              <div style={{ display:'flex', alignItems:'center', gap: 6 }}>
                <Globe size={16} /> {report.location || 'Global Presence'}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>VIBE SCORE</div>
            <div style={{ fontSize: 72, fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{report.vibeScore}<span style={{ fontSize: 24, color: 'var(--text-muted)', fontWeight: 400 }}>/10</span></div>
          </div>
        </div>
        
        {/* Background Accent */}
        <div style={{ position:'absolute', top: -100, right: -100, width: 400, height: 400, background: 'radial-gradient(circle, var(--accent-light) 0%, transparent 70%)', opacity: 0.3, zIndex: 1 }} />
      </motion.div>

      {/* Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        
        <Section title="Vibe Summary" icon={Zap} span="2">
          {renderBullets(report.vibeSummary)}
        </Section>

        <Section title="Social Presence" icon={LinkIcon} span="2">
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {report.socialHandles && Object.entries(report.socialHandles).map(([platform, handle]) => (
               <div key={platform} style={{ display:'flex', alignItems:'center', gap: 8, padding: '12px 20px', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize', color: 'var(--text)' }}>{platform}:</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{handle}</span>
               </div>
            ))}
          </div>
        </Section>

        <Section title="Cold Call Ammunition" icon={PhoneCall} span="2">
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
             <div>
               <h4 style={{ fontSize: 14, color: '#10b981', marginBottom: 12, display:'flex', alignItems:'center', gap: 8 }}>
                 <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} /> STRENGTHS
               </h4>
               {renderBullets(report.coldCallAmmunition?.strengths)}
             </div>
             <div>
               <h4 style={{ fontSize: 14, color: '#ef4444', marginBottom: 12, display:'flex', alignItems:'center', gap: 8 }}>
                 <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} /> WEAKNESSES
               </h4>
               {renderBullets(report.coldCallAmmunition?.weaknesses)}
             </div>
             <div style={{ gridColumn: '1 / -1', padding: 20, background: 'var(--accent-light)', borderRadius: 12, border: '1px solid var(--accent)' }}>
                <h4 style={{ fontSize: 14, color: 'var(--accent)', marginBottom: 12, display:'flex', alignItems:'center', gap: 8, fontWeight: 700 }}>
                 <Target size={16} /> THE PITCH ANGLE
               </h4>
               {renderBullets(report.coldCallAmmunition?.pitchAngle)}
             </div>
           </div>
        </Section>

        <Section title="Website Dev Suggestions" icon={Code} span="2">
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
              <div>
                <h4 style={{ fontSize: 14, color: 'var(--secondary)', marginBottom: 12, fontWeight: 700 }}>Design Direction</h4>
                {renderBullets(report.websiteDevelopmentSuggestions?.designDirection)}
              </div>
              <div>
                <h4 style={{ fontSize: 14, color: 'var(--secondary)', marginBottom: 12, fontWeight: 700 }}>Features to Add</h4>
                {renderBullets(report.websiteDevelopmentSuggestions?.featuresToAdd)}
              </div>
           </div>
        </Section>

      </div>
    </div>
  )
}
