/**
 * Password Hash Generator for Pinnacle Realty Admin
 * 
 * This script generates a secure password hash using PBKDF2 (Web Crypto API)
 * Run this in Node.js or Deno to generate a hash for your admin password.
 * 
 * Usage (Node.js):
 *   node utils/generatePasswordHash.js YourPasswordHere
 * 
 * Usage (Deno):
 *   deno run utils/generatePasswordHash.js YourPasswordHere
 */

async function generatePasswordHash(password) {
  // Generate a random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Convert password to bytes
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);
  
  // Import the password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBytes,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  // Derive the hash using PBKDF2
  const hashBytes = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  // Convert to hex strings
  const saltHex = Array.from(salt)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  const hashHex = Array.from(new Uint8Array(hashBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Return in format: salt:hash
  return `${saltHex}:${hashHex}`;
}

// Main execution
const password = process.argv[2] || Deno?.args?.[0];

if (!password) {
  console.error('\n❌ Error: Please provide a password\n');
  console.log('Usage:');
  console.log('  Node.js: node utils/generatePasswordHash.js YourPasswordHere');
  console.log('  Deno:    deno run utils/generatePasswordHash.js YourPasswordHere\n');
  process.exit?.(1) || Deno?.exit?.(1);
}

generatePasswordHash(password)
  .then(hash => {
    console.log('\n✅ Password hash generated successfully!\n');
    console.log('Copy this hash and set it as your ADMIN_PASSWORD_HASH environment variable:\n');
    console.log('─'.repeat(80));
    console.log(hash);
    console.log('─'.repeat(80));
    console.log('\nSteps:');
    console.log('1. Copy the hash above (the entire line)');
    console.log('2. In Supabase, go to Project Settings > Edge Functions > Secrets');
    console.log('3. Set ADMIN_PASSWORD_HASH to the copied value');
    console.log('4. Login with your username and the ORIGINAL password (not the hash)\n');
  })
  .catch(error => {
    console.error('Error generating hash:', error);
    process.exit?.(1) || Deno?.exit?.(1);
  });
