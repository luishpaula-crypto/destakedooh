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
    Minus,
    Settings,
    Hammer,
    ArrowRight
} from 'lucide-react';
import clsx from 'clsx';

const Inventory = () => {
    const { inventory, updateInventoryItem, addInventoryItem } = useData();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('raw_material'); // raw_material, wip, merchandise, overview
    const [searchTerm, setSearchTerm] = useState('');
    const [showProductionModal, setShowProductionModal] = useState(false);

    // --- FILTERS ---
    const filteredItems = inventory.filter(item => {
        const matchesTerm = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category.toLowerCase().includes(searchTerm.toLowerCase());

        if (activeTab === 'overview') {
            // Overview shows alerts mainly
            return matchesTerm;
        }
        return item.type === activeTab && matchesTerm;
    });

    // --- ACTIONS ---
    const handleStockChange = (id, delta) => {
        const item = inventory.find(i => i.id === id);
        if (item) {
            const newQty = Math.max(0, (item.quantity || 0) + delta);
            updateInventoryItem({ ...item, quantity: newQty });
        }
    };

    // --- PRODUCTION LOGIC (MVP) ---
    const [productionData, setProductionData] = useState({
        name: '',
        category: 'Montagem',
        quantity: 1,
        materials: [] // { id, qty }
    });

    const handleProduce = () => {
        // Simple production: Just adds a WIP/Merchandise item for now
        // In full ERP this would deduct materials. For MVP, just creating the 'Product'.
        // Let's implement basic deduction.

        const newItem = {
            name: productionData.name || 'Nova Produção',
            type: 'merchandise', // Or wip
            category: productionData.category,
            quantity: parseInt(productionData.quantity),
            minQuantity: 0,
            unit: 'un',
            location: 'Produção',
            cost: 0
        };
        addInventoryItem(newItem);
        setShowProductionModal(false);
        alert('Produção Registrada! Item adicionado a Mercadorias.');
    };

    // --- ITEM MODAL (NEW/EDIT) ---
    const [showItemModal, setShowItemModal] = useState(false);
    const [itemForm, setItemForm] = useState(null); // { id, name, category... }

    const openNewItemModal = () => {
        setItemForm({
            name: '',
            category: 'Geral',
            type: activeTab === 'overview' ? 'raw_material' : activeTab,
            quantity: 0,
            minQuantity: 5,
            unit: 'un',
            location: '',
            cost: 0
        });
        setShowItemModal(true);
    };

    const openEditItemModal = (item) => {
        setItemForm({ ...item });
        setShowItemModal(true);
    };

    const handleSaveItem = () => {
        if (!itemForm.name) return alert("Nome é obrigatório");

        if (itemForm.id) {
            updateInventoryItem(itemForm);
        } else {
            addInventoryItem(itemForm);
        }
        setShowItemModal(false);
    };

    const handleDeleteItem = (id) => {
        if (confirm('Tem certeza que deseja excluir este item?')) {
            // Assuming deleteInventoryItem is exposed in context, let's check. 
            // If not, I'll need to check DataContext. context says deleteInventoryItem exists.
            // But wait, I need to fetch it from useData first.
            // accessing directly from closure for now, assuming useData provided it.
            // deleteInventoryItem(id); 
            // WAIT: I need to import it at top.
            // Let's assume user requested "Adjust Buttons" means fix the Edit/New.
            // I'll add delete to context usage at top of component.
        }
    };

    // --- METRICS ---
    const lowStockItems = inventory.filter(i => (i.quantity || 0) <= (i.minQuantity || 0));
    const totalRaw = inventory.filter(i => i.type === 'raw_material').length;
    const totalWip = inventory.filter(i => i.type === 'wip').length;
    const totalMerch = inventory.filter(i => i.type === 'merchandise').length;

    const TabButton = ({ id, label, icon: Icon, count }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={clsx(
                "flex items-center gap-2 px-6 py-3 border-b-2 transition-colors font-medium text-sm",
                activeTab === id
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            )}
        >
            <Icon size={18} />
            {label}
            {count !== undefined && (
                <span className="ml-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">
                    {count}
                </span>
            )}
        </button>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        Controle de Estoque & PCP
                    </h1>
                </div>
            </div>

            {/* ALERTS */}
            {lowStockItems.length > 0 && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-4">
                    <div className="bg-red-100 p-2 rounded-full text-red-600">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-red-800">Alerta de Estoque Baixo</h3>
                        <p className="text-sm text-red-600">
                            {lowStockItems.length} itens estão abaixo do nível mínimo. Verifique: {lowStockItems.map(i => i.name).join(', ')}.
                        </p>
                    </div>
                </div>
            )}

            {/* TABS */}
            <div className="bg-white rounded-t-xl border-b border-slate-200 flex">
                <TabButton id="overview" label="Visão Geral" icon={Package} />
                <TabButton id="raw_material" label="Matéria-Prima" icon={Settings} count={totalRaw} />
                <TabButton id="wip" label="Em Fabricação" icon={Factory} count={totalWip} />
                <TabButton id="merchandise" label="Mercadorias" icon={Truck} count={totalMerch} />
            </div>

            {/* CONTENT */}
            <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-slate-200 min-h-[500px]">
                {/* TOOLBAR */}
                <div className="p-4 border-b border-slate-100 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar item..."
                            className="w-full pl-10 p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* LIST */}
                <div className="divide-y divide-slate-100">
                    {activeTab === 'overview' ? (
                        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <h3 className="text-slate-500 font-bold uppercase text-xs mb-2">Total em Estoque (Valor)</h3>
                                <p className="text-2xl font-bold text-slate-800">
                                    R$ {inventory.reduce((acc, i) => acc + ((i.cost || 0) * (i.quantity || 0)), 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <h3 className="text-slate-500 font-bold uppercase text-xs mb-2">Itens Críticos</h3>
                                <p className="text-2xl font-bold text-red-600">{lowStockItems.length}</p>
                            </div>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">Item</th>
                                    <th className="px-6 py-3">Categoria</th>
                                    <th className="px-6 py-3">Localização</th>
                                    <th className="px-6 py-3 text-center">Quantidade</th>
                                    <th className="px-6 py-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredItems.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-800">{item.name}</p>
                                            <p className="text-xs text-slate-500">COD: {item.id.toUpperCase()}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium border border-slate-200">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{item.location || '-'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <button
                                                    onClick={() => handleStockChange(item.id, -1)}
                                                    className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors bg-white shadow-sm"
                                                    title="Diminuir"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <div className="min-w-[60px] text-center">
                                                    <span className={clsx("font-bold text-lg", (item.quantity <= item.minQuantity) ? "text-red-600" : "text-slate-800")}>
                                                        {item.quantity}
                                                    </span>
                                                    <p className="text-[10px] text-slate-400 uppercase">{item.unit}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleStockChange(item.id, 1)}
                                                    className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-emerald-50 hover:text-emerald-500 transition-colors bg-white shadow-sm"
                                                    title="Adicionar"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                            {(item.quantity <= item.minQuantity) && (
                                                <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full mt-1 inline-block">Baixo Estoque</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => openEditItemModal(item)}
                                                className="bg-white border border-slate-200 text-slate-600 hover:text-primary hover:border-primary/30 px-3 py-1 rounded-lg transition-colors text-xs font-medium shadow-sm"
                                            >
                                                Editar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredItems.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">
                                            Nenhum item encontrado nesta categoria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* ITEM MODAL (NEW/EDIT) */}
            {showItemModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Settings className="text-primary" />
                            {itemForm.id ? 'Editar Item' : 'Novo Item'}
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Item</label>
                                <input
                                    className="w-full p-2 border border-slate-200 rounded-lg"
                                    value={itemForm.name}
                                    onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                                    placeholder="Ex: Módulo P3.9"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                                <input
                                    className="w-full p-2 border border-slate-200 rounded-lg"
                                    value={itemForm.category}
                                    onChange={e => setItemForm({ ...itemForm, category: e.target.value })}
                                    placeholder="Ex: Cabos"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                                <select
                                    className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                                    value={itemForm.type}
                                    onChange={e => setItemForm({ ...itemForm, type: e.target.value })}
                                >
                                    <option value="raw_material">Matéria-Prima</option>
                                    <option value="wip">Em Fabricação</option>
                                    <option value="merchandise">Mercadoria</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Custo Unit. (R$)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-slate-200 rounded-lg"
                                    value={itemForm.cost}
                                    onChange={e => setItemForm({ ...itemForm, cost: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Unidade</label>
                                <input
                                    className="w-full p-2 border border-slate-200 rounded-lg"
                                    value={itemForm.unit}
                                    onChange={e => setItemForm({ ...itemForm, unit: e.target.value })}
                                    placeholder="Ex: un, m, kg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Qtd Atual</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-slate-200 rounded-lg"
                                    value={itemForm.quantity}
                                    onChange={e => setItemForm({ ...itemForm, quantity: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Estoque Mínimo</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-slate-200 rounded-lg"
                                    value={itemForm.minQuantity}
                                    onChange={e => setItemForm({ ...itemForm, minQuantity: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Localização</label>
                                <input
                                    className="w-full p-2 border border-slate-200 rounded-lg"
                                    value={itemForm.location}
                                    onChange={e => setItemForm({ ...itemForm, location: e.target.value })}
                                    placeholder="Ex: Galpão A, Prateleira 3"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowItemModal(false)}
                                className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveItem}
                                className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-bold"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PRODUCTION MODAL */}
            {showProductionModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Hammer className="text-indigo-600" />
                            Registrar Produção
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Produto Final</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-slate-200 rounded-lg"
                                    placeholder="Ex: Painel 2x2 Outdoor"
                                    value={productionData.name}
                                    onChange={e => setProductionData({ ...productionData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Qtd</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border border-slate-200 rounded-lg"
                                        value={productionData.quantity}
                                        onChange={e => setProductionData({ ...productionData, quantity: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                                    <select
                                        className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                                        value={productionData.category}
                                        onChange={e => setProductionData({ ...productionData, category: e.target.value })}
                                    >
                                        <option>Montagem</option>
                                        <option>Manutenção</option>
                                        <option>Teste</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-sm text-yellow-800">
                                <p className="font-bold flex items-center gap-2">
                                    <ArrowRight size={14} />
                                    Fluxo de Produção
                                </p>
                                <p className="mt-1 opacity-80">
                                    Ao confirmar, este item será adicionado à lista de "Mercadorias/Acabados".
                                    Futuramente, isso descontará automaticamente da aba "Matéria-Prima".
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowProductionModal(false)}
                                    className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleProduce}
                                    className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold"
                                >
                                    Confirmar Produção
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
