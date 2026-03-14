import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { sendOtp, verifyOtp, adminLogin } from '../services/api'

export default function LoginPage() {
    const [mode, setMode] = useState('phone') // phone | otp | admin
    const [phone, setPhone] = useState('')
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [adminPass, setAdminPass] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { login } = useAuth()
    const navigate = useNavigate()
    const otpRefs = useRef([])

    const handleSendOtp = async (e) => {
        e.preventDefault()
        if (phone.length < 10) { setError('Enter a valid phone number'); return }
        setLoading(true); setError('')
        try {
            await sendOtp(phone)
            setMode('otp')
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP')
        } finally { setLoading(false) }
    }

    const handleOtpChange = (i, val) => {
        if (val.length > 1) val = val.slice(-1)
        const newOtp = [...otp]
        newOtp[i] = val
        setOtp(newOtp)
        if (val && i < 5) otpRefs.current[i + 1]?.focus()
    }

    const handleOtpKey = (i, e) => {
        if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus()
    }

    const handleVerifyOtp = async (e) => {
        e.preventDefault()
        const otpStr = otp.join('')
        if (otpStr.length < 6) { setError('Enter the 6-digit OTP'); return }
        setLoading(true); setError('')
        try {
            const res = await verifyOtp(phone, otpStr)
            const data = res.data.data
            login(data.token, { phoneNumber: data.phoneNumber, name: data.name, isAdmin: false })
            navigate('/terminals')
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP')
        } finally { setLoading(false) }
    }

    const handleAdminLogin = async (e) => {
        e.preventDefault()
        setLoading(true); setError('')
        try {
            const res = await adminLogin(phone, adminPass)
            const data = res.data.data
            login(data.token, { phoneNumber: data.phoneNumber, name: data.name, isAdmin: true })
            navigate('/admin')
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials')
        } finally { setLoading(false) }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    <img src="/logo.png" alt="SafeCloak" />
                    <h1>Welcome to SafeCloak</h1>
                    <p>Smart Locker Rental System</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                {mode === 'phone' && (
                    <form onSubmit={handleSendOtp}>
                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input
                                id="phone-input"
                                className="form-input"
                                type="tel"
                                placeholder="Enter your phone number"
                                value={phone}
                                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                                maxLength={10}
                                autoFocus
                            />
                        </div>
                        <button id="send-otp-btn" className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
                            {loading ? <><span className="spinner" /> Sending OTP...</> : '📱 Send OTP'}
                        </button>
                        <div style={{ marginTop: 16, textAlign: 'center' }}>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setMode('admin'); setError('') }}>
                                🔐 Admin Login
                            </button>
                        </div>
                    </form>
                )}

                {mode === 'otp' && (
                    <form onSubmit={handleVerifyOtp}>
                        <p className="text-muted text-sm mb-4">OTP sent to <strong>+91 {phone}</strong></p>
                        <div className="otp-inputs">
                            {otp.map((val, i) => (
                                <input
                                    key={i}
                                    ref={el => otpRefs.current[i] = el}
                                    id={`otp-${i}`}
                                    className="otp-input"
                                    type="text" inputMode="numeric" pattern="[0-9]*"
                                    maxLength={1} value={val}
                                    onChange={e => handleOtpChange(i, e.target.value)}
                                    onKeyDown={e => handleOtpKey(i, e)}
                                    autoFocus={i === 0}
                                />
                            ))}
                        </div>
                        <button id="verify-otp-btn" className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
                            {loading ? <><span className="spinner" /> Verifying...</> : '✅ Verify & Login'}
                        </button>
                        <div style={{ marginTop: 12, textAlign: 'center' }}>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setMode('phone'); setOtp(['', '', '', '', '', '']); setError('') }}>
                                ← Back
                            </button>
                        </div>
                    </form>
                )}

                {mode === 'admin' && (
                    <form onSubmit={handleAdminLogin}>
                        <div className="form-group">
                            <label className="form-label">Admin Phone</label>
                            <input className="form-input" type="tel" placeholder="0000000000"
                                value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input id="admin-pass-input" className="form-input" type="password" placeholder="Enter admin password"
                                value={adminPass} onChange={e => setAdminPass(e.target.value)} />
                        </div>
                        <div className="alert alert-info" style={{ marginBottom: 12, fontSize: '0.8rem' }}>
                            Demo: phone <strong>0000000000</strong> / password <strong>admin123</strong>
                        </div>
                        <button id="admin-login-btn" className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
                            {loading ? <><span className="spinner" /> Signing in...</> : '🛡️ Admin Sign In'}
                        </button>
                        <div style={{ marginTop: 12, textAlign: 'center' }}>
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setMode('phone'); setError('') }}>
                                ← User Login
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
