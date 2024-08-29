import { CommandInteraction, ButtonInteraction, InteractionEditReplyOptions, MessageComponentInteraction, APIModalInteractionResponseCallbackData, ModalSubmitInteraction } from 'discord.js';
import { DeepNonNullable, FirstUpperCase, TimeUnits } from '../data/typings';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import LoggerModule, { logError } from './logger';
import { CustomClient } from '../cluster';
import { ZodError, ZodIssue } from 'zod';
import config from '../data/config';

export const securityUtils = {
	encrypt: (text: string) => {
		const iv = randomBytes(16);
		const cipher = createCipheriv('aes-256-cbc', Buffer.from(config.encryptString, 'hex'), iv);
		const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

		return iv.toString('hex') + encrypted.toString('hex');
	},
	decrypt: (text: string) => {
		const iv = Buffer.from(text.substring(0, 32), 'hex');
		const encryptedText = Buffer.from(text.substring(32), 'hex');
		const decipher = createDecipheriv('aes-256-cbc', Buffer.from(config.encryptString, 'hex'), iv);
		const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);

		return decrypted.toString('utf8');
	},
	randomString: (length: number) => {
		return randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
	},
	mix2Strings: (key: string, remix: string) => {
		const newString = [];

		for (let i = 0; i < key.length; i++) {
			newString.push(key[i]);
			newString.push(remix[i]);
		}

		for (let i = key.length; i < remix.length; i++) {
			newString.push(remix[i]);
		}

		return newString.join('');
	},
	impossibleToDecrypt: (token: string) => {
		return securityUtils.mix2Strings(securityUtils.encrypt(token), securityUtils.encrypt(securityUtils.randomString(8)));
	},
};

export function firstLetterToUpperCase<T extends string>(text: T): FirstUpperCase<T> {
	return text.charAt(0).toUpperCase() + text.slice(1) as FirstUpperCase<T>;
}

export function parseZodError(error: ZodError) {
	const errors: string[] = [];

	const formatSchemaPath = (path: (string | number)[]) => {
		return !path.length ? 'Schema' : `Schema.${path.join('.')}`;
	};

	const firstLetterToLowerCase = (str: string) => {
		return str.charAt(0).toLowerCase() + str.slice(1);
	};

	const makeSureItsString = (value: unknown) => {
		return typeof value === 'string' ? value : JSON.stringify(value);
	};

	const parseZodIssue = (issue: ZodIssue) => {
		switch (issue.code) {
			case 'invalid_type': return `${formatSchemaPath(issue.path)} must be a ${issue.expected}`;
			case 'invalid_literal': return `${formatSchemaPath(issue.path)} must be a ${makeSureItsString(issue.expected)}`;
			case 'custom': return `${formatSchemaPath(issue.path)} ${firstLetterToLowerCase(issue.message)}`;
			case 'invalid_union': return `${formatSchemaPath(issue.path)} ${firstLetterToLowerCase(issue.message)}`;
			case 'invalid_union_discriminator': return `${formatSchemaPath(issue.path)} ${firstLetterToLowerCase(issue.message)}`;
			case 'invalid_enum_value': return `${formatSchemaPath(issue.path)} ${firstLetterToLowerCase(issue.message)}`;
			case 'unrecognized_keys': return `${formatSchemaPath(issue.path)} ${firstLetterToLowerCase(issue.message)}`;
			case 'invalid_arguments': return `${formatSchemaPath(issue.path)} ${firstLetterToLowerCase(issue.message)}`;
			case 'invalid_return_type': return `${formatSchemaPath(issue.path)} ${firstLetterToLowerCase(issue.message)}`;
			case 'invalid_date': return `${formatSchemaPath(issue.path)} ${firstLetterToLowerCase(issue.message)}`;
			case 'invalid_string': return `${formatSchemaPath(issue.path)} ${firstLetterToLowerCase(issue.message)}`;
			case 'too_small': return `${formatSchemaPath(issue.path)} ${firstLetterToLowerCase(issue.message)}`;
			case 'too_big': return `${formatSchemaPath(issue.path)} ${firstLetterToLowerCase(issue.message)}`;
			case 'invalid_intersection_types': return `${formatSchemaPath(issue.path)} ${firstLetterToLowerCase(issue.message)}`;
			case 'not_multiple_of': return `${formatSchemaPath(issue.path)} ${firstLetterToLowerCase(issue.message)}`;
			case 'not_finite': return `${formatSchemaPath(issue.path)} ${firstLetterToLowerCase(issue.message)}`;
			default: return `Schema has an unknown error (JSON: ${JSON.stringify(issue)})`;
		}
	};

	for (const issue of error.issues) {
		const parsedIssue = parseZodIssue(issue) + '.';
		if (parsedIssue) errors.push(parsedIssue);
	}

	return errors;
}

