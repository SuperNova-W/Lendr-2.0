import express from 'express';
import { authRouter }     from './routes/auth';
import { usersRouter }    from './routes/users';
import { itemsRouter }    from './routes/items';
import { requestsRouter } from './routes/requests';
import { uploadRouter }   from './routes/upload';
import { statsRouter }    from './routes/stats';
import { messagesRouter } from './routes/messages';
import { pushRouter }     from './routes/push';
import { errorHandler }   from './middleware/error';

export const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/auth',     authRouter);
app.use('/users',    usersRouter);
app.use('/items',    itemsRouter);
app.use('/requests', requestsRouter);
app.use('/upload',   uploadRouter);
app.use('/stats',    statsRouter);
app.use('/messages', messagesRouter);
app.use('/push',     pushRouter);

app.use(errorHandler);
