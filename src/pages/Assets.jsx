import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, MapPin, Edit, Trash2, Monitor, DollarSign, BarChart2, Users, FileText, Settings, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import clsx from 'clsx';

const Assets = () => {
    const { user } = useAuth();
    const { assets, addAsset, updateAsset, deleteAsset, importAssets } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState(null);
    const [activeTab, setActiveTab] = useState('basic'); // basic, finance, technical, metrics, demographic

    // Initial State matching new schema
    const initialFormState = {
        // Basic
        name: '', photo: '', address: '', bairro: '', regiao: '', cidade: '',
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

    const filteredAssets = assets.filter(asset =>
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

    const handleDelete = (id) => {
        if (confirm('Tem certeza que deseja excluir este ativo?')) {
            deleteAsset(id);
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        // Calculate daily_rate for backward compatibility with Quotes logic if needed
        // Assuming valor_tabela_unit is the daily rate price anchor
        const finalData = {
            ...formData,
            daily_rate: parseFloat(formData.valor_tabela_unit) || 0,
            valor_tabela_unit: parseFloat(formData.valor_tabela_unit) || 0
        };

        if (editingAsset) {
            updateAsset({ ...editingAsset, ...finalData });
        } else {
            addAsset(finalData);
        }
        setIsModalOpen(false);
    };

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            type="button"
            onClick={() => setActiveTab(id)}
            className={clsx(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
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
                                    const data = new Uint8Array(evt.target.result);
                                    const wb = XLSX.read(data, { type: 'array' });
                                    const wsname = wb.SheetNames[0];
                                    const ws = wb.Sheets[wsname];
                                    const jsonData = XLSX.utils.sheet_to_json(ws);
                                    importAssets(jsonData);
                                    alert('Importação realizada com sucesso!');
                                };
                                reader.readAsArrayBuffer(file);
                            }}
                        />
                    </label>
                    <button
                        onClick={() => {
                            const ws = XLSX.utils.json_to_sheet(assets);
                            const wb = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(wb, ws, "Ativos");
                            XLSX.writeFile(wb, "ativos.xlsx");
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
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
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
                                                <option value="BANCA HIBRIDA">BANCA HIBRIDA</option>
                                                <option value="BANCA ESTATICA">BANCA ESTATICA</option>
                                                <option value="OUTROS">OUTROS</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">ID 4YouSee</label>
                                            <input className="input-field w-full" value={formData.id_4yousee} onChange={e => setFormData({ ...formData, id_4yousee: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Resolução</label>
                                            <input className="input-field w-full" value={formData.resolution} onChange={e => setFormData({ ...formData, resolution: e.target.value })} placeholder="1920x1080" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Formato</label>
                                            <input className="input-field w-full" value={formData.format} onChange={e => setFormData({ ...formData, format: e.target.value })} placeholder="16:9" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Operadora</label>
                                            <input className="input-field w-full" value={formData.operadora} onChange={e => setFormData({ ...formData, operadora: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">ICCID / Contrato</label>
                                            <input className="input-field w-full" value={formData.iccid_contrato} onChange={e => setFormData({ ...formData, iccid_contrato: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">ID CEMIG</label>
                                            <input className="input-field w-full" value={formData.id_cemig} onChange={e => setFormData({ ...formData, id_cemig: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">TeamViewer ID</label>
                                            <input className="input-field w-full" value={formData.teamviewer_id} onChange={e => setFormData({ ...formData, teamviewer_id: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Sensor?</label>
                                            <input className="input-field w-full" value={formData.sensor} onChange={e => setFormData({ ...formData, sensor: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Formato Arquivo</label>
                                            <input className="input-field w-full" value={formData.formato_arquivo} onChange={e => setFormData({ ...formData, formato_arquivo: e.target.value })} />
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
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Tempo de Exibição Diária</label>
                                            <input className="input-field w-full" placeholder="Ex: 18 horas" value={formData.tempo_exibicao || ''} onChange={e => setFormData({ ...formData, tempo_exibicao: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Número de Cotas</label>
                                            <input type="number" className="input-field w-full" placeholder="Ex: 10" value={formData.numero_cotas || ''} onChange={e => setFormData({ ...formData, numero_cotas: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Total de Dias</label>
                                            <input type="number" className="input-field w-full" value={formData.total_dias} onChange={e => setFormData({ ...formData, total_dias: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Fluxo Diário</label>
                                            <input type="number" className="input-field w-full" value={formData.fluxo_diario} onChange={e => setFormData({ ...formData, fluxo_diario: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Fluxo Período</label>
                                            <input type="number" className="input-field w-full" value={formData.fluxo_periodo} onChange={e => setFormData({ ...formData, fluxo_periodo: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Vigência</label>
                                            <input type="date" className="input-field w-full" value={formData.vigencia} onChange={e => setFormData({ ...formData, vigencia: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Última Atualização</label>
                                            <input type="date" className="input-field w-full" value={formData.atualizacao} onChange={e => setFormData({ ...formData, atualizacao: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: DEMOGRAPHIC */}
                            {activeTab === 'demographic' && (
                                <div className="space-y-6 animate-fadeIn">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Impactos</label>
                                            <input type="number" className="input-field w-full" value={formData.impactos} onChange={e => setFormData({ ...formData, impactos: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Alcance</label>
                                            <input type="number" className="input-field w-full" value={formData.alcance} onChange={e => setFormData({ ...formData, alcance: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">População</label>
                                            <input type="number" className="input-field w-full" value={formData.populacao} onChange={e => setFormData({ ...formData, populacao: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Domicílios</label>
                                            <input type="number" className="input-field w-full" value={formData.domicilios} onChange={e => setFormData({ ...formData, domicilios: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Renda Média</label>
                                            <input className="input-field w-full" value={formData.renda_media} onChange={e => setFormData({ ...formData, renda_media: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Tempo Permanência</label>
                                            <input className="input-field w-full" value={formData.tempo_permanencia} onChange={e => setFormData({ ...formData, tempo_permanencia: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Frequência Média</label>
                                            <input type="number" step="0.1" className="input-field w-full" value={formData.frequencia_media} onChange={e => setFormData({ ...formData, frequencia_media: e.target.value })} />
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Feminino (%)</label>
                                                <input type="number" className="input-field w-full" value={formData.genero_fem_pct} onChange={e => setFormData({ ...formData, genero_fem_pct: e.target.value })} />
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-slate-700 mb-1">Masculino (%)</label>
                                                <input type="number" className="input-field w-full" value={formData.genero_masc_pct} onChange={e => setFormData({ ...formData, genero_masc_pct: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </form>

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
                    </div>
                </div>
            )}
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
            `}</style>
        </div>
    );
};

export default Assets;
