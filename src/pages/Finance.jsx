import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    PieChart,
    Plus,
    Search,
    Calendar,
    FileText,
    CheckCircle,
    AlertCircle,
    Clock
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

const Finance = () => {
    const { user } = useAuth();
    const { transactions, addTransaction, updateTransaction, deleteTransaction } = useData();
    const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, payable, receivable, taxes
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [transactionForm, setTransactionForm] = useState(null);

    // --- METRICS ---
    const totalIncome = transactions
        .filter(t => t.type === 'income' && t.status === 'paid')
        .reduce((acc, t) => acc + t.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense' && t.status === 'paid')
        .reduce((acc, t) => acc + t.amount, 0);

    const balance = totalIncome - totalExpense;

    const projectedIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((acc, t) => acc + t.amount, 0);

    const projectedExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amount, 0);

    const projectedBalance = projectedIncome - projectedExpense;

    // --- FILTERED DATA ---
    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.category.toLowerCase().includes(searchTerm.toLowerCase());

        if (activeTab === 'payable') return t.type === 'expense' && matchesSearch;
        if (activeTab === 'receivable') return t.type === 'income' && matchesSearch;
        if (activeTab === 'taxes') return t.category === 'Impostos' && matchesSearch;

        return matchesSearch; // For dashboard list or general
    });

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString();

    // --- ACTIONS ---
    const handleOpenModal = (type = 'expense') => {
        setTransactionForm({
            description: '',
            amount: 0,
            type: type, // income or expense
            category: 'Geral',
            dueDate: new Date().toISOString().split('T')[0],
            status: 'pending' // pending, paid, late
        });
        setShowModal(true);
    };

    const handleSaveTransaction = () => {
        if (!transactionForm.description || !transactionForm.amount) return alert("Preencha descrição e valor");

        if (transactionForm.id) {
            updateTransaction(transactionForm);
        } else {
            addTransaction(transactionForm);
        }
        setShowModal(false);
    };

    const handleMarkAsPaid = (transaction) => {
        updateTransaction({ ...transaction, status: 'paid' });
    };

    const getStatusBadge = (status, dueDate) => {
        const isLate = status === 'pending' && new Date(dueDate) < new Date();
        const displayStatus = isLate ? 'late' : status;

        return (
            <span className={clsx(
                "px-2 py-1 rounded-full text-xs font-bold uppercase",
                {
                    'paid': "bg-green-100 text-green-700",
                    'pending': "bg-yellow-100 text-yellow-700",
                    'late': "bg-red-100 text-red-700"
                }[displayStatus]
            )}>
                {{
                    'paid': 'Pago/Recebido',
                    'pending': 'Pendente',
                    'late': 'Atrasado'
                }[displayStatus]}
            </span>
        );
    };

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={clsx(
                "flex items-center gap-2 px-6 py-3 border-b-2 transition-colors font-medium text-sm",
                activeTab === id
                    ? "border-indigo-600 text-indigo-600 bg-indigo-50"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            )}
        >
            <Icon size={18} />
            {label}
        </button>
    );

    // --- TAX LOGIC ---
    const [taxRate, setTaxRate] = useState(6); // Default 6% Simples Nacional
    const estimatedTax = (projectedIncome * taxRate) / 100;
    const taxesPaid = transactions
        .filter(t => t.category === 'Impostos' && t.status === 'paid')
        .reduce((acc, t) => acc + t.amount, 0);
    const taxesPending = transactions
        .filter(t => t.category === 'Impostos' && t.status === 'pending')
        .reduce((acc, t) => acc + t.amount, 0);

    // --- ALERTS LOGIC ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueTransactions = transactions.filter(t => {
        if (t.status !== 'pending') return false;
        const due = new Date(t.dueDate + 'T00:00:00'); // Ensure local time interpretation/ISO fix
        return due < today;
    });

    const upcomingTransactions = transactions.filter(t => {
        if (t.status !== 'pending') return false;
        const due = new Date(t.dueDate + 'T00:00:00');
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 3;
    });

    // --- HISTORY LOGIC ---
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // First day of current month
        end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]  // Last day of current month
    });

    const historyTransactions = transactions.filter(t => {
        if (activeTab !== 'history') return false;
        if (!t.dueDate) return false;
        return t.dueDate >= dateRange.start && t.dueDate <= dateRange.end;
    }).sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));

    const historyIncome = historyTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const historyExpense = historyTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const historyBalance = historyIncome - historyExpense;

    const currentTableData = activeTab === 'history' ? historyTransactions : filteredTransactions;


    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        Gestão Financeira
                    </h1>
                    <p className="text-slate-500 mt-1">Fluxo de Caixa, Contas a Pagar e Receber</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleOpenModal('income')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
                    >
                        <TrendingUp size={18} />
                        Nova Receita
                    </button>
                    <button
                        onClick={() => handleOpenModal('expense')}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
                    >
                        <TrendingDown size={18} />
                        Nova Despesa
                    </button>
                    <button
                        onClick={() => { setActiveTab('taxes'); handleOpenModal('expense'); setTransactionForm(prev => ({ ...prev, category: 'Impostos', description: 'Imposto Ref. ' })); }}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
                    >
                        <FileText size={18} />
                        Lançar Imposto
                    </button>
                </div>
            </div>

            {/* DASHBOARD CARDS */}
            {activeTab === 'dashboard' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <DollarSign size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">Saldo Atual (Realizado)</p>
                                    <h3 className={clsx("text-2xl font-bold", balance >= 0 ? "text-slate-800" : "text-red-600")}>
                                        {formatCurrency(balance)}
                                    </h3>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                    <TrendingUp size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">Projeção de Entradas</p>
                                    <h3 className="text-2xl font-bold text-slate-800">
                                        {formatCurrency(projectedIncome)}
                                    </h3>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                    <TrendingDown size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">Projeção de Saídas</p>
                                    <h3 className="text-2xl font-bold text-slate-800">
                                        {formatCurrency(projectedExpense)}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ALERTS SECTION */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Overdue */}
                        <div className="bg-red-50 rounded-xl border border-red-100 p-6">
                            <h3 className="text-red-800 font-bold flex items-center gap-2 mb-4">
                                <AlertCircle size={20} />
                                Contas em Atraso
                            </h3>
                            <div className="space-y-3">
                                {overdueTransactions.length > 0 ? overdueTransactions.map(t => (
                                    <div key={t.id} className="bg-white p-3 rounded-lg border border-red-100 shadow-sm flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-slate-800">{t.description}</p>
                                            <p className="text-xs text-red-500 font-medium">Venceu em: {formatDate(t.dueDate)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-900">{formatCurrency(t.amount)}</p>
                                            <button
                                                onClick={() => handleMarkAsPaid(t)}
                                                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded mt-1 hover:bg-green-200 transition-colors"
                                            >
                                                Pagar
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-sm text-red-400 italic">Nenhuma conta em atraso.</p>
                                )}
                            </div>
                        </div>

                        {/* Upcoming */}
                        <div className="bg-amber-50 rounded-xl border border-amber-100 p-6">
                            <h3 className="text-amber-800 font-bold flex items-center gap-2 mb-4">
                                <Clock size={20} />
                                Vencendo em Breve (3 dias)
                            </h3>
                            <div className="space-y-3">
                                {upcomingTransactions.length > 0 ? upcomingTransactions.map(t => (
                                    <div key={t.id} className="bg-white p-3 rounded-lg border border-amber-100 shadow-sm flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-slate-800">{t.description}</p>
                                            <p className="text-xs text-amber-600 font-medium">Vence em: {formatDate(t.dueDate)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-900">{formatCurrency(t.amount)}</p>
                                            <button
                                                onClick={() => handleMarkAsPaid(t)}
                                                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded mt-1 hover:bg-green-200 transition-colors"
                                            >
                                                {t.type === 'income' ? 'Receber' : 'Pagar'}
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-sm text-amber-500/70 italic">Nada vencendo nos próximos 3 dias.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* HISTORY SUMMARY */}
            {activeTab === 'history' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Entradas no Período</p>
                            <p className="text-xl font-bold text-green-600">{formatCurrency(historyIncome)}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                            <TrendingDown size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Saídas no Período</p>
                            <p className="text-xl font-bold text-red-600">{formatCurrency(historyExpense)}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Resultado do Período</p>
                            <p className={clsx("text-xl font-bold", historyBalance >= 0 ? "text-blue-600" : "text-red-500")}>
                                {formatCurrency(historyBalance)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* TAX DASHBOARD */}
            {activeTab === 'taxes' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">Faturamento Total</p>
                        <h3 className="text-xl font-bold text-slate-800">{formatCurrency(projectedIncome)}</h3>
                        <p className="text-xs text-slate-400 mt-1">Base de Cálculo</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">Alíquota Estimada</p>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={taxRate}
                                onChange={e => setTaxRate(parseFloat(e.target.value))}
                                className="w-16 p-1 border border-slate-200 rounded text-center font-bold text-slate-800"
                            />
                            <span className="font-bold text-slate-600">%</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Simples/Lucro Presumido</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm bg-orange-50 border-orange-100">
                        <p className="text-xs text-orange-600 font-bold uppercase mb-1">Imposto Estimado (Ref)</p>
                        <h3 className="text-xl font-bold text-orange-700">{formatCurrency(estimatedTax)}</h3>
                        <p className="text-xs text-orange-500/80 mt-1">A Pagar (Provisão)</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-xs text-slate-500 font-bold uppercase mb-1">Situação Real</p>
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xs text-green-600 font-bold">Pago: {formatCurrency(taxesPaid)}</p>
                                <p className="text-xs text-red-500 font-bold">Pendente: {formatCurrency(taxesPending)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TABS */}
            <div className="bg-white rounded-t-xl border-b border-slate-200 flex mb-0 overflow-x-auto">
                <TabButton id="dashboard" label="Visão Geral" icon={PieChart} />
                <TabButton id="history" label="Histórico" icon={Clock} />
                <TabButton id="payable" label="Contas a Pagar" icon={TrendingDown} />
                <TabButton id="receivable" label="Contas a Receber" icon={TrendingUp} />
                <TabButton id="taxes" label="Painel Fiscal" icon={FileText} />
            </div>

            {/* CONTENT AREA */}
            <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-slate-200 min-h-[500px] p-6">

                {/* TOOLBAR FOR LISTS */}
                {activeTab !== 'dashboard' && activeTab !== 'history' && (
                    <div className="mb-6 flex gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder={activeTab === 'taxes' ? "Buscar imposto..." : "Buscar transação..."}
                                className="w-full pl-10 p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {/* TOOLBAR FOR HISTORY */}
                {activeTab === 'history' && (
                    <div className="mb-6 bg-slate-50 p-4 rounded-lg flex flex-wrap items-center gap-4 border border-slate-100">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-600 flex items-center gap-1"><Calendar size={16} /> Início:</span>
                            <input
                                type="date"
                                className="border border-slate-300 rounded px-2 py-1 text-sm text-slate-700 focus:outline-none focus:border-indigo-500"
                                value={dateRange.start}
                                onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-600 flex items-center gap-1"><Calendar size={16} /> Fim:</span>
                            <input
                                type="date"
                                className="border border-slate-300 rounded px-2 py-1 text-sm text-slate-700 focus:outline-none focus:border-indigo-500"
                                value={dateRange.end}
                                onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            />
                        </div>
                    </div>
                )}

                {/* VISUALIZATION SWITCH */}
                {activeTab === 'dashboard' ? (
                    <div className="text-center py-12 text-slate-500">
                        <div className="max-w-md mx-auto bg-slate-50 rounded-xl p-8 border border-dashed border-slate-300">
                            <PieChart className="mx-auto mb-4 text-slate-300" size={48} />
                            <h3 className="text-lg font-bold text-slate-700 mb-2">Resumo Financeiro</h3>
                            <p className="text-sm">Selecione as abas acima para gerenciar suas contas a pagar, receber e impostos detalhadamente.</p>
                        </div>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3">Data Venc.</th>
                                <th className="px-4 py-3">Descrição</th>
                                <th className="px-4 py-3">Categoria</th>
                                <th className="px-4 py-3">Valor</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(activeTab === 'history' ? historyTransactions : filteredTransactions).map(t => (
                                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-4 font-medium text-slate-600">
                                        {formatDate(t.dueDate)}
                                    </td>
                                    <td className="px-4 py-4">
                                        <p className="font-bold text-slate-800">{t.description}</p>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium border border-slate-200">
                                            {t.category}
                                        </span>
                                    </td>
                                    <td className={clsx("px-4 py-4 font-bold", t.type === 'income' ? 'text-green-600' : 'text-slate-800')}>
                                        {formatCurrency(t.amount)}
                                    </td>
                                    <td className="px-4 py-4">
                                        {getStatusBadge(t.status, t.dueDate)}
                                    </td>
                                    <td className="px-4 py-4 text-right flex justify-end gap-2">
                                        {t.status !== 'paid' && (
                                            <button
                                                onClick={() => handleMarkAsPaid(t)}
                                                className="text-green-600 hover:bg-green-50 p-1.5 rounded"
                                                title="Marcar como Pago"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                        )}
                                        {user.role === 'admin' && (
                                            <button
                                                onClick={() => deleteTransaction(t.id)}
                                                className="text-slate-400 hover:text-red-500 p-1.5 rounded"
                                                title="Excluir"
                                            >
                                                <AlertCircle size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {(activeTab === 'history' ? historyTransactions : filteredTransactions).length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 italic">
                                        Nenhuma transação encontrada.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* TRANSACTION MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            {transactionForm.type === 'income' ? <TrendingUp className="text-green-600" /> : <TrendingDown className="text-red-600" />}
                            {transactionForm.id ? 'Editar Transação' : (transactionForm.type === 'income' ? 'Nova Receita' : 'Nova Despesa')}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                                <input
                                    className="w-full p-2 border border-slate-200 rounded-lg"
                                    value={transactionForm.description}
                                    onChange={e => setTransactionForm({ ...transactionForm, description: e.target.value })}
                                    placeholder="Ex: Aluguel Dezembro"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border border-slate-200 rounded-lg"
                                        value={transactionForm.amount}
                                        onChange={e => setTransactionForm({ ...transactionForm, amount: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Vencimento</label>
                                    <input
                                        type="date"
                                        className="w-full p-2 border border-slate-200 rounded-lg"
                                        value={transactionForm.dueDate}
                                        onChange={e => setTransactionForm({ ...transactionForm, dueDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                                <select
                                    className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                                    value={transactionForm.category}
                                    onChange={e => setTransactionForm({ ...transactionForm, category: e.target.value })}
                                >
                                    <option>Geral</option>
                                    <option>Vendas</option>
                                    <option>Aluguel</option>
                                    <option>Energia</option>
                                    <option>Manutenção</option>
                                    <option>Pessoal</option>
                                    <option>Impostos</option>
                                    <option>Infraestrutura</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                    <select
                                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                                        value={transactionForm.status}
                                        onChange={e => setTransactionForm({ ...transactionForm, status: e.target.value })}
                                    >
                                        <option value="pending">Pendente</option>
                                        <option value="paid">{transactionForm.type === 'income' ? 'Recebido' : 'Pago'}</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveTransaction}
                                className={clsx(
                                    "flex-1 py-2 text-white rounded-lg font-bold",
                                    transactionForm.type === 'income' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                                )}
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Finance;
