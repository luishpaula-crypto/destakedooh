import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Save, AlertTriangle } from 'lucide-react';
import { useData } from '../../context/DataContext';

const SchedulingModal = ({ isOpen, onClose, preselectedAsset = null, preselectedDate = null }) => {
    const { assets, mediaFiles, playlistItems, addPlaylistItem } = useData();

    // Only show approved media
    const approvedMedia = mediaFiles.filter(m => m.status === 'approved');

    const [formData, setFormData] = useState({
        asset_id: '',
        media_id: '',
        start_date: '',
        end_date: '',
        start_time: '06:00',
        end_time: '23:00',
        days_of_week: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
        priority: 1
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [conflict, setConflict] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({
                ...prev,
                asset_id: preselectedAsset?.id || '',
                start_date: preselectedDate ? preselectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                end_date: preselectedDate ? preselectedDate.toISOString().split('T')[0] : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Default +15 days
            }));
            setError('');
            setConflict(null);
        }
    }, [isOpen, preselectedAsset, preselectedDate]);

    if (!isOpen) return null;

    const daysMap = [
        { key: 'sun', label: 'D' },
        { key: 'mon', label: 'S' },
        { key: 'tue', label: 'T' },
        { key: 'wed', label: 'Q' },
        { key: 'thu', label: 'Q' },
        { key: 'fri', label: 'S' },
        { key: 'sat', label: 'S' }
    ];

    const toggleDay = (dayKey) => {
        setFormData(prev => {
            const current = prev.days_of_week;
            if (current.includes(dayKey)) {
                return { ...prev, days_of_week: current.filter(d => d !== dayKey) };
            } else {
                return { ...prev, days_of_week: [...current, dayKey] };
            }
        });
    };

    const checkConflict = () => {
        // Simple client-side overlap check for demo
        // In reality, this should be a robust backend check or more complex logic
        // Verify if Asset has > 100% occupancy or overlapping slots if exclusive
        // For now, we just warn if > 10 items in same slot
        if (!formData.asset_id || !formData.start_date) return;

        const existing = playlistItems.filter(p =>
            p.asset_id === formData.asset_id &&
            p.start_date <= formData.end_date &&
            p.end_date >= formData.start_date
        );

        if (existing.length > 5) { // Arbitrary soft limit
            setConflict(`Atenção: Este ativo já possui ${existing.length} inserções neste período.`);
        } else {
            setConflict(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.days_of_week.length === 0) {
            setError('Selecione pelo menos um dia da semana.');
            setLoading(false);
            return;
        }

        try {
            const { error } = await addPlaylistItem(formData);
            if (error) throw error;
            onClose();
        } catch (err) {
            setError(err.message || 'Erro ao agendar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Calendar size={18} className="text-primary" />
                        Nova Programação
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                    {/* ASSET SELECT */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Painel / Ativo</label>
                        <select
                            required
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-primary"
                            value={formData.asset_id}
                            onChange={e => {
                                setFormData({ ...formData, asset_id: e.target.value });
                                checkConflict();
                            }}
                        >
                            <option value="">Selecione um ativo...</option>
                            {assets.map(a => (
                                <option key={a.id} value={a.id}>{a.name} - {a.address}</option>
                            ))}
                        </select>
                    </div>

                    {/* MEDIA SELECT */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Conteúdo (Mídia Aprovada)</label>
                        <select
                            required
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-primary"
                            value={formData.media_id}
                            onChange={e => setFormData({ ...formData, media_id: e.target.value })}
                        >
                            <option value="">Selecione a mídia...</option>
                            {approvedMedia.map(m => (
                                <option key={m.id} value={m.id}>{m.name} ({m.duration}s)</option>
                            ))}
                        </select>
                        {approvedMedia.length === 0 && <p className="text-[10px] text-red-500 mt-1">Nenhuma mídia aprovada disponível.</p>}
                    </div>

                    {/* DATE RANGE */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Data Início</label>
                            <input
                                type="date"
                                required
                                className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-primary"
                                value={formData.start_date}
                                onChange={e => {
                                    setFormData({ ...formData, start_date: e.target.value });
                                    checkConflict();
                                }}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Data Fim</label>
                            <input
                                type="date"
                                required
                                className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-primary"
                                value={formData.end_date}
                                onChange={e => {
                                    setFormData({ ...formData, end_date: e.target.value });
                                    checkConflict();
                                }}
                            />
                        </div>
                    </div>

                    {/* TIME & RECURRENCE */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">Dias da Semana</label>
                        <div className="flex gap-2 justify-between">
                            {daysMap.map(day => (
                                <button
                                    key={day.key}
                                    type="button"
                                    onClick={() => toggleDay(day.key)}
                                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${formData.days_of_week.includes(day.key)
                                            ? 'bg-primary text-white shadow-md shadow-primary/30'
                                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                        }`}
                                >
                                    {day.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Horário Início</label>
                            <div className="relative">
                                <Clock className="absolute left-2.5 top-2.5 text-slate-400" size={16} />
                                <input
                                    type="time"
                                    required
                                    className="w-full pl-9 p-2 border border-slate-200 rounded-lg text-sm focus:outline-primary"
                                    value={formData.start_time}
                                    onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Horário Fim</label>
                            <div className="relative">
                                <Clock className="absolute left-2.5 top-2.5 text-slate-400" size={16} />
                                <input
                                    type="time"
                                    required
                                    className="w-full pl-9 p-2 border border-slate-200 rounded-lg text-sm focus:outline-primary"
                                    value={formData.end_time}
                                    onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* CONFLICT ALERT */}
                    {conflict && (
                        <div className="bg-amber-50 text-amber-700 p-3 rounded-lg flex items-start gap-2 text-xs border border-amber-200">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            <p>{conflict}</p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-xs">
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="pt-4 flex gap-4 border-t border-slate-100 mt-4">
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
                            <Save size={18} />
                            {loading ? 'Salvando...' : 'Agendar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SchedulingModal;
