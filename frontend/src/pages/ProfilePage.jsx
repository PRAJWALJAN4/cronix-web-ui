import { useState, useEffect } from 'react'
import { getProfile, updateProfile } from '../services/api'
import Navbar from '../components/Navbar'

export default function ProfilePage() {
    const [user, setUser] = useState(null)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        getProfile().then(r => {
            const u = r.data.data
            setUser(u); setName(u.name || ''); setEmail(u.email || '')
        }).finally(() => setLoading(false))
    }, [])

    const handleSave = async (e) => {
        e.preventDefault(); setSaving(true)
        try {
            await updateProfile(name, email)
            setSaved(true); setTimeout(() => setSaved(false), 3000)
        } finally { setSaving(false) }
    }

    return (
        <div className="page">
            <Navbar />
            <div className="container" style={{ maxWidth: 480, paddingTop: 48 }}>
                <div className="page-header">
                    <h1 className="page-title">👤 Profile</h1>
                </div>
                {loading ? <div className="loading-center"><div className="spinner spinner-lg" /></div> : (
                    <div className="card">
                        {saved && <div className="alert alert-success">Profile updated!</div>}
                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label className="form-label">Phone Number</label>
                                <input className="form-input" value={user?.phoneNumber} disabled />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input className="form-input" placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input className="form-input" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                            <button className="btn btn-primary btn-full" type="submit" disabled={saving}>
                                {saving ? <><span className="spinner" /> Saving...</> : 'Save Profile'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}
