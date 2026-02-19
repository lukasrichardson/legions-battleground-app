import { CardState } from "@/shared/interfaces/CardState";
import Card from "@/app/components/Card/Card";
import { MouseEventHandler, useEffect, useState } from "react";
import { useAppSelector } from "@/client/redux/hooks";
import Modal from "./Modal";
import { emitGameEvent } from "@/client/utils/emitEvent";
import { GAME_EVENT } from '@/shared/enums/GameEvent';
import { CARD_TARGET } from "@/shared/enums/CardTarget";
import useClientSettings from "@/client/hooks/useClientSettings";

const ModalConstants = {
  ShuffleBtnText: "shuffle",
  CloseShuffleBtnText: "close and shuffle",
  CloseBtnText: "close",
}
interface ExtendedCardState extends CardState {
  target: CARD_TARGET;
  newTarget?: CARD_TARGET | null; // new target for the card if selected, used for resolving effects
  targetIndex: number | null;
}
export default function CardPileModal({ closeModal }: { closeModal: () => void }) {
  const [tab, setTab] = useState<string>("All");
  const [search, setSearch] = useState<string>("");
  const [selected, setSelected] = useState<ExtendedCardState[] | null>([]);

  const gameState = useAppSelector((state) => state.gameState);
  const clientGameState = useAppSelector((state) => state.clientGameState);
  const sequenceState = useAppSelector((state) => state.sequenceState);
  const { transparentOnBlur } = useClientSettings();

  const { side, topXCards, pileInViewTarget, pileInViewIndex, pileInViewLimit } = clientGameState;
  const { sequences, resolving } = sequenceState;
  const p1 = side === "p1";
  const resolvingEffectStep = sequences?.[0]?.items?.[0]?.effect?.[0];
  const waitingForUserInput = (p1 && resolving && resolvingEffectStep?.waitingForInput?.p1) || (!p1 && resolving && resolvingEffectStep?.waitingForInput?.p2);
  const open = !!pileInViewTarget || waitingForUserInput;
  const {
    ShuffleBtnText,
    CloseShuffleBtnText,
    CloseBtnText
  } = ModalConstants;

  useEffect(() => {
    if (!open) {
      setSelected([]);
      setSearch("");
    }
  }
    , [open]);
  if (!open) return null;

  const shuffle = () => {
    emitGameEvent({ type: GAME_EVENT.shuffleTargetPile, data: { cardTarget: pileInViewTarget, targetIndex: (pileInViewIndex || undefined) } });
  }


  let cardPile: CardState[] = pileInViewTarget
    ? (pileInViewIndex != undefined
      ? (gameState[pileInViewTarget as keyof typeof gameState] as CardState[][])[pileInViewIndex]
      : gameState[pileInViewTarget as keyof typeof gameState] as CardState[])
    : [] as CardState[];

  if (waitingForUserInput) {
    // pileInViewTarget = resolvingEffectStep.from[0].target; // update the target to the one we are selecting from
    cardPile = [];
    for (const targetObject of resolvingEffectStep.from || []) {
      if (targetObject.targetIndex || targetObject.targetIndex === 0) {
        cardPile.push(...((gameState[targetObject.target as keyof typeof gameState] as CardState[][])[targetObject.targetIndex]).map(item => ({
          ...item,
          target: targetObject.target,
          targetIndex: targetObject.targetIndex,
        })) as ExtendedCardState[])
      } else {
        if ([CARD_TARGET.P1_PLAYER_FORTIFIED, CARD_TARGET.P2_PLAYER_FORTIFIED, CARD_TARGET.P1_PLAYER_UNIFIED, CARD_TARGET.P2_PLAYER_UNIFIED, CARD_TARGET.P1_PLAYER_WARRIOR, CARD_TARGET.P2_PLAYER_WARRIOR].includes(targetObject.target)) {
          (gameState[targetObject.target as keyof typeof gameState] as CardState[][]).forEach((zone, index) => {
            if (zone.length === 0) return; // skip empty zones
            cardPile.push(...zone.map((item) => ({
              ...item,
              target: targetObject.target,
              targetIndex: index, // use the index of the zone as targetIndex
            })) as ExtendedCardState[])
          })
          //todo: handle what happens if theres more than one card in a warrior/fortified/unified zone
        } else {
          cardPile.push(...((gameState[targetObject.target as keyof typeof gameState] as CardState[]).map(item => ({
            ...item,
            target: targetObject.target,
            targetIndex: null, // no target index for non-column targets
          })) as ExtendedCardState[]))
        }
      }
    }
    // cardPile = gameState.game[resolvingEffectStep.from] as CardState[]; // if waiting for user input, we show the pile that the user is selecting from
  }

  if (pileInViewLimit) {
    cardPile = topXCards || [];
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  }

  const handleCloseModal = () => {
    setSearch("");
    setTab("All");
    closeModal();
    emitGameEvent({ type: side === "p1" ? GAME_EVENT.setP1Viewing : GAME_EVENT.setP2Viewing, data: { cardTarget: null, limit: null } })
  }

  const closeAndShuffle = () => {
    emitGameEvent({ type: GAME_EVENT.shuffleTargetPile, data: { cardTarget: pileInViewTarget, targetIndex: (pileInViewIndex || undefined) } });
    handleCloseModal();
  }

  const renderModalHeader = () => !waitingForUserInput ? (
    <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide rounded-md border border-white/20 bg-white/5 hover:bg-white/10 text-white/90"
          onClick={shuffle as MouseEventHandler<HTMLButtonElement>}
        >
          {ShuffleBtnText}
        </button>
        <span className="text-sm sm:text-base font-semibold text-white/90">
          {pileInViewLimit && "Top of "}{pileInViewTarget + (pileInViewIndex != undefined ? ` column ${pileInViewIndex}` : "")}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <input
          placeholder="Search..."
          onChange={handleSearchChange}
          value={search}
          className="w-44 sm:w-56 px-3 py-2 text-sm rounded-md bg-white/5 border border-white/15 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-white/30"
        />
        <button
          className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide rounded-md border border-white/20 bg-white/5 hover:bg-white/10 text-white/90"
          onClick={closeAndShuffle as MouseEventHandler<HTMLButtonElement>}
        >
          {CloseShuffleBtnText}
        </button>
        <button
          className="px-3 py-1.5 text-xs font-medium uppercase tracking-wide rounded-md border border-white/20 bg-white/5 hover:bg-white/10 text-white/90"
          onClick={handleCloseModal as MouseEventHandler<HTMLButtonElement>}
        >
          {CloseBtnText}
        </button>
      </div>
    </div>
  ) : (
    <div className="px-4 py-3 bg-gradient-to-r from-white/5 to-transparent">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-white">Make your selection</h3>
          <p className="text-xs text-white/70">Choose between the allowed range below, then confirm.</p>
        </div>
      </div>
    </div>
  )

  const handleCardSelect = (card: ExtendedCardState) => () => {
    const isOneTarget = resolvingEffectStep?.to?.length === 1;
    const isBounceEffect = resolvingEffectStep?.to?.find(to => to.target.includes(CARD_TARGET.P1_PLAYER_HAND)) && resolvingEffectStep?.to?.find(to => to.target.includes(CARD_TARGET.P1_PLAYER_HAND)) && resolvingEffectStep.to.length === 2;

    if (selected?.find(c => c.id === card.id)) {

      setSelected(selected.filter(c => c.id !== card.id));
    } else {
      setSelected([...(selected ?? []), {
        ...card,
        newTarget: isOneTarget ? resolvingEffectStep.to?.[0].target : isBounceEffect ? (card.target.includes("p1") ? CARD_TARGET.P1_PLAYER_HAND : CARD_TARGET.P2_PLAYER_HAND) : null
      }]);
    }
  }

  const handleConfirmSelected = () => {
    const newSelected = selected?.map(selectedCard => ({
      id: selectedCard.id,
      from: { target: selectedCard.target, targetIndex: selectedCard.targetIndex },
      target: selectedCard.newTarget || (p1 ? resolvingEffectStep.to?.find(to => to.target.includes("p1"))?.target : resolvingEffectStep.to?.find(to => to.target.includes("p2"))?.target) || null, // default to p1 player deck if no target found
    }))
    emitGameEvent({
      type: GAME_EVENT.playerInput, data: {
        selected: newSelected,
      }
    });
  }

  const renderModalContent = () => {
    const filteredPile = (cardPile as ExtendedCardState[]).filter(c => tab === "All" ? true : c.type === tab).filter(card =>
      card.name?.toLowerCase().includes(search.toLowerCase())
    ) as ExtendedCardState[];
    const hidden = p1 ? pileInViewTarget === CARD_TARGET.P2_PLAYER_DECK : pileInViewTarget === CARD_TARGET.P1_PLAYER_DECK;

    const min = resolvingEffectStep?.selectMin ?? 0;
    const max = resolvingEffectStep?.selectMax ?? 999;
    const count = selected?.length ?? 0;
    const canConfirm = count >= min && count <= max;

    const renderTab = (name: string) => {
      return (
        <button
          className={"px-3 py-1.5 text-xs font-medium uppercase tracking-wide rounded-md border border-white/20 bg-white/5 hover:bg-white/10 cursor-pointer " + (tab === name ? " bg-white/70 text-blue-950" : "text-white/90")}
          onClick={() => setTab(name)}
        >
          {name}
        </button>
      )
    }

    return (
      <div className="relative">
        <div className="flex gap-4 relative -top-2">
          <span>Filter By: </span>
          {renderTab("All")}
          {renderTab("Warrior")}
          {renderTab("Unified")}
          {renderTab("Fortified")}
        </div>
        <div className={waitingForUserInput ? "pb-20" : "pb-0"}>
          <div className="grid grid-cols-2 xs:grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1">
            {filteredPile.map((card, index) => {
              const isSelected = !!selected?.find(c => c.id === card.id);
              return (
                <div
                  key={card.id}
                  onClick={handleCardSelect(card)}
                  className={[
                    "cursor-pointer rounded-lg overflow-hidden border transition-all",
                    isSelected ? "border-emerald-400/60 ring-2 ring-emerald-400/50 shadow-lg" : "border-white/10 hover:border-white/20",
                    "flex items-center justify-center",
                  ].join(" ")}
                >
                  <Card
                    card={card}
                    cardTarget={card.target || pileInViewTarget}
                    inPileView={true}
                    index={index}
                    zoneIndex={(card.targetIndex || pileInViewIndex != undefined ? pileInViewIndex : undefined) || undefined}
                    hidden={hidden}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {waitingForUserInput && (
          <div className="sticky bottom-0 inset-x-0">
            <div className="px-4 py-3 border-t border-white/10 bg-gradient-to-t from-slate-900/95 via-slate-900/80 to-transparent backdrop-blur">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="text-xs text-white/80">
                  Select card(s): <span className="font-semibold text-white">{count}</span>
                  {" "}of min: <span className="font-semibold text-white">{min}</span>
                  {" "}max: <span className="font-semibold text-white">{max === 999 ? "∞" : max}</span>
                </div>
                <div className="flex items-center gap-2">
                  {canConfirm && (
                    <button
                      onClick={handleConfirmSelected}
                      className="px-4 py-2 text-sm font-medium rounded-md border border-white/15 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
                    >
                      Confirm
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Modal open={open} closeModal={handleCloseModal} modalHeader={renderModalHeader()} modalContent={renderModalContent()} transparentOnBlur={transparentOnBlur} />
  )
}