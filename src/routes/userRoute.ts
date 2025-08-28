import express from "express";
import { createUser, auth, register, upToOwner } from "../controllers/userCont"
import { verifAddUser, verifAuth, verifEditUser } from '../middlewares/verifUser'
import { verifRole, verifToken } from '../middlewares/auth'

const app = express()
app.use(express.json())

// app.post('/create')
app.post('/regis', [verifAddUser], register)
app.post('/login', [verifAuth], auth)
app.put('/up-owner', [verifToken, verifRole([`SOCIETY`, `OWNER`]), verifEditUser], upToOwner)

export default app