'use strict'
import Blocks from './blocks.js'
import { playChange, playDrop, playBreak } from './sound.js'

export default class Tetris {
  constructor() {
    //setting
    this.N = 20
    this.M = 10
    this.score = 0
    this.level = 1
    this.duration = 1000
    this.time = 1
    this.timeInterval = undefined
    this.holdBlock = null
    this.canHold = true

    //dom
    this.stage = document.querySelector('.stage')
    this.scoreScreen = document.querySelector('.score')
    this.levelScreen = document.querySelector('.level')

    //block
    this.blockInfo = undefined
    this.movingBlock = undefined
    this.downInterval = undefined
    //nextblock
    this.nextBlocks = []

    //events
    document.addEventListener('keydown', (e) => {
      const preventKeys = [37, 38, 39, 40, 32]
      if (preventKeys.includes(e.keyCode)) {
        e.preventDefault()
      }

      switch (e.keyCode) {
        case 39:
          this.moveBlock('m', 1)
          break
        case 37:
          this.moveBlock('m', -1)
          break
        case 40:
          this.moveBlock('n', 1)
          break
        case 38:
          this.changeDirection()
          break
        case 32:
          this.dropBlock()
          break
        case 67:
          this.hold()
          break
        default:
          break
      }
    })
    const restart = document.querySelector('.restart')
    restart.addEventListener('click', () => {
      this.reStart()
    })
  }

  hold() {
    if (!this.canHold) return

    clearInterval(this.downInterval)

    // 🟢 현재 화면의 블록 먼저 제거
    const movingBlocks = document.querySelectorAll('.moving')
    movingBlocks.forEach((block) => {
      block.classList.remove(this.blockInfo.type, 'moving')
    })

    if (this.holdBlock === null) {
      this.holdBlock = this.blockInfo.type
      this.makeNewBlock()
    } else {
      const temp = this.blockInfo.type
      this.blockInfo = {
        type: this.holdBlock,
        direction: 0,
        n: 0,
        m: 3,
      }
      this.movingBlock = { ...this.blockInfo }
      this.holdBlock = temp
      this.renderBlock()
      this.checkNextBlock('start')
    }

    // 🟢 그 후 hold 영역 렌더링
    this.renderHoldBlock()
    this.canHold = false
  }

  init() {
    this.score = 0
    this.scoreScreen.innerText = this.score
    this.level = 1
    this.duration = 1000
    this.levelScreen.innerHTML = this.level
    this.timeInterval = setInterval(() => {
      this.time += 1
      if (this.time % 5 == 0) {
        this.setSpeed()
      }
    }, 1000)

    this.nextBlocks = []
    for (let i = 0; i < 4; i++) {
      this.makeNextBlock()
    }
    this.makeGround()
    this.makeNewBlock()
  }

  setSpeed() {
    if (this.duration <= 120) {
      return
    } else {
      this.duration -= 20
      this.level += 1
      if (this.level === 45) {
        this.level = '45(MAX)'
      }
      this.levelScreen.innerHTML = this.level
      console.log(this.duration)
    }
  }

  makeGround() {
    this.ground = []
    for (let i = 0; i < this.N; i++) {
      this.ground.push('<tr>')
      for (let j = 0; j < this.M; j++) {
        this.ground.push('<td></td>')
      }
      this.ground.push('</tr>')
    }
    this.stage.innerHTML = this.ground.join('')
  }

  makeNextBlock() {
    const blockArray = Object.entries(Blocks)
    const randomIndex = Math.floor(Math.random() * blockArray.length)
    this.nextBlocks.push(blockArray[randomIndex][0])
  }

  renderNextBlock() {
    const next = document.querySelector('.next')
    let temp = []
    for (let i = 0; i < 4; i++) {
      temp.push(
        `<img class='tetris' src="./img/${this.nextBlocks[i]}.png" alt=${this.nextBlocks[i]}"/>`
      )
    }
    next.innerHTML = temp.join('')
  }

  makeNewBlock() {
    const next = this.nextBlocks.shift()
    clearInterval(this.downInterval)

    this.downInterval = setInterval(() => {
      this.moveBlock('n', 1)
    }, this.duration)
    this.blockInfo = {
      type: next,
      direction: 0,
      n: 0,
      m: 3,
    }
    this.movingBlock = { ...this.blockInfo }
    this.renderBlock()
    this.checkNextBlock('start')

    this.makeNextBlock()
    this.renderNextBlock()
  }

