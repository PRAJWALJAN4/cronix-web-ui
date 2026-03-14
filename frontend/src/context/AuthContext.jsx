import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [token, setToken] = useState(localStorage.getItem('sc_token'))
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('sc_user') || 'null') }
        catch { return null }
    })

    const login = (tokenVal, userData) => {
        setToken(tokenVal)
        setUser(userData)
        localStorage.setItem('sc_token', tokenVal)
        localStorage.setItem('sc_user', JSON.stringify(userData))
    }

    const logout = () => {
        setToken(null)
        setUser(null)
        localStorage.removeItem('sc_token')
        localStorage.removeItem('sc_user')
    }

    const isAdmin = user?.isAdmin || false

    return (
        <AuthContext.Provider value={{ token, user, login, logout, isAdmin }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
