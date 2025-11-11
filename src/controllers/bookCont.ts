import { Request, Response } from "express";
import { PrismaClient, Status } from "@prisma/client";
import PDFDocument, { moveDown } from "pdfkit"
import path from "path";
import fs from "fs"

const prisma = new PrismaClient({ errorFormat: "pretty" })

export const getAllBook = async (req: Request, res: Response) => {
    try {
        const { search } = req.query
        const user_id = (req as any).user?.id

        const parseUserId = user_id ? Number(user_id) : null
        const filters = parseUserId ? { user_id: parseUserId }
            : search ? {
                OR: [
                    { kos: { name: { contains: search.toString(), mode: "insensitive" } } },
                    { user: { name: { contains: search.toString(), mode: "insensitive" } } }
                ]
            }
                : {}

        const allBook = await prisma.books.findMany({
            where: filters,
            include: {
                kos: { select: { id: true, name: true, address: true } },
                user: { select: { id: true, name: true, phone: true } }
            },
            orderBy: { startDate: "desc" }
        })

        return res.json({
            status: true,
            data: allBook,
            message: "berhasil ambil data booking."
        }).status(200)
    } catch (error) {
        return res.json({
            status: false,
            message: `Ada error waktu tampilin data booking. ${error}`
        }).status(400)
    }
}

export const addBook = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user

        if (!user) {
            return res.json({
                status: false,
                message: `User token ga ketemu`
            }).status(404)
        }

        if (user.role !== "SOCIETY") {
            return res.json({
                status: false,
                message: `Hanya society yang bisa booking kos`
            }).status(403)
        }

        const { startDate, endDate, kos_id } = req.body

        const kos = await prisma.kos.findUnique({ where: { id: Number(kos_id) } })
        if (!kos) {
            return res.json({
                status: false,
                message: `Id kos ${kos_id}, ga ketemu`
            })
        }

        const existedBook = await prisma.books.findFirst({
            where: {
                user_id: user.id,
                kos_id: Number(kos_id),
                Status: "PENDING"
            }
        })
        if (existedBook) {
            return res.json({
                status: false,
                message: `Kamu udah pernah booking disini nih.`
            }).status(400)
        }

        const newBook = await prisma.books.create({
            data: {
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                kos_id: Number(kos_id),
                user_id: user.id,
                Status: Status.PENDING
            }
        })

        return res.json({
            status: true,
            message: `${user.name} Berhasil booking di ${kos.name}`,
            data: newBook
        }).status(200)
    } catch (error: any) {
        return res.json({
            status: false,
            message: `Error waktu booking ni. ${error.message}`
        })
    }
}

export const updBook = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const { startDate, endDate, Status } = req.body
        const user = (req as any).user

        const findBook = await prisma.books.findUnique({
            where: { id: Number(id) },
            include: { kos: true }
        })

        if (!findBook) {
            return res.json({
                status: false,
                message: "Booking ga ketemu"
            }).status(404)
        }

        if (user.role === "SOCIETY") {
            if (findBook.user_id !== user.id) {
                return res.json({
                    status: false,
                    message: "HE, gaboleh ganti yang bukan punya u"
                }).status(400)
            }

            if (findBook.Status !== "PENDING") {
                return res.json({
                    status: false,
                    message: "Gabisa diupdate, bookingan u uda di proses atmin."
                }).status(400)
            }

            if (status && status !== findBook.Status) {
                return res.json({
                    status: false,
                    message: "Cuma atmin yg bole ganti status booking"
                }).status(400)
            }

            //ganti tanggal
            const updBook = await prisma.books.update({
                where: { id: Number(id) },
                data: {
                    startDate: startDate ? new Date(startDate) : findBook.startDate,
                    endDate: endDate ? new Date(endDate) : findBook.endDate
                }
            })

            return res.json({
                status: true,
                role: user.role,
                message: "Berhasil update tanggal booking",
                data: updBook
            }).status(200)
        }

        if (user.role === "OWNER") {
            if (findBook.kos.user_id !== user.id) {
                return res.json({
                    status: false,
                    message: `Bukan u yg punya kos`
                }).status(400)
            }

            if (!Status) {
                return res.json({
                    status: false,
                    message: `"Status" diisi dengan (ACCEPT / REJECT)`
                }).status(400)
            }

            const validateStatus = ["PENDING", "ACCEPT", "REJECT"]
            if (!validateStatus.includes(Status)) {
                return res.json({
                    status: false,
                    message: `Status u ga valid. Pake: PENDING, ACCEPT, REJECT`
                }).status(400)
            }

            const updBook = await prisma.books.update({
                where: { id: Number(id) },
                data: { Status }
            })

            return res.json({
                status: true,
                role: user.role,
                message: `Berhasil update status booking`,
                data: updBook
            }).status(200)
        }

        return res.json({
            status: false,
            message: `Role kamu ga dapet izin.`
        }).status(400)
    } catch (error: any) {
        console.error("Error updateBook:", error)
        return res.json({
            status: false,
            message: `Error besar waktu update booking. ${error.message}`
        }).status(500)
    }
}

