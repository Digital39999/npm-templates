import { CancelOutWebResponses } from '../types';
import { WebDataManager } from '../core/manager';

// Data.
export class APITest {
	constructor(private web: WebDataManager) {}

	// Methods.
	public async getTest({ auth }: TestFunctionsInput['getTest']) {
		return await this.web.request<Test>({
			method: 'GET', auth,
			endpoint: this.web.qp('/test'),
		});
	}
}

// Types.
export type TestFunctionsInput = {
	'getTest': { auth: string; };
}

export type TestGetReturnTypes = {
	'getTestRaw': Awaited<ReturnType<APITest['getTest']>>;
	'getTestSuccess': CancelOutWebResponses<Awaited<ReturnType<APITest['getTest']>>>;
}

export type Test = string;
