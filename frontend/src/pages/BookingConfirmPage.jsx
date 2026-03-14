import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { allocateBox } from '../services/api'
import Navbar from '../components/Navbar'

const PRICE_MAP = { SMALL: 30, MEDIUM: 50, LARGE: 80, EXTRA_LARGE: 120 }
const BOX_ICONS = { SMALL: '📦', MEDIUM: '📫', LARGE: '🗄️', EXTRA_LARGE: '🏗️' }

export default function BookingConfirmPage() {
    const { state } = useLocation()
    const navigate = useNavigate()
    const { terminal, boxes } = state || {}
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [orders, setOrders] = useState([]) // Array of successful orders
    const [durationHours, setDurationHours] = useState(3)

    // Calculates total price for all boxes
    const getPrice = () => {
        if (!boxes || boxes.length === 0) return 0;
        return boxes.reduce((total, box) => {
            const base = PRICE_MAP[box.type] || 30;
            let multi = 1.0;
            if (durationHours === 6) multi = 1.8;
            if (durationHours === 9) multi = 2.5;
            if (durationHours === 24) multi = 5.0;
            return total + Math.round(base * multi);
        }, 0);
    }

    if (!terminal || !boxes || boxes.length === 0) {
        navigate('/terminals')
        return null
    }

    const handleConfirm = async () => {
        setLoading(true); setError('');
        const successfulOrders = [];
        try {
            // Allocate each box one by one
            for (const box of boxes) {
                const res = await allocateBox(terminal.id, box.id, durationHours);
                successfulOrders.push(res.data.data);
            }
            setOrders(successfulOrders);
        } catch (err) {
            setError(err.response?.data?.message || 'One or more bookings failed. Please check your orders.');
            // Even if one fails, we might have some successes, but for simplicity we error out
        } finally { setLoading(false) }
    }

    if (orders.length > 0) {
        return (
            <div className="page">
                <Navbar />
                <div className="container" style={{ maxWidth: 800, paddingTop: 48 }}>
                    <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
                        <div style={{ fontSize: '4rem', marginBottom: 16 }}>✅</div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>{orders.length} Booking(s) Confirmed!</h2>
                        <p className="text-muted mb-6">Your boxes at <b>{terminal.identifiableName}</b> are ready</p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 32 }}>
                            {orders.map(order => (
                                <div key={order.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius)', padding: 20, textAlign: 'left' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                        <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary-light)' }}>
                                            {BOX_ICONS[boxes.find(b => b.id === order.boxId)?.type] || '📦'} {order.boxName}
                                        </div>
                                        <div className="badge badge-success">{order.status}</div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                                        <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', padding: 12, borderRadius: 10 }}>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Drop-off Code</div>
                                            <div className="access-code-display" style={{ background: '#000', color: '#60a5fa', margin: '4px 0', padding: '10px', fontSize: '1.2rem' }}>{order.dropoffCode}</div>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.04)', padding: 12, borderRadius: 10 }}>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Valid Duration</div>
                                            <div style={{ fontWeight: 700, marginTop: 4 }}>{order.pickupWindow}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Order ID: {order.id}</div>
                                </div>
                            ))}
                        </div>

                        <div className="alert alert-info mb-6" style={{ textAlign: 'left' }}>
                            💡 You can find all your access codes anytime in the "My Orders" section. Use the Drop-off Code at the terminal to store your items.
                        </div>

                        <button className="btn btn-primary btn-full btn-lg" onClick={() => navigate('/orders')}>
                            View All My Orders →
                        </button>
                    </div>
                </div>
            </div>
        )
    }


    return (
        <div className="page">
            <Navbar />
            <div className="container" style={{ maxWidth: 640, paddingTop: 48 }}>
                <div className="card" style={{ padding: '40px 32px' }}>
                    <button className="btn btn-ghost btn-sm" style={{ marginBottom: 24 }} onClick={() => navigate(-1)}>
                        ← Back
                    </button>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>Confirm {boxes.length} Booking(s)</h2>
                    <p className="text-muted mb-4">Review your selected slots before reserving</p>

                    {error && <div className="alert alert-error">{error}</div>}

                    <div style={{ background: 'rgba(124,58,237,0.04)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 'var(--radius)', padding: 24, marginBottom: 24 }}>
                        <div style={{ marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 16 }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Terminal</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{terminal.identifiableName}</div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>{terminal.physicalLocation}</div>
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 12 }}>Items Summary</div>
                            {boxes.map(box => (
                                <div key={box.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed rgba(255,255,255,0.05)' }}>
                                    <span>{BOX_ICONS[box.type]} Box {box.identifiableName} ({box.type})</span>
                                    <span style={{ fontWeight: 600 }}>₹{PRICE_MAP[box.type]}</span>
                                </div>
                            ))}
                        </div>

                        <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 12 }}>Select Rental Duration</div>
                            <div className="flex gap-2 mb-4">
                                {[3, 6, 9, 24].map(h => (
                                    <button
                                        key={h}
                                        className={`btn flex-1 ${durationHours === h ? 'btn-primary' : 'btn-outline'}`}
                                        onClick={() => setDurationHours(h)}
                                    >
                                        {h === 24 ? '1 Day' : `${h}h`}
                                    </button>
                                ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '16px 20px', borderRadius: 12 }}>
                                <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Total Reservation Price:</span>
                                <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--success)' }}>₹{getPrice()}</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 24, padding: '12px 16px', background: 'rgba(59,130,246,0.06)', borderRadius: 10, border: '1px solid rgba(59,130,246,0.2)' }}>
                        💡 No immediate payment required. You will receive codes to drop-off items now, and only pay when you come back to pick them up. Overtime incurs a ₹20/hr late fee.
                    </div>

                    <button id="confirm-final-btn" className="btn btn-primary btn-full btn-lg" onClick={handleConfirm} disabled={loading}>
                        {loading ? <><span className="spinner" /> Reserving...</> : `Confirm & Reserve ${boxes.length} Box(es)`}
                    </button>
                </div>
            </div>
        </div>
    )
}
