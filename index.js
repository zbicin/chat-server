const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const etag = require('etag')
const readline = require('readline');
const https = require('https')
const child_process = require('child_process');
const fs = require('fs');

const defaultPort = 3000;
const messagesFileName = 'messages.txt';

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

  const messages = []
  restoreMessages((restoredMessages) => {
    messages.push(...restoredMessages);
  });

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
    storeMessage(message, (err) => {
      if (err) {
        res.statusCode(500);
        res.json(err);
        return;
      }

      if (message.body === '/joke') {
        getJoke((joke) => {
          const jokeMessage = {
            body: joke,
            sentBy: 'Joke Bot'
          };

          storeMessage(jokeMessage, (err2) => {
            if (err2) {
              res.statusCode(500);
              res.json(err2);
              return;
            }
            return res.json(message);
          });
        });
      } else {
        return res.json(message);
      }
    });
  })

  app.get('/whoami', (req, res) => {
    child_process.exec('whoami', (err, stdout) => {
      if (err) {
        res.statusCode(500);
        res.json(err);
      }

      res.end(stdout);
    });
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

  function restoreMessages(callback) {
    fs.readFile(messagesFileName, {}, (err, data) => {
      if (err) {
        callback([]);
      } else {
        callback(JSON.parse(data.toString()));
      }
    });
  }

  function storeMessage(message, callback) {
    messages.push(message);
    fs.writeFile(messagesFileName, JSON.stringify(messages, null, 2), callback);
  }
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