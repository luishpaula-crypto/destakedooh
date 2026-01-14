import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Mail, Phone, MapPin, MoreVertical, User as UserIcon, Clock as ClockIcon, Trash2, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import clsx from 'clsx';

const CRM = () => {
    const { clients, addClient, updateClient, deleteClient, importClients } = useData();
    const { user } = useAuth(); // Import useAuth
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        cnpj: '',
        email: '',
        contact_name: '',
        phone: '',
        type: 'Advertiser',
        vertical: '',
        health_score: '',
        kyc_status: 'Pending',
        address: '',
        bairro: '',
        city: '',
        state: '',
        zip: '',
        credit_limit: '',
        payment_terms: '',
        commission_rate: '',
        parent_id: '',
        im: '',
        ie: ''
    });

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contact_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddNew = () => {
        setEditingClient(null);
        setFormData({
            id: '', name: '', cnpj: '', email: '', contact_name: '', phone: '',
            type: 'Advertiser', vertical: '', health_score: '', kyc_status: 'Pending',
            address: '', bairro: '', city: '', state: '', zip: '',
            credit_limit: '', payment_terms: '', commission_rate: '', parent_id: '',
            im: '', ie: ''
        });
        setIsModalOpen(true);
    };

    const handleEdit = (client) => {
        setEditingClient(client);
        setFormData({
            id: client.id || '',
            name: client.name || '',
            cnpj: client.cnpj || '',
            email: client.email || '',
            contact_name: client.contact_name || '',
            phone: client.phone || '',
            type: client.type || 'Advertiser',
            vertical: client.vertical || '',
            health_score: client.health_score || '',
            kyc_status: client.kyc_status || 'Pending',
            address: client.address || '',
            bairro: client.bairro || '',
            city: client.city || '',
            state: client.state || '',
            zip: client.zip || '',
            credit_limit: client.credit_limit || '',
            payment_terms: client.payment_terms || '',
            commission_rate: client.commission_rate || '',
            parent_id: client.parent_id || '',
            im: client.im || '',
            ie: client.state_inscription || client.ie || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('Tem certeza que deseja remover este cliente?')) {
            deleteClient(id);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        // Validation for required fields (optional, but good UX)
        if (!formData.name) {
            alert('Nome/Razão Social é obrigatório');
            return;
        }

        // Map form state 'ie' to DB column 'state_inscription'
        const payload = {
            ...formData,
            state_inscription: formData.ie,
            // Sanitize numeric fields: empty string -> null
            health_score: formData.health_score === '' ? null : formData.health_score,
            credit_limit: formData.credit_limit === '' ? null : formData.credit_limit,
            commission_rate: formData.commission_rate === '' ? null : formData.commission_rate,
            parent_id: formData.parent_id === '' ? null : formData.parent_id
        };
        delete payload.ie; // Remove non-existent column
        if (!payload.id) delete payload.id; // Allow DB to auto-generate ID

        let result;
        if (editingClient) {
            result = await updateClient({ ...editingClient, ...payload });
        } else {
            result = await addClient(payload);
        }

        if (result?.error) {
            console.error("Erro ao salvar cliente:", result.error);
            alert(`Erro ao salvar cliente: ${result.error.message}`);
            return;
        }

        setIsModalOpen(false);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Clientes & CRM</h1>
                    <p className="text-slate-500 mt-1">Gerencie sua carteira de clientes e contatos</p>
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
                                reader.onload = async (evt) => {
                                    try {
                                        const data = new Uint8Array(evt.target.result);
                                        const wb = XLSX.read(data, { type: 'array' });
                                        const wsname = wb.SheetNames[0];
                                        const ws = wb.Sheets[wsname];
                                        const jsonData = XLSX.utils.sheet_to_json(ws);

                                        if (!jsonData || jsonData.length === 0) {
                                            alert("Nenhum dado encontrado no arquivo.");
                                            return;
                                        }

                                        const { error } = await importClients(jsonData);

                                        if (error) {
                                            console.error("Import failed:", error);
                                            alert(`Falha na importação: ${error.message}`);
                                        } else {
                                            alert('Clientes importados com sucesso!');
                                        }
                                    } catch (err) {
                                        console.error("Critical import error:", err);
                                        alert("Erro crítico ao processar arquivo.");
                                    } finally {
                                        // Reset input so same file can be selected again
                                        e.target.value = '';
                                    }
                                };
                                reader.readAsArrayBuffer(file);
                            }}
                        />
                    </label>
                    <button
                        onClick={() => {
                            const ws = XLSX.utils.json_to_sheet(clients);
                            const wb = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(wb, ws, "Clientes");
                            XLSX.writeFile(wb, "clientes.xlsx");
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
                        <span>Novo Cliente</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por cliente ou contato..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* List */}
                <div className="divide-y divide-slate-100">
                    {filteredClients.map((client, index) => (
                        <div
                            key={client.id}
                            className={clsx(
                                "p-4 transition-colors flex items-center justify-between group hover:bg-slate-50",
                                index % 2 === 0 ? "bg-white" : "bg-white/50"
                            )}
                        >
                            <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                                {/* Col 1: Identity (5 cols) */}
                                <div className="col-span-12 md:col-span-5 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                        {client.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm md:text-base leading-tight">{client.name}</h3>
                                        <div className="text-xs text-slate-400 font-mono mt-0.5">CNPJ: {client.cnpj || 'N/A'}</div>
                                    </div>
                                </div>

                                {/* Col 2: Contact (4 cols) */}
                                <div className="col-span-12 md:col-span-4 flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600">
                                        <UserIcon size={14} className="text-slate-400" />
                                        <span className="truncate">{client.contact_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600">
                                        <Phone size={14} className="text-slate-400" />
                                        <span className="truncate">{client.phone}</span>
                                    </div>
                                </div>

                                {/* Col 3: Status/Loc (3 cols) */}
                                <div className="col-span-12 md:col-span-3 flex flex-col gap-1.5 items-start">
                                    <div className="flex items-center gap-2 text-xs md:text-sm text-slate-600">
                                        <MapPin size={14} className="text-slate-400" />
                                        <span className="truncate">{client.city}/{client.state}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {client.type && (
                                            <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wide">
                                                {client.type === 'Advertiser' ? 'Cliente' :
                                                    client.type === 'Agency' ? 'Agência' :
                                                        client.type === 'Representative' ? 'Representante' :
                                                            client.type}
                                            </span>
                                        )}
                                        {client.kyc_status && (
                                            <span className={clsx(
                                                "px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold border uppercase tracking-wide",
                                                client.kyc_status === 'Approved' ? "bg-green-50 text-green-700 border-green-200" :
                                                    client.kyc_status === 'Rejected' ? "bg-red-50 text-red-700 border-red-200" :
                                                        "bg-yellow-50 text-yellow-700 border-yellow-200"
                                            )}>
                                                {client.kyc_status === 'Approved' ? 'KYC OK' : 'KYC ' + client.kyc_status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pl-4 border-l border-slate-100 ml-4">
                                <button
                                    onClick={() => handleEdit(client)}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Editar"
                                >
                                    <MoreVertical size={18} />
                                </button>
                                {user?.role === 'admin' && ( // Admin Only
                                    <button
                                        onClick={() => handleDelete(client.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    {filteredClients.length === 0 && (
                        <div className="p-8 text-center text-slate-500">
                            Nenhum cliente encontrado.
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl p-6">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">
                            {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
                        </h2>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-12 gap-4">
                                {/* 1. Identification */}
                                <div className="col-span-12 space-y-2">
                                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1">Identificação</h3>
                                    <div className="grid grid-cols-12 gap-3">
                                        {editingClient && (
                                            <div className="col-span-12 md:col-span-2">
                                                <label className="block text-xs font-medium text-slate-500 mb-1">ID</label>
                                                <input disabled className="input-field w-full bg-slate-50 text-slate-500 font-mono text-xs" value={formData.id} />
                                            </div>
                                        )}
                                        <div className={editingClient ? "col-span-12 md:col-span-4" : "col-span-12 md:col-span-4"}>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Razão Social</label>
                                            <input required className="input-field w-full" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                        </div>
                                        <div className="col-span-12 md:col-span-3">
                                            <label className="block text-xs font-medium text-slate-700 mb-1">CNPJ/Doc</label>
                                            <input className="input-field w-full" value={formData.cnpj} onChange={e => setFormData({ ...formData, cnpj: e.target.value })} placeholder="00.000.000/0000-00" />
                                        </div>
                                        <div className="col-span-12 md:col-span-3">
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                                            <input type="email" className="input-field w-full" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                        </div>
                                        <div className="col-span-12 md:col-span-6">
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Nome Contato</label>
                                            <input className="input-field w-full" value={formData.contact_name} onChange={e => setFormData({ ...formData, contact_name: e.target.value })} />
                                        </div>
                                        <div className="col-span-12 md:col-span-6">
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Telefone</label>
                                            <input className="input-field w-full" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                {/* 2. Classification */}
                                <div className="col-span-12 space-y-2">
                                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1 mt-2">Classificação</h3>
                                    <div className="grid grid-cols-12 gap-3">
                                        <div className="col-span-6 md:col-span-3">
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Tipo</label>
                                            <select className="input-field w-full" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                                <option value="Advertiser">Cliente</option>
                                                <option value="Agency">Agência</option>
                                                <option value="Representative">Representante</option>
                                            </select>
                                        </div>
                                        <div className="col-span-6 md:col-span-3">
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Vertical</label>
                                            <input className="input-field w-full" value={formData.vertical} onChange={e => setFormData({ ...formData, vertical: e.target.value })} placeholder="Ex: Varejo" />
                                        </div>
                                        <div className="col-span-6 md:col-span-3">
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Health Score</label>
                                            <input type="number" min="0" max="100" className="input-field w-full" value={formData.health_score} onChange={e => setFormData({ ...formData, health_score: e.target.value })} />
                                        </div>
                                        <div className="col-span-6 md:col-span-3">
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Status KYC</label>
                                            <select className="input-field w-full" value={formData.kyc_status} onChange={e => setFormData({ ...formData, kyc_status: e.target.value })}>
                                                <option value="Pending">Pendente</option>
                                                <option value="Approved">Aprovado</option>
                                                <option value="Rejected">Rejeitado</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Address */}
                                <div className="col-span-12 space-y-2">
                                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1 mt-2">Endereço</h3>
                                    <div className="grid grid-cols-12 gap-3">
                                        <div className="col-span-12 md:col-span-5">
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Rua</label>
                                            <input className="input-field w-full" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                        </div>
                                        <div className="col-span-6 md:col-span-3">
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Bairro</label>
                                            <input className="input-field w-full" value={formData.bairro} onChange={e => setFormData({ ...formData, bairro: e.target.value })} />
                                        </div>
                                        <div className="col-span-6 md:col-span-2">
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Cidade</label>
                                            <input className="input-field w-full" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                                        </div>
                                        <div className="col-span-4 md:col-span-1">
                                            <label className="block text-xs font-medium text-slate-700 mb-1">UF</label>
                                            <input className="input-field w-full" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} maxLength={2} />
                                        </div>
                                        <div className="col-span-8 md:col-span-1">
                                            <label className="block text-xs font-medium text-slate-700 mb-1">CEP</label>
                                            <input className="input-field w-full" value={formData.zip} onChange={e => setFormData({ ...formData, zip: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                {/* 4. Financial */}
                                <div className="col-span-12 space-y-2">
                                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1 mt-2">Financeiro</h3>
                                    <div className="grid grid-cols-12 gap-3">
                                        <div className="col-span-6 md:col-span-3">
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Limite Crédito</label>
                                            <input type="number" step="0.01" className="input-field w-full" value={formData.credit_limit} onChange={e => setFormData({ ...formData, credit_limit: e.target.value })} placeholder="0.00" />
                                        </div>
                                        <div className="col-span-6 md:col-span-3">
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Termos</label>
                                            <input className="input-field w-full" value={formData.payment_terms} onChange={e => setFormData({ ...formData, payment_terms: e.target.value })} placeholder="Ex: 30 dias" />
                                        </div>
                                        <div className="col-span-6 md:col-span-3">
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Comissão (%)</label>
                                            <input type="number" step="0.1" className="input-field w-full" value={formData.commission_rate} onChange={e => setFormData({ ...formData, commission_rate: e.target.value })} />
                                        </div>
                                        <div className="col-span-6 md:col-span-3">
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Insc. Municipal</label>
                                            <input className="input-field w-full" value={formData.im} onChange={e => setFormData({ ...formData, im: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                {/* 5. Structure */}
                                <div className="col-span-12 space-y-2">
                                    <div className="grid grid-cols-12 gap-3">
                                        <div className="col-span-12">
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Holding (ID Pai)</label>
                                            <select className="input-field w-full" value={formData.parent_id || ''} onChange={e => setFormData({ ...formData, parent_id: e.target.value || null })}>
                                                <option value="">Nenhuma</option>
                                                {clients.filter(c => c.id !== formData.id).map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 mt-6 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark shadow-lg shadow-primary/30 transition-all"
                                >
                                    Salvar Cliente
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <style>{`
                .input-field {
                    padding: 0.5rem 0.75rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 0.5rem;
                    outline: none;
                    transition: all 0.2s;
                }
                .input-field:focus {
                     border-color: #2563eb;
                     box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
                }
            `}</style>
        </div>
    );
};

export default CRM;
