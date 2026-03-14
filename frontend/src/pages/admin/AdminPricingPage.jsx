import { useState, useEffect } from 'react'
import { getPricing, createPricing, updatePricing } from '../../services/api'

const defaultConfig = { small: 30, medium: 50, large: 80, extraLarge: 120, excessPerHour: 20 }

export default function AdminPricingPage() {
    const [prices, setPrices] = useState([])
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState({ name: 'Standard Pricing', config: JSON.stringify(defaultConfig, null, 2) })
    const [editId, setEditId] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)

    const fetch = () => getPricing().then(r => setPrices(r.data.data || [])).finally(() => setLoading(false))
    useEffect(() => { fetch() }, [])

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true)
        try {
            if (editId) await updatePricing(editId, form)
            else await createPricing(form)
            setForm({ name: '', config: JSON.stringify(defaultConfig, null, 2) }); setEditId(null); setShowForm(false); fetch()
        } finally { setSaving(false) }
    }

    const handleEdit = (p) => { setForm({ name: p.name || '', config: p.config || '' }); setEditId(p.id); setShowForm(true) }

    const prettyConfig = (config) => {
        try { return JSON.parse(config) } catch { return {} }
    }

    return (
        <div className="page" style={{ padding: 32 }}>
            <div className="flex justify-between items-center mb-6">
                <div><h1 className="page-title">💰 Pricing</h1><p className="page-subtitle">Configure pricing policies for terminals</p></div>
                <button className="btn btn-primary" onClick={() => { setForm({ name: '', config: JSON.stringify(defaultConfig, null, 2) }); setEditId(null); setShowForm(!showForm) }}>
                    {showForm ? '✕ Cancel' : '+ New Pricing'}
                </button>
            </div>

            {showForm && (
                <div className="card mb-6">
                    <h3 className="card-title mb-4">{editId ? 'Edit Pricing' : 'Create Pricing'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group"><label className="form-label">Pricing Name *</label><input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                        <div className="form-group">
                            <label className="form-label">Pricing Config (JSON)</label>
                            <textarea className="form-textarea" style={{ fontFamily: 'monospace', fontSize: '0.85rem', minHeight: 160 }} value={form.config} onChange={e => setForm({ ...form, config: e.target.value })} />
                            <div className="text-xs text-muted mt-2">Keys: small, medium, large, extraLarge (₹/slot), excessPerHour (₹/hour)</div>
                        </div>
                        <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? <span className="spinner" /> : null} {editId ? 'Save' : 'Create'}</button>
                    </form>
                </div>
            )}

            {loading ? <div className="loading-center"><div className="spinner spinner-lg" /></div> : (
                <div className="grid-2">
                    {prices.map(p => {
                        const cfg = prettyConfig(p.config)
                        return (
                            <div key={p.id} className="card">
                                <div className="flex justify-between items-center mb-3">
                                    <strong>{p.name || 'Unnamed Pricing'}</strong>
                                    <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(p)}>Edit</button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    {Object.entries(cfg).map(([k, v]) => (
                                        <div key={k} style={{ background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: 8 }}>
                                            <div className="text-xs text-muted">{k}</div>
                                            <div className="font-bold" style={{ color: 'var(--primary-light)' }}>₹{v}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                    {prices.length === 0 && <div className="empty-state"><div className="icon">💰</div><h3>No pricing configs</h3></div>}
                </div>
            )}
        </div>
    )
}
