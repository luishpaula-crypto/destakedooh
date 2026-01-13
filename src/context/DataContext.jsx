import React, { createContext, useContext, useState, useEffect } from 'react';
import { CLIENTS as INITIAL_CLIENTS, USERS, ASSETS as INITIAL_ASSETS, INVENTORY as INITIAL_INVENTORY, TRANSACTIONS as INITIAL_TRANSACTIONS } from '../data/mockData';

const DataContext = createContext(null);

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    // --- AUTOMATION: Check Campaign Statuses ---
    const checkCampaignStatus = (currentQuotes) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return currentQuotes.map(q => {
            // Only process approved, active, or finalized quotes (skip drafts/lost)
            if (['rascunho', 'enviado', 'perdido'].includes(q.status)) return q;

            if (!q.startDate || !q.endDate) return q;

            const start = new Date(q.startDate);
            const end = new Date(q.endDate);
            // Adjust end date to be inclusive (end of day)
            end.setHours(23, 59, 59, 999);

            let newStatus = q.status;

            if (today > end) {
                newStatus = 'finalizado';
            } else if (today >= start && today <= end) {
                // Only move to 'ativo' if it was 'aprovado' or already 'ativo'
                // (Don't accidentally reactivate a manually paused/cancelled one if we had that status)
                if (q.status === 'aprovado' || q.status === 'ativo') {
                    newStatus = 'ativo';
                }
            } else if (today < start && q.status === 'ativo') {
                // If by some mistake it was active but start date is future (dates changed?)
                newStatus = 'aprovado'; // Revert to approved/scheduled
            }

            if (newStatus !== q.status) {
                return { ...q, status: newStatus };
            }
            return q;
        });
    };
    // CLIENTS STATE
    const [clients, setClients] = useState(INITIAL_CLIENTS);

    const addClient = (client) => {
        setClients(prev => [...prev, { ...client, id: `c${Date.now()}` }]);
    };

    const updateClient = (updatedClient) => {
        setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
    };

    const deleteClient = (id) => {
        setClients(prev => prev.filter(c => c.id !== id));
    };

    const importClients = (newClients) => {
        setClients(prev => {
            const clientMap = new Map(prev.map(c => [c.id, c]));

            newClients.forEach(newClient => {
                const id = newClient.id || `c${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                clientMap.set(id, { ...clientMap.get(id), ...newClient, id });
            });
            return Array.from(clientMap.values());
        });
    };

    // ASSETS STATE
    const [assets, setAssets] = useState(INITIAL_ASSETS);

    const addAsset = (asset) => {
        setAssets(prev => [...prev, { ...asset, id: `a${Date.now()}` }]);
    };

    const updateAsset = (updatedAsset) => {
        setAssets(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));
    };

    const deleteAsset = (id) => {
        setAssets(prev => prev.filter(a => a.id !== id));
    };

    const importAssets = (newAssets) => {
        setAssets(prev => {
            const assetMap = new Map(prev.map(a => [a.id, a]));

            newAssets.forEach(newAsset => {
                // Determine ID: use existing, or generate new if missing
                const id = newAsset.id || `a${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

                // If it exists, merge; if not, create new
                // Ensure we handle basic type conversion if needed here, or rely on import logic
                assetMap.set(id, { ...assetMap.get(id), ...newAsset, id });
            });
            return Array.from(assetMap.values());
        });
    };

    // QUOTES STATE
    const [quotes, setQuotes] = useState(() => {
        // Initial check on load
        return checkCampaignStatus([
            {
                id: 'q1',
                client: INITIAL_CLIENTS[0],
                assets: [INITIAL_ASSETS[0]],
                campaignName: 'Campanha Verão 2024',
                startDate: '2024-01-01',
                endDate: '2024-01-07',
                days: 7,
                discount: 0,
                total: 10500,
                status: 'aprovado', // Will be corrected to 'finalizado' by checkCampaignStatus since dates are past
                controlNumber: '20241217-0001',
                createdAt: new Date()
            }
        ]);
    });

    // Run check daily or on mount (for now just on mount/reload is enough for MVP)
    useEffect(() => {
        setQuotes(prev => checkCampaignStatus(prev));
    }, []);

    const addQuote = (quote) => {
        // Generate Control Number: YYYYMMDD-0001
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const datePrefix = `${year}${month}${day}`;

        const countToday = quotes.filter(q => q.controlNumber && q.controlNumber.startsWith(datePrefix)).length;
        const sequence = String(countToday + 1).padStart(4, '0');
        const controlNumber = `${datePrefix}-${sequence}`;

        setQuotes(prev => [{ ...quote, id: `q${Date.now()}`, controlNumber }, ...prev]);
    };

    const updateQuote = (updatedQuote) => {
        setQuotes(prev => prev.map(q => q.id === updatedQuote.id ? updatedQuote : q));
    };

    const deleteQuote = (id) => {
        setQuotes(prev => prev.filter(q => q.id !== id));
    };

    // Mock Initial Maintenances
    const INITIAL_MAINTENANCES = [
        {
            id: 'm1',
            assetId: '1', // Linked to 'Painel Centro'
            title: 'Troca de Fonte de Alimentação',
            description: 'Fonte queimada após pico de energia. Necessária troca urgente.',
            type: 'corretiva', // corretiva, preventiva
            priority: 'alta', // baixa, media, alta, urgente
            status: 'resolvido', // aberto, em_andamento, resolvido
            cost: 450.00,
            responsible: 'TecElétrica Ltda',
            date: '2024-02-15'
        },
        {
            id: 'm2',
            assetId: '2', // Linked to 'Painel Shopping'
            title: 'Limpeza Preventiva e Revisão',
            description: 'Limpeza dos módulos de LED e verificação de conexões.',
            type: 'preventiva',
            priority: 'media',
            status: 'aberto',
            cost: 200.00,
            responsible: 'Equipe Interna',
            date: '2024-03-20'
        }
    ];

    const [maintenances, setMaintenances] = useState(INITIAL_MAINTENANCES);

    // Maintenance Actions
    const addMaintenance = (maintenance) => {
        const newMaintenance = { ...maintenance, id: Math.random().toString(36).substr(2, 9) };
        setMaintenances(prev => [...prev, newMaintenance]);
    };

    const updateMaintenance = (updatedMaintenance) => {
        setMaintenances(prev => prev.map(m => m.id === updatedMaintenance.id ? updatedMaintenance : m));
    };

    const deleteMaintenance = (id) => {
        setMaintenances(prev => prev.filter(m => m.id !== id));
    };

    // INVENTORY STATE
    const [inventory, setInventory] = useState(INITIAL_INVENTORY);

    const addInventoryItem = (item) => {
        setInventory(prev => [...prev, { ...item, id: `inv${Date.now()}` }]);
    };

    const updateInventoryItem = (updatedItem) => {
        setInventory(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
    };

    const deleteInventoryItem = (id) => {
        setInventory(prev => prev.filter(i => i.id !== id));
    };

    // FINANCE STATE
    const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);

    const addTransaction = (transaction) => {
        setTransactions(prev => [...prev, { ...transaction, id: `t${Date.now()}` }]);
    };

    const updateTransaction = (updated) => {
        setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
    };

    const deleteTransaction = (id) => {
        setTransactions(prev => prev.filter(t => t.id !== id));
    };

    return (
        <DataContext.Provider value={{
            clients, addClient, updateClient, deleteClient, importClients,
            assets, addAsset, updateAsset, deleteAsset, importAssets,
            quotes, addQuote, updateQuote, deleteQuote,
            maintenances, addMaintenance, updateMaintenance, deleteMaintenance,
            inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem,
            transactions, addTransaction, updateTransaction, deleteTransaction
        }}>
            {children}
        </DataContext.Provider>
    );
};
