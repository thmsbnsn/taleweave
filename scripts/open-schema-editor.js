/**
 * Helper script to open Supabase SQL Editor with schema ready to run
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PROJECT_REF = 'bkwivsskmyexflakxyzf';
const SQL_EDITOR_URL = `https://supabase.com/dashboard/project/${PROJECT_REF}/sql`;
const SCHEMA_PATH = path.join(__dirname, '../database/schema.sql');

console.log('📊 Database Schema Runner\n');
console.log('Supabase requires running SQL manually for security reasons.\n');
console.log('📋 Instructions:\n');
console.log('1. Open this URL in your browser:');
console.log(`   ${SQL_EDITOR_URL}\n`);
console.log('2. Click "New query" button\n');
console.log('3. Copy the entire contents of: database/schema.sql\n');
console.log('4. Paste into the SQL editor\n');
console.log('5. Click "Run" button (or press Ctrl+Enter)\n');
console.log('6. Wait for "Success" message\n');

// Try to open the URL in default browser
console.log('🌐 Attempting to open SQL Editor in your browser...\n');

const platform = process.platform;
let command;

if (platform === 'win32') {
  command = `start "" "${SQL_EDITOR_URL}"`;
} else if (platform === 'darwin') {
  command = `open "${SQL_EDITOR_URL}"`;
} else {
  command = `xdg-open "${SQL_EDITOR_URL}"`;
}

exec(command, (error) => {
  if (error) {
    console.log('   (Could not auto-open browser)\n');
  } else {
    console.log('✅ Browser opened!\n');
  }
  
  // Display the SQL for easy copying
  console.log('📄 Schema SQL (ready to copy):');
  console.log('═'.repeat(60));
  console.log('\n');
  
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  console.log(schema);
  
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('\n✨ Copy the SQL above and paste it into the Supabase SQL Editor!');
});

