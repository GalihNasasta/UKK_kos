import express from "express"
import { getAllKos, addKos, updKos, delKos, getAvailableKos, getGenderKos, } from "../controllers/kosCont"
import { verifAddKos, verifEditKos } from "../middlewares/verifKos"
import { verifToken, verifRole } from "../middlewares/auth"
import { json } from "stream/consumers"
import { get } from "http"
import uploadFile from "../middlewares/kosUpload"


const app = express()
app.use(express.json())

app.get("/", getAllKos)
app.get("/available", getAvailableKos)
app.get("/filter", getGenderKos)
app.post("/add", [verifToken, verifRole(["OWNER"])], uploadFile.single("file"), [verifAddKos], addKos)
app.put("/edit/:id", [verifToken, verifRole(["OWNER"])], uploadFile.single("file"), [verifEditKos], updKos)
app.delete("/del/:id", [verifToken, verifRole(["OWNER"])], delKos)

export default app