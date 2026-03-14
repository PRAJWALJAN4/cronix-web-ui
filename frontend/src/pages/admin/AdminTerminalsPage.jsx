import { useState, useEffect, useMemo } from 'react'
import { getAdminTerminals, createTerminal, getSites, createTerminalMetadata, updateAdminTerminalStatus, getTerminalMetadata, generateBoxes, getAdminBoxes, updateBoxStatus, deleteTerminal } from '../../services/api'
import CustomLockerGrid from '../../components/CustomLockerGrid'

const STATUS_COLORS = { ACTIVE: 'badge-success', SET_UP_IN_PROGRESS: 'badge-warning', DECOMMISSIONED: 'badge-danger' }
const BOX_STATUS = ['EMPTY_CLOSED', 'BOOKED', 'OCCUPIED_OPEN', 'OCCUPIED_CLOSED', 'DISABLED']

export default function AdminTerminalsPage() {
    const [terminals, setTerminals] = useState([])
    const [sites, setSites] = useState([])
    const [selected, setSelected] = useState(null)
    const [boxes, setBoxes] = useState([])
    const [meta, setMeta] = useState(null)
    const [form, setForm] = useState({ identifiableName: '', description: '', siteIdRef: '', physicalLocation: '' })
    const [metaForm, setMetaForm] = useState({ layoutType: 'CUSTOM', gridLayout: '', maxPorts: 20, enabled: true, skipPayment: true, partialPickupCharge: 10 })
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState('list') // list | create | detail

    // CRITICAL: Memoize parsed layout so it doesn't recreate a new object every render
    // (which would trigger CustomLockerGrid's useEffect and reset the drawn layout)
    const parsedMetaLayout = useMemo(
        () => meta?.gridLayout ? JSON.parse(meta.gridLayout) : null,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [meta?.gridLayout]
    )

    const fetch = () => {
        setLoading(true)
        Promise.all([getAdminTerminals(), getSites()]).then(([tr, sr]) => {
            setTerminals(tr.data.data || [])
            setSites(sr.data.data || [])
        }).finally(() => setLoading(false))
    }
    useEffect(() => { fetch() }, [])

    const selectTerminal = async (t) => {
        setSelected(t); setTab('detail')
        const [bRes] = await Promise.all([getAdminBoxes(t.id)])
        setBoxes(bRes.data.data || [])
        try { const mRes = await getTerminalMetadata(t.id); setMeta(mRes.data.data) } catch { setMeta(null) }
    }

    const handleCreate = async (e) => {
        e.preventDefault()
        try {
            const res = await createTerminal(form)
            const t = res.data.data
            // Create initial empty metadata
            await createTerminalMetadata(t.id, { ...metaForm, gridLayout: JSON.stringify({ shape: '5x4', gridData: {} }) })
            setForm({ identifiableName: '', description: '', siteIdRef: '', physicalLocation: '' })
            fetch()
            // Auto-select the new terminal
            selectTerminal(t)
        } catch (err) {
            alert("Failed to create terminal: " + (err.response?.data?.message || err.message))
        }
    }

    const handleDeleteAll = async () => {
        if (confirm('🚨 CRITICAL: This will delete ALL terminals and ALL lockers in the system. Proceed?')) {
            for (const t of terminals) {
                await deleteTerminal(t.id)
            }
            alert("System cleared.")
            setTab('list'); fetch()
        }
    }

    const handleGenerate = async () => {
        if (!selected) return
        try {
            // Save metadata first
            const payload = meta ? { ...meta, gridLayout: metaForm.gridLayout } : metaForm
            const mRes = await createTerminalMetadata(selected.id, payload)
            setMeta(mRes.data.data) // Update local meta state with saved layout

            // Then generate boxes
            const res = await generateBoxes(selected.id)
            setBoxes(res.data.data?.length ? res.data.data : [])
            alert(`✅ Layout Saved & ${res.data.data?.length} Boxes Generated!`)
            fetch()
        } catch (err) {
            alert("❌ Action failed: " + (err.response?.data?.message || err.message))
        }
    }

    const handleBoxStatus = async (boxId, status) => {
        await updateBoxStatus(boxId, status)
        const res = await getAdminBoxes(selected.id)
        setBoxes(res.data.data || [])
    }

    const handleTerminalStatus = async (id, status) => {
        await updateAdminTerminalStatus(id, status);
        setSelected({ ...selected, status }); // Optimistic update
        fetch()
    }

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this terminal? All associated boxes and metadata might be lost.')) {
            await deleteTerminal(id);
            setTab('list');
            setSelected(null);
            fetch();
        }
    }

    return (
        <div className="page" style={{ padding: 32 }}>
            <div className="flex justify-between items-center mb-6">
                <div><h1 className="page-title">🏪 Terminals</h1><p className="page-subtitle">Manage locker terminals</p></div>
                <div className="flex gap-2">
                    <button className="btn btn-danger btn-sm" onClick={handleDeleteAll}>🗑️ Clear All</button>
                    <button className={`btn ${tab === 'list' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('list')}>All Terminals</button>
                    <button className={`btn ${tab === 'create' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab('create')}>+ New Terminal</button>
                </div>
            </div>

            {tab === 'list' && (
                loading ? <div className="loading-center"><div className="spinner spinner-lg" /></div> : (
                    <div className="grid-2">
                        {terminals.map(t => (
                            <div key={t.id} className="card" style={{ cursor: 'pointer' }} onClick={() => selectTerminal(t)}>
                                <div className="flex justify-between items-center mb-2">
                                    <strong>{t.identifiableName}</strong>
                                    <span className={`badge ${STATUS_COLORS[t.status] || 'badge-muted'}`}>{t.status?.replace(/_/g, ' ')}</span>
                                </div>
                                <div className="text-sm text-muted">{t.physicalLocation}</div>
                                <div className="text-sm text-muted mt-2">{t.description}</div>
                                <button className="btn btn-ghost btn-sm mt-4 btn-full">Manage →</button>
                            </div>
                        ))}
                        {terminals.length === 0 && <div className="empty-state"><div className="icon">🏪</div><h3>No terminals</h3><p>Create one to get started</p></div>}
                    </div>
                )
            )}

            {tab === 'create' && (
                <div className="card" style={{ maxWidth: 600 }}>
                    <h3 className="card-title mb-4">New Terminal</h3>
                    <form onSubmit={handleCreate}>
                        <div className="form-group"><label className="form-label">Name *</label><input className="form-input" required value={form.identifiableName} onChange={e => setForm({ ...form, identifiableName: e.target.value })} placeholder="e.g. Mall Terminal A" /></div>
                        <div className="form-group"><label className="form-label">Site *</label>
                            <select className="form-select" required value={form.siteIdRef} onChange={e => setForm({ ...form, siteIdRef: e.target.value })}>
                                <option value="">Select site...</option>
                                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group"><label className="form-label">Description</label><input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                        <div className="form-group"><label className="form-label">Physical Location</label><input className="form-input" value={form.physicalLocation} onChange={e => setForm({ ...form, physicalLocation: e.target.value })} placeholder="e.g. Ground Floor, Near Entrance" /></div>
                        <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, marginBottom: 16 }}>
                            <div style={{ fontWeight: 700, marginBottom: 12 }}>Metadata Configuration</div>
                            <div className="grid-2">
                                <div className="form-group"><label className="form-label">Layout Mode</label>
                                    <select className="form-select" value={metaForm.layoutType} onChange={e => setMetaForm({ ...metaForm, layoutType: e.target.value })}>
                                        <option value="CUSTOM">Custom Grid Designer</option>
                                    </select>
                                </div>
                                <div className="form-group"><label className="form-label">Max Ports</label><input className="form-input" type="number" value={metaForm.maxPorts} onChange={e => setMetaForm({ ...metaForm, maxPorts: +e.target.value })} /></div>
                            </div>
                            <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
                                <input type="checkbox" checked={metaForm.skipPayment} onChange={e => setMetaForm({ ...metaForm, skipPayment: e.target.checked })} />
                                <span className="text-sm">Skip Payment (Demo Mode)</span>
                            </label>
                        </div>
                        <button className="btn btn-primary btn-full" type="submit">Create Terminal + Generate Boxes</button>
                    </form>
                </div>
            )}

            {tab === 'detail' && selected && (
                <div>
                    <button className="btn btn-ghost btn-sm mb-4" onClick={() => { setTab('list'); setSelected(null) }}>← Back</button>
                    <div className="flex justify-between items-center mb-4">
                        <div className="tw-flex tw-flex-col">
                            <h2 style={{ fontWeight: 800 }}>{selected.identifiableName}</h2>
                            <p className="tw-text-muted tw-text-sm">📍 {selected.physicalLocation}</p>
                            <div className="tw-mt-1">
                                <button className="tw-text-primary tw-text-xs tw-font-bold hover:tw-underline flex items-center gap-1" onClick={() => selectTerminal(selected)}>
                                    <span>🔄</span> Refresh Status & Boxes
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                className={`btn ${selected.status === 'ACTIVE' ? 'btn-warning' : 'btn-success'}`}
                                onClick={() => handleTerminalStatus(selected.id, selected.status === 'ACTIVE' ? 'DECOMMISSIONED' : 'ACTIVE')}
                            >
                                {selected.status === 'ACTIVE' ? '🚫 Disable' : '✅ Enable'}
                            </button>
                            <button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>🗑️ Delete</button>
                        </div>
                    </div>

                    <div style={{ marginBottom: 24, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 16, background: 'rgba(255,255,255,0.02)' }}>
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 style={{ marginBottom: 4 }}>Box Designer</h3>
                                <p className="text-sm text-muted">Draw the locker layout. Click 'Save & Deploy Layout' to activate.</p>
                            </div>
                            <button className="btn btn-primary" onClick={handleGenerate}>⚡ Save & Deploy Layout</button>
                        </div>

                        <CustomLockerGrid
                            mode="design"
                            initialLayoutData={parsedMetaLayout}
                            onLayoutChange={(data) => setMetaForm({ ...metaForm, gridLayout: JSON.stringify(data) })}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 24 }}>
                        {boxes.sort((a, b) => a.rw - b.rw || a.col - b.col).map(box => (
                            <div key={box.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, textAlign: 'center' }}>
                                <div style={{ fontWeight: 700, marginBottom: 4 }}>{box.identifiableName}</div>
                                <div className="text-xs text-muted mb-2">{box.type}</div>
                                <select className="form-select" style={{ padding: '4px 6px', fontSize: '0.7rem' }} value={box.boxStatus} onChange={e => handleBoxStatus(box.id, e.target.value)}>
                                    {BOX_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>

                    {boxes.length === 0 && (
                        <div className="empty-state">
                            <div className="icon">📦</div>
                            <h3>No boxes yet</h3>
                            <p>Click "Generate Boxes" to create the box layout</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
