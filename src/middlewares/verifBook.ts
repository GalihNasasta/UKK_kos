import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import multer from "multer";
import { join } from "path";

const upload = multer()

const addDataSchema = Joi.object({
    kosId: Joi.number().required(),
    startDate:Joi.date().iso().required(),
    endDate:Joi.date().iso().required(),
    status: Joi.string().valid("PENDING", "REJECT", "ACCEPT").optional()
}).unknown(true)

const editDataSchema = Joi.object({
    kosId: Joi.number().optional(),
    startDate:Joi.date().iso().optional(),
    endDate:Joi.date().iso().optional(),
    status: Joi.string().valid("PENDING", "REJECT", "ACCEPT").optional()
}).unknown(true)

export const verifAddBook = [
    upload.none,
    (req: Request, res: Response, next: NextFunction) => {
        const { error } = addDataSchema.validate(req.body, { abortEarly: false })

        if (error) {
            return res.json({
                status: false,
                message: error.details.map(it => it.message).join(", ")
            })
        }
        return next()
    }
]

export const verifEditBook = [
    upload.none,
    (req: Request, res: Response, next: NextFunction) => {
        const { error } = addDataSchema.validate(req.body, { abortEarly: false })

        if (error) {
            return res.json({
                status: false,
                message: error.details.map(it => it.message).join(", ")
            })
        }
        return next()
    }
]