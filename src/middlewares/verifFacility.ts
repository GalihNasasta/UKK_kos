import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import multer from "multer";

const upload = multer()

const addFacilitySchema = Joi.object({
    kos_id:     Joi.number().required().messages({
                    "any.required": "Id kos gaboleh kosong.",
                    "number base": "Id kos wajib berupa angka."
                }),
    facility:   Joi.string().required().messages({
                    "any.required": "Nama fasilitas gaboleh kosong."
                }) 
})

const editFacilitySchema = Joi.object({
    facility:   Joi.string().optional()
}).unknown(true)

export const verifAddFacility = [
    upload.none(),
    (req: Request, res: Response, next: NextFunction) => {
        const { error } = addFacilitySchema.validate(req.body, { abortEarly: false })
        if (error) {
            return res.json({
                status: false,
                message: error.details.map((e) => e.message).join(", ")
            }).status(400)
        }
        next()
    }
]

export const verifEditFacility = [
    upload.none(),
    (req: Request, res: Response, next: NextFunction) => {
        const { error } = editFacilitySchema.validate(req.body, { abortEarly: false })
        if (error) {
            return res.json({
                status: false,
                message: error.details.map((e) => e.message).join(", ")
            }).status(400)
        }
        next()
    }
]