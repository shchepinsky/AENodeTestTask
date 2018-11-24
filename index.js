const _ = require('lodash')
const fs = require('fs')
const {JSDOM} = require('jsdom')

const ARGS_NAMES = {
  ORIGIN: '--origin',
  ID: '--id',
  DIFF: '--diff'
}

let originFileName
let originElementId
let diffFileName

function processArgs () {
  for (const arg of process.argv) {
    const [key, value] = arg.split('=')
    if (key === ARGS_NAMES.ORIGIN) {
      originFileName = value
    }
    if (key === ARGS_NAMES.ID) {
      originElementId = value
    }
    if (key === ARGS_NAMES.DIFF) {
      diffFileName = value
    }
  }

  if (!originFileName || !originElementId || !diffFileName) {
    console.log(
      `You must specify arguments` +
      `\n ${ARGS_NAMES.ID}=some-tag-id`,
      `\n ${ARGS_NAMES.ORIGIN}=input-file.html` +
      `\n ${ARGS_NAMES.DIFF}=other-file.html`,
    )

    process.exit(-1)
  }
}

function processData () {
  const originFileString = fs.readFileSync(originFileName)
  const diffFileString = fs.readFileSync(diffFileName)
  const originJsDom = new JSDOM(originFileString)
  const diffJsDom = new JSDOM(diffFileString)

  const originElement = originJsDom.window.document.querySelector(`#${originElementId}`)

  const matchList = []
  traverse(diffJsDom.window.document.body, originElement, matchList)

  const bestMatch = matchList[0]
  console.log(`${bestMatch.text}\n` + bestMatch.path)
}

function makeElementInfo (element) {
  const result = {}

  for(const attr of element.attributes) {
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

function similarity (e1, e2) {
  const info1 = makeElementInfo(e1)
  const info2 = makeElementInfo(e2)

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

function traverse (element, target, matchList, path = [], index) {
  const thisPath = index > 0
    ? `${element.tagName}[${index}]`
    : `${element.tagName}`

  const matchInfo = {
    text: element.textContent.trim(),
    similarity: similarity(target, element),
    path: [...path, thisPath].join(' > ').toLowerCase(),
  }

  const bestMatch = matchList[0]
  bestMatch
    ? matchInfo.similarity > bestMatch.similarity && matchList.unshift(matchInfo)
    : matchList.push(matchInfo)

  path.push(thisPath)
  for (let i = 0; i < element.children.length; i++) {
    const child = element.children[i]
    traverse(child, target, matchList, path, i)
  }

  path.pop()
}

function main () {
  try {
    processArgs()
    processData()
  } catch (err) {
    console.error(err)
  }
}

main()
