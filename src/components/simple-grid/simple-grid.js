import { LitElement, html, css } from 'lit-element'
import { ScrollbarStyles } from '@things-factory/shell'

import './simple-grid-header'
import './simple-grid-body'
import './simple-grid-footer'

class SimpleGrid extends LitElement {
  constructor() {
    super()

    this.columns = []
    this.data = []
  }

  static get properties() {
    return {
      columns: Array,
      data: Array,
      limit: Number,
      page: Number
    }
  }

  static get styles() {
    return [
      ScrollbarStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;

          overflow: hidden;

          line-height: var(--grid-header-height, 32px);
        }

        simple-grid-body {
          flex: 1;
        }
      `
    ]
  }

  get body() {
    return this.shadowRoot.querySelector('simple-grid-body')
  }

  get header() {
    return this.shadowRoot.querySelector('simple-grid-header')
  }

  firstUpdated() {
    this.header.addEventListener('scroll', e => {
      if (this.body.scrollLeft !== this.header.scrollLeft) {
        this.body.scrollLeft = this.header.scrollLeft
      }
    })

    this.body.addEventListener('scroll', e => {
      if (this.body.scrollLeft !== this.header.scrollLeft) {
        this.header.scrollLeft = this.body.scrollLeft
      }
    })
  }

  updated(changes) {
    if (changes.has('columns')) {
      let gridTemplateColumns = this.columns
        .filter(column => column.grid_width)
        .map(column => `${column.grid_width}px`)
        .join(' ')

      this.style.setProperty('--grid-template-columns', gridTemplateColumns)
    }
  }

  render() {
    var columns = this.columns.filter(column => column.grid_width)

    return html`
      <simple-grid-header .columns=${columns}></simple-grid-header>
      <simple-grid-body .columns=${columns} .data=${this.data && this.data.items}></simple-grid-body>
      <simple-grid-footer
        .data=${this.data && this.data.items}
        .total=${this.data && this.data.total}
        .limit=${this.limit || 50}
        .page=${this.page || 1}
        @page-changed=${e => {
          this.page = e.detail
        }}
        @limit-changed=${e => {
          this.limit = e.detail
        }}
      ></simple-grid-footer>
    `
  }
}

customElements.define('simple-grid', SimpleGrid)
