export function blurBackgroundImage(elementSelector, blurRadius) {
    // Get the element
    let element = document.querySelector(elementSelector);
  
    // Create a new <style> element
    let style = document.createElement('style');
    style.type = 'text/css';
  
    // Define the CSS rule to apply the blur effect
    let cssRule = elementSelector + ' { filter: blur(' + blurRadius + 'px); }';
  
    // Set the CSS rule as the content of the <style> element
    if (style.styleSheet) {
      style.styleSheet.cssText = cssRule;
    } else {
      style.appendChild(document.createTextNode(cssRule));
    }
  
    // Add the <style> element to the document's head
    document.head.appendChild(style);
  }