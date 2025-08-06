const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

io.on("connection", (socket) => {
    console.log("User connected");

    socket.on("join-room", (roomId) => {
        socket.join(roomId);
        console.log(`User joined room: ${roomId}`);

        socket.to(roomId).emit("user-joined", socket.id);

        socket.on("offer", (data) => {
            socket.to(roomId).emit("offer", data);
        });

        socket.on("answer", (data) => {
            socket.to(roomId).emit("answer", data);
        });


        socket.on("candidate", (data) => {
            socket.to(roomId).emit("candidate", data);
        });

        socket.on("leave-room", (roomId) => {
            socket.leave(roomId);
            socket.to(roomId).emit("user-left", socket.id);
        });

        socket.on("disconnect", () => {
            socket.to(roomId).emit("user-left", socket.id);
        });
    });
});

http.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
