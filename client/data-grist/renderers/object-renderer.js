import { html } from 'lit-html'

export const ObjectRenderer = (column, record, rowIndex) => {
  var { idField = 'id', nameField = 'name', descriptionField = 'description' } = column.record.options || {}

  var value = record[column.name]
  value = !value
    ? {
        [idField]: '',
        [nameField]: '',
        [descriptionField]: ''
      }
    : value

  return html`
    ${value[nameField]}(${value[descriptionField]})
  `
}
