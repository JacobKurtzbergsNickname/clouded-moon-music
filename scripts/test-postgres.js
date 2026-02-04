
require('dotenv').config();
const { Client } = require('pg');

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    type: 'version',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
    user: process.env.POSTGRES_USER || 'admin',
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB || 'clouded_moon_music',
    verbose: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--type':
      case '-t':
        parsed.type = next;
        i++;
        break;
      case '--host':
      case '-h':
        parsed.host = next;
        i++;
        break;
      case '--port':
      case '-p':
        parsed.port = parseInt(next, 10);
        i++;
        break;
      case '--user':
      case '-u':
        parsed.user = next;
        i++;
        break;
      case '--password':
      case '-P':
        parsed.password = next;
        i++;
        break;
      case '--database':
      case '-d':
        parsed.database = next;
        i++;
        break;
      case '--verbose':
      case '-v':
        parsed.verbose = true;
        break;
      case '--help':
        parsed.help = true;
        break;
      default:
        if (arg.startsWith('-')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }

  return parsed;
}

// Display help
function showHelp() {
  console.log(`
PostgreSQL Connection Test Tool

Usage: node scripts/test-postgres.js [options]

Options:
  --type, -t <type>      Test type: basic, ipv4, version (default: version)
  --host, -h <host>      Database host (default: from .env or localhost)
  --port, -p <port>      Database port (default: from .env or 5432)
  --user, -u <user>      Database user (default: from .env or admin)
  --password, -P <pass>  Database password (default: from .env)
  --database, -d <db>    Database name (default: from .env or clouded_moon_music)
  --verbose, -v          Show detailed connection info
  --help                 Show this help message

Test Types:
  basic    - Simple connection test only
  ipv4     - Connection test using explicit IPv4 (127.0.0.1)
  version  - Full test with version query (default)

Examples:
  node scripts/test-postgres.js
  node scripts/test-postgres.js --type basic --verbose
  node scripts/test-postgres.js --type ipv4 --port 5433
  node scripts/test-postgres.js --password mypassword
`);
}

// Create client with config
function createClient(config) {
  // Force IPv4 for ipv4 test type
  if (config.type === 'ipv4') {
    config.host = '127.0.0.1';
  }

  return new Client({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
  });
}

// Run basic connection test
async function testBasic(client, config) {
  if (config.verbose) {
    console.log('Test: Basic connection only');
  }
  console.log(' Connected successfully!');
}

// Run IPv4-specific connection test
async function testIpv4(client, config) {
  if (config.verbose) {
    console.log('Test: IPv4 explicit connection (127.0.0.1)');
  }
  console.log(' Connected successfully via IPv4!');
}

// Run full version test
async function testVersion(client, config) {
  if (config.verbose) {
    console.log('Test: Full connection with version query');
  }
  
  const result = await client.query('SELECT version()');
  console.log(' Connected successfully!');
  console.log('PostgreSQL version:', result.rows[0].version);
}

// Main execution
async function main() {
  const config = parseArgs();

  if (config.help) {
    showHelp();
    process.exit(0);
  }

  // Validate test type
  const validTypes = ['basic', 'ipv4', 'version'];
  if (!validTypes.includes(config.type)) {
    console.error(` Invalid test type: ${config.type}`);
    console.error(`Valid types: ${validTypes.join(', ')}`);
    process.exit(1);
  }

  // Validate password
  if (!config.password) {
    console.error(' No password provided. Set POSTGRES_PASSWORD in .env or use --password flag.');
    process.exit(1);
  }

  const client = createClient(config);

  if (config.verbose) {
    console.log('Connection config:', {
      host: client.host,
      port: client.port,
      user: client.user,
      password: '***' + config.password.slice(-4),
      database: client.database,
    });
    console.log();
  }

  try {
    console.log(`Testing PostgreSQL connection (${config.type})...`);
    
    await client.connect();
    
    // Run appropriate test
    switch (config.type) {
      case 'basic':
        await testBasic(client, config);
        break;
      case 'ipv4':
        await testIpv4(client, config);
        break;
      case 'version':
        await testVersion(client, config);
        break;
    }

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error(' Connection failed:', err.message);
    if (config.verbose) {
      console.error(err);
    }
    process.exit(1);
  }
}

main();
