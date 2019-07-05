// import '@things-factory/component-ui/component/form/form-master'
import '@things-factory/component-ui/component/form/search-form'
import '@things-factory/component-ui/component/infinite-scroll/infinite-scroll'
import '@things-factory/component-ui/component/popup/pop-up'
import { client, PageView, PullToRefreshStyles, ScrollbarStyles, store, gqlBuilder } from '@things-factory/shell'
import gql from 'graphql-tag'
import { css, html } from 'lit-element'
import PullToRefresh from 'pulltorefreshjs'
import { connect } from 'pwa-helpers/connect-mixin.js'
import '../components/simple-grid/simple-grid'
import '../components/simple-list/simple-list'

class ResourceUI extends connect(store)(PageView) {
  static get styles() {
    return [
      ScrollbarStyles,
      PullToRefreshStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;

          overflow: hidden;
        }

        infinite-scroll {
          flex: 1;

          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        simple-grid,
        simple-list {
          flex: 1;
          overflow-y: auto;
        }
      `
    ]
  }

  static get properties() {
    return {
      width: String,
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
        <search-form
          id="search-form"
          .fields="${this.searchFields}"
          initFocus="description"
          @submit="${this._searchData}"
          @load="${this._onFormLoad}"
        ></search-form>
      </header>

      ${this.width == 'WIDE'
        ? html`
            <simple-grid
              pulltorefresh
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
                pulltorefresh
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
    this.resourceUrl = this._underToCamel(this.menuMeta.resourceUrl)
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
      if (c.refType === 'Entity' || c.refType === 'Menu') {
        fields.push(`${this._underToCamel(c.name).replace('Id', '')} { id name }`)
      } else {
        fields.push(this._underToCamel(c.name))
      }
    })
    fields = fields.join()
    const queryStr = `
    query {
      ${this.resourceUrl} (
        ${gqlBuilder.buildArgs({
          filters: this._parseSearchConditions(),
          pagination: this._parsePagination(),
          sortings: this._parseSortings()
        })}
      ) {
        items {
          ${fields}
        }
        total
      }
    }
  `

    return queryStr
  }

  _underToCamel(str) {
    if (str.indexOf('_') > 0) {
      const strArr = str.split('_')
      str = strArr
        .map((str, idx) => {
          if (idx > 0) {
            str = str.replace(str[0], str[0].toUpperCase())
          }

          return str
        })
        .join('')
    }

    return str
  }

  _parseSearchConditions() {
    const conditions = []
    this.searchForm.getFields().forEach(field => {
      if (field.value) {
        conditions.push({
          name: field.name,
          operator: field.getAttribute('searchOper'),
          value: field.value
        })
      }
    })

    return conditions
  }

  _parsePagination() {
    return {
      skip: this.limit * (this.page - 1),
      take: this.limit
    }
  }

  _parseSortings() {
    const sortings = []
    if (this.sortingFields && this.sortingFields.length > 0) {
      this.sortingFields.map(field => {
        sortings.push({
          name: field.name,
          desc: field.reverseSort ? field.reverseSort : false
        })
      })
    }

    return sortings
  }

  stateChanged(state) {
    this.width = state.layout.width
    this.baseUrl = state.app.baseUrl
    this.resourceId = state.route.resourceId
  }

  updated(changed) {
    if (this._formLoaded) {
      if (changed.has('limit') || changed.has('page') || changed.has('sortingFields')) {
        this._searchData()
      }
    }
  }

  async activated(active) {
    if (active) {
      this.data = []

      await this._getResourceData()
      this.updateContext()
    }

    if (active) {
      await this.updateComplete
      /*
       * 첫번째 active 시에는 element가 생성되어있지 않으므로,
       * 꼭 updateComplete를 기다린 후에 mainElement설정을 해야한다.
       */
      this._ptr = PullToRefresh.init({
        mainElement: this.shadowRoot.querySelector('[pulltorefresh]'),
        distIgnore: 30,
        instructionsPullToRefresh: 'Pull down to refresh',
        instructionsRefreshing: 'Refreshing',
        instructionsReleaseToRefresh: 'Release to refresh',
        onRefresh: async () => {
          this._getResourceData()
          this.updateContext()
        }
      })
    } else {
      this._ptr && this._ptr.destroy()
      delete this._ptr
    }
  }

  _onFormLoad() {
    this._formLoaded = true
    this._searchData()
  }
}

window.customElements.define('resource-ui', ResourceUI)
