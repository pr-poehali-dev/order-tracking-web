CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255),
    phone VARCHAR(50),
    telegram VARCHAR(255) NOT NULL,
    uid VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'Europe/Moscow'),
    updated_at TIMESTAMP DEFAULT (NOW() AT TIME ZONE 'Europe/Moscow')
);