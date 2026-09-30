"use client";

import { useAppDispatch, useAppSelector } from "@/client/redux/hooks";
import { closeConcedeModal, closeLeaveGameModal } from "@/client/redux/modalsSlice";
import { resetState } from "@/client/redux/gameStateSlice";
import { GAME_EVENT } from "@/shared/enums/GameEvent";
import { emitGameEvent } from "@/client/utils/emitEvent";
import { socket } from "@/client/socket";
import { useRouter } from "next/navigation";
import Modal from "../Modals/Modal";

export default function RegularMatchActionModals() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const sandboxMode = useAppSelector((state) => state.gameState.sandboxMode);
  const { concedeModalOpen, leaveGameModalOpen } = useAppSelector((state) => state.modalsState);

  if (sandboxMode) return null;

  const concede = () => {
    emitGameEvent({ type: GAME_EVENT.concede, data: null });
    dispatch(closeConcedeModal());
  };

  const leaveRegularRoom = () => {
    socket.emit("leaveRegularRoom");
    dispatch(closeLeaveGameModal());
    dispatch(resetState());
    router.push("/");
  };

  const concedeAndLeave = () => {
    const leaveAfterConfirmation = (payload: { type?: GAME_EVENT }) => {
      if (payload.type !== GAME_EVENT.concede) return;
      dispatch(closeLeaveGameModal());
      dispatch(resetState());
      router.push("/");
    };
    socket.once("gameEvent", leaveAfterConfirmation);
    emitGameEvent({ type: GAME_EVENT.concede, data: null });
  };

  return <>
    <Modal
      open={concedeModalOpen}
      closeModal={() => dispatch(closeConcedeModal())}
      modalHeader={<div className="py-3 text-white">Concede match?</div>}
      modalContent={<div className="w-[28rem] max-w-full space-y-3 text-white"><p>This immediately awards the match to your opponent.</p><button className="rounded bg-rose-700 px-3 py-2" onClick={concede}>Concede</button></div>}
    />
    <Modal
      open={leaveGameModalOpen}
      closeModal={() => dispatch(closeLeaveGameModal())}
      modalHeader={<div className="py-3 text-white">Leave game?</div>}
      modalContent={<div className="w-[28rem] max-w-full space-y-3 text-white"><p>Leaving without conceding reserves your seat while your opponent remains connected.</p><div className="flex flex-wrap gap-2"><button className="rounded bg-rose-700 px-3 py-2" onClick={concedeAndLeave}>Concede and leave</button><button className="rounded bg-slate-700 px-3 py-2" onClick={leaveRegularRoom}>Leave without conceding</button><button className="rounded bg-slate-600 px-3 py-2" onClick={() => dispatch(closeLeaveGameModal())}>Stay</button></div></div>}
    />
  </>;
}
