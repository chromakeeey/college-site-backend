const server = require('./server');
const PORT = process.env.PORT;

server.listen(PORT, () => {
    console.log(`App has been started on port ${PORT}...`);
});
