// @ts-ignore
import { RegisterRoutes } from './routes/routes';
import { WebDataManager } from './core/manager';
// @ts-ignore
import openApiSpec from '../dist/swagger.json';
import swaggerUi from 'swagger-ui-express';
import express from 'express';

const app: express.Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const manager = new WebDataManager('https://api-dev.noti.bot');
RegisterRoutes(app, manager);

app.use('/', swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.listen(3020, () => {
	console.log('Server is running on http://localhost:3020');
});