export async function quickCollector(interaction: CommandInteraction | ButtonInteraction, data: InteractionEditReplyOptions, origin: string): Promise<MessageComponentInteraction | null | 1> {
	const message = await interaction.editReply(data).catch((err) => {
		logError(err, 'quickCollector', 'cluster', {
			user: {
				id: interaction.user.id,
				username: interaction.user.username,
				serverId: interaction.guildId,
				channelId: interaction.channelId,
			},
			extra: {
				origin,
				data: data,
			},
		});
	});

	if (!message) return null;

	const click = await message?.awaitMessageComponent({
		time: 1000 * 60 * 10, // 10 minutes
		filter: (inter) => {
			if (config.developers.includes(inter.user.id)) return true;
			else if (inter.user.id !== interaction.user.id) inter?.reply({
				ephemeral: true,
				content: ' • You cannot manage that menu.',
			});

			return inter.user.id === interaction.user.id;
		},
	}).catch(() => null);

	if (click) return click;
	else {
		interaction.editReply({
			content: ' • The menu has been closed due to inactivity.',
			components: [], embeds: [],
		}).catch(() => null);

		return 1;
	}
}

export async function quickModal(interaction: CommandInteraction | MessageComponentInteraction, data: APIModalInteractionResponseCallbackData): Promise<ModalSubmitInteraction | null | 1> {
	const modal = await interaction.showModal(data).catch(() => null);
	if (modal === null) return null;

	const click = await interaction.awaitModalSubmit({
		time: 1000 * 60 * 5, // 5 minutes
		filter: (inter) => {
			if (inter.user.id !== interaction.user.id) inter.reply({
				ephemeral: true,
				content: 'You cannot manage that menu.',
			});

			return inter.user.id === interaction.user.id;
		},
	}).catch(() => null);

	if (click) return click;
	else {
		interaction.editReply({
			content: 'The menu has been closed due to inactivity.',
			components: [], embeds: [],
		}).catch(() => null);

		return 1;
	}
}

export async function errorHandlerMenu(client: CustomClient, interaction: CommandInteraction | ButtonInteraction): Promise<void> {
	if (!interaction || !client) LoggerModule('Functions ErrorHandler', 'No interaction or client was provided.', 'red');

	const data = { ephemeral: true, content: 'An error occurred while processing your request. Please try again later.', components: [], embeds: [] };

	if (interaction.replied) {
		if (interaction.deferred) await interaction.editReply(data).catch(() => LoggerModule('Functions ErrorHandler', 'Error sending interaction edit.', 'red'));
		else await interaction.followUp(data).catch(() => LoggerModule('Functions ErrorHandler', 'Error sending interaction followup.', 'red'));
	} else {
		if (interaction.deferred) await interaction.editReply(data).catch(() => LoggerModule('Functions ErrorHandler', 'Error sending interaction edit.', 'red'));
		else await interaction.reply(data).catch(() => LoggerModule('Functions ErrorHandler', 'Error sending interaction reply.', 'red'));
	}
}

