import { APITest } from '../classes/test';

import { WebResponse } from '../types';

export class WebDataManager {
	readonly test = new APITest(this);

	constructor(public url: string, public options?: { log?: boolean; }, fetchClient?: typeof fetch) {
		if (fetchClient) globalThis.fetch = fetchClient;
	}

	public async request<O, T = unknown>(data: {
		method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
		endpoint: string; body?: T; auth?: string;
	}) {
		return await fetch(this.url + data.endpoint, {
			method: data.method,
			body: data.body ? JSON.stringify(data.body) : undefined,
			headers: {
				'Content-Type': 'application/json',
				...(data.auth ? { 'Authorization': data.auth } : {}),
			},
		}).then((res) => res.json()).catch((err) => {
			if (this.options?.log) console.error(err);
			return { status: 500, error: this.readableError('Request failed.') };
		}) as WebResponse<O>;
	}

	private readableError(error: unknown) {
		if (error instanceof Error) return error.message;
		else if (typeof error === 'string') return error;
		else return 'Unknown error.';
	}

	public qp<T extends Record<string, unknown>>(url: string, params?: T) {
		if (!params) return url;

		const query = new URLSearchParams();

		for (const [key, value] of Object.entries(params)) {
			if (value === undefined) continue;
			query.append(key, String(value));
		}

		return url + '?' + query.toString();
	}
}
