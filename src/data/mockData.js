export const USERS = [
    { id: '1', name: 'Admin User', role: 'admin' },
    { id: '2', name: 'Vendedor Lucas', role: 'sales' },
    { id: '3', name: 'Cliente Padrao', role: 'user' },
];

export const CLIENTS = [
    {
        id: 'c1',
        name: 'Coca-Cola Brasil',
        cnpj: '00.000.000/0001-00',
        im: '123456',
        state_inscription: '123.456.789.000',
        contact_name: 'Mariana Silva',
        email: 'mariana@cocacola.com',
        phone: '(11) 99999-0001',
        address: 'Av. Paulista, 1000',
        bairro: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zip: '01310-100'
    },
    {
        id: 'c2',
        name: 'Nike Store',
        cnpj: '11.111.111/0001-11',
        im: '654321',
        state_inscription: '111.222.333.444',
        contact_name: 'Carlos Oliveira',
        email: 'carlos@nike.com',
        phone: '(11) 99999-0002',
        address: 'Av. Roque Petroni Jr, 1089',
        bairro: 'Jardim das Acácias',
        city: 'São Paulo',
        state: 'SP',
        zip: '04707-900'
    },
    {
        id: 'c3',
        name: 'Local Eventos',
        cnpj: '22.222.222/0001-22',
        im: '987654',
        state_inscription: '',
        contact_name: 'Julia Santos',
        email: 'julia@localeventos.com',
        phone: '(21) 99999-0003',
        address: 'Rua do Ouvidor, 50',
        bairro: 'Centro',
        city: 'Rio de Janeiro',
        state: 'RJ',
        zip: '20040-030'
    }
];

export const ASSETS = [
    {
        id: 'a1',
        name: 'Painel LED - Av. Paulista (Central)',
        // Basic / Location
        address: 'Av. Paulista, 1000 - Bela Vista',
        bairro: 'Bela Vista',
        regiao: 'Centro',
        cidade: 'São Paulo',
        photo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1000',

        // Technical
        type: 'PAINEL DE LED',
        format: '16:9',
        resolution: '1920x1080',
        operadora: 'Vivo',
        iccid_contrato: '89551234567890',
        id_cemig: 'INSTALL-12345',
        sensor: 'Sim',
        teamviewer_id: '123 456 789',
        formato_arquivo: '.mp4',
        id_4yousee: 'PLAYER-01',

        // Financial
        daily_rate: 1500, // VALOR TABELA UNIT used for calculation
        valor_tabela_unit: 1500,
        investimentos: 50000,
        manutencao: 500,
        aluguel_mensal: 2000,
        desconto_padrao: 10,
        valor_final: 1350,

        // Metrics
        insercoes_diarias: 600,
        fluxo_diario: 45000,
        fluxo_periodo: 1350000,
        total_dias: 30,
        vigencia: '2025-12-31',
        atualizacao: '2024-01-15',

        // Demographic
        genero_fem_pct: 52,
        genero_masc_pct: 48,
        domicilios: 15000,
        populacao: 450000,
        renda_media: 'A/B',
        alcance: 150000,
        frequencia_media: 3.5,
        tempo_permanencia: '45s',
        impactos: 525000
    },
    {
        id: 'a2',
        name: 'Painel LED - Faria Lima (Shop)',
        // Basic / Location
        address: 'Av. Brigadeiro Faria Lima, 2500 - Jardim Paulistano',
        bairro: 'Jardim Paulistano',
        regiao: 'Zona Oeste',
        cidade: 'São Paulo',
        photo: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=1000',

        // Technical
        type: 'PAINEL DE LED',
        format: '9:16',
        resolution: '1080x1920',
        operadora: 'Claro',
        iccid_contrato: '89559876543210',
        id_cemig: 'INSTALL-67890',
        sensor: 'Não',
        teamviewer_id: '987 654 321',
        formato_arquivo: '.mp4',
        id_4yousee: 'PLAYER-02',

        // Financial
        daily_rate: 2200,
        valor_tabela_unit: 2200,
        investimentos: 75000,
        manutencao: 800,
        aluguel_mensal: 3500,
        desconto_padrao: 5,
        valor_final: 2090,

        // Metrics
        insercoes_diarias: 480,
        fluxo_diario: 65000,
        fluxo_periodo: 1950000,
        total_dias: 30,
        vigencia: '2025-12-31',
        atualizacao: '2024-02-10',

        // Demographic
        genero_fem_pct: 45,
        genero_masc_pct: 55,
        domicilios: 8000,
        populacao: 380000,
        renda_media: 'A+',
        alcance: 200000,
        frequencia_media: 4.2,
        tempo_permanencia: '60s',
        impactos: 840000
    },
    {
        id: 'a3',
        name: 'Mega Banner - Copacabana (Rio)',
        // Basic / Location
        address: 'Av. Atlântica, 100 - Copacabana',
        bairro: 'Copacabana',
        regiao: 'Zona Sul',
        cidade: 'Rio de Janeiro',
        photo: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1000',

        // Technical
        type: 'BANCA DE LED',
        format: '32:9',
        resolution: '1920x540',
        operadora: 'Tim',
        iccid_contrato: '89551122334455',
        id_cemig: 'INSTALL-RI001',
        sensor: 'Sim',
        teamviewer_id: '321 654 987',
        formato_arquivo: '.jpg',
        id_4yousee: 'PLAYER-RJ1',

        // Financial
        daily_rate: 3000,
        valor_tabela_unit: 3000,
        investimentos: 120000,
        manutencao: 1200,
        aluguel_mensal: 5000,
        desconto_padrao: 0,
        valor_final: 3000,

        // Metrics
        insercoes_diarias: 1000,
        fluxo_diario: 120000,
        fluxo_periodo: 3600000,
        total_dias: 30,
        vigencia: '2025-12-31',
        atualizacao: '2024-03-01',

        // Demographic
        genero_fem_pct: 60,
        genero_masc_pct: 40,
        domicilios: 25000,
        populacao: 600000,
        renda_media: 'A',
        alcance: 450000,
        frequencia_media: 5.0,
        tempo_permanencia: '90s',
        impactos: 1500000
    }
];

