import { Controller, Get, Query, Route, Tags } from 'tsoa';
import { WebDataManager } from '../core/manager';
import { WebResponse } from '../types';
import { Test } from '../classes/test';

@Route('/')
@Tags('Test')
export class MeController extends Controller {
	constructor (private web: WebDataManager) {
		super();
	}

	@Get('@me')
	public async getCurrentUser(
		@Query() auth: string,
		// @Path() id: string,
		// @Body() body: { name: string; },
	): Promise<WebResponse<Test>> {
		return await this.web.request<Test>({
			method: 'GET',
			endpoint: this.web.qp('/test'),
			auth,
		});
	}
}
