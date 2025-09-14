import { Request, Response } from "express"
import { PrismaClient } from "@prisma/client"
import { BASE_URL, SECRET } from "../global"
import md5 from "md5"
import fs from "fs"
import { sign } from "jsonwebtoken";


const prisma = new PrismaClient({errorFormat:"pretty"})

export const getAllUser = async (req: Request, res: Response) => {
    try {
        const { search } = req.query
        const allUser = await prisma.user.findMany({
            where: { name: { contains: search?.toString() || "" } }
        })

        return res.json({
            status  : true,
            data    : allUser,
            message : `Ni usernye`
        }).status(200)
    } catch (error) {
        return res.json({
            status  : false,
            message : `Ada error ni ye ${error}`
        }).status(400)
    }
}

export const createUser = async (req: Request, res: Response) => {
    try{
        const { name, email, password, role, phone } = req.body

        let filename = ""
        if (req.file) filename = req.file.filename

        const newUser = await prisma.user.create({
            data: { name, email, password:md5(password), role, phone }
        })

        return res.json({
            status  : true,
            data    : newUser,
            message : "Berhasil nambah user braay"
        }).status(200)
    } catch (error) {
        return res.json({
            status  : false,
            message : `Ada error nih. ${error}`
        }).status(400)
    }
}

export const auth = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body
        
        const findUser = await prisma.user.findFirst({
            where: { email, password:md5(password) }
        })
        if (!findUser) return res.status(200)
            .json({
                status  : false,
                logged  : false,
                message : "Email ato password u salah jir"
            })
        
            let data = {
            id      :     findUser.id,
            name    :   findUser.name,
            email   :  findUser.email,
            role    :   findUser.role
        }
        
        let payload = JSON.stringify(data)
        let token = sign(payload, SECRET || "token")

        return res.json({
            status  : true,
            logged  : true,
            data,
            message : `Berhasil login brayy`, token
        }).status(200)
    } catch (error) {
        return res.json({
            status  : false,
            messaage: `Ada eyoy nih. ${error}`
        }). status(400)
    }
}

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password, phone, role } = req.body
        // const uuid = uuidv4()

        const newUser = await prisma.user.create({
            data: { name, email, password:md5(password), phone, role }
        })
        
        return res.json({
            status  : true,
            data    : newUser,
            message : "Berhasil daftar mas/mbak!"
        }).status(200)
    }catch (error) {
        return res.json({
            status  : false,
            message : `Wadoh! ada yg salah ni? ${error}`
        }).status(400)
    }
}

export const upToOwner = async (req: Request, res: Response) => {
  try {
      const User = (req as any).user.id; // dapet dari JWT middleware
      
    const user = await User.findById(User);
    if (!user) {
      return res.status(404).json({ message: "User gak ketemu nih" });
    }

    if (user.role === "OWNER") {
      return res.status(400).json({ message: "Akun lau udah owner kocak" });
    }
    
    user.role = "OWNER";
    await user.save();
    
    res.json({ message: "Cieee udah jadi owner nihh yee" });
} catch (error) {
    res.status(500).json({ message: "Gabisa jadi owner nih(nginep aja udah)", error });
  }
};
