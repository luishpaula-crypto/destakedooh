import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Briefcase, LayoutDashboard } from 'lucide-react';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = (role, name) => {
        login(role, name);
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                        <LayoutDashboard size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">DESTAKE DOOH</h1>
                    <p className="text-slate-500 mt-2">Entre para acessar sua conta</p>
                </div>

                <div className="p-8 space-y-4">
                    <button
                        onClick={() => handleLogin('admin', 'Admin User')}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-100 hover:border-primary hover:bg-slate-50 transition-all group"
                    >
                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Shield size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-slate-800">Administrador</h3>
                            <p className="text-sm text-slate-500">Acesso total ao sistema</p>
                        </div>
                    </button>

                    <button
                        onClick={() => handleLogin('sales', 'Vendedor Lucas')}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-100 hover:border-primary hover:bg-slate-50 transition-all group"
                    >
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Briefcase size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-slate-800">Vendedor</h3>
                            <p className="text-sm text-slate-500">Criar orçamentos e vendas</p>
                        </div>
                    </button>

                    <button
                        onClick={() => handleLogin('user', 'Cliente Padrão')}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-100 hover:border-primary hover:bg-slate-50 transition-all group"
                    >
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                            <User size={24} />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-slate-800">Usuário</h3>
                            <p className="text-sm text-slate-500">Visualização de check-ins</p>
                        </div>
                    </button>
                </div>

                <div className="bg-slate-50 p-4 text-center text-xs text-slate-400">
                    Demo Version v1.0.0
                </div>
            </div>
        </div>
    );
};

export default Login;
