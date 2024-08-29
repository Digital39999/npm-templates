import env from 'dotenv';
import { z } from 'zod';

// Load .env file.
env.config();

// Export config.
const config: z.infer<typeof ConfigSchema> = {
	bot: {
		id: process?.env?.BOT_ID || '',
		token: process?.env?.BOT_TOKEN || '',
	},

	developers: [],

	sharding: {
		totalShards: 2,
		totalClusters: 2,
		shardsPerClusters: 1,
	},

	embedColor: 0x5c6ceb,

	encryptString: process?.env?.ENCRYPT_STRING || '',
};

export default config;

export type ConfigType = Readonly<typeof config>;
export const ConfigSchema = z.object({
	bot: z.object({
		id: z.string(),
		token: z.string(),
	}),

	developers: z.array(z.string()),

	sharding: z.object({
		totalShards: z.number(),
		totalClusters: z.number(),
		shardsPerClusters: z.number(),
	}),

	embedColor: z.number(),

	encryptString: z.string(),
});
