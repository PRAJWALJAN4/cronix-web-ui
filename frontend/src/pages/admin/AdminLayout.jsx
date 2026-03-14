import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const links = [
    { to: '/admin/terminals', icon: '🏪', label: 'Terminals' },
    { to: '/admin/sites', icon: '📍', label: 'Sites' },
    { to: '/admin/orders', icon: '📋', label: 'Orders' },
    { to: '/admin/pricing', icon: '💰', label: 'Pricing' },
]

export default function AdminLayout() {
    const { logout } = useAuth()
    const navigate = useNavigate()
    return (
        <div className="admin-layout">
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <img src="/logo.png" alt="SafeCloak" />
                    <span>ADMIN</span>
                </div>
                <div className="sidebar-section">Management</div>
                {links.map(l => (
                    <NavLink key={l.to} to={l.to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                        <span>{l.icon}</span>{l.label}
                    </NavLink>
                ))}
                <div style={{ marginTop: 'auto', paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                    <NavLink to="/terminals" className="sidebar-link"><span>👤</span>User View</NavLink>
                    <button className="sidebar-link btn" style={{ width: '100%', justifyContent: 'flex-start', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--text-muted)', font: 'inherit' }} onClick={() => { logout(); navigate('/login') }}>
                        <span>🚪</span>Sign Out
                    </button>
                </div>
            </aside>
            <main className="admin-content">
                <Outlet />
            </main>
        </div>
    )
}
