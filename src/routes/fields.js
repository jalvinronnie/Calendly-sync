// src/routes/fields.js
import { Router } from 'express';
import { authenticationMiddleware } from '../middlewares/authentication.js';
import * as fieldsController from '../controllers/fields-controller.js';

const router = Router();

router.post('/monday/get_remote_list_options', authenticationMiddleware, fieldsController.getRemoteListOptions);
router.post('/monday/get_field_defs', authenticationMiddleware, fieldsController.getFieldDefs);

export default router;
