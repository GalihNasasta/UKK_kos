import express from "express";
import { createReview, getReviewByKos, replyReview, delReview, updReview } from "../controllers/reviewCont"
import { verifAddReview, verifEditReview, verifReply } from "../middlewares/verifReview"
import { verifRole, verifToken } from "../middlewares/auth"

const app = express()
app.use(express.json())

app.get("/:kos_id", getReviewByKos)
app.post("/", [verifToken, verifRole(["SOCIETY"])], verifAddReview, createReview)
app.put("/edit/:id", [verifToken, verifRole(["SOCIETY"])], verifEditReview, updReview)
app.post("/reply/:id", [verifToken, verifRole(["OWNER"])], verifReply, replyReview)
app.delete("/:id", verifToken, delReview)

export default app