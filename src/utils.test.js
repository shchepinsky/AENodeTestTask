const {JSDOM} = require('jsdom')
const {
  ARG_NAMES,
  processArgs,
  makeElementInfo,
  calcSimilarity,
  makeMatchInfo,
  getBestMatch,
} = require('./utils')

describe('Test Suite Name', () => {
  const id = 'make-everything-ok-button'
  const className = 'btn btn-success'
  const href = '#ok'
  const title = 'Make-Button'
  const rel = 'next'
  const text = 'Make everything OK'

  const testDOM = new JSDOM()
  const {document} = testDOM.window

  const testElement = document.createElement('a')
  testElement.id = id
  testElement.className = className
  testElement.href = href
  testElement.title = title
  testElement.rel = rel
  testElement.textContent = text

  it('makeElementInfo', () => {
    const elementInfo = makeElementInfo(testElement)
    expect(elementInfo).toEqual({
      'id': id.toLowerCase(),
      'class': className.toLowerCase().split(' '),
      'href': href.toLowerCase(),
      'title': title.toLowerCase(),
      'rel': rel.toLowerCase(),
    })
  })

  it('calcSimilarity', () => {
    const elementInfo1 = {
      'id': id.toLowerCase(),
      'class': className.toLowerCase().split(' '),
      'href': href.toLowerCase(),
      'title': title.toLowerCase(),
      'rel': rel.toLowerCase(),
    }

    const elementInfo2 = {
      'id': id.toLowerCase(),
      'href': href.toLowerCase(),
    }

    const similarity = calcSimilarity(elementInfo1, elementInfo2)
    expect(similarity).toBe(2)
  })

  it('makeMatchInfo', () => {
    const testIndex = 3
    const testSimilarity = 5
    const matchInfo = makeMatchInfo(testSimilarity, testElement, ['BODY'], testIndex)
    expect(matchInfo).toEqual({
      text: text,
      similarity: testSimilarity,
      path: ['BODY', `${testElement.tagName}[${testIndex}]`],
    })
  })

  it('getBestMatch', () => {
    const testId = 'make-everything-ok-button'
    const diffJsDom = new JSDOM(
      `<body>
        <div class="panel-body">
          <a
            class="btn btn-danger"
            href="#ok"
            title="Make-Button"
            onclick="window.close(); return false;">
            Break everyone's OK
          </a> 
          <a
            id="${testId}"
            class="btn btn-success"
            href="#ok"
            title="Make-Button"
            rel="next"
            onclick="window.okDone(); return false;">
            ${text}
          </a>
        </div>
      </body>`,
    )

    const originElement = diffJsDom.window.document.querySelector(`#${testId}`)
    let nextElement = diffJsDom.window.document.body
    let bestMatchInfo = makeMatchInfo(0, nextElement, [], 0)

    bestMatchInfo = getBestMatch(nextElement.children, bestMatchInfo.path, originElement, bestMatchInfo)

    expect(bestMatchInfo).toEqual({
      text: text,
      similarity: 7,
      path: ['BODY', 'DIV', `${testElement.tagName}[${1}]`],
    })
  })

  it('processArgs', () => {
    const oldArgs = process.argv

    const testArgId = 'testArgId'
    const testArgDiffFileName = 'testArgDiffFileName'
    const testArgOriginFileName = 'testArgOriginFileName'

    process.argv = [
      `${ARG_NAMES.ID}=${testArgId}`,
      `${ARG_NAMES.DIFF}=${testArgDiffFileName}`,
      `${ARG_NAMES.ORIGIN}=${testArgOriginFileName}`,
    ]

    const config = processArgs()

    process.argv = oldArgs

    expect(config).toEqual({
      originFileName: testArgOriginFileName,
      originElementId: testArgId,
      diffFileName: testArgDiffFileName,
    })
  })

  it('processArgs: missing arg', () => {
    const error = console.error
    console.error = jest.fn()
    process.exit = jest.fn()
    processArgs()
    expect(process.exit).toHaveBeenCalled()
    expect(console.error).toHaveBeenCalled()

    console.error = error
  })
})
