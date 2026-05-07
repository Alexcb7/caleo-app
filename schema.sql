-- =============================================================
-- Caleo - Schema de base de datos
-- PostgreSQL
-- =============================================================

-- Secuencias
CREATE SEQUENCE IF NOT EXISTS categories_id_seq;
CREATE SEQUENCE IF NOT EXISTS llm_conversations_id_seq;
CREATE SEQUENCE IF NOT EXISTS price_history_id_seq;
CREATE SEQUENCE IF NOT EXISTS product_mappings_id_seq;
CREATE SEQUENCE IF NOT EXISTS products_id_seq;
CREATE SEQUENCE IF NOT EXISTS purchase_items_id_seq;
CREATE SEQUENCE IF NOT EXISTS purchases_id_seq;
CREATE SEQUENCE IF NOT EXISTS shopping_list_items_id_seq;
CREATE SEQUENCE IF NOT EXISTS shopping_lists_id_seq;
CREATE SEQUENCE IF NOT EXISTS supermarket_products_id_seq;
CREATE SEQUENCE IF NOT EXISTS supermarkets_id_seq;
CREATE SEQUENCE IF NOT EXISTS user_budgets_id_seq;
CREATE SEQUENCE IF NOT EXISTS users_id_seq;

-- -------------------------------------------------------------
-- Tabla: users
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            INTEGER      NOT NULL DEFAULT nextval('users_id_seq') PRIMARY KEY,
    email         VARCHAR(200) NOT NULL UNIQUE,
    password_hash TEXT         NOT NULL,
    name          VARCHAR(100),
    created_at    TIMESTAMP    DEFAULT now()
);

-- -------------------------------------------------------------
-- Tabla: categories
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id        INTEGER      NOT NULL DEFAULT nextval('categories_id_seq') PRIMARY KEY,
    name      VARCHAR(100) NOT NULL,
    parent_id INTEGER      REFERENCES categories(id),
    slug      VARCHAR(100)
);

-- -------------------------------------------------------------
-- Tabla: supermarkets
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS supermarkets (
    id       INTEGER      NOT NULL DEFAULT nextval('supermarkets_id_seq') PRIMARY KEY,
    name     VARCHAR(100) NOT NULL,
    slug     VARCHAR(50),
    base_url TEXT,
    logo_url TEXT,
    active   BOOLEAN      DEFAULT true
);

-- -------------------------------------------------------------
-- Tabla: products
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id          INTEGER      NOT NULL DEFAULT nextval('products_id_seq') PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INTEGER      REFERENCES categories(id),
    brand       VARCHAR(100),
    unit_type   VARCHAR(20),
    image_url   TEXT,
    created_at  TIMESTAMP    DEFAULT now()
);

-- -------------------------------------------------------------
-- Tabla: supermarket_products
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS supermarket_products (
    id              INTEGER      NOT NULL DEFAULT nextval('supermarket_products_id_seq') PRIMARY KEY,
    product_id      INTEGER      REFERENCES products(id),
    supermarket_id  INTEGER      REFERENCES supermarkets(id),
    external_id     VARCHAR(100),
    name_original   VARCHAR(200),
    price           NUMERIC      NOT NULL,
    original_price  NUMERIC,
    is_offer        BOOLEAN      DEFAULT false,
    price_per_unit  NUMERIC,
    in_stock        BOOLEAN      DEFAULT true,
    raw_data        JSONB,
    last_scraped_at TIMESTAMP
);

-- -------------------------------------------------------------
-- Tabla: price_history
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS price_history (
    id                     INTEGER  NOT NULL DEFAULT nextval('price_history_id_seq') PRIMARY KEY,
    supermarket_product_id INTEGER  REFERENCES supermarket_products(id),
    price                  NUMERIC,
    is_offer               BOOLEAN  DEFAULT false,
    scraped_at             TIMESTAMP DEFAULT now()
);

