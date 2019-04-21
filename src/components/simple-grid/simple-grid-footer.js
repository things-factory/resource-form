import { LitElement, html, css } from 'lit-element'

import '@material/mwc-icon/mwc-icon'

class SimpleGridFooter extends LitElement {
  constructor() {
    super()

    this.data = []
    this.total = 0
    this.page = 1
    this.limit = 50
  }

  static get properties() {
    return {
      data: Array,
      total: Number,
      page: Number,
      limit: Number
    }
  }

  static get styles() {
    return [
      css`
        :host {
          display: flex;
          flex-direction: row;

          overflow: hidden;

          font-size: 0.8em;
          line-height: var(--grid-footer-height, 24px);
        }

        :host * {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;

          text-align: center;

          background-color: var(--grid-footer-background-color, gray);
          color: var(--grid-footer-color, white);
        }

        .filler {
          flex: 1;
        }

        mwc-icon {
          font-size: 1.5em;
          vertical-align: middle;
        }

        .limit a {
          color: lightgray;
        }

        .limit a[selected] {
          color: white;
          font-weight: bold;
        }

        a[inactive] * {
          color: lightgray;
        }
      `
    ]
  }

  _gotoPage(page) {
    if (page > Math.ceil(this.total / this.limit) || page < 0) {
      return
    }
    this.dispatchEvent(new CustomEvent('page-changed', { bubbles: true, composed: true, detail: page }))
  }

  _changeLimit(limit) {
    this.dispatchEvent(new CustomEvent('limit-changed', { bubbles: true, composed: true, detail: limit }))
  }

  render() {
    var data = this.data || []
    var begin = this.limit * (this.page - 1) + 1
    var end = begin + data.length - 1
    var totalPage = Math.ceil(this.total / this.limit)

    return html`
      <a ?inactive=${this.page <= 1} @click=${e => this._gotoPage(1)}><mwc-icon>skip_previous</mwc-icon></a>
      <a ?inactive=${this.page <= 1} @click=${e => this._gotoPage(this.page - 1)}
        ><mwc-icon>navigate_before</mwc-icon></a
      >
      <span>page ${this.page}&nbsp;/&nbsp;${totalPage}</span>
      <a ?inactive=${this.page >= totalPage} @click=${e => this._gotoPage(this.page + 1)}
        ><mwc-icon>navigate_next</mwc-icon></a
      >
      <a ?inactive=${this.page >= totalPage} @click=${e => this._gotoPage(totalPage)}><mwc-icon>skip_next</mwc-icon></a>

      <span class="filler"></span>

      <span class="limit">
        <a ?selected=${this.limit == 20} @click=${e => this._changeLimit(20)}>20</a>
        <a ?selected=${this.limit == 30} @click=${e => this._changeLimit(30)}>30</a>
        <a ?selected=${this.limit == 50} @click=${e => this._changeLimit(50)}>50</a>
        <a ?selected=${this.limit == 100} @click=${e => this._changeLimit(100)}>100</a>
        items
      </span>
      <span>&nbsp;</span>
      <span>${begin} - ${end}</span>
      <span>&nbsp;/&nbsp;</span>
      <span>total ${this.total || 0} records.</span>
    `
  }
}

customElements.define('simple-grid-footer', SimpleGridFooter)
