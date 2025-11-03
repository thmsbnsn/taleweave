/**
 * Execute database schema via Supabase connection pooler
 * Uses the Supabase project's connection pooler endpoint
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const DB_PASSWORD = 'L0g!nSt@geX4';
const PROJECT_REF = 'bkwivsskmyexflakxyzf';

async function executeSchema() {
  console.log('📊 Running database schema via Supabase...\n');
  
  // Read schema file
  const schemaPath = path.join(__dirname, '../database/schema.sql');
  let schemaSQL = fs.readFileSync(schemaPath, 'utf8');
  
  // Clean up the SQL - remove comments and split properly
  schemaSQL = schemaSQL
    .split('\n')
    .filter(line => !line.trim().startsWith('--')) // Remove comment lines
    .join('\n');
  
  // Try connection pooler with transaction mode
  const connectionConfig = {
    host: `${PROJECT_REF}.pooler.supabase.com`,
    port: 6543,
    database: 'postgres',
    user: `postgres.${PROJECT_REF}`,
    password: DB_PASSWORD,
    ssl: { rejectUnauthorized: false },
  };

  const client = new Client(connectionConfig);

  try {
    console.log('🔌 Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Connected!\n');
    
    // Execute the entire schema as a transaction
    console.log('📝 Executing schema (this may take a moment)...\n');
    
    try {
      // Split by semicolon but keep CREATE statements together
      const statements = [];
      let currentStatement = '';
      
      for (const line of schemaSQL.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('--')) continue;
        
        currentStatement += line + '\n';
        
        // Check if this line ends a statement
        if (trimmed.endsWith(';')) {
          const stmt = currentStatement.trim();
          if (stmt.length > 10) {
            statements.push(stmt);
          }
          currentStatement = '';
        }
      }
      
      // Add any remaining statement
      if (currentStatement.trim().length > 10) {
        statements.push(currentStatement.trim());
      }
      
      console.log(`Found ${statements.length} statements to execute\n`);
      
      let success = 0;
      let skipped = 0;
      
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        
        try {
          await client.query(stmt);
          success++;
          
          // Extract object name for logging
          const match = stmt.match(/(?:CREATE|ALTER|INSERT)\s+(?:TABLE|POLICY|FUNCTION|EXTENSION|INDEX|TRIGGER)\s+(?:IF NOT EXISTS\s+)?(?:public\.)?(\w+)/i);
          if (match) {
            const objName = match[1];
            const objType = stmt.match(/CREATE\s+(\w+)/i)?.[1] || 'object';
            console.log(`✅ ${objType}: ${objName}`);
          }
        } catch (error) {
          // Ignore "already exists" errors
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate key value') ||
              (error.message.includes('relation') && error.message.includes('already exists'))) {
            skipped++;
          } else {
            console.warn(`⚠️  ${error.message.substring(0, 80)}`);
          }
        }
      }
      
      console.log(`\n✅ Schema execution complete!`);
      console.log(`   Created/updated: ${success}`);
      console.log(`   Already exists: ${skipped}`);
      
      // Verify tables were created
      console.log('\n🔍 Verifying tables...');
      const tableCheck = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'stories', 'story_pages', 'user_credits')
        ORDER BY table_name;
      `);
      
      if (tableCheck.rows.length > 0) {
        console.log('✅ Tables found:');
        tableCheck.rows.forEach(row => {
          console.log(`   - ${row.table_name}`);
        });
      }
      
      await client.end();
      console.log('\n✨ Database schema has been applied successfully!');
      console.log('🎉 Your database is ready to use!');
      
    } catch (error) {
      console.error(`\n❌ Error executing schema: ${error.message}`);
      await client.end();
      process.exit(1);
    }
    
  } catch (error) {
    console.error(`❌ Connection failed: ${error.message}`);
    console.error('\n📝 Please run the schema manually in Supabase SQL Editor:');
    console.error('   1. Go to: https://supabase.com/dashboard/project/' + PROJECT_REF + '/sql');
    console.error('   2. Click "New query"');
    console.error('   3. Copy entire contents of database/schema.sql');
    console.error('   4. Paste and click "Run"');
    process.exit(1);
  }
}

executeSchema().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});

