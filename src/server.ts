import { createServer } from "http";
import { Server } from "socket.io";

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
  },
});

io.on("connection", (socket) =>
{
  console.log("Client connected:", socket.id);

  socket.emit("message", "Welcome from server");

  socket.on("ping", () =>
  {
    console.log("Ping received");
    socket.emit("pong", "Pong from server");
  });

  socket.on("disconnect", () =>
  {
    console.log("Client disconnected:", socket.id);
  });
});

httpServer.listen(3000, () =>
{
  console.log("Server running on http://localhost:3000");
});
