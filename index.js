const _ = require('lodash')
const fs = require('fs')
const {JSDOM} = require('jsdom')

let originFileName
let originElementId
let diffFileName

function processArgs () {
  for (const arg of process.argv) {
    const [key, value] = arg.split('=')
    if (key === '--origin') {
      originFileName = value
    }
    if (key === '--id') {
      originElementId = value
    }
    if (key === '--diff') {
      diffFileName = value
    }
  }

  if (!originFileName || !originElementId || !diffFileName) {
    console.log(
      `you must specify arguments\n` +
      `--origin="some-input-file"` +
      `--id="some-tag-id"`,
      `--diff="other file"`,
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
  return {
    tagName: `${element.tagName}`.toLowerCase(),
    classes: `${element.className}`.split(' ').map(c => c.toLowerCase()),
    title: `${element.title}`.toLowerCase(),
    id: `${element.id}`.toLowerCase(),
    href: element.href,
    text: `${element.textContent}`.trim().toLowerCase(),
  }
}

function similarity (e1, e2) {
  const info1 = makeElementInfo(e1)
  const info2 = makeElementInfo(e2)

  let similarity = 0

  const propNames = _.keys(info1)
  for (const propName of propNames) {
    const propValue = info1[propName]
    if (Array.isArray(propValue)) {
      similarity += _.intersection(info1.classes, info2.classes).length
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

// run: // node <your_bundled_script>.js <input_origin_file_path> <input_other_sample_file_path>
function main () {
  try {
    processArgs()
    processData()
  } catch (err) {
    console.error(err)
  }
}

main()
