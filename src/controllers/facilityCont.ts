import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

export const addFacility = async (req: Request, res: Response) => {
    const user_id = (req as any).user.id
    const { kos_id, facility } = req.body

    try {
        const kos = await prisma.kos.findUnique({ where: { id: Number(kos_id) } })
        if (!kos) return res.json({
            status: false,
            message: `Kos gak ketemu`
        }).status(404)
        if (kos.user_id !== user_id) return res.json({
            status: false,
            message: `Bukan lu ownernya`
        }).status(403)

        const newFacility = await prisma.kos_facilities.create({
            data: { kos_id: Number(kos_id), facility }
        })

        return res.json({
            status: true,
            facilities: newFacility,
            message: `Berhasil menambahkan fasilitas`
        }).status(200)

    } catch (error) {
        return res.json({
            status: false,
            message: `Gagal nambahin fasilitas. ${error}`
        }).status(400)
    }
}

export const getAllFacility = async (req: Request, res: Response) => {
    try {
        const facilities = await prisma.kos_facilities.findMany({
            select: {
                id: true,
                facility: true,
                kos: {
                    select: {
                        name: true
                    }
                }
            }
        })

        return res.json({
            status: true,
            data: facilities,
            message: `Berhasil mengambil semua fasilitas`
        }).status(200)

    } catch (error) {
        return res.json({
            status: false,
            message: `Gagal ambil fasilitas. ${error}`
        }).status(400)
    }
}

export const getFacilityByKos = async (req: Request, res: Response) => {
    try {
        const { kos_id } = req.params

        if (!kos_id) {
            return res.status(400).json({
                status: false,
                message: "Parameter kosId wajib diisi"
            });
        }
        
        const facilities = await prisma.kos_facilities.findMany({
            where: { kos_id: Number(kos_id) }
        });

        if (facilities.length === 0) {
            return res.status(404).json({
                status: false,
                message: `Ngga ada apa apa di Id '${kos_id}'`
            });
        }

        return res.json({
            status: true,
            data: facilities,
            message: `Berhasil tampilkan fasilitas`
        }).status(200);

    } catch (error) {
        return res.json({
            status: false,
            message: `Gagal tampilin fasilitas ${error}`
        }).status(400);
    }
}


// export const getFacilityByKos = async (req: Request, res: Response) => {
//     const kos_id = Number(req.params.id)

//     try {
//         const facilities = await prisma.kos_facilities.findMany({
//             where: { kos_id: kos_id }
//         })
//         return res.json({
//             status: true,
//             data: facilities,
//             message: `Berhasil tampilkan fasilitas`
//         }).status(200)

//     } catch (error) {
//         return res.json({
//             status: false,
//             message: `Gagal tampilin fasilitas ${error}`
//         }).status(400)
//     }
// }

export const deleteFacility = async (req: Request, res: Response) => {
    const facilityId = parseInt(req.params.id)
    const user_id = (req as any).user.id

    try {
        const facility = await prisma.kos_facilities.findUnique({
            where: { id: facilityId },
            include: { kos: true }
        })

        if (!facility) return res.json({
            status: false,
            message: `Ga ketemu nih idnya`
        }).status(404)
        if (facility.kos.id !== user_id)
            return res.json({
                status: false,
                message: `Bukan lu ownernya`
            }).status(403)

        await prisma.kos_facilities.delete({
            where: { id: facilityId }
        })
        res.json({
            status: true,
            message: `Berhasil hapus`
        }).status(200)

    } catch (error) {
        return res.json({
            status: false,
            message: `Gagal hapus. ${error}`
        }).status(400)
    }
}

export const updateFacility = async (req: Request, res: Response) => {
    const facilityId = parseInt(req.params.id)
    const user_id = (req as any).user.id
    const { facility } = req.body

    try {
        const existedFacility = await prisma.kos_facilities.findUnique({
            where: { id: facilityId },
            include: { kos: true }
        })

        if (!existedFacility) {
            return res.json({
                status: false,
                message: `404: Ga ketemu!`
            }).status(404)
        }

        if (existedFacility.kos.user_id !== user_id) {
            return res.json({
                status: false,
                message: `Bukan lu orgnya`
            }).status(403)
        }

        const updFacilty = await prisma.kos_facilities.update({
            where: { id: facilityId },
            data: { facility }
        })
        res.json({
            status: true,
            data: updFacilty,
            message: `Berhasil update fasilitas`
        }).status(200)

    } catch (error) {
        return res.json({
            status: false,
            message: `Gagal update kocak. ${error}`
        }).status(400)
    }
}