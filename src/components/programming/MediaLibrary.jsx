import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Upload, Search, Filter, FileVideo, FileImage, Trash2, CheckCircle, Clock, XCircle } from 'lucide-react';
import clsx from 'clsx';
import UploadMediaModal from './UploadMediaModal';

const MediaLibrary = () => {
    const { mediaFiles, updateMediaStatus } = useData(); // Add deleteMediaFile if available
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, video, image
    const [showUploadModal, setShowUploadModal] = useState(false);

    const filteredFiles = mediaFiles.filter(file => {
        const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || file.type === filterType;
        return matchesSearch && matchesType;
    });

    const handleStatusChange = async (id, newStatus) => {
        if (confirm(`Alterar status para ${newStatus}?`)) {
            await updateMediaStatus(id, newStatus);
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Biblioteca de Mídia</h2>
                    <p className="text-sm text-slate-500">Gerencie o conteúdo disponível para exibição.</p>
                </div>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark font-bold shadow-lg shadow-primary/30 transition-transform active:scale-95"
                >
                    <Upload size={18} /> Upload Mídia
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar arquivos..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilterType('all')}
                        className={clsx("px-4 py-2 rounded-lg text-sm font-bold transition-colors", filterType === 'all' ? "bg-white border border-slate-300 text-slate-800 shadow-sm" : "text-slate-500 hover:bg-white")}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilterType('video')}
                        className={clsx("px-4 py-2 rounded-lg text-sm font-bold transition-colors", filterType === 'video' ? "bg-white border border-slate-300 text-slate-800 shadow-sm" : "text-slate-500 hover:bg-white")}
                    >
                        Vídeos
                    </button>
                    <button
                        onClick={() => setFilterType('image')}
                        className={clsx("px-4 py-2 rounded-lg text-sm font-bold transition-colors", filterType === 'image' ? "bg-white border border-slate-300 text-slate-800 shadow-sm" : "text-slate-500 hover:bg-white")}
                    >
                        Imagens
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredFiles.map(file => (
                    <div key={file.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden group hover:border-primary/50 transition-all hover:shadow-md">
                        {/* Thumbnail */}
                        <div className="aspect-video bg-slate-100 relative group-hover:opacity-90 transition-opacity">
                            {file.type === 'image' ? (
                                <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                                    <FileVideo size={32} />
                                    {/* Ideally render a video thumbnail or play on hover */}
                                </div>
                            )}

                            {/* Status Badge */}
                            <div className="absolute top-2 right-2">
                                <span className={clsx(
                                    "px-2 py-0.5 text-[10px] font-bold rounded-full uppercase border shadow-sm",
                                    file.status === 'approved' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                        file.status === 'rejected' ? "bg-red-100 text-red-700 border-red-200" :
                                            "bg-amber-100 text-amber-700 border-amber-200"
                                )}>
                                    {file.status === 'approved' ? 'Aprovado' : file.status === 'rejected' ? 'Reprovado' : 'Pendente'}
                                </span>
                            </div>

                            {/* Duration Badge */}
                            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 rounded font-mono">
                                {file.duration}s
                            </div>
                        </div>

                        {/* Info */}
                        <div className="p-4">
                            <h3 className="font-bold text-slate-800 text-sm truncate" title={file.name}>{file.name}</h3>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                {file.type === 'image' ? <FileImage size={12} /> : <FileVideo size={12} />}
                                <span>{file.resolution}</span>
                                <span>•</span>
                                <span>{(file.size_bytes / 1024 / 1024).toFixed(1)} MB</span>
                            </div>

                            {/* Actions */}
                            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center opacity-40 group-hover:opacity-100 transition-opacity">
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleStatusChange(file.id, 'approved')}
                                        title="Aprovar"
                                        className="p-1.5 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded"
                                    >
                                        <CheckCircle size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange(file.id, 'rejected')}
                                        title="Reprovar"
                                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded"
                                    >
                                        <XCircle size={16} />
                                    </button>
                                </div>
                                <button className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredFiles.length === 0 && (
                <div className="text-center py-12 text-slate-400 italic">
                    Nenhum arquivo encontrado.
                </div>
            )}

            <UploadMediaModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
            />
        </div>
    );
};

export default MediaLibrary;
