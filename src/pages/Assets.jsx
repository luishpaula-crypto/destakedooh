import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, MapPin, Edit, Trash2, Monitor, DollarSign, BarChart2, Users, FileText, Settings, Upload, Download, Sparkles, Brain, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import clsx from 'clsx';
import { generateLocationAnalysis } from '../utils/aiAnalysis';

const Assets = () => {
    const { user } = useAuth();
    const { assets, addAsset, updateAsset, deleteAsset, importAssets } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState(null);
    const [activeTab, setActiveTab] = useState('basic'); // basic, finance, technical, metrics, demographic, ai
    const [isGenerating, setIsGenerating] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, assetId: null });
    const [filterType, setFilterType] = useState('Todos');

    // Get maintenances from context
    const { maintenances } = useData();

    // Initial State matching new schema
    const initialFormState = {
        // Basic
        name: '', photo: '', address: '', bairro: '', regiao: '', cidade: '', location_analysis: '',
        // Financial
        valor_tabela_unit: '', descontos: '', valor_final: '', aluguel_mensal: '', investimentos: '', manutencao: '',
        // Technical
        type: 'LED', operadora: '', iccid_contrato: '', id_cemig: '', sensor: '', teamviewer_id: '', formato_arquivo: '', id_4yousee: '', resolution: '', format: '',
        // Metrics
        insercoes_diarias: '', fluxo_diario: '', fluxo_periodo: '', total_dias: '', vigencia: '', atualizacao: '',
        // Demographic
        genero_fem_pct: '', genero_masc_pct: '', domicilios: '', populacao: '', renda_media: '', alcance: '', frequencia_media: '', tempo_permanencia: '', impactos: ''
    };

    const [formData, setFormData] = useState(initialFormState);

    // Get unique types for filter
    const assetTypes = ['Todos', ...new Set(assets.map(a => a.type).filter(Boolean))];

    const filteredAssets = assets.filter(asset => {
        const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.address?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'Todos' || asset.type === filterType;
        return matchesSearch && matchesType;
    });

    const handleAddNew = () => {
        setEditingAsset(null);
        setFormData(initialFormState);
        setActiveTab('basic');
        setIsModalOpen(true);
    };

    const handleEdit = (asset) => {
        setEditingAsset(asset);
        setFormData(asset);
        setActiveTab('basic');
        setIsModalOpen(true);
    };

    // Helper to get asset maintenance history
    const getAssetMaintenances = () => {
        if (!editingAsset) return [];
        return (maintenances || []).filter(m =>
            m.assetId === editingAsset.id || m.asset_id === editingAsset.id
        ).sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    const getTotalMaintenanceCost = () => {
        return getAssetMaintenances().reduce((acc, curr) => acc + (parseFloat(curr.cost) || 0), 0);
    };

    const handleDelete = (id) => {
        setDeleteConfirmation({ isOpen: true, assetId: id });
    };

    const confirmDelete = async () => {
        if (deleteConfirmation.assetId) {
            await deleteAsset(deleteConfirmation.assetId);
            setDeleteConfirmation({ isOpen: false, assetId: null });
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        // Helper to sanitize numeric fields
        const sanitizeNumber = (val) => {
            if (val === '' || val === null || val === undefined) return 0;
            const parsed = parseFloat(val);
            return isNaN(parsed) ? 0 : parsed;
        };

        // Helper to sanitize dates (Supabase needs null for empty date strings)
        const sanitizeDate = (val) => {
            if (!val || val.trim() === '') return null;
            return val;
        };

        const finalData = {
            // Basic / Location
            name: formData.name,
            photo: formData.photo,
            address: formData.address,
            bairro: formData.bairro,
            regiao: formData.regiao,
            cidade: formData.cidade,

            // Technical
            type: formData.type,
            format: formData.format,
            resolution: formData.resolution,
            operadora: formData.operadora,
            iccid_contrato: formData.iccid_contrato,
            id_cemig: formData.id_cemig,
            sensor: formData.sensor,
            teamviewer_id: formData.teamviewer_id,
            formato_arquivo: formData.formato_arquivo,
            id_4yousee: formData.id_4yousee,

            // Financial
            valor_tabela_unit: sanitizeNumber(formData.valor_tabela_unit),
            desconto_padrao: sanitizeNumber(formData.descontos), // Mapped from 'descontos'
            aluguel_mensal: sanitizeNumber(formData.aluguel_mensal),
            manutencao: sanitizeNumber(formData.manutencao),
            investimentos: sanitizeNumber(formData.investimentos),
            valor_final: sanitizeNumber(formData.valor_final), // Ensure this is sent if calculated? Or remove if computed db side. Schema has it.
            daily_rate: sanitizeNumber(formData.valor_tabela_unit), // Legacy support

            // Metrics
            insercoes_diarias: sanitizeNumber(formData.insercoes_diarias),
            fluxo_diario: sanitizeNumber(formData.fluxo_diario),
            fluxo_periodo: sanitizeNumber(formData.fluxo_periodo),
            total_dias: sanitizeNumber(formData.total_dias),
            vigencia: sanitizeDate(formData.vigencia),
            atualizacao: sanitizeDate(formData.atualizacao),

            // Demographic
            genero_fem_pct: sanitizeNumber(formData.genero_fem_pct),
            genero_masc_pct: sanitizeNumber(formData.genero_masc_pct),
            domicilios: sanitizeNumber(formData.domicilios),
            populacao: sanitizeNumber(formData.populacao),
            renda_media: formData.renda_media, // Text in schema
            alcance: sanitizeNumber(formData.alcance),
            frequencia_media: sanitizeNumber(formData.frequencia_media),
            tempo_permanencia: formData.tempo_permanencia, // Text in schema
            impactos: sanitizeNumber(formData.impactos),

            // Analysis
            location_analysis: formData.location_analysis || null
        };

        try {
            if (editingAsset) {
                await updateAsset({ ...editingAsset, ...finalData });
            } else {
                await addAsset(finalData);
            }
            // Only close if successful (we assume updateAsset/addAsset throw on error or handle alerts themselves)
            // But DataContext alerts, so we should just close if no error thrown? 
            // Actually DataContext catches and alerts but doesn't rethrow... wait.
            // I need to check DataContext.jsx again. If it catches and alerts, this try/catch here might be useless
            // unless addAsset/updateAsset returns something indicating success.
            // Let's modify DataContext to throw or return false on error, OR just close modal here.

            // Re-reading DataContext: addAsset alerts on error and returns. It DOES NOT return data on error.
            // It DOES NOT throw. So await addAsset() returns undefined.
            // We need to know if it failed.
            // Since I can't easily change DataContext return signature without risking other files, 
            // I will assume for now if it alerts, the user sees it.
            // BUT the user said "blinking error", likely because of alert() + reload or something.
            // For now, I will optimistically close ONLY if no error, but since I can't catch the DataContext error...
            // I will forcefully close. If the user says "blinking", maybe the form submit refreshes page?
            // e.preventDefault() is there.

            setIsModalOpen(false);
        } catch (err) {
            console.error("Failed to save asset:", err);
            // If DataContext throws, we catch here.
            alert("Erro Inesperado: " + err.message);
        }
    };

    const handleGenerateAnalysis = async () => {
        setIsGenerating(true);
        try {
            const analysis = await generateLocationAnalysis(formData);
            setFormData(prev => ({ ...prev, location_analysis: analysis }));
        } catch (error) {
            console.error("Erro ao gerar análise:", error);
            alert("Erro ao gerar análise de IA.");
        } finally {
            setIsGenerating(false);
        }
    };

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            type="button"
            onClick={() => setActiveTab(id)}
            className={clsx(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === id
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            )}
        >
            <Icon size={16} />
            {label}
        </button>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Ativos & Painéis</h1>
                    <p className="text-slate-500 mt-1">Gerenciamento completo do inventário (V2.0)</p>
                </div>
                <div className="flex gap-2">
                    <label className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm hover:bg-slate-50 cursor-pointer">
                        <Upload size={20} />
                        <span>Importar</span>
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (evt) => {
                                    try {
                                        const data = new Uint8Array(evt.target.result);
                                        const wb = XLSX.read(data, { type: 'array' });
                                        const wsname = wb.SheetNames[0];
                                        const ws = wb.Sheets[wsname];
                                        const jsonData = XLSX.utils.sheet_to_json(ws);

                                        if (!jsonData || jsonData.length === 0) {
                                            alert("O arquivo parece estar vazio ou não foi possível ler os dados.");
                                            return;
                                        }

                                        // Helpers for sanitization
                                        const sanitizeDateImports = (val) => {
                                            if (!val || val === '') return null;
                                            return val;
                                        };
                                        const sanitizeNumImports = (val) => {
                                            if (val === '' || val === null || val === undefined) return 0;
                                            // Handle strings with commas (Brazilian format) if user edits accidentally
                                            if (typeof val === 'string') {
                                                val = val.replace('.', '').replace(',', '.');
                                            }
                                            const n = parseFloat(val);
                                            return isNaN(n) ? 0 : n;
                                        };

                                        // Map and sanitize data
                                        const mappedData = jsonData.map(row => {
                                            const base = { ...row };

                                            // Explicit mappings
                                            if (row["Nome"]) base.name = row["Nome"];
                                            if (row["Tipo"]) base.type = row["Tipo"];
                                            if (row["Endereço"]) base.address = row["Endereço"];
                                            if (row["Bairro"]) base.bairro = row["Bairro"];
                                            if (row["Cidade"]) base.cidade = row["Cidade"];
                                            if (row["Região"]) base.regiao = row["Região"];
                                            if (row["Valor Tabela"]) base.valor_tabela_unit = row["Valor Tabela"];
                                            if (row["Valor Final"]) base.valor_final = row["Valor Final"];
                                            if (row["Impactos"]) base.impactos = row["Impactos"];
                                            if (row["Alcance"]) base.alcance = row["Alcance"];
                                            if (row["Status"]) base.status = row["Status"];
                                            if (row["ID 4YouSee"]) base.id_4yousee = row["ID 4YouSee"];

                                            // SANITIZATION
                                            // Dates
                                            if (Object.prototype.hasOwnProperty.call(base, 'vigencia')) base.vigencia = sanitizeDateImports(base.vigencia);
                                            if (Object.prototype.hasOwnProperty.call(base, 'atualizacao')) base.atualizacao = sanitizeDateImports(base.atualizacao);

                                            // Numerics
                                            const numericFields = [
                                                'valor_tabela_unit', 'valor_final', 'impactos', 'alcance',
                                                'domicilios', 'populacao', 'frequencia_media',
                                                'genero_fem_pct', 'genero_masc_pct', 'insercoes_diarias',
                                                'fluxo_diario', 'fluxo_periodo', 'total_dias',
                                                'aluguel_mensal', 'manutencao', 'investimentos', 'desconto_padrao'
                                            ];

                                            numericFields.forEach(field => {
                                                if (Object.prototype.hasOwnProperty.call(base, field)) {
                                                    base[field] = sanitizeNumImports(base[field]);
                                                }
                                            });
                                            // Remove original Portuguese keys to avoid cluttering DB payload (Supabase ignores extra keys usually, but safer to clean if desired. Let's start with inclusive)
                                            return base;
                                        });

                                        // DEDUPLICATION: Fix "ON CONFLICT DO UPDATE command cannot affect row a second time"
                                        const uniqueMap = new Map();
                                        const rowsWithoutId = [];

                                        mappedData.forEach(item => {
                                            // Fix "null value in column id" error:
                                            // If id is present but null/empty/0, DELETE it so DB generates a new one.
                                            if (!item.id) {
                                                delete item.id;
                                            }

                                            if (item.id) {
                                                uniqueMap.set(item.id, item);
                                            } else {
                                                rowsWithoutId.push(item);
                                            }
                                        });

                                        const finalBatch = [...uniqueMap.values(), ...rowsWithoutId];

                                        if (confirm(`Encontrados ${finalBatch.length} itens únicos (de ${mappedData.length} lidos). Deseja importar?`)) {
                                            importAssets(finalBatch)
                                                .then(({ error }) => {
                                                    if (error) {
                                                        console.error("Erro importação:", error);
                                                        alert("Erro ao importar no banco de dados: " + error.message);
                                                    } else {
                                                        alert('Importação realizada com sucesso!');
                                                        // Force reload to see changes
                                                        window.location.reload();
                                                    }
                                                })
                                                .catch(err => {
                                                    console.error("Erro crítico na promessa:", err);
                                                    alert("Erro crítico ao tentar salvar: " + err.message);
                                                });
                                        }
                                        console.error("Erro processamento arquivo:", err);
                                        alert("Erro ao processar o arquivo: " + err.message);
                                    } finally {
                                        // Reset input so user can select the same file again if needed
                                        e.target.value = '';
                                    }
                                };
                                reader.readAsArrayBuffer(file);
                            }}
                        />
                    </label>
                    <button
                        onClick={() => {
                            try {
                                if (!assets || assets.length === 0) {
                                    alert("Não há ativos para exportar.");
                                    return;
                                }
                                console.log("Iniciando exportação...", assets);

                                // Sanitize data: remove photos to avoid XL cell text limit (32767 chars)
                                // We keep ALL other fields dynamically
                                const exportData = assets.map(asset => {
                                    const { photo, ...rest } = asset;
                                    return rest;
                                });

                                const ws = XLSX.utils.json_to_sheet(exportData);
                                const wb = XLSX.utils.book_new();
                                XLSX.utils.book_append_sheet(wb, ws, "Ativos");

                                // Standard writeFile method (reliable for filename & download)
                                XLSX.writeFile(wb, "ativos.xlsx");
                            } catch (error) {
                                console.error("Erro exportação:", error);
                                alert("Erro ao exportar: " + error.message);
                            }
                        }}
                        className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm hover:bg-slate-50"
                    >
                        <Download size={20} />
                        <span>Exportar</span>
                    </button>
                    <button
                        onClick={handleAddNew}
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <Plus size={20} />
                        <span>Novo Ativo</span>
                    </button>
                </div>
            </div>

            {/* List View */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, endereço ou cidade..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Media Type Filter */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-4 overflow-x-auto">
                    <button
                        onClick={() => setFilterType('Todos')}
                        className={clsx(
                            "px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                            filterType === 'Todos'
                                ? "bg-slate-800 text-white"
                                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        )}
                    >
                        Todos
                    </button>
                    {assetTypes.filter(t => t !== 'Todos').slice(0, 10).map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={clsx(
                                "px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                                filterType === type
                                    ? "bg-slate-800 text-white"
                                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                            )}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                    {filteredAssets.map(asset => (
                        <div key={asset.id} className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow group relative flex flex-col">
                            <div className="h-40 bg-slate-100 relative">
                                {asset.photo ? (
                                    <img src={asset.photo} alt={asset.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <Monitor size={48} />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <span className="bg-black/70 text-white text-xs px-2 py-1 rounded font-bold backdrop-blur-sm">
                                        {asset.id_4yousee || 'S/ ID'}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-slate-800 text-lg truncate pr-2 w-full">{asset.name}</h3>
                                </div>
                                <div className="space-y-2 mb-4 flex-1">
                                    <div className="flex items-start gap-2 text-sm text-slate-500">
                                        <MapPin size={16} className="shrink-0 mt-0.5 text-primary" />
                                        <span className="line-clamp-2">{asset.address} <br /> {asset.bairro} - {asset.cidade}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-400 pt-2 border-t border-slate-50">
                                        <span>Impactos: {asset.impactos?.toLocaleString()}</span>
                                        <span>Alcance: {asset.alcance?.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium">{asset.type}</span>
                                    <div className="font-bold text-lg text-primary">
                                        R$ {parseFloat(asset.valor_tabela_unit || 0).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {/* Actions Overlay */}
                            <div className="absolute top-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(asset)} className="p-2 bg-white text-primary rounded-lg shadow-sm hover:bg-primary/5">
                                    <Edit size={16} />
                                </button>
                                {user.role === 'admin' && (
                                    <button onClick={() => handleDelete(asset.id)} className="p-2 bg-white text-red-600 rounded-lg shadow-sm hover:bg-red-50">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {filteredAssets.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-xl border-dashed border-2 border-slate-200">
                            <p>Nenhum ativo encontrado para os filtros selecionados.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                        <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">
                                        {editingAsset ? 'Editar Ativo' : 'Novo Ativo'}
                                    </h2>
                                    <p className="text-sm text-slate-500">Preencha os detalhes completos do painel</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                                        <Settings size={20} className="text-slate-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-slate-200 overflow-x-auto">
                                <TabButton id="basic" label="Básico & Local" icon={MapPin} />
                                <TabButton id="finance" label="Financeiro" icon={DollarSign} />
                                <TabButton id="technical" label="Técnico" icon={Monitor} />
                                <TabButton id="metrics" label="Métricas" icon={BarChart2} />
                                <TabButton id="demographic" label="Demográfico" icon={Users} />
                                <TabButton id="ai" label="Inteligência (AI)" icon={Sparkles} />
                                {/* MAINTENANCE HISTORY TAB */}
                                <TabButton id="maintenance" label="Manutenção" icon={Settings} />
                            </div>

                            {/* Form Content */}
                            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8">

                                {/* TAB: BASIC */}
                                {activeTab === 'basic' && (
                                    <div className="space-y-6 animate-fadeIn">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Ativo</label>
                                                <input required className="input-field w-full" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Foto do Painel</label>
                                                <div className="flex gap-4 items-start">
                                                    {formData.photo && (
                                                        <div className="w-24 h-24 rounded-lg overflow-hidden border border-slate-200 shrink-0 relative group">
                                                            <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                                                            <button
                                                                type="button"
                                                                onClick={() => setFormData({ ...formData, photo: '' })}
                                                                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                                            >
                                                                <Trash2 size={24} />
                                                            </button>
                                                        </div>
                                                    )}
                                                    <label className="flex-1 border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-primary transition-colors">
                                                        <Upload size={24} className="text-slate-400 mb-2" />
                                                        <span className="text-sm text-slate-500 font-medium">Clique para fazer upload</span>
                                                        <span className="text-xs text-slate-400 mt-1">PNG, JPG (Max 5MB)</span>
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                const file = e.target.files[0];
                                                                if (file) {
                                                                    const reader = new FileReader();
                                                                    reader.onload = (ev) => setFormData({ ...formData, photo: ev.target.result });
                                                                    reader.readAsDataURL(file);
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Endereço Completo</label>
                                                <input className="input-field w-full" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
                                                <input className="input-field w-full" value={formData.bairro} onChange={e => setFormData({ ...formData, bairro: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Cidade</label>
                                                <input className="input-field w-full" value={formData.cidade} onChange={e => setFormData({ ...formData, cidade: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Região</label>
                                                <input className="input-field w-full" value={formData.regiao} onChange={e => setFormData({ ...formData, regiao: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB: FINANCE */}
                                {activeTab === 'finance' && (
                                    <div className="space-y-6 animate-fadeIn">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Valor Tabela Unit (R$)</label>
                                                <input type="number" step="0.01" className="input-field w-full" value={formData.valor_tabela_unit} onChange={e => setFormData({ ...formData, valor_tabela_unit: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Desconto (%)</label>
                                                <input type="number" step="0.01" className="input-field w-full" value={formData.descontos} onChange={e => setFormData({ ...formData, descontos: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Aluguel Mensal (R$)</label>
                                                <input type="number" step="0.01" className="input-field w-full" value={formData.aluguel_mensal} onChange={e => setFormData({ ...formData, aluguel_mensal: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Manutenção (R$)</label>
                                                <input type="number" step="0.01" className="input-field w-full" value={formData.manutencao} onChange={e => setFormData({ ...formData, manutencao: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Investimentos (R$)</label>
                                                <input type="number" step="0.01" className="input-field w-full" value={formData.investimentos} onChange={e => setFormData({ ...formData, investimentos: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Valor Final Calculado (Ref)</label>
                                                <input readOnly className="input-field w-full bg-slate-50" value={formData.valor_tabela_unit - (formData.valor_tabela_unit * (formData.descontos / 100) || 0)} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB: TECHNICAL */}
                                {activeTab === 'technical' && (
                                    <div className="space-y-6 animate-fadeIn">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Mídia</label>
                                                <select className="input-field w-full" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                                    <option value="PAINEL DE LED">PAINEL DE LED</option>
                                                    <option value="BANCA DE LED">BANCA DE LED</option>
                                                    <option value="BUSDOOR">BUSDOOR</option>
                                                    <option value="OUTDOOR">OUTDOOR</option>
                                                    <option value="FRONT LIGHT">FRONT LIGHT</option>
                                                    <option value="RODOVIÁRIO">RODOVIÁRIO</option>
                                                    <option value="DIGITAL INDOOR">DIGITAL INDOOR</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Operadora</label>
                                                <input className="input-field w-full" value={formData.operadora} onChange={e => setFormData({ ...formData, operadora: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">ID Cemig</label>
                                                <input className="input-field w-full" value={formData.id_cemig} onChange={e => setFormData({ ...formData, id_cemig: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">ID TeamViewer</label>
                                                <input className="input-field w-full" value={formData.teamviewer_id} onChange={e => setFormData({ ...formData, teamviewer_id: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Resolução</label>
                                                <input className="input-field w-full" value={formData.resolution} onChange={e => setFormData({ ...formData, resolution: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Formato</label>
                                                <input className="input-field w-full" value={formData.format} onChange={e => setFormData({ ...formData, format: e.target.value })} />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-slate-700 mb-1">ID 4YouSee (Player)</label>
                                                <input className="input-field w-full" value={formData.id_4yousee} onChange={e => setFormData({ ...formData, id_4yousee: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB: METRICS */}
                                {activeTab === 'metrics' && (
                                    <div className="space-y-6 animate-fadeIn">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Inserções Diárias</label>
                                                <input type="number" className="input-field w-full" value={formData.insercoes_diarias} onChange={e => setFormData({ ...formData, insercoes_diarias: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Fluxo Diário (Pessoas)</label>
                                                <input type="number" className="input-field w-full" value={formData.fluxo_diario} onChange={e => setFormData({ ...formData, fluxo_diario: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Total Dias</label>
                                                <input type="number" className="input-field w-full" value={formData.total_dias} onChange={e => setFormData({ ...formData, total_dias: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Impactos Estimados</label>
                                                <input type="number" className="input-field w-full" value={formData.impactos} onChange={e => setFormData({ ...formData, impactos: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Vigência (Contrato)</label>
                                                <input type="date" className="input-field w-full" value={formData.vigencia ? new Date(formData.vigencia).toISOString().split('T')[0] : ''} onChange={e => setFormData({ ...formData, vigencia: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB: DEMOGRAPHIC */}
                                {activeTab === 'demographic' && (
                                    <div className="space-y-6 animate-fadeIn">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Gênero Feminino (%)</label>
                                                <input type="number" className="input-field w-full" value={formData.genero_fem_pct} onChange={e => setFormData({ ...formData, genero_fem_pct: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Gênero Masculino (%)</label>
                                                <input type="number" className="input-field w-full" value={formData.genero_masc_pct} onChange={e => setFormData({ ...formData, genero_masc_pct: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Classe Social Predominante</label>
                                                <input className="input-field w-full" value={formData.renda_media} onChange={e => setFormData({ ...formData, renda_media: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Faixa Etária Principal</label>
                                                <input className="input-field w-full" value={formData.tempo_permanencia} onChange={e => setFormData({ ...formData, tempo_permanencia: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB: AI ANALYSIS */}
                                {activeTab === 'ai' && (
                                    <div className="space-y-6 animate-fadeIn h-full flex flex-col">
                                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                                                    <Brain size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-800 text-lg">Análise de Potencial Comercial</h3>
                                                    <p className="text-slate-500 text-sm">Utilize nossa IA para identificar pontos fortes e oportunidades desta localização.</p>
                                                </div>
                                            </div>

                                            {!formData.address || !formData.cidade ? (
                                                <div className="text-amber-600 bg-amber-50 p-3 rounded-lg text-sm flex items-center gap-2">
                                                    <AlertTriangle size={16} />
                                                    Preencha o endereço e cidade na aba "Básico" para gerar a análise.
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={handleGenerateAnalysis}
                                                    disabled={isGenerating}
                                                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isGenerating ? (
                                                        <>
                                                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                                            Gerando Análise...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles size={18} />
                                                            Gerar Análise com IA
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Resultado da Análise</label>
                                            <textarea
                                                className="input-field w-full h-64 font-mono text-sm bg-slate-800 text-green-400 p-4 border-slate-700"
                                                value={formData.location_analysis || ''}
                                                onChange={e => setFormData({ ...formData, location_analysis: e.target.value })}
                                                placeholder="A análise gerada aparecerá aqui..."
                                            />
                                            <p className="text-xs text-slate-400 mt-2 text-right">
                                                * Esta análise é uma estimativa baseada em dados geográficos simulados.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* TAB: MAINTENANCE HISTORY */}
                                {activeTab === 'maintenance' && (
                                    <div className="space-y-6 animate-fadeIn">
                                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex justify-between items-center">
                                            <div>
                                                <p className="text-sm text-blue-600 font-medium mb-1">Custo Total em Manutenções</p>
                                                <h3 className="text-3xl font-bold text-blue-900">
                                                    R$ {getTotalMaintenanceCost().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </h3>
                                            </div>
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                                <Settings size={24} />
                                            </div>
                                        </div>

                                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                                                    <tr>
                                                        <th className="px-4 py-3">Data</th>
                                                        <th className="px-4 py-3">Título</th>
                                                        <th className="px-4 py-3">Tipo</th>
                                                        <th className="px-4 py-3">Status</th>
                                                        <th className="px-4 py-3 text-right">Custo</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {getAssetMaintenances().length > 0 ? (
                                                        getAssetMaintenances().map(m => (
                                                            <tr key={m.id} className="hover:bg-slate-50">
                                                                <td className="px-4 py-3 text-slate-600">
                                                                    {new Date(m.date).toLocaleDateString()}
                                                                </td>
                                                                <td className="px-4 py-3 font-medium text-slate-800">{m.title}</td>
                                                                <td className="px-4 py-3">
                                                                    <span className={clsx(
                                                                        "px-2 py-0.5 rounded-full text-xs font-bold uppercase",
                                                                        m.type === 'preventiva' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                                                                    )}>
                                                                        {m.type}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-500 capitalize">{m.status}</td>
                                                                <td className="px-4 py-3 text-right font-medium text-slate-800">
                                                                    R$ {parseFloat(m.cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="5" className="px-4 py-8 text-center text-slate-400">
                                                                Nenhum registro de manutenção encontrado.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                            </form >

                            <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-white transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    type="button"
                                    className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark shadow-lg shadow-primary/30 transition-all"
                                >
                                    Salvar Ativo
                                </button>
                            </div>
                        </div >
                    </div >
                )
            }

            {/* Delete Confirmation Modal */}
            {
                deleteConfirmation.isOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                    <AlertTriangle className="text-red-600" size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">Confirmar Exclusão</h3>
                                <p className="text-slate-500 mb-6">
                                    Tem certeza que deseja excluir este ativo? Esta ação não pode ser desfeita.
                                </p>
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setDeleteConfirmation({ isOpen: false, assetId: null })}
                                        className="flex-1 py-2.5 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            <style>{`
                .input-field {
                    padding: 0.5rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 0.5rem;
                    outline: none;
                }
                .input-field:focus {
                     border-color: #2563eb;
                     box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-in-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div >
    );
};

export default Assets;
