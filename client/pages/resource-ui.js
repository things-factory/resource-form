import { client, PageView, ScrollbarStyles, store } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import '../components/simple-grid/simple-grid'
import '../components/simple-list/simple-list'
import '@things-factory/component-ui/component/popup/pop-up'
import '@things-factory/component-ui/component/form/form-master'
import '@things-factory/component-ui/component/infinite-scroll/infinite-scroll'

class ResourceUI extends connect(store)(PageView) {
  static get styles() {
    return [
      ScrollbarStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;

          overflow: hidden;
        }

        simple-grid,
        simple-list {
          flex: 1;
        }
      `
    ]
  }

  static get properties() {
    return {
      layout: String,
      resourceForm: String,
      resourceId: String,
      baseUrl: String,
      page: Number,
      limit: Number,
      sortingFields: Array,
      _columns: Array,
      data: Array,
      importedData: Array,
      _formLoaded: Boolean,
      pageProp: String
    }
  }

  get context() {
    return {
      title: this.menuTitle,
      exportable: {
        name: this.menuTitle,
        data: this._exportableData.bind(this)
      },
      importable: {
        handler: this.importHandler.bind(this)
      },
      printable: {
        accept: ['paper', 'preview'],
        content: () => {
          return this
        }
      },
      actions: (this.buttons || []).map(button => {
        return {
          title: button.text,
          action: button.action
        }
      })
    }
  }

  constructor() {
    super()
    this.pageProp = 'page'
    this.page = 1
    this.limit = 10
  }

  importHandler(records) {
    this.importedData = { items: records }
    this.shadowRoot.querySelector('pop-up').open()
  }

  _exportableData() {
    var items = this.data && this.data.items
    var columns = this._columns || []

    if (!items || !(items instanceof Array) || items.length == 0) {
      items = [{}]
    }

    return items.map(item => {
      return columns.reduce((record, column) => {
        record[column.term || column.name] = item[column.name]
        return record
      }, {})
    })
  }

  render() {
    return html`
      <pop-up .title="${this.menuTitle}">
        <simple-grid
          .columns=${this._columns}
          .data=${this.importedData}
          .limit=${this.limit}
          .page=${this.page}
          @page-changed=${e => {
            this.page = e.detail
          }}
          @limit-changed=${e => {
            this.limit = e.detail
          }}
          @sort-changed=${e => {
            this.sortingFields = e.detail
          }}
          @column-length-changed=${e => {
            this._columns[e.detail.idx] = e.detail.column
            this._columns = [...this._columns]
          }}
        >
        </simple-grid>
      </pop-up>

      <header>
        <form-master
          id="search-form"
          .fields="${this.searchFields}"
          initFocus="description"
          @submit="${this._searchData}"
          @load="${this._onFormLoad}"
        ></form-master>
      </header>

      ${this.layout == 'WIDE'
        ? html`
            <simple-grid
              .columns=${this._columns}
              .data=${this.data}
              .limit=${this.limit}
              .page=${this.page}
              @page-changed=${e => {
                this.page = e.detail
              }}
              @limit-changed=${e => {
                this.limit = e.detail
              }}
              @sort-changed=${e => {
                this.sortingFields = e.detail
              }}
              @column-length-changed=${e => {
                this._columns[e.detail.idx] = e.detail.column
                this._columns = [...this._columns]
              }}
            >
            </simple-grid>
          `
        : html`
            <infinite-scroll .pageProp="${this.pageProp}">
              <simple-list
                .columns=${this._columns}
                .data=${this.data}
                .limit=${this.limit}
                .page=${this.page}
                @page-changed=${e => {
                  this.page = e.detail
                }}
                @limit-changed=${e => {
                  this.limit = e.detail
                }}
              >
              </simple-list>
            </infinite-scroll>
          `}
    `
  }

  get searchForm() {
    return this.shadowRoot.querySelector('#search-form')
  }

  async _getResourceData() {
    const response = await client.query({
      query: gql`
        query {
          menu(id: "${this.resourceId}") {
            name,
            resourceUrl,
            buttons {
              text
            },
            columns {
              name
              term
              colType
              colSize
              nullable
              refType
              refName
              refUrl
              refRelated
              searchRank
              sortRank
              reverseSort
              searchEditor
              searchOper
              searchInitVal
              gridRank
              gridEditor
              gridFormat
              gridValidator
              gridWidth
              gridAlign
              formEditor
              formValidator
              formFormat
              defVal
              rangeVal
              ignoreOnSave
            }
          }
        }
      `
    })
    this.menuMeta = response.data.menu
    this.menuTitle = this.menuMeta.name
    this.resourceUrl = this.menuMeta.resourceUrl
    this._parseResourceMeta(this.menuMeta)
  }

  _parseResourceMeta(metaData) {
    this._columns = this._sortBy('gridRank', metaData.columns)
    // TODO: submit 테스트용도 서버에서 실행 로직을 전달 받을 수 있거나 resource-ui 가 직접 submit 가능 여부를 판단할 수 있도록 수정
    this.buttons = metaData.buttons.concat({ text: 'submit', action: this._searchData.bind(this) })

    this.searchFields = metaData.columns
      .filter(field => field.searchRank && field.searchRank > 0)
      .map(field => {
        return {
          name: field.name,
          type: field.searchEditor ? field.searchEditor : 'text',
          props: {
            min: field.rangeVal ? field.rangeVal.split(',')[0] : null,
            max: field.rangeVal ? field.rangeVal.split(',')[1] : null,
            searchOper: field.searchOper ? field.searchOper : 'eq',
            placeholder: field.term
          },
          value: field.searchInitVal
        }
      })

    this.sortingFields = metaData.columns
      .filter(column => column.sortRank && column.sortRank > 0)
      .sort((a, b) => {
        return a.sortRank > b.sortRank ? 1 : -1
      })
  }

  _sortBy(key, list) {
    list.sort((a, b) => {
      if (a[key] < b[key]) {
        return -1
      } else if (a[key] > b[key]) {
        return 1
      }
      return 0
    })

    return list
  }

  async _searchData() {
    const response = await client.query({
      query: gql`
        ${this._queryBuilder()}
      `
    })

    this.data = {
      items: response.data[this.resourceUrl].items,
      total: response.data[this.resourceUrl].total,
      page: this.page,
      limit: this.limit
    }
  }

  _queryBuilder() {
    let fields = []
    this._columns.forEach(c => {
      if (c.refType === 'Entity') {
        fields.push(`${c.name} { id name description }`)
      } else {
        fields.push(c.name)
      }
    })
    fields = fields.join()

    const queryStr = `
    query {
      ${
        this.resourceUrl
      } (filters: ${this._parseSearchConditions()}, pagination: ${this._parsePagination()}, sortings: ${this._parseSortings()}) {
        items {
          ${fields}
        }
        total
      }
    }
  `

    return queryStr
  }

  _parseSearchConditions() {
    let conditions = ''
    this.searchForm.getFields().forEach((field, index) => {
      if (field.value) {
        if (index === 0) {
          conditions = `{
            name: "${field.name}",
            operator: "${field.getAttribute('searchOper')}",
            value: "${field.value}"
          }`
        } else {
          conditions = `${conditions}, {
            name: "${field.id}",
            operator: "${field.getAttribute('searchOper')}",
            value: "${field.value}"
          }`
        }
      }
    })

    return `[${conditions}]`
  }

  _parsePagination() {
    let pagination = `
      skip: ${this.limit * (this.page - 1)},
      take: ${this.limit}
    `

    return `{${[pagination]}}`
  }

  _parseSortings() {
    let sortings = ''
    if (this.sortingFields && this.sortingFields.length > 0) {
      this.sortingFields.map((field, index) => {
        if (index === 0) {
          sortings = `{
            name: "${field.name}",
            desc: ${field.reverseSort ? field.reverseSort : false}
          }`
        } else {
          sortings = `${sortings}, {
            name: "${field.name}",
            desc: ${field.reverseSort ? field.reverseSort : false}
          }`
        }
      })
    }

    return `[${sortings}]`
  }

  stateChanged(state) {
    this.layout = state.layout.width
    this.baseUrl = state.app.baseUrl
    this.resourceId = state.route.resourceId
  }

  async updated(changed) {
    if (changed.has('active')) {
      /*
        page가 active 상태인 경우만, updated가 호출된다.
        따라서, 이 부분에는 active 상태가 false => true 로 된 경우에 처리할 작업을 수행한다.
      */
      if (this.active) {
        this.data = []

        await this._getResourceData()
        this.updateContext()
      }
    }

    if (this.active && this._formLoaded) {
      if (changed.has('limit') || changed.has('page') || changed.has('sortingFields')) {
        this._searchData()
      }
    }
  }

  _onFormLoad() {
    this._formLoaded = true
    this._searchData()
  }
}

window.customElements.define('resource-ui', ResourceUI)
