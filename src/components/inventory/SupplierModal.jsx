import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';

const SupplierModal = ({ isOpen, onClose, supplierToEdit = null }) => {
    const { addSupplier, updateSupplier } = useData();
    const [formData, setFormData] = useState({
        name: '',
        contact_info: '',
        document: '',
        email: '',
        phone: '',
        address: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (supplierToEdit) {
            setFormData(supplierToEdit);
        } else {
            setFormData({
                name: '',
                contact_info: '',
                document: '',
                email: '',
                phone: '',
                address: ''
            });
        }
        setError('');
    }, [supplierToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (supplierToEdit) {
                const { error } = await updateSupplier({ ...formData, id: supplierToEdit.id });
                if (error) throw error;
            } else {
                const { error } = await addSupplier(formData);
                if (error) throw error;
            }
            onClose();
        } catch (err) {
            setError(err.message || 'Erro ao salvar fornecedor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10 rounded-t-xl">
                    <h2 className="text-xl font-bold text-slate-800">
                        {supplierToEdit ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Empresa / Fornecedor *</label>
                        <input
                            required
                            className="w-full p-2 border border-slate-200 rounded-lg focus:outline-primary"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: Comercial Elétrica Ltda"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ / CPF</label>
                            <input
                                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-primary"
                                value={formData.document || ''}
                                onChange={e => setFormData({ ...formData, document: e.target.value })}
                                placeholder="00.000.000/0000-00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Telefone / WhatsApp</label>
                            <input
                                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-primary"
                                value={formData.phone || ''}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="(11) 99999-9999"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full p-2 border border-slate-200 rounded-lg focus:outline-primary"
                            value={formData.email || ''}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="contato@fornecedor.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Contato</label>
                        <input
                            className="w-full p-2 border border-slate-200 rounded-lg focus:outline-primary"
                            value={formData.contact_info || ''}
                            onChange={e => setFormData({ ...formData, contact_info: e.target.value })}
                            placeholder="Ex: Sr. João"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
                        <textarea
                            rows="2"
                            className="w-full p-2 border border-slate-200 rounded-lg focus:outline-primary"
                            value={formData.address || ''}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Rua, Número, Bairro, Cidade - UF"
                        />
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
                            {loading ? 'Salvando...' : 'Salvar Fornecedor'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SupplierModal;
