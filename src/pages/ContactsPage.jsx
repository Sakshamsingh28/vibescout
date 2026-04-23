import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { subscribeToContacts, saveContact, deleteContact } from '../services/firestore.js'
import { Phone, Plus, Trash2, Link2, Smartphone, Monitor, Coffee, Dumbbell, Scissors, Utensils, ShoppingBag, Building2, X, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const TYPE_ICON = { cafe: Coffee, gym: Dumbbell, salon: Scissors, restaurant: Utensils, retail: ShoppingBag }

export default function ContactsPage() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name:'', phone:'', businessType:'cafe', website:'' })
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    if (!user) return
    const unsub = subscribeToContacts(user.uid, data => { setContacts(data); setLoading(false) })
    return unsub
  }, [user])

  const handleAdd = async (e) => {
    e.preventDefault(); setSaving(true)
    await saveContact(user.uid, form)
    setForm({ name:'', phone:'', businessType:'cafe', website:'' })
    setShowAdd(false); setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this contact?')) return
    await deleteContact(id)
  }

  const handleDownloadVCF = () => {
    const vcf = contacts.map(c =>
      `BEGIN:VCARD\nVERSION:3.0\nFN:${c.name}\nTEL;TYPE=WORK:${c.phone||''}\nURL:${c.website||''}\nEND:VCARD`
    ).join('\n')
    const blob = new Blob([vcf], { type:'text/vcard' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'enterprise-contacts.vcf'
    a.click()
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  }
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  }

  return (
    <div className="page-container" style={{ padding:'64px 56px', maxWidth:960, margin:'0 auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:48 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:36, letterSpacing:'-0.02em', marginBottom:12, color: 'var(--text)' }}>
            Enterprise Network
          </h1>
          <p style={{ color:'var(--text2)', fontSize:16, fontWeight: 400 }}>
            Curated intelligence connections synchronized in real-time.
          </p>
        </div>
        <div className="mobile-stack" style={{ display:'flex', gap:16 }}>
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleDownloadVCF} disabled={contacts.length===0} style={{
              display:'flex', alignItems:'center', gap:8, padding:'12px 20px', borderRadius:12,
              background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)',
              fontSize:14, fontWeight:600, cursor:'pointer',
              opacity: contacts.length===0 ? 0.4 : 1
          }}>
            <Smartphone size={16}/> Export Array
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(34,197,94,0.3)' }} whileTap={{ scale: 0.95 }}
            onClick={()=>setShowAdd(s=>!s)} style={{
              display:'flex', alignItems:'center', gap:8, padding:'12px 20px', borderRadius:12,
              background:'var(--accent)', border:'none', color:'#020617',
              fontSize:14, fontWeight:600, cursor:'pointer'
          }}>
            <Plus size={16}/> Add Node
          </motion.button>
        </div>
      </motion.div>

      {/* Sync info banner */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{
        display:'flex', alignItems:'center', gap:16, padding:'16px 24px', borderRadius:16,
        background:'rgba(248,250,252,0.02)', border:'1px solid var(--border)',
        marginBottom:32, fontSize:14, color:'var(--text3)'
      }}>
        <div style={{ display:'flex', gap:10, alignItems:'center', background: 'var(--bg3)', padding: 8, borderRadius: 10 }}>
          <Monitor size={16} color="var(--text2)"/>
          <Smartphone size={16} color="var(--text2)"/>
        </div>
        <div style={{ lineHeight: 1.6 }}>
          <strong style={{ color:'var(--text)', fontWeight: 600 }}>Multi-device Synchronization:</strong>
          {' '}Network nodes are continuously synchronized. Export for localized device ingestion.
        </div>
      </motion.div>

      <AnimatePresence>
        {/* Add form */}
        {showAdd && (
          <motion.form 
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
            onSubmit={handleAdd} style={{
              background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:20,
              padding:32, position: 'relative'
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
              <h3 style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:18, color: 'var(--text)' }}>Establish New Node</h3>
              <motion.button 
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--red)' }}
                type="button" onClick={()=>setShowAdd(false)}
                style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius: 8, padding: 6, color:'var(--text2)', cursor:'pointer' }}>
                <X size={16}/>
              </motion.button>
            </div>
            <div className="grid-stats" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
              <div>
                <label style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', display: 'block', marginBottom: 8, fontWeight: 600 }}>Entity Name</label>
                <input required value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
                  placeholder="Acme Corp" style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', display: 'block', marginBottom: 8, fontWeight: 600 }}>Communication Line</label>
                <input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}
                  placeholder="+1 234 567 8900" style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', display: 'block', marginBottom: 8, fontWeight: 600 }}>Classification</label>
                <select value={form.businessType} onChange={e=>setForm(f=>({...f,businessType:e.target.value}))}
                  style={{...inputStyle, background:'var(--bg)'}}>
                  {['cafe','gym','salon','restaurant','retail','other'].map(t=>(
                    <option key={t} value={t} style={{background:'var(--bg)'}}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.06em', display: 'block', marginBottom: 8, fontWeight: 600 }}>Digital Address</label>
                <input value={form.website} onChange={e=>setForm(f=>({...f,website:e.target.value}))}
                  placeholder="https://acme.com" style={inputStyle}
                />
              </div>
            </div>
            <motion.button type="submit" disabled={saving} 
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{
                padding:'12px 28px', borderRadius:12, background:'var(--accent)',
                border:'none', color:'#020617', fontSize:14, fontWeight:600, cursor:'pointer',
                opacity: saving ? 0.7 : 1
              }}>
              {saving ? 'Transmitting…' : 'Finalize Connection'}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Contacts list */}
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {[1,2,3].map(i=>(
            <div key={i} style={{ height:80, background:'var(--bg2)', borderRadius:16,
              border:'1px solid var(--border)', animation:'pulse 1.5s ease infinite' }}/>
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{
          textAlign:'center', padding:'80px 24px', background:'var(--bg2)',
          border:'1px dashed var(--border)', borderRadius:20
        }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', margin: '0 auto 24px' }}>
            <Building2 size={32} />
          </div>
          <h3 style={{ fontFamily:'var(--font-head)', fontWeight:700, fontSize:22, marginBottom:12, color: 'var(--text)' }}>Network Empty</h3>
          <p style={{ color:'var(--text3)', fontSize:15, maxWidth: 400, margin: '0 auto' }}>
            Connections are automatically established during intelligence scans. You may also initiate manual links above.
          </p>
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {contacts.map((c) => {
            const Icon = TYPE_ICON[c.businessType] || Building2
            return (
              <motion.div variants={itemVariants} key={c.id} 
                whileHover={{ backgroundColor: 'var(--bg3)', scale: 1.01 }}
                style={{
                  display:'flex', alignItems:'center', gap:20, padding:'20px 24px',
                  background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:16,
                  transition:'background 0.2s'
              }}>
                <div style={{
                  width:48, height:48, borderRadius:12, flexShrink:0,
                  background:'var(--bg)', border:'1px solid var(--border)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color: 'var(--text2)'
                }}>
                  <Icon size={20} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:16, marginBottom:6, color: 'var(--text)' }}>{c.name}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                    {c.phone && (
                      <motion.a whileHover={{ color: 'var(--text)' }} href={`tel:${c.phone}`} style={{ display:'flex', alignItems:'center', gap:6,
                        fontSize:14, color:'var(--text2)', textDecoration:'none', fontWeight: 500, transition: 'color 0.2s' }}>
                        <Phone size={14}/>{c.phone}
                      </motion.a>
                    )}
                    {c.website && (
                      <motion.a whileHover={{ color: 'var(--accent)' }} href={c.website} target="_blank" rel="noreferrer"
                        style={{ display:'flex', alignItems:'center', gap:6,
                          fontSize:14, color:'var(--blue)', textDecoration:'none', fontWeight: 500, transition: 'color 0.2s' }}>
                        <Link2 size={14}/>{c.website.replace(/^https?:\/\//,'')}
                      </motion.a>
                    )}
                    <span style={{ fontSize:12, padding: '4px 10px', borderRadius: 20, background: 'var(--bg)', border: '1px solid var(--border)', color:'var(--text3)', textTransform:'capitalize', fontWeight: 600 }}>
                      {c.businessType}
                    </span>
                    {c.synced && (
                      <span style={{ display:'flex', alignItems:'center', gap:4,
                        fontSize:12, color:'var(--green)', fontWeight: 600 }}>
                        <Check size={12}/>Synchronized
                      </span>
                    )}
                  </div>
                </div>
                <motion.button 
                  whileHover={{ color: 'var(--red)', backgroundColor: 'rgba(239,68,68,0.1)' }}
                  onClick={()=>handleDelete(c.id)} style={{
                    background:'var(--bg)', border:'1px solid var(--border)', color:'var(--text3)', cursor:'pointer',
                    padding:10, borderRadius:10, transition:'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Trash2 size={16}/>
                </motion.button>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}

const inputStyle = {
  width:'100%', padding:'14px 16px',
  background:'var(--bg)', border:'1px solid var(--border)',
  borderRadius:12, fontSize:14, color:'var(--text)', outline:'none',
  transition: 'border 0.2s, box-shadow 0.2s'
}
