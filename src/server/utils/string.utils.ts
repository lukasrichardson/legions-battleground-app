export const renderNumberthSuffix = (number) => {
  if (!number) return "";
  const string = number.toString();
  const lastChar = string[string.length - 1];

  if (string === "11" || string === "12" || string === "13") {
    return "th";
  } else if (lastChar === "1") {
    return "st"
  } else if (lastChar === "2") {
    return "nd"
  } else if (lastChar === "3") {
    return "rd"
  } else {
    return "th"
  }
}