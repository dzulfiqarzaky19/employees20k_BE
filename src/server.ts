import http from 'http';
import cors from "cors";
import helmet from 'helmet';
import morgan from 'morgan';
import express from "express";
import authRoutes from './routes/auth.routes';
import importRoutes from "./routes/import.routes";
import employeeRoutes from "./routes/employee.routes";
import { errorHandler } from "./middlewares/errorHandler";
import { initSocket } from './config/socket';

import 'dotenv/config';
import './workers/import.worker';
import './workers/employee.worker';


const app = express();

const server = http.createServer(app);
initSocket(server);

app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

app.use('/auth', authRoutes)
app.use('/employee', employeeRoutes)
app.use('/import', importRoutes)

app.use(errorHandler)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
