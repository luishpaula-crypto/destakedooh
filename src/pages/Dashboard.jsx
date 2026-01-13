import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { TrendingUp, Users, MonitorPlay, DollarSign, AlertCircle, CheckCircle, FileText, Printer, Check, Lock, X, Wrench } from 'lucide-react';
import clsx from 'clsx';

const StatCard = ({ icon: Icon, label, value, subtext, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
            <Icon size={24} />
        </div>
        <div>
            <p className="text-slate-500 text-sm font-medium">{label}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
    </div>
);

// ... ProgressBar component (unchanged) ...
const ProgressBar = ({ label, value, total, color, icon: Icon }) => {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

    return (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Icon size={16} /> {label}
                </span>
                <span className="text-sm font-bold text-slate-800">{value} ({percentage}%)</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div
                    className={`h-2.5 rounded-full ${color}`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { user } = useAuth();
    const { quotes = [], assets = [], clients = [], maintenances = [] } = useData();

    const metrics = useMemo(() => {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);

        let totalQuotes = 0;
        let approvedCount = 0;
        let lostCount = 0;
        let negotiationCount = 0;
        let negotiationValue = 0;
        let revenueWeek = 0;
        let revenueMonth = 0;
        let revenueYear = 0;

        quotes.forEach(q => {
            totalQuotes++;
            const qDate = new Date(q.createdAt);
            const isApproved = q.status === 'aprovado' || q.status === 'finalizado';

            if (isApproved) {
                approvedCount++;
                if (qDate >= startOfWeek) revenueWeek += q.total;
                if (qDate >= startOfMonth) revenueMonth += q.total;
                if (qDate >= startOfYear) revenueYear += q.total;
            } else if (q.status === 'perdido') {
                lostCount++;
            } else if (q.status === 'enviado' || q.status === 'rascunho') {
                // "Em Negociação" includes Sent and Draft (potential revenue)
                negotiationCount++;
                negotiationValue += q.total || 0;
            }
        });

        // Maintenance Stats
        const activeMaintenance = maintenances.filter(m => m.status !== 'resolvido' && m.status !== 'concluido').length;

        return {
            totalQuotes,
            approvedCount,
            lostCount,
            negotiationCount,
            negotiationValue,
            revenueWeek,
            revenueMonth,
            revenueYear,
            activeMaintenance
        };
    }, [quotes, maintenances]);

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Olá, {user?.name || 'Usuário'}</h1>
                <p className="text-slate-500 mt-1">Bem-vindo ao painel de controle DOOH.</p>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatCard
                    icon={MonitorPlay}
                    label="Painéis Ativos"
                    value={assets.length}
                    color="bg-blue-100 text-blue-600"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Em Negociação"
                    value={metrics.negotiationCount}
                    subtext={formatCurrency(metrics.negotiationValue)}
                    color="bg-primary/20 text-primary"
                />
                <StatCard
                    icon={CheckCircle}
                    label="Vendas"
                    value={metrics.approvedCount}
                    color="bg-green-100 text-green-600"
                />
                <StatCard
                    icon={Wrench}
                    label="Manutenção"
                    value={metrics.activeMaintenance}
                    color="bg-red-100 text-red-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Financial Performance */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <DollarSign className="text-green-400" /> Resultados Financeiros
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                                <p className="text-slate-300 text-sm mb-1 uppercase tracking-wider font-semibold">Esta Semana</p>
                                <p className="text-2xl font-bold text-white">{formatCurrency(metrics.revenueWeek)}</p>
                            </div>
                            <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                                <p className="text-slate-300 text-sm mb-1 uppercase tracking-wider font-semibold">Este Mês</p>
                                <p className="text-2xl font-bold text-green-400">{formatCurrency(metrics.revenueMonth)}</p>
                            </div>
                            <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                                <p className="text-slate-300 text-sm mb-1 uppercase tracking-wider font-semibold">Este Ano</p>
                                <p className="text-2xl font-bold text-white">{formatCurrency(metrics.revenueYear)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">Atividade Recente</h2>
                        <div className="space-y-4">
                            {quotes.slice(0, 5).map((quote) => (
                                <div key={quote.id} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors px-2 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                            {quote.client.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{quote.client.name}</p>
                                            <p className="text-xs text-slate-500">
                                                {new Date(quote.createdAt).toLocaleDateString()} • {formatCurrency(quote.total)}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={clsx(
                                        "px-2.5 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1.5 border",
                                        {
                                            'rascunho': "bg-slate-50 text-slate-600 border-slate-200",
                                            'enviado': "bg-blue-50 text-blue-700 border-blue-200",
                                            'aprovado': "bg-emerald-50 text-emerald-700 border-emerald-200",
                                            'finalizado': "bg-purple-50 text-purple-700 border-purple-200",
                                            'perdido': "bg-red-50 text-red-700 border-red-200",
                                            'active': "bg-emerald-50 text-emerald-700 border-emerald-200",
                                            'ativo': "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        }[quote.status]
                                    )}>
                                        {{
                                            'rascunho': <FileText size={12} />,
                                            'enviado': <Printer size={12} />,
                                            'aprovado': <Check size={12} />,
                                            'finalizado': <Lock size={12} />,
                                            'perdido': <X size={12} />,
                                            'active': <Check size={12} />,
                                            'ativo': <Check size={12} />
                                        }[quote.status]}
                                        {quote.status}
                                    </span>
                                </div>
                            ))}
                            {quotes.length === 0 && <p className="text-slate-500 text-center py-4">Nenhuma atividade recente.</p>}
                        </div>
                    </div>
                </div>

                {/* Sales Funnel / Metrics */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit">
                    <h2 className="text-lg font-bold text-slate-800 mb-6">Taxa de Sucesso</h2>

                    <div className="space-y-6">
                        <ProgressBar
                            label="Em Negociação"
                            value={metrics.negotiationCount}
                            total={metrics.totalQuotes}
                            color="bg-indigo-500"
                            icon={Printer}
                        />

                        <ProgressBar
                            label="Orçamentos Fechados"
                            value={metrics.approvedCount}
                            total={metrics.totalQuotes}
                            color="bg-green-500"
                            icon={CheckCircle}
                        />

                        <ProgressBar
                            label="Orçamentos Perdidos"
                            value={metrics.lostCount}
                            total={metrics.totalQuotes}
                            color="bg-red-500"
                            icon={AlertCircle}
                        />

                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Pipeline (Funil)</h3>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-slate-600">Em Negociação</span>
                                <span className="font-bold text-indigo-600">
                                    {formatCurrency(metrics.negotiationValue)}
                                </span>
                            </div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-slate-600">Total Ofertado</span>
                                <span className="font-bold text-slate-800">
                                    {formatCurrency(quotes.reduce((acc, q) => acc + q.total, 0))}
                                </span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-slate-600">Ticket Médio</span>
                                <span className="font-bold text-slate-800">
                                    {metrics.totalQuotes > 0
                                        ? formatCurrency(quotes.reduce((acc, q) => acc + q.total, 0) / metrics.totalQuotes)
                                        : 'R$ 0,00'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
