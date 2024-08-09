export function removeChildElements(parentElement, remainCount) {
    
    let childCount = parentElement.childElementCount;
    let elementsToRemove = childCount - remainCount;

    // Remove elements from the bottom
    for (let i = 0; i < elementsToRemove; i++) {
        parentElement.removeChild(parentElement.lastElementChild);
    }
}