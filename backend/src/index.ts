import 'dotenv/config';
import express from 'express';
import { authRouter }     from './routes/auth';
import { usersRouter }    from './routes/users';
import { itemsRouter }    from './routes/items';
import { requestsRouter } from './routes/requests';
import { uploadRouter }   from './routes/upload';
import { errorHandler }   from './middleware/error';

const app = express();
app.use(express.json());

// Health check — used by EC2 monitoring and future load balancers
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/auth',     authRouter);
app.use('/users',    usersRouter);
app.use('/items',    itemsRouter);
app.use('/requests', requestsRouter);
app.use('/upload',   uploadRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Lendr backend running on port ${PORT}`));
