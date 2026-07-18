ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference TEXT NOT NULL DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_payment_reference
    ON orders(payment_reference) WHERE payment_reference != '';
