import express from "express"
import { addBook, updBook, delBook, getAllBook, getBookReceipt, getHistoryBook } from "../controllers/bookCont";
import { verifAddBook, verifEditBook } from "../middlewares/verifBook";
import { verifRole, verifToken } from "../middlewares/auth";

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get("/", getAllBook)
app.get("/history", [verifToken, verifRole(["OWNER"])], getHistoryBook)
app.get("/receipt/pdf/:id", [verifToken, verifRole(["SOCIETY"])], getBookReceipt)
app.post("/", [verifToken, verifRole(["SOCIETY"])], verifAddBook, addBook)
app.put("/:id", [verifToken, verifRole(["SOCIETY", "OWNER"])], verifEditBook, updBook)
app.delete("/:id", verifToken, delBook)

export default app