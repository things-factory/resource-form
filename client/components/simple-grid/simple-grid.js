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
      /* 설명. 컬럼 모델 마지막에 'auto' 템플릿을 추가하여, 자투리 영역을 꽉 채워서 표시한다. */
      let gridTemplateColumns = this.columns
        .map((column, i, arr) => `${column.gridWidth}px`)
        .concat(['auto'])
        .join(' ')

      this.style.setProperty('--grid-template-columns', gridTemplateColumns)
    }
  }

  render() {
    var columns = this.columns
    var data = (this.data && this.data.items) || []
    var total = (this.data && this.data.total) || 0
    var limit = this.limit || 50
    var page = this.page || 1

    return html`
      <simple-grid-header .columns=${columns}></simple-grid-header>
      <simple-grid-body .columns=${columns} .data=${data}></simple-grid-body>
      <simple-grid-footer .data=${data} .total=${total} .limit=${limit} .page=${page}></simple-grid-footer>
    `
  }
}

customElements.define('simple-grid', SimpleGrid)
