const express = require("express");

const app = express();

app.use((request, response, next) => {
    response.on("finish", () => {
        console.log(
            `${request.method} ${request.url} - ${response.statusCode}`
        );
    });

    next();
});

app.get("/", (request, response) => {
    response.send("Welcome to my Node.js server!");
});

app.get("/about", (request, response) => {
    response.json({
        name: "Lokesh",
        section: "CSE 2A"
    });
});

app.get("/time", (request, response) => {
    const currentTime = new Date();

    response.send(currentTime.toString());
});

app.use((request, response) => {
    response.status(404).send("404 - Page Not Found");
});

app.listen(3000, () => {
    console.log("Server running at port 3000");
});