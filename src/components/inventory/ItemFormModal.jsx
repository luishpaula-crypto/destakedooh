import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';

const ItemFormModal = ({ isOpen, onClose, itemToEdit = null }) => {
    const { addInventoryItem, updateInventoryItem, suppliers } = useData();
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        type: 'raw_material', // raw_material, wip, merchandise, component
        category: '',
        unit: 'un',
        location: '',
        min_quantity: 0,
        max_quantity: 0,
        cost: 0,
        price: 0,
        supplier_id: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (itemToEdit) {
            setFormData({
                ...itemToEdit,
                supplier_id: itemToEdit.supplier_id || ''
            });
        } else {
            setFormData({
                name: '',
                sku: '',
                type: 'raw_material',
                category: '',
                unit: 'un',
                location: '',
                min_quantity: 0,
                max_quantity: 0,
                cost: 0,
                price: 0,
                supplier_id: '',
                description: ''
            });
        }
        setError('');
    }, [itemToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Sanitize optional UUIDs
            const payload = {
                ...formData,
                supplier_id: formData.supplier_id || null
            };

            if (itemToEdit) {
                const { error } = await updateInventoryItem({ ...payload, id: itemToEdit.id });
                if (error) throw error;
            } else {
                const { error } = await addInventoryItem(payload);
                if (error) throw error;
            }
            onClose();
        } catch (err) {
            setError(err.message || 'Erro ao salvar item');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10 rounded-t-xl">
                    <h2 className="text-xl font-bold text-slate-800">
                        {itemToEdit ? 'Editar Item / Ficha Técnica' : 'Novo Item'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Item *</label>
                            <input
                                required
                                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-primary"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Ex: Módulo Painel P3.9 Outdoor"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Código / SKU</label>
                            <input
                                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-primary"
                                value={formData.sku || ''}
                                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                placeholder="Ex: MOD-P39-OUT"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                            <input
                                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-primary"
                                value={formData.category || ''}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                placeholder="Ex: Eletrônicos, Cabos"
                                list="categories"
                            />
                            <datalist id="categories">
                                <option value="Matéria-Prima" />
                                <option value="Componentes" />
                                <option value="Acabados" />
                                <option value="Manutenção" />
                            </datalist>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Item</label>
                            <select
                                className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:outline-primary"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="raw_material">Matéria-Prima</option>
                                <option value="component">Componente</option>
                                <option value="wip">Em Fabricação (WIP)</option>
                                <option value="merchandise">Mercadoria / Produto Acabado</option>
                                <option value="asset">Ativo Imobilizado</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Unidade de Medida</label>
                            <select
                                className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:outline-primary"
                                value={formData.unit}
                                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                            >
                                <option value="un">Unidade (un)</option>
                                <option value="m">Metro (m)</option>
                                <option value="m2">Metro Quadrado (m²)</option>
                                <option value="kg">Quilograma (kg)</option>
                                <option value="cx">Caixa (cx)</option>
                                <option value="kt">Kit (kt)</option>
                            </select>
                        </div>
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Descrição Detalhada</label>
                        <textarea
                            className="w-full p-2 border border-slate-200 rounded-lg focus:outline-primary"
                            rows="2"
                            value={formData.description || ''}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Detalhes técnicos, especificações..."
                        />
                    </div>

                    <hr className="border-slate-100" />

                    {/* Values & Suppliers */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Custo Unit. (R$)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-primary"
                                value={formData.cost}
                                onChange={e => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                            />
                        </div>

                        {(formData.type === 'merchandise' || formData.type === 'wip') && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Preço Venda (R$)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-primary"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Fornecedor Padrão</label>
                            <select
                                className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:outline-primary"
                                value={formData.supplier_id}
                                onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}
                            >
                                <option value="">Selecione...</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Stock Limits & Location */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Estoque Mínimo</label>
                            <input
                                type="number"
                                min="0"
                                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-primary"
                                value={formData.min_quantity}
                                onChange={e => setFormData({ ...formData, min_quantity: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Estoque Máximo</label>
                            <input
                                type="number"
                                min="0"
                                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-primary"
                                value={formData.max_quantity || 0}
                                onChange={e => setFormData({ ...formData, max_quantity: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Localização Física</label>
                            <input
                                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-primary"
                                value={formData.location || ''}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                placeholder="Estante A, Prateleira 2"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 px-4 bg-primary text-white rounded-lg hover:bg-primary-dark font-bold shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                        >
                            <Save size={20} />
                            {loading ? 'Salvando...' : 'Salvar Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ItemFormModal;
