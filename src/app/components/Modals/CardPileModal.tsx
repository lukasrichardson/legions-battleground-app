import { CardState } from "@/shared/interfaces/CardState";
import Card from "@/app/components/Card/Card";
import { useEffect, useState } from "react";
import { useDragLayer } from "react-dnd";
import { useAppDispatch, useAppSelector } from "@/client/redux/hooks";
import Modal from "./Modal";
import { emitGameEvent } from "@/client/utils/emitEvent";
import { GAME_EVENT } from '@/shared/enums/GameEvent';
import { CARD_TARGET } from "@/shared/enums/CardTarget";
import useClientSettings from "@/client/hooks/useClientSettings";
import { decodeHTMLEntities } from "@/client/utils/string.util";
import { moveCard } from "@/client/redux/gameStateSlice";
import { setWisdoming } from "@/client/redux/clientGameStateSlice";
import { gameZoneLabel } from "@/client/utils/gameZoneLabel";
import useIsMobile from "@/client/hooks/useIsMobile";
interface ExtendedCardState extends CardState {
  target: CARD_TARGET;
  newTarget?: CARD_TARGET | null; // new target for the card if selected, used for resolving effects
  targetIndex: number | null;
}
export default function CardPileModal({ closeModal }: { closeModal: () => void }) {
  const dispatch = useAppDispatch();
  const [tab, setTab] = useState<string>("All");
  const [search, setSearch] = useState<string>("");
  const [selected, setSelected] = useState<ExtendedCardState[] | null>([]);
  const isCompact = useIsMobile(1101);
  const [isShortViewport, setIsShortViewport] = useState(false);
  const compactChrome = isCompact || isShortViewport;

  useEffect(() => {
    const query = window.matchMedia("(max-height: 500px)");
    const update = () => setIsShortViewport(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const gameState = useAppSelector((state) => state.gameState);
  const clientGameState = useAppSelector((state) => state.clientGameState);
  const sequenceState = useAppSelector((state) => state.sequenceState);
  const { transparentOnBlur } = useClientSettings();
  const isDraggingCard = useDragLayer((monitor) =>
    monitor.isDragging() && monitor.getItemType() === "card"
  );

  const { side, topXCards, pileInViewTarget, pileInViewIndex, pileInViewLimit, wisdoming } = clientGameState;
  const { sequences, resolving } = sequenceState;
  const p1 = side === "p1";
  const resolvingEffectStep = sequences?.[0]?.items?.[0]?.effect?.[0];
  const waitingForUserInput = (p1 && resolving && resolvingEffectStep?.waitingForInput?.p1) || (!p1 && resolving && resolvingEffectStep?.waitingForInput?.p2);
  const selectionMode = Boolean(waitingForUserInput || wisdoming);
  const open = !!pileInViewTarget || waitingForUserInput;
  const dragThroughBackdrop = isDraggingCard && !waitingForUserInput && !wisdoming;
  const pileLabel = gameZoneLabel(pileInViewTarget, side, pileInViewIndex);
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
    // cardPile = gameState[resolvingEffectStep.from] as CardState[]; // if waiting for user input, we show the pile that the user is selecting from
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
    if (wisdoming) {
      dispatch(setWisdoming(false));
    }
  }

  const closeAndShuffle = () => {
    emitGameEvent({ type: GAME_EVENT.shuffleTargetPile, data: { cardTarget: pileInViewTarget, targetIndex: (pileInViewIndex || undefined) } });
    handleCloseModal();
  }

  const renderModalHeader = () => (
    <div className={compactChrome ? "space-y-1 py-1" : "space-y-3 py-4"}>
      <div className={compactChrome ? "flex min-w-0 items-baseline gap-2" : ""}>
        <h3 className="text-base font-semibold text-white">{wisdoming ? "Wisdom" : waitingForUserInput ? "Make your selection" : pileLabel}</h3>
        <p className={compactChrome ? "shrink-0 text-xs text-slate-400" : "mt-1 text-xs leading-5 text-slate-400"}>
          {wisdoming
            ? (compactChrome ? "Choose 1" : "Select one card to keep. The other card moves to the bottom of the pile.")
            : waitingForUserInput
              ? (compactChrome ? `${cardPile.length} available` : `Choose within the allowed range, then confirm. ${cardPile.length} card${cardPile.length === 1 ? "" : "s"} available.`)
              : `${pileInViewLimit ? `Viewing ${pileInViewLimit} · ` : ""}${cardPile.length} card${cardPile.length === 1 ? "" : "s"}`}
        </p>
      </div>
      {!wisdoming && <input
        placeholder="Search cards"
        aria-label="Search card pile"
        onChange={handleSearchChange}
        value={search}
        className="min-h-11 w-full border border-sky-200/20 bg-slate-950/45 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-sky-300/70 focus:ring-2 focus:ring-sky-300/15"
      />}
    </div>
  );

  const handleCardSelect = (card: ExtendedCardState) => () => {
    if (!selectionMode) return;
    if (wisdoming) {
      let indexToBottom = 0;
      if (cardPile[0]?.id === card.id) indexToBottom = 1;
      dispatch(moveCard({
        id: card.id,
        target: p1 ? CARD_TARGET.P1_PLAYER_HAND : CARD_TARGET.P2_PLAYER_HAND,
        from: pileInViewTarget,
      }));
      emitGameEvent({
        type: GAME_EVENT.moveCard, data: {
          id: card.id,
          target: p1 ? CARD_TARGET.P1_PLAYER_HAND : CARD_TARGET.P2_PLAYER_HAND,
          from: pileInViewTarget ? { target: pileInViewTarget, targetIndex: pileInViewIndex } : undefined,
        }
      });
      dispatch(moveCard({
        id: cardPile[indexToBottom].id,
        target: pileInViewTarget,
        from: pileInViewTarget,
        bottom: true
      }));
      emitGameEvent({
        type: GAME_EVENT.moveCard, data: {
          id: cardPile[indexToBottom].id,
          target: pileInViewTarget,
          from: pileInViewTarget ? { target: pileInViewTarget, targetIndex: pileInViewIndex } : undefined,
          bottom: true
        }
      });
      handleCloseModal();
    } else {
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

  const selectMin = resolvingEffectStep?.selectMin ?? 0;
  const selectMax = resolvingEffectStep?.selectMax ?? 999;
  const selectedCount = selected?.length ?? 0;
  const canConfirm = selectedCount >= selectMin && selectedCount <= selectMax;

  const renderModalFooter = () => {
    if (waitingForUserInput) {
      return <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-slate-300"><span className="font-semibold text-white">{selectedCount}</span> selected · minimum {selectMin} · maximum {selectMax === 999 ? "∞" : selectMax}</div>
        <button type="button" disabled={!canConfirm} onClick={handleConfirmSelected} className="min-h-11 border border-sky-200/45 bg-[#246fb8] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_14px_rgba(79,169,255,.22)] transition hover:bg-[#338de0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200 disabled:cursor-not-allowed disabled:border-white/15 disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none">Confirm selection</button>
      </div>;
    }
    if (wisdoming) {
      return <button type="button" aria-label="close" onClick={handleCloseModal} className="min-h-11 w-full border border-sky-200/35 bg-slate-950/35 px-4 text-sm font-semibold text-slate-100 transition hover:border-sky-200/65 hover:bg-blue-400/10">Close</button>;
    }
    return <div className="grid grid-cols-2 gap-2">
      <button type="button" onClick={shuffle} className="min-h-11 border border-sky-200/35 bg-slate-950/35 px-3 text-xs font-semibold uppercase tracking-wide text-slate-100 transition hover:border-sky-200/65 hover:bg-blue-400/10">Shuffle</button>
      <button type="button" onClick={closeAndShuffle} className="min-h-11 border border-sky-200/35 bg-slate-950/35 px-3 text-xs font-semibold uppercase tracking-wide text-slate-100 transition hover:border-sky-200/65 hover:bg-blue-400/10">Close &amp; shuffle</button>
    </div>;
  };

  const renderModalContent = () => {
    const filteredPile = (cardPile as ExtendedCardState[]).filter(c => tab === "All" ? true : c.type === tab).filter(card =>
      card.name?.toLowerCase().includes(search.toLowerCase()) || decodeHTMLEntities(card.name || '').toLowerCase().includes(search.toLowerCase())
    ) as ExtendedCardState[];
    const hidden = p1 ? pileInViewTarget === CARD_TARGET.P2_PLAYER_DECK : pileInViewTarget === CARD_TARGET.P1_PLAYER_DECK;

    const renderTab = (name: string) => {
      return (
        <button
          type="button"
          aria-pressed={tab === name}
          className={"min-h-11 cursor-pointer border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition " + (tab === name ? "border-sky-200/55 bg-blue-400/20 text-sky-100 shadow-[inset_2px_0_0_#4fa9ff]" : "border-sky-200/20 bg-slate-950/35 text-slate-200 hover:border-sky-200/45 hover:bg-blue-400/10")}
          onClick={() => setTab(name)}
        >
          {name}
        </button>
      )
    }
    return (
      <div className="relative">
        {!wisdoming && <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className={compactChrome ? "sr-only" : ""}>Filter by:</span>
          {renderTab("All")}
          {renderTab("Warrior")}
          {renderTab("Unified")}
          {renderTab("Fortified")}
        </div>}
        <div>
          {filteredPile.length === 0 && <div className="space-y-3 py-5 text-center text-sm text-slate-300" role="status">
            <p>{cardPile.length === 0 ? "This pile is empty." : "No cards match your search or filters."}</p>
            {(search || tab !== "All") && <button type="button" onClick={() => { setSearch(""); setTab("All"); }} className="min-h-11 border border-sky-200/35 px-3 text-sky-100">Clear search and filters</button>}
          </div>}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-2">
            {filteredPile.map((card, index) => {
              const isSelected = !!selected?.find(c => c.id === card.id);
              const cardContent = (
                  <Card
                    card={card}
                    cardTarget={card.target || pileInViewTarget as CARD_TARGET}
                    inPileView={true}
                    index={index}
                    zoneIndex={card.targetIndex ?? pileInViewIndex ?? undefined}
                    hidden={hidden}
                    interactionEnabled={!selectionMode}
                  />
              );
              const tileClasses = [
                "flex min-h-[96px] items-center justify-center overflow-hidden rounded-lg border transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200",
                selectionMode ? "cursor-pointer" : "",
                isSelected ? "border-emerald-400/60 ring-2 ring-emerald-400/50 shadow-lg" : "border-white/10 hover:border-white/20",
              ].join(" ");
              if (!selectionMode) return <div key={card.id} className={tileClasses}>{cardContent}</div>;
              return <button
                type="button"
                key={card.id}
                onClick={handleCardSelect(card)}
                aria-pressed={waitingForUserInput ? isSelected : undefined}
                aria-label={wisdoming ? `Choose ${decodeHTMLEntities(card.name || "card")}` : `${isSelected ? "Deselect" : "Select"} ${decodeHTMLEntities(card.name || "card")}`}
                className={tileClasses}
              >{cardContent}</button>;
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Modal open={open} variant={isCompact ? "constrained-dialog" : "dialog"} compactChrome={compactChrome} ariaLabel={wisdoming ? "Wisdom selection" : waitingForUserInput ? "Card selection" : pileLabel} closeModal={handleCloseModal} modalHeader={renderModalHeader()} modalContent={renderModalContent()} modalFooter={renderModalFooter()} showCloseButton transparentOnBlur={transparentOnBlur} dragThroughBackdrop={dragThroughBackdrop} blurBackdrop={false} overlayClassName="!z-[1300]" />
  )
}
