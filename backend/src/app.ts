import express from 'express';
import cors from 'cors';
import { authRouter }     from './routes/auth';
import { usersRouter }    from './routes/users';
import { itemsRouter }    from './routes/items';
import { requestsRouter } from './routes/requests';
import { uploadRouter }   from './routes/upload';
import { statsRouter }    from './routes/stats';
import { messagesRouter } from './routes/messages';
import { pushRouter }     from './routes/push';
import { placesRouter }   from './routes/places';
import { errorHandler }   from './middleware/error';

export const app = express();

// CORS for the web (Netlify) build — the mobile app doesn't enforce CORS.
// Allow the lentit Netlify site plus its branch/deploy-preview subdomains
// (e.g. deploy-preview-12--lentit.netlify.app) and localhost for Expo web dev.
// Safe to scope this loosely because auth is a Bearer token in a header, not a
// cookie, so there's no ambient credential a foreign origin could abuse.
const ALLOWED_ORIGINS = [
  /^https:\/\/([a-z0-9-]+--)?lentit\.netlify\.app$/i,
  /^http:\/\/localhost(:\d+)?$/i,
];
app.use(cors({
  // `origin` is undefined for non-browser clients (mobile app, curl) — allow them.
  // cors() reflects the matched origin and answers OPTIONS preflights automatically.
  origin: (origin, cb) =>
    cb(null, !origin || ALLOWED_ORIGINS.some((re) => re.test(origin))),
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

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
app.use('/places',   placesRouter);

app.use(errorHandler);
