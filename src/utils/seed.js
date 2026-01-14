
import { supabase } from '../lib/supabase';
import { CLIENTS, ASSETS, INVENTORY, TRANSACTIONS } from '../data/mockData';

export const seedDatabase = async () => {
    console.log('Starting migration...');

    // 1. Migrate Clients
    console.log('Migrating Clients...');
    const { error: clientsError } = await supabase.from('clients').upsert(
        CLIENTS.map(c => ({
            id: c.id,
            name: c.name,
            cnpj: c.cnpj,
            im: c.im,
            state_inscription: c.state_inscription,
            contact_name: c.contact_name,
            email: c.email,
            phone: c.phone,
            address: c.address,
            bairro: c.bairro,
            city: c.city,
            state: c.state,
            zip: c.zip,
            type: c.type,
            vertical: c.vertical,
            health_score: c.health_score,
            kyc_status: c.kyc_status,
            credit_limit: c.credit_limit,
            payment_terms: c.payment_terms,
            commission_rate: c.commission_rate,
            parent_id: c.parent_id
        }))
    );
    if (clientsError) console.error('Error migrating clients:', clientsError);

    // 2. Migrate Assets
    console.log('Migrating Assets...');
    const { error: assetsError } = await supabase.from('assets').upsert(
        ASSETS.map(a => ({
            id: a.id,
            name: a.name,
            address: a.address,
            bairro: a.bairro,
            regiao: a.regiao,
            cidade: a.cidade,
            photo: a.photo,
            type: a.type,
            format: a.format,
            resolution: a.resolution,
            operadora: a.operadora,
            iccid_contrato: a.iccid_contrato,
            id_cemig: a.id_cemig,
            sensor: a.sensor,
            teamviewer_id: a.teamviewer_id,
            formato_arquivo: a.formato_arquivo,
            id_4yousee: a.id_4yousee,
            daily_rate: a.daily_rate,
            valor_tabela_unit: a.valor_tabela_unit,
            investimentos: a.investimentos,
            manutencao: a.manutencao,
            aluguel_mensal: a.aluguel_mensal,
            desconto_padrao: a.desconto_padrao,
            valor_final: a.valor_final,
            insercoes_diarias: a.insercoes_diarias,
            fluxo_diario: a.fluxo_diario,
            fluxo_periodo: a.fluxo_periodo,
            total_dias: a.total_dias,
            vigencia: a.vigencia,
            atualizacao: a.atualizacao,
            genero_fem_pct: a.genero_fem_pct,
            genero_masc_pct: a.genero_masc_pct,
            domicilios: a.domicilios,
            populacao: a.populacao,
            renda_media: a.renda_media,
            alcance: a.alcance,
            frequencia_media: a.frequencia_media,
            tempo_permanencia: a.tempo_permanencia,
            impactos: a.impactos
        }))
    );
    if (assetsError) console.error('Error migrating assets:', assetsError);

    // 3. Migrate Inventory
    console.log('Migrating Inventory...');
    const { error: invError } = await supabase.from('inventory').upsert(
        INVENTORY.map(i => ({
            id: i.id,
            name: i.name,
            type: i.type,
            category: i.category,
            quantity: i.quantity,
            min_quantity: i.minQuantity,
            unit: i.unit,
            location: i.location,
            cost: i.cost
        }))
    );
    if (invError) console.error('Error migrating inventory:', invError);

    // 4. Migrate Transactions
    console.log('Migrating Transactions...');
    const { error: transError } = await supabase.from('transactions').upsert(
        TRANSACTIONS.map(t => ({
            id: t.id,
            description: t.description,
            type: t.type,
            category: t.category,
            amount: t.amount,
            due_date: t.dueDate,
            status: t.status,
            tax_type: t.taxType
        }))
    );
    if (transError) console.error('Error migrating transactions:', transError);

    alert('Migration completed! Check console for details.');
};
