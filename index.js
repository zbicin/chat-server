const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

const app = express()
const port = 3000

app.use(cors())

const jsonParser = bodyParser.json()

const users = []

app.post('/login', jsonParser, (req, res) => {
  const user = {
    login: req.body.login
  }
  users.push(user);
  console.log(`User ${user.login} joined`);
  return res.json(user);
})

app.get('/', (req, res) => res.send('Hello World!'))


app.listen(port, () => console.log(`Example app listening on port ${port}!`))
