ALTER TABLE products ADD COLUMN IF NOT EXISTS image TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT NOT NULL DEFAULT '[]';

UPDATE products SET images = jsonb_build_array(image)::text
    WHERE image != '' AND images = '[]';
