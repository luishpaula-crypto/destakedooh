import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const DataContext = createContext(null);

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    // --- STATE ---
    const [clients, setClients] = useState([]);
    const [assets, setAssets] = useState([]);
    const [quotes, setQuotes] = useState([]);
    const [maintenances, setMaintenances] = useState([]);
    const [inventory, setInventory] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [suppliers, setSuppliers] = useState([]); // [NEW]
    const [productionOrders, setProductionOrders] = useState([]); // [NEW]
    const [movements, setMovements] = useState([]); // [NEW]
    const [mediaFiles, setMediaFiles] = useState([]); // NEW - Programming Module
    const [playlistItems, setPlaylistItems] = useState([]); // NEW - Programming Module
    const [loading, setLoading] = useState(true);

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [
                    { data: clientsData },
                    { data: assetsData },
                    { data: quotesData },
                    { data: maintenancesData },
                    { data: inventoryData },
                    { data: transactionsData },
                    { data: suppliersData }, // [NEW]
                    { data: productionOrdersData }, // [NEW]
                    { data: movementsData }, // [NEW]
                    { data: mediaFilesData }, // NEW
                    { data: playlistItemsData } // NEW
                ] = await Promise.all([
                    supabase.from('clients').select('*'),
                    supabase.from('assets').select('*'),
                    supabase.from('quotes').select('*'),
                    supabase.from('maintenances').select('*'),
                    supabase.from('inventory').select('*'),
                    supabase.from('transactions').select('*'),
                    supabase.from('suppliers').select('*'), // [NEW]
                    supabase.from('production_orders').select('*, production_items(*)'), // [NEW] fetch with items
                    supabase.from('inventory_movements').select('*').order('created_at', { ascending: false }).limit(100), // [NEW] limit for perf
                    supabase.from('media_files').select('*').order('created_at', { ascending: false }), // NEW
                    supabase.from('playlist_items').select('*') // NEW
                ]);

                if (clientsData) setClients(clientsData);
                if (assetsData) setAssets(assetsData);
                if (quotesData) setQuotes(processQuotes(quotesData));
                if (maintenancesData) setMaintenances(maintenancesData);
                if (inventoryData) setInventory(inventoryData);
                if (transactionsData) setTransactions(transactionsData);
                if (suppliersData) setSuppliers(suppliersData); // [NEW]
                if (productionOrdersData) setProductionOrders(productionOrdersData); // [NEW]
                if (movementsData) setMovements(movementsData); // [NEW]
                if (mediaFilesData) setMediaFiles(mediaFilesData); // [NEW]
                if (playlistItemsData) setPlaylistItems(playlistItemsData); // [NEW]

            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // --- HELPERS ---
    const processQuotes = (rawQuotes) => {
        return rawQuotes.map(q => ({
            ...q,
            // Map snake_case to camelCase
            campaignName: q.campaign_name,
            controlNumber: q.control_number,
            startDate: q.start_date,
            endDate: q.end_date,
            discountPct: q.discount_pct,
            mediaStatus: q.media_status,
            piGeneratedAt: q.pi_generated_at,
            createdAt: q.created_at,
            // Ensure assets/client are accessible (they are JSONB so they come as objects)
            client: q.client,
            assets: q.assets
        }));
    };

    // --- CLIENTS ACTIONS ---
    // --- CLIENTS ACTIONS ---
    const addClient = async (client) => {
        const result = await supabase.from('clients').insert([client]).select();
        const { data, error } = result;
        if (!error && data) setClients(prev => [...prev, data[0]]);
        return result;
    };

    const updateClient = async (updatedClient) => {
        const result = await supabase.from('clients').update(updatedClient).eq('id', updatedClient.id);
        const { error } = result;
        if (!error) setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
        return result;
    };

    const deleteClient = async (id) => {
        const result = await supabase.from('clients').delete().eq('id', id);
        const { error } = result;
        if (!error) setClients(prev => prev.filter(c => c.id !== id));
        return result;
    };

    const importClients = async (newClients) => {
        try {
            // Prepare data: ensure ID exists and sanitation
            const preparedClients = newClients.map(c => ({
                ...c,
                id: c.id ? c.id : self.crypto.randomUUID(),
                // partial sanitation
                health_score: c.health_score === '' ? null : c.health_score,
                credit_limit: c.credit_limit === '' ? null : c.credit_limit,
                commission_rate: c.commission_rate === '' ? null : c.commission_rate,
                parent_id: c.parent_id === '' ? null : c.parent_id
            }));

            // Bulk insert
            const { data, error } = await supabase.from('clients').upsert(preparedClients).select();

            if (error) throw error;

            if (data) {
                // Re-fetch to ensure sync
                const { data: allClients, error: fetchError } = await supabase.from('clients').select('*');
                if (fetchError) throw fetchError;
                if (allClients) setClients(allClients);
            }
            return { data, error: null };
        } catch (error) {
            console.error("Error importing clients:", error);
            return { data: null, error };
        }
    };

    // --- ASSETS ACTIONS ---
    const addAsset = async (asset) => {
        const { data, error } = await supabase.from('assets').insert([asset]).select();
        if (error) {
            console.error("Supabase Error (addAsset):", error);
            alert(`Erro ao adicionar ativo: ${error.message}`);
            return; // Exit on error
        }
        if (data) setAssets(prev => [...prev, data[0]]);
    };

    const updateAsset = async (updatedAsset) => {
        const { error } = await supabase.from('assets').update(updatedAsset).eq('id', updatedAsset.id);
        if (error) {
            console.error("Supabase Error (updateAsset):", error);
            alert(`Erro ao atualizar ativo: ${error.message}`);
            return;
        }
        setAssets(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));
    };

    const deleteAsset = async (id) => {
        const { error } = await supabase.from('assets').delete().eq('id', id);
        if (error) {
            console.error("Supabase Error (deleteAsset):", error);
            alert(`Erro ao excluir ativo: ${error.message}`);
            return;
        }
        setAssets(prev => prev.filter(a => a.id !== id));
    };

    const importAssets = async (newAssets) => {
        // Split into updates (have IDs) and inserts (no IDs) to avoid ragged array issues
        // (Supabase might pad missing keys with NULL if mixing rows with/without ID, causing NOT NULL violation)
        const toUpdate = newAssets.filter(a => a.id);
        const toInsert = newAssets.filter(a => !a.id);

        let errors = [];

        try {
            if (toUpdate.length > 0) {
                const { error: errUp } = await supabase.from('assets').upsert(toUpdate).select();
                if (errUp) errors.push("(Atualização) " + errUp.message);
            }

            if (toInsert.length > 0) {
                const { error: errIn } = await supabase.from('assets').insert(toInsert).select();
                if (errIn) errors.push("(Inserção) " + errIn.message);
            }

            // Refresh data if anything succeeded or if we want consistent state
            const { data: allAssets } = await supabase.from('assets').select('*');
            if (allAssets) setAssets(allAssets);

            if (errors.length > 0) {
                return { error: { message: errors.join(" | ") } };
            }
            return { error: null };

        } catch (err) {
            return { error: err };
        }
    };

    // --- QUOTES ACTIONS ---
    // --- QUOTES ACTIONS ---
    const addQuote = async (quote) => {
        // Generate Custom Control Number: YYYYMMXXXX
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const prefix = parseInt(`${year}${month}`);

        // Find max control number for this month
        // We can't use .like() easily on numbers, so we range query or fetch all for this month.
        // Or simpler: fetch order by control_number desc limit 1 where control_number >= prefix*10000

        const minVal = prefix * 10000;
        const maxVal = (prefix + 1) * 10000;

        const { data: lastQuote } = await supabase
            .from('quotes')
            .select('control_number')
            .gte('control_number', minVal)
            .lt('control_number', maxVal)
            .order('control_number', { ascending: false })
            .limit(1)
            .single();

        let nextControl = minVal + 1;
        if (lastQuote && lastQuote.control_number) {
            nextControl = parseInt(lastQuote.control_number) + 1;
        }

        const quoteWithId = { ...quote, control_number: nextControl };

        const { data, error } = await supabase.from('quotes').insert([quoteWithId]).select();
        if (!error && data) {
            const processed = processQuotes(data)[0];
            setQuotes(prev => [...prev, processed]);
        }
    };

    const updateQuote = async (updatedQuote) => {
        const { data, error } = await supabase.from('quotes').update(updatedQuote).eq('id', updatedQuote.id).select();
        if (!error && data) {
            const processed = processQuotes(data)[0];
            setQuotes(prev => prev.map(q => q.id === updatedQuote.id ? processed : q));
        }
    };

    const deleteQuote = async (id) => {
        const { error } = await supabase.from('quotes').delete().eq('id', id);
        if (!error) setQuotes(prev => prev.filter(q => q.id !== id));
    };

    // --- MAINTENANCE ACTIONS ---
    const addMaintenance = async (maintenance) => {
        const result = await supabase.from('maintenances').insert([maintenance]).select();
        const { data, error } = result;
        if (!error && data) setMaintenances(prev => [...prev, data[0]]);
        return result;
    };

    const updateMaintenance = async (updatedMaintenance) => {
        const result = await supabase.from('maintenances').update(updatedMaintenance).eq('id', updatedMaintenance.id);
        const { error } = result;
        if (!error) setMaintenances(prev => prev.map(m => m.id === updatedMaintenance.id ? updatedMaintenance : m));
        return result;
    };

    const deleteMaintenance = async (id) => {
        const { error } = await supabase.from('maintenances').delete().eq('id', id);
        if (!error) setMaintenances(prev => prev.filter(m => m.id !== id));
    };

    // --- INVENTORY ACTIONS ---
    const addInventoryItem = async (item) => {
        const { data, error } = await supabase.from('inventory').insert([item]).select();
        if (!error && data) setInventory(prev => [...prev, data[0]]);
        return { data, error };
    };

    const updateInventoryItem = async (updatedItem) => {
        const { error } = await supabase.from('inventory').update(updatedItem).eq('id', updatedItem.id);
        if (!error) setInventory(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
        return { error };
    };

    const deleteInventoryItem = async (id) => {
        const { error } = await supabase.from('inventory').delete().eq('id', id);
        if (!error) setInventory(prev => prev.filter(i => i.id !== id));
        return { error };
    };

    // [NEW] Inventory Movement (Stock In/Out/Adjustment)
    const addInventoryMovement = async (movement) => {
        // 1. Log movement
        const { data: moveData, error: moveError } = await supabase.from('inventory_movements').insert([movement]).select();
        if (moveError) return { error: moveError };

        // 2. Update Item Quantity
        const item = inventory.find(i => i.id === movement.item_id);
        if (!item) return { error: "Item not found" };

        const newQty = (Number(item.quantity) || 0) + Number(movement.quantity); // movement.quantity should be signed (+/-)

        const { error: updateError } = await supabase.from('inventory').update({ quantity: newQty }).eq('id', item.id);

        if (!updateError) {
            setMovements(prev => [moveData[0], ...prev]);
            setInventory(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i));
        }
        return { error: updateError };
    };

    // [NEW] SUPPLIERS ACTIONS
    const addSupplier = async (supplier) => {
        const { data, error } = await supabase.from('suppliers').insert([supplier]).select();
        if (!error && data) setSuppliers(prev => [...prev, data[0]]);
        return { data, error };
    };

    const updateSupplier = async (updated) => {
        const { error } = await supabase.from('suppliers').update(updated).eq('id', updated.id);
        if (!error) setSuppliers(prev => prev.map(s => s.id === updated.id ? updated : s));
        return { error };
    };

    const deleteSupplier = async (id) => {
        const { error } = await supabase.from('suppliers').delete().eq('id', id);
        if (!error) setSuppliers(prev => prev.filter(s => s.id !== id));
        return { error };
    };

    // [NEW] PRODUCTION ACTIONS
    const addProductionOrder = async (order, items) => {
        // 1. Create Order
        const { data: orderData, error: orderError } = await supabase.from('production_orders').insert([order]).select();
        if (orderError) return { error: orderError };

        const orderId = orderData[0].id;

        // 2. Create Items
        const itemsWithId = items.map(Item => ({ ...Item, production_order_id: orderId }));
        const { error: itemsError } = await supabase.from('production_items').insert(itemsWithId);

        if (!itemsError) {
            setProductionOrders(prev => [...prev, { ...orderData[0], production_items: itemsWithId }]);
        }
        return { error: itemsError };
    };

    const updateProductionOrderStatus = async (id, status) => {
        const { error } = await supabase.from('production_orders').update({ status }).eq('id', id);
        if (!error) setProductionOrders(prev => prev.map(p => p.id === id ? { ...p, status } : p));
        return { error };
    };

    // [NEW] PROGRAMMING MODULE ACTIONS
    const uploadMediaFile = async (fileData) => {
        const { data, error } = await supabase.from('media_files').insert([fileData]).select();
        if (!error && data) setMediaFiles(prev => [data[0], ...prev]);
        return { data, error };
    };

    const updateMediaStatus = async (id, status) => {
        const { error } = await supabase.from('media_files').update({ status }).eq('id', id);
        if (!error) setMediaFiles(prev => prev.map(m => m.id === id ? { ...m, status } : m));
        return { error };
    };

    const addPlaylistItem = async (item) => {
        const { data, error } = await supabase.from('playlist_items').insert([item]).select();
        if (!error && data) setPlaylistItems(prev => [...prev, data[0]]);
        return { data, error };
    };

    const deletePlaylistItem = async (id) => {
        const { error } = await supabase.from('playlist_items').delete().eq('id', id);
        if (!error) setPlaylistItems(prev => prev.filter(p => p.id !== id));
        return { error };
    };

    // --- TRANSACTIONS ACTIONS ---
    const addTransaction = async (transaction) => {
        const { data, error } = await supabase.from('transactions').insert([transaction]).select();
        if (!error && data) setTransactions(prev => [...prev, data[0]]);
    };

    const updateTransaction = async (updated) => {
        const { error } = await supabase.from('transactions').update(updated).eq('id', updated.id);
        if (!error) setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t));
    };

    const deleteTransaction = async (id) => {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (!error) setTransactions(prev => prev.filter(t => t.id !== id));
    };

    return (
        <DataContext.Provider value={{
            loading,
            clients, addClient, updateClient, deleteClient, importClients,
            assets, addAsset, updateAsset, deleteAsset, importAssets,
            quotes, addQuote, updateQuote, deleteQuote,
            maintenances, addMaintenance, updateMaintenance, deleteMaintenance,
            inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, addInventoryMovement, movements,
            suppliers, addSupplier, updateSupplier, deleteSupplier,
            productionOrders, addProductionOrder, updateProductionOrderStatus,
            mediaFiles, uploadMediaFile, updateMediaStatus,
            playlistItems, addPlaylistItem, deletePlaylistItem,
            transactions, addTransaction, updateTransaction, deleteTransaction
        }}>
            {children}
        </DataContext.Provider>
    );
};
