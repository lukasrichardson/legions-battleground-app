import { Dispatch } from "@reduxjs/toolkit";
import { DeckResponse } from "@/shared/interfaces/DeckResponse";
import { CardInterface } from "@/client/interfaces/CardInterface";
import { CARD_TARGET } from "@/shared/enums/CardTarget";
import DeckZone from "./DeckZone";
import { GAME_EVENT } from "@/client/enums/GameEvent";
import { changeP1AP, changeP1Health, changeP2AP, changeP2Health } from "@/client/redux/gameStateSlice";
import { emitGameEvent } from "@/client/utils/emitEvent";
import Hand from "./Hand";
import Card from "../Card/Card";
import CardZone from "./CardZone";

export const renderDeckNameZone = (deck: DeckResponse | null, p1: boolean) => {
  return (
    <div className={["relative flex items-center justify-center rounded border border-gray-300",
    //  p1 ? "bg-[#1d1e18] text-white" : ""
     ].join(" ")}>
      <>
        {/* <div className="text-wrap">
          {deck?.name}
        </div>
        <div className="text-wrap">
          {"id: " + deck?.id}
        </div> */}
        <span>{p1 ? "P1" : "P2"}</span>
      </>
    </div>
  )
}

export const renderDeckZone = (item: CardInterface | null, cardTarget: CARD_TARGET, p1: boolean) => {
  return (<DeckZone item={item} cardTarget={cardTarget} p1={p1} />)
}


export const renderHealth = (health: number, gameEvent: GAME_EVENT, p1: boolean, dispatch: Dispatch) => {
  /* eslint-disable */
  const gameFunction: Function = gameEvent === GAME_EVENT.changeP2Health ? changeP2Health : changeP1Health;
  /* eslint-enable */
  return(
  <div className={["relative flex items-center justify-center rounded border border-gray-300",
  // p1 ? "bg-[#1d1e18] text-white" : ""
  ].join(" ")}>
    <div className="h-full w-full flex flex-col items-center justify-around">
      <span>health</span>
      <div className="flex w-full items-center">
        <div className="text-[35px] cursor-pointer" onClick={() => {dispatch(gameFunction(-1));emitGameEvent({ type: gameEvent, data: -1 })}}>-</div>
        <span style={{ margin: "0 auto" }}>{health}</span>
        <div className="text-[35px] cursor-pointer" onClick={() =>{ dispatch(gameFunction(1));emitGameEvent({ type: gameEvent, data: 1 })}}>+</div>
      </div>
    </div>
  </div>
)}

export const renderAP = (ap: number, gameEvent: GAME_EVENT, p1: boolean, dispatch: Dispatch) => {
  /* eslint-disable */
  const gameFunction: Function = gameEvent === GAME_EVENT.changeP2AP ? changeP2AP : changeP1AP;
  /* eslint-enable */
  return(
  <div className={["relative flex items-center justify-center rounded border border-gray-300",
  // p1 ? "bg-[#1d1e18] text-white" : ""
  ].join(" ")}>
    <div className="h-full w-full flex flex-col items-center justify-around">
      <span>AP</span>
      <div className="flex w-full items-center">
        <div className="text-[35px] cursor-pointer" onClick={() => {dispatch(gameFunction(-5));emitGameEvent({ type: gameEvent, data: -5 })}}>-</div>
        <span style={{ margin: "0 auto" }}>{ap}</span>
        <div className="text-[35px] cursor-pointer" onClick={() => {dispatch(gameFunction(5));emitGameEvent({ type: gameEvent, data: 5 })}}>+</div>
      </div>
    </div>
  </div>
)}

export const renderHand = (items: CardInterface[], cardTarget: CARD_TARGET, p1: boolean) => {
  const hidden = p1 ? cardTarget === CARD_TARGET.P2_PLAYER_HAND : cardTarget === CARD_TARGET.P1_PLAYER_HAND;
  return (
    <Hand cardTarget={cardTarget}>
      {items.map((item, index) => (<Card card={item} cardTarget={cardTarget} key={item.id} index={index} hidden={hidden} />))}
    </Hand>
  )
}

export const renderCardRow = (items: CardInterface[][], cardTarget: CARD_TARGET, zoneName?: string) => (
  <>
    {items.map((item, index) => <CardZone items={item} cardTarget={cardTarget} targetIndex={index} zoneName={zoneName} key={index} />)}
  </>
)
export const renderCardRowUpsideDown = (items: CardInterface[][], cardTarget: CARD_TARGET, zoneName?: string) => (
  <>
    {[...items].reverse().map((item, index) => <CardZone items={item} cardTarget={cardTarget} targetIndex={items.length - 1 - index} zoneName={zoneName} key={index} />)}
  </>
)
export const renderCardZone = (items: CardInterface[], cardTarget: CARD_TARGET, zoneName: string) => (
  <CardZone items={items} cardTarget={cardTarget} zoneName={zoneName} />
)