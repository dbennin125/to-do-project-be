require('dotenv').config();

const client = require('./lib/client');

// Initiate database connection
client.connect();

const app = require('./lib/app');

const PORT = process.env.PORT || 7890;


const ensureAuth = require('./lib/auth/ensure-auth');
const createAuthRoutes = require('./lib/auth/create-auth-routes');
const authRoutes = createAuthRoutes({
  selectUser(email) {
    return client.query(`
            SELECT id, email, hash
            FROM users
            WHERE email = $1;
        `,
    [email]
    ).then(result => result.rows[0]);
  },
  insertUser(user, hash) {
    console.log(user);
    return client.query(`
            INSERT into users (email, hash)
            VALUES ($1, $2)
            RETURNING id, email;
        `,
    [user.email, hash]
    ).then(result => result.rows[0]);
  }
});

//localhost:3000/auth/signin-this route is verified and works
//localhost:3000/auth/signup-this route is verified and works

//creates login and signin which you post with body
app.use('/auth', authRoutes);
//all other routes should require the /api login
app.use('/api', ensureAuth);

app.get('/api/todos', async(req, res) => {
  //will display only the specific user's data, all other data will not be shown.
  const data = await client.query('SELECT * from todos where owner_id=$1', [req.userId]);
  
  res.json(data.rows);
});
// create a new item to-do in to do list
app.post('/api/todos', async(req, res) => {
  //will post a new item (since is_completed is default false, it's not needed in array) only the specific user's data, all other data will not be shown.
  const data = await client.query(`insert into todos (item, importance, owner_id)
  values($1, $2, $3) returning *`, [req.body.item, req.body.importance, req.userId]);
  
  res.json(data.rows);
});
//update to item completed
app.put('/api/todos/:id', async(req, res) => {
  //will display only the specific user's data, all other data will not be shown.
  const data = await client.query(`update todos 
  set is_completed=true
  where id=$1 and owner_id=$2
  returning *`, [req.params.id, req.userId]);
  
  res.json(data.rows);
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Started on ${PORT}`);
});

module.exports = app;
