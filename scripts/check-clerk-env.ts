import { config } from 'dotenv';
import { clerkClient } from '@clerk/clerk-sdk-node';

config();

async function checkEnvironment() {
  console.log('Checking Clerk environment...\n');
  console.log('Secret Key:', process.env.CLERK_SECRET_KEY?.substring(0, 20) + '...');
  console.log('Key type:', process.env.CLERK_SECRET_KEY?.startsWith('sk_test_') ? 'TEST MODE ✅' : 'LIVE MODE ⚠️');

  try {
    const users = await clerkClient.users.getUserList({ limit: 10 });
    console.log(`\nConnected successfully! Found ${users.length} users.`);

    console.log('\nFirst few users:');
    users.slice(0, 3).forEach(user => {
      const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;
      console.log(`  - ${user.id} | ${email || 'No email'}`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

checkEnvironment();