export function replaceByObject<T extends object | string | T[]>(
	textOrObjectValues: T | DeepNonNullable<T>,
	object: Record<string, string | number | undefined>,
	modificators?: 'brackets' | 'squareBrackets' | 'none',
): DeepNonNullable<T> {
	const brackets = modificators === 'none' ? ['', ''] : modificators === 'squareBrackets' ? ['[', ']'] : ['{', '}'];

	if (typeof textOrObjectValues === 'string') {
		let replacedText = textOrObjectValues;

		for (const [key, value] of Object.entries(object)) {
			replacedText = replacedText.replace(new RegExp(`${brackets[0]}${key}${brackets[1]}`, 'g'), value ? value.toString() : '') as T & string;
		}

		return replacedText as DeepNonNullable<T>;
	} else if (typeof textOrObjectValues === 'object') {
		if (Array.isArray(textOrObjectValues)) return textOrObjectValues.map((value) => replaceByObject(value, object, modificators)) as unknown as DeepNonNullable<T>;
		else {
			const replacedObject = {} as T;
			for (const [key, value] of Object.entries(textOrObjectValues)) {
				if (typeof value === 'string') {
					replacedObject[key as keyof T] = replaceByObject(value, object, modificators) as (T & object)[keyof T];
				} else if (typeof value === 'object' && value !== null) {
					replacedObject[key as keyof T] = replaceByObject(value, object, modificators) as (T & object)[keyof T];
				} else {
					replacedObject[key as keyof T] = value as (T & object)[keyof T];
				}
			}

			return replacedObject as DeepNonNullable<T>;
		}
	}

	return textOrObjectValues as DeepNonNullable<T>;
}

export function replaceByObjectAndRemoveUnusedPlaceholders<T extends object | string | T[]>(
	textOrObjectValues: T | DeepNonNullable<T>,
	object: Record<string, string | number | undefined>,
	modificators?: 'brackets' | 'squareBrackets' | 'none',
): DeepNonNullable<T> {
	return removeUnusedPlaceholders(replaceByObject(textOrObjectValues, object, modificators), modificators);
}

export function removeUnusedPlaceholders<T extends object | string | T[]>(
	textOrObjectValues: T | DeepNonNullable<T>,
	modificators?: 'brackets' | 'squareBrackets' | 'none',
): DeepNonNullable<T> {
	const brackets = modificators === 'none' ? ['', ''] : modificators === 'squareBrackets' ? ['[', ']'] : ['{', '}'];

	if (typeof textOrObjectValues === 'string') {
		let replacedText = textOrObjectValues;

		replacedText = replacedText.replace(new RegExp(`${brackets[0]}.*?${brackets[1]}`, 'g'), '') as T & string;

		return replacedText as DeepNonNullable<T>;
	} else if (typeof textOrObjectValues === 'object') {
		if (Array.isArray(textOrObjectValues)) return textOrObjectValues.map((value) => removeUnusedPlaceholders(value)) as unknown as DeepNonNullable<T>;
		else {
			const replacedObject = {} as T;
			for (const [key, value] of Object.entries(textOrObjectValues)) {
				if (typeof value === 'string') {
					replacedObject[key as keyof T] = removeUnusedPlaceholders(value) as (T & object)[keyof T];
				} else if (typeof value === 'object' && value !== null) {
					replacedObject[key as keyof T] = removeUnusedPlaceholders(value) as (T & object)[keyof T];
				} else {
					replacedObject[key as keyof T] = value as (T & object)[keyof T];
				}
			}

			return replacedObject as DeepNonNullable<T>;
		}
	}

	return textOrObjectValues as DeepNonNullable<T>;
}

export function msToTimeString(ms: number, short?: boolean) {
	const days = Math.floor(ms / 86400000);
	const hours = Math.floor(ms / 3600000) % 24;
	const minutes = Math.floor(ms / 60000) % 60;
	const seconds = Math.floor(ms / 1000) % 60;

	const daysString = days > 0 ? `${days}${short ? 'd' : ' day' + (days > 1 ? 's' : '')}` : '';
	const hoursString = hours > 0 ? `${hours}${short ? 'h' : ' hour' + (hours > 1 ? 's' : '')}` : '';
	const minutesString = minutes > 0 ? `${minutes}${short ? 'm' : ' minute' + (minutes > 1 ? 's' : '')}` : '';
	const secondsString = seconds > 0 ? `${seconds}${short ? 's' : ' second' + (seconds > 1 ? 's' : '')}` : '';

	return `${daysString} ${hoursString} ${minutesString} ${secondsString}`.trim();
}

