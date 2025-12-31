import { Router } from 'express';
import { getMe, login } from '../controllers/auth.controller';
import { authentication } from '../middlewares/auth';

const router: Router = Router();

router.post('/login', login);
router.get('/me', authentication, getMe);

export default router;
