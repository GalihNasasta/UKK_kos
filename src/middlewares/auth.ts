import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import { SECRET } from "../global";

interface JwtPayload {
    id      : String,
    name    : String,
    email   : String,
    role    : String
}

export const verifToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ') [1]

    if (!token) {
        return res.status(403).json({
            message: `EMOH! token kamu ga ada akses😛`
        })
    }

    try {
        const secretKey     = SECRET || ""
        const decoded       = verify(token, secretKey) as JwtPayload
        ( req as any).user  = decoded
        next()
    }catch (error) {
        return res.json({
            message: `token u salah bray`
        }).status(401)
    }
}

export const verifRole = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next:NextFunction) => {
        const user = ( req as any ).user

        if (!user) {
            return res.json({
                message: `Ga ada rincian usernya ni!`
            }).status(403)
        }

        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({
                message: `Akses u ditolak😜.
                    Kalo mau akses, kamu butuh role: ${allowedRoles.join(', ')}`
            })
        }

        next()
    }
}
