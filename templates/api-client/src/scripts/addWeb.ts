import path from 'path';
import fs from 'fs';

const routesPath = path.join(__dirname, './src/routes/routes.ts');
const routes = fs.readFileSync(routesPath, 'utf-8');

const newRoutes = routes.replace(/RegisterRoutes\(app: Router\)/g, 'RegisterRoutes(app: Router, web: WebDataManager)');
const newRoutesWithImport = newRoutes.replace(/from 'express';/g, "from 'express';\nimport { WebDataManager } from '../core/manager';");
const newRoutesWithWeb = newRoutesWithImport.replace(/Controller\(\);/g, 'Controller(web);');

fs.writeFileSync(routesPath, newRoutesWithWeb);
