import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

export const createReview = async ( req: Request, res: Response ) => {
    try{
        const user_id = ( req as any ).user.id
        const { kos_id, comment } = req.body
        
        const kos = await prisma.kos.findUnique({ where: { id: Number(kos_id) } })
        if (!kos_id || !comment) {
            return res.json({
                status: false,
                message: `Isi id kos sm komentar lu.`
            }).status(400)
        }


        if (!kos) 
            return res.json({
                status: false,
                message: `Kos ga ketemu ni :(`
            }).status(404)

        const review = await prisma.reviews.create({
            data: {
                kos_id: Number(kos_id),
                user_id,
                comment
            }
        })

        return res.json({
            status: true,
            data: review,
            message: `Berhasil tambah komentar`
        }).status(200)

    } catch (error) {
        return res.json({
            status: false,
            message: `error kocak. ${error}`
        }).status(400)
    }
}

export const getReviewByKos = async (req: Request, res: Response) => {
    try {
        const { kos_id } = req.params

        const kos = await prisma.kos.findUnique({ where: { id: Number(kos_id) } })
            if (!kos) 
            return res.json({
                status: false,
                message: `Kos dengan id:${kos_id}, ga ketemu ni :(`
            }).status(404)

        const review = await prisma.reviews.findMany({
            where: { kos_id: Number(kos_id) },
            include: {
                user: {
                    select: { id: true, name: true }
                }
            }
        })

        return res.json({
            status: true,
            data: review,
            message: `Berhasil tampilkan komentar`
        }).status(200)

    } catch (error) {
        return res.json({
            status: false,
            message: `ERRRRRRROOOOORRRRRRR ${error}`
        }).status(400)
    }
}

export const updReview = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const { comment } = req.body
        const user_id = (req as any).user.id

        const review = await prisma.reviews.findUnique({
            where: { id: Number(id) }
        })

        if (!review) {
            return res.json({
                status: false,
                message: `Review ga ketemu!`
            }).status(404)
        }

        if (review.user_id !== user_id) {
            return res.json({
                status: false,
                message: `Gabisa edit yang bukan review anda!`
            }).status(403)
        }

        const upd = await prisma.reviews.update({
            where: { id: Number(id) },
            data: { comment }
        })

        return res.json({
            status: true,
            data: upd,
            message: `Berhasil update review!`
        }).status(200)

    } catch (error) {
        return res.json({
            status: false,
            message: `Ada error ni. ${error}`
        }).status(400)
    }
}

export const delReview = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const user_id = (req as any).user.id

        const review = await prisma.reviews.findUnique({
            where: {id: Number(id)}
        })

        if (!review) {
            return res.json({
                status: false,
                message: "Review ga ketemu"
            }).status(404)
        }
        if (review.user_id !== user_id) {
            return res.json({
                status: false,
                message: `Gabisa delete review org lain.`
            }).status(403)
        }

        await prisma.reviews.delete({
            where: { id: Number(id) }
        })
        return res.json({
            status: true,
            message: `Berhasil delete review`
        }).status(200)

    } catch (error) {
        return res.json({
            status: false,
            message: `Ada error ni. ${error}`
        }).status(400)
    }
}

export const replyReview = async (req: Request, res: Response) => {
    try {
        const owner = (req as any).user
        const { id } = req.params
        const { reply } = req.body

        if (!reply) {
            return res.json({
                status: false,
                message: `Klo mau reply jgn dikosongin`
            }).status(400)
        }

        const review = await prisma.reviews.findUnique({
            where: { id: Number(id) },
            include: { kos: true }
        })

        if (!review) {
            return res.json({
                status: false,
                message: `Ga ketemu review`
            }).status(404)
        }

        if (review.kos.user_id !== owner.id) {
            return res.json({
                status: false,
                message: `Kamu ga berhak buat bales komentar`
            }).status(400)
        }

        const replyReview = await prisma.reviews.update ({
            where: { id: Number(id) },
            data: { reply }
        })

        return res.json({
            status: true,
            data: replyReview,
            message: `Berhasil bales komen uy`
        }).status(200)

    } catch (error) {
        return res.json({
            status: false,
            message: `Gagal bales komen. ${error}`
        }).status(400)
    }
}