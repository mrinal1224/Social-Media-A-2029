import { io } from "socket.io-client";

// NOTIFICATION STEP 2: CREATE ONE SHARED SOCKET.IO CLIENT
//
// Backend side:
//   new Server(httpServer)
//
// Frontend side:
//   io("http://localhost:8084")
//
// The frontend `io()` function creates a Socket.IO client that knows
// which Socket.IO server it should connect to.
const socket = io("http://localhost:8084", {

  // We do NOT want the socket to connect immediately when this file is imported.
  //
  // WHY:
  // In the next teaching step React will explicitly decide when to call
  // socket.connect(). This makes the connection lifecycle easier to understand
  // and avoids hiding the moment when the realtime connection starts.
  autoConnect: false,

  // Allow credentials such as cookies to be sent during the Socket.IO connection.
  //
  // Our app already uses an httpOnly JWT cookie for authentication.
  // Later, when we authenticate socket connections, the server will need
  // access to that cookie during the Socket.IO handshake.
  withCredentials: true,
});

// Export one shared socket object.
// Components should reuse this instance instead of creating a new socket
// every time a component renders.
export default socket;
