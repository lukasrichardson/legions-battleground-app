export const selectCardHelper = (selectedCards, card) => {
  const alreadySelected = selectedCards.find(c => c.id === card.id);
  if (alreadySelected) {
    if (selectedCards.length === 1) {
      return [];
    } else return [card];
  } else return [card];
}

export const multiSelectCardHelper = (selectedCards, card) => {
  const alreadySelected = selectedCards.find(c => c.id === card.id);
  if (alreadySelected) {
    return selectedCards.filter(c => c.id !== card.id);
  } else return [...selectedCards, card];
}