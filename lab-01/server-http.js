const http = require("http");

const server = http.createServer((request, response) => {
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end("Hello");
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
});
