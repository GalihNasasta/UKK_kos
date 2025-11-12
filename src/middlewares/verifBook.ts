import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import multer from "multer";

const upload = multer();

// Skema umum
const schemaForSocietyAdd = Joi.object({
    kos_id: Joi.number().required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().required(),
    Status: Joi.forbidden().messages({
        "any.unknown": "Kamu tidak boleh menambahkan status booking (otomatis PENDING)."
    })
}).unknown(true);

const schemaForSocietyEdit = Joi.object({
    kos_id: Joi.number().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    Status: Joi.forbidden().messages({
        "any.unknown": "Kamu tidak boleh mengubah status booking."
    })
}).unknown(true);

const schemaForOwnerEditStatus = Joi.object({
    startDate: Joi.forbidden().messages({
        "any.unknown": "Kamu tidak boleh mengubah tgl booking."
    }),
    endDate: Joi.forbidden().messages({
        "any.unknown": "Kamu tidak boleh mengubah tgl booking."
    }),
    Status: Joi.string().valid("PENDING", "REJECT", "ACCEPT").required().messages({
        "any.required": "Owner hanya bisa update/edit status booking society.",
        "any.only": "Status hanya boleh PENDING, REJECT, atau ACCEPT."
    })
}).unknown(true);


// Middleware utama
export const verifBook = (action: "ADD" | "EDIT") => [
    upload.none(),
    (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({
                status: false,
                message: "Token user tidak ditemukan"
            });
        }

        let schema;

        if (user.role === "SOCIETY") {
            // Society hanya boleh tambah/edit tanpa ubah status
            schema = action === "ADD" ? schemaForSocietyAdd : schemaForSocietyEdit;
        } else if (user.role === "OWNER") {
            // Owner hanya boleh ubah status booking
            if (action === "EDIT") schema = schemaForOwnerEditStatus;
            else {
                return res.status(403).json({
                    status: false,
                    message: "Owner tidak bisa membuat booking"
                });
            }
        } else {
            return res.status(403).json({
                status: false,
                message: "Role kamu tidak dikenali"
            });
        }

        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            return res.status(400).json({
                status: false,
                message: error.details.map(e => e.message).join(", ")
            });
        }

        next();
    }
];
