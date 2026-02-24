import { Router } from 'express';
import { searchNearby, searchPHC, getRouteHandler, geocodeHandler } from '../controllers/hospitalController.js';

const router = Router();

router.get('/nearby', searchNearby);
router.get('/search', searchNearby);  // alias
router.get('/phc', searchPHC);
router.get('/route', getRouteHandler);
router.get('/geocode', geocodeHandler);

export default router;
