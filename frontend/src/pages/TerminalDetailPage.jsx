import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTerminal, getBoxLayout, getUserTerminalMetadata } from '../services/api'
import Navbar from '../components/Navbar'
import CustomLockerGrid from '../components/CustomLockerGrid'

const BOX_ICONS = { SMALL: '📦', MEDIUM: '📫', LARGE: '🗄️', EXTRA_LARGE: '🏗️' }
const BOX_STATUS_CLASS = {
    EMPTY_CLOSED: 'available', BOOKED: 'booked',
    OCCUPIED_OPEN: 'occupied', OCCUPIED_CLOSED: 'occupied',
    DISABLED: 'disabled', BLOCKED: 'disabled',
    AWAITING_PAYMENT: 'booked'
}

const PRICE_MAP = { SMALL: 30, MEDIUM: 50, LARGE: 80, EXTRA_LARGE: 120 }
const ROWS = ['A', 'B', 'C', 'D']
const COLS = [1, 2, 3, 4, 5]

export default function TerminalDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [terminal, setTerminal] = useState(null)
    const [meta, setMeta] = useState(null)
    const [boxes, setBoxes] = useState([])
    const [selectedBoxes, setSelectedBoxes] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([getTerminal(id), getBoxLayout(id), getUserTerminalMetadata(id)]).then(([tRes, bRes, mRes]) => {
            setTerminal(tRes.data.data)
            setBoxes(bRes.data.data || [])
            setMeta(mRes.data.data)
        }).finally(() => setLoading(false))
    }, [id])

    const getBox = (row, col) => boxes.find(b => b.rw === row && b.col === col)

    const handleSelect = (box) => {
        if (!box || box.boxStatus !== 'EMPTY_CLOSED') return
        setSelectedBoxes(prev => {
            const exists = prev.find(b => b.id === box.id)
            if (exists) return prev.filter(b => b.id !== box.id)
            return [...prev, box]
        })
    }

    const handleConfirm = () => {
        if (selectedBoxes.length === 0) return
        navigate('/book/confirm', { state: { terminal, boxes: selectedBoxes } })
    }

    const available = boxes.filter(b => b.boxStatus === 'EMPTY_CLOSED').length
    const total = boxes.length

    return (
        <div className="page">
            <Navbar />
            <div className="container">
                {loading ? (
                    <div className="loading-center"><div className="spinner spinner-lg" /><span>Loading terminal...</span></div>
                ) : (
                    <>
                        <div className="page-header">
                            <div className="flex items-center gap-3">
                                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/terminals')}>← Back</button>
                                <div>
                                    <h1 className="page-title">🏪 {terminal?.identifiableName}</h1>
                                    <p className="page-subtitle">📍 {terminal?.physicalLocation}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid-2" style={{ gap: 24 }}>
                            {/* Box Grid */}
                            <div>
                                <div className="hero-gradient" style={{ padding: 24, marginBottom: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <div>
                                            <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Select Your Boxes</h3>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                {available}/{total} boxes available · Select multiple slots
                                            </p>
                                        </div>
                                    </div>

                                    <CustomLockerGrid
                                        mode="live"
                                        initialLayoutData={meta?.gridLayout ? JSON.parse(meta.gridLayout) : null}
                                        boxStatuses={boxes.reduce((acc, box) => ({ ...acc, [box.identifiableName]: box.boxStatus }), {})}
                                        selectedBoxes={selectedBoxes}
                                        onBoxSelect={(block) => {
                                            const actualBox = boxes.find(b => b.identifiableName === block.identifiableName);
                                            if (actualBox) handleSelect(actualBox);
                                        }}
                                    />

                                </div>
                            </div>

                            {/* Selection Panel */}
                            <div>
                                {selectedBoxes.length > 0 ? (
                                    <div className="card" style={{ borderColor: 'var(--primary)', background: 'rgba(124,58,237,0.06)' }}>
                                        <div style={{ padding: '12px 0' }}>
                                            <h3 style={{ fontWeight: 800, marginBottom: 16, textAlign: 'center' }}>
                                                Selected Slots ({selectedBoxes.length})
                                            </h3>

                                            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: 24 }}>
                                                {selectedBoxes.map(box => (
                                                    <div key={box.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.04)', padding: '12px', borderRadius: 12, marginBottom: 8, border: '1px solid rgba(124,58,237,0.2)' }}>
                                                        <div style={{ fontSize: '1.5rem' }}>{BOX_ICONS[box.type]}</div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: 700, color: 'var(--primary-light)' }}>Box {box.identifiableName}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{box.type} · Row {box.rw}, Col {box.col}</div>
                                                        </div>
                                                        <div style={{ fontWeight: 800 }}>₹{PRICE_MAP[box.type]}</div>
                                                        <button
                                                            className="btn btn-ghost btn-xs"
                                                            style={{ padding: '4px 8px', color: 'var(--danger)' }}
                                                            onClick={(e) => { e.stopPropagation(); handleSelect(box); }}
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: 12, marginBottom: 20 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Estimated Price (3h):</span>
                                                    <span style={{ fontWeight: 700 }}>₹{selectedBoxes.reduce((sum, b) => sum + PRICE_MAP[b.type], 0)}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: 700 }}>Total To Pay Later:</span>
                                                    <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--success)' }}>
                                                        ₹{selectedBoxes.reduce((sum, b) => sum + PRICE_MAP[b.type], 0)}
                                                    </span>
                                                </div>
                                            </div>

                                            <button id="confirm-booking-btn" className="btn btn-primary btn-full btn-lg" onClick={handleConfirm}>
                                                Confirm {selectedBoxes.length} Booking(s) →
                                            </button>
                                            <button className="btn btn-ghost btn-sm mt-2 btn-full" onClick={() => setSelectedBoxes([])}>
                                                Clear All
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="card">
                                        <div className="empty-state" style={{ padding: '40px 16px' }}>
                                            <div className="icon">👆</div>
                                            <h3>Select Boxes</h3>
                                            <p>Click on any available boxes in the layout to select them</p>
                                        </div>
                                        <div style={{ marginTop: 12 }}>
                                            <div style={{ padding: '12px 0', borderTop: '1px solid var(--border)' }}>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8 }}>Box Pricing</div>
                                                {['SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE'].map(t => (
                                                    <div key={t} className="flex justify-between items-center" style={{ padding: '6px 0', fontSize: '0.85rem' }}>
                                                        <span>{BOX_ICONS[t]} {t}</span>
                                                        <span className="font-bold" style={{ color: 'var(--primary-light)' }}>₹{PRICE_MAP[t]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Availability Stats */}
                                <div className="card mt-4">
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, textAlign: 'center' }}>
                                        <div><div className="stat-value" style={{ color: 'var(--success)' }}>{available}</div><div className="stat-label">Available</div></div>
                                        <div><div className="stat-value" style={{ color: 'var(--warning)' }}>{boxes.filter(b => b.boxStatus === 'BOOKED').length}</div><div className="stat-label">Booked</div></div>
                                        <div><div className="stat-value">{total}</div><div className="stat-label">Total</div></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
