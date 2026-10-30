"use client";

import { useAppDispatch, useAppSelector } from "@/client/redux/hooks";
import { closeConcedeModal, closeLeaveGameModal } from "@/client/redux/modalsSlice";
import { resetState } from "@/client/redux/gameStateSlice";
import { GAME_EVENT } from "@/shared/enums/GameEvent";
import { emitGameEvent } from "@/client/utils/emitEvent";
import { socket } from "@/client/socket";
import { useRouter } from "next/navigation";
import Modal from "../Modals/Modal";
import useIsMobile from "@/client/hooks/useIsMobile";

export default function RegularMatchActionModals() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const phone = useIsMobile();
  const sandboxMode = useAppSelector((state) => state.gameState.sandboxMode);
  const { concedeModalOpen, leaveGameModalOpen, leaveGameTarget } = useAppSelector((state) => state.modalsState);

  if (sandboxMode) return null;

  const concede = () => {
    emitGameEvent({ type: GAME_EVENT.concede, data: null });
    dispatch(closeConcedeModal());
  };

  const leaveRegularRoom = () => {
    socket.emit("leaveRegularRoom");
    dispatch(closeLeaveGameModal());
    dispatch(resetState());
    router.push(leaveGameTarget);
  };

  const concedeAndLeave = () => {
    const leaveAfterConfirmation = (payload: { type?: GAME_EVENT }) => {
      if (payload.type !== GAME_EVENT.concede) return;
      dispatch(closeLeaveGameModal());
      dispatch(resetState());
      router.push(leaveGameTarget);
    };
    socket.once("gameEvent", leaveAfterConfirmation);
    emitGameEvent({ type: GAME_EVENT.concede, data: null });
  };

  return <>
    <Modal
      open={concedeModalOpen}
      ariaLabel="Concede match"
      showCloseButton
      closeModal={() => dispatch(closeConcedeModal())}
      modalHeader={<div className="py-4 text-base font-semibold tracking-wide text-white">Concede match?</div>}
      modalContent={<div className="w-[28rem] max-w-full space-y-4 text-slate-200"><p>This immediately awards the match to your opponent and cannot be undone.</p><div className="flex flex-col gap-2 sm:flex-row-reverse"><button type="button" aria-label="Concede" className="min-h-11 border border-rose-200/35 bg-rose-500/80 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-200" onClick={concede}>Concede match</button><button type="button" autoFocus className="min-h-11 border border-sky-200/35 bg-slate-950/35 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-sky-200/65 hover:bg-blue-400/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200" onClick={() => dispatch(closeConcedeModal())}>Keep playing</button></div></div>}
    />
    <Modal
      open={leaveGameModalOpen}
      variant={phone ? "constrained-dialog" : "dialog"}
      overlayClassName="!z-[1400]"
      ariaLabel="Leave game"
      showCloseButton
      closeModal={() => dispatch(closeLeaveGameModal())}
      modalHeader={<div className="py-4 text-base font-semibold tracking-wide text-white">What should happen to your seat?</div>}
      modalContent={<div className="w-[30rem] max-w-full space-y-4 text-slate-200">
        <p className="text-sm leading-6">You can leave and keep your seat for reconnecting, or concede the match to your opponent.</p>
        <div className="flex flex-col gap-2">
          <button type="button" aria-label="Stay" autoFocus className="order-2 min-h-11 border border-sky-200/30 bg-slate-950/35 px-4 py-3 text-left text-sm font-semibold text-slate-100 transition hover:border-sky-200/65 hover:bg-blue-400/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200" onClick={() => dispatch(closeLeaveGameModal())}>Stay in match<span className="mt-1 block text-xs font-normal text-slate-400">Close this dialog and keep playing.</span></button>
          <button type="button" aria-label="Leave without conceding" className="order-1 min-h-11 border border-sky-200/45 bg-[#246fb8] px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-[#338de0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200" onClick={leaveRegularRoom}>Leave without conceding<span className="mt-1 block text-xs font-normal text-sky-100/80">Reserve your seat so you can reconnect later.</span></button>
          <button type="button" aria-label="Concede and leave" className="order-3 mt-2 min-h-11 border border-rose-300/45 bg-rose-500/10 px-4 py-3 text-left text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-200" onClick={concedeAndLeave}>Concede and leave<span className="mt-1 block text-xs font-normal text-rose-100/70">Award the match to your opponent. This cannot be undone.</span></button>
        </div>
      </div>}
    />
  </>;
}
