import express from "express";
import cors from "cors";
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.router';
import importRoutes from "./routes/import.router";
import employeeRoutes from "./routes/employee.router";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/import', importRoutes);

app.use(errorHandler);

export default app;
