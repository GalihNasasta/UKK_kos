import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import multer from "multer";

const upload = multer()
export const parseForm = upload.none()

const authScema = Joi.object({
    email   : Joi.string().required(),
    password: Joi.string().min(5).alphanum().required()
})

const addDataScema = Joi.object({
    name    : Joi.string().required(),
    email   : Joi.string().required(),
    password: Joi.string().min(5).alphanum().required(),
    phone   : Joi.string().min(10).max(12).required(),
    role    : Joi.string().valid('SOCIETY', 'OWNER').uppercase().required()
})

const editDataScema = Joi.object({
    name    : Joi.string().optional(),
    email   : Joi.string().optional(),
    password: Joi.string().min(5).alphanum().optional(),
    role    : Joi.string().valid('SOCIETY', 'OWNER').uppercase().optional()
})

export const verifAuth = (
    req : Request,
    res : Response,
    next: NextFunction
) => {
    const { error } = authScema.validate(req.body, { abortEarly: false })

    if(error) {
        return res.json({
            status  : false,
            message : error.details.map((it) => it.message).join() 
        }).status(400)
    }
    return next()
}

export const verifAddUser = (req: Request, res: Response, next: NextFunction) => {
    const { error } = addDataScema.validate(req.body, { abortEarly: false })

    if (error) {
        return res.json({
            status  : false,
            message : error.details.map((it) => it.message).join()
        }).status(400)
    }
    return next()
}


export const verifEditUser = (req: Request, res: Response, next: NextFunction) => {
    const { error } = editDataScema.validate(req.body, { abortEarly: false })

    if (error) {
        return res.json({
            status  : false,
            message : error.details.map((it) => it.message).join()
        }).status(400)
    }
    return next()
}