import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getReport, saveReport, saveContact } from '../services/firestore.js'
import { generateWebsiteCopy } from '../services/vibeAnalysis.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { ArrowLeft, Star, Phone, Globe, MapPin, Hash, Share2, Map, Sparkles, Copy, Check, ExternalLink, Save } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const SECTION = ({ title, children, style={} }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
    style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:16, padding:32, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', ...style }}>
    <h3 style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:18, letterSpacing:'-0.01em', marginBottom:24, color:'var(--text)', display: 'flex', alignItems: 'center', gap: 10 }}>
      {title}
    </h3>
    {children}
  </motion.div>
)

export default function ReportPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [report, setReport] = useState(null)
  const [copy, setCopy] = useState(null)
  const [loadingCopy, setLoadingCopy] = useState(false)
  const [copied, setCopied] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (id === 'preview') {
      if (location.state?.report) {
        setReport(location.state.report)
      }
      setLoading(false)
    } else {
      getReport(id).then(r => { setReport(r); setLoading(false) })
    }
  }, [id, location])

  const handleSaveToDatabase = async () => {
    setSaving(true)
    try {
      const reportId = await saveReport(user.uid, report)
      
      if (report.phone) {
        await saveContact(user.uid, {
          name: report.businessName,
          phone: report.phone,
          businessType: report.businessType,
          website: report.website || null,
          reportId,
        })
      }
      
      navigate(`/report/${reportId}`, { replace: true })
    } catch(e) {
      alert('Failed to save: ' + e.message)
      setSaving(false)
    }
  }

  const handleCopySuggestions = async () => {
    setLoadingCopy(true)
    const result = await generateWebsiteCopy(report)
    setCopy(result)
    setLoadingCopy(false)
  }

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1500)
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <motion.div 
        animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{ width:40, height:40, border:'2px solid var(--border2)', borderTopColor:'var(--accent)', borderRadius:'50%' }}
      />
    </div>
  )
  
  if (!report) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100vh', gap:16 }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)' }}>
        <Map size={32} />
      </div>
      <div style={{ fontFamily:'var(--font-head)', fontSize:24, fontWeight: 700, color: 'var(--text)' }}>Report Nullified</div>
      <motion.button 
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={()=>navigate('/')} 
        style={{ padding:'12px 24px', borderRadius:12, background:'var(--text)', border:'none', color:'var(--bg)', cursor:'pointer', fontWeight: 600 }}>
        Return to Overview
      </motion.button>
    </div>
  )

  const palette = report.colorPalette || {}
  const dp = report.digitalPresence || {}
  const brand = report.brandPersonality || {}
  const wsRec = report.websiteRecommendations || {}

  return (
    <div className="page-container" style={{ maxWidth:1000, margin:'0 auto', padding:'48px 56px' }}>
      {/* Back */}
      <motion.button 
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}
        whileHover={{ x: -4, color: 'var(--text)' }}
        onClick={()=>navigate('/')} 
        style={{
          display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderRadius:8,
          background:'transparent', border:'none', color:'var(--text3)',
          fontSize:14, fontWeight: 600, cursor:'pointer', marginBottom:32, transition:'color 0.2s'
        }}
      >
        <ArrowLeft size={16}/> Overview
      </motion.button>

      {/* Save Button (Preview Mode) */}
      {id === 'preview' && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32, padding: 24, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h3 style={{ color: 'var(--green)', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Uncommitted Preview</h3>
            <p style={{ color: 'var(--text2)', fontSize: 14 }}>This intelligence report has not been permanently stored in your database.</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleSaveToDatabase} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'var(--accent)', color: '#020617', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            <Save size={18} />
            {saving ? 'Committing...' : 'Commit to Database'}
          </motion.button>
        </motion.div>
      )}

      {/* Hero */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{
          background: 'var(--bg2)', border:'1px solid var(--border)',
          borderRadius:20, padding:'40px 48px', marginBottom:32,
          position:'relative', overflow:'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.3)'
        }}>
        {/* Subtle glow accent */}
        <div style={{
          position:'absolute', top: -100, right: -100, width:400, height:400,
          background:'radial-gradient(circle,rgba(34,197,94,0.05) 0%,transparent 70%)',
          pointerEvents:'none'
        }}/>

        <div className="report-hero" style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:24, position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
              {report.businessType && (
                <span style={{
                  padding:'6px 14px', borderRadius:24, fontSize:12, fontWeight:600,
                  background:'var(--bg3)', color:'var(--text)',
                  border:'1px solid var(--border)', textTransform:'capitalize'
                }}>
                  {report.businessType}
                </span>
              )}
              {report.primaryVibe && (
                <span style={{
                  padding:'6px 14px', borderRadius:24, fontSize:12, fontWeight:600,
                  background:'rgba(34,197,94,0.1)', color:'var(--green)',
                  border:'1px solid rgba(34,197,94,0.2)'
                }}>
                  {report.primaryVibe}
                </span>
              )}
            </div>
            <h1 style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:40, letterSpacing:'-0.03em', marginBottom:12, color: 'var(--text)' }}>
              {report.businessName}
            </h1>
            <div style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
              {report.location && (
                <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:14, color:'var(--text2)', fontWeight: 500 }}>
                  <MapPin size={14}/>{report.location}
                </span>
              )}
              {report.phone && (
                <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:14, color:'var(--text)', fontWeight: 500 }}>
                  <Phone size={14}/>{report.phone}
                </span>
              )}
              {report.website && (
                <motion.a whileHover={{ color: 'var(--accent)' }} href={report.website} target="_blank" rel="noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:6, fontSize:14, color:'var(--blue)', fontWeight: 500, transition: 'color 0.2s', textDecoration: 'none' }}>
                  <Globe size={14}/>{report.website} <ExternalLink size={12}/>
                </motion.a>
              )}
            </div>
          </div>

          {/* Vibe Score */}
          <div className="report-score-section" style={{ textAlign:'center', flexShrink:0 }}>
            <div style={{
              width:88, height:88, borderRadius:'50%',
              background:'conic-gradient(var(--accent) 0% calc(var(--s)*1%), var(--bg3) 0%)',
              '--s': `${(report.vibeScore||5)*10}`,
              display:'flex', alignItems:'center', justifyContent:'center', position:'relative',
              boxShadow: '0 0 24px rgba(34,197,94,0.1)'
            }}>
              <div style={{
                width:72, height:72, borderRadius:'50%', background:'var(--bg)',
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'
              }}>
                <div style={{ fontFamily:'var(--font-head)', fontWeight:800, fontSize:24, lineHeight:1, color:'var(--text)' }}>
                  {report.vibeScore}
                </div>
                <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'0.1em', marginTop: 2, fontWeight: 600 }}>SCORE</div>
              </div>
            </div>
            {report.googleRating && (
              <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:12, justifyContent:'center', fontSize:14 }}>
                <Star size={14} color="var(--amber)" fill="var(--amber)"/>
                <span style={{ color:'var(--text)', fontWeight:700 }}>{report.googleRating}</span>
                <span style={{ color:'var(--text3)', fontSize:12, fontWeight: 500 }}>({report.totalReviews?.toLocaleString()})</span>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        {report.summary && (
          <div style={{
            marginTop:32, padding:'24px', borderRadius:16,
            background:'var(--bg3)', border:'1px solid var(--border)',
            fontSize:15, color:'var(--text2)', lineHeight:1.8, position: 'relative', zIndex: 1
          }}>
            {report.summary}
          </div>
        )}
      </motion.div>

      <div className="grid-stats" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:24 }}>
        {/* Color Palette */}
        <SECTION title={<><div style={{width:8, height:8, borderRadius:'50%', background:'var(--text)'}}/>Brand Palette</>}>
          {Object.keys(palette).length > 0 ? (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {Object.entries(palette).map(([name, hex]) => (
                <motion.div whileHover={{ backgroundColor: 'var(--bg3)' }} key={name} style={{ display:'flex', alignItems:'center', gap:16, padding: '8px 12px', borderRadius: 12, transition: 'background 0.2s', marginLeft: -12, marginRight: -12 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:hex,
                    border:'1px solid rgba(255,255,255,0.1)', flexShrink:0, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}/>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, textTransform:'capitalize', color: 'var(--text)' }}>{name}</div>
                    <div style={{ fontSize:13, color:'var(--text3)', fontFamily:'monospace', marginTop: 2 }}>{hex}</div>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.1, color: 'var(--text)' }} whileTap={{ scale: 0.9 }}
                    onClick={()=>handleCopy(hex,name)} style={{
                      marginLeft:'auto', background:'var(--bg)', border:'1px solid var(--border)',
                      borderRadius:8, padding:'6px 10px', fontSize:12, color:'var(--text2)', cursor:'pointer',
                      display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500
                    }}>
                    {copied===name ? <><Check size={14} color="var(--green)"/>Copied</> : <><Copy size={14}/>Copy</>}
                  </motion.button>
                </motion.div>
              ))}
            </div>
          ) : <div style={{ color:'var(--text3)', fontSize:14 }}>No palette parameters extracted.</div>}
        </SECTION>

        {/* Brand Personality */}
        <SECTION title={<><Sparkles size={18} color="var(--text)"/>Identity Architecture</>}>
          {brand.adjectives && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:24 }}>
              {brand.adjectives.map(a => (
                <span key={a} style={{
                  padding:'6px 14px', borderRadius:24, fontSize:13, fontWeight:600,
                  background:'var(--bg3)', color:'var(--text)',
                  border:'1px solid var(--border)'
                }}>{a}</span>
              ))}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
            {brand.targetAudience && (
              <div>
                <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6, fontWeight: 600 }}>Target Demographic</div>
                <div style={{ fontSize:14, color:'var(--text2)', lineHeight: 1.6 }}>{brand.targetAudience}</div>
              </div>
            )}
            {brand.pricePoint && (
              <div>
                <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6, fontWeight: 600 }}>Positioning Tier</div>
                <span style={{
                  padding:'4px 12px', borderRadius:20, fontSize:13, fontWeight:600,
                  background:'rgba(248,250,252,0.05)', color:'var(--text)',
                  border:'1px solid var(--border)', textTransform:'capitalize'
                }}>{brand.pricePoint}</span>
              </div>
            )}
            {brand.ambiance && (
              <div>
                <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6, fontWeight: 600 }}>Environmental Atmosphere</div>
                <div style={{ fontSize:14, color:'var(--text2)', lineHeight:1.6 }}>{brand.ambiance}</div>
              </div>
            )}
          </div>
        </SECTION>
      </div>

      {/* Digital Presence */}
      <SECTION title={<><Globe size={18} color="var(--text)"/>Digital Footprint Analysis</>} style={{ marginBottom:24 }}>
        <div className="grid-stats" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }}>
          {[
            { key:'googleMaps', icon:<Map size={18}/>,    label:'Google Maps', color:'var(--text)', data: dp.googleMaps },
            { key:'instagram',  icon:<Hash size={18}/>,   label:'Instagram',   color:'var(--text)', data: dp.instagram },
            { key:'facebook',   icon:<Share2 size={18}/>, label:'Facebook',    color:'var(--text)', data: dp.facebook },
          ].map(({ key, icon, label, color, data }) => (
            <div key={key} style={{
              padding:24, borderRadius:16, background:'var(--bg)',
              border:'1px solid var(--border)'
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                <span style={{ color }}>{icon}</span>
                <span style={{ fontSize:15, fontWeight:600, color: 'var(--text)' }}>{label}</span>
                {data && (
                  <span style={{
                    marginLeft:'auto', fontSize:11, padding:'4px 10px', borderRadius:12, fontWeight: 600,
                    background: (data.hasProfile||data.likelyActive) ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    color: (data.hasProfile||data.likelyActive) ? 'var(--green)' : 'var(--red)',
                    border: `1px solid ${(data.hasProfile||data.likelyActive) ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  }}>
                    {(data.hasProfile||data.likelyActive) ? 'Active' : 'Inactive'}
                  </span>
                )}
              </div>
              {data?.reviewHighlights && (
                <ul style={{ fontSize:13, color:'var(--text2)', lineHeight:1.8, paddingLeft:16, marginBottom: 16 }}>
                  {data.reviewHighlights.slice(0,3).map((h,i)=><li key={i}>{h}</li>)}
                </ul>
              )}
              {data?.contentThemes && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom: 16 }}>
                  {data.contentThemes.map(t=>(
                    <span key={t} style={{ fontSize:12, padding:'4px 10px', borderRadius:12,
                      background:'var(--bg3)', color:'var(--text)', border:'1px solid var(--border)', fontWeight: 500 }}>
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {data?.estimatedStyle && (
                <div style={{ fontSize:13, color:'var(--text3)' }}>{data.estimatedStyle}</div>
              )}
            </div>
          ))}
        </div>
      </SECTION>

      {/* Website Recommendations */}
      {wsRec && Object.keys(wsRec).length > 0 && (
        <SECTION title={<><MapPin size={18} color="var(--text)"/>Deployment Recommendations</>} style={{ marginBottom:24 }}>
          <div className="grid-stats" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:32 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {wsRec.layout && (
                <div>
                  <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, fontWeight: 600 }}>Structural Layout</div>
                  <div style={{ fontSize:14, color:'var(--text)', lineHeight: 1.6 }}>{wsRec.layout}</div>
                </div>
              )}
              {wsRec.heroSection && (
                <div>
                  <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, fontWeight: 600 }}>Hero Configuration</div>
                  <div style={{ fontSize:14, color:'var(--text2)', lineHeight:1.6 }}>{wsRec.heroSection}</div>
                </div>
              )}
              {wsRec.callToAction && (
                <div>
                  <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, fontWeight: 600 }}>Primary Objective</div>
                  <div style={{ display:'inline-block', padding:'10px 20px', borderRadius:12,
                    background:'var(--accent)', color:'#020617', fontSize:14, fontWeight:600 }}>
                    {wsRec.callToAction}
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {wsRec.mustHaveFeatures && (
                <div>
                  <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, fontWeight: 600 }}>Critical Features</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {wsRec.mustHaveFeatures.map(f => (
                      <div key={f} style={{ display:'flex', alignItems:'center', gap:10, fontSize:14, color:'var(--text)', background: 'var(--bg)', padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border)' }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--green)', flexShrink:0 }}/>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {wsRec.keyPages && (
                <div>
                  <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, fontWeight: 600 }}>Required Topologies</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                    {wsRec.keyPages.map(p=>(
                      <span key={p} style={{ padding:'6px 14px', borderRadius:24, fontSize:13, fontWeight: 500,
                        background:'var(--bg)', color:'var(--text)',
                        border:'1px solid var(--border)' }}>{p}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </SECTION>
      )}

      {/* AI Copy Suggestions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
        style={{
          background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:20, padding:32,
          position: 'relative', overflow: 'hidden'
        }}>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 200, background: 'linear-gradient(to right, transparent, rgba(34,197,94,0.03))', pointerEvents: 'none' }} />
        
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: copy ? 32 : 0, position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={16} color="#020617"/>
              </div>
              <h3 style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:20, color: 'var(--text)' }}>AI Content Generation</h3>
            </div>
            <p style={{ fontSize:14, color:'var(--text3)' }}>Synthesize intelligent copy assets derived from profile signals.</p>
          </div>
          {!copy && (
            <motion.button 
              whileHover={{ scale: 1.02, boxShadow: '0 4px 16px rgba(34,197,94,0.2)' }} whileTap={{ scale: 0.98 }}
              onClick={handleCopySuggestions} disabled={loadingCopy} style={{
                display:'flex', alignItems:'center', gap:8, padding:'12px 24px', borderRadius:12,
                background:'var(--accent)', border:'none', color:'#020617', fontSize:14, fontWeight:600,
                cursor:'pointer', opacity: loadingCopy ? 0.7 : 1, flexShrink:0
              }}>
              {loadingCopy ? <>Processing...</> : <><Sparkles size={16}/>Execute Synthesis</>}
            </motion.button>
          )}
        </div>
        
        <AnimatePresence>
          {copy && (
            <motion.div className="grid-stats" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, position: 'relative', zIndex: 1 }}>
              {Object.entries(copy).map(([key, val]) => (
                <div key={key} style={{
                  background:'var(--bg)', border:'1px solid var(--border)',
                  borderRadius:16, padding:'24px'
                }}>
                  <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12, fontWeight: 600 }}>
                    {key.replace(/([A-Z])/g,' $1').trim()}
                  </div>
                  <div style={{ fontSize:15, color:'var(--text)', lineHeight:1.6, marginBottom:20 }}>{val}</div>
                  <motion.button 
                    whileHover={{ backgroundColor: 'var(--bg3)', color: 'var(--text)' }} whileTap={{ scale: 0.95 }}
                    onClick={()=>handleCopy(val,key+'copy')} style={{
                      display:'flex', alignItems:'center', gap:8, background:'transparent',
                      border:'1px solid var(--border)', borderRadius:8, padding:'8px 14px',
                      fontSize:13, fontWeight: 500, color:'var(--text2)', cursor:'pointer', transition: 'background 0.2s, color 0.2s'
                    }}>
                    {copied===key+'copy' ? <><Check size={14} color="var(--green)"/>Copied Sequence</> : <><Copy size={14}/>Copy Sequence</>}
                  </motion.button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
