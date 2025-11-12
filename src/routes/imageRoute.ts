import { Router } from "express";
import { verifRole, verifToken } from "../middlewares/auth";
import { upKosImg, getKosImg, delKosImg } from "../controllers/imageCont";
import { upKosImg as multerUpload, validateKosAndImages } from "../middlewares/verifImage";
import { Role } from "@prisma/client";

const router = Router()

router.get('/kos/:kos_id/', getKosImg);

router.use(verifToken);
router.use(verifRole([Role.OWNER]));
router.post('/kos/:kos_id/', validateKosAndImages, multerUpload, upKosImg);
router.delete('/kos/:kos_id/img/:img_id', delKosImg);

export default router;