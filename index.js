const express = require('express');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion,ObjectId  } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
// middle ware
app.use(cors());
app.use(express.json());


// jwt token

function verifyJET(req, res, next) {
    const authHeader = req.headers.authorization;
    if(!authHeader) {
        return res.status(401).send({ message : 'Invalid authorization'})
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token,process.env.ACCESS_TOKEN,(err,decoded) => {
        if(err) {
            return res.status(403).send({ message :'Forbidden access'})
        }
        req.decoded = decoded;
        next();
    })
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wv0xnnl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try {
        await client.connect();
        const productCollection = client.db('productCollection').collection('products');
        const orderCollection = client.db('productCollection').collection('orders');

        // AUTH jwt token 
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN, {
                expiresIn: '1d'
            });
            res.send({ accessToken });
        })



        // get data 
        app.get('/products',async(req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const query = {};
            const cursor = productCollection.find(query);
            let products;
            if(page || size){
                products = await cursor.skip(page*size).limit(size).toArray();
            }
            else{
                products = await cursor.toArray();
            }
          
            res.send(products);
        });

        // get data from id 

        app.get('/products/:id',async(req, res)=>{
            const id = req.params.id;
            const query = {_id :ObjectId(id)};
            const result = await productCollection.findOne(query);
            res.send(result);

        })


        // count data 
        app.get('/productCount',async(req, res) => {
            // const query = {};
            // const cursor = productCollection.find(query);
            const count = await productCollection.estimatedDocumentCount();
            res.send({count});
        });

         // use post to get products by ids
         app.post('/productByKeys', async(req, res) =>{
            const keys = req.body;
            const ids = keys.map(id => ObjectId(id));
            const query = {_id: {$in: ids}}
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        });

        // post order 
        app.post('/orders', async(req, res)=>{
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);

        });

        // get oder product
        app.get('/orders',verifyJET, async(req, res)=>{
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (email === decodedEmail) {
                const query = {email:email};
                const cursor =  orderCollection.find(query);
                const orders = await cursor.toArray();
                res.send(orders);
            }
            else{
                res.status(403).send({message: 'forbidden access'})
            }
        })

    }
   finally {

   }
}

run().catch(console.dir);

app.get('/', (req, res) =>{
    res.send('Server is running')
});
app.listen(port,()=>{
    console.log('listening on port',port);
});
