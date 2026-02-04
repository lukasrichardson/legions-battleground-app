import { games } from '../game/game';
import { rooms } from '../network/socketHandler';

export const logMemoryUsage = () => {
  const memoryUsage = process.memoryUsage();
  const roomCount = Object.keys(rooms).length;
  const gameCount = Object.keys(games).length;
  
  console.log('=== Memory Usage ===');
  console.log(`RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)} MB`);
  console.log(`Heap Used: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`);
  console.log(`Heap Total: ${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`);
  console.log(`External: ${Math.round(memoryUsage.external / 1024 / 1024)} MB`);
  console.log(`Active Rooms: ${roomCount}`);
  console.log(`Active Games: ${gameCount}`);
  
  // Log room details
  if (roomCount > 0) {
    console.log('Room Details:');
    Object.entries(rooms).forEach(([roomId, room]) => {
      const playerCount = Object.keys(room.players).length;
      console.log(`  - ${roomId}: ${playerCount} players`);
    });
  }
  
  console.log('===================');
};

export const getGameStateSize = (roomId: string): number => {
  if (!games[roomId]) return 0;
  
  try {
    const gameStateString = JSON.stringify(games[roomId]);
    return Buffer.byteLength(gameStateString, 'utf8');
  } catch (error) {
    console.error(`Error calculating game state size for room ${roomId}:`, error);
    return 0;
  }
};

export const cleanupStaleRooms = () => {
  const staleRooms: string[] = [];
  
  Object.entries(rooms).forEach(([roomId, room]) => {
    const playerCount = Object.keys(room.players).length;
    
    // Mark rooms with no players as stale
    if (playerCount === 0) {
      staleRooms.push(roomId);
    }
  });
  
  // Clean up stale rooms
  staleRooms.forEach(roomId => {
    console.log(`Cleaning up stale room: ${roomId}`);
    delete rooms[roomId];
    if (games[roomId]) {
      delete games[roomId];
    }
  });
  
  if (staleRooms.length > 0) {
    console.log(`Cleaned up ${staleRooms.length} stale rooms`);
  }
};

// Optional: Set up periodic memory monitoring (uncomment if needed)
// setInterval(() => {
//   logMemoryUsage();
//   cleanupStaleRooms();
// }, 5 * 60 * 1000); // Every 5 minutes