export const delBook = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const user = (req as any).user

        const findBook = await prisma.books.findUnique({
            where: { id: Number(id) }
        })
        if (!findBook) {
            return res.json({
                status: false,
                message: `Booking mu ga ketemu.`
            }).status(404)
        }

        if (findBook.user_id !== user.id || user.role !== "SOCIETY") {
            return res.json({
                status: false,
                message: `Kamu ga ada izin buat hapus booking ini`
            }).status(400)
        }

        if (findBook.Status !== "PENDING") {
            return res.json({
                status: false,
                message: `Booking gabisa dihapus karena udah diproses`
            }).status(400)
        }

        await prisma.books.delete({
            where: { id: Number(id) }
        })

        return res.json({
            status: true,
            message: `Booking berhasil u hapus`
        }).status(200)
    } catch (error) {
        return res.json({
            status: false,
            message: `Error menghapus booking. ${error}`
        })
    }
}

export const getHistoryBook = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user
        const { month, year } = req.query

        if (!user || user.role != "OWNER") {
            return res.json({
                status: false,
                message: "Cuma owner yang bisa akses history booking"
            }).status(400)
        }

        if (!month || !year) {
            return res.json({
                status: false,
                message: "Wajib menyertakan parameter 'month' dan 'year'; "
            }).status(404)
        }

        const ownerKos = await prisma.kos.findMany({
            where: { user_id: user.id },
            select: { id: true }
        })

        if (ownerKos.length === 0) {
            return res.json({
                status: false,
                message: "Blum add kos lu"
            }).status(400)
        }

        const kosId = ownerKos.map((k) => k.id)
        const startDate = new Date(Number(year), Number(month) - 1, 1)
        const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59)

        const books = await prisma.books.findMany({
            where: {
                kos_id: { in: kosId },
                startDate: { gte: startDate, lte: endDate }
            },
            include: {
                kos: { select: { id: true, name: true, address: true } },
                user: { select: { id: true, name: true, phone: true } }
            },
            orderBy: { startDate: "desc" }
        })

        if (books.length === 0) {
            return res.json({
                status: false,
                message: "Gada aktifitas di tanggal tersebut"
            }).status(404)
        }

        return res.json({
            status: true,
            message: "Nih histori bookingmu",
            total: books.length,
            data: books
        }).status(200)

    } catch (error) {
        return res.json({
            status: false,
            message: `Ada error ni. ${error}`
        })
    }
}

export const getBookReceipt = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user
        const id = req.params
        const download = req.query

        const book = await prisma.books.findUnique({
            where: { id: Number(id) },
            include: {
                kos: true,
                user: true
            }
        })

        if (!book) {
            return res.json({
                status: false,
                message: "Gak ketemu nih bookingnya"
            }).status(404)
        }

        if (user.role !== "SOCIETY" || book.user_id !== user.id) {
            return res.json({
                status: false,
                message: "Kamu ga berhak akses nota ini."
            }).status(400)
        }

        if (book.Status !== "ACCEPT") {
            return res.json({
                status: false,
                message: `Booking harus diacc sm owner baru bisa download nota kocak.`
            })
        }

        const receipt = {
            namaPenyewa: book.user.name,
            namaKos: book.kos.name,
            alamatKos: book.kos.address,
            tanggalBooking: `${book.startDate.toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
            })} - ${book.endDate.toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
            })}`,
            hargaPerBulan: book.kos.price_per_month,
            totalBayar: book.kos.price_per_month,
            status: book.Status,
            tanggalCetak: new Date().toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "long",
                year: "numeric",
            }),
        };

        //Kirim json klo gk donwload
        if (!download) {
            return res.json({
                status: false,
                message: `Berhasil ambil nota.`,
                data: receipt
            }).status(200)
        }

        const doc = new PDFDocument({ margin: 50 })
        doc.font("Courier")

        const folderPath = path.join(__dirname, "../../public/receipt")
        if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true })

        const filepath = path.join(folderPath, `nota_booking_${book.id}.pdf`)
        const stream = fs.createWriteStream(filepath)
        doc.pipe(stream)

        doc.fontSize(18).text("NOTA PEMESANAN KOS", { align: "center" });
        doc.moveDown(2);
        doc.fontSize(12);

        const addRow = (label: string, value: string | number) => {
            const spacing = 130
            const y = doc.y
            doc.text(`${label}`, 50, y);
            doc.text(": ", 50 + spacing - 5, y);
            doc.text(String(value), 50 + spacing + 5, y);
            doc.moveDown();
        }

        addRow("Nama Penyewa", receipt.namaPenyewa);
        addRow("Nama Kos", receipt.namaKos);
        addRow("Alamat Kos", receipt.alamatKos);
        addRow("Tanggal Booking", receipt.tanggalBooking);
        addRow("Harga per Bulan", `Rp${receipt.hargaPerBulan.toLocaleString("id-ID")}`);
        addRow("Total Bayar", `Rp${receipt.totalBayar.toLocaleString("id-ID")}`);
        addRow("Status", receipt.status);
        addRow("Tanggal Cetak", receipt.tanggalCetak);

        doc.moveDown(4);
        doc.text("=================================================", { align: "left" });
        doc.text("Terima kasih telah menggunakan layanan KosHunter!", {
            align: "left",
        });

        doc.end();

        stream.on("finish", () => {
            res.download(filepath, `nota_booking_${book.id}.pdf`, (err) => {
                if (err) console.error("Gagal download file: ", err)
            } )
        })

    } catch (error) {
        return res.json({
            status: false,
            message: `Error waktu cetak nota. ${error}`
        }).status(400)
    }
}