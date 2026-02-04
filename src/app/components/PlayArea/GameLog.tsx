import { useAppSelector } from "@/client/redux/hooks";
import styles from "@/app/styles/toolbar.module.css";
import { useEffect, useRef } from "react";

export default function GameLog({}) {
  const state = useAppSelector((state) => state.gameState);
  const gameLogRef = useRef<HTMLDivElement>(null);
  const { gameLog } = state.game;
  useEffect(() => {
    if (gameLogRef?.current) {
      gameLogRef.current.scrollTop = gameLogRef?.current?.scrollHeight;
    }
  },[gameLog.length]);
  return (
    <div className={styles.gameLog} ref={gameLogRef}>
      {gameLog.map((log, index) => (
        <div className={styles.gameLogItem} key={index}>{log}</div>
        ))}
      </div>
    )
}