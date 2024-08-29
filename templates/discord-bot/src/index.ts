import LoggerModule, { logError } from './modules/logger';
import config, { ConfigSchema } from './data/config';
import { parseZodError } from './modules/functions';
import { ClusterManager } from 'status-sharding';

/* ----------------------------------- Process ----------------------------------- */

console.clear();
LoggerModule('Standby', 'Starting manager..', 'white');
console.log('');

const check = ConfigSchema.safeParse(config);
if (!check.success) {
	logError(parseZodError(check.error), 'configSchema', 'manager');
	process.exit(39);
}

/* ----------------------------------- Manager ----------------------------------- */

export class CustomManager extends ClusterManager {
	public config = config;

	constructor () {
		super(`${__dirname}/cluster.js`, {
			...config.sharding,
			token: config.bot.token,
			mode: 'worker',
			heartbeat: {
				enabled: true,
			},
		});

		this.init();
	}

	public async init(): Promise<void> {
		return new Promise((resolve) => {

			this.once('ready', async () => {
				setTimeout(() => {
					resolve(); LoggerModule('Standby', 'All clusters are ready, Logging:\n', 'white', true);
				}, 2000);
			});

			this.on('clusterCreate', (cluster) => {
				LoggerModule('Clusters', `Launched Cluster ${cluster.id}.`, 'yellow');

				cluster.on('reconnecting', () => LoggerModule('Clusters', `Cluster ${cluster.id} is reconnecting.`, 'yellow'));
				cluster.on('disconnect', () => LoggerModule('Clusters', `Cluster ${cluster.id} disconnected.`, 'red'));
				cluster.on('death', () => LoggerModule('Clusters', `Cluster ${cluster.id} disconnected.`, 'red'));
				cluster.on('error', () => LoggerModule('Clusters', `Cluster ${cluster.id} disconnected.`, 'red'));
			});

			this.spawn();
		});
	}
}

/* ----------------------------------- Init ----------------------------------- */

const manager = new CustomManager();
export default manager;

/* ----------------------------------- Errors ----------------------------------- */

process.on('unhandledRejection', (error: Error) => logError(error, 'unhandledRejection', 'manager'));
process.on('uncaughtException', (error: Error) => logError(error, 'uncaughtException', 'manager'));
process.on('warning', (error: Error) => logError(error, 'warning', 'manager'));
