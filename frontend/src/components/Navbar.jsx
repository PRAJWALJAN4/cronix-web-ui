import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
    const { user, logout, isAdmin } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const isActive = (path) => location.pathname.startsWith(path) ? 'active' : ''

    return (
        <nav className="navbar">
            <div className="nav-inner">
                <Link to="/terminals" className="nav-logo">
                    <img src="/logo.png" alt="SafeCloak" />
                </Link>
                <div className="nav-links">
                    {!isAdmin && <>
                        <Link to="/terminals" className={`nav-link ${isActive('/terminals')}`}>Terminals</Link>
                        <Link to="/orders" className={`nav-link ${isActive('/orders')}`}>My Orders</Link>
                    </>}
                    {isAdmin && <>
                        <Link to="/admin/terminals" className={`nav-link ${isActive('/admin/terminals')}`}>Terminals</Link>
                        <Link to="/admin/sites" className={`nav-link ${isActive('/admin/sites')}`}>Sites</Link>
                        <Link to="/admin/orders" className={`nav-link ${isActive('/admin/orders')}`}>Orders</Link>
                        <Link to="/admin/pricing" className={`nav-link ${isActive('/admin/pricing')}`}>Pricing</Link>
                        <Link to="/terminals" className={`nav-link`}>User View</Link>
                    </>}
                </div>
                <div className="nav-actions">
                    <span className="text-sm text-muted">{user?.name || user?.phoneNumber}</span>
                    {isAdmin && <span className="badge badge-primary" style={{ marginLeft: 4 }}>Admin</span>}
                    <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/login') }}>
                        Sign Out
                    </button>
                </div>
            </div>
        </nav>
    )
}
