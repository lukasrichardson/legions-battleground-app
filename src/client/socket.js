"use client";

import { io } from "socket.io-client";

export const apiUrl = process.env.NEXTAUTH_URL;
// export const apiUrl = "https://lrawbook-service.onrender.com";
export const socket = io(apiUrl, {
  autoConnect: false,
});

// Room admission is granted through an HTTP-only cookie. Refreshing before
// navigation ensures the next Socket.IO handshake includes that cookie.
export const refreshSocketConnection = (admissionToken) => new Promise((resolve, reject) => {
  const finish = () => {
    socket.off("connect_error", fail);
    resolve();
  };
  const fail = (error) => {
    socket.off("connect", finish);
    reject(error);
  };
  socket.auth = { admissionToken };
  socket.once("connect", finish);
  socket.once("connect_error", fail);
  if (socket.connected) socket.disconnect();
  socket.connect();
});
