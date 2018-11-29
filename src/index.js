const _ = require('lodash')
const fs = require('fs')
const {JSDOM} = require('jsdom')
const {
  processArgs,
  makeMatchInfo,
  getBestMatch,
} = require('./utils')

function main () {
  try {
    const {
      originFileName,
      diffFileName,
      originElementId,
    } = processArgs()

    const originFileString = fs.readFileSync(originFileName)
    const diffFileString = fs.readFileSync(diffFileName)
    const originJsDom = new JSDOM(originFileString)
    const diffJsDom = new JSDOM(diffFileString)

    const originElement = originJsDom.window.document.querySelector(`#${originElementId}`)
    let nextElement = diffJsDom.window.document.body
    let bestMatchInfo = makeMatchInfo(0, nextElement, [], 0)

    bestMatchInfo = getBestMatch(nextElement.children, bestMatchInfo.path, originElement, bestMatchInfo)

    const path = bestMatchInfo.path.join(' > ').toLowerCase()
    console.log(`${bestMatchInfo.text}\n` + path)
  } catch (err) {
    console.error(err)
  }
}

main()
