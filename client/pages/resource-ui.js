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
      data: Object,
      page: Number,
      limit: Number,
      _columns: Array
    }
  }

  get context() {
    return {
      title: this.menuTitle,
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
      <form id="search-form" @submit="${this._handleFormSubmit}">
        ${(this.searchFormFields || []).map(searchFormField => {
          return html`
            <input
              name="${searchFormField.name}"
              placeholder="${i18next.t(searchFormField.term)}"
              op="${searchFormField.op}"
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
              searchEditor
              searchOperator
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
    this.searchFormFields = metaData.columns.filter(column => {
      return column.searchRank && column.searchRank > 0
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
    const fields = Array.from(this.searchForm.children)
    const searchConditions = []
    fields.forEach(f => {
      if (f.name && f.value) {
        searchConditions.push({
          name: f.name,
          value: f.value,
          operator: f.getAttribute('op')
        })
      }
    })

    const searchParams = new URLSearchParams()
    searchParams.append('query', JSON.stringify(searchConditions))
    searchParams.append('page', this.page || 1)
    searchParams.append('limit', this.limit || 50)

    const response = await client.query({
      query: gql`
        ${this._queryBuilder()}
      `
    })

    this.data = response.data[this.resourceUrl]

    // const response = await client.query({
    //   query: gql`
    //     query {
    //       menus: userMenus {
    //         id
    //         name
    //         children {
    //           id
    //           name
    //           routingType
    //           idField
    //           resourceName
    //         }
    //       }
    //     }
    //   `
    // })

    // query {
    //   companies {
    //     id
    //     name
    //     description
    //     countryCode
    //     address
    //     brn
    //     bizplaces {
    //       id
    //       name
    //     }
    //     state
    //   }
    // }

    // const res = await fetch(`${this.baseUrl}/${this.resourceUrl}?${searchParams}`, {
    //   credentials: 'include'
    // })
    // if (res.ok) {
    //   let data = await res.json()
    //   if (data) {
    //     this.data = data
    //   }
    // }
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

    return `
      query {
        ${this.resourceUrl} {
          ${fields}
        }
      }
    `
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

    if (changed.has('limit') || changed.has('page')) {
      this._searchData()
    }
  }
}

window.customElements.define('resource-ui', ResourceUI)
