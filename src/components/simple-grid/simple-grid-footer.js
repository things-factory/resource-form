import { LitElement, html, css } from 'lit-element'

import '@material/mwc-icon/mwc-icon'

class SimpleGridFooter extends LitElement {
  constructor() {
    super()

    this.data = []
    this.total = 0
    this.page = 0
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

        span {
          height: var(--grid-footer-height, 24px);
        }

        mwc-icon {
          font-size: 1.5em;
          vertical-align: middle;
        }

        span.limit a {
          color: lightgray;
        }

        span.limit a[selected] {
          color: white;
          font-weight: bold;
        }

        .filler {
          flex: 1;
        }
      `
    ]
  }

  get totalPage() {}

  render() {
    var data = this.data || []
    var begin = data.length * this.page + 1
    var end = begin + data.length - 1

    return html`
      <a><mwc-icon>skip_previous</mwc-icon></a>
      <a><mwc-icon>navigate_before</mwc-icon></a>
      <span>page ${this.page + 1}&nbsp;/&nbsp;${Math.ceil(this.total / this.limit)}</span>
      <a><mwc-icon>navigate_next</mwc-icon></a>
      <a><mwc-icon>skip_next</mwc-icon></a>
      <span class="filler"></span>
      <span class="limit">
        <a ?selected=${this.limit == 20}>20</a>
        <a ?selected=${this.limit == 30}>30</a>
        <a ?selected=${this.limit == 50}>50</a>
        <a ?selected=${this.limit == 100}>100</a>
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
