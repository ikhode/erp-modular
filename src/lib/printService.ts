import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: {
      startY?: number;
      margin?: { left?: number; right?: number };
      styles?: {
        fontSize?: number;
        cellPadding?: number;
      };
      columnStyles?: Record<string, {
        cellWidth?: number;
        halign?: 'left' | 'center' | 'right';
      }>;
      head?: string[][];
      body?: (string | number)[][];
    }) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
  }
}

export interface TicketData {
  type: 'sale' | 'purchase' | 'production';
  folio: string;
  date: string;
  items: Array<{
    description: string;
    quantity: number;
    unit: string;
    price?: number;
    total?: number;
  }>;
  subtotal?: number;
  tax?: number;
  total: number;
  customer?: string;
  provider?: string;
  employee?: string;
  notes?: string;
}

export class PrintService {
  private static instance: PrintService;

  static getInstance(): PrintService {
    if (!PrintService.instance) {
      PrintService.instance = new PrintService();
    }
    return PrintService.instance;
  }

  /**
   * Genera un ticket de 58mm para impresión térmica
   */
  generateThermalTicket(data: TicketData): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [58, 210] // 58mm width, auto height
    });

    const pageWidth = 58;
    const margin = 2;
    let yPosition = 5;

    // Header
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('PYME ERP', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 4;

    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestión Empresarial', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 4;

    // Separator line
    doc.setLineWidth(0.1);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 3;

    // Ticket type and folio
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    const typeLabel = data.type === 'sale' ? 'VENTA' : data.type === 'purchase' ? 'COMPRA' : 'PRODUCCIÓN';
    doc.text(`${typeLabel} - ${data.folio}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 3;

    // Date
    doc.setFontSize(5);
    doc.setFont('helvetica', 'normal');
    doc.text(data.date, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 4;

    // Customer/Provider/Employee info
    if (data.customer) {
      doc.setFontSize(6);
      doc.text(`Cliente: ${data.customer}`, margin, yPosition);
      yPosition += 3;
    }
    if (data.provider) {
      doc.setFontSize(6);
      doc.text(`Proveedor: ${data.provider}`, margin, yPosition);
      yPosition += 3;
    }
    if (data.employee) {
      doc.setFontSize(6);
      doc.text(`Empleado: ${data.employee}`, margin, yPosition);
      yPosition += 3;
    }

    // Separator
    doc.setLineWidth(0.1);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 2;

    // Items table
    const tableColumns = ['Desc', 'Cant', 'Total'];
    const tableRows = data.items.map(item => [
      item.description.substring(0, 15), // Limit description length
      `${item.quantity} ${item.unit}`,
      item.total ? `$${item.total.toFixed(2)}` : ''
    ]);

    doc.autoTable({
      startY: yPosition,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 5,
        cellPadding: 1,
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 15 },
        2: { cellWidth: 16, halign: 'right' },
      },
      head: [tableColumns],
      body: tableRows,
    });

    yPosition = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 2 : yPosition + 10;

    // Totals
    if (data.subtotal !== undefined) {
      doc.setFontSize(5);
      doc.text(`Subtotal: $${data.subtotal.toFixed(2)}`, pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 2;
    }

    if (data.tax !== undefined && data.tax > 0) {
      doc.text(`IVA: $${data.tax.toFixed(2)}`, pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 2;
    }

    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: $${data.total.toFixed(2)}`, pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 4;

    // Notes
    if (data.notes) {
      doc.setFontSize(4);
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(data.notes, pageWidth - 2 * margin);
      doc.text(splitNotes, margin, yPosition);
      yPosition += splitNotes.length * 2;
    }

    // Footer
    doc.setLineWidth(0.1);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 2;

    doc.setFontSize(4);
    doc.text('Gracias por su preferencia', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 2;
    doc.text('PyME ERP - Sistema Empresarial', pageWidth / 2, yPosition, { align: 'center' });

    return doc;
  }

  /**
   * Genera un recibo en formato carta (A4)
   */
  generateLetterReceipt(data: TicketData): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    let yPosition = 30;

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PYME ERP', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Sistema de Gestión Empresarial', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    doc.setFontSize(10);
    doc.text('Dirección: Calle Principal #123, Ciudad, País', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    doc.text('Teléfono: (555) 123-4567 | Email: info@pyme-erp.com', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Separator line
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Receipt type and folio
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const typeLabel = data.type === 'sale' ? 'RECIBO DE VENTA' : data.type === 'purchase' ? 'RECIBO DE COMPRA' : 'RECIBO DE PRODUCCIÓN';
    doc.text(typeLabel, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Folio: ${data.folio}`, margin, yPosition);
    doc.text(`Fecha: ${data.date}`, pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 10;

    // Customer/Provider/Employee info
    if (data.customer) {
      doc.text(`Cliente: ${data.customer}`, margin, yPosition);
      yPosition += 6;
    }
    if (data.provider) {
      doc.text(`Proveedor: ${data.provider}`, margin, yPosition);
      yPosition += 6;
    }
    if (data.employee) {
      doc.text(`Empleado: ${data.employee}`, margin, yPosition);
      yPosition += 6;
    }
    yPosition += 5;

    // Items table
    const tableColumns = ['Descripción', 'Cantidad', 'Precio Unit.', 'Total'];
    const tableRows = data.items.map(item => [
      item.description,
      `${item.quantity} ${item.unit}`,
      item.price ? `$${item.price.toFixed(2)}` : '',
      item.total ? `$${item.total.toFixed(2)}` : ''
    ]);

    doc.autoTable({
      startY: yPosition,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 30 },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
      },
      head: [tableColumns],
      body: tableRows,
    });

    yPosition = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 10 : yPosition + 10;

    // Totals section
    const totalsX = pageWidth - margin - 60;

    if (data.subtotal !== undefined) {
      doc.setFontSize(10);
      doc.text('Subtotal:', totalsX, yPosition);
      doc.text(`$${data.subtotal.toFixed(2)}`, pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 6;
    }

    if (data.tax !== undefined && data.tax > 0) {
      doc.text('IVA:', totalsX, yPosition);
      doc.text(`$${data.tax.toFixed(2)}`, pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 6;
    }

    // Total with background
    doc.setFillColor(240, 240, 240);
    doc.rect(totalsX - 5, yPosition - 3, 65, 8, 'F');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', totalsX, yPosition + 2);
    doc.text(`$${data.total.toFixed(2)}`, pageWidth - margin, yPosition + 2, { align: 'right' });
    yPosition += 15;

    // Notes
    if (data.notes) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Notas:', margin, yPosition);
      yPosition += 5;

      const splitNotes = doc.splitTextToSize(data.notes, pageWidth - 2 * margin);
      doc.text(splitNotes, margin, yPosition);
      yPosition += splitNotes.length * 4 + 5;
    }

    // Footer
    const footerY = pageHeight - 30;
    doc.setLineWidth(0.3);
    doc.line(margin, footerY, pageWidth - margin, footerY);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Este documento es un comprobante oficial de PyME ERP', pageWidth / 2, footerY + 8, { align: 'center' });
    doc.text('Para cualquier aclaración, favor de contactar a administración', pageWidth / 2, footerY + 12, { align: 'center' });

    return doc;
  }

  /**
   * Descarga el PDF generado
   */
  downloadPDF(doc: jsPDF, filename: string): void {
    doc.save(filename);
  }

  /**
   * Imprime el PDF directamente (si el navegador lo soporta)
   */
  printPDF(doc: jsPDF): void {
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  }

  /**
   * Sube el PDF a Supabase Storage
   */
  async uploadToStorage(_doc: jsPDF, filename: string): Promise<string> {
    // Aquí iría la lógica para subir a Supabase Storage
    // Por ahora retornamos el filename como placeholder
    return filename;
  }
}

// Export singleton instance
export const printService = PrintService.getInstance();
