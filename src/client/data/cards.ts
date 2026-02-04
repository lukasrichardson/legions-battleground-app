import { CardInterface } from "@/client/interfaces/CardInterface";
import { CARD_TYPE } from "@/shared/enums/CardType";

export const frt_031: CardInterface = {
  type: CARD_TYPE.UNIFIED,
  name: "Keltor's Explosive Kit",
  img: "https://legionstoolbox.com/wp-content/uploads/2023/06/card_image_38-1.png",
  text: ""
}
export const eor_hd23: CardInterface = {
  type: CARD_TYPE.WARLORD,
  name: "Quartzheart",
  img: "https://legionstoolbox.com/wp-content/uploads/2023/07/EOR-HD23.png",
  text: ""
}
export const eor_hd15: CardInterface = {
  type: CARD_TYPE.SYNERGY,
  name: "Mt Fingar",
  img: "https://legionstoolbox.com/wp-content/uploads/2023/07/EOR-HD15.png",
  text: ""
}
export const BH01_11: CardInterface = {
  type: CARD_TYPE.GUARDIAN,
  name: "Serenesada",
  img: "https://legionstoolbox.com/wp-content/uploads/2023/06/BH01-11.png",
  text: ""
}
export const FRT_008: CardInterface = {
  type: CARD_TYPE.VEIL_REALM,
  name: "Frost Realm",
  img: "https://legionstoolbox.com/wp-content/uploads/2023/06/card_image_15-8.png",
  text: ""
}

// const response = 
// {
//   deck: {
//     deck_id: "1234",
//     name: "Sample Deck Name",
//     cardCount: 50,
//     warlords: [
//       {
//         name: "Quartzheart...",
//         code: "EOR-HD23",
//         image: "https://legionstoolbox.com/wp-content/uploads/2023/07/EOR-HD23.png",
//         legion: "Dwarfs",
//         copies: 1 //or just include on object for each copy instead of a "copies" property
//       }
//     ],
//     synergies: [],
//     guardians: [],
//     veilRealms: [],
//     warriors: [],
//     unifieds: [],
//     fortifieds: [],

//   }
// }

// const response = 
// {
//   deck: {
//     deck_id: "1234",
//     name: "Sample Deck Name",
//     cardCount: 50,
//     cards: [
//       {
//         name: "Quartzheart...",
//         code: "EOR-HD23",
//         image: "https://legionstoolbox.com/wp-content/uploads/2023/07/EOR-HD23.png",
//         legion: "Dwarfs",
//         copies: 1, //or just include on object for each copy instead of a "copies" property
//         type: "Warlord" //can include a type property instead of having separate arrays for each card type 
//       },
//       {
//         name: "Kindle-Haust...",
//         code: "EOR-HD23",
//         image: "https://legionstoolbox.com/wp-content/uploads/2023/07/EOR-HD23.png",
//         legion: "Dwarfs",
//         copies: 1, //or just include on object for each copy instead of a "copies" property
//         type: "Warrior"
//       }
//     ]

//   }
// }