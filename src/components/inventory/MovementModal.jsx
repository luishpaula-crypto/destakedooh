import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, AlertCircle } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

const MovementModal = ({ isOpen, onClose, preselectedItem = null }) => {
    const { inventory, addInventoryMovement } = useData();
    const { user } = useAuth();

    const [type, setType] = useState('OUT'); // IN, OUT, ADJUSTMENT
    const [itemId, setItemId] = useState('');
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('');
    const [referenceId, setReferenceId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (preselectedItem) {
                setItemId(preselectedItem.id);
            }
            // Reset other fields
            setQuantity('');
            setReason('');
            setReferenceId('');
            setError('');
            setLoading(false);
        }
    }, [isOpen, preselectedItem]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!itemId) {
            setError('Selecione um item');
            setLoading(false);
            return;
        }

        const qty = parseFloat(quantity);
        if (isNaN(qty) || qty <= 0) {
            setError('Quantidade inválida');
            setLoading(false);
            return;
        }

        const finalQty = type === 'IN' ? qty : (type === 'OUT' ? -qty : qty);
        // For ADJUSTMENT, user usually inputs the DIFF or the FINAL?
        // Let's assume ADJUSTMENT users input the DIFF for now to keep it simple, or we can imply Set To.
        // Actually, usually Adjustment is "I found 5 less", so -5.
        // But to simplify UI:
        // IN: add positive
        // OUT: add negative
        // ADJUSTMENT: explicit sign? Or maybe just use IN/OUT for everything?
        // Let's stick to IN/OUT mainly. ADJUSTMENT can be complex (set absolute value).
        // Let's interpret ADJUSTMENT as "Correction" taking signed value? 
        // No, let's keep it simple: IN adds, OUT subtracts.
        // User selects "Ajuste (Entrada)" or "Ajuste (Saída)" effectively.
        // Let's just allow positive quantities and toggle based on type.

        // If type is adjustment, we might want to capture "New Total" vs "Difference".
        // Let's assume Difference for now. 
        // But wait, "Inventory Check" usually yields a total.
        // Let's stick to simple Diff movements: IN (+), OUT (-).
        // If Type is 'ADJUSTMENT', we need to clarify if it adds or removes.
        // Let's add a toggle or just allow signed input? 
        // Better: Drop 'ADJUSTMENT' as a top level, use IN/OUT and add a Category "Ajuste".
        // Or keep types: IN, OUT.

        let signedQty = qty;
        if (type === 'OUT') signedQty = -qty;

        // If adjustment, we need to know direction. Let's assume user picks 'IN' or 'OUT' and sets reason 'Adjustment'.
        // But user requirements mentioned "Ajuste de Inventário".
        // Let's add an "Ajuste" tab/mode? 
        // Let's simplify: TYPE: IN, OUT. REASON: Purchase, Production, Sale, Maintenance, Adjustment/Correction.

        // Actually, let's keep the UI simple: Type: Entrada, Saída.

        const movement = {
            item_id: itemId,
            type: type, // IN, OUT
            quantity: signedQty,
            reference_id: referenceId,
            reason: reason,
            user_id: user?.id || 'system',
            created_at: new Date().toISOString()
        };

        const { error } = await addInventoryMovement(movement);

        if (error) {
            setError(error.message);
        } else {
            onClose();
        }
        setLoading(false);
    };

    const selectedItem = inventory.find(i => i.id === itemId);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <ArrowRightLeft className="text-primary" />
                        Registrar Movimentação
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {/* Type Selection */}
                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                        <button
                            type="button"
                            onClick={() => setType('IN')}
                            className={`py-2 rounded-md text-sm font-bold transition-all ${type === 'IN' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            ENTRADA (+)
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('OUT')}
                            className={`py-2 rounded-md text-sm font-bold transition-all ${type === 'OUT' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            SAÍDA (-)
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Item</label>
                        {preselectedItem ? (
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                <p className="font-bold text-slate-800">{preselectedItem.name}</p>
                                <p className="text-xs text-slate-500">Atual: {preselectedItem.quantity} {preselectedItem.unit}</p>
                            </div>
                        ) : (
                            <select
                                className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                                value={itemId}
                                onChange={e => setItemId(e.target.value)}
                            >
                                <option value="">Selecione um item...</option>
                                {inventory.map(i => (
                                    <option key={i.id} value={i.id}>{i.name} (Saldo: {i.quantity})</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade</label>
                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            className="w-full p-2 border border-slate-200 rounded-lg"
                            value={quantity}
                            onChange={e => setQuantity(e.target.value)}
                            placeholder="0.00"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Motivo / Tipo</label>
                        <select
                            className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                        >
                            <option value="">Selecione...</option>
                            {type === 'IN' ? (
                                <>
                                    <option value="purchase">Compra / Fornecedor</option>
                                    <option value="return">Devolução</option>
                                    <option value="production">Produção Interna</option>
                                    <option value="adjustment">Ajuste de Inventário</option>
                                </>
                            ) : (
                                <>
                                    <option value="maintenance">Uso em Manutenção</option>
                                    <option value="sale">Venda</option>
                                    <option value="discard">Descarte / Perda</option>
                                    <option value="adjustment">Ajuste de Inventário</option>
                                </>
                            )}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Ref. (Opcional)</label>
                        <input
                            className="w-full p-2 border border-slate-200 rounded-lg"
                            value={referenceId}
                            onChange={e => setReferenceId(e.target.value)}
                            placeholder={type === 'IN' ? "NF, Pedido..." : "OS, Campanha..."}
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 rounded-lg font-bold text-white shadow-lg transition-transform active:scale-[0.98] ${type === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30' : 'bg-red-600 hover:bg-red-700 shadow-red-600/30'}`}
                        >
                            {loading ? 'Registrando...' : `Confirmar ${type === 'IN' ? 'Entrada' : 'Saída'}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MovementModal;
