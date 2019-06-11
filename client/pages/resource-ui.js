import { i18next } from '@things-factory/i18n-base'
import { client, PageView, ScrollbarStyles, store } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import '../components/simple-grid/simple-grid'
import '../components/simple-list/simple-list'

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
      _columns: Array,
      data: Array
    }
  }

  get context() {
    return {
      title: this.menuTitle,
      exportable: true,
      importable: true,
      printable: true,
      actions: (this.buttons || []).map(button => {
        return {
          title: button.text,
          action: function() {
            console.log(button.text)
          }
        }
      })
    }
  }

  constructor() {
    super()
    this.page = 1
    this.limit = 50
  }

  render() {
    return html`
      <header>${this.renderSearchForm()}</header>

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
              @column-changed=${e => {
                this._columns[e.detail.idx] = e.detail.column
                this._columns = [...this._columns]
              }}
            >
            </simple-grid>
          `
        : html`
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
          `}
    `
  }

  renderSearchForm() {
    return html`
      <form
        id="search-form"
        @submit="${e => {
          e.preventDefault()
          this._searchData()
        }}"
      >
        ${(this.searchFormFields || []).map(searchFormField => {
          return html`
            <input
              id="${searchFormField.name}"
              placeholder="${i18next.t(searchFormField.term)}"
              search-oper="${searchFormField.searchOper || 'eq'}"
            />
          `
        })}

        <button>Search</button>
      </form>
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
    this.menuTitle = i18next.t(this.menuMeta.name)
    this.resourceUrl = this.menuMeta.resourceUrl
    this._parseResourceMeta(this.menuMeta)
  }

  _parseResourceMeta(metaData) {
    this._columns = this._sortBy('gridRank', metaData.columns)

    // 1. Buttons
    this.buttons = metaData.buttons
    // 2. Parse Sort Fields - search form
    // this.sortFields = this._parseSortFields(metaData.columns)
    // 3. Parse Select Fields - search form
    // this.selectFields = this._parseSelectFields(metaData.columns)
    // 4. Parse Search Form Fields - search form
    this.searchFormFields = metaData.columns.filter(column => column.searchRank && column.searchRank > 0)

    this.sortingFields = metaData.columns
      .filter(column => column.sortRank && column.sortRank > 0)
      .sort((a, b) => {
        return a.sortRank > b.sortRank ? 1 : -1
      })
    // 5. Parse Resource Form Fields - detail form
    // this.resourceFormFields = this._parseResourceFormFields(metaData.columns)
    // 6. Parse Grid Models - grid form
    // this.gridModel = this._parseGridModel(metaData.columns)
    // 7. Parse Grid Columns - grid form
    // this.gridColumns = this._parseGridColumns(metaData.columns)
    this.requestUpdate()
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

  _handleBtnClick(event) {
    this.dispatchEvent(
      new CustomEvent(`${event.currentTarget.id}-click`, {
        cancelable: true
      })
    )
  }

  _handleFormSubmit(event) {
    event.preventDefault()
    this._searchData()
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
    this.searchFormFields.map((field, index) => {
      const searchInput = this.searchForm.querySelector(`#${field.name}`)
      if (searchInput.value) {
        if (index === 0) {
          conditions = `{
            name: "${searchInput.id}",
            operator: "${searchInput.getAttribute('search-oper')}",
            value: "${searchInput.value}"
          }`
        } else {
          conditions = `${conditions}, {
            name: "${searchInput.id}",
            operator: "${searchInput.getAttribute('search-oper')}",
            value: "${searchInput.value}"
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
        this.searchForm.reset()

        await this._getResourceData()
        this.updateContext()
        this._searchData()
      }
    }

    if (this.active) {
      if (changed.has('_columns')) {
        this.sortingFields = this._columns
          .filter(column => Number(column.sortRank) > 0)
          .sort((a, b) => {
            return a.sortRank > b.sortRank ? 1 : -1
          })
      }

      if (changed.has('limit') || changed.has('page') || changed.has('_columns')) {
        this._searchData()
      }
    }
  }
}

window.customElements.define('resource-ui', ResourceUI)
