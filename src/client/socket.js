"use client";

import { io } from "socket.io-client";

export const apiUrl = process.env.NEXTAUTH_URL;
// export const apiUrl = "https://lrawbook-service.onrender.com";
export const socket = io(apiUrl, {
  autoConnect: false,
  withCredentials: true,
  // Render's proxy accepts direct WebSocket connections, but can reject a
  // polling-session upgrade when the upgrade request is routed differently.
  transports: ["websocket"],
});
