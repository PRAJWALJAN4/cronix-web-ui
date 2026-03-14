import { useState, useEffect } from 'react'
import { processDropoff, processPickup, cancelOrder, openBox, closeBox, getMyOrders } from '../services/api'
import Navbar from '../components/Navbar'

const STATUS_BADGE = {
    RESERVED: ['badge-warning', '⏳ Reserved (Awaiting Drop-off)'],
    IN_PROGRESS: ['badge-primary', '🔒 In Use'],
    PAYMENT_PENDING: ['badge-danger', '💳 Penalty Due'],
    COMPLETED: ['badge-success', '✅ Completed'],
    EXPIRED: ['badge-danger', '⏰ Expired'],
    CANCELLED: ['badge-muted', '❌ Cancelled']
}

export default function OrdersPage() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState({})
    const [boxResults, setBoxResults] = useState({})
    const [tab, setTab] = useState('active')

    // Payment Modal State
    const [paymentOrder, setPaymentOrder] = useState(null)
    const [paymentLoading, setPaymentLoading] = useState(false)

    const fetchOrders = () => {
        setLoading(true)
        getMyOrders().then(r => setOrders(r.data.data || [])).finally(() => setLoading(false))
    }

    useEffect(() => { fetchOrders() }, [])

    const activeOrders = orders.filter(o => ['RESERVED', 'IN_PROGRESS', 'PAYMENT_PENDING'].includes(o.status))
    const pastOrders = orders.filter(o => ['COMPLETED', 'EXPIRED', 'CANCELLED'].includes(o.status))
    const displayed = tab === 'active' ? activeOrders : pastOrders

    const handleDropoff = async (order) => {
        setActionLoading(p => ({ ...p, [order.id]: true }))
        try {
            await processDropoff(order.id, order.dropoffCode)
            alert("Simulated physical drop-off! Box is securely locked.")
            fetchOrders()
            setBoxResults(p => ({ ...p, [order.boxId]: null }))
        } catch (err) { alert(err.response?.data?.message || 'Error simulating drop-off') }
        finally { setActionLoading(p => ({ ...p, [order.id]: false })) }
    }

    const handlePickup = async (order) => {
        setActionLoading(p => ({ ...p, [order.id]: true }))
        try {
            await processPickup(order.id, "dummy", false)
            alert("Rental ended and Box unlocked successfully!")
            fetchOrders()
            // Reset box mock open state to show success immediately
            setBoxResults(p => ({ ...p, [order.boxId]: { status: 'OPENED', message: 'Box automatically unlocked!' } }))
        } catch (err) {
            if (err.response?.data?.data?.amountDue) {
                setPaymentOrder({ order, code: "dummy", amount: err.response.data.data.amountDue })
            } else {
                alert(err.response?.data?.message || 'Error unlocking box')
            }
        }
        finally { setActionLoading(p => ({ ...p, [order.id]: false })) }
    }

    const handleProcessPayment = async () => {
        if (!paymentOrder) return;
        setPaymentLoading(true);
        // Simulate gateway
        setTimeout(async () => {
            try {
                await processPickup(paymentOrder.order.id, paymentOrder.code, true)
                alert("Payment successful! Box unlocked.")
                setPaymentOrder(null)
                fetchOrders()
            } catch (err) { alert("Payment flow failed") }
            finally { setPaymentLoading(false) }
        }, 1500)
    }

    const generateBill = (order) => {
        const h = `
            <html><body style="font-family: Arial; padding: 40px; max-width: 600px; margin: auto;">
                <h1 style="color: #6366f1;">SafeCloak Receipt</h1>
                <hr/>
                <p><b>Order ID:</b> ${order.id}</p>
                <p><b>Date:</b> ${new Date(order.dateCreated).toLocaleString()}</p>
                <p><b>Box:</b> ${order.boxName}</p>
                <hr/>
                <table style="width: 100%; text-align: left; margin-bottom: 20px;">
                    <tr><th style="padding-bottom:10px">Description</th><th style="padding-bottom:10px">Amount</th></tr>
                    <tr><td>Base Slot Price (${order.durationHours || '?'}h)</td><td>₹${order.slotPrice}</td></tr>
                    ${order.penaltyAmount > 0 ? `<tr><td style="padding-top:10px">Late Fee Penalty</td><td style="color:red; padding-top:10px">₹${order.penaltyAmount}</td></tr>` : ''}
                </table>
                <hr/>
                <h2 style="text-align: right">Total Paid: ₹${order.totalAmount || order.slotPrice}</h2>
                <div style="text-align: center; margin-top: 40px; color: #888;">Thank you for using SafeCloak!</div>
                <script>window.print();</script>
            </body></html>
        `;
        const blob = new Blob([h], { type: 'text/html' });
        window.open(URL.createObjectURL(blob), '_blank');
    }

    const handleOpenBox = async (order) => {
        setActionLoading(p => ({ ...p, [`open_${order.boxId}`]: true }))
        try {
            const res = await openBox(order.boxId, order.otp)
            setBoxResults(p => ({ ...p, [order.boxId]: res.data.data }))
            fetchOrders()
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to open box')
        } finally {
            setActionLoading(p => ({ ...p, [`open_${order.boxId}`]: false }))
        }
    }

    const handleCloseBox = async (order) => {
        setActionLoading(p => ({ ...p, [`close_${order.boxId}`]: true }))
        try {
            const res = await closeBox(order.boxId)
            setBoxResults(p => ({ ...p, [order.boxId]: res.data.data }))
            fetchOrders()
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to close box')
        } finally {
            setActionLoading(p => ({ ...p, [`close_${order.boxId}`]: false }))
        }
    }

    return (
        <div className="page">
            <Navbar />
            <div className="container">
                <div className="page-header">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="page-title">📋 My Orders</h1>
                            <p className="page-subtitle">{activeOrders.length} active · {pastOrders.length} past</p>
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={fetchOrders}>🔄 Refresh</button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    {['active', 'past'].map(t => (
                        <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t)}>
                            {t === 'active' ? `Active (${activeOrders.length})` : `History (${pastOrders.length})`}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="loading-center"><div className="spinner spinner-lg" /><span>Loading orders...</span></div>
                ) : displayed.length === 0 ? (
                    <div className="empty-state">
                        <div className="icon">{tab === 'active' ? '📭' : '📁'}</div>
                        <h3>{tab === 'active' ? 'No active orders' : 'No past orders'}</h3>
                        <p>{tab === 'active' ? 'Book a locker box to get started' : 'Your completed orders will appear here'}</p>
                    </div>
                ) : displayed.map(order => {
                    const [badgeCls, badgeLabel] = STATUS_BADGE[order.status] || ['badge-muted', order.status]
                    const isActive = ['RESERVED', 'IN_PROGRESS', 'PAYMENT_PENDING'].includes(order.status)
                    const boxResult = boxResults[order.boxId]

                    return (
                        <div key={order.id} className="card order-card">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Order ID</div>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{order.id}</div>
                                </div>
                                <span className={`badge ${badgeCls}`}>{badgeLabel}</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px 14px', borderRadius: 10 }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>Box</div>
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-light)' }}>{order.boxName}</div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px 14px', borderRadius: 10 }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>Price</div>
                                    <div style={{ fontWeight: 700 }}>₹{order.slotPrice}</div>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px 14px', borderRadius: 10 }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>Valid For</div>
                                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{order.pickupWindow}</div>
                                </div>
                            </div>

                            {isActive && order.dropoffCode && order.status === 'RESERVED' && (
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Drop-off Code</div>
                                    <div className="access-code-display" style={{ fontSize: '2rem', padding: '12px 24px', background: 'rgba(0,0,0,0.4)' }}>{order.dropoffCode}</div>
                                </div>
                            )}

                            {/* Removed Pickup Code display so user has to generate it via the Simulated Pick-up flow */}

                            {boxResult && (
                                <div className="alert alert-success" style={{ marginBottom: 12 }}>
                                    {boxResult.message}
                                </div>
                            )}

                            {isActive && (
                                <div className="flex gap-2 flex-wrap mt-2">
                                    {order.status === 'RESERVED' && (
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handleDropoff(order)}
                                            disabled={actionLoading[order.id]}
                                        >
                                            {actionLoading[order.id] ? <span className="spinner" /> : '📦'} Simulate Physical Drop-off
                                        </button>
                                    )}
                                    {(order.status === 'IN_PROGRESS' || order.status === 'PAYMENT_PENDING') && (
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => handlePickup(order)}
                                            disabled={actionLoading[order.id]}
                                        >
                                            {actionLoading[order.id] ? <span className="spinner" /> : '🔓'} End Rental & Open Box
                                        </button>
                                    )}
                                </div>
                            )}
                            {order.status === 'COMPLETED' && (
                                <button className="btn btn-ghost btn-sm" onClick={() => generateBill(order)}>
                                    📄 Download Bill
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Payment Modal */}
            {paymentOrder && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div className="card" style={{ width: 400, padding: 32 }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 16 }}>💳 Checkout</h2>
                        <p className="text-muted mb-6">Payment required to release Box {paymentOrder.order.boxName}. This includes your base slot price and any applicable overtime late fees.</p>

                        <div style={{ padding: 16, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, marginBottom: 24, display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#60a5fa' }}>Total Due:</span>
                            <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#60a5fa' }}>₹{paymentOrder.amount}</span>
                        </div>

                        <div className="form-group"><label className="form-label">Dummy Card</label><input className="form-input" disabled value="**** **** **** 4242" /></div>

                        <button className="btn btn-primary btn-full btn-lg mt-4" onClick={handleProcessPayment} disabled={paymentLoading}>
                            {paymentLoading ? <><span className="spinner" /> Processing...</> : `Pay ₹${paymentOrder.amount} & Unlock Box`}
                        </button>
                        <button className="btn btn-ghost btn-full mt-2" onClick={() => setPaymentOrder(null)} disabled={paymentLoading}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
