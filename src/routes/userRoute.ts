import express from "express";
import { getAllUser, createUser, auth, register, editUser, delUser } from "../controllers/userCont"
import { verifAddUser, verifAuth, verifEditUser } from '../middlewares/verifUser'
import { verifRole, verifToken } from '../middlewares/auth'

const app = express()
app.use(express.json())

// app.post('/create')
app.get('/', getAllUser)
app.post('/regis', [verifAddUser], register)
app.post('/login', [verifAuth], auth)
app.put('/:id', [verifToken, verifRole(["SOCIETY", `OWNER`]), verifEditUser], editUser)
app.delete('/:id', [verifToken, verifRole(["OWNER"])], delUser)

export default app