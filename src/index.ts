import express from 'express'
import cors from 'cors'
import path from 'path'


const PORT: number = 8000
const app = express()
app.use(cors())



// Set public folder as static
app.use(express.static(path.join(__dirname, `..`, `public`)))


app.listen(PORT, () => {
    console.log(`[server]: Server is running at http://localhost:${PORT}`);
    
})