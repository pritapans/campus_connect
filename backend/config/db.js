const oracledb = require('oracledb');
require('dotenv').config();

// Return plain JS objects (not array-of-arrays)
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// Enable auto-fetching of CLOBs as strings
oracledb.fetchAsString = [oracledb.CLOB];

let pool = null;

/**
 * Initialise (or return existing) connection pool.
 */
async function getPool() {
  if (pool) return pool;
  pool = await oracledb.createPool({
    user:          process.env.DB_USER,
    password:      process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT_STRING,
    poolMin:       2,
    poolMax:       10,
    poolIncrement: 1,
    poolTimeout:   60
  });
  console.log('✅ Oracle DB connection pool created');
  return pool;
}

/**
 * Execute a SQL statement.
 *
 * @param {string}  sql     - SQL with :1, :2 ... bind variables
 * @param {Array}   params  - Bind values (default [])
 * @param {object}  opts    - Extra oracledb execute options
 * @returns {[rows, result]}
 *   rows   = result.rows for SELECT, [] for DML
 *   result = full oracledb result object
 */
async function query(sql, params = [], opts = {}) {
  const p    = await getPool();
  const conn = await p.getConnection();
  try {
    const result = await conn.execute(sql, params, {
      autoCommit: true,
      ...opts
    });
    // Normalise column names to lowercase for consistency
    const rows = (result.rows || []).map(row => {
      const lower = {};
      for (const key of Object.keys(row)) {
        lower[key.toLowerCase()] = row[key];
      }
      return lower;
    });
    return [rows, result];
  } finally {
    await conn.close();
  }
}

/**
 * Gracefully close the pool (call on app shutdown).
 */
async function closePool() {
  if (pool) {
    await pool.close(10);
    pool = null;
    console.log('Oracle DB pool closed');
  }
}

// Initialise pool on startup
getPool().catch(err => {
  console.error('❌ Failed to create Oracle DB pool:', err.message);
  process.exit(1);
});

module.exports = { query, closePool };