export const INVENTORY = [
    // Raw Materials (Matéria-Prima)
    {
        id: 'i1',
        name: 'Módulo LED P3.9 Outdoor',
        type: 'raw_material',
        category: 'LED',
        quantity: 50,
        minQuantity: 20,
        unit: 'un',
        location: 'Galpão A',
        cost: 150.00
    },
    {
        id: 'i2',
        name: 'Fonte 5V 60A Slim',
        type: 'raw_material',
        category: 'Elétrica',
        quantity: 30,
        minQuantity: 10,
        unit: 'un',
        location: 'Galpão A',
        cost: 45.00
    },
    {
        id: 'i3',
        name: 'Cabo Flat 16 vias',
        type: 'raw_material',
        category: 'Cabos',
        quantity: 200,
        minQuantity: 50,
        unit: 'm',
        location: 'Galpão B',
        cost: 2.50
    },
    {
        id: 'i4',
        name: 'Gabinete 500x500mm Alumínio',
        type: 'raw_material',
        category: 'Estrutura',
        quantity: 12,
        minQuantity: 5,
        unit: 'un',
        location: 'Galpão A',
        cost: 300.00
    },
    // Work In Progress (Fabricação / Em uso)
    {
        id: 'w1',
        name: 'Montagem Painel 3x2 (Cliente X)',
        type: 'wip',
        category: 'Montagem',
        quantity: 1,
        minQuantity: 0,
        unit: 'un',
        location: 'Linha 1',
        cost: 0 // Calculated dynamically usually
    },
    // Merchandise / Finished Goods (Mercadoria)
    {
        id: 'm1',
        name: 'Painel P3.9 1x1m Completo (Locação)',
        type: 'merchandise',
        category: 'Painéis Prontos',
        quantity: 8,
        minQuantity: 2,
        unit: 'un',
        location: 'Expedição',
        cost: 2500.00
    }
];

export const TRANSACTIONS = [
    {
        id: 't1',
        description: 'Aluguel Escritório',
        type: 'expense',
        category: 'Aluguel',
        amount: 3500.00,
        dueDate: '2024-12-05',
        status: 'paid',
        taxType: null
    },
    {
        id: 't2',
        description: 'Recebimento Coca-Cola - Campanha Verão',
        type: 'income',
        category: 'Vendas',
        amount: 8500.00,
        dueDate: '2024-12-10',
        status: 'paid',
        taxType: null
    },
    {
        id: 't3',
        description: 'Energia Elétrica (Cemig)',
        type: 'expense',
        category: 'Energia',
        amount: 1200.00,
        dueDate: '2024-12-20',
        status: 'pending',
        taxType: null
    },
    {
        id: 't4',
        description: 'Manutenção P4 Outdoor',
        type: 'expense',
        category: 'Manutenção',
        amount: 450.00,
        dueDate: '2024-12-22',
        status: 'pending',
        taxType: null
    },
    {
        id: 't5',
        description: 'Internet Fibra',
        type: 'expense',
        category: 'Infraestrutura',
        amount: 180.00,
        dueDate: '2024-12-15',
        status: 'late',
        taxType: null
    },
    {
        id: 't6',
        description: 'Recebimento Nike - Black Friday',
        type: 'income',
        category: 'Vendas',
        amount: 12000.00,
        dueDate: '2024-12-28',
        status: 'pending',
        taxType: null
    },
    // Taxes (Simulated)
    {
        id: 't7',
        description: 'DAS - Simples Nacional (Nov)',
        type: 'expense',
        category: 'Impostos',
        amount: 1200.50,
        dueDate: '2024-12-20',
        status: 'pending',
        taxType: 'DAS'
    }
];
