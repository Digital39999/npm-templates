import { AnySelectMenuInteraction, AutocompleteInteraction, ButtonInteraction, ChatInputCommandInteraction, ContextMenuCommandInteraction, ModalSubmitInteraction, PermissionsBitField, PermissionsString } from 'discord.js';
import { logError } from '../modules/logger';
import { EventType } from '../data/typings';
import { CustomClient } from '../cluster';
import config from '../data/config';

export default {
	name: 'interactionCreate',
	options: {
		emit: true,
	},

	run: async (client: CustomClient, interaction: AnySelectMenuInteraction | ChatInputCommandInteraction | ContextMenuCommandInteraction | ButtonInteraction | AutocompleteInteraction | ModalSubmitInteraction) => {
		if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
			const usedCommand = client.slashCommands.get(interaction.commandName);
			if (!usedCommand) return interaction.reply({
				content: 'This command is not registered.',
				ephemeral: true,
			});

			let hasPerms: { maybe: boolean, me?: boolean, which?: PermissionsString[] } = { maybe: true };

			if (!config?.developers.includes(interaction.user.id)) {
				if (usedCommand.permissions?.user?.length && !(interaction.member?.permissions as PermissionsBitField)?.has(usedCommand.permissions.user)) hasPerms = { maybe: false, me: false, which: (interaction.member?.permissions as PermissionsBitField)?.missing(usedCommand.permissions.user) };
				if (usedCommand.permissions?.client?.length && !interaction.guild?.members.me?.permissions?.has(usedCommand.permissions.client)) hasPerms = { maybe: false, me: true, which: interaction.guild?.members.me?.permissions?.missing(usedCommand.permissions.client) };
			}

			if (!hasPerms.maybe) return interaction.reply({
				content: (hasPerms.me ? 'I' : 'You') + ' are missing the following permissions: `' + (hasPerms.which?.join('`, `') || 'None') + '`.',
				ephemeral: true,
			});

			try {
				usedCommand?.run?.(client, interaction as never);
			} catch (error: unknown) {
				logError(error as Error, 'interactionCreate', 'cluster');

				if (interaction.isRepliable()) interaction[interaction.replied ? 'editReply' : 'reply']({
					content: 'An error occurred while executing this command.',
				}).catch((): null => null);
			}
		}

		return;
	},
} as EventType;
