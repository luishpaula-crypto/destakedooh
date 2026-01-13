import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { generateCheckinPPT } from '../utils/pptGenerator';
import { Camera, MapPin, Upload, FileVideo, Download, Loader2, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';

const Checkin = () => {
    const { assets: ALL_ASSETS, quotes: QUOTES } = useData();
    const location = useLocation();
    const navigate = useNavigate();

    // Check for Campaign Context
    const campaignId = location.state?.quoteId;
    const activeCampaign = campaignId ? QUOTES.find(q => q.id === campaignId) : null;

    // Filter Assets: If campaign active, only show its assets. Else show all.
    const availableAssets = activeCampaign
        ? activeCampaign.assets.map(qa => ALL_ASSETS.find(a => a.id === qa.id) || qa)
        : ALL_ASSETS;

    const [selectedAssetId, setSelectedAssetId] = useState('');
    const [geoLoading, setGeoLoading] = useState(false);
    const [deviceLocation, setDeviceLocation] = useState(null);
    const [loading, setLoading] = useState(false);

    // Files State
    const [files, setFiles] = useState({ photo1: null, photo2: null, video: null });
    const [descriptions, setDescriptions] = useState({ photo1: '', photo2: '' });

    // Auto-select if only 1 asset
    useEffect(() => {
        if (availableAssets.length === 1 && !selectedAssetId) {
            setSelectedAssetId(availableAssets[0].id);
        }
    }, [availableAssets]);

    const handleCapture = (type, inputFiles) => {
        if (!inputFiles || inputFiles.length === 0) return;
        setLoading(true);
        if (!deviceLocation) setGeoLoading(true);

        // Get Geo if not present
        if (!deviceLocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setDeviceLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setGeoLoading(false);
                },
                (err) => {
                    console.error("Geo error", err);
                    setGeoLoading(false);
                },
                { enableHighAccuracy: true }
            );
        }

        const file = inputFiles[0];
        const reader = new FileReader();

        reader.onload = (e) => {
            setFiles(prev => ({ ...prev, [type]: e.target.result }));

            // Mock AI Description
            if (type.startsWith('photo')) {
                setTimeout(() => {
                    setDescriptions(prev => ({
                        ...prev,
                        [type]: `Análise IA: Imagem detectada com alta luminosidade. Veiculação visível. Local compatível.`
                    }));
                    setLoading(false);
                }, 1500);
            } else {
                setLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDownloadPPT = () => {
        const asset = availableAssets.find(a => a.id === selectedAssetId);
        if (!asset) return;

        const data = {
            clientName: activeCampaign ? activeCampaign.client.name : 'Avulso',
            assetName: asset.name,
            campaignId: activeCampaign?.id,
            photos: [
                { url: files.photo1, aiDescription: descriptions.photo1, lat: deviceLocation?.lat, lng: deviceLocation?.lng },
                { url: files.photo2, aiDescription: descriptions.photo2, lat: deviceLocation?.lat, lng: deviceLocation?.lng }
            ]
        };
        generateCheckinPPT(data);
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="mb-8 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Check-in de Campanha</h1>
                    <p className="text-slate-500 mt-1">
                        {activeCampaign
                            ? `Campanha: ${activeCampaign.client.name} (Ref: ${activeCampaign.id})`
                            : 'Registro fotográfico e validação de exibição (Avulso)'}
                    </p>
                </div>
                {activeCampaign && (
                    <button
                        onClick={() => navigate('/quotes')}
                        className="text-slate-500 hover:text-slate-700 flex items-center gap-1 text-sm font-medium"
                    >
                        <ArrowLeft size={16} /> Voltar
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    {/* Asset Selection */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800">Selecione o Ativo</h3>
                            {activeCampaign && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-bold">{availableAssets.length} Ativos na Campanha</span>}
                        </div>
                        <select
                            className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
                            value={selectedAssetId}
                            onChange={e => setSelectedAssetId(e.target.value)}
                        >
                            <option value="">Selecione...</option>
                            {availableAssets.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Capture Zones */}
                    {['photo1', 'photo2', 'video'].map((type, idx) => (
                        <div key={type} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-slate-800 capitalize">
                                    {type === 'video' ? 'Vídeo (Check-in Video)' : `Foto ${idx + 1}`}
                                </h3>
                                {type !== 'video' && descriptions[type] && (
                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold">
                                        IA Processada
                                    </span>
                                )}
                            </div>

                            {!files[type] ? (
                                <label className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-primary transition-colors h-48">
                                    <Camera size={32} className="text-slate-400 mb-2" />
                                    <span className="text-sm text-slate-500">Toque para capturar</span>
                                    <input
                                        type="file"
                                        accept={type === 'video' ? "video/*" : "image/*"}
                                        capture="environment"
                                        className="hidden"
                                        onChange={(e) => handleCapture(type, e.target.files)}
                                    />
                                </label>
                            ) : (
                                <div className="space-y-4">
                                    {type === 'video' ? (
                                        <div className="aspect-video bg-black rounded-lg flex items-center justify-center text-white">
                                            <FileVideo size={48} />
                                            <span className="ml-2">Vídeo Carregado</span>
                                        </div>
                                    ) : (
                                        <img src={files[type]} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                                    )}

                                    {type !== 'video' && (
                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                            <p className="text-xs font-bold text-slate-400 mb-1">IA ANALYTICS</p>
                                            <p className="text-sm text-slate-700">
                                                {loading && !descriptions[type] ? (
                                                    <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={14} /> Analisando...</span>
                                                ) : descriptions[type]}
                                            </p>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => setFiles(prev => ({ ...prev, [type]: null }))}
                                        className="text-red-500 text-xs hover:underline"
                                    >
                                        Refazer
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Status Side */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-6">
                        <h3 className="font-bold text-slate-800 mb-4">Relatório</h3>

                        <div className="space-y-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center", selectedAssetId ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400')}>
                                    1
                                </div>
                                <span className={clsx("text-sm font-medium", selectedAssetId ? "text-slate-800" : "text-slate-400")}>Ativo</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center", deviceLocation ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400')}>
                                    <MapPin size={16} />
                                </div>
                                <span className={clsx("text-sm font-medium", deviceLocation ? "text-slate-800" : "text-slate-400")}>GPS {geoLoading && '(Buscando...)'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center", (files.photo1 && files.photo2) ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400')}>
                                    <Camera size={16} />
                                </div>
                                <span className={clsx("text-sm font-medium", (files.photo1 && files.photo2) ? "text-slate-800" : "text-slate-400")}>2 Fotos</span>
                            </div>
                        </div>

                        <button
                            onClick={handleDownloadPPT}
                            disabled={!files.photo1 || !files.photo2}
                            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Download size={20} />
                            <span>Gerar PPT de Comprovação</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkin;
