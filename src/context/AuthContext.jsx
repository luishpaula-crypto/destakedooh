import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Check local storage for persisted session
        const storedUser = localStorage.getItem('dooh_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (role, name) => {
        const newUser = {
            id: Date.now().toString(),
            name: name,
            role: role, // 'admin', 'sales', 'user'
            email: `${role}@doohmanager.com`
        };
        setUser(newUser);
        localStorage.setItem('dooh_user', JSON.stringify(newUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('dooh_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};
