import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import {
    Package,
    Factory,
    Truck,
    AlertTriangle,
    Search,
    Plus,
    History,
    Settings,
    ArrowRightLeft,
    Hammer,
    Users
} from 'lucide-react';
import clsx from 'clsx';
import ItemFormModal from '../components/inventory/ItemFormModal';
import MovementModal from '../components/inventory/MovementModal';
import ProductionModal from '../components/inventory/ProductionModal';
import SupplierModal from '../components/inventory/SupplierModal';
import ConfirmationModal from '../components/ConfirmationModal';

const Inventory = () => {
    const { inventory, suppliers, movements, productionOrders, updateInventoryItem, deleteInventoryItem, deleteSupplier } = useData();
    const { user } = useAuth();

    // UI State
    const [activeTab, setActiveTab] = useState('overview'); // overview, items, production, movements, suppliers
    const [searchTerm, setSearchTerm] = useState('');
    const [itemFilterType, setItemFilterType] = useState('all');

    // Modals State
    const [showItemModal, setShowItemModal] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [showMovementModal, setShowMovementModal] = useState(false);
    const [preselectedItem, setPreselectedItem] = useState(null);
    const [showProductionModal, setShowProductionModal] = useState(false);
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [supplierToEdit, setSupplierToEdit] = useState(null);
    const [confirmation, setConfirmation] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDestructive: false
    });

    // --- FILTERS & DERIVED DATA ---
    const filteredItems = inventory.filter(item => {
        const matchesTerm = item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = itemFilterType === 'all' || item.type === itemFilterType;
        return matchesTerm && matchesType;
    });

    const lowStockItems = inventory.filter(i => (i.quantity || 0) <= (i.min_quantity || 0));

    // KPI Data
    const totalValue = inventory.reduce((acc, i) => acc + ((Number(i.cost) || 0) * (Number(i.quantity) || 0)), 0);
    const totalItems = inventory.length;

    // --- HANDLERS ---
    const handleEditItem = (item) => {
        setItemToEdit(item);
        setShowItemModal(true);
    };

    const handleNewItem = () => {
        setItemToEdit(null);
        setShowItemModal(true);
    };

    const handleMovement = (item = null) => {
        setPreselectedItem(item);
        setShowMovementModal(true);
    };

    const handleDeleteItem = (id) => {
        setConfirmation({
            isOpen: true,
            title: 'Excluir Item',
            message: 'Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.',
            isDestructive: true,
            onConfirm: async () => {
                await deleteInventoryItem(id);
            }
        });
    };

    const handleEditSupplier = (supplier) => {
        setSupplierToEdit(supplier);
        setShowSupplierModal(true);
    };

    const handleNewSupplier = () => {
        setSupplierToEdit(null);
        setShowSupplierModal(true);
    };

    const handleDeleteSupplier = (id) => {
        setConfirmation({
            isOpen: true,
            title: 'Excluir Fornecedor',
            message: 'Tem certeza que deseja excluir este fornecedor? Se houver itens vinculados, a exclusão falhará.',
            isDestructive: true,
            onConfirm: async () => {
                const { error } = await deleteSupplier(id);
                if (error) {
                    alert('Erro ao excluir: ' + (error.message || 'Verifique se há itens vinculados.'));
                }
            }
        });
    };

    // --- RENDER HELPERS ---
    const TabButton = ({ id, label, icon: Icon, count }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={clsx(
                "flex items-center gap-2 px-6 py-4 border-b-2 transition-all font-medium text-sm",
                activeTab === id
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            )}
        >
            <Icon size={18} />
            {label}
            {count !== undefined && (
                <span className="ml-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs border border-slate-200">
                    {count}
                </span>
            )}
        </button>
    );

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-slate-50/50">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        Controle de Estoque
                        <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">v2.0</span>
                    </h1>
                </div>
                <div className="flex gap-3">
                    {activeTab === 'suppliers' ? (
                        <button onClick={handleNewSupplier} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-bold shadow-lg shadow-primary/30 transition-transform active:scale-95">
                            <Plus size={18} />
                            Novo Fornecedor
                        </button>
                    ) : (
                        <>
                            <button onClick={() => setShowProductionModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-600/20 transition-transform active:scale-95">
                                <Hammer size={18} />
                                Nova Produção
                            </button>
                            <button onClick={() => handleMovement()} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 font-bold shadow-sm transition-transform active:scale-95">
                                <ArrowRightLeft size={18} />
                                Movimentar
                            </button>
                            <button onClick={handleNewItem} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-bold shadow-lg shadow-primary/30 transition-transform active:scale-95">
                                <Plus size={18} />
                                Novo Item
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ERROR / ALERTS */}
            {lowStockItems.length > 0 && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                    <div className="bg-red-100 p-2 rounded-full text-red-600">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-red-800">Alerta de Estoque Baixo</h3>
                        <p className="text-sm text-red-600">
                            {lowStockItems.length} itens estão abaixo do nível mínimo. Verifique: {lowStockItems.slice(0, 3).map(i => i.name).join(', ')}{lowStockItems.length > 3 ? '...' : ''}.
                        </p>
                    </div>
                </div>
            )}

            {/* TABS */}
            <div className="bg-white rounded-t-xl border-b border-slate-200 flex overflow-x-auto shadow-sm">
                <TabButton id="overview" label="Visão Geral" icon={Package} />
                <TabButton id="items" label="Itens" icon={Settings} count={inventory.length} />
                <TabButton id="production" label="Produção" icon={Factory} count={productionOrders.length} />
                <TabButton id="movements" label="Movimentações" icon={History} />
                <TabButton id="suppliers" label="Fornecedores" icon={Users} count={suppliers.length} />
            </div>

            {/* CONTENT AREA */}
            <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-slate-200 min-h-[600px]">

                {/* --- OVERVIEW TAB --- */}
                {activeTab === 'overview' && (
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-primary/50 transition-colors">
                                <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Package size={60} />
                                </div>
                                <h3 className="text-slate-500 font-bold uppercase text-xs mb-2">Valor em Estoque</h3>
                                <p className="text-3xl font-bold text-slate-800">
                                    R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
                                <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Settings size={60} />
                                </div>
                                <h3 className="text-slate-500 font-bold uppercase text-xs mb-2">Total de Itens</h3>
                                <p className="text-3xl font-bold text-slate-800">{totalItems}</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-red-500/50 transition-colors">
                                <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <AlertTriangle size={60} className="text-red-500" />
                                </div>
                                <h3 className="text-slate-500 font-bold uppercase text-xs mb-2">Itens Críticos</h3>
                                <p className="text-3xl font-bold text-red-600">{lowStockItems.length}</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
                                <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Truck size={60} className="text-emerald-500" />
                                </div>
                                <h3 className="text-slate-500 font-bold uppercase text-xs mb-2">Movimentações (30d)</h3>
                                <p className="text-3xl font-bold text-emerald-600">{movements.length}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="border border-slate-200 rounded-xl p-6">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <History size={18} className="text-slate-400" />
                                    Últimas Movimentações
                                </h3>
                                <div className="space-y-4">
                                    {movements.slice(0, 5).map((mov, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className={clsx(
                                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                                                    mov.type === 'IN' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                                )}>
                                                    {mov.type === 'IN' ? '+' : '-'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-700 text-sm">
                                                        {inventory.find(i => i.id === mov.item_id)?.name || 'Item desconhecido'}
                                                    </p>
                                                    <p className="text-xs text-slate-400">{new Date(mov.created_at).toLocaleDateString()} - {mov.reason}</p>
                                                </div>
                                            </div>
                                            <span className={clsx("font-bold text-sm", mov.type === 'IN' ? "text-emerald-600" : "text-red-600")}>
                                                {mov.quantity > 0 ? '+' : ''}{mov.quantity}
                                            </span>
                                        </div>
                                    ))}
                                    {movements.length === 0 && <p className="text-slate-400 italic text-sm">Nenhuma movimentação recente.</p>}
                                </div>
                            </div>

                            <div className="border border-slate-200 rounded-xl p-6">
                                <h3 className="font-bold text-slate-800 mb-4 text-red-600 flex items-center gap-2">
                                    <AlertTriangle size={18} />
                                    Reposição Necessária
                                </h3>
                                <div className="space-y-2">
                                    {lowStockItems.slice(0, 5).map(item => (
                                        <div key={item.id} className="flex justify-between items-center p-3 bg-red-50/50 border border-red-100 rounded-lg">
                                            <div>
                                                <p className="font-bold text-slate-700 text-sm">{item.name}</p>
                                                <p className="text-xs text-red-500 font-medium">Estoque: {item.quantity} {item.unit} (Mín: {item.min_quantity})</p>
                                            </div>
                                            <button
                                                onClick={() => handleMovement(item)}
                                                className="text-xs bg-white border border-red-200 text-red-600 px-3 py-1 rounded-md hover:bg-red-50"
                                            >
                                                Repor
                                            </button>
                                        </div>
                                    ))}
                                    {lowStockItems.length === 0 && <p className="text-emerald-600 italic text-sm">Estoque saudável! Nenhum alerta.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- ITEMS TAB --- */}
                {activeTab === 'items' && (
                    <div>
                        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center bg-slate-50/50">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Buscar por nome, SKU..."
                                    className="w-full pl-10 p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                                <select
                                    className="p-2 border border-slate-200 rounded-lg bg-white text-sm"
                                    value={itemFilterType}
                                    onChange={e => setItemFilterType(e.target.value)}
                                >
                                    <option value="all">Todos os Tipos</option>
                                    <option value="raw_material">Matéria-Prima</option>
                                    <option value="component">Componentes</option>
                                    <option value="wip">Em Fabricação</option>
                                    <option value="merchandise">Mercadoria</option>
                                    <option value="asset">Ativo</option>
                                </select>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-3">SKU / Item</th>
                                        <th className="px-6 py-3">Tipo / Categoria</th>
                                        <th className="px-6 py-3">Localização</th>
                                        <th className="px-6 py-3 text-right">Custo</th>
                                        <th className="px-6 py-3 text-center">Quantidade</th>
                                        <th className="px-6 py-3 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredItems.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-800">{item.name}</p>
                                                <p className="text-xs text-slate-400 font-mono tracking-wide">{item.sku || 'S/ SKU'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded w-fit">
                                                        {item.type}
                                                    </span>
                                                    <span className="text-xs text-slate-400">{item.category}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 text-xs">
                                                {item.location || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-slate-600">
                                                R$ {Number(item.cost).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className={clsx(
                                                        "font-bold text-lg px-3 py-0.5 rounded-lg",
                                                        (item.quantity <= item.min_quantity) ? "bg-red-100 text-red-600" : "text-slate-700"
                                                    )}>
                                                        {item.quantity}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 uppercase">{item.unit}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleMovement(item)}
                                                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                                                        title="Movimentar"
                                                    >
                                                        <ArrowRightLeft size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditItem(item)}
                                                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                                        title="Editar"
                                                    >
                                                        <Settings size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                                                        title="Excluir"
                                                    >
                                                        <Plus size={16} className="rotate-45" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredItems.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-slate-400 italic">
                                                Nenhum item encontrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- MOVEMENTS TAB --- */}
                {activeTab === 'movements' && (
                    <div className="p-0">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold text-slate-500 uppercase text-xs">Histórico Completo</h3>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">Data</th>
                                    <th className="px-6 py-3">Tipo</th>
                                    <th className="px-6 py-3">Item</th>
                                    <th className="px-6 py-3">Qtd</th>
                                    <th className="px-6 py-3">Motivo</th>
                                    <th className="px-6 py-3">Usuário</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {movements.map((mov) => (
                                    <tr key={mov.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-slate-600">
                                            {new Date(mov.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                "px-2 py-1 rounded text-xs font-bold",
                                                mov.type === 'IN' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                                            )}>
                                                {mov.type === 'IN' ? 'ENTRADA' : 'SAÍDA'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-800">
                                            {inventory.find(i => i.id === mov.item_id)?.name || '...'}
                                        </td>
                                        <td className="px-6 py-4 font-mono font-bold">
                                            {mov.quantity}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {mov.reason} {mov.reference_id && <span className="text-xs bg-slate-100 px-1 rounded ml-1">Ref: {mov.reference_id}</span>}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs">
                                            {mov.user_id}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* --- PRODUCTION TAB --- */}
                {activeTab === 'production' && (
                    <div className="p-8">
                        {productionOrders.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                <Factory className="mx-auto text-slate-300 mb-4" size={48} />
                                <h3 className="text-lg font-bold text-slate-600 mb-2">Sem Ordens de Produção</h3>
                                <p className="text-slate-400 mb-6 max-w-sm mx-auto">Crie uma nova ordem para gerenciar a fabricação de painéis e estruturas.</p>
                                <button onClick={() => setShowProductionModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700">
                                    Criar Primeira Ordem
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {productionOrders.map(po => (
                                    <div key={po.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-indigo-300 transition-colors cursor-pointer">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="font-bold text-slate-800">{po.description}</h4>
                                                <p className="text-xs text-slate-400">PO #{po.code || po.id.slice(0, 8)}</p>
                                            </div>
                                            <span className={clsx(
                                                "px-2 py-1 rounded text-xs font-bold uppercase",
                                                po.status === 'completed' ? "bg-emerald-100 text-emerald-700" :
                                                    po.status === 'in_progress' ? "bg-amber-100 text-amber-700" :
                                                        "bg-slate-100 text-slate-600"
                                            )}>
                                                {po.status === 'in_progress' ? 'Em Produção' : po.status}
                                            </span>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <div className="text-sm flex justify-between">
                                                <span className="text-slate-500">Data Prevista:</span>
                                                <span className="text-slate-700 font-medium">{po.due_date ? new Date(po.due_date).toLocaleDateString() : '-'}</span>
                                            </div>
                                            <div className="text-sm flex justify-between">
                                                <span className="text-slate-500">Itens:</span>
                                                <span className="text-slate-700">{po.production_items?.length || 0}</span>
                                            </div>
                                        </div>

                                        <button className="w-full py-2 bg-slate-50 text-slate-600 rounded-lg text-sm font-bold border border-slate-200 hover:bg-white hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                                            Ver Detalhes
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* --- SUPPLIERS TAB --- */}
                {/* --- SUPPLIERS TAB --- */}
                {activeTab === 'suppliers' && (
                    <div className="p-0">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold text-slate-500 uppercase text-xs">Lista de Fornecedores</h3>
                        </div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">Fornecedor</th>
                                    <th className="px-6 py-3">Contato</th>
                                    <th className="px-6 py-3">Email / Telefone</th>
                                    <th className="px-6 py-3 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {suppliers.map(sup => (
                                    <tr key={sup.id} className="hover:bg-slate-50 group">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-800">{sup.name}</p>
                                            <p className="text-xs text-slate-400">{sup.document || 'CPF/CNPJ não inf.'}</p>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {sup.contact_info || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <div className="flex flex-col text-xs">
                                                <span>{sup.email}</span>
                                                <span>{sup.phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEditSupplier(sup)}
                                                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                                                    title="Editar"
                                                >
                                                    <Settings size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSupplier(sup.id)}
                                                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
                                                    title="Excluir"
                                                >
                                                    <Plus size={16} className="rotate-45" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {suppliers.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic">
                                            Nenhum fornecedor cadastrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

            </div>

            {/* MODALS */}
            <ItemFormModal
                isOpen={showItemModal}
                onClose={() => setShowItemModal(false)}
                itemToEdit={itemToEdit}
            />

            <MovementModal
                isOpen={showMovementModal}
                onClose={() => setShowMovementModal(false)}
                preselectedItem={preselectedItem}
            />

            <ProductionModal
                isOpen={showProductionModal}
                onClose={() => setShowProductionModal(false)}
            />

            <SupplierModal
                isOpen={showSupplierModal}
                onClose={() => setShowSupplierModal(false)}
                supplierToEdit={supplierToEdit}
            />

            <ConfirmationModal
                isOpen={confirmation.isOpen}
                onClose={() => setConfirmation({ ...confirmation, isOpen: false })}
                onConfirm={confirmation.onConfirm}
                title={confirmation.title}
                message={confirmation.message}
                isDestructive={confirmation.isDestructive}
            />
        </div>
    );
};

export default Inventory;
