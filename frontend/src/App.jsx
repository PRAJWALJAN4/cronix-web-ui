import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import TerminalListPage from './pages/TerminalListPage'
import TerminalDetailPage from './pages/TerminalDetailPage'
import BookingConfirmPage from './pages/BookingConfirmPage'
import OrdersPage from './pages/OrdersPage'
import AdminLayout from './pages/admin/AdminLayout'
import AdminSitesPage from './pages/admin/AdminSitesPage'
import AdminTerminalsPage from './pages/admin/AdminTerminalsPage'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import AdminPricingPage from './pages/admin/AdminPricingPage'
import ProfilePage from './pages/ProfilePage'

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { token, isAdmin } = useAuth()
    if (!token) return <Navigate to="/login" />
    if (adminOnly && !isAdmin) return <Navigate to="/terminals" />
    return children
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/" element={<Navigate to="/terminals" />} />
                    <Route path="/terminals" element={<ProtectedRoute><TerminalListPage /></ProtectedRoute>} />
                    <Route path="/terminals/:id" element={<ProtectedRoute><TerminalDetailPage /></ProtectedRoute>} />
                    <Route path="/book/confirm" element={<ProtectedRoute><BookingConfirmPage /></ProtectedRoute>} />
                    <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
                        <Route index element={<Navigate to="/admin/terminals" />} />
                        <Route path="sites" element={<AdminSitesPage />} />
                        <Route path="terminals" element={<AdminTerminalsPage />} />
                        <Route path="orders" element={<AdminOrdersPage />} />
                        <Route path="pricing" element={<AdminPricingPage />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/terminals" />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}
