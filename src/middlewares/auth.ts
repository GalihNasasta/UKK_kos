import { NextFunction, Request, Response } from "express";
import { JwtPayload, verify } from "jsonwebtoken";
import { SECRET } from "../global";

interface jwtPayload {
    id      : String,
    name    : String,
    email   : String,
    role    : String
}

export const verifToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ') [1]

    if (!token) {
        return res.status(400).json({
            message: `EMOH! kamu ga ada akses😛`
        })
    }

    try {
        const secretKey = SECRET || ""
        const decoded   = verify(token, secretKey)
        req.body.user   = decoded as JwtPayload
        next()
    }catch (error) {
        return res.json({
            message: `token u salah bray`
        }).status(401)
    }
}

export const verifRole = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next:NextFunction) => {
        const user = req.body.user

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