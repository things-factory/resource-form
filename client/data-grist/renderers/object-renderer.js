import { html } from 'lit-html'

export const ObjectRenderer = (column, record, rowIndex) => {
  var value = record[column.name]

  if (!value) {
    return ''
  }

  var { nameField = 'name', descriptionField = 'description' } = column.record.options || {}

  return html`
    ${value[nameField] || ''}(${value[descriptionField] || ''})
  `
}
