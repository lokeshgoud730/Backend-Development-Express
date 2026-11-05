Lab 3 – REST API, Query Parameters, Validation and Debugging

Introduction

In this lab, I worked on creating a REST API using Node.js, Express.js and SQLite.

I continued the books application that I created in Lab 2. In this lab, I added more features to the application and learned how to handle different API requests.

Student Details

Name: Lokesh
Section: CSE 2A
Course: Backend Development Fundamentals
College: Aurora Deemed To Be University
Faculty:Sai Shiva Teja Sir

 What I Did in This Lab

First, I created a new folder named `lab-03` and initialized a Node.js project using `npm init -y`.

Then I installed Express.js, SQLite and Nodemon.

After that, I created an `app.js` file and connected my application to the SQLite database.

I created a `book` table to store book details such as ID, title, author, price and pages.

I implemented the following operations:

1. GET:I used this method to get all the books and also to get a particular book using its ID.
2. POST: I used this method to add new books to my database.
3. PUT: I used this method to update the details of an existing book.
4. DELETE: I used this method to delete a book from the database.

Query Parameters

I also added query parameters to the GET API.

- I used `search_q` to search for books using their titles.
- I used `order_by` and `order` to sort the books.
- I used `limit` and `offset` to display books in smaller groups.
- I used `min_price` and `max_price` to filter books based on their prices.

Validation and Error Handling

I added validation to check whether the title and author were provided and whether the price was a valid number.

I tested invalid inputs and checked that the API returned a `400 Bad Request` response.

I also handled situations where a book was not available in the database by returning a `404 Not Found` response.

For successful requests, I used the appropriate status codes, such as `200 OK` and `201 Created`.

Testing Using Postman

After completing the API routes, I used Postman to test my application.

I tested GET, POST, PUT and DELETE requests.

I also tested searching, sorting, pagination and price filtering.

During testing, I faced an error while adding a book because I selected the wrong body format in Postman. I changed the body format to JSON, and the POST request started working correctly.

I also tested missing fields, invalid prices and requests for books that did not exist.

I captured screenshots of my testing results and saved them in the `screenshots` folder.

Debugging

While doing this lab, I learned how to identify and fix common errors such as:

- Port already in use.
- Incorrect file paths.
- SQLite table-name errors.
- Missing `await` in database operations.
- Incorrect request body format in Postman.

How to Run My Project

First, I opened the terminal inside the `lab-03` folder and installed the required packages.

```bash
npm install
```

Then I started my server using:

```bash
npm run dev
```

My server runs at:

```text
http://localhost:3000/
```

To get all books, I used:

```text
http://localhost:3000/books
```

## What I Learned

By completing this lab, I learned how to create REST API routes, connect Express.js with SQLite, perform CRUD operations and use query parameters.

I also understood how to validate user inputs, handle different HTTP status codes and test API requests using Postman.

This lab helped me get more practical experience with backend development.