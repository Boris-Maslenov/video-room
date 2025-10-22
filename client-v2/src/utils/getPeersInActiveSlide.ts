export const getPeersInActiveSlide = (groupIndex: number): string[] => {
  const foundGroupElem = document.querySelector(
    `.MediaSlide[data-group-id="${groupIndex}"]`
  );
  const foundPeersElems = foundGroupElem?.querySelectorAll("[data-peer-id]");

  if (foundPeersElems?.length) {
    return Array.from(foundPeersElems)
      .map((elem) => (elem as HTMLElement).dataset.peerId)
      .filter(Boolean) as string[];
  }

  return [];
};
