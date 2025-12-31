import { Router } from "express";
import { authentication } from "../middlewares/auth";
import { importCSV } from "../controllers/import.controller";
import { handleCSVUpload } from "../middlewares/multer";

const router: Router = Router();

router.use(authentication);

router.post('/csv', handleCSVUpload, importCSV);

export default router;
