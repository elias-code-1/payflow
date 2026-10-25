declare module "qrcode" {
  export interface QROptions {
    width?: number;
    margin?: number;
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    type?: "svg";
  }

  export interface QRCodeApi {
    toDataURL(text: string, options?: QROptions): Promise<string>;
    toString(text: string, options?: QROptions): Promise<string>;
  }

  const QRCode: QRCodeApi;
  export default QRCode;
}