  renderBlock() {
    const { type, direction, n, m } = this.movingBlock
    const temp = document.querySelectorAll('.moving')
    temp.forEach((x) => {
      x.classList.remove(type, 'moving')
    })

    Blocks[type][direction].some((block) => {
      const x = block[0] + n
      const y = block[1] + m
      const target = this.stage.childNodes[x]
        ? this.stage.childNodes[x].childNodes[y]
        : null
      target.classList.add(type, 'moving')
    })

    this.blockInfo.n = n
    this.blockInfo.m = m
    this.blockInfo.direction = direction
  }

  renderHoldBlock() {
    const hold = document.querySelector('.hold-block')
    if (!this.holdBlock) {
      hold.innerHTML = ''
      return
    }
    hold.innerHTML = `<img class='tetris' src="./img/${this.holdBlock}.png" alt=${this.holdBlock}"/>`
  }

  moveBlock(where, amount) {
    this.movingBlock[where] += amount
    this.checkNextBlock(where)
  }

  checkNextBlock(where = '') {
    const { type, direction, n, m } = this.movingBlock
    let isFinished = false
    Blocks[type][direction].some((block) => {
      const x = block[0] + n
      const y = block[1] + m
      if (where === 0 || where === 1 || where === 2 || where === 3) {
        this.moveAndTurn()
      } else if (y < 0 || y >= this.M) {
        this.movingBlock = { ...this.blockInfo }
        this.renderBlock()
        return true
      } else if (x >= this.N) {
        this.movingBlock = { ...this.blockInfo }
        isFinished = true
        this.finishBlock()
        return true
      } else {
        const target = this.stage.childNodes[x]
          ? this.stage.childNodes[x].childNodes[y]
          : null
        if (where === 'm') {
          if (target && target.classList.contains('finish')) {
            this.movingBlock = { ...this.blockInfo }
          }
        } else {
          if (target && target.classList.contains('finish')) {
            isFinished = true
            this.movingBlock = { ...this.blockInfo }
            if (where === 'start') {
              setTimeout(() => {
                this.finishGame()
              }, 0)
              return true
            } else {
              this.finishBlock()
              return true
            }
          }
        }
      }
    })

    if ((where === 'n' || where === 'm') && !isFinished) {
      this.renderBlock()
    }
  }

  moveAndTurn() {
    if (this.movingBlock.m < 0) {
      this.movingBlock.m = 0
    } else if (this.movingBlock.m + 3 >= this.M) {
      if (this.movingBlock.type === 'I') {
        this.movingBlock.m = 6
      } else {
        this.movingBlock.m = 7
      }
    }
    playChange()
    this.checkNextBlock('m')
  }

  finishBlock() {
    clearInterval(this.downInterval)
    const temp = document.querySelectorAll('.moving')
    temp.forEach((block) => {
      block.classList.remove('moving')
      block.classList.add('finish')
    })
    playDrop()
    this.canHold = true
    this.breakBlock()
  }

  breakBlock() {
    let s = 0
    const tr = this.stage.childNodes
    tr.forEach((line) => {
      let isBreak = true
      line.childNodes.forEach((td) => {
        if (!td.classList.contains('finish')) {
          isBreak = false
        }
      })
      if (isBreak) {
        playBreak()
        line.remove()
        const tr = document.createElement('tr')
        let ground = []
        for (let j = 0; j < this.M; j++) {
          ground.push('<td></td>')
        }
        tr.innerHTML = ground.join('')
        this.stage.prepend(tr)
        s++
      }
    })
    if (s == 1) {
      //one
    } else if (s == 2) {
      //double
      s *= 2
    } else if (s == 3) {
      //triple
      s *= 3
    } else if (s == 4) {
      //tetris
      s *= 4
    }
    this.score += s
    this.scoreScreen.innerText = this.score
    if (this.score >= 30 && !this.alertedThirty) {
      alert("30점을 달성했어!!\n\n'수뭉이와함께라면' 이 단어를 입력해줘!")
      this.alertedThirty = true
    }
    this.makeNewBlock()
  }

  changeDirection() {
    const direction = this.movingBlock.direction
    direction === 3
      ? (this.movingBlock.direction = 0)
      : (this.movingBlock.direction += 1)
    this.checkNextBlock(direction)
  }

  dropBlock() {
    clearInterval(this.downInterval)
    this.downInterval = setInterval(() => {
      this.moveBlock('n', 1)
    }, 8)
  }

  finishGame() {
    const popup = document.querySelector('.popup')
    popup.style.display = 'flex'
    clearInterval(this.downInterval)
    clearInterval(this.timeInterval)
  }

  reStart() {
    const popup = document.querySelector('.popup')
    popup.style.display = 'none'
    this.init()
  }
}
