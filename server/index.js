const app = require('./app.js');
const sql = require('./db/dbConnection.js');
const initSchema = require('./db/initSchema.js');

const PORT = process.env.PORT || 5000;

app.get('/db-test', async (req, res) => {
    try {
        const result = await sql`SELECT version()`;

        res.json({
            success: true,
            version: result[0].version
        });
    }
    catch (err) {
        console.log(err);

        res.status(500).json({
            success: false,
            message: 'Database connection failed'
        });
    }
});

async function startServer() {
    try {
        await initSchema();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
    catch (err) {
        console.error('Failed to initialize database schema:', err);
        process.exit(1);
    }
}

startServer();
