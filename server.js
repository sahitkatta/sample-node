const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const sqlite3 = require('sqlite3').verbose();

// Create SQLite database in memory
const db = new sqlite3.Database(':memory:');

// Create a table in the database
db.run('CREATE TABLE IF NOT EXISTS books (id INTEGER PRIMARY KEY, title TEXT, author TEXT)');

// GraphQL schema
const schema = buildSchema(`
  type Book {
    id: ID
    title: String
    author: String
  }

  type Query {
    books: [Book]
    book(id: ID!): Book
  }

  type Mutation {
    addBook(title: String!, author: String!): Book
    updateBook(id: ID!, title: String, author: String): Book
    deleteBook(id: ID!): Book
  }
`);

// Resolver functions
const root = {
  books: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM books', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  book: ({ id }) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM books WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  addBook: ({ title, author }) => {
    return new Promise((resolve, reject) => {
      db.run('INSERT INTO books (title, author) VALUES (?, ?)', [title, author], function (err) {
        if (err) reject(err);
        else {
          resolve({ id: this.lastID, title, author });
        }
      });
    });
  },
  updateBook: ({ id, title, author }) => {
    return new Promise((resolve, reject) => {
      db.run('UPDATE books SET title = ?, author = ? WHERE id = ?', [title, author, id], function (err) {
        if (err) reject(err);
        else {
          resolve({ id, title, author });
        }
      });
    });
  },
  deleteBook: ({ id }) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM books WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else {
          db.run('DELETE FROM books WHERE id = ?', [id], (err) => {
            if (err) reject(err);
            else resolve(row);
          });
        }
      });
    });
  },
};

// Create Express server: with variable name app
const app = express();

const nikhil_code = "Some code"

// Use GraphQL middleware
app.use('/', graphqlHTTP({
  schema,
  rootValue: root,
}));

// Start the server
const port = process.env.PORT || 8080
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
