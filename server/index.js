const {
    client,
    createTables,
    createUser,
    createProduct,
    createFavorite,
    fetchUsers,
    fetchProducts,
    fetchFavorites,
    destroyFavorite,
    authenticate,
    findUserByToken
} = require('./db');
const express = require('express');
const app = express();
app.use(express.json());

//for deployment only
const path = require('path');
app.get('/', (req, res)=> res.sendFile(path.join(__dirname, '../client/dist/index.html')));
app.use('/assets', express.static(path.join(__dirname, '../client/dist/assets'))); 

const isLoggedIn = async(req, res, next)=> {
  try {
    req.user = await findUserByToken(req.headers.authorization);
    next();
  }
  catch(ex){
    next(ex);
  }
};


app.post('/api/auth/login', async(req, res, next)=> {
  try {
    res.send(await authenticate(req.body));
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/auth/me', isLoggedIn, (req, res, next)=> {
  try {
    res.send(req.user);
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/users',  async(req, res, next)=> {
    try {
        // console.log("get user ",req);
        // console.log("get user ",req.user.id);
        res.send(await fetchUsers());
    }
    catch(ex){
        next(ex);
    }
});

app.get('/api/products',  async(req, res, next)=> {
    try {
        // console.log("get fav ",req);
        // console.log("get fav ",req.user.id);
        res.send(await fetchProducts());
    }
    catch(ex){
        next(ex);
    }
});

app.get('/api/users/:user_id/favorites', isLoggedIn,  async(req, res, next)=> {
    try {
        // console.log("get user fav ", req.params.user_Id);
        // console.log("get user fav ",req.user.id);
        if(req.params.user_id !== req.user.id){
            const error = Error('not authorized');
            error.status = 401;
            throw error;
        }
        res.send(await fetchFavorites(req.params.user_id));
    }
    catch(ex){
        next(ex);
    }
});

app.delete('/api/users/:user_id/favorites/:id', isLoggedIn,  async(req, res, next)=> {
    try {
        // console.log("del user fav ",req.params.user_id);
        // console.log("del user fav ",req.user.id);
        if(req.params.user_id !== req.user.id){
          const error = Error('not authorized');
          error.status = 401;
          throw error;
        }
        await destroyFavorite({user_id: req.params.user_id, id: req.params.id});
        res.sendStatus(204);
    }
    catch(ex){
        next(ex);
    }
});

app.post('/api/users/:user_id/favorites', isLoggedIn,  async(req, res, next)=> {
    try {
        // console.log("add user fav ",req.params.user_id);
        // console.log("add user fav ",req.user.id);
        if(req.params.user_id !== req.user.id){
          const error = Error('not authorized');
          error.status = 401;
          throw error;
        }
        res.status(201).send(await createFavorite({ user_id: req.params.user_id, product_id: req.body.product_id}));
    }
    catch(ex){
        next(ex);
    }
});

app.use((err, req, res, next)=> {
    res.status(err.status || 500).send({ error: err.message || err});
});
const init = async()=> {
    console.log('connecting to database');
    await client.connect();
    console.log('connected to database');
    await createTables();
    console.log('created tables');
    const [me, you, she, he, phone, bike, watch, TV] = await Promise.all([
        createUser({ username: 'me', password: 'me!' }),
        createUser({ username: 'you', password: 'you!!' }),
        createUser({ username: 'she', password: 'shhh' }),
        createUser({ username: 'he', password: 'shhh!' }),
        createProduct({ name: 'phone'}),
        createProduct({ name: 'bike'}),
        createProduct({ name: 'watch'}),
        createProduct({ name: 'TV'}),
    ]);

    const favorites = await Promise.all([
    createFavorite({ user_id: me.id, product_id: phone.id}),
    createFavorite({ user_id: he.id, product_id: bike.id}),
    createFavorite({ user_id: you.id, product_id: watch.id}),
    createFavorite({ user_id: she.id, product_id: TV.id}),
    ]);
    
    const port = process.env.PORT || 3000;
    
    console.log(await fetchUsers());
    console.log(await fetchProducts());

    console.log(await fetchFavorites(me.id));
    const favorite = await createFavorite({ user_id: me.id, product_id: TV.id });
    app.listen(port, ()=> console.log(`listening on port ${port}`));

};

init();