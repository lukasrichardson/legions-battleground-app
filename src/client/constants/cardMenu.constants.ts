import { CARD_TARGET } from '@/shared/enums/CardTarget';
import MenuItemAction from '@/client/enums/MenuItemAction';
import IMenuItem from '@/client/interfaces/IMenuItem';
export const cardMenuItems: IMenuItem[] = [
  {
    key: "0",
    title: "P2_PLAYER",
    icon: null,
    label: "Send to p2 player",
    menuAction: MenuItemAction.MOVE,
    children: [
      {
        key: "1",
        title: CARD_TARGET.P2_PLAYER_HAND,
        icon: null,
        menuAction: MenuItemAction.MOVE,
        label: "Send to p2 player Hand"
      },
      {
        key: "3",
        title: CARD_TARGET.P2_PLAYER_DECK,
        icon: null,
        menuAction: MenuItemAction.MOVE,
        label: "Send to p2 player Deck",
        children: [
          {
            key: "3.1",
            title: CARD_TARGET.P2_PLAYER_DECK,
            icon: null,
            menuAction: MenuItemAction.MOVE,
            label: "Send to p2 player Deck (top)",
          },
          {
            key: "3.2",
            title: CARD_TARGET.P2_PLAYER_DECK,
            icon: null,
            menuAction: MenuItemAction.MOVE,
            label: "Send to p2 player Deck (bottom)",
          },
        ]
      },

      {
        key: "5",
        title: CARD_TARGET.P2_PLAYER_DISCARD,
        icon: null,
        menuAction: MenuItemAction.MOVE,
        label: "Send to p2 player discard"
      },
      {
        key: "7",
        title: CARD_TARGET.P2_PLAYER_ERADICATION,
        icon: null,
        menuAction: MenuItemAction.MOVE,
        label: "Send to p2 player eradication"
      },
      {
        key:"19",
        title: CARD_TARGET.P2_PLAYER_WARRIOR,
        icon: null,
        menuAction: MenuItemAction.MOVE,
        label: "Send to p2 player warrior zone",
        children: [
          {
            key: "19.1",
            title: 0,
            icon: null,
            menuAction: MenuItemAction.MOVE,
            label: "Warrior 1 (Left)"
          },
          {
            key: "19.2",
            title: 1,
            icon: null,
            menuAction: MenuItemAction.MOVE,
            label: "Warrior 2"
          },
          {
            key: "19.3",
            title: 2,
            icon: null,
            menuAction: MenuItemAction.MOVE,
            label: "Warrior 3"
          },
          {
            key: "19.4",
            title: 3,
            icon: null,
            menuAction: MenuItemAction.MOVE,
            label: "Warrior 4"
          },{
            key: "19.5",
            title: 4,
            icon: null,
            menuAction: MenuItemAction.MOVE,
            label: "Warrior 5 (Right)"
          },
        ]
      },
      {
        key:"18",
        title: CARD_TARGET.P2_PLAYER_UNIFIED,
        icon: null,
        menuAction: MenuItemAction.MOVE,
        label: "Send to p2 player unified zone",
        children: [
          {
            key: "18.1",
            title: 0,
            icon: null,
            menuAction: MenuItemAction.MOVE,
            label: "Unififed 1 (Left)"
          },
          {
            key: "18.2",
            title: 1,
            icon: null,
            menuAction: MenuItemAction.MOVE,
            label: "Unififed 2"
          },
          {
            key: "18.3",
            title: 2,
            icon: null,
            menuAction: MenuItemAction.MOVE,
            label: "Unififed 3"
          },
          {
            key: "18.4",
            title: 3,
            icon: null,
            menuAction: MenuItemAction.MOVE,
            label: "Unififed 4"
          },{
            key: "18.5",
            title: 4,
            icon: null,
            menuAction: MenuItemAction.MOVE,
            label: "Unififed 5 (Right)"
          },
          {
            key:"17",
            title: CARD_TARGET.P2_PLAYER_FORTIFIED,
            icon: null,
            menuAction: MenuItemAction.MOVE,
            label: "Send to p2 player fortified zone",
            children: [
              {
                key: "17.1",
                title: 0,
                icon: null,
                menuAction: MenuItemAction.MOVE,
                label: "Fortified 1 (Left)"
              },
              {
                key: "17.2",
                title: 1,
                icon: null,
                menuAction: MenuItemAction.MOVE,
                label: "Fortified 2"
              },
              {
                key: "17.3",
                title: 2,
                icon: null,
                menuAction: MenuItemAction.MOVE,
                label: "Fortified 3"
              },
              {
                key: "17.4",
                title: 3,
                icon: null,
                menuAction: MenuItemAction.MOVE,
                label: "Fortified 4"
              },{
                key: "17.5",
                title: 4,
                icon: null,
                menuAction: MenuItemAction.MOVE,
                label: "Fortified 5 (Right)"
              },
            ]
          },
        ]
      },
    ]
  },
  {
    key: "00",
    title: "P1_PLAYER",
    icon: null,
    menuAction: MenuItemAction.MOVE,
    label: "Send to p1 player",
    children: [
      {
        key: "2",
        title: CARD_TARGET.P1_PLAYER_HAND,
        icon: null,
        menuAction: MenuItemAction.MOVE,
        label: "Send to p1 player Hand"
      },
      
      {
        key: "4",
        title: CARD_TARGET.P1_PLAYER_DECK,
        icon: null,
        menuAction: MenuItemAction.MOVE,
        label: "Send to p1 player Deck",
        children: [
          {
            key: "41",
            title: CARD_TARGET.P1_PLAYER_DECK,
            icon: null,
            menuAction: MenuItemAction.MOVE,
            label: "Send to p1 player Deck (top)"
          },
          {
            key: "4.2",
            title: CARD_TARGET.P1_PLAYER_DECK,
            icon: null,
            menuAction: MenuItemAction.MOVE,
            label: "Send to p1 player Deck (bottom)"
          },
        ]
      },
      
      {
        key: "6",
        title: CARD_TARGET.P1_PLAYER_DISCARD,
        icon: null,
        menuAction: MenuItemAction.MOVE,
        label: "Send to p1 player discard"
      },
      
      {
        key: "8",
        title: CARD_TARGET.P1_PLAYER_ERADICATION,
        icon: null,
        menuAction: MenuItemAction.MOVE,
        label: "Send to p1 player eradication"
      },
      
      {
        key:"20",
        title: CARD_TARGET.P1_PLAYER_WARRIOR,
        icon: null,
        menuAction: MenuItemAction.MOVE,
        label: "Send to p1 player warrior zone",
        children: [
          {
            key: "20.1",
            title: 0,
            icon: null,
            menuAction: MenuItemAction.MOVE,
            label: "Warrior 1 (Left)"
          },
          {
            key: "20.2",
            title: 1,
            icon: null,
            menuAction: MenuItemAction.MOVE,
            label: "Warrior 2"
          },
          {
            key: "20.3",
            title: 2,
            icon: null,
            menuAction: MenuItemAction.MOVE,
            label: "Warrior 3"
          },
          {
            key: "20.4",
            title: 3,
            icon: null,
            menuAction: MenuItemAction.MOVE,
            label: "Warrior 4"
          },{
            key: "20.5",
            title: 4,
            icon: null,
            menuAction: MenuItemAction.MOVE,
            label: "Warrior 5 (Right)"
          },
        ]
      },
      {
        key:"21",
        title: CARD_TARGET.P1_PLAYER_UNIFIED,
        icon: null,
        menuAction: MenuItemAction.MOVE,
        label: "Send to p1 player unified zone",
        children: [
          {
            key: "21.1",
            title: 0,
            icon: null,
            menuAction: MenuItemAction.MOVE,
            label: "Unified 1 (Left)"
          },
          {
            key: "21.2",
            title: 1,
            icon: null,
            menuAction: MenuItemAction.MOVE,
            label: "Unified 2"
          },
          {
            key: "21.3",
            title: 2,
            icon: null,
            menuAction: MenuItemAction.MOVE,
            label: "Unified 3"
          },
          {
            key: "21.4",
            title: 3,
            icon: null,
            menuAction: MenuItemAction.MOVE,
            label: "Unified 4"
          },{
            key: "21.5",
            title: 4,
            icon: null,
            menuAction: MenuItemAction.MOVE,
            label: "Unified 5 (Right)"
          },
        ]
      },
      {
        key:"22",
        title: CARD_TARGET.P1_PLAYER_FORTIFIED,
        icon: null,
        menuAction: MenuItemAction.MOVE,
        label: "Send to p1 player fortified zone",
        children: [
          {
            key: "22.1",
            title: 0,
            icon: null,
            menuAction: MenuItemAction.MOVE,
            label: "Fortified 1 (Left)"
          },
          {
            key: "22.2",
            title: 1,
            icon: null,
            menuAction: MenuItemAction.MOVE,
            label: "Fortified 2"
          },
          {
            key: "22.3",
            title: 2,
            icon: null,
            menuAction: MenuItemAction.MOVE,
            label: "Fortified 3"
          },
          {
            key: "22.4",
            title: 3,
            icon: null,
            menuAction: MenuItemAction.MOVE,
            label: "Fortified 4"
          },{
            key: "22.5",
            title: 4,
            icon: null,
            menuAction: MenuItemAction.MOVE,
            label: "Fortified 5 (Right)"
          },
        ]
      },
    ]
  },
  {
    key: "000",
    title: "VIEW",
    icon: null,
    menuAction: MenuItemAction.VIEW,
    label: "View Cards In Zone"
  },
  {
    key: "0000",
    title: "VIEW_TOP_X",
    icon: null,
    menuAction: MenuItemAction.VIEW_TOP_X,
    label: "View Top X Cards",
    children: [
      {
        key: "0000.1",
        title: 1,
        icon: null,
        menuAction: MenuItemAction.VIEW_TOP_X,
        label: "View Top 1 Card"
      },
      {
        key: "0000.2",
        title: 2,
        icon: null,
        menuAction: MenuItemAction.VIEW_TOP_X,
        label: "View Top 2 Cards"
      },
      {
        key: "0000.3",
        title: 3,
        icon: null,
        menuAction: MenuItemAction.VIEW_TOP_X,
        label: "View Top 3 Cards"
      },
      {
        key: "0000.4",
        title: 4,
        icon: null,
        menuAction: MenuItemAction.VIEW_TOP_X,
        label: "View Top 4 Cards"
      },
      {
        key: "0000.5",
        title: 5,
        icon: null,
        menuAction: MenuItemAction.VIEW_TOP_X,
        label: "View Top 5 Cards"
      },
      {
        key: "0000.6",
        title: 6,
        icon: null,
        menuAction: MenuItemAction.VIEW_TOP_X,
        label: "View Top 6 Cards"
      },
      {
        key: "0000.7",
        title: 7,
        icon: null,
        menuAction: MenuItemAction.VIEW_TOP_X,
        label: "View Top 7 Cards"
      },
      {
        key: "0000.8",
        title: 8,
        icon: null,
        menuAction: MenuItemAction.VIEW_TOP_X,
        label: "View Top 8 Cards"
      },
      {
        key: "0000.9",
        title: 9,
        icon: null,
        menuAction: MenuItemAction.VIEW_TOP_X,
        label: "View Top 9 Cards"
      },
      {
        key: "0000.10",
        title: 10,
        icon: null,
        menuAction: MenuItemAction.VIEW_TOP_X,
        label: "View Top 10 Cards"
      },
    ]
  },
  {
    key: "00000",
    title: "SHUFFLE",
    icon: null,
    menuAction: MenuItemAction.SHUFFLE,
    label: "Shuffle"
  },
  {
    key: "000000",
    title: "FLIP",
    icon: null,
    menuAction: MenuItemAction.FLIP,
    label: "Flip Card"
  },
];
export const deckMenuItems: IMenuItem[] = [
  {
    key: "0000000",
    title: "PLUNDER",
    icon: null,
    menuAction: MenuItemAction.PLUNDER,
    label: "Plunder"
  }
];