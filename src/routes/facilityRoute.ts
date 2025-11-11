import express from "express";
import { addFacility, getFacilityByKos, updateFacility, deleteFacility, getAllFacility } from "../controllers/facilityCont";
import { verifAddFacility, verifEditFacility } from "../middlewares/verifFacility";
import { verifRole, verifToken } from "../middlewares/auth";

const app = express()

app.get("/", getAllFacility)
app.get("/:kos_id", getFacilityByKos)
app.post("/", [verifToken, verifRole(["OWNER"])], verifAddFacility, addFacility)
app.put("/:kos_id/:id", [verifToken, verifRole(["OWNER"])], verifEditFacility, updateFacility)
app.delete("/:kos_id/:id", [verifToken, verifRole(["OWNER"])], deleteFacility)

export default app