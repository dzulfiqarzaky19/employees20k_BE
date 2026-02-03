import { Router } from "express";
import { authentication } from "../middleware/auth.middleware";
import { importCSV } from "../controllers/import.controller";
import { handleCSVUpload } from "../middleware/multer.middleware";

const router: Router = Router();

router.use(authentication);

router.post('/csv', handleCSVUpload, importCSV);

export default router;
