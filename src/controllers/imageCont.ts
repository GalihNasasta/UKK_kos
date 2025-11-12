import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs"
import { CustomRequest } from "../types";

const prisma = new PrismaClient()

export const upKosImg = async (req: Request, res: Response) => {
    const customReq = req as CustomRequest;
    const kos_id = parseInt(customReq.params.kos_id ?? "0");
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // 🔹 Helper untuk hapus file kalau gagal validasi
    const deleteUploadedFiles = () => {
        if (!files) return;
        Object.values(files).forEach((fileArray) => {
            fileArray.forEach((file) => {
                try {
                    fs.unlinkSync(file.path); // hapus file dari folder public
                } catch (err) {
                    console.error(`Gagal hapus file ${file.path}:`, err);
                }
            });
        });
    };

    try {
        // Ambil data kos dan foto yang sudah ada
        const kos = await prisma.kos.findUnique({
            where: { id: kos_id },
            include: { kos_img: true }
        });

        if (!kos) {
            deleteUploadedFiles();
            return res.status(404).json({ status: false, message: "Kos tidak ditemukan" });
        }

        const countThumbnail = kos.kos_img.filter(p => p.isThumbnail).length;
        const countImage = kos.kos_img.filter(p => !p.isThumbnail).length;

        // 🔒 Cegah upload thumbnail ganda
        if (files.thumbnail && countThumbnail >= 1) {
            deleteUploadedFiles();
            return res.status(400).json({
                status: false,
                message: "Thumbnail sudah ada. Hapus dulu sebelum upload yang baru."
            });
        }

        // 🔒 Cegah upload image lebih dari 3
        if (files.image && countImage >= 3) {
            deleteUploadedFiles();
            return res.status(400).json({
                status: false,
                message: "Sudah ada 3 foto. Hapus salah satu dulu sebelum upload baru."
            });
        }

        // ========== lanjut ke penyimpanan file ==========
        const imgCreate: { file: string, isThumbnail: boolean }[] = [];

        if (files.thumbnail && files.thumbnail[0]) {
            const img = files.thumbnail[0];
            const file = path.join('/public/kos_img', kos_id.toString(), img.filename);
            imgCreate.push({ file, isThumbnail: true });
        }

        if (files.image) {
            files.image.forEach((img) => {
                const file = path.join('/public/kos_image', kos_id.toString(), img.filename);
                imgCreate.push({ file, isThumbnail: false });
            });
        }

        const createdImg = await prisma.kos_img.createMany({
            data: imgCreate.map((p) => ({ ...p, kos_id }))
        });

        return res.status(200).json({
            status: true,
            message: "Berhasil upload foto",
            data: createdImg
        });

    } catch (error) {
        console.error(error);
        // Pastikan kalau error lain pun, file yang keburu keupload tetap dihapus
        try { deleteUploadedFiles(); } catch { }
        return res.status(500).json({
            status: false,
            message: `Gagal upload foto. ${error}`
        });
    }
};


export const getKosImg = async (req: Request, res: Response) => {
    const customReq = req as CustomRequest
    const kos_id = parseInt(customReq.params.kos_id ?? "0")

    try {
        const findKos = await prisma.kos.findFirst({ where: { id: Number(kos_id) } })
        if (!findKos) return res.status(404).json({
            status: false,
            message: `kos ga ketemu`
        })

        const img = await prisma.kos_img.findMany({
            where: { kos_id }
        })

        res.status(200).json({
            status: true,
            data: img
        })

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: `Gagal saat tampilkan foto. ${error}`
        })
    }
}

export const delKosImg = async (req: Request, res: Response) => {
    const customReq = req as CustomRequest
    const kos_id = parseInt(customReq.params.kos_id ?? "0")
    const img_id = parseInt(customReq.params.img_id ?? "0")
    const user_id = (customReq as any).user.id

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