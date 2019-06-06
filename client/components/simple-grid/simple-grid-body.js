import { LitElement, html, css } from 'lit-element'

const KEY_LEFT = 37
const KEY_UP = 38
const KEY_RIGHT = 39
const KEY_DOWN = 40
const KEY_ENTER = 13
const KEY_TAP = 9
const KEY_BACKSPACE = 8

function calcScrollPos(parent, child) {
  var { top: ct, left: cl, height: ch, width: cw } = child.getBoundingClientRect()
  var { top: pt, left: pl, height: ph, width: pw } = parent.getBoundingClientRect()
  var { scrollLeft, scrollTop } = parent
  var scrollbarWidth = parent.clientWidth - parent.offsetWidth
  var scrollbarHeight = parent.clientHeight - parent.offsetHeight

  return {
    left:
      cl < pl
        ? scrollLeft - (pl - cl)
        : cl + cw > pl + pw
        ? scrollLeft - (pl + pw - (cl + cw)) - scrollbarWidth
        : undefined,
    top:
      ct < pt
        ? scrollTop - (pt - ct)
        : ct + ch > pt + ph
        ? scrollTop - (pt + ph - (ct + ch)) - scrollbarHeight
        : undefined
  }
}

class SimpleGridBody extends LitElement {
  constructor() {
    super()

    this.columns = []
    this.data = []
    this.focused = {}
  }

  static get properties() {
    return {
      columns: Array,
      data: Array,
      focused: Object
    }
  }

  static get styles() {
    return [
      css`
        :host {
          display: grid;
          grid-template-columns: var(--grid-template-columns);
          grid-auto-rows: var(--grid-record-height, 32px);

          overflow: auto;
          outline: none;
        }

        span {
          white-space: nowrap;
          overflow: hidden;
          background-color: var(--grid-record-background-color, white);
          padding: 7px 5px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);

          box-sizing: border-box;

          font-size: var(--grid-record-wide-fontsize);
          text-overflow: ellipsis;
        }

        span[odd] {
          background-color: var(--grid-record-odd-background-color, #eee);
        }

        span[focused] {
          border: 1px dotted rgba(0, 0, 0, 0.5);
        }
      `
    ]
  }

  render() {
    var data = this.data || []
    var { row: focusedRow, column: focusedColumn } = this.focused
    var columns = this.columns.filter(column => Number(column.gridWidth))

    return html`
      ${data.map(
        (record, idxRow) => html`
          ${columns.map(
            (column, idxColumn) =>
              html`
                <span
                  row=${idxRow}
                  column=${idxColumn}
                  ?odd=${idxRow % 2}
                  ?focused=${idxRow === focusedRow && idxColumn === focusedColumn}
                  >${record[column.name]}</span
                >
              `
          )}
          <span ?odd=${idxRow % 2}></span>
        `
      )}
    `
  }

  firstUpdated() {
    this.setAttribute('tabindex', '-1')

    this.addEventListener('focusout', e => {
      if (this._focusedListener) {
        window.removeEventListener('keydown', this._focusedListener)
        delete this._focusedListener
        this.focused = {}
      }
    })

    this.addEventListener('focusin', e => {
      if (!this._focusedListener) {
        this._focusedListener = (async e => {
          // arrow-key
          var keyCode = e.keyCode
          var { row, column } = this.focused
          var maxrow = this.data.length - 1
          var maxcolumn = this.columns.filter(column => Number(column.gridWidth)).length - 1

          switch (keyCode) {
            case KEY_UP:
              row = Math.max(0, row - 1)
              break
            case KEY_DOWN:
            case KEY_ENTER:
              row = Math.min(maxrow, row + 1)
              break
            case KEY_LEFT:
            case KEY_BACKSPACE:
              column = Math.max(0, column - 1)
              break
            case KEY_RIGHT:
            case KEY_TAP:
              column = Math.min(maxcolumn, column + 1)
              break

            default:
              return
          }

          this.focused = { row, column }

          /* arrow key에 의한 scrollbar의 자동 움직임을 하지 못하도록 한다. */
          e.preventDefault()

          await this.updateComplete

          this.showFocused()
        }).bind(this)

        window.addEventListener('keydown', this._focusedListener)
      }
    })

    this.shadowRoot.addEventListener('click', async e => {
      let target = e.target
      let row = Number(target.getAttribute('row'))
      let column = Number(target.getAttribute('column'))

      this.focused = {
        row,
        column
      }

      await this.updateComplete

      this.showFocused()
    })
  }

  showFocused() {
    let focused = this.shadowRoot.querySelector('[focused]')

    if (!focused) {
      return
    }

    let { top, left } = calcScrollPos(this, focused)

    if (top !== undefined) {
      this.scrollTop = top
    }
    if (left !== undefined) {
      this.scrollLeft = left
    }
  }
}

customElements.define('simple-grid-body', SimpleGridBody)
