-- Add worksDirector to company_settings (shown as Direttore dei lavori / Incaricato sicurezza on quote PDFs)
ALTER TABLE company_settings ADD COLUMN worksDirector TEXT;

-- Add signatories to quotes (newline-separated names for "Firma per accettazione" block)
ALTER TABLE quotes ADD COLUMN signatories TEXT;
