import { useState, useEffect } from 'react'
import { getSites, createSite, updateSite, deleteSite } from '../../services/api'

const empty = { name: '', address: '', latitude: '', longitude: '' }

export default function AdminSitesPage() {
    const [sites, setSites] = useState([])
    const [form, setForm] = useState(empty)
    const [editId, setEditId] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [geocoding, setGeocoding] = useState(false)

    const fetchList = () => getSites().then(r => setSites(r.data.data || [])).finally(() => setLoading(false))
    useEffect(() => { fetchList() }, [])

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true)
        try {
            if (editId) await updateSite(editId, form)
            else await createSite(form)
            setForm(empty); setEditId(null); setShowForm(false); fetchList()
        } finally { setSaving(false) }
    }

    const handleEdit = (s) => { setForm(s); setEditId(s.id); setShowForm(true) }
    const handleDelete = async (id) => { if (confirm('Delete site?')) { await deleteSite(id); fetchList() } }

    const handleGetLocation = () => {
        if ("geolocation" in navigator) {
            setGeocoding(true);
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const lat = pos.coords.latitude;
                    const lon = pos.coords.longitude;
                    let address = form.address;
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`, {
                            headers: { "User-Agent": "reverse-geocoding-app" }
                        });
                        const data = await res.json();
                        if (data && data.display_name) {
                            address = data.display_name;
                        }
                    } catch (e) {
                        console.error("Reverse geocoding failed", e);
                    } finally {
                        setForm(f => ({ ...f, latitude: lat, longitude: lon, address }));
                        setGeocoding(false);
                    }
                },
                (err) => {
                    alert("Could not fetch location. Please ensure location permissions are granted.");
                    setGeocoding(false);
                }
            );
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    }

    return (
        <div className="page" style={{ padding: 32 }}>
            <div className="flex justify-between items-center mb-6">
                <div><h1 className="page-title">📍 Sites</h1><p className="page-subtitle">Manage physical locations</p></div>
                <button className="btn btn-primary" onClick={() => { setForm(empty); setEditId(null); setShowForm(!showForm) }}>
                    {showForm ? '✕ Cancel' : '+ New Site'}
                </button>
            </div>

            {showForm && (
                <div className="card mb-6">
                    <h3 className="card-title mb-4">{editId ? 'Edit Site' : 'Create Site'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="grid-2">
                            <div className="form-group"><label className="form-label">Name *</label><input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                            <div className="form-group"><label className="form-label">Address *</label><input className="form-input" required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Auto-filled via GPS or manual entry" /></div>
                            <div className="form-group"><label className="form-label">Latitude</label><input className="form-input" type="number" step="any" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} /></div>
                            <div className="form-group"><label className="form-label">Longitude</label><input className="form-input" type="number" step="any" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} /></div>
                            <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                <button type="button" className="btn btn-outline btn-sm" onClick={handleGetLocation} disabled={geocoding}>
                                    {geocoding ? <><span className="spinner" /> Fetching Address...</> : '📍 Auto-fill Current Location'}
                                </button>
                            </div>
                        </div>
                        <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? <span className="spinner" /> : null} {editId ? 'Save Changes' : 'Create Site'}</button>
                    </form>
                </div>
            )}

            {loading ? <div className="loading-center"><div className="spinner spinner-lg" /></div> : (
                <div className="card">
                    <div className="table-wrap">
                        <table>
                            <thead><tr><th>Name</th><th>Full Address</th><th>Coordinates</th><th>Actions</th></tr></thead>
                            <tbody>
                                {sites.map(s => (
                                    <tr key={s.id}>
                                        <td><strong>{s.name}</strong></td>
                                        <td className="text-muted"><div style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={s.address}>{s.address}</div></td>
                                        <td className="text-sm text-muted">{s.latitude?.toFixed(4)}, {s.longitude?.toFixed(4)}</td>
                                        <td><div className="flex gap-2"><button className="btn btn-ghost btn-sm" onClick={() => handleEdit(s)}>Edit</button><button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)}>Delete</button></div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {sites.length === 0 && <div className="empty-state"><div className="icon">📍</div><h3>No sites yet</h3><p>Create your first site above</p></div>}
                    </div>
                </div>
            )}
        </div>
    )
}
