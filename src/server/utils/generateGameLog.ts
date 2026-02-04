export const addGameLog = (gameLog: string[], text: string) => {
  return [...gameLog, generateGameLog(text)];
}
export const generateGameLog = (text: string) => {
  return new Date().toLocaleString("en-US", {timeZone: "America/New_York"}) + "| " + text;
}