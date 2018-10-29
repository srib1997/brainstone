const functions = require('firebase-functions')
const express = require('express')
const admin = require('firebase-admin')
const bodyParser = require('body-parser')
const session = require('express-session')
const FileStore = require('session-file-store')(session)

const firebase = admin.initializeApp({
  credential: admin.credential.cert(require('./credentials/server')),
  databaseURL: "https://withladder-4979b.firebaseio.com"
})
const app = express()

app.use(bodyParser.json())
app.use(session({
  secret: 'geheimnis',
  saveUninitialized: true,
  store: new FileStore({path: '/tmp/sessions', secret: 'geheimnis'}),
  resave: false,
  rolling: true,
  httpOnly: true,
  cookie: { maxAge: 604800000 } // 一個星期
}))

app.use((req, res, next) => {
  req.firebaseSever = firebase
  next()
})

app.post('/api/login', (req, res) => {
  if (!req.body) return res.sendStatus(400)

  const token = req.body.token
  firebase.auth().verifyIdToken(token)
    .then((decodedToken) => {
      req.session.decodedToken = decodedToken
      return decodedToken
    })
    .then((decodedToken) => res.json({ status: true, decodedToken}))
    .catch((error) => res.json({ error }))
})

app.post('/api/logout', (req, res) => {
  req.session.decodedToken = null 
  res.json({ status: ture })
})

exports.app = functions.https.onRequest(app)
