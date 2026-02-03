import { Router } from "express";
import { authentication } from "../middleware/auth.middleware";
import { createEmployee, deleteEmployee, getEmployeeDetail, getEmployees, updateEmployee } from "../controllers/employee.controller";

const router: Router = Router();

router.use(authentication);

router.post('/', createEmployee);
router.get('/', getEmployees);
router.get('/:id', getEmployeeDetail);
router.patch('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

export default router;