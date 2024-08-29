import { build, installDependencies, removeDistAndModules } from './utils';
import { select } from '@inquirer/prompts';
import LoggerModule from './logger';
import fs from 'fs/promises';
import path from 'path';

(async () => {
	console.clear();

	const returnError = (message: string) => {
		LoggerModule(message, 'red');
		process.exit(1);
	};

	const type = await select({
		message: 'What do you want to do?',
		choices: [
			{ name: 'Build all templates', value: 'build' },
			{ name: 'Install dependencies for all templates', value: 'install' },
			{ name: 'Clean all templates', value: 'clean' },
		],
	});

	const templates = await fs.readdir(path.resolve(__dirname, '../templates'));
	if (!templates.length) returnError('No templates found.');

	for await (const template of templates) {
		const src = path.resolve(__dirname, `../templates/${template}`);
		const packageExists = fs.stat(path.join(src, 'package.json')).then(() => true).catch(() => false);
		if (!packageExists) {
			LoggerModule(template, 'yellow');
			continue;
		}

		try {
			switch (type) {
				case 'build': {
					LoggerModule(template, 'grey');
					await build(src);
					LoggerModule(template, 'green');
					break;
				}
				case 'install': {
					LoggerModule(template, 'grey');
					await installDependencies(src);
					LoggerModule(template, 'green');
					break;
				}
				case 'clean': {
					LoggerModule(template, 'grey');
					await removeDistAndModules(src);
					LoggerModule(template, 'green');
					break;
				}
			}
		} catch (err) {
			LoggerModule(template, 'red');
		}
	}
})().catch((err) => {
	if ('name' in err && err.name === 'ExitPromptError') return;
	console.error(err);
});
