const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

module.exports = sql;
