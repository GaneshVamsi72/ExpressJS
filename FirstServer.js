const express = require('express'); // This imports the Express module — a function you can call.
const app = express(); // This calls that function, and it returns an Express app object. (Think of express() as creating an instance of your web application.)

/*
This app is your main tool — you use it to:
1. Define routes
2. Use middleware
3. Start the server
*/

let port = 3000; // Ports are the logical endpoints of a network connection that is used to exchange information between a web server and a web client.

// More info about Ports 
/*
Ports are just numbers (0–65535) used in networking to identify specific services or programs on a device.
They help your computer decide where to send incoming data and which program should handle it.

🔁 In Simple Words:
Ports are like numbered mailboxes inside your device.
Data comes with a port number, and your system delivers it to the right app or service using that number.
*/

app.listen(port, () => {
    console.log(`✅ Server running on http://localhost:${port}`);
});

/*
🔹 What is app.use()?
app.use() is used to define middleware — functions that run before the final request handler.

Middleware can modify the request (req) or response (res), or even end the request.

🧠 Syntax:
app.use(PATH, middlewareFunction)

1. If PATH is not given, it runs on all requests.
2. If PATH is given, it only runs on that route or subroutes
*/

// Global Middleware = *Entry checkpoint*
app.use((req, res, next) => {
    console.log("Request received");
    console.log(`[${req.method}] ${req.url}`);
    next(); // Pass control to the next middleware or route
});

/*
🔹 "HTTP is a text-based protocol" — What does that mean?
Yes, HTTP (HyperText Transfer Protocol) is a text-based protocol. That means:

When a browser (client) sends a request to a server, it’s basically sending raw text like this:
    GET /about HTTP/1.1
    Host: example.com
    User-Agent: Chrome/123.0
The server then reads this raw text and interprets it — e.g., what route is being requested (/about), what method is used (GET), and other headers (User-Agent, Host, etc.).

This raw text is what Node.js gets if you use its built-in http module. But it’s not developer-friendly.

🔹 How Express helps — req and res
Express makes life easier by parsing that raw HTTP request for you and giving it in the form of structured objects:
1. req → contains parsed request data (method, headers, body, URL params, etc.)
2. res → helps you build and send the response easily

So you don't have to manually handle the raw text of HTTP — Express does the dirty work.
*/

/*
🔁 What is Routing?
Routing is how your app responds to different URLs and HTTP methods like GET, POST, etc.

For example:
GET     /home      → Show home page  
POST    /login     → Handle login  
DELETE  /user/:id  → Delete user

📄 Basic Route Syntax
app.METHOD(PATH, HANDLER)

1. METHOD: get, post, put, delete, etc.
2. PATH: URL path (like /, /about, /user/:id)
3. HANDLER: Function to run on that route
*/
app.get('/', (req, res) => {
    res.send('Home Page');
});

app.get('/about', (req, res) => {
    res.send('About Page');
});

app.post('/contact', (req, res) => {
    res.send('Contact Form Submitted');
});

/*
🔹 What are Path Parameters?
Path parameters are placeholders in the URL that capture dynamic values from the request path.

They are defined using a colon : followed by a name (e.g., :id).
*/

/*
🧠 req.params is an object holding all path parameters.
*/

app.get('/user/:id', (req, res) => {
    const userId = req.params.id;
    res.send(`<h1>Profile of User with userId: ${userId}<h1>`);
});

app.get('/user/:userId/post/:postId', (req, res) => {
    const {userId, postId} = req.params;
    res.send(`<h1>Post (postId: ${postId}) of User with userId: ${userId}<h1>`);
});

/*
🔹 What Are Query Strings?
Query strings are key-value pairs appended to a URL after a ?.
They are used to send additional data to the server without changing the path.

/search?q=ramayan&lang=sanskrit

🧠 Access in Express:
Use req.query — it gives you an object containing all query parameters.
*/

app.get('/search', (req, res) => {
    const {q, lang} = req.query;
    res.send(`Search Results for "${q}" in "${lang}" language.`);
});

/*
If the route is not matched by any above, it can fall through to a custom 404 handler
*/
// Fallback Middleware
app.use((req, res) => {
    res.status(404).send("🚫 404 - Page Not Found");
});