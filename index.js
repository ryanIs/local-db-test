/**
 * index.js
 * 
 * Simple CRUD application using sqlite3. Implements Node and express.
 */
let sqlite3 = require('sqlite3').verbose()
let db = new sqlite3.Database('fs3.db')
let id = 0

const WEB_PORT = 8000

const getId = () => {
  return id++
}

const schemas = {
  user(data) {
    return {
      id: data.id,
      username: data.username,
      password: data.password,
      createdAt: data.createdAt,
    }
  }
}

db.serialize(() => {
  db.run("DROP TABLE users")
    db.run("CREATE TABLE users (id TEXT, username TEXT, password TEXT, createdAt TEXT)")

    const now = Date.now()

    for (let i = 0; i < 10; i++) {
    const params = [getId(),`name_${i}`, `password_${i}`, `${now.toString()})`]
        db.run(`INSERT INTO users (id, username, password, createdAt) VALUES (?, ?, ?, ?)`, params)
    }

    db.each("SELECT id, username, password, createdAt FROM users", (err, row) => {
    })
})

const databaseInteraction = {

  async getRows() {
    return new Promise((resolve, reject) => {
      db.serialize(_ => {
        let sql = `SELECT id, username, password, createdAt FROM users ORDER BY username`
        db.all(sql, [], (error, rows) => {
          if (error) {
            reject(error) 
          }
          resolve(rows)
        })
      })
    })
  },
  
  async deleteRow(id) {
    return new Promise((resolve, reject) => {
      db.serialize(async () => {
        db.run("DELETE from users where ID = ?", [id], e => {
          if (e) {
            reject()
          }                
        })
        resolve()
      })
    })
  },
  
  async createRow({title}) {
    db.serialize(_ => {
      let user = {}
      db.run('INSERT INTO users (username) VALUES (?)', [user], function(error) {
        if (error) {
          return console.error(error.message)                
        }
        console.log(`Inserted row with id: ${this.lastID}`)            
      })
    })
  }
  
}

let express = require('express')
let app = express()

app.get('/', (request, response) => {
    response.sendFile('index.html', {
        root: __dirname
    })
}) 

// (Chris): Create User
app.post('/', (request, response) => {

    // Uses `body-parser` dependency:
    let { id, username, password, createdAt } = request.body
    let userData = { id, username, password, createdAt }

    try {
      databaseInteraction.createRow(userData)
      response.send(201)        
    } catch (error) {
      console.error(`error`, error)
      response.end()
    }

})

app.get('/create', async (request, response) => {

  var myVariables = request.query;    

  if(myVariables != null) {
    if(myVariables.username != null) {
      if(myVariables.password != null) {
          
        db.serialize(() => {
            
          const now = Date.now()
      
          const params = [getId(),`${myVariables.username}`, `${myVariables.password}`, `${now.toString()}`]
          db.run(`INSERT INTO users (id, username, password, createdAt) VALUES (?, ?, ?, ?)`, params)
          response.send("Row added!")
        
        })
          
      } else {
        response.send("password is invalid")
      }
    } else {
        response.send("username is invalid")
    }
  }

  response.send(myVariables)

})

app.get('/read', async (request, response) => {
  const rows = await databaseInteraction.getRows()
    response.json( rows )
})

app.get('/update', (request, response) => {
    
})

app.get('/delete/:id', async (request, response) => {
  const id = request.params.id
  await databaseInteraction.deleteRow(id)
  const rows = await databaseInteraction.getRows()
  response.json(rows)
})

app.listen(WEB_PORT)

console.log(`SERVER RUNNING! PORT: ${WEB_PORT}`)