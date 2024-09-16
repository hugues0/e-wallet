import { Injectable } from '@nestjs/common';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

@Injectable()
export class GeneratePdfService {
  async generateStatement(transactions: any[], wallet: any): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();

    let page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();

    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const fontSizeTitle = 20;
    const fontSizeBody = 10;
    const fontSizeHeader = 16;
    const margin = 2;

    let currentY = height - margin;

    page.drawText('Wallet Statement', {
      x: margin,
      y: currentY,
      size: fontSizeTitle,
      font: titleFont,
      color: rgb(0, 0, 0),
    });

    currentY -= fontSizeTitle + 20;
    page.drawText(
      `Wallet owner: ${wallet.user.firstName} ${wallet.user.lastName}`,
      {
        x: margin,
        y: currentY,
        size: fontSizeHeader,
        font: bodyFont,
      },
    );

    currentY -= fontSizeBody + 10;
    page.drawText(`Account Currency: ${wallet.currency}`, {
      x: margin,
      y: currentY,
      size: fontSizeBody,
      font: bodyFont,
    });

    currentY -= fontSizeBody + 10;
    page.drawText(`Current Balance: ${wallet.balance}`, {
      x: margin,
      y: currentY,
      size: fontSizeBody,
      font: bodyFont,
    });

    currentY -= fontSizeBody + 20;
    page.drawLine({
      start: { x: margin, y: currentY },
      end: { x: width - margin, y: currentY },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    currentY -= 20;

    page.drawText('Transactions:', {
      x: margin,
      y: currentY,
      size: fontSizeHeader,
      font: bodyFont,
    });

    currentY -= fontSizeHeader + 10;

    for (const transaction of transactions) {
      const transactionCreatedAt = transaction.createdAt
        .toISOString()
        .split('T');
      const transactionDate = transactionCreatedAt[0];
      const transactionTime = transactionCreatedAt[1].split('.')[0];
      const truncatedRefNo = this.truncateString(transaction.refNumber);
      page.drawText(
        `${truncatedRefNo} Date:${transactionDate}  Time:${transactionTime} Type:${transaction.type}  Amount:${transaction.amount}${wallet.currency}`,
        {
          x: margin,
          y: currentY,
          size: fontSizeBody,
          font: bodyFont,
        },
      );

      currentY -= fontSizeBody + 5;

      if (currentY < margin) {
        page = pdfDoc.addPage([600, 800]);
        currentY = height - margin;
      }
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  truncateString(str: string) {
    return str.length > 20 ? str.substring(0, 20) + 'xxxxxxxx' : str;
  }
}
