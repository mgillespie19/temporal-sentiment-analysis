import { Connection, Client } from '@temporalio/client';
import { config } from '../lib/config';

export async function createTemporalClient(): Promise<Client> {
  const connection = await Connection.connect({ 
    address: config.TEMPORAL_ADDRESS 
  });

  const client = new Client({
    connection,
  });
  
  return client;
}