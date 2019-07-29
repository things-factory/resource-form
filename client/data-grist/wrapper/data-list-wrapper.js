import { LitElement, html, css } from 'lit-element'

import '@things-factory/grist-ui'

const GUTTERS = [
  {
    type: 'gutter',
    name: 'dirty'
  },
  {
    type: 'gutter',
    name: 'sequence'
  },
  {
    type: 'gutter',
    name: 'row-selector',
    multiple: true
  },
  {
    type: 'gutter',
    name: 'button',
    icon: 'edit'
  }
]

const PAGINATION = {
  pages: [20, 30, 50, 100, 200]
}

/**
 * @class DataListWrapper
 *
 * resource entity의 configuration을 의 불일치를 data-grist의 configuration으로 치환하는 클래스임.
 */
export class DataListWrapper extends LitElement {
  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: row;
      }

      data-grist {
        flex: 1;
      }
    `
  }

  static get properties() {
    return {
      mode: String,
      columns: Array,
      _config: Object,
      fetchHandler: Object,
      fetchOptions: Object,
      editHandler: Object
    }
  }

  render() {
    return html`
      <data-grist
        .mode=${this.mode}
        .config=${this._config}
        .editHandler=${this.editHandler}
        .fetchHandler=${this.fetchHandler}
        .fetchOptions=${this.fetchOptions}
      >
      </data-grist>
    `
  }

  get dataGrist() {
    return this.shadowRoot.querySelector('data-grist')
  }

  fetch() {
    this.dataGrist.fetch()
  }

  get data() {
    return this.dataGrist._data
  }

  buildConfig() {
    var columns = this.columns.map(column => {
      let { name, gridWidth: width, gridAlign: align, term: header } = column
      let refType = column.refType && column.refType.toLowerCase()
      let type = column.colType
      if ((refType && refType === 'entity') || refType === 'menu') {
        type = 'object'
      }

      return {
        name,
        type,
        hidden: false,
        width,
        resizable: true,
        sortable: true,
        header,
        // header: {
        //   renderer: headerRenderer,
        //   decorator: ''
        // },
        record: {
          // renderer: '',
          // editor: '',
          // decorator: '',
          align
        }
      }
    })

    var sorters = this.columns
      .filter(column => column.sortRank)
      .map(column => {
        return {
          name: column.name,
          descending: !!column.reverseSort
        }
      })

    return {
      columns: [...GUTTERS, ...columns],
      pagination: {
        ...PAGINATION,
        infinite: false
      },
      rows: {
        appendable: true,
        insertable: true,
        selectable: {
          multiple: true
        }
      },
      sorters
    }
  }

  updated(changes) {
    if (changes.has('columns')) {
      this._config = this.buildConfig()
    }
  }
}

customElements.define('data-list-wrapper', DataListWrapper)
