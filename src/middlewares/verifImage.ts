import { PrismaClient } from "@prisma/client";
import multer from "multer";
import path from "path";
import fs from "fs"
import { Request, Response, NextFunction } from "express";
import { CustomRequest } from "../types.d";

const prisma = new PrismaClient()
const imgCounter = 2

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const CustomRequest = req as CustomRequest
        const kos_id = CustomRequest.params.kos_id
        if (!kos_id) {
            return cb(new Error('Id kos dibutuhkan.'), '')
        }
        const upload = path.join(__dirname, '../../public/kos_img', kos_id)

        if (!fs.existsSync(upload)) {
            fs.mkdirSync(upload, { recursive: true })
        }
        cb(null, upload)
    },
    filename: (req: CustomRequest, file, cb) => {
        const kos_id = req.params.kos_id

        if (!kos_id) {
            return cb(new Error('Id kos dibutuhkan.'), '')
        }
        const existedImg = req.existedImg || []

        let fileNumber: number
        if (file.fieldname === 'thumbnail') {
            fileNumber = 1
        } else {
            const biasaNumber: number[] = existedImg
                .filter((p: any) => !p.isThumbnail)
                .map((p: any) => {
                    const file = p.file || ''
                    return parseInt(path.basename(file, path.extname(file))) || 0
                })
                .sort((a: number, b: number) => a - b)

            const lastNumber = biasaNumber.length > 0 ? biasaNumber[biasaNumber.length - 1] ?? 1 : 1
            fileNumber = lastNumber + 1
            if (fileNumber > 4) fileNumber = 4
        }

        const ext = path.extname(file.originalname)
        cb(null, `${fileNumber}${ext}`)
    }
})

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true)
    } else {
        cb(new Error('Hanya file gambar yang diperbolehkan!'))
    }
}

export const upKosImg = multer({
    storage,
    fileFilter,
    limits: { fieldSize: 5 * 1024 * 1024 }
}).fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'image', maxCount: 3 }
])

export const validateKosAndImages = async (req: Request, res: Response, next: NextFunction) => {
    const customReq = req as CustomRequest
    const kos_idStr = req.params.kos_id;
    if (!kos_idStr) {
        return res.status(400).json({ message: 'Id kos dibutuhkan' });
    }
    const kos_id = parseInt(kos_idStr);
    const user_id = req.user?.id;

    if (!user_id) {
        return res.status(401).json({ message: 'Kamu tidak sah untuk akses ini' });
    }

    try {
        // Cek apakah kos ada dan user adalah owner
        const kos = await prisma.kos.findUnique({
            where: { id: kos_id },
            include: { kos_img: true },
        });

        if (!kos) {
            return res.status(404).json({ message: 'Kos tidak ditemukan' });
        }

        if (kos.user_id !== user_id) {
            return res.status(403).json({ message: 'Kamu bukanlah owner dari kos ini!' });
        }

        // Simpan existing photos untuk penamaan
        customReq.existedImg = kos.kos_img;
        const countThumbnail = kos.kos_img.filter((p) => p.isThumbnail).length;
        const countImage = kos.kos_img.filter((p) => !p.isThumbnail).length;

        // Kalau thumbnail sudah ada, dan user mencoba upload lagi thumbnail
        if (countThumbnail >= 1 && (customReq.files as any)?.thumbnail) {
            return res.status(400).json({
                status: false,
                message: 'Thumbnail sudah ada. Hapus dulu sebelum upload yang baru.'
            });
        }

        // Kalau foto biasa sudah 3, dan user mencoba upload lagi image
        if (countImage >= 3 && (customReq.files as any)?.image) {
            return res.status(400).json({
                status: false,
                message: 'Kamu sudah upload 3 foto biasa. Hapus salah satu dulu sebelum upload baru.'
            });
        }
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ada error nih.' });
    }
}