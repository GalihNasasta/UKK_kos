import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs"
import { CustomRequest } from "../types";

const prisma = new PrismaClient()

export const upKosImg = async (req: CustomRequest, res: Response) => {
    const kos_id = parseInt(req.params.kos_id ?? "0")
    const files = req.files as { [fieldname: string]: Express.Multer.File[] }

    try {
        const imgCreate: { file: string, isThumbnail: boolean }[] = []
        
        if (files.thumbnail && files.thumbnail[0]) {
            const img = files.thumbnail[0]
            const file = path.join('/public/kos_img', kos_id.toString(), img.filename)
            imgCreate.push({ file, isThumbnail: true })
        }

        if (files.image) {
            files.image.forEach((files) => {
                const file = path.join('/public/kos_image', kos_id.toString(), files.filename)
                imgCreate.push({ file, isThumbnail: false })
            })
        }

        //save databse
        const createdImg = await prisma.kos_img.createMany({
            data: imgCreate.map((p) => ({ ...p, kos_id }))
        })

        res.json({
            status: true,
            message: `Berhasil upload foto`,
            data: createdImg
        }).status(200)
 
    } catch (error) {
        return res.json({
            status: false,
            message: `Gagal upload foto. ${error}`
        }).status(500)
    }
}

export const getKosImg = async (req: CustomRequest, res: Response) => {
    const kos_id = parseInt(req.params.kos_id ?? "0")

    try {
        const img = await prisma.kos_img.findMany({
            where: { kos_id }
        })

        res.json({
            status: true,
            data: img
        }).status(200)

    } catch (error) {
        return res.json({
            status: false,
            message: `Gagal saat tampilkan foto. ${error}`
        }).status(500)
    }
}

export const delKosImg = async (req: CustomRequest, res: Response) => {
    const kos_id = parseInt(req.params.kos_id ?? "0")
    const img_id = parseInt(req.params.img_id ?? "0")
    const user_id = (req as any).user.id
    
    try {
        const kos = await prisma.kos.findUnique({
            where: { id: kos_id }
        })
        if (!kos || kos.user_id !== user_id) {
            return res.json({
                status: false,
                message: `No access`
            }).status(403)
        }

        const img = await prisma.kos_img.findUnique({
            where: { id: img_id }
        })
        if (!img) {
            return res.json({
                status: false,
                message: `Foto ga ketemu`
            }).status(404)
        }

        const filePath = path.join(__dirname, '../../', img.file)
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
        }

        await prisma.kos_img.delete({
            where: { id: img_id }
        })

        res.json({
            status: true,
            message: `Berhasil hapus foto`
        }).status(200)

    } catch (error) {
        return res.json({
            status: false,
            message: `Error waktu hapus foto. ${error}`
        }).status(500)
    }
}