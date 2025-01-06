const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*', // Allow all origins (adjust for production)
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Variables for session management
let canvasData = null; // Store the current canvas state
let adminSocketId = null; // Track the admin connection

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Send the current canvas state to newly connected users
    if (canvasData) {
        socket.emit('canvas-data', canvasData);
    }

    // Listen for canvas updates from users
    socket.on('canvas-data', (data) => {
        canvasData = data; // Update the current canvas state
        socket.broadcast.emit('canvas-data', data); // Broadcast the data to all other users
    });

    // Admin controls
    socket.on('register-admin', () => {
        adminSocketId = socket.id; // Register the current socket as admin
        console.log('Admin registered:', socket.id);
    });

    socket.on('clear-canvas', () => {
        if (socket.id === adminSocketId) {
            canvasData = null; // Clear the canvas state
            io.emit('clear-canvas'); // Notify all clients to clear their canvas
        } else {
            console.log('Unauthorized clear-canvas request from:', socket.id);
        }
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        if (socket.id === adminSocketId) {
            adminSocketId = null;
            console.log('Admin disconnected');
        }
    });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
