const http = require("http");

const server = http.createServer((request, response) => {
    response.end("Hello everyone");
});

server.listen(3000, () => {
    console.log("Server running at port 3000");
});