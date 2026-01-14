import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { generateHistoryPDF } from '../utils/pdfGenerator';
import {
    Calendar,
    MonitorPlay,
    Film,
    ChevronLeft,
    ChevronRight,
    Search,
    Upload,
    CheckCircle,
    AlertCircle,
    Play,
    Printer,
    Filter,
    X,
    FileText,
    User,
    MapPin,
    History // Added History Icon
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import MediaLibrary from '../components/programming/MediaLibrary';
import SchedulingModal from '../components/programming/SchedulingModal';

const Programming = () => {
    const { assets, quotes, updateQuote, mediaFiles, playlistItems } = useData();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('planning'); // planning, daily, content
    const [currentDate, setCurrentDate] = useState(new Date());
    // Daily View State
    const [dailyStartDate, setDailyStartDate] = useState(() => {
        const d = new Date();
        const offset = d.getTimezoneOffset(); // Fix timezone for default
        const local = new Date(d.getTime() - (offset * 60 * 1000));
        return local.toISOString().split('T')[0];
    });
    const [dailyEndDate, setDailyEndDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 15); // Default + 15 days
        const offset = d.getTimezoneOffset();
        const local = new Date(d.getTime() - (offset * 60 * 1000));
        return local.toISOString().split('T')[0];
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [assetFilter, setAssetFilter] = useState('');

    // Modal State
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [gridSelection, setGridSelection] = useState(null); // { bookings: [], day: Date, assetName: string }
    const [viewAssetsModalOpen, setViewAssetsModalOpen] = useState(false);
    const [selectedCampaignForAssets, setSelectedCampaignForAssets] = useState(null);
    const [showSchedulingModal, setShowSchedulingModal] = useState(false);
    const [schedulingDefaults, setSchedulingDefaults] = useState({ asset: null, date: null });

    // --- HELPERS ---
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        return Array.from({ length: days }, (_, i) => new Date(year, month, i + 1));
    };

    const getBookings = (assetId, dateObj) => {
        // Use local YYYY-MM-DD to match the input[type="date"] values stored in playlist
        const offset = dateObj.getTimezoneOffset();
        const localDate = new Date(dateObj.getTime() - (offset * 60 * 1000));
        const dateStr = localDate.toISOString().split('T')[0];

        // Filter playlistItems
        // We need 'mediaFiles' to resolve name since playlistItem has media_id
        const items = playlistItems.filter(p => {
            // Date Range Check
            if (!(dateStr >= p.start_date && dateStr <= p.end_date)) return false;
            // Asset Check
            if (p.asset_id !== assetId) return false;
            // Days of Week Check
            const dayName = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][dateObj.getDay()];
            if (!p.days_of_week.includes(dayName)) return false;

            return true;
        });

        // Enrich with Media Name
        return items.map(item => {
            const media = mediaFiles.find(m => m.id === item.media_id);
            return {
                ...item,
                campaignName: media ? media.name : 'Unknown Media',
                status: 'approved', // Playlist items are inherently active if scheduled
                mediaStatus: 'received',
                startDate: item.start_date,
                endDate: item.end_date
            };
        });
    };

    const getBookingsInRange = (assetId, startStr, endStr) => {
        return playlistItems.filter(p => {
            // Asset Check
            if (p.asset_id !== assetId) return false;

            // Overlap Check: (StartA <= EndB) and (EndA >= StartB)
            // p.start_date/end_date are strings YYYY-MM-DD
            if (!(p.start_date <= endStr && p.end_date >= startStr)) return false;

            return true;
        }).map(item => {
            const media = mediaFiles.find(m => m.id === item.media_id);
            // Mock Client Name if not available, or derive from Media/Project
            // For now, we don't have direct client link in item, but media has client_id (which is UUID or Text)
            // We can try to find client name if we had clients context, but for now fallback to 'Cliente' or similar.
            // Actually, getBookings didn't map client, but the grid usage tried to access booking.client.name.
            // I should make sure returned object HAS client object structure or usage changes.
            // The Daily View (lines 949) accesses booking.client.name.
            // Media file has client_id.

            return {
                ...item,
                campaignName: media ? media.name : 'Mídia Desconhecida',
                client: { name: media ? `Cliente (${media.client_id})` : 'Cliente N/A' }, // Mocking client object to prevent crash
                status: 'ativo',
                mediaStatus: media ? media.status : 'pending',
                startDate: item.start_date,
                endDate: item.end_date
            };
        });
    };

    const handlePrint = () => {
        window.print();
    };

    // --- CONTENT CONTROL LOGIC ---
    const activeQuotes = quotes.filter(q => ['aprovado', 'ativo'].includes(q.status));
    const filteredContentQuotes = activeQuotes.filter(q =>
        q.campaignName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.client.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- MEDIA HISTORY STATE ---
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [selectedHistoryBooking, setSelectedHistoryBooking] = useState(null);
    const [newHistoryNote, setNewHistoryNote] = useState('');

    // AI Analysis State
    const [analysisState, setAnalysisState] = useState(null); // { loading: bool, approved: bool, checks: [] }
    const [forceAccept, setForceAccept] = useState(false);

    const handleFileCheck = (file) => {
        setAnalysisState({ loading: true, checks: [] });

        // Simulate Processing Delay
        setTimeout(() => {
            const checks = [];
            const video = document.createElement('video');
            video.preload = 'metadata';

            // Basic File Reading
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    performChecks(img.width, img.height);
                };
                img.onerror = () => {
                    // Try as Video if Image fails (or use type check earlier)
                    if (file.type.startsWith('video')) {
                        video.onloadedmetadata = () => {
                            performChecks(video.videoWidth, video.videoHeight);
                        };
                        video.src = URL.createObjectURL(file);
                    } else {
                        setAnalysisState({
                            loading: false,
                            approved: false,
                            checks: [{ name: 'Formato', status: 'error', details: 'Arquivo inválido' }]
                        });
                    }
                };
                img.src = e.target.result;
            };

            reader.readAsDataURL(file);

            const performChecks = (w, h) => {
                let approved = true;

                // 1. Resolution Check
                // Get target resolution from Asset (defaulting to 1920x1080 if missing)
                const asset = selectedHistoryBooking?.assets?.[0]; // Assuming 1 asset per booking or checking first
                // Parse resolution string "1920x1080"
                let targetW = 1920;
                let targetH = 1080;

                if (asset && asset.resolution) {
                    const parts = asset.resolution.toLowerCase().split('x');
                    if (parts.length === 2) {
                        targetW = parseInt(parts[0]);
                        targetH = parseInt(parts[1]);
                    }
                }

                if (w === targetW && h === targetH) {
                    checks.push({ name: 'Resolução', status: 'ok', details: `${w}x${h} (Exato)` });
                } else {
                    checks.push({ name: 'Resolução', status: 'error', details: `Recebido ${w}x${h} (Meta ${targetW}x${targetH})` });
                    approved = false;
                }

                // 2. Aspect Ratio (Tolerance 0.05)
                const ratio = w / h;
                const targetRatio = targetW / targetH;
                const diff = Math.abs(ratio - targetRatio);

                if (diff < 0.05) {
                    checks.push({ name: 'Proporção', status: 'ok', details: 'Compatível' });
                } else {
                    checks.push({ name: 'Proporção', status: 'error', details: 'Distorção detectada' });
                    approved = false;
                }

                // 3. AI Legibility (Mock)
                // Randomize or based on size? Let's assume > 720p is legible for demo
                const isLegible = h >= 720;
                checks.push({
                    name: 'Legibilidade (IA)',
                    status: isLegible ? 'ok' : 'warning',
                    details: isLegible ? 'Texto nítido' : 'Baixa definição provável'
                });

                // Final State
                setAnalysisState({
                    loading: false,
                    approved: approved && isLegible,
                    checks
                });
            };

        }, 1500); // 1.5s simulated delay
    };

    const toggleMediaStatus = (quote, newStatus, note = '', aiData = null) => {
        console.log("toggleMediaStatus called", { id: quote.id, newStatus, note, aiData });
        const historyEntry = {
            date: new Date().toISOString(),
            status: newStatus,
            user: user?.name || 'Sistema',
            note: note,
            aiData: aiData
        };

        // Handle both camelCase (local) and snake_case (DB) for history
        const currentHistory = quote.mediaHistory || quote.media_history || [];
        const updatedHistory = [...currentHistory, historyEntry];

        const updatedQuote = {
            ...quote,
            // Update snake_case for Supabase
            media_status: newStatus,
            media_history: updatedHistory,
            // Update camelCase for local optimistic UI (though DataContext will overwrite on success)
            mediaStatus: newStatus,
            mediaHistory: updatedHistory
        };
        console.log("Sending updateQuote", updatedQuote);
        updateQuote(updatedQuote);
    };

    const handleOpenHistory = (booking) => {
        console.log("Opening history for booking", booking);
        setSelectedHistoryBooking(booking);
        setHistoryModalOpen(true);
        setAnalysisState(null); // Reset Analysis
        setForceAccept(false);
    };

    const handleAddHistory = (status) => {
        console.log("handleAddHistory trigger", status, selectedHistoryBooking);
        if (selectedHistoryBooking) {
            // Fetch the latest version of the quote to ensure we are updating current state
            const latestQuote = quotes.find(q => q.id === selectedHistoryBooking.id);
            if (latestQuote) {
                toggleMediaStatus(latestQuote, status, newHistoryNote, analysisState); // Pass analysisState
                // alert(`Status "${status}" confirmado para ${latestQuote.campaignName}!`); // Optional: Visual confirmation for user
            } else {
                console.error("Quote not found in state", selectedHistoryBooking.id);
                alert("Erro: Orçamento não encontrado. Tente recarregar a página.");
                // Fallback attempt
                toggleMediaStatus(selectedHistoryBooking, status, newHistoryNote, analysisState);
            }
            setNewHistoryNote('');
            setHistoryModalOpen(false);
        }
    };

    // Filter Assets for Grid
    const filteredAssets = assets.filter(a =>
        a.name.toLowerCase().includes(assetFilter.toLowerCase()) ||
        a.address.toLowerCase().includes(assetFilter.toLowerCase())
    );

    // --- TOOLTIP STATE ---
    const [tooltipBox, setTooltipBox] = useState({ visible: false, x: 0, y: 0, content: '' });

    const handleGridEnter = (e, content) => {
        const rect = e.target.getBoundingClientRect();
        setTooltipBox({
            visible: true,
            x: rect.left + window.scrollX + (rect.width / 2),
            y: rect.top + window.scrollY - 10,
            content
        });
    };

    const handleGridLeave = () => {
        setTooltipBox(prev => ({ ...prev, visible: false }));
    };

    const daysOfMonth = getDaysInMonth(currentDate);
    const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    return (
        <div className="p-8 max-w-[1600px] mx-auto print:p-0 print:max-w-none relative">
            {/* MEDIA HISTORY MODAL */}
            {historyModalOpen && selectedHistoryBooking && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <FileText size={18} className="text-primary" />
                                Histórico de Mídia
                            </h3>
                            <button onClick={() => setHistoryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <div className="mb-6">
                                <h4 className="text-sm font-bold text-slate-700">{selectedHistoryBooking.campaignName}</h4>
                                <p className="text-xs text-slate-500">{selectedHistoryBooking.client.name}</p>
                                <div className="mt-2 text-xs bg-slate-100 p-2 rounded border border-slate-200">
                                    <p><span className="font-bold">Resolução Esperada:</span> {selectedHistoryBooking.assets && selectedHistoryBooking.assets[0] ? (selectedHistoryBooking.assets[0].resolution || 'N/A') : 'N/A'}</p>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="space-y-4 mb-6 max-h-48 overflow-y-auto pr-2">
                                {selectedHistoryBooking.mediaHistory && selectedHistoryBooking.mediaHistory.length > 0 ? (
                                    selectedHistoryBooking.mediaHistory.map((h, i) => (
                                        <div key={i} className="flex gap-3 text-sm">
                                            <div className="flex flex-col items-center">
                                                <div className={clsx("w-2 h-2 rounded-full mt-1.5",
                                                    h.status === 'received' ? 'bg-emerald-500' :
                                                        h.status === 'rejected' ? 'bg-red-500' : 'bg-amber-400'
                                                )}></div>
                                                {i < selectedHistoryBooking.mediaHistory.length - 1 && <div className="w-px h-full bg-slate-200 my-1"></div>}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800 capitalize">{h.status === 'received' ? 'Recebido' : h.status === 'rejected' ? 'Refugado' : 'Pendente'}</p>
                                                <p className="text-xs text-slate-500">{new Date(h.date).toLocaleString()}</p>
                                                {h.note && <p className="text-xs text-slate-600 mt-1 italic">"{h.note}"</p>}
                                                {h.aiData && (
                                                    <div className="mt-1 flex gap-2">
                                                        {h.aiData.checks.map((check, idx) => (
                                                            <span key={idx} className={clsx("text-[10px] px-1.5 py-0.5 rounded border",
                                                                check.status === 'ok' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-red-50 border-red-100 text-red-600"
                                                            )}>
                                                                {check.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                <p className="text-[10px] text-slate-400 mt-0.5">Por: {h.user}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-400 text-center italic">Nenhum histórico registrado.</p>
                                )}
                            </div>

                            {/* AI Verification Section */}
                            <div className="border-t border-slate-100 pt-4">
                                <label className="block text-xs font-bold text-slate-500 mb-2">Validação de Arquivo (AI)</label>

                                {!analysisState && (
                                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                                        <input
                                            type="file"
                                            accept="image/*,video/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    handleFileCheck(e.target.files[0]);
                                                }
                                            }}
                                        />
                                        <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                                        <p className="text-xs text-slate-500 font-medium">Clique ou arraste um arquivo para validar</p>
                                        <p className="text-[10px] text-slate-400 mt-1">Verificação de Resolução, Proporção e Legibilidade</p>
                                    </div>
                                )}

                                {analysisState && (
                                    <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200">
                                        <div className="flex justify-between items-center mb-3">
                                            <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                                {analysisState.loading ? <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin"></div> : <MonitorPlay size={14} className="text-primary" />}
                                                Resultado da Análise
                                            </h5>
                                            {!analysisState.loading && (
                                                <button onClick={() => setAnalysisState(null)} className="text-[10px] text-slate-400 hover:text-slate-600 underline">
                                                    Trocar Arquivo
                                                </button>
                                            )}
                                        </div>

                                        {analysisState.loading ? (
                                            <p className="text-xs text-slate-500 italic">Processando arquivo...</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {analysisState.checks.map((check, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-xs">
                                                        <span className="text-slate-600">{check.name}</span>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className={clsx("font-medium", check.status === 'ok' ? "text-emerald-600" : "text-red-500")}>
                                                                {check.details}
                                                            </span>
                                                            {check.status === 'ok' ? <CheckCircle size={12} className="text-emerald-500" /> : <AlertCircle size={12} className="text-red-500" />}
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className={clsx("mt-3 pt-3 border-t text-xs font-bold text-center",
                                                    analysisState.approved ? "text-emerald-600 border-emerald-100" : "text-red-500 border-red-100"
                                                )}>
                                                    {analysisState.approved ? "ARQUIVO APROVADO PELO SISTEMA" : "ARQUIVO REPROVADO PELO SISTEMA"}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="mt-4">
                                    <label className="block text-xs font-bold text-slate-500 mb-2">Observação Manual</label>
                                    <textarea
                                        className="w-full text-sm border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-primary/20 focus:border-primary mb-3"
                                        rows="2"
                                        placeholder="Observação..."
                                        value={newHistoryNote}
                                        onChange={(e) => setNewHistoryNote(e.target.value)}
                                    ></textarea>

                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => handleAddHistory('received')}
                                            disabled={!analysisState?.approved && !forceAccept} // Disable unless approved OR Force Accept active
                                            className={clsx("px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2",
                                                (!analysisState?.approved && !forceAccept)
                                                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                                    : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                            )}
                                        >
                                            <CheckCircle size={14} />
                                            Confirmar Recebimento
                                        </button>
                                        <button
                                            onClick={() => handleAddHistory('rejected')}
                                            className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                                        >
                                            Refugar Mídia
                                        </button>
                                    </div>

                                    {/* Force Accept Option */}
                                    {analysisState && !analysisState.approved && (
                                        <div className="mt-3 flex items-center gap-2 justify-center">
                                            <input
                                                type="checkbox"
                                                id="forceAccept"
                                                checked={forceAccept}
                                                onChange={(e) => setForceAccept(e.target.checked)}
                                                className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                                            />
                                            <label htmlFor="forceAccept" className="text-xs text-amber-600 font-bold cursor-pointer select-none">
                                                Forçar Aceite (Ignorar Alerta AI)
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ASSETS LIST MODAL */}
            {viewAssetsModalOpen && selectedCampaignForAssets && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <MonitorPlay size={18} className="text-primary" />
                                    Ativos da Campanha
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">{selectedCampaignForAssets.campaignName}</p>
                            </div>
                            <button onClick={() => setViewAssetsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-0 overflow-y-auto">
                            {selectedCampaignForAssets.assets.map((asset, index) => (
                                <div key={asset.id} className={clsx("p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors flex gap-4", index === selectedCampaignForAssets.assets.length - 1 && "border-0")}>
                                    <div className="w-16 h-16 bg-slate-100 rounded-lg shrink-0 overflow-hidden">
                                        {asset.photo ? (
                                            <img src={asset.photo} className="w-full h-full object-cover" alt={asset.name} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300"><MapPin size={20} /></div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">{asset.name}</h4>
                                        <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                            <MapPin size={10} /> {asset.address} {asset.bairro ? `- ${asset.bairro}` : ''}
                                        </p>
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                                {asset.format || 'Fmt N/A'}
                                            </span>
                                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                                {asset.resolution || 'Res N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 text-center">
                            <button onClick={() => setViewAssetsModalOpen(false)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 w-full">
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ASSETS LIST MODAL */
                /* ... (keep existing) ... */
            }

            {/* GRID SELECTION MODAL */}


            {/* TOOLTIP PORTAL */}
            {tooltipBox.visible && (
                <div
                    className="fixed z-50 bg-slate-800 text-white text-xs rounded-lg py-2 px-3 shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full whitespace-pre-line"
                    style={{ left: tooltipBox.x, top: tooltipBox.y }}
                >
                    <div className="font-bold mb-1 text-slate-300 uppercase text-[10px] tracking-wider">Campanhas</div>
                    {tooltipBox.content}
                    {/* Tiny arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                </div>
            )}

            {/* HEADER - Hidden on Print */}
            {activeTab !== 'content' && (
                <div className="flex justify-between items-center mb-8 print:hidden">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                            Programação & Grade
                        </h1>
                        <p className="text-slate-500 mt-1">Gestão profissional de exibição e mídia</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setSchedulingDefaults({ asset: null, date: null });
                                setShowSchedulingModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-600/20 transition-transform active:scale-95"
                        >
                            <Calendar size={18} /> Novo Agendamento
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition-colors"
                        >
                            <Printer size={18} /> Imprimir / Exportar
                        </button>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Filtrar Paineis..."
                                value={assetFilter}
                                onChange={(e) => setAssetFilter(e.target.value)}
                                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* NAV TABS - Hidden on Print */}
            <div className="bg-white rounded-t-xl border-b border-slate-200 flex print:hidden">
                <button onClick={() => setActiveTab('planning')} className={clsx("flex items-center gap-2 px-6 py-4 border-b-2 font-medium transition-colors", activeTab === 'planning' ? "border-primary text-primary bg-primary/5" : "border-transparent text-slate-500 hover:text-slate-700")}>
                    <Calendar size={18} /> Grade Mensal
                </button>
                <button onClick={() => setActiveTab('daily')} className={clsx("flex items-center gap-2 px-6 py-4 border-b-2 font-medium transition-colors", activeTab === 'daily' ? "border-primary text-primary bg-primary/5" : "border-transparent text-slate-500 hover:text-slate-700")}>
                    <MonitorPlay size={18} /> Programação Diária
                </button>
                <button onClick={() => setActiveTab('content')} className={clsx("flex items-center gap-2 px-6 py-4 border-b-2 font-medium transition-colors", activeTab === 'content' ? "border-primary text-primary bg-primary/5" : "border-transparent text-slate-500 hover:text-slate-700")}>
                    <Film size={18} /> Biblioteca de Mídia
                </button>
                <button onClick={() => setActiveTab('active')} className={clsx("flex items-center gap-2 px-6 py-4 border-b-2 font-medium transition-colors", activeTab === 'active' ? "border-primary text-primary bg-primary/5" : "border-transparent text-slate-500 hover:text-slate-700")}>
                    <Play size={18} /> Campanhas Ativas
                </button>
                <button onClick={() => setActiveTab('history')} className={clsx("flex items-center gap-2 px-6 py-4 border-b-2 font-medium transition-colors", activeTab === 'history' ? "border-primary text-primary bg-primary/5" : "border-transparent text-slate-500 hover:text-slate-700")}>
                    <History size={18} /> Histórico de Mídia
                </button>
            </div>

            <div className={clsx("bg-white rounded-b-xl shadow-sm border border-t-0 border-slate-200 min-h-[600px] text-sm print:shadow-none print:border-0 print:p-0", activeTab === 'content' ? 'p-0' : 'p-6')}>

                {/* --- VIEW: PLANNING (GRID) --- */}
                {activeTab === 'planning' && (
                    <div className="animate-fadeIn">
                        {/* PRINT STYLES & HEADER */}
                        <style>{`
                            @media print {
                                @page { margin: 10mm; }
                                body { -webkit-print-color-adjust: exact; }
                            }
                        `}</style>

                        <div className="hidden print:flex items-center gap-6 mb-6 border-b border-slate-200 pb-4">
                            {/* Logo Replica */}
                            <div className="flex items-center gap-3">
                                <img src={logo} alt="DESTAKE DOOH" className="h-12 w-auto object-contain" />
                            </div>

                            {/* Divider */}
                            <div className="h-8 w-px bg-slate-300"></div>

                            {/* Period Info */}
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 capitalize leading-none">{monthName}</h2>
                                <p className="text-xs text-slate-500 mt-0.5 uppercase tracking-wide font-medium">Relatório de Grade Mensal</p>
                            </div>
                        </div>

                        {/* Month Nav (Hidden on Print) */}
                        <div className="flex items-center justify-between mb-6 print:hidden">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 print:hidden"><ChevronLeft size={20} /></button>
                                <h2 className="text-xl font-bold text-slate-800 capitalize w-48 text-center">{monthName}</h2>
                                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 print:hidden"><ChevronRight size={20} /></button>
                            </div>
                            <div className="flex items-center gap-4 text-xs print:hidden">
                                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-500 rounded-sm"></span> Ativo (Mídia OK)</div>
                                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-400 rounded-sm"></span> Pendente Mídia</div>
                            </div>
                        </div>

                        {/* GRID SCROLLABLE */}
                        <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[70vh] print:max-h-none print:overflow-visible print:border-0 print:text-[10px]">
                            <table className="w-full border-collapse">
                                <thead className="sticky top-0 z-30 bg-white shadow-sm print:static print:shadow-none">
                                    <tr>
                                        <th className="sticky left-0 z-40 bg-slate-50 p-3 border-b border-r border-slate-200 text-left min-w-[200px] text-slate-600 font-bold">Ativo / Painel</th>
                                        {daysOfMonth.map(day => (
                                            <th key={day.toISOString()} className="p-2 border-b border-slate-200 bg-slate-50 text-center min-w-[35px]">
                                                <div className="text-xs text-slate-400 font-medium uppercase mb-0.5">{day.toLocaleDateString('pt-BR', { weekday: 'narrow' })}</div>
                                                <div className={clsx("text-sm font-bold", day.toDateString() === new Date().toDateString() ? "text-primary bg-primary/10 rounded-full w-6 h-6 flex items-center justify-center mx-auto" : "text-slate-700")}>{day.getDate()}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAssets.map((asset, index) => (
                                        <tr key={asset.id} className={clsx("hover:bg-primary/5 transition-colors", index % 2 === 0 ? "bg-white" : "bg-slate-50")}>
                                            <td className={clsx("sticky left-0 z-20 p-3 border-b border-r border-slate-200 font-medium text-slate-700 truncate max-w-[200px] border-l-4 border-l-transparent hover:border-l-primary transition-colors", index % 2 === 0 ? "bg-white" : "bg-slate-50")}>
                                                {asset.name}
                                                <div className="text-[10px] text-slate-400 font-normal truncate">{asset.address}</div>
                                            </td>
                                            {daysOfMonth.map(day => {
                                                const bookings = getBookings(asset.id, day);
                                                const booking = bookings[0]; // For Grid, show first for now (or a mix indicator)
                                                const isStart = booking && day.toISOString().split('T')[0] === booking.startDate;

                                                return (
                                                    <td key={day} className="border-b border-slate-100 p-0 h-12 relative group border-r border-r-slate-50">
                                                        {booking ? (
                                                            <div
                                                                onClick={() => setGridSelection({ bookings, day, assetName: asset.name, assetId: asset.id })}
                                                                onMouseEnter={(e) => handleGridEnter(e, bookings.map(b => b.campaignName).join('\n'))}
                                                                onMouseLeave={handleGridLeave}
                                                                className={clsx(
                                                                    "w-full h-full cursor-pointer transition-all relative border-y border-white hover:brightness-95",
                                                                    // Dynamic Color based on Media Status
                                                                    booking.mediaStatus === 'received' ? "bg-emerald-500" : "bg-amber-400",
                                                                    bookings.length > 1 && "bg-gradient-to-br from-emerald-500 to-amber-400" // Mixed indicator if multiple
                                                                )}
                                                            >
                                                                {(isStart || day.getDate() === 1) && (
                                                                    <div className="absolute left-1 top-1/2 -translate-y-1/2 z-10 pointer-events-none drop-shadow-md flex items-center gap-1">
                                                                        {booking.mediaStatus !== 'received' && <AlertCircle size={10} className="text-white animate-pulse" />}
                                                                        <span className="text-[10px] text-white font-bold whitespace-nowrap">{booking.campaignName.substring(0, 15)}</span>
                                                                        {bookings.length > 1 && <span className="bg-white text-slate-800 text-[8px] px-1 rounded-full font-bold">+{bookings.length - 1}</span>}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="w-full h-full hover:bg-slate-50"></div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- VIEW: DAILY --- */}
                {activeTab === 'daily' && (
                    <div className="animate-fadeIn max-w-6xl mx-auto">

                        {/* Daily Header & Controls */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-200 print:hidden">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Programação por Período</h2>
                                <p className="text-slate-500 text-sm">Visão operacional de exibição</p>
                            </div>

                            <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                                <div className="flex items-center gap-2 px-2">
                                    <span className="text-xs text-slate-400 uppercase font-bold">De:</span>
                                    <input
                                        type="date"
                                        value={dailyStartDate}
                                        onChange={(e) => setDailyStartDate(e.target.value)}
                                        className="p-2 border-0 font-bold text-slate-800 focus:ring-0 bg-transparent"
                                    />
                                </div>
                                <div className="w-px h-8 bg-slate-200"></div>
                                <div className="flex items-center gap-2 px-2">
                                    <span className="text-xs text-slate-400 uppercase font-bold">Até:</span>
                                    <input
                                        type="date"
                                        value={dailyEndDate}
                                        onChange={(e) => setDailyEndDate(e.target.value)}
                                        className="p-2 border-0 font-bold text-slate-800 focus:ring-0 bg-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Print Header */}
                        <div className="hidden print:flex items-center gap-6 mb-6 border-b border-slate-200 pb-4">
                            {/* Logo */}
                            <div className="flex items-center gap-3">
                                <img src={logo} alt="DESTAKE DOOH" className="h-12 w-auto object-contain" />
                            </div>

                            {/* Divider */}
                            <div className="h-8 w-px bg-slate-300"></div>

                            {/* Period Info */}
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 capitalize leading-none">Relatório de Exibição</h2>
                                <p className="text-xs text-slate-500 mt-0.5 uppercase tracking-wide font-medium">Período: {new Date(dailyStartDate).toLocaleDateString()} a {new Date(dailyEndDate).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 print:mb-4">
                            {(() => {
                                const totalAssets = filteredAssets.length;

                                // Calculate Capacity based on Quotas (Default to 1 if missing/zero to avoid div/0, or maybe standard 10?)
                                // Assuming standard 20 quotas if not specified for now, or 1? Let's use 1 and if defined use value.
                                // Actually, let's treat "Active Campaigns" vs "Total Quotas".

                                let totalQuotasCapacity = 0;
                                let totalActiveCampaigns = 0;
                                const uniquePendingBookings = new Set();

                                filteredAssets.forEach(asset => {
                                    const assetQuotas = parseInt(asset.numero_cotas) || 18; // Defaulting to 18 as requested
                                    totalQuotasCapacity += assetQuotas;

                                    const bookings = getBookingsInRange(asset.id, dailyStartDate, dailyEndDate);
                                    totalActiveCampaigns += bookings.length;

                                    bookings.forEach(b => {
                                        if (b.mediaStatus !== 'received') {
                                            const uniqueKey = b.controlNumber || `${b.campaignName}-${b.client.name}`;
                                            uniquePendingBookings.add(uniqueKey);
                                        }
                                    });
                                });

                                const totalPending = uniquePendingBookings.size;

                                const occupancy = totalQuotasCapacity > 0 ? Math.round((totalActiveCampaigns / totalQuotasCapacity) * 100) : 0;

                                return (
                                    <>
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                            <p className="text-xs font-bold text-slate-400 uppercase">Capacidade (Cotas)</p>
                                            <p className="text-2xl font-bold text-slate-800">{totalQuotasCapacity}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                            <p className="text-xs font-bold text-slate-400 uppercase">Campanhas Ativas</p>
                                            <p className="text-2xl font-bold text-primary">{totalActiveCampaigns}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                            <p className="text-xs font-bold text-slate-400 uppercase">Ocupação Geral</p>
                                            <div className="flex items-end gap-2">
                                                <p className={clsx("text-2xl font-bold", occupancy >= 100 ? "text-red-500" : occupancy >= 80 ? "text-emerald-500" : "text-slate-800")}>{occupancy}%</p>
                                                {occupancy >= 100 && <span className="text-xs text-red-500 font-bold mb-1">Lotado</span>}
                                            </div>
                                        </div>
                                        <div className={clsx("p-4 rounded-xl border shadow-sm", totalPending > 0 ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200")}>
                                            <p className={clsx("text-xs font-bold uppercase", totalPending > 0 ? "text-amber-600" : "text-slate-400")}>Pendências Mídia</p>
                                            <p className={clsx("text-2xl font-bold", totalPending > 0 ? "text-amber-600" : "text-slate-800")}>{totalPending}</p>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        {/* List Grouped by City */}
                        <div className="space-y-8">
                            {Object.entries(filteredAssets.reduce((acc, asset) => {
                                const city = asset.cidade || 'Outros';
                                if (!acc[city]) acc[city] = [];
                                acc[city].push(asset);
                                return acc;
                            }, {})).map(([city, cityAssets]) => (
                                <div key={city} className="break-inside-avoid">
                                    <h3 className="font-bold text-slate-400 uppercase text-sm mb-3 flex items-center gap-2">
                                        <MapPin size={14} /> {city} ({cityAssets.length})
                                    </h3>
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                        {cityAssets.map(asset => {
                                            const bookings = getBookingsInRange(asset.id, dailyStartDate, dailyEndDate);
                                            const assetQuotas = parseInt(asset.numero_cotas) || 18;
                                            const assetOccupancy = Math.round((bookings.length / assetQuotas) * 100);

                                            return (
                                                <div key={asset.id} className="bg-white border border-slate-200 rounded-lg flex items-stretch shadow-sm hover:shadow-md transition-shadow overflow-hidden group print:shadow-none print:border-slate-300">
                                                    {/* Left Color Indicator */}
                                                    <div className={clsx("w-2 flex-shrink-0",
                                                        bookings.length === 0 ? "bg-slate-100" :
                                                            bookings.every(b => b.mediaStatus === 'received') ? "bg-emerald-500" : "bg-amber-400"
                                                    )}></div>

                                                    <div className="p-4 flex-1 flex flex-col md:flex-row items-center gap-4">
                                                        {/* Asset Info */}
                                                        <div className="flex items-center gap-4 min-w-[220px] max-w-[300px] flex-1">
                                                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-slate-100">
                                                                {asset.photo ?
                                                                    <img src={asset.photo} className="w-full h-full object-cover" /> :
                                                                    <MonitorPlay className="text-slate-400" size={20} />
                                                                }
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h3 className="font-bold text-slate-800 text-sm leading-tight text-wrap">{asset.name}</h3>
                                                                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><MapPin size={10} /> {asset.bairro}</p>
                                                                <p className="text-[10px] text-slate-400 mt-0.5">{asset.tempo_exibicao ? `${asset.tempo_exibicao} horas/dia` : ''}</p>
                                                            </div>
                                                        </div>

                                                        {/* Booking Info */}
                                                        <div className="flex-1 w-full md:border-l md:border-slate-100 md:pl-4 min-h-[50px] flex items-center">
                                                            {bookings.length > 0 ? (
                                                                <div className="space-y-2 w-full">
                                                                    {bookings.map((booking, idx) => (
                                                                        <div key={idx} className="flex items-center justify-between gap-3 border-b border-dashed border-slate-100 last:border-0 pb-1 last:pb-0">
                                                                            <div className="min-w-0 flex-1">
                                                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                                                    <span className={clsx("flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 rounded-sm",
                                                                                        booking.mediaStatus === 'received' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                                                                    )}>
                                                                                        {booking.mediaStatus === 'received' ? 'OK' : 'Pendente'}
                                                                                    </span>
                                                                                    <p className="font-bold text-slate-800 text-xs truncate">{booking.campaignName}</p>
                                                                                </div>
                                                                                <p className="text-[10px] text-slate-500 truncate">{booking.client.name} • até {new Date(booking.endDate).toLocaleDateString()}</p>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => setSelectedBooking(booking)}
                                                                                className="text-[10px] text-primary font-bold hover:underline flex items-center gap-0.5 bg-slate-50 px-1.5 py-1 rounded shrink-0"
                                                                            >
                                                                                Detalhes <ChevronRight size={10} />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2 text-slate-300">
                                                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                                                                        <MonitorPlay size={14} />
                                                                    </div>
                                                                    <div>
                                                                        <span className="text-xs font-medium text-slate-400 block">Livre</span>
                                                                        <span className="text-[10px] opacity-70">Disponível</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Actions / Occupancy */}
                                                        <div className="hidden md:flex flex-col items-end justify-center pl-3 border-l border-slate-100 print:hidden gap-0.5 min-w-[70px]">
                                                            <div className={clsx("text-lg font-bold leading-none", assetOccupancy >= 100 ? "text-red-500" : assetOccupancy >= 70 ? "text-emerald-500" : "text-slate-700")}>
                                                                {assetOccupancy}%
                                                            </div>
                                                            <span className="text-[9px] text-slate-400 block">{bookings.length}/{assetQuotas}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- VIEW: MEDIA LIBRARY --- */}
                {activeTab === 'content' && (
                    <MediaLibrary />
                )}



                {/* --- VIEW: ACTIVE CAMPAIGNS --- */}
                {activeTab === 'active' && (
                    <div className="animate-fadeIn">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-slate-800">Campanhas Ativas no Período</h2>
                            <div className="text-sm text-slate-500">
                                Total: <span className="font-bold text-slate-800">{activeQuotes.length}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeQuotes.length === 0 ? (
                                <div className="col-span-full py-12 text-center text-slate-400">
                                    <Play size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>Nenhuma campanha ativa no momento.</p>
                                </div>
                            ) : (
                                activeQuotes.map(quote => (
                                    <div key={quote.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow relative">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1">{quote.campaignName}</h3>
                                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{quote.client.name}</p>
                                            </div>
                                            <div className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                                No Ar
                                            </div>
                                        </div>

                                        <div className="space-y-3 mb-6">
                                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                                <Calendar size={16} className="text-slate-400" />
                                                <span>{new Date(quote.startDate).toLocaleDateString()} a {new Date(quote.endDate).toLocaleDateString()}</span>
                                            </div>
                                            <div
                                                onClick={() => {
                                                    setSelectedCampaignForAssets(quote);
                                                    setViewAssetsModalOpen(true);
                                                }}
                                                className="flex items-center gap-3 text-sm text-slate-600 cursor-pointer hover:text-primary transition-colors group"
                                            >
                                                <MonitorPlay size={16} className="text-slate-400 group-hover:text-primary" />
                                                <span className="group-hover:underline">{quote.assets.length} Paineis selecionados</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                                <Film size={16} className="text-slate-400" />
                                                <span className={clsx("font-medium uppercase tracking-wider text-xs px-2 py-0.5 rounded",
                                                    quote.mediaStatus === 'received' ? "bg-emerald-100 text-emerald-700" :
                                                        quote.mediaStatus === 'rejected' ? "bg-red-100 text-red-700 font-bold" : "bg-amber-100 text-amber-700"
                                                )}>
                                                    Mídia: {quote.mediaStatus === 'received' ? 'OK (Recebida)' : quote.mediaStatus === 'rejected' ? 'REFUGADA (Reprovada)' : 'PENDENTE'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-100 pt-4 mt-auto">
                                            <button
                                                onClick={() => {
                                                    setSelectedCampaignForAssets(quote);
                                                    setViewAssetsModalOpen(true);
                                                }}
                                                className={clsx("w-full py-2.5 rounded-lg text-sm font-bold text-white transition-colors flex items-center justify-center gap-2",
                                                    quote.mediaStatus === 'received' ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200" :
                                                        quote.mediaStatus === 'rejected' ? "bg-red-500 hover:bg-red-600 shadow-red-200" : "bg-primary hover:bg-primary-dark shadow-primary/20"
                                                )}
                                            >
                                                {quote.mediaStatus === 'received' ? <CheckCircle size={16} /> :
                                                    quote.mediaStatus === 'rejected' ? <AlertCircle size={16} /> :
                                                        <CheckCircle size={16} />}
                                                Confirmar / Gerenciar
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* --- VIEW: HISTORY --- */}
                {activeTab === 'history' && (
                    <div className="p-8 text-center text-slate-400">
                        <History size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Histórico de Logs de Mídia em desenvolvimento.</p>
                    </div>
                )}
            </div>

            {/* --- MODALS --- */}

            <SchedulingModal
                isOpen={showSchedulingModal}
                onClose={() => setShowSchedulingModal(false)}
                preselectedAsset={schedulingDefaults.asset}
                preselectedDate={schedulingDefaults.date}
            />

            {/* View Assets Modal */}
            {viewAssetsModalOpen && selectedCampaignForAssets && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 pr-4 leading-tight">Paineis da Campanha</h2>
                                <p className="text-slate-500 text-sm mt-1">{selectedCampaignForAssets.campaignName}</p>
                            </div>
                            <button onClick={() => setViewAssetsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1"><X size={24} /></button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {selectedCampaignForAssets.assets.map(assetStart => {
                                    const asset = assets.find(a => String(a.id) === String(assetStart.id)) || assetStart;
                                    return (
                                        <div key={`${asset.id}-${asset.photo?.length || 0}`} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow group">
                                            <div className="h-40 bg-slate-100 relative overflow-hidden">
                                                {asset.photo ? (
                                                    <img src={asset.photo} alt={asset.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                        <MonitorPlay size={40} />
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm">
                                                    {asset.type || 'Painel'}
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-bold text-slate-800 text-sm mb-1 leading-tight">{asset.name}</h3>
                                                <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                                                    <MapPin size={12} /> {asset.bairro || 'Localização'}
                                                </div>
                                                <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
                                                    <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{asset.resolution || 'Resolução N/A'}</span>
                                                    <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{asset.format || 'Formato N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 text-right">
                            <button
                                onClick={() => setViewAssetsModalOpen(false)}
                                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Grid Selection Modal */}
            {gridSelection && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slideUp">
                        <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Calendar size={18} className="text-primary" />
                                    Detalhes da Programação
                                </h3>
                                <div className="text-xs text-slate-500 mt-1 flex flex-col">
                                    <span className="font-bold text-slate-700">{gridSelection.assetName}</span>
                                    <span>{gridSelection.day.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>
                            </div>
                            <button onClick={() => setGridSelection(null)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                            {gridSelection.bookings.length === 0 ? (
                                <p className="text-slate-400 text-center italic py-4">Nenhuma reserva.</p>
                            ) : (
                                gridSelection.bookings.map((booking, idx) => (
                                    <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:border-primary/30 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-slate-800 text-sm">{booking.campaignName || 'Campanha Desconhecida'}</h4>
                                            <span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                                                booking.status === 'ativo' ? "bg-emerald-100 text-emerald-700" :
                                                    booking.status === 'approved' ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"
                                            )}>
                                                {booking.status || 'Pendente'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-500 space-y-1">
                                            <p><span className="font-medium text-slate-600">Período:</span> {new Date(booking.start_date || booking.startDate).toLocaleDateString()} a {new Date(booking.end_date || booking.endDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
                            <button
                                onClick={() => {
                                    setSchedulingDefaults({ asset: { id: gridSelection.assetId, name: gridSelection.assetName }, date: gridSelection.day });
                                    setGridSelection(null);
                                    setShowSchedulingModal(true);
                                }}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow hover:bg-indigo-700 w-full mb-2"
                            >
                                Adicionar Agendamento
                            </button>
                            <button onClick={() => setGridSelection(null)} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 w-full">
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Programming;
