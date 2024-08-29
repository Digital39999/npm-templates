import { addIgnoreFiles, installDependencies } from './packages';
import { input, select, confirm } from '@inquirer/prompts';
import LoggerModule from './logger';
import fs from 'fs/promises';
import path from 'path';

(async () => {
	console.clear();

	const returnError = (message: string) => {
		LoggerModule('Error', message, 'red');
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

	const projectDir = await input({
		message: 'Enter the project directory:',
	});

	const src = path.resolve(__dirname, `../templates/${template}`);
	const dest = path.resolve(process.cwd(), projectDir);

	const exists = await fs.stat(dest).then(() => true).catch(() => false);
	if (exists) {
		const overwrite = await confirm({ message: 'The directory already exists. Do you want to overwrite it?' });
		if (!overwrite) returnError('Aborted.');
		else await fs.rm(dest, { recursive: true });
	}

	const copy = async (src: string, dest: string) => {
		await fs.mkdir(dest, { recursive: true });
		await fs.readdir(src).then(async (items) => {
			for (const item of items) {
				const srcPath = path.join(src, item);
				const destPath = path.join(dest, item);
				const stat = await fs.stat(srcPath);

				if (stat.isDirectory()) {
					await copy(srcPath, destPath);
				} else {
					await fs.copyFile(srcPath, destPath);
				}
			}
		});
	};

	await copy(src, dest);
	await addIgnoreFiles(dest);

	LoggerModule('Info', 'Initialized project, installing dependencies..', 'cyan');
	await installDependencies(dest, packageManager);

	LoggerModule('Success', 'Project initialized successfully.', 'green');
})().catch(console.error);
