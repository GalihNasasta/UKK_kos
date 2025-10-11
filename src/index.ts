import express from 'express'
import cors from 'cors'
import path from 'path'
import UserRoute from './routes/userRoute';
import Kos from './routes/kosRoute';
import multer from 'multer';


const PORT: number = 8000
const app = express()
app.use(cors())
app.use(express.urlencoded({ extended: true }))

app.use('/user', UserRoute)
app.use('/kos', Kos)

// Setup multer
const upload = multer({ dest: "uploads/" })

// Set public folder as static
app.use(express.static(path.join(__dirname, `..`, `public`)))


app.listen(PORT, () => {
    console.log(`[server]: Server is running at http://localhost:${PORT}`);
    
})