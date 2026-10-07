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
      modalHeader={<div className="py-4 text-base font-semibold tracking-wide text-white">Concede match?</div>}
      modalContent={<div className="w-[28rem] max-w-full space-y-3 text-slate-200"><p>This immediately awards the match to your opponent.</p><button className="border border-rose-200/35 bg-rose-500/80 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-500" onClick={concede}>Concede</button></div>}
    />
    <Modal
      open={leaveGameModalOpen}
      closeModal={() => dispatch(closeLeaveGameModal())}
      modalHeader={<div className="py-4 text-base font-semibold tracking-wide text-white">Leave game?</div>}
      modalContent={<div className="w-[28rem] max-w-full space-y-3 text-slate-200"><p>Leaving without conceding reserves your seat while your opponent remains connected.</p><div className="flex flex-wrap gap-2"><button className="border border-rose-200/35 bg-rose-500/80 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-500" onClick={concedeAndLeave}>Concede and leave</button><button className="border border-sky-200/35 bg-slate-950/35 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-sky-200/65 hover:bg-blue-400/10" onClick={leaveRegularRoom}>Leave without conceding</button><button className="border border-sky-200/35 bg-[#246fb8] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#338de0]" onClick={() => dispatch(closeLeaveGameModal())}>Stay</button></div></div>}
    />
  </>;
}
