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

// localhost:3000/auth/signin
//localhost:3000/auth/signup
//creates login and signin which you post with body
app.use('/auth', authRoutes);
//all other routes should require the /api login
app.use('/api', ensureAuth);

app.get('/api/todos', async(req, res) => {
  const data = await client.query('SELECT * from todos where owner_id=$1', [req.userId]);
  
  res.json(data.rows);
});


app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Started on ${PORT}`);
});

module.exports = app;
