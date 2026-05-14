const sql = require('./dbConnection.js');

async function initSchema() {
    await sql`
        CREATE TABLE IF NOT EXISTS users (
            id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash TEXT,
            google_id VARCHAR(255) UNIQUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS packs (
            id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS tasks (
            id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            date DATE NOT NULL,
            name VARCHAR(255) NOT NULL,
            weight NUMERIC(8, 2) NOT NULL,
            pack_id BIGINT REFERENCES packs(id) ON DELETE SET NULL
        )
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS task_sessions (
            id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            start_time TIMESTAMPTZ NOT NULL,
            end_time TIMESTAMPTZ,
            duration_seconds INTEGER
        )
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS daily_scores (
            id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            date DATE NOT NULL,
            total_points NUMERIC(10, 2) NOT NULL DEFAULT 0,
            total_seconds INTEGER NOT NULL DEFAULT 0,
            UNIQUE (user_id, date)
        )
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS pack_tasks (
            id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            pack_id BIGINT NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            weight NUMERIC(8, 2) NOT NULL
        )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_tasks_user_id_date ON tasks(user_id, date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tasks_pack_id ON tasks(pack_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_task_sessions_task_id ON task_sessions(task_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_packs_user_id ON packs(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pack_tasks_pack_id ON pack_tasks(pack_id)`;

    await sql`ALTER TABLE tasks ALTER COLUMN weight TYPE NUMERIC(8, 2) USING weight::numeric`;
    await sql`ALTER TABLE pack_tasks ALTER COLUMN weight TYPE NUMERIC(8, 2) USING weight::numeric`;
    await sql`ALTER TABLE daily_scores ALTER COLUMN total_points TYPE NUMERIC(10, 2) USING total_points::numeric`;
}

module.exports = initSchema;
