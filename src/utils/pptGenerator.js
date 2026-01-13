import PptxGenJS from 'pptxgenjs';

export const generateCheckinPPT = async (checkinData) => {
    const pres = new PptxGenJS();

    // Slide 1: Title
    const slide1 = pres.addSlide();
    slide1.addText('Relatório de Check-in DOOH', {
        x: 1, y: 1, w: '80%', h: 1, fontSize: 36, color: '363636', bold: true
    });
    slide1.addText(`Cliente: ${checkinData.clientName}`, { x: 1, y: 2.5, fontSize: 18, color: '808080' });
    slide1.addText(`Data: ${new Date().toLocaleDateString()}`, { x: 1, y: 3, fontSize: 14, color: '808080' });

    // For each photo
    checkinData.photos.forEach((photo, index) => {
        const slide = pres.addSlide();

        // Header
        slide.addText(`Foto ${index + 1} - ${checkinData.assetName}`, {
            x: 0.5, y: 0.2, w: '90%', fontSize: 18, bold: true, color: '363636'
        });

        // Image (Assuming Data URL or URL)
        if (photo.url) {
            slide.addImage({
                path: photo.url,
                x: 0.5,
                y: 0.8,
                w: 8.8, // 16:9ish aspect ratio space
                h: 4.95
            });
        }

        // Info Box
        slide.addText('Descrição IA (Simulada):', { x: 0.5, y: 6.0, fontSize: 12, bold: true });
        slide.addText(photo.aiDescription || 'Descrição não disponível', {
            x: 0.5, y: 6.3, w: 8.8, h: 1, fontSize: 11, color: '505050'
        });

        // Meta
        const metaText = `Lat: ${photo.lat || 'N/A'} | Long: ${photo.lng || 'N/A'} | Data: ${new Date().toLocaleString()}`;
        slide.addText(metaText, { x: 0.5, y: 7.2, fontSize: 9, color: 'A0A0A0' });
    });

    pres.writeFile({ fileName: `Checkin_${checkinData.clientName}.pptx` });
};
