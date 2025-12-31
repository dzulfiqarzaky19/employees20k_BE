import express from "express";
import cors from "cors";
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes'
import 'dotenv/config';
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

app.use('/auth', authRoutes)

app.use(errorHandler)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
