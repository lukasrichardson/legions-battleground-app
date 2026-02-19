import { useCallback } from "react";
import { useAppDispatch } from "../redux/hooks";
import { GAME_EVENT } from "@/shared/enums/GameEvent";
import { emitGameEvent } from "../utils/emitEvent";
import { changeP1AP, changeP1Health, changeP2AP, changeP2Health } from "../redux/gameStateSlice";

export default function useHandlePlayerEvents(p1Card: boolean) {
  const dispatch = useAppDispatch();
   const healthGameEvent = p1Card ? GAME_EVENT.changeP1Health : GAME_EVENT.changeP2Health;
  const apGameEvent = p1Card ? GAME_EVENT.changeP1AP : GAME_EVENT.changeP2AP;
  /* eslint-disable */
  const healthGameFunction = p1Card ? changeP1Health : changeP2Health;
  const apGameFunction = p1Card ? changeP1AP : changeP2AP;
  /* eslint-enable */

  const handleHealthDecrease = useCallback((e: React.MouseEvent) => {
    dispatch(healthGameFunction(-1));
    emitGameEvent({ type: healthGameEvent, data: -1 });
    e.stopPropagation();
  }, [dispatch, healthGameFunction, healthGameEvent]);

  const handleHealthIncrease = useCallback((e: React.MouseEvent) => {
    dispatch(healthGameFunction(1));
    emitGameEvent({ type: healthGameEvent, data: 1 });
    e.stopPropagation();
  }, [dispatch, healthGameFunction, healthGameEvent]);

  const handleAPDecrease = useCallback((e: React.MouseEvent) => {
    dispatch(apGameFunction(-5));
    emitGameEvent({ type: apGameEvent, data: -5 });
    e.stopPropagation();
  }, [dispatch, apGameFunction, apGameEvent]);

  const handleAPIncrease = useCallback((e: React.MouseEvent) => {
    dispatch(apGameFunction(5));
    emitGameEvent({ type: apGameEvent, data: 5 });
    e.stopPropagation();
  }, [dispatch, apGameFunction, apGameEvent]);

  return { handleHealthDecrease, handleHealthIncrease, handleAPDecrease, handleAPIncrease };
}