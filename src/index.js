require('dotenv').config()
const express = require('express')
const app = express()
const port = 4000

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.get('/login', (req,res)=>{
    res.send('<h1>Yo no log in here ma bruh!</h1>')
})

app.get('/instagram', (req,res)=>{
    res.send('<h1>Follow on @abhay_pandey_1</h1>')
})

app.listen(process.env.PORT, () => {
    console.log(`Serving on localhost http://localhost:${process.env.PORT}`)
})