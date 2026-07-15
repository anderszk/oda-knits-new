CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    image TEXT NOT NULL,
    images TEXT NOT NULL,
    yarn TEXT NOT NULL,
    fiber TEXT NOT NULL,
    technique TEXT NOT NULL,
    needles TEXT NOT NULL,
    size TEXT NOT NULL,
    time TEXT NOT NULL,
    year TEXT NOT NULL,
    colors TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS site_content (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    items TEXT NOT NULL,
    subtotal INTEGER NOT NULL,
    shipping TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    price INTEGER NOT NULL,
    description TEXT NOT NULL,
    colors TEXT NOT NULL,
    sizes TEXT NOT NULL,
    badge TEXT NOT NULL,
    stock INTEGER NOT NULL,
    image TEXT NOT NULL DEFAULT '',
    images TEXT NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
