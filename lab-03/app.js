const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "books.db");

let db;

// GET all books with search, sorting, pagination and price filtering
app.get("/books", async (request, response) => {
    try {
        const {
            search_q = "",
            order_by = "id",
            order = "ASC",
            limit = 10,
            offset = 0,
            min_price,
            max_price
        } = request.query;

        const allowedColumns = ["id", "title", "author", "price", "pages"];

        if (!allowedColumns.includes(order_by)) {
            return response.status(400).json({
                message: "Invalid order_by column"
            });
        }

        const sortOrder = order.toUpperCase();

        if (!["ASC", "DESC"].includes(sortOrder)) {
            return response.status(400).json({
                message: "Order must be ASC or DESC"
            });
        }

        const parsedLimit = Number(limit);
        const parsedOffset = Number(offset);

        if (
            !Number.isInteger(parsedLimit) ||
            !Number.isInteger(parsedOffset) ||
            parsedLimit <= 0 ||
            parsedOffset < 0
        ) {
            return response.status(400).json({
                message: "Limit must be positive and offset must be non-negative"
            });
        }

        if (
            (min_price !== undefined && (!Number.isFinite(Number(min_price)) || min_price.trim() === "")) ||
            (max_price !== undefined && (!Number.isFinite(Number(max_price)) || max_price.trim() === ""))
        ) {
            return response.status(400).json({
                message: "Price filters must be valid numbers"
            });
        }

        const conditions = [];
        const values = [];

        if (search_q) {
            conditions.push("title LIKE ?");
            values.push(`%${search_q}%`);
        }

        if (min_price !== undefined) {
            conditions.push("price >= ?");
            values.push(Number(min_price));
        }

        if (max_price !== undefined) {
            conditions.push("price <= ?");
            values.push(Number(max_price));
        }

        const whereClause = conditions.length
            ? `WHERE ${conditions.join(" AND ")}`
            : "";

        const query = `
            SELECT * FROM book
            ${whereClause}
            ORDER BY ${order_by} ${sortOrder}
            LIMIT ? OFFSET ?;
        `;

        values.push(parsedLimit, parsedOffset);

        const books = await db.all(query, values);

        response.status(200).json(books);
    } catch (error) {
        response.status(500).json({
            message: "Failed to fetch books",
            error: error.message
        });
    }
});

// GET book by ID
app.get("/books/:bookId", async (request, response) => {
    try {
        const { bookId } = request.params;

        const book = await db.get(
            "SELECT * FROM book WHERE id = ?;",
            [bookId]
        );

        if (!book) {
            return response.status(404).json({
                message: "Book not found"
            });
        }

        response.status(200).json(book);
    } catch (error) {
        response.status(500).json({
            message: "Failed to fetch book",
            error: error.message
        });
    }
});

// POST a new book
app.post("/books", async (request, response) => {
    try {
        const { title, author, price, pages } = request.body || {};

        if (!title || typeof title !== "string" || !title.trim()) {
            return response.status(400).json({
                message: "Title is required"
            });
        }

        if (!author || typeof author !== "string" || !author.trim()) {
            return response.status(400).json({
                message: "Author is required"
            });
        }

        if (price === undefined || price === null || price === "" || !Number.isFinite(Number(price))) {
            return response.status(400).json({
                message: "Price must be a valid number"
            });
        }

        if (pages !== undefined && pages !== null && pages !== "" && (!Number.isInteger(Number(pages)) || Number(pages) <= 0)) {
            return response.status(400).json({
                message: "Pages must be a positive number"
            });
        }

        const result = await db.run(
            `INSERT INTO book (title, author, price, pages)
             VALUES (?, ?, ?, ?);`,
            [
                title.trim(),
                author.trim(),
                Number(price),
                pages ? Number(pages) : null
            ]
        );

        response.status(201).json({
            message: "Book added successfully",
            bookId: result.lastID
        });
    } catch (error) {
        response.status(500).json({
            message: "Failed to add book",
            error: error.message
        });
    }
});

// PUT update book
app.put("/books/:bookId", async (request, response) => {
    try {
        const { bookId } = request.params;
        const { title, author, price, pages } = request.body || {};

        if (!title || typeof title !== "string" || !title.trim()) {
            return response.status(400).json({
                message: "Title is required"
            });
        }

        if (!author || typeof author !== "string" || !author.trim()) {
            return response.status(400).json({
                message: "Author is required"
            });
        }

        if (price === undefined || price === null || price === "" || !Number.isFinite(Number(price))) {
            return response.status(400).json({
                message: "Price must be a valid number"
            });
        }

        if (pages !== undefined && pages !== null && pages !== "" && (!Number.isInteger(Number(pages)) || Number(pages) <= 0)) {
            return response.status(400).json({
                message: "Pages must be a positive number"
            });
        }

        const result = await db.run(
            `UPDATE book
             SET title = ?, author = ?, price = ?, pages = ?
             WHERE id = ?;`,
            [
                title.trim(),
                author.trim(),
                Number(price),
                pages ? Number(pages) : null,
                bookId
            ]
        );

        if (result.changes === 0) {
            return response.status(404).json({
                message: "Book not found"
            });
        }

        response.status(200).json({
            message: "Book updated successfully"
        });
    } catch (error) {
        response.status(500).json({
            message: "Failed to update book",
            error: error.message
        });
    }
});

// DELETE book
app.delete("/books/:bookId", async (request, response) => {
    try {
        const { bookId } = request.params;

        const result = await db.run(
            "DELETE FROM book WHERE id = ?;",
            [bookId]
        );

        if (result.changes === 0) {
            return response.status(404).json({
                message: "Book not found"
            });
        }

        response.status(200).json({
            message: "Book deleted successfully"
        });
    } catch (error) {
        response.status(500).json({
            message: "Failed to delete book",
            error: error.message
        });
    }
});

// Initialize database and server
const initializeDBAndServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        console.log("Database connected successfully");

        await db.exec(`
            CREATE TABLE IF NOT EXISTS book (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                author TEXT,
                price INTEGER,
                pages INTEGER
            );
        `);

        console.log("Book table created successfully");

        const result = await db.get(
            "SELECT COUNT(*) AS count FROM book;"
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
                ["The Psychology of Money", "Morgan Housel", 400, 250]
            ];

            for (const book of books) {
                await db.run(
                    `INSERT INTO book (title, author, price, pages)
                     VALUES (?, ?, ?, ?);`,
                    book
                );
            }

            console.log("10 sample books inserted");
        }

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.log(`Database error: ${error.message}`);
        process.exit(1);
    }
};

initializeDBAndServer();