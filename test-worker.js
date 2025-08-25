console.log('=== TEST START ===');

// Test basic imports
console.log('Testing basic imports...');

async function testImports() {
  try {
    console.log('1. Testing dotenv...');
    require('dotenv').config();
    console.log('✅ dotenv loaded');

    console.log('2. Testing config import...');
    const { config } = await import('./src/lib/config.js');
    console.log('✅ config loaded:', Object.keys(config));

    console.log('3. Testing activities import...');
    const activities = await import('./src/temporal/activities.js');
    console.log('✅ activities loaded:', Object.keys(activities));

    console.log('4. Testing workflows import...');
    const workflows = await import('./src/temporal/workflows.js');
    console.log('✅ workflows loaded:', Object.keys(workflows));

    console.log('5. Testing Temporal Worker import...');
    const { Worker } = await import('@temporalio/worker');
    console.log('✅ Temporal Worker loaded');

    console.log('All imports successful!');
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testImports();
