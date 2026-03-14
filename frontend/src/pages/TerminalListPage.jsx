import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTerminals } from '../services/api'
import Navbar from '../components/Navbar'

const statusLabels = { ACTIVE: 'Active', SET_UP_IN_PROGRESS: 'Setting Up', DECOMMISSIONED: 'Decommissioned' }

export default function TerminalListPage() {
    const [terminals, setTerminals] = useState([])
    const [loading, setLoading] = useState(true)
    const [userLoc, setUserLoc] = useState(null)
    const [geoError, setGeoError] = useState('')
    const navigate = useNavigate()

    // Haversine distance formula
    const getDistance = (lat1, lon1, lat2, lon2) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return null;
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    useEffect(() => {
        // Try getting user location
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => setGeoError("Location access denied. Displaying unordered list.")
            );
        }

        getTerminals().then(r => setTerminals(r.data.data || [])).finally(() => setLoading(false))
    }, [])

    const sortedTerminals = [...terminals].sort((a, b) => {
        if (!userLoc) return 0;
        const distA = getDistance(userLoc.lat, userLoc.lng, a.latitude, a.longitude);
        const distB = getDistance(userLoc.lat, userLoc.lng, b.latitude, b.longitude);
        if (distA === null && distB === null) return 0;
        if (distA === null) return 1;
        if (distB === null) return -1;
        return distA - distB;
    });

    return (
        <div className="page">
            <Navbar />
            <div className="container">
                <div className="page-header">
                    <h1 className="page-title">🏢 Find a Terminal</h1>
                    <p className="page-subtitle">Choose a locker terminal near you and select your preferred box</p>
                </div>

                {loading ? (
                    <div className="loading-center"><div className="spinner spinner-lg" /><span>Loading terminals...</span></div>
                ) : terminals.length === 0 ? (
                    <div className="empty-state">
                        <div className="icon">📦</div>
                        <h3>No terminals available</h3>
                        <p>There are no active terminals at the moment.</p>
                    </div>
                ) : (
                    <div>
                        {geoError && <div className="alert alert-warning mb-4" style={{ fontSize: '0.85rem' }}>{geoError}</div>}
                        <div className="grid-2">
                            {sortedTerminals.map(t => {
                                const distance = userLoc ? getDistance(userLoc.lat, userLoc.lng, t.latitude, t.longitude) : null;
                                return (
                                    <div key={t.id} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/terminals/${t.id}`)}>
                                        <div className="card-header">
                                            <div>
                                                <div className="card-title">🏪 {t.identifiableName}</div>
                                                <div className="card-subtitle">{t.physicalLocation}</div>
                                            </div>
                                            <span className="badge badge-success">● Active</span>
                                        </div>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                                            {t.description}
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <span className="chip">📍 View Boxes</span>
                                            {distance !== null && <span className="chip" style={{ background: 'var(--primary-light)', color: 'black' }}>🛣️ {distance.toFixed(1)} km away</span>}
                                        </div>
                                        <div style={{ marginTop: 16 }}>
                                            <button id={`select-terminal-${t.id}`} className="btn btn-primary btn-full">
                                                Choose Box at This Terminal →
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
