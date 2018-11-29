const _ = require('lodash')

const ARG_NAMES = {
  ORIGIN: '--origin',
  ID: '--id',
  DIFF: '--diff',
}

function processArgs () {
  const config = {}
  for (const arg of process.argv) {
    const [key, value] = arg.split('=')
    if (key === ARG_NAMES.ORIGIN) {
      config.originFileName = value
    }
    if (key === ARG_NAMES.ID) {
      config.originElementId = value
    }
    if (key === ARG_NAMES.DIFF) {
      config.diffFileName = value
    }
  }

  if (!config.originFileName || !config.originElementId || !config.diffFileName) {
    console.error(
      `You must specify arguments` +
      `\n ${ARG_NAMES.ID}=some-tag-id` +
      `\n ${ARG_NAMES.ORIGIN}=input-file.html` +
      `\n ${ARG_NAMES.DIFF}=other-file.html`,
    )

    return process.exit(-1)
  }

  return config
}

function makeElementInfo (element) {
  const result = {}

  for (const attr of element.attributes) {
    let value

    if (attr.name === 'class') {
      // class names will be compared by each class name
      value = `${attr.value}`.toLowerCase().split(' ')
    } else {
      value = `${attr.value}`.toLowerCase()
    }

    result[attr.name] = value
  }

  return result
}

function makeMatchInfo (similarity, element, path, index) {
  const thisPath = index > 0
    ? `${element.tagName}[${index}]`
    : `${element.tagName}`

  return {
    text: element.textContent.trim(),
    similarity: similarity,
    path: [...path, thisPath],
  }
}

function calcSimilarity (info1, info2) {
  let similarity = 0

  const propNames = _.keys(info1)
  for (const propName of propNames) {
    const propValue = info1[propName]
    if (Array.isArray(propValue)) {
      similarity += _.intersection(info1[propName], info2[propName]).length
    } else {
      if (info1[propName] === info2[propName]) {
        similarity++
      }
    }
  }

  return similarity
}

function getBestMatch (children, path, targetElement, bestMatchInfo) {
  const targetElementInfo = makeElementInfo(targetElement)

  let nextBestMatchInfo = bestMatchInfo
  for (let i = 0; i < children.length; i++) {
    const element = children[i]
    const elementInfo = makeElementInfo(element)
    const similarity = calcSimilarity(elementInfo, targetElementInfo)
    const elementMatchInfo = makeMatchInfo(similarity, element, path, i)

    if (similarity > nextBestMatchInfo.similarity) {
      // store this element if it matches best
      nextBestMatchInfo = makeMatchInfo(similarity, element, path, i)
    }

    // check current element children for even better match
    nextBestMatchInfo = getBestMatch(
      element.children,
      elementMatchInfo.path,
      targetElement,
      nextBestMatchInfo,
    )
  }

  return nextBestMatchInfo
}

module.exports = {
  ARG_NAMES,
  processArgs,
  calcSimilarity,
  makeMatchInfo,
  makeElementInfo,
  getBestMatch,
}
