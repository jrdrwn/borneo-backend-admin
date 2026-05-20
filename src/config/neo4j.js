const neo4j = require('neo4j-driver');

const URI = process.env.NEO4J_URI || 'bolt://127.0.0.1:7687';
const USER = process.env.NEO4J_USER || 'neo4j';
const PASSWORD = process.env.NEO4J_PASSWORD || 'password';
const DATABASE = process.env.NEO4J_DATABASE || 'neo4j';

const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));

function normalizeNeoValue(value) {
  if (value && typeof value === 'object') {
    if (typeof value.toNumber === 'function') return value.toNumber();
    if (Array.isArray(value)) return value.map(normalizeNeoValue);
    const output = {};
    for (const [key, item] of Object.entries(value)) output[key] = normalizeNeoValue(item);
    return output;
  }

  if (typeof value === 'number' && (!Number.isFinite(value) || Number.isNaN(value))) {
    return null;
  }

  return value;
}

function normalizeRecord(record) {
  const output = {};
  for (const key of record.keys) {
    output[key] = normalizeNeoValue(record.get(key));
  }
  return output;
}

async function runNeo4j(query, params = {}) {
  const session = driver.session({ database: DATABASE });
  try {
    const result = await session.run(query, params);
    return result.records.map(normalizeRecord);
  } finally {
    await session.close();
  }
}

module.exports = {
  driver,
  runNeo4j
};
