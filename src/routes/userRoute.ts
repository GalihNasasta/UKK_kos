import express from "express";
import { getAllUser, createUser, auth, register, updUser, delUser } from "../controllers/userCont"
import { verifAddUser, verifAuth, verifEditUser, parseForm } from '../middlewares/verifUser'
import { verifRole, verifToken } from '../middlewares/auth'

const app = express()
app.use(express.json())

// app.post('/create')
app.get('/', [verifToken, verifRole(["OWNER"])], getAllUser)
app.post('/regis', [parseForm, verifAddUser], register)
app.post('/login', [parseForm, verifAuth], auth)
app.put('/:id',[parseForm, verifToken, verifRole(["SOCIETY", `OWNER`]), verifEditUser], updUser)
app.delete('/:id', [verifToken, verifRole(["OWNER"])], delUser)

export default app