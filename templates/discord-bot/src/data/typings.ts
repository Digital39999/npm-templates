import { ApplicationCommandOption, ApplicationCommandType, ChatInputApplicationCommandData, ChatInputCommandInteraction, ClientEvents, ContextMenuCommandInteraction, PermissionResolvable, UserApplicationCommandData } from 'discord.js';
import { CustomClient } from '../cluster';

// ------------------- Utility Types ------------------- //

export type KeysOf<T> = T extends Record<string, unknown> ? {
	[K in keyof T]-?: K extends string ? `${K}` | (T[K] extends null | undefined ? never : `${K}.${KeysOf<NonNullable<T[K]>>}`) : never;
}[keyof T] : never;

export type DeepPartial<T, N extends boolean> = { [P in keyof T]?: DeepPartial<T[P], N> | (N extends true ? null : undefined); };
export type DeepRequired<T> = { [P in keyof T]-?: DeepRequired<T[P]>; };
export type DeepNonNullable<T> = { [P in keyof T]-?: DeepNonNullable<NonNullable<T[P]>>; };
export type DeepNonReadonly<T> = { -readonly [P in keyof T]: DeepNonReadonly<T[P]>; };

export type FirstUpperCase<S extends string> = S extends `${infer First}${infer Rest}` ? `${Uppercase<First>}${Rest}` : S;
export type DeepRN<T> = DeepRequired<DeepNonNullable<T>>;

export type TimeUnits = 'ns' | 'µs' | 'ms' | 's' | 'm' | 'h' | 'd' | 'w';
export type SliderActions = 'first' | 'last' | 'next' | 'previous' | 'exit' | 'select';

// ------------------- Command Types ------------------- //

interface ContextCommandType extends UserApplicationCommandData {
	name: string;
	type: ApplicationCommandType.User;

	run?: (client: CustomClient, interaction: ContextMenuCommandInteraction) => unknown;
}

interface ChatInputCommandType extends Omit<ChatInputApplicationCommandData, 'options'> {
	name: string;
	description: string;
	type: ApplicationCommandType.ChatInput;
	options?: readonly ApplicationCommandOption[];

	run?: (client: CustomClient, interaction: ChatInputCommandInteraction) => unknown;
}

export type SlashCommandType = (ContextCommandType | ChatInputCommandType) & {
	id?: string;

	register?: boolean;
	onlyInGuild?: string[];
	devOnly?: boolean;

	permissions?: {
		user?: PermissionResolvable[];
		client?: PermissionResolvable[];
	};
};

export type EventType = {
	name: keyof ClientEvents & 'raw';
	options: {
		emit: boolean;
		once?: boolean;
	}

	run: <T extends keyof ClientEvents>(client: CustomClient, ...args: ClientEvents[T]) => unknown;
};
