import { CardInterface } from "../../shared/interfaces/CardInterface";

export const shuffle = (deck: CardInterface[]) => {
  for (let i = 0 ; i < deck.length ; i ++) {
    const shuffle = Math.floor(Math.random() * (deck.length));
    [deck[i], deck[shuffle]] = [deck[shuffle], deck[i]];
  }

  return deck;
}