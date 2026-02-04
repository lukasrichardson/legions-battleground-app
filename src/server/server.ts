import 'dotenv/config';
import { createServer } from 'http'
import { Server } from "socket.io";
import { handleSocketConnection } from './network/socketHandler';
// import cron from 'node-cron';
// import axios from 'axios';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { routes } from './network/routes';
import next from 'next';
import { connectToDatabase, closeDatabaseConnection } from './utils/database.util';

const uri = process.env.MONGO_URL;
if (!uri) {
  throw new Error("MONGO_URL environment variable is required");
}
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
connectToDatabase().then(() => {
  const port = parseInt(process.env.PORT || '3000', 10)
  const dev = process.env.NODE_ENV !== 'production'
  const nextApp = next({ dev });
  const handle = nextApp.getRequestHandler();
  nextApp.prepare().then(() => {
  
    const app = express();
    app.use(cors());
    app.use(cookieParser());
    app.use(bodyParser.json({ limit: "10mb" }));
  
    const httpServer = createServer(app);
    const io = new Server(httpServer, {
      cors: {
        origin: "*"
      }
    });
    handleSocketConnection(io);
  
    routes(app);
  
    // cron.schedule('*/14 * * * *', () => {
    //   if (process.env.NODE_ENV === 'production') {
    //     axios.get(process.env.NEXTAUTH_URL + "/healthz")
    //   } else {
    //     axios.get(`http://localhost:${port}/healthz`);
    //   }
    // });
  
    // Handle all other requests with Next.js (after Express routes have been processed)
    // This should only catch requests that haven't been handled by our Express routes
    app.use('/', (req, res) => {
      return handle(req, res);
    });
    
    httpServer.listen(port)
  
    console.log(
      `> Server listening at http://localhost:${port} as ${dev ? 'development' : process.env.NODE_ENV
      }`
    )

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`Received ${signal}. Graceful shutdown starting...`);
      try {
        await closeDatabaseConnection();
        httpServer.close(() => {
          console.log('HTTP server closed.');
          process.exit(0);
        });
      } catch (error) {
        console.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  });
}).catch(console.error);
