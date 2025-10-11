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

export const editUser = async (req: Request, res: Response) => {
  try {
    const {id} = req.params
    const {name, email, password, role} = req.body

    const findUser = await prisma.user.findFirst({ where: { id: Number(id) } })
    if (!findUser) return res.json({
        status: false,
        message: `User gk ketemu nicxh`
    }).status(400)

    const updUser = await prisma.user.update({
        data: {
            name        :name || findUser.name,
            email       :email || findUser.email,
            password    :password ? md5(password) : findUser.password,
            role        :role || findUser.role
        },
        where: { id: Number(id) }
    })
    return res.json({
        status: true,
        data: updUser,
        message: `Berhasil update user cuyh`
    }).status(200)
  } catch (error) {
    return res.json({
        status: false,
        message: `Gagal update cuyh // ${error}`
    }).status(400)
  }
};

export const delUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params

        const findUser = await prisma.user.findFirst({ where: { id: Number(id) } })
        if (!findUser) return res.json({
            status: false,
            message: `User ga ada kocak`
        }).status(200)

        const delUser = await prisma.user.delete({
            where: { id: Number(id) }
        })

        return res.json({
            status: true,
            data: delUser,
            message: `Berhasil kehapus`
        }).status(200)
    } catch (error) {

    }
}