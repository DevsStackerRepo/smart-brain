const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt-nodejs');
const bodyParser = require('body-parser');
const knex = require('knex');


const app = express();

app.use(bodyParser.json());
app.use(cors());

const db = require('knex')({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    // port : 3306,
    user : 'Mutaki',
    password : '',
    database : 'smart-brain'
  }
});


const database = {
  users :[
    {
     id:'123',
     name:'John',
     email:'john@gmail.com',
     password:'cookies',
     entries:0,
     joined: new Date()
   },
   {
     id:'124',
     name:'Sally',
     email:'sally@gmail.com',
     password:'apples',
     entries:0,
     joined: new Date()
   }
  ]
}



app.get('/',(req,res) => {
  res.json(database.users);
})

app.post('/signin', (req, res) => {
  db.select('email', 'hash').from('login')
    .where('email', '=', req.body.email)
    .then(data => {
      const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
      if (isValid) {
        return db.select('*').from('users')
          .where('email', '=', req.body.email)
          .then(user => {
            res.json(user[0])
          })
          .catch(err => res.status(400).json('unable to get user'))
      } else {
        res.status(400).json('wrong credentials')
      }
    })
    .catch(err => res.status(400).json('wrong credentials'))
})

app.post('/register', (req, res) => {
  const { email, name, password } = req.body;
  const hash = bcrypt.hashSync(password);
    db.transaction(trx => {
      trx.insert({
        hash: hash,
        email: email
      })
      .into('login')
      .returning('email')
      .then(loginEmail => {
        return trx('users')
          .returning('*')
          .insert({
            email: loginEmail[0].email,
            name: name,
            joined: new Date()
          })
          .then(user => {
            res.json(user[0]);
          })
      })
      .then(trx.commit)
      .catch(trx.rollback)
    })
    .catch(err => res.status(400).json('unable to register'))
})


app.put('/image',(req,res) => {
  const {id} = req.body;
  db('users').where('id', '=', id)
  .increment('entries', 1)
  .returning('entries')
  .then(entries => {
    res.json(entries[0]);
  })
  .catch(err => res.status(400).json('unable to get entries'))
})

app.listen(3000, () => {
  console.log('app is running on port 3000');
})
