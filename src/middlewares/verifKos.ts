import { NextFunction, Request, Response } from "express"
import Joi from "joi"
import multer from "multer"

const upload = multer()
export const parseForm = upload.none()

const addDataSchema = Joi.object({
    name            : Joi.string().required(),
    address         : Joi.string().required(),
    price_per_month : Joi.number().required(),
    gender          : Joi.string().valid("MALE", "FEMALE", "ALL").required(),
    desc            : Joi.string().optional(),
    roomTotal       : Joi.number().min(0).required(),
    roomAvailable   : Joi.number().min(0).required(),
    user            : Joi.optional(),
    userId          : Joi.optional()
})

const editDataSchema = Joi.object({
    name            : Joi.string().optional(),
    address         : Joi.string().optional(),
    price_per_month : Joi.number().optional(),
    gender          : Joi.string().valid("MALE", "FEMALE", "ALL").optional(),
    desc            : Joi.string().optional(),
    roomTotal       : Joi.number().min(0).optional(),
    roomAvailable   : Joi.number().min(0).optional(),
    user            : Joi.optional(),
    userId          : Joi.optional()
})

export const verifAddKos = (req: Request, res: Response, next: NextFunction) => {
    const { error } = addDataSchema.validate(req.body, { abortEarly: false })

    if (error) {
        return res.json({
            status: false,
            message: error.details.map(it => it.message).join()
        }).status(400)
    }
    return next()
}

export const verifEditKos = (req: Request, res: Response, next: NextFunction) => {
    const { error } = editDataSchema.validate(req.body, { abortEarly: false })

    if (error) {
        return res.json({
            status: false,
            message: error.details.map(it => it.message).join()
        }).status(400)
    }
    return next()
}