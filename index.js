const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const { query } = require('express');
require('dotenv').config();

const port = 5000 || process.env.PORT;

const app = express();

//Middleware
app.use(cors());
app.use(express.json());

//Database Connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nvyyp05.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//API 
async function run() {
    try{
        const categoriesCollection = client.db("copshop").collection("categories");
        const productsCollection = client.db("copshop").collection("products");
        const usersCollection = client.db("copshop").collection("users");
        const ordersCollection = client.db("copshop").collection("orders");

        // Get All Categories
        app.get('/categories', async (req, res) => {
            let query = {};
            const categories = await categoriesCollection.find(query).toArray();
            res.send(categories);
        });

        // Get One Category
        app.get('/categories/:id', async (req, res) => {
            let query = { _id: ObjectId(req.params.id) };
            const category = await categoriesCollection.findOne(query);
            res.send(category);
        });

        // Get Products
        app.get('/products/:category', async (req, res) => {
            const category = req.params.category;
            let query = {};
            if(category){
                query = {category: category};
            };
            const products = await productsCollection.find(query).toArray();
            res.send(products);
        });

        // Get Advertised Products
        app.get('/advertisedproducts', async (req, res) => {
            let query = { advertise: true };
            const products = await productsCollection.find(query).toArray();
            res.send(products);
        });

        // Get Products By Email
        app.get('/products', async (req, res) => {
            const email = req.query.email;
            const query = {email: email};
            const products = await productsCollection.find(query).toArray();
            res.send(products);
        });

        // Add Product
        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.json(result);
        });

        // Update Product with to Advertise
        app.put('/products/:id', async (req, res) => {
            const id = req.params.id;
            const product = req.body;
            const query = { _id: ObjectId(id) };
            const options = { upsert: true };
            const newValues = { $set: {advertise: true} };
            const result = await productsCollection.updateOne(query, newValues, options);
            res.send(result);
        });

        // Check if user is Admin
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = {email};
            const user = await usersCollection.findOne(query);
            res.send({isAdmin: user?.role === 'admin'});
        });

        // Check if user is Seller
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = {email};
            const user = await usersCollection.findOne(query);
            res.send({isSeller: user?.role === 'seller'});
        });

        // Check if user is Buyer
        app.get('/users/buyer/:email', async (req, res) => {
            const email = req.params.email;
            const query = {email};
            const user = await usersCollection.findOne(query);
            res.send({isBuyer: user?.role === 'buyer'});
        });

        // JWT
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = {email: email};
            const user = await usersCollection.findOne(query);
            if(user){
                const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '1d'});
                return res.send({accessToken: token});
            }
            console.log(user);
            res.status(403).send({accessToken: ''});
        });
        
        // Post User
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.json(result);
        });

        //Post Order
        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.json(result);
        });
    }
    finally{

    }
}

run().catch(console.log);

app.get('/', (req, res) => {
    res.send('Server is up');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});