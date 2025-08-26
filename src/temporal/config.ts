import { z } from 'zod';

const envSchema = z.object({
  BESTBUY_API_KEY: z.string().min(1, "Best Buy API key is required"),
  TOGETHER_API_BASE: z.string().url("Together API base must be a valid URL"),
  TOGETHER_API_KEY: z.string().min(1, "Together API key is required"),
  TEMPORAL_ADDRESS: z.string().min(1, "Temporal address is required"),
  OPENAI_API_KEY: z.string().min(1, "OpenAI API key is required"),
});

function getEnvVars() {
  const env = {
    BESTBUY_API_KEY: process.env.BESTBUY_API_KEY,
    TOGETHER_API_BASE: process.env.TOGETHER_API_BASE,
    TOGETHER_API_KEY: process.env.TOGETHER_API_KEY,
    TEMPORAL_ADDRESS: process.env.TEMPORAL_ADDRESS,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  };
  
  try {
    return envSchema.parse(env);
  } catch (error) {
    console.error('Environment validation failed:', error);
    // Return defaults to allow worker to start
    return {
      BESTBUY_API_KEY: process.env.BESTBUY_API_KEY || '',
      TOGETHER_API_BASE: process.env.TOGETHER_API_BASE || 'https://api.together.xyz',
      TOGETHER_API_KEY: process.env.TOGETHER_API_KEY || '',
      TEMPORAL_ADDRESS: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    };
  }
}

export const config = getEnvVars();
