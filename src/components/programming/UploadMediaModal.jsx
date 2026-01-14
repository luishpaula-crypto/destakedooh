import React, { useState, useRef } from 'react';
import { X, Upload, CheckCircle, AlertCircle, FileVideo, FileImage } from 'lucide-react';
import { useData } from '../../context/DataContext';

const UploadMediaModal = ({ isOpen, onClose }) => {
    const { uploadMediaFile } = useData();
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [metadata, setMetadata] = useState({
        name: '',
        duration: 10,
        resolution: '',
        type: '',
        size: 0
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleFileSelect = (e) => {
        const selected = e.target.files[0];
        if (!selected) return;

        // Reset
        setError('');
        setFile(selected);
        setMetadata(prev => ({
            ...prev,
            name: selected.name,
            size: selected.size,
            type: selected.type.startsWith('image') ? 'image' : 'video'
        }));

        // Preview & Metadata Extraction
        const objectUrl = URL.createObjectURL(selected);
        setPreview(objectUrl);

        if (selected.type.startsWith('image')) {
            const img = new Image();
            img.onload = () => {
                setMetadata(prev => ({ ...prev, resolution: `${img.width}x${img.height}`, duration: 10 })); // Default image duration
            };
            img.src = objectUrl;
        } else if (selected.type.startsWith('video')) {
            const video = document.createElement('video');
            video.onloadedmetadata = () => {
                setMetadata(prev => ({
                    ...prev,
                    resolution: `${video.videoWidth}x${video.videoHeight}`,
                    duration: Math.round(video.duration)
                }));
            };
            video.src = objectUrl;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // In a real app, we would upload the file to Storage (S3/Supabase Storage) here.
            // For this localized version, we'll store the objectURL (blob) or a dataURL.
            // Since Blobs expire on reload, let's assume we just store the metadata 
            // and a placeholder URL for the demo, OR convert to Base64 (heavy but persistent-ish).
            // For now, I'll use the preview URL but warn it's temporary, 
            // OR I can mock a "storage url".

            // Mock Storage URL (in real life, this comes from storage bucket)
            const mockUrl = preview;

            const payload = {
                client_id: '00000000-0000-0000-0000-000000000000', // Default/System for now, or select client
                name: metadata.name,
                url: mockUrl,
                type: metadata.type,
                duration: parseInt(metadata.duration),
                resolution: metadata.resolution,
                size_bytes: metadata.size,
                status: 'pending'
            };

            const { error } = await uploadMediaFile(payload);
            if (error) throw error;

            onClose();
            setFile(null);
            setPreview(null);
        } catch (err) {
            setError(err.message || 'Erro ao fazer upload');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="font-bold text-slate-800">Upload de Mídia</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>

                <div className="p-6">
                    {!file ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                            <Upload className="mx-auto text-slate-400 mb-2" size={32} />
                            <p className="font-bold text-slate-600">Clique para selecionar</p>
                            <p className="text-xs text-slate-400">Imagens (JPG, PNG) ou Vídeos (MP4)</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*,video/*"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                        </div>
                    ) : (
                        <div className="flex gap-4 mb-6">
                            <div className="w-24 h-24 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                                {metadata.type === 'image' ? (
                                    <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                                ) : (
                                    <video src={preview} className="w-full h-full object-cover" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-800 truncate">{metadata.name}</h3>
                                <div className="text-xs text-slate-500 space-y-1 mt-1">
                                    <p className="flex items-center gap-1">
                                        {metadata.type === 'image' ? <FileImage size={12} /> : <FileVideo size={12} />}
                                        <span className="uppercase">{metadata.type}</span> • {metadata.resolution}
                                    </p>
                                    <p>{(metadata.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>
                            <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500 self-start">
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {file && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Nome de Exibição</label>
                                <input
                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-primary"
                                    value={metadata.name}
                                    onChange={e => setMetadata({ ...metadata, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Duração (segundos)</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-primary"
                                        value={metadata.duration}
                                        onChange={e => setMetadata({ ...metadata, duration: e.target.value })}
                                        required
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Resolução</label>
                                    <input
                                        className="w-full p-2 border border-slate-200 bg-slate-50 rounded-lg text-sm text-slate-500"
                                        value={metadata.resolution}
                                        readOnly
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-2 rounded text-xs flex items-center gap-2">
                                    <AlertCircle size={12} /> {error}
                                </div>
                            )}

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Enviando...' : 'Confirmar Upload'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UploadMediaModal;
