const interactiveElementSelector = [
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "[contenteditable='true']",
  "[role='button']",
  "[role='combobox']",
  "[role='dialog']",
  "[role='textbox']",
].join(",");

export function eventStartedInInteractiveElement(event: Pick<Event, "target">) {
  return (
    event.target instanceof HTMLElement &&
    event.target.closest(interactiveElementSelector) !== null
  );
}
