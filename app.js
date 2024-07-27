const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const expressValidator = require('express-validator');
const fileUpload = require('express-fileupload');
//require('dotenv').config();
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })
console.log(`./.env.${process.env.NODE_ENV}`)


// import routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/user');

// app
const app = express();

// db
console.log ("Database : " , process.env.DATABASE);
mongoose
    .connect(process.env.DATABASE, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true
    })
    .then(() => console.log('DB Connected'))
    .catch(err => console.log(err));

// middlewares
app.use(morgan('combined'));
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));
app.use(cookieParser());
app.use(express.json());
app.use(fileUpload());
//app.use(expressValidator());  // TODO_SP check how to use validator
app.use(cors());

// routes middleware
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

const port = process.env.MS_AUTH_PORT || 5000;
const host = process.env.MS_AUTH_HOST || 'localhost';

app.listen(port, host, () => {
    console.log(`Auth Service is running on http://${host}:${port}`);
});
