-- Add static payment QR image URL to company settings (printed on invoice PDFs)
ALTER TABLE "company_settings" ADD COLUMN "paymentQrUrl" TEXT;
