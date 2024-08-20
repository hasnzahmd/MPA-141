import express from 'express';
import cors from 'cors'; 
import 'dotenv/config';
import router from './routes/index.js';

const app = express();
const port = process.env.PORT || 8080;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(express.json());
app.use('/', router);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

export default app;