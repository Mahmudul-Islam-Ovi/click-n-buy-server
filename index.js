const express = require('express');
const { MongoClient, ServerApiVersion,ObjectId  } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;
// middle ware
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wv0xnnl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try {
        await client.connect();
        const productCollection = client.db('productCollection').collection('products');

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
