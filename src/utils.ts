import { spawn } from 'child_process';
import LoggerModule from './logger';
import fs from 'fs/promises';
import path from 'path';

export async function installDependencies(where: string, packageManager = 'pnpm') {
	return new Promise<void>((resolve, reject) => {
		const process = spawn(packageManager, ['install'], { cwd: where, stdio: 'inherit' });

		process.on('close', (code) => {
			if (code === 0) resolve();
			else reject(new Error(`${packageManager} install failed with code ${code}`));
		});
	});
}

export async function build(where: string, packageManager = 'pnpm') {
	const exists = await fs.stat(path.join(where, 'node_modules')).then(() => true).catch(() => false);
	if (!exists) {
		LoggerModule('Dependencies not installed, installing..', 'yellow');
		await installDependencies(where, packageManager);
	}

	return new Promise<void>((resolve, reject) => {
		const process = spawn(packageManager, ['run', 'build'], { cwd: where, stdio: 'inherit' });

		process.on('close', (code) => {
			if (code === 0) resolve();
			else reject(new Error(`${packageManager} run build failed with code ${code}`));
		});
	});
}

export async function removeDistAndModules(where: string) {
	await fs.rm(path.join(where, 'dist'), { recursive: true });
	await fs.rm(path.join(where, 'node_modules'), { recursive: true });
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

	const removeLeadingTabs = (str: string) => str.replace(/\t/g, '');

	await fs.writeFile(path.join(where, '.npmignore'), removeLeadingTabs(npmIgnore));
	await fs.writeFile(path.join(where, '.gitignore'), removeLeadingTabs(gitIgnore));

	LoggerModule('Added .npmignore and .gitignore files.', 'cyan');
}

export async function copyEverything(from: string, to: string) {
	await fs.mkdir(to, { recursive: true });

	const items = await fs.readdir(from);
	for await (const item of items) {
		const srcPath = path.join(from, item);
		const destPath = path.join(to, item);
		const stat = await fs.stat(srcPath);

		if (stat.isDirectory()) await copyEverything(srcPath, destPath);
		else await fs.copyFile(srcPath, destPath);
	}
}
