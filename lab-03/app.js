
const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "books.db");

let db;

// GET all books with search, sorting, pagination and price filters
app.get("/books", async (request, response) => {
    try {
        const {
            search_q = "",
            order_by = "id",
            order = "ASC",
            limit = "10",
            offset = "0",
            min_price,
            max_price,
        } = request.query;

        const allowedColumns = ["id", "title", "author", "price", "pages"];

        if (!allowedColumns.includes(order_by)) {
            return response.status(400).json({
                message: "Invalid order_by column",
            });
        }

        const sortOrder = order.toUpperCase();

        if (!["ASC", "DESC"].includes(sortOrder)) {
            return response.status(400).json({
                message: "Order must be ASC or DESC",
            });
        }

        const limitNumber = Number(limit);
        const offsetNumber = Number(offset);

        if (
            !Number.isInteger(limitNumber) ||
            limitNumber < 1 ||
            !Number.isInteger(offsetNumber) ||
            offsetNumber < 0
        ) {
            return response.status(400).json({
                message: "Invalid limit or offset",
            });
        }

        let query = "SELECT * FROM book WHERE title LIKE ?";
        const params = [`%${search_q}%`];

        if (min_price !== undefined) {
            const min = Number(min_price);

            if (!Number.isFinite(min)) {
                return response.status(400).json({
                    message: "min_price must be a number",
                });
            }

            query += " AND price >= ?";
            params.push(min);
        }

        if (max_price !== undefined) {
            const max = Number(max_price);

            if (!Number.isFinite(max)) {
                return response.status(400).json({
                    message: "max_price must be a number",
                });
            }

            query += " AND price <= ?";
            params.push(max);
        }

        if (
            min_price !== undefined &&
            max_price !== undefined &&
            Number(min_price) > Number(max_price)
        ) {
            return response.status(400).json({
                message: "min_price cannot be greater than max_price",
            });
        }

        query += ` ORDER BY ${order_by} ${sortOrder} LIMIT ? OFFSET ?`;
        params.push(limitNumber, offsetNumber);

        const books = await db.all(query, params);

        response.status(200).json(books);
    } catch (error) {
        console.error(error.message);

        response.status(500).json({
            message: "Unable to retrieve books",
        });
    }
});

// GET one book by ID
app.get("/books/:bookId", async (request, response) => {
    try {
        const bookId = Number(request.params.bookId);

        if (!Number.isInteger(bookId) || bookId < 1) {
            return response.status(400).json({
                message: "Invalid book ID",
            });
        }

        const book = await db.get(
            "SELECT * FROM book WHERE id = ?",
            [bookId]
        );

        if (!book) {
            return response.status(404).json({
                message: "Book not found",
            });
        }

        response.status(200).json(book);
    } catch (error) {
        console.error(error.message);

        response.status(500).json({
            message: "Unable to retrieve book",
        });
    }
});

// POST - Add a new book
app.post("/books", async (request, response) => {
    try {
        const { title, author, price, pages } = request.body || {};

        if (typeof title !== "string" || title.trim() === "") {
            return response.status(400).json({
                message: "Title is required",
            });
        }

        if (typeof author !== "string" || author.trim() === "") {
            return response.status(400).json({
                message: "Author is required",
            });
        }

        if (
            price === undefined ||
            price === null ||
            price === "" ||
            !Number.isFinite(Number(price))
        ) {
            return response.status(400).json({
                message: "Price must be a valid number",
            });
        }

        if (Number(price) < 0) {
            return response.status(400).json({
                message: "Price cannot be negative",
            });
        }

        const pageNumber =
            pages === undefined || pages === null || pages === ""
                ? null
                : Number(pages);

        if (
            pageNumber !== null &&
            (!Number.isInteger(pageNumber) || pageNumber < 1)
        ) {
            return response.status(400).json({
                message: "Pages must be a positive integer",
            });
        }

        const result = await db.run(
            `INSERT INTO book (title, author, price, pages)
       VALUES (?, ?, ?, ?)`,
            [title.trim(), author.trim(), Number(price), pageNumber]
        );

        response.status(201).json({
            message: "Book added successfully",
            bookId: result.lastID,
        });
    } catch (error) {
        console.error(error.message);

        response.status(500).json({
            message: "Unable to add book",
        });
    }
});