-- -------------------------------------------------------------
-- Tabla: product_mappings
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_mappings (
    id             INTEGER     NOT NULL DEFAULT nextval('product_mappings_id_seq') PRIMARY KEY,
    raw_name       TEXT        NOT NULL,
    product_id     INTEGER     REFERENCES products(id),
    supermarket_id INTEGER     REFERENCES supermarkets(id),
    confidence     NUMERIC,
    mapped_by      VARCHAR(20),
    llm_metadata   JSONB,
    created_at     TIMESTAMP   DEFAULT now()
);

-- -------------------------------------------------------------
-- Tabla: shopping_lists
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shopping_lists (
    id          INTEGER      NOT NULL DEFAULT nextval('shopping_lists_id_seq') PRIMARY KEY,
    user_id     INTEGER      REFERENCES users(id),
    name        VARCHAR(200) NOT NULL,
    description TEXT,
    image_url   TEXT,
    created_at  TIMESTAMP    DEFAULT now(),
    updated_at  TIMESTAMP    DEFAULT now()
);

-- -------------------------------------------------------------
-- Tabla: shopping_list_items
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shopping_list_items (
    id             INTEGER  NOT NULL DEFAULT nextval('shopping_list_items_id_seq') PRIMARY KEY,
    list_id        INTEGER  REFERENCES shopping_lists(id),
    product_id     INTEGER  REFERENCES products(id),
    supermarket_id INTEGER  REFERENCES supermarkets(id),
    price          NUMERIC,
    quantity       NUMERIC  DEFAULT 1,
    unit           VARCHAR(20)
);

-- -------------------------------------------------------------
-- Tabla: purchases
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchases (
    id                    INTEGER      NOT NULL DEFAULT nextval('purchases_id_seq') PRIMARY KEY,
    user_id               INTEGER      REFERENCES users(id),
    title                 VARCHAR(200),
    total_price           NUMERIC,
    budget_limit          NUMERIC,
    ignore_budget         BOOLEAN      DEFAULT false,
    is_completed          BOOLEAN      DEFAULT false,
    supermarkets_selected JSONB,
    created_at            TIMESTAMP    DEFAULT now()
);

-- -------------------------------------------------------------
-- Tabla: purchase_items
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchase_items (
    id             INTEGER  NOT NULL DEFAULT nextval('purchase_items_id_seq') PRIMARY KEY,
    purchase_id    INTEGER  REFERENCES purchases(id),
    product_id     INTEGER  REFERENCES products(id),
    supermarket_id INTEGER  REFERENCES supermarkets(id),
    price          NUMERIC,
    is_offer       BOOLEAN  DEFAULT false,
    quantity       NUMERIC  DEFAULT 1
);

-- -------------------------------------------------------------
-- Tabla: user_budgets
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_budgets (
    id         INTEGER     NOT NULL DEFAULT nextval('user_budgets_id_seq') PRIMARY KEY,
    user_id    INTEGER     REFERENCES users(id),
    period     VARCHAR(20) NOT NULL,
    amount     NUMERIC     NOT NULL,
    created_at TIMESTAMP   DEFAULT now()
);

-- -------------------------------------------------------------
-- Tabla: llm_conversations
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS llm_conversations (
    id          INTEGER     NOT NULL DEFAULT nextval('llm_conversations_id_seq') PRIMARY KEY,
    user_id     INTEGER     REFERENCES users(id),
    list_id     INTEGER     REFERENCES shopping_lists(id),
    purchase_id INTEGER     REFERENCES purchases(id),
    messages    JSONB       NOT NULL DEFAULT '[]',
    model_used  VARCHAR(50),
    created_at  TIMESTAMP   DEFAULT now(),
    updated_at  TIMESTAMP   DEFAULT now()
);

-- -------------------------------------------------------------
-- Datos iniciales: supermarkets
-- -------------------------------------------------------------
INSERT INTO supermarkets (name, slug, base_url, active) VALUES
    ('Mercadona', 'mercadona', 'https://www.mercadona.es', true),
    ('DIA',       'dia',       'https://www.dia.es',       true)
ON CONFLICT DO NOTHING;