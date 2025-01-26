
// for local testing

const express = require('express');
const port = 3000; 

const app = express();

app.use(express.static('dist'));
app.use(express.static('public'));

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

