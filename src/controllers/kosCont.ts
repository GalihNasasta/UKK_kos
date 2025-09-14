import { Request, Response } from "express" // import dari express
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid"; 
import { BASE_URL } from "../global";
import fs from "fs"
import path from "path";

const prisma = new PrismaClient({ errorFormat: 'pretty' })

export const getAllKos = async (req: Request, res: Response) => {
    try {
        const {search} = req.query
        const allKos = await prisma.kos.findMany({
            where: { name: { contains: search?.toString() || "" } }
        })

        return res.json({
            status: true,
            data: allKos,
            message: "nih kos"
        }).status(200)
    } catch (error) {
        return res.json({
            status: false,
            message: `ade eyoy ni eyoy ${error}`
        }).status(400)
    }
}

export const addKos = async (req: Request, res: Response) => {
    try{
        const { user_id, name, address, price_per_month, gender, desc } = req.body
        
        //buat data kos
        const newKos = await prisma.kos.create({
            data: { user_id , name, address, price_per_month: Number(price_per_month), gender, desc }
        })

        //nyimpan foto di file
        // let filename = ""
        if (req.file) {await prisma.kos_img.create({
            data: {
                kos_id: newKos.id,
                file: req.file.filename
            }
        })}

        return res.json({
            status: true,
            data: newKos,
            message: `Cie punya kos ni ye`
        }).status(200)
    } catch (error) {
        return res.json({
            status: false,
            message: `Ada error ni: ${error}`
        }).status(400)
    }
}

export const updateKos = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const { name, address, price_per_month, gender, desc } = req.body

        const findKos = await prisma.kos.findFirst({ where: { id: Number(id) } })
        if (!findKos) return res.json({
            status: false,
            message: `kos ga ketemu`
        }).status(404)

        //update data kos lu
        const updKos = await prisma.kos.update({
            where: {id: Number(id)},
            data: {
                name:               name || findKos.name,
                address:            address || findKos.address,
                price_per_month:    price_per_month ? Number(price_per_month) : findKos.price_per_month,
                gender:             gender || findKos.gender,
                desc:               desc || findKos.desc
            }
        })

        //klo update foto
        if (req.file) {
            const oldImg = await prisma.kos_img.findFirst({
                where: { kos_id: updKos.id }
            })

            //ngehapus foto yg lama
            if (oldImg) {
                let imgPath = path.join(__dirname, `../../public/kos_img/${oldImg.file}`)
                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath) 
                    await prisma.kos_img.delete({where: { id: oldImg.id }})
            }
            await prisma.kos_img.create({
                data: { kos_id: updKos.id, file: req.file.filename }
            })
        }

        return res.json({
            status: true,
            data: updKos,
            message: "Berhasil lau ganti"
        }).status(200)
    } catch (error) {
        return res.json({
            status: false,
            message: `Eyoy kocak ${error}`
        }).status(400)
    }
}

export const delKos = async (req: Request, res: Response) => {
    try {
        const { id } = req.params

        const findKos = await prisma.kos.findFirst({ where: { id: Number(id) } })
        if (!findKos) return res.json({
            message: `GADA ID KOSNYA WOI :) ${id}`
        }).status(404)

        const images = await prisma.kos_img.findMany({
            where: { kos_id:findKos.id }
        })

        images.forEach((img) => {
            let imgPath = path.join(__dirname, `../../public/kos_img/${img.file}`)
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath)
        })

        await prisma.kos_img.deleteMany({ where: { kos_id: findKos.id } })
        const delKos = await prisma.kos.delete({ where: { id: findKos.id } })

        return res.json({
            status: true,
            data: delKos,
            message: `Berhasil hapus u punya kos`
        }).status(200)
    } catch (error) {
        return res.json({
            status: false,
            message: `Gbs hapus u punya kos ni. 
                    Ad eyoy ${error}`
        }).status(400)
    }
}