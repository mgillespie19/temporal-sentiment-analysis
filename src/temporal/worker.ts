console.log('=== WORKER START ===');

// Load environment variables from .env file
try {
  require('dotenv').config();
  console.log('✅ Environment loaded');
} catch (error) {
  console.log('⚠️  dotenv not available, using process.env directly');
}

// Simple environment loading
process.env.TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS || 'localhost:7233';

console.log('Environment check:');
console.log('TEMPORAL_ADDRESS:', process.env.TEMPORAL_ADDRESS);

async function run() {
  try {
    console.log('Importing Temporal Worker...');
    const { Worker } = await import('@temporalio/worker');
    
    console.log('Importing activities...');
    const activities = await import('./activities');
    
    console.log('Creating worker...');
    const worker = await Worker.create({
      workflowsPath: require.resolve('./workflows.ts'),
      activities,
      taskQueue: 'sentiment-analysis',
    });

    console.log('✅ Worker created successfully');
    console.log('🔄 Starting worker...');
    
    await worker.run();
    
  } catch (error) {
    console.error('❌ Worker error:', error);
    process.exit(1);
  }
}

console.log('Starting worker...');

run();