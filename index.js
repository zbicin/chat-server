const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const etag = require('etag')
const readline = require('readline');
const https = require('https')

const defaultPort = 3000;

if (process.argv.includes('--prompt')) {
  const rl = readline.createInterface(process.stdin, process.stdout);
  rl.question('Which port should I use? ', (answer) => {
    if (isNaN(answer)) {
      console.warn(`Invalid port. Falling back to default: ${defaultPort}`);
      runServer(defaultPort);
    } else {
      runServer(answer);
    }
  });
} else {
  runServer(defaultPort);
}

function runServer(port) {
  const app = express()

  app.use(cors())

  const jsonParser = bodyParser.json()

  const users = []

  const messages = [
    { body: 'test message', sentBy: 'test user' }
  ]

  app.post('/login', jsonParser, (req, res) => {
    const user = {
      login: req.body.login
    }
    users.push(user);
    console.log(`User ${user.login} joined`);
    return res.json(user);
  })

  app.post('/sendMessage', jsonParser, (req, res) => {
    const message = {
      body: req.body.message,
      sentBy: req.body.login
    }
    messages.push(message)

    if (message.body === '/joke') {
      getJoke((joke) => {
        const jokeMessage = {
          body: joke,
          sentBy: 'Joke Bot'
        };
        messages.push(jokeMessage);
        return res.json(message);
      });
    } else {
      return res.json(message);
    }
  })

  app.get('/messages', (req, res) => {
    res.setHeader('ETag', etag(JSON.stringify(messages)));
    return res.json(messages)
  })

  app.head('/messages', (req, res) => {
    res.setHeader('ETag', etag(JSON.stringify(messages)));
    res.end();
  })

  app.get('/', (req, res) => res.send('Hello World!'))


  app.listen(port, () => console.log(`Example app listening on port ${port}!`))
}

function getJoke(callback) {
  https.get({
    hostname: 'icanhazdadjoke.com',
    headers: { Accept: 'text/plain' }
  }, (res) => {
    if (res.statusCode !== 200) {
      callback('no joke');
      return;
    }
    let joke = '';
    res.on('data', (chunk) => {
      joke += chunk;
    });
    res.on('end', () => {
      callback(joke);
    });
  });
}