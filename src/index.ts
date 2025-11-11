import express from 'express'
import cors from 'cors'
import path from 'path'
import User from './routes/userRoute';
import Kos from './routes/kosRoute';
import Facility from './routes/facilityRoute'
import Book from './routes/bookRoute'
import Review from './routes/reviewRoute'
// import Image from './routes/imageRoute'
import multer from 'multer';


const PORT: number = 8000
const app = express()
app.use(cors())
app.use(express.urlencoded({ extended: true }))

app.use('/user', User)
app.use('/kos', Kos)
app.use('/facility', Facility)
app.use('/book', Book)
app.use('/review', Review)
// app.use('/image', Image)

// Setup multer
const upload = multer({ dest: "uploads/" })

// Set public folder as static
app.use(express.static(path.join(__dirname, `..`, `public`)))


app.listen(PORT, () => {
    console.log(`[server]: Server is running at http://localhost:${PORT}`);
    
})