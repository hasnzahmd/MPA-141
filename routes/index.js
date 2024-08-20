import express from 'express';
import { reportRouter } from './generate-medical-report.js';

const router = express.Router();

router.use('/generate-medical-report', reportRouter);

export default router;