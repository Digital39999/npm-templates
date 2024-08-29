import { addIgnoreFiles, copyEverything, installDependencies } from './utils';
import { input, select, confirm } from '@inquirer/prompts';
import LoggerModule from './logger';
import fs from 'fs/promises';
import path from 'path';

(async () => {
	console.clear();

	const returnError = (message: string) => {
		LoggerModule(message, 'red');
		process.exit(1);
	};

	const templates = await fs.readdir(path.resolve(__dirname, '../templates'));
	if (!templates.length) returnError('No templates found.');

	const formatName = (name: string) => name.split('-').map((word) => word[0]?.toUpperCase() + word.slice(1)).join(' ');

	const packageManager = await select({
		message: 'Select a package manager you want to use:',
		choices: ['npm', 'pnpm', 'yarn'].map((manager) => ({ name: manager, value: manager })),
	});

	const template = await select({
		message: 'Select a template you want to use:',
		choices: templates.map((template) => ({ name: formatName(template), value: template })),
	});

	const projectDir = await input({ message: 'Enter the project directory:' });

	const src = path.resolve(__dirname, `../templates/${template}`);
	const dest = path.resolve(process.cwd(), projectDir);

	const hasFiles = await fs.readdir(dest).then((files) => files.length > 0).catch(() => false);
	if (hasFiles) {
		const overwrite = await confirm({ message: 'The directory is not empty, do you want to overwrite it?' });
		if (!overwrite) returnError('Aborted.');
		else {
			await fs.rm(dest, { recursive: true });
			await fs.mkdir(dest, { recursive: true });
		}
	}

	await copyEverything(src, dest);
	await addIgnoreFiles(dest);

	LoggerModule('Initialized project, installing dependencies..', 'cyan', true);
	await installDependencies(dest, packageManager);

	LoggerModule('Project initialized successfully.', 'green');
})().catch((err) => {
	if ('name' in err && err.name === 'ExitPromptError') return;
	console.error(err);
});
