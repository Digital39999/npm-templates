import { ActivityType, GatewayIntentBits, Options } from 'discord.js';
import { EventType, SlashCommandType } from './data/typings';
import LoggerModule, { logError } from './modules/logger';
import { ShardingClient } from 'status-sharding';
import { readdir } from 'fs/promises';
import config from './data/config';
import path from 'node:path';

/* ----------------------------------- Process ----------------------------------- */

process.env.NODE_NO_WARNINGS = '1';

/* ----------------------------------- Client ----------------------------------- */

export class CustomClient extends ShardingClient {
	public slashCommands = new Map<string, SlashCommandType>();
	public managerReady = false;

	public alternativeCmdNames = {
		// 'User Info': 'ui',
	} as Record<string, string>;

	constructor() {
		super({
			presence: {
				status: 'dnd',
				activities: [{
					name: 'gears booting up..',
					type: ActivityType.Watching,
				}],
			},
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMembers,
			],
			makeCache: Options.cacheWithLimits({
				...Options.DefaultMakeCacheSettings,
				AutoModerationRuleManager: 0,
				ApplicationCommandManager: 0,
				BaseGuildEmojiManager: 0,
				GuildEmojiManager: 0,
				GuildBanManager: 0,
				GuildMemberManager: 0,
				GuildForumThreadManager: 0,
				GuildInviteManager: 0,
				GuildScheduledEventManager: 0,
				GuildStickerManager: 0,
				GuildTextThreadManager: 0,
				MessageManager: 0,
				PresenceManager: 0,
				ReactionManager: 0,
				ReactionUserManager: 0,
				StageInstanceManager: 0,
				ThreadManager: 0,
				ThreadMemberManager: 0,
				VoiceStateManager: 0,
				UserManager: 0,
			}),
		});

		this.init();
	}

	public getCommandFormat(name: string): string {
		const command: SlashCommandType = this.slashCommands.get(name) as SlashCommandType;
		return command?.id ? `</${command.name}:${command.id}>` : `\`/${name}\``;
	}

	public async loadEvents(): Promise<void> {
		(await readdir(path.join(__dirname, 'events'))).filter((file: string) => file.endsWith('.js')).map(async (file: string) => {
			const pull: EventType = await import(path.join(__dirname, 'events', file)).then((file) => file.default);

			if (pull.options.emit) {
				if (pull.options.once) this.once(pull.name, (...args) => pull.run(this, ...args) as void);
				else this.on(pull.name, (...args) => pull.run(this, ...args) as void);
			}
		});
	}

	public async loadSlashCommands(reload?: boolean) {
		const commandIds: { name: string; id: string; }[] = Array.from(this?.slashCommands?.values() || []).map((command: SlashCommandType) => ({ name: command.name as string, id: command?.id as string }));
		if (reload) this.slashCommands.clear();

		try {
			(await readdir(path.join(__dirname, 'commands'))).filter((file: string) => file.endsWith('.js')).map(async (command: string) => {
				if (reload) delete require.cache[require.resolve(path.join(__dirname, 'commands', command))];
				const pull: SlashCommandType = await import(path.join(__dirname, 'commands', command)).then((file) => file.default);

				if (pull?.name) {
					const commandId: { name: string; id: string; } | undefined = commandIds.find((command: { name: string; id: string; }) => command.name === pull.name);
					if (commandId) pull.id = commandId.id; this?.slashCommands.set(pull.name === 'User Info' ? 'ui' : pull.name, pull);
				}
			});
		} catch (error: unknown) {
			logError(error, 'loadSlashCommands', 'cluster');
		}
	}

	public async init(): Promise<void> {
		await this.loadSlashCommands();
		await this.loadEvents();

		this.cluster.on('managerReady', () => this.managerReady = true);

		this.rest.on('rateLimited', (info: { timeToReset: number; limit: string | number; global: boolean; route: string; url: string; method: string; }) => {
			LoggerModule('Ratelimit', `Below:\n- Timeout: ${info.timeToReset}\n- Limit: ${info.limit}\n- Global: ${info.global ? 'True' : 'False'}\n- Route: ${info.route}\n- Path: ${info.url}\n- Method: ${info.method}\n`, 'yellow');
		});

		this.login(config?.bot.token);
	}
}

/* ----------------------------------- Init ----------------------------------- */

const client = new CustomClient();
export default client;

/* ----------------------------------- Errors ----------------------------------- */

process.on('unhandledRejection', (error: Error) => logError(error, 'unhandledRejection', 'cluster'));
process.on('uncaughtException', (error: Error) => logError(error, 'uncaughtException', 'cluster'));
process.on('warning', (error: Error) => logError(error, 'warning', 'cluster'));
