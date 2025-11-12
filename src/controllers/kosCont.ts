import { Request, Response } from "express" // import dari express
import { PrismaClient, Gender } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { BASE_URL } from "../global";
import fs from "fs"
import path from "path";
import { number } from "joi";

const prisma = new PrismaClient({ errorFormat: 'pretty' })

export const getAllKos = async (req: Request, res: Response) => {
    try {
        const { search } = req.query
        const allKos = await prisma.kos.findMany({
            where: { name: { contains: search?.toString() || "" } },
            include: {
                user: { select: { id: true, name: true, phone: true } },
                kos_facilities: true,
                review: true,
                books: true,
                kos_img: {
                    where: { isThumbnail: true },
                    select: { id: true, file: true }
                }
            },
            orderBy: { id: "desc" }
        })

        return res.json({
            status: true,
            data: allKos,
            message: "nih kos"
        }).status(200)
    } catch (error) {
        return res.json({
            status: false,
            message: `ade eyoy ni eyoy ${error}`
        }).status(500)
    }
}

export const addKos = async (req: Request, res: Response) => {
    try {
        const { name, address, price_per_month, gender, desc, roomTotal, roomAvailable } = req.body
        const user = (req as any).user

        if (!user) {
            return res.status(401).json({
                status: false,
                message: "User tidak ditemukan dalam token",
            });
        }

        // Hanya owner yang boleh buat kos
        if (user.role !== "OWNER") {
            return res.status(403).json({
                status: false,
                message: "Hanya owner yang dapat membuat kos",
            });
        }

        let filename = ""
        if (req.file) filename = req.file.filename

        const newKos = await prisma.kos.create({
            data: {
                name,
                address,
                price_per_month: Number(price_per_month),
                desc,
                gender,
                user_id: user.id,
                roomTotal: Number(roomTotal),
                roomAvailable: Number(roomAvailable)
            }
        })

        return res.json({
            status: true,
            message: 'Cie kosnya baru ni ye',
            data: newKos,
        }).status(200)
    } catch (error) {
        return res.json({
            status: false,
            message: `ada error dah ni. ${error}`
        }).status(500)
    }
}

export const updKos = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const user = (req as any).user
        const { name, address, price_per_month, gender, desc, roomTotal, roomAvailable } = req.body

        const findKos = await prisma.kos.findFirst({ where: { id: Number(id) } })
        if (!findKos) return res.json({
            status: false,
            message: `kos ga ketemu`
        }).status(404)

        // Pastikan hanya owner pemilik kos yang bisa ubah
        if (user.role !== "OWNER" || user.id !== findKos.user_id) {
            return res.json({
                status: false,
                message: "Kamu ga berhak mengedit kos ini",
            }).status(403)
        }

        // update data kos lu 
        const updKos = await prisma.kos.update({
            where: { id: Number(id) },
            data: {
                name: name ?? findKos.name,
                address: address ?? findKos.address,
                price_per_month: price_per_month ? Number(price_per_month) : findKos.price_per_month,
                desc: desc ?? findKos.desc,
                gender: gender ?? findKos.gender,
                roomTotal: roomTotal ? Number(roomTotal) : findKos.roomTotal,
                roomAvailable: roomAvailable ? Number(roomAvailable) : findKos.roomAvailable
            }
        })

        return res.json({
            status: true,
            message: "Berhasil lau ganti",
            data: updKos,
        }).status(200)
    } catch (error) {
        return res.json({
            status: false,
            message: `Eyoy kocak ${error}`
        }).status(500)
    }
}

export const delKos = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const user = (req as any).user
        const findKos = await prisma.kos.findUnique({
            where: { id: Number(id) },
            include: { books: true, review: true, kos_facilities: true }
        })

        if (!findKos) return res.json({
            message: `GADA ID KOSNYA WOI :). Id kos yg ga ketemu: ${id}`
        }).status(404)

        if (user.role !== "OWNER" || user.id !== findKos.user_id) {
            return res.json({
                status: false,
                message: "Kamu ga berhak mengedit kos ini",
            }).status(403)
        }

        await prisma.books.deleteMany({ where: { kos_id: Number(id) } });
        await prisma.reviews.deleteMany({ where: { kos_id: Number(id) } });
        await prisma.kos_facilities.deleteMany({ where: { kos_id: Number(id) } });
        await prisma.kos_img.deleteMany({ where: { kos_id: Number(id) } });

        await prisma.kos.delete({ where: { id: findKos.id } })

        return res.json({
            status: true,
            message: `Berhasil hapus data kos '${findKos.name}'`
        }).status(200)
    } catch (error) {
        return res.json({
            status: false,
            message: `Gbs hapus u punya kos ni. Ad eyoy ${error}`
        }).status(500)
    }
}

export const getAvailableKos = async (req: Request, res: Response) => {
    try {
        const available = await prisma.kos.findMany({
            where: { roomAvailable: { gt: 0 } },
            include: {
                user: { select: { id: true, name: true, phone: true } },
                kos_facilities: true
            },
            orderBy: { price_per_month: "desc" }
        })

        if (available.length === 0) {
            return res.json({
                status: false,
                message: `Gaada kos yang kosong nih`
            }).status(404)
        }

        return res.json({
            status: true,
            message: `Berhasil nampilkan kos yang bisa dipesan.`,
            data: available
        }).status(200)

    } catch (error) {
        return res.json({
            status: false,
            message: `Ada error waktu mengambil data. ${error}`
        }).status(500)
    }
}

export const getGenderKos = async (req: Request, res: Response) => {
    try {
        const { gender } = req.query;

        if (!gender) {
            return res.status(400).json({
                status: false,
                message: `Wajib mengisi parameter 'gender'. Contoh: /kos/filter?gender=male`
            });
        }

        const allowedGender = ["MALE", "FEMALE", "ALL"];
        const normalizedGender = gender.toString().toUpperCase();

        if (!allowedGender.includes(normalizedGender)) {
            return res.status(400).json({
                status: false,
                message: `Gender '${gender}' gak valid. Pake ini: ${allowedGender.join(", ")}.`
            });
        }

        // kalau ALL, ambil semua kos tanpa filter gender
        const whereClause =
            normalizedGender === "ALL"
                ? { roomAvailable: { gt: 0 } }
                : { gender: normalizedGender as Gender, roomAvailable: { gt: 0 } };

        const kosList = await prisma.kos.findMany({
            where: whereClause,
            include: { kos_facilities: true, user: true }
        });

        if (kosList.length === 0) {
            return res.status(404).json({
                status: false,
                message: `Gaada kos dengan gender ${normalizedGender} yang available.`
            });
        }

        return res.status(200).json({
            status: true,
            message: `Berhasil nampilin kos dengan gender ${normalizedGender}.`,
            total: kosList.length,
            data: kosList
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: `Ada error ni. ${error}`
        });
    }
};
