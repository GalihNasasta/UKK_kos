import { PrismaClient } from "@prisma/client";
import multer from "multer";
import path from "path";
import fs from "fs"
import { BASE_URL } from "../global";
import { nextTick } from "process";

const prisma = new PrismaClient()

export const upKosImg = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const { kos_id } = req.params

            prisma.kos.findUnique({
                where: { id: Number(kos_id) }
            }).then((kos) => {
                if (!kos) 
                    return cb(new Error("Kos ga ketemu"), "")

                    const saveFolderName = kos.name.replace(/\s+/g, "_")
                    const folderPath = path.join(
                        __dirname,
                        `${BASE_URL}/public/kos_img/${saveFolderName}`
                    )

                    if(!fs.existsSync(folderPath)) {
                        fs.mkdirSync(folderPath, { recursive: true })
                    }

                    cb(null, folderPath)
            }).catch((err) => cb(err, ""))
        },

        filename: (req, file, cb) => {
            const {kos_id} = req.params

            prisma.kos.findUnique({
                where: { id: Number(kos_id) }
            }).then((kos) => {
                const saveFolderName = kos?.name.replace(/\s+/g, "_") || "kos_unknown"
                const folderPath = path.join(
                    __dirname,
                    `${BASE_URL}/public/kos_img/${saveFolderName}`
                )
                if(!fs.existsSync) {
                    fs.mkdirSync(folderPath, { recursive: true })
                }

                const existedFiles = fs.readdirSync(folderPath)
                const prefix = file.filename === "thumbnail" ? "thumbnail" : "img"
                const nextNumber = existedFiles.filter(
                    (f) => f.startsWith(prefix)
                ).length + 1
                const filename = `${prefix}_${nextNumber}${path.extname(
                    file.originalname
                )}`

                cb(null, filename)
            }).catch((err) => cb(err, ""))
        }
    }),

    limits: { fileSize: 4 * 1024 * 1024 }, //max 4mb per file

    fileFilter: (req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/jpg"]
        if (!allowed.includes(file.mimetype)) {
            return cb(new Error("Hanya file dengan tipe: 'jpg/png/jpeg' yang valid"))
        }
        cb(null, true)
    }
})