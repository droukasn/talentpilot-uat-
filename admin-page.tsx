'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { listCandidates, upsertCandidate, deleteCandidate, type Candidate } from '@/lib/candidates'

const ADMIN_HINT = typeof window !== 'undefined' ? localStorage.getItem('TP_ADMIN_OK') : null
function toInitials(name: string){ return name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase() }

export default function AdminPage(){
  const [ok, setOk] = useState(!!ADMIN_HINT)
  const passRef = useRef<HTMLInputElement>(null)
  if(!ok){
    return (
      <div style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#f8fafc'}}>
        <div style={{background:'white',border:'1px solid #e2e8f0',borderRadius:16,padding:24,width:360}}>
          <div style={{fontWeight:700,marginBottom:8}}>Admin Console</div>
          <div style={{fontSize:13,color:'#475569',marginBottom:12}}>Enter any admin phrase to continue (stored only in your browser).</div>
          <input ref={passRef} placeholder="Admin phrase" style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:8,padding:'8px 10px'}}/>
          <button onClick={()=>{ if(passRef.current?.value){ localStorage.setItem('TP_ADMIN_OK','1'); setOk(true) } }} style={{marginTop:12,width:'100%',border:'1px solid #0284c7',background:'#0284c7',color:'white',borderRadius:8,padding:'8px 10px'}}>Enter</button>
        </div>
      </div>
    )
  }
  return <Console />
}

