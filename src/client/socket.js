"use client";

import { io } from "socket.io-client";

export const apiUrl = process.env.NEXTAUTH_URL;
// export const apiUrl = "https://lrawbook-service.onrender.com";
export const socket = io(apiUrl, {
  autoConnect: false,
});
