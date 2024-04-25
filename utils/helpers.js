import { buildBlock, decorateBlock, loadBlock } from '../scripts/aem.js';
import createTag from './tag.js';

/**
 * * @param {HTMLElement} element the element with the parent undesired wrapper, like <p></p>
 * * @param {targetSelector} string selector of the target element
 * result: removed the undesired wrapper
 */
export function removeOuterElementLayer(element, targetSelector) {
  const targetElement = element.querySelector(targetSelector);
  if (targetElement) {
    const parent = targetElement.parentNode;
    if (parent) parent.replaceWith(targetElement);
  }
}

/**
 * * @param {HTMLElement} element the elemen/block with mutilple child
 * * that you want to combine that into single div only
 * result: single div with all children elements
 * e.g. input: <div class="wrapper">
 * *            <div class="unwanted-wrapper-one"> <p/> </div>
 * *            <div class="unwanted-wrapper-two"> <br/> </div>
 * *           </div>
 * * output: <div class="wrapper">
 * *            <div>
 * *                <p/> <br/>
 * *            </div>
 * *         </div>
 */
export function combineChildrenToSingleDiv(element) {
  const targetChildren = element.querySelectorAll(':scope > div');
  if (targetChildren.length === 0) {
    return;
  }

  const singleDiv = document.createElement('div');
  targetChildren.forEach((targetChild) => {
    const children = Array.from(targetChild.childNodes);
    children.forEach((childElement) => {
      singleDiv.appendChild(childElement);
    });
    targetChild.remove();
  });

  element.append(singleDiv);
}

/**
 * * @param {HTMLElement} element
 * * @param {string} targetTag, like 'ul' or 'div'
 * * @param {string} className
 * result: return the new element with inner content of the element, desired tag and css class
 */
export function changeTag(element, targetTag, className) {
  const newElClass = className || '';
  const innerContent = element.innerHTML;
  const newTagElement = createTag(
    targetTag,
    { className: newElClass },
    innerContent,
  );

  return newTagElement;
}

/**
 * * @param {string} url the href of a link element
 * result: return `_self` or `_blank` if the link has the same host
 */
export function returnLinkTarget(url) {
  const currentHost = window.location.host;
  const urlObject = new URL(url);
  const isSameHost = urlObject.host === currentHost;

  // take in pathname that should be opened in new tab, in redirects excel
  const redirectExternalPaths = ['/history', '/chat'];
  const redirectToExternalPath = redirectExternalPaths.includes(
    urlObject.pathname,
  );

  if (!isSameHost || redirectToExternalPath) {
    return '_blank';
  }
  return '_self';
}

// as the blocks are loaded in aysnchronously, we don't have a specific timing
// that the all blocks are loaded -> cannot use a single observer to
// observe all blocks, so use functions here in blocks instead
// eslint-disable-next-line max-len
const requireRevealWrapper = ['slide-reveal-up', 'slide-reveal-up-slow'];

export function addRevealWrapperToAnimationTarget(element) {
  const revealWrapper = createTag('div', { className: 'slide-reveal-wrapper' });
  const parent = element.parentNode;
  // Insert the wrapper before the element
  parent.insertBefore(revealWrapper, element);
  revealWrapper.appendChild(element);
}

// eslint-disable-next-line max-len
export function addAnimatedClassToElement(
  targetSelector,
  animatedClass,
  delayTime,
  targetSelectorWrapper,
) {
  const target = targetSelectorWrapper.querySelector(targetSelector);
  if (target) {
    target.classList.add(animatedClass);
    if (delayTime) target.style.transitionDelay = `${delayTime}s`;
    if (requireRevealWrapper.indexOf(animatedClass) !== -1) {
      addRevealWrapperToAnimationTarget(target);
    }
  }
}

// eslint-disable-next-line max-len
export function addAnimatedClassToMultipleElements(
  targetSelector,
  animatedClass,
  delayTime,
  targetSelectorWrapper,
  staggerTime,
) {
  const targets = targetSelectorWrapper.querySelectorAll(targetSelector);
  if (targets) {
    targets.forEach((target, i) => {
      target.classList.add(animatedClass);
      if (delayTime) target.style.transitionDelay = `${delayTime * (i + 1)}s`;
      if (staggerTime) { target.style.transitionDelay = `${delayTime + staggerTime * (i + 1)}s`; }
      if (requireRevealWrapper.indexOf(animatedClass) !== -1) {
        addRevealWrapperToAnimationTarget(target);
      }
    });
  }
}

