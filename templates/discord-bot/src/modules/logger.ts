export const baseColors = {
	red: '\x1b[31m',
	yellow: '\x1b[33m',
	green: '\x1b[32m',
	cyan: '\x1b[36m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	white: '\x1b[37m',
	black: '\x1b[30m',
	grey: '\x1b[37m\x1b[2m',
} as const;

const reset = '\x1b[0m';

export type Colors =
	| `${keyof typeof baseColors}Bright`
	| `BG${keyof typeof baseColors}Bright`
	| keyof typeof baseColors;

export const colors: Record<Colors, string> = {
	...baseColors,

	redBright: '\x1b[31m\x1b[1m',
	yellowBright: '\x1b[33m\x1b[1m',
	greenBright: '\x1b[32m\x1b[1m',
	cyanBright: '\x1b[36m\x1b[1m',
	blueBright: '\x1b[34m\x1b[1m',
	magentaBright: '\x1b[35m\x1b[1m',
	whiteBright: '\x1b[37m\x1b[1m',
	blackBright: '\x1b[30m\x1b[1m',
	greyBright: '\x1b[37m\x1b[2m\x1b[1m',

	BGredBright: '\x1b[41m\x1b[1m',
	BGyellowBright: '\x1b[43m\x1b[1m',
	BGgreenBright: '\x1b[42m\x1b[1m',
	BGcyanBright: '\x1b[46m\x1b[1m',
	BGblueBright: '\x1b[44m\x1b[1m',
	BGmagentaBright: '\x1b[45m\x1b[1m',
	BGwhiteBright: '\x1b[47m\x1b[1m',
	BGblackBright: '\x1b[40m\x1b[1m',
	BGgreyBright: '\x1b[47m\x1b[2m\x1b[1m',
} as const;

export function colorize(text: string, color: keyof typeof colors): string {
	return colors[color] + text + reset;
}

export function logError(error: Error | unknown, origin: string, type?: ('manager' | 'cluster' | 'worker' | 'unknown'), ...additionalData: unknown[]): void {
	if ((error as Error)?.name?.includes('Unknown interaction') || (error as Error)?.name?.includes('InteractionNotReplied')) return;
	if (!type) type = 'unknown';

	console.error(
		LoggerModule(`${type.charAt(0).toUpperCase() + type.slice(1)} Error [${origin}]`, '|------------|\n', 'red', false, false),
		error, '\n', ...additionalData, '\n',
	);
}

export default function LoggerModule(logType: string, input: string, color: ('black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'grey'), newLine?: boolean, log = true): string | null {
	const useTime = true;

	const type: string = logType ? ' ' + colorize(` ${logType} `, `BG${color}Bright`) : ' ';
	const text: string = ' ' + colorize(input, `${color}Bright`);
	const time: string = useTime ? colorize(` ${new Date().toLocaleString('en-UK', { timeZone: 'Europe/Zagreb' }).split(', ')[1]} `, `BG${color}Bright`) : '';

	if (log) console.log((newLine ? '\n' : '') + colorize(' • ', `BG${color}Bright`) + ' ' + time + type + text);
	return log ? null : (newLine ? '\n' : '') + colorize(' • ', `BG${color}Bright`) + ' ' + time + type + text;
}
