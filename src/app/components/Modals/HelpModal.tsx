import Modal from "./Modal";
import { useAppDispatch, useAppSelector } from "@/client/redux/hooks";
import { closeHelpModal } from "@/client/redux/modalsSlice";
import { usePathname } from "next/navigation";

const ModalConstants = {
  ModalHeaderText: "Help",
}

export default function HelpModal () {
  const pathName = usePathname();
  const dispatch = useAppDispatch();
  const { helpModalOpen } = useAppSelector((state) => state.modalsState);

  const {
    ModalHeaderText
  } = ModalConstants;

  const homeHelpContent = () => (
      <div>
        <h4>Creating a game</h4>
        <div>
          <span>- Click Create New Game to start a new game of Legions Realms At War.</span>
        </div>
        <span>- You need a <a href="https://legionstoolbox.com/my-decks" target="_blank" className="cursor-pointer" style={{textDecoration: "underline", color: "#37327F"}}>Legions ToolBox</a> Deck Id in order to play</span>
        <div>
          <span>- To Find your Legions Toolbox Deck Id:</span>
        </div>
        <div>
          <span>1. Navigate your deck on Legions Toolbox.</span>
        </div>
        <div>
          <span>2. Copy the 4 digits after the = sign in the url of your browser.</span>
        </div>
        <div>
          <span>3. You can paste this id as your deck id when creating or joing a game on Legions Battleground.</span>
        </div>
      </div>
  )
  const playHelpContent = () => {
    return(
      <div>
        <h4>Features / How To Play</h4>
        <div>
          <span>- Drag Cards to Move them between zones.</span>
        </div>
        <div>
          <span>- You can see other options for interacting with cards and piles of cards by right clicking on them.</span>
        </div>
        <div>
          <span>- Dragging from a deck or pile (discard, eradication etc) will drag the top card</span>
        </div>
        <div>
          <span>- Reset Game will start a new game with the decks that are currently being used</span>
        </div>
        <div>
          <span>- Switch to P1/P2 will swap your perspective and give you control of the other player/board</span>
        </div>
        <div>
          <span>- You can add attack and generic counters by hovering a card in play and clicking the associated arrows</span>
        </div>
        <div>
          <span>- Leave Game will return you to the Home Page. The game room will close automatically if there are zero players in it</span>
        </div>
        <div>
          <span>- you can drag modals around the screen to view the game board while searching</span>
        </div>
      </div>
    )
  }
  const renderModalContent = () => {
    if (pathName === "/") {
      return homeHelpContent();
    } else {
      return playHelpContent();
    }
  }
  return (
    <Modal
      open={helpModalOpen}
      closeModal={() => dispatch(closeHelpModal())}
      modalHeader={<span>{ModalHeaderText}</span>}
      modalContent={renderModalContent()}
    />
  )
}