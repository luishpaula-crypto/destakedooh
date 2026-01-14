import React, { useState } from 'react';
import { X, Hammer, Plus, Trash2 } from 'lucide-react';
import { useData } from '../../context/DataContext';

const ProductionModal = ({ isOpen, onClose }) => {
    const { inventory, addProductionOrder } = useData();

    // Order Header
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('draft'); // draft, in_progress
    const [dueDate, setDueDate] = useState('');

    // items
    const [items, setItems] = useState([]); // { item_id, type: INPUT/OUTPUT, quantity_planned }

    const [loading, setLoading] = useState(false);

    // Temp item state
    const [selectedItem, setSelectedItem] = useState('');
    const [itemType, setItemType] = useState('INPUT'); // INPUT (Consumed), OUTPUT await (Produced)
    const [itemQty, setItemQty] = useState(1);

    if (!isOpen) return null;

    const handleAddItem = () => {
        if (!selectedItem || itemQty <= 0) return;

        const invItem = inventory.find(i => i.id === selectedItem);

        setItems([...items, {
            item_id: selectedItem,
            name: invItem?.name, // cached for display
            type: itemType,
            quantity_planned: parseFloat(itemQty)
        }]);

        setSelectedItem('');
        setItemQty(1);
    };

    const handleRemoveItem = (index) => {
        const newItems = [...items];
        newItems.splice(index, 1);
        setItems(newItems);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const order = {
            description,
            status,
            due_date: dueDate || null,
            start_date: new Date().toISOString()
        };

        const { error } = await addProductionOrder(order, items);

        if (!error) {
            onClose();
            // Reset form
            setDescription('');
            setItems([]);
        } else {
            alert('Erro ao criar OP: ' + error.message);
        }
        setLoading(false);
    };

    const inputs = items.filter(i => i.type === 'INPUT');
    const outputs = items.filter(i => i.type === 'OUTPUT');

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Hammer className="text-indigo-600" />
                        Nova Ordem de Produção
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <div className="space-y-6">
                        {/* Header Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição do Projeto / OP</label>
                                <input
                                    className="w-full p-2 border border-slate-200 rounded-lg"
                                    placeholder="Ex: Montagem Painel 3x2 Cliente X"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Data Prevista</label>
                                <input
                                    type="date"
                                    className="w-full p-2 border border-slate-200 rounded-lg"
                                    value={dueDate}
                                    onChange={e => setDueDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status Inicial</label>
                                <select
                                    className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                                    value={status}
                                    onChange={e => setStatus(e.target.value)}
                                >
                                    <option value="draft">Rascunho / Planejamento</option>
                                    <option value="in_progress">Em Produção (Reservar Materiais)</option>
                                </select>
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* BOM Builder */}
                        <div>
                            <h3 className="font-bold text-slate-700 mb-3">Lista de Materiais & Produtos</h3>

                            <div className="flex gap-2 mb-4 items-end bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Item</label>
                                    <select
                                        className="w-full p-2 border border-slate-200 rounded-lg bg-white text-sm"
                                        value={selectedItem}
                                        onChange={e => setSelectedItem(e.target.value)}
                                    >
                                        <option value="">Selecione...</option>
                                        {inventory.map(i => (
                                            <option key={i.id} value={i.id}>{i.name} ({i.type})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-32">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Tipo</label>
                                    <select
                                        className="w-full p-2 border border-slate-200 rounded-lg bg-white text-sm"
                                        value={itemType}
                                        onChange={e => setItemType(e.target.value)}
                                    >
                                        <option value="INPUT">Entrada (Consumo)</option>
                                        <option value="OUTPUT">Saída (Produto)</option>
                                    </select>
                                </div>
                                <div className="w-24">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Qtd</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                        value={itemQty}
                                        onChange={e => setItemQty(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={handleAddItem}
                                    type="button"
                                    className="p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Inputs List */}
                                <div className="border border-slate-200 rounded-lg p-4">
                                    <h4 className="text-sm font-bold text-slate-600 mb-3 uppercase flex justify-between">
                                        Matéria-Prima (Inputs)
                                        <span className="bg-slate-100 px-2 rounded-full">{inputs.length}</span>
                                    </h4>
                                    <ul className="space-y-2 text-sm">
                                        {inputs.map((item, idx) => (
                                            <li key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded">
                                                <span>{item.name}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold">{item.quantity_planned}</span>
                                                    <button onClick={() => handleRemoveItem(items.indexOf(item))} className="text-red-400 hover:text-red-600">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                        {inputs.length === 0 && <li className="text-slate-400 italic text-xs">Nenhum item adicionado.</li>}
                                    </ul>
                                </div>

                                {/* Outputs List */}
                                <div className="border border-indigo-100 bg-indigo-50/50 rounded-lg p-4">
                                    <h4 className="text-sm font-bold text-indigo-700 mb-3 uppercase flex justify-between">
                                        Produtos Finais (Outputs)
                                        <span className="bg-indigo-100 px-2 rounded-full">{outputs.length}</span>
                                    </h4>
                                    <ul className="space-y-2 text-sm">
                                        {outputs.map((item, idx) => (
                                            <li key={idx} className="flex justify-between items-center bg-white p-2 rounded shadow-sm">
                                                <span className="font-medium text-indigo-900">{item.name}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-indigo-700">{item.quantity_planned}</span>
                                                    <button onClick={() => handleRemoveItem(items.indexOf(item))} className="text-red-400 hover:text-red-600">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                        {outputs.length === 0 && <li className="text-indigo-300 italic text-xs">Adicione o produto que será fabricado.</li>}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || items.length === 0}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Salvando...' : 'Criar Ordem de Produção'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductionModal;
