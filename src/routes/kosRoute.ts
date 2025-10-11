import express from "express"
import { getAllKos, addKos, updKos, delKos } from "../controllers/kosCont"
import { verifAddKos, verifEditKos } from "../middlewares/verifKos"
import { verifToken, verifRole } from "../middlewares/auth"
import { json } from "stream/consumers"
import { get } from "http"
import uploadFile from "../middlewares/kosUpload"


const app = express()
app.use(express.json())

app.get("/", [verifToken, verifRole(["SOCIETY", "OWNER"])], getAllKos)
app.post("/add", [verifToken, verifRole(["OWNER"])], uploadFile.single("file"), [verifAddKos], addKos)
app.put("/edit/:id", [verifToken, verifRole(["OWNER"])], uploadFile.single("file"), [verifEditKos], updKos)
app.delete("/del/:id", [verifToken, verifRole(["OWNER"])], delKos)

export default app