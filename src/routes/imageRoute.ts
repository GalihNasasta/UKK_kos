// import express from "express";
// import { verifRole, verifToken } from "../middlewares/auth";
// import { getKosImg, upKosImg, delKosImg } from "../controllers/imageCont";
// import { upKosImg } from "../middlewares/verifImage";

// const app = express()

// app.get("/:kos_id", getKosImg)
// app.post("/", [verifToken, verifRole(["OWNER"])], upKosImg.fields([{ name: "thumbnail", maxCount: 1 }, { name: "photos", maxCount: 4 }]), addPicture)
// app.put("/updImage/:kos_id", [verifToken, verifRole(["OWNER"]), upKosImg.single("image")], updKosUpload)
// app.delete("/:img_id", [verifToken, verifRole(["OWNER"])], delPictureKos)

// export default app