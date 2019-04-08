import { LitElement } from 'lit-element'

export default class ResourceDataParser extends LitElement {
  _parseButtons(buttonList) {
    if (buttonList) {
      buttonList.forEach(function(button) {
        button.id = button.text + '-btn'
      })
    }

    return buttonList
  }

  _parseSearchFormFields(metaDataList) {
    const searchMetaList = metaDataList.filter(metaData => {
      return metaData.search_rank && metaData.search_rank > 0
    })

    this._sortMetaData(searchMetaList, 'search_rank')

    return searchMetaList.map(metaData => {
      const field = {
        name: metaData.name,
        label: metaData.term,
        type: metaData.search_editor,
        op: metaData.search_oper || 'eq'
      }

      metaData.search_editor = metaData.search_editor || 'text'
      metaData.search_editor = this._parseSearchFormField(field, metaData)
      field.default = metaData.search_init_val || null

      return field
    })
  }

  _sortMetaData(list, sortField) {
    list.sort((a, b) => {
      return a[sortField] > b[sortField] ? 1 : b[sortField] > a[sortField] ? -1 : 0
    })
  }

  _parseSearchFormField(field, metaData) {
    const editor = metaData.search_editor

    if ('code-combo' == editor) {
      field.codeName = metaData.ref_name
    } else if (
      editor.indexOf('resource-selector') >= 0 ||
      editor.indexOf('resource-format-selector') >= 0 ||
      editor.indexOf('resource-field') >= 0 ||
      editor.indexOf('resource-combo') >= 0 ||
      editor.indexOf('resource-code') >= 0
    ) {
      field.userData = {
        resourceType: metaData.ref_type,
        resourceName: metaData.ref_name,
        initialParams: metaData.ref_params,
        bindFields: metaData.ref_related,
        submitName: field.name
      }

      if (editor.indexOf('.') > 0) {
        var editorSplitArr = editor.split('.')
        field.type = editorSplitArr[0]
        field.userData.delegateColumn = editorSplitArr[1]
      } else {
        field.type = editor
      }

      if (field.type == 'resource-combo') {
        field.userData.delegateColumn = metaData.search_name ? metaData.search_name : 'id'
      }

      if (field.type == 'resource-format-selector') {
        field.userData.delegateColumn = metaData.search_name ? metaData.search_name : 'name'
      }
    } else if (editor == 'reference-query') {
      var refName = field.name.indexOf('_id') > 0 ? field.name.substr(0, field.name.indexOf('_id')) : field.name
      field.userData = {
        type: metaData.col_type,
        refName: refName,
        fieldName: metaData.search_name,
        searchName: refName + '.' + metaData.search_name
      }
    } else if (editor == 'number') {
      field.userData = { type: metaData.col_type }
      this._parseSearchValueRange(field, metaData.range_val, 'number')
    } else if ('date-from-to-picker' == editor || 'ranged-date-picker' == editor) {
      field.userData = { defaultRange: metaData.def_val, format: metaData.search_name }
      this._parseSearchValueRange(field, metaData.search_init_val, 'date')
    } else if ('date-picker' == editor) {
      if (metaData.search_name || metaData.search_init_val) {
        field.userData = {}
        if (metaData.search_name) field.userData.format = metaData.search_name
        if (metaData.search_init_val) field.userData.defValue = this._calcDate(metaData.search_init_val)
      }
    } else if ('time-picker' == editor || 'datetime-picker' == editor || 'ranged-datetime-picker' == editor) {
      if (metaData.search_name) {
        field.userData = { format: metaData.search_name }
      }

      if ('ranged-datetime-picker' == editor && metaData.search_init_val) {
        this._parseDatetimeInitValue(field, metaData.search_init_val)
      }
    }
  }

  _parseGridModel(metaDataList) {
    var gridModelMetaList = metaDataList.filter(function(metaData) {
      if (metaData.name == 'id' && !metaData.grid_rank) metaData.grid_rank = -10
      return metaData.grid_rank && metaData.grid_rank != 0
    })

    var selectColumns = ''

    var gridModel = gridModelMetaList.map(function(metaData) {
      var field = { fieldName: metaData.name }

      if (
        metaData.col_type == 'integer' ||
        metaData.col_type == 'int' ||
        metaData.col_type == 'long' ||
        metaData.col_type == 'double' ||
        metaData.col_type == 'float'
      ) {
        field.dataType = 'number'
      } else if (metaData.col_type == 'date' || metaData.col_type == 'time') {
        field.dataType = 'datetime'
        field.datetimeFormat = metaData.grid_format ? metaData.grid_format : 'yyyy-MM-dd'
      }

      var editor = metaData.grid_editor

      if (editor == 'rank') {
        field.rank = true
        field.increment = metaData.grid_format ? Number(metaData.grid_format) : 1
      }

      if (editor && editor.indexOf('resource-column') >= 0) {
        field.fieldName = field.fieldName.substr(0, field.fieldName.indexOf('_id'))
        field.dataType = 'object'
      }

      if (editor && editor.indexOf('resource-selector') >= 0) {
        field.fieldName = field.fieldName.substr(0, field.fieldName.indexOf('_id'))
        field.dataType = 'object'
      }

      if (editor && editor.indexOf('resource-format-selector') >= 0) {
        if (field.fieldName.indexOf('_id') >= 0) {
          field.fieldName = field.fieldName.substr(0, field.fieldName.indexOf('_id'))
        }
      }

      if (editor && editor.indexOf('file-selector') >= 0) {
        field.fieldName = field.fieldName.substr(0, field.fieldName.indexOf('_id'))
        field.dataType = 'object'
      }

      if (field.dataType != 'object' && metaData.def_val) {
        field.defaultValue = field.dataType == 'number' ? Number(metaData.def_val) : metaData.def_val
      }

      if (!metaData.virtual_field || metaData.virtual_field == false) {
        selectColumns += field.fieldName + ','
      }

      return field
    })

    if (selectColumns.length > 2) {
      this.selectFields = selectColumns.substr(0, selectColumns.length - 1)
    }

    return gridModel
  }
}