function Console(){
  const [items, setItems] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<Candidate|null>(null)

  useEffect(()=>{ (async()=>{ setLoading(true); const data = await listCandidates(); setItems(data); setLoading(false) })() },[])

  const filtered = useMemo(()=>{
    const n = q.trim().toLowerCase()
    return items.filter(c=>{
      const t = [c.full_name, c.headline, c.country, c.city, ...(c.skills||[]), ...(c.roles||[])].filter(Boolean).join(' ').toLowerCase()
      return !n || t.includes(n)
    })
  },[items,q])

  async function remove(id?: string){ if(!id) return; await deleteCandidate(id); setItems(await listCandidates()); setSelected(null) }
  async function save(c: Candidate){ await upsertCandidate({ ...c, last_updated: new Date().toISOString() }); setItems(await listCandidates()); setSelected(null) }

  async function exportJson(){
    const blob = new Blob([JSON.stringify(items,null,2)],{type:'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='talentpool-export.json'; a.click(); URL.revokeObjectURL(url)
  }

  async function importJson(file: File){
    const txt = await file.text()
    try {
      const arr = JSON.parse(txt) as Candidate[]
      for(const row of arr){ await upsertCandidate(row) }
      setItems(await listCandidates())
      alert(`Imported ${arr.length} records`)
    } catch(e){ alert('Invalid JSON file') }
  }

  return (
    <div style={{minHeight:'100vh'}}>
      <header style={{position:'sticky',top:0,background:'white',borderBottom:'1px solid #e2e8f0',zIndex:10}}>
        <div style={{maxWidth:1120,margin:'0 auto',padding:'12px 16px',display:'flex',gap:12,alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{height:36,width:36,borderRadius:16,background:'#0ea5e9',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>TP</div>
            <div style={{fontWeight:600,fontSize:18}}>Admin Console</div>
          </div>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search all fields…" style={{marginLeft:'auto',border:'1px solid #e2e8f0',borderRadius:8,padding:'8px 10px',width:360}}/>
          <button onClick={()=>setSelected({ full_name:'', country:'Greece' })} style={{border:'1px solid #0ea5e9',background:'#0ea5e9',color:'white',borderRadius:8,padding:'8px 12px'}}>Add Candidate</button>
          <button onClick={exportJson} style={{border:'1px solid #e2e8f0',borderRadius:8,padding:'8px 12px'}}>Export JSON</button>
          <label style={{border:'1px solid #e2e8f0',borderRadius:8,padding:'8px 12px',cursor:'pointer'}}>Import JSON
            <input type="file" accept="application/json" onChange={e=>{ const f=e.target.files?.[0]; if(f) importJson(f) }} style={{display:'none'}}/>
          </label>
        </div>
      </header>

      <main style={{maxWidth:1120,margin:'0 auto',padding:'16px'}}>
        {loading ? (
          <div style={{textAlign:'center',color:'#64748b',padding:'60px 0'}}>Loading…</div>
        ) : (
          <div style={{background:'white',border:'1px solid #e2e8f0',borderRadius:16,overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead style={{background:'#f8fafc'}}>
                <tr>
                  {['Name','Headline','Country','City','Roles','Skills','Seniority','Availability','Rate','Actions'].map(h=> (
                    <th key={h} style={{textAlign:'left',padding:10,borderBottom:'1px solid #e2e8f0',fontSize:12,color:'#475569'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c)=> (
                  <tr key={c.id}>
                    <td style={{padding:10,borderBottom:'1px solid #eef2f7'}}><div style={{display:'flex',alignItems:'center',gap:8}}><div style={{height:28,width:28,borderRadius:12,background:'#e0f2fe',color:'#075985',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>{toInitials(c.full_name)}</div>{c.full_name}</div></td>
                    <td style={{padding:10,borderBottom:'1px solid #eef2f7'}}>{c.headline}</td>
                    <td style={{padding:10,borderBottom:'1px solid #eef2f7'}}>{c.country}</td>
                    <td style={{padding:10,borderBottom:'1px solid #eef2f7'}}>{c.city}</td>
                    <td style={{padding:10,borderBottom:'1px solid #eef2f7'}}>{(c.roles||[]).join(', ')}</td>
                    <td style={{padding:10,borderBottom:'1px solid #eef2f7'}}>{(c.skills||[]).slice(0,5).join(', ')}{(c.skills||[]).length>5?'…':''}</td>
                    <td style={{padding:10,borderBottom:'1px solid #eef2f7'}}>{c.seniority}</td>
                    <td style={{padding:10,borderBottom:'1px solid #eef2f7'}}>{c.availability}</td>
                    <td style={{padding:10,borderBottom:'1px solid #eef2f7'}}>{c.day_rate?`€${c.day_rate}`:''}</td>
                    <td style={{padding:10,borderBottom:'1px solid #eef2f7'}}>
                      <button onClick={()=>setSelected(c)} style={{border:'1px solid #e2e8f0',borderRadius:8,padding:'4px 8px'}}>Edit</button>
                      <button onClick={()=>remove(c.id)} style={{border:'1px solid #ef4444',color:'#ef4444',borderRadius:8,padding:'4px 8px',marginLeft:8}}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {selected && <Editor record={selected} onClose={()=>setSelected(null)} onSave={(c)=>save(c)} />}
    </div>
  )
}

function Editor({ record, onClose, onSave }:{ record: Candidate, onClose: ()=>void, onSave:(c:Candidate)=>void }){
  const [form, setForm] = useState<Candidate>({ ...record })
  function update<K extends keyof Candidate>(k: K, v: Candidate[K]){ setForm(prev=>({ ...prev, [k]: v })) }

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(15,23,42,.4)'}}>
      <div onClick={e=>e.stopPropagation()} style={{position:'absolute',right:0,top:0,height:'100%',width:'560px',background:'white',padding:16,overflow:'auto'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{height:40,width:40,borderRadius:16,background:'#e0f2fe',color:'#075985',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>{toInitials(form.full_name||'')}</div>
          <div style={{fontWeight:700}}>Edit Candidate</div>
          <button onClick={onClose} style={{marginLeft:'auto',border:'1px solid #e2e8f0',borderRadius:8,padding:'6px 10px'}}>Close</button>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:12}}>
          {Field({label:'Full name', value:form.full_name||'', onChange:(v)=>update('full_name', v), required:true})}
          {Field({label:'Headline', value:form.headline||'', onChange:(v)=>update('headline', v)})}
          {Field({label:'Country', value:form.country||'', onChange:(v)=>update('country', v)})}
          {Field({label:'City', value:form.city||'', onChange:(v)=>update('city', v)})}
          {Field({label:'Email', value:form.email||'', onChange:(v)=>update('email', v)})}
          {Field({label:'Phone', value:form.phone||'', onChange:(v)=>update('phone', v)})}
          {Field({label:'Seniority', value:(form.seniority as any)||'', onChange:(v)=>update('seniority', v as any)})}
          {Field({label:'Availability', value:(form.availability as any)||'', onChange:(v)=>update('availability', v as any)})}
          {Field({label:'Work type', value:(form.work_type as any)||'', onChange:(v)=>update('work_type', v as any)})}
          {Field({label:'Years experience', value:String(form.years_experience||0), onChange:(v)=>update('years_experience', Number(v) as any)})}
          {Field({label:'Day rate (€)', value:String(form.day_rate||''), onChange:(v)=>update('day_rate', Number(v) as any)})}
          {Field({label:'CV URL', value:form.cv_url||'', onChange:(v)=>update('cv_url', v)})}
        </div>

        {ChipList({label:'Roles', value:(form.roles||[]), onChange:(v)=>update('roles', v as any)})}
        {ChipList({label:'Skills', value:(form.skills||[]), onChange:(v)=>update('skills', v as any)})}
        {ChipList({label:'Languages', value:(form.languages||[]), onChange:(v)=>update('languages', v as any)})}
        {ChipList({label:'SDG Expertise', value:(form.sdg_expertise||[]), onChange:(v)=>update('sdg_expertise', v as any)})}
        {ChipList({label:'Sectors', value:(form.sectors||[]), onChange:(v)=>update('sectors', v as any)})}
        {ChipList({label:'Tools', value:(form.tools||[]), onChange:(v)=>update('tools', v as any)})}

        <div>
          <div style={{fontSize:12,color:'#475569',marginBottom:6}}>Summary</div>
          <textarea value={form.summary||''} onChange={e=>update('summary', e.target.value)} style={{width:'100%',minHeight:100,border:'1px solid #e2e8f0',borderRadius:10,padding:8}}/>
        </div>
        <div>
          <div style={{fontSize:12,color:'#475569',marginBottom:6}}>Notes (private)</div>
          <textarea value={form.notes||''} onChange={e=>update('notes', e.target.value)} style={{width:'100%',minHeight:80,border:'1px solid #e2e8f0',borderRadius:10,padding:8}}/>
        </div>

        <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:16}}>
          <button onClick={()=>onSave(form)} style={{border:'1px solid #0ea5e9',background:'#0ea5e9',color:'white',borderRadius:8,padding:'8px 12px'}}>Save</button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, required }:{ label:string, value:string, onChange:(v:string)=>void, required?:boolean }){
  return (
    <label>
      <div style={{fontSize:12,color:'#475569',marginBottom:6}}>{label}{required? ' *':''}</div>
      <input value={value} onChange={e=>onChange(e.target.value)} required={required} style={{width:'100%',border:'1px solid #e2e8f0',borderRadius:10,padding:'8px 10px'}}/>
    </label>
  )
}

function ChipList({label, value, onChange}:{label:string, value:string[], onChange:(v:string[])=>void}){
  const [draft, setDraft] = useState('')
  function add(){ const v = draft.trim(); if(!v) return; if(value.includes(v)) return; onChange([...value, v]); setDraft('') }
  return (
    <div>
      <div style={{fontSize:12,color:'#475569',marginBottom:6, marginTop:12}}>{label}</div>
      <div style={{display:'flex',flexWrap:'wrap',gap:6,border:'1px solid #e2e8f0',borderRadius:10,padding:8}}>
        {value.map((t)=> (<span key={t} style={{fontSize:12,background:'#f1f5f9',padding:'2px 8px',borderRadius:999}}>{t} <button onClick={()=>onChange(value.filter(x=>x!==t))} style={{marginLeft:6}}>×</button></span>))}
        <input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); add() } }} placeholder="Type and Enter…" style={{flex:1,minWidth:140,border:'none',outline:'none'}}/>
        <button onClick={add} style={{border:'1px solid #e2e8f0',borderRadius:8,padding:'4px 8px'}}>Add</button>
      </div>
    </div>
  )
}
