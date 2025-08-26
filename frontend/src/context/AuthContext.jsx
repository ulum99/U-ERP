import { createContext, useState, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [activeBranch, setActiveBranch] = useState(localStorage.getItem('activeBranch') || null);
    const [isSuperUser, setIsSuperUser] = useState(JSON.parse(localStorage.getItem('isSuperUser')) || false);
    
    const login = async (email, password) => {
        const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
        const { user, token } = response.data;
        
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        localStorage.setItem('isSuperUser', JSON.stringify(user.isSuperUser));
        
        // Set cabang pertama sebagai cabang aktif secara default
        const defaultBranch = user.accessibleBranches?.[0];
        if (defaultBranch) {
            localStorage.setItem('activeBranch', defaultBranch);
            setActiveBranch(defaultBranch);
        }

        setUser(user);
        setToken(token);
        setIsSuperUser(user.isSuperUser);
        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('activeBranch');
        setUser(null);
        setToken(null);
        setActiveBranch(null);
        setIsSuperUser(false);
    };

    const value = { user, token, isSuperUser,activeBranch, setActiveBranch, login, logout };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};