export function addInviewObserverToTriggerElement(triggerElement) {
  const observerOptions = {
    threshold: 0.25, // show when is 25% in view
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  observer.observe(triggerElement);
}

// eslint-disable-next-line max-len
export function addInViewAnimationToSingleElement(
  targetElement,
  animatedClass,
  triggerElement,
  delayTime,
) {
  // if it's HTML element
  if (targetElement.nodeType === 1) {
    targetElement.classList.add(animatedClass);
    if (requireRevealWrapper.indexOf(animatedClass) !== -1) {
      addRevealWrapperToAnimationTarget(targetElement);
    }
  }
  // if it's string only, which should be a selector
  if (targetElement.nodeType === 3) {
    addAnimatedClassToElement(
      targetElement,
      animatedClass,
      triggerElement,
      delayTime,
    );
  }
  const trigger = triggerElement || targetElement;
  addInviewObserverToTriggerElement(trigger);
}

export function addInViewAnimationToMultipleElements(
  animatedItems,
  triggerElement,
  staggerTime,
) {
  // set up animation class
  animatedItems.forEach((el, i) => {
    const delayTime = staggerTime ? i * staggerTime : null;
    if (Object.prototype.hasOwnProperty.call(el, 'selector')) {
      addAnimatedClassToElement(
        el.selector,
        el.animatedClass,
        delayTime,
        triggerElement,
      );
    }
    if (Object.prototype.hasOwnProperty.call(el, 'selectors')) {
      // eslint-disable-next-line max-len
      addAnimatedClassToMultipleElements(
        el.selectors,
        el.animatedClass,
        el.staggerTime,
        triggerElement,
      );
    }
  });

  // add `.in-view` to triggerElement, so the elements inside will start animating
  addInviewObserverToTriggerElement(triggerElement);
}

export function getBlockColumnValues(block, column, content = 'innerHTML') {
  return [...block.children].map(
    (uri) => [...uri.children]?.[column]?.[content],
  );
}

/**
 * Maps URI keys to their corresponding properties.
 *
 * This function takes an array of URI keys and an array of properties, and
 * creates a map where each URI key is associated with its corresponding property.
 *
 * @param {string[]} uriKeys - An array of URI keys.
 * @param {any[]} properties - An array of properties.
 * @returns {Map<string, any>} - A map where URI keys are mapped
 * to their corresponding properties.
 */
export function mapKeysProperties(uriKeys, properties) {
  const titlesMap = new Map();
  uriKeys.forEach((key, i) => {
    titlesMap.set(key, properties[i]);
  });

  return titlesMap;
}

export async function loadLoading() {
  const loadingBlock = buildBlock('loading', '');
  const body = document.querySelector('body');
  body.appendChild(loadingBlock);
  decorateBlock(loadingBlock);
  body.classList.add('no-scroll');
  await loadBlock(loadingBlock);
  return loadingBlock;
}

/**
 * To fetch svg
 * @param {String} iconName svg file name
 * @param {String} path svg file path
 */
export async function fetchSvg(iconName, path) {
  try {
    const iconPath = path ? `${path}/${iconName}` : `/icons/${iconName}`;
    const response = await fetch(`${window.hlx.codeBasePath}${iconPath}.svg`);
    if (response.ok) {
      const svg = await response.text();
      return svg;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
  return null;
}

export function formatFormData(data) {
  let formBody = [];
  Object.entries(data).forEach(([key, value]) => {
    const encodedKey = encodeURIComponent(key);
    const encodedValue = encodeURIComponent(value);
    formBody.push(`${encodedKey}=${encodedValue}`);
  });
  formBody = formBody.join('&');
  return formBody;
}

export async function fetchRates(base = 'USD') {
  const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
  const { rates } = await res.json();
  return rates;
}

export default {
  removeOuterElementLayer,
  changeTag,
  returnLinkTarget,
  addInViewAnimationToSingleElement,
  addInViewAnimationToMultipleElements,
  addInviewObserverToTriggerElement,
  getBlockColumnValues,
  mapKeysProperties,
};
