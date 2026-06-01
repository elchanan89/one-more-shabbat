import { Router } from 'express';
import * as ctrl from '../controllers/shabbatController';

const router = Router();

router.get('/hebrew-info', ctrl.getHebrewInfoForDate);
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

export default router;
