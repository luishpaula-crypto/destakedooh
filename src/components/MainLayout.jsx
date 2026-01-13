import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Monitor,
    MapPin,
    Users,
    FileText,
    LogOut,
    LayoutDashboard,
    Wrench,
    Package,
    DollarSign,
    Calendar // Added Calendar Icon
} from 'lucide-react';
import clsx from 'clsx';

const SidebarItem = ({ to, icon: Icon, label }) => {
    const location = useLocation();
    const isActive = location.pathname.startsWith(to);

    return (
        <Link
            to={to}
            className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors mb-1",
                isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/30 font-medium"
                    : "text-secondary hover:bg-slate-100 hover:text-slate-900"
            )}
        >
            <Icon size={20} />
            <span>{label}</span>
        </Link>
    );
};

const MainLayout = () => {
    const { user, logout } = useAuth();

    return (
        <div className="flex h-screen bg-slate-50 print:block print:h-auto print:bg-white">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col p-6 overflow-y-auto print:hidden">
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/30">
                        D
                    </div>
                    <span className="font-bold text-slate-800 text-xl tracking-tight">DESTAKE DOOH</span>
                </div>

                <nav className="flex-1">
                    <SidebarItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                    <SidebarItem to="/assets" icon={Monitor} label="Ativos" />
                    <SidebarItem to="/maintenance" icon={Wrench} label="Manutenção" />
                    <SidebarItem to="/inventory" icon={Package} label="Estoque & Fabrica" />
                    <SidebarItem to="/finance" icon={DollarSign} label="Financeiro" />
                    <SidebarItem to="/clients" icon={Users} label="Clientes" />
                    <SidebarItem to="/quotes" icon={FileText} label="Orçamentos" />
                    <SidebarItem to="/programming" icon={Calendar} label="Programação" />
                    <SidebarItem to="/checkin" icon={MapPin} label="Check-in & Fotos" />
                </nav>

                <div className="mt-auto pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-3 px-4 py-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{user?.name || 'Usuário'}</p>
                            <p className="text-xs text-slate-500 truncate capitalize">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                    >
                        <LogOut size={18} />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto print:overflow-visible print:h-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
