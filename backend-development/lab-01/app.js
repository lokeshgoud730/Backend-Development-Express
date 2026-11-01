const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use((request, response, next) => {
    response.on("finish", () => {
        console.log(
            `${request.method} ${request.url} - ${response.statusCode}`
        );
    });

    next();
});

app.get("/", (request, response) => {
    response.status(200).send("Welcome to my Node.js server!");
});

app.get("/about", (request, response) => {
    response.status(200).json({
        name: "Lokesh",
        section: "CSE 2A"
    });
});

app.get("/time", (request, response) => {
    const currentTime = new Date();
    response.status(200).send(currentTime.toString());
});

app.use((request, response) => {
    response.status(404).send("404 - Page Not Found");
});

app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
});
