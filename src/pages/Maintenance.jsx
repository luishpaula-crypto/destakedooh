import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { generateMaintenanceReport } from '../utils/pdfGenerator';
import { Wrench, Plus, Search, Filter, AlertTriangle, CheckCircle, Clock, MapPin, DollarSign, Calendar, Printer, Pencil } from 'lucide-react';
import clsx from 'clsx';
// import { seedDatabase } from '../utils/seed';

const Maintenance = () => {
    const { maintenances = [], assets = [], addMaintenance, updateMaintenance, deleteMaintenance } = useData();
    const [activeTab, setActiveTab] = useState('list'); // 'list' | 'form'
    const [editingItem, setEditingItem] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        status: '',
        startDate: '',
        endDate: ''
    });

    // ... Form State ...
    const [formData, setFormData] = useState({
        assetId: '',
        title: '',
        description: '',
        type: 'corretiva',
        priority: 'media',
        status: 'aberto',
        cost: '',
        responsible: '',
        date: new Date().toISOString().split('T')[0]
    });

    const filteredMaintenances = useMemo(() => {
        return maintenances.filter(item => {
            const matchesStatus = filters.status ? item.status === filters.status : true;

            let matchesDate = true;
            if (filters.startDate || filters.endDate) {
                const itemDate = new Date(item.date);
                if (filters.startDate) {
                    matchesDate = matchesDate && itemDate >= new Date(filters.startDate);
                }
                if (filters.endDate) {
                    matchesDate = matchesDate && itemDate <= new Date(filters.endDate);
                }
            }

            return matchesStatus && matchesDate;
        });
    }, [maintenances, filters]);

    const handleNew = () => {
        setEditingItem(null);
        setFormData({
            assetId: assets.length > 0 ? assets[0].id : '',
            title: '',
            description: '',
            type: 'corretiva',
            priority: 'media',
            status: 'aberto',
            cost: '',
            responsible: '',
            date: new Date().toISOString().split('T')[0]
        });
        setActiveTab('form');
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            assetId: item.asset_id || item.assetId, // Handle snake_case from DB
            title: item.title,
            description: item.description,
            type: item.type,
            priority: item.priority,
            status: item.status,
            cost: item.cost,
            responsible: item.responsible,
            date: item.date || new Date().toISOString().split('T')[0]
        });
        setActiveTab('form');
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!formData.assetId || !formData.title || !formData.responsible) {
            alert("Preencha os campos obrigatórios.");
            return;
        }

        // Map assetId (state) to asset_id (DB)
        const payload = {
            ...formData,
            asset_id: formData.assetId,
            cost: parseFloat(formData.cost) || 0
        };
        delete payload.assetId; // Remove camelCase key to avoid "column does not exist" error

        let error = null;
        if (editingItem) {
            const res = await updateMaintenance({ ...payload, id: editingItem.id });
            error = res.error;
        } else {
            const res = await addMaintenance(payload);
            error = res.error;
        }

        if (error) {
            console.error("Erro ao salvar manutenção:", error);
            alert("Erro ao salvar: " + error.message);
            return;
        }

        setActiveTab('list');
    };

    const getAssetDetails = (id) => assets.find(a => a.id === id) || {};

    const getStatusColor = (status) => {
        switch (status) {
            case 'aberto': return 'bg-red-50 text-red-700 border-red-200';
            case 'em_andamento': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'resolvido': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            default: return 'bg-slate-50 text-slate-700';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'urgente': return 'text-red-600 font-bold';
            case 'alta': return 'text-orange-600 font-medium';
            case 'media': return 'text-yellow-600';
            case 'baixa': return 'text-slate-500';
            default: return 'text-slate-500';
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <Wrench className="text-primary" /> Manutenção
                    </h1>
                    <p className="text-slate-500 mt-1">Gerenciamento de serviços e reparos dos ativos.</p>
                </div>
                <div className="flex gap-2">
                    {/* Migration button removed */}
                    {activeTab === 'list' && (
                        <button
                            onClick={handleNew}
                            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                        >
                            <Plus size={20} />
                            <span>Nova Manutenção</span>
                        </button>
                    )}
                </div>
            </div>

            {activeTab === 'list' ? (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="flex items-center gap-2 text-slate-500 font-medium">
                                <Filter size={20} />
                                <span>Filtros:</span>
                            </div>

                            <select
                                className="p-2 border border-slate-200 rounded-lg min-w-[150px]"
                                value={filters.status}
                                onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                            >
                                <option value="">Todos os Status</option>
                                <option value="aberto">Aberto</option>
                                <option value="em_andamento">Em Andamento</option>
                                <option value="aguardando_peca">Aguardando Peça</option>
                                <option value="resolvido">Resolvido</option>
                            </select>

                            <div className="flex items-center gap-2">
                                <span className="text-slate-500 text-sm">De:</span>
                                <input
                                    type="date"
                                    className="p-2 border border-slate-200 rounded-lg"
                                    value={filters.startDate}
                                    onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-slate-500 text-sm">Até:</span>
                                <input
                                    type="date"
                                    className="p-2 border border-slate-200 rounded-lg"
                                    value={filters.endDate}
                                    onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                />
                            </div>

                            {(filters.status || filters.startDate || filters.endDate) && (
                                <button
                                    onClick={() => setFilters({ status: '', startDate: '', endDate: '' })}
                                    className="text-sm text-red-500 hover:text-red-700 underline"
                                >
                                    Limpar
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => generateMaintenanceReport(filteredMaintenances, assets)}
                            className="flex items-center gap-2 px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors"
                            title="Exportar Relatório PDF"
                        >
                            <Printer size={18} />
                            <span className="hidden sm:inline">Exportar PDF</span>
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        {filteredMaintenances.length === 0 ? (
                            <div className="p-12 text-center text-slate-400">
                                <Wrench className="mx-auto mb-4 opacity-50" size={48} />
                                <p>Nenhuma manutenção encontrada.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {filteredMaintenances.map((item) => {
                                    const asset = getAssetDetails(item.asset_id || item.assetId);
                                    return (
                                        <div key={item.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group cursor-pointer" onClick={() => handleEdit(item)}>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={clsx("px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border", getStatusColor(item.status))}>
                                                        {(item.status || '').replace('_', ' ')}
                                                    </span>
                                                    <span className={clsx("text-xs uppercase tracking-wider", getPriorityColor(item.priority))}>
                                                        {item.priority}
                                                    </span>
                                                    <span className="text-slate-400 text-xs">• {item.date ? new Date(item.date).toLocaleDateString() : 'Sem data'}</span>
                                                </div>
                                                <h3 className="font-bold text-slate-800 text-lg mb-1">{item.title}</h3>
                                                <p className="text-slate-500 text-sm mb-2">{item.description}</p>

                                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                                    <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                                                        <MapPin size={12} />
                                                        <span className="font-medium text-slate-700">{asset.name || 'Ativo Desconhecido'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Wrench size={12} />
                                                        <span className="capitalize">{item.type}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span>Responsável:</span>
                                                        <span className="font-medium text-slate-700">{item.responsible}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right min-w-[120px]">
                                                <div className="text-sm text-slate-400 mb-1">Custo</div>
                                                <div className="font-bold text-lg text-slate-800">
                                                    R$ {parseFloat(item.cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                                                    className="mt-3 text-slate-400 hover:text-primary p-2 hover:bg-slate-100 rounded-full transition-colors self-end"
                                                    title="Editar"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* FORM */
                <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Details Card */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Wrench size={20} /></span>
                                Detalhes do Serviço
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Título do Serviço</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full p-2 border border-slate-200 rounded-lg"
                                        placeholder="Ex: Troca de Fonte"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Ativo Relacionado</label>
                                        <select
                                            required
                                            className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
                                            value={formData.assetId}
                                            onChange={e => setFormData({ ...formData, assetId: e.target.value })}
                                        >
                                            <option value="">Selecione um ativo...</option>
                                            {assets.map(a => (
                                                <option key={a.id} value={a.id}>{a.name} - {a.bairro || 'N/A'}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                                        <input
                                            type="date"
                                            className="w-full p-2 border border-slate-200 rounded-lg"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Descrição Detalhada</label>
                                    <textarea
                                        rows={4}
                                        className="w-full p-2 border border-slate-200 rounded-lg"
                                        placeholder="Descreva o problema e a solução aplicada..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Classification Card */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Filter size={20} /></span>
                                Classificação & Responsável
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                                    <select
                                        className="w-full p-2 border border-slate-200 rounded-lg"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="corretiva">Corretiva</option>
                                        <option value="preventiva">Preventiva</option>
                                        <option value="preditiva">Preditiva</option>
                                        <option value="instalacao">Instalação</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Prioridade</label>
                                    <select
                                        className="w-full p-2 border border-slate-200 rounded-lg"
                                        value={formData.priority}
                                        onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                    >
                                        <option value="baixa">Baixa</option>
                                        <option value="media">Média</option>
                                        <option value="alta">Alta</option>
                                        <option value="urgente">Urgente</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Técnico / Empresa Responsável</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-slate-200 rounded-lg"
                                        placeholder="Nome da empresa ou técnico"
                                        value={formData.responsible}
                                        onChange={e => setFormData({ ...formData, responsible: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit sticky top-6">
                        <h3 className="font-bold text-slate-800 text-xl mb-6">Status & Custos</h3>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status Atual</label>
                                <select
                                    className="w-full p-2 border border-slate-200 rounded-lg font-medium"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="aberto">Aberto</option>
                                    <option value="em_andamento">Em Andamento</option>
                                    <option value="aguardando_peca">Aguardando Peça</option>
                                    <option value="resolvido">Resolvido / Concluído</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Custo Total (R$)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-slate-400">R$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full p-2 pl-10 border border-slate-200 rounded-lg font-bold text-slate-800"
                                        placeholder="0.00"
                                        value={formData.cost}
                                        onChange={e => setFormData({ ...formData, cost: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setActiveTab('list')}
                                className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark shadow-sm"
                            >
                                Salvar
                            </button>
                        </div>

                        {editingItem && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm('Tem certeza que deseja excluir este registro?')) {
                                        deleteMaintenance(editingItem.id);
                                        setActiveTab('list');
                                    }
                                }}
                                className="w-full mt-3 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                            >
                                Excluir Registro
                            </button>
                        )}
                    </div>
                </form>
            )}
        </div>
    );
};

export default Maintenance;
