const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const app = express()
const port = 3000

app.use(cors())

const jsonParser = bodyParser.json()

const messages = []

const users = []

app.post('/login', jsonParser, (req, res) => {
  const user = {
    login: req.body.login
  }
  users.push(user);
  return res.json(user);
})

app.post('/sendMessage', jsonParser, (req, res) => {
  const message = {
    body: req.body.message,
    sentBy: req.body.login
  }
  messages.push(message)
  return res.json(message);
})

app.get('/messages', (req, res) => {
  return res.json(messages)
})

app.get('/', (req, res) => res.send('Hello World!'))


app.listen(port, () => console.log(`Example app listening on port ${port}!`))
