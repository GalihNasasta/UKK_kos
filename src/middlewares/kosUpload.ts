import { Request } from "express";
import multer from "multer";
import { BASE_URL } from "../global";

/**Mendefinisikan konfigurasi penyimpanan foto kos */
const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {

       cb(null, `${BASE_URL}/public/kos_img`)
    },
    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        cb(null, `${new Date().getTime().toString()}-${file.originalname}`)
    }
})

const uploadFile = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }
})

export default uploadFile