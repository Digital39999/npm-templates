import { ActivityType, PermissionsBitField, ApplicationCommandData, ApplicationCommandOptionData, ApplicationCommandType, ChatInputApplicationCommandData } from 'discord.js';
import LoggerModule, { logError } from '../modules/logger';
import { waitForManager } from '../modules/functions';
import { EventType } from '../data/typings';
import { CustomClient } from '../cluster';

export default {
	name: 'ready',
	options: {
		emit: true,
	},

	run: async (client: CustomClient) => {
		LoggerModule(`Cluster ${client.cluster?.id}`, `Watching in ${client.guilds.cache.size} guilds.`, 'green');
		changeStatus(); setInterval(() => changeStatus(), 3600000); // 1 hour.

		function changeStatus() {
			client.user?.setPresence({
				status: 'online',
				activities: [{
					name: `suggestions.. • ${client?.cluster?.id}`,
					type: ActivityType.Watching,
				}],
			});
		}

		if (client.cluster.id === 0) {
			await waitForManager(client);

			const interactionsData: ApplicationCommandData[] = [];
			const perGuildInteractions: Map<string, ApplicationCommandData[]> = new Map();

			for (const command of client.slashCommands.values()) {
				switch (command.type) {
					case ApplicationCommandType.User: {
						interactionsData.push({
							type: command.type,
							name: command.name,
						});

						break;
					}
					case ApplicationCommandType.ChatInput: {
						const sendData: ChatInputApplicationCommandData = {
							type: command.type,
							name: command.name,
							description: command.description,
						};

						if (command.dmPermission) sendData.dmPermission = command.dmPermission || false;
						if (command.options?.length) sendData.options = command.options as ApplicationCommandOptionData[];
						if (command.permissions?.user) sendData.defaultMemberPermissions = new PermissionsBitField().add(command.permissions?.user).bitfield;

						if (!command.onlyInGuild?.length) interactionsData.push(sendData);
						else {
							command.onlyInGuild?.map((guild) => {
								if (!perGuildInteractions.has(guild)) perGuildInteractions.set(guild, []);
								perGuildInteractions.set(guild, [...perGuildInteractions.get(guild) || [], sendData]);
							});
						}

						break;
					}
				}
			}

			for (const [guild, commands] of perGuildInteractions) {
				client.cluster.evalOnGuild(guild, (c, ctx, g) => {
					if (!g) return;
					c.application?.commands.set(ctx, g.id);
				}, {
					context: commands,
				}).catch((err) => {
					logError(err, 'readyEvalOnGuild', 'manager');
					return [];
				});
			}

			await client.application?.commands.set([...interactionsData.values()])?.then(async (getOutput) => {
				const formated = getOutput.map((command) => {
					return {
						id: command.id,
						name: client.alternativeCmdNames[command.name] || command.name,
					};
				});

				client.cluster.broadcastEval((c, ctx) => {
					for (const command of ctx) {
						const commandData = c?.slashCommands?.get(command.name);
						if (!commandData) return;

						commandData.id = command.id; c?.slashCommands?.set(command.name, commandData);
					}
				}, {
					context: formated,
				}).catch((err) => {
					logError(err, 'readyBroadcastEval', 'manager');
					return [];
				});
			});
		}
	},
} as EventType;
