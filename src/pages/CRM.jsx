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
        name: '',
        cnpj: '',
        im: '',
        ie: '',
        address: '',
        bairro: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        contact_name: '',
        email: ''
    });

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contact_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddNew = () => {
        setEditingClient(null);
        setFormData({
            name: '', cnpj: '', im: '', ie: '',
            address: '', bairro: '', city: '', state: '', zip: '',
            phone: '', contact_name: '', email: ''
        });
        setIsModalOpen(true);
    };

    const handleEdit = (client) => {
        setEditingClient(client);
        setFormData(client);
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('Tem certeza que deseja remover este cliente?')) {
            deleteClient(id);
        }
    };

    const handeSave = (e) => {
        e.preventDefault();
        if (editingClient) {
            updateClient({ ...editingClient, ...formData });
        } else {
            addClient(formData);
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
                                reader.onload = (evt) => {
                                    const data = new Uint8Array(evt.target.result);
                                    const wb = XLSX.read(data, { type: 'array' });
                                    const wsname = wb.SheetNames[0];
                                    const ws = wb.Sheets[wsname];
                                    const jsonData = XLSX.utils.sheet_to_json(ws);
                                    importClients(jsonData);
                                    alert('Clientes importados com sucesso!');
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
                                "p-6 transition-colors flex items-center justify-between group",
                                index % 2 === 0 ? "bg-white" : "bg-slate-50" // Alternating Colors: White / Light Gray
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                                    {client.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">{client.name}</h3>
                                    <div className="text-xs text-slate-400 font-mono mt-0.5">CNPJ: {client.cnpj || 'N/A'}</div>
                                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
                                        <span className="flex items-center gap-1">
                                            <UserIcon size={14} /> {client.contact_name}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Phone size={14} /> {client.phone}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin size={14} /> {client.city}/{client.state}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleEdit(client)}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Editar"
                                >
                                    <MoreVertical size={20} />
                                </button>
                                {user.role === 'admin' && ( // Admin Only
                                    <button
                                        onClick={() => handleDelete(client.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 size={20} />
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

                        <form onSubmit={handeSave} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Razão Social</label>
                                    <input required className="input-field w-full" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ</label>
                                    <input className="input-field w-full" value={formData.cnpj} onChange={e => setFormData({ ...formData, cnpj: e.target.value })} placeholder="00.000.000/0000-00" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Inscrição Municipal (IM)</label>
                                    <input className="input-field w-full" value={formData.im} onChange={e => setFormData({ ...formData, im: e.target.value })} />
                                </div>

                                <div className="col-span-2">
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                        <MapPin size={12} /> Endereço
                                    </div>
                                </div>

                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">CEP</label>
                                    <input className="input-field w-full" value={formData.zip} onChange={e => setFormData({ ...formData, zip: e.target.value })} />
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Endereço (Rua, Nº)</label>
                                    <input className="input-field w-full" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
                                    <input className="input-field w-full" value={formData.bairro} onChange={e => setFormData({ ...formData, bairro: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Cidade</label>
                                        <input className="input-field w-full" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">UF</label>
                                        <input className="input-field w-full" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} maxLength={2} />
                                    </div>
                                </div>

                                <div className="col-span-2">
                                    <div className="flex items-center gap-2 mb-2 pb-2 mt-2 border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                        <UserIcon size={12} /> Contato
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Contato</label>
                                    <input className="input-field w-full" value={formData.contact_name} onChange={e => setFormData({ ...formData, contact_name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                                    <input className="input-field w-full" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input type="email" className="input-field w-full" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
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
