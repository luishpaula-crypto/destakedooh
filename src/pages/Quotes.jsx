import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { generateQuotePDF, generatePIPDF } from '../utils/pdfGenerator';
import { FileText, Plus, Check, X, Printer, DollarSign, Edit, Play, Lock, MapPin, Camera, Search, Trash2 } from 'lucide-react';
import clsx from 'clsx';

const Quotes = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { clients: CLIENTS = [], assets: ASSETS = [], quotes = [], addQuote, updateQuote, deleteQuote, transactions = [], addTransaction } = useData();
    const [activeTab, setActiveTab] = useState('list'); // 'list' or 'form'

    // Form State
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [newNote, setNewNote] = useState('');
    const [formData, setFormData] = useState({
        clientId: '',
        selectedAssetIds: [],
        discount: 0,
        observations: ''
    });

    const updateStatus = (id, newStatus) => {
        const quote = quotes.find(q => q.id === id);
        if (quote) {
            // Prepare Base Payload
            const payload = {
                id: quote.id,
                status: newStatus
            };

            // Specific Logic for 'aprovado'
            if (newStatus === 'aprovado') {
                if (!quote.mediaStatus) payload.media_status = 'pending';
                if (!quote.piGeneratedAt) payload.pi_generated_at = new Date().toISOString();

                // Automation: Create Finance Transaction
                const alreadyExists = transactions.some(t => t.quote_id === quote.id);
                if (!alreadyExists) {
                    addTransaction({
                        description: `Recebimento - ${quote.campaignName} (Ref. ${quote.controlNumber || 'S/N'})`,
                        type: 'income',
                        category: 'Vendas',
                        amount: quote.total,
                        due_date: new Date().toISOString().split('T')[0],
                        status: 'pending',
                        client_id: quote.client?.id,
                        quote_id: quote.id,
                        tax_type: null
                    });
                }
            }

            // Execute Update
            updateQuote(payload);

            // Automation: If status changed to 'enviado', download PDF and open email
            if (newStatus === 'enviado') {
                try {
                    // 1. Generate & Download PDF
                    generateQuotePDF(quote).then(() => {
                        // 2. Open Email Client
                        const clientEmail = (quote.client && quote.client.email) ? quote.client.email : ''; // Safe Access
                        const subject = `Proposta Comercial ${quote.controlNumber ? `- ${quote.controlNumber}` : ''} - ${quote.campaignName || ''}`;
                        const body = `Olá ${quote.client?.contact_name ? quote.client.contact_name.split(' ')[0] : 'Cliente'},\n\nSegue em anexo a proposta comercial referente à campanha "${quote.campaignName || ''}".\n\nFico à disposição para qualquer dúvida.\n\nAtenciosamente,\n\n${user?.name || 'Comercial'}`;

                        const mailtoLink = `mailto:${clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

                        // Use timeout to ensure PDF download initiates first
                        setTimeout(() => {
                            window.location.href = mailtoLink;
                            alert("📄 PDF Baixado!\n\nSeu cliente de e-mail foi aberto.\n⚠️ Importante: O navegador não consegue anexar arquivos automaticamente. Por favor, arraste o PDF baixado para o email antes de enviar.");
                        }, 500);
                    });

                } catch (error) {
                    console.error("Erro na automação:", error);
                }
            }
        }
    };

    const [filterPeriod, setFilterPeriod] = useState({ start: '', end: '' });
    const [filterStatus, setFilterStatus] = useState('');

    const filteredQuotes = quotes.filter(quote => {
        // Text Search
        const term = searchTerm.toLowerCase();
        const matchesName = (quote.campaignName || '').toLowerCase().includes(term);
        const clientName = quote.client?.name || '';
        const matchesClient = clientName.toLowerCase().includes(term);
        const controlString = String(quote.controlNumber || '');
        const matchesControl = controlString.includes(term) || `prop-${controlString}`.includes(term);
        const matchesSearch = matchesName || matchesClient || matchesControl;

        // Status Filter
        const matchesStatus = filterStatus ? quote.status === filterStatus : true;

        // Date Range Filter (Based on CreatedAt or Campaign Start? Usually Report is by Campaign Period or Creation. Let's use Creation for "Sales Report" logic, or Campaign Start. Let's use Campaign Start for operational relevance)
        // Actually for "Quotes Report", Creation Date is often standard, but for "Campaigns" it's Start.
        // Let's use StartDate for relevance to "periodo".
        let matchesDate = true;
        if (filterPeriod.start && quote.startDate) {
            matchesDate = matchesDate && new Date(quote.startDate) >= new Date(filterPeriod.start);
        }
        if (filterPeriod.end && quote.startDate) {
            matchesDate = matchesDate && new Date(quote.startDate) <= new Date(filterPeriod.end);
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    const handleExportReport = () => {
        const periodText = filterPeriod.start && filterPeriod.end
            ? `Período: ${new Date(filterPeriod.start).toLocaleDateString()} a ${new Date(filterPeriod.end).toLocaleDateString()}`
            : 'Filtro: Geral';

        import('../utils/pdfGenerator').then(mod => {
            mod.generateQuotesReport(filteredQuotes, periodText);
        });
    };

    // --- ACTIONS ---

    // Helper: Calculate days between dates
    const calculateDays = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return 0; // Handle invalid dates gracefully
        }

        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1; // Inclusive
    };

    // Helper: Local Date to string YYYY-MM-DD
    const getLocalDate = (daysToAdd = 0) => {
        const d = new Date();
        d.setDate(d.getDate() + daysToAdd);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().split('T')[0];
    };

    const handleNewQuote = () => {
        setEditingId(null);
        setFormData({
            clientId: '',
            campaignName: '',
            startDate: getLocalDate(0), // Today
            endDate: getLocalDate(14), // Today + 14 days
            selectedAssetIds: [],
            quotas: 1,
            discount: 0,
            observations: ''
        });
        setActiveTab('form');
    };

    const handleEditQuote = (quote) => {
        if (quote.status === 'finalizado') {
            alert("Campanhas finalizadas não podem ser editadas.");
            return;
        }
        setEditingId(quote.id);
        const startDate = quote.startDate ? new Date(quote.startDate).toISOString().split('T')[0] : '';
        const endDate = quote.endDate ? new Date(quote.endDate).toISOString().split('T')[0] : '';

        setFormData({
            clientId: quote.client.id,
            campaignName: quote.campaignName || '',
            startDate,
            endDate,
            selectedAssetIds: (quote.assets || []).map(a => a.id),
            quotas: quote.quotas || 1,
            days: quote.days,
            discount: quote.discountPct || 0,
            observations: quote.observations || ''
        });
        setNewNote('');
        setActiveTab('form');
    };

    const handleSaveQuote = () => {
        const client = CLIENTS.find(c => c.id === formData.clientId);
        const assets = ASSETS.filter(a => formData.selectedAssetIds.includes(a.id));

        if (!client) {
            alert('Por favor, selecione um cliente.');
            return;
        }

        if (assets.length === 0) {
            alert('Por favor, selecione pelo menos um ativo (painel).');
            return;
        }

        if (!formData.startDate || !formData.endDate) {
            alert('Por favor, defina o período da campanha.');
            return;
        }

        const days = calculateDays(formData.startDate, formData.endDate);

        const subtotal = assets.reduce((acc, curr) => {
            const price = parseFloat(curr.valor_tabela_unit || curr.daily_rate || 0);
            return acc + (price * days);
        }, 0) * (parseFloat(formData.quotas) || 1);

        const discountPct = parseFloat(formData.discount) || 0;
        const discountAmount = subtotal * (discountPct / 100);
        const total = subtotal - discountAmount;

        let finalObservations = formData.observations;
        if (newNote && newNote.trim()) {
            const timestamp = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            const userLabel = user?.name || 'Usuário';
            const noteEntry = `[${timestamp}] ${userLabel}:\n${newNote}`;
            finalObservations = (finalObservations ? finalObservations + '\n\n' : '') + noteEntry;
        }

        const quoteData = {
            // DB Columns (snake_case)
            client: client, // Stored as JSONB
            campaign_name: formData.campaignName || `Campanha ${client.name}`,
            start_date: formData.startDate,
            end_date: formData.endDate,
            assets: assets, // Stored as JSONB
            days: days,
            quotas: parseFloat(formData.quotas) || 1,
            discount_pct: discountPct,
            discount: discountAmount,
            total,
            observations: finalObservations,
            status: editingId ? quotes.find(q => q.id === editingId).status : 'rascunho',
            created_at: new Date()
        };

        if (editingId) {
            updateQuote({ ...quoteData, id: editingId });
        } else {
            addQuote(quoteData);
        }

        setActiveTab('list');
    };

    const toggleAssetSelection = (id) => {
        setFormData(prev => ({
            ...prev,
            selectedAssetIds: prev.selectedAssetIds.includes(id)
                ? prev.selectedAssetIds.filter(x => x !== id)
                : [...prev.selectedAssetIds, id]
        }));
    };

    // Helper to update endDate when duration changes
    const handleDurationChange = (days) => {
        if (!formData.startDate) return;

        // Allow clearing the field or invalid input to be handled by parseInt
        const d = parseInt(days);
        if (isNaN(d) || d < 1) {
            // If input is empty or invalid, we don't update endDate,
            // allowing the input field to reflect the user's typing
            // or revert to the calculated currentDays on re-render if not actively typing.
            return;
        }

        const start = new Date(formData.startDate);
        const end = new Date(start);
        end.setDate(start.getDate() + (d - 1));
        setFormData(prev => ({
            ...prev,
            endDate: end.toISOString().split('T')[0]
        }));
    };

    const currentDays = calculateDays(formData.startDate, formData.endDate);

    const currentSubtotal = ASSETS
        .filter(a => formData.selectedAssetIds.includes(a.id))
        .reduce((acc, curr) => {
            const price = parseFloat(curr.valor_tabela_unit || curr.daily_rate || 0);
            return acc + (price * currentDays);
        }, 0) * (parseFloat(formData.quotas) || 1);

    const currentDiscountVal = currentSubtotal * ((parseFloat(formData.discount) || 0) / 100);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Orçamentos</h1>
                    <p className="text-slate-500 mt-1">Gerenciamento e Aprovação de Propostas</p>
                </div>
                {activeTab === 'list' && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleExportReport}
                            className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <Printer size={20} />
                            <span>Exportar Relatório</span>
                        </button>
                        <button
                            onClick={handleNewQuote}
                            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <Plus size={20} />
                            <span>Novo Orçamento</span>
                        </button>
                    </div>
                )}
            </div>

            {activeTab === 'list' ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {/* Search Bar & Advanced Filters */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por cliente, campanha ou Nº de controle..."
                                className="w-full pl-10 p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Filters Row */}
                        <div className="flex flex-wrap gap-4 items-end justify-between pb-2">
                            {/* Status Pills */}
                            <div className="flex flex-wrap gap-2 w-full md:w-auto">
                                {[
                                    { id: '', label: 'Todos', color: 'bg-slate-100 text-slate-600' },
                                    { id: 'rascunho', label: 'Rascunho', color: 'bg-slate-200 text-slate-700' },
                                    { id: 'enviado', label: 'Enviado', color: 'bg-blue-100 text-blue-700' },
                                    { id: 'aprovado', label: 'Aprovado', color: 'bg-indigo-100 text-indigo-700' },
                                    { id: 'ativo', label: 'Ativo', color: 'bg-emerald-100 text-emerald-700' },
                                    { id: 'finalizado', label: 'Finalizado', color: 'bg-gray-100 text-gray-600' },
                                    { id: 'perdido', label: 'Perdido', color: 'bg-red-100 text-red-700' },
                                ].map(status => (
                                    <button
                                        key={status.id}
                                        onClick={() => setFilterStatus(status.id)}
                                        className={clsx(
                                            "px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                                            filterStatus === status.id
                                                ? `${status.color} border-transparent shadow-sm ring-2 ring-offset-1 ring-slate-200`
                                                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                                        )}
                                    >
                                        {status.label}
                                    </button>
                                ))}
                            </div>

                            {/* Date Filters */}
                            <div className="flex gap-4 items-center">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">De</label>
                                    <input
                                        type="date"
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                                        value={filterPeriod.start}
                                        onChange={e => setFilterPeriod({ ...filterPeriod, start: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Até</label>
                                    <input
                                        type="date"
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                                        value={filterPeriod.end}
                                        onChange={e => setFilterPeriod({ ...filterPeriod, end: e.target.value })}
                                    />
                                </div>
                                {(filterStatus || filterPeriod.start || filterPeriod.end) && (
                                    <button
                                        onClick={() => { setFilterStatus(''); setFilterPeriod({ start: '', end: '' }); }}
                                        className="px-3 py-2 text-red-500 text-sm font-medium hover:bg-red-50 rounded-lg self-end"
                                    >
                                        Limpar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {filteredQuotes.map((quote, index) => (
                            <div
                                key={quote.id}
                                className={clsx(
                                    "mb-4 rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow relative",
                                    index % 2 === 0 ? "bg-white" : "bg-slate-50",
                                    {
                                        'rascunho': "border-l-4 border-l-slate-400",
                                        'enviado': "border-l-4 border-l-blue-500",
                                        'aprovado': "border-l-4 border-l-indigo-500",
                                        'ativo': "border-l-4 border-l-emerald-500",
                                        'finalizado': "border-l-4 border-l-slate-300",
                                        'perdido': "border-l-4 border-l-red-400"
                                    }[quote.status]
                                )}
                            >
                                <div className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-bold text-slate-800 text-lg">
                                                {quote.campaignName || 'Campanha Sem Nome'}
                                            </h3>
                                            {quote.status === 'ativo' && (
                                                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full animate-pulse">
                                                    <Play size={10} fill="currentColor" /> No Ar
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-slate-500 text-sm mb-4 flex items-center gap-2">
                                            <span className="font-medium text-slate-700">{quote.client?.name || 'Cliente N/A'}</span>
                                            <span className="text-slate-300">•</span>
                                            <span>{quote.controlNumber ? `PROP-${quote.controlNumber}` : 'S/N'}</span>
                                        </p>

                                        <div className="flex gap-6 text-sm">
                                            <div>
                                                <p className="text-slate-400 text-xs mb-0.5">Ativos</p>
                                                <p className="font-medium text-slate-700">{(quote.assets || []).length}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 text-xs mb-0.5">Duração</p>
                                                <p className="font-medium text-slate-700">{quote.days || 0} dias</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 text-xs mb-0.5">Período</p>
                                                <p className="font-medium text-slate-700">
                                                    {quote.startDate ? `${new Date(quote.startDate).toLocaleDateString()} - ${new Date(quote.endDate).toLocaleDateString()}` : 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 text-xs mb-0.5">Total</p>
                                                <p className="font-bold text-primary">R$ {(quote.total || 0).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 w-full md:w-auto mt-4 md:mt-0 justify-between md:justify-end">
                                        <div className="relative">
                                            <select
                                                className={clsx(
                                                    "appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all",
                                                    {
                                                        'rascunho': "bg-slate-100 text-slate-600 focus:ring-slate-200",
                                                        'enviado': "bg-blue-50 text-blue-600 focus:ring-blue-200",
                                                        'aprovado': "bg-primary/10 text-primary focus:ring-primary/20",
                                                        'ativo': "bg-emerald-50 text-emerald-600 focus:ring-emerald-200",
                                                        'finalizado': "bg-slate-100 text-slate-400 focus:ring-slate-200",
                                                        'perdido': "bg-red-50 text-red-600 focus:ring-red-200"
                                                    }[quote.status]
                                                )}
                                                value={quote.status}
                                                onChange={(e) => updateStatus(quote.id, e.target.value)}
                                                disabled={quote.status === 'finalizado' && user.role !== 'admin'}
                                            >
                                                <option value="rascunho">Rascunho</option>
                                                <option value="enviado">Enviado</option>
                                                <option value="aprovado">Aprovado</option>
                                                {(quote.status === 'ativo' || quote.status === 'aprovado') && (
                                                    <option value="ativo" disabled>Ativo (Automático)</option>
                                                )}
                                                <option value="perdido">Perdido</option>
                                                <option value="finalizado">Finalizado</option>
                                            </select>
                                        </div>

                                        <div className="flex gap-2">
                                            {/* Edit */}
                                            {['rascunho', 'enviado', 'aprovado', 'ativo'].includes(quote.status) && (
                                                <button onClick={() => handleEditQuote(quote)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                                                    <Edit size={18} />
                                                </button>
                                            )}

                                            {/* Check-in */}
                                            {(quote.status === 'aprovado' || quote.status === 'ativo') && (
                                                <button
                                                    onClick={() => navigate('/checkin', { state: { quoteId: quote.id } })}
                                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="Check-in Fotos"
                                                >
                                                    <Camera size={18} />
                                                </button>
                                            )}

                                            {/* PI (If Approved) */}
                                            {(quote.status === 'aprovado' || quote.status === 'ativo' || quote.piGeneratedAt) && (
                                                <button
                                                    onClick={() => {
                                                        const freshAssets = (quote.assets || []).map(qa => ASSETS.find(a => a.id === qa.id) || qa);
                                                        generatePIPDF({ ...quote, assets: freshAssets });
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Baixar PI (Pedido de Inserção)"
                                                >
                                                    <FileText size={18} />
                                                </button>
                                            )}

                                            {/* PDF Generic */}
                                            <button
                                                onClick={() => {
                                                    const freshAssets = (quote.assets || []).map(qa => ASSETS.find(a => a.id === qa.id) || qa);
                                                    generateQuotePDF({ ...quote, assets: freshAssets });
                                                }}
                                                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                                title="Gerar PDF"
                                            >
                                                <Printer size={18} />
                                            </button>

                                            {/* Admin Delete */}
                                            {user.role === 'admin' && (
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Tem certeza que deseja excluir este orçamento?')) {
                                                            deleteQuote(quote.id);
                                                        }
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2"
                                                    title="Excluir Orçamento"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div >
                            </div >
                        ))}
                    </div >
                </div >
            ) : (
                /* FORM (New/Edit) */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {/* 1. Details */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">1</span>
                                Detalhes da Campanha
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {editingId && (
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Número do Orçamento</label>
                                        <input
                                            type="text"
                                            readOnly
                                            className="w-full p-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-600 font-mono"
                                            value={quotes.find(q => q.id === editingId)?.controlNumber ? `PROP-${quotes.find(q => q.id === editingId).controlNumber}` : 'Será gerado ao salvar'}
                                        />
                                    </div>
                                )}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Campanha</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-slate-200 rounded-lg"
                                        placeholder="Ex: Lançamento Verão 2025"
                                        value={formData.campaignName}
                                        onChange={e => setFormData({ ...formData, campaignName: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
                                    <select
                                        className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
                                        value={formData.clientId}
                                        onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        {CLIENTS.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Início</label>
                                    <input
                                        type="date"
                                        className="w-full p-2 border border-slate-200 rounded-lg"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Fim</label>
                                    <input
                                        type="date"
                                        className="w-full p-2 border border-slate-200 rounded-lg"
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">2</span>
                                Ativos
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {ASSETS.map(asset => (
                                    <div
                                        key={asset.id}
                                        onClick={() => toggleAssetSelection(asset.id)}
                                        className={clsx(
                                            "p-3 rounded-lg border cursor-pointer transition-all relative overflow-hidden",
                                            formData.selectedAssetIds.includes(asset.id)
                                                ? "border-primary bg-primary/5"
                                                : "border-slate-100 hover:border-slate-300"
                                        )}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="font-bold text-slate-800 text-sm truncate pr-4">{asset.name || 'Sem Nome'}</div>
                                            {formData.selectedAssetIds.includes(asset.id) && <div className="text-primary"><Check size={16} /></div>}
                                        </div>

                                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                                            <MapPin size={10} /> {(asset.cidade && asset.bairro) ? `${asset.bairro} - ${asset.cidade}` : (asset.address || 'Localização N/A')}
                                        </div>

                                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100/50">
                                            <div className="text-[10px] text-slate-400 uppercase tracking-wide">
                                                {[asset.type, asset.resolution].filter(Boolean).join(' • ')}
                                            </div>
                                            <div className="font-bold text-primary text-xs">
                                                R$ {((typeof asset.valor_tabela_unit === 'number' ? asset.valor_tabela_unit : Number(asset.daily_rate)) || 0).toLocaleString()}/dia
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>


                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit sticky top-6 space-y-6">
                        {/* 3. Conditions (Moved to Right) */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs">3</span>
                                Condições
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Duração (Dias)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="w-full p-2 border border-slate-200 rounded-lg"
                                        value={currentDays}
                                        onChange={e => handleDurationChange(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Cotas</label>
                                    <select
                                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                                        value={formData.quotas}
                                        onChange={e => setFormData({ ...formData, quotas: parseFloat(e.target.value) || 1 })}
                                    >
                                        <option value={0.5}>0.5 (Meia Cota)</option>
                                        <option value={1}>1 (Cota Inteira)</option>
                                        <option value={2}>2 (Cota Dupla)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Desconto (%)</label>
                                    <input
                                        type="number" min="0" max="100"
                                        className="w-full p-2 border border-slate-200 rounded-lg"
                                        value={formData.discount}
                                        onChange={e => setFormData({ ...formData, discount: Math.min(100, parseFloat(e.target.value) || 0) })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-slate-800 text-xl mb-4 flex items-center justify-between">
                                {user.role === 'admin' ? 'Editar Histórico (Admin)' : 'Histórico de Notas'}
                            </h3>

                            {/* Admin: Full Edit Mode */}
                            {user.role === 'admin' ? (
                                <textarea
                                    className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-yellow-50 focus:ring-yellow-500/20 min-h-[200px]"
                                    placeholder="Histórico completo..."
                                    value={formData.observations}
                                    onChange={e => setFormData({ ...formData, observations: e.target.value })}
                                />
                            ) : (
                                /* Sales: Read-Only History + Add Note */
                                <>
                                    <div className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-slate-50 min-h-[100px] max-h-[200px] overflow-y-auto whitespace-pre-wrap text-slate-600 mb-3">
                                        {formData.observations || <span className="text-slate-400 italic">Nenhuma observação registrada.</span>}
                                    </div>

                                    <label className="block text-sm font-medium text-slate-700 mb-1">Adicionar Nota</label>
                                    <textarea
                                        className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-yellow-50 focus:ring-yellow-500/20"
                                        placeholder="Digite uma nova nota..."
                                        value={newNote}
                                        onChange={e => setNewNote(e.target.value)}
                                    />
                                </>
                            )}
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-slate-800 text-xl mb-6">Resumo</h3>
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-slate-600">
                                    <span>Subtotal</span>
                                    <span>R$ {currentSubtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Desconto ({formData.discount}%)</span>
                                    <span className="text-green-600">- R$ {currentDiscountVal.toLocaleString()}</span>
                                </div>
                                <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-slate-800 text-lg">
                                    <span>Total</span>
                                    <span>R$ {(currentSubtotal - currentDiscountVal).toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setActiveTab('list')}
                                    className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveQuote}
                                    className="flex-1 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark shadow-sm"
                                >
                                    {editingId ? 'Salvar Alterações' : 'Criar Orçamento'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default Quotes;
