import { useState, useEffect } from 'react'
import { getAllOrders, updateOrderStatus, markOrderReady } from '../../services/api'

const STATUS_BADGE = {
    RESERVED: 'badge-warning', READY_FOR_PICKUP: 'badge-info',
    IN_PROGRESS: 'badge-primary', COMPLETED: 'badge-success',
    EXPIRED: 'badge-danger', CANCELLED: 'badge-muted', BOX_NA: 'badge-danger'
}
const ALL_STATUSES = ['RESERVED', 'READY_FOR_PICKUP', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'CANCELLED']

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('ALL')

    const fetch = () => getAllOrders().then(r => setOrders(r.data.data || [])).finally(() => setLoading(false))
    useEffect(() => { fetch() }, [])

    const displayed = filter === 'ALL' ? orders : orders.filter(o => o.status === filter)

    const handleStatus = async (id, status) => { await updateOrderStatus(id, status); fetch() }
    const handleReady = async (id) => { await markOrderReady(id); fetch() }

    return (
        <div className="page" style={{ padding: 32 }}>
            <div className="flex justify-between items-center mb-6">
                <div><h1 className="page-title">📋 Orders</h1><p className="page-subtitle">{orders.length} total orders</p></div>
                <button className="btn btn-ghost btn-sm" onClick={fetch}>🔄 Refresh</button>
            </div>

            {/* Stats */}
            <div className="grid-4 mb-6">
                {[['RESERVED', '⏳', orders.filter(o => o.status === 'RESERVED').length], ['READY_FOR_PICKUP', '📦', orders.filter(o => o.status === 'READY_FOR_PICKUP').length], ['COMPLETED', '✅', orders.filter(o => o.status === 'COMPLETED').length], ['EXPIRED', '⏰', orders.filter(o => o.status === 'EXPIRED').length]].map(([s, icon, count]) => (
                    <div key={s} className="card stat-card" onClick={() => setFilter(filter === s ? 'ALL' : s)} style={{ cursor: 'pointer', borderColor: filter === s ? 'var(--primary)' : 'var(--border)' }}>
                        <div style={{ fontSize: '1.5rem' }}>{icon}</div>
                        <div className="stat-value">{count}</div>
                        <div className="stat-label">{s.replace(/_/g, ' ')}</div>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div className="flex gap-2 mb-4 flex-wrap">
                {['ALL', ...ALL_STATUSES].map(s => (
                    <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(s)}>
                        {s.replace(/_/g, ' ')}
                    </button>
                ))}
            </div>

            {loading ? <div className="loading-center"><div className="spinner spinner-lg" /></div> : (
                <div className="card">
                    <div className="table-wrap">
                        <table>
                            <thead><tr><th>Order ID</th><th>Phone</th><th>Box</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                                {displayed.map(o => (
                                    <tr key={o.id}>
                                        <td className="text-sm">{o.id}</td>
                                        <td>{o.phoneNumber}</td>
                                        <td><strong>{o.boxName}</strong></td>
                                        <td>₹{o.slotPrice}</td>
                                        <td><span className={`badge ${STATUS_BADGE[o.status] || 'badge-muted'}`}>{o.status?.replace(/_/g, ' ')}</span></td>
                                        <td>
                                            <div className="flex gap-1 flex-wrap">
                                                {o.status === 'RESERVED' && (
                                                    <button className="btn btn-sm btn-ghost" onClick={() => handleReady(o.id)}>Mark Ready</button>
                                                )}
                                                <select className="form-select" style={{ padding: '4px 8px', fontSize: '0.75rem', width: 'auto' }} value={o.status} onChange={e => handleStatus(o.id, e.target.value)}>
                                                    {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {displayed.length === 0 && <div className="empty-state"><div className="icon">📋</div><h3>No orders</h3></div>}
                    </div>
                </div>
            )}
        </div>
    )
}
