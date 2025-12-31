import express from "express";
import cors from "cors";
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!asdasd');
});

app.get('/hello', (req, res) => {
    res.send('Hello World!');
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
