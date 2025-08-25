console.log('=== FILE LOADED ===', { pid: process.pid, cwd: process.cwd(), argv: process.argv });

// Load environment variables from .env file
try {
  require('dotenv').config();
  console.log('✅ Environment loaded');
} catch (error) {
  console.log('⚠️  dotenv not available, using process.env directly');
}

async function initializeWorker() {
  console.log('=== WORKER START ===', { pid: process.pid, cwd: process.cwd(), argv: process.argv });

  // Simple environment loading
  process.env.TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS || 'localhost:7233';

  console.log('Environment check:');
  console.log('TEMPORAL_ADDRESS:', process.env.TEMPORAL_ADDRESS);

  try {
    console.log('Importing Temporal Worker...');
    const { Worker } = await import('@temporalio/worker');
    
    console.log('Importing activities...');
    const activities = require('./activities');
    
    console.log('Creating worker...');
    const worker = await Worker.create({
      workflowsPath: require.resolve('./workflows'),
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
initializeWorker();