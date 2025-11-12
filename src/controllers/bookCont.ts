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
            return res.status(401).json({
                status: false,
                message: "Token user tidak ditemukan."
            })
        }

        if (user.role !== "SOCIETY") {
            return res.status(403).json({
                status: false,
                message: "Hanya society yang bisa melakukan booking."
            })
        }

        const { startDate, endDate, kos_id } = req.body
        if (!kos_id || !startDate || !endDate) {
            return res.status(400).json({
                status: false,
                message: "Data booking tidak lengkap (kos_id, startDate, endDate wajib diisi)."
            })
        }

        const start = new Date(startDate)
        const end = new Date(endDate)
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
            return res.status(400).json({
                status: false,
                message: "Tanggal tidak valid. Pastikan format benar dan endDate > startDate."
            })
        }

        const kos = await prisma.kos.findUnique({ where: { id: Number(kos_id) } })
        if (!kos) {
            return res.status(404).json({
                status: false,
                message: `Kos dengan id ${kos_id} tidak ditemukan.`
            })
        }

        const existedBook = await prisma.books.findFirst({
            where: { user_id: user.id, kos_id: Number(kos_id), Status: Status.PENDING }
        })
        if (existedBook) {
            return res.status(400).json({
                status: false,
                message: "Kamu sudah memiliki booking pending di kos ini."
            })
        }

        const newBook = await prisma.books.create({
            data: {
                startDate: start,
                endDate: end,
                kos_id: Number(kos_id),
                user_id: user.id,
                Status: Status.PENDING
            }
        })

        return res.status(201).json({
            status: true,
            message: `${user.name} berhasil booking di ${kos.name}`,
            data: newBook
        })
    } catch (error: any) {
        return res.status(500).json({
            status: false,
            message: `Error saat membuat booking: ${error.message}`
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

            if (Status && Status !== findBook.Status) {
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
        const user = (req as any).user;
        const { month, year } = req.query;

        if (!month || !year) {
            return res.json({
                status: false,
                message: "Parameter 'month' dan 'year' wajib disertakan. Contoh: /book/history?month=10&year=2025",
            }).status(400)
        }

        if (isNaN(Number(month)) || isNaN(Number(year)) || Number(month) < 1 || Number(month) > 12) {
            return res.json({
                status: false,
                message: "Parameter 'month' harus antara 1–12 dan 'year' harus angka valid.",
            }).status(400)
        }


        const startDate = new Date(Number(year), Number(month) - 1, 1, 0, 0, 0)
        const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59)


        let booking;

        // 🔹 Cek role
        if (user.role === "OWNER") {
            // Owner → lihat semua booking di kos miliknya
            const ownerKos = await prisma.kos.findMany({
                where: { user_id: user.id },
                select: { id: true },
            });

            if (ownerKos.length === 0) {
                return res.json({
                    status: false,
                    message: "Anda belum memiliki kos.",
                }).status(404)
            }

            const kosIds = ownerKos.map((k) => k.id);

            booking = await prisma.books.findMany({
                where: {
                    kos_id: { in: kosIds },
                    startDate: { gte: startDate, lte: endDate },
                },
                include: {
                    kos: { select: { id: true, name: true, address: true } },
                    user: { select: { id: true, name: true, phone: true } },
                },
                orderBy: { startDate: "desc" },
            });

        } else if (user.role === "SOCIETY") {
            // Society → lihat booking miliknya sendiri
            booking = await prisma.books.findMany({
                where: {
                    user_id: user.id,
                    startDate: { gte: startDate, lte: endDate },
                },
                include: {
                    kos: { select: { id: true, name: true, address: true } },
                },
                orderBy: { startDate: "desc" },
            });
        } else {
            return res.json({
                status: false,
                message: "Role tidak dikenali.",
            }).status(403)
        }

        if (!booking || booking.length === 0) {
            return res.json({
                status: false,
                message: "Tidak ada histori booking untuk bulan tersebut.",
            }).status(404)
        }

        return res.json({
            status: true,
            role: user.role,
            month: Number(month),
            year: Number(year),
            total: booking.length,
            data: booking,
        }).status(200)

    } catch (error) {
        console.error("Error getBookHistory:", error);
        return res.json({
            status: false,
            message: `Terjadi kesalahan server: ${error}`,
        }).status(500)
    }
};


export const getBookReceipt = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { id } = req.params;
        const { download } = req.query; // <== tambahan query untuk mode download

        const book = await prisma.books.findUnique({
            where: { id: Number(id) },
            include: {
                kos: true,
                user: true,
            },
        });

        if (!book) {
            return res.status(404).json({
                status: false,
                message: "Booking tidak ditemukan",
            });
        }

        // ✅ Pastikan booking milik user society yang login
        if (user.role !== "SOCIETY" || book.user_id !== user.id) {
            return res.status(403).json({
                status: false,
                message: "Kamu tidak memiliki akses ke nota ini",
            });
        }

        if (book.Status !== "ACCEPT") {
            return res.status(400).json({
                status: false,
                message: "Nota hanya bisa dicetak jika booking sudah diterima oleh owner",
            });
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

        // 🧾 Jika tidak download, kirim JSON
        if (!download) {
            return res.status(200).json({
                status: true,
                message: "Nota berhasil diambil",
                data: receipt,
            });
        }

        // 📄 Kalau ada query ?download=true → buat PDF
        const doc = new PDFDocument({ margin: 50 });

        const folderPath = path.join(__dirname, "../../public/receipt");
        if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

        const margin = (doc.options.margin as number) || 50;
        const pageWidth = (doc.page.width as number);
        const contentWidth = pageWidth - margin * 7

        const filePath = path.join(folderPath, `nota_booking_${book.id}.pdf`);
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // 🔹 Header
        doc.fontSize(18).text("NOTA PEMESANAN KOS", { align: "center" });
        doc.text("------------------------------------------------------------------------------------");
        doc.moveDown(2);
        doc.fontSize(12);

        // Fungsi bantu untuk sejajarkan teks
        const addRow = (label: string, value: string | number) => {
            const spacing = 130; // Lebar kolom label (sesuaikan)
            const y = doc.y; // posisi vertikal sekarang
            doc.text(`${label}`, 50, y);
            doc.text(": ", 50 + spacing - 5, y);
            doc.text(String(value), 50 + spacing + 5, y);
            doc.moveDown();
        };

        // 🔹 Isi Nota
        addRow("Nama Penyewa", receipt.namaPenyewa);
        addRow("Nama Kos", receipt.namaKos);
        addRow("Alamat Kos", receipt.alamatKos);
        addRow("Tanggal Booking", receipt.tanggalBooking);
        addRow("Harga per Bulan", `Rp${receipt.hargaPerBulan.toLocaleString("id-ID")}`);
        addRow("Total Bayar", `Rp${receipt.totalBayar.toLocaleString("id-ID")}`);
        addRow("Status", receipt.status);
        addRow("Tanggal Cetak", receipt.tanggalCetak);

        doc.moveDown(4);
        doc.fontSize(16).text(
            "Terimakasih telah menggunakan website Kos Hunter :)",
            {
                align: "center",
                width: contentWidth,
            }
        );

        doc.end();

        // Setelah PDF selesai dibuat, kirim file ke user
        stream.on("finish", () => {
            res.download(filePath, `nota_booking_${book.id}.pdf`, (err) => {
                if (err) console.error("Gagal mengunduh file:", err);
            });
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: `Error saat mencetak nota: ${error}`,
        });
    }
}