export function time(number: number, from: TimeUnits = 's', to: TimeUnits = 'ms'): number {
	const units: Record<TimeUnits, number> = {
		'ns': 1,
		'µs': 1000,
		'ms': 1000000,
		's': 1000000000,
		'm': 60000000000,
		'h': 3600000000000,
		'd': 86400000000000,
		'w': 604800000000000,
	};

	if (from === to) return number;
	else return (number * units[from]) / units[to];
}

export function getTimeDifference(from: Date, to: Date) {
	if (from.getTime() > to.getTime()) return getTimeDifference(to, from);

	const time = to.getTime() - from.getTime();
	const days = Math.floor(time / 86400000);
	const hours = Math.floor(time / 3600000) % 24;
	const minutes = Math.floor(time / 60000) % 60;
	const seconds = Math.floor(time / 1000) % 60;

	return { days, hours, minutes, seconds, totalMs: time };
}

export function formatBigNumbers(number: number | string) {
	if (typeof number === 'string') {
		if (number.endsWith('K')) number = parseFloat(number) * 1000;
		else if (number.endsWith('M')) number = parseFloat(number) * 1000000;
		else if (number.endsWith('B')) number = parseFloat(number) * 1000000000;
		else number = parseFloat(number);
	}

	const remove0s = (str: string) => {
		if (str.includes('.')) {
			while (str.endsWith('0')) str = str.slice(0, -1);
			if (str.endsWith('.')) str = str.slice(0, -1);
		}

		return str;
	};

	if (number >= 1000000000) return remove0s((number / 1000000000).toFixed(2)) + 'B';
	else if (number >= 1000000) return remove0s((number / 1000000).toFixed(2)) + 'M';
	else if (number >= 1000) return remove0s((number / 1000).toFixed(2)) + 'K';
	else return remove0s(typeof number === 'number' ? number.toString() : number);
}

export function formatTime(t: number, from: TimeUnits, short?: boolean, withColons?: boolean): string {
	if (from !== 'ms') t = time(t, from, 'ms');

	const units = [
		{ label: 'day', shortLabel: 'd', value: 86400000 },
		{ label: 'hour', shortLabel: 'h', value: 3600000 },
		{ label: 'minute', shortLabel: 'm', value: 60000 },
		{ label: 'second', shortLabel: 's', value: 1000 },
	];

	const timeParts = units.map(({ label, shortLabel, value }) => {
		const amount = Math.floor(t / value) % (label === 'day' ? Infinity : label === 'hour' ? 24 : 60);
		t %= value;
		if (withColons) return amount.toString().padStart(2, '0');
		if (amount > 0) return `${amount}${short ? shortLabel : ` ${label}${amount > 1 ? 's' : ''}`}`;
		return withColons ? '00' : '';
	});

	if (withColons) {
		const nonZeroIndex = timeParts.findIndex((part) => part !== '00');
		const filteredParts = timeParts.slice(nonZeroIndex === -1 ? timeParts.length - 1 : nonZeroIndex);
		return filteredParts.join(':');
	}

	return timeParts.filter(Boolean).join(' ').trim();
}

export function normalizeBigNumbers(number: string) {
	if (number.endsWith('K')) return parseFloat(number) * 1000;
	else if (number.endsWith('M')) return parseFloat(number) * 1000000;
	else if (number.endsWith('B')) return parseFloat(number) * 1000000000;
	else return parseFloat(number);
}

export function whyIsIncludesSoDumb<T extends string | unknown>(array: T[], value: T): boolean {
	return array.includes(value);
}

export async function waitForManager(client: CustomClient, cb?: () => unknown, intervalTime: number = 1000): Promise<void> {
	if (client.managerReady) {
		if (cb) cb();
		return;
	}

	await new Promise<void>((resolve, reject) => {
		const interval = setInterval(() => {
			try {
				if (client.managerReady) {
					clearInterval(interval);
					if (cb) cb();
					resolve();
				}
			} catch (error) {
				clearInterval(interval);
				reject(error);
			}
		}, intervalTime);
	});
}
