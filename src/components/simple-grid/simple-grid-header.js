import { LitElement, html, css } from 'lit-element'

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

          height: var(--grid-header-height, 32px);
        }

        span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;

          text-align: center;

          background-color: var(--grid-header-background-color, gray);
          color: var(--grid-header-color, white);
        }
      `
    ]
  }

  _onWheelEvent(e) {
    var delta = Math.max(-1, Math.min(1, e.wheelDelta || -e.detail))
    var left = Math.max(0, this.scrollLeft - delta * 40)
    this.scrollLeft = left

    e.preventDefault()
  }

  firstUpdated() {
    this.addEventListener('mousewheel', this._onWheelEvent.bind(this), false)
  }

  render() {
    return html`
      ${this.columns.map(
        column =>
          html`
            <span>${column.term}</span>
          `
      )}
    `
  }
}

customElements.define('simple-grid-header', SimpleGridHeader)
