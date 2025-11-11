import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import multer from "multer";

const upload = multer()
// export const parseForm = upload.none()

const addReviewSchema = Joi.object({
    kos_id:     Joi.number().required().messages({
        "any.required": "Id kos gaboleh kosong.",
        "number.base": "Id kos harus berupa angka."
    }),
    comment:    Joi.string().max(100).required().messages({
        "any.required": "Klo mau komen jgn kosong.",
        "string.base": "Comment berupa teks.",
        "string.max": "Maksimal ketik 100 karakter."
    })
}).unknown(true)

const editReviewSchema = Joi.object({
    kos_id:     Joi.number().optional(),
    comment:    Joi.string().max(100).optional().messages({
        "string.base": "Comment berupa teks.",
        "string.max": "Maksimal ketik 100 karakter."
    })
}).unknown(true)

const replyReviewSchema = Joi.object({
    reply:      Joi.string().max(100).required().messages({
        "any.required": "Klo mau reply ya ditulis.",
        "string.base": "Komennya harus berupa string yak.",
        "string.max": "Maksimal ketik 100 karakter"
    })
})

export const verifAddReview = [upload.none(), (req: Request, res: Response, next: NextFunction) => {
            const { error } = addReviewSchema.validate(req.body, { abortEarly: false })
            if (error) {
                return res.json({
                    status: false,
                    message: error.details.map((e) => e.message).join(", ")
                }).status(400)
            }
            return next()
    }]

export const verifEditReview = [upload.none(), (req: Request, res: Response, next: NextFunction) => {
        const { error } = editReviewSchema.validate(req.body, { abortEarly: false })
        if (error) {
            return res.json({
                status: false,
                message: error.details.map((e) => e.message).join(", ")
            }).status(400)
        }
        return next()
    }]

export const verifReply = [upload.none(), (req: Request, res: Response, next: NextFunction) => {
        const { error } = replyReviewSchema.validate(req.body, { abortEarly: false })
        if (error) {
            return res.json({
                status: false,
                message: error.details.map((e) => e.message).join(", ")
            }).status(400)
        }
        return next()
    }]