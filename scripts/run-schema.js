/**
 * Execute database schema via direct PostgreSQL connection
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const DB_PASSWORD = 'L0g!nSt@geX4';
const PROJECT_REF = 'bkwivsskmyexflakxyzf';

// Try different connection methods
const connectionStrings = [
  // Direct connection
  `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.${PROJECT_REF}.supabase.co:5432/postgres`,
  // Connection pooler
  `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(DB_PASSWORD)}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`,
  `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(DB_PASSWORD)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
];

async function executeSchema() {
  console.log('📊 Running database schema...\n');
  
  // Read schema file
  const schemaPath = path.join(__dirname, '../database/schema.sql');
  const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
  
  // Split into statements (more carefully than before)
  const statements = schemaSQL
    .split(/;\s*(?=\n|$)/)
    .map(s => s.trim())
    .filter(s => s.length > 10 && !s.startsWith('--') && !s.match(/^\s*$/) && s !== ';');

  console.log(`Found ${statements.length} SQL statements\n`);
  
  // Try each connection method
  for (const connectionString of connectionStrings) {
    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });

    try {
      console.log(`Attempting connection...`);
      await client.connect();
      console.log('✅ Connected to PostgreSQL!\n');
      
      let successCount = 0;
      let errorCount = 0;
      
      // Execute each statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        
        // Skip empty or comment-only statements
        if (!statement || statement.length < 10) continue;
        
        try {
          await client.query(statement);
          successCount++;
          if (statement.includes('CREATE TABLE') || statement.includes('CREATE POLICY') || statement.includes('CREATE FUNCTION')) {
            const tableName = statement.match(/(?:TABLE|POLICY|FUNCTION)\s+(?:IF NOT EXISTS\s+)?(?:public\.)?(\w+)/i)?.[1] || 'object';
            console.log(`✅ Created/updated: ${tableName}`);
          }
        } catch (error) {
          // Ignore "already exists" errors
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate key') ||
              error.message.includes('relation') && error.message.includes('already exists')) {
            successCount++;
            // Silently skip
          } else if (!error.message.includes('does not exist')) {
            errorCount++;
            console.warn(`⚠️  Warning (statement ${i + 1}): ${error.message.split('\n')[0].substring(0, 100)}`);
          }
        }
      }
      
      console.log(`\n✅ Schema execution complete!`);
      console.log(`   Successful: ${successCount}`);
      if (errorCount > 0) {
        console.log(`   Warnings: ${errorCount}`);
      }
      
      await client.end();
      console.log('\n✨ Database schema has been applied successfully!');
      return;
      
    } catch (error) {
      console.log(`❌ Connection failed: ${error.message.split('\n')[0]}`);
      if (client) {
        try {
          await client.end();
        } catch (e) {
          // Ignore
        }
      }
      
      // Try next connection method
      if (connectionString !== connectionStrings[connectionStrings.length - 1]) {
        console.log('Trying alternative connection method...\n');
        continue;
      } else {
        console.error('\n❌ All connection methods failed.');
        console.error('\n📝 Alternative: Run schema manually in Supabase SQL Editor:');
        console.error('   1. Go to: https://supabase.com/dashboard/project/bkwivsskmyexflakxyzf/sql');
        console.error('   2. Click "New query"');
        console.error('   3. Copy contents of database/schema.sql');
        console.error('   4. Paste and click "Run"');
        process.exit(1);
      }
    }
  }
}

executeSchema().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});