// PUT - Update an existing book
app.put("/books/:bookId", async (request, response) => {
    try {
        const bookId = Number(request.params.bookId);
        const { title, author, price, pages } = request.body || {};

        if (!Number.isInteger(bookId) || bookId < 1) {
            return response.status(400).json({
                message: "Invalid book ID",
            });
        }

        if (typeof title !== "string" || title.trim() === "") {
            return response.status(400).json({
                message: "Title is required",
            });
        }

        if (typeof author !== "string" || author.trim() === "") {
            return response.status(400).json({
                message: "Author is required",
            });
        }

        if (
            price === undefined ||
            price === null ||
            price === "" ||
            !Number.isFinite(Number(price)) ||
            Number(price) < 0
        ) {
            return response.status(400).json({
                message: "Price must be a valid non-negative number",
            });
        }

        const pageNumber =
            pages === undefined || pages === null || pages === ""
                ? null
                : Number(pages);

        if (
            pageNumber !== null &&
            (!Number.isInteger(pageNumber) || pageNumber < 1)
        ) {
            return response.status(400).json({
                message: "Pages must be a positive integer",
            });
        }

        const result = await db.run(
            `UPDATE book
       SET title = ?, author = ?, price = ?, pages = ?
       WHERE id = ?`,
            [
                title.trim(),
                author.trim(),
                Number(price),
                pageNumber,
                bookId,
            ]
        );

        if (result.changes === 0) {
            return response.status(404).json({
                message: "Book not found",
            });
        }

        response.status(200).json({
            message: "Book updated successfully",
        });
    } catch (error) {
        console.error(error.message);

        response.status(500).json({
            message: "Unable to update book",
        });
    }
});

// DELETE - Delete a book
app.delete("/books/:bookId", async (request, response) => {
    try {
        const bookId = Number(request.params.bookId);

        if (!Number.isInteger(bookId) || bookId < 1) {
            return response.status(400).json({
                message: "Invalid book ID",
            });
        }

        const result = await db.run(
            "DELETE FROM book WHERE id = ?",
            [bookId]
        );

        if (result.changes === 0) {
            return response.status(404).json({
                message: "Book not found",
            });
        }

        response.status(200).json({
            message: "Book deleted successfully",
        });
    } catch (error) {
        console.error(error.message);

        response.status(500).json({
            message: "Unable to delete book",
        });
    }
});

// Initialize database and server
const initializeDBAndServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database,
        });

        console.log("Database connected successfully");

        await db.exec(`
      CREATE TABLE IF NOT EXISTS book (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        price REAL NOT NULL,
        pages INTEGER
      );
    `);

        console.log("Book table created successfully");

        const result = await db.get(
            "SELECT COUNT(*) AS count FROM book"
        );

        if (result.count === 0) {
            const books = [
                ["Harry Potter", "J.K. Rowling", 500, 350],
                ["Wings of Fire", "A.P.J. Abdul Kalam", 300, 200],
                ["The Alchemist", "Paulo Coelho", 250, 180],
                ["Atomic Habits", "James Clear", 450, 320],
                ["Rich Dad Poor Dad", "Robert Kiyosaki", 400, 280],
                ["Think Like a Monk", "Jay Shetty", 350, 240],
                ["The Power of Now", "Eckhart Tolle", 300, 220],
                ["Deep Work", "Cal Newport", 450, 290],
                ["Ikigai", "Hector Garcia", 250, 190],
                ["The Psychology of Money", "Morgan Housel", 400, 250],
            ];

            for (const book of books) {
                await db.run(
                    `INSERT INTO book (title, author, price, pages)
           VALUES (?, ?, ?, ?)`,
                    book
                );
            }

            console.log("10 sample books inserted");
        }

        app.listen(3000, () => {
            console.log("Server running at http://localhost:3000/");
        });
    } catch (error) {
        console.log(`Database error: ${error.message}`);
        process.exit(1);
    }
};

initializeDBAndServer();
