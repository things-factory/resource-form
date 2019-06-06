import { LitElement, html, css } from 'lit-element'
import { i18next } from '@things-factory/i18n-base'

class SimpleGridHeader extends LitElement {
  constructor() {
    super()

    this.columns = []
  }

  static get properties() {
    return {
      columns: Array
    }
  }

  static get styles() {
    return [
      css`
        :host {
          display: grid;
          grid-template-columns: var(--grid-template-columns);

          overflow: hidden;
        }

        div {
          display: flex;

          white-space: nowrap;
          overflow: hidden;
          background-color: var(--grid-header-background-color, gray);
          border: 1px solid var(--grid-header-border-color);
          border-width: 1px 0;
          padding: 5px 0;

          text-overflow: ellipsis;
          text-align: center;
          font-size: var(--grid-header-fontsize);
          color: var(--grid-header-color, white);
        }

        span {
          white-space: nowrap;
          overflow: hidden;

          text-align: center;
        }

        span[title] {
          flex: 1;
          text-overflow: ellipsis;
          font-size: var(--grid-header-fontsize);
          color: var(--grid-header-color, white);
        }

        span[sorter] {
          padding: 0;
          border: 0;
        }

        span[splitter] {
          cursor: col-resize;
        }
      `
    ]
  }

  _onWheelEvent(e) {
    var delta = Math.max(-1, Math.min(1, e.deltaY || 0))
    this.scrollLeft = Math.max(0, this.scrollLeft - delta * 40)

    e.preventDefault()
  }

  firstUpdated() {
    this.addEventListener('wheel', this._onWheelEvent.bind(this), false)
  }

  render() {
    var sorters = this.columns
      .filter(column => column.sortRank && column.sortRank > 0)
      .sort((a, b) => {
        return a.sortRank > b.sortRank ? 1 : -1
      })

    var columns = this.columns

    return html`
      ${columns.map(
        (column, idx) =>
          html`
            <div>
              <span title @click=${e => this._changeSort(idx)}>
                ${i18next.t(column.term)}
              </span>
              <span sorter @click=${e => this._changeSort(idx)}>
                ${this._renderSortHeader(column, sorters)}
              </span>
              <span splitter>&nbsp; </span>
            </div>
          `
      )}

      <div></div>
    `
  }

  _renderSortHeader(column, sorters) {
    if (!column.sortRank) {
      return html`
        &nbsp;&nbsp;
      `
    }

    if (sorters.length > 1) {
      var rank = sorters.indexOf(column) + 1
      return column.reverseSort
        ? html`
            &#9650;<sub>${rank}</sub>
          `
        : html`
            &#9660;<sub>${rank}</sub>
          `
    } else {
      return column.reverseSort
        ? html`
            &#9650;
          `
        : html`
            &#9660;
          `
    }
  }

  _changeSort(idx) {
    var columns = this.columns

    var column = {
      ...columns[idx]
    }
    var maxRank = 0

    columns.forEach(column => {
      if (column.sortRank > maxRank) {
        maxRank = column.sortRank
      }
    })

    if (!column.sortRank) {
      column.sortRank = maxRank + 1
      column.reverseSort = false
    } else {
      if (column.reverseSort) {
        column.sortRank = 0
      } else {
        column.reverseSort = true
      }
    }

    this.dispatchEvent(
      new CustomEvent('sort-changed', {
        bubbles: true,
        composed: true,
        detail: {
          idx,
          column
        }
      })
    )
  }
}

customElements.define('simple-grid-header', SimpleGridHeader)
