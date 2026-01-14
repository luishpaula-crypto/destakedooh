export const generateLocationAnalysis = async (asset) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { bairro, cidade, type } = asset;

    // Mock Intelligence Generation
    // In a real scenario, this would call OpenAI or Gemini API with a prompt like:
    // "Analyze the commercial potential for a DOOH asset at {address}, {bairro}, {cidade}. Type: {type}..."

    const nearbyPOIs = [
        "Shopping Center Principal",
        "Estação de Metrô/Ônibus",
        "Bancos (Itaú, Bradesco, BB)",
        "Farmácias de Grande Rede",
        "Academias Smart Fit/Bluefit",
        "Supermercados Extra/Carrefour"
    ];

    // Randomize POIs for "realism"
    const selectedPOIs = nearbyPOIs.sort(() => 0.5 - Math.random()).slice(0, 3);

    const scores = {
        comercial: Math.floor(Math.random() * (100 - 70) + 70),
        transito: Math.floor(Math.random() * (100 - 60) + 60),
        visibilidade: Math.floor(Math.random() * (100 - 80) + 80),
    };

    return `
# 📍 Análise de Inteligência de Localização (AI)
**Ativo:** ${type} em ${bairro}, ${cidade}

## 📊 Pontuação de Potencial
- **Potencial Comercial:** ${scores.comercial}/100 🟢
- **Fluxo de Trânsito:** ${scores.transito}/100 🟡
- **Visibilidade Estimada:** ${scores.visibilidade}/100 🟢

## 🏢 Pontos de Interesse Próximos (Raio 500m)
A localização beneficia-se da proximidade com geradores de tráfego qualificado:
${selectedPOIs.map(p => `- ${p}`).join('\n')}

## 🎯 Perfil de Público Sugerido
- **Consumidores:** Público economicamente ativo, frequentadores de comércio local e serviços.
- **Interesses:** Varejo, alimentação, serviços financeiros e bem-estar.
- **Horário de Pico:** 17:00 - 20:00 (Saída comercial)

## 💡 Recomendação de Venda
Excelente ponto para campanhas de **varejo local** e **branding institucional**. A alta visibilidade favorece vídeos curtos e de alto impacto visual. Aproveite a proximidade com ${selectedPOIs[0]} para oferecer pacotes segmentados.
    `.trim();
};
