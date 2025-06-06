import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface ExportPDFOptions {
    element: HTMLElement
    filename?: string
    format?: 'a4' | 'letter'
    orientation?: 'portrait' | 'landscape'
}

export async function exportToPDF({
    element,
    filename = 'documento.pdf',
    format = 'a4',
    orientation = 'portrait'
}: ExportPDFOptions): Promise<void> {
    try {
        // Optimizar el elemento antes de capturarlo
        const originalStyle = element.style.cssText

        // Aplicar estilos optimizados para PDF
        element.style.cssText = `
          ${originalStyle}
          transform: scale(1);
          transform-origin: top left;
          font-size: 16px;
          line-height: 1.5;
          color: #000000;
          background-color: #ffffff;
          padding: 20px;
          max-width: 100%;
          box-sizing: border-box;
        `

        // Configuración optimizada de html2canvas
        const canvas = await html2canvas(element, {
            scale: 2, // Mayor resolución para mejor calidad
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#ffffff',
            logging: false,
            width: element.scrollWidth,
            height: element.scrollHeight,
            scrollX: 0,
            scrollY: 0,
            windowWidth: element.scrollWidth,
            windowHeight: element.scrollHeight,
            foreignObjectRendering: true, // Mejor renderizado de CSS
            imageTimeout: 15000,
            ignoreElements: (element) => {
                // Ignorar elementos que no necesitamos en el PDF
                return element.classList?.contains('no-pdf') || false
            }
        })

        // Restaurar estilos originales
        element.style.cssText = originalStyle

        // Configurar PDF con unidades en mm para mejor control
        const pdf = new jsPDF({
            orientation,
            unit: 'mm',
            format: format === 'a4' ? 'a4' : 'letter'
        })

        // Dimensiones del PDF en mm
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = pdf.internal.pageSize.getHeight()

        // Calcular dimensiones de la imagen optimizadas
        const imgWidth = canvas.width
        const imgHeight = canvas.height

        // Calcular ratio manteniendo proporciones y agregando márgenes
        const maxWidth = pdfWidth - 20 // 10mm de margen a cada lado
        const maxHeight = pdfHeight - 20 // 10mm de margen arriba y abajo

        const widthRatio = maxWidth / (imgWidth * 0.75) // 0.75 convierte px a mm aprox
        const heightRatio = maxHeight / (imgHeight * 0.75)
        const ratio = Math.min(widthRatio, heightRatio, 1) // No escalar más del 100%

        const finalWidth = (imgWidth * 0.75) * ratio
        const finalHeight = (imgHeight * 0.75) * ratio

        // Centrar en la página
        const x = (pdfWidth - finalWidth) / 2
        const y = (pdfHeight - finalHeight) / 2

        // Optimizar calidad de imagen
        const imageData = canvas.toDataURL('image/jpeg', 0.85) // JPEG con 85% calidad

        pdf.addImage(imageData, 'JPEG', x, y, finalWidth, finalHeight, undefined, 'FAST')

        // Descargar el PDF
        pdf.save(filename)

    } catch (error) {
        console.error('Error al generar el PDF:', error)
        throw new Error('No se pudo generar el PDF. Por favor, intenta nuevamente.')
    }
}

export function generatePagareFilename(prestamoId: string, deudorNombre: string): string {
    // Limpiar el nombre del deudor para usar en el nombre del archivo
    const nombreLimpio = deudorNombre
        .toLowerCase()
        .replace(/[áäàâ]/g, 'a')
        .replace(/[éëèê]/g, 'e')
        .replace(/[íïìî]/g, 'i')
        .replace(/[óöòô]/g, 'o')
        .replace(/[úüùû]/g, 'u')
        .replace(/ñ/g, 'n')
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')

    const fecha = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

    return `pagare_${prestamoId}_${nombreLimpio}_${fecha}.pdf`
} 