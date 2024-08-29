import { SlashCommandType } from '../data/typings';
import config from '../data/config';

export default {
	name: 'help',
	description: 'Get help with the bot.',
	type: 1,

	run: async (client, interaction) => {
		await interaction.deferReply().catch(() => null);

		let description = '';

		Array.from(client?.slashCommands?.values() || []).map((command: SlashCommandType) => {
			if (command.type !== 1) return;
			description += '> ' + client.getCommandFormat(command.name as string) + ' - ' + command.description + '\n';
		});

		return interaction.editReply({
			embeds: [{
				title: client.user?.username + ' • Help',
				description: `> Introducing our ${client.user?.username} - the catalyst for community engagement and innovation! Elevate your server by empowering every member to share their ideas effortlessly. With SuggestionsBot, creating a culture of collaboration is a breeze. Members can submit, upvote, and discuss suggestions, fostering a dynamic and inclusive environment.`,
				color: config.embedColor,
				fields: [{
					name: 'Commands',
					value: description,
				}],
			}],
			components: [{
				type: 1,
				components: [{
					type: 2,
					label: 'What are you waiting for? Add me!',
					style: 5,
					url: `https://discord.com/oauth2/authorize?client_id=${client.user?.id}&scope=bot&permissions=51539626000`,
				}],
			}],
		});
	},
} satisfies SlashCommandType;
