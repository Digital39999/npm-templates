import { select } from '@inquirer/prompts';
import { spawn } from 'child_process';
import LoggerModule from './logger';
import fs from 'fs/promises';
import path from 'path';

(async () => {
	console.clear();

	const returnError = (message: string) => {
		LoggerModule('Error', message, 'red');
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
			LoggerModule('Skipping', template, 'yellow');
			continue;
		}

		try {
			switch (type) {
				case 'build': {
					LoggerModule('Building', template, 'green');
					await build(src);
					LoggerModule('Built', template, 'green');
					break;
				}
				case 'install': {
					LoggerModule('Installing', template, 'green');
					await installDependencies(src);
					LoggerModule('Installed', template, 'green');
					break;
				}
				case 'clean': {
					LoggerModule('Cleaning', template, 'green');
					await removeDistAndModules(src);
					LoggerModule('Cleaned', template, 'green');
					break;
				}
			}
		} catch (err) {
			LoggerModule('Failed', template, 'red');
		}
	}
})().catch(console.error);

export async function installDependencies(where: string, packageManager = 'pnpm') {
	return new Promise<void>((resolve, reject) => {
		const process = spawn(packageManager, ['install'], { cwd: where, stdio: 'inherit' });

		process.on('close', (code) => {
			if (code === 0) resolve();
			else reject(new Error(`pnpm install failed with code ${code}`));
		});
	});
}

export async function build(where: string, packageManager = 'pnpm') {
	const exists = await fs.stat(path.join(where, 'node_modules')).then(() => true).catch(() => false);
	if (!exists) {
		console.log('Dependencies not installed, installing..');
		await installDependencies(where, packageManager);
	}

	return new Promise<void>((resolve, reject) => {
		const process = spawn(packageManager, ['run', 'build'], { cwd: where, stdio: 'inherit' });

		process.on('close', (code) => {
			if (code === 0) resolve();
			else reject(new Error(`pnpm run build failed with code ${code}`));
		});
	});
}

export async function removeDistAndModules(where: string) {
	return Promise.all([
		new Promise<void>((resolve, reject) => {
			const process = spawn('rm', ['-rf', 'dist'], { cwd: where });

			process.on('close', (code) => {
				if (code === 0) resolve();
				else reject(new Error(`rm -rf dist failed with code ${code}`));
			});
		}),
		new Promise<void>((resolve, reject) => {
			const process = spawn('rm', ['-rf', 'node_modules'], { cwd: where });

			process.on('close', (code) => {
				if (code === 0) resolve();
				else reject(new Error(`rm -rf node_modules failed with code ${code}`));
			});
		}),
	]);
}

export async function addIgnoreFiles(where: string) {
	const npmIgnore = `
		src
		node_modules

		.gitignore
		.eslintrc.json

		pnpm-lock.yaml
		tsconfig.json
	`;

	const gitIgnore = `
		dist
		node_modules
		pnpm-lock.yaml
	`;

	await fs.writeFile(path.join(where, '.npmignore'), npmIgnore);
	await fs.writeFile(path.join(where, '.gitignore'), gitIgnore);

	console.log('Added .npmignore and .gitignore files.');
}
