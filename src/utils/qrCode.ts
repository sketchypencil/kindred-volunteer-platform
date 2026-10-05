import QRCode from 'qrcode';

export async function generateQrDataUrl(token: string): Promise<string> {
  try {
    const url = await QRCode.toDataURL(token, {
      width: 280,
      margin: 2,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return url;
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}
