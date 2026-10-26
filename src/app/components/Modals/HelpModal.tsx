import Modal from "./Modal";
import { useAppDispatch, useAppSelector } from "@/client/redux/hooks";
import { closeHelpModal } from "@/client/redux/modalsSlice";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function HelpModal() {
  const pathName = usePathname();
  const dispatch = useAppDispatch();
  const { helpModalOpen } = useAppSelector((state) => state.modalsState);
  const { sandboxMode } = useAppSelector((state) => state.gameState);
  const inGame = pathName === "/play";

  return (
    <Modal
      open={helpModalOpen}
      ariaLabel="Help"
      showCloseButton
      closeModal={() => dispatch(closeHelpModal())}
      modalHeader={
        <div className="py-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-200/60">Help</div>
          <div className="mt-0.5 text-lg font-semibold text-white">{inGame ? "Battleground guide" : "Getting started"}</div>
        </div>
      }
      modalContent={inGame ? <PlayHelpContent sandboxMode={sandboxMode} /> : <HomeHelpContent />}
    />
  );
}

function PlayHelpContent({ sandboxMode }: { sandboxMode: boolean }) {
  return (
    <div className="space-y-6 text-sm leading-6 text-slate-300">
      <div className="border border-sky-200/20 bg-sky-300/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <strong className="text-base text-white">{sandboxMode ? "Sandbox controls are active" : "Regular match controls are active"}</strong>
          <span className="border border-sky-200/25 bg-slate-950/35 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-200">
            {sandboxMode ? "Sandbox" : "Regular match"}
          </span>
        </div>
        <p className="mt-2 text-slate-300">
          {sandboxMode
            ? "This guide covers the play-screen controls, card tools, sidebar, dialogs, and Sandbox utilities."
            : "This guide covers the play-screen controls, card tools, sidebar, dialogs, and match interface."}
        </p>
      </div>

      <HelpSection number="1" title="Open card controls">
        <HelpList>
          <li><strong>Desktop:</strong> click or right-click a card to open its action menu. If hover menus are enabled, hovering also opens it.</li>
          <li><strong>Touch or compact screens:</strong> tap a card to open the card-details sheet and its available actions.</li>
          <li>Use the image control in card details to open a larger card image. Escape or the close button returns to the previous dialog.</li>
          <li>The desktop inspector shows a larger preview of the card currently under your pointer.</li>
        </HelpList>
      </HelpSection>

      <HelpSection number="2" title="Move cards between zones">
        <HelpList>
          <li>Drag a card directly onto another zone, or use its action menu when you want an exact destination.</li>
          <li>Card menus include available moves such as Draw, To Hand, or sending a card to another board zone.</li>
          <li>When moving a card to a deck, choose the top or bottom destination offered by the menu.</li>
          <li>For cards that use a numbered Warrior, Unified, or Fortified zone, choose <strong>Play card</strong> and then select a highlighted empty destination. Use Cancel to leave selection mode.</li>
        </HelpList>
      </HelpSection>

      <HelpSection number="3" title="Browse decks and piles">
        <HelpList>
          <li>The number displayed on a pile is its total card count. The card shown on the board is the card available for direct interaction.</li>
          <li>Open a pile and choose <strong>View</strong> or <strong>Search</strong> to use the pile browser. Select a card there to inspect it or run an action.</li>
          <li>Dragging from Deck, Discard, Eradication, or Tokens moves the currently displayed top card.</li>
          <li>Deck identities and other hidden cards remain concealed by the interface until an available action reveals or views them.</li>
        </HelpList>
      </HelpSection>

      <HelpSection number="4" title="Adjust card values">
        <HelpList>
          <li>Available card controls let you increase or decrease attack modifiers, generic counters, cooldown, Warlord DCM, and Guardian AP.</li>
          <li>On desktop, applicable controls appear on the card or in its menu. On compact screens, they appear as full-size buttons in the card-details sheet.</li>
          <li>Flip, activate, set, conscript, shuffle, and similar controls appear only when they apply to the selected card or pile.</li>
        </HelpList>
      </HelpSection>

      <HelpSection number="5" title="Use the sidebar">
        <div className="grid gap-3 sm:grid-cols-2">
          <ControlNote title="Card inspector">Hover or select a card to see a larger preview. On compact screens, open the card-inspector panel.</ControlNote>
          <ControlNote title="Activity and chat">Review recent actions and type a message to your opponent. Press Enter to send; Shift+Enter adds a new line.</ControlNote>
          <ControlNote title="Roll D6">Use the die button to generate a shared result. The roll is recorded in match activity.</ControlNote>
          <ControlNote title="Navigation and actions">Open the menu to reach match actions, other pages, Help, and—during Sandbox—Tools & settings.</ControlNote>
        </div>
      </HelpSection>

      <HelpSection number="6" title="Dialogs and settings">
        <HelpList>
          <li>Desktop dialogs can be dragged by their header. Dialog content scrolls when it is taller than the available screen.</li>
          <li>Press Escape to close the topmost menu or dialog. Close buttons remain available on touch screens.</li>
          {sandboxMode && <li><strong>Tools & settings</strong> can change decks, reset the board, show both hands, switch menu styles, enable hover menus, and change dialog transparency.</li>}
        </HelpList>
      </HelpSection>

      <HelpSection number="7" title={sandboxMode ? "Sandbox actions" : "Match interface"}>
        {sandboxMode ? (
          <HelpList>
            <li><strong>Switch to P1/P2</strong> changes perspective and lets you control the other side.</li>
            <li><strong>Undo/Redo</strong> steps backward or forward through Sandbox changes when history is available.</li>
            <li><strong>Mulligan</strong> replaces the current hand. <strong>Leave match</strong> returns to the lobby.</li>
          </HelpList>
        ) : (
          <HelpList>
            <li>Setup choices appear in blocking prompts; use the displayed buttons and wait when the interface says the opponent must respond.</li>
            <li>The center status bar displays the current phase, turn, and active side. <strong>Advance phase</strong> appears there when the control is available to you.</li>
            <li>Offer or respond to a draw, concede, and leave the match from the sidebar menu.</li>
          </HelpList>
        )}
      </HelpSection>
    </div>
  );
}

function HomeHelpContent() {
  return (
    <div className="space-y-5 text-sm leading-6 text-slate-300">
      <p>Create or join a room from the Play area. You need a saved deck before entering a match.</p>
      <HelpSection number="1" title="Prepare a deck">
        <p>Build a deck in Battleground or import one from Legions Toolbox using the deck ID shown in the Toolbox deck URL.</p>
      </HelpSection>
      <HelpSection number="2" title="Choose a room">
        <p>Create a Sandbox room for unrestricted testing, or create a regular room for guided setup, phases, and two-player match controls.</p>
      </HelpSection>
      <HelpSection number="3" title="Invite the other player">
        <p>Share the room name and password if one was set. Regular matches require two different signed-in accounts.</p>
      </HelpSection>
    </div>
  );
}

function HelpSection({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <span className="grid size-7 shrink-0 place-items-center border border-sky-200/30 bg-sky-300/10 text-xs font-bold text-sky-200">{number}</span>
        <h2 className="text-base font-semibold text-white">{title}</h2>
      </div>
      <div className="pl-0 sm:pl-10">{children}</div>
    </section>
  );
}

function HelpList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5 marker:text-sky-300/70">{children}</ul>;
}

function ControlNote({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold text-sky-100">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-400">{children}</p>
    </div>
  );
}
